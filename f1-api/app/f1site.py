"""Leitor do calendario oficial do site formula1.com.

Usado para descobrir a proxima rodada agendada (pais, data do fim de
semana e numero da rodada) direto na fonte oficial. O horario exato da
corrida vem da OpenF1 (mesma base de todo o app).
"""

import re
from datetime import date
from html import unescape

import requests

from . import cache as app_cache

SCHEDULE_URL = "https://www.formula1.com/en/racing/{year}"
NEWS_URL = "https://www.formula1.com/en/latest"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}
TIMEOUT_SECONDS = 25

ROW_RE = re.compile(
    r'<a[^>]*?href="[^"]*/en/racing/(\d{4})/([a-z0-9-]+)"[^>]*>(.*?)</a>',
    re.S,
)
TAG_RE = re.compile(r"<[^>]+>")
DATE_RE = re.compile(
    r"(\d{1,2})\s*(?:-\s*(\d{1,2})\s*)?"
    r"(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)"
)
ROUND_RE = re.compile(r"ROUND\s+(\d+)")
ARTICLE_RE = re.compile(
    r'\\"id\\":\\"([A-Za-z0-9]{18,28})\\",\\"updatedAt\\":\\"([^\\"]+)\\"[^{]*?'
    r'\\"title\\":\\"((?:[^\\\\]|\\\\.)*?)\\",\\"slug\\":\\"([^\\"]+)\\",'
    r'\\"articleType\\":\\"([^\\"]+)\\"',
    re.S,
)
DESC_RE = re.compile(r'\\"metaDescription\\":\\"((?:[^\\\\]|\\\\.)*?)\\"')
IMG_RE = re.compile(r'\\"url\\":\\"(https://media\.formula1\.com[^\\"]+)\\"')
MONTHS = {
    month: index + 1
    for index, month in enumerate(
        "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split()
    )
}

CACHE_SECONDS = 300


class F1SiteError(Exception):
    """Falha ao ler o calendario do site oficial da Formula 1."""


def parse_schedule(html):
    entries = []
    seen = set()
    for match in ROW_RE.finditer(html):
        year, slug, inner = match.groups()
        if slug.startswith("pre-season"):
            continue
        text = " ".join(TAG_RE.sub(" ", inner).split())
        date_match = DATE_RE.search(text)
        if not date_match:
            continue
        month = MONTHS[date_match.group(3)]
        start = date(int(year), month, int(date_match.group(1)))
        end = date(int(year), month, int(date_match.group(2) or date_match.group(1)))
        key = (year, slug, start)
        if key in seen:
            continue
        seen.add(key)
        round_match = ROUND_RE.search(text)
        country = re.sub(
            r"^ROUND\s+\d+\s+", "", text[: date_match.start()].strip()
        )
        entries.append(
            {
                "slug": slug,
                "country": country,
                "round": int(round_match.group(1)) if round_match else None,
                "weekend_start": start,
                "weekend_end": end,
            }
        )
    entries.sort(key=lambda e: e["weekend_start"])
    return entries


def _fetch_html(url):
    try:
        response = requests.get(
            url, headers=HEADERS, timeout=TIMEOUT_SECONDS
        )
    except requests.RequestException as exc:
        raise F1SiteError(f"Falha ao ler formula1.com: {exc}") from exc
    if response.status_code != 200:
        raise F1SiteError(
            f"formula1.com respondeu {response.status_code} na pagina {url}"
        )
    return response.text


def _unescape(value):
    return (
        value.replace("\\u0026", "&")
        .replace("\\n", " ")
        .replace("\\", "")
    )


def parse_news(html):
    """Extrai as noticias do payload RSC da pagina /en/latest."""
    articles = []
    for match in ARTICLE_RE.finditer(html):
        article_id, updated, title, slug, kind = match.groups()
        window = html[match.end() : match.end() + 3000]
        desc = DESC_RE.search(window)
        image = IMG_RE.search(window)
        articles.append(
            {
                "id": article_id,
                "title": _unescape(title),
                "slug": slug,
                "url": (
                    "https://www.formula1.com/en/latest/article/"
                    f"{slug}.{article_id}"
                ),
                "article_type": kind,
                "updated_at": updated,
                "meta_description": (
                    _unescape(desc.group(1)) if desc else None
                ),
                "image": image.group(1) if image else None,
            }
        )
    return articles


def fetch_news(limit=20, deep=False):
    depth = "deep" if deep else "shallow"
    pages = range(1, 9) if deep else range(1, 4)

    def produce():
        articles = []
        seen = set()
        for page in pages:
            url = NEWS_URL if page == 1 else f"{NEWS_URL}?page={page}"
            try:
                html = _fetch_html(url)
            except F1SiteError:
                if articles:
                    break
                raise
            for article in parse_news(html):
                if article["id"] in seen:
                    continue
                seen.add(article["id"])
                articles.append(article)
        return articles

    return [dict(a) for a in app_cache.cache_get_or_set(
        f"site:news:{depth}", CACHE_SECONDS, produce
    )][:limit]


def fetch_series_news(tag, limit=48, pages=3):
    """Feed de uma tag do site oficial (ex.: 'f2', 'f3').

    O href da tag (tags/f2.<id>) e resolvido dinamicamente na pagina de
    noticias para sobreviver a trocas de id.
    """
    def produce():
        home = _fetch_html(NEWS_URL)
        match = re.search(
            r"latest/tags/" + re.escape(tag) + r"\.([A-Za-z0-9_-]{16,40})",
            home,
        )
        if match is None:
            return []
        base = (
            "https://www.formula1.com/en/latest/tags/"
            f"{tag}.{match.group(1)}"
        )
        articles = []
        seen = set()
        for page in range(1, pages + 1):
            url = base if page == 1 else f"{base}?page={page}"
            try:
                html = _fetch_html(url)
            except F1SiteError:
                if articles:
                    break
                raise
            for article in parse_news(html):
                if article["id"] in seen:
                    continue
                seen.add(article["id"])
                articles.append(article)
        return articles

    return [dict(a) for a in app_cache.cache_get_or_set(
        f"site:tag:{tag}", CACHE_SECONDS, produce
    )][:limit]


ARTICLE_PARA_RE = re.compile(r"<p[^>]*>(.*?)</p>", re.S)
OG_TITLE_RE = re.compile(r'<meta property="og:title" content="([^"]+)"')
ARTICLE_JUNK_MARKERS = (
    "(opens in a new tab)",
    "Sign In Subscribe",
    "F1 Schedule Results Standings",
    "cookie",
    "Privacy Policy",
    "Download the official F1",
    "Download the F1 App",
    "official F1 App",
    "best companion",
    "F1 TV Access",
    "Enter your email",
)

ARTICLE_URL_PREFIX = "https://www.formula1.com/en/latest/article/"


def fetch_article(url):
    """Extrai titulo e paragrafos do corpo de uma materia do site oficial."""
    if not url.startswith(ARTICLE_URL_PREFIX):
        raise F1SiteError("URL de artigo invalida (esperada formula1.com)")
    raw = _fetch_html(url)
    title_match = OG_TITLE_RE.search(raw)
    paragraphs = []
    seen = set()
    for fragment in ARTICLE_PARA_RE.findall(raw):
        text = " ".join(TAG_RE.sub(" ", fragment).split())
        text = unescape(text)
        if len(text) < 80 or text in seen:
            continue
        lowered = text.lower()
        if any(marker.lower() in lowered for marker in ARTICLE_JUNK_MARKERS):
            continue
        seen.add(text)
        paragraphs.append(text)
    return {
        "title": (
            title_match.group(1)
            if title_match
            else (paragraphs[0][:120] if paragraphs else None)
        ),
        "paragraphs": paragraphs,
    }


def upcoming_rounds(ref=None):
    """Rodadas do calendario oficial com fim de semana em ou depois de hoje."""
    ref = ref or date.today()
    entries = []
    for year in (ref.year, ref.year + 1):
        try:
            raw = app_cache.cache_get_or_set(
                f"site:schedule:{year}",
                CACHE_SECONDS,
                lambda y=year: [
                    {
                        **e,
                        "weekend_start": e["weekend_start"].isoformat(),
                        "weekend_end": e["weekend_end"].isoformat(),
                    }
                    for e in parse_schedule(
                        _fetch_html(SCHEDULE_URL.format(year=y))
                    )
                ],
            )
        except F1SiteError:
            if entries:
                continue
            raise
        for e in raw:
            entry = dict(e)
            entry["weekend_start"] = date.fromisoformat(entry["weekend_start"])
            entry["weekend_end"] = date.fromisoformat(entry["weekend_end"])
            entries.append(entry)
    return [e for e in entries if e["weekend_end"] >= ref]
