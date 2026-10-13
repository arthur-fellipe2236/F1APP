from app import create_app
from app.models import Driver

app = create_app()

with app.app_context():
    for d in Driver.query.all():
        if d.last_name in ["Schumacher", "Mansell", "Prost", "Hill", "Villeneuve", "Häkkinen", "Räikkönen", "Button"]:
            print(f"{d.first_name} {d.last_name} (ID {d.id}): {d.headshot_url}")
