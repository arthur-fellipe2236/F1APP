from app import create_app, db
from app.models import Driver, RaceResult

app = create_app()
with app.app_context():
    antonellis = Driver.query.filter(Driver.last_name.like('%Antonelli%')).all()
    if len(antonellis) > 1:
        print(f"Found {len(antonellis)} Antonellis!")
        # Keep the one that is currently active (assigned to team 1 for Mercedes) or one with "Andrea Kimi"
        primary = next((a for a in antonellis if "Andrea" in a.first_name), antonellis[0])
        secondary = next((a for a in antonellis if a.id != primary.id), None)
        
        if secondary:
            # Transfer race results
            rrs = RaceResult.query.filter_by(driver_id=secondary.id).all()
            for rr in rrs:
                rr.driver_id = primary.id
                db.session.add(rr)
            # Delete secondary
            db.session.delete(secondary)
            db.session.commit()
            print("Merged Antonelli records.")
