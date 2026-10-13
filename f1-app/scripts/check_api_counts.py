import urllib.request, json
res = urllib.request.urlopen("http://localhost:5000/api/v1/drivers?season=2026&series=f1").read()
data = json.loads(res.decode('utf-8'))
print("Drivers total:", data['meta']['total'])

res = urllib.request.urlopen("http://localhost:5000/api/v1/teams?season=2026&series=f1").read()
data = json.loads(res.decode('utf-8'))
print("Teams total:", data['meta']['total'])
