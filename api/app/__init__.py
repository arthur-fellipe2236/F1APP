import os
import sys

from flask import Flask, jsonify
from sqlalchemy.engine.url import make_url

from .extensions import db, migrate
from .api.helpers import ApiError


def _resolve_migrations_dir() -> str:
    """Resolve o diretório oficial de migrations (`f1-api/migrations`)."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    candidate = os.path.join(base_dir, "migrations")
    if os.path.isdir(candidate):
        return candidate
    repo_candidate = os.path.join(os.path.dirname(base_dir), "f1-api", "migrations")
    if os.path.isdir(repo_candidate):
        return repo_candidate
    return candidate


def _validate_sqlalchemy_url_and_driver(db_uri: str) -> None:
    """Valida sintaxe SQLAlchemy, esquema suportado e driver instalado (D2)."""
    try:
        url = make_url(db_uri)
    except Exception as exc:
        raise RuntimeError(f"Invalid database URI '{db_uri}': {exc}") from exc

    scheme_base = url.drivername.split("+")[0]
    if scheme_base not in {"sqlite", "postgresql"}:
        raise RuntimeError(
            f"Unsupported database scheme '{url.drivername}'. Supported: sqlite, postgresql."
        )

    if scheme_base == "postgresql":
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
        _validate_sqlalchemy_url_and_driver(db_uri)
        if not db_uri.startswith("sqlite:"):
            if not db_uri.startswith("postgresql+psycopg://"):
                db_uri = validate_postgresql_uri(db_uri)
        else:
            if is_production_environment() and not testing:
                raise RuntimeError(
                    "Configuração SQLite não é permitida em produção (VERCEL_ENV=production)."
                )
            if not testing:
                db_uri = ensure_writable_sqlite_uri(db_uri)
    else:
        db_uri = resolve_database_uri(testing=testing)
        _validate_sqlalchemy_url_and_driver(db_uri)
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
    from . import cron_audit  # noqa: F401  (registra cron_execution_logs no metadata)
    from . import sync_lease  # noqa: F401  (registra cron_sync_leases no metadata)

    db.init_app(app)
    migrate.init_app(app, db, directory=_resolve_migrations_dir())
    with app.app_context():
        is_alembic_cli = (
            os.environ.get("F1_SKIP_CREATE_ALL") == "1"
            or (
                len(sys.argv) >= 2
                and os.path.basename(sys.argv[0]).lower().startswith("flask")
                and "db" in sys.argv[1:]
            )
        )
        if not is_alembic_cli and (
            app.config.get("TESTING")
            or db_uri.startswith("sqlite:")
            or os.environ.get("F1_CREATE_ALL_ON_INIT") == "1"
        ):
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
