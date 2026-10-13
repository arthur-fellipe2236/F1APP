from app import create_app
from app.extensions import db
from app.models import Driver

app = create_app()

fixes = {
    13: "Holandês",
    17: "Dinamarquês",
    35: "Tailandês",
    50: "Alemão",
    55: "Australiano"
}

with app.app_context():
    for d_id, nat in fixes.items():
        d = Driver.query.get(d_id)
        if d:
            print(f"Updating {d.first_name} {d.last_name} from {d.nationality} to {nat}")
            d.nationality = nat
    db.session.commit()
    print("Done!")
