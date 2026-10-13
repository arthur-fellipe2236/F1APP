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


def _winner_for(circuit_id, season=None, race_type="feature"):
    """Vencedor da corrida mais recente do circuito (ou da temporada dada)."""
    if season == 2026 and race_type == "sprint":
        circuit = Circuit.query.get(circuit_id)
        if not circuit:
            return None
            
        sprint_winners = {
            "Shanghai International Circuit": "Andrea Kimi Antonelli", # Wait, user said China is George Russell! Let's follow user:
            "Shanghai International Circuit": "George Russell",
            "Miami International Autodrome": "Lando Norris",
            "Circuit Gilles-Villeneuve": "George Russell",
            "Silverstone Circuit": "Andrea Kimi Antonelli",
            "Circuit Zandvoort": "George Russell"
        }
        
        w_name = sprint_winners.get(circuit.name)
        if w_name:
            parts = w_name.split(" ")
            fname = parts[0]
            lname = " ".join(parts[1:])
            driver = Driver.query.filter_by(first_name=fname, last_name=lname).first()
            if driver:
                return {
                    "name": driver.full_name,
                    "code": driver.code,
                    "nationality": driver.nationality,
                    "headshot_url": driver.headshot_url,
                }
        return None

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
        "headshot_url": driver.headshot_url,
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
      - in: query
        name: series
        schema:
          type: string
    """
    season = parse_int(request.args.get("season"), "season")
    series = request.args.get("series", "f1")
    race_type = request.args.get("race_type", "feature")

    if series in ["f2", "f3"]:
        query = (
            db.session.query(Circuit, func.min(Race.round).label("round"))
            .join(Race, Race.circuit_id == Circuit.id)
            .filter(Race.season == season, Race.series == series)
            .group_by(Circuit.id)
            .order_by(func.min(Race.round))
        )
        base_results = query.all()
        
        data = []
        
        if series == "f3" and season == 2026:
            # Hardcoded F3 2026 Winners
            # Structure: round: {"sprint": "Driver Name", "feature": "Driver Name"}
            f3_winners_2026 = {
                1: {"sprint": "Bruno del Pino", "feature": "Ugo Ugochukwu"},
                2: {"sprint": "Gerrard Xie", "feature": "Brando Badoer"},
                3: {"sprint": "James Wharton", "feature": "Théophile Naël"},
                4: {"sprint": "Ernesto Rivera", "feature": "Noah Strømsted"},
                5: {"sprint": "Ugo Ugochukwu", "feature": "Maciej Gładysz"},
                6: {"sprint": "Kean Nakamura-Berta", "feature": "Ernesto Rivera"},
                7: {"sprint": "Théophile Naël", "feature": "Freddie Slater"},
                8: {"sprint": "Taito Kato", "feature": "Nicola Lacorte"},
                9: {"sprint": "Théophile Naël", "feature": "Pedro Clerot & Tuukka Taponen"}
            }
            
            for row in base_results:
                c_dict = row[0].to_dict()
                rnd = row[1]
                c_dict["round"] = rnd
                
                from app.mock_data import F3_2026_DRIVERS
                
                winner_name = f3_winners_2026.get(rnd, {}).get(race_type, "—")
                
                photo_url = "https://res.cloudinary.com/prod-f2f3/q_auto/v1770000000/common/f3/2026/fallback/driver/2026fallbackdriverright.webp"
                code = winner_name[:3].upper() if winner_name != "—" else ""
                
                if winner_name != "—":
                    search_name = winner_name.split(" & ")[0]
                    for d in F3_2026_DRIVERS:
                        full = f"{d['first_name']} {d['last_name']}"
                        if full == search_name:
                            photo_url = d.get("headshot_url") or photo_url
                            code = d["code"]
                            break
                            
                c_dict["winner"] = {
                    "name": winner_name,
                    "code": code,
                    "nationality": "—",
                    "headshot_url": photo_url
                }
                c_dict["sprint_winner"] = c_dict["winner"]
                data.append(c_dict)
                
        else:
            # Fallback for F2 or other seasons (Mock logic)
            import random
            from app.mock_data import F2_2026_DRIVERS, F3_2026_DRIVERS
            drivers_list = F2_2026_DRIVERS if series == "f2" else F3_2026_DRIVERS

            def get_random_winner(seed_val):
                rng = random.Random(seed_val)
                d = rng.choice(drivers_list)
                return {
                    "name": f"{d['first_name']} {d['last_name']}",
                    "code": d["code"],
                    "nationality": d["nationality"],
                    "headshot_url": d.get("headshot_url") or "https://res.cloudinary.com/prod-f2f3/q_auto/v1770000000/common/f3/2026/fallback/driver/2026fallbackdriverright.webp"
                }
                
            for row in base_results:
                c_dict = row[0].to_dict()
                rnd = row[1]
                c_dict["round"] = rnd
                
                c_dict["winner"] = get_random_winner(f"winner-{series}-{season}-{rnd}-{race_type}")
                c_dict["sprint_winner"] = get_random_winner(f"sprint-{series}-{season}-{rnd}")
                data.append(c_dict)
            
        return jsonify({
            "data": data,
            "meta": {
                "current_page": 1,
                "per_page": len(data),
                "total_pages": 1,
                "total_items": len(data)
            }
        })

    # For F1
    if season:
        query = (
            db.session.query(Circuit, func.min(Race.round).label("round"))
            .join(Race, Race.circuit_id == Circuit.id)
            .filter(Race.season == season, Race.series == "f1")
            .group_by(Circuit.id)
            .order_by(func.min(Race.round))
        )
        return jsonify(
            paginate(
                query,
                lambda row: {
                    **row[0].to_dict(),
                    "round": row[1],
                    "winner": _winner_for(row[0].id, season, race_type),
                    "sprint_winner": _winner_for(row[0].id, season, "sprint"),
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
