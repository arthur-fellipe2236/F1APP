from app import create_app, db
from app.models import Race, Circuit
from datetime import date

app = create_app()

CUSTOM_LATE_2026 = [
    (16, "Bahrain Grand Prix", "2026-10-04", "Circuito Internacional de Sepang", "Malásia"),
    (17, "Singapore Grand Prix", "2026-10-11", "Marina Bay Street Circuit", "Singapura"),
    (18, "United States Grand Prix", "2026-10-25", "Circuit of the Americas", "Estados Unidos"),
    (19, "Mexico City Grand Prix", "2026-11-01", "Autodromo Hermanos Rodriguez", "México"),
    (20, "São Paulo Grand Prix", "2026-11-08", "Autódromo José Carlos Pace", "Brasil"),
    (21, "Las Vegas Grand Prix", "2026-11-21", "Las Vegas Strip Circuit", "Estados Unidos"),
    (22, "Qatar Grand Prix", "2026-11-29", "Lusail International Circuit", "Catar"),
    (23, "Abu Dhabi Grand Prix", "2026-12-06", "Yas Marina Circuit", "Emirados Árabes Unidos"),
]

with app.app_context():
    circuits = {c.name: c for c in Circuit.query.all()}
    
    # Remove R24 if it exists because our new lore has 23 races.
    r24 = Race.query.filter_by(season=2026, round=24, series='f1').first()
    if r24:
        db.session.delete(r24)
        
    for round_, name, race_date, circuit_key, country in CUSTOM_LATE_2026:
        if circuit_key not in circuits:
            c = Circuit(name=circuit_key, city=country, country=country, laps=50)
            db.session.add(c)
            db.session.flush()
            circuits[circuit_key] = c
            
        race = Race.query.filter_by(season=2026, round=round_, series='f1').first()
        when = date.fromisoformat(race_date)
        
        if race:
            race.name = name
            race.date = when
            race.circuit_id = circuits[circuit_key].id
        else:
            race = Race(
                season=2026, round=round_, name=name,
                date=when, circuit_id=circuits[circuit_key].id, series='f1'
            )
            db.session.add(race)
            
    db.session.commit()
    print("Database updated to perfectly match custom 2026 late calendar.")
