from flask import Blueprint, current_app, jsonify, request

from ..sync import SYNC_STATE, request_sync
from .admin import admin_required
from .helpers import parse_int

bp = Blueprint("sync", __name__)


@bp.post("/sync")
@admin_required
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


@bp.get("/cron/sync-results")
def cron_sync_results():
    """
    Dispara sincronizacao agendada de corridas pendentes sob Vercel Cron.
    ---
    tags:
      - Sync
    responses:
      200:
        description: Sincronizacao concluida com sucesso, idle ou falha operacional controlada
      401:
        description: Token de cron ausente ou invalido
      409:
        description: Conflito de execucao (lease ja retido por outro worker)
    """
    import hmac
    import os
    import time
    from datetime import date, datetime, timezone
    from ..cron_audit import record_cron_execution
    from ..extensions import db
    from ..sync_lease import acquire_lease, release_lease, ZombieWorkerError
    from ..results_refresh import pending_races, refresh_pending_results_synchronous

    auth_header = request.headers.get("Authorization", "")
    expected_secret = os.environ.get("CRON_SECRET", "")

    if expected_secret:
        expected_header = f"Bearer {expected_secret}"
        if not hmac.compare_digest(auth_header, expected_header):
            return jsonify({"error": "Unauthorized"}), 401
    elif not current_app.config.get("TESTING"):
        return jsonify({"error": "Unauthorized"}), 401

    started_at = time.monotonic()
    executed_at = datetime.now(timezone.utc)
    audit_status = "failed"
    audit_pending_count = None
    audit_imported_count = None
    audit_skipped_count = None
    audit_fencing_token = None
    audit_error_summary = None

    lease_acquired = False
    worker_uuid = None
    fencing_token = None
    success = False
    status_str = "idle_no_upstream_data"

    try:
        today = date.today()
        pending = pending_races(today=today)
        audit_pending_count = len(pending)
        if not pending:
            audit_status = "idle_no_pending_races"
            audit_imported_count = 0
            audit_skipped_count = 0
            return jsonify({
                "status": "idle_no_pending_races",
                "pending_races": 0,
                "imported_count": 0,
                "skipped_count": 0,
                "pending_count": 0,
                "message": "Nenhuma corrida pendente aguardando homologação."
            }), 200

        lease = acquire_lease(lease_id="f1_sync", ttl_seconds=180)
        if not lease or not lease.get("acquired"):
            audit_status = "already_running"
            return jsonify({
                "status": "already_running",
                "reason": "active_lease_held",
                "retry_after_seconds": 180
            }), 409

        lease_acquired = True
        worker_uuid = lease["worker_uuid"]
        fencing_token = lease["fencing_token"]
        audit_fencing_token = fencing_token

        fencing_context = {
            "lease_id": "f1_sync",
            "worker_uuid": worker_uuid,
            "fencing_token": fencing_token,
        }
        summary = refresh_pending_results_synchronous(
            today=today,
            fencing_context=fencing_context,
            fencing_token=fencing_token,
            lease_id="f1_sync",
            worker_uuid=worker_uuid,
        )
        if isinstance(summary, dict):
            imported_count = int(summary.get("imported_count", summary.get("imported", 0)) or 0)
            skipped_count = int(summary.get("skipped_count", summary.get("skipped", 0)) or 0)
            pending_count = int(summary.get("pending_count", len(pending)) or 0)
            failed_count = int(summary.get("failed_count", 0) or 0)
            summary_payload = {
                **summary,
                "imported_count": imported_count,
                "skipped_count": skipped_count,
                "pending_count": pending_count,
            }
        else:
            imported_count = int(summary or 0)
            pending_count = len(pending)
            skipped_count = max(0, pending_count - imported_count)
            failed_count = 0
            summary_payload = {
                "imported_count": imported_count,
                "skipped_count": skipped_count,
                "pending_count": pending_count,
            }

        audit_pending_count = pending_count
        audit_imported_count = imported_count
        audit_skipped_count = skipped_count

        if imported_count > 0 and failed_count > 0:
            success = False
            status_str = "partial_failed"
            audit_status = "partial_failed"
            return jsonify({
                "status": "partial_failed",
                "fencing_token": fencing_token,
                "worker_uuid": worker_uuid,
                **summary_payload
            }), 200
        elif imported_count > 0:
            success = True
            status_str = "completed"
            audit_status = "completed"
            return jsonify({
                "status": "completed",
                "fencing_token": fencing_token,
                "worker_uuid": worker_uuid,
                **summary_payload
            }), 200
        elif failed_count > 0:
            success = False
            status_str = "failed"
            audit_status = "failed"
            return jsonify({
                "status": "failed",
                "fencing_token": fencing_token,
                "worker_uuid": worker_uuid,
                **summary_payload
            }), 200
        else:
            success = False
            status_str = "idle_no_upstream_data"
            audit_status = "idle_no_upstream_data"
            return jsonify({
                "status": "idle_no_upstream_data",
                "fencing_token": fencing_token,
                "worker_uuid": worker_uuid,
                **summary_payload
            }), 200
    except ZombieWorkerError as zwe:
        status_str = "zombie_rejected"
        audit_status = "zombie_rejected"
        audit_error_summary = f"ZombieWorkerError: {zwe}"
        return jsonify({
            "status": "error",
            "reason": "zombie_worker_rejected",
            "message": str(zwe)
        }), 409
    except Exception as exc:
        status_str = "failed_exception"
        audit_status = "failed"
        audit_error_summary = f"{type(exc).__name__}: {exc}"
        db.session.rollback()
        raise exc
    finally:
        if lease_acquired and worker_uuid is not None:
            try:
                release_lease(
                    lease_id="f1_sync",
                    worker_uuid=worker_uuid,
                    fencing_token=fencing_token,
                    status=status_str[:32],
                    success=success
                )
            except Exception:
                db.session.rollback()

        duration_ms = int((time.monotonic() - started_at) * 1000)
        record_cron_execution(
            status=audit_status,
            duration_ms=duration_ms,
            executed_at=executed_at,
            pending_count=audit_pending_count,
            imported_count=audit_imported_count,
            skipped_count=audit_skipped_count,
            fencing_token=audit_fencing_token,
            error_summary=audit_error_summary,
        )
