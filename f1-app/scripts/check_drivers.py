from app import create_app
from app.models import Driver

app = create_app()
with app.app_context():
    drivers = Driver.query.filter_by(series='f1').all()
    print(f"Total F1 drivers: {len(drivers)}")
    recent_drivers = []
    # Let's get drivers who raced in 2024 or 2025
    from app.models import RaceResult, Race
    for season in [2024, 2025]:
        sq = RaceResult.query.join(Race).filter(Race.season == season).all()
        for rr in sq:
            if rr.driver not in recent_drivers and rr.driver.series == 'f1':
                recent_drivers.append(rr.driver)
    
    print(f"Drivers who raced in 24/25: {len(recent_drivers)}")
    for d in recent_drivers:
        print(f"{d.first_name} {d.last_name}")
