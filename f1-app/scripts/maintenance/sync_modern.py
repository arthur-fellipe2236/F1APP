from app import create_app
from app.sync import sync_season
import sys

app = create_app()
with app.app_context():
    for y in [2026, 2025, 2023, 2022]:
        print(f"Syncing {y}...")
        try:
            sync_season(y, force=True)
            print(f"Success {y}")
        except Exception as e:
            print(f"Error {y}: {e}")
            import traceback
            traceback.print_exc()
