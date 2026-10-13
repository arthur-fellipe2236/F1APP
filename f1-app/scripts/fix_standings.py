from app import create_app, db
from app.models import RaceResult, Race, Driver, Team

app = create_app()

sprint_winners = {
    "Shanghai International Circuit": "Russell",
    "Miami International Autodrome": "Norris",
    "Circuit Gilles-Villeneuve": "Russell",
    "Silverstone Circuit": "Antonelli",
    "Circuit Zandvoort": "Russell"
}

with app.app_context():
    # Fix Feature Points
    races_2026 = Race.query.filter_by(season=2026, series="f1").all()
    for race in races_2026:
        for rr in race.results:
            if rr.status != "Dummy" and rr.position == 1:
                rr.points = 25
                db.session.add(rr)
        
        # Check sprint winners
        if race.circuit and race.circuit.name in sprint_winners:
            winner_last_name = sprint_winners[race.circuit.name]
            # Find the driver
            driver = Driver.query.filter(Driver.last_name.like(f"%{winner_last_name}%")).first()
            if driver:
                # Find if they already have a race result for this race
                existing_rr = RaceResult.query.filter_by(race_id=race.id, driver_id=driver.id).first()
                if existing_rr:
                    existing_rr.sprint_points = 8
                    db.session.add(existing_rr)
                else:
                    new_rr = RaceResult(
                        race_id=race.id,
                        driver_id=driver.id,
                        team_id=driver.team_id,
                        position=None, # They didn't win the feature race
                        points=0,
                        sprint_points=8,
                        status="Finished"
                    )
                    db.session.add(new_rr)

    db.session.commit()
    print("Database points updated for 2026 standings.")

    import re
    # Patch standings.py
    with open('../f1-api/app/api/standings.py', 'r', encoding='utf-8') as f:
        content = f.read()
        
    old_block = '''    if season:
        query = query.join(aggregates, aggregates.c.driver_id == Driver.id)
    else:
        query = query.outerjoin(aggregates, aggregates.c.driver_id == Driver.id)
    if series:
        query = query.filter(Driver.series == series)'''

    # Using the current 2026 grid IDs, but it's better to just join the active team ids or filter out Dummy.
    # I can just say: if season == 2026 and series == 'f1', get active grid.
    new_block = '''    if season == 2026 and series == "f1":
        query = query.outerjoin(aggregates, aggregates.c.driver_id == Driver.id)
        # Filter by active 2026 grid
        active_teams = ["McLaren", "Mercedes", "Red Bull Racing", "Ferrari", "Williams", "Aston Martin", "Alpine", "Haas", "Audi", "Racing Bulls", "Cadillac"]
        query = query.join(Team, Driver.team_id == Team.id).filter(Team.name.in_(active_teams))
    elif season:
        query = query.join(aggregates, aggregates.c.driver_id == Driver.id)
    else:
        query = query.outerjoin(aggregates, aggregates.c.driver_id == Driver.id)
        
    if series and not (season == 2026 and series == "f1"):
        query = query.filter(Driver.series == series)'''

    if old_block in content:
        content = content.replace(old_block, new_block)
        with open('../f1-api/app/api/standings.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched standings.py!")
    else:
        print("Warning: old block not found in standings.py")
