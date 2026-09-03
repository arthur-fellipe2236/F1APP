"""Traducao automatica de textos, sem chave.

Provedores em cadeia: LibreTranslate publico (disroot, terraprint) e,
como ultimo recurso, MyMemory (cota diaria por IP). Falhas sao toleradas:
translate_many devolve o texto original. A cache (memoria + disco em
instance/translate_cache.json) guarda apenas traducees boas.
"""

import hashlib
import json
import os
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import requests

MAX_CHARS = 480
CACHE_VERSION = "v3"

LIBRE_ENDPOINTS = (
    "https://translate.disroot.org/translate",
    "https://translate.terraprint.co/translate",
)
MYMEMORY_URL = "https://api.mymemory.translated.net/get"

_CACHE_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "instance",
    "translate_cache.json",
)

# O servico pode traduzir mal nomes de escuderias/termos fixos.
FIXUPS = [
    (re.compile(r"\balpin(?:a|o|as|os)\b", re.IGNORECASE), "Alpine"),
]

BAD_MARKERS = (
    "MYMEMORY WARNING",
    "YOU USED ALL AVAILABLE",
)

_cache = None
_lock = threading.Lock()


class TranslateError(Exception):
    """Falha ao traduzir nos provedores."""


def _looks_bad(text):
    upper = text.upper()
    return any(marker in upper for marker in BAD_MARKERS)


def _load_cache():
    global _cache
    if _cache is not None:
        return _cache
    _cache = {}
    try:
        with open(_CACHE_FILE, encoding="utf-8") as handle:
            data = json.load(handle)
        if isinstance(data, dict):
            for key, entry in data.items():
                if (
                    isinstance(entry, dict)
                    and isinstance(entry.get("t"), str)
                    and not _looks_bad(entry["t"])
                ):
                    _cache[key] = entry
    except (OSError, ValueError):
        pass
    return _cache


def _store(key, text):
    cache = _load_cache()
    cache[key] = {"ts": time.time(), "t": text}
    if len(cache) > 4000:
        oldest = sorted(cache, key=lambda k: cache[k]["ts"])[:1000]
        for drop in oldest:
            cache.pop(drop, None)
    try:
        tmp = _CACHE_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as handle:
            json.dump(cache, handle, ensure_ascii=False)
        os.replace(tmp, _CACHE_FILE)
    except OSError:
        pass


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


def _translate_mymemory(text, source, target):
    response = requests.get(
        MYMEMORY_URL,
        params={
            "langpair": f"{source}|{target}",
            "q": text[:MAX_CHARS],
        },
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
    return translated.replace('\\"', '"').replace("\\'", "'")


def translate(text, source="en", target="pt-BR"):
    if not text or not text.strip():
        return text
    key = hashlib.sha1(
        f"{CACHE_VERSION}|{source}|{target}|{text}".encode()
    ).hexdigest()
    with _lock:
        hit = _load_cache().get(key)
    if hit:
        return hit["t"]

    attempts = [
        (None, lambda: _translate_mymemory(text, source, target))
    ] + [
        (
            url,
            lambda u=url: _translate_libre(u, text, source, target),
        )
        for url in LIBRE_ENDPOINTS
    ]
    last_error = None
    for _, attempt in attempts:
        try:
            translated = attempt()
            break
        except (requests.RequestException, ValueError, TranslateError) as exc:
            last_error = exc
    else:
        raise TranslateError(
            f"todos os provedores falharam: {last_error}"
        )

    translated = translated.replace('\\"', '"').replace("\\'", "'")
    for pattern, replacement in FIXUPS:
        translated = pattern.sub(replacement, translated)

    with _lock:
        _store(key, translated)
    return translated


def translate_many(texts):
    def one(value):
        try:
            return translate(value)
        except TranslateError:
            return value

    with ThreadPoolExecutor(max_workers=min(6, max(1, len(texts)))) as pool:
        return list(pool.map(one, texts))
