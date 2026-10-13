import re
from datetime import datetime, timedelta, timezone

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the start time dynamic so the session is ALWAYS live for testing
old_times = '''            now_utc = datetime.now(timezone.utc)
            start_iso = "2026-10-02T04:30:00+00:00"
            end_iso = "2026-10-02T05:30:00+00:00"
            start_dt = datetime.fromisoformat(start_iso)'''

new_times = '''            now_utc = datetime.now(timezone.utc)
            # FORCE SESSION TO BE ALWAYS LIVE (Started 45 mins ago)
            start_dt = now_utc - timedelta(minutes=45)
            end_dt = start_dt + timedelta(minutes=60)
            start_iso = start_dt.isoformat()
            end_iso = end_dt.isoformat()'''

if old_times in content:
    content = content.replace(old_times, new_times)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed live.py to always be live!")
else:
    print("Block not found!")
