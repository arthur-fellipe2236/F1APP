"""Cliente HTTP para a API publica OpenF1 (https://openf1.org).

Dados historicos gratuitos a partir da temporada 2023. Respostas 404
sao tratadas como "sem dados" (None) pois varios endpoints cobrem
apenas parte do historico (ex.: starting_grid). Erros 429 sao
novamente tentados com backoff exponencial.
"""

import os
import time
from urllib.parse import quote

import requests

BASE_URL = "https://api.openf1.org/v1"
TIMEOUT_SECONDS = 30
REQUEST_INTERVAL_SECONDS = float(os.environ.get("F1_SYNC_INTERVAL", "0.25"))
MAX_RETRIES = int(os.environ.get("F1_SYNC_RETRIES", "5"))

_session = requests.Session()


class OpenF1Error(Exception):
    """Falha de comunicacao com a OpenF1 (rede, 5xx, 429 persistente, JSON invalido)."""


def get(path, **params):
    """GET em /v1/<path> com filtros como kwargs. Retorna None se 404.

    A query e montada manualmente porque os filtros de operador da OpenF1
    (ex.: 'date>=') terminam em '=' e o encoding do requests quebra a chave.
    """
    url = f"{BASE_URL}/{path}"
    clean = {key: value for key, value in params.items() if value is not None}
    if clean:
        url += "?" + "&".join(
            (
                f"{key}{quote(str(value), safe='')}"
                if key.endswith("=")
                else f"{key}={quote(str(value), safe='')}"
            )
            for key, value in clean.items()
        )

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = _session.get(url, timeout=TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            raise OpenF1Error(f"Falha ao consultar OpenF1 em /{path}: {exc}") from exc

        if response.status_code == 429:
            if attempt >= MAX_RETRIES:
                raise OpenF1Error(
                    f"OpenF1 limitou as requisicoes (429) em /{path}"
                )
            retry_after = response.headers.get("Retry-After")
            try:
                wait = float(retry_after) if retry_after else 0.0
            except ValueError:
                wait = 0.0
            wait = max(wait, min(1.5 * (2**attempt), 8.0))
            time.sleep(wait)
            continue

        if response.status_code == 404:
            return None
        if response.status_code != 200:
            raise OpenF1Error(f"OpenF1 respondeu {response.status_code} em /{path}")
        try:
            payload = response.json()
        except ValueError as exc:
            raise OpenF1Error(f"Resposta nao-JSON da OpenF1 em /{path}") from exc

        time.sleep(REQUEST_INTERVAL_SECONDS)
        return payload

    raise OpenF1Error(f"OpenF1 indisponivel para /{path}")
