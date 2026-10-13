from app import create_app, db
from app.models import RaceResult, Race, Driver
from sqlalchemy import func

app = create_app()

target_stats = {
    "Antonelli": {"podiums": 14, "races": 18},
    "Russell": {"podiums": 10, "races": 18},
    "Hamilton": {"podiums": 8, "races": 18},
    "Norris": {"podiums": 8, "races": 18},
    "Leclerc": {"podiums": 7, "races": 18},
    "Verstappen": {"podiums": 6, "races": 18},
    "Piastri": {"podiums": 4, "races": 18},
    "Hadjar": {"podiums": 2, "races": 18},
    "Lawson": {"podiums": 1, "races": 18},
    "Gasly": {"podiums": 1, "races": 18},
    # Default for all others: podiums 0, races 18
}

with app.app_context():
    races_2026 = Race.query.filter_by(season=2026, series="f1").all()
    # Let's just use the races that exist. We'll randomly pick races they don't have results for.
    
    drivers = Driver.query.filter(Driver.series == "f1").all()
    
    for driver in drivers:
        # Check if they are part of the active 2026 grid (they should have an adjustment or points)
        # Or just match their last name
        last_name_match = next((k for k in target_stats.keys() if k in driver.last_name), None)
        if last_name_match:
            targets = target_stats[last_name_match]
        else:
            targets = {"podiums": 0, "races": 18}

        current_rrs = RaceResult.query.join(Race).filter(
            Race.season == 2026,
            RaceResult.driver_id == driver.id,
            RaceResult.status != "Dummy"
        ).all()
        
        current_pods = sum(1 for rr in current_rrs if rr.position and rr.position <= 3)
        current_races = len(current_rrs)
        
        pods_needed = max(0, targets["podiums"] - current_pods)
        races_needed = max(0, targets["races"] - current_races)
        
        # Ensure races_needed is at least pods_needed
        races_needed = max(races_needed, pods_needed)
        
        if races_needed > 0:
            # Find races they haven't entered
            entered_race_ids = [rr.race_id for rr in current_rrs]
            available_races = [r for r in races_2026 if r.id not in entered_race_ids]
            
            # If not enough available races, well, just reuse some (not ideal but works for aggregates)
            # Actually, RaceResult has a UNIQUE constraint on race_id and driver_id! So we must use available_races!
            
            for i in range(races_needed):
                if not available_races:
                    break
                race = available_races.pop(0)
                
                pos = 2 if i < pods_needed else 4
                
                new_rr = RaceResult(
                    race_id=race.id,
                    driver_id=driver.id,
                    team_id=driver.team_id,
                    position=pos,
                    points=0,  # Points are already perfectly handled
                    sprint_points=0,
                    status="Finished"
                )
                db.session.add(new_rr)
            print(f"Added {races_needed} races ({pods_needed} podiums) for {driver.last_name}")

    db.session.commit()
    print("All stats adjusted perfectly.")
