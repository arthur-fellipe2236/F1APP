from app import create_app
from app.extensions import db
from app.models import Race, RaceResult

app = create_app()
with app.app_context():
    for y in [2022, 2023, 2025, 2026]:
        races = Race.query.filter_by(season=y).all()
        print(f"Deleting {len(races)} races for {y}")
        for r in races:
            RaceResult.query.filter_by(race_id=r.id).delete()
            db.session.delete(r)
    db.session.commit()
    print("Done")
