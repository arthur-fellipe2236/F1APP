from app import create_app, db
from app.models import Team

app = create_app()
with app.app_context():
    # Fix Sauber
    sauber = Team.query.filter_by(name="Sauber").first()
    if sauber:
        sauber.base_country = "Suíça"
        sauber.engine_manufacturer = "Audi"
        sauber.founded_year = 1993
        db.session.add(sauber)
        
    # Fix Alpine Typo
    alpine = Team.query.filter_by(name="Alpine").first()
    if alpine:
        alpine.base_country = "França"
        db.session.add(alpine)
        
    # Fix RB Engine for 2026
    rb = Team.query.filter_by(name="RB").first()
    if rb:
        rb.engine_manufacturer = "Red Bull Ford"
        db.session.add(rb)

    db.session.commit()
    print("Fixed missing team data in DB.")
