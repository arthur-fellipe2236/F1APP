import urllib.request, json
req = urllib.request.Request('https://en.wikipedia.org/w/api.php?action=query&titles=Sebastian_Vettel&prop=images&format=json', headers={'User-Agent': 'Mozilla/5.0'})
resp = json.loads(urllib.request.urlopen(req).read())
pages = resp['query']['pages']
for p in pages.values():
    for img in p.get('images', []):
        print(img['title'])
