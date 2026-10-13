from app import create_app, db
from app.models import Team

app = create_app()
with app.app_context():
    audi = Team.query.filter_by(name='Audi').first()
    sauber = Team.query.filter_by(name='Sauber').first()
    
    if audi:
        print("Audi exists in DB.")
        # Make sure Audi has correct info
        audi.base_country = "Suíça"
        audi.engine_manufacturer = "Audi"
        audi.founded_year = 1993  # Retaining the Sauber factory legacy
        # Or maybe Audi factory is Germany and founded 2026? 
        # The user just said "o nome da sauber f1 team mudou para a audi"
        # I'll just change Sauber to Audi, or replace Sauber with Audi.
    else:
        print("Audi does not exist in DB.")
        
    if sauber:
        print("Sauber exists in DB.")
        if not audi:
            sauber.name = "Audi"
            print("Renamed Sauber to Audi.")
        else:
            # If Audi exists, delete Sauber? No, Sauber might have historical records.
            # But we only want 10 teams in 2026.
            pass
            
    db.session.commit()
