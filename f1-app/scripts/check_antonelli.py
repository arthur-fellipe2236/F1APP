from app import create_app, db
from app.models import Driver

app = create_app()
with app.app_context():
    antonellis = Driver.query.filter(Driver.last_name.like('%Antonelli%')).all()
    for a in antonellis:
        print(f"ID: {a.id} - Name: {a.first_name} {a.last_name}")
