import urllib.request, json, urllib.parse
req = urllib.request.Request('https://en.wikipedia.org/w/api.php?action=query&titles=File:' + urllib.parse.quote('F1 2011 Test Jerez 19 (cropped).jpg') + '&prop=imageinfo&iiprop=url&format=json', headers={'User-Agent': 'Mozilla/5.0'})
resp = json.loads(urllib.request.urlopen(req).read())
pages = resp['query']['pages']
print(list(pages.values())[0]['imageinfo'][0]['url'])
