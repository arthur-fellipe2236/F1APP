from app import create_app
from app.extensions import db
from app.models import Driver

app = create_app()
with app.app_context():
    # Fix Vettel
    vet = Driver.query.filter_by(code='VET').first()
    if vet:
        vet.headshot_url = 'https://media.formula1.com/content/dam/fom-website/drivers/S/SEBVET01_Sebastian_Vettel/sebvet01.png'
        db.session.commit()
        print(f"Updated Vettel: {vet.headshot_url}")
    else:
        print("Vettel not found!")
