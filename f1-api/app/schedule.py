"""Fonte unica e resiliente do calendario de sessoes (Etapa 1.11).

Todos os instantes sao normalizados para UTC (ISO 8601 com offset explicito,
``+00:00``) e a conversao para ``America/Sao_Paulo`` acontece somente na
apresentacao (frontend). Nenhum offset fixo e aplicado manualmente.

Precedencia das fontes (da mais para a menos prioritaria):

1. OpenF1 (consulta validada, cacheada por TTL);
2. ultima programacao valida (memoria ou arquivo em disco);
3. snapshot semente versionado (``app/data/schedule_seed_<ano>.json``),
   usado somente em producao quando nao ha nenhuma programacao anterior.

Uma consulta que falha, expira, retorna vazio, malformada ou sem fuso nunca
substitui a ultima programacao valida; o resultado passa a ser marcado como
``stale``/``seed`` e o motivo e registrado em ``last_error``.

A atualizacao e idempotente: sessoes sao mescladas pelo ``session_key`` da
OpenF1 (identificador estavel), portanto nunca ha duplicidade e sessoes
historicas ausentes de uma resposta posterior sao preservadas.
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

from . import openf1

log = logging.getLogger("f1.schedule")

DISPLAY_TIMEZONE = "America/Sao_Paulo"

# Tempo de vida da consulta antes de tentar atualizar de novo.
TTL_CURRENT_SECONDS = int(os.environ.get("F1_SCHEDULE_TTL", "900"))
TTL_PAST_SECONDS = 24 * 3600
# Apos uma falha, nao insistir antes deste intervalo (evita martelar a fonte).
RETRY_AFTER_FAILURE_SECONDS = int(os.environ.get("F1_SCHEDULE_RETRY", "60"))

SEED_DIR = Path(__file__).resolve().parent / "data"

STATUS_FRESH = "fresh"
STATUS_STALE = "stale"
STATUS_SEED = "seed"
STATUS_EMPTY = "empty"

class EmptySchedule(ValueError):
    """Fonte respondeu sem nenhum registro valido."""


_lock = threading.RLock()
_snapshots: dict[int, dict] = {}
_next_attempt_at: dict[int, float] = {}


# ----------------------------------------------------------------------------
# Normalizacao e validacao
# ----------------------------------------------------------------------------

def normalize_instant(value):
    """Converte para ISO 8601 UTC (``+00:00``) ou ``None`` se ausente/invalido.

    Valores sem fuso explicito sao rejeitados: nunca se presume um fuso.
    """
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip()
    if text.endswith(("Z", "z")):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        return None
    return parsed.astimezone(timezone.utc).isoformat()


def _parse(value):
    return datetime.fromisoformat(value)


def normalize_session(raw):
    """Retorna a sessao com datas em UTC ou ``None`` se nao for confiavel."""
    if not isinstance(raw, dict):
        return None
    if raw.get("session_key") is None or raw.get("meeting_key") is None:
        return None
    start = normalize_instant(raw.get("date_start"))
    if start is None:
        return None
    end = normalize_instant(raw.get("date_end"))
    if end is not None and _parse(end) < _parse(start):
        end = None
    session = dict(raw)
    session["date_start"] = start
    session["date_end"] = end
    return session


def normalize_meeting(raw):
    """Meeting com datas UTC. Datas ausentes/invalidas ficam ``None`` e sao
    derivadas das sessoes validas do proprio evento em ``validate_payload``."""
    if not isinstance(raw, dict) or raw.get("meeting_key") is None:
        return None
    start = normalize_instant(raw.get("date_start"))
    end = normalize_instant(raw.get("date_end"))
    if start is not None and end is not None and _parse(end) < _parse(start):
        end = None
    meeting = dict(raw)
    meeting["date_start"] = start
    meeting["date_end"] = end
    return meeting


def validate_payload(meetings, sessions):
    """Valida e normaliza a resposta da fonte.

    Retorna ``(meetings, sessions, issues)``. Levanta ``ValueError`` quando a
    resposta nao e utilizavel (vazia ou malformada) para que o chamador
    preserve a ultima programacao valida.
    """
    if not isinstance(meetings, list) or not isinstance(sessions, list):
        raise ValueError("resposta malformada: esperado lista de meetings e sessions")
    issues = []
    clean_sessions = {}
    for raw in sessions:
        session = normalize_session(raw)
        if session is None:
            issues.append(f"sessao descartada (dados invalidos): {_describe(raw)}")
            continue
        clean_sessions[session["session_key"]] = session
    clean_meetings = {}
    for raw in meetings:
        meeting = normalize_meeting(raw)
        if meeting is None:
            issues.append(f"meeting descartado (dados invalidos): {_describe(raw)}")
            continue
        clean_meetings[meeting["meeting_key"]] = meeting
    if not clean_sessions or not clean_meetings:
        raise EmptySchedule("resposta vazia ou sem registros validos")
    # Datas do evento ausentes: derivar do primeiro/ultimo instante valido das
    # proprias sessoes (nunca de valores arbitrarios). Sem sessoes, descartar.
    by_meeting = {}
    for s in clean_sessions.values():
        by_meeting.setdefault(s["meeting_key"], []).append(s)
    for key in list(clean_meetings):
        meeting = clean_meetings[key]
        own = by_meeting.get(key, [])
        if meeting["date_start"] is None:
            if not own:
                issues.append(f"meeting descartado (sem datas e sem sessoes): {key}")
                del clean_meetings[key]
                continue
            meeting["date_start"] = min(s["date_start"] for s in own)
        if meeting["date_end"] is None:
            candidates = [s["date_end"] or s["date_start"] for s in own]
            meeting["date_end"] = max(candidates) if candidates else meeting["date_start"]
    if not clean_meetings:
        raise EmptySchedule("resposta vazia ou sem registros validos")
    return list(clean_meetings.values()), list(clean_sessions.values()), issues


def _describe(raw):
    if isinstance(raw, dict):
        return json.dumps(
            {k: raw.get(k) for k in ("meeting_key", "session_key", "date_start")},
            default=str,
        )
    return repr(raw)[:80]


def merge_snapshots(previous, meetings, sessions):
    """Mescla idempotente por chave estavel. Retorna (meetings, sessions, changes)."""
    changes = []
    merged_sessions = {}
    merged_meetings = {}
    if previous:
        for s in previous.get("sessions", []):
            merged_sessions[s["session_key"]] = s
        for m in previous.get("meetings", []):
            merged_meetings[m["meeting_key"]] = m
    for s in sessions:
        old = merged_sessions.get(s["session_key"])
        if old and (old.get("date_start") != s["date_start"] or old.get("date_end") != s["date_end"]):
            changes.append(
                {
                    "session_key": s["session_key"],
                    "session_name": s.get("session_name"),
                    "from": [old.get("date_start"), old.get("date_end")],
                    "to": [s["date_start"], s["date_end"]],
                }
            )
        merged_sessions[s["session_key"]] = s
    for m in meetings:
        merged_meetings[m["meeting_key"]] = m
    return list(merged_meetings.values()), list(merged_sessions.values()), changes


# ----------------------------------------------------------------------------
# Persistencia (ultima programacao valida)
# ----------------------------------------------------------------------------

def _testing() -> bool:
    try:
        from flask import current_app, has_app_context

        if has_app_context():
            return bool(current_app.config.get("TESTING"))
    except Exception:  # noqa: BLE001
        pass
    return bool(os.environ.get("PYTEST_CURRENT_TEST"))


def _persist_enabled() -> bool:
    return bool(os.environ.get("F1_SCHEDULE_CACHE_DIR")) or not _testing()


def _cache_dir() -> Path:
    override = os.environ.get("F1_SCHEDULE_CACHE_DIR", "").strip()
    return Path(override) if override else Path(tempfile.gettempdir()) / "f1_schedule"


def _persist_path(year: int) -> Path:
    return _cache_dir() / f"schedule_{year}.json"


def _load_file(path: Path):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("sessions") and data.get("meetings"):
            return data
    except (OSError, ValueError):
        pass
    return None


def _save_file(year: int, snapshot: dict) -> None:
    if not _persist_enabled():
        return
    try:
        path = _persist_path(year)
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(snapshot, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, path)
    except OSError as exc:
        log.warning("schedule: nao foi possivel persistir snapshot %s: %s", year, exc)


def _load_previous(year: int):
    snap = _snapshots.get(year)
    if snap:
        return snap
    if not _persist_enabled():
        return None
    return _load_file(_persist_path(year))


def _load_seed(year: int):
    if _testing() and not os.environ.get("F1_SCHEDULE_ALLOW_SEED_IN_TESTS"):
        return None
    return _load_file(SEED_DIR / f"schedule_seed_{year}.json")


def reset_for_tests() -> None:
    with _lock:
        _snapshots.clear()
        _next_attempt_at.clear()


# ----------------------------------------------------------------------------
# Atualizacao e consulta
# ----------------------------------------------------------------------------

def _now() -> float:
    return time.time()


def _ttl_for(year: int) -> int:
    current_year = datetime.now(timezone.utc).year
    return TTL_PAST_SECONDS if year < current_year else TTL_CURRENT_SECONDS


def refresh_schedule(year: int, force: bool = False) -> dict:
    """Consulta a OpenF1 e atualiza o snapshot do ano.

    Seguro para ser chamado por qualquer rotina existente (inclusive o Cron
    atual); nao cria agendamento proprio. Retorna o snapshot vigente, que pode
    estar ``stale`` se a atualizacao falhou.
    """
    year = int(year)
    with _lock:
        previous = _load_previous(year)
        now = _now()
        if previous and not force:
            age = now - previous.get("fetched_epoch", 0)
            if previous.get("status") == STATUS_FRESH and age < _ttl_for(year):
                _snapshots.setdefault(year, previous)
                return previous
            if now < _next_attempt_at.get(year, 0):
                return _as_fallback(previous, previous.get("last_error"))
        attempt_iso = datetime.now(timezone.utc).isoformat()
        try:
            raw_meetings = openf1.get("meetings", year=year) or []
            raw_sessions = openf1.get("sessions", year=year) or []
            meetings, sessions, issues = validate_payload(raw_meetings, raw_sessions)
        except (openf1.OpenF1Error, ValueError, TypeError, KeyError, AttributeError) as exc:
            error = f"{type(exc).__name__}: {exc}"
            log.warning("schedule: atualizacao %s falhou: %s", year, error)
            _next_attempt_at[year] = now + RETRY_AFTER_FAILURE_SECONDS
            fallback = _as_fallback(previous, error, attempt_iso)
            if fallback is None:
                seed = _load_seed(year)
                if seed:
                    fallback = {
                        **seed,
                        "status": STATUS_SEED,
                        "last_error": error,
                        "last_attempt_at": attempt_iso,
                    }
                    _snapshots[year] = fallback
            if fallback is None:
                if isinstance(exc, EmptySchedule):
                    # Sem dados a preservar e a fonte nao tem registros (ex.:
                    # ano futuro): resposta vazia transitoria, nunca persistida.
                    return {
                        "year": year,
                        "source": "openf1",
                        "status": STATUS_EMPTY,
                        "fetched_at": None,
                        "last_attempt_at": attempt_iso,
                        "last_error": error,
                        "meetings": [],
                        "sessions": [],
                    }
                if isinstance(exc, openf1.OpenF1Error):
                    raise
                raise openf1.OpenF1Error(f"programacao indisponivel: {error}") from exc
            return fallback

        merged_meetings, merged_sessions, changes = merge_snapshots(previous, meetings, sessions)
        snapshot = {
            "year": year,
            "source": "openf1",
            "status": STATUS_FRESH,
            "fetched_at": attempt_iso,
            "fetched_epoch": now,
            "last_attempt_at": attempt_iso,
            "last_error": None,
            "issues": issues,
            "changes": changes,
            "meetings": merged_meetings,
            "sessions": merged_sessions,
        }
        _snapshots[year] = snapshot
        _next_attempt_at.pop(year, None)
        _save_file(year, snapshot)
        if changes:
            log.info("schedule: %s sessoes reagendadas em %s", len(changes), year)
        return snapshot


def _as_fallback(previous, error, attempt_iso=None):
    if not previous:
        return None
    status = previous.get("status")
    fallback = {
        **previous,
        "status": STATUS_SEED if status == STATUS_SEED else STATUS_STALE,
        "last_error": error,
    }
    if attempt_iso:
        fallback["last_attempt_at"] = attempt_iso
    _snapshots[previous["year"]] = fallback
    return fallback


def get_snapshot(year: int) -> dict:
    return refresh_schedule(year)


def snapshot_info(snapshot: dict) -> dict:
    """Metadados publicos (sem os registros) para expor na API."""
    return {
        "source": snapshot.get("source", "openf1"),
        "status": snapshot.get("status", STATUS_FRESH),
        "stale": snapshot.get("status") != STATUS_FRESH,
        "fetched_at": snapshot.get("fetched_at"),
        "time_zone_display": DISPLAY_TIMEZONE,
    }


def get_meetings(year: int) -> list:
    return [dict(m) for m in get_snapshot(year)["meetings"]]


def get_sessions(year: int, **filters) -> list:
    """Sessoes do ano (UTC), filtradas localmente por igualdade de campos."""
    rows = get_snapshot(year)["sessions"]
    out = []
    for s in rows:
        if all(s.get(k) == v for k, v in filters.items()):
            out.append(dict(s))
    return out


def get_info(year: int) -> dict:
    return snapshot_info(get_snapshot(year))


# ----------------------------------------------------------------------------
# Ajustes de exibicao compartilhados (mesmos nomes em todas as telas)
# ----------------------------------------------------------------------------

def apply_display_overrides(meeting: dict) -> dict:
    """Nomes de exibicao consistentes (migrado do patch antigo de live.py)."""
    if meeting.get("location") == "Kuala Lumpur" or meeting.get("meeting_key") == 1308:
        meeting["meeting_name"] = "Bahrain Grand Prix"
        meeting["location"] = "Sepang"
        meeting["country_name"] = "Malásia"
        meeting["circuit_short_name"] = "Sepang"
    elif meeting.get("meeting_key") == 1298 or meeting.get("location") == "Mexico City":
        meeting["meeting_name"] = "GP do México (Cidade do México)"
        meeting["location"] = "Cidade do México"
        meeting["country_name"] = "México"
        meeting["circuit_short_name"] = "Autódromo Hermanos Rodríguez"
    elif meeting.get("meeting_key") == 1299 or meeting.get("location") == "São Paulo":
        meeting["meeting_name"] = "GP do Brasil (São Paulo - Interlagos)"
        meeting["location"] = "São Paulo"
        meeting["country_name"] = "Brasil"
        meeting["circuit_short_name"] = "Autódromo José Carlos Pace (Interlagos)"
    return meeting


def write_seed(year: int) -> Path:
    """Gera o snapshot semente a partir de uma consulta valida (uso manual)."""
    snap = refresh_schedule(year, force=True)
    if snap.get("status") != STATUS_FRESH:
        raise RuntimeError(f"nao foi possivel gerar semente: {snap.get('last_error')}")
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    seed = {k: v for k, v in snap.items() if k not in ("changes", "issues", "fetched_epoch")}
    seed["status"] = STATUS_SEED
    path = SEED_DIR / f"schedule_seed_{year}.json"
    path.write_text(json.dumps(seed, ensure_ascii=False, indent=1), encoding="utf-8")
    return path
