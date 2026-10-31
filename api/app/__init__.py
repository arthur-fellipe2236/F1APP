import os

from flask import Flask, jsonify
from sqlalchemy import text

from .extensions import db, migrate
from .api.helpers import ApiError



def create_app(config_overrides=None):
    app = Flask(__name__)
    db_uri = os.environ.get("F1_DATABASE_URI", "sqlite:///f1.db")
    # Determine the effective database URI with proper precedence
    # 1. Override via config_overrides (SQLALCHEMY_DATABASE_URI)
    # 2. Environment variable F1_DATABASE_URI
    # 3. Default fallback
    if config_overrides and "SQLALCHEMY_DATABASE_URI" in config_overrides:
        db_uri = config_overrides["SQLALCHEMY_DATABASE_URI"]
    else:
        db_uri = os.environ.get("F1_DATABASE_URI", "sqlite:///f1.db")
    # --------------------------------------------------------------
    # Validate URI and enforce supported schemes / drivers
    # --------------------------------------------------------------
    from sqlalchemy.engine.url import make_url
    try:
        url = make_url(db_uri)
    except Exception as exc:
        raise RuntimeError(f"Invalid database URI '{db_uri}': {exc}") from exc
    # Only allow SQLite and PostgreSQL (with optional driver suffixes)
    allowed_schemes = {"sqlite", "postgresql"}
    if url.drivername.split("+")[0] not in allowed_schemes:
        raise RuntimeError(
            f"Unsupported database scheme '{url.drivername}'. Supported: sqlite, postgresql."
        )

    if url.drivername.startswith("postgresql"):
        import importlib

        supported_drivers = {
            "postgresql": "psycopg2",
            "postgresql+psycopg2": "psycopg2",
            "postgresql+psycopg": "psycopg",
        }

        driver = supported_drivers.get(url.drivername)
        if driver is None:
            raise RuntimeError(
                f"Unsupported PostgreSQL driver '{url.drivername}'. "
                "Supported: postgresql, postgresql+psycopg2, postgresql+psycopg."
            )

        try:
            importlib.import_module(driver)
        except ImportError as exc:
            raise RuntimeError(
                f"PostgreSQL URI detected but required driver ({driver}) is not installed."
            ) from exc
    # --------------------------------------------------------------
    # If the caller did not explicitly provide a SQLALCHEMY_DATABASE_URI,
    # ensure the SQLite path is writable (e.g., when using a relative path).
    # --------------------------------------------------------------
    if not (config_overrides and "SQLALCHEMY_DATABASE_URI" in config_overrides):
        from .serverless_db import ensure_writable_sqlite_uri
        db_uri = ensure_writable_sqlite_uri(db_uri)
        os.environ["F1_DATABASE_URI"] = db_uri

    app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    from .security import resolve_secret_key, init_security

    app.config["SECRET_KEY"] = resolve_secret_key(db_uri)
    app.json.sort_keys = False

    if config_overrides:
        app.config.update(config_overrides)

    from . import models  # noqa: F401  (registra tabelas no metadata)

    db.init_app(app)
    migrate.init_app(app, db)
    with app.app_context():
        if app.config.get("TESTING"):
            # In testing we create a fresh temporary database and seed it.
            db.create_all()
            from .seed import seed
            seed()
        else:
            # In non‑testing (production / dev) we do **not** create tables automatically.
            # This prevents Alembic from seeing pre‑existing tables and allows proper migrations.
            if not os.environ.get('NO_BACKGROUND_SYNC'):
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
