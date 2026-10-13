from app import create_app, db
from app.models import Driver

app = create_app()
with app.app_context():
    albon = Driver.query.filter(Driver.last_name.like('%Albon%')).first()
    if albon:
        albon.nationality = "Tailandês"
        db.session.commit()
        print("Fixed Albon's nationality.")
