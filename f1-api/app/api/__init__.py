from flask import Blueprint

api_bp = Blueprint("api", __name__, url_prefix="/api/v1")


def register_api(app):
    from . import (
        health,
        drivers,
        teams,
        circuits,
        races,
        standings,
        sync,
        news,
        live,
    )

    for module in (
        health,
        drivers,
        teams,
        circuits,
        races,
        standings,
        sync,
        news,
        live,
    ):
        api_bp.register_blueprint(module.bp)
    app.register_blueprint(api_bp)
