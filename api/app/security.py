"""Camada de seguranca: chave JWT, rate limiting, headers HTTP e validacoes."""
import hashlib
import logging
import os
import re
import secrets
import threading
import time
from collections import defaultdict, deque

from flask import jsonify, request

log = logging.getLogger(__name__)

USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]{3,30}$")
PASSWORD_MIN = 8
PASSWORD_MAX = 128
JWT_TTL_DAYS = 7


def resolve_secret_key(db_uri):
    """Chave JWT: variavel de ambiente > derivada de credencial privada > aleatoria."""
    env = os.environ.get("F1_SECRET_KEY") or os.environ.get("SECRET_KEY")
    if env and len(env) >= 16:
        return env
    if db_uri and "@" in db_uri and "://" in db_uri:
        # URI de banco remoto contem credenciais privadas: deriva chave estavel.
        return hashlib.sha256(f"f1-jwt-v2|{db_uri}".encode()).hexdigest()
    log.warning("F1_SECRET_KEY nao definida; usando chave aleatoria por processo.")
    return secrets.token_hex(32)


def client_ip():
    fwd = request.headers.get("X-Forwarded-For", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.headers.get("X-Real-IP") or request.remote_addr or "unknown"


class RateLimiter:
    """Janela deslizante em memoria (por instancia)."""

    def __init__(self):
        self._hits = defaultdict(deque)
        self._lock = threading.Lock()

    def hit(self, key, limit, window):
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            while q and now - q[0] > window:
                q.popleft()
            if len(q) >= limit:
                return False, int(window - (now - q[0])) + 1
            q.append(now)
            if len(self._hits) > 50000:  # evita crescimento ilimitado
                self._hits.clear()
            return True, 0

    def reset(self, key):
        with self._lock:
            self._hits.pop(key, None)

    def count(self, key, window):
        now = time.monotonic()
        with self._lock:
            q = self._hits.get(key)
            if not q:
                return 0
            while q and now - q[0] > window:
                q.popleft()
            return len(q)


limiter = RateLimiter()

# (limite, janela em segundos)
RULES = {
    "global": (300, 60),
    "write": (60, 60),
    "/api/v1/auth/login": (10, 60),
    "/api/v1/auth/register": (5, 3600),
}
LOGIN_FAIL_LIMIT = 5
LOGIN_FAIL_WINDOW = 15 * 60


def too_many(retry_after):
    resp = jsonify({"message": "Muitas requisicoes. Tente novamente mais tarde."})
    resp.status_code = 429
    resp.headers["Retry-After"] = str(retry_after)
    return resp


def login_locked(username):
    return limiter.count(f"loginfail:{username.lower()}", LOGIN_FAIL_WINDOW) >= LOGIN_FAIL_LIMIT


def register_login_failure(username):
    limiter.hit(f"loginfail:{username.lower()}", 10**9, LOGIN_FAIL_WINDOW)


def clear_login_failures(username):
    limiter.reset(f"loginfail:{username.lower()}")


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}


def init_security(app):
    app.config.setdefault("MAX_CONTENT_LENGTH", 1 * 1024 * 1024)

    @app.before_request
    def _rate_limit():
        if app.config.get("TESTING") or request.method == "OPTIONS":
            return None
        ip = client_ip()
        ok, retry = limiter.hit(f"global:{ip}", *RULES["global"])
        if not ok:
            return too_many(retry)
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            ok, retry = limiter.hit(f"write:{ip}", *RULES["write"])
            if not ok:
                return too_many(retry)
        rule = RULES.get(request.path.rstrip("/"))
        if rule and request.method == "POST":
            ok, retry = limiter.hit(f"{request.path}:{ip}", *rule)
            if not ok:
                return too_many(retry)
        return None

    @app.after_request
    def _headers(resp):
        for k, v in SECURITY_HEADERS.items():
            resp.headers.setdefault(k, v)
        if request.path.startswith("/api/v1/auth"):
            resp.headers["Cache-Control"] = "no-store"
        return resp
