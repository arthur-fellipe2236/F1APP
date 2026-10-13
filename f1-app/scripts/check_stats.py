import urllib.request, json
res = urllib.request.urlopen("http://localhost:5000/api/v1/standings/drivers?season=2026&series=f1").read()
data = json.loads(res.decode('utf-8'))['data']
for d in data[:10]:
    print(f"{d['driver_name']} | Pts: {d['points']} | Wins: {d['wins']} | Pods: {d['podiums']} | Races: {d['races']}")
