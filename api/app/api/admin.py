from flask import Blueprint, request, jsonify
from functools import wraps
from ..extensions import db
from ..models import Race, RaceResult, Driver
from .auth import token_required

bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if not current_user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

@bp.post('/admin/results')
@admin_required
def submit_manual_results(current_user):
    data = request.get_json()
    race_id = data.get('race_id')
    results = data.get('results') # list of {driver_id: int, position: int, points: float, fastest_lap: bool}
    
    if not race_id or not results:
        return jsonify({'message': 'race_id and results required'}), 400
        
    race = Race.query.get(race_id)
    if not race:
        return jsonify({'message': 'Race not found'}), 404
        
    for r in results:
        driver_id = r.get('driver_id')
        pos = r.get('position')
        pts = r.get('points', 0)
        fl = r.get('fastest_lap', False)
        
        if not driver_id or not pos:
            continue
            
        existing = RaceResult.query.filter_by(race_id=race_id, driver_id=driver_id).first()
        if existing:
            existing.position = pos
            existing.points = pts
            existing.fastest_lap = fl
            existing.status = 'finished'
        else:
            driver = Driver.query.get(driver_id)
            if driver:
                new_res = RaceResult(
                    race_id=race_id,
                    driver_id=driver_id,
                    team_id=driver.team_id,
                    position=pos,
                    points=pts,
                    grid=pos, # simplificando
                    laps=race.circuit.laps,
                    status='finished',
                    fastest_lap=fl
                )
                db.session.add(new_res)
                
    db.session.commit()
    
    # Try to trigger fantasy calculation if applicable
    try:
        from .fantasy_engine import calculate_fantasy_points_internal
        calculate_fantasy_points_internal()
    except Exception as e:
        pass
        
    return jsonify({'message': 'Results saved successfully'})
