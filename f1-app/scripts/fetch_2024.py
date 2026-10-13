import urllib.request, json
try:
    res = urllib.request.urlopen('http://localhost:5000/api/v1/standings/drivers?season=2024&series=f1').read()
    data = json.loads(res.decode('utf-8'))
    print("Drivers:")
    for d in data['data']:
        print(f"{d['driver_name']} ({d['driver_id']}): {d['points']} pts")
except Exception as e:
    print('ERROR:', e)
