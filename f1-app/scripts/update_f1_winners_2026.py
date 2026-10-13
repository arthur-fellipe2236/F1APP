from app import create_app, db
from app.models import Race, Circuit, RaceResult, Driver, Team
from datetime import date

app = create_app()

WINNERS_DATA = [
    (1, "Australian Grand Prix", "Melbourne Grand Prix Circuit", "Austrália", "George Russell", "RUS", "Britânico", "Mercedes"),
    (2, "Chinese Grand Prix", "Shanghai International Circuit", "China", "Andrea Kimi Antonelli", "ANT", "Italiano", "Mercedes"),
    (3, "Japanese Grand Prix", "Suzuka International Racing Course", "Japão", "Andrea Kimi Antonelli", "ANT", "Italiano", "Mercedes"),
    (4, "Saudi Arabian Grand Prix", "Jeddah Corniche Circuit", "Arábia Saudita", "Corrida Cancelada", "CAN", "N/A", None), 
    (5, "Miami Grand Prix", "Miami International Autodrome", "Estados Unidos", "Andrea Kimi Antonelli", "ANT", "Italiano", "Mercedes"),
    (6, "Canadian Grand Prix", "Circuit Gilles-Villeneuve", "Canadá", "Andrea Kimi Antonelli", "ANT", "Italiano", "Mercedes"),
    (7, "Monaco Grand Prix", "Circuit de Monaco", "Mônaco", "Andrea Kimi Antonelli", "ANT", "Italiano", "Mercedes"),
    (8, "Spanish Grand Prix (Barcelona)", "Circuit de Barcelona-Catalunya", "Espanha", "Lewis Hamilton", "HAM", "Britânico", "Ferrari"),
    (9, "Austrian Grand Prix", "Red Bull Ring", "Áustria", "George Russell", "RUS", "Britânico", "Mercedes"),
    (10, "British Grand Prix", "Silverstone Circuit", "Reino Unido", "Charles Leclerc", "LEC", "Monegasco", "Ferrari"),
    (11, "Belgian Grand Prix", "Circuit de Spa-Francorchamps", "Bélgica", "Andrea Kimi Antonelli", "ANT", "Italiano", "Mercedes"),
    (12, "Hungarian Grand Prix", "Hungaroring", "Hungria", "Lando Norris", "NOR", "Britânico", "McLaren"),
    (13, "Dutch Grand Prix", "Circuit Zandvoort", "Holanda", "Lando Norris", "NOR", "Britânico", "McLaren"),
    (14, "Italian Grand Prix", "Autodromo Nazionale Monza", "Itália", "Andrea Kimi Antonelli", "ANT", "Italiano", "Mercedes"),
    (15, "Spanish Grand Prix (Madrid)", "Madrid Street Circuit", "Espanha", "Andrea Kimi Antonelli", "ANT", "Italiano", "Mercedes"),
    (16, "Azerbaijan Grand Prix", "Baku City Circuit", "Azerbaijão", "George Russell", "RUS", "Britânico", "Mercedes"),
]

with app.app_context():
    def get_driver(name, code, nat):
        parts = name.split(" ")
        fname = parts[0]
        lname = " ".join(parts[1:]) if len(parts) > 1 else ""
        
        # In python, finding by property isn't direct in query, so filter by first/last name
        d = Driver.query.filter_by(first_name=fname, last_name=lname).first()
        if not d:
            d = Driver(first_name=fname, last_name=lname, code=code, nationality=nat)
            if name == "Corrida Cancelada":
                d.headshot_url = ""
            db.session.add(d)
            db.session.flush()
        return d
        
    def get_team(name):
        if not name: return None
        t = Team.query.filter_by(name=name).first()
        if not t:
            t = Team(name=name, base="N/A", color="#ffffff")
            db.session.add(t)
            db.session.flush()
        return t

    races_2026 = Race.query.filter_by(season=2026, series='f1').all()
    race_ids = [r.id for r in races_2026]
    if race_ids:
        RaceResult.query.filter(RaceResult.race_id.in_(race_ids)).delete(synchronize_session=False)
        db.session.commit()
        
    Race.query.filter(Race.season == 2026, Race.series == 'f1', Race.round <= 16).delete(synchronize_session=False)
    db.session.commit()

    circuits = {c.name: c for c in Circuit.query.all()}
    
    import datetime
    base_date = date(2026, 3, 1)
    
    for rnd, race_name, circ_name, circ_country, driver_name, driver_code, driver_nat, team_name in WINNERS_DATA:
        if circ_name not in circuits:
            c = Circuit(name=circ_name, city=circ_country, country=circ_country, laps=50, series='f1')
            db.session.add(c)
            db.session.flush()
            circuits[circ_name] = c
            
        race_date = base_date + datetime.timedelta(days=rnd*7)
        
        race = Race(season=2026, round=rnd, name=race_name, date=race_date, circuit_id=circuits[circ_name].id, series='f1')
        db.session.add(race)
        db.session.flush()
        
        d = get_driver(driver_name, driver_code, driver_nat)
        t = get_team(team_name)
        
        rr = RaceResult(race_id=race.id, driver_id=d.id, team_id=t.id if t else None, position=1)
        db.session.add(rr)

    db.session.commit()
    print("F1 2026 early calendar and winners updated successfully!")
