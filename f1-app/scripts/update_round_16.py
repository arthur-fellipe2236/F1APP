from app import create_app, db
from app.models import Race, Circuit

app = create_app()
with app.app_context():
    # Encontrar a corrida da rodada 16 em 2026
    race_16 = Race.query.filter_by(season=2026, round=16, series='f1').first()
    
    # Encontrar ou criar o circuito de Sepang
    sepang = Circuit.query.filter_by(name="Sepang International Circuit").first()
    if not sepang:
        sepang = Circuit(name="Sepang International Circuit", city="Sepang", country="Malásia", laps=56)
        db.session.add(sepang)
        db.session.flush()
    else:
        sepang.city = "Sepang"
        sepang.country = "Malásia"
        
    if race_16:
        race_16.name = "Bahrain Grand Prix"
        race_16.circuit_id = sepang.id
        db.session.commit()
        print("Rodada 16 atualizada com sucesso para Bahrain Grand Prix em Sepang!")
        
    # Se a rodada 23 estava como Bahrain, vou voltar ela para o Qatar (que foi removida acidentalmente se troquei) ou qualquer coisa
    race_23 = Race.query.filter_by(season=2026, round=23, series='f1').first()
    if race_23 and race_23.name == "Bahrain Grand Prix":
        race_23.name = "Singapore Grand Prix"
        singapore = Circuit.query.filter_by(name="Marina Bay Street Circuit").first()
        if singapore:
            race_23.circuit_id = singapore.id
        db.session.commit()
        print("Rodada 23 ajustada para Singapore Grand Prix.")
