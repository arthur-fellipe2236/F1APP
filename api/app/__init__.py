import os

from flask import Flask, jsonify
from sqlalchemy import text

from .extensions import db, migrate
from .api.helpers import ApiError



def create_app(config_overrides=None):
    app = Flask(__name__)
    db_uri = os.environ.get("F1_DATABASE_URI", "sqlite:///f1.db")
    if "postgresql" in db_uri:
        try:
            import psycopg2
        except ImportError:
            basedir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            db_uri = f"sqlite:///{os.path.join(basedir, 'instance', 'f1.db')}"

    app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.json.sort_keys = False

    if config_overrides:
        app.config.update(config_overrides)

    from . import models  # noqa: F401  (registra tabelas no metadata)

    db.init_app(app)
    migrate.init_app(app, db)
    with app.app_context():
        db.create_all()
        
        if app.config.get("TESTING"):
            from .seed import seed

            seed()
        elif not os.environ.get('NO_BACKGROUND_SYNC'):
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
