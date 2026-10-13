from app import create_app
from app.models import Race

app = create_app()
with app.app_context():
    races = Race.query.filter_by(season=2008).all()
    print("DB 2008 rounds:", sorted([r.round for r in races]))
