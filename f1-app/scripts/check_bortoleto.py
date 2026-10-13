import urllib.request, json
res = urllib.request.urlopen("http://localhost:5000/api/v1/drivers?season=2026&series=f1").read()
data = json.loads(res.decode('utf-8'))['data']
for d in data:
    if d['last_name'] == 'Bortoleto':
        print(json.dumps(d, indent=2))
