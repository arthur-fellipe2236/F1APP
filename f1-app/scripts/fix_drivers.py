import re

with open('../f1-api/app/api/drivers.py', 'r', encoding='utf-8') as f:
    content = f.read()

# I will use regex to replace from "season = parse_int(request.args.get('season'), 'season')" down to "query = query.order_by(Driver.last_name, Driver.first_name)"

pattern = re.compile(r'    season = parse_int\(request\.args\.get\("season"\), "season"\)\n    if season:.*?    query = query\.order_by\(Driver\.last_name, Driver\.first_name\)', re.DOTALL)

new_block = '''    season = parse_int(request.args.get("season"), "season")
    if season:
        if series == "f1" and season == 2026:
            last_names = [
                "Russell", "Antonelli", "Leclerc", "Hamilton", 
                "Norris", "Piastri", "Verstappen", "Lawson", 
                "Alonso", "Stroll", "Gasly", "Doohan", 
                "Albon", "Sainz", "Ocon", "Bearman", 
                "Tsunoda", "Hadjar", "Hulkenberg", "Bortoleto", "Perez"
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

content = pattern.sub(new_block, content)

with open('../f1-api/app/api/drivers.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed drivers.py indentation bug")
