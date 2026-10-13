from app import create_app
from app.models import Team
app = create_app()
with app.app_context():
    print([t.name for t in Team.query.all() if 'benetton' in t.name.lower() or 'brawn' in t.name.lower() or 'onyx' in t.name.lower() or 'eurobrun' in t.name.lower() or 'lola' in t.name.lower() or 'larrousse' in t.name.lower()])
