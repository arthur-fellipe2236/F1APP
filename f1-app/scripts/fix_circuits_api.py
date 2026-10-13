import re

with open('../f1-api/app/api/circuits.py', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to replace the whole `def list_circuits():` up to `@bp.post("/circuits")`
pattern = r'@bp\.get\("/circuits"\)\ndef list_circuits\(\):.*?@bp\.post\("/circuits"\)'

new_func = '''@bp.get("/circuits")
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
        import random
        from app.mock_data import F2_2026_DRIVERS, F3_2026_DRIVERS
        
        query = (
            db.session.query(Circuit, func.min(Race.round).label("round"))
            .join(Race, Race.circuit_id == Circuit.id)
            .filter(Race.season == season, Race.series == series)
            .group_by(Circuit.id)
            .order_by(func.min(Race.round))
        )
        base_results = query.all()
        
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

        data = []
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

@bp.post("/circuits")'''

content = re.sub(pattern, new_func, content, flags=re.DOTALL)

with open('../f1-api/app/api/circuits.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("circuits.py updated successfully!")
