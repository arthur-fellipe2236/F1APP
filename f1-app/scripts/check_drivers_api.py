import urllib.request, json
try:
    res = urllib.request.urlopen('http://localhost:5000/api/v1/drivers?season=2026&series=f1').read()
    data = json.loads(res.decode('utf-8'))
    for d in data['data']:
        if d['last_name'] in ['Bortoleto', 'Hulkenberg', 'Hadjar']:
            print(f"{d['first_name']} {d['last_name']} -> {d.get('team_name')}")
except Exception as e:
    print('ERROR:', e)
