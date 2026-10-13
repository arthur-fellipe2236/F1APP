from app import create_app, db
from app.models import Circuit

app = create_app()

updates = {
    "Autodromo Hermanos Rodriguez": "México",
    "Lusail International Circuit": "Catar",
    "Yas Marina Circuit": "Emirados Árabes Unidos",
    "Las Vegas Strip Circuit": "Estados Unidos",
    "Circuito Internacional de Sepang": "Malásia"
}

with app.app_context():
    for name, country in updates.items():
        c = Circuit.query.filter_by(name=name).first()
        if c:
            c.country = country
    
    # Check for mislabeled 'Country' string
    for c in Circuit.query.filter_by(country="Country").all():
        if "Rodriguez" in c.name:
            c.country = "México"
            
    db.session.commit()
    print("Circuit countries updated in DB.")
