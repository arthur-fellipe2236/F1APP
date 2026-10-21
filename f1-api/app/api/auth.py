import datetime
from functools import wraps

import jwt
from flask import Blueprint, current_app, jsonify, request

from ..extensions import db
from ..models.user import User
from ..security import (
    JWT_TTL_DAYS,
    PASSWORD_MAX,
    PASSWORD_MIN,
    USERNAME_RE,
    clear_login_failures,
    login_locked,
    register_login_failure,
)

bp = Blueprint("auth", __name__)

HONEYPOT_FIELD = "website"


def _secret():
    return current_app.config["SECRET_KEY"]


def _decode(token):
    return jwt.decode(
        token,
        _secret(),
        algorithms=["HS256"],
        options={"require": ["exp", "user_id"]},
    )


def _bearer_token():
    parts = request.headers.get("Authorization", "").split()
    if len(parts) == 2 and parts[0] == "Bearer":
        return parts[1]
    return None


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = _bearer_token()
        if not token:
            return jsonify({"message": "Token is missing!"}), 401
        try:
            data = _decode(token)
            current_user = db.session.get(User, int(data["user_id"]))
            if not current_user:
                raise ValueError("User not found")
        except Exception:
            return jsonify({"message": "Token is invalid!"}), 401
        return f(current_user, *args, **kwargs)

    return decorated


def optional_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None
        token = _bearer_token()
        if token:
            try:
                data = _decode(token)
                current_user = db.session.get(User, int(data["user_id"]))
            except Exception:
                current_user = None
        return f(current_user, *args, **kwargs)

    return decorated


def _credentials():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, None, None
    username = data.get("username")
    password = data.get("password")
    if not isinstance(username, str) or not isinstance(password, str):
        return data, None, None
    return data, username.strip(), password


@bp.post("/auth/register")
def register():
    data, username, password = _credentials()
    if not username or not password:
        return jsonify({"message": "Usuário e senha são obrigatórios"}), 400

    # Honeypot anti-bot: campo invisivel para humanos. Bots o preenchem.
    if data.get(HONEYPOT_FIELD):
        return jsonify({"message": "User created successfully"}), 201

    if not USERNAME_RE.match(username):
        return jsonify({
            "message": "Usuário deve ter 3 a 30 caracteres (letras, números, _ . -)"
        }), 400
    if not (PASSWORD_MIN <= len(password) <= PASSWORD_MAX):
        return jsonify({
            "message": f"A senha deve ter entre {PASSWORD_MIN} e {PASSWORD_MAX} caracteres"
        }), 400
    if password.lower() == username.lower():
        return jsonify({"message": "A senha não pode ser igual ao usuário"}), 400

    if User.query.filter(db.func.lower(User.username) == username.lower()).first():
        return jsonify({"message": "Usuário indisponível"}), 400

    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully"}), 201


@bp.post("/auth/login")
def login():
    _, username, password = _credentials()
    if not username or not password or len(password) > PASSWORD_MAX:
        return jsonify({"message": "Usuário ou senha inválidos"}), 400

    if login_locked(username):
        return jsonify({
            "message": "Muitas tentativas falhas. Aguarde 15 minutos e tente novamente."
        }), 429

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        register_login_failure(username)
        return jsonify({"message": "Usuário ou senha inválidos"}), 401

    clear_login_failures(username)
    now = datetime.datetime.now(datetime.timezone.utc)
    token = jwt.encode(
        {"user_id": user.id, "iat": now, "exp": now + datetime.timedelta(days=JWT_TTL_DAYS)},
        _secret(),
        algorithm="HS256",
    )
    return jsonify({"token": token, "user": user.to_dict()})


@bp.get("/auth/me")
@token_required
def get_me(current_user):
    return jsonify(current_user.to_dict())


def _optional_int(value):
    if value is None:
        return True, None
    if isinstance(value, bool):
        return False, None
    try:
        v = int(value)
    except (TypeError, ValueError):
        return False, None
    return (v > 0), v


@bp.put("/auth/me")
@token_required
def update_me(current_user):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"message": "JSON inválido"}), 400

    for field in ("favorite_driver_id", "favorite_team_id"):
        if field in data:
            ok, value = _optional_int(data[field])
            if not ok:
                return jsonify({"message": f"{field} inválido"}), 400
            setattr(current_user, field, value)

    db.session.commit()
    return jsonify(current_user.to_dict())
