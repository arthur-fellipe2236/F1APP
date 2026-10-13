from app import create_app
from app.sync import sync_configured
import os
import logging

logging.basicConfig(level=logging.INFO)

os.environ['NO_BACKGROUND_SYNC'] = '1'
app = create_app()

with app.app_context():
    print("Iniciando sincronização síncrona completa...")
    sync_configured()
    print("Sincronização finalizada.")
