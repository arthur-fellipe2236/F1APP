import re

with open('../f1-api/app/api/circuits.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_winner_for = '''def _winner_for(circuit_id, season=None):
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
        "headshot_url": driver.headshot_url,
    }'''

new_winner_for = '''def _winner_for(circuit_id, season=None, race_type="feature"):
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
    }'''

content = content.replace(old_winner_for, new_winner_for)

old_lambda = '''                    "winner": _winner_for(row[0].id, season),'''
new_lambda = '''                    "winner": _winner_for(row[0].id, season, race_type),
                    "sprint_winner": _winner_for(row[0].id, season, "sprint"),'''

content = content.replace(old_lambda, new_lambda)

with open('../f1-api/app/api/circuits.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated F1 Sprint Winners logic in circuits.py")
