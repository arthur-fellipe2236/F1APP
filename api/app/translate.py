"""Traducao automatica de textos, sem chave.

Provedores em cadeia: MyMemory (melhor qualidade) e LibreTranslate publico
(disroot/terraprint) como reserva. Falhas sao toleradas: translate_many
devolve o texto original. A cache (REDIS_URL quando definido, senao
memoria) preserva a cota diaria dos servicos gratuitos.
"""

import hashlib
import re
import threading
from concurrent.futures import ThreadPoolExecutor

import requests

from . import cache

MYMEMORY_URL = "https://api.mymemory.translated.net/get"
LIBRE_ENDPOINTS = (
    "https://translate.disroot.org/translate",
    "https://translate.terraprint.co/translate",
)

MAX_CHARS = 480
CACHE_SECONDS = 60 * 24 * 3600
CACHE_VERSION = "v4"

# O servico pode traduzir mal nomes de escuderias/termos fixos.
FIXUPS = [
    (re.compile(r"\balpin(?:a|o|as|os)\b", re.IGNORECASE), "Alpine"),
]

BAD_MARKERS = (
    "MYMEMORY WARNING",
    "YOU USED ALL AVAILABLE",
)

_lock = threading.Lock()


class TranslateError(Exception):
    """Falha ao traduzir nos provedores."""


def _looks_bad(text):
    upper = text.upper()
    return any(marker in upper for marker in BAD_MARKERS)


def _clean(translated):
    translated = translated.replace('\\"', '"').replace("\\'", "'")
    for pattern, replacement in FIXUPS:
        translated = pattern.sub(replacement, translated)
    return translated


def _translate_mymemory(text, source, target):
    response = requests.get(
        MYMEMORY_URL,
        params={"langpair": f"{source}|{target}", "q": text[:MAX_CHARS]},
        timeout=20,
    )
    payload = response.json()
    if payload.get("responseStatus") != 200:
        raise TranslateError(
            payload.get("responseDetails") or "resposta invalida"
        )
    translated = (payload.get("responseData") or {}).get("translatedText")
    if not translated:
        raise TranslateError("sem texto traduzido na resposta")
    if _looks_bad(translated):
        raise TranslateError("cota diaria do MyMemory esgotada")
    return translated


def _translate_libre(url, text, source, target):
    response = requests.post(
        url,
        json={
            "q": text[:MAX_CHARS],
            "source": source,
            "target": "pt",
            "format": "text",
        },
        timeout=20,
    )
    payload = response.json()
    translated = payload.get("translatedText")
    if payload.get("error") or not translated:
        raise TranslateError(str(payload.get("error") or "resposta vazia"))
    return translated


def translate(text, source="en", target="pt-BR"):
    if not text or not text.strip():
        return text
    key = "tr:" + hashlib.sha1(
        f"{CACHE_VERSION}|{source}|{target}|{text}".encode()
    ).hexdigest()
    hit = cache.get(key)
    if hit:
        return hit

    attempts = (
        [lambda: _translate_mymemory(text, source, target)]
        + [
            (lambda u=url: _translate_libre(u, text, source, target))
            for url in LIBRE_ENDPOINTS
        ]
    )
    last_error = None
    for attempt in attempts:
        try:
            translated = attempt()
            break
        except (requests.RequestException, ValueError, TranslateError) as exc:
            last_error = exc
    else:
        raise TranslateError(f"todos os provedores falharam: {last_error}")

    translated = _clean(translated)
    cache.set(key, translated, CACHE_SECONDS)
    return translated


def translate_many(texts):
    def one(value):
        try:
            return translate(value)
        except TranslateError:
            return value

    with ThreadPoolExecutor(max_workers=min(6, max(1, len(texts)))) as pool:
        return list(pool.map(one, texts))
