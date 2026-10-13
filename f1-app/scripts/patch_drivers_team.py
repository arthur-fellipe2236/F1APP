import re

with open('../f1-api/app/api/drivers.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''        team_rows = (
            db.session.query(RaceResult.driver_id, Team.name)
            .join(latest, latest.c.result_id == RaceResult.id)
            .outerjoin(Team, Team.id == RaceResult.team_id)
            .all()
        )
        team_by_driver = {driver_id: name for driver_id, name in team_rows}
        for row in result["data"]:
            row["team_name"] = team_by_driver.get(row["id"])'''

new_block = '''        team_rows = (
            db.session.query(RaceResult.driver_id, Team.name)
            .join(latest, latest.c.result_id == RaceResult.id)
            .outerjoin(Team, Team.id == RaceResult.team_id)
            .all()
        )
        team_by_driver = {driver_id: name for driver_id, name in team_rows}
        for row in result["data"]:
            if season == 2026 and series == "f1":
                d = Driver.query.get(row["id"])
                row["team_name"] = d.team.name if d.team else None
                row["team"] = d.team.to_dict() if d.team else None
            else:
                row["team_name"] = team_by_driver.get(row["id"])'''

if old_block in content:
    content = content.replace(old_block, new_block)
else:
    print("Warning: old block not found.")

with open('../f1-api/app/api/drivers.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched drivers.py to properly embed 2026 team data.")
