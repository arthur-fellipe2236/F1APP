from app import create_app, db
from app.models import Race, Circuit

app = create_app()
with app.app_context():
    r = Race.query.filter_by(season=2026, series='f1', round=5).first()
    print(f"R5 circuit_id: {r.circuit_id}")
    c = Circuit.query.get(r.circuit_id)
    print(f"R5 circuit name: {c.name}")
    
    # Fix Miami circuit to be Miami International Autodrome!
    miami = Circuit.query.filter_by(name="Miami International Autodrome").first()
    if not miami:
        miami = Circuit(name="Miami International Autodrome", city="Miami", country="Estados Unidos", laps=57, series='f1')
        db.session.add(miami)
        db.session.flush()
        
    r.circuit_id = miami.id
    db.session.commit()
    print("Fixed R5 to use Miami International Autodrome")
