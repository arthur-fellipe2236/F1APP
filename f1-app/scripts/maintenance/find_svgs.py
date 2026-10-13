import urllib.request, urllib.parse, json

teams = ["Brabham", "Leyton House", "Larrousse", "Fondmetal", "March", "Dallara", "Onyx", "EuroBrun", "Coloni", "Osella", "AGS", "Life Racing Engines", "Modena", "Lola", "Team Lotus"]

for t in teams:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(t + ' logo svg')}&srnamespace=6&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f"--- {t} ---")
        for i in resp["query"]["search"][:3]:
            print(i["title"])
    except:
        pass
