from flask import Blueprint, jsonify

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    """
    Health check
    ---
    tags:
      - Health
    responses:
      200:
        description: Servico operacional
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: ok
                service:
                  type: string
                  example: f1-api
    """
    return jsonify({"status": "ok", "service": "f1-api"})
