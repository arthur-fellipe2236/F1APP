from app import create_app
from app.models import Circuit

app = create_app()
with app.app_context():
    countries = set(c.country for c in Circuit.query.all())
    print("Countries:", sorted(countries))
