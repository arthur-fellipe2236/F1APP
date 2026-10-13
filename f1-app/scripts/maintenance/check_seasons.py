from app import create_app
from app.extensions import db
from app.models import Driver, RaceResult, Race

app = create_app()
with app.app_context():
    # find all drivers and group their results by season
    # if a driver raced in both 2012-2014 AND 2015-2024 but their name is suspiciously wrong
    drivers = Driver.query.all()
    for d in drivers:
        results = RaceResult.query.filter_by(driver_id=d.id).join(Race).all()
        if not results: continue
        seasons = sorted(list(set([r.race.season for r in results])))
        if len(seasons) > 1:
            print(f"Driver {d.id} ({d.first_name} {d.last_name}): {seasons[0]} to {seasons[-1]}")
