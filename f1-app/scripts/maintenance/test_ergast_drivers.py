import urllib.request, json
req = urllib.request.urlopen('https://api.jolpi.ca/ergast/f1/2022/6/results.json')
results = json.loads(req.read())['MRData']['RaceTable']['Races'][0]['Results']
codes = []
for r in results:
    driver = r.get("Driver", {})
    codes.append(f"{driver.get('code')} - {driver.get('givenName')} {driver.get('familyName')}")
print("\n".join(codes))
