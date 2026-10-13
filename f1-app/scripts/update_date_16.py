from app import create_app, db
from app.models import Race
import datetime

app = create_app()
with app.app_context():
    # Encontrar a corrida da rodada 16 em 2026
    race_16 = Race.query.filter_by(season=2026, round=16, series='f1').first()
    
    if race_16:
        race_16.date = datetime.date(2026, 10, 4)
        db.session.commit()
        print("Data da Rodada 16 atualizada com sucesso para 4 de Outubro de 2026!")
