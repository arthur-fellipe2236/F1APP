from flask import Blueprint, current_app, jsonify, request

from sqlalchemy import case, desc, func

from ..extensions import db
from ..models import Driver, Race, RaceResult, Team
from .helpers import parse_int
from ..scraper import get_standings
from ..results_refresh import maybe_refresh_pending_results, season_progress
from .historical_rules import (
    DRIVER_DROP_RULES,
    FIRST_CONSTRUCTORS_SEASON,
    BEST_CAR_ONLY_LAST_SEASON,
    historical_driver_points,
    historical_team_points,
)

bp = Blueprint("standings", __name__)


def _attach_progress(payload, season, series, scraped_rows=None):
    """Acrescenta o progresso da temporada (campos aditivos, contrato preservado).

    ``completed_races``: corridas/etapas com resultados oficiais disponíveis.
    ``total_races``: total de etapas do campeonato na temporada (exclui pré-temporada).
    ``pending_results``: ha corrida encerrada ainda sem resultados; o cliente
    deve voltar a consultar e a importacao em background e acionada.
    """
    norm_series = (series or "f1").lower()
    target_season = season or (2026 if norm_series in ("f2", "f3") else None)
    if not target_season:
        return
    progress = season_progress(target_season, norm_series, scraped_rows=scraped_rows)
    payload["completed_races"] = progress["completed_races"]
    payload["total_races"] = progress["total_races"]
    payload["pending_results"] = progress["pending_results"]
    if progress["pending_results"] and norm_series == "f1":
        maybe_refresh_pending_results(current_app, season=target_season, series="f1")


def _driver_aggregates_sq(season, series=None):
    query = db.session.query(
        RaceResult.driver_id.label("driver_id"),
        func.sum(
            RaceResult.points + func.coalesce(RaceResult.sprint_points, 0)
        ).label("points"),
        func.sum(case((RaceResult.position == 1, 1), else_=0)).label("wins"),
        func.sum(case((RaceResult.position <= 3, 1), else_=0)).label("podiums"),
        func.count(func.distinct(RaceResult.race_id)).label("races"),
    ).join(Race, RaceResult.race_id == Race.id)
    query = query.filter(
        RaceResult.status != 'Dummy',
        (Race.round.is_(None)) | (Race.round > 0),
    )
    if season:
        query = query.filter(Race.season == season)
    if series:
        query = query.filter(Race.series == series)
    return query.group_by(RaceResult.driver_id).subquery()


def _race_index_map(season):
    """Mapeia race_id -> indice (1-based) da corrida na temporada F1."""
    races = (
        Race.query.filter(Race.season == season, Race.series == "f1")
        .order_by(Race.round, Race.date, Race.id)
        .all()
    )
    return {r.id: idx for idx, r in enumerate(races, start=1)}, {r.id: r.name for r in races}


def _latest_results_sq(season, series=None):
    """Ultimo resultado de cada piloto na temporada (equipe vigente na epoca)."""
    query = db.session.query(
        RaceResult.driver_id.label("driver_id"),
        func.max(RaceResult.id).label("result_id"),
    ).join(Race, RaceResult.race_id == Race.id)
    query = query.filter(
        RaceResult.status != 'Dummy',
        (Race.round.is_(None)) | (Race.round > 0),
    )
    if season:
        query = query.filter(Race.season == season)
    if series:
        query = query.filter(Race.series == series)
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
    series = request.args.get("series")
    
    if series in ['f2', 'f3']:
        if season is not None and season != 2026 and Race.query.filter_by(series=series, season=season).count() == 0:
            payload = {"season": season, "data": []}
            _attach_progress(payload, season, series, scraped_rows=[])
            return jsonify(payload)
        scraped_data = get_standings(series, 'driver')
        if scraped_data:
            payload = {"season": season, "data": scraped_data}
            _attach_progress(payload, season or 2026, series, scraped_rows=scraped_data)
            return jsonify(payload)

    aggregates = _driver_aggregates_sq(season, series)
    latest = _latest_results_sq(season, series)

    query = db.session.query(
            Driver,
            func.coalesce(aggregates.c.points, 0),
            func.coalesce(aggregates.c.wins, 0),
            func.coalesce(aggregates.c.podiums, 0),
            func.coalesce(aggregates.c.races, 0),
            Team.name,
        )
    if season == 2026 and series == "f1":
        query = query.outerjoin(aggregates, aggregates.c.driver_id == Driver.id)
        driver_ids = [34, 39, 36, 238, 13, 46, 32, 1, 35, 9, 20, 29, 31, 49, 27, 43, 236, 47, 45, 48, 237, 18]
        query = query.filter(Driver.id.in_(driver_ids))
    elif season and not current_app.config.get("TESTING"):
        query = query.join(aggregates, aggregates.c.driver_id == Driver.id)
    else:
        query = query.outerjoin(aggregates, aggregates.c.driver_id == Driver.id)
        
    if series and not (season == 2026 and series == "f1"):
        query = query.filter(Driver.series == series)
    
    rows = (
        query
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
    # Regras historicas oficiais de descartes (1950-1990)
    if (series == 'f1' or series is None) and season in DRIVER_DROP_RULES:
        race_idx, _ = _race_index_map(season)
        raw = (
            db.session.query(
                RaceResult.driver_id,
                RaceResult.race_id,
                RaceResult.points + func.coalesce(RaceResult.sprint_points, 0),
            )
            .join(Race, RaceResult.race_id == Race.id)
            .filter(Race.season == season, Race.series == 'f1', RaceResult.status != 'Dummy')
            .all()
        )
        adjusted = historical_driver_points(
            season, ((d, race_idx.get(r, 0), pts) for d, r, pts in raw)
        )
        for row in standing:
            if row["driver_id"] in adjusted:
                row["points"] = adjusted[row["driver_id"]]

        # Re-sort standing after adjusting points
        standing.sort(key=lambda x: (-x["points"], x["driver_name"]))

    for position, row in enumerate(standing, start=1):
        row["position"] = position
    payload = {"season": season, "data": standing}
    _attach_progress(payload, season, series, scraped_rows=standing if series in ("f2", "f3") else None)
    return jsonify(payload)


@bp.get("/standings/teams")
@bp.get("/standings/constructors")
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
    series = request.args.get("series")
    
    if series in ['f2', 'f3']:
        if season is not None and season != 2026 and Race.query.filter_by(series=series, season=season).count() == 0:
            payload = {"season": season, "data": []}
            _attach_progress(payload, season, series, scraped_rows=[])
            return jsonify(payload)
        scraped_data = get_standings(series, 'team')
        if scraped_data:
            payload = {"season": season, "data": scraped_data}
            _attach_progress(payload, season or 2026, series, scraped_rows=scraped_data)
            return jsonify(payload)

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
        .filter(
            RaceResult.status != 'Dummy',
            (Race.round.is_(None)) | (Race.round > 0),
        )
        .group_by(team_id_expr)
    )
    if season:
        query = query.filter(Race.season == season)
    series = request.args.get("series")
    if series:
        query = query.filter(Race.series == series)

    team_names = {team.id: team.name for team in Team.query.all()}
    standing = []
    found_team_ids = set()
    for team_id, points, wins, podiums, races_count in query.all():
        if team_id is None:
            continue
        found_team_ids.add(team_id)
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
        
    # Inject teams with 0 points for 2026 grid
    if season == 2026 and series == "f1":
        active_teams = ["McLaren", "Mercedes", "Red Bull Racing", "Ferrari", "Williams", "Aston Martin", "Alpine", "Haas", "Audi", "Racing Bulls", "Cadillac"]
        # Filter standing to ONLY include active_teams
        standing = [r for r in standing if r["team_name"] in active_teams]
        # Recalculate found_team_ids after filtering
        found_team_ids = {r["team_id"] for r in standing}
        for t_id, t_name in team_names.items():
            if t_name in active_teams and t_id not in found_team_ids:
                standing.append({
                    "team_id": t_id,
                    "team_name": t_name,
                    "points": 0.0,
                    "wins": 0,
                    "podiums": 0,
                    "races": 0
                })

    official = True
    if (series == "f1" or series is None) and season and season <= BEST_CAR_ONLY_LAST_SEASON:
        # Regras da epoca: so o melhor carro pontua, sem Indy 500, sem ponto de
        # volta mais rapida (anos 50) e com descartes oficiais.
        race_idx, race_names = _race_index_map(season)
        raw = (
            db.session.query(
                team_id_expr,
                RaceResult.race_id,
                RaceResult.points,
                RaceResult.position,
            )
            .join(Driver, RaceResult.driver_id == Driver.id)
            .join(Race, RaceResult.race_id == Race.id)
            .filter(Race.season == season, Race.series == "f1", RaceResult.status != "Dummy")
            .all()
        )
        adjusted = historical_team_points(
            season,
            (
                (t, r, race_idx.get(r, 0), race_names.get(r), pts, pos)
                for t, r, pts, pos in raw
            ),
        )
        standing = [row for row in standing if row["team_id"] in adjusted]
        for row in standing:
            row["points"] = adjusted[row["team_id"]]
        official = season >= FIRST_CONSTRUCTORS_SEASON

    standing.sort(key=lambda row: (-row["points"], row["team_name"] or ""))

    for position, row in enumerate(standing, start=1):
        row["position"] = position
    payload = {"season": season, "data": standing}
    _attach_progress(payload, season, series, scraped_rows=standing if series in ("f2", "f3") else None)
    if not official:
        payload["official"] = False
        payload["note"] = (
            "A Copa de Construtores da FIA so foi criada em 1958. "
            "Classificacao retroativa nao-oficial."
        )
    return jsonify(payload)
