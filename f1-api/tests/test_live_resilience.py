"""Testes de resiliencia e integridade da area Live Timing (Fase 1)."""
from datetime import datetime, timezone
import pytest

from app import cache as app_cache
from app import openf1
from app.api import live


@pytest.fixture(autouse=True)
def clear_live_cache():
    app_cache._memory.clear()
    yield
    app_cache._memory.clear()


def _mock_session_live(now):
    return {
        "session_key": 9901,
        "meeting_key": 501,
        "session_name": "Race",
        "session_type": "Race",
        "circuit_short_name": "Interlagos",
        "country_name": "Brasil",
        "location": "São Paulo",
        "date_start": "2026-11-01T17:00:00+00:00",
        "date_end": "2026-11-01T19:00:00+00:00",
        "year": 2026,
    }


def _mock_session_scheduled(now):
    return {
        "session_key": 9902,
        "meeting_key": 502,
        "session_name": "Practice 1",
        "session_type": "Practice",
        "circuit_short_name": "Abu Dhabi",
        "country_name": "Emirados Árabes",
        "location": "Yas Marina",
        "date_start": "2026-12-01T10:00:00+00:00",
        "date_end": "2026-12-01T11:00:00+00:00",
        "year": 2026,
    }


# Cenário 1: OpenF1 responde normalmente com dados válidos
def test_scenario_1_openf1_valid_live_data(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_live(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {501: "Grande Prêmio de São Paulo"})

    def fake_get(path, **params):
        if path == "intervals":
            return [{"driver_number": 1, "gap_to_leader": 0.0, "interval": 0.0, "lap_number": 20, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "position":
            return [{"driver_number": 1, "position": 1, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "drivers":
            return [{"driver_number": 1, "full_name": "Max Verstappen", "name_acronym": "VER", "team_name": "Red Bull", "team_colour": "3671C6"}]
        if path == "stints":
            return [{"driver_number": 1, "compound": "MEDIUM", "stint_number": 1, "lap_end": 20}]
        if path == "weather":
            return [{"air_temperature": 24.5, "track_temperature": 32.1, "wind_speed": 10.2, "relative_humidity": 60, "rainfall": 0, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "race_control":
            return [{"flag": "GREEN", "category": "Flag", "date": "2026-11-01T17:00:00+00:00"}]
        return []

    monkeypatch.setattr(openf1, "get", fake_get)

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["data_status"] == "live"
    assert data["source_status"]["available"] is True
    assert data["is_stale"] is False
    assert len(data["drivers"]) == 1
    assert data["drivers"][0]["name"] == "Max Verstappen"
    assert data["weather"]["air_temperature"] == 24.5


# Cenário 2: OpenF1 retorna HTTP 401
def test_scenario_2_openf1_returns_401(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_live(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))

    def fake_get(path, **params):
        raise openf1.OpenF1Error("Acesso restrito (401)", status_code=401, reason="unauthorized")

    monkeypatch.setattr(openf1, "get", fake_get)

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 503
    data = resp.get_json()
    assert "error" in data
    assert data["details"]["reason"] == "unauthorized"
    assert data["details"]["status_code"] == 401
    assert data["details"]["source_available"] is False


# Cenário 3: OpenF1 retorna HTTP 429
def test_scenario_3_openf1_returns_429(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_live(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))

    def fake_get(path, **params):
        raise openf1.OpenF1Error("Rate limit excedido (429)", status_code=429, reason="rate_limited")

    monkeypatch.setattr(openf1, "get", fake_get)

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 429
    data = resp.get_json()
    assert data["details"]["reason"] == "rate_limited"


# Cenário 4: OpenF1 retorna HTTP 503
def test_scenario_4_openf1_returns_503(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_live(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))

    def fake_get(path, **params):
        raise openf1.OpenF1Error("Servico indisponivel (503)", status_code=503, reason="service_unavailable")

    monkeypatch.setattr(openf1, "get", fake_get)

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 503
    data = resp.get_json()
    assert data["details"]["reason"] == "service_unavailable"


# Cenário 5: A requisição expira por timeout
def test_scenario_5_openf1_timeout(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_live(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))

    def fake_get(path, **params):
        raise openf1.OpenF1Error("Tempo limite esgotado", status_code=504, reason="timeout")

    monkeypatch.setattr(openf1, "get", fake_get)

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 504
    data = resp.get_json()
    assert data["details"]["reason"] == "timeout"


# Cenário 6: A fonte responde sem dados meteorológicos (sem clima fictício!)
def test_scenario_6_no_weather_data_no_fictional_values(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_scheduled(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "scheduled"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {502: "Abu Dhabi GP"})

    def fake_get(path, **params):
        if path in ("weather", "race_control"):
            return []
        return None

    monkeypatch.setattr(openf1, "get", fake_get)

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    data = resp.get_json()
    w = data["weather"]
    # Garante que nenhum valor fixo antigo (26.5, 34.0, 7.5, 44) é retornado
    assert w["air_temperature"] is None
    assert w["track_temperature"] is None
    assert w["wind_speed"] is None
    assert w["humidity"] is None
    assert w["rainfall"] is None


# Cenário 7: A fonte retorna valores meteorológicos válidos
def test_scenario_7_valid_weather_measurements(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_scheduled(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "scheduled"))

    def fake_get(path, **params):
        if path == "weather":
            return [{
                "air_temperature": 31.8,
                "track_temperature": 45.2,
                "wind_speed": 14.3,
                "relative_humidity": 52,
                "rainfall": 0,
                "date": "2026-11-01T17:28:00+00:00"
            }]
        return []

    monkeypatch.setattr(openf1, "get", fake_get)

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    w = resp.get_json()["weather"]
    assert w["air_temperature"] == 31.8
    assert w["track_temperature"] == 45.2
    assert w["wind_speed"] == 14.3
    assert w["humidity"] == 52
    assert w["rainfall"] == 0


# Cenário 8: Não existe sessão ativa, mas há uma próxima sessão agendada
def test_scenario_8_no_live_session_scheduled_available(client, monkeypatch):
    now = datetime(2026, 10, 20, 10, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_scheduled(now)
    monkeypatch.setattr(live, "_sessions_for_year", lambda y: [session])
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {502: "Abu Dhabi GP"})

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["session"]["state"] == "scheduled"
    assert data["session"]["live"] is False
    assert data["data_status"] == "scheduled"
    assert data["drivers"] == []


# Cenário 9: Não há sessão ativa nem próxima sessão identificável
def test_scenario_9_no_active_and_no_identifiable_session(client, monkeypatch):
    now = datetime(2026, 12, 31, 23, 59, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    # Nenhuma sessão disponível
    monkeypatch.setattr(live, "_sessions_for_year", lambda y: [])

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data


# Cenário 10: Existe uma última resposta válida, porém desatualizada (stale cache)
def test_scenario_10_stale_cache_served_on_subsequent_failure(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_live(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {501: "Grande Prêmio de São Paulo"})

    # Primeira consulta: sucesso (alimenta o cache de última válida)
    def fake_get_success(path, **params):
        if path == "intervals":
            return [{"driver_number": 1, "gap_to_leader": 0.0, "interval": 0.0, "lap_number": 20, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "position":
            return [{"driver_number": 1, "position": 1, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "drivers":
            return [{"driver_number": 1, "full_name": "Max Verstappen", "name_acronym": "VER", "team_name": "Red Bull", "team_colour": "3671C6"}]
        return []

    monkeypatch.setattr(openf1, "get", fake_get_success)
    resp1 = client.get("/api/v1/live/tower")
    assert resp1.status_code == 200
    assert resp1.get_json()["is_stale"] is False

    # Segunda consulta: OpenF1 falha com 401
    def fake_get_fail(path, **params):
        raise openf1.OpenF1Error("Acesso restrito durante live (401)", status_code=401, reason="unauthorized")

    monkeypatch.setattr(openf1, "get", fake_get_fail)

    resp2 = client.get("/api/v1/live/tower")
    # Deve responder 200 com a resposta anterior em cache, claramente marcada como stale
    assert resp2.status_code == 200
    data2 = resp2.get_json()
    assert data2["data_status"] == "cached"
    assert data2["is_stale"] is True
    assert data2["source_status"]["available"] is False
    assert data2["source_status"]["reason"] == "unauthorized"
    assert len(data2["drivers"]) == 1


# Cenário 11: Não existe resposta anterior válida para utilizar
def test_scenario_11_no_cached_response_fails_with_structured_error(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_live(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))

    # Cache vazio e fonte falha imediatamente
    def fake_get(path, **params):
        raise openf1.OpenF1Error("Falha de conexao de rede", status_code=502, reason="connection_error")

    monkeypatch.setattr(openf1, "get", fake_get)

    resp = client.get("/api/v1/live/tower")
    # Não inventa dados, devolve erro estruturado com status correto
    assert resp.status_code == 503
    data = resp.get_json()
    assert data["details"]["source_available"] is False
    assert data["details"]["reason"] == "connection_error"


# Teste A — Isolamento entre sessões no cache
def test_cache_isolation_between_sessions(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session_a = {
        "session_key": 8801,
        "meeting_key": 401,
        "session_name": "Race",
        "session_type": "Race",
        "circuit_short_name": "Monza",
        "country_name": "Itália",
        "location": "Monza",
        "date_start": "2026-11-01T17:00:00+00:00",
        "date_end": "2026-11-01T19:00:00+00:00",
        "year": 2026,
    }

    session_b = {
        "session_key": 8802,
        "meeting_key": 402,
        "session_name": "Practice 1",
        "session_type": "Practice",
        "circuit_short_name": "Spa",
        "country_name": "Bélgica",
        "location": "Spa-Francorchamps",
        "date_start": "2026-11-01T17:00:00+00:00",
        "date_end": "2026-11-01T19:00:00+00:00",
        "year": 2026,
    }

    current_session = session_a
    monkeypatch.setattr(live, "detect_session", lambda n=None: (current_session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {401: "GP da Itália", 402: "GP da Bélgica"})

    # 1. Popula cache válido para Sessão A
    def fake_get_a(path, **params):
        if path == "intervals":
            return [{"driver_number": 16, "gap_to_leader": 0.0, "interval": 0.0, "lap_number": 10, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "position":
            return [{"driver_number": 16, "position": 1, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "drivers":
            return [{"driver_number": 16, "full_name": "Charles Leclerc", "name_acronym": "LEC", "team_name": "Ferrari", "team_colour": "E8002D"}]
        return []

    monkeypatch.setattr(openf1, "get", fake_get_a)
    resp_a1 = client.get("/api/v1/live/tower")
    assert resp_a1.status_code == 200
    assert resp_a1.get_json()["session"]["key"] == 8801
    assert resp_a1.get_json()["drivers"][0]["code"] == "LEC"

    # 2. Simula falha da OpenF1 na Sessão A e confirma contingência usando cache da Sessão A
    def fake_get_fail(path, **params):
        raise openf1.OpenF1Error("Falha temporária", status_code=503, reason="service_unavailable")

    monkeypatch.setattr(openf1, "get", fake_get_fail)
    resp_a2 = client.get("/api/v1/live/tower")
    assert resp_a2.status_code == 200
    assert resp_a2.get_json()["data_status"] == "cached"
    assert resp_a2.get_json()["session"]["key"] == 8801
    assert resp_a2.get_json()["drivers"][0]["code"] == "LEC"

    # 3. Muda para Sessão B (que não possui cache próprio) sob falha da OpenF1
    current_session = session_b
    resp_b = client.get("/api/v1/live/tower")

    # Confirma que os dados da Sessão A NUNCA são retornados para a Sessão B
    assert resp_b.status_code == 503
    data_b = resp_b.get_json()
    assert data_b["details"]["session"]["key"] == 8802
    assert "drivers" not in data_b


# Teste B — Preservação exata do timestamp original da última atualização válida
def test_timestamp_preservation_on_stale_cache(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_live(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {501: "Grande Prêmio de São Paulo"})

    def fake_get_ok(path, **params):
        if path == "intervals":
            return [{"driver_number": 1, "gap_to_leader": 0.0, "interval": 0.0, "lap_number": 15, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "position":
            return [{"driver_number": 1, "position": 1, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "drivers":
            return [{"driver_number": 1, "full_name": "Max Verstappen", "name_acronym": "VER", "team_name": "Red Bull", "team_colour": "3671C6"}]
        return []

    monkeypatch.setattr(openf1, "get", fake_get_ok)

    # Primeira requisição válida
    resp1 = client.get("/api/v1/live/tower")
    assert resp1.status_code == 200
    original_timestamp = resp1.get_json()["last_valid_update"]
    assert original_timestamp is not None
    assert resp1.get_json()["is_stale"] is False

    # Simula falha da OpenF1 na requisição subsequente
    def fake_get_error(path, **params):
        raise openf1.OpenF1Error("Acesso restrito (401)", status_code=401, reason="unauthorized")

    monkeypatch.setattr(openf1, "get", fake_get_error)

    resp2 = client.get("/api/v1/live/tower")
    assert resp2.status_code == 200
    data2 = resp2.get_json()
    # Confirma que last_valid_update preserva exatamente o timestamp original
    assert data2["last_valid_update"] == original_timestamp
    assert data2["is_stale"] is True
    assert data2["data_status"] == "cached"
    assert data2["source_status"]["available"] is False


# Teste C — Expiração do cache via TTL do backend real (app/cache.py)
def test_cache_ttl_expiration_with_controlled_clock(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_live(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {501: "Grande Prêmio de São Paulo"})

    # Controla o relógio real do cache (app/cache.py utiliza time.time())
    clock = {"now": 1700000000.0}
    monkeypatch.setattr(app_cache.time, "time", lambda: clock["now"])

    def fake_get_ok(path, **params):
        if path == "intervals":
            return [{"driver_number": 1, "gap_to_leader": 0.0, "interval": 0.0, "lap_number": 5, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "position":
            return [{"driver_number": 1, "position": 1, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "drivers":
            return [{"driver_number": 1, "full_name": "Max Verstappen", "name_acronym": "VER", "team_name": "Red Bull", "team_colour": "3671C6"}]
        return []

    monkeypatch.setattr(openf1, "get", fake_get_ok)

    # 1. Requisição inicial em t0 grava cache com TTL de 7200s (expira em t0 + 7200)
    resp1 = client.get("/api/v1/live/tower")
    assert resp1.status_code == 200

    # 2. Configura a fonte para falhar
    def fake_get_fail(path, **params):
        raise openf1.OpenF1Error("Falha 503", status_code=503, reason="service_unavailable")

    monkeypatch.setattr(openf1, "get", fake_get_fail)

    # Avança o relógio para t0 + 3600 (1 hora decorrida, antes de expirar)
    clock["now"] = 1700000000.0 + 3600.0
    resp_within_ttl = client.get("/api/v1/live/tower")
    assert resp_within_ttl.status_code == 200
    assert resp_within_ttl.get_json()["data_status"] == "cached"

    # Avança o relógio para t0 + 7201 (2 horas e 1 segundo decorrido, expirado)
    clock["now"] = 1700000000.0 + 7201.0
    resp_expired = client.get("/api/v1/live/tower")
    # Entrada expirou do cache em memória; não recupera mais dados stale e responde erro 503
    assert resp_expired.status_code == 503
    assert resp_expired.get_json()["details"]["source_available"] is False


# ==============================================================================
# TESTES FORMAIS DE HOMOLOGAÇÃO: ETAPA 3 (REQUISITOS A - F)
# ==============================================================================

# Teste A: Uma sessão ao vivo com cache contendo pilotos não perde esse cache
# quando a fonte retorna uma resposta vazia inesperada (HTTP 200 com listas vazias).
def test_requirement_a_live_session_empty_response_preserves_valid_cache(client, monkeypatch):
    t0 = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: t0)

    session = _mock_session_live(t0)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {501: "Grande Prêmio de São Paulo"})

    # 1. Requisição inicial com dados válidos de pilotos
    def fake_get_populated(path, **params):
        if path == "intervals":
            return [{"driver_number": 44, "gap_to_leader": 0.0, "interval": 0.0, "lap_number": 12, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "position":
            return [{"driver_number": 44, "position": 1, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "drivers":
            return [{"driver_number": 44, "full_name": "Lewis Hamilton", "name_acronym": "HAM", "team_name": "Ferrari", "team_colour": "E8002D"}]
        return []

    monkeypatch.setattr(openf1, "get", fake_get_populated)
    resp1 = client.get("/api/v1/live/tower")
    assert resp1.status_code == 200
    data1 = resp1.get_json()
    assert data1["data_status"] == "live"
    assert len(data1["drivers"]) == 1
    assert data1["drivers"][0]["name"] == "Lewis Hamilton"
    original_timestamp = data1["last_valid_update"]
    assert original_timestamp == t0.isoformat()

    # 2. Fonte externa responde HTTP 200 com listas vazias (anomalia/queda de telemetria)
    t1 = datetime(2026, 11, 1, 17, 30, 15, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: t1)

    def fake_get_empty(path, **params):
        return []

    monkeypatch.setattr(openf1, "get", fake_get_empty)
    resp2 = client.get("/api/v1/live/tower")
    assert resp2.status_code == 200
    data2 = resp2.get_json()

    # A resposta de contingência não perde os pilotos: devolve o cache válido anterior
    assert data2["data_status"] == "cached"
    assert data2["is_stale"] is True
    assert data2["source_status"]["available"] is False
    assert data2["source_status"]["status_code"] == 200
    assert data2["source_status"]["reason"] == "empty_live_data"
    assert len(data2["drivers"]) == 1
    assert data2["drivers"][0]["name"] == "Lewis Hamilton"

    # 3. Requisição subsequente onde a fonte falha (HTTP 503)
    # Comprova que a chamada vazia (passo 2) NÃO sobrescreveu nem destruiu last_valid_key
    def fake_get_fail(path, **params):
        raise openf1.OpenF1Error("Falha de conexão", status_code=503, reason="service_unavailable")

    monkeypatch.setattr(openf1, "get", fake_get_fail)
    resp3 = client.get("/api/v1/live/tower")
    assert resp3.status_code == 200
    data3 = resp3.get_json()
    assert data3["data_status"] == "cached"
    assert len(data3["drivers"]) == 1
    assert data3["drivers"][0]["name"] == "Lewis Hamilton"


# Teste B: A resposta de contingência mantém o timestamp original e é identificada como desatualizada
def test_requirement_b_contingency_maintains_original_timestamp_and_is_stale(client, monkeypatch):
    t0 = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: t0)

    session = _mock_session_live(t0)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {501: "Grande Prêmio de São Paulo"})

    # Popula dados válidos em t0
    def fake_get_valid(path, **params):
        if path == "intervals":
            return [{"driver_number": 1, "gap_to_leader": 0.0, "interval": 0.0, "lap_number": 25, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "position":
            return [{"driver_number": 1, "position": 1, "date": "2026-11-01T17:30:00+00:00"}]
        if path == "drivers":
            return [{"driver_number": 1, "full_name": "Max Verstappen", "name_acronym": "VER", "team_name": "Red Bull", "team_colour": "3671C6"}]
        return []

    monkeypatch.setattr(openf1, "get", fake_get_valid)
    resp1 = client.get("/api/v1/live/tower")
    assert resp1.status_code == 200
    data1 = resp1.get_json()
    t0_iso = data1["last_valid_update"]
    assert t0_iso == t0.isoformat()
    assert data1["is_stale"] is False

    # Avança o relógio para t1 (30 segundos depois) e fonte retorna vazio
    t1 = datetime(2026, 11, 1, 17, 30, 30, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: t1)

    monkeypatch.setattr(openf1, "get", lambda path, **params: [])
    resp2 = client.get("/api/v1/live/tower")
    assert resp2.status_code == 200
    data2 = resp2.get_json()

    # Confirma que last_valid_update preserva o timestamp original de t0 e não t1
    assert data2["last_valid_update"] == t0_iso
    assert data2["last_valid_update"] != t1.isoformat()
    assert data2["is_stale"] is True
    assert data2["data_status"] == "cached"
    assert data2["source_status"]["available"] is False
    assert data2["source_status"]["reason"] == "empty_live_data"


# Teste C: Uma sessão agendada pode retornar drivers: [] sem ser classificada incorretamente como falha
def test_requirement_c_scheduled_session_returns_empty_drivers_without_failure(client, monkeypatch):
    now = datetime(2026, 10, 20, 10, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_scheduled(now)
    monkeypatch.setattr(live, "_sessions_for_year", lambda y: [session])
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {502: "Abu Dhabi GP"})

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["session"]["state"] == "scheduled"
    assert data["session"]["live"] is False
    assert data["data_status"] == "scheduled"
    assert data["drivers"] == []
    assert data["is_stale"] is False
    assert data["source_status"]["available"] is True
    assert data["source_status"]["reason"] == "scheduled"
    assert data["source_status"]["status_code"] == 200


# Teste D: Uma sessão ao vivo sem cache anterior não recebe pilotos inventados quando a fonte retorna listas vazias
def test_requirement_d_live_session_without_prior_cache_no_invented_drivers(client, monkeypatch):
    now = datetime(2026, 11, 1, 17, 30, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_session_live(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {501: "Grande Prêmio de São Paulo"})

    # Fonte responde HTTP 200, mas com listas vazias logo no início da sessão (sem cache prévio)
    monkeypatch.setattr(openf1, "get", lambda path, **params: [])

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    data = resp.get_json()

    # Confirma que drivers permanece estritamente vazio (sem inventar pilotos)
    assert data["drivers"] == []
    assert data["data_status"] == "live"
    assert data["is_stale"] is False
    assert data["source_status"]["available"] is True
    assert data["source_status"]["reason"] == "ok"
    # Confirma que last_valid_key não foi gravado com dados vazios
    assert app_cache.get(f"live:tower:{session['session_key']}:last_valid") is None


# Teste E: O cache continua isolado entre session_key diferentes
def test_requirement_e_cache_isolation_between_sessions(client, monkeypatch):
    test_cache_isolation_between_sessions(client, monkeypatch)


# Teste F: Os testes anteriores de expiração do TTL continuam aprovados
def test_requirement_f_cache_ttl_expiration_with_controlled_clock(client, monkeypatch):
    test_cache_ttl_expiration_with_controlled_clock(client, monkeypatch)


# ==============================================================================
# FASE 2 / ETAPA 1: TESTES DE CONTRATO CANÔNICO E LOCALIZADO DE SESSÕES
# ==============================================================================

def test_live_sessions_endpoint_returns_canonical_and_localized_names(client, monkeypatch):
    now = datetime(2026, 11, 1, 12, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    fake_meetings = [
        {
            "meeting_key": 601,
            "meeting_name": "São Paulo Grand Prix",
            "circuit_short_name": "Interlagos",
            "country_name": "Brasil",
            "location": "São Paulo",
            "date_start": "2026-11-01T10:00:00+00:00",
            "date_end": "2026-11-01T20:00:00+00:00",
            "year": 2026,
        }
    ]
    fake_sessions = [
        {
            "session_key": 9911,
            "meeting_key": 601,
            "session_name": "Practice 1",
            "session_type": "Practice",
            "date_start": "2026-11-01T10:00:00+00:00",
            "date_end": "2026-11-01T11:00:00+00:00",
            "year": 2026,
        },
        {
            "session_key": 9912,
            "meeting_key": 601,
            "session_name": "Qualifying",
            "session_type": "Qualifying",
            "date_start": "2026-11-01T13:00:00+00:00",
            "date_end": "2026-11-01T14:00:00+00:00",
            "year": 2026,
        },
        {
            "session_key": 9913,
            "meeting_key": 601,
            "session_name": "Race",
            "session_type": "Race",
            "date_start": "2026-11-01T17:00:00+00:00",
            "date_end": "2026-11-01T19:00:00+00:00",
            "year": 2026,
        },
    ]

    def fake_openf1_get(path, **params):
        if path == "meetings":
            return fake_meetings
        if path == "sessions":
            return fake_sessions
        return []

    monkeypatch.setattr(openf1, "get", fake_openf1_get)

    resp = client.get("/api/v1/live/sessions?year=2026")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["year"] == 2026
    assert len(body["data"]) == 1

    meeting = body["data"][0]
    sessions = meeting["sessions"]
    assert len(sessions) == 3

    # Validação da sessão de Treino Livre 1
    p1 = sessions[0]
    assert p1["session_key"] == 9911
    assert p1["key"] == 9911
    assert p1["session_name"] == "Practice 1"  # Canônico em inglês
    assert p1["name"] == "Treino Livre 1"       # Localizado em português
    assert p1["type"] == "Practice"

    # Validação da sessão de Classificação
    qualy = sessions[1]
    assert qualy["session_key"] == 9912
    assert qualy["key"] == 9912
    assert qualy["session_name"] == "Qualifying"
    assert qualy["name"] == "Classificação"
    assert qualy["type"] == "Qualifying"

    # Validação da Corrida Principal (Race)
    race = sessions[2]
    assert race["session_key"] == 9913
    assert race["key"] == 9913
    assert race["session_name"] == "Race"           # Canônico essencial para busca
    assert race["name"] == "Corrida Principal"      # Localizado preservando retrocompatibilidade
    assert race["type"] == "Race"


def test_live_tower_session_metadata_includes_canonical_fields(client, monkeypatch):
    now = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = {
        "session_key": 9920,
        "meeting_key": 602,
        "session_name": "Race",
        "session_type": "Race",
        "circuit_short_name": "Interlagos",
        "country_name": "Brasil",
        "location": "São Paulo",
        "date_start": "2026-11-01T17:00:00+00:00",
        "date_end": "2026-11-01T19:00:00+00:00",
        "year": 2026,
    }
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "scheduled"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {602: "GP do Brasil"})
    monkeypatch.setattr(openf1, "get", lambda path, **params: [])

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    sess = resp.get_json()["session"]
    assert sess["session_key"] == 9920
    assert sess["key"] == 9920
    assert sess["name"] == "Corrida Principal"
    assert sess["session_name"] == "Race"
    assert sess["type"] == "Race"


# ==============================================================================
# FASE 2 / ETAPA 2: TESTES DE MENSAGENS DINÂMICAS E REMOÇÃO DE DADOS ESTÁTICOS
# ==============================================================================

def test_scheduled_tower_message_dynamic_with_date_and_circuit(client, monkeypatch):
    """Garante que a mensagem de sessão agendada é dinâmica e não contém dados estáticos (Race Week, 23/10, Austin)."""
    now = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = {
        "session_key": 9930,
        "meeting_key": 603,
        "session_name": "Race",
        "session_type": "Race",
        "circuit_short_name": "Interlagos",
        "country_name": "Brasil",
        "location": "São Paulo",
        "date_start": "2026-11-01T17:00:00+00:00",
        "date_end": "2026-11-01T19:00:00+00:00",
        "year": 2026,
    }
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "scheduled"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {603: "São Paulo Grand Prix"})
    monkeypatch.setattr(openf1, "get", lambda path, **params: [])

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["session"]["state"] == "scheduled"
    assert body["data_status"] == "scheduled"

    messages = body.get("messages", [])
    assert len(messages) >= 1
    msg_text = messages[0]["message"]

    # Validação dinâmica
    assert "Sessão agendada: Corrida Principal" in msg_text
    assert "01/11 às 17:00 UTC" in msg_text
    assert "em Interlagos" in msg_text

    # Validação de ausência de dados fictícios / hardcoded
    assert "Race Week" not in msg_text
    assert "23/10" not in msg_text
    assert "Austin" not in msg_text
    assert "Circuit of The Americas" not in msg_text


def test_scheduled_tower_message_neutral_without_date_or_circuit(client, monkeypatch):
    """Garante mensagem neutra e limpa quando a sessão agendada não possui data ou circuito."""
    now = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = {
        "session_key": 9931,
        "meeting_key": 604,
        "session_name": "Practice 1",
        "session_type": "Practice",
        "year": 2026,
    }
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "scheduled"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {})
    monkeypatch.setattr(openf1, "get", lambda path, **params: [])

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    body = resp.get_json()

    messages = body.get("messages", [])
    assert len(messages) >= 1
    msg_text = messages[0]["message"]

    # Mensagem deve ser limpa e sem referências estáticas fictícias
    assert msg_text == "Sessão agendada: Treino Livre 1."
    assert "Race Week" not in msg_text
    assert "Austin" not in msg_text
    assert "Circuit of The Americas" not in msg_text


def test_scheduled_tower_does_not_inject_static_austin_fallback(client, monkeypatch):
    """Confirma que circuitos/país/localização ausentes não são preenchidos com Austin/COTA/EUA fictícios."""
    now = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = {
        "session_key": 9932,
        "session_name": "Qualifying",
        "session_type": "Qualifying",
        "year": 2026,
    }
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "scheduled"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {})
    monkeypatch.setattr(openf1, "get", lambda path, **params: [])

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    sess = resp.get_json()["session"]

    assert sess["circuit"] is None
    assert sess["country"] is None
    assert sess["location"] is None
    assert sess["date_start"] is None
    assert sess["date_end"] is None


def test_live_session_without_drivers_retains_live_status_and_avoids_static_fallbacks(client, monkeypatch):
    """Garante que sessão ao vivo sem tempos de pilotos mantém data_status 'live' e source_status 'live_empty'."""
    now = datetime(2026, 11, 1, 14, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = {
        "session_key": 9933,
        "meeting_key": 605,
        "session_name": "Race",
        "session_type": "Race",
        "circuit_short_name": "Monaco",
        "country_name": "Monaco",
        "location": "Monte Carlo",
        "date_start": "2026-11-01T13:50:00+00:00",
        "date_end": "2026-11-01T16:00:00+00:00",
        "year": 2026,
    }
    monkeypatch.setattr(live, "detect_session", lambda n=None: (session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y: {605: "Monaco Grand Prix"})
    monkeypatch.setattr(openf1, "get", lambda path, **params: [])

    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    body = resp.get_json()

    assert body["session"]["state"] == "live"
    assert body["session"]["live"] is True
    assert body["data_status"] == "live"
    assert body["source_status"]["available"] is True
    assert body["source_status"]["reason"] == "ok"
    assert body["drivers"] == []
    assert body["session"]["circuit"] == "Monaco"
