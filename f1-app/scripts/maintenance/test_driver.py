from app import create_app
from app.models import Driver

app = create_app()
with app.app_context():
    d = Driver.query.get(41)
    if d:
        print(d.first_name, d.last_name, d.code)
