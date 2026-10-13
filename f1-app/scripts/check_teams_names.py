from app import create_app, db
from app.models import Team

app = create_app()
with app.app_context():
    teams = Team.query.filter(Team.name.like('%Williams%') | Team.name.like('%Alpine%') | Team.name.like('%Haas%') | Team.name.like('%Bulls%')).all()
    for t in teams:
        print(f"ID {t.id}: {t.name}")
