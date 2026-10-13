from app import create_app
from app.sync import sync_season
import sys

app = create_app()
with app.app_context():
    for y in [2014, 2013, 2012, 2011, 2010]:
        print(f"Syncing {y}...")
        try:
            sync_season(y, force=False)
            print(f"Success {y}")
        except Exception as e:
            print(f"Error {y}: {e}")
            import traceback
            traceback.print_exc()
