import urllib.request
import json

res = urllib.request.urlopen('http://localhost:5000/api/v1/circuits?season=2026&series=f1')
data = json.loads(res.read())
print(f"Total circuits returned: {len(data.get('data', []))}")
for item in data.get('data', []):
    print(f"Round {item.get('round')}: {item.get('name')} | Country: {item.get('country')} | Winner: {item.get('winner')}")
