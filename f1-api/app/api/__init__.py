from flask import Blueprint

def register_api(app):
    api_bp = Blueprint("api", __name__, url_prefix="/api/v1")
    from . import (
        health,
        auth,
        admin,
        bulletin,
        fantasy,
        drivers,
        teams,
        circuits,
        races,
        standings,
        sync,
        news,
        live,
        media,
    )

    for module in (
        health,
        auth,
        admin,
        bulletin,
        fantasy,
        drivers,
        teams,
        circuits,
        races,
        standings,
        sync,
        news,
        live,
        media,
    ):
        api_bp.register_blueprint(module.bp)
        
    app.register_blueprint(api_bp)
