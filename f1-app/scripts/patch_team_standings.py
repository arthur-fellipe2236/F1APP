import re

with open('../f1-api/app/api/standings.py', 'r', encoding='utf-8') as f:
    content = f.read()

# We'll just patch the standing list generation in team_standings
# At the end:
old_block_team = '''    standing = []
    for team_id, points, wins, podiums, races_count in query.all():
        if team_id is None:
            continue
        standing.append(
            {
                "team_id": team_id,
                "team_name": team_names.get(team_id),
                "points": float(points or 0),
                "wins": int(wins or 0),
                "podiums": int(podiums or 0),
                "races": int(races_count or 0),
            }
        )'''

new_block_team = '''    standing = []
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
        for t_id, t_name in team_names.items():
            if t_name in active_teams and t_id not in found_team_ids:
                standing.append({
                    "team_id": t_id,
                    "team_name": t_name,
                    "points": 0.0,
                    "wins": 0,
                    "podiums": 0,
                    "races": 0
                })'''

if old_block_team in content:
    content = content.replace(old_block_team, new_block_team)
    with open('../f1-api/app/api/standings.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched team standings.")
else:
    print("Warning: team standing block not found.")
