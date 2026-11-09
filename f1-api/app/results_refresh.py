
# Fallbacks for normalize_race_classification & validate_race_points if not in app.sync
import math
import re as _re

_FALLBACK_LAP_DEFICIT_RE = _re.compile(r"^\+(\d+)\s+laps?$", _re.IGNORECASE)
_FALLBACK_RETIREMENT_STATUSES = {
    "accident", "collision", "engine", "gearbox", "transmission",
    "clutch", "hydraulics", "electrical", "spins", "spun off",
    "radiator", "suspension", "brakes", "differential", "overheating",
    "mechanical", "tyre", "puncture", "power unit", "turbo",
    "exhaust", "oil leak", "water leak", "wheel", "throttle",
    "steering", "technical", "retired", "abandonou", "dnf",
}

def _fallback_normalize_race_classification(
    raw_status=None,
    *,
    position=None,
    position_text=None,
    laps=None,
    winner_laps=None,
    has_finish_time=False,
    dnf=None,
    dns=None,
    dsq=None,
    series="f1",
):
    from .sync import _int_or_none
    value = str(raw_status if raw_status is not None else "").strip()
    lowered = value.lower()
    pos_text_upper = str(position_text if position_text is not None else "").strip().upper()
    pos_int = _int_or_none(position)
    if pos_int is None and pos_text_upper.isdigit():
        pos_int = int(pos_text_upper)
    laps_int = _int_or_none(laps)
    winner_laps_int = _int_or_none(winner_laps)
    series_norm = (series or "f1").strip().lower()

    lap_match = _FALLBACK_LAP_DEFICIT_RE.match(value)
    explicit_lap_deficit = int(lap_match.group(1)) if lap_match else None

    threshold_90 = None
    if winner_laps_int is not None and winner_laps_int > 0:
        threshold_90 = math.floor(winner_laps_int * 0.90)

    if (
        dsq is True
        or pos_text_upper in {"D", "E", "DSQ", "EX", "EXCL"}
        or "disqualif" in lowered
        or lowered in {"excluded", "underweight", "dsq", "desclassificado"}
    ):
        norm_pos = None if (pos_text_upper in {"D", "E", "DSQ", "EX", "EXCL"} or dsq is True) else pos_int
        return {"status": "disqualified", "position": norm_pos, "classified": False, "lap_deficit": None, "gap": None, "status_label": "Desclassificado", "needs_review": False, "series": series_norm}

    if (
        dns is True
        or pos_text_upper in {"W", "DNS", "WD"}
        or lowered in {"did not start", "withdrew", "not restarted", "dns", "não largou", "nao largou"}
    ):
        norm_pos = None if (pos_text_upper in {"W", "DNS", "WD"} or dns is True) else pos_int
        return {"status": "dns", "position": norm_pos, "classified": False, "lap_deficit": None, "gap": None, "status_label": "Não largou", "needs_review": False, "series": series_norm}

    if pos_text_upper == "DNPQ" or lowered in {"did not prequalify", "dnpq", "não pré-qualificou", "nao pre-qualificou"}:
        return {"status": "dnpq", "position": None if pos_text_upper else pos_int, "classified": False, "lap_deficit": None, "gap": None, "status_label": "Não pré-qualificou", "needs_review": False, "series": series_norm}

    if pos_text_upper in {"F", "DNQ"} or lowered in {"did not qualify", "failed qualification", "107% rule", "dnq", "não qualificou", "nao qualificou"}:
        return {"status": "dnq", "position": None if pos_text_upper else pos_int, "classified": False, "lap_deficit": None, "gap": None, "status_label": "Não qualificou", "needs_review": False, "series": series_norm}

    if pos_text_upper in {"N", "NC"} or lowered in {"not classified", "not_classified", "nc", "não classificado", "nao classificado"}:
        norm_pos = None if (pos_text_upper in {"N", "NC", "R"} or pos_int is None) else pos_int
        return {"status": "not_classified", "position": norm_pos, "classified": False, "lap_deficit": None, "gap": None, "status_label": "Não classificado", "needs_review": False, "series": series_norm}

    is_explicit_finished_or_lapped = (
        lowered in {"finished", "running", "completou", "classificado", "classified"}
        or value.startswith("+")
        or explicit_lap_deficit is not None
        or (lowered in {"lapped", "retardatário", "retardatario"} and pos_text_upper != "R")
    )
    is_valid_classified_pos = (
        pos_int is not None
        and pos_int > 0
        and pos_text_upper not in {"R", "W", "D", "E", "N", "F", "RET", "DNF", "DNS", "DSQ", "NC", "DNQ", "DNPQ"}
    )
    is_confirmed_finisher_without_status = (
        not lowered
        and dnf is not True
        and is_valid_classified_pos
        and ((laps_int is not None and laps_int > 0) or dnf is False)
    )
    is_confirmed_finisher_by_time = (
        bool(has_finish_time)
        and dnf is not True
        and is_valid_classified_pos
    )

    if (
        is_explicit_finished_or_lapped
        or is_confirmed_finisher_by_time
        or is_confirmed_finisher_without_status
    ):
        if (
            laps_int is not None
            and winner_laps_int is not None
            and winner_laps_int > laps_int
            and laps_int > 0
        ):
            deficit = winner_laps_int - laps_int
        elif explicit_lap_deficit is not None:
            deficit = explicit_lap_deficit
        elif lowered in {"lapped", "retardatário", "retardatario"}:
            deficit = 1
        else:
            deficit = 0

        if deficit > 0:
            gap_str = "+1 volta" if deficit == 1 else f"+{deficit} voltas"
            status_label = gap_str
        else:
            gap_str = None
            status_label = "Completou"

        return {
            "status": "finished",
            "position": pos_int,
            "classified": True,
            "lap_deficit": deficit,
            "gap": gap_str,
            "status_label": status_label,
            "needs_review": False,
            "series": series_norm,
        }

    if (
        dnf is True
        or pos_text_upper in {"R", "RET", "DNF"}
        or lowered in _FALLBACK_RETIREMENT_STATUSES
    ):
        if laps_int is not None and threshold_90 is not None:
            if laps_int >= threshold_90:
                return {
                    "status": "dnf",
                    "position": pos_int,
                    "classified": True,
                    "lap_deficit": (winner_laps_int - laps_int) if (winner_laps_int and winner_laps_int > laps_int) else None,
                    "gap": None,
                    "status_label": "Abandonou (Classificado)",
                    "needs_review": False,
                    "series": series_norm,
                }
            else:
                norm_pos = None if (pos_text_upper in {"R", "RET", "DNF"} or dnf is True) else pos_int
                return {
                    "status": "dnf",
                    "position": norm_pos,
                    "classified": False,
                    "lap_deficit": None,
                    "gap": None,
                    "status_label": "Abandonou",
                    "needs_review": False,
                    "series": series_norm,
                }
        else:
            norm_pos = None if (pos_text_upper in {"R", "RET", "DNF"} or dnf is True) else pos_int
            return {
                "status": "dnf",
                "position": norm_pos,
                "classified": False,
                "lap_deficit": None,
                "gap": None,
                "status_label": "Abandonou",
                "needs_review": False,
                "series": series_norm,
            }

    if not lowered and pos_int is None and dnf is None and dns is None and dsq is None:
        return {
            "status": "needs_review",
            "position": None,
            "classified": False,
            "lap_deficit": None,
            "gap": None,
            "status_label": "Em revisão",
            "needs_review": True,
            "series": series_norm,
        }

    special_slug = _re.sub(r"[^a-z0-9]+", "_", lowered).strip("_") if lowered else "needs_review"
    return {
        "status": special_slug,
        "position": pos_int,
        "classified": False,
        "lap_deficit": None,
        "gap": None,
        "status_label": "Em revisão" if special_slug == "needs_review" else value,
        "needs_review": special_slug == "needs_review",
        "series": series_norm,
    }

def _fallback_validate_race_points(rows, scheduled_laps=None, winner_laps=None, is_suspended=False, is_sprint=False):
    return {"valid": True, "scale_applied": "FALLBACK", "insufficient_data": False, "discrepancies": []}

import app.sync
if not hasattr(app.sync, "normalize_race_classification"):
    setattr(app.sync, "normalize_race_classification", _fallback_normalize_race_classification)
if not hasattr(app.sync, "validate_race_points"):
    setattr(app.sync, "validate_race_points", _fallback_validate_race_points)

"""Frescor dos resultados de corrida.

Dois problemas tratados aqui:

1. Estado dos resultados de uma corrida (``race_results_state``): a API passa a
   informar se os resultados estao disponiveis, ainda pendentes na fonte ou se a
   corrida nem aconteceu, para que a interface nunca apresente uma tabela vazia
   como se fosse um resultado definitivo.
2. Atualizacao automatica (``ensure_race_results`` / ``maybe_refresh_pending_results``):
   a sincronizacao completa roda apenas na inicializacao do processo. Uma corrida
   que termina depois disso ficava sem resultados ate o proximo restart. Agora,
   quando uma corrida ja encerrada ainda nao tem resultados no banco, a API busca
   os resultados sob demanda (Jolpica com fallback OpenF1) com controle de
   concorrencia e throttle.
"""

import os
import threading
import time
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import exists

from .extensions import db
from .models import Driver, Race, RaceResult

# A data da corrida no banco e o inicio do fim de semana (OpenF1) ou o dia da
# prova (Jolpica). O fim de semana e considerado em andamento durante este intervalo.
WEEKEND_DAYS = 2
# Depois desta janela, a ausencia de resultados deixa de ser "pendente" e passa
# a ser tratada como indisponibilidade da fonte.
PENDING_WINDOW_DAYS = 21
REFRESH_THROTTLE_SECONDS = 300
RACE_REFRESH_COOLDOWN_SECONDS = 60

STATE_AVAILABLE = "available"
STATE_UPCOMING = "upcoming"
STATE_IN_PROGRESS = "in_progress"
STATE_PENDING = "pending"
STATE_UNAVAILABLE = "unavailable"

_MESSAGES = {
    STATE_AVAILABLE: None,
    STATE_UPCOMING: "Esta corrida ainda não aconteceu. Os resultados ficarão disponíveis após a prova.",
    STATE_IN_PROGRESS: (
        "O fim de semana da corrida está em andamento. "
        "Os resultados oficiais serão exibidos assim que forem publicados."
    ),
    STATE_PENDING: (
        "A corrida já terminou, mas a fonte ainda não publicou os resultados finais. "
        "Esta página será atualizada automaticamente."
    ),
    STATE_UNAVAILABLE: "A fonte de dados não disponibiliza resultados para esta corrida.",
}

_lock = threading.Lock()
_state = {"last_attempt": 0.0, "running": False}
_race_attempts = {}


def _as_date(value):
    if isinstance(value, datetime):
        return value.date()
    return value


# ==============================================================================
# GAP-04: GOVERNANÇA DE ESTADOS DE RESULTADO (PROVISIONAL, OFFICIAL, CORRECTED)
# ==============================================================================

RESULT_STATUS_PROVISIONAL = "PROVISIONAL"
RESULT_STATUS_OFFICIAL = "OFFICIAL"
RESULT_STATUS_CORRECTED = "CORRECTED"

VALID_RESULT_STATUSES = {
    RESULT_STATUS_PROVISIONAL,
    RESULT_STATUS_OFFICIAL,
    RESULT_STATUS_CORRECTED,
}

VALID_STATUS_TRANSITIONS = {
    None: {RESULT_STATUS_PROVISIONAL, RESULT_STATUS_OFFICIAL, RESULT_STATUS_CORRECTED},
    RESULT_STATUS_PROVISIONAL: {RESULT_STATUS_OFFICIAL, RESULT_STATUS_CORRECTED},
    RESULT_STATUS_OFFICIAL: {RESULT_STATUS_CORRECTED},
    RESULT_STATUS_CORRECTED: {RESULT_STATUS_CORRECTED},
}


class IllegalStateRegressionError(ValueError):
    """Tentativa de regressão de estado de resultado sem homologação formal."""
    pass


def validate_status_transition(current_status, new_status):
    """Valida se a transição entre estados de resultado é permitida pela governança FIA.
    Impede expressamente a regressão de OFFICIAL/CORRECTED para PROVISIONAL.
    """
    if current_status is None:
        return True
    c_norm = str(current_status).strip().upper() if current_status else None
    n_norm = str(new_status).strip().upper() if new_status else None
    allowed = VALID_STATUS_TRANSITIONS.get(c_norm, set())
    if n_norm not in allowed:
        raise IllegalStateRegressionError(
            f"Regressão de estado ilegal: não é permitido transitar de {c_norm} para {n_norm}."
        )
    return True


def determine_result_status(
    race_date,
    has_results,
    today=None,
    current_status=None,
    explicit_status=None,
    is_steward_amendment=False,
    provider_status=None,
    return_details=False,
):
    """Determina o estado de resultado (PROVISIONAL, OFFICIAL, CORRECTED).

    NOTA REGULAMENTAR (OP-06.40):
    A inferência para corridas com mais de 3 dias é uma heurística operacional interna
    do sistema para saneamento de arquivos históricos, e NÃO uma regra normativa da FIA.
    O sistema distingue explicitamente estados confirmados pela fonte/comissários
    daqueles inferidos por decurso de prazo.
    """
    if not has_results:
        return (None, False) if return_details else None

    if explicit_status:
        st = str(explicit_status).strip().upper()
        if st in VALID_RESULT_STATUSES:
            validate_status_transition(current_status, st)
            return (st, True) if return_details else st

    if is_steward_amendment or (current_status and str(current_status).strip().upper() == RESULT_STATUS_CORRECTED):
        return (RESULT_STATUS_CORRECTED, True) if return_details else RESULT_STATUS_CORRECTED

    today = _as_date(today) or date.today()
    race_d = _as_date(race_date)

    if provider_status:
        p_norm = str(provider_status).strip().upper()
        if p_norm in VALID_RESULT_STATUSES:
            validate_status_transition(current_status, p_norm)
            return (p_norm, True) if return_details else p_norm

    # Heurística operacional do software para arquivo histórico (NÃO é regra normativa FIA)
    if race_d and today > race_d + timedelta(days=3):
        return (RESULT_STATUS_OFFICIAL, False) if return_details else RESULT_STATUS_OFFICIAL

    if current_status:
        c_norm = str(current_status).strip().upper()
        if c_norm in {RESULT_STATUS_OFFICIAL, RESULT_STATUS_CORRECTED}:
            return (c_norm, True) if return_details else c_norm

    return (RESULT_STATUS_PROVISIONAL, False) if return_details else RESULT_STATUS_PROVISIONAL


def race_results_state(
    race_date,
    has_results,
    today=None,
    status=None,
    source=None,
    updated_at=None,
    current_status=None,
    is_steward_amendment=False,
    provider_status=None,
    race=None,
    extended=False,
):
    """Classifica os resultados de uma corrida.

    Retorna ``{"state", "final", "status", "source", "status_confirmed", "status_inferred", "updated_at", "message"}``.
    ``final`` só é verdadeiro quando existem resultados no banco E o status for OFFICIAL ou CORRECTED.
    """
    today = _as_date(today) or date.today()
    race_date = _as_date(race_date)
    if race_date is None and race is not None:
        race_date = _as_date(getattr(race, "date", None))

    if has_results:
        state = STATE_AVAILABLE
    elif race_date is None:
        state = STATE_UNAVAILABLE
    elif today < race_date:
        state = STATE_UPCOMING
    elif today < race_date + timedelta(days=WEEKEND_DAYS):
        state = STATE_IN_PROGRESS
    elif today <= race_date + timedelta(days=PENDING_WINDOW_DAYS):
        state = STATE_PENDING
    else:
        state = STATE_UNAVAILABLE

    result_status = None
    is_confirmed = False
    if has_results:
        if status:
            result_status = str(status).strip().upper()
            is_confirmed = True
        else:
            result_status, is_confirmed = determine_result_status(
                race_date,
                has_results,
                today=today,
                current_status=current_status,
                is_steward_amendment=is_steward_amendment,
                provider_status=provider_status,
                return_details=True,
            )

    is_final = bool(has_results and result_status in {RESULT_STATUS_OFFICIAL, RESULT_STATUS_CORRECTED})

    ret = {
        "state": state,
        "final": is_final,
        "message": _MESSAGES[state],
    }
    if extended:
        ret["status"] = result_status
        ret["source"] = source or ("jolpica" if has_results else None)
        ret["status_confirmed"] = is_confirmed
        ret["status_inferred"] = not is_confirmed if has_results else False
        ret["updated_at"] = updated_at or (datetime.now(timezone.utc).isoformat() if has_results else None)
    return ret


def pending_races(today=None, series="f1", season=None):
    """Corridas cuja data ja chegou, dentro da janela, que ainda nao tem resultados."""
    today = _as_date(today) or date.today()
    latest = today
    earliest = today - timedelta(days=PENDING_WINDOW_DAYS)
    query = Race.query.filter(
        Race.series == series,
        (Race.round.is_(None)) | (Race.round > 0),
        Race.date.isnot(None),
        Race.date <= latest,
        Race.date >= earliest,
        ~exists().where((RaceResult.race_id == Race.id) & (RaceResult.status != "Dummy")),
    )
    if season:
        query = query.filter(Race.season == season)
    return query.order_by(Race.date).all()


def _championship_meetings_for_series(series, season):
    """Retorna apenas as etapas oficiais do campeonato (exclui testes/pré-temporada)."""
    from .f2_f3_data import get_series_meetings

    meetings = [
        m
        for m in get_series_meetings(series, season)
        if not m.get("is_testing") and (m.get("round") or 0) > 0
    ]
    meetings.sort(key=lambda m: (m.get("round") or 0, m.get("date_start") or ""))
    return meetings


def season_progress(season, series="f1", today=None, scraped_rows=None):
    """Corridas com resultados, total de etapas do campeonato e se ha resultados pendentes.

    Regras:
    - Exclui sessoes de teste / pre-temporada (`round <= 0` ou `is_testing == True`).
    - Nunca conta uma corrida como concluida apenas porque sua data passou.
    - Para F1 (ou series com corridas no banco), conta `Race` com `RaceResult` oficial.
    - Para F2/F3 baseadas no calendario canonico e na classificacao oficial da FIA,
      usa `completed_races` confirmado pelos resultados publicados na fonte e sinaliza
      `pending_results=True` quando uma etapa ja realizada dentro da janela ainda nao
      teve seus resultados refletidos na classificacao.
    """
    norm_series = (series or "f1").lower()
    today_d = _as_date(today) or date.today()

    from flask import has_app_context

    db_total = 0
    base_q = None
    if has_app_context():
        base_q = db.session.query(Race.id).filter(
            Race.series == norm_series,
            (Race.round.is_(None)) | (Race.round > 0),
        )
        if season:
            base_q = base_q.filter(Race.season == season)
        db_total = base_q.count()

    if norm_series == "f1" or db_total > 0:
        completed = (
            base_q.filter(
                exists().where((RaceResult.race_id == Race.id) & (RaceResult.status != "Dummy"))
            ).count()
            if base_q is not None
            else 0
        )
        pending = (
            bool(pending_races(today=today_d, series=norm_series, season=season))
            if base_q is not None
            else False
        )
        return {
            "completed_races": completed,
            "total_races": db_total,
            "pending_results": pending,
        }

    if norm_series in ("f2", "f3"):
        target_season = season or 2026
        meetings = _championship_meetings_for_series(norm_series, target_season)
        total = len(meetings)
        if total == 0:
            return {
                "completed_races": 0,
                "total_races": 0,
                "pending_results": False,
            }

        rows = scraped_rows
        if rows is None:
            from .scraper import get_standings

            rows = get_standings(norm_series, "team") or get_standings(norm_series, "driver")

        completed = max((int(r.get("races") or 0) for r in (rows or [])), default=0)
        completed = max(0, min(completed, total))

        pending = False
        for idx, m in enumerate(meetings, start=1):
            if idx <= completed:
                continue
            start_str = (m.get("date_start") or "")[:10]
            end_str = (m.get("date_end") or start_str)[:10]
            if not start_str:
                continue
            try:
                start_d = date.fromisoformat(start_str)
                end_d = date.fromisoformat(end_str) if end_str else start_d
            except ValueError:
                continue
            if start_d <= today_d <= end_d + timedelta(days=PENDING_WINDOW_DAYS):
                pending = True
                break

        return {
            "completed_races": completed,
            "total_races": total,
            "pending_results": pending,
        }

    return {
        "completed_races": 0,
        "total_races": 0,
        "pending_results": False,
    }


# --- importacao leve de resultados pendentes (Jolpica + fallback OpenF1) -----


def _resolve_driver(row, season):
    """Reaproveita o piloto ja cadastrado na temporada (por codigo) antes de criar outro."""
    from .sync import _upsert_ergast_row, _upsert_team

    code = (row.get("Driver") or {}).get("code")
    constructor = (row.get("Constructor") or {}).get("name")
    if code:
        match = (
            Driver.query.join(RaceResult, RaceResult.driver_id == Driver.id)
            .join(Race, RaceResult.race_id == Race.id)
            .filter(
                Race.season == season,
                Race.series == "f1",
                Driver.code == code,
            )
            .first()
        )
        if match is not None:
            team = _upsert_team(constructor) if constructor else None
            return match, team
    return _upsert_ergast_row(row)


def _invalidate_progress_caches():
    """Invalida caches em memória após importação de resultados."""
    try:
        from . import cache as app_cache

        app_cache.clear()
    except Exception:  # noqa: BLE001
        pass


def _import_from_openf1(
    race=None,
    fencing_context=None,
    *,
    race_id=None,
    season=None,
    round_number=None,
    race_date=None,
    race_name=None,
    race_series=None,
):
    """Fallback via OpenF1 para corridas de 2023+ quando a Jolpica ainda nao publicou."""
    if race is not None:
        race_id = race_id or int(race.id)
        season = season or int(race.season)
        round_number = round_number or int(race.round)
        race_date = race_date or race.date
        race_name = race_name or str(race.name)
        race_series = race_series or str(race.series or "f1")

    if season is None or season < 2023 or race_date is None:
        return False
    from . import openf1
    from .sync import _now_utc, _parse_dt, _sync_race

    # R01-03: Desacoplamento de I/O externo - garante sessao limpa sem transacao aberta no PgBouncer
    db.session.rollback()

    meetings = openf1.get("meetings", year=season) or []
    gps = [
        m
        for m in meetings
        if str(m.get("meeting_name", "")).endswith("Grand Prix")
        and not m.get("is_cancelled")
    ]
    gps.sort(key=lambda m: m["date_start"])
    target_meeting = None
    for m in gps:
        try:
            m_start = _parse_dt(m["date_start"]).date()
        except Exception:  # noqa: BLE001
            continue
        if abs((m_start - race_date).days) <= 4:
            target_meeting = m
            break
    if target_meeting is None:
        return False

    sessions = (
        openf1.get(
            "sessions",
            meeting_key=target_meeting["meeting_key"],
            session_type="Race",
        )
        or []
    )
    race_session = next(
        (s for s in sessions if s.get("session_name") == "Race"),
        None,
    )
    now = _now_utc()
    if race_session is None or _parse_dt(race_session["date_end"]) > now:
        return False

    if fencing_context is None and os.environ.get("F1_SERVERLESS") == "1":
        from .sync_lease import FencingContextRequiredError
        raise FencingContextRequiredError("Escrita de fallback em Serverless exige fencing_context.")

    ok = _sync_race(
        race_session,
        target_meeting,
        season,
        round_number,
        True,
        sessions,
        now,
        fencing_context=fencing_context,
        target_race_id=race_id,
        preserve_name=race_name,
        preserve_date=race_date,
    )
    if ok:
        _invalidate_progress_caches()
    return bool(ok)


def is_results_payload_identical(existing_results, rows, season, race_id=None):
    """Compara de forma estrita e multidimensional se o payload recebido é 100% idêntico
    aos resultados já persistidos (GAP-06), verificando:
    - race_id
    - driver_id
    - position
    - points (tolerância 0.001)
    - laps
    - status textual normalizado
    - fastest_lap
    - grid
    Qualquer alteração em voltas (laps), status, pontos ou posição resulta em False (re-escrita necessária).
    """
    if not existing_results or not rows:
        return False

    if len(existing_results) != len(rows):
        return False

    from .sync import _int_or_none, normalize_race_classification

    winner_laps = next(
        (
            _int_or_none(r.get("laps"))
            for r in rows
            if _int_or_none(r.get("position")) == 1 and _int_or_none(r.get("laps"))
        ),
        None,
    )

    existing_by_driver = {}
    for r in existing_results:
        if race_id is not None and r.race_id != race_id:
            return False
        if r.driver_id in existing_by_driver:
            return False  # duplicata no banco existente
        existing_by_driver[r.driver_id] = r

    for row in rows:
        driver, _team = _resolve_driver(row, season)
        if driver is None or driver.id not in existing_by_driver:
            return False

        r = existing_by_driver[driver.id]

        norm = normalize_race_classification(
            row.get("status"),
            position=row.get("position"),
            position_text=row.get("positionText"),
            laps=row.get("laps"),
            winner_laps=winner_laps,
            has_finish_time=bool((row.get("Time") or {}).get("time") or (row.get("Time") or {}).get("millis")),
        )

        # 1. Posição
        expected_pos = norm["position"]
        if r.position != expected_pos:
            return False

        # 2. Pontos (precisão 0.001)
        expected_pts = float(row.get("points") or 0.0)
        if abs(r.points - expected_pts) > 0.001:
            return False

        # 3. Voltas (GAP-06: alteração de laps deve invalidar idempotência)
        expected_laps = _int_or_none(row.get("laps"))
        if r.laps != expected_laps:
            return False

        # 4. Status textual normalizado (GAP-06: alteração de status textual)
        existing_status = str(r.status or "").strip().lower()
        new_status = str(norm["status"] or "").strip().lower()
        if existing_status != new_status:
            return False

        # 5. Grid
        expected_grid = _int_or_none(row.get("grid"))
        if r.grid != expected_grid:
            return False

        # 6. Fastest Lap
        expected_fl = (row.get("FastestLap") or {}).get("rank") == "1"
        if bool(r.fastest_lap) != bool(expected_fl):
            return False

    return True


def import_results_for_race(race, fencing_context=None, fencing_token=None, lease_id="f1_sync", worker_uuid=None, timeout=None):
    """Importa apenas os resultados de uma corrida ja cadastrada. Retorna True se importou.
    Garante persistencia atomica sob atomic_sync_write e desacoplamento de I/O externo.
    """
    from . import ergast
    from .sync import (
        _int_or_none,
        _store_sprint_points,
        normalize_race_classification,
        validate_race_points,
    )

    # Normalizacao do fencing_context
    if fencing_context is None and fencing_token is not None:
        fencing_context = {
            "lease_id": lease_id,
            "worker_uuid": worker_uuid or "legacy_worker",
            "fencing_token": fencing_token,
        }

    # PASSO 1: Extração obrigatória de primitivos ANTES de tocar na sessão
    if isinstance(race, dict):
        race_id = race["id"]
        season = race["season"]
        round_number = race["round"]
        race_date = race["date"]
        race_name = race["name"]
        race_series = race["series"]
    else:
        race_id = int(race.id)
        season = int(race.season)
        round_number = int(race.round)
        race_date = race.date
        race_name = str(race.name)
        race_series = str(race.series or "f1")

    # PASSO 2: Rollback e devolução da conexão física ao PgBouncer
    db.session.rollback()

    entries = None
    try:
        if timeout is not None:
            try:
                entries = ergast.get(f"{season}/{round_number}/results", timeout=timeout)
            except TypeError:
                entries = ergast.get(f"{season}/{round_number}/results")
        else:
            entries = ergast.get(f"{season}/{round_number}/results")
    except Exception:  # noqa: BLE001
        entries = None

    if not entries:
        try:
            return _import_from_openf1(
                race=None,
                fencing_context=fencing_context,
                race_id=race_id,
                season=season,
                round_number=round_number,
                race_date=race_date,
                race_name=race_name,
                race_series=race_series,
            )
        except Exception:
            db.session.rollback()
            raise

    entry = entries[0]
    try:
        entry_date = date.fromisoformat(entry["date"])
    except (KeyError, ValueError):
        return False
    # Protecao contra associar resultados a corrida errada.
    if race_date is None or abs((entry_date - race_date).days) > 4:
        return False
    rows = entry.get("Results") or []
    if not rows:
        return False

    # Idempotência ampliada (GAP-06): se resultados existentes forem idênticos aos novos, evita re-escrita
    existing_results = RaceResult.query.filter_by(race_id=race_id).all()
    if existing_results and len(existing_results) == len(rows):
        if is_results_payload_identical(existing_results, rows, season, race_id=race_id):
            db.session.rollback()
            return True

    winner_laps = next(
        (
            _int_or_none(r.get("laps"))
            for r in rows
            if _int_or_none(r.get("position")) == 1 and _int_or_none(r.get("laps"))
        ),
        None,
    )

    # Validação esportiva independente de pontuação FIA 2026 (GAP-03)
    scheduled_laps = None
    try:
        race_obj = db.session.get(Race, race_id)
        if race_obj and race_obj.circuit:
            scheduled_laps = race_obj.circuit.laps
    except Exception:
        pass
    validate_race_points(rows, scheduled_laps=scheduled_laps, winner_laps=winner_laps)

    # I/O para sprint executado FORA da transação de persistência
    raw_sprint_rows = []
    if season >= 2021:
        db.session.rollback()
        try:
            if timeout is not None:
                try:
                    sprint = ergast.get(f"{season}/{round_number}/sprint", timeout=timeout)
                except TypeError:
                    sprint = ergast.get(f"{season}/{round_number}/sprint")
            else:
                sprint = ergast.get(f"{season}/{round_number}/sprint")
            raw_sprint_rows = (sprint[0].get("SprintResults") if sprint else None) or []
        except Exception:  # noqa: BLE001 - sprint e opcional
            raw_sprint_rows = []

    # PERSISTÊNCIA ATÔMICA PROTEGIDA (R01-01, R01-02, R01-03)
    if fencing_context is not None:
        from .sync_lease import atomic_sync_write
        l_id = fencing_context.get("lease_id", "f1_sync")
        w_uuid = fencing_context.get("worker_uuid")
        f_token = fencing_context.get("fencing_token")

        with atomic_sync_write(l_id, w_uuid, f_token):
            RaceResult.query.filter_by(race_id=race_id).delete()
            seen = set()
            for row in rows:
                driver, team = _resolve_driver(row, season)
                if driver.id in seen:
                    continue
                seen.add(driver.id)
                norm = normalize_race_classification(
                    row.get("status"),
                    position=row.get("position"),
                    position_text=row.get("positionText"),
                    laps=row.get("laps"),
                    winner_laps=winner_laps,
                    has_finish_time=bool(
                        (row.get("Time") or {}).get("time")
                        or (row.get("Time") or {}).get("millis")
                    ),
                    series=race_series,
                )
                db.session.add(
                    RaceResult(
                        race_id=race_id,
                        driver_id=driver.id,
                        team_id=team.id if team else driver.team_id,
                        position=norm["position"],
                        points=float(row.get("points") or 0),
                        grid=_int_or_none(row.get("grid")),
                        laps=_int_or_none(row.get("laps")),
                        status=norm["status"],
                        fastest_lap=(row.get("FastestLap") or {}).get("rank") == "1",
                    )
                )
            if raw_sprint_rows:
                sprint_entries = []
                for row in raw_sprint_rows:
                    points = float(row.get("points") or 0)
                    if points <= 0:
                        continue
                    driver, _team = _resolve_driver(row, season)
                    sprint_entries.append((driver, points, _int_or_none(row.get("laps"))))
                if sprint_entries:
                    _store_sprint_points(race_id, sprint_entries, fencing_context=fencing_context)

        _invalidate_progress_caches()
        return True
    else:
        if os.environ.get("F1_SERVERLESS") == "1":
            from .sync_lease import FencingContextRequiredError
            raise FencingContextRequiredError("Escrita de resultados em Serverless exige fencing_context.")

        RaceResult.query.filter_by(race_id=race_id).delete()
        seen = set()
        for row in rows:
            driver, team = _resolve_driver(row, season)
            if driver.id in seen:
                continue
            seen.add(driver.id)
            norm = normalize_race_classification(
                row.get("status"),
                position=row.get("position"),
                position_text=row.get("positionText"),
                laps=row.get("laps"),
                winner_laps=winner_laps,
                has_finish_time=bool(
                    (row.get("Time") or {}).get("time")
                    or (row.get("Time") or {}).get("millis")
                ),
                series=race_series,
            )
            db.session.add(
                RaceResult(
                    race_id=race_id,
                    driver_id=driver.id,
                    team_id=team.id if team else driver.team_id,
                    position=norm["position"],
                    points=float(row.get("points") or 0),
                    grid=_int_or_none(row.get("grid")),
                    laps=_int_or_none(row.get("laps")),
                    status=norm["status"],
                    fastest_lap=(row.get("FastestLap") or {}).get("rank") == "1",
                )
            )
        if raw_sprint_rows:
            sprint_entries = []
            for row in raw_sprint_rows:
                points = float(row.get("points") or 0)
                if points <= 0:
                    continue
                driver, _team = _resolve_driver(row, season)
                sprint_entries.append((driver, points, _int_or_none(row.get("laps"))))
            if sprint_entries:
                try:
                    _store_sprint_points(race_id, sprint_entries)
                except Exception:
                    db.session.rollback()
        db.session.commit()
        _invalidate_progress_caches()
        return True


_contingency_attempts = {}


def ensure_race_results(race, app, today=None, now=None, timeout=4.0):
    """Tenta importar sincronamente os resultados de uma corrida encerrada sem dados.

    Usado pelo endpoint de detalhes/resultados da corrida para que, ao clicar na
    ultima corrida realizada no calendario, os resultados ja aparecam na primeira
    resposta quando a fonte ja os publicou. Possui cooldown por corrida para evitar
    requisicoes duplicadas quando os resultados ainda estao pendentes.
    Suporta ambientes tradicionais e serverless sob proteção de Lease Lock e Fencing Token.
    """
    if race is None or (race.series or "f1") != "f1" or not _refresh_enabled(app):
        return False
    if RaceResult.query.filter_by(race_id=race.id).first() is not None:
        return True
    today = _as_date(today) or date.today()
    race_date = _as_date(race.date)
    if race_date is None or race_date > today:
        return False
    if today > race_date + timedelta(days=PENDING_WINDOW_DAYS):
        return False

    moment = time.time() if now is None else now
    with _lock:
        last = _race_attempts.get(race.id, 0.0)
        if moment - last < RACE_REFRESH_COOLDOWN_SECONDS:
            return False
        _race_attempts[race.id] = moment

    if os.environ.get("F1_SERVERLESS") == "1":
        try:
            from .sync_lease import acquire_lease, release_lease
            lease = acquire_lease(lease_id="f1_sync", ttl_seconds=60)
        except Exception as exc:
            logger.warning("Falha ao obter lease em maybe_refresh_pending_results: %s", exc)
            return False
        if not lease or not lease.get("acquired"):
            return False
        w_uuid = lease["worker_uuid"]
        f_token = lease["fencing_token"]
        f_ctx = {
            "lease_id": "f1_sync",
            "worker_uuid": w_uuid,
            "fencing_token": f_token,
        }
        success = False
        try:
            res = bool(import_results_for_race(
                race,
                fencing_context=f_ctx,
                fencing_token=f_token,
                lease_id="f1_sync",
                worker_uuid=w_uuid,
                timeout=timeout,
            ))
            success = res
            return res
        except Exception:
            db.session.rollback()
            return False
        finally:
            try:
                release_lease(
                    "f1_sync",
                    w_uuid,
                    f_token,
                    status="completed" if success else "failed",
                    success=success,
                )
            except Exception:
                db.session.rollback()

    try:
        return bool(import_results_for_race(race, timeout=timeout))
    except Exception:  # noqa: BLE001
        db.session.rollback()
        return False


def contingency_refresh_pending_standings(app=None, season=None, series="f1", timeout=4.0, cooldown=300, today=None, now=None):
    """Contingência síncrona sob demanda com Lease Lock, Fencing Token e Fail-Soft para Serverless (OP-06.70 / Alternativa C).

    Acionada quando os endpoints de classificação ou corridas detectam etapas pendentes.
    Garante:
    1. Lease Lock atômico com Fencing Token via `cron_sync_lease` (previne concorrência e processos duplicados).
    2. Cooldown estrito de 300 segundos por etapa (impede sobrecarga nas fontes externas e repetição em renderizações).
    3. Timeout estrito de 4.0 segundos com fail-soft (nunca trava a Home).
    4. Idempotência absoluta via `is_results_payload_identical` e `atomic_sync_write`.
    5. Rollback limpo e liberação do lease em caso de falha/timeout sem corromper transações.
    """
    norm_series = (series or "f1").lower()
    if norm_series != "f1":
        return False

    if app is not None and not _refresh_enabled(app):
        return False

    pending = pending_races(today=today, series=norm_series, season=season)
    if not pending:
        return False

    race = pending[0]
    race_id = int(race.id)

    moment = time.time() if now is None else now
    with _lock:
        last = _contingency_attempts.get(race_id, 0.0)
        if moment - last < cooldown:
            return False
        _contingency_attempts[race_id] = moment

    try:
        from .sync_lease import acquire_lease, release_lease
        lease = acquire_lease(lease_id="f1_sync", ttl_seconds=60)
    except Exception as exc:
        logger.warning("Falha na infraestrutura de lease lock durante contingência: %s", exc)
        return False

    if not lease or not lease.get("acquired"):
        return False

    worker_uuid = lease["worker_uuid"]
    fencing_token = lease["fencing_token"]
    fencing_context = {
        "lease_id": "f1_sync",
        "worker_uuid": worker_uuid,
        "fencing_token": fencing_token,
    }

    success = False
    status_str = "failed"
    try:
        race_item = {
            "id": race_id,
            "season": int(race.season),
            "round": int(race.round),
            "date": race.date,
            "name": str(race.name),
            "series": str(race.series or "f1"),
        }
        imported = import_results_for_race(
            race_item,
            fencing_context=fencing_context,
            fencing_token=fencing_token,
            lease_id="f1_sync",
            worker_uuid=worker_uuid,
            timeout=timeout,
        )
        if imported:
            success = True
            status_str = "completed"
            return True
        return False
    except Exception:
        db.session.rollback()
        status_str = "failed_exception"
        return False
    finally:
        try:
            release_lease(
                "f1_sync",
                worker_uuid,
                fencing_token,
                status=status_str,
                success=success,
            )
        except Exception:
            db.session.rollback()


def refresh_pending_results(today=None):
    """Importa os resultados das corridas pendentes. Retorna quantas foram importadas."""
    imported = 0
    for race in pending_races(today=today):
        try:
            if import_results_for_race(race):
                imported += 1
        except Exception:  # noqa: BLE001 - fonte indisponivel: tenta no proximo ciclo
            db.session.rollback()
    return imported


def _refresh_enabled(app):
    if app and app.config.get("FORCE_SYNC_REFRESH"):
        return True
    return not (app and app.config.get("TESTING"))


def _run_refresh(app):
    try:
        with app.app_context():
            refresh_pending_results()
    except Exception:  # noqa: BLE001
        pass
    finally:
        with _lock:
            _state["running"] = False


def refresh_pending_results_synchronous(today=None, fencing_context=None, fencing_token=None, lease_id="f1_sync", worker_uuid=None):
    """Importa resultados pendentes de forma sincrona protegida por fencing token e heartbeat cooperativo (R01-04).

    Retorna dict com métricas de importação.
    """
    from .sync_lease import renew_lease, validate_fencing_token, ZombieWorkerError

    if fencing_context is None:
        fencing_context = {
            "lease_id": lease_id,
            "worker_uuid": worker_uuid or "legacy_worker",
            "fencing_token": fencing_token,
        }
    else:
        lease_id = fencing_context.get("lease_id", lease_id)
        worker_uuid = fencing_context.get("worker_uuid", worker_uuid)
        fencing_token = fencing_context.get("fencing_token", fencing_token)

    if fencing_token is not None:
        validate_fencing_token(lease_id, fencing_token)

    pending = pending_races(today=today)
    # Extração antecipada de escalares primitivos para desacoplar totalmente do ORM
    pending_items = [
        {
            "id": int(r.id),
            "season": int(r.season),
            "round": int(r.round),
            "date": r.date,
            "name": str(r.name),
            "series": str(r.series or "f1"),
        }
        for r in pending
    ]
    db.session.rollback()

    imported = 0
    skipped = 0
    last_heartbeat_mono = time.monotonic()

    for race_item in pending_items:
        # R01-04: Heartbeat cooperativo a cada 45 segundos durante execuções longas
        now_mono = time.monotonic()
        if worker_uuid and fencing_token is not None and (now_mono - last_heartbeat_mono >= 45.0):
            renewed = renew_lease(lease_id, worker_uuid, fencing_token, ttl_seconds=180)
            if not renewed:
                raise ZombieWorkerError(
                    f"Falha ao renovar lease '{lease_id}': lease expirado ou revogado durante o processamento."
                )
            last_heartbeat_mono = now_mono

        try:
            if import_results_for_race(race_item, fencing_context=fencing_context, fencing_token=fencing_token, lease_id=lease_id, worker_uuid=worker_uuid):
                imported += 1
            else:
                skipped += 1
        except Exception:
            db.session.rollback()
            raise

    return {
        "imported_count": imported,
        "skipped_count": skipped,
        "pending_count": len(pending_items),
    }


def maybe_refresh_pending_results(app, season=None, series="f1", now=None):
    """Dispara (com throttle) a importacao de corridas pendentes em background.

    Chamado pelos endpoints de resultados/classificacao quando detectam uma
    corrida encerrada sem resultados. Retorna True se uma atualizacao foi iniciada.
    """
    import os
    if os.environ.get("F1_SERVERLESS") == "1" or os.environ.get("NO_BACKGROUND_SYNC") == "1":
        return False
    if series != "f1" or not _refresh_enabled(app):
        return False
    if not pending_races(season=season):
        return False
    moment = time.time() if now is None else now
    with _lock:
        if _state["running"] or moment - _state["last_attempt"] < REFRESH_THROTTLE_SECONDS:
            return False
        _state["running"] = True
        _state["last_attempt"] = moment
    threading.Thread(
        target=_run_refresh,
        args=(app._get_current_object() if hasattr(app, "_get_current_object") else app,),
        daemon=True,
        name="pending-results-refresh",
    ).start()
    return True


def reset_throttle():
    """Uso em testes."""
    with _lock:
        _state["last_attempt"] = 0.0
        _state["running"] = False
        _race_attempts.clear()
        _contingency_attempts.clear()


__all__ = [
    "race_results_state",
    "pending_races",
    "season_progress",
    "import_results_for_race",
    "ensure_race_results",
    "refresh_pending_results",
    "refresh_pending_results_synchronous",
    "maybe_refresh_pending_results",
    "contingency_refresh_pending_standings",
    "reset_throttle",
    "RESULT_STATUS_PROVISIONAL",
    "RESULT_STATUS_OFFICIAL",
    "RESULT_STATUS_CORRECTED",
    "VALID_RESULT_STATUSES",
    "VALID_STATUS_TRANSITIONS",
    "IllegalStateRegressionError",
    "validate_status_transition",
    "determine_result_status",
    "is_results_payload_identical",
]
