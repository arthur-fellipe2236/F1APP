import urllib.request, json
req = urllib.request.urlopen('https://api.jolpi.ca/ergast/f1/2024/1/laps.json?limit=2000')
data = json.loads(req.read())
laps = data['MRData']['RaceTable']['Races'][0]['Laps']
print(f"Retornou {len(laps)} voltas (limit=2000)")

req2 = urllib.request.urlopen('https://api.jolpi.ca/ergast/f1/2024/1/laps.json?limit=1000')
data2 = json.loads(req2.read())
laps2 = data2['MRData']['RaceTable']['Races'][0]['Laps']
print(f"Retornou {len(laps2)} voltas (limit=1000)")
