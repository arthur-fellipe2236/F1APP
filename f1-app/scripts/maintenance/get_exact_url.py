import urllib.request, urllib.parse, json

titles = ["File:Brawn GP logo.svg", "File:United Colors of Benetton - logo (Italy, 1996-2011).svg", "File:Benetton Formula logo.svg"]

for t in titles:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(t)}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        pages = resp["query"]["pages"]
        for pid in pages:
            if "imageinfo" in pages[pid]:
                print(pages[pid]["imageinfo"][0]["url"])
            else:
                print(f"{t} not found on Commons. Let's try en.wikipedia.org")
                url2 = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(t)}&prop=imageinfo&iiprop=url&format=json"
                req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
                resp2 = json.loads(urllib.request.urlopen(req2).read())
                pages2 = resp2["query"]["pages"]
                for pid2 in pages2:
                    if "imageinfo" in pages2[pid2]:
                        print(pages2[pid2]["imageinfo"][0]["url"])
                    else:
                        print(f"{t} NOT FOUND AT ALL")
    except Exception as e:
        print(e)
