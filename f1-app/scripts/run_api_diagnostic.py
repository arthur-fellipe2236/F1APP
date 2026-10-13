import urllib.request
import urllib.error
import json

endpoints = [
    '/api/v1/health',
    '/api/v1/next-race',
    '/api/v1/f2/next-race',
    '/api/v1/f3/next-race',
    '/api/v1/standings/drivers?season=2026&series=f1',
    '/api/v1/standings/teams?season=2026&series=f1',
    '/api/v1/drivers?series=f1&season=2026&page=1&per_page=50',
    '/api/v1/teams?series=f1&season=2026&page=1&per_page=50',
    '/api/v1/races?season=2026&series=f1',
    '/api/v1/live/tower',
    '/api/v1/news?series=f1',
    '/api/v1/seasons',
    '/api/v1/circuits',
    '/api/v1/news/bulletin'  # test without auth to see status
]

print("=== DIAGNOSTIC: TESTING BACKEND ENDPOINTS ===")
passed = 0
failed = 0

for ep in endpoints:
    url = f"http://127.0.0.1:5000{ep}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "diagnostic/1.0"})
        with urllib.request.urlopen(req, timeout=6) as res:
            data = res.read()
            status = res.status
            try:
                parsed = json.loads(data)
                info = ""
                if isinstance(parsed, list):
                    info = f"list items: {len(parsed)}"
                elif isinstance(parsed, dict):
                    if "data" in parsed:
                        info = f"data count: {len(parsed['data'])}"
                    elif "sessions" in parsed:
                        info = f"sessions: {len(parsed['sessions'])}"
                    elif "status" in parsed:
                        info = f"status: {parsed['status']}"
                    else:
                        info = f"keys: {list(parsed.keys())[:4]}"
                print(f"[PASS] {status} {ep:50} -> {info}")
                passed += 1
            except Exception:
                print(f"[PASS] {status} {ep:50} -> raw bytes: {len(data)}")
                passed += 1
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")[:80]
        if ep == '/api/v1/news/bulletin' and e.code == 401:
            print(f"[AUTH] {e.code} {ep:50} -> Expected 401 Unauthorized (Auth works)")
            passed += 1
        else:
            print(f"[FAIL] {e.code} {ep:50} -> {body}")
            failed += 1
    except Exception as e:
        print(f"[ERR ] --- {ep:50} -> {e}")
        failed += 1

print(f"\nResult: {passed} passed, {failed} failed.")
