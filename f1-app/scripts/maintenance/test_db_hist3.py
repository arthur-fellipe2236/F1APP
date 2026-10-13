from app import create_app
from app.models import Race

app = create_app()
with app.app_context():
    for y in range(2005, 2010):
        races = Race.query.filter_by(season=y).all()
        print(f"Season {y} has {len(races)} races")
