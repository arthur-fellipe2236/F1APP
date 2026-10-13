from app import create_app
from app.sync import run_fixups
app = create_app()
with app.app_context():
    run_fixups()
