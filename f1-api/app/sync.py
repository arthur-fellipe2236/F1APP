"""Sincronizacao de dados reais para o banco local.

- Temporadas 2023 em diante: OpenF1 (https://openf1.org).
- Temporadas antes de 2023 (ex.: 2022): Jolpica/Ergast
  (https://api.jolpi.ca), com os pontos de sprint anexados ao round.
Temporadas completas ja sincronizadas sao puladas; a temporada corrente e
re-sincronizada a cada execucao para incorporar corridas novas.
"""

import os
import threading
import unicodedata
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func

from . import ergast
from . import openf1
from .extensions import db
from .models import Circuit, Driver, Race, RaceResult, Team
from .seed import ensure_demo_season, seed

MIN_OPENF1_SEASON = 2023
MIN_JOLPICA_SEASON = 2022

TEAM_ALIASES = {
    "Red Bull": "Red Bull Racing",
    "Red Bull Racing Honda": "Red Bull Racing",
    "Williams Racing": "Williams",
    "Haas F1 Team": "Haas",
    "Alpine F1 Team": "Alpine",
    "AlphaTauri Honda": "AlphaTauri",
    "Scuderia AlphaTauri": "AlphaTauri",
    "Alfa Romeo Racing": "Alfa Romeo",
    "Alfa Romeo Racing ORLEN": "Alfa Romeo",
    "Aston Martin Cognizant": "Aston Martin",
    "Aston Martin Aramco Cognizant": "Aston Martin",
    "BWT Alpine": "Alpine",
}

NATIONALITY_PT = {
    "NED": "Neerlandês", "Dutch": "Neerlandês",
    "GBR": "Britânico", "British": "Britânico",
    "MON": "Monegasco", "Monegasque": "Monegasco",
    "ESP": "Espanhol", "Spanish": "Espanhol",
    "AUS": "Australiano", "Australian": "Australiano",
    "GER": "Alemão", "German": "Alemão",
    "FRA": "Francês", "French": "Francês",
    "CAN": "Canadense", "Canadian": "Canadense",
    "FIN": "Finlandês", "Finnish": "Finlandês",
    "DEN": "Dinamarquês", "Danish": "Dinamarquês",
    "JPN": "Japonês", "Japanese": "Japonês",
    "MEX": "Mexicano", "Mexican": "Mexicano",
    "ITA": "Italiano", "Italian": "Italiano",
    "USA": "Estadunidense", "American": "Estadunidense",
    "SWE": "Sueco", "Swedish": "Sueco",
    "THA": "Tailandês", "Thai": "Tailandês",
    "ARG": "Argentino", "Argentine": "Argentino",
    "BRA": "Brasileiro", "Brazilian": "Brasileiro",
    "CHN": "Chinês", "Chinese": "Chinês",
    "BEL": "Belga", "Belgian": "Belga",
    "NZL": "Neozelandês", "New Zealander": "Neozelandês",
    "AUT": "Austríaco", "Austrian": "Austríaco",
    "SUI": "Suíço", "Swiss": "Suíço",
    "IRL": "Irlandês", "Irish": "Irlandês",
    "RSA": "Sul-Africano", "South African": "Sul-Africano",
    "POL": "Polonês", "Polish": "Polonês",
}

# Sede, motor e ano de fundacao por construtor (a OpenF1/Jolpica nao
# fornecem esses campos). Valores referentes a era mais recente da equipe.
TEAM_METADATA = {
    "Red Bull Racing": ("Reino Unido", "Red Bull Ford", 2005),
    "Ferrari": ("Itália", "Ferrari", 1950),
    "Mercedes": ("Alemanha", "Mercedes", 2010),
    "McLaren": ("Reino Unido", "Mercedes", 1963),
    "Aston Martin": ("Reino Unido", "Honda", 2021),
    "Alpine": ("França", "Mercedes", 2021),
    "Williams": ("Reino Unido", "Mercedes", 1977),
    "AlphaTauri": ("Itália", "Honda RBPT", 2020),
    "RB": ("Itália", "Honda RBPT", 2022),
    "Visa Cash App RB": ("Itália", "Honda RBPT", 2022),
    "Racing Bulls": ("Itália", "Red Bull Ford", 2025),
    "Alfa Romeo": ("Suíça", "Ferrari", 2018),
    "Kick Sauber": ("Suíça", "Ferrari", 2024),
    "Audi": ("Suíça", "Audi", 2026),
    "Haas": ("Estados Unidos", "Ferrari", 2014),
    "Cadillac": ("Estados Unidos", "Ferrari", 2026),
}

# Motor por temporada (equipes trocam de fornecedor ao longo dos anos).
# Valores ausentes usam o padrao da linha em TEAM_METADATA.
TEAM_ENGINES_BY_SEASON = {
    "Red Bull Racing": {
        2022: "Honda RBPT", 2023: "Honda RBPT",
        2024: "Honda RBPT", 2025: "Honda RBPT",
        2026: "Red Bull Ford",
    },
    "Aston Martin": {
        2022: "Mercedes", 2023: "Mercedes",
        2024: "Mercedes", 2025: "Mercedes",
        2026: "Honda",
    },
    "Alpine": {
        2022: "Renault", 2023: "Renault",
        2024: "Renault", 2025: "Renault",
        2026: "Mercedes",
    },
    "Haas": {2022: "Ferrari", 2023: "Ferrari", 2024: "Ferrari",
             2025: "Ferrari", 2026: "Ferrari"},
    "Alfa Romeo": {2022: "Ferrari", 2023: "Ferrari"},
    "AlphaTauri": {2022: "Honda RBPT", 2023: "Honda RBPT"},
    "RB": {2024: "Honda RBPT"},
    "Visa Cash App RB": {2025: "Honda RBPT"},
    "Racing Bulls": {2025: "Honda RBPT", 2026: "Red Bull Ford"},
    "Kick Sauber": {2024: "Ferrari", 2025: "Ferrari"},
    "Audi": {2026: "Audi"},
    "Cadillac": {2026: "Ferrari"},
}

SYNC_LOCK = threading.Lock()
SYNC_STATE = {
    "running": False,
    "last_sync_at": None,
    "last_error": None,
}


def configured_seasons():
    env = os.environ.get("F1_SYNC_SEASONS")
    if env:
        return [int(part) for part in env.split(",") if part.strip()]
    return list(range(MIN_JOLPICA_SEASON, date.today().year + 1))


def demo_seasons():
    env = os.environ.get("F1_DEMO_SEASONS")
    if env:
        return [int(part) for part in env.split(",") if part.strip()]
    return []


def fastest_lap_enabled():
    return os.environ.get("F1_SYNC_FASTEST_LAP", "1") != "0"


def _parse_dt(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _now_utc():
    return datetime.now(timezone.utc)


def _to_nationality(raw):
    if not raw:
        return None
    return NATIONALITY_PT.get(raw, raw)


def _upsert_team(name):
    name = TEAM_ALIASES.get(name, name)
    team = Team.query.filter_by(name=name).first()
    if team is None:
        team = Team(name=name)
        db.session.add(team)
        db.session.flush()
    return team


def _upsert_circuit(meeting, laps):
    name = meeting["circuit_short_name"]
    circuit = Circuit.query.filter_by(name=name).first()
    if circuit is None:
        circuit = Circuit(name=name)
        db.session.add(circuit)
    circuit.city = meeting.get("location")
    circuit.country = meeting.get("country_name")
    if laps:
        circuit.laps = laps
    db.session.flush()
    return circuit


def _upsert_driver(info):
    code = info.get("name_acronym") or None
    driver = Driver.query.filter_by(code=code).first() if code else None
    if driver is None:
        driver = Driver.query.filter_by(
            first_name=info.get("first_name"),
            last_name=info.get("last_name"),
        ).first()
    if driver is None:
        driver = Driver(
            first_name=info.get("first_name") or "?",
            last_name=info.get("last_name") or "?",
        )
        if code and Driver.query.filter_by(code=code).first() is None:
            driver.code = code
        db.session.add(driver)
    else:
        driver.first_name = info.get("first_name") or driver.first_name
        driver.last_name = info.get("last_name") or driver.last_name
        if code and driver.code is None:
            if Driver.query.filter_by(code=code).first() is None:
                driver.code = code

    driver.nationality = _to_nationality(info.get("country_code")) or driver.nationality
    if info.get("headshot_url"):
        driver.headshot_url = info["headshot_url"]

    driver_number = info.get("driver_number")
    if driver_number is not None:
        # Numeros sao reutilizados entre eras (Vettel #5 em 2022,
        # Bortoleto #5 em 2025+): cada piloto guarda o da sua epoca.
        driver.permanent_number = driver_number

    team_name = info.get("team_name")
    if team_name:
        driver.team = _upsert_team(team_name)
    db.session.flush()
    return driver


def _grid_from_positions(session_key):
    records = openf1.get("position", session_key=session_key) or []
    grid = {}
    for record in records:
        grid.setdefault(record["driver_number"], record["position"])
    return grid


def _fastest_lap_driver(session_key):
    laps = openf1.get("laps", session_key=session_key) or []
    best = {}
    for lap in laps:
        duration = lap.get("lap_duration")
        if not duration or lap.get("is_pit_out_lap"):
            continue
        number = lap["driver_number"]
        if number not in best or duration < best[number]:
            best[number] = duration
    if not best:
        return None
    return min(best, key=best.get)


def _result_status(row):
    if row.get("dsq"):
        return "disqualified"
    if row.get("dns"):
        return "dns"
    if row.get("dnf"):
        return "dnf"
    return "finished"


def _store_sprint_points(race_id, entries):
    """entries: lista de (driver, points, laps) vindos da classificacao do sprint."""
    existing = {
        result.driver_id: result
        for result in RaceResult.query.filter_by(race_id=race_id).all()
    }
    for driver, points, laps in entries:
        if points <= 0:
            continue
        result = existing.get(driver.id)
        if result is None:
            result = RaceResult(
                race_id=race_id,
                driver_id=driver.id,
                team_id=driver.team_id,
                position=None,
                points=0.0,
                grid=None,
                laps=laps,
                status="dns",
            )
            db.session.add(result)
            existing[driver.id] = result
        result.sprint_points = points
    db.session.flush()


def _attach_sprint_points(race_id, sprint_session):
    """Pontos de sprint acumulam no resultado da corrida principal do round."""
    sprint_sk = sprint_session["session_key"]
    sprint_results = openf1.get("session_result", session_key=sprint_sk) or []
    if not sprint_results:
        return

    sprint_info = {
        info["driver_number"]: info
        for info in (openf1.get("drivers", session_key=sprint_sk) or [])
    }

    entries = []
    for row in sprint_results:
        points = float(row.get("points") or 0)
        if points <= 0:
            continue
        info = sprint_info.get(row["driver_number"])
        if info is None:
            continue
        entries.append(
            (_upsert_driver(info), points, row.get("number_of_laps"))
        )
    _store_sprint_points(race_id, entries)


def _sync_race(session, meeting, season, round_, force, sessions, now):
    session_key = session["session_key"]

    race = Race.query.filter_by(season=season, round=round_).first()
    if race is not None and race.results and not force:
        return False

    results = openf1.get("session_result", session_key=session_key)
    if not results:
        return False

    grid_rows = openf1.get("starting_grid", session_key=session_key) or []
    grid_by_number = {
        row["driver_number"]: row["position"] for row in grid_rows
    }
    if not grid_by_number:
        grid_by_number = _grid_from_positions(session_key)

    info_by_number = {
        info["driver_number"]: info
        for info in (openf1.get("drivers", session_key=session_key) or [])
    }
    fastest_number = (
        _fastest_lap_driver(session_key) if fastest_lap_enabled() else None
    )

    if race is None:
        race = Race(season=season, round=round_)
        db.session.add(race)
    race.name = meeting["meeting_name"]
    race.date = _parse_dt(meeting["date_start"]).date()
    db.session.flush()

    RaceResult.query.filter_by(race_id=race.id).delete()

    winner_laps = None
    for row in results:
        info = info_by_number.get(row["driver_number"])
        if info is None:
            continue
        driver = _upsert_driver(info)
        if row.get("position") == 1:
            winner_laps = row.get("number_of_laps")
        db.session.add(
            RaceResult(
                race_id=race.id,
                driver_id=driver.id,
                team_id=driver.team_id,
                position=row.get("position"),
                points=float(row.get("points") or 0),
                grid=grid_by_number.get(row["driver_number"]),
                laps=row.get("number_of_laps"),
                status=_result_status(row),
                fastest_lap=row["driver_number"] == fastest_number,
            )
        )
    race.circuit = _upsert_circuit(meeting, winner_laps)
    db.session.flush()

    sprint_session = next(
        (s for s in sessions if s.get("session_name") == "Sprint"), None
    )
    if (
        sprint_session is not None
        and _parse_dt(sprint_session["date_end"]) <= now
    ):
        _attach_sprint_points(race.id, sprint_session)
    return True


def sync_season(season, force=False):
    """Importa/renova uma temporada. Retorna o total de corridas."""
    if season < MIN_OPENF1_SEASON:
        return _sync_season_jolpica(season, force)

    today = date.today()
    if not force and season < today.year and Race.query.filter_by(
        season=season
    ).first() is not None:
        return Race.query.filter_by(season=season).count()

    if force:
        for race in Race.query.filter_by(season=season).all():
            db.session.delete(race)
        db.session.commit()

    meetings = openf1.get("meetings", year=season) or []
    gps = [
        meeting
        for meeting in meetings
        if str(meeting.get("meeting_name", "")).endswith("Grand Prix")
        and not meeting.get("is_cancelled")
    ]
    gps.sort(key=lambda meeting: meeting["date_start"])

    now = _now_utc()
    imported = 0
    for round_, meeting in enumerate(gps, start=1):
        sessions = openf1.get(
            "sessions",
            meeting_key=meeting["meeting_key"],
            session_type="Race",
        ) or []
        # OpenF1 marca o sprint como session_type="Race"; a corrida principal
        # e a unica com session_name == "Race".
        race_session = next(
            (s for s in sessions if s.get("session_name") == "Race"),
            None,
        )
        if race_session is None:
            continue
        if _parse_dt(race_session["date_end"]) > now:
            continue
        if _sync_race(
            race_session, meeting, season, round_, force, sessions, now
        ):
            imported += 1
    db.session.commit()
    return imported


def _ergast_status(raw):
    value = (raw or "").strip()
    lowered = value.lower()
    if lowered in {"finished", "running"} or value.startswith("+"):
        return "finished"
    if "disqualif" in lowered or lowered == "excluded":
        return "disqualified"
    if lowered in {
        "did not start",
        "withdrew",
        "did not qualify",
        "did not prequalify",
        "failed qualification",
    }:
        return "dns"
    return "dnf"


def _int_or_none(value):
    text = str(value if value is not None else "").strip()
    return int(text) if text.isdigit() else None


def _upsert_ergast_row(row):
    driver_data = row.get("Driver", {})
    constructor_name = (row.get("Constructor") or {}).get("name")
    driver = _upsert_driver({
        "driver_number": _int_or_none(row.get("number")),
        "name_acronym": driver_data.get("code"),
        "first_name": driver_data.get("givenName"),
        "last_name": driver_data.get("familyName"),
        "country_code": None,
    })
    # Temporadas antigas (Jolpica) nunca sobrescrevem a equipe "atual" do
    # piloto: ela e definida pelo resultado mais recente (e o sync OpenF1
    # roda em ordem crescente de temporada).
    nationality = _to_nationality(driver_data.get("nationality"))
    if nationality:
        driver.nationality = nationality
    team = _upsert_team(constructor_name) if constructor_name else None
    db.session.flush()
    return driver, team


def _sync_jolpica_race(entry, season, round_):
    race = Race.query.filter_by(season=season, round=round_).first()
    if race is None:
        race = Race(season=season, round=round_)
        db.session.add(race)
    race.name = entry["raceName"]
    race.date = date.fromisoformat(entry["date"])

    circuit_data = entry.get("Circuit", {})
    location = circuit_data.get("Location", {})
    circuit = Circuit.query.filter_by(
        name=circuit_data.get("circuitName")
    ).first()
    if circuit is None:
        circuit = Circuit(name=circuit_data.get("circuitName"))
        db.session.add(circuit)
    circuit.city = location.get("locality") or circuit.city
    circuit.country = location.get("country") or circuit.country
    db.session.flush()

    RaceResult.query.filter_by(race_id=race.id).delete()
    winner_laps = None
    for row in entry.get("Results", []):
        driver, team = _upsert_ergast_row(row)
        position = _int_or_none(row.get("position"))
        if position == 1:
            winner_laps = _int_or_none(row.get("laps"))
        fastest = (row.get("FastestLap") or {}).get("rank")
        db.session.add(
            RaceResult(
                race_id=race.id,
                driver_id=driver.id,
                team_id=team.id if team else driver.team_id,
                position=position,
                points=float(row.get("points") or 0),
                grid=_int_or_none(row.get("grid")),
                laps=_int_or_none(row.get("laps")),
                status=_ergast_status(row.get("status")),
                fastest_lap=fastest == "1",
            )
        )
    if winner_laps:
        circuit.laps = winner_laps
    race.circuit = circuit
    db.session.flush()


def _sync_season_jolpica(season, force=False):
    today = date.today()
    if not force and season < today.year and Race.query.filter_by(
        season=season
    ).first() is not None:
        return Race.query.filter_by(season=season).count()

    if force:
        for race in Race.query.filter_by(season=season).all():
            db.session.delete(race)
        db.session.commit()

    calendar = ergast.get(str(season))
    if not calendar:
        return 0

    imported = 0
    for round_ in sorted(int(r["round"]) for r in calendar):
        race_rows = ergast.get(f"{season}/{round_}/results")
        if not race_rows:
            continue
        _sync_jolpica_race(race_rows[0], season, round_)

        sprint_rows = ergast.get(f"{season}/{round_}/sprint")
        if sprint_rows:
            entries = []
            for row in sprint_rows[0].get("SprintResults", []):
                points = float(row.get("points") or 0)
                if points <= 0:
                    continue
                driver, _team = _upsert_ergast_row(row)
                entries.append(
                    (driver, points, _int_or_none(row.get("laps")))
                )
            race = Race.query.filter_by(season=season, round=round_).first()
            if race is not None:
                _store_sprint_points(race.id, entries)
        imported += 1
    db.session.commit()
    return imported


def normalize_teams():
    """Mescla linhas duplicadas de equipe que diferem apenas pelo alias."""
    changed = False
    for alias, canonical in TEAM_ALIASES.items():
        dup = Team.query.filter_by(name=alias).first()
        if dup is None:
            continue
        target = Team.query.filter_by(name=canonical).first()
        if target is None:
            dup.name = canonical
            changed = True
            continue
        for result in RaceResult.query.filter_by(team_id=dup.id).all():
            result.team_id = target.id
        for driver in Driver.query.filter_by(team_id=dup.id).all():
            driver.team_id = target.id
        db.session.delete(dup)
        changed = True
    db.session.flush()
    if changed:
        db.session.commit()


def backfill_nationalities():
    """Nacionalidade canonica (pt-BR) para todos os pilotos, via Jolpica."""
    by_code = {}
    by_name = {}
    for season in configured_seasons():
        try:
            standings = ergast.get_driver_standings(season)
        except ergast.JolpicaError:
            continue
        for row in standings:
            driver_data = row.get("Driver", {})
            nationality = _to_nationality(driver_data.get("nationality"))
            if not nationality:
                continue
            if driver_data.get("code"):
                by_code[driver_data["code"]] = nationality
            key = (driver_data.get("givenName"), driver_data.get("familyName"))
            if all(key):
                by_name[key] = nationality

    for driver in Driver.query.all():
        nationality = by_code.get(driver.code) or by_name.get(
            (driver.first_name, driver.last_name)
        )
        if nationality:
            driver.nationality = nationality
    db.session.commit()


def refresh_driver_current_teams():
    """Equipe atual = equipe do resultado mais recente do piloto (todas as
    temporadas sincronizadas), consertando resyncs fora de ordem."""
    latest = (
        db.session.query(
            RaceResult.driver_id.label("driver_id"),
            func.max(Race.date).label("last_date"),
        )
        .join(Race, RaceResult.race_id == Race.id)
        .group_by(RaceResult.driver_id)
        .subquery()
    )
    rows = (
        db.session.query(Driver, RaceResult.team_id)
        .join(latest, latest.c.driver_id == Driver.id)
        .join(Race, Race.date == latest.c.last_date)
        .join(
            RaceResult,
            (RaceResult.race_id == Race.id)
            & (RaceResult.driver_id == Driver.id),
        )
        .all()
    )
    for driver, team_id in rows:
        if team_id is not None:
            driver.team_id = team_id
    db.session.commit()


def apply_team_metadata():
    """Preenche sede/motor/fundacao das equipes (so campos vazios)."""
    changed = False
    for team in Team.query.all():
        meta = TEAM_METADATA.get(team.name)
        if meta is None:
            continue
        base_country, engine, founded = meta
        if team.base_country is None:
            team.base_country = base_country
            changed = True
        if team.engine_manufacturer is None:
            team.engine_manufacturer = engine
            changed = True
        if team.founded_year is None:
            team.founded_year = founded
            changed = True
    if changed:
        db.session.commit()


# Extensao oficial (km, configuracao atual) por (cidade, pais) normalizados:
# OpenF1 e Jolpica usam nomes diferentes para o mesmo circuito ("Sakhir" vs
# "Bahrain International Circuit"), mas cidade+pais e estavel.
CIRCUIT_LENGTH_KM = {
    ("sakhir", "bahrain"): 5.412,
    ("jeddah", "saudi arabia"): 6.174,
    ("melbourne", "australia"): 5.278,
    ("miami", "united states"): 5.412,
    ("miami gardens", "united states"): 5.412,
    ("imola", "italy"): 4.909,
    ("barcelona", "spain"): 4.675,
    ("monte carlo", "monaco"): 3.337,
    ("baku", "azerbaijan"): 6.003,
    ("montreal", "canada"): 4.361,
    ("le castellet", "france"): 5.842,
    ("spielberg", "austria"): 4.318,
    ("silverstone", "united kingdom"): 5.891,
    ("spa", "belgium"): 7.004,
    ("spa-francorchamps", "belgium"): 7.004,
    ("monza", "italy"): 5.793,
    ("marina bay", "singapore"): 4.940,
    ("suzuka", "japan"): 5.807,
    ("lusail", "qatar"): 5.419,
    ("austin", "united states"): 5.513,
    ("mexico city", "mexico"): 4.304,
    ("sao paulo", "brazil"): 4.309,
    ("zandvoort", "netherlands"): 4.259,
    ("yas island", "united arab emirates"): 5.281,
    ("las vegas", "united states"): 6.201,
    ("shanghai", "china"): 5.451,
    ("budapest", "hungary"): 4.381,
}

COUNTRY_ALIASES = {
    "usa": "united states",
    "uk": "united kingdom",
}

# Cidades que as duas fontes descrevem de formas diferentes para o mesmo
# autostromo (ex.: OpenF1 "Miami Gardens" vs Ergast "Miami").
CITY_ALIASES = {
    "miami gardens": "miami",
    "spa-francorchamps": "spa",
}


def _place_key(text):
    normalized = unicodedata.normalize("NFD", text or "")
    normalized = normalized.encode("ascii", "ignore").decode().lower().strip()
    return normalized


def _circuit_length_key(circuit):
    city = _place_key(circuit.city)
    country = _place_key(circuit.country)
    country = COUNTRY_ALIASES.get(country, country)
    return (city, country)


def backfill_circuit_lengths():
    """Preenche length_km dos circuitos sincronizados (so campos vazios)."""
    changed = False
    for circuit in Circuit.query.filter(
        Circuit.length_km.is_(None)
    ).all():
        km = CIRCUIT_LENGTH_KM.get(_circuit_length_key(circuit))
        if km is not None:
            circuit.length_km = km
            changed = True
    if changed:
        db.session.commit()


def normalize_circuits():
    """Mescla linhas duplicadas do mesmo autostromo (nomes das duas eras).

    Agrupa por (cidade, pais) normalizado e mantem como canonicos o nome
    mais referenciado por corridas (a era OpenF1), repointando as demais.
    """
    groups = {}
    for circuit in Circuit.query.all():
        city, country = _circuit_length_key(circuit)
        city = CITY_ALIASES.get(city, city)
        groups.setdefault((city, country), []).append(circuit)

    changed = False
    for members in groups.values():
        if len(members) < 2:
            continue
        members.sort(
            key=lambda c: (
                -Race.query.filter_by(circuit_id=c.id).count(),
                c.name,
            )
        )
        target = members[0]
        for dup in members[1:]:
            for race in Race.query.filter_by(circuit_id=dup.id).all():
                race.circuit = target
            if target.length_km is None:
                target.length_km = dup.length_km
            if target.laps is None:
                target.laps = dup.laps
            db.session.delete(dup)
            changed = True
    if changed:
        db.session.commit()


def backfill_headshots():
    """Fotos dos pilotos ativos via drivers da ultima corrida disputada."""
    if Driver.query.filter(Driver.headshot_url.is_(None)).first() is None:
        return
    now = _now_utc()
    candidates = []
    for year in (now.year, now.year - 1):
        try:
            sessions = openf1.get(
                "sessions", year=year, session_type="Race"
            ) or []
        except openf1.OpenF1Error:
            continue
        finished = [
            s
            for s in sessions
            if _parse_dt(s["date_end"]) <= now + timedelta(minutes=30)
        ]
        candidates += finished
    if not candidates:
        return
    latest = max(candidates, key=lambda s: _parse_dt(s["date_end"]))
    try:
        rows = openf1.get("drivers", session_key=latest["session_key"]) or []
    except openf1.OpenF1Error:
        return
    by_number = {r["driver_number"]: r.get("headshot_url") for r in rows}
    updated = False
    for driver in Driver.query.filter(
        Driver.headshot_url.is_(None),
        Driver.permanent_number.isnot(None),
    ).all():
        url = by_number.get(driver.permanent_number)
        if url:
            driver.headshot_url = url
            updated = True
    if updated:
        db.session.commit()


def run_fixups():
    normalize_teams()
    normalize_circuits()
    refresh_driver_current_teams()
    apply_team_metadata()
    backfill_circuit_lengths()
    backfill_headshots()


def sync_configured():
    error = None
    for season in configured_seasons():
        try:
            sync_season(season)
        except (openf1.OpenF1Error, ergast.JolpicaError) as exc:
            error = str(exc)
            break
    if error is None:
        for season in demo_seasons():
            ensure_demo_season(season)
    run_fixups()
    if error is None:
        try:
            backfill_nationalities()
        except ergast.JolpicaError as exc:
            error = f"nacionalidades: {exc}"
    return error


def _run_sync(app, season=None, force=False):
    error = None
    try:
        with app.app_context():
            try:
                if season is None:
                    error = sync_configured()
                    if error and Race.query.first() is None:
                        seed()
                        error = f"{error} (fallback para seed demonstrativo)"
                else:
                    sync_season(season, force=force)
                    run_fixups()
                    try:
                        backfill_nationalities()
                    except ergast.JolpicaError:
                        pass
            except openf1.OpenF1Error as exc:
                error = str(exc)
                if Race.query.first() is None:
                    seed()
                    error = f"{error} (fallback para seed demonstrativo)"
    except Exception as exc:  # noqa: BLE001
        error = f"Erro inesperado na sincronizacao: {exc}"
    finally:
        SYNC_STATE["running"] = False
        SYNC_STATE["last_sync_at"] = _now_utc().isoformat()
        SYNC_STATE["last_error"] = error
        if error:
            app.logger.warning("OpenF1 sync: %s", error)


def _start_sync_thread(app, season=None, force=False):
    with SYNC_LOCK:
        if SYNC_STATE["running"]:
            return False
        SYNC_STATE["running"] = True
    threading.Thread(
        target=_run_sync,
        args=(app, season, force),
        daemon=True,
        name="openf1-sync",
    ).start()
    return True


def start_background_sync(app):
    return _start_sync_thread(app)


def request_sync(app, season=None, force=False):
    return _start_sync_thread(app, season=season, force=force)
