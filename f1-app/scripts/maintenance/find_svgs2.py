import urllib.request, urllib.parse, json

queries = [
    "Tyrrell logo svg",
    "Larrousse logo svg",
    "Leyton House logo svg",
    "Lotus F1 logo svg",
    "Arrows F1 logo svg",
    "AGS F1 logo",
    "EuroBrun logo",
    "Ligier logo svg",
    "Minardi logo svg",
    "Onyx Grand Prix logo"
]

for q in queries:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(q)}&srnamespace=6&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"--- {q} ---")
        for i in resp["query"]["search"][:3]:
            print(i["title"])
    except Exception as e:
        print(f"Error {q}: {e}")
