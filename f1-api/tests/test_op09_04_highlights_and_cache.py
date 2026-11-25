from datetime import date
from app import cache as app_cache
from app.api.races import parse_f1_youtube_highlights_xml
from app.extensions import db
from app.models import Driver, Race, RaceResult, Team
from app.results_refresh import _invalidate_progress_caches


SAMPLE_ATOM_FEED = """<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <yt:videoId>z1S6WWWIP3w</yt:videoId>
    <title>All THIRTY FIVE Lead Changes In Las Vegas!</title>
    <published>2026-11-23T19:00:30+00:00</published>
  </entry>
  <entry>
    <yt:videoId>Sprnt123456</yt:videoId>
    <title>Sprint Highlights | 2026 Qatar Grand Prix</title>
    <published>2026-11-28T19:00:00+00:00</published>
  </entry>
  <entry>
    <yt:videoId>Qualy123456</yt:videoId>
    <title>Qualifying Highlights | 2026 Las Vegas Grand Prix</title>
    <published>2026-11-21T07:00:00+00:00</published>
  </entry>
  <entry>
    <yt:videoId>Vyk_6bNm7lo</yt:videoId>
    <title>Race Highlights | 2026 Las Vegas Grand Prix</title>
    <published>2026-11-22T07:03:23+00:00</published>
  </entry>
  <entry>
    <yt:videoId>lkb5kqDJYXk</yt:videoId>
    <title>Race Highlights | 2026 Sao Paulo Grand Prix</title>
    <published>2026-11-08T21:00:00+00:00</published>
  </entry>
</feed>
"""


def test_parse_f1_youtube_highlights_xml_filters_strictly_main_race():
    parsed = parse_f1_youtube_highlights_xml(SAMPLE_ATOM_FEED, season=2026)
    assert "las vegas" in parsed
    assert parsed["las vegas"]["youtube_id"] == "Vyk_6bNm7lo"
    assert parsed["las vegas"]["duration"] == "8:13"
    assert "sao paulo" in parsed
    assert parsed["sao paulo"]["youtube_id"] == "lkb5kqDJYXk"
    # Sprint, Qualifying e vídeos avulsos nunca entram
    assert "qatar" not in parsed
    assert all(v["youtube_id"] not in {"z1S6WWWIP3w", "Sprnt123456", "Qualy123456"} for v in parsed.values())


def test_races_endpoint_enriches_has_results_and_highlight_video(client, app):
    with app.app_context():
        driver = Driver.query.first()
        team = Team.query.first()
        r21 = Race(
            id=942,
            season=2026,
            series="f1",
            round=21,
            name="Las Vegas Grand Prix",
            date=date(2026, 11, 20),
        )
        r22 = Race(
            id=943,
            season=2026,
            series="f1",
            round=22,
            name="Qatar Grand Prix",
            date=date(2026, 11, 29),
        )
        db.session.add_all([r21, r22])
        db.session.flush()
        db.session.add(
            RaceResult(
                race_id=942,
                driver_id=driver.id,
                team_id=team.id if team else None,
                position=1,
                points=25.0,
                sprint_points=0.0,
                status="Finished",
            )
        )
        db.session.commit()

    resp = client.get("/api/v1/races?season=2026&series=f1&per_page=50")
    assert resp.status_code == 200
    body = resp.get_json()
    by_round = {item["round"]: item for item in body["data"]}

    assert by_round[21]["has_results"] is True
    assert by_round[21]["is_completed"] is True
    assert by_round[21]["youtube_id"] == "Vyk_6bNm7lo"
    assert by_round[21]["highlight_video"]["youtube_id"] == "Vyk_6bNm7lo"
    assert by_round[21]["highlight_video"]["duration"] == "8:13"

    assert by_round[22]["has_results"] is False
    assert by_round[22]["is_completed"] is False
    assert "highlight_video" not in by_round[22]


def test_cache_clear_invalidates_memory_cache():
    app_cache.set("highlights:f1:2026", {"las vegas": {"youtube_id": "Vyk_6bNm7lo"}}, 60)
    app_cache.set("standings:f1:2026", {"completed_races": 20}, 60)
    assert app_cache.get("highlights:f1:2026") is not None
    assert app_cache.get("standings:f1:2026") is not None

    _invalidate_progress_caches()

    assert app_cache.get("highlights:f1:2026") is None
    assert app_cache.get("standings:f1:2026") is None
