import urllib.request, urllib.parse, json

teams = [
    "Dallara logo svg",
    "EuroBrun logo",
    "Osella logo",
    "March Engineering logo",
    "Andrea Moda Formula",
    "Life F1 logo",
    "Fondmetal logo",
    "Modena Team logo"
]

for q in teams:
    url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(q)}&srnamespace=6&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"--- {q} ---")
        for i in resp["query"]["search"][:3]:
            print(i["title"])
    except Exception as e:
        print(f"Error {q}: {e}")
