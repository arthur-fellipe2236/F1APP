from datetime import date, datetime, timedelta, timezone

import requests
from flask import Blueprint, current_app, jsonify, request
from ..models import SeriesState

from sqlalchemy import desc

from .. import f1site, openf1
from ..extensions import db
from ..models import Race, RaceResult
from .. import cache as app_cache
from ..results_refresh import (
    ensure_race_results,
    maybe_refresh_pending_results,
    race_results_state,
    season_progress,
)
from .helpers import ApiError, get_or_404, paginate, parse_int, pagination_args
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


def _weekend_sessions(meeting_key, now):
    """Sessoes do fim de semana (P1..Race) em ordem cronologica, com estado."""
    try:
        rows = openf1.get("sessions", meeting_key=meeting_key) or []
    except openf1.OpenF1Error:
        return None
    rows.sort(key=lambda s: s["date_start"])
    return [
        {
            "key": s["session_key"],
            "name": s.get("session_name"),
            "type": s.get("session_type"),
            "date_start": s["date_start"],
            "date_end": s.get("date_end") or s["date_start"],
            "state": session_state(s, now),
        }
        for s in rows
    ]


def _next_race_payload():
    now = datetime.now(timezone.utc)

    # Calendário Customizado 2026 (Com Fuso de Brasília UTC-3)
    custom_2026 = [
        {
            "round": 17,
            "name": "Bahrain Grand Prix", "country": "Malásia", "location": "Sepang", "circuit": "Circuito Internacional de Sepang", 
            "weekend_start": "2026-10-02", "weekend_end": "2026-10-04",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-02T01:30:00-03:00", "date_end": "2026-10-02T02:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-10-02T05:00:00-03:00", "date_end": "2026-10-02T06:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-10-03T01:30:00-03:00", "date_end": "2026-10-03T02:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-10-03T05:00:00-03:00", "date_end": "2026-10-03T06:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-10-04T04:00:00-03:00", "date_end": "2026-10-04T06:00:00-03:00"}
            ]
        },
        {
            "round": 18,
            "name": "Singapore Grand Prix", "country": "Singapura", "location": "Marina Bay", "circuit": "Marina Bay Street Circuit", 
            "weekend_start": "2026-10-09", "weekend_end": "2026-10-11",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-09T05:30:00-03:00", "date_end": "2026-10-09T06:30:00-03:00"},
                {"name": "Classificação Sprint", "type": "Qualifying", "date_start": "2026-10-09T09:30:00-03:00", "date_end": "2026-10-09T10:15:00-03:00"},
                {"name": "Corrida Sprint", "type": "Race", "date_start": "2026-10-10T06:00:00-03:00", "date_end": "2026-10-10T07:00:00-03:00"},
                {"name": "Classificação Principal", "type": "Qualifying", "date_start": "2026-10-10T10:00:00-03:00", "date_end": "2026-10-10T11:00:00-03:00"},
                {"name": "Corrida Principal", "type": "Race", "date_start": "2026-10-11T09:00:00-03:00", "date_end": "2026-10-11T11:00:00-03:00"}
            ]
        },
        {
            "round": 19,
            "name": "United States Grand Prix", "country": "Estados Unidos", "location": "Austin", "circuit": "Circuit of The Americas", 
            "weekend_start": "2026-10-23", "weekend_end": "2026-10-25",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-23T14:30:00-03:00", "date_end": "2026-10-23T15:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-10-23T18:00:00-03:00", "date_end": "2026-10-23T19:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-10-24T14:00:00-03:00", "date_end": "2026-10-24T15:00:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-10-24T18:00:00-03:00", "date_end": "2026-10-24T19:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-10-25T16:00:00-03:00", "date_end": "2026-10-25T18:00:00-03:00"}
            ]
        },
        {
            "round": 20,
            "name": "GP do México (Cidade do México)", "country": "México", "location": "Cidade do México", "circuit": "Autódromo Hermanos Rodríguez", 
            "weekend_start": "2026-10-30", "weekend_end": "2026-11-01",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-30T15:30:00-03:00", "date_end": "2026-10-30T16:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-10-30T19:00:00-03:00", "date_end": "2026-10-30T20:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-10-31T14:30:00-03:00", "date_end": "2026-10-31T15:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-10-31T18:00:00-03:00", "date_end": "2026-10-31T19:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-11-01T17:00:00-03:00", "date_end": "2026-11-01T19:00:00-03:00"}
            ]
        },
        {
            "round": 21,
            "name": "GP do Brasil (São Paulo - Interlagos)", "country": "Brasil", "location": "São Paulo", "circuit": "Autódromo José Carlos Pace", 
            "weekend_start": "2026-11-06", "weekend_end": "2026-11-08",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-11-06T12:30:00-03:00", "date_end": "2026-11-06T13:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-11-06T16:00:00-03:00", "date_end": "2026-11-06T17:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-11-07T11:30:00-03:00", "date_end": "2026-11-07T12:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-11-07T15:00:00-03:00", "date_end": "2026-11-07T16:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-11-08T14:00:00-03:00", "date_end": "2026-11-08T16:00:00-03:00"}
            ]
        },
        {
            "round": 22,
            "name": "Las Vegas Grand Prix", "country": "Estados Unidos", "location": "Las Vegas", "circuit": "Las Vegas Strip Circuit", 
            "weekend_start": "2026-11-19", "weekend_end": "2026-11-21",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-11-19T23:30:00-03:00", "date_end": "2026-11-20T00:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-11-20T03:00:00-03:00", "date_end": "2026-11-20T04:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-11-20T23:30:00-03:00", "date_end": "2026-11-21T00:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-11-21T03:00:00-03:00", "date_end": "2026-11-21T04:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-11-22T03:00:00-03:00", "date_end": "2026-11-22T05:00:00-03:00"}
            ]
        },
        {
            "round": 23,
            "name": "Qatar Grand Prix", "country": "Catar", "location": "Lusail", "circuit": "Lusail International Circuit", 
            "weekend_start": "2026-11-27", "weekend_end": "2026-11-29",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-11-27T10:30:00-03:00", "date_end": "2026-11-27T11:30:00-03:00"},
                {"name": "Classificatória Sprint", "type": "Qualifying", "date_start": "2026-11-27T14:30:00-03:00", "date_end": "2026-11-27T15:15:00-03:00"},
                {"name": "Corrida Sprint", "type": "Race", "date_start": "2026-11-28T10:00:00-03:00", "date_end": "2026-11-28T11:00:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-11-28T14:00:00-03:00", "date_end": "2026-11-28T15:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-11-29T14:00:00-03:00", "date_end": "2026-11-29T16:00:00-03:00"}
            ]
        },
        {
            "round": 24,
            "name": "Abu Dhabi Grand Prix", "country": "Emirados Árabes Unidos", "location": "Abu Dhabi", "circuit": "Yas Marina Circuit", 
            "weekend_start": "2026-12-04", "weekend_end": "2026-12-06",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-12-04T06:30:00-03:00", "date_end": "2026-12-04T07:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-12-04T10:00:00-03:00", "date_end": "2026-12-04T11:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-12-05T07:30:00-03:00", "date_end": "2026-12-05T08:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-12-05T11:00:00-03:00", "date_end": "2026-12-05T12:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-12-06T10:00:00-03:00", "date_end": "2026-12-06T12:00:00-03:00"}
            ]
        }
    ]
    
    if not current_app.config.get("TESTING"):
        for race in custom_2026:
            # Pega o horário da corrida principal para comparar
            race_dt = datetime.fromisoformat(race["sessions"][-1]["date_start"])
            if race_dt > now:
                for s in race["sessions"]:
                    s["key"] = hash(s["name"] + race["name"]) % 100000
                    sess_dt = datetime.fromisoformat(s["date_start"])
                    s["state"] = "upcoming" if sess_dt > now else "past"
                return {
                    "source": "formula1.com-2026-custom",
                    "round": race["round"],
                    "name": race["name"],
                    "country": race["country"],
                    "location": race["location"],
                    "circuit": race["circuit"],
                    "weekend_start": race["weekend_start"],
                    "weekend_end": race["weekend_end"],
                    "race_start": race["sessions"][-1]["date_start"],
                    "sessions": race["sessions"]
                }
            
    return _dynamic_next_race_payload(now)


def _dynamic_next_race_payload(now):
    sessions_cache = {}
    meetings_cache = {}

    def sessions(year):
        if year not in sessions_cache:
            sessions_cache[year] = (
                openf1.get("sessions", year=year, session_type="Race") or []
            )
        return sessions_cache[year]

    def meeting_name(year, meeting_key):
        if year not in meetings_cache:
            meetings_cache[year] = {
                m["meeting_key"]: m.get("meeting_name")
                for m in (openf1.get("meetings", year=year) or [])
            }
        return meetings_cache[year].get(meeting_key)

    try:
        upcoming = f1site.upcoming_rounds()
    except f1site.F1SiteError:
        upcoming = []
    openf1_failed = False
    for candidate in upcoming[:8]:
        year = candidate["weekend_start"].year
        try:
            year_sessions = sessions(year)
        except openf1.OpenF1Error:
            openf1_failed = True
            break
        for session in year_sessions:
            start = _parse_dt(session["date_start"])
            if (
                start > now
                and candidate["weekend_start"]
                <= start.date()
                <= candidate["weekend_end"]
            ):
                return {
                    "source": "formula1.com+openf1",
                    "round": candidate["round"],
                    "name": meeting_name(year, session["meeting_key"]),
                    "country": session.get("country_name"),
                    "location": session.get("location"),
                    "circuit": session.get("circuit_short_name"),
                    "weekend_start": candidate["weekend_start"].isoformat(),
                    "weekend_end": candidate["weekend_end"].isoformat(),
                    "race_start": session["date_start"],
                    "sessions": _weekend_sessions(session["meeting_key"], now),
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
            "round": None,
            "name": meeting_name(year, session["meeting_key"]),
            "country": session.get("country_name"),
            "location": session.get("location"),
            "circuit": session.get("circuit_short_name"),
            "weekend_start": (start.date() - timedelta(days=2)).isoformat(),
            "weekend_end": (start.date() + timedelta(days=1)).isoformat(),
            "race_start": session["date_start"],
            "sessions": _weekend_sessions(session["meeting_key"], now),
        }

    if upcoming:
        candidate = upcoming[0]
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
    season = parse_int(request.args.get("season"), "season")
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
    if series_param:
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
