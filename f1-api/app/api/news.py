from datetime import date

from flask import Blueprint, jsonify, request

from .. import f1site, series as series_module
from ..extensions import db
from ..models import Driver, Race, RaceResult
from ..summarize import summarize
from ..translate import translate_many
from .helpers import ApiError, parse_int
from .races import _next_race_payload

bp = Blueprint("news", __name__)


def _brazilian_driver_terms():
    """Termos de busca: nomes de pilotos brasileiros com resultado na
    temporada corrente (ex.: 'bortoleto')."""
    season = date.today().year
    drivers = (
        db.session.query(Driver)
        .join(RaceResult, RaceResult.driver_id == Driver.id)
        .join(Race, RaceResult.race_id == Race.id)
        .filter(
            Race.season == season,
            Driver.nationality.in_(["Brasileiro", "Brazilian", "BRA", "BR"]),
        )
        .distinct()
        .all()
    )
    terms = set()
    for driver in drivers:
        if driver.last_name:
            terms.add(driver.last_name.lower())
        if driver.first_name and driver.last_name:
            terms.add(
                f"{driver.first_name} {driver.last_name}".lower()
            )
    return terms


def _translate_items(items):
    texts = []
    for item in items:
        texts.append(item.get("title") or "")
        texts.append(item.get("meta_description") or "")
    translated = translate_many(texts)
    result = []
    for index, item in enumerate(items):
        copy = dict(item)
        copy["title_en"] = item.get("title")
        copy["title"] = (
            translated[index * 2] or item.get("title")
        )
        copy["meta_description_en"] = item.get("meta_description")
        copy["meta_description"] = (
            translated[index * 2 + 1] or item.get("meta_description")
        )
        result.append(copy)
    return result


def _race_terms():
    """Palavras-chave da proxima corrida para priorizar noticias do GP."""
    try:
        data = _next_race_payload()
    except Exception:  # noqa: BLE001
        return set()
    if not data:
        return set()
    terms = set()
    for value in (
        data.get("country"),
        data.get("circuit"),
        data.get("location"),
        (data.get("name") or "").replace(" Grand Prix", ""),
    ):
        if value and len(value) > 2:
            terms.add(value.lower())
    return terms


def _matches(article, terms):
    text = " ".join(
        filter(
            None,
            [
                article.get("title"),
                article.get("meta_description"),
                article.get("slug"),
            ],
        )
    ).lower()
    return any(term in text for term in terms)


def _matches_brazilian(article, terms):
    """Estricto: o piloto/nacionalidade precisa aparecer no titulo ou slug."""
    text = " ".join(
        filter(
            None,
            [article.get("title"), article.get("slug")],
        )
    ).lower()
    if "brazilian" in text or "brasil" in text:
        return True
    return any(term in text for term in terms)


@bp.get("/news")
def latest_news():
    """
    Ulitimas noticias do site oficial (formula1.com)
    ---
    tags:
      - News
    parameters:
      - in: query
        name: limit
        schema:
          type: integer
          default: 3
          maximum: 9
      - in: query
        name: upcoming
        schema:
          type: boolean
          default: false
        description: Prioriza noticias relacionadas a proxima corrida
      - in: query
        name: lang
        schema:
          type: string
          example: pt-BR
        description: "Idioma de saida (ex.: pt-BR traduz titulo e resumo)"
      - in: query
        name: br_drivers
        schema:
          type: boolean
          default: false
        description: Somente noticias que citam pilotos BR da temporada atual
      - in: query
        name: series
        schema:
          type: string
          enum: [f1, f2, f3]
          default: f1
        description: Categoria dos pilotos BR (com br_drivers=1)
    responses:
      200:
        description: Lista de noticias
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    type: object
                    properties:
                      id:
                        type: string
                      title:
                        type: string
                      url:
                        type: string
                        example: https://www.formula1.com/en/latest/article/exemplo.5R0ZYizMM9sHZ2raSfLnRX
                      image:
                        type: string
                        nullable: true
                      article_type:
                        type: string
                        example: News
                      updated_at:
                        type: string
                      matched:
                        type: boolean
      503:
        description: Site oficial indisponivel
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    limit = parse_int(request.args.get("limit"), "limit") or 3
    limit = max(1, min(limit, 9))
    upcoming = request.args.get("upcoming", "").lower() in {"1", "true"}
    br_drivers = request.args.get("br_drivers", "").lower() in {"1", "true"}
    try:
        articles = f1site.fetch_news(limit=40)
    except f1site.F1SiteError as exc:
        raise ApiError(f"Site oficial indisponivel: {exc}", 503)

    if br_drivers:
        series = (request.args.get("series") or "f1").lower()
        if series not in {"f1", "f2", "f3"}:
            raise ApiError("Parametro 'series' invalido", 400)
        if series == "f1":
            br_terms = _brazilian_driver_terms()
            pool = articles
        else:
            br_terms = series_module.brazilian_terms(
                f"formula-{series[-1]}"
            )
            try:
                pool = f1site.fetch_series_news(
                    f"f{series[-1]}", limit=48
                )
            except f1site.F1SiteError as exc:
                raise ApiError(f"Site oficial indisponivel: {exc}", 503)
        matched = (
            [a for a in pool if _matches_brazilian(a, br_terms)]
            if br_terms
            else []
        )
        if not matched and br_terms and series == "f1":
            articles = f1site.fetch_news(limit=240, deep=True)
            matched = [
                a for a in articles if _matches_brazilian(a, br_terms)
            ]
        items = matched[:limit]
        for article in items:
            article["matched"] = True
        lang = (request.args.get("lang") or "").lower()
        if lang.startswith("pt"):
            items = _translate_items(items)
        return jsonify({"data": items, "series": series})

    terms = _race_terms() if upcoming else set()
    if terms:
        articles.sort(key=lambda article: 0 if _matches(article, terms) else 1)

    items = articles[:limit]
    for article in items:
        article["matched"] = bool(terms) and _matches(article, terms)
    lang = (request.args.get("lang") or "").lower()
    if lang.startswith("pt"):
        items = _translate_items(items)
    return jsonify({"data": items})


@bp.get("/news/article")
def article_summary():
    """
    Resumo da materia completa do site oficial
    ---
    tags:
      - News
    parameters:
      - in: query
        name: url
        required: true
        schema:
          type: string
        description: URL do artigo na formula1.com (obtida de /news)
      - in: query
        name: sentences
        schema:
          type: integer
          default: 10
          minimum: 3
          maximum: 15
      - in: query
        name: lang
        schema:
          type: string
          example: pt-BR
        description: "Idioma do resumo (pt-BR traduz as frases)"
    responses:
      200:
        description: Resumo extrativo da materia
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                url:
                  type: string
                sentences:
                  type: integer
                summary:
                  type: array
                  items:
                    type: string
                summary_en:
                  type: array
                  items:
                    type: string
      400:
        description: URL ausente ou invalida
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      503:
        description: Site oficial indisponivel ou artigo sem texto
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    url = request.args.get("url") or ""
    if not url.startswith(f1site.ARTICLE_URL_PREFIX):
        raise ApiError(
            "Parametro 'url' deve apontar para um artigo de formula1.com",
            400,
        )
    count = parse_int(request.args.get("sentences"), "sentences") or 10
    count = max(3, min(count, 15))

    try:
        article = f1site.fetch_article(url)
    except f1site.F1SiteError as exc:
        raise ApiError(str(exc), 503)
    if not article["paragraphs"]:
        raise ApiError("Nao foi possivel extrair o texto da materia", 503)

    summary_en = summarize(article["paragraphs"], max_sentences=count)
    lang = (request.args.get("lang") or "").lower()
    summary = (
        translate_many(summary_en) if lang.startswith("pt") else summary_en
    )
    return jsonify(
        {
            "title": article["title"],
            "url": url,
            "sentences": len(summary_en),
            "summary": summary,
            "summary_en": summary_en,
        }
    )
