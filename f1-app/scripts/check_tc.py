import urllib.request, json
res = urllib.request.urlopen("http://localhost:5000/api/v1/standings/teams?season=2026&series=f1").read()
data = json.loads(res.decode('utf-8'))['data']
print(f"Total teams: {len(data)}")
print([d['team_name'] for d in data])
