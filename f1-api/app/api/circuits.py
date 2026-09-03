from flask import Blueprint, jsonify, request

from sqlalchemy import desc, func

from ..extensions import db
from ..models import Circuit, Driver, Race, RaceResult
from .helpers import (
    commit_unique,
    get_or_404,
    paginate,
    parse_int,
    parse_json_body,
    validate_fields,
)

bp = Blueprint("circuits", __name__)

ALLOWED_FIELDS = {"name", "city", "country", "length_km", "laps"}


def _winner_for(circuit_id, season=None):
    """Vencedor da corrida mais recente do circuito (ou da temporada dada)."""
    query = (
        db.session.query(Driver)
        .select_from(RaceResult)
        .join(Race, RaceResult.race_id == Race.id)
        .join(Driver, RaceResult.driver_id == Driver.id)
        .filter(
            Race.circuit_id == circuit_id,
            RaceResult.position == 1,
        )
    )
    if season:
        query = query.filter(Race.season == season).order_by(Race.round)
    else:
        query = query.order_by(desc(Race.date))
    driver = query.first()
    if driver is None:
        return None
    return {
        "name": driver.full_name,
        "code": driver.code,
        "nationality": driver.nationality,
    }


@bp.get("/circuits")
def list_circuits():
    """
    Lista circuitos
    ---
    tags:
      - Circuits
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
        description: >-
          So circuitos do calendario daquela temporada, ordenados por
          rodada (cada item inclui os campos 'round' e 'winner')
    responses:
      200:
        description: Lista paginada de circuitos
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/Circuit'
                meta:
                  $ref: '#/components/schemas/Meta'
    """
    season = parse_int(request.args.get("season"), "season")
    if season:
        query = (
            db.session.query(Circuit, func.min(Race.round).label("round"))
            .join(Race, Race.circuit_id == Circuit.id)
            .filter(Race.season == season)
            .group_by(Circuit.id)
            .order_by(func.min(Race.round))
        )
        return jsonify(
            paginate(
                query,
                lambda row: {
                    **row[0].to_dict(),
                    "round": row[1],
                    "winner": _winner_for(row[0].id, season),
                },
            )
        )
    query = Circuit.query.order_by(Circuit.name)
    return jsonify(
        paginate(
            query,
            lambda circuit: {
                **circuit.to_dict(),
                "winner": _winner_for(circuit.id),
            },
        )
    )


@bp.post("/circuits")
def create_circuit():
    """
    Cria circuito
    ---
    tags:
      - Circuits
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CircuitInput'
    responses:
      201:
        description: Circuito criado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Circuit'
      400:
        description: Corpo invalido
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      409:
        description: Circuito com esse nome ja existe
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    data = parse_json_body()
    validate_fields(data, ALLOWED_FIELDS, required=["name"])
    circuit = Circuit(**data)
    db.session.add(circuit)
    commit_unique("Circuito com esse nome ja existe")
    return jsonify(circuit.to_dict()), 201


@bp.get("/circuits/<int:circuit_id>")
def get_circuit(circuit_id):
    """
    Detalha circuito
    ---
    tags:
      - Circuits
    parameters:
      - in: path
        name: circuit_id
        required: true
        schema:
          type: integer
    responses:
      200:
        description: Circuito
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Circuit'
      404:
        description: Circuito nao encontrado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    circuit = get_or_404(Circuit, circuit_id, "Circuito nao encontrado")
    return jsonify(circuit.to_dict())


@bp.put("/circuits/<int:circuit_id>")
def update_circuit(circuit_id):
    """
    Atualiza circuito
    ---
    tags:
      - Circuits
    parameters:
      - in: path
        name: circuit_id
        required: true
        schema:
          type: integer
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CircuitInput'
    responses:
      200:
        description: Circuito atualizado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Circuit'
      400:
        description: Corpo invalido
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      404:
        description: Circuito nao encontrado
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
    circuit = get_or_404(Circuit, circuit_id, "Circuito nao encontrado")
    data = parse_json_body()
    validate_fields(data, ALLOWED_FIELDS)
    for field in ALLOWED_FIELDS & data.keys():
        setattr(circuit, field, data[field])
    commit_unique("Circuito com esse nome ja existe")
    return jsonify(circuit.to_dict())


@bp.delete("/circuits/<int:circuit_id>")
def delete_circuit(circuit_id):
    """
    Remove circuito
    ---
    tags:
      - Circuits
    parameters:
      - in: path
        name: circuit_id
        required: true
        schema:
          type: integer
    responses:
      204:
        description: Circuito removido
      404:
        description: Circuito nao encontrado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    circuit = get_or_404(Circuit, circuit_id, "Circuito nao encontrado")
    db.session.delete(circuit)
    db.session.commit()
    return "", 204
