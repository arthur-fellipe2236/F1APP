"""Seed ilustrativo das temporadas 2022 a 2026 (dados demonstrativos).

A temporada 2024 e curada manualmente; as demais (2022, 2023, 2025 e 2026)
sao geradas de forma deterministica a partir dos mesmos circuitos, com os
20 pilotos marcados em cada corrida. Temporadas em andamento (datas futuras)
recebem apenas as corridas ja disputadas.
"""

import random
from datetime import date

from .extensions import db
from .models import Circuit, Driver, Race, RaceResult, Team

TEAMS = [
    ("Red Bull Racing", "Austria", "Honda RBPT", 2005),
    ("Ferrari", "Italia", "Ferrari", 1950),
    ("McLaren", "Reino Unido", "Mercedes", 1963),
    ("Mercedes", "Alemanha", "Mercedes", 2010),
    ("Aston Martin", "Reino Unido", "Mercedes", 2009),
    ("Alpine", "Fraca", "Renault", 2002),
    ("Williams", "Reino Unido", "Mercedes", 1977),
    ("RB", "Italia", "Honda RBPT", 2006),
    ("Kick Sauber", "Suica", "Ferrari", 1993),
    ("Haas", "Estados Unidos", "Ferrari", 2014),
]

# (primeiro, ultimo, code, numero, nacionalidade, equipe)
DRIVERS = [
    ("Max", "Verstappen", "VER", 1, "Neerlandes", "Red Bull Racing"),
    ("Sergio", "Perez", "PER", 11, "Mexicano", "Red Bull Racing"),
    ("Charles", "Leclerc", "LEC", 16, "Monegasco", "Ferrari"),
    ("Carlos", "Sainz", "SAI", 55, "Espanhol", "Ferrari"),
    ("Lando", "Norris", "NOR", 4, "Britanico", "McLaren"),
    ("Oscar", "Piastri", "PIA", 81, "Australiano", "McLaren"),
    ("Lewis", "Hamilton", "HAM", 44, "Britanico", "Mercedes"),
    ("George", "Russell", "RUS", 63, "Britanico", "Mercedes"),
    ("Fernando", "Alonso", "ALO", 14, "Espanhol", "Aston Martin"),
    ("Lance", "Stroll", "STR", 18, "Canadense", "Aston Martin"),
    ("Pierre", "Gasly", "GAS", 10, "Frances", "Alpine"),
    ("Esteban", "Ocon", "OCO", 31, "Frances", "Alpine"),
    ("Alexander", "Albon", "ALB", 23, "Tailandes", "Williams"),
    ("Logan", "Sargeant", "SAR", 2, "Estadunidense", "Williams"),
    ("Yuki", "Tsunoda", "TSU", 22, "Japones", "RB"),
    ("Daniel", "Ricciardo", "RIC", 3, "Australiano", "RB"),
    ("Valtteri", "Bottas", "BOT", 77, "Finlandes", "Kick Sauber"),
    ("Zhou", "Guanyu", "ZHO", 24, "Chines", "Kick Sauber"),
    ("Nico", "Hulkenberg", "HUL", 27, "Alemao", "Haas"),
    ("Kevin", "Magnussen", "MAG", 20, "Dinamarques", "Haas"),
]

# (nome, cidade, pais, km, voltas)
CIRCUITS = [
    ("Bahrain International Circuit", "Sakhir", "Bahrein", 5.412, 57),
    ("Jeddah Corniche Circuit", "Jida", "Arabia Saudita", 6.174, 50),
    ("Circuit de Monaco", "Monte Carlo", "Monaco", 3.337, 78),
    ("Circuit Gilles-Villeneuve", "Montreal", "Canada", 4.361, 70),
    ("Circuit de Barcelona-Catalunya", "Barcelona", "Espanha", 4.657, 71),
    ("Red Bull Ring", "Spielberg", "Austria", 4.318, 71),
    ("Silverstone Circuit", "Silverstone", "Reino Unido", 5.891, 52),
    ("Circuit de Spa-Francorchamps", "Spa", "Belgica", 7.004, 44),
    ("Autodromo Nazionale Monza", "Monza", "Italia", 5.793, 53),
    ("Yas Marina Circuit", "Abu Dhabi", "Emirados Arabes Unidos", 5.554, 58),
]

# (round, nome, data, chave do circuito, top-10 por codigo de piloto)
RACES = [
    (1, "Bahrain Grand Prix", "2024-03-02", "Bahrain International Circuit",
     ["VER", "ALO", "HAM", "NOR", "RUS", "PER", "SAI", "LEC", "GAS", "MAG"]),
    (2, "Saudi Arabian Grand Prix", "2024-03-09", "Jeddah Corniche Circuit",
     ["HAM", "VER", "PER", "RUS", "SAI", "LEC", "NOR", "PIA", "GAS", "HUL"]),
    (5, "Monaco Grand Prix", "2024-05-26", "Circuit de Monaco",
     ["SAI", "LEC", "NOR", "VER", "PER", "GAS", "STR", "HAM", "ALB", "RUS"]),
    (7, "Canadian Grand Prix", "2024-06-09", "Circuit Gilles-Villeneuve",
     ["NOR", "RUS", "TSU", "HAM", "ALO", "PER", "VER", "PIA", "SAI", "LEC"]),
    (9, "Spanish Grand Prix", "2024-06-23", "Circuit de Barcelona-Catalunya",
     ["VER", "NOR", "HAM", "GAS", "PIA", "LEC", "SAI", "STR", "ALB", "HUL"]),
    (11, "Austrian Grand Prix", "2024-06-30", "Red Bull Ring",
     ["RUS", "VER", "LEC", "NOR", "HAM", "SAI", "PIA", "PER", "GAS", "ALB"]),
    (12, "British Grand Prix", "2024-07-07", "Silverstone Circuit",
     ["HAM", "VER", "PIA", "NOR", "LEC", "SAI", "RUS", "PER", "HUL", "BOT"]),
    (14, "Belgian Grand Prix", "2024-07-28", "Circuit de Spa-Francorchamps",
     ["LEC", "PIA", "VER", "NOR", "SAI", "HAM", "RUS", "PER", "ALB", "STR"]),
    (16, "Italian Grand Prix", "2024-09-01", "Autodromo Nazionale Monza",
     ["LEC", "NOR", "PIA", "VER", "HAM", "SAI", "RUS", "PER", "GAS", "ALB"]),
    (24, "Abu Dhabi Grand Prix", "2024-12-08", "Yas Marina Circuit",
     ["HAM", "NOR", "PIA", "VER", "LEC", "SAI", "RUS", "PER", "GAS", "HUL"]),
]

POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

GENERATED_SEASONS = [2022, 2023, 2025, 2026]


def _driver_codes():
    return [code for _first, _last, code, _number, _nat, _team in DRIVERS]


def _season_strength(season):
    """Ordem de forca dos pilotos na temporada (deterministica)."""
    rng = random.Random(f"f1-seed-{season}")
    order = _driver_codes()
    rng.shuffle(order)
    return order


def _race_finish_order(season, round_):
    """Ordem de chegada: variacao da ordem de forca da temporada."""
    order = _season_strength(season)
    rng = random.Random(f"f1-seed-{season}-{round_}")
    for i in range(0, len(order) - 1, 2):
        if rng.random() < 0.5:
            order[i], order[i + 1] = order[i + 1], order[i]
    for _ in range(4):
        a, b = rng.sample(range(len(order)), 2)
        order[a], order[b] = order[b], order[a]
    return order


def _race_grid_order(season, round_, finish_order):
    rng = random.Random(f"f1-seed-grid-{season}-{round_}")
    grid = finish_order[:]
    for i in range(0, len(grid) - 1, 2):
        if rng.random() < 0.4:
            grid[i], grid[i + 1] = grid[i + 1], grid[i]
    return grid


def season_race_dates(season, today=None):
    """Corridas da temporada ja disputadas (datas derivadas do calendario 2024)."""
    today = today or date.today()
    races = []
    for round_, name, race_date, circuit_key, _order in RACES:
        when = date.fromisoformat(f"{season}-{race_date[5:]}")
        if when > today:
            continue
        races.append((round_, name, when, circuit_key))
    return races


def _seed_season(season, drivers, circuits):
    if Race.query.filter_by(season=season).first() is not None:
        return

    for round_, name, race_date, circuit_key in season_race_dates(season):
        finish_order = _race_finish_order(season, round_)
        grid_positions = {
            code: position
            for position, code in enumerate(
                _race_grid_order(season, round_, finish_order), start=1
            )
        }
        fastest = random.Random(f"f1-seed-fl-{season}-{round_}").choice(
            finish_order[:5]
        )
        race = Race(
            season=season, round=round_, name=name,
            date=race_date, circuit_id=circuits[circuit_key].id,
        )
        db.session.add(race)
        db.session.flush()
        for position, code in enumerate(finish_order, start=1):
            db.session.add(
                RaceResult(
                    race_id=race.id,
                    driver_id=drivers[code].id,
                    team_id=drivers[code].team_id,
                    position=position,
                    points=POINTS[position - 1] if position <= len(POINTS) else 0,
                    grid=grid_positions[code],
                    laps=circuits[circuit_key].laps,
                    status="finished",
                    fastest_lap=code == fastest,
                )
            )
    db.session.commit()


def _seed_base():
    teams = {
        name: Team(
            name=name, base_country=country,
            engine_manufacturer=engine, founded_year=founded,
        )
        for name, country, engine, founded in TEAMS
    }
    db.session.add_all(teams.values())
    db.session.flush()

    drivers = {}
    for first, last, code, number, nationality, team_name in DRIVERS:
        driver = Driver(
            first_name=first, last_name=last, code=code,
            permanent_number=number, nationality=nationality,
            team_id=teams[team_name].id if team_name in teams else None,
        )
        drivers[code] = driver
        db.session.add(driver)

    circuits = {}
    for name, city, country, length_km, laps in CIRCUITS:
        circuit = Circuit(
            name=name, city=city, country=country,
            length_km=length_km, laps=laps,
        )
        circuits[name] = circuit
        db.session.add(circuit)

    db.session.flush()

    for round_, name, race_date, circuit_key, order in RACES:
        race = Race(
            season=2024, round=round_, name=name,
            date=date.fromisoformat(race_date),
            circuit_id=circuits[circuit_key].id,
        )
        db.session.add(race)
        db.session.flush()
        for position, code in enumerate(order, start=1):
            db.session.add(
                RaceResult(
                    race_id=race.id,
                    driver_id=drivers[code].id,
                    team_id=drivers[code].team_id,
                    position=position,
                    points=POINTS[position - 1],
                    grid=position,
                    laps=circuits[circuit_key].laps,
                    status="finished",
                )
            )
    db.session.commit()


def _ensure_seed_entities():
    """Garante equipes/pilotos/circuitos do seed mesmo em bancos com dados reais."""
    teams = {team.name: team for team in Team.query.all()}
    for name, country, engine, founded in TEAMS:
        if name not in teams:
            team = Team(
                name=name, base_country=country,
                engine_manufacturer=engine, founded_year=founded,
            )
            teams[name] = team
            db.session.add(team)
    db.session.flush()

    codes = {code for _f, _l, code, _n, _nat, _t in DRIVERS}
    drivers = {driver.code: driver for driver in Driver.query.all()}
    for first, last, code, number, nationality, team_name in DRIVERS:
        if code in drivers:
            continue
        driver = Driver(
            first_name=first, last_name=last, code=code,
            nationality=nationality, team_id=teams[team_name].id,
        )
        holder = Driver.query.filter_by(permanent_number=number).first()
        if holder is None:
            driver.permanent_number = number
        drivers[code] = driver
        db.session.add(driver)

    circuits = {circuit.name: circuit for circuit in Circuit.query.all()}
    for name, city, country, length_km, laps in CIRCUITS:
        if name not in circuits:
            circuit = Circuit(
                name=name, city=city, country=country,
                length_km=length_km, laps=laps,
            )
            circuits[name] = circuit
            db.session.add(circuit)

    db.session.flush()
    return drivers, circuits


def ensure_demo_season(season):
    """Garante dados demonstrativos de uma temporada (cria a base se preciso)."""
    if Team.query.first() is None:
        _seed_base()
        drivers = {driver.code: driver for driver in Driver.query.all()}
        circuits = {circuit.name: circuit for circuit in Circuit.query.all()}
    else:
        drivers, circuits = _ensure_seed_entities()
    _seed_season(season, drivers, circuits)


def seed():
    if Team.query.first() is None:
        _seed_base()
    for season in GENERATED_SEASONS:
        ensure_demo_season(season)
