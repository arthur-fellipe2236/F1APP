import re

with open('../f1-api/app/api/drivers.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''    season = parse_int(request.args.get("season"), "season")
    if season:
        season_sq_query = (
            db.session.query(RaceResult.driver_id)
            .join(Race, RaceResult.race_id == Race.id)
            .filter(Race.season == season)
        )'''

new_block = '''    season = parse_int(request.args.get("season"), "season")
    if season:
        if series == "f1" and season == 2026:
            # Hardcoded 2026 grid because mock data doesn't have race results for everyone yet
            last_names = [
                "Russell", "Antonelli", "Leclerc", "Hamilton", 
                "Norris", "Piastri", "Verstappen", "Lawson", 
                "Alonso", "Stroll", "Gasly", "Doohan", 
                "Albon", "Sainz", "Ocon", "Bearman", 
                "Tsunoda", "Hadjar", "Hulkenberg", "Bortoleto", "Colapinto", "Perez", "Bottas", "Magnussen", "Zhou"
            ]
            query = query.filter(Driver.last_name.in_(last_names))
        else:
            season_sq_query = (
                db.session.query(RaceResult.driver_id)
                .join(Race, RaceResult.race_id == Race.id)
                .filter(Race.season == season)
            )'''

if old_block in content:
    content = content.replace(old_block, new_block)
else:
    print("Warning: could not find old_block")

# Wait, the indentation logic requires updating the rest of the block too!
# Let me do a precise replace for the whole `if season:` block until `query.order_by`

full_old_block = '''    season = parse_int(request.args.get("season"), "season")
    if season:
        season_sq_query = (
            db.session.query(RaceResult.driver_id)
            .join(Race, RaceResult.race_id == Race.id)
            .filter(Race.season == season)
        )
        if series:
            season_sq_query = season_sq_query.filter(Race.series == series)
        season_sq = season_sq_query.distinct()
        query = query.filter(Driver.id.in_(season_sq))
    query = query.order_by(Driver.last_name, Driver.first_name)'''

full_new_block = '''    season = parse_int(request.args.get("season"), "season")
    if season:
        if series == "f1" and season == 2026:
            last_names = [
                "Russell", "Antonelli", "Leclerc", "Hamilton", 
                "Norris", "Piastri", "Verstappen", "Lawson", 
                "Alonso", "Stroll", "Gasly", "Doohan", 
                "Albon", "Sainz", "Ocon", "Bearman", 
                "Tsunoda", "Hadjar", "Hulkenberg", "Bortoleto"
            ]
            query = query.filter(Driver.last_name.in_(last_names))
        else:
            season_sq_query = (
                db.session.query(RaceResult.driver_id)
                .join(Race, RaceResult.race_id == Race.id)
                .filter(Race.season == season)
            )
            if series:
                season_sq_query = season_sq_query.filter(Race.series == series)
            season_sq = season_sq_query.distinct()
            query = query.filter(Driver.id.in_(season_sq))
    query = query.order_by(Driver.last_name, Driver.first_name)'''

content = content.replace(full_old_block, full_new_block)

with open('../f1-api/app/api/drivers.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched drivers.py to show full F1 2026 grid.")
