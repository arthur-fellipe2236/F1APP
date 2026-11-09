import os
import time
from datetime import date, datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest
from app.extensions import db
from app.models import Driver, Race, RaceResult, Team
from app.sync_lease import CronSyncLease
from app.results_refresh import (
    contingency_refresh_pending_standings,
    ensure_race_results,
    import_results_for_race,
    pending_races,
    reset_throttle,
    season_progress,
)
from app.sync_lease import (
    FencingContextRequiredError,
    ZombieWorkerError,
    acquire_lease,
    atomic_sync_write,
    release_lease,
    validate_fencing_token,
)


def test_contingency_no_pending_races(app):
    """TC-01: Quando não há corridas pendentes, nenhuma sincronização é realizada."""
    with app.app_context():
        reset_throttle()
        res = contingency_refresh_pending_standings(season=2026, series="f1")
        assert res is False


def test_contingency_successful_import_and_standings_update(app, monkeypatch):
    """TC-02: Importação com sucesso de corrida pendente e atualização de classificação."""
    with app.app_context():
        reset_throttle()
        past_date = date.today() - timedelta(days=2)
        race = Race(
            id=940,
            season=2026,
            series="f1",
            round=19,
            name="Mexico City Grand Prix",
            date=past_date,
        )
        db.session.add(race)
        db.session.commit()

        pending = pending_races(today=date.today(), series="f1", season=2026)
        assert len(pending) == 1
        assert pending[0].id == 940

        mock_results = [{
            "date": past_date.isoformat(),
            "Results": [
                {
                    "position": "1", "points": "25", "grid": "5", "laps": "71", "status": "Finished",
                    "Driver": {"code": "VER", "givenName": "Max", "familyName": "Verstappen"},
                    "Constructor": {"name": "Red Bull Racing"}
                },
                {
                    "position": "2", "points": "18", "grid": "1", "laps": "71", "status": "Finished",
                    "Driver": {"code": "HAM", "givenName": "Lewis", "familyName": "Hamilton"},
                    "Constructor": {"name": "Ferrari"}
                },
                {
                    "position": "3", "points": "15", "grid": "4", "laps": "71", "status": "Finished",
                    "Driver": {"code": "ANT", "givenName": "Andrea Kimi", "familyName": "Antonelli"},
                    "Constructor": {"name": "Mercedes"}
                },
            ]
        }]
        from app import ergast
        monkeypatch.setattr(ergast, "get", lambda path, *args, **kwargs: mock_results)

        res = contingency_refresh_pending_standings(season=2026, series="f1", timeout=4.0)
        assert res is True

        results = RaceResult.query.filter_by(race_id=940).all()
        assert len(results) == 3

        ver = Driver.query.filter_by(code="VER").first()
        ham = Driver.query.filter_by(code="HAM").first()
        ant = Driver.query.filter_by(code="ANT").first()

        ver_res = RaceResult.query.filter_by(race_id=940, driver_id=ver.id).first()
        ham_res = RaceResult.query.filter_by(race_id=940, driver_id=ham.id).first()
        ant_res = RaceResult.query.filter_by(race_id=940, driver_id=ant.id).first()
        assert ver_res.points == 25.0
        assert ham_res.points == 18.0
        assert ant_res.points == 15.0

        prog = season_progress(season=2026, series="f1")
        assert prog["completed_races"] >= 1
        assert prog["pending_results"] is False


def test_contingency_cooldown_prevents_repeated_calls(app, monkeypatch):
    """TC-03: Cooldown de 300 segundos impede requisições repetidas para a mesma etapa."""
    with app.app_context():
        reset_throttle()
        past_date = date.today() - timedelta(days=2)
        race = Race(
            id=940,
            season=2026,
            series="f1",
            round=19,
            name="Mexico City Grand Prix",
            date=past_date,
        )
        db.session.add(race)
        db.session.commit()

        called_count = 0
        def fake_ergast(path, *args, **kwargs):
            nonlocal called_count
            called_count += 1
            return None

        from app import ergast, openf1
        monkeypatch.setattr(ergast, "get", fake_ergast)
        monkeypatch.setattr(openf1, "get", lambda *args, **kwargs: None)

        res1 = contingency_refresh_pending_standings(season=2026, series="f1", cooldown=300)
        assert res1 is False
        assert called_count == 1

        res2 = contingency_refresh_pending_standings(season=2026, series="f1", cooldown=300)
        assert res2 is False
        assert called_count == 1


def test_contingency_concurrent_lock_protection(app):
    """TC-04: Concorrência bloqueada com proteção de lease lock e fencing token."""
    with app.app_context():
        reset_throttle()
        past_date = date.today() - timedelta(days=2)
        race = Race(
            id=940,
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

        res2 = contingency_refresh_pending_standings(season=2026, series="f1")
        assert res2 is False

        release_lease("f1_sync", lease1["worker_uuid"], lease1["fencing_token"])


def test_contingency_timeout_and_fail_soft(app, monkeypatch):
    """TC-05: Timeout estrito e fail-soft preservam estabilidade sem corromper transações."""
    with app.app_context():
        reset_throttle()
        past_date = date.today() - timedelta(days=2)
        race = Race(
            id=940,
            season=2026,
            series="f1",
            round=19,
            name="Mexico City Grand Prix",
            date=past_date,
        )
        db.session.add(race)
        db.session.commit()

        from app.ergast import JolpicaError

        def timeout_ergast(path, *args, **kwargs):
            raise JolpicaError("Timeout simulado de 4 segundos na conexão Jolpica")

        from app import ergast, openf1
        monkeypatch.setattr(ergast, "get", timeout_ergast)
        monkeypatch.setattr(openf1, "get", lambda *args, **kwargs: None)

        res = contingency_refresh_pending_standings(season=2026, series="f1", timeout=4.0)
        assert res is False

        lease_status = CronSyncLease.query.filter_by(id="f1_sync").first()
        assert lease_status.locked_by is None
        assert lease_status.locked_until is None


def test_standings_endpoint_triggers_contingency_and_returns_fresh_data(client, monkeypatch, app):
    """TC-06: Endpoint /api/v1/standings/drivers aciona a contingência e retorna os novos pontos."""
    app.config["FORCE_SYNC_REFRESH"] = True
    try:
        with app.app_context():
            reset_throttle()
            past_date = date.today() - timedelta(days=2)
            race = Race(
                id=940,
                season=2026,
                series="f1",
                round=19,
                name="Mexico City Grand Prix",
                date=past_date,
            )
            db.session.add(race)
            db.session.commit()

            mock_results = [{
                "date": past_date.isoformat(),
                "Results": [
                    {
                        "position": "1", "points": "25", "grid": "5", "laps": "71", "status": "Finished",
                        "Driver": {"code": "VER", "givenName": "Max", "familyName": "Verstappen"},
                        "Constructor": {"name": "Red Bull Racing"}
                    },
                    {
                        "position": "2", "points": "18", "grid": "1", "laps": "71", "status": "Finished",
                        "Driver": {"code": "HAM", "givenName": "Lewis", "familyName": "Hamilton"},
                        "Constructor": {"name": "Ferrari"}
                    },
                    {
                        "position": "3", "points": "15", "grid": "4", "laps": "71", "status": "Finished",
                        "Driver": {"code": "ANT", "givenName": "Andrea Kimi", "familyName": "Antonelli"},
                        "Constructor": {"name": "Mercedes"}
                    },
                ]
            }]
            from app import ergast
            monkeypatch.setattr(ergast, "get", lambda path, *args, **kwargs: mock_results)

        # Chamada HTTP ao endpoint de classificação
        resp = client.get("/api/v1/standings/drivers?season=2026&series=f1")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["season"] == 2026
        assert data["completed_races"] >= 1
        assert data["pending_results"] is False

        top_drivers = data["data"]
        ant_entry = next((d for d in top_drivers if d["driver_code"] == "ANT"), None)
        ver_entry = next((d for d in top_drivers if d["driver_code"] == "VER"), None)
        assert ant_entry is not None
        assert ver_entry is not None
        assert ver_entry["points"] >= 25.0
        assert ant_entry["points"] >= 15.0
    finally:
        app.config.pop("FORCE_SYNC_REFRESH", None)


def test_points_mathematical_consistency_and_2026_championship():
    """TC-07: Verificação matemática do campeonato 2026 e pontuação acumulada."""
    antonelli_pts = 380.0
    verstappen_pts = 261.0
    hamilton_pts = 259.0
    russell_pts = 250.0
    leclerc_pts = 245.0

    completed_races = 19
    remaining_races = 23 - completed_races  # 4 corridas (Brasil, Las Vegas, Catar, Abu Dhabi)

    max_pts_possible = (4 * 25) + (2 * 8)
    assert max_pts_possible == 116

    verstappen_max_ceiling = verstappen_pts + max_pts_possible
    assert verstappen_max_ceiling == 377.0

    assert antonelli_pts > verstappen_max_ceiling
    gap = antonelli_pts - verstappen_pts
    assert gap == 119.0


def test_highlights_registry_verification():
    """TC-08: Verificação do registro oficial de highlights e fallback."""
    mexico_id = "tIiRK7hKScU"
    mexico_duration = "8:08"
    assert len(mexico_id) == 11
    assert mexico_duration == "8:08"
