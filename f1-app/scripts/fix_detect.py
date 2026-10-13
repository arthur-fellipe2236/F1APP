import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Force detect_session to just raise the error so it falls into the mock block!
old_func = '''def detect_session(now=None):
    from datetime import datetime, timezone, timedelta
    now_dt = datetime.now(timezone.utc)
    return {
        "session_key": 11727, "meeting_key": 1308,
        "name": "Treino Livre 1",
        "type": "Practice",
        "year": 2026,
        "circuit": "Kuala Lumpur",
        "country": "Malaysia",
        "location": "Kuala Lumpur",
        "meeting_name": "Malaysian Grand Prix",
        "date_start": (now_dt - timedelta(minutes=45)).isoformat(),
        "date_end": (now_dt + timedelta(minutes=15)).isoformat(),
        "state": "live",
        "live": True
    }, None'''

new_func = '''def detect_session(now=None):
    from app.services import openf1
    raise openf1.OpenF1Error("Forcing fallback to mock array")'''

if old_func in content:
    content = content.replace(old_func, new_func, 1)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed detect_session to raise exception!")
else:
    print("Block not found!")
