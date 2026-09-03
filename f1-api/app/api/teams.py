from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Race, RaceResult, Team
from ..sync import TEAM_ENGINES_BY_SEASON
from .helpers import (
    ApiError,
    commit_unique,
    get_or_404,
    paginate,
    parse_int,
    parse_json_body,
    validate_fields,
)

bp = Blueprint("teams", __name__)

ALLOWED_FIELDS = {"name", "base_country", "engine_manufacturer", "founded_year"}


@bp.get("/teams")
def list_teams():
    """
    Lista equipes
    ---
    tags:
      - Teams
    parameters:
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
      - in: query
        name: season
        schema:
          type: integer
        description: So equipes com resultado registrado naquela temporada
    responses:
      200:
        description: Lista paginada de equipes
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/Team'
                meta:
                  $ref: '#/components/schemas/Meta'
    """
    query = Team.query
    season = parse_int(request.args.get("season"), "season")

    def serialize(team):
        data = team.to_dict()
        if season:
            override = TEAM_ENGINES_BY_SEASON.get(team.name, {}).get(season)
            if override:
                data["engine_manufacturer"] = override
        return data

    if season:
        raced_sq = (
            db.session.query(RaceResult.team_id)
            .join(Race, RaceResult.race_id == Race.id)
            .filter(
                Race.season == season,
                RaceResult.team_id.isnot(None),
            )
            .distinct()
        )
        query = query.filter(Team.id.in_(raced_sq))
    query = query.order_by(Team.name)
    return jsonify(paginate(query, serialize))


@bp.post("/teams")
def create_team():
    """
    Cria equipe
    ---
    tags:
      - Teams
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/TeamInput'
    responses:
      201:
        description: Equipe criada
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Team'
      400:
        description: Corpo invalido
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      409:
        description: Equipe com esse nome ja existe
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    data = parse_json_body()
    validate_fields(data, ALLOWED_FIELDS, required=["name"])
    if Team.query.filter_by(name=data["name"]).first():
        raise ApiError("Equipe com esse nome ja existe", 409)

    team = Team(**data)
    db.session.add(team)
    commit_unique("Equipe com esse nome ja existe")
    return jsonify(team.to_dict()), 201


@bp.get("/teams/<int:team_id>")
def get_team(team_id):
    """
    Detalha equipe
    ---
    tags:
      - Teams
    parameters:
      - in: path
        name: team_id
        required: true
        schema:
          type: integer
    responses:
      200:
        description: Equipe
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Team'
      404:
        description: Equipe nao encontrada
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    team = get_or_404(Team, team_id, "Equipe nao encontrada")
    return jsonify(team.to_dict())


@bp.put("/teams/<int:team_id>")
def update_team(team_id):
    """
    Atualiza equipe
    ---
    tags:
      - Teams
    parameters:
      - in: path
        name: team_id
        required: true
        schema:
          type: integer
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/TeamInput'
    responses:
      200:
        description: Equipe atualizada
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Team'
      400:
        description: Corpo invalido
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      404:
        description: Equipe nao encontrada
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      409:
        description: Nome ja em uso
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    team = get_or_404(Team, team_id, "Equipe nao encontrada")
    data = parse_json_body()
    validate_fields(data, ALLOWED_FIELDS)
    new_name = data.get("name")
    if new_name:
        other = Team.query.filter_by(name=new_name).first()
        if other and other.id != team.id:
            raise ApiError("Equipe com esse nome ja existe", 409)
    for field in ALLOWED_FIELDS & data.keys():
        setattr(team, field, data[field])
    commit_unique("Equipe com esse nome ja existe")
    return jsonify(team.to_dict())


@bp.delete("/teams/<int:team_id>")
def delete_team(team_id):
    """
    Remove equipe
    ---
    tags:
      - Teams
    parameters:
      - in: path
        name: team_id
        required: true
        schema:
          type: integer
    responses:
      204:
        description: Equipe removida
      404:
        description: Equipe nao encontrada
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    team = get_or_404(Team, team_id, "Equipe nao encontrada")
    for driver in team.drivers:
        driver.team_id = None
    db.session.delete(team)
    db.session.commit()
    return "", 204
