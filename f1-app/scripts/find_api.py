import requests
import re

html = requests.get('https://app.formula1dashboard.com/live-timing/').text
urls = re.findall(r'https?://[^\s\"\'<>]+', html)

api_urls = set()
for url in urls:
    if 'api' in url or 'json' in url or 'data' in url:
        api_urls.add(url)

for url in api_urls:
    print(url)
