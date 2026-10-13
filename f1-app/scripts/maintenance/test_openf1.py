import urllib.request, json
req = urllib.request.urlopen('https://api.openf1.org/v1/sessions?year=2024')
data = json.loads(req.read())
print(set(s['session_name'] for s in data))
