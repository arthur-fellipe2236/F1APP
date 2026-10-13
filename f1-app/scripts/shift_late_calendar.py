from app import create_app, db
from app.models import Race, Circuit
from datetime import date

app = create_app()

# Shifting the custom lore late calendar to rounds 17-24
CUSTOM_LATE_2026 = [
    (17, "Bahrain Grand Prix", "2026-10-04", "Circuito Internacional de Sepang", "Malásia"),
    (18, "Singapore Grand Prix", "2026-10-11", "Marina Bay Street Circuit", "Singapura"),
    (19, "United States Grand Prix", "2026-10-25", "Circuit of the Americas", "Estados Unidos"),
    (20, "Mexico City Grand Prix", "2026-11-01", "Autodromo Hermanos Rodriguez", "México"),
    (21, "São Paulo Grand Prix", "2026-11-08", "Autódromo José Carlos Pace", "Brasil"),
    (22, "Las Vegas Grand Prix", "2026-11-21", "Las Vegas Strip Circuit", "Estados Unidos"),
    (23, "Qatar Grand Prix", "2026-11-29", "Lusail International Circuit", "Catar"),
    (24, "Abu Dhabi Grand Prix", "2026-12-06", "Yas Marina Circuit", "Emirados Árabes Unidos"),
]

with app.app_context():
    circuits = {c.name: c for c in Circuit.query.all()}
    
    # Delete R17-R25 just in case
    Race.query.filter(Race.season == 2026, Race.series == 'f1', Race.round >= 17).delete(synchronize_session=False)
    
    for round_, name, race_date, circuit_key, country in CUSTOM_LATE_2026:
        if circuit_key not in circuits:
            c = Circuit(name=circuit_key, city=country, country=country, laps=50, series='f1')
            db.session.add(c)
            db.session.flush()
            circuits[circuit_key] = c
            
        when = date.fromisoformat(race_date)
        race = Race(season=2026, round=round_, name=name, date=when, circuit_id=circuits[circuit_key].id, series='f1')
        db.session.add(race)
            
    db.session.commit()
    print("Late calendar shifted to R17-R24 successfully.")
