import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'def _scheduled_tower\(session\):.*?return \{.*?\}', re.DOTALL)

new_func = '''def _scheduled_tower(session):
    """Sessao futura: busca dados de clima e race control (pre-sessao) se disponiveis."""
    sk = session["session_key"]
    
    # Try to fetch weather and race control messages (e.g. 15-30 mins before session)
    try:
        from app.api.openf1 import openf1
        weather_data = openf1.get("weather", session_key=sk) or []
        race_rows = openf1.get("race_control", session_key=sk) or []
    except Exception:
        weather_data = []
        race_rows = []
        
    weather_last = {}
    if weather_data:
        weather_last = sorted(weather_data, key=lambda w: str(w.get("date", "")))[-1]
        
    flag_value = "PRE-SESSION"
    flags = [r for r in race_rows if r.get("category") == "Flag"]
    if flags:
        flag_value = sorted(flags, key=lambda f: str(f.get("date", "")))[-1].get("flag")
        
    messages = [r for r in race_rows if r.get("category") == "SessionStatus"]
        
    from app.api.live import _meetings_for_year
    return {
        "session": {
            "key": sk,
            "name": session.get("session_name"),
            "type": session.get("session_type"),
            "year": session.get("year"),
            "circuit": session.get("circuit_short_name"),
            "country": session.get("country_name"),
            "location": session.get("location"),
            "meeting_name": _meetings_for_year(session.get("year", 2026)).get(session.get("meeting_key")),
            "date_start": session.get("date_start"),
            "date_end": session.get("date_end"),
            "state": "scheduled",
            "live": False,
        },
        "flag": flag_value,
        "current_lap": None,
        "drivers": [],
        "weather": {
            "air_temperature": weather_last.get("air_temperature"),
            "track_temperature": weather_last.get("track_temperature"),
            "wind_speed": weather_last.get("wind_speed"),
            "humidity": weather_last.get("relative_humidity"),
            "rainfall": weather_last.get("rainfall"),
        },
        "messages": [
            {
                "date": m.get("date"),
                "message": m.get("message"),
                "flag": m.get("flag"),
            }
            for m in sorted(messages, key=lambda m: str(m.get("date", "")))[-6:]
        ],
    }'''

content = re.sub(pattern, new_func, content, count=1)

with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Regex updated _scheduled_tower.")
