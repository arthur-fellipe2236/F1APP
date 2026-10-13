from flask import Blueprint, current_app, jsonify, request

from ..sync import SYNC_STATE, request_sync
from .helpers import parse_int

bp = Blueprint("sync", __name__)


@bp.post("/sync")
def trigger_sync():
    """
    Dispara sincronizacao com a OpenF1
    ---
    tags:
      - Sync
    parameters:
      - in: query
        name: season
        schema:
          type: integer
        description: Temporada especifica (ex. 2024). Omitido sincroniza as configuradas
      - in: query
        name: force
        schema:
          type: boolean
          default: false
        description: Reimporta mesmo com dados existentes
    responses:
      202:
        description: Sincronizacao iniciada em background
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: started
                season:
                  type: integer
                  nullable: true
                force:
                  type: boolean
      400:
        description: Parametro season invalido
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      409:
        description: Ja existe uma sincronizacao em execucao
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: already_running
    """
    season = parse_int(request.args.get("season"), "season")
    force = request.args.get("force", "").lower() in {"1", "true", "yes"}
    started = request_sync(
        current_app._get_current_object(), season=season, force=force
    )
    if not started:
        return jsonify({"status": "already_running"}), 409
    return (
        jsonify({"status": "started", "season": season, "force": force}),
        202,
    )


@bp.get("/sync/status")
def sync_status():
    """
    Status da sincronizacao
    ---
    tags:
      - Sync
    responses:
      200:
        description: Estado atual da sincronizacao
        content:
          application/json:
            schema:
              type: object
              properties:
                running:
                  type: boolean
                last_sync_at:
                  type: string
                  nullable: true
                  example: "2026-09-02T18:00:00+00:00"
                last_error:
                  type: string
                  nullable: true
    """
    return jsonify(SYNC_STATE)
