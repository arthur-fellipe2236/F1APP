from app import create_app
from app.extensions import db
from app.models import Driver, RaceResult, Race

app = create_app()
with app.app_context():
    d = Driver.query.get(13)
    if d:
        print(f"Driver 13: {d.first_name} {d.last_name}")
        results = RaceResult.query.filter_by(driver_id=13).join(Race).order_by(Race.season).all()
        for r in results:
            print(f"Season {r.race.season} - Round {r.race.round}")
