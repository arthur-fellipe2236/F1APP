from flask import Blueprint


def register_api(app):
    """Register all API sub‑blueprints on a fresh Blueprint instance.

    A new ``Blueprint`` is created for each ``create_app`` call so that
    repeated calls within the same process do not attempt to register the
    same blueprint twice (which would raise ``AssertionError``). All
    sub‑modules expose a ``bp`` object that is attached to this freshly
    created blueprint.
    """
    # Fresh Blueprint per application instance
    api_bp = Blueprint("api", __name__, url_prefix="/api/v1")

    # Import sub‑modules that each define a ``bp`` Blueprint
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

    # Register each sub‑blueprint on the fresh ``api_bp``
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

    # Finally attach the composed blueprint to the Flask app
    app.register_blueprint(api_bp)
