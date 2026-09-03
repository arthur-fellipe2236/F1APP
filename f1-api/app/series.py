"""Termos de busca de pilotos brasileiros na F2/F3 (tabelas da Wikipedia).

Lê a página da temporada corrente ("2026 FIA Formula 2/3 Championship"),
coleta os pilotos da linha que tem {{Flagicon|BRA}} e devolve termos
(sobrenome, nome completo e variantes sem acento) para casar com as
noticias do formula1.com (slugs sao ascii).
"""

import json
import re
import threading
import time
import unicodedata
import urllib.parse
import urllib.request
from datetime import date

API = "https://en.wikipedia.org/w/api.php"
HEADERS = {"User-Agent": "f1-app-dev/1.0 (demo local)"}
TTL = 24 * 3600
BAD_WORDS = (
    "motor", "racing", "academy", "cup", "team", "championship",
    "list of", "premier", "grand prix",
)

_cache = {}
_lock = threading.Lock()


def _wikitext(title):
    query = urllib.parse.urlencode({
        "action": "parse",
        "page": title,
        "prop": "wikitext",
        "format": "json",
        "redirects": "1",
    })
    request = urllib.request.Request(f"{API}?{query}", headers=HEADERS)
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return payload["parse"]["wikitext"]["*"]


def _deaccent(text):
    normalized = unicodedata.normalize("NFD", text)
    return (
        normalized.encode("ascii", "ignore").decode().lower().strip()
    )


def _names_from_wikitext(text):
    names = set()
    for row in re.split(r"\n\s*[-\|]", text):
        if not re.search(r"\{\{\s*flag\s*icon\s*\|\s*BRA\b", row, re.I):
            continue
        for link in re.findall(r"\[\[([^\]#|]+)\]\]?", row):
            name = link.strip()
            lowered = name.lower()
            if any(word in lowered for word in BAD_WORDS):
                continue
            if 1 < len(name.split()) <= 4:
                names.add(name)
    return names


def _terms_from_names(names):
    terms = set()
    for name in names:
        plain = _deaccent(name)
        terms.add(name.lower())
        terms.add(plain)
        parts = plain.split()
        if parts:
            terms.add(parts[-1])
        accented_last = name.lower().split()
        if accented_last:
            terms.add(accented_last[-1])
    return terms


def brazilian_terms(series):
    """series: 'formula-2' ou 'formula-3'."""
    year = date.today().year
    key = (series, year)
    now = time.time()
    with _lock:
        hit = _cache.get(key)
        if hit and now - hit[0] < TTL:
            return hit[1]

    number = {"formula-2": "2", "formula-3": "3"}[series]
    names = set()
    try:
        text = _wikitext(f"{year} FIA Formula {number} Championship")
        names = _names_from_wikitext(text)
    except Exception:  # noqa: BLE001 - fonte externa: degrada para vazio
        names = set()
    terms = _terms_from_names(names)
    with _lock:
        # em falha, nao cacheia por 24h; tenta de novo em 10min
        _cache[key] = (
            now if terms else now - TTL + 600,
            terms,
        )
    return terms
