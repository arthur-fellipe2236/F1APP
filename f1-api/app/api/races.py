from datetime import datetime, timedelta, timezone
from time import time

from flask import Blueprint, jsonify, request

from sqlalchemy import desc

from .. import f1site, openf1
from ..extensions import db
from ..models import Race, RaceResult
from .helpers import ApiError, get_or_404, paginate, parse_int
from .live import session_state

bp = Blueprint("races", __name__)

_NEXT_RACE_CACHE = {"ts": 0.0, "payload": None}
NEXT_RACE_TTL = 300


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
    cached = _NEXT_RACE_CACHE
    if cached["payload"] is not None and time() - cached["ts"] < NEXT_RACE_TTL:
        return jsonify(cached["payload"])
    try:
        payload = _next_race_payload()
    except (f1site.F1SiteError, openf1.OpenF1Error) as exc:
        raise ApiError(
            f"Fontes de calendario indisponiveis: {exc}", status_code=503
        )
    if payload is None:
        raise ApiError("Nenhuma proxima corrida encontrada", 404)
    cached["payload"] = payload
    cached["ts"] = time()
    return jsonify(payload)


@bp.get("/seasons")
def list_seasons():
    """
    Lista temporadas com corridas cadastradas
    ---
    tags:
      - Races
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
    query = Race.query
    season = parse_int(request.args.get("season"), "season")
    if season:
        query = query.filter_by(season=season)
    query = query.order_by(Race.season.desc(), Race.round)
    return jsonify(paginate(query, Race.to_dict))


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
    race = get_or_404(Race, race_id, "Corrida nao encontrada")
    return jsonify(race.to_dict())


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
    race = get_or_404(Race, race_id, "Corrida nao encontrada")
    query = (
        RaceResult.query.filter_by(race_id=race.id)
        .order_by(RaceResult.position.is_(None), desc(RaceResult.points), RaceResult.position)
    )
    return jsonify(paginate(query, RaceResult.to_dict))
