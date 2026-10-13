from app import create_app, db
from app.models import Driver, Team

app = create_app()
with app.app_context():
    drivers = Driver.query.filter_by(series='f1').all()
    team_ids = set([d.team_id for d in drivers if d.team_id])
    teams = Team.query.filter(Team.id.in_(team_ids)).all()
    print([t.name for t in teams])
