from flask import Blueprint, request, jsonify
from sqlalchemy import func
import string
import random
from ..extensions import db
from ..models import Race, Driver, User, RaceResult
from ..models.fantasy import Prediction
from ..models.league import League
from .auth import token_required

bp = Blueprint("fantasy", __name__)

@bp.get("/fantasy/predictions/<int:season>")
@token_required
def get_user_predictions(current_user, season):
    series = request.args.get("series", "f1")
    predictions = (
        db.session.query(Prediction)
        .join(Race)
        .filter(Prediction.user_id == current_user.id, Race.season == season, Race.series == series)
        .all()
    )
    return jsonify([p.to_dict() for p in predictions])

@bp.post("/fantasy/predict")
@token_required
def make_prediction(current_user):
    data = request.get_json()
    race_id = data.get("race_id")
    if not race_id:
        return jsonify({"message": "race_id required"}), 400

    race = Race.query.get(race_id)
    if race and race.date:
        import datetime
        from datetime import timezone
        now = datetime.datetime.now(timezone.utc)
        # Combine race.date (Date object) with 15:00 UTC time to approximate race start
        race_dt = datetime.datetime.combine(race.date, datetime.time(15, 0)).replace(tzinfo=timezone.utc)
        deadline = race_dt - datetime.timedelta(hours=48)
        if now > deadline:
            return jsonify({"message": "O prazo de 48 horas antes da corrida ja se esgotou."}), 403

    prediction = Prediction.query.filter_by(user_id=current_user.id, race_id=race_id).first()
    if not prediction:
        prediction = Prediction(user_id=current_user.id, race_id=race_id)
        db.session.add(prediction)
        
    if "pole_driver_id" in data:
        prediction.pole_driver_id = data["pole_driver_id"]
    if "winner_driver_id" in data:
        prediction.winner_driver_id = data["winner_driver_id"]
    if "fastest_lap_driver_id" in data:
        prediction.fastest_lap_driver_id = data["fastest_lap_driver_id"]
        
    db.session.commit()
    return jsonify(prediction.to_dict())

@bp.get("/fantasy/leaderboard/<int:season>")
def get_leaderboard(season):
    series = request.args.get("series", "f1")
    league_id = request.args.get("league_id")
    
    query = (
        db.session.query(User.username, func.sum(Prediction.points_earned).label("total_points"))
        .join(Prediction, User.id == Prediction.user_id)
        .join(Race, Prediction.race_id == Race.id)
        .filter(Race.season == season, Race.series == series)
    )
    
    if league_id:
        league = League.query.get(league_id)
        if not league:
            return jsonify({"message": "League not found"}), 404
        member_ids = [m.id for m in league.members]
        query = query.filter(User.id.in_(member_ids))
        
    results = (
        query.group_by(User.id)
        .order_by(func.sum(Prediction.points_earned).desc())
        .all()
    )
    
    leaderboard = [{"username": r[0], "points": int(r[1] or 0)} for r in results]
    return jsonify(leaderboard)

@bp.post("/fantasy/calculate")
def calculate_points():
    """Motor de Resolução: Calculate fantasy points based on actual race results"""
    # Em um ambiente real, esta rota seria restrita (ex: API key interna)
    # ou executada via Celery / background job apos o _sync_f1_races.
    
    # 1. Encontrar corridas que já tem resultado
    races_with_results = db.session.query(Race.id).join(RaceResult).distinct().all()
    race_ids = [r[0] for r in races_with_results]
    
    if not race_ids:
        return jsonify({"message": "Nenhum resultado de corrida encontrado"}), 200

    predictions = Prediction.query.filter(Prediction.race_id.in_(race_ids)).all()
    
    # Pre-carregar resultados reais para comparacao
    # Dicionario: race_id -> { "winner": driver_id, "pole": driver_id, "fastest": driver_id }
    real_results = {}
    
    for rid in race_ids:
        winner = RaceResult.query.filter_by(race_id=rid, position=1).first()
        pole = RaceResult.query.filter_by(race_id=rid, grid=1).first()
        fastest = RaceResult.query.filter_by(race_id=rid, fastest_lap=True).first()
        
        real_results[rid] = {
            "winner": winner.driver_id if winner else None,
            "pole": pole.driver_id if pole else None,
            "fastest": fastest.driver_id if fastest else None
        }
        
    updated_count = 0
    for p in predictions:
        points = 0
        actual = real_results.get(p.race_id)
        if actual:
            if p.winner_driver_id and actual["winner"] and p.winner_driver_id == actual["winner"]:
                points += 10
            if p.pole_driver_id and actual["pole"] and p.pole_driver_id == actual["pole"]:
                points += 5
            if p.fastest_lap_driver_id and actual["fastest"] and p.fastest_lap_driver_id == actual["fastest"]:
                points += 5
                
        if p.points_earned != points:
            p.points_earned = points
            updated_count += 1
            
    db.session.commit()
    return jsonify({"message": f"Calculated points for {len(predictions)} predictions. Updated {updated_count} records."}), 200

@bp.post("/fantasy/leagues")
@token_required
def create_league(current_user):
    data = request.get_json()
    name = data.get("name")
    if not name:
        return jsonify({"message": "League name required"}), 400
        
    # Generate random 6 character code
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    league = League(name=name, code=code, owner_id=current_user.id)
    league.members.append(current_user)
    db.session.add(league)
    db.session.commit()
    
    return jsonify(league.to_dict()), 201

@bp.post("/fantasy/leagues/join")
@token_required
def join_league(current_user):
    data = request.get_json()
    code = data.get("code")
    if not code:
        return jsonify({"message": "League code required"}), 400
        
    league = League.query.filter_by(code=code.upper()).first()
    if not league:
        return jsonify({"message": "League not found"}), 404
        
    if current_user in league.members:
        return jsonify({"message": "Already a member"}), 400
        
    league.members.append(current_user)
    db.session.commit()
    
    return jsonify(league.to_dict()), 200

@bp.get("/fantasy/leagues")
@token_required
def get_my_leagues(current_user):
    return jsonify([l.to_dict() for l in current_user.leagues])
