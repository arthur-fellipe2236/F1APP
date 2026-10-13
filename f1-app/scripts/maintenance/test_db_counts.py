import urllib.request, json
req = urllib.request.urlopen('http://localhost:5000/api/v1/seasons')
seasons = json.loads(req.read())['data']
for s in seasons:
    try:
        races = json.loads(urllib.request.urlopen(f'http://localhost:5000/api/v1/races?season={s}').read())['data']
        print(f"Season {s}: {len(races)} races")
    except Exception as e:
        print(f"Season {s}: error {e}")
