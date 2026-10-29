"""Atualizacao automatica de resultados, resultado da ultima corrida e qualificacoes historicas."""
from datetime import date, timedelta

import pytest

from app import cache as app_cache
from app import results_refresh
from app.api import races as races_api
from app.extensions import db
from app.models import Circuit, Driver, Race, RaceResult, Team
from app.results_refresh import (
    maybe_refresh_pending_results,
    pending_races,
    race_results_state,
    season_progress,
)

TODAY = date(2026, 10, 29)


# --- estado dos resultados ---------------------------------------------------


@pytest.mark.parametrize(
    "race_date,has_results,expected",
    [
        (TODAY - timedelta(days=4), True, "available"),
        (TODAY + timedelta(days=3), False, "upcoming"),
        (TODAY, False, "in_progress"),
        (TODAY - timedelta(days=1), False, "in_progress"),
        (TODAY - timedelta(days=4), False, "pending"),
        (TODAY - timedelta(days=60), False, "unavailable"),
        (None, False, "unavailable"),
    ],
)
def test_race_results_state(race_date, has_results, expected):
    result = race_results_state(race_date, has_results, today=TODAY)
    assert result["state"] == expected
    assert result["final"] is (expected == "available")
    assert (result["message"] is None) == (expected == "available")


# --- helpers -----------------------------------------------------------------


def _make_race(season, round_, name, race_date, series="f1"):
    circuit = Circuit(name=f"Circuito {name}", country="USA")
    db.session.add(circuit)
    race = Race(
        season=season,
        round=round_,
        name=name,
        date=race_date,
        series=series,
        circuit=circuit,
    )
    db.session.add(race)
    db.session.commit()
    return race


def _add_result(race, driver, team, position, points, grid=None):
    db.session.add(
        RaceResult(
            race_id=race.id,
            driver_id=driver.id,
            team_id=team.id,
            position=position,
            points=points,
            grid=grid,
            status="finished",
        )
    )
    db.session.commit()


@pytest.fixture
def season_data(app):
    """Duas corridas encerradas: uma com resultados e a ultima ainda sem resultados."""
    with app.app_context():
        team = Team.query.first()
        drivers = Driver.query.filter_by(series="f1").limit(3).all()
        done = _make_race(2031, 1, "GP Concluido", TODAY - timedelta(days=12))
        latest = _make_race(2031, 2, "GP Mais Recente", TODAY - timedelta(days=4))
        # Pontos propositalmente fora de ordem: 2o colocado com mais pontos
        # (ex.: ponto de volta mais rapida / penalidade pos-corrida).
        _add_result(done, drivers[0], team, 1, 25, grid=2)
        _add_result(done, drivers[1], team, 2, 26, grid=1)
        _add_result(done, drivers[2], team, 3, 15, grid=3)
        yield {"done": done.id, "latest": latest.id, "drivers": [d.id for d in drivers]}


@pytest.fixture(autouse=True)
def _freeze_today(monkeypatch):
    class FrozenDate(date):
        @classmethod
        def today(cls):
            return TODAY

    monkeypatch.setattr(results_refresh, "date", FrozenDate)
    results_refresh.reset_throttle()
    app_cache._memory.clear()
    yield
    results_refresh.reset_throttle()
    app_cache._memory.clear()


# --- resultados / ultima corrida ---------------------------------------------


def test_completed_race_returns_results_in_finishing_order(client, season_data):
    body = client.get(f"/api/v1/races/{season_data['done']}/results?per_page=50").get_json()
    assert [r["position"] for r in body["data"]] == [1, 2, 3]
    assert body["results_state"] == {"state": "available", "final": True, "message": None}
    assert set(body["meta"]) == {"page", "per_page", "total", "pages"}


def test_latest_race_without_results_is_pending_not_final(client, season_data):
    body = client.get(f"/api/v1/races/{season_data['latest']}/results").get_json()
    assert body["data"] == []
    assert body["meta"]["total"] == 0
    assert body["results_state"]["state"] == "pending"
    assert body["results_state"]["final"] is False
    assert body["results_state"]["message"]


def test_results_become_available_after_import(client, season_data, app):
    url = f"/api/v1/races/{season_data['latest']}/results"
    assert client.get(url).get_json()["results_state"]["state"] == "pending"
    with app.app_context():
        race = db.session.get(Race, season_data["latest"])
        team = Team.query.first()
        drivers = [db.session.get(Driver, i) for i in season_data["drivers"]]
        _add_result(race, drivers[1], team, 1, 25)
        _add_result(race, drivers[0], team, 2, 18)
    body = client.get(url).get_json()
    assert body["results_state"]["state"] == "available"
    assert [r["position"] for r in body["data"]] == [1, 2]


def test_unknown_race_still_404(client):
    assert client.get("/api/v1/races/99999999/results").status_code == 404


def test_f2_f3_meetings_have_informative_state(client):
    for series in ("f2", "f3"):
        listing = client.get(f"/api/v1/races?series={series}&season=2026&per_page=50").get_json()
        race = next(r for r in listing["data"] if r["round"] >= 1)
        body = client.get(f"/api/v1/races/{race['id']}/results").get_json()
        assert body["data"] == []
        assert body["results_state"]["state"] in {"upcoming", "unavailable"}
        assert body["results_state"]["final"] is False


# --- progresso da temporada / atualizacao automatica -------------------------


def test_pending_races_only_lists_finished_races_without_results(season_data, app):
    with app.app_context():
        ids = [r.id for r in pending_races(today=TODAY, season=2031)]
        assert ids == [season_data["latest"]]


def test_standings_expose_progress_and_update_when_results_arrive(client, season_data, app):
    first = client.get("/api/v1/standings/drivers?season=2031&series=f1").get_json()
    assert first["completed_races"] == 1
    assert first["pending_results"] is True

    with app.app_context():
        race = db.session.get(Race, season_data["latest"])
        _add_result(race, db.session.get(Driver, season_data["drivers"][0]), Team.query.first(), 1, 25)
    second = client.get("/api/v1/standings/drivers?season=2031&series=f1").get_json()
    assert second["completed_races"] == 2
    assert second["pending_results"] is False
    teams = client.get("/api/v1/standings/teams?season=2031&series=f1").get_json()
    assert teams["completed_races"] == 2
    assert {"season", "data"} <= set(teams)


def test_standings_f2_f3_contract_unchanged(client):
    for series in ("f2", "f3"):
        body = client.get(f"/api/v1/standings/drivers?season=2026&series={series}").get_json()
        assert "completed_races" not in body


def test_refresh_is_disabled_under_testing(app, season_data):
    with app.app_context():
        assert maybe_refresh_pending_results(app, season=2031) is False


def test_refresh_throttles_and_avoids_duplicate_runs(app, season_data, monkeypatch):
    calls = []

    class FakeThread:
        def __init__(self, target, args, daemon, name):
            self.target, self.args = target, args

        def start(self):
            calls.append(self.args)

    monkeypatch.setattr(results_refresh, "_refresh_enabled", lambda _app: True)
    monkeypatch.setattr(results_refresh.threading, "Thread", FakeThread)
    with app.app_context():
        assert maybe_refresh_pending_results(app, season=2031, now=1000.0) is True
        # segunda chamada: ja existe execucao em andamento
        assert maybe_refresh_pending_results(app, season=2031, now=1001.0) is False
        results_refresh._state["running"] = False
        # dentro da janela de throttle
        assert maybe_refresh_pending_results(app, season=2031, now=1100.0) is False
        # apos a janela
        assert maybe_refresh_pending_results(app, season=2031, now=1000.0 + 301) is True
    assert len(calls) == 2


def test_refresh_does_nothing_without_pending_races(app, monkeypatch):
    monkeypatch.setattr(results_refresh, "_refresh_enabled", lambda _app: True)
    with app.app_context():
        assert maybe_refresh_pending_results(app, season=1999) is False


def _entry(race, rows, entry_date=None):
    return [
        {
            "date": (entry_date or race.date).isoformat(),
            "Results": rows,
        }
    ]


def _row(pos, code, first, last, team="McLaren"):
    return {
        "position": str(pos),
        "points": str(max(0, 26 - pos * 2)),
        "grid": str(pos),
        "laps": "56",
        "status": "Finished",
        "Driver": {"code": code, "givenName": first, "familyName": last},
        "Constructor": {"name": team},
    }


def test_import_results_for_pending_race(app, season_data, monkeypatch):
    from app import ergast

    with app.app_context():
        race = db.session.get(Race, season_data["latest"])
        known = db.session.get(Driver, season_data["drivers"][0])
        known.code = known.code or "XYZ"
        db.session.commit()
        rows = [
            _row(1, known.code, "Nome Diferente", "Sobrenome Diferente"),
            _row(2, "ZZZ", "Novo", "Piloto"),
        ]
        monkeypatch.setattr(
            ergast, "get", lambda path: _entry(race, rows) if path.endswith("/results") else None
        )
        before = Driver.query.count()
        assert results_refresh.import_results_for_race(race) is True
        assert RaceResult.query.filter_by(race_id=race.id).count() == 2
        # o piloto ja existente na temporada nao e duplicado (apenas "ZZZ" e novo)
        assert Driver.query.count() <= before + 1
        assert season_progress(2031, today=TODAY)["completed_races"] == 2


def test_import_rejects_results_of_a_different_race(app, season_data, monkeypatch):
    from app import ergast

    with app.app_context():
        race = db.session.get(Race, season_data["latest"])
        monkeypatch.setattr(
            ergast,
            "get",
            lambda path: _entry(race, [_row(1, "AAA", "A", "B")], race.date - timedelta(days=30)),
        )
        assert results_refresh.import_results_for_race(race) is False
        assert RaceResult.query.filter_by(race_id=race.id).count() == 0


def test_refresh_pending_results_tolerates_source_failure(app, season_data, monkeypatch):
    from app import ergast

    def boom(path):
        raise ergast.JolpicaError("fora do ar")

    monkeypatch.setattr(ergast, "get", boom)
    with app.app_context():
        assert results_refresh.refresh_pending_results(today=TODAY) == 0
        assert [r.id for r in pending_races(today=TODAY, season=2031)] == [season_data["latest"]]


def test_race_results_endpoint_imports_on_demand_for_latest_race(client, app, season_data, monkeypatch):
    from app import ergast

    monkeypatch.setattr(results_refresh, "_refresh_enabled", lambda _app: True)
    with app.app_context():
        race = db.session.get(Race, season_data["latest"])
        rows = [
            _row(1, "NOR", "Lando", "Norris", team="McLaren"),
            _row(2, "PIA", "Oscar", "Piastri", team="McLaren"),
        ]
        monkeypatch.setattr(
            ergast, "get", lambda path: _entry(race, rows) if path.endswith("/results") else None
        )
    body = client.get(f"/api/v1/races/{season_data['latest']}/results?per_page=50").get_json()
    assert body["results_state"]["state"] == "available"
    assert [r["position"] for r in body["data"]] == [1, 2]



# --- qualificacoes historicas ------------------------------------------------


def _q(position, code, **times):
    return {
        "number": "1",
        "position": str(position),
        "Driver": {"code": code, "givenName": "G", "familyName": code},
        "Constructor": {"name": "Equipe"},
        **times,
    }


@pytest.fixture
def qualy_races(app):
    with app.app_context():
        team = Team.query.first()
        drivers = Driver.query.filter_by(series="f1").limit(2).all()
        out = {}
        # temporadas isoladas das geradas pela seed; a fonte e simulada nos testes
        for key, season in (("modern", 2041), ("single", 2042), ("none", 2043)):
            race = _make_race(season, 1, f"GP {key}", date(2020, 5, 1))
            out[key] = race.id
            _add_result(race, drivers[0], team, 1, 9, grid=2)
            _add_result(race, drivers[1], team, 2, 6, grid=1)
        yield out


def test_modern_qualifying_preserves_q1_q2_q3(client, qualy_races, monkeypatch):
    rows = [
        _q(1, "AAA", Q1="1:27.713", Q2="1:27.328", Q3="1:26.841"),
        _q(2, "BBB", Q1="1:27.800", Q2="1:27.400", Q3="1:26.900"),
        _q(16, "CCC", Q1="1:29.000"),
    ]
    monkeypatch.setattr(races_api, "_fetch_jolpica_qualifying", lambda s, r: rows)
    body = client.get(f"/api/v1/races/{qualy_races['modern']}/qualifying").get_json()
    assert body["info"]["kind"] == "qualifying"
    assert body["info"]["columns"] == ["q1", "q2", "q3"]
    assert [r["position"] for r in body["data"]] == [1, 2, 16]
    assert body["data"][0]["q3"] == "1:26.841"
    assert body["data"][2]["q2"] is None and body["data"][2]["q3"] is None
    assert body["data"][2]["best_time"] == "1:29.000"


def test_historical_single_session_qualifying(client, qualy_races, monkeypatch):
    rows = [_q(1, "SEN", Q1="1:21.548"), _q(2, "SCH", Q1="1:21.900")]
    monkeypatch.setattr(races_api, "_fetch_jolpica_qualifying", lambda s, r: rows)
    body = client.get(f"/api/v1/races/{qualy_races['single']}/qualifying").get_json()
    assert body["info"]["kind"] == "qualifying"
    assert body["info"]["columns"] == ["q1"]
    assert [r["driver_code"] for r in body["data"]] == ["SEN", "SCH"]


def test_race_without_qualifying_falls_back_to_starting_grid(client, qualy_races, monkeypatch):
    monkeypatch.setattr(races_api, "_fetch_jolpica_qualifying", lambda s, r: [])
    body = client.get(f"/api/v1/races/{qualy_races['none']}/qualifying").get_json()
    assert body["info"]["kind"] == "starting_grid"
    assert "sem tempos" in body["info"]["message"]
    assert [r["position"] for r in body["data"]] == [1, 2]
    assert all(r["best_time"] is None and r["q1"] is None for r in body["data"])


def test_race_without_any_data_has_explanatory_message(client, app, monkeypatch):
    with app.app_context():
        race = _make_race(1960, 1, "GP Sem Dados", date(1960, 5, 1))
        rid = race.id
    monkeypatch.setattr(races_api, "_fetch_jolpica_qualifying", lambda s, r: [])
    body = client.get(f"/api/v1/races/{rid}/qualifying").get_json()
    assert body["data"] == []
    assert body["info"]["kind"] == "none"
    assert body["info"]["message"]


def test_qualifying_source_failure_is_an_error_not_an_empty_table(client, qualy_races, monkeypatch):
    from app.api.helpers import ApiError

    def boom(s, r):
        raise ApiError("Falha ao consultar a fonte de classificação", 502)

    monkeypatch.setattr(races_api, "_fetch_jolpica_qualifying", boom)
    res = client.get(f"/api/v1/races/{qualy_races['modern']}/qualifying")
    assert res.status_code == 502


def test_qualifying_unknown_race_and_non_f1(client, app):
    assert client.get("/api/v1/races/99999999/qualifying").status_code == 404
    with app.app_context():
        race = _make_race(2026, 1, "F2 Rodada", date(2026, 3, 1), series="f2")
        rid = race.id
    body = client.get(f"/api/v1/races/{rid}/qualifying").get_json()
    assert body["info"]["kind"] == "none"


def test_qualifying_uses_cache(client, qualy_races, monkeypatch):
    calls = []

    def fetch(season, round_):
        calls.append((season, round_))
        return [_q(1, "AAA", Q1="1:00.000")]

    from app import cache

    monkeypatch.setattr(races_api, "_fetch_jolpica_qualifying", fetch)
    url = f"/api/v1/races/{qualy_races['single']}/qualifying"
    client.get(url)
    client.get(url)
    assert len(calls) == 1


def test_normalize_qualifying_preserves_source_order_and_participants():
    rows = [_q(3, "CCC", Q1="1:30.000"), _q(1, "AAA", Q1="1:28.000")]
    data, columns = races_api._normalize_qualifying(rows)
    assert [d["driver_code"] for d in data] == ["CCC", "AAA"]
    assert columns == ["q1"]
