import pytest
import concurrent.futures

class TestUltraAggressiveStressAndBugs:
    """Bateria agressiva de testes de estresse, seguranca e cacada a bugs."""

    # 1. SQL Injection & Parametros Maliciosos
    @pytest.mark.parametrize("payload", [
        "' OR '1'='1",
        "1; DROP TABLE teams;--",
        "' UNION SELECT id, name, NULL, NULL, NULL, NULL, NULL FROM teams;--",
        "\" OR \"\"=\"",
        "../../../../etc/passwd",
        "<script>alert('xss')</script>",
        "'; EXEC xp_cmdshell('dir');--",
        "0x50",
        "null",
        "undefined",
        "NaN",
    ])
    def test_sql_injection_and_xss_resilience(self, client, payload):
        endpoints = [
            f"/api/v1/teams?season={payload}",
            f"/api/v1/teams?series={payload}",
            f"/api/v1/drivers?season={payload}",
            f"/api/v1/drivers?series={payload}",
            f"/api/v1/circuits?season={payload}",
            f"/api/v1/races?season={payload}",
            f"/api/v1/standings/drivers?season={payload}",
            f"/api/v1/standings/teams?season={payload}",
            f"/api/v1/compare?driver1={payload}&driver2=1",
        ]
        for url in endpoints:
            resp = client.get(url)
            # A API NUNCA deve retornar erro 500 (Internal Server Error)
            assert resp.status_code in [200, 400, 404, 422], f"Falha de seguranca ou crash 500 em {url}: {resp.status_code}"

    # 2. Paginacao Extrema e Limites Invalidos
    @pytest.mark.parametrize("page,limit", [
        (-1, 10),
        (0, 10),
        (99999999, 10),
        (1, -1),
        (1, 0),
        (1, 1000000),
        ("abc", "xyz"),
        (None, None),
        (1.5, 2.5),
        ("1e5", "1e2"),
    ])
    def test_extreme_pagination(self, client, page, limit):
        url = f"/api/v1/drivers?page={page}&limit={limit}"
        resp = client.get(url)
        assert resp.status_code in [200, 400, 422], f"Crash 500 em paginacao extrema {url}: {resp.status_code}"

    # 3. Payload Excessivamente Grande (Buffer/Memory Stress)
    def test_large_string_payload(self, client):
        huge_str = "A" * 10000
        resp = client.get(f"/api/v1/drivers?search={huge_str}")
        assert resp.status_code in [200, 400, 414, 422]

    # 4. Endpoints com IDs Inexistentes e Malformados
    @pytest.mark.parametrize("bad_id", [-1, 0, 99999999, "invalid-uuid", "null"])
    def test_nonexistent_entity_ids(self, client, bad_id):
        assert client.get(f"/api/v1/drivers/{bad_id}").status_code in [404, 400]
        assert client.get(f"/api/v1/teams/{bad_id}").status_code in [404, 400]
        assert client.get(f"/api/v1/circuits/{bad_id}").status_code in [404, 400]
        assert client.get(f"/api/v1/races/{bad_id}").status_code in [404, 400]

    # 5. Endpoint de Estatisticas de Pilotos (Usado na Pagina de Comparacao)
    def test_driver_stats_edge_cases(self, client):
        # 1. Piloto existente
        resp = client.get("/api/v1/drivers/1/stats")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "driver" in data
        assert "total_races" in data
        assert "total_wins" in data

        # 2. Piloto inexistente
        resp = client.get("/api/v1/drivers/999999/stats")
        assert resp.status_code in [404, 200]

        # 3. ID invalido
        resp = client.get("/api/v1/drivers/abc/stats")
        assert resp.status_code == 404

    # 6. Verificacao de Contrato em Dados de Equipes (Sedes, Motores, Fundacao)
    def test_teams_complete_metadata_contract(self, client):
        resp = client.get("/api/v1/teams")
        assert resp.status_code == 200
        data = resp.get_json()
        teams = data.get("data") if isinstance(data, dict) and "data" in data else data
        assert isinstance(teams, list)
        assert len(teams) >= 10, "Menos de 10 equipes retornadas"

        for team in teams:
            assert "name" in team and team["name"], f"Equipe sem nome: {team}"
            assert "base_country" in team, f"Equipe {team['name']} sem chave base_country"
            assert "base_city" in team, f"Equipe {team['name']} sem chave base_city"
            assert "engine_manufacturer" in team, f"Equipe {team['name']} sem chave engine_manufacturer"
            assert "founded_year" in team, f"Equipe {team['name']} sem chave founded_year"

    # 7. Temporadas Historicas e Futuras
    @pytest.mark.parametrize("season", [1950, 1970, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024, 2026, 1800, 2999])
    def test_season_boundary_ranges(self, client, season):
        resp_teams = client.get(f"/api/v1/teams?season={season}")
        assert resp_teams.status_code == 200
        resp_standings = client.get(f"/api/v1/standings/teams?season={season}")
        assert resp_standings.status_code in [200, 404]

    # 8. Teste de Concorrencia Agressiva (50 requisicoes simultaneas)
    def test_concurrency_stress_locking(self, client):
        def make_req(endpoint):
            return client.get(endpoint).status_code

        endpoints = [
            "/api/v1/health",
            "/api/v1/teams",
            "/api/v1/drivers",
            "/api/v1/circuits",
            "/api/v1/races",
            "/api/v1/standings/drivers?season=2024",
            "/api/v1/standings/teams?season=2024",
            "/api/v1/next-race",
        ] * 6 # 48 requisicoes simultaneas

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_req, ep) for ep in endpoints]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # Todas devem ser 200 OK sem 'database is locked'
        assert all(code == 200 for code in results), f"Erros durante estresse de concorrencia: {results}"
