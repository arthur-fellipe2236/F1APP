"""Módulo de controle de concorrência distribuída via DB Lease Lock e Fencing Token (R-01).

Implementa aquisição atômica, renovação por heartbeat cooperativo pós-lock, proteção contra
TOCTOU via atomic_sync_write, validação de fencing token para impedir sobrescrita por
instâncias zumbis (zombie workers) e liberação graciosa.
Totalmente compatível com Transaction Pooler (PgBouncer em pool_mode=transaction).
"""

from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import logging
import uuid
from sqlalchemy import select
from app.extensions import db
class CronSyncLease(db.Model):
    __tablename__ = "cron_sync_leases"

    id = db.Column(db.String(64), primary_key=True)
    locked_until = db.Column(db.DateTime(timezone=True), nullable=True)
    locked_by = db.Column(db.String(64), nullable=True)
    fencing_token = db.Column(db.BigInteger, default=0, nullable=False)
    last_heartbeat = db.Column(db.DateTime(timezone=True), nullable=True)
    last_successful_sync_at = db.Column(db.DateTime(timezone=True), nullable=True)
    last_status = db.Column(db.String(32), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "locked_until": self.locked_until.isoformat() if self.locked_until else None,
            "locked_by": self.locked_by,
            "fencing_token": self.fencing_token,
            "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            "last_successful_sync_at": (
                self.last_successful_sync_at.isoformat()
                if self.last_successful_sync_at
                else None
            ),
            "last_status": self.last_status,
        }

import app.models
setattr(app.models, "CronSyncLease", CronSyncLease)


logger = logging.getLogger(__name__)


class ZombieWorkerError(Exception):
    """Lançada quando um worker tenta executar escritas com fencing token vencido."""
    pass


class FencingContextRequiredError(Exception):
    """Lançada quando uma escrita de sincronização é chamada sem contexto de fencing válido."""
    pass


def acquire_lease(lease_id="f1_sync", worker_uuid=None, ttl_seconds=180, session=None):
    """Tenta adquirir atomicamente o lease com fencing token monotonicamente crescente.
    Utiliza SELECT ... FOR UPDATE com avaliação de relógio estritamente pós-bloqueio.

    Retorna dict com status de aquisição:
    {"acquired": True/False, "worker_uuid": str, "fencing_token": int/None, "locked_until": datetime/None, "reason": str/None}
    """
    s = session or db.session
    token_worker = worker_uuid or str(uuid.uuid4())

    try:
        # Garante que o registro de controle existe
        existing = s.get(CronSyncLease, lease_id)
        if existing is None:
            try:
                initial = CronSyncLease(
                    id=lease_id,
                    locked_until=None,
                    locked_by=None,
                    fencing_token=0,
                    last_status="idle",
                )
                s.add(initial)
                s.commit()
            except Exception:
                s.rollback()

        # Obter lock exclusivo da linha no PostgreSQL com populate_existing para refrescar identity map
        stmt = (
            select(CronSyncLease)
            .where(CronSyncLease.id == lease_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        record = s.execute(stmt).scalar_one_or_none()
        if record is None:
            s.rollback()
            return {
                "acquired": False,
                "worker_uuid": token_worker,
                "fencing_token": None,
                "locked_until": None,
                "reason": "record_missing",
            }

        # Avaliação de timestamp estritamente pós-bloqueio (eliminação de fila expirada)
        now_post_lock = datetime.now(timezone.utc)
        locked_until_db = record.locked_until
        if locked_until_db is not None and locked_until_db.tzinfo is None:
            locked_until_db = locked_until_db.replace(tzinfo=timezone.utc)

        # Validação temporal: lease ainda retido por outro worker?
        if locked_until_db is not None and locked_until_db > now_post_lock:
            s.rollback()
            logger.warning(
                "Falha ao adquirir lease '%s': lease ativo retido por outro worker (%s até %s)",
                lease_id,
                record.locked_by,
                record.locked_until,
            )
            return {
                "acquired": False,
                "worker_uuid": token_worker,
                "fencing_token": None,
                "locked_until": None,
                "reason": "active_lease_held",
            }

        # Aquisição legítima
        new_token = (record.fencing_token or 0) + 1
        new_locked_until = now_post_lock + timedelta(seconds=ttl_seconds)
        record.locked_until = new_locked_until
        record.locked_by = token_worker
        record.fencing_token = new_token
        record.last_heartbeat = now_post_lock
        record.last_status = "running"

        s.commit()
        logger.info(
            "Lease '%s' adquirido com sucesso pelo worker %s (fencing_token=%d)",
            lease_id,
            token_worker,
            new_token,
        )
        return {
            "acquired": True,
            "worker_uuid": token_worker,
            "fencing_token": new_token,
            "locked_until": new_locked_until,
        }
    except Exception as exc:
        s.rollback()
        err_msg = str(exc).lower()
        if "does not exist" in err_msg or "no such table" in err_msg or "cron_sync_leases" in err_msg:
            logger.warning(
                "Tabela de controle de concorrência 'cron_sync_leases' ausente ou inacessível no banco de dados. "
                "Migration 003 pendente. Aquisição de lease abortada com segurança sem permitir concorrência."
            )
            return {
                "acquired": False,
                "worker_uuid": token_worker,
                "fencing_token": None,
                "locked_until": None,
                "reason": "table_missing",
            }
        logger.error("Erro inesperado ao adquirir lease '%s': %s", lease_id, exc)
        raise


def renew_lease(lease_id, worker_uuid, fencing_token, ttl_seconds=180, session=None):
    """Renova o lease por heartbeat condicionado a ser o proprietário, token vigente e não expirado pós-lock."""
    s = session or db.session
    try:
        stmt = (
            select(CronSyncLease)
            .where(CronSyncLease.id == lease_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        record = s.execute(stmt).scalar_one_or_none()
        if record is None:
            s.rollback()
            return False

        now_post_lock = datetime.now(timezone.utc)
        locked_until_db = record.locked_until
        if locked_until_db is not None and locked_until_db.tzinfo is None:
            locked_until_db = locked_until_db.replace(tzinfo=timezone.utc)

        # R01-05: Restrição locked_until > now_post_lock impede ressuscitar lease vencido
        if (
            record.locked_by != worker_uuid
            or record.fencing_token != fencing_token
            or locked_until_db is None
            or locked_until_db <= now_post_lock
        ):
            s.rollback()
            return False

        record.locked_until = now_post_lock + timedelta(seconds=ttl_seconds)
        record.last_heartbeat = now_post_lock
        s.commit()
        return True
    except Exception:
        s.rollback()
        raise


def release_lease(lease_id, worker_uuid, fencing_token, status="completed", success=True, session=None):
    """Libera o lease condicionado a ser o proprietário e token correspondente sob lock."""
    s = session or db.session
    try:
        stmt = (
            select(CronSyncLease)
            .where(CronSyncLease.id == lease_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        record = s.execute(stmt).scalar_one_or_none()
        if record is None:
            s.rollback()
            return False

        if record.locked_by != worker_uuid or record.fencing_token != fencing_token:
            s.rollback()
            return False

        now_post_lock = datetime.now(timezone.utc)
        record.locked_until = None
        record.locked_by = None
        record.last_status = status
        record.last_heartbeat = now_post_lock
        if success:
            record.last_successful_sync_at = now_post_lock
        s.commit()
        return True
    except Exception as exc:
        s.rollback()
        err_msg = str(exc).lower()
        if "does not exist" in err_msg or "no such table" in err_msg or "cron_sync_leases" in err_msg:
            logger.warning("Tentativa de liberação de lease com tabela ausente.")
            return False
        raise


def validate_fencing_token(lease_id, fencing_token, session=None):
    """Valida se o fencing_token informado ainda é o proprietário vigente.

    Lança ZombieWorkerError se o token foi superado por outra aquisição mais recente.
    """
    s = session or db.session
    record = s.get(CronSyncLease, lease_id)
    if record is None:
        raise ZombieWorkerError(f"Registro de lease '{lease_id}' inexistente.")

    if record.fencing_token != fencing_token:
        raise ZombieWorkerError(
            f"Zombie Worker detectado: fencing_token local ({fencing_token}) "
            f"foi superado pelo token ativo no banco ({record.fencing_token}). "
            f"Operação abortada para evitar corrupção de dados."
        )

    now = datetime.now(timezone.utc)
    locked_until = record.locked_until
    if locked_until is not None and locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=timezone.utc)

    if locked_until is None or locked_until <= now:
        raise ZombieWorkerError(
            f"Lease expirado para o fencing_token {fencing_token} "
            f"(locked_until={record.locked_until}, now={now})."
        )

    return True


@contextmanager
def atomic_sync_write(lease_id, worker_uuid, fencing_token, session=None):
    """Context manager centralizado para eliminação do TOCTOU (R01-01).

    Executa a persistência de resultados dentro de transação protegida.
    Imediatamente antes do commit, valida atomicamente na mesma transação sob row lock
    que o fencing_token e locked_by ainda são válidos e não expiraram (pós-lock).
    Se inválido, emite rollback integral e levanta ZombieWorkerError.
    """
    if not worker_uuid or fencing_token is None:
        raise FencingContextRequiredError(
            "Escrita de sincronização exige worker_uuid e fencing_token válidos."
        )

    s = session or db.session
    try:
        yield s
        # Validação atômica final vinculada à mesma transação física pós-lock
        stmt = (
            select(CronSyncLease)
            .where(CronSyncLease.id == lease_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        record = s.execute(stmt).scalar_one_or_none()
        now_post_lock = datetime.now(timezone.utc)

        locked_until_db = record.locked_until if record else None
        if locked_until_db is not None and locked_until_db.tzinfo is None:
            locked_until_db = locked_until_db.replace(tzinfo=timezone.utc)

        if (
            record is None
            or record.locked_by != worker_uuid
            or record.fencing_token != fencing_token
            or locked_until_db is None
            or locked_until_db <= now_post_lock
        ):
            s.rollback()
            raise ZombieWorkerError(
                f"Transação abortada: lease '{lease_id}' expirou ou foi superado por outro worker "
                f"(worker={worker_uuid}, fencing_token={fencing_token}). "
                f"Escrita física rejeitada para evitar corrupção de dados."
            )

        record.last_heartbeat = now_post_lock
        s.commit()
    except Exception:
        s.rollback()
        raise
