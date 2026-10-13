from app import create_app
from app.models import Driver, Team, Circuit, RaceResult, Race
from app.extensions import db

app = create_app()

with app.app_context():
    teams = Team.query.join(Driver).join(RaceResult).join(Race).filter(Race.season <= 1994).all()
    print("TEAMS <= 1994:")
    for t in teams:
        print(t.name)

    drivers = Driver.query.join(RaceResult).join(Race).filter(Race.season <= 1994).all()
    nats = set(d.nationality for d in drivers if d.nationality)
    print("\nNATIONALITIES <= 1994:")
    for n in sorted(list(nats)):
        print(n)

    circuits = Circuit.query.join(Race).filter(Race.season <= 1994).all()
    countries = set(c.country for c in circuits if c.country)
    print("\nCOUNTRIES <= 1994:")
    for c in sorted(list(countries)):
        print(c)
