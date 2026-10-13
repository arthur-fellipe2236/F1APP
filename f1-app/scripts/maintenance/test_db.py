from app import create_app
from app.models import Race

app = create_app()
with app.app_context():
    for y in [2022, 2023, 2025, 2026]:
        races = Race.query.filter_by(season=y).all()
        print(f"Season {y} has {len(races)} races: {[r.round for r in races]}")
