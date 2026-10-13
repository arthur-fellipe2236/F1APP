import re
import urllib.request
import ssl

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "r") as f:
    content = f.read()

urls = re.findall(r'url: "(https://[^"]+)"', content)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

broken = []
for url in set(urls):
    # skip fast some known ones
    if "F1_car_placeholder" in url or "transform/1col" in url:
        continue
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, context=ctx, timeout=5)
        if resp.getcode() != 200:
            broken.append(url)
    except urllib.error.HTTPError as e:
        broken.append(url + f" (HTTP {e.code})")
    except Exception as e:
        broken.append(url + f" (Error {e})")

for b in broken:
    print(f"BROKEN: {b}")
print("Done checking URLs.")
