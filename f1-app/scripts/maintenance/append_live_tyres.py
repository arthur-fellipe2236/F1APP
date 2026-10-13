code = """
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
"""
with open('/home/arthur/Projects/f1-api/app/api/live.py', 'a') as f:
    f.write(code)
