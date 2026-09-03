"""Cliente HTTP para a API Jolpica (successora comunitaria da API Ergast).

Cobre historico que a OpenF1 nao tem (antes de 2023), ex.:
https://api.jolpi.ca/ergast/f1/2022/4/results.json
https://api.jolpi.ca/ergast/f1/2022/driverStandings.json
Respostas 404 ou total=0 sao tratadas como "sem dados" (None).
"""

import time

import requests

BASE_URL = "https://api.jolpi.ca/ergast/f1"
TIMEOUT_SECONDS = 30
REQUEST_INTERVAL_SECONDS = 0.15
MAX_RETRIES = 4

_session = requests.Session()


class JolpicaError(Exception):
    """Falha de comunicacao com a Jolpica."""


def _request(path, params=None):
    url = f"{BASE_URL}/{path}.json"

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = _session.get(url, params=params, timeout=TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            raise JolpicaError(f"Falha ao consultar Jolpica: {exc}") from exc

        if response.status_code == 404:
            return None
        if response.status_code == 429:
            if attempt >= MAX_RETRIES:
                raise JolpicaError("Jolpica limitou as requisicoes (429)")
            time.sleep(min(2.0 * (2**attempt), 30.0))
            continue
        if response.status_code != 200:
            raise JolpicaError(
                f"Jolpica respondeu {response.status_code} em {path}"
            )
        try:
            payload = response.json()["MRData"]
        except (ValueError, KeyError) as exc:
            raise JolpicaError(f"Resposta inesperada da Jolpica em {path}") from exc

        time.sleep(REQUEST_INTERVAL_SECONDS)
        if int(payload.get("total") or 0) == 0:
            return None
        return payload

    raise JolpicaError(f"Jolpica indisponivel para {path}")


def get(path):
    """GET em /ergast/f1/<path>.json; retorna a lista de Races ou None."""
    payload = _request(path)
    if payload is None:
        return None
    return payload["RaceTable"]["Races"]


def get_driver_standings(season):
    """Classificacao de pilotos da temporada (todos, com Driver.nationality)."""
    payload = _request(
        f"{season}/driverStandings", params={"limit": 200}
    )
    if payload is None:
        return []
    tables = payload["StandingsTable"]["StandingsLists"]
    return tables[0]["DriverStandings"] if tables else []


def get_team_standings(season):
    """Classificacao de construtores da temporada (com Constructor.nationality)."""
    payload = _request(
        f"{season}/constructorStandings", params={"limit": 200}
    )
    if payload is None:
        return []
    tables = payload["StandingsTable"]["StandingsLists"]
    return tables[0]["ConstructorStandings"] if tables else []
