"""Suíte de testes obrigatórios para OP-07.1-R1:
1. F1 sem season seleciona 2026.
2. F2 sem season seleciona 2026.
3. F3 sem season seleciona 2026.
4. Temporada explícita é respeitada.
5. Consulta histórica continua funcionando.
6. Lease adquirido permite o fluxo de contingência previsto.
7. Lease ocupado impede sincronização concorrente.
8. Tabela cron_sync_leases ausente não provoca erro 500 desnecessário na consulta de classificação.
9. Falha de sincronização preserva dados válidos e sinaliza pendência.
10. Uma nova tentativa é possível após a infraestrutura ser corrigida.
"""

from datetime import date, timedelta
import pytest
from app.extensions import db
from app.models import Driver, Race, RaceResult, Team
from app.sync_lease import CronSyncLease
from app.sync_lease import acquire_lease, release_lease
from app.results_refresh import contingency_refresh_pending_standings, reset_throttle


def test_01_f1_without_season_selects_2026(client, app):
    """1. F1 sem season seleciona 2026 (drivers e teams)."""
    with app.app_context():
        resp_drivers = client.get("/api/v1/standings/drivers")
        assert resp_drivers.status_code == 200
        data_d = resp_drivers.get_json()
        assert data_d["season"] == 2026
        assert "completed_races" in data_d
        assert "total_races" in data_d

        resp_teams = client.get("/api/v1/standings/teams")
        assert resp_teams.status_code == 200
        data_t = resp_teams.get_json()
        assert data_t["season"] == 2026
        assert "completed_races" in data_t
        assert "total_races" in data_t


def test_02_f2_without_season_selects_2026(client, app):
    """2. F2 sem season seleciona 2026."""
    with app.app_context():
        resp = client.get("/api/v1/standings/drivers?series=f2")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["season"] == 2026
        assert isinstance(data.get("completed_races"), int)
        assert isinstance(data.get("total_races"), int)

        resp_t = client.get("/api/v1/standings/teams?series=f2")
        assert resp_t.status_code == 200
        data_t = resp_t.get_json()
        assert data_t["season"] == 2026


def test_03_f3_without_season_selects_2026(client, app):
    """3. F3 sem season seleciona 2026."""
    with app.app_context():
        resp = client.get("/api/v1/standings/drivers?series=f3")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["season"] == 2026
        assert isinstance(data.get("completed_races"), int)
        assert isinstance(data.get("total_races"), int)

        resp_t = client.get("/api/v1/standings/teams?series=f3")
        assert resp_t.status_code == 200
        data_t = resp_t.get_json()
        assert data_t["season"] == 2026


def test_04_explicit_season_is_respected(client, app):
    """4. Temporada explícita é rigorosamente respeitada."""
    with app.app_context():
        resp = client.get("/api/v1/standings/drivers?season=2024")
        assert resp.status_code == 200
        assert resp.get_json()["season"] == 2024

        resp2 = client.get("/api/v1/standings/teams?season=2022")
        assert resp2.status_code == 200
        assert resp2.get_json()["season"] == 2022


def test_05_historical_query_continues_working(client, app):
    """5. Consulta histórica continua funcionando com regras da época."""
    with app.app_context():
        resp = client.get("/api/v1/standings/drivers?season=1950")
        assert resp.status_code == 200
        assert resp.get_json()["season"] == 1950

        # Para construtores em 1950 (antes de 1958), deve marcar official=False e nota histórica
        resp_teams = client.get("/api/v1/standings/teams?season=1950")
        assert resp_teams.status_code == 200
        data_t = resp_teams.get_json()
        assert data_t["season"] == 1950
        assert data_t.get("official") is False
        assert "A Copa de Construtores da FIA so foi criada em 1958" in data_t.get("note", "")


def test_06_lease_acquired_permits_contingency_flow(app, monkeypatch):
    """6. Lease adquirido permite o fluxo de contingência previsto."""
    with app.app_context():
        reset_throttle()
        past_date = date.today() - timedelta(days=2)
        race = Race(
            id=991,
            season=2026,
            series="f1",
            round=19,
            name="Mexico City Grand Prix",
            date=past_date,
        )
        db.session.add(race)
        db.session.commit()

        called = False
        def fake_import(race_item, **kwargs):
            nonlocal called
            called = True
            return True

        from app import results_refresh
        monkeypatch.setattr(results_refresh, "import_results_for_race", fake_import)

        res = contingency_refresh_pending_standings(season=2026, series="f1")
        assert res is True
        assert called is True


def test_07_held_lease_prevents_concurrent_sync(app):
    """7. Lease ocupado impede sincronização concorrente."""
    with app.app_context():
        reset_throttle()
        past_date = date.today() - timedelta(days=2)
        race = Race(
            id=992,
            season=2026,
            series="f1",
            round=19,
            name="Mexico City Grand Prix",
            date=past_date,
        )
        db.session.add(race)
        db.session.commit()

        lease1 = acquire_lease(lease_id="f1_sync", ttl_seconds=60)
        assert lease1["acquired"] is True

        # Segunda tentativa concorrente deve ser rejeitada
        lease2 = acquire_lease(lease_id="f1_sync", ttl_seconds=60)
        assert lease2["acquired"] is False
        assert lease2.get("reason") == "active_lease_held"

        res = contingency_refresh_pending_standings(season=2026, series="f1")
        assert res is False

        release_lease("f1_sync", lease1["worker_uuid"], lease1["fencing_token"])


def test_08_missing_lease_table_does_not_cause_500_in_standings(client, app, monkeypatch):
    """8. Tabela cron_sync_leases ausente não provoca erro 500 desnecessário na consulta de classificação."""
    with app.app_context():
        # Simula ausência da tabela cron_sync_leases
        from app import sync_lease

        def simulate_missing_table(*args, **kwargs):
            return {
                "acquired": False,
                "worker_uuid": "simulated",
                "fencing_token": None,
                "locked_until": None,
                "reason": "table_missing",
            }

        monkeypatch.setattr(sync_lease, "acquire_lease", simulate_missing_table)

        # A consulta de classificação deve continuar respondendo 200 com os dados disponíveis
        resp_drivers = client.get("/api/v1/standings/drivers")
        assert resp_drivers.status_code == 200
        data_d = resp_drivers.get_json()
        assert data_d["season"] == 2026
        assert isinstance(data_d["data"], list)

        resp_teams = client.get("/api/v1/standings/teams")
        assert resp_teams.status_code == 200
        data_t = resp_teams.get_json()
        assert data_t["season"] == 2026
        assert isinstance(data_t["data"], list)


def test_09_sync_failure_preserves_valid_data_and_signals_pending(client, app, monkeypatch):
    """9. Falha de sincronização preserva dados válidos e sinaliza pendência (pending_results: true)."""
    with app.app_context():
        reset_throttle()
        past_date = date.today() - timedelta(days=2)
        race = Race(
            id=993,
            season=2026,
            series="f1",
            round=19,
            name="Mexico City Grand Prix",
            date=past_date,
        )
        db.session.add(race)
        db.session.commit()

        # Simula falha total nas fontes externas
        from app import ergast, openf1
        monkeypatch.setattr(ergast, "get", lambda *a, **kw: None)
        monkeypatch.setattr(openf1, "get", lambda *a, **kw: None)

        resp = client.get("/api/v1/standings/drivers?season=2026")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["season"] == 2026
        # A pendência deve ser explicitamente sinalizada para o cliente
        assert data["pending_results"] is True
        assert isinstance(data["data"], list)


def test_10_retry_possible_after_infrastructure_corrected(app, monkeypatch):
    """10. Uma nova tentativa é possível após a infraestrutura ser corrigida."""
    with app.app_context():
        reset_throttle()
        past_date = date.today() - timedelta(days=2)
        race = Race(
            id=994,
            season=2026,
            series="f1",
            round=19,
            name="Mexico City Grand Prix",
            date=past_date,
        )
        db.session.add(race)
        db.session.commit()

        # Tentativa 1: infraestrutura indisponível (tabela ausente)
        from app import sync_lease
        def failing_lease(*a, **kw):
            return {"acquired": False, "reason": "table_missing"}
        monkeypatch.setattr(sync_lease, "acquire_lease", failing_lease)

        res1 = contingency_refresh_pending_standings(season=2026, series="f1")
        assert res1 is False

        # Tentativa 2: infraestrutura corrigida (lease real restabelecido)
        monkeypatch.undo()
        reset_throttle()

        called = False
        def successful_import(race_item, **kwargs):
            nonlocal called
            called = True
            return True

        from app import results_refresh
        monkeypatch.setattr(results_refresh, "import_results_for_race", successful_import)

        res2 = contingency_refresh_pending_standings(season=2026, series="f1")
        assert res2 is True
        assert called is True
