from app import create_app
from app.seed import seed
from app.sync import sync_season
import time

app = create_app()

with app.app_context():
    print("Semeando dados locais (2022, 2023, 2025, 2026)...")
    seed()
    
    print("Sincronizando 2024...")
    try:
        sync_season(2024, force=True)
    except Exception as e:
        print("Erro em 2024:", e)
        
    time.sleep(1)
    
    print("Sincronizando 2021...")
    try:
        sync_season(2021, force=True)
    except Exception as e:
        print("Erro em 2021:", e)
        
    print("Anos modernos restaurados!")
