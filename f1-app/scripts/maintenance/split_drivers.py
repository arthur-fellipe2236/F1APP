from app import create_app
from app.extensions import db
from app.models import Driver, RaceResult, Race

app = create_app()

splits = [
    (13, 2014, "Jean-Éric", "Vergne", "Max", "Verstappen", "VER"),
    (17, 1998, "Jan", "Magnussen", "Kevin", "Magnussen", "MAG"),
    (35, 2007, "Christijan", "Albers", "Alexander", "Albon", "ALB"),
    (50, 2012, "Michael", "Schumacher", "Mick", "Schumacher", "MSC"), # Wait, Mick uses MSC, Michael used SCH! But the collision happened so Mick was overwritten to Michael. OpenF1 gave Mick MSC. Let's fix the acronyms.
    (55, 2006, "Robert", "Doornbos", "Jack", "Doohan", "DOO")
]

with app.app_context():
    for d_id, split_year, old_first, old_last, new_first, new_last, new_code in splits:
        d = Driver.query.get(d_id)
        if not d: continue
        
        print(f"Splitting ID {d_id} ({d.first_name} {d.last_name})...")
        
        # O ID atual pertence ao piloto NOVO (Max, Kevin, Albon, Mick, Jack) 
        # porque eles sao os ativos. Vou restaurar o nome do piloto novo no ID existente.
        d.first_name = new_first
        d.last_name = new_last
        d.code = new_code
        
        # Criar o piloto ANTIGO
        old_driver = Driver.query.filter_by(first_name=old_first, last_name=old_last).first()
        if not old_driver:
            old_driver = Driver(first_name=old_first, last_name=old_last)
            # Para Michael Schumacher
            if old_last == "Schumacher" and old_first == "Michael":
                old_driver.code = "SCH"
            elif old_last == "Vergne":
                old_driver.code = "VER"
            elif old_last == "Magnussen" and old_first == "Jan":
                old_driver.code = "MAG"
            elif old_last == "Albers":
                old_driver.code = "ALB"
            elif old_last == "Doornbos":
                old_driver.code = "DOO"
                
            db.session.add(old_driver)
            db.session.commit()
            print(f"  Created old driver ID {old_driver.id} for {old_first} {old_last}")
            
        # Mover os resultados
        results_to_move = RaceResult.query.filter_by(driver_id=d.id).join(Race).filter(Race.season <= split_year).all()
        for r in results_to_move:
            r.driver_id = old_driver.id
        
        print(f"  Moved {len(results_to_move)} results to {old_first} {old_last}")
    db.session.commit()
    print("Done!")
