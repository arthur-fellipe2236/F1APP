from app import create_app, db
from app.models import Driver

app = create_app()
with app.app_context():
    for d in Driver.query.filter(Driver.last_name.like('%Bortoleto%')).all():
        print(f"ID {d.id}: {d.first_name} {d.last_name} - Series: {d.series} - Team: {d.team.name if d.team else None}")
