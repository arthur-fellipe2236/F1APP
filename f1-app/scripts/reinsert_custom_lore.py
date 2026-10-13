import re

with open('../f1-api/app/api/races.py', 'r') as f:
    content = f.read()

new_payload = '''
def _next_race_payload():
    now = datetime.now(timezone.utc)

    # Calendário Customizado 2026 (Com Fuso de Brasília UTC-3)
    custom_2026 = [
        {
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
        },
        {
            "round": 17,
            "name": "Singapore Grand Prix", "country": "Singapura", "location": "Marina Bay", "circuit": "Marina Bay Street Circuit", 
            "weekend_start": "2026-10-09", "weekend_end": "2026-10-11",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-09T06:30:00-03:00", "date_end": "2026-10-09T07:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-10-09T10:00:00-03:00", "date_end": "2026-10-09T11:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-10-10T06:30:00-03:00", "date_end": "2026-10-10T07:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-10-10T10:00:00-03:00", "date_end": "2026-10-10T11:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-10-11T09:00:00-03:00", "date_end": "2026-10-11T11:00:00-03:00"}
            ]
        },
        {
            "round": 18,
            "name": "United States Grand Prix", "country": "Estados Unidos", "location": "Austin", "circuit": "Circuit of The Americas", 
            "weekend_start": "2026-10-23", "weekend_end": "2026-10-25",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-23T14:30:00-03:00", "date_end": "2026-10-23T15:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-10-23T18:00:00-03:00", "date_end": "2026-10-23T19:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-10-24T14:00:00-03:00", "date_end": "2026-10-24T15:00:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-10-24T18:00:00-03:00", "date_end": "2026-10-24T19:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-10-25T16:00:00-03:00", "date_end": "2026-10-25T18:00:00-03:00"}
            ]
        },
        {
            "round": 19,
            "name": "Mexico City Grand Prix", "country": "México", "location": "Cidade do México", "circuit": "Autódromo Hermanos Rodríguez", 
            "weekend_start": "2026-10-30", "weekend_end": "2026-11-01",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-10-30T15:30:00-03:00", "date_end": "2026-10-30T16:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-10-30T19:00:00-03:00", "date_end": "2026-10-30T20:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-10-31T14:30:00-03:00", "date_end": "2026-10-31T15:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-10-31T18:00:00-03:00", "date_end": "2026-10-31T19:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-11-01T17:00:00-03:00", "date_end": "2026-11-01T19:00:00-03:00"}
            ]
        },
        {
            "round": 20,
            "name": "São Paulo Grand Prix", "country": "Brasil", "location": "São Paulo", "circuit": "Autódromo José Carlos Pace", 
            "weekend_start": "2026-11-06", "weekend_end": "2026-11-08",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-11-06T11:30:00-03:00", "date_end": "2026-11-06T12:30:00-03:00"},
                {"name": "Classificatória Sprint", "type": "Qualifying", "date_start": "2026-11-06T15:30:00-03:00", "date_end": "2026-11-06T16:15:00-03:00"},
                {"name": "Corrida Sprint", "type": "Race", "date_start": "2026-11-07T11:00:00-03:00", "date_end": "2026-11-07T12:00:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-11-07T15:00:00-03:00", "date_end": "2026-11-07T16:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-11-08T14:00:00-03:00", "date_end": "2026-11-08T16:00:00-03:00"}
            ]
        },
        {
            "round": 21,
            "name": "Las Vegas Grand Prix", "country": "Estados Unidos", "location": "Las Vegas", "circuit": "Las Vegas Strip Circuit", 
            "weekend_start": "2026-11-19", "weekend_end": "2026-11-21",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-11-19T23:30:00-03:00", "date_end": "2026-11-20T00:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-11-20T03:00:00-03:00", "date_end": "2026-11-20T04:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-11-20T23:30:00-03:00", "date_end": "2026-11-21T00:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-11-21T03:00:00-03:00", "date_end": "2026-11-21T04:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-11-22T03:00:00-03:00", "date_end": "2026-11-22T05:00:00-03:00"}
            ]
        },
        {
            "round": 22,
            "name": "Qatar Grand Prix", "country": "Catar", "location": "Lusail", "circuit": "Lusail International Circuit", 
            "weekend_start": "2026-11-27", "weekend_end": "2026-11-29",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-11-27T10:30:00-03:00", "date_end": "2026-11-27T11:30:00-03:00"},
                {"name": "Classificatória Sprint", "type": "Qualifying", "date_start": "2026-11-27T14:30:00-03:00", "date_end": "2026-11-27T15:15:00-03:00"},
                {"name": "Corrida Sprint", "type": "Race", "date_start": "2026-11-28T10:00:00-03:00", "date_end": "2026-11-28T11:00:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-11-28T14:00:00-03:00", "date_end": "2026-11-28T15:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-11-29T14:00:00-03:00", "date_end": "2026-11-29T16:00:00-03:00"}
            ]
        },
        {
            "round": 23,
            "name": "Abu Dhabi Grand Prix", "country": "Emirados Árabes Unidos", "location": "Abu Dhabi", "circuit": "Yas Marina Circuit", 
            "weekend_start": "2026-12-04", "weekend_end": "2026-12-06",
            "sessions": [
                {"name": "Treino Livre 1", "type": "Practice", "date_start": "2026-12-04T06:30:00-03:00", "date_end": "2026-12-04T07:30:00-03:00"},
                {"name": "Treino Livre 2", "type": "Practice", "date_start": "2026-12-04T10:00:00-03:00", "date_end": "2026-12-04T11:00:00-03:00"},
                {"name": "Treino Livre 3", "type": "Practice", "date_start": "2026-12-05T07:30:00-03:00", "date_end": "2026-12-05T08:30:00-03:00"},
                {"name": "Classificação", "type": "Qualifying", "date_start": "2026-12-05T11:00:00-03:00", "date_end": "2026-12-05T12:00:00-03:00"},
                {"name": "Corrida", "type": "Race", "date_start": "2026-12-06T10:00:00-03:00", "date_end": "2026-12-06T12:00:00-03:00"}
            ]
        }
    ]
    
    for race in custom_2026:
        # Pega o horário da corrida principal para comparar
        race_dt = datetime.fromisoformat(race["sessions"][-1]["date_start"])
        if race_dt > now:
            for s in race["sessions"]:
                s["key"] = hash(s["name"] + race["name"]) % 100000
                sess_dt = datetime.fromisoformat(s["date_start"])
                s["state"] = "upcoming" if sess_dt > now else "past"
            return {
                "source": "formula1.com-2026-custom",
                "round": race["round"],
                "name": race["name"],
                "country": race["country"],
                "location": race["location"],
                "circuit": race["circuit"],
                "weekend_start": race["weekend_start"],
                "weekend_end": race["weekend_end"],
                "race_start": race["sessions"][-1]["date_start"],
                "sessions": race["sessions"]
            }
            
    return None
'''

# Use regex to replace the function `def _next_race_payload():` and everything inside it up to `@bp.get("/next-race")`
pattern = r'def _next_race_payload\(\):.*?return None\n\n\n@bp\.get\("/next-race"\)'
content = re.sub(pattern, new_payload.strip() + '\n\n\n@bp.get("/next-race")', content, flags=re.DOTALL)

with open('../f1-api/app/api/races.py', 'w') as f:
    f.write(content)

print("Updated races.py with Custom Bahrain logic")
