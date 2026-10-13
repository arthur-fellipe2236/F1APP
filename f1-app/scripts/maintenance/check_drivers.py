from app import create_app
from app.extensions import db
from app.models import Driver

app = create_app()
with app.app_context():
    drivers = Driver.query.filter(Driver.last_name.like('%Ver%')).all()
    for d in drivers:
        print(f"ID: {d.id}, Name: {d.first_name} {d.last_name}, Code: {d.code}, TeamID: {d.team_id}")
