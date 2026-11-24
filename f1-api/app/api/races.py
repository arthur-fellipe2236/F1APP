from datetime import date, datetime, timedelta, timezone

import requests
from flask import Blueprint, current_app, jsonify, request
from ..models import SeriesState

from sqlalchemy import desc

from .. import f1site, openf1, schedule
from ..extensions import db
from ..models import Race, RaceResult
from .. import cache as app_cache
from ..results_refresh import (
    ensure_race_results,
    maybe_refresh_pending_results,
    race_results_state,
    season_progress,
)
from .helpers import ApiError, get_or_404, paginate, parse_int, parse_season_arg, pagination_args
from .live import session_state
from ..f2_f3_data import get_series_meetings, get_series_sessions, get_series_session_by_key

bp = Blueprint("races", __name__)

NEXT_RACE_TTL = 300

def _meeting_to_race_dict(m, series):
    return {
        "id": m.get("meeting_key"),
        "season": m.get("year", 2026),
        "series": series,
        "round": m.get("round", 0),
        "name": m.get("meeting_name"),
        "date": m["date_start"][:10] if m.get("date_start") else None,
        "circuit_id": None,
        "circuit_name": m.get("circuit_short_name"),
        "circuit_country": m.get("country_name"),
        "is_testing": bool(m.get("is_testing", False)),
    }

def _next_race_f2_f3_payload(series: str):
    now = datetime.now(timezone.utc)
    meetings = get_series_meetings(series, 2026)
    upcoming_meeting = None
    for m in meetings:
        end_dt = _parse_dt(m["date_end"])
        if end_dt > now:
            upcoming_meeting = m
            break

    if upcoming_meeting:
        sessions_payload = []
        for s in upcoming_meeting.get("sessions", []):
            s_start = _parse_dt(s["date_start"])
            s_end = _parse_dt(s.get("date_end", s["date_start"]))
            state = "upcoming" if s_start > now else ("live" if s_end > now else "past")
            sessions_payload.append({
                "key": s["session_key"],
                "name": s.get("session_name"),
                "type": s.get("session_type"),
                "date_start": s["date_start"],
                "date_end": s.get("date_end", s["date_start"]),
                "state": state,
                "time_status": s.get("time_status", "estimated"),
                "is_time_confirmed": s.get("is_time_confirmed", False),
            })

        return {
            "source": f"fia-formula{series[1:]}-2026",
            "round": upcoming_meeting.get("round", 0),
            "name": upcoming_meeting.get("meeting_name"),
            "country": upcoming_meeting.get("country_name"),
            "location": upcoming_meeting.get("location"),
            "circuit": upcoming_meeting.get("circuit_short_name"),
            "weekend_start": upcoming_meeting["date_start"][:10],
            "weekend_end": upcoming_meeting["date_end"][:10],
            "race_start": upcoming_meeting["sessions"][-1]["date_start"] if upcoming_meeting.get("sessions") else None,
            "time_status": upcoming_meeting.get("time_status", "estimated"),
            "is_time_confirmed": upcoming_meeting.get("is_time_confirmed", False),
            "sessions": sessions_payload,
        }

    state = check_series_state(series)
    if state:
        return state
    return {
        "source": "auto",
        "offseason": True,
        "season": 2026,
        "message": f"Temporada de Fórmula {series[1:].upper()} encerrada.",
    }

def check_series_state(series):
    state = SeriesState.query.filter_by(series=series).first()
    if state and getattr(state, "offseason", False):
        return {
            "source": "db-state",
            "offseason": True,
            "season": getattr(state, "current_season", 2026),
            "message": getattr(state, "message", "Temporada encerrada.")
        }
    return None


def _parse_dt(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _weekend_sessions(meeting_key, now, year):
    """Sessoes do fim de semana (P1..Race) em ordem cronologica, com estado.

    Fonte unica: ``schedule`` (instantes UTC validados, ids estaveis da OpenF1),
    a mesma usada por ``/live/sessions``.
    """
    try:
        rows = schedule.get_sessions(year, meeting_key=meeting_key)
        info = schedule.get_info(year)
    except openf1.OpenF1Error:
        return None
    rows = [s for s in rows if not s.get("is_cancelled")]
    rows.sort(key=lambda s: s["date_start"])
    confirmed = not info["stale"]
    return [
        {
            "key": s["session_key"],
            "name": s.get("session_name"),
            "type": s.get("session_type"),
            "date_start": s["date_start"],
            "date_end": s.get("date_end") or s["date_start"],
            "state": session_state(s, now),
            "time_status": "confirmed" if confirmed else "stale",
            "is_time_confirmed": confirmed,
        }
        for s in rows
    ]


def _gp_round(year, meeting_key, fallback_round=None):
    """Numero da rodada derivado do calendario (GPs nao cancelados, por data)."""
    try:
        meetings = schedule.get_meetings(year)
    except openf1.OpenF1Error:
        return fallback_round
    gps = sorted(
        (
            m
            for m in meetings
            if str(m.get("meeting_name", "")).endswith("Grand Prix")
            and not m.get("is_cancelled")
            and "testing" not in str(m.get("meeting_official_name", "")).lower()
        ),
        key=lambda m: m["date_start"],
    )
    if fallback_round is not None and len(gps) < 15:
        return fallback_round
    for index, meeting in enumerate(gps, start=1):
        if meeting["meeting_key"] == meeting_key:
            return index
    return fallback_round


def _session_Matches_weekend(session, start_dt, weekend_start, weekend_end):
    """Compara a data da corrida com a janela do fim de semana do circuito.

    Corridas noturnas nas Americas (ex.: Las Vegas 20:00 PST de sabado 21/11)
    ocorrem no inicio da madrugada de domingo em UTC (22/11 04:00Z), portanto
    a data UTC pode estar 1 dia apos ``weekend_end`` local do circuito.
    """
    if weekend_start <= start_dt.date() <= weekend_end + timedelta(days=1):
        return True
    offset_str = str(session.get("gmt_offset") or "").strip()
    if offset_str:
        try:
            sign = -1 if offset_str.startswith("-") else 1
            parts = [int(p) for p in offset_str.lstrip("+-").split(":")]
            delta = timedelta(hours=parts[0], minutes=parts[1] if len(parts) > 1 else 0)
            local_date = (start_dt + sign * delta).date()
            if weekend_start <= local_date <= weekend_end:
                return True
        except (ValueError, IndexError):
            pass
    return False


def _next_race_payload():
    now = datetime.now(timezone.utc)

    # Fonte unica: schedule (OpenF1 validado, UTC). Sem calendario manual.
    return _dynamic_next_race_payload(now)


def _schedule_info(year):
    try:
        return schedule.get_info(year)
    except openf1.OpenF1Error:
        return None


def _dynamic_next_race_payload(now):
    sessions_cache = {}
    meetings_cache = {}

    def sessions(year):
        if year not in sessions_cache:
            sessions_cache[year] = sorted(
                (
                    s
                    for s in schedule.get_sessions(year, session_type="Race")
                    if not s.get("is_cancelled")
                ),
                key=lambda s: _parse_dt(s["date_start"]),
            )
        return sessions_cache[year]

    def meeting_name(year, meeting_key):
        if year not in meetings_cache:
            meetings_cache[year] = {
                m["meeting_key"]: schedule.apply_display_overrides(dict(m)).get("meeting_name")
                for m in schedule.get_meetings(year)
            }
        return meetings_cache[year].get(meeting_key)

    try:
        try:
            upcoming = f1site.upcoming_rounds(ref=now.date() - timedelta(days=1))
        except TypeError:
            upcoming = f1site.upcoming_rounds()
    except f1site.F1SiteError:
        upcoming = []
    openf1_failed = False

    # Seleciona sempre a proxima corrida cronologica em UTC e associa ao
    # registro do formula1.com quando houver correspondencia de fim de semana.
    earliest_future = None
    for year in (now.year, now.year + 1):
        try:
            future_in_year = [s for s in sessions(year) if _parse_dt(s["date_start"]) > now]
        except openf1.OpenF1Error:
            openf1_failed = True
            break
        if future_in_year:
            earliest_future = future_in_year[0]
            break

    if earliest_future is not None:
        start = _parse_dt(earliest_future["date_start"])
        year = start.year
        for candidate in upcoming[:8]:
            if _session_Matches_weekend(
                earliest_future,
                start,
                candidate["weekend_start"],
                candidate["weekend_end"],
            ):
                return {
                    "source": "formula1.com+openf1",
                    "round": _gp_round(year, earliest_future["meeting_key"], candidate["round"]),
                    "name": meeting_name(year, earliest_future["meeting_key"]),
                    "country": earliest_future.get("country_name"),
                    "location": earliest_future.get("location"),
                    "circuit": earliest_future.get("circuit_short_name"),
                    "weekend_start": candidate["weekend_start"].isoformat(),
                    "weekend_end": candidate["weekend_end"].isoformat(),
                    "race_start": earliest_future["date_start"],
                    "sessions": _weekend_sessions(earliest_future["meeting_key"], now, year),
                    "schedule": _schedule_info(year),
                }

    fallback = []
    for year in (now.year, now.year + 1):
        try:
            fallback += [
                s for s in sessions(year) if _parse_dt(s["date_start"]) > now
            ]
        except openf1.OpenF1Error:
            openf1_failed = True
            break
    if openf1_failed and not fallback and not upcoming:
        raise openf1.OpenF1Error("todas as fontes de calendario falharam")
    if fallback:
        session = min(fallback, key=lambda s: _parse_dt(s["date_start"]))
        year = _parse_dt(session["date_start"]).year
        start = _parse_dt(session["date_start"])
        return {
            "source": "openf1",
            "round": _gp_round(year, session["meeting_key"]),
            "name": meeting_name(year, session["meeting_key"]),
            "country": session.get("country_name"),
            "location": session.get("location"),
            "circuit": session.get("circuit_short_name"),
            "weekend_start": (start.date() - timedelta(days=2)).isoformat(),
            "weekend_end": (start.date() + timedelta(days=1)).isoformat(),
            "race_start": session["date_start"],
            "sessions": _weekend_sessions(session["meeting_key"], now, year),
            "schedule": _schedule_info(year),
        }

    upcoming_today = [c for c in upcoming if c["weekend_end"] >= now.date()] or upcoming
    if upcoming_today:
        candidate = upcoming_today[0]
        return {
            "source": "formula1.com",
            "round": candidate["round"],
            "name": f"{candidate['country']} Grand Prix",
            "country": candidate["country"],
            "location": None,
            "circuit": None,
            "weekend_start": candidate["weekend_start"].isoformat(),
            "weekend_end": candidate["weekend_end"].isoformat(),
            "race_start": None,
        }
    return None


@bp.get("/next-race")
def next_race():
    """
    Proxima corrida do calendario oficial
    ---
    tags:
      - Races
    description: >-
      Combina o calendario da pagina oficial formula1.com com o horario
      exato da sessao de corrida na OpenF1. cacheado por alguns minutos.
    responses:
      200:
        description: Dados da proxima corrida
        content:
          application/json:
            schema:
              type: object
              properties:
                source:
                  type: string
                  example: formula1.com+openf1
                round:
                  type: integer
                  nullable: true
                name:
                  type: string
                  example: Italian Grand Prix
                circuit:
                  type: string
                  nullable: true
                  example: Monza
                country:
                  type: string
                  example: Italy
                race_start:
                  type: string
                  nullable: true
                  example: "2026-09-06T13:00:00+00:00"
                weekend_start:
                  type: string
                weekend_end:
                  type: string
      404:
        description: Nenhuma proxima corrida encontrada
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      503:
        description: Fontes de calendario indisponiveis
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    series = (request.args.get("series") or "f1").lower()
    cache_key = f"next-race:{series}"
    cached = app_cache.get(cache_key)
    if cached is not None:
        return jsonify(cached)

    if series in {"f2", "f3"}:
        payload = _next_race_f2_f3_payload(series)
        app_cache.set(cache_key, payload, NEXT_RACE_TTL)
        return jsonify(payload)

    try:
        payload = _next_race_payload()
    except (f1site.F1SiteError, openf1.OpenF1Error) as exc:
        raise ApiError(
            f"Fontes de calendario indisponiveis: {exc}", status_code=503
        )
    if payload is None:
        raise ApiError("Nenhuma proxima corrida encontrada", 404)
    app_cache.set(cache_key, payload, NEXT_RACE_TTL)
    app_cache.set("next-race", payload, NEXT_RACE_TTL)
    return jsonify(payload)


@bp.get("/seasons")
def list_seasons():
    """
    Lista temporadas com corridas cadastradas
    ---
    tags:
      - Races
    parameters:
      - in: query
        name: series
        schema:
          type: string
        description: Filtra por categoria (f1, f2, f3)
    responses:
      200:
        description: Temporadas em ordem decrescente
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    type: integer
                  example: [2026, 2025, 2024, 2023]
    """
    series = request.args.get("series")
    if series:
        series = series.lower()
    if series in {"f2", "f3"}:
        db_seasons = [
            row[0]
            for row in db.session.query(Race.season)
            .filter(Race.series == series)
            .distinct()
            .order_by(desc(Race.season))
            .all()
        ]
        if db_seasons:
            return jsonify({"data": db_seasons})
        return jsonify({"data": [2026]})

    rows = (
        db.session.query(Race.season)
        .distinct()
        .order_by(desc(Race.season))
        .all()
    )
    return jsonify({"data": [row[0] for row in rows]})


@bp.get("/races")
def list_races():
    """
    Lista corridas
    ---
    tags:
      - Races
    parameters:
      - in: query
        name: season
        schema:
          type: integer
        description: Filtra por temporada (ex. 2024)
      - in: query
        name: series
        schema:
          type: string
        description: Filtra por categoria (f1, f2, f3)
      - in: query
        name: page
        schema:
          type: integer
          default: 1
      - in: query
        name: per_page
        schema:
          type: integer
          default: 10
          maximum: 50
    responses:
      200:
        description: Lista paginada de corridas
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/Race'
                meta:
                  $ref: '#/components/schemas/Meta'
    """
    season = parse_season_arg()
    series_param = request.args.get("series")
    series = (series_param or "f1").lower()

    if series in {"f2", "f3"}:
        db_count = Race.query.filter_by(series=series).count()
        if db_count > 0:
            query = Race.query.filter_by(series=series)
            if season:
                query = query.filter_by(season=season)
            query = query.order_by(Race.season.desc(), Race.round)
            return jsonify(paginate(query, Race.to_dict))

        page, per_page = pagination_args()
        if season is not None and season != 2026:
            return jsonify({
                "data": [],
                "meta": {
                    "page": page,
                    "per_page": per_page,
                    "total": 0,
                    "pages": 0,
                }
            })

        meetings = get_series_meetings(series, 2026)
        items = [_meeting_to_race_dict(m, series) for m in meetings]
        championship_total = sum(
            1 for m in meetings if not m.get("is_testing") and (m.get("round") or 0) > 0
        )
        total = len(items)
        pages = (total + per_page - 1) // per_page if total > 0 else 0
        start = (page - 1) * per_page
        end = start + per_page
        return jsonify({
            "data": items[start:end],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": pages,
                "championship_total": championship_total,
            }
        })

    query = Race.query
    if season:
        query = query.filter_by(season=season)
    if series == "f1":
        query = query.filter((Race.series == "f1") | (Race.series.is_(None)))
    elif series_param:
        query = query.filter_by(series=series)

    query = query.order_by(Race.season.desc(), Race.round)
    payload = paginate(query, Race.to_dict)
    if season:
        progress = season_progress(season, series)
        payload["meta"]["championship_total"] = progress["total_races"]
        payload["meta"]["completed_races"] = progress["completed_races"]
        payload["meta"]["pending_results"] = progress["pending_results"]
    return jsonify(payload)


@bp.get("/races/<int:race_id>")
def get_race(race_id):
    """
    Detalha corrida
    ---
    tags:
      - Races
    parameters:
      - in: path
        name: race_id
        required: true
        schema:
          type: integer
    responses:
      200:
        description: Corrida
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Race'
      404:
        description: Corrida nao encontrada
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    race = db.session.get(Race, race_id)
    if race:
        return jsonify(race.to_dict())

    for s_name in ("f2", "f3"):
        for m in get_series_meetings(s_name, 2026):
            if m.get("meeting_key") == race_id:
                return jsonify(_meeting_to_race_dict(m, s_name))

    raise ApiError("Corrida nao encontrada", 404)


@bp.get("/races/<int:race_id>/results")
def race_results(race_id):
    """
    Resultados de uma corrida
    ---
    tags:
      - Races
    parameters:
      - in: path
        name: race_id
        required: true
        schema:
          type: integer
    responses:
      200:
        description: Resultado ordenado por posicao de chegada
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/RaceResult'
                meta:
                  $ref: '#/components/schemas/Meta'
      404:
        description: Corrida nao encontrada
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    race = db.session.get(Race, race_id)
    if race:
        ensure_race_results(race, current_app)
        # Ordem oficial de chegada. Ordenar por pontos distorcia corridas com
        # pontos de volta rapida, penalidades pos-corrida e eras com carros
        # compartilhados; quem nao tem posicao (DNS/sprint) vai ao final.
        query = (
            RaceResult.query.filter_by(race_id=race.id)
            .order_by(
                RaceResult.position.is_(None),
                RaceResult.position,
                desc(RaceResult.points),
                RaceResult.id,
            )
        )
        payload = paginate(query, RaceResult.to_dict)
        payload["results_state"] = race_results_state(
            race.date, payload["meta"]["total"] > 0
        )
        if not payload["results_state"]["final"]:
            maybe_refresh_pending_results(
                current_app, season=race.season, series=race.series or "f1"
            )
        return jsonify(payload)

    for s_name in ("f2", "f3"):
        for m in get_series_meetings(s_name, 2026):
            if m.get("meeting_key") == race_id:
                page, per_page = pagination_args()
                meeting_date = (m.get("date_end") or m.get("date_start") or "")[:10]
                state = race_results_state(
                    date.fromisoformat(meeting_date) if meeting_date else None,
                    False,
                )
                if state["state"] in {"pending", "in_progress"}:
                    # Nao ha fonte de resultados homologada para F2/F3.
                    state = {
                        "state": "unavailable",
                        "final": False,
                        "message": (
                            "Resultados da F2/F3 ainda não estão disponíveis "
                            "em uma fonte homologada pelo aplicativo."
                        ),
                    }
                return jsonify({
                    "data": [],
                    "meta": {
                        "page": page,
                        "per_page": per_page,
                        "total": 0,
                        "pages": 0,
                    },
                    "results_state": state,
                })

    raise ApiError("Corrida nao encontrada", 404)


JOLPICA_QUALIFYING_URL = "https://api.jolpi.ca/ergast/f1/{season}/{round}/qualifying.json"
QUALIFYING_TTL_FOUND = 6 * 3600
QUALIFYING_TTL_EMPTY = 600


def _fetch_jolpica_qualifying(season, round_):
    """Linhas de classificacao da Jolpica; [] quando a fonte nao tem a sessao."""
    try:
        response = requests.get(
            JOLPICA_QUALIFYING_URL.format(season=season, round=round_),
            timeout=15,
            headers={"User-Agent": "f1app/1.0"},
        )
    except requests.RequestException as exc:
        raise ApiError("Falha ao consultar a fonte de classificação", 502) from exc
    if response.status_code == 404:
        return []
    if response.status_code != 200:
        raise ApiError(
            f"Fonte de classificação respondeu {response.status_code}", 502
        )
    try:
        races = response.json()["MRData"]["RaceTable"]["Races"]
    except (ValueError, KeyError) as exc:
        raise ApiError("Resposta inesperada da fonte de classificação", 502) from exc
    return races[0].get("QualifyingResults", []) if races else []


def _normalize_qualifying(rows):
    """Converte linhas Ergast em um formato unico, preservando a ordem da fonte.

    Formatos historicos nao tem todas as sessoes: entre 1994 e 2005 so ha Q1
    (e Q2 em 2005), portanto apenas colunas com algum tempo sao informadas.
    """
    data = []
    for row in rows:
        driver = row.get("Driver") or {}
        constructor = row.get("Constructor") or {}
        name = " ".join(
            part for part in (driver.get("givenName"), driver.get("familyName")) if part
        )
        times = {key: (row.get(key.upper()) or None) for key in ("q1", "q2", "q3")}
        best = times["q3"] or times["q2"] or times["q1"]
        try:
            position = int(row.get("position"))
        except (TypeError, ValueError):
            position = None
        data.append(
            {
                "position": position,
                "driver_name": name or None,
                "driver_code": driver.get("code"),
                "driver_number": row.get("number"),
                "team_name": constructor.get("name"),
                **times,
                "best_time": best,
            }
        )
    columns = [key for key in ("q1", "q2", "q3") if any(item[key] for item in data)]
    return data, columns


def _grid_rows(race):
    results = (
        RaceResult.query.filter(RaceResult.race_id == race.id, RaceResult.grid > 0)
        .order_by(RaceResult.grid, RaceResult.id)
        .all()
    )
    return [
        {
            "position": item.grid,
            "driver_name": item.driver.full_name if item.driver else None,
            "driver_code": item.driver.code if item.driver else None,
            "driver_number": None,
            "team_name": item.team.name if item.team else None,
            "q1": None,
            "q2": None,
            "q3": None,
            "best_time": None,
        }
        for item in results
    ]


@bp.get("/races/<int:race_id>/qualifying")
def race_qualifying(race_id):
    """
    Classificacao (qualifying) de uma corrida
    ---
    tags:
      - Races
    parameters:
      - in: path
        name: race_id
        required: true
        schema:
          type: integer
    responses:
      200:
        description: >
          Tempos de classificacao (kind=qualifying), grid de largada quando a
          fonte nao tem tempos (kind=starting_grid) ou lista vazia (kind=none).
      404:
        description: Corrida nao encontrada
      502:
        description: Fonte externa indisponivel
    """
    race = db.session.get(Race, race_id)
    if race is None:
        raise ApiError("Corrida nao encontrada", 404)

    info = {"season": race.season, "round": race.round, "series": race.series or "f1"}
    if info["series"] != "f1":
        return jsonify({
            "data": [],
            "info": {
                **info,
                "kind": "none",
                "columns": [],
                "message": "Não há fonte homologada de classificação para esta categoria.",
            },
        })

    cache_key = f"qualifying:{race.season}:{race.round}"
    rows = app_cache.get(cache_key)
    if rows is None:
        rows = _fetch_jolpica_qualifying(race.season, race.round)
        app_cache.set(
            cache_key, rows, QUALIFYING_TTL_FOUND if rows else QUALIFYING_TTL_EMPTY
        )

    data, columns = _normalize_qualifying(rows)
    if data:
        return jsonify({
            "data": data,
            "info": {**info, "kind": "qualifying", "columns": columns, "message": None},
        })

    grid = _grid_rows(race)
    if grid:
        return jsonify({
            "data": grid,
            "info": {
                **info,
                "kind": "starting_grid",
                "columns": [],
                "message": (
                    "A fonte não registra os tempos de classificação desta corrida. "
                    "Exibindo o grid de largada oficial, sem tempos."
                ),
            },
        })
    return jsonify({
        "data": [],
        "info": {
            **info,
            "kind": "none",
            "columns": [],
            "message": "A fonte não disponibiliza dados de classificação para esta corrida.",
        },
    })


@bp.get('/f2/next-race')
def f2_next_race():
    return jsonify(_next_race_f2_f3_payload("f2"))


@bp.get('/f3/next-race')
def f3_next_race():
    return jsonify(_next_race_f2_f3_payload("f3"))
