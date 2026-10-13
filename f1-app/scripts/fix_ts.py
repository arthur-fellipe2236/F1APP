import re

with open('../f1-api/app/api/standings.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''    # Inject teams with 0 points for 2026 grid
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
                })

    standing.sort(key=lambda row: (-row["points"], row["team_name"] or ""))'''

new_block = '''    # Inject teams with 0 points for 2026 grid
    if season == 2026 and series == "f1":
        active_teams = ["McLaren", "Mercedes", "Red Bull Racing", "Ferrari", "Williams", "Aston Martin", "Alpine", "Haas", "Audi", "Racing Bulls", "Cadillac"]
        # Filter standing to ONLY include active_teams
        standing = [r for r in standing if r["team_name"] in active_teams]
        # Recalculate found_team_ids after filtering
        found_team_ids = {r["team_id"] for r in standing}
        for t_id, t_name in team_names.items():
            if t_name in active_teams and t_id not in found_team_ids:
                standing.append({
                    "team_id": t_id,
                    "team_name": t_name,
                    "points": 0.0,
                    "wins": 0,
                    "podiums": 0,
                    "races": 0
                })

    standing.sort(key=lambda row: (-row["points"], row["team_name"] or ""))'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('../f1-api/app/api/standings.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed team standings filter.")
else:
    print("Block not found!")
