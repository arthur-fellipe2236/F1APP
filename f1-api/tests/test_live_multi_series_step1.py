"""Testes da Fase 3 / Etapa 1: Backend Multi-Série, Namespaces de Cache e Normalização de Testes F1."""
from datetime import datetime, timezone
import pytest

from app import cache as app_cache
from app import openf1
from app.api import live


@pytest.fixture(autouse=True)
def clean_cache():
    app_cache._memory.clear()
    yield
    app_cache._memory.clear()


def _mock_gp_session(now):
    return {
        "session_key": 8001,
        "meeting_key": 301,
        "session_name": "Race",
        "session_type": "Race",
        "circuit_short_name": "Interlagos",
        "country_name": "Brasil",
        "location": "São Paulo",
        "date_start": "2026-11-01T17:00:00+00:00",
        "date_end": "2026-11-01T19:00:00+00:00",
        "year": 2026,
    }


def _mock_testing_session(now):
    return {
        "session_key": 9462,
        "meeting_key": 1228,
        "session_name": "Day 1",
        "session_type": "Practice",
        "meeting_name": "Pre-Season Testing",
        "circuit_short_name": "Sakhir",
        "country_name": "Bahrain",
        "location": "Sakhir",
        "date_start": "2026-02-21T07:00:00+00:00",
        "date_end": "2026-02-21T16:00:00+00:00",
        "year": 2026,
    }


# 1. Padrão para series é "f1"
def test_default_series_is_f1(client, monkeypatch):
    now = datetime(2026, 11, 1, 18, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_gp_session(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None, *args, **kwargs: (session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y, *args, **kwargs: {301: "Grande Prêmio de São Paulo"})

    def fake_get(path, **params):
        if path == "intervals":
            return [{"driver_number": 1, "gap_to_leader": 0.0, "interval": 0.0, "lap_number": 20, "date": "2026-11-01T18:00:00+00:00"}]
        if path == "position":
            return [{"driver_number": 1, "position": 1, "date": "2026-11-01T18:00:00+00:00"}]
        return []

    monkeypatch.setattr(openf1, "get", fake_get)

    # Chamada sem query param 'series'
    resp = client.get("/api/v1/live/tower")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["series"] == "f1"
    assert body["session"]["session_name"] == "Race"
    assert body["session"]["is_testing"] is False

    # Estado sem query param 'series'
    resp_state = client.get("/api/v1/live/state")
    assert resp_state.status_code == 200
    assert resp_state.get_json()["series"] == "f1"


# 2. Categoria inválida retorna erro 400
def test_invalid_series_returns_400(client):
    for endpoint in ["/api/v1/live/tower?series=motogp", "/api/v1/live/state?series=nascar", "/api/v1/live/sessions?series=stockcar"]:
        resp = client.get(endpoint)
        assert resp.status_code == 400
        body = resp.get_json()
        assert "Categoria invalida" in body.get("error", "")


# 3. Respostas estruturadas para F2 e F3 (sem provedor nesta etapa)
def test_f2_and_f3_series_handling(client):
    for s in ["f2", "f3"]:
        # Tower
        resp_tower = client.get(f"/api/v1/live/tower?series={s}")
        assert resp_tower.status_code == 200
        body_tower = resp_tower.get_json()
        assert body_tower["series"] == s
        assert body_tower["data_status"] == "unavailable"
        assert body_tower["source_status"]["available"] is False
        assert body_tower["source_status"]["reason"] == "provider_not_configured"
        assert body_tower["drivers"] == []

        # State
        resp_state = client.get(f"/api/v1/live/state?series={s}")
        assert resp_state.status_code == 200
        body_state = resp_state.get_json()
        assert body_state["series"] == s
        assert body_state["active"] is False
        assert body_state["state"] == "offseason"

        # Sessions (anos anteriores ou sem catálogo retornam lista vazia)
        resp_sessions = client.get(f"/api/v1/live/sessions?series={s}&year=2025")
        assert resp_sessions.status_code == 200
        body_sessions = resp_sessions.get_json()
        assert body_sessions["series"] == s
        assert body_sessions["data"] == []


# 4. Isolamento rigoroso de namespaces no cache
def test_cache_isolation_between_series(client, monkeypatch):
    now = datetime(2026, 11, 1, 18, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    session = _mock_gp_session(now)
    monkeypatch.setattr(live, "detect_session", lambda n=None, *args, **kwargs: (session, "live"))
    monkeypatch.setattr(live, "_meetings_for_year", lambda y, *args, **kwargs: {301: "Grande Prêmio de São Paulo"})

    def fake_get(path, **params):
        if path == "intervals":
            return [{"driver_number": 44, "gap_to_leader": 1.2, "interval": 1.2, "lap_number": 15, "date": "2026-11-01T18:00:00+00:00"}]
        if path == "position":
            return [{"driver_number": 44, "position": 2, "date": "2026-11-01T18:00:00+00:00"}]
        return []

    monkeypatch.setattr(openf1, "get", fake_get)

    # Executa consulta na F1
    resp_f1 = client.get("/api/v1/live/tower?series=f1")
    assert resp_f1.status_code == 200

    # Verifica se as chaves geradas estão sob o namespace live:f1:
    f1_keys = [k for k in app_cache._memory.keys() if k.startswith("live:f1:")]
    assert len(f1_keys) > 0

    # Garante que nenhuma chave poluída sem namespace foi criada
    raw_keys = [k for k in app_cache._memory.keys() if k.startswith("live:tower:") or k.startswith("live:session:")]
    assert len(raw_keys) == 0


# 5. Normalização de Testes Oficiais de Pré-Temporada da F1
def test_official_pre_season_testing_normalization(client, monkeypatch):
    now = datetime(2026, 3, 1, 12, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    def fake_openf1(path, **params):
        if path == "meetings":
            return [
                {
                    "meeting_key": 1228,
                    "meeting_name": "Pre-Season Testing",
                    "meeting_official_name": "FORMULA 1 ARAMCO PRE-SEASON TESTING 2026",
                    "circuit_short_name": "Sakhir",
                    "country_name": "Bahrain",
                    "location": "Sakhir",
                    "date_start": "2026-02-21T07:00:00+00:00",
                    "date_end": "2026-02-23T16:00:00+00:00",
                    "is_cancelled": False,
                },
                {
                    "meeting_key": 1229,
                    "meeting_name": "Bahrain Grand Prix",
                    "circuit_short_name": "Sakhir",
                    "country_name": "Bahrain",
                    "location": "Sakhir",
                    "date_start": "2026-02-27T10:00:00+00:00",
                    "date_end": "2026-03-01T17:00:00+00:00",
                    "is_cancelled": False,
                },
            ]
        if path == "sessions":
            return [
                {
                    "meeting_key": 1228,
                    "session_key": 9462,
                    "session_name": "Day 1",
                    "session_type": "Practice",
                    "date_start": "2026-02-21T07:00:00+00:00",
                    "date_end": "2026-02-21T16:00:00+00:00",
                },
                {
                    "meeting_key": 1228,
                    "session_key": 9463,
                    "session_name": "Day 2",
                    "session_type": "Practice",
                    "date_start": "2026-02-22T07:00:00+00:00",
                    "date_end": "2026-02-22T16:00:00+00:00",
                },
                {
                    "meeting_key": 1229,
                    "session_key": 9470,
                    "session_name": "Race",
                    "session_type": "Race",
                    "date_start": "2026-03-01T15:00:00+00:00",
                    "date_end": "2026-03-01T17:00:00+00:00",
                },
            ]
        return []

    monkeypatch.setattr(openf1, "get", fake_openf1)

    resp = client.get("/api/v1/live/sessions?year=2026&series=f1")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["series"] == "f1"
    meetings = body["data"]
    assert len(meetings) == 2

    # Reunião 0: Testes de Pré-Temporada
    test_meet = meetings[0]
    assert test_meet["meeting_name"] == "Pre-Season Testing"
    assert test_meet["is_testing"] is True
    assert test_meet["round"] == 0
    assert len(test_meet["sessions"]) == 2

    # Validação canônica das sessões de teste
    day1 = test_meet["sessions"][0]
    assert day1["session_name"] == "Day 1"
    assert day1["name"] == "Dia 1"
    assert day1["type"] == "Testing"
    assert day1["is_testing"] is True
    assert day1["period"] == "Full Day"

    # Reunião 1: GP do Bahrein (etapa do campeonato)
    gp_meet = meetings[1]
    assert gp_meet["meeting_name"] == "Bahrain Grand Prix"
    assert gp_meet["is_testing"] is False
    assert gp_meet["round"] == 1
    race_sess = gp_meet["sessions"][0]
    assert race_sess["session_name"] == "Race"
    assert race_sess["name"] == "Corrida Principal"
    assert race_sess["type"] == "Race"
    assert race_sess["is_testing"] is False
    assert race_sess["period"] is None


# 6. Não classificar sessão com nome desconhecido como teste em GP normal
def test_unknown_sessions_in_normal_gp_not_classified_as_testing(client, monkeypatch):
    now = datetime(2026, 5, 24, 12, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    def fake_openf1(path, **params):
        if path == "meetings":
            return [
                {
                    "meeting_key": 2001,
                    "meeting_name": "Monaco Grand Prix",
                    "date_start": "2026-05-22T09:00:00+00:00",
                    "date_end": "2026-05-24T16:00:00+00:00",
                    "is_cancelled": False,
                }
            ]
        if path == "sessions":
            return [
                {
                    "meeting_key": 2001,
                    "session_key": 8888,
                    "session_name": "Special Celebrity Shootout",
                    "session_type": "Practice",
                    "date_start": "2026-05-23T10:00:00+00:00",
                    "date_end": "2026-05-23T11:00:00+00:00",
                }
            ]
        return []

    monkeypatch.setattr(openf1, "get", fake_openf1)

    resp = client.get("/api/v1/live/sessions?year=2026&series=f1")
    assert resp.status_code == 200
    meetings = resp.get_json()["data"]
    assert len(meetings) == 1
    session = meetings[0]["sessions"][0]
    # Sessão não é classificada como teste mesmo com nome incomum
    assert session["is_testing"] is False
    assert session["period"] is None
    assert session["type"] == "Practice"


# 7. Preservar distinção entre Sprint e Corrida Principal
def test_sprint_vs_race_distinction_preserved(client, monkeypatch):
    now = datetime(2026, 7, 5, 12, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    def fake_openf1(path, **params):
        if path == "meetings":
            return [
                {
                    "meeting_key": 3001,
                    "meeting_name": "Austrian Grand Prix",
                    "date_start": "2026-07-03T09:00:00+00:00",
                    "date_end": "2026-07-05T16:00:00+00:00",
                    "is_cancelled": False,
                }
            ]
        if path == "sessions":
            return [
                {
                    "meeting_key": 3001,
                    "session_key": 7701,
                    "session_name": "Sprint",
                    "session_type": "Sprint",
                    "date_start": "2026-07-04T10:00:00+00:00",
                    "date_end": "2026-07-04T11:00:00+00:00",
                },
                {
                    "meeting_key": 3001,
                    "session_key": 7702,
                    "session_name": "Race",
                    "session_type": "Race",
                    "date_start": "2026-07-05T13:00:00+00:00",
                    "date_end": "2026-07-05T15:00:00+00:00",
                },
            ]
        return []

    monkeypatch.setattr(openf1, "get", fake_openf1)

    resp = client.get("/api/v1/live/sessions?year=2026&series=f1")
    assert resp.status_code == 200
    sessions = resp.get_json()["data"][0]["sessions"]
    sprint = sessions[0]
    race = sessions[1]

    assert sprint["session_name"] == "Sprint"
    assert sprint["name"] == "Corrida Sprint"
    assert sprint["type"] == "Sprint"
    assert sprint["is_testing"] is False

    assert race["session_name"] == "Race"
    assert race["name"] == "Corrida Principal"
    assert race["type"] == "Race"
    assert race["is_testing"] is False


# 8. Torre de tempos para sessão de testes oficiais (scheduled e finished)
def test_live_tower_testing_session(client, monkeypatch):
    now = datetime(2026, 2, 21, 17, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: now)

    test_sess = _mock_testing_session(now)
    monkeypatch.setattr(live, "_session_by_key", lambda sk, *args, **kwargs: test_sess)
    monkeypatch.setattr(live, "_meetings_for_year", lambda y, *args, **kwargs: {1228: "Pre-Season Testing"})

    def fake_openf1(path, **params):
        if path == "position":
            return [{"driver_number": 1, "position": 1, "date": "2026-02-21T15:30:00+00:00"}]
        if path == "drivers":
            return [{"driver_number": 1, "full_name": "Max Verstappen", "name_acronym": "VER", "team_name": "Red Bull Racing", "team_colour": "3671c6"}]
        if path == "session_result":
            return [{"driver_number": 1, "position": 1, "number_of_laps": 65}]
        return []

    monkeypatch.setattr(openf1, "get", fake_openf1)

    resp = client.get("/api/v1/live/tower?session_key=9462&series=f1")
    assert resp.status_code == 200
    body = resp.get_json()

    assert body["series"] == "f1"
    session_info = body["session"]
    assert session_info["session_name"] == "Day 1"
    assert session_info["type"] == "Testing"
    assert session_info["is_testing"] is True
    assert session_info["period"] == "Full Day"
    assert body["drivers"][0]["position"] == 1
    assert body["drivers"][0]["lap_number"] == 65
