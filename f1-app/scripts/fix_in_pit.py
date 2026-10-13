import re

with open('../f1-api/app/api/live.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''                                'last_lap': laps_val,
                                'in_pit': int(item.get('position', 0)) > 12  # Simulando pitlane para os últimos 10 carros para demonstrar a UI'''

new_block = '''                                'last_lap': laps_val,
                                'in_pit': item.get('in_pit', False)  # Usando o status real raspado baseado no tempo de volta'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('../f1-api/app/api/live.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed live.py to use real in_pit data!")
else:
    print("Block not found!")
