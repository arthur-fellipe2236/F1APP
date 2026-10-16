import os
import struct
import time
import pytest

WING_ASSETS = [
    "f1-front-wing.png",
    "f1-front-wing-ferrari.png",
    "f1-front-wing-mercedes.png",
    "f1-front-wing-mclaren.png",
    "f1-front-wing-redbull.png",
    "f1-front-wing-racingbulls.png",
    "f1-front-wing-alpine.png",
    "f1-front-wing-haas.png",
    "f1-front-wing-williams.png",
    "f1-front-wing-aston.png",
    "f1-front-wing-audi.png",
    "f1-front-wing-cadillac.png",
]

PUBLIC_DIR = "/home/arthur/Projects/f1-app/public"
DIST_DIR = "/home/arthur/Projects/f1-app/dist"

class TestWingAssetsIntegrity:
    """Verificacao agressiva da integridade binaria e geometrica de todas as 12 texturas das asas 3D."""

    @pytest.mark.parametrize("filename", WING_ASSETS)
    def test_public_wing_asset_validity(self, filename):
        path = os.path.join(PUBLIC_DIR, filename)
        assert os.path.isfile(path), f"Asset {filename} ausente em public/"
        size = os.path.getsize(path)
        assert size > 2048, f"Asset {filename} tem tamanho suspeito: {size} bytes"
        
        with open(path, "rb") as f:
            header = f.read(24)
            assert header[:8] == b"\x89PNG\r\n\x1a\n", f"Assinatura PNG invalida em {filename}"
            w, h = struct.unpack(">II", header[16:24])
            assert w > 200 and h > 100, f"Dimensoes incorretas em {filename}: {w}x{h}"

    @pytest.mark.parametrize("filename", WING_ASSETS)
    def test_dist_wing_asset_validity(self, filename):
        if not os.path.exists(DIST_DIR):
            pytest.skip("dist/ ainda nao compilado")
        path = os.path.join(DIST_DIR, filename)
        assert os.path.isfile(path), f"Asset {filename} ausente no build dist/"
        size = os.path.getsize(path)
        assert size > 2048, f"Asset compilado {filename} tem tamanho invalido: {size} bytes"


class TestAggressiveEndpoints:
    """Testes rigorosos de integridade de esquema, headers e desempenho nos endpoints da API."""

    def test_health_check(self, client):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data.get("status") == "ok"
        assert data.get("service") == "f1-api"

    def test_next_race_contract(self, client):
        resp = client.get("/api/v1/next-race")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "race" in data or "id" in data or "next_race" in data or "race_name" in data or "name" in data

    def test_standings_constructors_alias(self, client):
        resp_teams = client.get("/api/v1/standings/teams?season=2024")
        resp_const = client.get("/api/v1/standings/constructors?season=2024")
        assert resp_teams.status_code == 200
        assert resp_const.status_code == 200
        assert resp_teams.get_json() == resp_const.get_json()

    def test_standings_drivers_integrity(self, client):
        resp = client.get("/api/v1/standings/drivers?season=2024")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "data" in data
        drivers = data["data"]
        assert isinstance(drivers, list)
        assert len(drivers) >= 20
        # Verificar ordenacao decrescente de pontos
        points = [d["points"] for d in drivers]
        assert points == sorted(points, reverse=True)

    def test_live_state_endpoint(self, client):
        resp = client.get("/api/v1/live/state")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "active" in data
        assert "state" in data

    def test_fantasy_endpoints(self, client):
        resp_rules = client.get("/api/v1/fantasy/rules")
        assert resp_rules.status_code == 200
        assert "scoring" in resp_rules.get_json()

        resp_standings = client.get("/api/v1/fantasy/standings")
        assert resp_standings.status_code == 200
        assert isinstance(resp_standings.get_json(), list)

        # Seguranca: chamadas nao autorizadas devem receber 401
        resp_my_unauth = client.get("/api/v1/fantasy/my-predictions")
        assert resp_my_unauth.status_code == 401

    def test_news_endpoints_stability(self, client):
        resp = client.get("/api/v1/news?br_drivers=1&limit=3")
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, list) or "data" in data or "items" in data

    def test_high_frequency_latency(self, client):
        """Stress test: 15 chamadas sequenciais para verificar estabilidade e sem latencia anomala."""
        latencies = []
        for _ in range(15):
            t0 = time.perf_counter()
            resp = client.get("/api/v1/health")
            dt = (time.perf_counter() - t0) * 1000
            assert resp.status_code == 200
            latencies.append(dt)
        avg_lat = sum(latencies) / len(latencies)
        assert avg_lat < 10.0, f"Latencia media muito alta: {avg_lat:.2f}ms"
