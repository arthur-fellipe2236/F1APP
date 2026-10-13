import urllib.request, json
res = urllib.request.urlopen("http://localhost:5000/api/v1/teams?season=2026&series=f1").read()
data = json.loads(res.decode('utf-8'))['data']
for d in data:
    print(f"{d['name']}: {d['base_country']} | {d['engine_manufacturer']} | {d['founded_year']}")
