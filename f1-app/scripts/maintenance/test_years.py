import urllib.request, json
try:
    req = urllib.request.urlopen('https://api.openf1.org/v1/sessions?year=2022')
    data = json.loads(req.read())
    print(f"2022: {len(data)} sessions")
except Exception as e:
    print(f"2022 error: {e}")

try:
    req = urllib.request.urlopen('https://api.openf1.org/v1/sessions?year=2023')
    data = json.loads(req.read())
    print(f"2023: {len(data)} sessions")
except Exception as e:
    print(f"2023 error: {e}")
