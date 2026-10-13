import urllib.request, json
res = urllib.request.urlopen("http://localhost:5000/api/v1/standings/drivers?season=2026&series=f1").read()
data = json.loads(res.decode('utf-8'))['data']
for d in data:
    print(d['driver_name'])
