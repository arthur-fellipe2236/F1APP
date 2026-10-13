from app import create_app, db
from app.models import Team
app = create_app()
with app.app_context():
    teams = Team.query.filter_by(series='f1').all()
    for t in teams:
        print(t.name)
