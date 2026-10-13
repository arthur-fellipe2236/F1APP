from app import create_app
from app.models import Race

app = create_app()
with app.app_context():
    for r in Race.query.filter_by(season=2026, series='f1').order_by(Race.round).all():
        print(f"Round {r.round}: {r.name}")
