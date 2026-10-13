import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''                                'gap_to_leader': gap_val if gap_val > 0 else 0.0,
                                'interval': int_val if int_val > 0 else 0.0,
                                'lap_number': laps_val,
                                'compound': item.get('compound', d['comp']),
                                'stops': int(elapsed_sec / 1800),
                                'last_lap': laps_val'''

new_block = '''                                'gap_to_leader': gap_val if gap_val > 0 else 0.0,
                                'interval': int_val if int_val > 0 else 0.0,
                                'lap_number': laps_val,
                                'compound': item.get('compound', d['comp']),
                                'stops': int(elapsed_sec / 1800),
                                'last_lap': laps_val,
                                'in_pit': int(item.get('position', 0)) > 12  # Simulando pitlane para os últimos 10 carros para demonstrar a UI'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added in_pit property to drivers!")
else:
    print("Block not found!")
