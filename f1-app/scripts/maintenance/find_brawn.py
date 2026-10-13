import urllib.request, urllib.parse, json

teams = ["Brawn GP", "Benetton Formula"]

for t in teams:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(t + ' logo')}&srnamespace=6&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"--- {t} ---")
        for i in resp["query"]["search"][:5]:
            print(i["title"])
    except:
        pass
