import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the mock block and replace the dynamic dates with the absolute synced session times
old_block = '''                    "date_start": datetime.now(timezone.utc).isoformat(),
                    "date_end": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),'''

new_block = '''                    "date_start": "2026-10-02T04:30:00+00:00",
                    "date_end": "2026-10-02T05:30:00+00:00",'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Dates synchronized to absolute session time.")
else:
    print("Block not found!")
