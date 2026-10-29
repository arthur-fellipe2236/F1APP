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

import threading
import time
from datetime import date, datetime, timedelta

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


def race_results_state(race_date, has_results, today=None):
    """Classifica os resultados de uma corrida.

    Retorna ``{"state", "final", "message"}``. ``final`` so e verdadeiro quando
    existem resultados no banco.
    """
    today = _as_date(today) or date.today()
    race_date = _as_date(race_date)
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
    return {
        "state": state,
        "final": state == STATE_AVAILABLE,
        "message": _MESSAGES[state],
    }


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


def _import_from_openf1(race):
    """Fallback via OpenF1 para corridas de 2023+ quando a Jolpica ainda nao publicou."""
    if race.season < 2023 or race.date is None:
        return False
    from . import openf1
    from .sync import _now_utc, _parse_dt, _sync_race

    meetings = openf1.get("meetings", year=race.season) or []
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
        if abs((m_start - race.date).days) <= 4:
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
    saved_name = race.name
    saved_date = race.date
    ok = _sync_race(
        race_session,
        target_meeting,
        race.season,
        race.round,
        True,
        sessions,
        now,
    )
    if ok:
        # Preserva nome e data ja cadastrados na corrida
        race.name = saved_name
        race.date = saved_date
        db.session.commit()
        _invalidate_progress_caches()
    return bool(ok)


def import_results_for_race(race):
    """Importa apenas os resultados de uma corrida ja cadastrada. Retorna True se importou."""
    from . import ergast
    from .sync import (
        _ergast_status,
        _int_or_none,
        _store_sprint_points,
    )

    entries = None
    try:
        entries = ergast.get(f"{race.season}/{race.round}/results")
    except Exception:  # noqa: BLE001
        entries = None

    if not entries:
        try:
            return _import_from_openf1(race)
        except Exception:  # noqa: BLE001
            db.session.rollback()
            return False

    entry = entries[0]
    try:
        entry_date = date.fromisoformat(entry["date"])
    except (KeyError, ValueError):
        return False
    # Protecao contra associar resultados a corrida errada.
    if race.date is None or abs((entry_date - race.date).days) > 4:
        return False
    rows = entry.get("Results") or []
    if not rows:
        return False

    RaceResult.query.filter_by(race_id=race.id).delete()
    seen = set()
    for row in rows:
        driver, team = _resolve_driver(row, race.season)
        if driver.id in seen:
            continue
        seen.add(driver.id)
        db.session.add(
            RaceResult(
                race_id=race.id,
                driver_id=driver.id,
                team_id=team.id if team else driver.team_id,
                position=_int_or_none(row.get("position")),
                points=float(row.get("points") or 0),
                grid=_int_or_none(row.get("grid")),
                laps=_int_or_none(row.get("laps")),
                status=_ergast_status(row.get("status")),
                fastest_lap=(row.get("FastestLap") or {}).get("rank") == "1",
            )
        )
    db.session.commit()

    if race.season >= 2021:
        try:
            sprint = ergast.get(f"{race.season}/{race.round}/sprint")
            sprint_entries = []
            for row in (sprint[0].get("SprintResults") if sprint else None) or []:
                points = float(row.get("points") or 0)
                if points <= 0:
                    continue
                driver, _team = _resolve_driver(row, race.season)
                sprint_entries.append((driver, points, _int_or_none(row.get("laps"))))
            if sprint_entries:
                _store_sprint_points(race.id, sprint_entries)
        except Exception:  # noqa: BLE001 - sprint e opcional
            db.session.rollback()
    _invalidate_progress_caches()
    return True


def ensure_race_results(race, app, today=None, now=None):
    """Tenta importar sincronamente os resultados de uma corrida encerrada sem dados.

    Usado pelo endpoint de detalhes/resultados da corrida para que, ao clicar na
    ultima corrida realizada no calendario, os resultados ja aparecam na primeira
    resposta quando a fonte ja os publicou. Possui cooldown por corrida para evitar
    requisicoes duplicadas quando os resultados ainda estao pendentes.
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

    try:
        return bool(import_results_for_race(race))
    except Exception:  # noqa: BLE001
        db.session.rollback()
        return False


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
    return not app.config.get("TESTING")


def _run_refresh(app):
    try:
        with app.app_context():
            refresh_pending_results()
    except Exception:  # noqa: BLE001
        pass
    finally:
        with _lock:
            _state["running"] = False


def maybe_refresh_pending_results(app, season=None, series="f1", now=None):
    """Dispara (com throttle) a importacao de corridas pendentes em background.

    Chamado pelos endpoints de resultados/classificacao quando detectam uma
    corrida encerrada sem resultados. Retorna True se uma atualizacao foi iniciada.
    """
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


__all__ = [
    "race_results_state",
    "pending_races",
    "season_progress",
    "import_results_for_race",
    "ensure_race_results",
    "refresh_pending_results",
    "maybe_refresh_pending_results",
    "reset_throttle",
]
