"""Etapa 1.11 - fonte unica de horarios (UTC), automatizacao e resiliencia.

Todos os casos usam o snapshot semente (dados reais da OpenF1 validados em
17/11/2026) servido por um ``openf1.get`` falso: nenhuma rede, nenhum banco
real. As referencias oficiais abaixo foram confirmadas na programacao oficial
da F1 / transmissoras e servem para comparar com a OpenF1.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

import pytest

from app import cache as cache_mod
from app import f1site, openf1, schedule

SEED_PATH = Path(schedule.SEED_DIR) / "schedule_seed_2026.json"
BRT = ZoneInfo("America/Sao_Paulo")


def _seed():
    return json.loads(SEED_PATH.read_text(encoding="utf-8"))


class FakeOpenF1:
    def __init__(self, meetings=None, sessions=None):
        seed = _seed()
        self.meetings = seed["meetings"] if meetings is None else meetings
        self.sessions = seed["sessions"] if sessions is None else sessions
        self.calls = []
        self.error = None
        self.raw_override = None

    def __call__(self, path, **params):
        self.calls.append((path, params))
        if self.error:
            raise self.error
        if self.raw_override is not None and path in self.raw_override:
            return self.raw_override[path]
        if path == "meetings":
            return list(self.meetings)
        if path == "sessions":
            return list(self.sessions)
        return None


@pytest.fixture(autouse=True)
def _isolated(monkeypatch, tmp_path):
    schedule.reset_for_tests()
    cache_mod._memory.clear()
    monkeypatch.setenv("F1_SCHEDULE_CACHE_DIR", str(tmp_path / "sched"))
    monkeypatch.setattr(f1site, "upcoming_rounds", lambda ref=None: (_ for _ in ()).throw(f1site.F1SiteError("off")))
    yield
    schedule.reset_for_tests()
    cache_mod._memory.clear()


@pytest.fixture
def fake(monkeypatch):
    f = FakeOpenF1()
    monkeypatch.setattr(openf1, "get", f)
    return f


def _race(year_sessions, meeting_key):
    return next(s for s in year_sessions if s["meeting_key"] == meeting_key and s["session_name"] == "Race")


# ---------------------------------------------------------------- instantes

@pytest.mark.parametrize(
    "raw,expected",
    [
        ("2026-11-22T04:00:00+00:00", "2026-11-22T04:00:00+00:00"),
        ("2026-11-22T04:00:00Z", "2026-11-22T04:00:00+00:00"),
        ("2026-11-21T20:00:00-08:00", "2026-11-22T04:00:00+00:00"),
        ("2026-11-22T01:00:00-03:00", "2026-11-22T04:00:00+00:00"),
        ("2026-11-22T04:00:00", None),  # sem fuso: rejeitado, nunca presumido
        ("2026-11-22", None),
        ("", None),
        (None, None),
        ("lixo", None),
        (123, None),
    ],
)
def test_normalize_instant(raw, expected):
    assert schedule.normalize_instant(raw) == expected


# ------------------------------------------------- conversao UTC -> Brasilia

CASES = [
    # (meeting_key, circuito tz, hora local oficial da corrida, esperado em Brasilia)
    ("Las Vegas", 1300, "America/Los_Angeles", (2026, 11, 21, 20, 0), (2026, 11, 22, 1, 0)),
    ("Catar", 1301, "Asia/Qatar", (2026, 11, 29, 19, 0), (2026, 11, 29, 13, 0)),
    ("Singapura", 1296, "Asia/Singapore", (2026, 10, 11, 20, 0), (2026, 10, 11, 9, 0)),
    # Austin: 15:00 CDT = 17:00 BRT (grandepremio/gfesporte); o calendario manual antigo dizia 16:00 BRT (erro)
    ("Austin", 1297, "America/Chicago", (2026, 10, 25, 15, 0), (2026, 10, 25, 17, 0)),
    ("Mexico", 1298, "America/Mexico_City", (2026, 11, 1, 14, 0), (2026, 11, 1, 17, 0)),
]


@pytest.mark.parametrize("label,key,tz,local,brt", CASES)
def test_openf1_race_matches_official_reference(label, key, tz, local, brt):
    race = _race(_seed()["sessions"], key)
    start = datetime.fromisoformat(race["date_start"])
    assert start.utcoffset().total_seconds() == 0  # instante UTC explicito
    official_local = datetime(*local, tzinfo=ZoneInfo(tz))
    assert start == official_local, f"{label}: OpenF1 diverge da programacao oficial"
    assert start.astimezone(BRT).replace(tzinfo=None) == datetime(*brt)


def test_session_crossing_date_change_between_circuit_and_brasilia():
    race = _race(_seed()["sessions"], 1300)
    start = datetime.fromisoformat(race["date_start"])
    assert start.astimezone(ZoneInfo("America/Los_Angeles")).date().isoformat() == "2026-11-21"
    assert start.astimezone(BRT).date().isoformat() == "2026-11-22"


def test_european_stage_and_foreign_dst_do_not_change_brasilia_rule():
    # Espanha (Madri): CEST (UTC+2) em setembro, CET (UTC+1) em novembro.
    # A mesma hora local resulta em horas diferentes em Brasilia porque o
    # horario de verao europeu muda o instante UTC; Brasilia (sem DST) fica fixo.
    summer = datetime(2026, 9, 13, 15, 0, tzinfo=ZoneInfo("Europe/Madrid"))
    winter = datetime(2026, 11, 1, 15, 0, tzinfo=ZoneInfo("Europe/Madrid"))
    assert summer.astimezone(timezone.utc).hour == 13
    assert winter.astimezone(timezone.utc).hour == 14
    assert summer.astimezone(BRT).hour == 10
    assert winter.astimezone(BRT).hour == 11
    assert summer.astimezone(BRT).utcoffset().total_seconds() == -3 * 3600
    assert winter.astimezone(BRT).utcoffset().total_seconds() == -3 * 3600
    # dado real: etapa europeia da OpenF1 (Madrid) esta em UTC com offset explicito
    madrid = _race(_seed()["sessions"], 1294)
    start = datetime.fromisoformat(madrid["date_start"])
    assert start.utcoffset().total_seconds() == 0
    assert start.astimezone(ZoneInfo("Europe/Madrid")).hour in (14, 15)


def test_qatar_has_no_f1_sprint():
    names = [s["session_name"] for s in _seed()["sessions"] if s["meeting_key"] == 1301]
    assert names == ["Practice 1", "Practice 2", "Practice 3", "Qualifying", "Race"]


# ------------------------------------- consistencia entre as rotas da API

def _freeze(now):
    return patch("app.api.races.datetime", **{"now.return_value": now, "fromisoformat.side_effect": datetime.fromisoformat})


def _next_race(client, now):
    cache_mod._memory.clear()
    with _freeze(now):
        return client.get("/api/v1/next-race").get_json()


def _live_meeting(client, key, year=2026):
    body = client.get(f"/api/v1/live/sessions?year={year}").get_json()
    return body, next(m for m in body["data"] if m["meeting_key"] == key)


def test_next_race_and_live_sessions_share_the_same_instants(client, fake):
    nxt = _next_race(client, datetime(2026, 11, 15, 12, 0, tzinfo=timezone.utc))
    assert nxt["name"] == "Las Vegas Grand Prix"
    assert nxt["round"] == 21
    assert nxt["race_start"] == "2026-11-22T04:00:00+00:00"
    assert nxt["source"] == "openf1"
    body, meeting = _live_meeting(client, 1300)
    live_pairs = [(s["key"], s["date_start"], s["date_end"]) for s in meeting["sessions"]]
    next_pairs = [(s["key"], s["date_start"], s["date_end"]) for s in nxt["sessions"]]
    assert next_pairs == live_pairs
    assert len({k for k, _, _ in next_pairs}) == len(next_pairs) == 5  # sem duplicidade
    assert nxt["schedule"]["status"] == "fresh" and nxt["schedule"]["time_zone_display"] == "America/Sao_Paulo"
    assert body["schedule"]["stale"] is False
    for pair in next_pairs:  # ISO 8601 UTC explicito
        assert pair[1].endswith("+00:00")


def test_qatar_next_race_matches_live_and_has_no_sprint(client, fake):
    nxt = _next_race(client, datetime(2026, 11, 25, 12, 0, tzinfo=timezone.utc))
    assert nxt["name"] == "Qatar Grand Prix" and nxt["round"] == 22
    assert nxt["race_start"] == "2026-11-29T16:00:00+00:00"
    assert [s["name"] for s in nxt["sessions"]] == ["Practice 1", "Practice 2", "Practice 3", "Qualifying", "Race"]
    _, meeting = _live_meeting(client, 1301)
    assert [s["date_start"] for s in meeting["sessions"]] == [s["date_start"] for s in nxt["sessions"]]


@pytest.mark.parametrize(
    "now,name,round_",
    [
        (datetime(2026, 11, 5, 12, tzinfo=timezone.utc), "GP do Brasil (São Paulo - Interlagos)", 20),
        (datetime(2026, 12, 2, 12, tzinfo=timezone.utc), "Abu Dhabi Grand Prix", 23),
    ],
)
def test_rounds_and_names_match_canonical_calendar(client, fake, now, name, round_):
    nxt = _next_race(client, now)
    assert nxt["name"] == name and nxt["round"] == round_


def test_session_keys_are_deterministic_openf1_ids(client, fake):
    nxt = _next_race(client, datetime(2026, 11, 15, 12, tzinfo=timezone.utc))
    assert [s["key"] for s in nxt["sessions"]] == [11413, 11414, 11415, 11416, 11420]
    again = _next_race(client, datetime(2026, 11, 15, 12, tzinfo=timezone.utc))
    assert [s["key"] for s in again["sessions"]] == [s["key"] for s in nxt["sessions"]]
    races_py = Path(schedule.__file__).parent / "api" / "races.py"
    assert "hash(" not in races_py.read_text(encoding="utf-8")
    assert "custom_2026" not in races_py.read_text(encoding="utf-8")


def test_historical_dates_remain_exact(client, fake):
    _, meeting = _live_meeting(client, 1294)  # Espanha (ja realizada)
    for s in meeting["sessions"]:
        assert datetime.fromisoformat(s["date_start"]).utcoffset().total_seconds() == 0
    raw = next(s for s in _seed()["sessions"] if s["session_key"] == meeting["sessions"][-1]["key"])
    assert meeting["sessions"][-1]["date_start"] == raw["date_start"]


# ------------------------------------------------ automatizacao e falhas

def test_refresh_is_idempotent_and_does_not_duplicate(fake):
    first = schedule.refresh_schedule(2026, force=True)
    second = schedule.refresh_schedule(2026, force=True)
    keys = [s["session_key"] for s in second["sessions"]]
    assert len(keys) == len(set(keys)) == len(first["sessions"])
    assert second["status"] == "fresh" and second["changes"] == []


def test_ttl_cache_avoids_repeated_requests(fake):
    schedule.refresh_schedule(2026)
    n = len(fake.calls)
    for _ in range(5):
        schedule.get_sessions(2026)
        schedule.get_meetings(2026)
    assert len(fake.calls) == n  # nenhuma consulta externa em leituras repetidas


def _prime(fake):
    schedule.refresh_schedule(2026, force=True)
    fake.calls.clear()


@pytest.mark.parametrize(
    "failure",
    ["unavailable", "timeout", "empty", "naive", "malformed"],
)
def test_failures_preserve_last_valid_schedule(fake, failure):
    _prime(fake)
    before = schedule.get_sessions(2026)
    if failure == "unavailable":
        fake.error = openf1.OpenF1Error("503", status_code=503, reason="http_error")
    elif failure == "timeout":
        fake.error = openf1.OpenF1Error("timeout", status_code=504, reason="timeout")
    elif failure == "empty":
        fake.raw_override = {"meetings": [], "sessions": []}
    elif failure == "naive":
        naive = [{**s, "date_start": "2026-11-22T04:00:00", "date_end": "2026-11-22T06:00:00"} for s in _seed()["sessions"]]
        fake.raw_override = {"sessions": naive}
    elif failure == "malformed":
        fake.raw_override = {"meetings": {"oops": 1}, "sessions": "nope"}
    snap = schedule.refresh_schedule(2026, force=True)
    assert snap["status"] == "stale" and snap["last_error"]
    assert schedule.get_sessions(2026) == before  # horario valido jamais perdido
    assert schedule.get_info(2026)["stale"] is True


def test_failure_does_not_hammer_source(fake, monkeypatch):
    _prime(fake)
    fake.error = openf1.OpenF1Error("down", status_code=503)
    monkeypatch.setattr(schedule, "_now", lambda: 10_000_000_000.0)
    schedule.refresh_schedule(2026)
    n = len(fake.calls)
    schedule.refresh_schedule(2026)
    schedule.get_sessions(2026)
    assert len(fake.calls) == n  # janela de retry respeitada


def test_partial_invalid_records_are_dropped_not_invented(fake):
    bad = {**_seed()["sessions"][0], "session_key": 999001, "date_start": "2026-11-22T04:00:00"}
    fake.sessions = _seed()["sessions"] + [bad]
    snap = schedule.refresh_schedule(2026, force=True)
    assert snap["status"] == "fresh"
    assert all(s["session_key"] != 999001 for s in snap["sessions"])
    assert any("999001" in issue for issue in snap["issues"])


def test_divergent_sources_are_logged_and_precedence_is_openf1(fake):
    _prime(fake)
    moved = []
    for s in _seed()["sessions"]:
        if s["session_key"] == 11420:  # corrida de Las Vegas reagendada na fonte
            s = {**s, "date_start": "2026-11-22T05:00:00+00:00", "date_end": "2026-11-22T07:00:00+00:00"}
        moved.append(s)
    fake.sessions = moved
    snap = schedule.refresh_schedule(2026, force=True)
    assert [c["session_key"] for c in snap["changes"]] == [11420]
    assert snap["changes"][0]["from"][0] == "2026-11-22T04:00:00+00:00"
    race = next(s for s in snap["sessions"] if s["session_key"] == 11420)
    assert race["date_start"] == "2026-11-22T05:00:00+00:00"  # OpenF1 prevalece, com registro
    keys = [s["session_key"] for s in snap["sessions"]]
    assert len(keys) == len(set(keys))


def test_history_is_preserved_when_a_later_response_omits_sessions(fake):
    _prime(fake)
    fake.sessions = [s for s in _seed()["sessions"] if s["meeting_key"] >= 1300]
    snap = schedule.refresh_schedule(2026, force=True)
    assert snap["status"] == "fresh"
    assert any(s["meeting_key"] == 1294 for s in snap["sessions"])  # historico mantido


def test_last_valid_survives_process_restart_via_disk(fake):
    _prime(fake)
    schedule.reset_for_tests()  # simula novo processo (memoria vazia)
    fake.error = openf1.OpenF1Error("down", status_code=503)
    snap = schedule.refresh_schedule(2026, force=True)
    assert snap["status"] == "stale"
    assert _race(snap["sessions"], 1300)["date_start"] == "2026-11-22T04:00:00+00:00"


def test_seed_is_used_only_when_nothing_else_exists(fake, monkeypatch, tmp_path):
    monkeypatch.setenv("F1_SCHEDULE_CACHE_DIR", str(tmp_path / "vazio"))
    monkeypatch.setenv("F1_SCHEDULE_ALLOW_SEED_IN_TESTS", "1")
    fake.error = openf1.OpenF1Error("down", status_code=503)
    snap = schedule.refresh_schedule(2026, force=True)
    assert snap["status"] == "seed" and schedule.get_info(2026)["stale"] is True
    assert _race(snap["sessions"], 1300)["date_start"] == "2026-11-22T04:00:00+00:00"


def test_no_data_and_no_fallback_surfaces_error_not_invented_schedule(fake, monkeypatch, tmp_path):
    monkeypatch.setenv("F1_SCHEDULE_CACHE_DIR", str(tmp_path / "vazio2"))
    fake.error = openf1.OpenF1Error("down", status_code=503)
    with pytest.raises(openf1.OpenF1Error):
        schedule.refresh_schedule(2026, force=True)


def test_api_marks_stale_data_and_keeps_serving(client, fake):
    schedule.refresh_schedule(2026, force=True)
    fake.error = openf1.OpenF1Error("down", status_code=503)
    schedule.refresh_schedule(2026, force=True)
    nxt = _next_race(client, datetime(2026, 11, 15, 12, tzinfo=timezone.utc))
    assert nxt["race_start"] == "2026-11-22T04:00:00+00:00"
    assert nxt["schedule"]["stale"] is True
    assert all(s["is_time_confirmed"] is False for s in nxt["sessions"])
    assert nxt["sessions"][0]["time_status"] == "stale"


def test_cron_schedule_is_untouched():
    root = Path(schedule.__file__).resolve().parents[3]
    cfg = json.loads((root / "vercel.json").read_text(encoding="utf-8")) if (root / "vercel.json").exists() else None
    if cfg is None:
        pytest.skip("vercel.json fora do escopo do checkout")
    paths = [c["path"] for c in cfg.get("crons", [])]
    assert paths == [p for p in paths if "sync-results" in p] and len(paths) == 1
