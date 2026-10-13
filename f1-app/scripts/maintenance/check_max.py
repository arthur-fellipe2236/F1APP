from app import create_app
from app.models import Driver
app = create_app()
with app.app_context():
    d = Driver.query.get(13)
    print(d.first_name, d.last_name, d.team.name if d.team else "None", d.code)
