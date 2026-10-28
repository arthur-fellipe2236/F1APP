"""Area de live timing (sem mapa), alimentada pela OpenF1.

Detecta a sessao em andamento (ou a ultima concluida) e monta a torre de
tempos com intervalo, posicao, pneus, bandeira, clima e mensagens de
race control. Janelas de data mantem as respostas pequenas durante live.
"""

import logging
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request

from .. import cache as app_cache
from .. import f2_f3_data
from .. import openf1
from .helpers import ApiError, parse_int

logger = logging.getLogger(__name__)

bp = Blueprint("live", __name__)

LIVE_BUFFER = timedelta(minutes=15)
WINDOW = timedelta(minutes=7)

# Torres encerradas sao imutaveis (cache longa); ao vivo nunca e cacheado;
# agendadas e metadados tem cache curto. Redis quando REDIS_URL existir.
TOWER_FINISHED_TTL = 7 * 24 * 3600
TOWER_SCHEDULED_TTL = 120
META_TTL = 300

SUPPORTED_SERIES = {"f1", "f2", "f3"}


def _get_series_arg():
    val = request.args.get("series")
    if not val:
        return "f1"
    clean = val.strip().lower()
    if clean not in SUPPORTED_SERIES:
        raise ApiError("Categoria invalida. Categorias permitidas: f1, f2, f3", 400)
    return clean


def _is_testing_meeting(meeting):
    if not meeting or not isinstance(meeting, dict):
        return False
    name = str(meeting.get("meeting_name") or "").lower().strip()
    official = str(meeting.get("meeting_official_name") or "").lower().strip()
    return (
        "pre-season testing" in name
        or "pre-season testing" in official
        or "post-season testing" in name
        or "post-season testing" in official
    )


def _is_testing_session(session, meeting_name=None):
    if not session or not isinstance(session, dict):
        return False
    if meeting_name and _is_testing_meeting({"meeting_name": meeting_name}):
        return True
    m_name = str(session.get("meeting_name") or "")
    if m_name and _is_testing_meeting({"meeting_name": m_name}):
        return True
    return False


def _detect_session_period(session_name):
    if not session_name:
        return None
    s = str(session_name).lower().strip()
    if "morning" in s or "manhã" in s:
        return "Morning"
    if "afternoon" in s or "tarde" in s:
        return "Afternoon"
    if "day" in s or "dia" in s:
        return "Full Day"
    return None


def _cached(key, loader, series="f1"):
    key_part = ':'.join(map(str, key)) if isinstance(key, tuple) else key
    return app_cache.cache_get_or_set(
        f"live:{series}:{key_part}",
        META_TTL,
        loader,
    )


def _parse_dt(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _now_utc():
    return datetime.now(timezone.utc)


def _sessions_for_year(year, series="f1"):
    if series in {"f2", "f3"}:
        return _cached(
            ("sessions", year),
            lambda: f2_f3_data.get_series_sessions(series, year=year),
            series=series,
        )
    return _cached(
        ("sessions", year),
        lambda: openf1.get("sessions", year=year) or [],
        series=series,
    )


def _meetings_for_year(year, series="f1"):
    if series in {"f2", "f3"}:
        return _cached(
            ("meetings", year),
            lambda: {
                m["meeting_key"]: m.get("meeting_name")
                for m in f2_f3_data.get_series_meetings(series, year=year)
            },
            series=series,
        )
    return _cached(
        ("meetings", year),
        lambda: {
            m["meeting_key"]: m.get("meeting_name")
            for m in (openf1.get("meetings", year=year) or [])
        },
        series=series,
    )


def _session_by_key(session_key, series="f1"):
    cache_key = f"live:{series}:session:{session_key}"
    hit = app_cache.get(cache_key)
    if hit is not None:
        return hit

    if series in {"f2", "f3"}:
        found = f2_f3_data.get_series_session_by_key(series, session_key)
        if found:
            app_cache.set(cache_key, found, META_TTL)
            return found
        return None

    for year in (_now_utc().year, _now_utc().year - 1):
        try:
            year_sessions = _sessions_for_year(year, series=series)
        except TypeError:
            year_sessions = _sessions_for_year(year)
        found = next(
            (
                s
                for s in year_sessions
                if s["session_key"] == session_key
            ),
            None,
        )
        if found:
            app_cache.set(cache_key, found, META_TTL)
            return found
    return None


SESSION_NAME_PT = {
    "Practice 1": "Treino Livre 1",
    "Practice 2": "Treino Livre 2",
    "Practice 3": "Treino Livre 3",
    "Practice": "Treino Livre",
    "Qualifying": "Classificação",
    "Sprint Qualifying": "Classificação Sprint",
    "Sprint": "Corrida Sprint",
    "Sprint Race": "Corrida Sprint",
    "Race": "Corrida Principal",
    "Feature Race": "Corrida Principal",
    "Day 1": "Dia 1",
    "Day 2": "Dia 2",
    "Day 3": "Dia 3",
}


def detect_session(now=None, series="f1", *args, **kwargs):
    """Sessao ao vivo, a proxima agendada, ou a mais recente ja encerrada."""
    now = now or _now_utc()
    try:
        try:
            sessions = _sessions_for_year(now.year, series=series)
        except TypeError:
            sessions = _sessions_for_year(now.year)
        if not sessions:
            try:
                sessions = _sessions_for_year(now.year - 1, series=series) or []
            except TypeError:
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


def _scheduled_tower(session, series="f1"):
    """Sessao futura: busca dados de clima e race control (pre-sessao) se disponiveis."""
    sk = session.get("session_key") or session.get("key") or 11389
    raw_name = session.get("session_name") or session.get("name") or "Practice 1"
    pt_name = SESSION_NAME_PT.get(raw_name, raw_name)
    
    # Try to fetch weather and race control messages (e.g. 15-30 mins before session)
    weather_data = []
    race_rows = []
    if series == "f1":
        try:
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
    if not meeting_name and session.get("year") and session.get("meeting_key"):
        try:
            try:
                meeting_name = _meetings_for_year(session["year"], series=series).get(session["meeting_key"])
            except TypeError:
                meeting_name = _meetings_for_year(session["year"]).get(session["meeting_key"])
        except Exception:
            pass

    circuit = session.get("circuit_short_name") or session.get("circuit")
    country = session.get("country_name") or session.get("country")
    location = session.get("location")
    date_start = session.get("date_start")
    date_end = session.get("date_end")

    is_time_confirmed = session.get("is_time_confirmed", True if series == "f1" else False)
    time_status = session.get("time_status", "confirmed" if series == "f1" else "estimated")

    is_testing = bool(session.get("is_testing")) or _is_testing_meeting({"meeting_name": meeting_name}) or _is_testing_session(session, meeting_name=meeting_name)
    session_type_val = "Testing" if is_testing else (session.get("session_type") or session.get("type") or "Practice")
    period_val = session.get("period") or (_detect_session_period(raw_name) if is_testing else None)

    prefix = "Sessão de testes agendada" if is_testing else "Sessão agendada"
    schedule_parts = [f"{prefix}: {pt_name}"]
    if date_start:
        try:
            dt = _parse_dt(date_start)
            time_note = " (horário estimado sujeito a confirmação pela FIA)" if not is_time_confirmed else ""
            schedule_parts.append(f"programada para {dt.strftime('%d/%m às %H:%M UTC')}{time_note}")
        except Exception:
            schedule_parts.append(f"programada para {date_start}")
    if circuit:
        schedule_parts.append(f"em {circuit}")
    dynamic_schedule_msg = " ".join(schedule_parts) + "."

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
            "message": dynamic_schedule_msg,
            "flag": flag_value or "GREEN",
        }
    ]

    return {
        "session": {
            "key": sk,
            "session_key": sk,
            "name": pt_name,
            "session_name": raw_name,
            "type": session_type_val,
            "is_testing": is_testing,
            "period": period_val,
            "year": session.get("year", 2026),
            "circuit": circuit,
            "country": country,
            "location": location,
            "meeting_name": meeting_name,
            "date_start": date_start,
            "date_end": date_end,
            "state": "scheduled",
            "live": False,
            "time_status": time_status,
            "is_time_confirmed": is_time_confirmed,
        },
        "flag": flag_value,
        "current_lap": None,
        "drivers": [],
        "weather": {
            "air_temperature": weather_last.get("air_temperature") if weather_last else None,
            "track_temperature": weather_last.get("track_temperature") if weather_last else None,
            "wind_speed": weather_last.get("wind_speed") if weather_last else None,
            "humidity": weather_last.get("relative_humidity") if weather_last else None,
            "rainfall": weather_last.get("rainfall") if weather_last else None,
        },
        "messages": msg_list,
        "updated_at": _now_utc().isoformat(),
        "data_status": "scheduled",
        "source_status": {
            "available": True,
            "status_code": 200,
            "reason": "scheduled",
            "message": "Sessão agendada — aguardando início das atividades de pista",
        },
        "is_stale": False,
        "last_valid_update": None,
        "series": series,
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


def _build_tower(session, state, series="f1"):
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

    meeting_name = session.get("meeting_name")
    if not meeting_name and session.get("year") and session.get("meeting_key"):
        try:
            try:
                meeting_name = _meetings_for_year(session["year"], series=series).get(
                    session["meeting_key"]
                )
            except TypeError:
                meeting_name = _meetings_for_year(session["year"]).get(
                    session["meeting_key"]
                )
        except Exception:
            pass

    raw_name = session.get("session_name") or session.get("name") or "Practice 1"
    is_testing = _is_testing_meeting({"meeting_name": meeting_name}) or _is_testing_session(session, meeting_name=meeting_name)
    session_type_val = "Testing" if is_testing else (session.get("session_type") or session.get("type") or "Practice")
    period_val = _detect_session_period(raw_name) if is_testing else None

    return {
        "session": {
            "key": sk,
            "session_key": sk,
            "name": session.get("session_name"),
            "session_name": session.get("session_name"),
            "type": session_type_val,
            "is_testing": is_testing,
            "period": period_val,
            "year": session.get("year"),
            "circuit": session.get("circuit_short_name"),
            "country": session.get("country_name"),
            "location": session.get("location"),
            "meeting_name": meeting_name,
            "date_start": session.get("date_start"),
            "date_end": session.get("date_end"),
            "state": state,
            "live": state == "live",
            "time_status": session.get("time_status", "confirmed" if series == "f1" else "estimated"),
            "is_time_confirmed": session.get("is_time_confirmed", True if series == "f1" else False),
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
        "data_status": "live" if live else "finished",
        "source_status": {
            "available": True,
            "status_code": 200,
            "reason": "ok",
            "message": "Telemetria conectada e atualizada" if live else "Sessão encerrada",
        },
        "is_stale": False,
        "last_valid_update": now.isoformat(),
        "series": series,
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
      - in: query
        name: series
        schema:
          type: string
          enum: [f1, f2, f3]
          default: f1
        description: "Categoria (padrao: f1)"
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
      400:
        description: Categoria invalida
      404:
        description: Nenhuma sessao disponivel
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    series = _get_series_arg()
    now = _now_utc()
    requested = parse_int(request.args.get("session_key"), "session_key")
    detected = None
    state = None

    if series in {"f2", "f3"} and not requested:
        series_name = "Fórmula 2" if series == "f2" else "Fórmula 3"
        return jsonify({
            "session": None,
            "flag": None,
            "current_lap": None,
            "drivers": [],
            "weather": {},
            "messages": [],
            "data_status": "unavailable",
            "source_status": {
                "available": False,
                "status_code": 200,
                "reason": "provider_not_configured",
                "message": f"Telemetria em tempo real para {series_name} indisponível nesta etapa.",
            },
            "is_stale": False,
            "last_valid_update": None,
            "series": series,
        })

    if requested:
        try:
            detected = _session_by_key(requested, series=series)
        except TypeError:
            detected = _session_by_key(requested)
        if detected is not None:
            state = session_state(detected, now)
        else:
            raise ApiError("Sessao nao encontrada", 404)
    else:
        try:
            try:
                detected, state = detect_session(now, series=series)
            except TypeError:
                detected, state = detect_session(now)
        except Exception as exc:
            logger.warning("Falha ao detectar sessao: %s", exc)
            detected, state = None, None

    if detected is None:
        raise ApiError("Nenhuma sessao disponivel", 404)

    sk = detected["session_key"]
    tower_key = f"live:{series}:tower:{sk}"
    last_valid_key = f"live:{series}:tower:{sk}:last_valid"

    if state in {"finished", "scheduled"}:
        cached = app_cache.get(tower_key)
        if cached is not None:
            return jsonify(cached)

    if series in {"f2", "f3"}:
        series_name = "Fórmula 2" if series == "f2" else "Fórmula 3"
        if state == "scheduled":
            tower = _scheduled_tower(detected, series=series)
            app_cache.set(tower_key, tower, TOWER_SCHEDULED_TTL)
            return jsonify(tower)

        raw_name = detected.get("session_name") or "Practice"
        pt_name = SESSION_NAME_PT.get(raw_name, raw_name)
        is_testing = bool(detected.get("is_testing"))
        session_type_val = "Testing" if is_testing else (detected.get("session_type") or "Practice")
        period_val = detected.get("period") or (_detect_session_period(raw_name) if is_testing else None)
        tower = {
            "session": {
                "key": sk,
                "session_key": sk,
                "name": pt_name,
                "session_name": raw_name,
                "type": session_type_val,
                "is_testing": is_testing,
                "period": period_val,
                "year": detected.get("year", 2026),
                "circuit": detected.get("circuit_short_name"),
                "country": detected.get("country_name"),
                "location": detected.get("location"),
                "meeting_name": detected.get("meeting_name"),
                "date_start": detected.get("date_start"),
                "date_end": detected.get("date_end"),
                "state": state,
                "live": state == "live",
                "time_status": detected.get("time_status", "estimated"),
                "is_time_confirmed": detected.get("is_time_confirmed", False),
            },
            "flag": None,
            "current_lap": None,
            "drivers": [],
            "weather": {},
            "messages": [],
            "data_status": "unavailable",
            "source_status": {
                "available": False,
                "status_code": 200,
                "reason": "provider_not_configured",
                "message": f"Feed de cronometragem ao vivo não configurado para {series_name}.",
            },
            "is_stale": False,
            "last_valid_update": None,
            "series": series,
        }
        if state == "finished":
            app_cache.set(tower_key, tower, TOWER_FINISHED_TTL)
        return jsonify(tower)

    try:
        if state == "scheduled":
            tower = _scheduled_tower(detected, series=series)
            app_cache.set(tower_key, tower, TOWER_SCHEDULED_TTL)
            return jsonify(tower)

        tower = _build_tower(detected, state, series=series)
        if state == "live" and not tower.get("drivers"):
            cached_valid = app_cache.get(last_valid_key)
            if cached_valid and cached_valid.get("drivers"):
                stale_response = dict(cached_valid)
                stale_response["data_status"] = "cached"
                stale_response["is_stale"] = True
                stale_response["series"] = series
                stale_response["source_status"] = {
                    "available": False,
                    "status_code": 200,
                    "reason": "empty_live_data",
                    "message": "Fonte de telemetria externa retornou dados de pista vazios durante a sessão ao vivo; exibindo última leitura válida.",
                }
                return jsonify(stale_response)
            return jsonify(tower)

        app_cache.set(last_valid_key, tower, TOWER_FINISHED_TTL if state == "finished" else 7200)
    except openf1.OpenF1Error as exc:
        cached_valid = app_cache.get(last_valid_key)
        if cached_valid is not None:
            stale_valid = dict(cached_valid)
            stale_valid["data_status"] = "cached"
            stale_valid["is_stale"] = True
            stale_valid["series"] = series
            stale_valid["source_status"] = {
                "available": False,
                "status_code": exc.status_code,
                "reason": exc.reason,
                "message": (
                    "Acesso à telemetria ao vivo da OpenF1 temporariamente restrito durante a sessão oficial."
                    if exc.reason == "unauthorized"
                    else "Fonte de telemetria externa temporariamente indisponível."
                ),
            }
            return jsonify(stale_valid)

        status_code = 504 if exc.reason == "timeout" else (429 if exc.reason == "rate_limited" else 503)
        raise ApiError(
            f"OpenF1 indisponivel: {exc.args[0] if exc.args else 'Erro de conexao'}",
            status_code,
            details={
                "reason": exc.reason,
                "status_code": exc.status_code,
                "source_available": False,
                "series": series,
                "session": {
                    "key": detected.get("session_key"),
                    "name": detected.get("session_name"),
                    "type": detected.get("session_type"),
                    "is_testing": _is_testing_session(detected),
                    "circuit": detected.get("circuit_short_name"),
                    "country": detected.get("country_name"),
                    "location": detected.get("location"),
                    "date_start": detected.get("date_start"),
                    "date_end": detected.get("date_end"),
                    "state": state,
                    "live": state == "live",
                },
            },
        )

    if state == "finished":
        app_cache.set(tower_key, tower, TOWER_FINISHED_TTL)
    return jsonify(tower)


@bp.get("/live/state")
def live_state():
    """
    Estado resumido da sessao ativa (ou ultima encerrada)
    ---
    tags:
      - Live
    parameters:
      - in: query
        name: session_key
        schema:
          type: integer
        description: "Sessao especifica (padrao: atual ou ultima encerrada)"
      - in: query
        name: series
        schema:
          type: string
          enum: [f1, f2, f3]
          default: f1
        description: "Categoria (padrao: f1)"
    responses:
      200:
        description: Estado da sessao atual
      400:
        description: Categoria invalida
    """
    series = _get_series_arg()
    now = _now_utc()
    requested = parse_int(request.args.get("session_key"), "session_key")

    if series in {"f2", "f3"} and not requested:
        return jsonify({
            "active": False,
            "state": "offseason",
            "session": None,
            "series": series,
        })

    if requested:
        try:
            detected = _session_by_key(requested, series=series)
        except TypeError:
            detected = _session_by_key(requested)
        if not detected:
            raise ApiError("Sessao nao encontrada", 404)
        state = session_state(detected, now)
    else:
        try:
            try:
                detected, state = detect_session(now, series=series)
            except TypeError:
                detected, state = detect_session(now)
        except Exception:
            detected, state = None, None

    if detected is None:
        return jsonify({
            "active": False,
            "state": "offseason",
            "session": None,
            "series": series,
        })

    return jsonify({
        "active": state == "live",
        "state": state,
        "session_key": detected["session_key"],
        "session_name": detected.get("session_name"),
        "meeting_name": detected.get("meeting_name"),
        "date_start": detected.get("date_start"),
        "date_end": detected.get("date_end"),
        "series": series,
        "is_testing": bool(detected.get("is_testing")) or _is_testing_session(detected),
        "time_status": detected.get("time_status", "confirmed" if series == "f1" else "estimated"),
        "is_time_confirmed": detected.get("is_time_confirmed", True if series == "f1" else False),
    })


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
      - in: query
        name: series
        schema:
          type: string
          enum: [f1, f2, f3]
          default: f1
        description: "Categoria (padrao: f1)"
    responses:
      200:
        description: >-
          GPs e testes oficiais da temporada em ordem de calendario, cada um com suas
          sessoes e estado (scheduled/live/finished)
        content:
          application/json:
            schema:
              type: object
              properties:
                year:
                  type: integer
                series:
                  type: string
                data:
                  type: array
                  items:
                    type: object
      400:
        description: Categoria invalida
      503:
        description: OpenF1 indisponivel
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
    """
    series = _get_series_arg()
    now = _now_utc()
    year = parse_int(request.args.get("year"), "year") or now.year

    if series in {"f2", "f3"}:
        raw_meetings = _cached(
            ("meetingsraw", year),
            lambda: f2_f3_data.get_series_meetings(series, year=year),
            series=series,
        )
        data = []
        for meeting in raw_meetings:
            is_testing_meet = bool(meeting.get("is_testing"))
            data.append(
                {
                    "meeting_key": meeting["meeting_key"],
                    "round": meeting["round"],
                    "is_testing": is_testing_meet,
                    "meeting_name": meeting["meeting_name"],
                    "circuit": meeting.get("circuit_short_name"),
                    "country": meeting.get("country_name"),
                    "location": meeting.get("location"),
                    "date_start": meeting["date_start"],
                    "date_end": meeting["date_end"],
                    "sessions": [
                        {
                            "key": s["session_key"],
                            "session_key": s["session_key"],
                            "name": SESSION_NAME_PT.get(s.get("session_name"), s.get("session_name")),
                            "session_name": s.get("session_name"),
                            "type": s.get("session_type"),
                            "is_testing": bool(s.get("is_testing")),
                            "period": s.get("period") or (_detect_session_period(s.get("session_name")) if s.get("is_testing") else None),
                            "date_start": s["date_start"],
                            "date_end": s["date_end"],
                            "state": session_state(s, now),
                            "time_status": s.get("time_status", "estimated"),
                            "is_time_confirmed": s.get("is_time_confirmed", False),
                        }
                        for s in meeting.get("sessions", [])
                    ],
                }
            )
        return jsonify({"year": year, "series": series, "data": data})

    try:
        raw_meetings = _cached(
            ("meetingsraw", year),
            lambda: openf1.get("meetings", year=year) or [],
            series=series,
        )
        meetings = [
            m
            for m in raw_meetings
            if (
                str(m.get("meeting_name", "")).endswith("Grand Prix")
                or _is_testing_meeting(m)
            )
            and not m.get("is_cancelled")
        ]
        try:
            sessions = _sessions_for_year(year, series=series)
        except TypeError:
            sessions = _sessions_for_year(year)
    except openf1.OpenF1Error as exc:
        raise ApiError(f"OpenF1 indisponivel: {exc}", 503)

    # Patch for 2026 GPs in the OpenF1 mock data
    for m in meetings:
        if m.get("location") == "Kuala Lumpur" or m.get("meeting_key") == 1308:
            m["meeting_name"] = "Bahrain Grand Prix"
            m["location"] = "Sepang"
            m["country_name"] = "Malásia"
            m["circuit_short_name"] = "Sepang"
        elif m.get("meeting_key") == 1298 or m.get("location") == "Mexico City":
            m["meeting_name"] = "GP do México (Cidade do México)"
            m["location"] = "Cidade do México"
            m["country_name"] = "México"
            m["circuit_short_name"] = "Autódromo Hermanos Rodríguez"
        elif m.get("meeting_key") == 1299 or m.get("location") == "São Paulo":
            m["meeting_name"] = "GP do Brasil (São Paulo - Interlagos)"
            m["location"] = "São Paulo"
            m["country_name"] = "Brasil"
            m["circuit_short_name"] = "Autódromo José Carlos Pace (Interlagos)"

    meetings.sort(key=lambda m: m["date_start"])
    by_meeting = {}
    for session in sessions:
        by_meeting.setdefault(session["meeting_key"], []).append(session)

    data = []
    gp_round = 1
    for meeting in meetings:
        is_testing_meet = _is_testing_meeting(meeting)
        meeting_sessions = sorted(
            by_meeting.get(meeting["meeting_key"], []),
            key=lambda s: s["date_start"],
        )
        if is_testing_meet and not meeting_sessions:
            continue

        meeting_round = 0 if is_testing_meet else gp_round
        if not is_testing_meet:
            gp_round += 1

        meeting_sessions = sorted(
            by_meeting.get(meeting["meeting_key"], []),
            key=lambda s: s["date_start"],
        )
        data.append(
            {
                "meeting_key": meeting["meeting_key"],
                "round": meeting_round,
                "is_testing": is_testing_meet,
                "meeting_name": meeting["meeting_name"],
                "circuit": meeting.get("circuit_short_name"),
                "country": meeting.get("country_name"),
                "location": meeting.get("location"),
                "date_start": meeting["date_start"],
                "date_end": meeting["date_end"],
                "sessions": [
                    {
                        "key": s["session_key"],
                        "session_key": s["session_key"],
                        "name": SESSION_NAME_PT.get(s.get("session_name"), s.get("session_name")),
                        "session_name": s.get("session_name"),
                        "type": "Testing" if is_testing_meet else s.get("session_type"),
                        "is_testing": is_testing_meet,
                        "period": _detect_session_period(s.get("session_name")) if is_testing_meet else None,
                        "date_start": s["date_start"],
                        "date_end": s["date_end"],
                        "state": session_state(s, now),
                        "time_status": "confirmed",
                        "is_time_confirmed": True,
                    }
                    for s in meeting_sessions
                ],
            }
        )
    return jsonify({"year": year, "series": series, "data": data})


@bp.get('/live/practice/<int:session_key>')
def live_practice_results(session_key):
    series = _get_series_arg()
    if series != "f1":
        return jsonify({"data": {"laps": [], "drivers": []}, "series": series})

    def fetch_practice():
        try:
            laps = openf1.get('laps', session_key=session_key) or []
            drivers = openf1.get('drivers', session_key=session_key) or []
            return {'laps': laps, 'drivers': drivers}
        except openf1.OpenF1Error as e:
            raise ApiError(str(e), 502)

    ttl = 7 * 24 * 3600
    data = app_cache.cache_get_or_set(f'live:{series}:practice:{session_key}', ttl, fetch_practice)
    return jsonify({'data': data, 'series': series})


@bp.get('/live/tyres/<int:session_key>')
def live_tyres(session_key):
    series = _get_series_arg()
    if series != "f1":
        return jsonify({"data": {"stints": [], "drivers": []}, "series": series})

    def fetch_tyres():
        try:
            stints = openf1.get('stints', session_key=session_key) or []
            drivers = openf1.get('drivers', session_key=session_key) or []
            return {'stints': stints, 'drivers': drivers}
        except openf1.OpenF1Error as e:
            raise ApiError(str(e), 502)

    ttl = 7 * 24 * 3600
    data = app_cache.cache_get_or_set(f'live:{series}:tyres:{session_key}', ttl, fetch_tyres)
    return jsonify({'data': data, 'series': series})
