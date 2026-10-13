from ..extensions import db
from ..models import Race, RaceResult
from ..models.fantasy import Prediction

def calculate_fantasy_points_internal():
    races_with_results = db.session.query(Race.id).join(RaceResult).distinct().all()
    race_ids = [r[0] for r in races_with_results]
    
    if not race_ids:
        return 0

    predictions = Prediction.query.filter(Prediction.race_id.in_(race_ids)).all()
    
    real_results = {}
    
    for rid in race_ids:
        winner = RaceResult.query.filter_by(race_id=rid, position=1).first()
        pole = RaceResult.query.filter_by(race_id=rid, grid=1).first()
        fastest = RaceResult.query.filter_by(race_id=rid, fastest_lap=True).first()
        
        real_results[rid] = {
            'winner': winner.driver_id if winner else None,
            'pole': pole.driver_id if pole else None,
            'fastest': fastest.driver_id if fastest else None
        }
        
    updated_count = 0
    for p in predictions:
        points = 0
        actual = real_results.get(p.race_id)
        if actual:
            if p.winner_driver_id and actual['winner'] and p.winner_driver_id == actual['winner']:
                points += 10
            if p.pole_driver_id and actual['pole'] and p.pole_driver_id == actual['pole']:
                points += 5
            if p.fastest_lap_driver_id and actual['fastest'] and p.fastest_lap_driver_id == actual['fastest']:
                points += 5
                
        if p.points_earned != points:
            p.points_earned = points
            updated_count += 1
            
    if updated_count > 0:
        db.session.commit()
    
    return updated_count
