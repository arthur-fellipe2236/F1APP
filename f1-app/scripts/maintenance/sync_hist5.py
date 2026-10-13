from app import create_app
from app.sync import sync_season
import sys

app = create_app()
with app.app_context():
    for y in [1999, 1998, 1997, 1996, 1995]:
        print(f"Syncing {y}...")
        try:
            sync_season(y, force=False)
            print(f"Success {y}")
        except Exception as e:
            print(f"Error {y}: {e}")
            import traceback
            traceback.print_exc()
