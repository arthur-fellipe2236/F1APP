import re

with open('../f1-api/app/api/teams.py', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the previous patch
old_block = '''    if season:
        if series == "f1" and season == 2026:
            # Hardcoded 2026 Grid teams since we don't have full RaceResult mock data for positions 2-10 yet
            f1_2026_grid = [
                "Ferrari", "McLaren", "Mercedes", "Red Bull Racing", 
                "Aston Martin", "Alpine", "Williams", "Haas", 
                "Audi", "Kick Sauber", "Sauber", "Racing Bulls", "RB", "Cadillac"
            ]
            query = query.filter(Team.name.in_(f1_2026_grid))
        else:'''

new_block = '''    if season:
        if series == "f1" and season == 2026:
            # Exactly 10 teams for 2026
            f1_2026_grid = [
                "Mercedes", "Ferrari", "McLaren", "Red Bull Racing", 
                "Aston Martin", "Alpine", "Williams", "Haas", 
                "RB", "Sauber"
            ]
            query = query.filter(Team.name.in_(f1_2026_grid))
        else:'''

if old_block in content:
    content = content.replace(old_block, new_block)
else:
    print("WARNING: Old block not found. Ensure the patch matches exactly.")

with open('../f1-api/app/api/teams.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Restricted F1 2026 grid to 10 teams.")
