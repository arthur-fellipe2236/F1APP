"""Area de live timing (sem mapa), alimentada pela OpenF1.

Detecta a sessao em andamento (ou a ultima concluida) e monta a torre de
tempos com intervalo, posicao, pneus, bandeira, clima e mensagens de
race control. Janelas de data mantem as respostas pequenas durante live.
"""

import time
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request

from .. import openf1
from .helpers import ApiError, parse_int

bp = Blueprint("live", __name__)

LIVE_BUFFER = timedelta(minutes=15)
WINDOW = timedelta(minutes=7)

# Torres de sessoes encerradas sao imutaveis: cache para trocar de etapa
# instantaneamente. Live nunca e cacheado; agendadas tem cache curto.
_finished_towers = {}
_scheduled_towers = {}
SCHEDULED_CACHE_SECONDS = 120

# Metadados de sessoes/reunioes mudam raramente: cache de 5 min para nao
# esgotar o rate limit da OpenF1 ao navegar entre praticas/qualys.
_CACHE_TTL = 300
_meta_cache = {}


def _cached(key, loader):
    now = time.time()
    hit = _meta_cache.get(key)
    if hit and now - hit[0] < _CACHE_TTL:
        return hit[1]
    value = loader()
    _meta_cache[key] = (now, value)
    return value


def _parse_dt(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _now_utc():
    return datetime.now(timezone.utc)


def _sessions_for_year(year):
    return _cached(
        ("sessions", year),
        lambda: openf1.get("sessions", year=year) or [],
    )


def _meetings_for_year(year):
    return _cached(
        ("meetings", year),
        lambda: {
            m["meeting_key"]: m.get("meeting_name")
            for m in (openf1.get("meetings", year=year) or [])
        },
    )


def _session_by_key(session_key):
    key = ("session", session_key)
    now = time.time()
    hit = _meta_cache.get(key)
    if hit and now - hit[0] < _CACHE_TTL:
        return hit[1]
    for year in (_now_utc().year, _now_utc().year - 1):
        found = next(
            (
                s
                for s in _sessions_for_year(year)
                if s["session_key"] == session_key
            ),
            None,
        )
        if found:
            _meta_cache[key] = (now, found)
            return found
    return None


def detect_session(now=None):
    """Sessao ao vivo atual ou a mais recente ja encerrada (ignora futuras)."""
    now = now or _now_utc()
    for y in (now.year, now.year - 1):
        sessions = _sessions_for_year(y)
        live = [
            session
            for session in sessions
            if session_state(session, now) == "live"
        ]
        if live:
            return max(live, key=lambda s: _parse_dt(s["date_start"])), "live"
        ended = [
            session
            for session in sessions
            if session_state(session, now) == "finished"
        ]
        if ended:
            return max(ended, key=lambda s: _parse_dt(s["date_end"])), "finished"
    return None, None


def _latest_by_driver(rows):
    latest = {}
    for row in rows:
        number = row["driver_number"]
        current = latest.get(number)
        if current is None or str(row.get("date", "")) >= str(
            current.get("date", "")
        ):
            latest[number] = row
    return latest


def session_state(session, now=None):
    now = now or _now_utc()
    start = _parse_dt(session["date_start"])
    end = _parse_dt(session.get("date_end") or session["date_start"])
    if start > now + timedelta(minutes=30):
        return "scheduled"
    if end + LIVE_BUFFER >= now:
        return "live"
    return "finished"


def _scheduled_tower(session):
    """Sessao futura: sem tempos ainda; mostra apenas o grid previsto."""
    drivers = openf1.get("drivers", session_key=session["session_key"]) or []
    return {
        "session": {
            "key": session["session_key"],
            "name": session.get("session_name"),
            "type": session.get("session_type"),
            "year": session.get("year"),
            "circuit": session.get("circuit_short_name"),
            "country": session.get("country_name"),
            "location": session.get("location"),
            "meeting_name": _meetings_for_year(session["year"]).get(
                session["meeting_key"]
            ),
            "date_start": session["date_start"],
            "date_end": session["date_end"],
            "state": "scheduled",
            "live": False,
        },
        "flag": None,
        "current_lap": None,
        "drivers": [
            {
                "driver_number": d["driver_number"],
                "name": d.get("full_name") or d.get("broadcast_name") or "",
                "code": d.get("name_acronym"),
                "team": d.get("team_name"),
                "team_colour": d.get("team_colour"),
                "position": None,
                "gap_to_leader": None,
                "interval": None,
                "lap_number": None,
                "compound": None,
                "stops": 0,
                "last_lap": None,
            }
            for d in drivers
        ],
        "weather": {},
        "messages": [],
        "updated_at": _now_utc().isoformat(),
    }

def _windowed(path, session_key, date_start, date_end, minutes=(45,)):
    rows = []
    for window in minutes:
        cutoff = (date_end - timedelta(minutes=window)).isoformat()
        rows = openf1.get(
            path, session_key=session_key, **{"date>=": cutoff}
        ) or []
        if rows:
            return rows
    return openf1.get(
        path, session_key=session_key, **{"date>=": date_start}
    ) or []


def _build_tower(session, state):
    sk = session["session_key"]
    now = _now_utc()
    live = state == "live"
    date_end = _parse_dt(session["date_end"])
    start_iso = session["date_start"]
    has_gaps = (session.get("session_name") or "").lower() in {
        "race",
        "sprint",
    }

    if live:
        cutoff = (now - WINDOW).isoformat()
        intervals = openf1.get(
            "intervals", session_key=sk, **{"date>=": cutoff}
        ) or []
        positions = openf1.get(
            "position", session_key=sk, **{"date>=": cutoff}
        ) or []
        race_rows = openf1.get(
            "race_control", session_key=sk, **{"date>=": cutoff}
        ) or []
        weather = openf1.get(
            "weather", session_key=sk, **{"date>=": cutoff}
        ) or []
    else:
        intervals = (
            _windowed("intervals", sk, start_iso, date_end)
            if has_gaps
            else []
        )
        positions = []
        race_rows = (
            openf1.get(
                "race_control", session_key=sk, **{"date>=": start_iso}
            )
            or []
        ) if has_gaps else []
        weather = openf1.get(
            "weather", session_key=sk, **{"date>=": start_iso}
        ) or []

    stints = openf1.get("stints", session_key=sk) or []
    drivers = openf1.get("drivers", session_key=sk) or []

    final_position = {}
    final_laps = {}
    if not live:
        for row in openf1.get("session_result", session_key=sk) or []:
            final_position[row["driver_number"]] = row.get("position")
            final_laps[row["driver_number"]] = row.get("number_of_laps")

    intervals_by = _latest_by_driver(intervals)
    positions_by = _latest_by_driver(positions)
    driver_by = {d["driver_number"]: d for d in drivers}
    flags = [r for r in race_rows if r.get("category") == "Flag"]
    messages = [
        r for r in race_rows if r.get("category") == "SessionStatus"
    ]

    stint_by = {}
    for stint in stints:
        number = stint["driver_number"]
        best = stint_by.get(number)
        if best is None or stint["stint_number"] > best["stint_number"]:
            stint_by[number] = stint

    numbers = sorted(
        set(intervals_by)
        | set(positions_by)
        | set(driver_by)
        | set(final_position),
    )
    rows = []
    for number in numbers:
        info = driver_by.get(number, {})
        interval = intervals_by.get(number) or {}
        position = positions_by.get(number) or {}
        stint = stint_by.get(number) or {}
        position_value = final_position.get(number)
        if position_value is None:
            position_value = position.get("position")
        lap_value = final_laps.get(number)
        if lap_value is None:
            lap_value = interval.get("lap_number") or stint.get("lap_end")
        rows.append(
            {
                "driver_number": number,
                "name": info.get("full_name")
                or info.get("broadcast_name")
                or str(number),
                "code": info.get("name_acronym"),
                "team": info.get("team_name"),
                "team_colour": info.get("team_colour"),
                "position": position_value,
                "gap_to_leader": interval.get("gap_to_leader"),
                "interval": interval.get("interval"),
                "lap_number": lap_value,
                "compound": stint.get("compound"),
                "stops": max(stint.get("stint_number", 1) - 1, 0)
                if stint
                else 0,
                "last_lap": stint.get("lap_end"),
            }
        )

    def order_key(row):
        pos = row.get("position")
        return (pos is None, pos if pos is not None else 999)

    rows.sort(key=order_key)

    flag_value = None
    if flags:
        flag_value = sorted(
            flags, key=lambda f: str(f.get("date", ""))
        )[-1].get("flag")
    weather_last = {}
    if weather:
        weather_last = sorted(
            weather, key=lambda w: str(w.get("date", ""))
        )[-1]

    laps = [
        r["lap_number"] for r in rows if isinstance(r["lap_number"], int)
    ]

    return {
        "session": {
            "key": sk,
            "name": session.get("session_name"),
            "type": session.get("session_type"),
            "year": session.get("year"),
            "circuit": session.get("circuit_short_name"),
            "country": session.get("country_name"),
            "location": session.get("location"),
            "meeting_name": _meetings_for_year(session["year"]).get(
                session["meeting_key"]
            ),
            "date_start": session["date_start"],
            "date_end": session["date_end"],
            "state": state,
            "live": state == "live",
        },
        "flag": flag_value,
        "current_lap": max(laps) if laps else None,
        "drivers": rows,
        "weather": {
            "air_temperature": weather_last.get("air_temperature"),
            "track_temperature": weather_last.get("track_temperature"),
            "wind_speed": weather_last.get("wind_speed"),
            "humidity": weather_last.get("relative_humidity"),
            "rainfall": weather_last.get("rainfall"),
        },
        "messages": [
            {
                "date": m.get("date"),
                "message": m.get("message"),
                "flag": m.get("flag"),
            }
            for m in sorted(
                messages, key=lambda m: str(m.get("date", ""))
            )[-6:]
        ],
        "updated_at": now.isoformat(),
    }


@bp.get("/live/tower")
def live_tower():
    """
    Torre de tempos ao vivo (sem mapa)
    ---
    tags:
      - Live
    parameters:
      - in: query
        name: session_key
        schema:
          type: integer
        description: "Sessao especifica (padrao: atual ou ultima encerrada)"
    responses:
      200:
        description: Torre de tempos com sessao, bandeira, clima e mensagens
        content:
          application/json:
            schema:
              type: object
              properties:
                session:
                  type: object
                flag:
                  type: string
                  nullable: true
                current_lap:
                  type: integer
                  nullable: true
                drivers:
                  type: array
                  items:
                    type: object
                weather:
                  type: object
                messages:
                  type: array
                  items:
                    type: object
      404:
        description: Nenhuma sessao disponivel
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    now = _now_utc()
    requested = parse_int(request.args.get("session_key"), "session_key")
    detected = None
    state = None
    if requested:
        detected = _session_by_key(requested)
        if detected is not None:
            state = session_state(detected, now)
    else:
        detected, state = detect_session(now)
    if detected is None:
        raise ApiError("Nenhuma sessao disponivel no momento", 404)
    sk = detected["session_key"]
    if state == "finished" and sk in _finished_towers:
        return jsonify(_finished_towers[sk])
    if state == "scheduled":
        cached = _scheduled_towers.get(sk)
        if cached and time.time() - cached[0] < SCHEDULED_CACHE_SECONDS:
            return jsonify(cached[1])
    try:
        if state == "scheduled":
            tower = _scheduled_tower(detected)
            if len(_scheduled_towers) > 60:
                _scheduled_towers.clear()
            _scheduled_towers[sk] = (time.time(), tower)
            return jsonify(tower)
        tower = _build_tower(detected, state)
    except openf1.OpenF1Error as exc:
        raise ApiError(f"OpenF1 indisponivel: {exc}", 503)
    if state == "finished":
        if len(_finished_towers) > 60:
            _finished_towers.clear()
        _finished_towers[sk] = tower
    return jsonify(tower)


@bp.get("/live/sessions")
def live_sessions():
    """
    Corridas e sessoes de uma temporada para o live timing
    ---
    tags:
      - Live
    parameters:
      - in: query
        name: year
        schema:
          type: integer
          example: 2026
        description: "Temporada (padrao: ano corrente)"
    responses:
      200:
        description: >-
          GPs da temporada em ordem de calendario, cada um com suas
          sessoes e estado (scheduled/live/finished)
        content:
          application/json:
            schema:
              type: object
              properties:
                year:
                  type: integer
                data:
                  type: array
                  items:
                    type: object
      503:
        description: OpenF1 indisponivel
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    now = _now_utc()
    year = parse_int(request.args.get("year"), "year") or now.year
    try:
        meetings = [
            m
            for m in _cached(
                ("meetingsraw", year),
                lambda: openf1.get("meetings", year=year) or [],
            )
            if str(m.get("meeting_name", "")).endswith("Grand Prix")
            and not m.get("is_cancelled")
        ]
        sessions = _sessions_for_year(year)
    except openf1.OpenF1Error as exc:
        raise ApiError(f"OpenF1 indisponivel: {exc}", 503)

    meetings.sort(key=lambda m: m["date_start"])
    by_meeting = {}
    for session in sessions:
        by_meeting.setdefault(session["meeting_key"], []).append(session)

    data = []
    for round_, meeting in enumerate(meetings, start=1):
        meeting_sessions = sorted(
            by_meeting.get(meeting["meeting_key"], []),
            key=lambda s: s["date_start"],
        )
        data.append(
            {
                "meeting_key": meeting["meeting_key"],
                "round": round_,
                "meeting_name": meeting["meeting_name"],
                "circuit": meeting.get("circuit_short_name"),
                "country": meeting.get("country_name"),
                "location": meeting.get("location"),
                "date_start": meeting["date_start"],
                "date_end": meeting["date_end"],
                "sessions": [
                    {
                        "key": s["session_key"],
                        "name": s.get("session_name"),
                        "type": s.get("session_type"),
                        "date_start": s["date_start"],
                        "date_end": s["date_end"],
                        "state": session_state(s, now),
                    }
                    for s in meeting_sessions
                ],
            }
        )
    return jsonify({"year": year, "data": data})
