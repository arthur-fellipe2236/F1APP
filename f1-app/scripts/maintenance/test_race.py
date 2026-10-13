from app import create_app
from app.models import Race

app = create_app()
with app.app_context():
    r = Race.query.get(172)
    if r:
        print(r.season, r.round, r.name)
