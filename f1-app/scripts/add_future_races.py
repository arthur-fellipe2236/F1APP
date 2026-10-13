from app import create_app, db
from app.models import Race, Circuit
from datetime import date

app = create_app()

RACES = [
    (1, "Australian Grand Prix", "2024-03-24", "Albert Park Circuit"),
    (2, "Chinese Grand Prix", "2024-04-21", "Shanghai International Circuit"),
    (3, "Japanese Grand Prix", "2024-04-07", "Suzuka International Racing Course"),
    (4, "Miami Grand Prix", "2024-05-05", "Miami International Autodrome"),
    (5, "Canadian Grand Prix", "2024-06-09", "Circuit Gilles-Villeneuve"),
    (6, "Monaco Grand Prix", "2024-05-26", "Circuit de Monaco"),
    (7, "Barcelona Grand Prix", "2024-06-23", "Circuit de Barcelona-Catalunya"),
    (8, "Austrian Grand Prix", "2024-06-30", "Red Bull Ring"),
    (9, "British Grand Prix", "2024-07-07", "Silverstone Circuit"),
    (10, "Belgian Grand Prix", "2024-07-28", "Circuit de Spa-Francorchamps"),
    (11, "Hungarian Grand Prix", "2024-07-21", "Hungaroring"),
    (12, "Dutch Grand Prix", "2024-08-25", "Circuit Zandvoort"),
    (13, "Italian Grand Prix", "2024-09-01", "Autodromo Nazionale Monza"),
    (14, "Spanish Grand Prix", "2024-06-23", "Circuit de Barcelona-Catalunya"),
    (15, "Azerbaijan Grand Prix", "2024-09-15", "Baku City Circuit"),
    (16, "Singapore Grand Prix", "2024-09-22", "Marina Bay Street Circuit"),
    (17, "United States Grand Prix", "2024-10-20", "Circuit of the Americas"),
    (18, "Mexico City Grand Prix", "2024-10-27", "Autodromo Hermanos Rodriguez"),
    (19, "Sao Paulo Grand Prix", "2024-11-03", "Autodromo Jose Carlos Pace"),
    (20, "Las Vegas Grand Prix", "2024-11-23", "Las Vegas Strip Circuit"),
    (21, "Qatar Grand Prix", "2024-12-01", "Lusail International Circuit"),
    (22, "Abu Dhabi Grand Prix", "2024-12-08", "Yas Marina Circuit"),
    (23, "Bahrain Grand Prix", "2024-03-02", "Sepang International Circuit"), 
    (24, "Saudi Arabian Grand Prix", "2024-03-09", "Jeddah Corniche Circuit"),
]

with app.app_context():
    circuits = {c.name: c for c in Circuit.query.all()}
    
    # Adicionar as corridas que faltam (sem resultados)
    existing_races = {r.round for r in Race.query.filter_by(season=2026, series='f1').all()}
    added = 0
    
    for round_, name, race_date, circuit_key in RACES:
        if round_ not in existing_races:
            if circuit_key not in circuits:
                # Add mock circuit if missing
                c = Circuit(name=circuit_key, city="City", country="Country", laps=50)
                db.session.add(c)
                db.session.flush()
                circuits[circuit_key] = c
                
            when = date.fromisoformat(f"2026-{race_date[5:]}")
            race = Race(
                season=2026, round=round_, name=name,
                date=when, circuit_id=circuits[circuit_key].id, series='f1'
            )
            db.session.add(race)
            added += 1
            
    db.session.commit()
    print(f"Added {added} future races to the 2026 calendar.")
