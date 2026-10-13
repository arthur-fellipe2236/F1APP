import re
import urllib.request
import urllib.parse
import json
import time

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "r") as f:
    content = f.read()

# Extract all wikipedia thumb URLs
urls = re.findall(r'url: "(https://upload\.wikimedia\.org/wikipedia/[^/]+/thumb/[^"]+)"', content)

def get_original_url(url):
    # parse filename from thumb url, e.g., .../thumb/1/1a/Renault_F1_Team_logo.svg/300px-...
    # filename is Renault_F1_Team_logo.svg
    match = re.search(r'/thumb/[^/]+/[^/]+/([^/]+)/', url)
    if not match: return None
    filename = urllib.parse.unquote(match.group(1))
    
    # query API for original url
    title = f"File:{filename}"
    api_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        pages = resp["query"]["pages"]
        for pid in pages:
            if "imageinfo" in pages[pid]:
                return pages[pid]["imageinfo"][0]["url"]
    except: pass

    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        resp = json.loads(urllib.request.urlopen(req).read())
        pages = resp["query"]["pages"]
        for pid in pages:
            if "imageinfo" in pages[pid]:
                return pages[pid]["imageinfo"][0]["url"]
    except: pass

    return None

for thumb_url in set(urls):
    if "F1_car_placeholder" in thumb_url: continue
    
    orig = get_original_url(thumb_url)
    if orig:
        print(f"Replacing {thumb_url} -> {orig}")
        content = content.replace(thumb_url, orig)
    time.sleep(0.1)

# Also fix the 404s we found:
fix_map = {
    r'https://upload.wikimedia.org/wikipedia/commons/4/4b/Dallara_logo.svg': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Dallara_logo.svg',
    r'https://upload.wikimedia.org/wikipedia/commons/9/91/EuroBrun_logo.png': 'https://upload.wikimedia.org/wikipedia/commons/8/86/BRUN_MOTORSPORT_LOGO.png',
    r'https://upload.wikimedia.org/wikipedia/commons/3/36/Osella.svg': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Osella.svg',
    r'https://upload.wikimedia.org/wikipedia/commons/1/1a/March_Engineering_logo.svg': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/March_Engineering.png',
    r'"Andrea Moda": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/F1_car_placeholder.svg/300px-F1_car_placeholder.svg.png" }': '"Andrea Moda": { url: "https://upload.wikimedia.org/wikipedia/en/e/e0/Andrea_moda.png", className: "bg-white p-0.5 rounded-sm" }',
    r'Life: { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/F1_car_placeholder.svg/300px-F1_car_placeholder.svg.png" }': 'Life: { url: "https://upload.wikimedia.org/wikipedia/en/2/29/Life_Racing_engines.png", className: "bg-white p-0.5 rounded-sm" }',
    r'Fondmetal: { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/F1_car_placeholder.svg/300px-F1_car_placeholder.svg.png" }': 'Fondmetal: { url: "https://upload.wikimedia.org/wikipedia/en/9/93/Fondmetal_Logo.png", className: "bg-white p-0.5 rounded-sm" }'
}

for k, v in fix_map.items():
    content = content.replace(k, v)

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "w") as f:
    f.write(content)

print("Finished fixing 400s and 404s!")
