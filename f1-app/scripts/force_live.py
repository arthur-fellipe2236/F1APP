import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Force detect_session to return a live session
old_func = '''def detect_session(now=None):'''

new_func = '''def detect_session(now=None):
    from datetime import datetime, timezone, timedelta
    now_dt = datetime.now(timezone.utc)
    return {
        "key": 99999,
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

if old_func in content:
    content = content.replace(old_func, new_func, 1)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Forced detect_session to be live!")
else:
    print("Block not found!")
