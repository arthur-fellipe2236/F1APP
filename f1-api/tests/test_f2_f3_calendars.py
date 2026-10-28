"""Testes de validação dos calendários e sessões F2 e F3."""
import pytest


def test_races_f1_regression(client):
    """Garante que a listagem de corridas da F1 permanece intacta."""
    res_default = client.get("/api/v1/races")
    assert res_default.status_code == 200
    json_default = res_default.get_json()
    assert json_default["meta"]["total"] >= 50

    res_f1 = client.get("/api/v1/races?series=f1")
    assert res_f1.status_code == 200
    json_f1 = res_f1.get_json()
    assert json_f1["meta"]["total"] == json_default["meta"]["total"]


def test_races_f2_and_f3_2026_pagination(client):
    """Valida o calendário canônico da F2 (15 etapas) e F3 (9 etapas) para 2026."""
    # F2 Page 1
    res_f2 = client.get("/api/v1/races?series=f2")
    assert res_f2.status_code == 200
    json_f2 = res_f2.get_json()
    assert json_f2["meta"]["total"] == 15
    assert len(json_f2["data"]) == 10
    assert json_f2["meta"]["pages"] == 2
    assert json_f2["data"][0]["series"] == "f2"
    assert json_f2["data"][0]["name"] == "Formula 2 Pre-Season Testing 2026"
    assert json_f2["data"][1]["name"] == "Melbourne Formula 2 Round 2026"

    # F2 Page 2
    res_f2_p2 = client.get("/api/v1/races?series=f2&page=2")
    assert res_f2_p2.status_code == 200
    json_f2_p2 = res_f2_p2.get_json()
    assert len(json_f2_p2["data"]) == 5

    # F3
    res_f3 = client.get("/api/v1/races?series=f3")
    assert res_f3.status_code == 200
    json_f3 = res_f3.get_json()
    assert json_f3["meta"]["total"] == 9
    assert len(json_f3["data"]) == 9
    assert json_f3["data"][0]["series"] == "f3"
    assert json_f3["data"][0]["name"] == "Melbourne Formula 3 Round 2026"


def test_races_unconfigured_seasons_zero_fake_data(client):
    """Anos não configurados para F2 e F3 devem retornar lista vazia sem dados fictícios."""
    for series in ("f2", "f3"):
        res = client.get(f"/api/v1/races?series={series}&season=2024")
        assert res.status_code == 200
        json_data = res.get_json()
        assert json_data["meta"]["total"] == 0
        assert json_data["data"] == []

        res_ancient = client.get(f"/api/v1/races?series={series}&season=1975")
        assert res_ancient.status_code == 200
        assert res_ancient.get_json()["meta"]["total"] == 0
        assert res_ancient.get_json()["data"] == []


def test_seasons_endpoint_isolation(client):
    """Valida que o endpoint /seasons isola os anos por categoria."""
    # F1 padrão
    res_f1 = client.get("/api/v1/seasons?series=f1")
    assert res_f1.status_code == 200
    seasons_f1 = res_f1.get_json()["data"]
    assert len(seasons_f1) >= 5
    assert 2026 in seasons_f1

    # Sem series (compatibilidade F1)
    res_default = client.get("/api/v1/seasons")
    assert res_default.status_code == 200
    assert res_default.get_json()["data"] == seasons_f1

    # F2: apenas anos configurados (2026)
    res_f2 = client.get("/api/v1/seasons?series=f2")
    assert res_f2.status_code == 200
    assert res_f2.get_json()["data"] == [2026]

    # F3: apenas anos configurados (2026)
    res_f3 = client.get("/api/v1/seasons?series=f3")
    assert res_f3.status_code == 200
    assert res_f3.get_json()["data"] == [2026]


def test_next_race_multi_series_and_cache_isolation(client):
    """Testa a próxima corrida e garante separação de cache entre séries."""
    # F1
    res_f1 = client.get("/api/v1/next-race?series=f1")
    assert res_f1.status_code in (200, 503)

    # F2
    res_f2 = client.get("/api/v1/next-race?series=f2")
    assert res_f2.status_code == 200
    data_f2 = res_f2.get_json()
    assert "Lusail" in data_f2.get("name", "")
    assert data_f2["round"] == 13
    assert len(data_f2.get("sessions", [])) == 4

    # F3 (temporada 2026 encerrada em setembro)
    res_f3 = client.get("/api/v1/next-race?series=f3")
    assert res_f3.status_code == 200
    data_f3 = res_f3.get_json()
    assert data_f3.get("offseason") is True

    # Rotas legadas de compatibilidade
    assert client.get("/api/v1/f2/next-race").status_code == 200
    assert client.get("/api/v1/f3/next-race").status_code == 200


def test_race_detail_and_results_f2_f3(client):
    """Testa detalhamento de corrida e resultados para reuniões F2 e F3."""
    # F2 Meeting 20100 (Melbourne)
    res_f2 = client.get("/api/v1/races/20100")
    assert res_f2.status_code == 200
    f2_data = res_f2.get_json()
    assert f2_data["id"] == 20100
    assert f2_data["series"] == "f2"
    assert f2_data["name"] == "Melbourne Formula 2 Round 2026"
    assert f2_data["circuit_country"] == "Austrália"

    # F2 Resultados (sem dados fictícios)
    res_f2_results = client.get("/api/v1/races/20100/results")
    assert res_f2_results.status_code == 200
    assert res_f2_results.get_json()["meta"]["total"] == 0
    assert res_f2_results.get_json()["data"] == []

    # F3 Meeting 30100 (Melbourne)
    res_f3 = client.get("/api/v1/races/30100")
    assert res_f3.status_code == 200
    f3_data = res_f3.get_json()
    assert f3_data["id"] == 30100
    assert f3_data["series"] == "f3"
    assert f3_data["name"] == "Melbourne Formula 3 Round 2026"

    # F3 Resultados
    res_f3_results = client.get("/api/v1/races/30100/results")
    assert res_f3_results.status_code == 200
    assert res_f3_results.get_json()["meta"]["total"] == 0

    # Inexistente
    res_404 = client.get("/api/v1/races/9999999")
    assert res_404.status_code == 404
