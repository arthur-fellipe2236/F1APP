from app import create_app
from app.models import Driver
app = create_app()

names = [
    "Nigel Mansell", "Alain Prost", "Michael Schumacher", 
    "Damon Hill", "Jacques Villeneuve", "Mika Häkkinen", 
    "Kimi Räikkönen", "Jenson Button"
]

with app.app_context():
    for name in names:
        first, last = name.split(" ", 1)
        d = Driver.query.filter_by(last_name=last).first()
        if d:
            print(f"{name}: {d.headshot_url}")
        else:
            print(f"{name}: NOT FOUND in DB")
