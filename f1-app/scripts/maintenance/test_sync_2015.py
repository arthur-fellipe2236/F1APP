from app import create_app
from app.sync import sync_season
app = create_app()
with app.app_context():
    sync_season(2015, force=True)
    from app.models import Race
    print('2015 races:', Race.query.filter_by(season=2015).count())
