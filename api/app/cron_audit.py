"""Trilha de auditoria independente para execucoes autenticadas do Cron de sincronizacao."""

from datetime import datetime, timezone
import json
import logging
import re

from sqlalchemy.orm import Session

from .extensions import db
import app.models


logger = logging.getLogger(__name__)

_SECRET_PATTERN = re.compile(
    r"(Bearer\s+\S+"
    r"|[a-zA-Z0-9+.-]+://[^\s]+"
    r"|postgres(?:ql)?(?:\+\w+)?://[^\s]+"
    r"|(?:password|passwd|pwd|token|secret|apikey|api_key)\s*[=:]\s*\S+)",
    re.IGNORECASE,
)


def _sanitize_error_summary(raw_error: str | None) -> str | None:
    if not raw_error:
        return None

    def _mask_match(match: re.Match) -> str:
        text = match.group(0)
        eq_match = re.match(r"^((?:password|passwd|pwd|token|secret|apikey|api_key)\s*[=:]\s*)\S+$", text, re.IGNORECASE)
        if eq_match:
            return f"{eq_match.group(1)}[REDACTED]"
        return "[REDACTED]"

    cleaned = _SECRET_PATTERN.sub(_mask_match, str(raw_error))
    cleaned = " ".join(cleaned.split())
    return cleaned[:240]


class CronExecutionLog(db.Model):
    __tablename__ = "cron_execution_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    executed_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    status = db.Column(db.String(64), nullable=False, index=True)
    pending_count = db.Column(db.Integer, nullable=True)
    imported_count = db.Column(db.Integer, nullable=True)
    skipped_count = db.Column(db.Integer, nullable=True)
    fencing_token = db.Column(db.BigInteger, nullable=True)
    duration_ms = db.Column(db.Integer, nullable=False)
    error_summary = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
            "status": self.status,
            "pending_count": self.pending_count,
            "imported_count": self.imported_count,
            "skipped_count": self.skipped_count,
            "fencing_token": self.fencing_token,
            "duration_ms": self.duration_ms,
            "error_summary": self.error_summary,
        }


setattr(app.models, "CronExecutionLog", CronExecutionLog)


def record_cron_execution(
    *,
    status: str,
    duration_ms: int,
    executed_at: datetime | None = None,
    pending_count: int | None = None,
    imported_count: int | None = None,
    skipped_count: int | None = None,
    fencing_token: int | None = None,
    error_summary: str | None = None,
) -> bool:
    """Grava registro de auditoria e emite log JSON estruturado sem falhar a rota principal."""
    ts = executed_at or datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    safe_duration = max(0, int(duration_ms))
    safe_error = _sanitize_error_summary(error_summary)

    payload = {
        "event": "cron_sync_results",
        "executed_at": ts.isoformat(),
        "status": status,
        "pending_count": pending_count,
        "imported_count": imported_count,
        "skipped_count": skipped_count,
        "fencing_token": fencing_token,
        "duration_ms": safe_duration,
    }
    if safe_error:
        payload["error_summary"] = safe_error

    serialized = json.dumps(payload, ensure_ascii=False)
    print(serialized, flush=True)
    logger.info(serialized)

    try:
        entry = CronExecutionLog(
            executed_at=ts,
            status=status[:64],
            pending_count=pending_count,
            imported_count=imported_count,
            skipped_count=skipped_count,
            fencing_token=fencing_token,
            duration_ms=safe_duration,
            error_summary=safe_error,
        )
        with Session(db.engine) as audit_session:
            try:
                audit_session.add(entry)
                audit_session.commit()
                return True
            except Exception as audit_exc:
                audit_session.rollback()
                raise audit_exc
    except Exception as audit_exc:
        logger.warning(
            json.dumps(
                {
                    "event": "cron_audit_write_failed",
                    "error": _sanitize_error_summary(str(audit_exc)),
                },
                ensure_ascii=False,
            )
        )
        return False
