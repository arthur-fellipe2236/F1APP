import urllib.request, json
try:
    res = urllib.request.urlopen('http://localhost:5000/api/v1/live/tower').read()
    print(json.loads(res.decode('utf-8')))
except Exception as e:
    print('ERROR:', e)
