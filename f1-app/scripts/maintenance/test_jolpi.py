import urllib.request, json
req = urllib.request.urlopen('https://api.jolpi.ca/ergast/f1/2024/1/laps.json?limit=2000')
data = json.loads(req.read())
laps = data['MRData']['RaceTable']['Races'][0]['Laps']
print(f"Retornou {len(laps)} voltas. Total: {data['MRData']['total']}")
