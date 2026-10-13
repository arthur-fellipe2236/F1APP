import re

with open('../f1-api/app/api/standings.py', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the flawed patch block with a simpler one that doesn't cause ambiguous columns
flawed_block = '''    if season == 2026 and series == "f1":
        query = query.outerjoin(aggregates, aggregates.c.driver_id == Driver.id)
        # Filter by active 2026 grid
        active_teams = ["McLaren", "Mercedes", "Red Bull Racing", "Ferrari", "Williams", "Aston Martin", "Alpine", "Haas", "Audi", "Racing Bulls", "Cadillac"]
        query = query.join(Team, Driver.team_id == Team.id).filter(Team.name.in_(active_teams))
    elif season:'''

fixed_block = '''    if season == 2026 and series == "f1":
        query = query.outerjoin(aggregates, aggregates.c.driver_id == Driver.id)
        # Filter by active 2026 grid using subquery
        active_teams = ["McLaren", "Mercedes", "Red Bull Racing", "Ferrari", "Williams", "Aston Martin", "Alpine", "Haas", "Audi", "Racing Bulls", "Cadillac"]
        team_ids_sq = db.session.query(Team.id).filter(Team.name.in_(active_teams))
        query = query.filter(Driver.team_id.in_(team_ids_sq))
    elif season:'''

if flawed_block in content:
    content = content.replace(flawed_block, fixed_block)
    with open('../f1-api/app/api/standings.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed standings ambiguous column.")
else:
    print("Warning: flawed block not found.")
