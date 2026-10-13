from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from app.models import SeriesState

from sqlalchemy import desc

from .. import f1site, openf1
from ..extensions import db
from ..models import Race, RaceResult
from .. import cache as app_cache
from .helpers import ApiError, get_or_404, paginate, parse_int
from .live import session_state

bp = Blueprint("races", __name__)

NEXT_RACE_TTL = 300

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
            "name": "Mexico City Grand Prix", "country": "México", "location": "Cidade do México", "circuit": "Autódromo Hermanos Rodríguez", 
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
            "name": "São Paulo Grand Prix", "country": "Brasil", "location": "São Paulo", "circuit": "Autódromo José Carlos Pace", 
            "weekend_start": "2026-11-06", "weekend_end": "2026-11-08",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-11-06T11:30:00-03:00", "date_end": "2026-11-06T12:30:00-03:00"},
                {"name": "Classificatória Sprint", "type": "Qualifying", "date_start": "2026-11-06T15:30:00-03:00", "date_end": "2026-11-06T16:15:00-03:00"},
                {"name": "Corrida Sprint", "type": "Race", "date_start": "2026-11-07T11:00:00-03:00", "date_end": "2026-11-07T12:00:00-03:00"},
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
    cached = app_cache.get("next-race")
    if cached is not None:
        return jsonify(cached)
    try:
        payload = _next_race_payload()
    except (f1site.F1SiteError, openf1.OpenF1Error) as exc:
        raise ApiError(
            f"Fontes de calendario indisponiveis: {exc}", status_code=503
        )
    if payload is None:
        raise ApiError("Nenhuma proxima corrida encontrada", 404)
    app_cache.set("next-race", payload, NEXT_RACE_TTL)
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
    series = request.args.get("series")
    
    if season:
        query = query.filter_by(season=season)
    if series:
        query = query.filter_by(series=series)
        
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


@bp.get('/f2/next-race')
def f2_next_race():
    state = check_series_state("f2")
    if state: return jsonify(state)
    return jsonify({
        "source": "auto",
        "offseason": True,
        "season": 2026,
        "message": "Temporada de Fórmula 2 encerrada. Aguardando a FIA confirmar as datas oficiais dos testes."
    })

@bp.get('/f3/next-race')
def f3_next_race():
    state = check_series_state("f3")
    if state: return jsonify(state)
    return jsonify({
        "source": "manual-test",
        "offseason": False,
        "season": 2026,
        "round": "Test",
        "name": "Testes de Pós-Temporada (Jerez)",
        "country": "Espanha",
        "location": "Jerez de la Frontera",
        "circuit": "Circuito de Jerez",
        "race_start": "2026-10-20T09:00:00+00:00",
        "sessions": [
            {
                "name": "Jerez - Dia 1",
                "type": "Practice",
                "date_start": "2026-10-20T09:00:00+00:00",
                "date_end": "2026-10-20T17:00:00+00:00",
                "state": "upcoming"
            },
            {
                "name": "Jerez - Dia 2",
                "type": "Practice",
                "date_start": "2026-10-21T09:00:00+00:00",
                "date_end": "2026-10-21T17:00:00+00:00",
                "state": "upcoming"
            },
            {
                "name": "Barcelona - Dia 1",
                "type": "Practice",
                "date_start": "2026-10-26T09:00:00+00:00",
                "date_end": "2026-10-26T17:00:00+00:00",
                "state": "upcoming"
            },
            {
                "name": "Barcelona - Dia 2",
                "type": "Practice",
                "date_start": "2026-10-27T09:00:00+00:00",
                "date_end": "2026-10-27T17:00:00+00:00",
                "state": "upcoming"
            }
        ]
    })
