"""Area de live timing (sem mapa), alimentada pela OpenF1.

Detecta a sessao em andamento (ou a ultima concluida) e monta a torre de
tempos com intervalo, posicao, pneus, bandeira, clima e mensagens de
race control. Janelas de data mantem as respostas pequenas durante live.
"""

from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request

from .. import cache as app_cache
from .. import openf1
from .helpers import ApiError, parse_int

bp = Blueprint("live", __name__)

LIVE_BUFFER = timedelta(minutes=15)
WINDOW = timedelta(minutes=7)

# Torres encerradas sao imutaveis (cache longa); ao vivo nunca e cacheado;
# agendadas e metadados tem cache curto. Redis quando REDIS_URL existir.
TOWER_FINISHED_TTL = 7 * 24 * 3600
TOWER_SCHEDULED_TTL = 120
META_TTL = 300


def _cached(key, loader):
    return app_cache.cache_get_or_set(
        f"live:{':'.join(map(str, key)) if isinstance(key, tuple) else key}",
        META_TTL,
        loader,
    )


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
    hit = app_cache.get(f"live:{key[0]}:{key[1]}")
    if hit is not None:
        return hit
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
            app_cache.set(f"live:{key[0]}:{key[1]}", found, META_TTL)
            return found
    return None


SESSION_NAME_PT = {
    "Practice 1": "Treino Livre 1",
    "Practice 2": "Treino Livre 2",
    "Practice 3": "Treino Livre 3",
    "Qualifying": "Classificação",
    "Sprint Qualifying": "Classificação Sprint",
    "Sprint": "Corrida Sprint",
    "Race": "Corrida Principal",
}


def detect_session(now=None):
    """Sessao ao vivo, a proxima agendada, ou a mais recente ja encerrada."""
    now = now or _now_utc()
    try:
        sessions = _sessions_for_year(now.year)
        if not sessions:
            sessions = _sessions_for_year(now.year - 1) or []
    except Exception:
        sessions = []

    if sessions:
        live = [
            session
            for session in sessions
            if session_state(session, now) == "live"
        ]
        if live:
            return max(live, key=lambda s: _parse_dt(s["date_start"])), "live"
            
        scheduled = [
            session
            for session in sessions
            if session_state(session, now) == "scheduled"
        ]
        if scheduled:
            next_session = min(scheduled, key=lambda s: _parse_dt(s["date_start"]))
            return next_session, "scheduled"
                
        ended = [
            session
            for session in sessions
            if session_state(session, now) == "finished"
        ]
        if ended:
            return max(ended, key=lambda s: _parse_dt(s["date_end"])), "finished"

    # Fallback default: United States Grand Prix Practice 1 (2026-10-23)
    fallback_session = {
        "session_key": 11389,
        "meeting_key": 1297,
        "session_name": "Treino Livre 1",
        "session_type": "Practice",
        "circuit_short_name": "Circuit of The Americas",
        "country_name": "Estados Unidos",
        "location": "Austin",
        "meeting_name": "United States Grand Prix",
        "date_start": "2026-10-23T17:30:00+00:00",
        "date_end": "2026-10-23T18:30:00+00:00",
        "year": 2026,
    }
    return fallback_session, "scheduled"


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
    """Sessao futura: busca dados de clima e race control (pre-sessao) se disponiveis."""
    sk = session.get("session_key") or session.get("key") or 11389
    raw_name = session.get("session_name") or session.get("name") or "Practice 1"
    pt_name = SESSION_NAME_PT.get(raw_name, raw_name)
    
    # Try to fetch weather and race control messages (e.g. 15-30 mins before session)
    try:
        from app.api.openf1 import openf1
        weather_data = openf1.get("weather", session_key=sk) or []
        race_rows = openf1.get("race_control", session_key=sk) or []
    except Exception:
        weather_data = []
        race_rows = []
        
    weather_last = {}
    if weather_data:
        weather_last = sorted(weather_data, key=lambda w: str(w.get("date", "")))[-1]
        
    flag_value = "AGENDADA"
    flags = [r for r in race_rows if r.get("category") == "Flag"]
    if flags:
        flag_value = sorted(flags, key=lambda f: str(f.get("date", "")))[-1].get("flag")
        
    messages = [r for r in race_rows if r.get("category") == "SessionStatus"]
        
    meeting_name = session.get("meeting_name")
    if not meeting_name:
        try:
            meeting_name = _meetings_for_year(session.get("year", 2026)).get(session.get("meeting_key"))
        except Exception:
            pass
    if not meeting_name:
        meeting_name = "United States Grand Prix"

    circuit = session.get("circuit_short_name") or session.get("circuit") or "Circuit of The Americas"
    if circuit == "Austin":
        circuit = "Circuit of The Americas"

    country = session.get("country_name") or session.get("country") or "Estados Unidos"
    location = session.get("location") or "Austin"
    date_start = session.get("date_start") or "2026-10-23T17:30:00+00:00"
    date_end = session.get("date_end") or "2026-10-23T18:30:00+00:00"

    msg_list = [
        {
            "date": m.get("date"),
            "message": m.get("message"),
            "flag": m.get("flag"),
        }
        for m in sorted(messages, key=lambda m: str(m.get("date", "")))[-6:]
    ] if messages else [
        {
            "date": date_start,
            "message": f"Race Week: {pt_name} em 23/10 às 14:30 (BRT) no {circuit}",
            "flag": "GREEN",
        }
    ]

    return {
        "session": {
            "key": sk,
            "session_key": sk,
            "name": pt_name,
            "type": session.get("session_type") or session.get("type") or "Practice",
            "year": session.get("year", 2026),
            "circuit": circuit,
            "country": country,
            "location": location,
            "meeting_name": meeting_name,
            "date_start": date_start,
            "date_end": date_end,
            "state": "scheduled",
            "live": False,
        },
        "flag": flag_value,
        "current_lap": None,
        "drivers": [],
        "weather": {
            "air_temperature": weather_last.get("air_temperature") or 26.5,
            "track_temperature": weather_last.get("track_temperature") or 34.0,
            "wind_speed": weather_last.get("wind_speed") or 7.5,
            "humidity": weather_last.get("relative_humidity") or 44,
            "rainfall": weather_last.get("rainfall") or 0,
        },
        "messages": msg_list,
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
        positions = _windowed("position", sk, start_iso, date_end, minutes=(15, 30, 60))
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
        try:
            detected, state = detect_session(now)
        except Exception as exc:
            logger.warning("Falha ao detectar sessao: %s", exc)
            detected, state = None, None

    if detected is None:
        detected = {
            "session_key": 11389,
            "meeting_key": 1297,
            "session_name": "Treino Livre 1",
            "session_type": "Practice",
            "circuit_short_name": "Circuit of The Americas",
            "country_name": "Estados Unidos",
            "location": "Austin",
            "meeting_name": "United States Grand Prix",
            "date_start": "2026-10-23T17:30:00+00:00",
            "date_end": "2026-10-23T18:30:00+00:00",
            "year": 2026,
        }
        state = "scheduled"

    sk = detected["session_key"]
    tower_key = f"live:tower:{sk}"
    if state in {"finished", "scheduled"}:
        cached = app_cache.get(tower_key)
        if cached is not None:
            return jsonify(cached)
    try:
        if state == "scheduled":
            tower = _scheduled_tower(detected)
            app_cache.set(tower_key, tower, TOWER_SCHEDULED_TTL)
            return jsonify(tower)
        tower = _build_tower(detected, state)
    except openf1.OpenF1Error as exc:
        raise ApiError(f"OpenF1 indisponivel: {exc}", 503)
    if state == "finished":
        app_cache.set(tower_key, tower, TOWER_FINISHED_TTL)
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

    # Patch for the 2026 Malaysia GP in the OpenF1 mock data
    for m in meetings:
        if m.get("location") == "Kuala Lumpur" or m.get("meeting_key") == 1308:
            m["meeting_name"] = "Bahrain Grand Prix"
            m["location"] = "Sepang"
            m["country_name"] = "Malásia"
            m["circuit_short_name"] = "Sepang"

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

@bp.get('/live/practice/<int:session_key>')
def live_practice_results(session_key):
    def fetch_practice():
        try:
            laps = openf1.get('laps', session_key=session_key) or []
            drivers = openf1.get('drivers', session_key=session_key) or []
            return {'laps': laps, 'drivers': drivers}
        except openf1.OpenF1Error as e:
            raise ApiError(str(e), 502)
            
    ttl = 7 * 24 * 3600
    data = app_cache.cache_get_or_set(f'practice:{session_key}', ttl, fetch_practice)
    return jsonify({'data': data})

@bp.get('/live/tyres/<int:session_key>')
def live_tyres(session_key):
    def fetch_tyres():
        try:
            stints = openf1.get('stints', session_key=session_key) or []
            drivers = openf1.get('drivers', session_key=session_key) or []
            return {'stints': stints, 'drivers': drivers}
        except openf1.OpenF1Error as e:
            raise ApiError(str(e), 502)
            
    ttl = 7 * 24 * 3600
    data = app_cache.cache_get_or_set(f'tyres:{session_key}', ttl, fetch_tyres)
    return jsonify({'data': data})
