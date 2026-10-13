import re

with open('../f1-api/app/api/standings.py', 'r', encoding='utf-8') as f:
    content = f.read()

flawed_block2 = '''    if season == 2026 and series == "f1":
        query = query.outerjoin(aggregates, aggregates.c.driver_id == Driver.id)
        # Filter by active 2026 grid using subquery
        active_teams = ["McLaren", "Mercedes", "Red Bull Racing", "Ferrari", "Williams", "Aston Martin", "Alpine", "Haas", "Audi", "Racing Bulls", "Cadillac"]
        team_ids_sq = db.session.query(Team.id).filter(Team.name.in_(active_teams))
        query = query.filter(Driver.team_id.in_(team_ids_sq))
    elif season:'''

# Get the exact 22 IDs from drivers.py logic, or just copy the list of names:
fixed_block2 = '''    if season == 2026 and series == "f1":
        query = query.outerjoin(aggregates, aggregates.c.driver_id == Driver.id)
        last_names = [
            "Russell", "Antonelli", "Leclerc", "Hamilton", 
            "Norris", "Piastri", "Verstappen", "Lawson", 
            "Alonso", "Stroll", "Gasly", "Colapinto", 
            "Albon", "Sainz", "Ocon", "Bearman", 
            "Tsunoda", "Lindblad", "Hulkenberg", "Bortoleto", "Perez", "Bottas"
        ]
        query = query.filter(Driver.last_name.in_(last_names), Driver.first_name != "Jos")
    elif season:'''

if flawed_block2 in content:
    content = content.replace(flawed_block2, fixed_block2)
    with open('../f1-api/app/api/standings.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed driver standings 22 drivers filter.")
else:
    print("Flawed block not found.")
