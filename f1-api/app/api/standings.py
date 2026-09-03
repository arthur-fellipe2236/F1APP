from flask import Blueprint, jsonify, request

from sqlalchemy import case, desc, func

from ..extensions import db
from ..models import Driver, Race, RaceResult, Team
from .helpers import parse_int

bp = Blueprint("standings", __name__)


def _driver_aggregates_sq(season):
    query = db.session.query(
        RaceResult.driver_id.label("driver_id"),
        func.sum(
            RaceResult.points + func.coalesce(RaceResult.sprint_points, 0)
        ).label("points"),
        func.sum(case((RaceResult.position == 1, 1), else_=0)).label("wins"),
        func.sum(case((RaceResult.position <= 3, 1), else_=0)).label("podiums"),
        func.count(RaceResult.id).label("races"),
    ).join(Race, RaceResult.race_id == Race.id)
    if season:
        query = query.filter(Race.season == season)
    return query.group_by(RaceResult.driver_id).subquery()


def _latest_results_sq(season):
    """Ultimo resultado de cada piloto na temporada (equipe vigente na epoca)."""
    query = db.session.query(
        RaceResult.driver_id.label("driver_id"),
        func.max(RaceResult.id).label("result_id"),
    ).join(Race, RaceResult.race_id == Race.id)
    if season:
        query = query.filter(Race.season == season)
    return query.group_by(RaceResult.driver_id).subquery()


@bp.get("/standings/drivers")
def driver_standings():
    """
    Classificacao de pilotos
    ---
    tags:
      - Standings
    parameters:
      - in: query
        name: season
        schema:
          type: integer
        description: Filtra por temporada (ex. 2024)
    responses:
      200:
        description: Classificacao ordenada por pontos
        content:
          application/json:
            schema:
              type: object
              properties:
                season:
                  type: integer
                  nullable: true
                  example: 2024
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/DriverStanding'
      400:
        description: Parametro season invalido
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    season = parse_int(request.args.get("season"), "season")
    aggregates = _driver_aggregates_sq(season)
    latest = _latest_results_sq(season)

    rows = (
        db.session.query(
            Driver,
            func.coalesce(aggregates.c.points, 0),
            func.coalesce(aggregates.c.wins, 0),
            func.coalesce(aggregates.c.podiums, 0),
            func.coalesce(aggregates.c.races, 0),
            Team.name,
        )
        .outerjoin(aggregates, aggregates.c.driver_id == Driver.id)
        .outerjoin(latest, latest.c.driver_id == Driver.id)
        .outerjoin(RaceResult, RaceResult.id == latest.c.result_id)
        .outerjoin(Team, Team.id == RaceResult.team_id)
        .order_by(desc(aggregates.c.points), Driver.last_name)
        .all()
    )

    standing = []
    for driver, points, wins, podiums, races_count, team_at_time in rows:
        standing.append(
            {
                "driver_id": driver.id,
                "driver_name": driver.full_name,
                "driver_code": driver.code,
                "nationality": driver.nationality,
                "headshot_url": driver.headshot_url,
                "team_name": team_at_time
                or (driver.team.name if driver.team else None),
                "points": float(points or 0),
                "wins": int(wins or 0),
                "podiums": int(podiums or 0),
                "races": int(races_count or 0),
            }
        )
    for position, row in enumerate(standing, start=1):
        row["position"] = position
    return jsonify({"season": season, "data": standing})


@bp.get("/standings/teams")
def team_standings():
    """
    Classificacao de equipes (Construtores)
    ---
    tags:
      - Standings
    parameters:
      - in: query
        name: season
        schema:
          type: integer
        description: Filtra por temporada (ex. 2024)
    responses:
      200:
        description: Classificacao ordenada por pontos
        content:
          application/json:
            schema:
              type: object
              properties:
                season:
                  type: integer
                  nullable: true
                  example: 2024
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/TeamStanding'
      400:
        description: Parametro season invalido
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    season = parse_int(request.args.get("season"), "season")
    team_id_expr = func.coalesce(RaceResult.team_id, Driver.team_id).label(
        "team_id"
    )

    query = (
        db.session.query(
            team_id_expr,
            func.sum(
                RaceResult.points + func.coalesce(RaceResult.sprint_points, 0)
            ).label("points"),
            func.sum(case((RaceResult.position == 1, 1), else_=0)).label("wins"),
            func.sum(case((RaceResult.position <= 3, 1), else_=0)).label("podiums"),
            func.count(func.distinct(RaceResult.race_id)).label("races"),
        )
        .join(Driver, RaceResult.driver_id == Driver.id)
        .join(Race, RaceResult.race_id == Race.id)
        .group_by(team_id_expr)
    )
    if season:
        query = query.filter(Race.season == season)

    team_names = {team.id: team.name for team in Team.query.all()}
    standing = []
    for team_id, points, wins, podiums, races_count in query.all():
        if team_id is None:
            continue
        standing.append(
            {
                "team_id": team_id,
                "team_name": team_names.get(team_id),
                "points": float(points or 0),
                "wins": int(wins or 0),
                "podiums": int(podiums or 0),
                "races": int(races_count or 0),
            }
        )

    standing.sort(key=lambda row: (-row["points"], row["team_name"] or ""))
    for position, row in enumerate(standing, start=1):
        row["position"] = position
    return jsonify({"season": season, "data": standing})
