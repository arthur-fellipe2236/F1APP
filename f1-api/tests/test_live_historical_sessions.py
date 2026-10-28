"""Testes de regressao para resolucao de sessoes historicas em F1, F2 e F3.

Valida:
1. Resolucao de sessoes concluidas/historicas de F1 (Treino, Classificacao, Corrida)
2. Busca direta de sessao por chave via OpenF1 quando fora do ano ativo
3. Resolucao de sessoes de F2 (Treino, Classificacao, Sprint, Corrida Principal)
4. Resolucao de sessoes de F3 (Treino, Classificacao, Sprint, Corrida Principal)
5. Integridade factual de F2/F3: data_status 'unavailable' ou 'scheduled', zero pilotos ficticios
6. Tratamento de sessao desconhecida (404) e categoria invalida (400)
"""

import pytest
from unittest.mock import patch
from app import cache as app_cache


@pytest.fixture(autouse=True)
def clean_cache():
    app_cache._memory.clear()
    yield
    app_cache._memory.clear()


def test_f1_historical_sessions_by_key(client):
    """Testa recuperacao de sessao historica de F1 (Day 1 / Testing / Race) via /live/tower."""
    # 11465 e uma sessao concluida de testes da F1 em 2026
    res = client.get("/api/v1/live/tower?series=f1&session_key=11465")
    assert res.status_code == 200
    body = res.get_json()
    assert body["series"] == "f1"
    assert body["session"]["session_key"] == 11465
    assert body["session"]["state"] == "finished"
    assert body["data_status"] == "finished"
    assert len(body["drivers"]) > 0


def test_f1_direct_session_lookup_fallback(client):
    """Testa o fallback para sessoes antigas (ex: 2023) via OpenF1."""
    mock_session = [{
        "session_key": 999123,
        "session_name": "Race",
        "session_type": "Race",
        "meeting_key": 1200,
        "circuit_short_name": "Interlagos",
        "country_name": "Brazil",
        "location": "São Paulo",
        "date_start": "2023-11-05T17:00:00+00:00",
        "date_end": "2023-11-05T19:00:00+00:00",
        "year": 2023,
    }]

    with patch("app.openf1.get") as mock_get:
        def side_effect(endpoint, **kwargs):
            if endpoint == "sessions" and kwargs.get("session_key") == 999123:
                return mock_session
            if endpoint == "session_result":
                return [
                    {"driver_number": 1, "position": 1, "number_of_laps": 71},
                    {"driver_number": 4, "position": 2, "number_of_laps": 71},
                ]
            if endpoint == "drivers":
                return [
                    {"driver_number": 1, "full_name": "Max Verstappen", "name_acronym": "VER", "team_name": "Red Bull"},
                    {"driver_number": 4, "full_name": "Lando Norris", "name_acronym": "NOR", "team_name": "McLaren"},
                ]
            return []

        mock_get.side_effect = side_effect

        res = client.get("/api/v1/live/tower?series=f1&session_key=999123")
        assert res.status_code == 200
        body = res.get_json()
        assert body["session"]["session_key"] == 999123
        assert body["session"]["state"] == "finished"
        assert body["data_status"] == "finished"
        assert len(body["drivers"]) == 2
        assert body["drivers"][0]["name"] == "Max Verstappen"


def test_f2_historical_and_scheduled_sessions(client):
    """Testa recuperacao de sessoes da F2 (Practice, Qualy, Sprint, Feature Race)."""
    # 20001: Dia 1 (Testing Barcelona - concluido)
    res_finished = client.get("/api/v1/live/tower?series=f2&session_key=20001")
    assert res_finished.status_code == 200
    body_f = res_finished.get_json()
    assert body_f["series"] == "f2"
    assert body_f["session"]["session_key"] == 20001
    assert body_f["session"]["state"] == "finished"
    assert body_f["data_status"] == "unavailable"
    assert len(body_f["drivers"]) == 0
    assert body_f["source_status"]["available"] is False

    # 21404: Corrida Principal (Yas Marina - agendada)
    res_sched = client.get("/api/v1/live/tower?series=f2&session_key=21404")
    assert res_sched.status_code == 200
    body_s = res_sched.get_json()
    assert body_s["series"] == "f2"
    assert body_s["session"]["session_key"] == 21404
    assert body_s["session"]["state"] == "scheduled"
    assert body_s["data_status"] == "scheduled"
    assert len(body_s["drivers"]) == 0


def test_f3_historical_and_scheduled_sessions(client):
    """Testa recuperacao de sessoes da F3 (Treino, Classificacao, Sprint, Corrida Principal)."""
    # 30101: Treino Livre (Melbourne - concluido)
    res_f = client.get("/api/v1/live/tower?series=f3&session_key=30101")
    assert res_f.status_code == 200
    body_f = res_f.get_json()
    assert body_f["series"] == "f3"
    assert body_f["session"]["session_key"] == 30101
    assert body_f["session"]["state"] == "finished"
    assert body_f["data_status"] == "unavailable"
    assert len(body_f["drivers"]) == 0

    # 30904: Corrida Principal (Madrid - concluida conforme calendario simulado)
    res_race = client.get("/api/v1/live/tower?series=f3&session_key=30904")
    assert res_race.status_code == 200
    body_r = res_race.get_json()
    assert body_r["series"] == "f3"
    assert body_r["session"]["session_key"] == 30904
    assert len(body_r["drivers"]) == 0


def test_unknown_session_and_invalid_series(client):
    """Garante que sessao inexistente retorna 404 e categoria invalida retorna 400."""
    res_404 = client.get("/api/v1/live/tower?series=f1&session_key=88888888")
    assert res_404.status_code == 404

    res_400 = client.get("/api/v1/live/tower?series=motogp&session_key=11465")
    assert res_400.status_code == 400
