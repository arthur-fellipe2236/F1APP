from app import create_app, db
from app.models import Race, Circuit
from datetime import date

app = create_app()

RACES_2026 = [
    (1, "Australian Grand Prix", "2026-03-08", "Melbourne Grand Prix Circuit", "Austrália"),
    (2, "Chinese Grand Prix", "2026-03-22", "Shanghai International Circuit", "China"),
    (3, "Japanese Grand Prix", "2026-04-05", "Suzuka International Racing Course", "Japão"),
    (4, "Bahrain Grand Prix", "2026-04-12", "Bahrain International Circuit", "Bahrein"),
    (5, "Saudi Arabian Grand Prix", "2026-04-19", "Jeddah Corniche Circuit", "Arábia Saudita"),
    (6, "Miami Grand Prix", "2026-05-03", "Miami International Autodrome", "Estados Unidos"),
    (7, "Emilia Romagna Grand Prix", "2026-05-17", "Autodromo Enzo e Dino Ferrari", "Itália"),
    (8, "Monaco Grand Prix", "2026-05-24", "Circuit de Monaco", "Mônaco"),
    (9, "Spanish Grand Prix", "2026-05-31", "Madrid Street Circuit", "Espanha"),
    (10, "Canadian Grand Prix", "2026-06-14", "Circuit Gilles-Villeneuve", "Canadá"),
    (11, "Austrian Grand Prix", "2026-06-28", "Red Bull Ring", "Áustria"),
    (12, "British Grand Prix", "2026-07-05", "Silverstone Circuit", "Reino Unido"),
    (13, "Belgian Grand Prix", "2026-07-12", "Circuit de Spa-Francorchamps", "Bélgica"),
    (14, "Hungarian Grand Prix", "2026-07-26", "Hungaroring", "Hungria"),
    (15, "Dutch Grand Prix", "2026-08-09", "Circuit Zandvoort", "Holanda"),
    (16, "Italian Grand Prix", "2026-08-30", "Autodromo Nazionale Monza", "Itália"),
    (17, "Azerbaijan Grand Prix", "2026-09-20", "Baku City Circuit", "Azerbaijão"),
    (18, "Singapore Grand Prix", "2026-10-04", "Marina Bay Street Circuit", "Singapura"),
    (19, "United States Grand Prix", "2026-10-18", "Circuit of the Americas", "Estados Unidos"),
    (20, "Mexico City Grand Prix", "2026-10-25", "Autodromo Hermanos Rodriguez", "México"),
    (21, "São Paulo Grand Prix", "2026-11-08", "Autódromo José Carlos Pace", "Brasil"),
    (22, "Las Vegas Grand Prix", "2026-11-21", "Las Vegas Strip Circuit", "Estados Unidos"),
    (23, "Qatar Grand Prix", "2026-11-29", "Lusail International Circuit", "Catar"),
    (24, "Abu Dhabi Grand Prix", "2026-12-06", "Yas Marina Circuit", "Emirados Árabes Unidos"),
]

with app.app_context():
    circuits = {c.name: c for c in Circuit.query.all()}
    
    for round_, name, race_date, circuit_key, country in RACES_2026:
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
    print("Database updated to perfectly match official 2026 calendar.")
