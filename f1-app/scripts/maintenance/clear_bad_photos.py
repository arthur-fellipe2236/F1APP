from app import create_app
from app.models import Driver
from app.extensions import db

app = create_app()

bad_names = ["Damon Hill", "Jacques Villeneuve", "Mika Häkkinen"]

with app.app_context():
    for n in bad_names:
        first, last = n.split(" ", 1)
        d = Driver.query.filter_by(last_name=last).first()
        if d:
            print(f"Clearing headshot for {d.first_name} {d.last_name}")
            d.headshot_url = None
    db.session.commit()
