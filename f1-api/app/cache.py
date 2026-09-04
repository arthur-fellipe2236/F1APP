"""Cache compartilhado (Redis opcional) para a f1-api.

Usa REDIS_URL quando configurado (ex.: Vercel Redis/Upstash) e degrada para
um cache em memoria no mesmo formato, para desenvolvimento local sem Redis.
Chaves: tradutores, feeds do site oficial, torres de live timing etc.
"""

import json
import os
import threading
import time

REDIS_URL = os.environ.get("REDIS_URL", "").strip()
_PREFIX = "f1api:"

_memory = {}
_lock = threading.Lock()
_redis = None
_redis_tried = False


def _client():
    global _redis, _redis_tried
    if _redis_tried:
        return _redis
    _redis_tried = True
    if not REDIS_URL:
        return None
    try:
        import redis

        _redis = redis.Redis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_timeout=3,
            socket_connect_timeout=3,
        )
        _redis.ping()
    except Exception:  # noqa: BLE001 - Redis e opcional
        _redis = None
    return _redis


def get(key):
    client = _client()
    if client is not None:
        try:
            raw = client.get(_PREFIX + key)
            return json.loads(raw) if raw else None
        except Exception:  # noqa: BLE001
            return None
    with _lock:
        hit = _memory.get(key)
        if hit and time.time() < hit[0]:
            return hit[1]
        if hit:
            _memory.pop(key, None)
    return None


def set(key, value, ttl):
    client = _client()
    if client is not None:
        try:
            client.set(_PREFIX + key, json.dumps(value), ex=ttl)
            return
        except Exception:  # noqa: BLE001
            pass
    with _lock:
        if len(_memory) > 500:
            now = time.time()
            for old in [k for k, v in _memory.items() if v[0] < now]:
                _memory.pop(old, None)
        _memory[key] = (time.time() + ttl, value)


def cache_get_or_set(key, ttl, producer):
    """Retorna o valor em cache ou produz/grava (padrao cache-aside)."""
    cached = get(key)
    if cached is not None:
        return cached
    value = producer()
    if value is not None:
        set(key, value, ttl)
    return value
