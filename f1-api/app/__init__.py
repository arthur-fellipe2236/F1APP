import os

from flask import Flask, jsonify

from .extensions import db, migrate
from .api.helpers import ApiError


def create_app(config_overrides=None):
    app = Flask(__name__)
    testing = bool(config_overrides and config_overrides.get("TESTING"))

    from .serverless_db import (
        ensure_writable_sqlite_uri,
        is_production_environment,
        normalize_database_uri,
        resolve_database_uri,
        validate_postgresql_uri,
    )

    if config_overrides and "SQLALCHEMY_DATABASE_URI" in config_overrides:
        raw_override = str(config_overrides["SQLALCHEMY_DATABASE_URI"] or "").strip()
        if not raw_override:
            raise RuntimeError("SQLALCHEMY_DATABASE_URI em config_overrides não pode ser vazia.")
        db_uri = normalize_database_uri(raw_override)
        if not db_uri.startswith("sqlite:"):
            db_uri = validate_postgresql_uri(db_uri)
        else:
            if is_production_environment() and not testing:
                raise RuntimeError(
                    "Configuração SQLite não é permitida em produção (VERCEL_ENV=production)."
                )
            db_uri = ensure_writable_sqlite_uri(db_uri)
    else:
        db_uri = resolve_database_uri(testing=testing)
        os.environ["F1_DATABASE_URI"] = db_uri

    app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    from .security import resolve_secret_key, init_security

    app.config["SECRET_KEY"] = resolve_secret_key(db_uri)
    app.json.sort_keys = False

    if config_overrides:
        app.config.update(config_overrides)
        app.config["SQLALCHEMY_DATABASE_URI"] = db_uri

    from . import models  # noqa: F401  (registra tabelas no metadata)

    db.init_app(app)
    migrate.init_app(app, db)
    with app.app_context():
        if db_uri.startswith("sqlite:") or os.environ.get("F1_CREATE_ALL_ON_INIT") == "1":
            db.create_all()

        if app.config.get("TESTING"):
            from .seed import seed

            seed()
        elif not os.environ.get("NO_BACKGROUND_SYNC"):
            from .sync import start_background_sync

            start_background_sync(app)

    from .api import register_api
    from .api.openapi import init_swagger

    init_security(app)
    register_api(app)
    init_swagger(app)
    register_error_handlers(app)

    return app


def register_error_handlers(app):
    from werkzeug.exceptions import HTTPException

    @app.errorhandler(ApiError)
    def handle_api_error(err):
        body = {"error": err.message}
        if err.details:
            body["details"] = err.details
        return jsonify(body), err.status_code

    @app.errorhandler(HTTPException)
    def handle_http_exception(err):
        return (
            jsonify({"error": err.description or err.name}),
            err.code,
        )
