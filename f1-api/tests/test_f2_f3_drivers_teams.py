"""Testes de validação de pilotos e equipes para Fórmula 2 e Fórmula 3 (Lote 2)."""
from unittest.mock import patch


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

    res_f1_2026 = client.get("/api/v1/drivers?series=f1&season=2026")
    assert res_f1_2026.status_code == 200
    assert len(res_f1_2026.get_json()["data"]) >= 5


def test_f2_and_f3_catalogs_count_and_pagination(client):
    """Valida que F2 tem 23 pilotos e 11 equipes; F3 tem 34 pilotos e 10 equipes."""
    # F2 Pilotos (per_page=10 -> 3 paginas: 10 + 10 + 3 = 23)
    f2_all_10 = []
    for p in range(1, 4):
        res = client.get(f"/api/v1/drivers?series=f2&page={p}&per_page=10")
        assert res.status_code == 200
        j = res.get_json()
        assert j["meta"]["total"] == 23
        assert j["meta"]["pages"] == 3
        f2_all_10.extend(j["data"])
    assert len(f2_all_10) == 23

    res_f2_50 = client.get("/api/v1/drivers?series=f2&page=1&per_page=50")
    assert res_f2_50.status_code == 200
    assert len(res_f2_50.get_json()["data"]) == 23

    # F2 Equipes
    res_f2_t = client.get("/api/v1/teams?series=f2")
    assert res_f2_t.status_code == 200
    json_f2_t = res_f2_t.get_json()
    assert json_f2_t["meta"]["total"] == 11
    assert json_f2_t["meta"]["pages"] == 2

    # F3 Pilotos (per_page=10 -> 4 paginas: 10 + 10 + 10 + 4 = 34)
    f3_all_10 = []
    for p in range(1, 5):
        res = client.get(f"/api/v1/drivers?series=f3&page={p}&per_page=10")
        assert res.status_code == 200
        j = res.get_json()
        assert j["meta"]["total"] == 34
        assert j["meta"]["pages"] == 4
        f3_all_10.extend(j["data"])
    assert len(f3_all_10) == 34

    res_f3_50 = client.get("/api/v1/drivers?series=f3&page=1&per_page=50")
    assert res_f3_50.status_code == 200
    assert len(res_f3_50.get_json()["data"]) == 34

    # F3 Equipes (10 oficiais, sem Jenzer Motorsport ou PHM AIX Racing)
    res_f3_t = client.get("/api/v1/teams?series=f3&per_page=50")
    assert res_f3_t.status_code == 200
    json_f3_t = res_f3_t.get_json()
    assert json_f3_t["meta"]["total"] == 10
    f3_team_names = {t["name"] for t in json_f3_t["data"]}
    assert "Trident" in f3_team_names
    assert "AIX Racing" in f3_team_names
    assert "Jenzer Motorsport" not in f3_team_names
    assert "PHM AIX Racing" not in f3_team_names


def test_f2_f3_ids_uniqueness_no_collision_and_zero_point_drivers(client):
    """Garante IDs unicos, sem colisoes entre F2 e F3, e presenca dos 5 pilotos 0 pts."""
    f2 = client.get("/api/v1/drivers?series=f2&per_page=50").get_json()["data"]
    f3 = client.get("/api/v1/drivers?series=f3&per_page=50").get_json()["data"]

    f2_ids = [d["id"] for d in f2]
    f3_ids = [d["id"] for d in f3]
    assert len(set(f2_ids)) == 23
    assert len(set(f3_ids)) == 34
    assert set(f2_ids).isdisjoint(set(f3_ids))

    # Todos os pilotos resolvem team_id valido
    assert all(d["team_id"] is not None for d in f2)
    assert all(d["team_id"] is not None for d in f3)

    # Hiyu Yamakoshi presente com IDs distintos em F2 e F3
    hiyu_f2 = [d for d in f2 if d["name"] == "Hiyu Yamakoshi"]
    hiyu_f3 = [d for d in f3 if d["name"] == "Hiyu Yamakoshi"]
    assert len(hiyu_f2) == 1 and len(hiyu_f3) == 1
    assert hiyu_f2[0]["id"] != hiyu_f3[0]["id"]
    assert hiyu_f2[0]["id"] >= 10001 and hiyu_f3[0]["id"] >= 10001

    # 5 participantes com 0 pts preservados com status pendente
    f3_by_name = {d["name"]: d for d in f3}
    for zp_name in (
        "Nandhavud Bhirombhakdi",
        "Ricardo Escotto",
        "Patrick Heuzenroeder",
        "Woohyun Shin",
        "Salim Hanna",
    ):
        assert zp_name in f3_by_name
        assert f3_by_name[zp_name]["roster_status"] == "pending_confirmation"


def test_aliases_and_standings_reconciliation(client):
    """Garante reconciliacao de aliases sem duplicatas entre /drivers e /standings/drivers."""
    from app.scraper import canonical_driver_name

    assert canonical_driver_name("Alexander Dunne") == canonical_driver_name("Alex Dunne")
    assert canonical_driver_name("Emerson Fittipaldi") == canonical_driver_name("Emerson Fittipaldi Jr.")
    assert canonical_driver_name("Maciej Gladysz") == canonical_driver_name("Maciej Gładysz")
    assert canonical_driver_name("Noah Stromsted") == canonical_driver_name("Noah Strømsted")

    f2 = client.get("/api/v1/drivers?series=f2&per_page=50").get_json()["data"]
    f3 = client.get("/api/v1/drivers?series=f3&per_page=50").get_json()["data"]
    assert len({canonical_driver_name(d["name"]) for d in f2}) == 23
    assert len({canonical_driver_name(d["name"]) for d in f3}) == 34

    mock_f2_standings = [{"driver_id": f"scraped_f2_{i}", "driver_name": d["name"], "points": 10.0, "races": 12, "position": i + 1} for i, d in enumerate(f2)]
    with patch("app.api.standings.get_standings", return_value=mock_f2_standings):
        res_st = client.get("/api/v1/standings/drivers?series=f2&season=2026")
        assert res_st.status_code == 200
        assert len(res_st.get_json()["data"]) == 23


def test_f2_f3_team_id_association_and_filter(client):
    """Valida a resolução de team_id e o filtro de equipe para F2 e F3."""
    res_f2_campos = client.get("/api/v1/drivers?series=f2&team_id=42&per_page=50")
    assert res_f2_campos.status_code == 200
    json_campos = res_f2_campos.get_json()
    assert json_campos["meta"]["total"] == 2
    for driver in json_campos["data"]:
        assert driver["team_id"] == 42
        assert driver["team_name"] == "Campos Racing"

    res_f3_prema = client.get("/api/v1/drivers?series=f3&team_id=51&per_page=50")
    assert res_f3_prema.status_code == 200
    json_prema = res_f3_prema.get_json()
    assert json_prema["meta"]["total"] >= 3
    for driver in json_prema["data"]:
        assert driver["team_id"] == 51
        assert driver["team_name"] == "Prema Racing"


def test_unconfigured_seasons_zero_fake_data(client):
    """Garante que anos não configurados retornam lista vazia para F2 e F3."""
    for s in ("f2", "f3"):
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
    res_cam = client.get("/api/v1/drivers/169?series=f2")
    assert res_cam.status_code == 200
    d_cam = res_cam.get_json()
    assert d_cam["first_name"] == "Rafael"
    assert d_cam["last_name"] == "Câmara"
    assert d_cam["team_id"] == 47
    assert d_cam["team"]["name"] == "Invicta Racing"

    assert client.get("/api/v1/drivers/169?series=f1").status_code == 404

    res_prema = client.get("/api/v1/teams/51?series=f3")
    assert res_prema.status_code == 200
    t_prema = res_prema.get_json()
    assert t_prema["name"] == "Prema Racing"
    assert t_prema["engine_manufacturer"] == "Mecachrome"

    assert client.get("/api/v1/drivers/9999999").status_code == 404
    assert client.get("/api/v1/teams/9999999").status_code == 404
