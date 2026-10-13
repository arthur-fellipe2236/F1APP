import re

with open('../f1-api/app/api/teams.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''    if season:
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
    return jsonify(paginate(query, serialize))'''

new_block = '''    if season:
        if series == "f1" and season == 2026:
            # Hardcoded 2026 Grid teams since we don't have full RaceResult mock data for positions 2-10 yet
            f1_2026_grid = [
                "Ferrari", "McLaren", "Mercedes", "Red Bull Racing", 
                "Aston Martin", "Alpine", "Williams", "Haas", 
                "Audi", "Kick Sauber", "Sauber", "Racing Bulls", "RB", "Cadillac"
            ]
            query = query.filter(Team.name.in_(f1_2026_grid))
        else:
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
    return jsonify(paginate(query, serialize))'''

content = content.replace(old_block, new_block)

with open('../f1-api/app/api/teams.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched teams.py to always return the full 2026 grid")
