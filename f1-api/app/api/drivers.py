from flask import Blueprint, jsonify, request

from sqlalchemy import func, or_

from ..extensions import db
from ..models import Driver, Race, RaceResult, Team
from .helpers import (
    ApiError,
    commit_unique,
    get_or_404,
    paginate,
    parse_int,
    parse_json_body,
    validate_fields,
)

bp = Blueprint("drivers", __name__)

ALLOWED_FIELDS = {
    "first_name",
    "last_name",
    "code",
    "permanent_number",
    "nationality",
    "team_id",
}


def _check_team(team_id):
    if team_id is not None and db.session.get(Team, team_id) is None:
        raise ApiError("Equipe informada nao existe")


def _check_uniques(driver, data):
    code = data.get("code")
    if code:
        existing = Driver.query.filter_by(code=code).first()
        if existing and existing.id != driver.id:
            raise ApiError(f"Codigo '{code}' ja esta em uso por outro piloto", 409)
    # permanent_number pode repetir entre eras (Vettel #5, Bortoleto #5),
    # entao nao ha verificacao de unicidade para o numero.


@bp.get("/drivers")
def list_drivers():
    """
    Lista pilotos
    ---
    tags:
      - Drivers
    parameters:
      - in: query
        name: page
        schema:
          type: integer
          default: 1
        description: Pagina
      - in: query
        name: per_page
        schema:
          type: integer
          default: 10
          maximum: 50
        description: Itens por pagina
      - in: query
        name: team_id
        schema:
          type: integer
        description: >-
          Filtra por equipe: inclui pilotos que hoje estao na equipe
          e tambem quem ja correu por ela em qualquer temporada
      - in: query
        name: season
        schema:
          type: integer
        description: Filtra por temporada (pilotos com resultado naquele ano)
    responses:
      200:
        description: Lista paginada de pilotos
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/Driver'
                meta:
                  $ref: '#/components/schemas/Meta'
    """
    query = Driver.query
    team_id = parse_int(request.args.get("team_id"), "team_id")
    if team_id:
        raced_sq = db.session.query(RaceResult.driver_id).filter(
            RaceResult.team_id == team_id
        )
        query = query.filter(
            or_(
                Driver.team_id == team_id,
                Driver.id.in_(raced_sq),
            )
        )
    season = parse_int(request.args.get("season"), "season")
    if season:
        season_sq = (
            db.session.query(RaceResult.driver_id)
            .join(Race, RaceResult.race_id == Race.id)
            .filter(Race.season == season)
            .distinct()
        )
        query = query.filter(Driver.id.in_(season_sq))
    query = query.order_by(Driver.last_name, Driver.first_name)
    result = paginate(query, Driver.to_dict)
    if season:
        latest = (
            db.session.query(
                RaceResult.driver_id.label("driver_id"),
                func.max(RaceResult.id).label("result_id"),
            )
            .join(Race, RaceResult.race_id == Race.id)
            .filter(Race.season == season)
            .group_by(RaceResult.driver_id)
            .subquery()
        )
        team_rows = (
            db.session.query(RaceResult.driver_id, Team.name)
            .join(latest, latest.c.result_id == RaceResult.id)
            .outerjoin(Team, Team.id == RaceResult.team_id)
            .all()
        )
        team_by_driver = {driver_id: name for driver_id, name in team_rows}
        for row in result["data"]:
            row["team_name"] = team_by_driver.get(row["id"])
    return jsonify(result)


@bp.post("/drivers")
def create_driver():
    """
    Cria piloto
    ---
    tags:
      - Drivers
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/DriverInput'
    responses:
      201:
        description: Piloto criado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DriverDetail'
      400:
        description: Corpo invalido ou campos obrigatorios ausentes
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      409:
        description: Codigo ou numero permanente duplicado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    data = parse_json_body()
    validate_fields(data, ALLOWED_FIELDS, required=["first_name", "last_name"])
    data["team_id"] = parse_int(data.get("team_id"), "team_id")
    data["permanent_number"] = parse_int(
        data.get("permanent_number"), "permanent_number"
    )
    _check_team(data["team_id"])

    driver = Driver(
        first_name=data["first_name"],
        last_name=data["last_name"],
        code=data.get("code"),
        permanent_number=data["permanent_number"],
        nationality=data.get("nationality"),
        team_id=data["team_id"],
    )
    _check_uniques(driver, data)
    db.session.add(driver)
    commit_unique("Codigo ou numero permanente ja cadastrado")
    return jsonify(driver.to_dict_detail()), 201


@bp.get("/drivers/<int:driver_id>")
def get_driver(driver_id):
    """
    Detalha piloto
    ---
    tags:
      - Drivers
    parameters:
      - in: path
        name: driver_id
        required: true
        schema:
          type: integer
        description: ID do piloto
    responses:
      200:
        description: Piloto
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DriverDetail'
      404:
        description: Piloto nao encontrado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    driver = get_or_404(Driver, driver_id, "Piloto nao encontrado")
    return jsonify(driver.to_dict_detail())


@bp.put("/drivers/<int:driver_id>")
def update_driver(driver_id):
    """
    Atualiza piloto
    ---
    tags:
      - Drivers
    parameters:
      - in: path
        name: driver_id
        required: true
        schema:
          type: integer
        description: ID do piloto
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/DriverInput'
    responses:
      200:
        description: Piloto atualizado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DriverDetail'
      400:
        description: Corpo invalido
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      404:
        description: Piloto nao encontrado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      409:
        description: Codigo ou numero permanente duplicado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    driver = get_or_404(Driver, driver_id, "Piloto nao encontrado")
    data = parse_json_body()
    validate_fields(data, ALLOWED_FIELDS)

    if "team_id" in data:
        data["team_id"] = parse_int(data["team_id"], "team_id")
        _check_team(data["team_id"])
    if "permanent_number" in data:
        data["permanent_number"] = parse_int(
            data["permanent_number"], "permanent_number"
        )
    _check_uniques(driver, data)

    for field in ALLOWED_FIELDS & data.keys():
        setattr(driver, field, data[field])
    commit_unique("Codigo ou numero permanente ja cadastrado")
    return jsonify(driver.to_dict_detail())


@bp.delete("/drivers/<int:driver_id>")
def delete_driver(driver_id):
    """
    Remove piloto
    ---
    tags:
      - Drivers
    parameters:
      - in: path
        name: driver_id
        required: true
        schema:
          type: integer
        description: ID do piloto
    responses:
      204:
        description: Piloto removido
      404:
        description: Piloto nao encontrado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    driver = get_or_404(Driver, driver_id, "Piloto nao encontrado")
    db.session.delete(driver)
    db.session.commit()
    return "", 204
