import re
import urllib.request
import urllib.parse
import json

def get_wiki_url(title):
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = json.loads(urllib.request.urlopen(req).read())
        pages = resp["query"]["pages"]
        for pid in pages:
            if "imageinfo" in pages[pid]:
                return pages[pid]["imageinfo"][0]["url"]
    except: pass
    
    try:
        url2 = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json"
        req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
        resp2 = json.loads(urllib.request.urlopen(req2).read())
        pages2 = resp2["query"]["pages"]
        for pid2 in pages2:
            if "imageinfo" in pages2[pid2]:
                return pages2[pid2]["imageinfo"][0]["url"]
    except: pass
    return None

mapping = {
    "Tyrrell": "File:Tyrrell Racing logo.svg",
    "Ligier": "File:Logo Ligier.svg",
    "Minardi": "File:Minardi F1 Team.svg",
    "Larrousse": "File:Larrousse logo.png",
    "Leyton House": "File:Leyton house logo.png",
    "AGS": "File:Ags logo (F1).png",
    "Arrows": "File:Arrows Grand Prix International logo.svg",
    "Team Lotus": "File:Team Lotus Logo.svg",
    "Lotus": "File:Lotus F1 Team logo.svg"
}

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "r") as f:
    content = f.read()

for team, title in mapping.items():
    url = get_wiki_url(title)
    if url:
        print(f"Found {team}: {url}")
        # find the line with team: { url: "..."
        # and replace the url
        # example: Tyrrell: { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Tyrrell_Racing_logo.svg/300px-Tyrrell_Racing_logo.svg.png" },
        content = re.sub(
            rf'({team}:\s*{{\s*url:\s*")[^"]+(")',
            rf'\g<1>{url}\g<2>',
            content
        )

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "w") as f:
    f.write(content)

print("Updated assets.ts")
