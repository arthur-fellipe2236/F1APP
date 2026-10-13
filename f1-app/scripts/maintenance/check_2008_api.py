import urllib.request, json
resp = json.loads(urllib.request.urlopen('https://api.jolpi.ca/ergast/f1/2008.json').read())
rounds = [r['round'] for r in resp['MRData']['RaceTable']['Races']]
print("Rounds in 2008 calendar:", rounds)
