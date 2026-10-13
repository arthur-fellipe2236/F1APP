from app import create_app
from app.sync import sync_season
from app.ergast import JolpicaError
from app.extensions import db
import time
import sys

app = create_app()
with app.app_context():
    for y in [1994, 1993, 1992, 1991, 1990]:
        print(f"Syncing {y}...", flush=True)
        while True:
            try:
                sync_season(y, force=False)
                print(f"Success {y}", flush=True)
                break
            except JolpicaError:
                print(f"429 rate limit hit, rolling back and sleeping 20s...", flush=True)
                db.session.rollback()
                time.sleep(20)
            except Exception as e:
                if "PendingRollbackError" in str(e) or "UNIQUE constraint failed" in str(e):
                    db.session.rollback()
                    print("Rolled back due to collision. Sleeping 5s...", flush=True)
                    time.sleep(5)
                else:
                    print(f"Error {y}: {e}", flush=True)
                    db.session.rollback()
                    time.sleep(10)
