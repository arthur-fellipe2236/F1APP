import urllib.request, json, sys

def test_endpoint(url):
    try:
        res = urllib.request.urlopen(f"http://localhost:5000{url}").read()
        data = json.loads(res.decode('utf-8'))
        items = data.get('data', [])
        print(f"✅ {url} -> 200 OK ({len(items)} items)")
        if len(items) > 0:
            print(f"   First item: {list(items[0].values())[:3]}")
    except Exception as e:
        print(f"❌ {url} -> ERROR: {e}")

endpoints = [
    "/api/v1/standings/drivers?season=2026&series=f1",
    "/api/v1/standings/teams?season=2026&series=f1",
    "/api/v1/drivers?season=2026&series=f1",
    "/api/v1/teams?season=2026&series=f1",
    "/api/v1/standings/drivers?season=2024&series=f1",
    "/api/v1/standings/teams?season=2024&series=f1",
    "/api/v1/drivers?season=2024&series=f1",
    "/api/v1/teams?season=2024&series=f1",
    "/api/v1/standings/drivers?season=2026&series=f2",
    "/api/v1/standings/drivers?season=2026&series=f3"
]

for ep in endpoints:
    test_endpoint(ep)
