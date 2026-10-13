import re

with open('../f1-api/app/api/races.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir o bloco antigo do Bahrain pelo bloco com os horários corretos
old_bahrain = '''        {
            "round": 16,
            "name": "Bahrain Grand Prix", "country": "Malásia", "location": "Sepang", "circuit": "Circuito Internacional de Sepang", 
            "weekend_start": "2026-10-02", "weekend_end": "2026-10-04",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-02T04:30:00-03:00", "date_end": "2026-10-02T05:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-10-02T08:00:00-03:00", "date_end": "2026-10-02T09:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-10-03T04:30:00-03:00", "date_end": "2026-10-03T05:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-10-03T08:00:00-03:00", "date_end": "2026-10-03T09:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-10-04T04:00:00-03:00", "date_end": "2026-10-04T06:00:00-03:00"}
            ]
        },'''

new_bahrain = '''        {
            "round": 16,
            "name": "Bahrain Grand Prix", "country": "Malásia", "location": "Sepang", "circuit": "Circuito Internacional de Sepang", 
            "weekend_start": "2026-10-02", "weekend_end": "2026-10-04",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-02T01:30:00-03:00", "date_end": "2026-10-02T02:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-10-02T05:00:00-03:00", "date_end": "2026-10-02T06:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-10-03T01:30:00-03:00", "date_end": "2026-10-03T02:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-10-03T05:00:00-03:00", "date_end": "2026-10-03T06:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-10-04T04:00:00-03:00", "date_end": "2026-10-04T06:00:00-03:00"}
            ]
        },'''

if "2026-10-02T04:30:00-03:00" in content:
    content = content.replace(old_bahrain, new_bahrain)

with open('../f1-api/app/api/races.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Horários do Bahrain atualizados.")
