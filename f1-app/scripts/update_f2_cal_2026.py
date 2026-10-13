from app import create_app, db
from app.models import Race, Circuit
from datetime import date

app = create_app()

# Tuple format: (Round, Name, Race Date (YYYY-MM-DD), Circuit Name, Country)
F2_2026_CALENDAR = [
    (1, "Australian Grand Prix (F2)", "2026-03-08", "Melbourne Grand Prix Circuit", "Austrália"),
    (2, "Miami Grand Prix (F2)", "2026-05-03", "Miami International Autodrome", "Estados Unidos"),
    (3, "Canadian Grand Prix (F2)", "2026-05-24", "Circuit Gilles-Villeneuve", "Canadá"),
    (4, "Monaco Grand Prix (F2)", "2026-06-07", "Circuit de Monaco", "Mônaco"),
    (5, "Spanish Grand Prix (Barcelona) (F2)", "2026-06-14", "Circuit de Barcelona-Catalunya", "Espanha"),
    (6, "Austrian Grand Prix (F2)", "2026-06-28", "Red Bull Ring", "Áustria"),
    (7, "British Grand Prix (F2)", "2026-07-05", "Silverstone Circuit", "Reino Unido"),
    (8, "Belgian Grand Prix (F2)", "2026-07-19", "Circuit de Spa-Francorchamps", "Bélgica"),
    (9, "Hungarian Grand Prix (F2)", "2026-07-26", "Hungaroring", "Hungria"),
    (10, "Italian Grand Prix (F2)", "2026-09-06", "Autodromo Nazionale Monza", "Itália"),
    (11, "Spanish Grand Prix (Madrid) (F2)", "2026-09-13", "Madrid Street Circuit", "Espanha"),
    (12, "Azerbaijan Grand Prix (F2)", "2026-09-26", "Baku City Circuit", "Azerbaijão"),
]

with app.app_context():
    circuits = {c.name: c for c in Circuit.query.all()}
    
    # 1. First, delete any F2 2026 races that are > round 12 to clean up mock data
    extra_races = Race.query.filter(Race.season == 2026, Race.series == 'f2', Race.round > 12).all()
    for er in extra_races:
        db.session.delete(er)
        
    db.session.flush()

    for round_, name, race_date, circuit_key, country in F2_2026_CALENDAR:
        if circuit_key not in circuits:
            c = Circuit(name=circuit_key, city=country, country=country, laps=30, series='f2')
            db.session.add(c)
            db.session.flush()
            circuits[circuit_key] = c
            
        race = Race.query.filter_by(season=2026, round=round_, series='f2').first()
        when = date.fromisoformat(race_date)
        
        if race:
            race.name = name
            race.date = when
            race.circuit_id = circuits[circuit_key].id
        else:
            race = Race(
                season=2026, round=round_, name=name,
                date=when, circuit_id=circuits[circuit_key].id, series='f2'
            )
            db.session.add(race)
            
    db.session.commit()
    print("Database updated to perfectly match F2 2026 calendar.")
