from app import create_app, db
from app.models import RaceResult, Race, Driver
from sqlalchemy import func

app = create_app()

target_points = {
    "Antonelli": 302,
    "Russell": 236,
    "Hamilton": 199,
    "Norris": 186,
    "Leclerc": 179,
    "Verstappen": 163,
    "Piastri": 120,
    "Hadjar": 86,
    "Lawson": 59,
    "Gasly": 41,
    "Lindblad": 37,
    "Colapinto": 27,
    "Bearman": 20,
    "Bortoleto": 10,
    "Hulkenberg": 7,
    "Ocon": 7,
    "Sainz": 7,
    "Albon": 5,
    "Alonso": 3,
    "Tsunoda": 1,
    "Perez": 0,
    "Bottas": 0
}

with app.app_context():
    # Delete any existing adjustment records
    RaceResult.query.filter_by(status="Adjustment").delete()
    db.session.commit()

    # Find a 2026 race to attach the adjustment to (e.g. Round 1)
    race = Race.query.filter_by(season=2026, round=1).first()

    for last_name, target in target_points.items():
        driver = Driver.query.filter(Driver.last_name.like(f"%{last_name}%"), Driver.first_name != "Jos").first()
        if not driver:
            print(f"Driver {last_name} not found!")
            continue
            
        # Calculate current sum for this driver in 2026
        current_sum = db.session.query(
            func.sum(RaceResult.points + func.coalesce(RaceResult.sprint_points, 0))
        ).join(Race).filter(
            Race.season == 2026,
            RaceResult.driver_id == driver.id,
            RaceResult.status != "Dummy",
            RaceResult.status != "Adjustment"
        ).scalar() or 0
        
        diff = target - current_sum
        
        if diff != 0:
            adj = RaceResult(
                race_id=race.id,
                driver_id=driver.id,
                team_id=driver.team_id,
                position=None,
                points=diff,
                sprint_points=0,
                status="Adjustment"
            )
            db.session.add(adj)
            print(f"Adjusted {driver.full_name} by {diff} to reach {target}")
            
    db.session.commit()
    print("All points adjusted perfectly.")
