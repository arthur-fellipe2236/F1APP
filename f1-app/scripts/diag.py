from app import create_app, db
from app.models import Driver, Team
app = create_app()
with app.app_context():
    albon = Driver.query.filter(Driver.last_name.like('%Albon%')).first()
    if albon:
        print(f"Albon: {albon.first_name} {albon.last_name} - {albon.nationality}")
    
    borto = Driver.query.filter(Driver.last_name.like('%Bortoleto%')).first()
    if borto:
        print(f"Bortoleto: {borto.first_name} {borto.last_name} - {borto.nationality} - Team: {borto.team_id}")
        if borto.team:
            print(f"Bortoleto Team Name: {borto.team.name}")
        
    audi = Team.query.filter_by(name='Audi').first()
    print(f"Audi ID: {audi.id if audi else None}")
