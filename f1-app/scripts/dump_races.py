from app import create_app
from app.models import Race
app = create_app()
with app.app_context():
    races = Race.query.filter_by(season=2026, series='f1').order_by(Race.round).all()
    for r in races:
        print(f"R{r.round}: {r.name} - Circuit: {r.circuit.name}")
