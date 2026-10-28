"""Testes automatizados da Fase 3 / Etapa 2A: Calendário Oficial e Sessões F2/F3.

Valida:
1. Listagem completa do calendário oficial de F2 (1 teste oficial + 14 etapas) via /live/sessions?series=f2
2. Listagem completa do calendário oficial de F3 (9 etapas) via /live/sessions?series=f3
3. Sessões com nomes canônicos e rótulos em português (Practice -> Treino Livre, Qualifying -> Classificação, Sprint Race -> Corrida Sprint, Feature Race -> Corrida Principal)
4. Distinção clara e canônica entre Feature Race e Sprint Race
5. Identificação e normalização do teste de pré-temporada de F2 em Barcelona (round: 0, is_testing: True, period: Full Day)
6. Localização de sessões por chave e suporte a estado agendado (scheduled) em /live/tower?series=f2|f3
7. Estado da sessão em /live/state?series=f2|f3 por session_key e detecção automática
8. Retorno 404 para session_key inexistente em F2/F3
9. Isolamento total de namespaces de cache (live:f1:*, live:f2:*, live:f3:*)
10. Metadados de precisão temporal: time_status ("estimated" vs "confirmed") e is_time_confirmed (False para F2/F3, True para F1)
11. Regressão estrita da F1 e tratamento de categorias inválidas (400)
"""

from datetime import datetime, timezone
import pytest
from app import cache as app_cache
from app.api import live


@pytest.fixture(autouse=True)
def clean_cache():
    app_cache._memory.clear()
    yield
    app_cache._memory.clear()


def test_f2_sessions_calendar_and_testing_normalization(client):
    """Testa se F2 retorna 15 eventos (1 teste + 14 etapas) com normalização correta."""
    res = client.get("/api/v1/live/sessions?series=f2&year=2026")
    assert res.status_code == 200
    body = res.get_json()
    assert body["series"] == "f2"
    assert body["year"] == 2026
    data = body["data"]
    assert len(data) == 15

    # 1. Teste Oficial de Pré-Temporada da F2 em Barcelona
    testing_meeting = data[0]
    assert testing_meeting["meeting_key"] == 20000
    assert testing_meeting["round"] == 0
    assert testing_meeting["is_testing"] is True
    assert "Barcelona" in testing_meeting["circuit"]
    sessions = testing_meeting["sessions"]
    assert len(sessions) == 3
    for s in sessions:
        assert s["is_testing"] is True
        assert s["type"] == "Testing"
        assert s["period"] == "Full Day"
        assert s["name"].startswith("Dia ")
        assert s["time_status"] == "estimated"
        assert s["is_time_confirmed"] is False

    # 2. Primeira etapa do campeonato: Melbourne
    melbourne = data[1]
    assert melbourne["meeting_key"] == 20100
    assert melbourne["round"] == 1
    assert melbourne["is_testing"] is False
    assert melbourne["circuit"] == "Albert Park Circuit"
    assert melbourne["country"] == "Austrália"

    # 4 sessões regulamentares de fim de semana
    m_sessions = melbourne["sessions"]
    assert len(m_sessions) == 4
    session_names = [s["name"] for s in m_sessions]
    session_canon = [s["session_name"] for s in m_sessions]
    session_types = [s["type"] for s in m_sessions]

    assert session_names == [
        "Treino Livre",
        "Classificação",
        "Corrida Sprint",
        "Corrida Principal",
    ]
    assert session_canon == [
        "Practice",
        "Qualifying",
        "Sprint Race",
        "Feature Race",
    ]
    assert session_types == [
        "Practice",
        "Qualifying",
        "Sprint Race",
        "Feature Race",
    ]

    for s in m_sessions:
        assert s["time_status"] == "estimated"
        assert s["is_time_confirmed"] is False


def test_f3_sessions_calendar(client):
    """Testa se F3 retorna as 9 etapas oficiais com as 4 sessões regulamentares."""
    res = client.get("/api/v1/live/sessions?series=f3&year=2026")
    assert res.status_code == 200
    body = res.get_json()
    assert body["series"] == "f3"
    assert body["year"] == 2026
    data = body["data"]
    assert len(data) == 9

    # Checar se todas as 9 etapas têm round sequencial e 4 sessões cada
    for i, meeting in enumerate(data, start=1):
        assert meeting["round"] == i
        assert meeting["is_testing"] is False
        assert len(meeting["sessions"]) == 4
        s_names = [s["name"] for s in meeting["sessions"]]
        assert s_names == [
            "Treino Livre",
            "Classificação",
            "Corrida Sprint",
            "Corrida Principal",
        ]
        for s in meeting["sessions"]:
            assert s["time_status"] == "estimated"
            assert s["is_time_confirmed"] is False


def test_f2_f3_tower_scheduled_session(client, monkeypatch):
    """Testa localização por session_key e retorno de sessão agendada em /live/tower com aviso de horário estimado."""
    frozen_now = datetime(2026, 3, 1, 12, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: frozen_now)

    # F2: Treino livre de Melbourne (20101)
    res_f2 = client.get("/api/v1/live/tower?series=f2&session_key=20101")
    assert res_f2.status_code == 200
    body_f2 = res_f2.get_json()
    assert body_f2["series"] == "f2"
    assert body_f2["data_status"] == "scheduled"
    assert body_f2["session"]["key"] == 20101
    assert body_f2["session"]["name"] == "Treino Livre"
    assert body_f2["session"]["session_name"] == "Practice"
    assert body_f2["session"]["circuit"] == "Albert Park Circuit"
    assert body_f2["session"]["time_status"] == "estimated"
    assert body_f2["session"]["is_time_confirmed"] is False
    # Confere se a mensagem gerada alerta sobre horário estimado
    assert any("horário estimado" in m["message"] for m in body_f2["messages"])

    # F3: Feature Race de Melbourne (30104)
    res_f3 = client.get("/api/v1/live/tower?series=f3&session_key=30104")
    assert res_f3.status_code == 200
    body_f3 = res_f3.get_json()
    assert body_f3["series"] == "f3"
    assert body_f3["data_status"] == "scheduled"
    assert body_f3["session"]["key"] == 30104
    assert body_f3["session"]["name"] == "Corrida Principal"
    assert body_f3["session"]["session_name"] == "Feature Race"
    assert body_f3["session"]["type"] == "Feature Race"
    assert body_f3["session"]["time_status"] == "estimated"
    assert body_f3["session"]["is_time_confirmed"] is False


def test_f2_f3_tower_not_found(client):
    """Testa se session_key inexistente retorna 404 em F2 e F3."""
    res_f2 = client.get("/api/v1/live/tower?series=f2&session_key=999999")
    assert res_f2.status_code == 404
    assert "Sessao nao encontrada" in res_f2.get_json()["error"]

    res_f3 = client.get("/api/v1/live/tower?series=f3&session_key=888888")
    assert res_f3.status_code == 404
    assert "Sessao nao encontrada" in res_f3.get_json()["error"]


def test_f2_f3_state_by_session_key_and_auto_detect(client, monkeypatch):
    """Testa /live/state com session_key e detecção automática para F2 e F3."""
    frozen_now = datetime(2026, 3, 1, 12, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(live, "_now_utc", lambda: frozen_now)

    # F2 por chave existente
    res = client.get("/api/v1/live/state?series=f2&session_key=20101")
    assert res.status_code == 200
    body = res.get_json()
    assert body["series"] == "f2"
    assert body["session_key"] == 20101
    assert body["session_name"] == "Practice"
    assert body["state"] == "scheduled"
    assert body["active"] is False
    assert body["time_status"] == "estimated"
    assert body["is_time_confirmed"] is False

    # F2 detecção automática (próxima agendada)
    res_auto = client.get("/api/v1/live/state?series=f2")
    assert res_auto.status_code == 200
    body_auto = res_auto.get_json()
    assert body_auto["series"] == "f2"
    assert body_auto["state"] in {"scheduled", "live", "finished", "offseason"}

    # F2 chave inexistente -> 404
    res_404 = client.get("/api/v1/live/state?series=f2&session_key=777777")
    assert res_404.status_code == 404


def test_cache_namespaces_isolation_f1_f2_f3(client):
    """Testa se as chaves em cache utilizam estritamente o namespace da série."""
    app_cache._memory.clear()

    # Chamada para F2
    client.get("/api/v1/live/sessions?series=f2&year=2026")
    assert app_cache.get("live:f2:meetingsraw:2026") is not None
    assert app_cache.get("live:f1:meetingsraw:2026") is None
    assert app_cache.get("live:f3:meetingsraw:2026") is None

    # Chamada para F3
    client.get("/api/v1/live/sessions?series=f3&year=2026")
    assert app_cache.get("live:f3:meetingsraw:2026") is not None
    assert app_cache.get("live:f1:meetingsraw:2026") is None


def test_f1_regression_and_invalid_series(client):
    """Garante que a F1 continua intacta com time_status confirmed e séries inválidas retornam 400."""
    # F1 padrão (sem series)
    res_f1_def = client.get("/api/v1/live/sessions?year=2026")
    assert res_f1_def.status_code == 200
    body_f1 = res_f1_def.get_json()
    assert body_f1["series"] == "f1"
    # F1 sessions têm time_status confirmed e is_time_confirmed True
    for meeting in body_f1["data"]:
        for s in meeting["sessions"]:
            assert s["time_status"] == "confirmed"
            assert s["is_time_confirmed"] is True

    # F1 explícito
    res_f1_exp = client.get("/api/v1/live/sessions?series=f1&year=2026")
    assert res_f1_exp.status_code == 200
    assert res_f1_exp.get_json()["series"] == "f1"

    # Categoria inválida -> 400
    res_inv_sess = client.get("/api/v1/live/sessions?series=indycar")
    assert res_inv_sess.status_code == 400

    res_inv_tower = client.get("/api/v1/live/tower?series=formula-e")
    assert res_inv_tower.status_code == 400

    res_inv_state = client.get("/api/v1/live/state?series=motogp")
    assert res_inv_state.status_code == 400
