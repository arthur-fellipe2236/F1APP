from app import create_app, db
from app.models import Race, Circuit
from datetime import date

app = create_app()

# (Round, Name, Race Date YYYY-MM-DD, Circuit Name, Country)
F3_2026_CALENDAR = [
    (1, "Australian Grand Prix (F3)", "2026-03-08", "Melbourne Grand Prix Circuit", "Austrália"),
    (2, "Monaco Grand Prix (F3)", "2026-06-07", "Circuit de Monaco", "Mônaco"),
    (3, "Spanish Grand Prix (Barcelona) (F3)", "2026-06-14", "Circuit de Barcelona-Catalunya", "Espanha"),
    (4, "Austrian Grand Prix (F3)", "2026-06-28", "Red Bull Ring", "Áustria"),
    (5, "British Grand Prix (F3)", "2026-07-05", "Silverstone Circuit", "Reino Unido"),
    (6, "Belgian Grand Prix (F3)", "2026-07-19", "Circuit de Spa-Francorchamps", "Bélgica"),
    (7, "Hungarian Grand Prix (F3)", "2026-07-26", "Hungaroring", "Hungria"),
    (8, "Italian Grand Prix (F3)", "2026-09-06", "Autodromo Nazionale Monza", "Itália"),
    (9, "Spanish Grand Prix (Madrid) (F3)", "2026-09-13", "Madrid Street Circuit", "Espanha")
]

with app.app_context():
    circuits = {c.name: c for c in Circuit.query.all()}
    
    # Clean up any F3 mock races beyond round 9 for 2026
    extra_races = Race.query.filter(Race.season == 2026, Race.series == 'f3', Race.round > 9).all()
    for er in extra_races:
        db.session.delete(er)
        
    db.session.flush()

    for round_, name, race_date, circuit_key, country in F3_2026_CALENDAR:
        if circuit_key not in circuits:
            c = Circuit(name=circuit_key, city=country, country=country, laps=20, series='f3')
            db.session.add(c)
            db.session.flush()
            circuits[circuit_key] = c
            
        race = Race.query.filter_by(season=2026, round=round_, series='f3').first()
        when = date.fromisoformat(race_date)
        
        if race:
            race.name = name
            race.date = when
            race.circuit_id = circuits[circuit_key].id
        else:
            race = Race(
                season=2026, round=round_, name=name,
                date=when, circuit_id=circuits[circuit_key].id, series='f3'
            )
            db.session.add(race)
            
    db.session.commit()
    print("Database updated to perfectly match F3 2026 calendar.")
