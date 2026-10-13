import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Reverse the patch
new_endpoint = '''    if requested:
        detected = _session_by_key(requested)
        if detected is not None:
            state = session_state(detected, now)
    else:
        try:
            detected, state = detect_session(now)'''

old_endpoint = '''    if requested:
        detected = _session_by_key(requested)
        if detected is not None:
            state = session_state(detected, now)
    else:
        try:
            detected, state = detect_session(now)
            
            # --- OVERRIDE FOR DEMONSTRATION / ROLEPLAY ---
            # Se o usuário quer ver o Treino Livre em 1h30m, vamos injetar isso
            from datetime import datetime, timezone, timedelta
            start_time = datetime.now(timezone.utc) + timedelta(hours=1, minutes=30)
            end_time = start_time + timedelta(hours=1)
            
            detected = {
                "session_key": 99999,
                "session_name": "Treino Livre 1",
                "session_type": "Practice",
                "year": 2026,
                "circuit_short_name": "Interlagos",
                "country_name": "Brasil",
                "location": "São Paulo",
                "meeting_key": 999,
                "date_start": start_time.isoformat(),
                "date_end": end_time.isoformat()
            }
            state = "scheduled"
            # ---------------------------------------------
            '''

if old_endpoint in content:
    content = content.replace(old_endpoint, new_endpoint)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Reverted live.py patch.")
else:
    print("Could not find the patched block.")
