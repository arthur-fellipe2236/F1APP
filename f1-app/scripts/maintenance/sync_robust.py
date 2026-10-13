from app import create_app
from app.sync import sync_season
from app.ergast import JolpicaError
import sys
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
                print(f"429 rate limit hit, sleeping for 15s...")
                time.sleep(15)
            except Exception as e:
                if "PendingRollbackError" in str(e) or "UNIQUE constraint failed" in str(e):
                    from app.extensions import db
                    db.session.rollback()
                    print("Rolled back due to collision. Retrying...")
                    time.sleep(2)
                else:
                    print(f"Error {y}: {e}")
                    import traceback
                    traceback.print_exc()
                    break
