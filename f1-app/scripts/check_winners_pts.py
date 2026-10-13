from app import create_app, db
from app.models import RaceResult, Race, Driver

app = create_app()
with app.app_context():
    races = Race.query.filter_by(season=2026, series="f1").all()
    print("Winners in DB:")
    for race in races:
        for rr in race.results:
            if rr.position == 1:
                print(f"Race: {race.name} - Winner: {rr.driver.full_name if rr.driver else 'None'} - Points: {rr.points}")
            if rr.sprint_points:
                print(f"Race: {race.name} - Sprint Winner: {rr.driver.full_name if rr.driver else 'None'} - Sprint Points: {rr.sprint_points}")
