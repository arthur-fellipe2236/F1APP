"""Testes de validação de pilotos e equipes para Fórmula 2 e Fórmula 3."""
import pytest


def test_drivers_teams_f1_regression(client):
    """Garante que pilotos e equipes da F1 permanecem intactos."""
    res_drivers = client.get("/api/v1/drivers")
    assert res_drivers.status_code == 200
    json_d = res_drivers.get_json()
    assert json_d["meta"]["total"] >= 20

    res_teams = client.get("/api/v1/teams")
    assert res_teams.status_code == 200
    json_t = res_teams.get_json()
    assert json_t["meta"]["total"] >= 10

    # F1 2026 grid (fixtures de teste possuem subset de pilotos)
    res_f1_2026 = client.get("/api/v1/drivers?series=f1&season=2026")
    assert res_f1_2026.status_code == 200
    assert len(res_f1_2026.get_json()["data"]) >= 5


def test_f2_and_f3_catalogs_count_and_pagination(client):
    """Valida que F2 tem 22 pilotos e 11 equipes; F3 tem 30 pilotos e 10 equipes."""
    # F2 Pilotos
    res_f2_d = client.get("/api/v1/drivers?series=f2")
    assert res_f2_d.status_code == 200
    json_f2_d = res_f2_d.get_json()
    assert json_f2_d["meta"]["total"] == 22
    assert json_f2_d["meta"]["page"] == 1
    assert json_f2_d["meta"]["per_page"] == 10
    assert json_f2_d["meta"]["pages"] == 3
    assert len(json_f2_d["data"]) == 10

    # F2 Equipes
    res_f2_t = client.get("/api/v1/teams?series=f2")
    assert res_f2_t.status_code == 200
    json_f2_t = res_f2_t.get_json()
    assert json_f2_t["meta"]["total"] == 11
    assert json_f2_t["meta"]["pages"] == 2

    # F3 Pilotos
    res_f3_d = client.get("/api/v1/drivers?series=f3")
    assert res_f3_d.status_code == 200
    json_f3_d = res_f3_d.get_json()
    assert json_f3_d["meta"]["total"] == 30
    assert json_f3_d["meta"]["pages"] == 3

    # F3 Equipes
    res_f3_t = client.get("/api/v1/teams?series=f3")
    assert res_f3_t.status_code == 200
    json_f3_t = res_f3_t.get_json()
    assert json_f3_t["meta"]["total"] == 10
    assert json_f3_t["meta"]["pages"] == 1


def test_f2_f3_team_id_association_and_filter(client):
    """Valida a resolução de team_id e o filtro de equipe para F2 e F3."""
    # F2 Campos Racing (ID 42)
    res_f2_campos = client.get("/api/v1/drivers?series=f2&team_id=42&per_page=50")
    assert res_f2_campos.status_code == 200
    json_campos = res_f2_campos.get_json()
    assert json_campos["meta"]["total"] == 2
    for driver in json_campos["data"]:
        assert driver["team_id"] == 42
        assert driver["team_name"] == "Campos Racing"

    # F3 Prema Racing (ID 51)
    res_f3_prema = client.get("/api/v1/drivers?series=f3&team_id=51&per_page=50")
    assert res_f3_prema.status_code == 200
    json_prema = res_f3_prema.get_json()
    assert json_prema["meta"]["total"] == 4
    for driver in json_prema["data"]:
        assert driver["team_id"] == 51
        assert driver["team_name"] == "Prema Racing"


def test_unconfigured_seasons_zero_fake_data(client):
    """Garante que anos não configurados retornam lista vazia para F2 e F3."""
    for s in ("f2", "f3"):
        # Temporada 2024
        res_d = client.get(f"/api/v1/drivers?series={s}&season=2024")
        assert res_d.status_code == 200
        assert res_d.get_json()["meta"]["total"] == 0
        assert res_d.get_json()["data"] == []

        res_t = client.get(f"/api/v1/teams?series={s}&season=2024")
        assert res_t.status_code == 200
        assert res_t.get_json()["meta"]["total"] == 0
        assert res_t.get_json()["data"] == []


def test_individual_endpoints_and_series_disambiguation(client):
    """Testa endpoints singulares /drivers/<id> e /teams/<id>."""
    # F2 Driver: Rafael Câmara (ID 169)
    res_cam = client.get("/api/v1/drivers/169?series=f2")
    assert res_cam.status_code == 200
    d_cam = res_cam.get_json()
    assert d_cam["first_name"] == "Rafael"
    assert d_cam["last_name"] == "Câmara"
    assert d_cam["team_id"] == 47
    assert d_cam["team"]["name"] == "Invicta Racing"

    # Busca com série errada não deve vazar registro
    res_f1_fail = client.get("/api/v1/drivers/169?series=f1")
    assert res_f1_fail.status_code == 404

    # F3 Team: Prema Racing (ID 51)
    res_prema = client.get("/api/v1/teams/51?series=f3")
    assert res_prema.status_code == 200
    t_prema = res_prema.get_json()
    assert t_prema["name"] == "Prema Racing"
    assert t_prema["engine_manufacturer"] == "Mecachrome"

    # ID inexistente
    assert client.get("/api/v1/drivers/9999999").status_code == 404
    assert client.get("/api/v1/teams/9999999").status_code == 404
