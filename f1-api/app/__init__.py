import os

from flask import Flask, jsonify
from sqlalchemy import text

from .extensions import db
from .api.helpers import ApiError

MIGRATIONS = (
    "ALTER TABLE drivers ADD COLUMN headshot_url VARCHAR(300)",
)


def run_migrations():
    for statement in MIGRATIONS:
        try:
            with db.engine.begin() as connection:
                connection.execute(text(statement))
        except Exception:  # noqa: BLE001 - coluna ja existe
            pass


def create_app(config_overrides=None):
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "F1_DATABASE_URI", "sqlite:///f1.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.json.sort_keys = False

    if config_overrides:
        app.config.update(config_overrides)

    from . import models  # noqa: F401  (registra tabelas no metadata)

    db.init_app(app)
    with app.app_context():
        db.create_all()
        run_migrations()
        if app.config.get("TESTING"):
            from .seed import seed

            seed()
        else:
            from .sync import start_background_sync

            start_background_sync(app)

    from .api import register_api
    from .api.openapi import init_swagger

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
