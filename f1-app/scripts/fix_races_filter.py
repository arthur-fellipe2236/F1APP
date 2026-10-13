import re

with open('../f1-api/app/api/races.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = '''    query = Race.query
    season = parse_int(request.args.get("season"), "season")
    if season:
        query = query.filter_by(season=season)
    query = query.order_by(Race.season.desc(), Race.round)
    return jsonify(paginate(query, Race.to_dict))'''

new_logic = '''    query = Race.query
    season = parse_int(request.args.get("season"), "season")
    series = request.args.get("series")
    
    if season:
        query = query.filter_by(season=season)
    if series:
        query = query.filter_by(series=series)
        
    query = query.order_by(Race.season.desc(), Race.round)
    return jsonify(paginate(query, Race.to_dict))'''

content = content.replace(old_logic, new_logic)

with open('../f1-api/app/api/races.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("races.py updated to filter by series")
