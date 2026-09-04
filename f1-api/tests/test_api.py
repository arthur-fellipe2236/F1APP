import json
from datetime import date, datetime, timedelta, timezone

from app.seed import GENERATED_SEASONS, POINTS, RACES


def _expected_race_total():
    total = len(RACES)
    for season in GENERATED_SEASONS:
        for _round, _name, race_date, _circuit, _order in RACES:
            if date.fromisoformat(f"{season}-{race_date[5:]}") <= date.today():
                total += 1
    return total


def _create(client, path, payload):
    return client.post(path, json=payload)


class TestHealth:
    def test_health(self, client):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.get_json() == {"status": "ok", "service": "f1-api"}


class TestOpenAPI:
    def test_spec_is_openapi3_with_paths(self, client):
        resp = client.get("/apispec_1.json")
        assert resp.status_code == 200
        spec = resp.get_json()
        assert spec["openapi"].startswith("3.")
        assert "/api/v1/drivers" in spec["paths"]
        assert "/api/v1/drivers/{driver_id}" in spec["paths"]
        assert "/api/v1/standings/teams" in spec["paths"]
        assert "Driver" in spec["components"]["schemas"]
        assert "definitions" not in spec

    def test_swagger_ui(self, client):
        resp = client.get("/apidocs/")
        assert resp.status_code == 200


class TestDrivers:
    def test_list_paginated(self, client):
        resp = client.get("/api/v1/drivers?page=1&per_page=5")
        assert resp.status_code == 200
        body = resp.get_json()
        assert len(body["data"]) == 5
        assert body["meta"]["total"] == 20
        assert body["meta"]["pages"] == 4

    def test_filter_by_team(self, client):
        resp = client.get("/api/v1/drivers?team_id=1&per_page=50")
        body = resp.get_json()
        assert all(d["team_id"] == 1 for d in body["data"])

    def test_filter_by_season(self, client):
        codes_2024 = set()
        for _round, _name, _date, _circuit, order in RACES:
            codes_2024.update(order)

        body = client.get(
            "/api/v1/drivers?season=2024&per_page=50"
        ).get_json()
        assert body["meta"]["total"] == len(codes_2024)
        assert "VER" in {d["code"] for d in body["data"]}

        all_grid = client.get(
            "/api/v1/drivers?season=2025&per_page=50"
        ).get_json()
        assert all_grid["meta"]["total"] == 20

        empty = client.get(
            "/api/v1/drivers?season=2021&per_page=50"
        ).get_json()
        assert empty["meta"]["total"] == 0

    def test_filter_by_team_includes_past_drivers(self, client):
        data = client.get(
            "/api/v1/drivers?team_id=1&per_page=50"
        ).get_json()["data"]
        codes = {d["code"] for d in data}
        assert {"VER", "PER"} <= codes

        ver = next(d for d in data if d["code"] == "VER")
        assert client.put(
            f"/api/v1/drivers/{ver['id']}", json={"team_id": 2}
        ).status_code == 200

        after = client.get(
            "/api/v1/drivers?team_id=1&per_page=50"
        ).get_json()["data"]
        assert "VER" in {d["code"] for d in after}

    def test_same_number_across_eras(self, app):
        from app.extensions import db as _db
        from app.models import Driver

        with app.app_context():
            _db.session.add_all([
                Driver(first_name="Sebastian", last_name="Vettel",
                       code="VET", permanent_number=5),
                Driver(first_name="Gabriel", last_name="Bortoleto",
                       code="BOR", permanent_number=5),
            ])
            _db.session.commit()
            assert _db.session.query(Driver).filter_by(
                permanent_number=5
            ).count() >= 2

    def test_crud_flow(self, client):
        created = _create(
            client,
            "/api/v1/drivers",
            {"first_name": "Gabriel", "last_name": "Bortoleto", "code": "BOR",
             "permanent_number": 5, "nationality": "Brasileiro"},
        )
        assert created.status_code == 201
        driver_id = created.get_json()["id"]

        detail = client.get(f"/api/v1/drivers/{driver_id}")
        assert detail.status_code == 200
        assert detail.get_json()["name"] == "Gabriel Bortoleto"

        updated = client.put(
            f"/api/v1/drivers/{driver_id}",
            json={"nationality": "brasileiro"},
        )
        assert updated.status_code == 200
        assert updated.get_json()["nationality"] == "brasileiro"

        deleted = client.delete(f"/api/v1/drivers/{driver_id}")
        assert deleted.status_code == 204
        assert client.get(f"/api/v1/drivers/{driver_id}").status_code == 404

    def test_create_requires_fields(self, client):
        resp = _create(client, "/api/v1/drivers", {"first_name": "Sem"})
        assert resp.status_code == 400
        assert "missing_fields" in resp.get_json()["details"]

    def test_create_rejects_unknown_fields(self, client):
        resp = _create(
            client, "/api/v1/drivers",
            {"first_name": "A", "last_name": "B", "apelido": "X"},
        )
        assert resp.status_code == 400
        assert "apelido" in resp.get_json()["details"]["unknown_fields"]

    def test_duplicate_code_409(self, client):
        resp = _create(
            client, "/api/v1/drivers",
            {"first_name": "Novo", "last_name": "Piloto", "code": "VER"},
        )
        assert resp.status_code == 409

    def test_not_found(self, client):
        assert client.get("/api/v1/drivers/999999").status_code == 404


class TestTeams:
    def test_engine_manufacturer_by_season(self, client):
        by_season = {}
        for season in (2022, 2026):
            data = client.get(
                f"/api/v1/teams?season={season}&per_page=50"
            ).get_json()["data"]
            by_season[season] = {
                t["name"]: t["engine_manufacturer"] for t in data
            }
        assert by_season[2022]["Red Bull Racing"] == "Honda RBPT"
        assert by_season[2022]["Aston Martin"] == "Mercedes"
        assert by_season[2022]["Alpine"] == "Renault"
        assert by_season[2026]["Red Bull Racing"] == "Red Bull Ford"
        assert by_season[2026]["Aston Martin"] == "Honda"
        assert by_season[2026]["Alpine"] == "Mercedes"

    def test_crud_flow(self, client):
        created = _create(
            client, "/api/v1/teams",
            {"name": "Postman Test Team", "base_country": "Testlandia"},
        )
        assert created.status_code == 201
        team_id = created.get_json()["id"]

        dup = _create(client, "/api/v1/teams", {"name": "Postman Test Team"})
        assert dup.status_code == 409

        updated = client.put(
            f"/api/v1/teams/{team_id}", json={"founded_year": 2026}
        )
        assert updated.get_json()["founded_year"] == 2026

        assert client.delete(f"/api/v1/teams/{team_id}").status_code == 204
        assert client.get(f"/api/v1/teams/{team_id}").status_code == 404


class TestCircuits:
    def test_crud_flow(self, client):
        created = _create(
            client, "/api/v1/circuits",
            {"name": "Circuit de Teste", "city": "Cidade", "country": "Pais",
             "length_km": 4.2, "laps": 60},
        )
        assert created.status_code == 201
        cid = created.get_json()["id"]

        updated = client.put(f"/api/v1/circuits/{cid}", json={"laps": 61})
        assert updated.get_json()["laps"] == 61

        assert client.delete(f"/api/v1/circuits/{cid}").status_code == 204

    def test_list_by_season_ordered_by_round(self, client):
        body = client.get(
            "/api/v1/circuits?season=2024&per_page=50"
        ).get_json()
        assert body["meta"]["total"] == 10
        assert body["data"][0]["name"] == "Bahrain International Circuit"
        rounds = [c["round"] for c in body["data"]]
        assert all(r is not None for r in rounds)
        assert rounds == sorted(rounds)
        winner = body["data"][0]["winner"]
        assert winner["name"] == "Max Verstappen"
        assert winner["code"] == "VER"
        assert all(c["winner"] for c in body["data"])

        empty = client.get("/api/v1/circuits?season=2021").get_json()
        assert empty["meta"]["total"] == 0

        all_time = client.get("/api/v1/circuits?per_page=50").get_json()
        assert all("round" not in c for c in all_time["data"])
        assert all_time["data"][0]["winner"] is not None


class TestRaces:
    def test_list(self, client):
        resp = client.get("/api/v1/races?per_page=50")
        assert resp.status_code == 200
        assert resp.get_json()["meta"]["total"] == _expected_race_total()

    def test_season_filter(self, client):
        assert client.get("/api/v1/races?season=2024").get_json()["meta"]["total"] == 10
        assert client.get("/api/v1/races?season=2022").get_json()["meta"]["total"] == 10
        assert client.get("/api/v1/races?season=2023").get_json()["meta"]["total"] == 10
        assert client.get("/api/v1/races?season=2025").get_json()["meta"]["total"] == 10

    def test_empty_season(self, client):
        assert client.get("/api/v1/races?season=2021").get_json()["meta"]["total"] == 0

    def test_current_season_has_only_past_races(self, client):
        total = client.get("/api/v1/races?season=2026").get_json()["meta"]["total"]
        assert 1 <= total <= len(RACES)

    def test_invalid_season(self, client):
        assert client.get("/api/v1/races?season=abc").status_code == 400

    def test_results(self, client):
        race_id = client.get("/api/v1/races?season=2024").get_json()["data"][0]["id"]
        resp = client.get(f"/api/v1/races/{race_id}/results")
        body = resp.get_json()
        assert resp.status_code == 200
        assert len(body["data"]) == 10
        assert body["data"][0]["position"] == 1
        assert body["data"][0]["points"] == 25
        assert body["data"][0]["driver_code"] == "VER"
        assert body["data"][0]["driver_nationality"] == "Neerlandes"

    def test_results_not_found(self, client):
        assert client.get("/api/v1/races/999999/results").status_code == 404


F1SITE_SAMPLE_HTML = """
<div>
  <a href="/en/racing/2026/italy"><span>ROUND 13</span>
     <span>Italy</span><span>04 - 06 SEP</span></a>
  <a href="/en/racing/2026/qatar"><span>ROUND 22</span>
     <span>Qatar</span><span>27 - 29 NOV</span></a>
  <a href="/en/racing/2026/pre-season-testing-2026">
     <span>Pre-Season Testing</span><span>11 - 13 FEB</span></a>
</div>
"""


class TestNextRace:
    def test_parse_schedule(self):
        from app import f1site

        entries = f1site.parse_schedule(F1SITE_SAMPLE_HTML)
        assert [e["slug"] for e in entries] == ["italy", "qatar"]
        assert entries[0]["round"] == 13
        assert entries[0]["weekend_start"] == date(2026, 9, 4)
        assert entries[0]["weekend_end"] == date(2026, 9, 6)

    def test_combines_site_and_openf1(self, client, monkeypatch):
        from app import f1site, openf1
        from app import cache as cache_mod

        cache_mod._memory.clear()
        future = date.today() + timedelta(days=20)
        entry = {
            "slug": "testland", "country": "Testland", "round": 99,
            "weekend_start": future, "weekend_end": future,
        }
        iso = f"{future.isoformat()}T13:00:00+00:00"

        monkeypatch.setattr(f1site, "upcoming_rounds", lambda ref=None: [entry])

        def fake_get(path, **params):
            if path == "sessions":
                return [{
                    "session_key": 5001,
                    "meeting_key": 999, "date_start": iso,
                    "date_end": f"{future.isoformat()}T14:30:00+00:00",
                    "session_name": "Race", "session_type": "Race",
                    "country_name": "Testland", "location": "Testville",
                    "circuit_short_name": "Testring",
                }]
            if path == "meetings":
                return [{
                    "meeting_key": 999,
                    "meeting_name": "Testland Grand Prix",
                }]
            return None

        monkeypatch.setattr(openf1, "get", fake_get)
        body = client.get("/api/v1/next-race").get_json()
        assert body["name"] == "Testland Grand Prix"
        assert body["round"] == 99
        assert body["circuit"] == "Testring"
        assert body["race_start"] == iso
        assert body["source"] == "formula1.com+openf1"
        assert body["sessions"][0]["state"] == "scheduled"

    def test_weekend_only_when_openf1_down(self, client, monkeypatch):
        from app import f1site, openf1
        from app import cache as cache_mod

        cache_mod._memory.clear()
        future = date.today() + timedelta(days=20)
        entry = {
            "slug": "testland", "country": "Testland", "round": 99,
            "weekend_start": future, "weekend_end": future,
        }
        monkeypatch.setattr(f1site, "upcoming_rounds", lambda ref=None: [entry])

        def boom(path, **params):
            raise openf1.OpenF1Error("fora do ar")

        monkeypatch.setattr(openf1, "get", boom)
        body = client.get("/api/v1/next-race").get_json()
        assert body["source"] == "formula1.com"
        assert body["race_start"] is None
        assert body["round"] == 99


NEWS_SAMPLE = json.dumps(
    {
        "items": [
            {
                "id": "5R0ZYizMM9sHZ2raSfLnRX",
                "updatedAt": "2026-09-03T15:42:47.669Z",
                "realUpdatedAt": "2026-09-03T15:42:50.106Z",
                "locale": "en",
                "title": "Leclerc targets Monza weekend",
                "slug": "leclerc-monza",
                "articleType": "News",
                "metaDescription": "preview at the Autodromo",
                "thumbnail": {
                    "image": {
                        "url": "https://media.formula1.com/image/upload/t.jpg"
                    }
                },
            },
            {
                "id": "1111111111111111111111",
                "updatedAt": "2026-09-02T10:00:00.000Z",
                "realUpdatedAt": "2026-09-02T10:00:01.000Z",
                "locale": "en",
                "title": "Unrelated story",
                "slug": "unrelated",
                "articleType": "Feature",
                "metaDescription": "about something else entirely",
                "thumbnail": {
                    "image": {
                        "url": "https://media.formula1.com/image/upload/u.jpg"
                    }
                },
            },
        ]
    },
    separators=(",", ":"),
).replace('"', '\\"')


class TestNews:
    def test_parse_news(self):
        from app import f1site

        items = f1site.parse_news(NEWS_SAMPLE)
        assert [i["slug"] for i in items] == ["leclerc-monza", "unrelated"]
        assert items[0]["url"].endswith(
            "leclerc-monza.5R0ZYizMM9sHZ2raSfLnRX"
        )
        assert items[0]["image"].endswith("t.jpg")
        assert items[0]["article_type"] == "News"

    def _fake_fetch(self, monkeypatch):
        from app import f1site

        def fake(limit=20):
            return [dict(a) for a in f1site.parse_news(NEWS_SAMPLE)]

        monkeypatch.setattr(f1site, "fetch_news", fake)

    def test_upcoming_prioritizes_race_news(self, client, monkeypatch):
        from app.api import news as news_api

        self._fake_fetch(monkeypatch)
        monkeypatch.setattr(news_api, "_race_terms", lambda: {"monza"})
        body = client.get(
            "/api/v1/news?upcoming=1&limit=2"
        ).get_json()
        assert body["data"][0]["title"].startswith("Leclerc")
        assert body["data"][0]["matched"] is True
        assert body["data"][1]["matched"] is False

    def test_plain_order_without_upcoming(self, client, monkeypatch):
        self._fake_fetch(monkeypatch)
        body = client.get("/api/v1/news?limit=1").get_json()
        assert body["data"][0]["matched"] is False

    def test_br_drivers_only(self, client, monkeypatch):
        from app import f1site
        from app.api import news as news_api

        articles = [
            {
                "id": "a1", "title": "Bortoleto eager for Audi upgrade",
                "slug": "bortoleto-audi-upgrade",
                "url": "https://www.formula1.com/en/latest/article/x.a1",
                "article_type": "News", "updated_at": "2026-09-03T10:00:00Z",
                "meta_description": "The Brazilian targets points.",
                "image": None,
            },
            {
                "id": "a2", "title": "Leclerc targets Monza",
                "slug": "leclerc-monza",
                "url": "https://www.formula1.com/en/latest/article/y.a2",
                "article_type": "News", "updated_at": "2026-09-03T09:00:00Z",
                "meta_description": "Charles at the Autodromo.",
                "image": None,
            },
        ]
        monkeypatch.setattr(
            f1site, "fetch_news",
            lambda limit=40: [dict(a) for a in articles],
        )
        monkeypatch.setattr(
            news_api, "_brazilian_driver_terms", lambda: {"bortoleto"}
        )
        body = client.get("/api/v1/news?br_drivers=1&limit=3").get_json()
        assert [a["title"] for a in body["data"]] == [
            "Bortoleto eager for Audi upgrade"
        ]
        assert body["data"][0]["matched"] is True

    def test_br_drivers_empty_when_none_active(self, client, monkeypatch):
        from app import f1site
        from app.api import news as news_api

        monkeypatch.setattr(
            f1site, "fetch_news",
            lambda limit=40: [{"id": "a2", "title": "Leclerc",
                               "slug": "leclerc", "meta_description": None}],
        )
        monkeypatch.setattr(news_api, "_brazilian_driver_terms", lambda: set())
        body = client.get("/api/v1/news?br_drivers=1").get_json()
        assert body["data"] == []

    def test_br_f2_series(self, client, monkeypatch):
        from app import f1site, series as series_module

        articles = [
            {
                "id": "f2a", "title": "Rafael Câmara scores first F2 podium",
                "slug": "rafael-camara-scores-first-f2-podium",
                "url": "https://www.formula1.com/en/latest/article/x.f2a",
                "article_type": "News",
                "updated_at": "2026-09-02T10:00:00Z",
                "meta_description": "The Brazilian shone in the feature race.",
                "image": None,
            },
            {
                "id": "f2b", "title": "Unrelated F1 story",
                "slug": "unrelated-f1",
                "url": "https://www.formula1.com/en/latest/article/y.f2b",
                "article_type": "News",
                "updated_at": "2026-09-02T09:00:00Z",
                "meta_description": "Nothing here.",
                "image": None,
            },
        ]

        def fake_fetch(limit=20, deep=False):
            return [dict(a) for a in articles]

        def fake_series(tag, limit=48, pages=3):
            return [dict(a) for a in articles] if tag == "f2" else []

        monkeypatch.setattr(f1site, "fetch_news", fake_fetch)
        monkeypatch.setattr(f1site, "fetch_series_news", fake_series)
        monkeypatch.setattr(
            series_module,
            "brazilian_terms",
            lambda s: {"camara", "rafael câmara"}
            if s == "formula-2" else set(),
        )
        body = client.get(
            "/api/v1/news?br_drivers=1&series=f2"
        ).get_json()
        assert body["series"] == "f2"
        assert [a["slug"] for a in body["data"]] == [
            "rafael-camara-scores-first-f2-podium"
        ]

    def test_br_invalid_series_400(self, client):
        assert client.get(
            "/api/v1/news?br_drivers=1&series=f9"
        ).status_code == 400

    def test_lang_pt_translates_titles(self, client, monkeypatch):
        from app.api import news as news_api

        self._fake_fetch(monkeypatch)
        monkeypatch.setattr(news_api, "_race_terms", lambda: set())
        monkeypatch.setattr(
            news_api,
            "translate_many",
            lambda texts: [f"PT: {text}" for text in texts],
        )
        body = client.get(
            "/api/v1/news?limit=1&lang=pt-BR"
        ).get_json()
        item = body["data"][0]
        assert item["title"] == "PT: Leclerc targets Monza weekend"
        assert item["title_en"] == "Leclerc targets Monza weekend"
        assert item["meta_description"].startswith("PT:")

    def test_translation_keeps_original_when_service_returns_empty(
        self, client, monkeypatch
    ):
        from app.api import news as news_api

        self._fake_fetch(monkeypatch)
        monkeypatch.setattr(news_api, "_race_terms", lambda: set())
        monkeypatch.setattr(news_api, "translate_many", lambda texts: texts)
        body = client.get("/api/v1/news?limit=1&lang=pt-BR").get_json()
        assert body["data"][0]["title"] == "Leclerc targets Monza weekend"


class TestSummarize:
    def test_extracts_in_order(self):
        from app.summarize import summarize

        paragraphs = [
            " ".join(
                f"Sentence number {i} about Ferrari engine upgrades "
                f"deployed by Leclerc at Monza this weekend race."
            )
            for i in range(14)
        ]
        result = summarize(paragraphs, max_sentences=10)
        assert 1 <= len(result) <= 10
        indexes = []
        all_sentences = [s for p in paragraphs for s in p.split(". ")]
        for sentence in result:
            indexes.append(all_sentences.index(sentence))
        assert indexes == sorted(indexes)

    def test_short_article_returned_asis(self):
        from app.summarize import summarize

        paragraphs = [
            "Only one long enough sentence here describing the full "
            "situation at Ferrari heading into Monza."
        ]
        assert summarize(paragraphs) == paragraphs


class TestNewsArticle:
    ARTICLES = [
        "Ferrari confirmed a new engine specification for Monza after "
        "months of testing back in Maranello with the team.",
        "Leclerc said the upgrade gives the car a little more power on "
        "the straights which should help qualifying performance.",
        "Hamilton agreed that the team needs perfect execution across "
        "the whole weekend to fight for victory on Sunday afternoon.",
    ]

    def _patch(self, monkeypatch):
        from app import f1site

        monkeypatch.setattr(
            f1site,
            "fetch_article",
            lambda url: {
                "title": "Leclerc targets Monza",
                "paragraphs": list(self.ARTICLES),
            },
        )

    def test_rejects_foreign_url(self, client):
        resp = client.get("/api/v1/news/article?url=https://evil.example/x")
        assert resp.status_code == 400

    def test_summary_en_and_pt(self, client, monkeypatch):
        from app.api import news as news_api

        self._patch(monkeypatch)
        url = (
            "https://www.formula1.com/en/latest/article/x.5R0ZYizMM9sHZ2raSfLnRX"
        )
        plain = client.get(f"/api/v1/news/article?url={url}").get_json()
        assert plain["title"] == "Leclerc targets Monza"
        assert plain["summary"] == plain["summary_en"]
        assert len(plain["summary"]) <= 10

        monkeypatch.setattr(
            news_api,
            "translate_many",
            lambda texts: [f"PT: {t}" for t in texts],
        )
        translated = client.get(
            f"/api/v1/news/article?url={url}&lang=pt-BR"
        ).get_json()
        assert translated["summary"][0].startswith("PT:")
        assert translated["summary_en"][0].startswith(
            ("Ferrari", "Leclerc", "Hamilton")
        )


class TestLive:
    def _patch(self, monkeypatch, now):
        from app import openf1
        from app.api import live as live_mod

        from app import cache as cache_mod

        cache_mod._memory.clear()
        cache_mod._cache_state = getattr(cache_mod, "_cache_state", None)

        session = {
            "session_key": 4242,
            "session_name": "Race",
            "session_type": "Race",
            "year": now.year,
            "circuit_short_name": "Sakhir",
            "country_name": "Bahrain",
            "location": "Sakhir",
            "meeting_key": 900,
            "date_start": (now - timedelta(hours=3)).isoformat(),
            "date_end": (now - timedelta(hours=1)).isoformat(),
        }

        def fake_get(path, **params):
            if path == "sessions":
                wanted = params.get("session_key")
                if wanted is not None:
                    return [session] if wanted == 4242 else []
                return [session]
            if path == "meetings":
                return [
                    {
                        "meeting_key": 900,
                        "meeting_name": "Bahrain Grand Prix",
                    }
                ]
            if path == "intervals":
                return [
                    {
                        "driver_number": 16, "gap_to_leader": 0,
                        "interval": None, "lap_number": 57,
                        "date": session["date_end"],
                    },
                    {
                        "driver_number": 1, "gap_to_leader": 1.234,
                        "interval": 1.234, "lap_number": 57,
                        "date": session["date_end"],
                    },
                ]
            if path == "position":
                return [
                    {"driver_number": 16, "position": 1},
                    {"driver_number": 1, "position": 2},
                ]
            if path == "stints":
                return [
                    {"driver_number": 16, "stint_number": 2,
                     "compound": "SOFT", "lap_end": 40},
                    {"driver_number": 1, "stint_number": 1,
                     "compound": "MEDIUM", "lap_end": 57},
                ]
            if path == "drivers":
                return [
                    {
                        "driver_number": 16, "full_name": "Charles Leclerc",
                        "name_acronym": "LEC", "team_name": "Ferrari",
                        "team_colour": "E8002D",
                    },
                    {
                        "driver_number": 1, "full_name": "Max Verstappen",
                        "name_acronym": "VER",
                        "team_name": "Red Bull Racing",
                        "team_colour": "3671C6",
                    },
                ]
            if path == "session_result":
                return [
                    {"driver_number": 16, "position": 1,
                     "number_of_laps": 57},
                    {"driver_number": 1, "position": 2,
                     "number_of_laps": 57},
                ]
            if path == "race_control":
                return [
                    {"category": "Flag", "flag": "GREEN",
                     "date": "2026-01-01T00:00:00+00:00"},
                    {"category": "Flag", "flag": "CHEQUERED",
                     "date": session["date_end"]},
                    {"category": "SessionStatus",
                     "message": "Chequered flag",
                     "date": session["date_end"]},
                ]
            if path == "weather":
                return [
                    {
                        "air_temperature": 28.1, "track_temperature": 41.0,
                        "wind_speed": 3.2, "relative_humidity": 45,
                        "rainfall": 0, "date": session["date_end"],
                    }
                ]
            return None

        monkeypatch.setattr(openf1, "get", fake_get)
        return fake_get

    def test_tower_auto_detects_last_session(self, client, monkeypatch):
        from app.api import live

        now = datetime(2026, 9, 3, 12, 0, 0, tzinfo=timezone.utc)
        monkeypatch.setattr(live, "_now_utc", lambda: now)
        self._patch(monkeypatch, now)

        body = client.get("/api/v1/live/tower").get_json()
        assert body["session"]["name"] == "Race"
        assert body["session"]["meeting_name"] == "Bahrain Grand Prix"
        assert body["session"]["live"] is False
        assert body["session"]["state"] == "finished"
        assert body["flag"] == "CHEQUERED"
        assert body["current_lap"] == 57
        assert body["weather"]["air_temperature"] == 28.1

        lec, ver = body["drivers"][0], body["drivers"][1]
        assert lec["code"] == "LEC"
        assert lec["position"] == 1
        assert lec["compound"] == "SOFT"
        assert lec["stops"] == 1
        assert ver["code"] == "VER"
        assert ver["gap_to_leader"] == 1.234
        assert ver["stops"] == 0

    def test_live_sessions_listing(self, client, monkeypatch):
        from app import openf1
        from app.api import live

        from app import cache as cache_mod

        cache_mod._memory.clear()
        now = datetime(2026, 9, 3, 12, 0, 0, tzinfo=timezone.utc)
        monkeypatch.setattr(live, "_now_utc", lambda: now)

        def fake_get(path, **params):
            if path == "meetings":
                return [
                    {
                        "meeting_key": 1,
                        "meeting_name": "Dutch Grand Prix",
                        "circuit_short_name": "Zandvoort",
                        "country_name": "Netherlands",
                        "location": "Zandvoort",
                        "date_start": "2026-08-21T09:00:00+00:00",
                        "date_end": "2026-08-23T16:00:00+00:00",
                        "is_cancelled": False,
                    },
                    {
                        "meeting_key": 2,
                        "meeting_name": "Italian Grand Prix",
                        "circuit_short_name": "Monza",
                        "country_name": "Italy",
                        "location": "Monza",
                        "date_start": "2026-09-04T09:00:00+00:00",
                        "date_end": "2026-09-06T16:00:00+00:00",
                        "is_cancelled": False,
                    },
                    {
                        "meeting_key": 3,
                        "meeting_name": "Pre-Season Testing",
                        "circuit_short_name": "Bahrain",
                        "date_start": "2026-02-01T09:00:00+00:00",
                        "date_end": "2026-02-03T16:00:00+00:00",
                        "is_cancelled": False,
                    },
                ]
            if path == "sessions":
                return [
                    {
                        "meeting_key": 1, "session_key": 101,
                        "session_name": "Race", "session_type": "Race",
                        "date_start": "2026-08-23T13:00:00+00:00",
                        "date_end": "2026-08-23T14:30:00+00:00",
                    },
                    {
                        "meeting_key": 2, "session_key": 201,
                        "session_name": "Race", "session_type": "Race",
                        "date_start": "2026-09-06T13:00:00+00:00",
                        "date_end": "2026-09-06T14:30:00+00:00",
                    },
                ]
            return None

        monkeypatch.setattr(openf1, "get", fake_get)
        body = client.get("/api/v1/live/sessions?year=2026").get_json()
        assert body["year"] == 2026
        assert [m["meeting_name"] for m in body["data"]] == [
            "Dutch Grand Prix",
            "Italian Grand Prix",
        ]
        assert body["data"][0]["round"] == 1
        assert body["data"][1]["round"] == 2
        assert body["data"][0]["sessions"][0]["state"] == "finished"
        assert body["data"][1]["sessions"][0]["state"] == "scheduled"

    def test_tower_specific_session(self, client, monkeypatch):
        from app.api import live

        now = datetime(2026, 9, 3, 12, 0, 0, tzinfo=timezone.utc)
        monkeypatch.setattr(live, "_now_utc", lambda: now)
        self._patch(monkeypatch, now)

        body = client.get("/api/v1/live/tower?session_key=4242").get_json()
        assert body["session"]["key"] == 4242
        assert len(body["drivers"]) == 2

    def test_tower_unknown_session(self, client, monkeypatch):
        now = datetime(2026, 9, 3, 12, 0, 0, tzinfo=timezone.utc)
        self._patch(monkeypatch, now)
        assert client.get("/api/v1/live/tower?session_key=111").status_code == 404

    def test_seasons_endpoint(self, client):
        resp = client.get("/api/v1/seasons")
        assert resp.status_code == 200
        seasons = resp.get_json()["data"]
        assert set(seasons) >= {2022, 2023, 2024, 2025, 2026}
        assert seasons == sorted(seasons, reverse=True)


class TestStandings:
    def test_driver_standings_ordered(self, client):
        resp = client.get("/api/v1/standings/drivers?season=2024")
        assert resp.status_code == 200
        data = resp.get_json()["data"]
        points = [d["points"] for d in data]
        assert points == sorted(points, reverse=True)
        assert data[0]["position"] == 1
        assert data[0]["nationality"] == "Neerlandes"
        assert len(data) == 20

    def test_team_standings(self, client):
        resp = client.get("/api/v1/standings/teams?season=2024")
        data = resp.get_json()["data"]
        points = [t["points"] for t in data]
        assert points == sorted(points, reverse=True)
        assert len(data) == 10

    def test_invalid_season(self, client):
        assert client.get("/api/v1/standings/drivers?season=x").status_code == 400

    def test_generated_season_points(self, client):
        data = client.get(
            "/api/v1/standings/drivers?season=2025"
        ).get_json()["data"]
        assert sum(d["points"] for d in data) == 10 * sum(POINTS)

    def test_team_standings_include_team_id(self, client):
        data = client.get(
            "/api/v1/standings/teams?season=2024"
        ).get_json()["data"]
        assert all(row["team_id"] is not None for row in data)


MEETINGS_2023 = [
    {
        "meeting_key": 9001, "meeting_name": "Pre-Season Testing",
        "date_start": "2023-02-01T00:00:00+00:00",
        "date_end": "2023-02-03T00:00:00+00:00",
        "is_cancelled": False, "circuit_short_name": "Sakhir",
        "location": "Sakhir", "country_name": "Bahrain",
    },
    {
        "meeting_key": 9002, "meeting_name": "Bahrain Grand Prix",
        "date_start": "2023-03-02T00:00:00+00:00",
        "date_end": "2023-03-05T00:00:00+00:00",
        "is_cancelled": False, "circuit_short_name": "Sakhir",
        "location": "Sakhir", "country_name": "Bahrain",
    },
    {
        "meeting_key": 9003, "meeting_name": "Saudi Arabian Grand Prix",
        "date_start": "2023-03-17T00:00:00+00:00",
        "date_end": "2023-03-19T00:00:00+00:00",
        "is_cancelled": False, "circuit_short_name": "Jeddah",
        "location": "Jeddah", "country_name": "Saudi Arabia",
    },
]

SESSIONS_2023 = {
    9002: [
        {"session_key": 7999, "session_name": "Sprint",
         "date_end": "2023-03-04T14:00:00+00:00"},
        {"session_key": 8001, "session_name": "Race",
         "date_end": "2023-03-05T14:00:00+00:00"},
    ],
    9003: [{"session_key": 8002, "session_name": "Race",
            "date_end": "2023-03-19T14:00:00+00:00"}],
}

DRIVERS_2023 = {
    7999: [
        {"driver_number": 1, "name_acronym": "VER", "first_name": "Max",
         "last_name": "Verstappen", "team_name": "Red Bull Racing",
         "country_code": "NED"},
        {"driver_number": 11, "name_acronym": "PER", "first_name": "Sergio",
         "last_name": "Perez", "team_name": "Red Bull Racing",
         "country_code": "MEX"},
    ],
    8001: [
        {"driver_number": 1, "name_acronym": "VER", "first_name": "Max",
         "last_name": "Verstappen", "team_name": "Red Bull Racing",
         "country_code": "NED"},
        {"driver_number": 11, "name_acronym": "PER", "first_name": "Sergio",
         "last_name": "Perez", "team_name": "Red Bull Racing",
         "country_code": "MEX"},
        {"driver_number": 16, "name_acronym": "LEC", "first_name": "Charles",
         "last_name": "Leclerc", "team_name": "Ferrari",
         "country_code": "MON"},
    ],
    8002: [
        {"driver_number": 88, "name_acronym": "NEW", "first_name": "Novo",
         "last_name": "Piloto", "team_name": "Equipe Teste",
         "country_code": "BRA"},
    ],
}

RESULTS_2023 = {
    7999: [
        {"position": 1, "driver_number": 11, "number_of_laps": 19,
         "points": 8.0, "dnf": False, "dns": False, "dsq": False},
        {"position": 2, "driver_number": 1, "number_of_laps": 19,
         "points": 7.0, "dnf": False, "dns": False, "dsq": False},
    ],
    8001: [
        {"position": 1, "driver_number": 1, "number_of_laps": 57,
         "points": 26.0, "dnf": False, "dns": False, "dsq": False},
        {"position": 2, "driver_number": 11, "number_of_laps": 57,
         "points": 18.0, "dnf": False, "dns": False, "dsq": False},
        {"position": None, "driver_number": 16, "number_of_laps": 40,
         "points": 0, "dnf": True, "dns": False, "dsq": False},
    ],
    8002: [
        {"position": 1, "driver_number": 88, "number_of_laps": 50,
         "points": 25.0, "dnf": False, "dns": False, "dsq": False},
    ],
}

POSITIONS_2023 = {
    7999: [
        {"driver_number": 11, "position": 1},
        {"driver_number": 1, "position": 2},
    ],
    8001: [
        {"driver_number": 11, "position": 1},
        {"driver_number": 1, "position": 2},
        {"driver_number": 16, "position": 3},
        {"driver_number": 1, "position": 1},
    ],
    8002: [
        {"driver_number": 88, "position": 4},
    ],
}

LAPS_2023 = {
    8001: [
        {"driver_number": 1, "lap_duration": 91.0, "is_pit_out_lap": False},
        {"driver_number": 11, "lap_duration": 92.0, "is_pit_out_lap": False},
        {"driver_number": 16, "lap_duration": 90.0, "is_pit_out_lap": False},
        {"driver_number": 16, "lap_duration": 80.0, "is_pit_out_lap": True},
    ],
    8002: [],
}


def _fake_openf1_get(path, **params):
    if path == "meetings":
        return MEETINGS_2023
    if path == "sessions":
        return SESSIONS_2023.get(params.get("meeting_key"), [])
    if path == "session_result":
        return RESULTS_2023.get(params.get("session_key"), [])
    if path == "starting_grid":
        return None
    if path == "position":
        return POSITIONS_2023.get(params.get("session_key"), [])
    if path == "drivers":
        return DRIVERS_2023.get(params.get("session_key"), [])
    if path == "laps":
        return LAPS_2023.get(params.get("session_key"), [])
    return None


JOLPICA_DRIVER_LLEC = {
    "driverId": "leclerc", "code": "LEC", "givenName": "Charles",
    "familyName": "Leclerc", "nationality": "Monegasque",
}
JOLPICA_DRIVER_VER = {
    "driverId": "verstappen", "code": "VER", "givenName": "Max",
    "familyName": "Verstappen", "nationality": "Dutch",
}

JOLPICA_R1 = {
    "round": "1",
    "raceName": "Bahrain Grand Prix",
    "date": "2022-03-20",
    "Circuit": {
        "circuitName": "Bahrain International Circuit",
        "Location": {"locality": "Sakhir", "country": "Bahrain"},
    },
    "Results": [
        {"number": "16", "grid": "1", "position": "1", "points": "26",
         "Driver": JOLPICA_DRIVER_LLEC,
         "Constructor": {"name": "Ferrari"},
         "laps": "57", "status": "Finished",
         "FastestLap": {"rank": "1"}},
        {"number": "1", "grid": "19", "position": "2", "points": "18",
         "Driver": JOLPICA_DRIVER_VER,
         "Constructor": {"name": "Red Bull"},
         "laps": "57", "status": "+1 Lap"},
    ],
}

JOLPICA_R2 = {
    "round": "2",
    "raceName": "Saudi Arabian Grand Prix",
    "date": "2022-03-27",
    "Circuit": {
        "circuitName": "Jeddah Corniche Circuit",
        "Location": {"locality": "Jeddah", "country": "Saudi Arabia"},
    },
    "Results": [
        {"number": "1", "grid": "4", "position": "1", "points": "25",
         "Driver": JOLPICA_DRIVER_VER,
         "Constructor": {"name": "Red Bull"},
         "laps": "50", "status": "Finished"},
        {"number": "16", "grid": "1", "position": "14", "points": "0",
         "Driver": JOLPICA_DRIVER_LLEC,
         "Constructor": {"name": "Ferrari"},
         "laps": "12", "status": "Accident"},
    ],
}

JOLPICA_SPRINT_R2 = {
    "round": "2",
    "raceName": "Saudi Arabian Grand Prix",
    "date": "2022-03-26",
    "SprintResults": [
        {"number": "16", "position": "1", "points": "8", "laps": "20",
         "Driver": JOLPICA_DRIVER_LLEC,
         "Constructor": {"name": "Ferrari"}, "status": "Finished"},
        {"number": "1", "position": "2", "points": "7", "laps": "20",
         "Driver": JOLPICA_DRIVER_VER,
         "Constructor": {"name": "Red Bull"}, "status": "Finished"},
    ],
}

JOLPICA_PATHS = {
    "2022": [
        {"round": "1", "raceName": "Bahrain Grand Prix",
         "date": "2022-03-20"},
        {"round": "2", "raceName": "Saudi Arabian Grand Prix",
         "date": "2022-03-27"},
    ],
    "2022/1/results": [JOLPICA_R1],
    "2022/1/sprint": None,
    "2022/2/results": [JOLPICA_R2],
    "2022/2/sprint": [JOLPICA_SPRINT_R2],
}


def _fake_ergast_get(path):
    return JOLPICA_PATHS.get(path)


class TestSyncErgast:
    def test_sync_2022_from_jolpica(self, app, client, monkeypatch):
        from app import ergast as ergast_module
        from app import sync as sync_module

        monkeypatch.setattr(ergast_module, "get", _fake_ergast_get)
        with app.app_context():
            sync_module.sync_season(2022, force=True)

        races = client.get(
            "/api/v1/races?season=2022&per_page=50"
        ).get_json()["data"]
        assert [r["name"] for r in races] == [
            "Bahrain Grand Prix",
            "Saudi Arabian Grand Prix",
        ]
        assert races[0]["circuit_name"] == "Bahrain International Circuit"

        results = client.get(
            f"/api/v1/races/{races[0]['id']}/results"
        ).get_json()["data"]
        lec, ver = results[0], results[1]
        assert lec["driver_code"] == "LEC"
        assert lec["points"] == 26.0
        assert lec["fastest_lap"] is True
        assert lec["team_name"] == "Ferrari"
        assert ver["grid"] == 19
        assert ver["status"] == "finished"

        results2 = client.get(
            f"/api/v1/races/{races[1]['id']}/results"
        ).get_json()["data"]
        by_code = {r["driver_code"]: r for r in results2}
        assert by_code["LEC"]["status"] == "dnf"
        assert by_code["VER"]["sprint_points"] == 7.0
        assert by_code["LEC"]["sprint_points"] == 8.0

        standings = client.get(
            "/api/v1/standings/drivers?season=2022"
        ).get_json()["data"]
        assert standings[0]["driver_code"] == "VER"
        assert standings[0]["points"] == 50.0
        assert standings[0]["team_name"] == "Red Bull Racing"

        teams = client.get(
            "/api/v1/standings/teams?season=2022"
        ).get_json()["data"]
        assert teams[0]["team_name"] == "Red Bull Racing"
        assert teams[0]["points"] == 50.0
        assert teams[1]["team_name"] == "Ferrari"
        assert teams[1]["points"] == 34.0


class TestSync:
    def test_invalid_season(self, client):
        assert client.post("/api/v1/sync?season=abc").status_code == 400

    def test_already_running_409(self, client, monkeypatch):
        from app import sync as sync_module

        monkeypatch.setitem(sync_module.SYNC_STATE, "running", True)
        assert client.post("/api/v1/sync?season=2023").status_code == 409

    def test_sync_status(self, client):
        resp = client.get("/api/v1/sync/status")
        assert resp.status_code == 200
        body = resp.get_json()
        assert "running" in body

    def test_sync_season_imports_openf1_data(self, app, client, monkeypatch):
        from app import openf1
        from app import sync as sync_module

        monkeypatch.setattr(openf1, "get", _fake_openf1_get)
        with app.app_context():
            sync_module.sync_season(2023, force=True)

        races = client.get(
            "/api/v1/races?season=2023&per_page=50"
        ).get_json()["data"]
        assert [r["name"] for r in races] == [
            "Bahrain Grand Prix",
            "Saudi Arabian Grand Prix",
        ]

        results = client.get(
            f"/api/v1/races/{races[0]['id']}/results?per_page=50"
        ).get_json()["data"]
        by_code = {r["driver_code"]: r for r in results}
        assert by_code["VER"]["position"] == 1
        assert by_code["VER"]["points"] == 26.0
        assert by_code["VER"]["sprint_points"] == 7.0
        assert by_code["PER"]["sprint_points"] == 8.0
        assert by_code["VER"]["grid"] == 2
        assert by_code["VER"]["fastest_lap"] is False
        assert by_code["PER"]["grid"] == 1
        assert by_code["LEC"]["status"] == "dnf"
        assert by_code["LEC"]["fastest_lap"] is True

        driver = client.get("/api/v1/drivers?per_page=50").get_json()["data"]
        assert any(d["first_name"] == "Novo" for d in driver)
        lec = next(d for d in driver if d["code"] == "LEC")
        assert lec["nationality"] == "Monegasco"

        season_drivers = client.get(
            "/api/v1/drivers?season=2023&per_page=50"
        ).get_json()["data"]
        assert {d["code"] for d in season_drivers} == {
            "LEC",
            "VER",
            "PER",
            "NEW",
        }
        novo = next(d for d in season_drivers if d["code"] == "NEW")
        assert novo["team_name"] == "Equipe Teste"

        season_teams = client.get(
            "/api/v1/teams?season=2023&per_page=50"
        ).get_json()["data"]
        assert {t["name"] for t in season_teams} == {
            "Red Bull Racing",
            "Ferrari",
            "Equipe Teste",
        }

        standings = client.get(
            "/api/v1/standings/drivers?season=2023"
        ).get_json()["data"]
        assert standings[0]["driver_code"] == "VER"
        assert standings[0]["points"] == 33.0
        assert standings[0]["team_name"] == "Red Bull Racing"


class TestPostSync:
    def test_normalize_teams_merges_aliases(self, app, client):
        from app import sync as sync_module
        from app.extensions import db
        from app.models import Team

        with app.app_context():
            db.session.add(Team(name="Haas F1 Team"))
            db.session.commit()
            sync_module.normalize_teams()

        names = {
            t["name"]
            for t in client.get(
                "/api/v1/teams?per_page=50"
            ).get_json()["data"]
        }
        assert "Haas" in names
        assert "Haas F1 Team" not in names

    def test_normalize_circuits_merges_duplicates(self, app):
        from app import sync as sync_module
        from app.extensions import db
        from app.models import Circuit, Race

        with app.app_context():
            dup = Circuit(
                name="Baku City Circuit", city="Baku", country="Azerbaijan",
                length_km=6.003,
            )
            can = Circuit(name="Baku", city="Baku", country="Azerbaijan")
            db.session.add_all([dup, can])
            db.session.flush()
            db.session.add_all([
                Race(season=2019, round=90, name="GP A22",
                     circuit_id=dup.id),
                Race(season=2019, round=91, name="GP A23",
                     circuit_id=can.id),
                Race(season=2019, round=92, name="GP A24",
                     circuit_id=can.id),
            ])
            db.session.commit()

            sync_module.normalize_circuits()

            assert Circuit.query.filter_by(
                name="Baku City Circuit"
            ).first() is None
            merged = Circuit.query.filter_by(name="Baku").first()
            assert merged.length_km == 6.003
            assert Race.query.filter_by(
                season=2019, round=90
            ).first().circuit_id == merged.id

    def test_backfill_circuit_lengths(self, app):
        from app import sync as sync_module
        from app.extensions import db
        from app.models import Circuit

        with app.app_context():
            db.session.add_all([
                Circuit(name="Novo Sakhir", city="Sakhir", country="Bahrain"),
                Circuit(name="Gilles Villeneuve", city="Montréal",
                        country="Canada"),
                Circuit(name="Miami Autodrome", city="Miami", country="USA"),
                Circuit(name="Marte", city="Marte", country="Venus"),
            ])
            db.session.commit()
            sync_module.backfill_circuit_lengths()

            assert Circuit.query.filter_by(
                name="Novo Sakhir"
            ).first().length_km == 5.412
            assert Circuit.query.filter_by(
                name="Gilles Villeneuve"
            ).first().length_km == 4.361
            assert Circuit.query.filter_by(
                name="Miami Autodrome"
            ).first().length_km == 5.412
            assert Circuit.query.filter_by(name="Marte").first().length_km is None

    def test_apply_team_metadata(self, app):
        from app import sync as sync_module
        from app.extensions import db
        from app.models import Team

        with app.app_context():
            db.session.add(Team(name="Cadillac"))
            db.session.commit()
            sync_module.apply_team_metadata()

            cadillac = Team.query.filter_by(name="Cadillac").first()
            assert cadillac.base_country == "Estados Unidos"
            assert cadillac.engine_manufacturer == "Ferrari"
            assert cadillac.founded_year == 2026

            ferrari = Team.query.filter_by(name="Ferrari").first()
            assert ferrari.base_country == "Italia"  # seed nao e sobrescrito


class TestMedia:
    def _png(self, w=900, h=600):
        import io

        from PIL import Image

        buf = io.BytesIO()
        Image.new("RGB", (w, h), (10, 20, 30)).save(buf, "PNG")
        return buf.getvalue()

    def test_rejects_foreign_host(self, client):
        resp = client.get(
            "/api/v1/media/proxy?url=https://evil.example/a.png"
        )
        assert resp.status_code == 400

    def test_optimizes_to_webp_and_serves(self, client, monkeypatch):
        import io

        from app.api import media as media_mod

        media_mod._image_cache.clear()
        png = self._png()

        class FakeResponse:
            status_code = 200
            content = png

        monkeypatch.setattr(media_mod.requests, "get", lambda *a, **k: FakeResponse())
        monkeypatch.setattr(media_mod.blob, "enabled", lambda: False)
        resp = client.get(
            "/api/v1/media/proxy?url=https://flagcdn.com/w640/it.png&w=100"
        )
        assert resp.status_code == 200
        assert resp.headers["Content-Type"] == "image/webp"
        assert resp.data[:4] == b"RIFF"

        from PIL import Image

        shrunk = Image.open(io.BytesIO(resp.data))
        assert shrunk.width == 100
        assert len(resp.data) < len(png)

    def test_redirects_to_original_on_source_failure(self, client, monkeypatch):
        from app.api import media as media_mod

        media_mod._image_cache.clear()

        def boom(*a, **k):
            raise media_mod.requests.RequestException("fora")

        monkeypatch.setattr(media_mod.requests, "get", boom)
        resp = client.get(
            "/api/v1/media/proxy?url=https://media.formula1.com/x.png&w=64",
            follow_redirects=False,
        )
        assert resp.status_code == 302
        assert "media.formula1.com" in resp.headers["Location"]
