from app import create_app
from app.sync import sync_season
from app.ergast import JolpicaError
from app.extensions import db
import time

app = create_app()
with app.app_context():
    for y in [1999, 1998, 1997, 1996, 1995]:
        print(f"Syncing {y}...")
        while True:
            try:
                sync_season(y, force=False)
                print(f"Success {y}")
                break
            except JolpicaError:
                print(f"429 rate limit hit, rolling back and sleeping 20s...")
                db.session.rollback()
                time.sleep(20)
            except Exception as e:
                if "PendingRollbackError" in str(e) or "UNIQUE constraint failed" in str(e):
                    db.session.rollback()
                    print("Rolled back due to collision. Sleeping 5s...")
                    time.sleep(5)
                else:
                    print(f"Error {y}: {e}")
                    db.session.rollback()
                    time.sleep(10)
