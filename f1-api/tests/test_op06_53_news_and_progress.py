from datetime import date, timedelta
from app import f1site
from app.api import news as news_api
from app.extensions import db
from app.models import Driver, Race, RaceResult, Team


def test_op06_53_news_article_no_500_in_serverless_mode(client, monkeypatch):
    """Cenário 4: Rota /api/v1/news/article responde HTTP 200 sem erro 500 em modo serverless."""
    monkeypatch.setenv("F1_SERVERLESS", "1")
    monkeypatch.setattr(
        f1site,
        "fetch_article",
        lambda url: {
            "title": "Antonelli seals Sao Paulo GP victory",
            "paragraphs": [
                "Kimi Antonelli delivered a commanding drive at Interlagos to claim victory in Round 20 of the 2026 Formula 1 season.",
                "George Russell completed a dominant one-two finish for Mercedes as the team clinched the Constructors Championship.",
            ],
            "meta_description": "Full report from Interlagos as Mercedes dominate Round 20.",
        },
    )
    monkeypatch.setattr(news_api, "translate_many", lambda texts: [f"PT: {t}" for t in texts])

    url = "https://www.formula1.com/en/latest/article/sao-paulo-report.690Y5fbB5T20s2J6c1F4hZ"
    resp = client.get(f"/api/v1/news/article?url={url}&lang=pt-BR")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["title"] == "Antonelli seals Sao Paulo GP victory"
    assert body["summary_source"] == "body"
    assert body["limitation_note"] is None
    assert len(body["summary"]) == 2
    assert body["summary"][0].startswith("PT:")


def test_op06_53_news_article_without_paragraphs_returns_metadata_summary(client, monkeypatch):
    """Cenário 5: Artigo sem parágrafos convencionais (ex.: galeria) retorna resumo baseado em metadados sem lançar exceção."""
    monkeypatch.setenv("F1_SERVERLESS", "1")
    monkeypatch.setattr(
        f1site,
        "fetch_article",
        lambda url: {
            "title": "GALLERY: Best photos from Mercedes' title celebrations",
            "paragraphs": [],
            "meta_description": "Check out the best images from Interlagos as Mercedes celebrate the 2026 Constructors' Championship.",
        },
    )
    monkeypatch.setattr(news_api, "translate_many", lambda texts: [f"PT: {t}" for t in texts])

    url = "https://www.formula1.com/en/latest/article/gallery-mercedes-celebrations.4A3z24nZ11V9y70x11R8p2"
    resp = client.get(f"/api/v1/news/article?url={url}&lang=pt-BR")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["summary_source"] == "metadata"
    assert body["limitation_note"] is not None
    assert "metadados editoriais" in body["limitation_note"]
    assert len(body["summary"]) >= 1
    assert "PT: Check out the best images" in body["summary"][0]


def test_op06_53_news_article_uses_query_fallback_metadata_when_body_empty(client, monkeypatch):
    """Cenário 5b: Artigo sem parágrafos nem og:description utiliza metadados enviados pelo card do frontend."""
    monkeypatch.setenv("F1_SERVERLESS", "1")
    monkeypatch.setattr(
        f1site,
        "fetch_article",
        lambda url: {
            "title": None,
            "paragraphs": [],
            "meta_description": None,
        },
    )

    url = "https://www.formula1.com/en/latest/article/short-gallery.1234567890abcdefghij"
    resp = client.get(
        "/api/v1/news/article",
        query_string={
            "url": url,
            "lang": "pt-BR",
            "title": "Galeria do GP de São Paulo",
            "meta_description": "Confira os melhores registros fotográficos do domingo em Interlagos.",
            "article_type": "Image Gallery",
        },
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["summary_source"] == "metadata"
    assert body["title"] == "Galeria do GP de São Paulo"
    assert "Confira os melhores registros fotográficos do domingo em Interlagos." in body["summary"]
    assert body["limitation_note"] is not None


def test_op06_53_f1site_fetch_article_cleans_gallery_prefix_and_unescapes_title(monkeypatch):
    """Verifica limpeza de prefixo de galeria ('0/9 Next image'), filtro de rodapé social e unescape de og:title."""
    sample_html = """
    <html>
      <head>
        <meta property="og:title" content="Mercedes&#x27; title celebrations in Sao Paulo" />
        <meta property="og:description" content="Behind the scenes with Mercedes at Interlagos after Round 20." />
      </head>
      <body>
        <p>0/9 Next image Take a look through the best pictures from the Sao Paulo paddock after Sunday&#x27;s race at Interlagos.</p>
        <p>F1 Facebook X Instagram YouTube © 2003-2026 Formula One World Championship Limited</p>
      </body>
    </html>
    """
    monkeypatch.setattr(f1site, "_fetch_html", lambda url: sample_html)
    parsed = f1site.fetch_article(
        "https://www.formula1.com/en/latest/article/mercedes-celebrations.4A3z24nZ11V9y70x11R8p2"
    )
    assert parsed["title"] == "Mercedes' title celebrations in Sao Paulo"
    assert parsed["meta_description"] == "Behind the scenes with Mercedes at Interlagos after Round 20."
    assert len(parsed["paragraphs"]) == 1
    assert not parsed["paragraphs"][0].startswith("0/9 Next image")
    assert "Sunday's race at Interlagos" in parsed["paragraphs"][0]


def test_op06_53_completed_races_and_standings_consistency(client, app):
    """Cenários 7, 8 e 9: Corridas disputadas e classificação refletem apenas etapas com resultados válidos."""
    with app.app_context():
        team = Team.query.filter_by(name="Mercedes").first()
        if not team:
            team = Team(name="Mercedes", base_country="UK")
            db.session.add(team)
            db.session.flush()

        driver = Driver.query.filter_by(code="ANT").first()
        if not driver:
            driver = Driver(
                first_name="Andrea Kimi",
                last_name="Antonelli",
                code="ANT",
                nationality="Italiano",
                permanent_number=12,
                team_id=team.id,
            )
            db.session.add(driver)
            db.session.flush()

        past_with_result = Race(
            season=2026,
            series="f1",
            round=20,
            name="São Paulo Grand Prix",
            date=date.today() - timedelta(days=1),
        )
        future_without_result = Race(
            season=2026,
            series="f1",
            round=21,
            name="Las Vegas Grand Prix",
            date=date.today() + timedelta(days=12),
        )
        db.session.add_all([past_with_result, future_without_result])
        db.session.flush()

        db.session.add(
            RaceResult(
                race_id=past_with_result.id,
                driver_id=driver.id,
                team_id=team.id,
                position=1,
                points=25.0,
                sprint_points=0.0,
                grid=1,
                laps=71,
                status="Finished",
                fastest_lap=True,
            )
        )
        db.session.commit()

    races_resp = client.get("/api/v1/races?season=2026&series=f1").get_json()
    assert races_resp["meta"]["completed_races"] >= 1
    assert races_resp["meta"]["championship_total"] >= 2
    assert races_resp["meta"]["completed_races"] < races_resp["meta"]["championship_total"]

    drivers_resp = client.get("/api/v1/standings/drivers?season=2026&series=f1").get_json()
    assert drivers_resp["completed_races"] == races_resp["meta"]["completed_races"]
    assert drivers_resp["total_races"] == races_resp["meta"]["championship_total"]
    ant_row = next((d for d in drivers_resp["data"] if d["driver_code"] == "ANT"), None)
    assert ant_row is not None
    assert ant_row["points"] >= 25.0

    teams_resp = client.get("/api/v1/standings/teams?season=2026&series=f1").get_json()
    assert teams_resp["completed_races"] == races_resp["meta"]["completed_races"]
    assert teams_resp["total_races"] == races_resp["meta"]["championship_total"]
    mer_row = next((t for t in teams_resp["data"] if t["team_name"] == "Mercedes"), None)
    assert mer_row is not None
    assert mer_row["points"] >= 25.0
