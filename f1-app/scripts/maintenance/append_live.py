code = """
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
"""
with open('/home/arthur/Projects/f1-api/app/api/live.py', 'a') as f:
    f.write(code)
