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
MIN_JOLPICA_SEASON = 1985

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
# Sede (cidade, pais), motor e ano de fundacao por construtor para todas as 74 equipes
TEAM_METADATA = {
    "Mercedes": ("Brackley", "Alemanha", "Mercedes", 2010),
    "Ferrari": ("Maranello", "Itália", "Ferrari", 1950),
    "Williams": ("Grove", "Reino Unido", "Mercedes", 1977),
    "Sauber": ("Hinwil", "Suíça", "Ferrari", 1993),
    "Red Bull Racing": ("Milton Keynes", "Reino Unido", "Red Bull Ford", 2005),
    "Force India": ("Silverstone", "Reino Unido", "Mercedes", 2007),
    "Toro Rosso": ("Faenza", "Itália", "Honda", 2005),
    "McLaren": ("Woking", "Reino Unido", "Mercedes", 1963),
    "Lotus F1": ("Enstone", "Reino Unido", "Renault", 2012),
    "Manor Marussia": ("Banbury", "Reino Unido", "Ferrari", 2015),
    "Haas": ("Kannapolis", "Estados Unidos", "Ferrari", 2014),
    "Renault": ("Enstone", "França", "Renault", 1977),
    "Alfa Romeo": ("Hinwil", "Suíça", "Ferrari", 2018),
    "Racing Point": ("Silverstone", "Reino Unido", "BWT Mercedes", 2018),
    "AlphaTauri": ("Faenza", "Itália", "Honda RBPT", 2020),
    "Aston Martin": ("Silverstone", "Reino Unido", "Mercedes", 2009),
    "Alpine": ("Enstone", "França", "Renault", 2021),
    "RB": ("Faenza", "Itália", "Honda RBPT", 2024),
    "Visa Cash App RB": ("Faenza", "Itália", "Honda RBPT", 2024),
    "Kick Sauber": ("Hinwil", "Suíça", "Ferrari", 2024),
    "Racing Bulls": ("Faenza", "Itália", "Red Bull Ford", 2025),
    "Audi": ("Neuburg an der Donau", "Alemanha", "Audi", 2026),
    "Cadillac": ("Fishers", "Estados Unidos", "Ferrari", 2026),
    "Marussia": ("Banbury", "Reino Unido", "Cosworth", 2012),
    "Caterham": ("Leafield", "Reino Unido", "Renault", 2012),
    "HRT": ("Madrid", "Espanha", "Cosworth", 2010),
    "Lotus": ("Hethel", "Reino Unido", "Honda", 1952),
    "Virgin": ("Dinnington", "Reino Unido", "Cosworth", 2010),
    "Brawn": ("Brackley", "Reino Unido", "Mercedes", 2009),
    "Toyota": ("Colônia", "Alemanha", "Toyota", 2002),
    "BMW Sauber": ("Hinwil", "Suíça", "BMW", 2006),
    "Super Aguri": ("Leafield", "Japão", "Honda", 2006),
    "Honda": ("Brackley", "Japão", "Honda", 1964),
    "Spyker": ("Silverstone", "Holanda", "Ferrari", 2007),
    "MF1": ("Silverstone", "Rússia", "Toyota", 2006),
    "Spyker MF1": ("Silverstone", "Holanda", "Toyota", 2006),
    "BAR": ("Brackley", "Reino Unido", "Honda", 1999),
    "Jordan": ("Silverstone", "Irlanda", "Ford Cosworth", 1991),
    "Minardi": ("Faenza", "Itália", "Ford Cosworth", 1979),
    "Jaguar": ("Milton Keynes", "Reino Unido", "Cosworth", 2000),
    "Arrows": ("Milton Keynes", "Reino Unido", "Ford Cosworth", 1978),
    "Prost": ("Guyancourt", "França", "Peugeot", 1997),
    "Benetton": ("Enstone", "Reino Unido", "Ford Cosworth", 1986),
    "Stewart": ("Milton Keynes", "Reino Unido", "Ford", 1997),
    "Tyrrell": ("Ockham", "Reino Unido", "Ford Cosworth", 1968),
    "Ligier": ("Abrest", "França", "Renault", 1976),
    "Footwork": ("Milton Keynes", "Reino Unido", "Porsche", 1991),
    "Forti": ("Alessandria", "Itália", "Ford Cosworth", 1977),
    "Pacific": ("Thetford", "Reino Unido", "Ford Cosworth", 1984),
    "Simtek": ("Banbury", "Reino Unido", "Ford Cosworth", 1989),
    "Team Lotus": ("Hethel", "Reino Unido", "Honda", 1952),
    "Larrousse": ("Antony", "França", "Lamborghini", 1987),
    "Lola": ("Huntingdon", "Reino Unido", "Ford Cosworth", 1958),
    "Brabham": ("Chessington", "Reino Unido", "BMW", 1962),
    "Dallara": ("Varano de' Melegari", "Itália", "Ford Cosworth", 1988),
    "Fondmetal": ("Palosco", "Itália", "Ford Cosworth", 1991),
    "March": ("Bicester", "Reino Unido", "Judd", 1969),
    "Andrea Moda": ("Civitanova Marche", "Itália", "Judd", 1992),
    "Lambo": ("Modena", "Itália", "Lamborghini", 1991),
    "AGS": ("Gonfaron", "França", "Ford Cosworth", 1986),
    "Leyton House": ("Bicester", "Reino Unido", "Judd", 1990),
    "Euro Brun": ("Senago", "Itália", "Judd", 1988),
    "Osella": ("Volpiano", "Itália", "Ford Cosworth", 1980),
    "Onyx": ("Littlehampton", "Reino Unido", "Ford Cosworth", 1989),
    "Rial": ("Fussgönheim", "Alemanha", "Ford Cosworth", 1988),
    "Zakspeed": ("Niederzissen", "Alemanha", "Zakspeed", 1985),
    "Coloni": ("Passignano sul Trasimeno", "Itália", "Ford Cosworth", 1987),
    "RAM": ("Silverstone", "Reino Unido", "Hart", 1976),
    "Spirit": ("Slough", "Reino Unido", "Hart", 1981),
    "Toleman": ("Witney", "Reino Unido", "Hart", 1981),
    "ATS": ("Bad Dürkheim", "Alemanha", "Ford Cosworth", 1977),
    "Theodore": ("Hong Kong", "Hong Kong", "Ford Cosworth", 1977),
    "Fittipaldi": ("Reading", "Brasil", "Ford Cosworth", 1974),
    "Ensign": ("Burntwood", "Reino Unido", "Ford Cosworth", 1973),
    "Shadow": ("Northampton", "Reino Unido", "Ford Cosworth", 1969),
}

# Motor especifico por temporada (1980-2026)
TEAM_ENGINES_BY_SEASON = {
    "Ferrari": {s: "Ferrari" for s in range(1980, 2027)},
    "McLaren": {
        **{s: "Ford Cosworth" for s in range(1980, 1984)},
        **{s: "TAG Porsche" for s in range(1984, 1988)},
        **{s: "Honda" for s in range(1988, 1993)},
        1993: "Ford Cosworth",
        1994: "Peugeot",
        **{s: "Mercedes" for s in range(1995, 2015)},
        **{s: "Honda" for s in range(2015, 2018)},
        **{s: "Renault" for s in range(2018, 2021)},
        **{s: "Mercedes" for s in range(2021, 2027)},
    },
    "Williams": {
        **{s: "Ford Cosworth" for s in range(1980, 1984)},
        **{s: "Honda" for s in range(1984, 1988)},
        1988: "Judd",
        **{s: "Renault" for s in range(1989, 1998)},
        1998: "Mecachrome",
        1999: "Supertec",
        **{s: "BMW" for s in range(2000, 2006)},
        2006: "Cosworth",
        **{s: "Toyota" for s in range(2007, 2010)},
        2010: "Cosworth", 2011: "Cosworth",
        2012: "Renault", 2013: "Renault",
        **{s: "Mercedes" for s in range(2014, 2027)},
    },
    "Red Bull Racing": {
        2005: "Cosworth",
        2006: "Ferrari",
        **{s: "Renault" for s in range(2007, 2016)},
        **{s: "TAG Heuer" for s in range(2016, 2019)},
        **{s: "Honda" for s in range(2019, 2022)},
        **{s: "Honda RBPT" for s in range(2022, 2026)},
        2026: "Red Bull Ford",
    },
    "Mercedes": {s: "Mercedes" for s in range(2010, 2027)},
    "Renault": {
        **{s: "Renault" for s in range(1977, 1986)},
        **{s: "Renault" for s in range(2002, 2012)},
        **{s: "Renault" for s in range(2016, 2021)},
    },
    "Alpine": {
        **{s: "Renault" for s in range(2021, 2026)},
        2026: "Mercedes",
    },
    "Aston Martin": {
        **{s: "Mercedes" for s in range(2021, 2026)},
        2026: "Honda",
    },
    "Force India": {
        2008: "Ferrari",
        **{s: "Mercedes" for s in range(2009, 2019)},
    },
    "Racing Point": {
        **{s: "BWT Mercedes" for s in range(2018, 2021)},
    },
    "Toro Rosso": {
        2006: "Cosworth",
        **{s: "Ferrari" for s in range(2007, 2014)},
        2014: "Renault", 2015: "Renault",
        2016: "Ferrari",
        2017: "Renault",
        2018: "Honda", 2019: "Honda",
    },
    "AlphaTauri": {
        2020: "Honda", 2021: "Honda",
        2022: "Honda RBPT", 2023: "Honda RBPT",
    },
    "RB": {
        2024: "Honda RBPT",
    },
    "Visa Cash App RB": {
        2024: "Honda RBPT", 2025: "Honda RBPT",
    },
    "Racing Bulls": {
        2025: "Honda RBPT",
        2026: "Red Bull Ford",
    },
    "Sauber": {
        1993: "Ilmor",
        1994: "Mercedes",
        1995: "Ford Cosworth", 1996: "Ford Cosworth",
        **{s: "Petronas" for s in range(1997, 2006)},
        **{s: "Ferrari" for s in range(2010, 2019)},
    },
    "Sauber Clássica": {
        **{s: "Petronas" for s in range(1997, 2006)},
    },
    "BMW Sauber": {
        **{s: "BMW" for s in range(2006, 2010)},
    },
    "Alfa Romeo": {
        **{s: "Ferrari" for s in range(2018, 2024)},
    },
    "Kick Sauber": {
        2024: "Ferrari", 2025: "Ferrari",
    },
    "Audi": {
        2026: "Audi",
    },
    "Haas": {
        **{s: "Ferrari" for s in range(2016, 2027)},
    },
    "Cadillac": {
        2026: "Ferrari",
    },
    "Benetton": {
        1986: "BMW",
        **{s: "Ford Cosworth" for s in range(1987, 1995)},
        **{s: "Renault" for s in range(1995, 1998)},
        **{s: "Playlife" for s in range(1998, 2001)},
        2001: "Renault",
    },
    "Jordan": {
        1991: "Ford Cosworth",
        1992: "Yamaha",
        1993: "Hart", 1994: "Hart",
        **{s: "Peugeot" for s in range(1995, 1998)},
        **{s: "Mugen-Honda" for s in range(1998, 2001)},
        2001: "Honda", 2002: "Honda",
        2003: "Ford Cosworth", 2004: "Ford Cosworth",
        2005: "Toyota",
    },
    "Lotus": {
        **{s: "Ford Cosworth" for s in range(1980, 1984)},
        **{s: "Renault" for s in range(1983, 1987)},
        1987: "Honda", 1988: "Honda",
        1989: "Judd",
        1990: "Lamborghini",
        1991: "Judd",
        1992: "Ford Cosworth", 1993: "Ford Cosworth",
        1994: "Mugen-Honda",
        2010: "Cosworth", 2011: "Renault",
    },
    "Team Lotus": {
        **{s: "Ford Cosworth" for s in range(1980, 1984)},
        **{s: "Renault" for s in range(1983, 1987)},
        1987: "Honda", 1988: "Honda",
        1989: "Judd",
        1990: "Lamborghini",
        1991: "Judd",
        1992: "Ford Cosworth", 1993: "Ford Cosworth",
        1994: "Mugen-Honda",
        2011: "Renault",
    },
    "Lotus F1": {
        **{s: "Renault" for s in range(2012, 2015)},
        2015: "Mercedes",
    },
    "Brabham": {
        1980: "Ford Cosworth", 1981: "Ford Cosworth",
        **{s: "BMW" for s in range(1982, 1988)},
        1989: "Judd", 1990: "Judd",
        1991: "Yamaha",
        1992: "Judd",
    },
    "Tyrrell": {
        **{s: "Ford Cosworth" for s in range(1980, 1986)},
        1985: "Renault", 1986: "Renault",
        **{s: "Ford Cosworth" for s in range(1987, 1991)},
        1991: "Honda",
        1992: "Ilmor",
        **{s: "Yamaha" for s in range(1993, 1997)},
        1997: "Ford Cosworth", 1998: "Ford Cosworth",
    },
    "Ligier": {
        1980: "Ford Cosworth",
        1981: "Matra", 1982: "Matra",
        1983: "Ford Cosworth",
        **{s: "Renault" for s in range(1984, 1987)},
        1987: "Megatron",
        1988: "Judd",
        1989: "Ford Cosworth", 1990: "Ford Cosworth",
        1991: "Lamborghini",
        **{s: "Renault" for s in range(1992, 1995)},
        1995: "Mugen-Honda", 1996: "Mugen-Honda",
    },
    "Minardi": {
        **{s: "Motori Moderni" for s in range(1985, 1988)},
        **{s: "Ford Cosworth" for s in range(1988, 1991)},
        1991: "Ferrari",
        1992: "Lamborghini",
        1993: "Ford Cosworth", 1994: "Ford Cosworth",
        1995: "Mugen-Honda",
        **{s: "Ford Cosworth" for s in range(1996, 2000)},
        2000: "Fondmetal",
        2001: "European",
        2002: "Asiatech",
        **{s: "Cosworth" for s in range(2003, 2006)},
    },
    "Arrows": {
        **{s: "Ford Cosworth" for s in range(1980, 1984)},
        **{s: "BMW" for s in range(1984, 1987)},
        1987: "Megatron", 1988: "Megatron",
        1989: "Ford Cosworth", 1990: "Ford Cosworth",
        1996: "Hart",
        1997: "Yamaha",
        1998: "Arrows", 1999: "Arrows",
        2000: "Supertec",
        2001: "Asiatech",
        2002: "Cosworth",
    },
    "Footwork": {
        1991: "Porsche",
        1992: "Mugen-Honda", 1993: "Mugen-Honda",
        1994: "Ford Cosworth", 1995: "Ford Cosworth",
        1996: "Hart",
    },
    "Prost": {
        1997: "Mugen-Honda",
        **{s: "Peugeot" for s in range(1998, 2001)},
        2001: "Acer",
    },
    "Stewart": {
        **{s: "Ford" for s in range(1997, 2000)},
    },
    "Jaguar": {
        **{s: "Cosworth" for s in range(2000, 2005)},
    },
    "BAR": {
        1999: "Supertec",
        **{s: "Honda" for s in range(2000, 2006)},
    },
    "Honda": {
        **{s: "Honda" for s in range(2006, 2009)},
    },
    "Brawn": {
        2009: "Mercedes",
    },
    "Toyota": {
        **{s: "Toyota" for s in range(2002, 2010)},
    },
    "Super Aguri": {
        **{s: "Honda" for s in range(2006, 2009)},
    },
    "Spyker": {
        2007: "Ferrari",
    },
    "MF1": {
        2006: "Toyota",
    },
    "Spyker MF1": {
        2006: "Toyota",
    },
    "Virgin": {
        2010: "Cosworth", 2011: "Cosworth",
    },
    "Marussia": {
        **{s: "Cosworth" for s in range(2012, 2014)},
        2014: "Ferrari",
    },
    "Manor Marussia": {
        2015: "Ferrari",
        2016: "Mercedes",
    },
    "Caterham": {
        **{s: "Renault" for s in range(2012, 2015)},
    },
    "HRT": {
        **{s: "Cosworth" for s in range(2010, 2013)},
    },
    "Larrousse": {
        1987: "Ford Cosworth", 1988: "Ford Cosworth",
        1989: "Lamborghini", 1990: "Lamborghini",
        1991: "Ford Cosworth",
        1992: "Lamborghini",
        1993: "Ford Cosworth", 1994: "Ford Cosworth",
    },
    "March": {
        1987: "Ford Cosworth", 1988: "Ford Cosworth",
        1989: "Judd", 1990: "Judd",
        1992: "Ilmor",
    },
    "Leyton House": {
        1990: "Judd",
        1991: "Ilmor",
    },
    "Dallara": {
        **{s: "Ford Cosworth" for s in range(1988, 1991)},
        1991: "Judd",
        1992: "Ferrari",
    },
    "Osella": {
        **{s: "Ford Cosworth" for s in range(1980, 1984)},
        **{s: "Alfa Romeo" for s in range(1984, 1989)},
        1989: "Ford Cosworth", 1990: "Ford Cosworth",
    },
    "Fondmetal": {
        1991: "Ford Cosworth", 1992: "Ford Cosworth",
    },
    "Simtek": {
        1994: "Ford Cosworth", 1995: "Ford Cosworth",
    },
    "Pacific": {
        1994: "Ilmor",
        1995: "Ford Cosworth",
    },
    "Forti": {
        1995: "Ford Cosworth", 1996: "Ford Cosworth",
    },
    "Andrea Moda": {
        1992: "Judd",
    },
    "Lambo": {
        1991: "Lamborghini",
    },
    "AGS": {
        1986: "Motori Moderni",
        **{s: "Ford Cosworth" for s in range(1987, 1992)},
    },
    "Euro Brun": {
        **{s: "Judd" for s in range(1988, 1991)},
    },
    "Rial": {
        1988: "Ford Cosworth", 1989: "Ford Cosworth",
    },
    "Onyx": {
        1989: "Ford Cosworth", 1990: "Ford Cosworth",
    },
    "Zakspeed": {
        **{s: "Zakspeed" for s in range(1985, 1989)},
        1989: "Yamaha",
    },
    "Coloni": {
        **{s: "Ford Cosworth" for s in range(1987, 1990)},
        1990: "Subaru",
        1991: "Ford Cosworth",
    },
    "RAM": {
        1983: "Ford Cosworth",
        1984: "Hart", 1985: "Hart",
    },
    "Spirit": {
        1983: "Honda",
        1984: "Hart", 1985: "Hart",
    },
    "Toleman": {
        **{s: "Hart" for s in range(1981, 1986)},
    },
    "ATS": {
        **{s: "Ford Cosworth" for s in range(1980, 1983)},
        1983: "BMW", 1984: "BMW",
    },
    "Theodore": {
        **{s: "Ford Cosworth" for s in range(1981, 1984)},
    },
    "Fittipaldi": {
        **{s: "Ford Cosworth" for s in range(1980, 1983)},
    },
    "Ensign": {
        **{s: "Ford Cosworth" for s in range(1980, 1983)},
    },
    "Shadow": {
        1980: "Ford Cosworth",
    },
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
    return list(range(2026, 1984, -1))


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
    team = Team.query.filter_by(name=name, series="f1").first()
    if team is None:
        team = Team(name=name)
        db.session.add(team)
        db.session.commit()
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
    db.session.commit()
    return circuit


def _upsert_driver(info):
    code = info.get("name_acronym") or None
    driver = Driver.query.filter_by(
        first_name=info.get("first_name"),
        last_name=info.get("last_name"),
        series="f1"
    ).first()
    if driver is None and code:
        # Fallback para o codigo APENAS se o nome nao for passado corretamente
        # e verificando para nao sobrescrever alguem com nome completamente diferente
        candidate = Driver.query.filter_by(code=code, series="f1").first()
        if candidate and (not info.get("first_name") or candidate.last_name == info.get("last_name")):
            driver = candidate

    if driver is None:
        driver = Driver(
            first_name=info.get("first_name") or "?",
            last_name=info.get("last_name") or "?",
        )
        if code and Driver.query.filter_by(code=code, series="f1").first() is None:
            driver.code = code
        db.session.add(driver)
    else:
        driver.first_name = info.get("first_name") or driver.first_name
        driver.last_name = info.get("last_name") or driver.last_name
        if code and driver.code is None:
            if Driver.query.filter_by(code=code, series="f1").first() is None:
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
    db.session.commit()
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
    db.session.commit()


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

    race = Race.query.filter_by(season=season, round=round_, series="f1").first()
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
        race = Race(season=season, round=round_, series="f1")
        db.session.add(race)
    race.name = meeting["meeting_name"]
    race.date = _parse_dt(meeting["date_start"]).date()
    db.session.commit()

    RaceResult.query.filter_by(race_id=race.id).delete()
    db.session.commit()

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
    db.session.commit()

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
    db.session.commit()
    return driver, team


def _sync_jolpica_race(entry, season, round_):
    race = Race.query.filter_by(season=season, round=round_, series="f1").first()
    if race is None:
        race = Race(season=season, round=round_, series="f1")
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
    db.session.commit()

    RaceResult.query.filter_by(race_id=race.id).delete()
    db.session.commit()
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
    db.session.commit()


def _sync_season_jolpica(season, force=False):
    calendar = ergast.get(str(season))
    if not calendar:
        return 0
        
    today = date.today()
    if not force and season < today.year:
        count = Race.query.filter_by(season=season).count()
        if count >= len(calendar):
            return count
        else:
            force = True

    if force:
        for race in Race.query.filter_by(season=season).all():
            db.session.delete(race)
        db.session.commit()

    imported = 0
    for round_ in sorted(int(r["round"]) for r in calendar):
        if Race.query.filter_by(season=season, round=round_).first():
            continue
            
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
            race = Race.query.filter_by(season=season, round=round_, series="f1").first()
            if race is not None:
                _store_sprint_points(race.id, entries)
        imported += 1
    db.session.commit()
    return imported


def normalize_teams():
    """Mescla linhas duplicadas de equipe que diferem apenas pelo alias."""
    changed = False
    for alias, canonical in TEAM_ALIASES.items():
        dup = Team.query.filter_by(name=alias, series="f1").first()
        if dup is None:
            continue
        target = Team.query.filter_by(name=canonical, series="f1").first()
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
    db.session.commit()
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

    for driver in Driver.query.filter_by(series="f1").all():
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
    for team in Team.query.filter_by(series="f1").all():
        meta = TEAM_METADATA.get(team.name)
        if meta is None:
            continue
        base_city, base_country, engine, founded = meta
        if team.base_city is None:
            team.base_city = base_city
            changed = True
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
        
    by_name = {}
    for r in rows:
        if r.get("headshot_url") and r.get("last_name"):
            by_name[(r.get("first_name", ""), r.get("last_name"))] = r["headshot_url"]
            
    updated = False
    for driver in Driver.query.filter(Driver.headshot_url.is_(None)).all():
        url = by_name.get((driver.first_name, driver.last_name))
        if url:
            driver.headshot_url = url
            updated = True
    if updated:
        db.session.commit()


def run_fixups():
    try:
        from .api.fantasy_engine import calculate_fantasy_points_internal
        calculate_fantasy_points_internal()
    except Exception as e:
        pass
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
        except Exception as exc:
            db.session.rollback()
            import logging
            logging.error(f'Sync error: {exc}')
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
