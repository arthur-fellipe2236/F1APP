from app import create_app
from app.sync import _sync_race_jolpica, ergast
from app.models import Race
import time

app = create_app()
with app.app_context():
    for y in [1999, 1998, 1997, 1996, 1995]:
        print(f"Syncing {y}...")
        calendar = ergast.get(str(y))
        rounds = sorted(int(r["round"]) for r in calendar)
        
        for r in rounds:
            existing = Race.query.filter_by(season=y, round=r).first()
            if existing:
                print(f"Skipping {y} round {r} (already in DB)")
                continue
                
            print(f"Fetching {y} round {r}...")
            while True:
                try:
                    _sync_race_jolpica(y, r)
                    break
                except Exception as e:
                    print(f"Error on {y} round {r}: {e}, sleeping 15s...")
                    time.sleep(15)
                    from app.extensions import db
                    db.session.rollback()
        print(f"Success {y}")
