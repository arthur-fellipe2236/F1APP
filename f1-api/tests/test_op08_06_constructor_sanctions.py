import hashlib
from pathlib import Path

from app.api import historical_rules, standings as standings_mod
from app.extensions import db
from app.models import Driver, Race, RaceResult, Team


def _get_or_create_team(name):
    team = Team.query.filter_by(name=name, series="f1").first()
    if team is None:
        team = Team(name=name, series="f1")
        db.session.add(team)
        db.session.flush()
    return team


def _get_or_create_driver(first_name, last_name, code, team_id):
    drv = Driver.query.filter_by(code=code, series="f1").first()
    if drv is None:
        drv = Driver(first_name=first_name, last_name=last_name, code=code, series="f1", team_id=team_id)
        db.session.add(drv)
        db.session.flush()
    return drv


def _seed_2007_season():
    mcl = _get_or_create_team("McLaren")
    fer = _get_or_create_team("Ferrari")
    bmw = _get_or_create_team("BMW Sauber")
    ren = _get_or_create_team("Renault")

    alo = _get_or_create_driver("Fernando", "Alonso", "ALO", mcl.id)
    ham = _get_or_create_driver("Lewis", "Hamilton", "HAM", mcl.id)
    rai = _get_or_create_driver("Kimi", "Raikkonen", "RAI", fer.id)
    mas = _get_or_create_driver("Felipe", "Massa", "MAS", fer.id)
    hei = _get_or_create_driver("Nick", "Heidfeld", "HEI", bmw.id)
    fis = _get_or_create_driver("Giancarlo", "Fisichella", "FIS", ren.id)

    race1 = Race(season=2007, round=1, name="Australian Grand Prix", series="f1")
    race2 = Race(season=2007, round=2, name="Brazilian Grand Prix", series="f1")
    db.session.add_all([race1, race2])
    db.session.flush()

    # Exact season point totals matching 2007 FIA Drivers' & Constructors' totals:
    # McLaren: Alonso 109 + Hamilton 109 = 218 (wins=8), Ferrari: Rai 110 + Massa 94 = 204 (wins=9)
    db.session.add_all(
        [
            RaceResult(race_id=race1.id, driver_id=alo.id, team_id=mcl.id, position=1, points=55.0, status="finished"),
            RaceResult(race_id=race2.id, driver_id=alo.id, team_id=mcl.id, position=2, points=54.0, status="finished"),
            RaceResult(race_id=race1.id, driver_id=ham.id, team_id=mcl.id, position=1, points=55.0, status="finished"),
            RaceResult(race_id=race2.id, driver_id=ham.id, team_id=mcl.id, position=2, points=54.0, status="finished"),
            RaceResult(race_id=race1.id, driver_id=rai.id, team_id=fer.id, position=1, points=60.0, status="finished"),
            RaceResult(race_id=race2.id, driver_id=rai.id, team_id=fer.id, position=1, points=50.0, status="finished"),
            RaceResult(race_id=race1.id, driver_id=mas.id, team_id=fer.id, position=1, points=50.0, status="finished"),
            RaceResult(race_id=race2.id, driver_id=mas.id, team_id=fer.id, position=3, points=44.0, status="finished"),
            RaceResult(race_id=race1.id, driver_id=hei.id, team_id=bmw.id, position=3, points=101.0, status="finished"),
            RaceResult(race_id=race1.id, driver_id=fis.id, team_id=ren.id, position=4, points=51.0, status="finished"),
        ]
    )
    db.session.commit()


def test_t01_t02_t03_t04_t06_2007_mclaren_excluded_ferrari_champion_drivers_preserved(app, client):
    with app.app_context():
        _seed_2007_season()

    # T01, T02, T06: Team standings 2007
    resp_teams = client.get("/api/v1/standings/teams?season=2007&series=f1")
    assert resp_teams.status_code == 200
    body_teams = resp_teams.get_json()
    rows = body_teams["data"]
    assert "note" in body_teams and "McLaren" in body_teams["note"]

    # T02: Ferrari champion with 204.0 points at position 1
    assert rows[0]["team_name"] == "Ferrari"
    assert rows[0]["position"] == 1
    assert rows[0]["points"] == 204.0

    # T06: Non-sanctioned teams keep exact points
    by_team = {r["team_name"]: r for r in rows}
    assert by_team["BMW Sauber"]["points"] == 101.0
    assert by_team["BMW Sauber"]["position"] == 2
    assert by_team["Renault"]["points"] == 51.0
    assert by_team["Renault"]["position"] == 3

    # T01: McLaren excluded at the end with 0.0 points, position=None, position_text="EX"
    mcl = by_team["McLaren"]
    assert mcl is rows[-1]
    assert mcl["points"] == 0.0
    assert mcl["position"] is None
    assert mcl["position_text"] == "EX"
    assert mcl["excluded"] is True
    assert mcl["sanctioned"] is True

    # T03, T04: Drivers Alonso & Hamilton preserve 109.0 points each
    resp_drv = client.get("/api/v1/standings/drivers?season=2007&series=f1")
    assert resp_drv.status_code == 200
    by_drv = {r["driver_name"]: r for r in resp_drv.get_json()["data"]}
    assert by_drv["Kimi Raikkonen"]["points"] == 110.0
    assert by_drv["Fernando Alonso"]["points"] == 109.0
    assert by_drv["Lewis Hamilton"]["points"] == 109.0


def test_t05_seasons_without_sanctions_unchanged(app, client):
    with app.app_context():
        mcl = _get_or_create_team("McLaren")
        ham = _get_or_create_driver("Lewis", "Hamilton", "HAM", mcl.id)
        r2008 = Race(season=2008, round=1, name="Australian Grand Prix", series="f1")
        db.session.add(r2008)
        db.session.flush()
        db.session.add(RaceResult(race_id=r2008.id, driver_id=ham.id, team_id=mcl.id, position=1, points=10.0, status="finished"))
        db.session.commit()

    resp = client.get("/api/v1/standings/teams?season=2008&series=f1")
    assert resp.status_code == 200
    rows = resp.get_json()["data"]
    assert rows[0]["team_name"] == "McLaren"
    assert rows[0]["points"] == 10.0
    assert rows[0]["position"] == 1
    assert rows[0].get("excluded") is not True


def test_t07_t08_t09_multiple_sanctions_modalities_and_fallback(monkeypatch):
    # T09: Fallback original when no rules exist for (series, season)
    sample = [{"team_id": 1, "team_name": "Ferrari", "points": 100.0}]
    assert historical_rules.apply_constructor_sanctions(sample, season=2099, series="f1") == sample

    # T07 & T08: Multiple sanctioned teams + different modalities + floor at 0.0
    monkeypatch.setitem(
        historical_rules.CONSTRUCTOR_SANCTIONS,
        ("f1", 2098),
        [
            {
                "team_name": "Team A",
                "sanction_type": "championship_exclusion",
                "official_points": 0.0,
                "exclude_from_ranking": True,
                "note": "Excluded",
            },
            {
                "team_name": "Team B",
                "sanction_type": "points_deduction",
                "points_delta": -15.0,
                "note": "Deducted 15 pts",
            },
            {
                "team_name": "Team C",
                "sanction_type": "points_deduction",
                "points_delta": -50.0,
                "note": "Deducted 50 pts floored",
            },
        ],
    )
    rows = [
        {"team_id": 1, "team_name": "Team A", "points": 200.0},
        {"team_id": 2, "team_name": "Team B", "points": 50.0},
        {"team_id": 3, "team_name": "Team C", "points": 10.0},
        {"team_id": 4, "team_name": "Team D", "points": 80.0},
    ]
    out = historical_rules.apply_constructor_sanctions(rows, season=2098, series="f1")
    by_name = {r["team_name"]: r for r in out}
    assert by_name["Team A"]["points"] == 0.0 and by_name["Team A"]["excluded"] is True
    assert by_name["Team B"]["points"] == 35.0 and by_name["Team B"].get("excluded") is not True
    assert by_name["Team C"]["points"] == 0.0
    assert by_name["Team D"]["points"] == 80.0 and by_name["Team D"].get("sanctioned") is not True


def test_t10_f2_f3_compatibility(client, monkeypatch):
    monkeypatch.setattr(
        standings_mod,
        "get_standings",
        lambda series, kind: [
            {"position": 1, "team_name": "McLaren", "points": 120.0, "wins": 2, "podiums": 5, "races": 10}
        ],
    )
    for series in ("f2", "f3"):
        resp = client.get(f"/api/v1/standings/teams?season=2026&series={series}")
        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert data[0]["team_name"] == "McLaren"
        assert data[0]["points"] == 120.0


def test_regression_ties_nulls_no_duplicates_and_eras(app, client):
    # Pre-1958 (< 1958) vs post-1978 (> 1978) & ties/nulls
    with app.app_context():
        t1 = Team(name="Alpha", series="f1")
        t2 = Team(name="Beta", series="f1")
        db.session.add_all([t1, t2])
        db.session.flush()
        d1 = Driver(first_name="A", last_name="One", code="AO1", series="f1", team_id=t1.id)
        d2 = Driver(first_name="B", last_name="Two", code="BT2", series="f1", team_id=t2.id)
        db.session.add_all([d1, d2])
        db.session.flush()
        r1955 = Race(season=1955, round=1, name="Argentine Grand Prix", series="f1")
        r1980 = Race(season=1980, round=1, name="Argentine Grand Prix", series="f1")
        db.session.add_all([r1955, r1980])
        db.session.flush()
        db.session.add_all(
            [
                RaceResult(race_id=r1955.id, driver_id=d1.id, team_id=t1.id, position=1, points=8.0, status="finished"),
                RaceResult(race_id=r1980.id, driver_id=d1.id, team_id=t1.id, position=1, points=9.0, status="finished"),
                RaceResult(race_id=r1980.id, driver_id=d2.id, team_id=t2.id, position=1, points=9.0, status="finished"),
            ]
        )
        db.session.commit()

    # Pre-1958 keeps official=False
    r55 = client.get("/api/v1/standings/teams?season=1955&series=f1").get_json()
    assert r55["official"] is False

    # Post-1978 tie deterministic ordering and no duplicate team_ids
    r80 = client.get("/api/v1/standings/teams?season=1980&series=f1").get_json()
    ids = [r["team_id"] for r in r80["data"]]
    assert len(ids) == len(set(ids))
    assert r80["data"][0]["position"] == 1
    assert r80["data"][1]["position"] == 2

    # Null team_name handling in apply_constructor_sanctions
    assert historical_rules.apply_constructor_sanctions([{"team_name": None, "points": 10.0}], season=2007, series="f1")[0]["points"] == 10.0


def test_mirror_parity_f1_api_and_api_serverless():
    root = Path(__file__).resolve().parents[2]
    for rel in ("app/api/historical_rules.py", "app/api/standings.py"):
        f1_api_file = root / "f1-api" / rel
        api_file = root / "api" / rel
        assert hashlib.sha256(f1_api_file.read_bytes()).hexdigest() == hashlib.sha256(api_file.read_bytes()).hexdigest()
