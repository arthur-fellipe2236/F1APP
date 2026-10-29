"""Regras historicas oficiais da FIA para o Campeonato Mundial de F1.

- Descartes de resultados (pilotos e construtores) de 1950 a 1990.
- Construtores: Copa oficial so existe a partir de 1958; de 1958 a 1978
  apenas o carro mais bem colocado de cada construtor pontua por corrida;
  pontos de volta mais rapida (1950-1959) nao contam para construtores;
  as 500 Milhas de Indianapolis nao contavam para construtores.
"""
from collections import defaultdict

# ("best", N) -> soma dos N melhores resultados
# ("split", corte, melhores_1a_metade, melhores_2a_metade)
DRIVER_DROP_RULES = {}
for _y in range(1950, 1954):
    DRIVER_DROP_RULES[_y] = ("best", 4)
for _y in range(1954, 1958):
    DRIVER_DROP_RULES[_y] = ("best", 5)
DRIVER_DROP_RULES.update({
    1958: ("best", 6),
    1959: ("best", 5),
    1960: ("best", 6),
    1961: ("best", 5),
    1962: ("best", 5),
    1963: ("best", 6),
    1964: ("best", 6),
    1965: ("best", 6),
    1966: ("best", 5),
    1967: ("split", 6, 5, 4),
    1968: ("split", 6, 5, 5),
    1969: ("split", 6, 5, 4),
    1970: ("split", 7, 6, 5),
    1971: ("split", 6, 5, 4),
    1972: ("split", 6, 5, 5),
    1973: ("split", 8, 7, 6),
    1974: ("split", 8, 7, 6),
    1975: ("split", 7, 6, 6),
    1976: ("split", 8, 7, 7),
    1977: ("split", 9, 8, 7),
    1978: ("split", 8, 7, 7),
    1979: ("split", 7, 4, 4),
    1980: ("split", 7, 5, 5),
})
for _y in range(1981, 1991):
    DRIVER_DROP_RULES[_y] = ("best", 11)

# Construtores: descartes ate 1978; a partir de 1979 todos os pontos contam.
TEAM_DROP_RULES = {y: r for y, r in DRIVER_DROP_RULES.items() if 1958 <= y <= 1978}

FIRST_CONSTRUCTORS_SEASON = 1958
BEST_CAR_ONLY_LAST_SEASON = 1978
FASTEST_LAP_POINT_LAST_SEASON = 1959


def is_indy500(race_name):
    return bool(race_name) and "indianapolis" in race_name.lower()


def apply_drop_rule(rule, results):
    """results: lista de (indice_corrida_1_based, pontos)."""
    if not rule:
        return sum(p for _, p in results)
    if rule[0] == "best":
        return sum(sorted((p for _, p in results), reverse=True)[: rule[1]])
    _, cut, best_a, best_b = rule
    first = sorted((p for i, p in results if i <= cut), reverse=True)[:best_a]
    second = sorted((p for i, p in results if i > cut), reverse=True)[:best_b]
    return sum(first) + sum(second)


def historical_driver_points(season, rows):
    """rows: iteravel de (driver_id, race_index, points). Retorna {driver_id: pontos}."""
    rule = DRIVER_DROP_RULES.get(season)
    per_driver = defaultdict(list)
    for driver_id, race_idx, pts in rows:
        per_driver[driver_id].append((race_idx, float(pts or 0)))
    return {d: apply_drop_rule(rule, res) for d, res in per_driver.items()}


POINTS_1950S = {1: 8.0, 2: 6.0, 3: 4.0, 4: 3.0, 5: 2.0}


def historical_team_points(season, rows):
    """rows: iteravel de (team_id, race_id, race_index, race_name, points, position).

    Retorna {team_id: pontos} seguindo as regras oficiais da epoca.
    """
    rule = TEAM_DROP_RULES.get(season)
    best_car_only = season <= BEST_CAR_ONLY_LAST_SEASON
    per_race = defaultdict(lambda: defaultdict(list))
    race_index = {}
    for team_id, race_id, race_idx, race_name, pts, position in rows:
        if team_id is None or is_indy500(race_name):
            continue
        p = float(pts or 0)
        if season <= FASTEST_LAP_POINT_LAST_SEASON:
            # Remove o ponto extra da volta mais rapida (nao valia para construtores)
            p = min(p, POINTS_1950S.get(position or 0, 0.0))
        race_index[race_id] = race_idx
        per_race[race_id][team_id].append(p)

    per_team = defaultdict(list)
    for race_id, teams in per_race.items():
        for team_id, pts_list in teams.items():
            score = max(pts_list) if best_car_only else sum(pts_list)
            per_team[team_id].append((race_index[race_id], score))
    return {t: apply_drop_rule(rule, res) for t, res in per_team.items()}
