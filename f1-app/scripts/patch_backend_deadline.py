import re

with open('../f1-api/app/api/fantasy.py', 'r', encoding='utf-8') as f:
    content = f.read()

backend_check = '''
    race_id = data.get("race_id")
    if not race_id:
        return jsonify({"message": "race_id required"}), 400

    race = Race.query.get(race_id)
    if race and race.date:
        import datetime
        from datetime import timezone
        now = datetime.datetime.now(timezone.utc)
        # Combine race.date (Date object) with 15:00 UTC time to approximate race start
        race_dt = datetime.datetime.combine(race.date, datetime.time(15, 0)).replace(tzinfo=timezone.utc)
        deadline = race_dt - datetime.timedelta(hours=48)
        if now > deadline:
            return jsonify({"message": "O prazo de 48 horas antes da corrida ja se esgotou."}), 403

'''

if 'deadline = race_dt' not in content:
    content = re.sub(
        r'race_id = data\.get\("race_id"\)\n\s+if not race_id:\n\s+return jsonify\(\{"message": "race_id required"\}\), 400',
        backend_check.strip(),
        content
    )
    with open('../f1-api/app/api/fantasy.py', 'w', encoding='utf-8') as f:
        f.write(content)
print("Patched backend for deadline")
