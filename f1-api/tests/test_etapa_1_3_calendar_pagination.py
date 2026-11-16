import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import pytest

WORKTREE_ROOT = Path(__file__).resolve().parents[2]
API_ROOT = WORKTREE_ROOT / "api"
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app import create_app
from app.extensions import db
from app.models import Circuit, Driver, Race, RaceResult, Team


@pytest.fixture(scope="module")
def app(tmp_path_factory):
    db_path = tmp_path_factory.mktemp("etapa13_db") / "etapa13.db"
    os.environ["F1_DATABASE_URI"] = f"sqlite:///{db_path}"
    os.environ["NO_BACKGROUND_SYNC"] = "1"
    application = create_app()
    application.config["TESTING"] = True
    return application


@pytest.fixture(autouse=True)
def _clean_db(app):
    with app.app_context():
        db.drop_all()
        db.create_all()
        _seed_multi_season_data()
        yield
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def _seed_multi_season_data():
    c1 = Circuit(name="Interlagos", country="Brazil")
    c2 = Circuit(name="Silverstone", country="UK")
    db.session.add_all([c1, c2])
    db.session.flush()

    t_2025 = Team(name="McLaren", series="f1")
    t_2026 = Team(name="Mercedes", series="f1")
    db.session.add_all([t_2025, t_2026])
    db.session.flush()

    d_2025 = Driver(first_name="Lando", last_name="Norris", code="NOR", series="f1", team_id=t_2025.id)
    d_2026 = Driver(first_name="Andrea", last_name="Antonelli", code="ANT", series="f1", team_id=t_2026.id)
    d_1950 = Driver(first_name="Nino", last_name="Farina", code="FAR", series="f1", team_id=t_2025.id)
    db.session.add_all([d_2025, d_2026, d_1950])
    db.session.flush()

    # 1950 race
    r_1950 = Race(season=1950, series="f1", round=1, name="British GP 1950", date=date(1950, 5, 13), circuit_id=c2.id)
    # 2025 race
    r_2025 = Race(season=2025, series="f1", round=1, name="Brazil GP 2025", date=date(2025, 11, 9), circuit_id=c1.id)
    # 2026 completed + future race
    r_2026_past = Race(season=2026, series="f1", round=1, name="Australia GP 2026", date=date(2026, 3, 8), circuit_id=c1.id)
    r_2026_future = Race(season=2026, series="f1", round=21, name="Las Vegas GP 2026", date=date.today() + timedelta(days=30), circuit_id=c2.id)
    db.session.add_all([r_1950, r_2025, r_2026_past, r_2026_future])
    db.session.flush()

    db.session.add_all([
        RaceResult(race_id=r_1950.id, driver_id=d_1950.id, team_id=t_2025.id, position=1, points=9.0),
        RaceResult(race_id=r_2025.id, driver_id=d_2025.id, team_id=t_2025.id, position=1, points=25.0),
        RaceResult(race_id=r_2026_past.id, driver_id=d_2026.id, team_id=t_2026.id, position=1, points=25.0),
    ])
    db.session.commit()


def test_season_and_year_compatibility_and_precedence(client):
    # 1. season=2025 e year=2025 devem retornar exatamente os mesmos dados
    r_s = client.get("/api/v1/races?season=2025&series=f1")
    r_y = client.get("/api/v1/races?year=2025&series=f1")
    assert r_s.status_code == 200 and r_y.status_code == 200
    assert [x["name"] for x in r_s.get_json()["data"]] == ["Brazil GP 2025"]
    assert [x["name"] for x in r_y.get_json()["data"]] == ["Brazil GP 2025"]

    # 2. Standings com year=2025 e season=1950
    st_y = client.get("/api/v1/standings/drivers?year=2025&series=f1")
    assert st_y.status_code == 200
    assert st_y.get_json()["season"] == 2025
    assert st_y.get_json()["data"][0]["driver_name"] == "Lando Norris"

    st_1950 = client.get("/api/v1/standings/drivers?year=1950&series=f1")
    assert st_1950.status_code == 200
    assert st_1950.get_json()["season"] == 1950
    assert st_1950.get_json()["data"][0]["driver_name"] == "Nino Farina"

    # 3. Precedencia: quando ambos estao presentes, season prevalece
    r_both = client.get("/api/v1/races?season=2025&year=1950&series=f1")
    assert r_both.status_code == 200
    assert [x["name"] for x in r_both.get_json()["data"]] == ["Brazil GP 2025"]

    # 4. Circuits, drivers, teams aceitam year=
    assert client.get("/api/v1/circuits?year=2025&series=f1").status_code == 200
    assert client.get("/api/v1/drivers?year=2025&series=f1").status_code == 200
    assert client.get("/api/v1/teams?year=2025&series=f1").status_code == 200

    # 5. Valores invalidos retornam 400 sem excecao 500
    assert client.get("/api/v1/races?season=abc").status_code == 400
    assert client.get("/api/v1/races?year=xyz").status_code == 400

    # 6. Ausencia de ambos retorna todas as corridas paginadas (default per_page=10)
    r_all = client.get("/api/v1/races?series=f1")
    assert r_all.status_code == 200
    assert r_all.get_json()["meta"]["per_page"] == 10
    assert r_all.get_json()["meta"]["total"] == 4


def test_pagination_limits_out_of_range_and_over_50_race_results(client, app):
    with app.app_context():
        c = Circuit.query.first()
        t = Team.query.first()
        r_big = Race(season=1955, series="f1", round=1, name="Big Historic GP", date=date(1955, 5, 30), circuit_id=c.id)
        db.session.add(r_big)
        db.session.flush()
        for i in range(1, 56):
            d = Driver(first_name=f"Pilot{i}", last_name=f"Last{i}", series="f1", team_id=t.id)
            db.session.add(d)
            db.session.flush()
            db.session.add(RaceResult(race_id=r_big.id, driver_id=d.id, team_id=t.id, position=i, points=0.0))
        db.session.commit()
        big_id = r_big.id
        future_id = Race.query.filter_by(name="Las Vegas GP 2026").one().id

    # Teto maximo per_page=50 mesmo pedindo 500
    p1 = client.get(f"/api/v1/races/{big_id}/results?page=1&per_page=500").get_json()
    p2 = client.get(f"/api/v1/races/{big_id}/results?page=2&per_page=50").get_json()
    p99 = client.get(f"/api/v1/races/{big_id}/results?page=99&per_page=50").get_json()

    assert p1["meta"]["per_page"] == 50
    assert p1["meta"]["total"] == 55
    assert p1["meta"]["pages"] == 2
    assert len(p1["data"]) == 50
    assert len(p2["data"]) == 5
    assert p1["results_state"]["state"] == "available"
    assert p99["data"] == []

    all_ids = [x["driver_id"] for x in p1["data"]] + [x["driver_id"] for x in p2["data"]]
    assert len(all_ids) == 55 and len(set(all_ids)) == 55

    # Corrida futura retorna state=upcoming e data=[]
    fut = client.get(f"/api/v1/races/{future_id}/results").get_json()
    assert fut["data"] == []
    assert fut["results_state"]["state"] == "upcoming"


def test_custom_2026_next_race_rounds_match_canonical_calendar(app):
    from app.api.races import _next_race_payload

    app.config["TESTING"] = False
    try:
        with app.app_context():
            # 1. Antes de Las Vegas (2026-11-15) -> round 21 (nao 22)
            with patch("app.api.races.datetime") as mock_dt:
                mock_dt.now.return_value = datetime(2026, 11, 15, 12, 0, tzinfo=timezone.utc)
                mock_dt.fromisoformat.side_effect = datetime.fromisoformat
                lv = _next_race_payload()
                assert lv["name"] == "Las Vegas Grand Prix"
                assert lv["round"] == 21

            # 2. Antes do GP do Brasil (2026-11-05) -> round 20
            with patch("app.api.races.datetime") as mock_dt:
                mock_dt.now.return_value = datetime(2026, 11, 5, 12, 0, tzinfo=timezone.utc)
                mock_dt.fromisoformat.side_effect = datetime.fromisoformat
                br = _next_race_payload()
                assert br["name"] == "GP do Brasil (São Paulo - Interlagos)"
                assert br["round"] == 20

            # 3. Antes do Qatar (2026-11-25) -> round 22
            with patch("app.api.races.datetime") as mock_dt:
                mock_dt.now.return_value = datetime(2026, 11, 25, 12, 0, tzinfo=timezone.utc)
                mock_dt.fromisoformat.side_effect = datetime.fromisoformat
                qa = _next_race_payload()
                assert qa["name"] == "Qatar Grand Prix"
                assert qa["round"] == 22

            # 4. Antes de Abu Dhabi (2026-12-02) -> round 23
            with patch("app.api.races.datetime") as mock_dt:
                mock_dt.now.return_value = datetime(2026, 12, 2, 12, 0, tzinfo=timezone.utc)
                mock_dt.fromisoformat.side_effect = datetime.fromisoformat
                ad = _next_race_payload()
                assert ad["name"] == "Abu Dhabi Grand Prix"
                assert ad["round"] == 23
    finally:
        app.config["TESTING"] = True
