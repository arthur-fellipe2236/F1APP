import re

with open('../f1-api/app/api/races.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_singapore = """        {
            "round": 18,
            "name": "Singapore Grand Prix", "country": "Singapura", "location": "Marina Bay", "circuit": "Marina Bay Street Circuit", 
            "weekend_start": "2026-10-09", "weekend_end": "2026-10-11",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-09T06:30:00-03:00", "date_end": "2026-10-09T07:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-10-09T10:00:00-03:00", "date_end": "2026-10-09T11:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-10-10T06:30:00-03:00", "date_end": "2026-10-10T07:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-10-10T10:00:00-03:00", "date_end": "2026-10-10T11:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-10-11T09:00:00-03:00", "date_end": "2026-10-11T11:00:00-03:00"}
            ]
        },"""

new_singapore = """        {
            "round": 18,
            "name": "Singapore Grand Prix", "country": "Singapura", "location": "Marina Bay", "circuit": "Marina Bay Street Circuit", 
            "weekend_start": "2026-10-09", "weekend_end": "2026-10-11",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-09T05:30:00-03:00", "date_end": "2026-10-09T06:30:00-03:00"},
                {"name": "Classificação Sprint", "type": "Qualifying", "date_start": "2026-10-09T09:30:00-03:00", "date_end": "2026-10-09T10:15:00-03:00"},
                {"name": "Corrida Sprint", "type": "Race", "date_start": "2026-10-10T06:00:00-03:00", "date_end": "2026-10-10T07:00:00-03:00"},
                {"name": "Classificação Principal", "type": "Qualifying", "date_start": "2026-10-10T10:00:00-03:00", "date_end": "2026-10-10T11:00:00-03:00"},
                {"name": "Corrida Principal", "type": "Race", "date_start": "2026-10-11T09:00:00-03:00", "date_end": "2026-10-11T11:00:00-03:00"}
            ]
        },"""

content = content.replace(old_singapore, new_singapore)

with open('../f1-api/app/api/races.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("races.py updated!")
