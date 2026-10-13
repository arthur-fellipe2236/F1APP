import jwt
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from ..extensions import db
from ..models.user import User

bp = Blueprint("auth", __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split()
            if len(parts) == 2 and parts[0] == "Bearer":
                token = parts[1]
        
        if not token:
            return jsonify({"message": "Token is missing!"}), 401
            
        try:
            data = jwt.decode(token, current_app.config.get("SECRET_KEY") or "f1-secret-key-123", algorithms=["HS256"])
            current_user = User.query.get(data["user_id"])
            if not current_user:
                raise Exception("User not found")
        except Exception as e:
            return jsonify({"message": "Token is invalid!"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def optional_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split()
            if len(parts) == 2 and parts[0] == "Bearer":
                token = parts[1]
                try:
                    data = jwt.decode(token, current_app.config.get("SECRET_KEY") or "f1-secret-key-123", algorithms=["HS256"])
                    current_user = User.query.get(data.get("user_id"))
                except Exception:
                    current_user = None
        return f(current_user, *args, **kwargs)
    return decorated

@bp.post("/auth/register")
def register():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"message": "Missing username or password"}), 400
        
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"message": "Username already exists"}), 400
        
    new_user = User(username=data["username"])
    new_user.set_password(data["password"])
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User created successfully"}), 201

@bp.post("/auth/login")
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"message": "Missing username or password"}), 400
        
    user = User.query.filter_by(username=data["username"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401
        
    token = jwt.encode(
        {"user_id": user.id, "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30)},
        current_app.config.get("SECRET_KEY") or "f1-secret-key-123",
        algorithm="HS256"
    )
    
    return jsonify({"token": token, "user": user.to_dict()})

@bp.get("/auth/me")
@token_required
def get_me(current_user):
    return jsonify(current_user.to_dict())

@bp.put("/auth/me")
@token_required
def update_me(current_user):
    data = request.get_json()
    
    if "favorite_driver_id" in data:
        current_user.favorite_driver_id = data["favorite_driver_id"]
    if "favorite_team_id" in data:
        current_user.favorite_team_id = data["favorite_team_id"]
        
    db.session.commit()
    return jsonify(current_user.to_dict())
