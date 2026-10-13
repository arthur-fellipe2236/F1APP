from app import create_app, db
from app.models import Race

app = create_app()
with app.app_context():
    print("F1 2026 races:", Race.query.filter_by(season=2026, series='f1').count())
