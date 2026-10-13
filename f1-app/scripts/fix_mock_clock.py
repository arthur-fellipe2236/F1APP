import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the mock date_start and date_end so the session represents a 1-hour practice that just started
old_dates = '''                    "date_start": datetime.now(timezone.utc).isoformat(),
                    "date_end": datetime.now(timezone.utc).isoformat(),'''

new_dates = '''                    "date_start": datetime.now(timezone.utc).isoformat(),
                    "date_end": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),'''

if old_dates in content:
    content = content.replace(old_dates, new_dates)
    # We also need to add timedelta import to the fallback
    content = content.replace('from datetime import datetime, timezone', 'from datetime import datetime, timezone, timedelta')
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed mock dates for 1-hour session.")
else:
    print("Dates not found.")
