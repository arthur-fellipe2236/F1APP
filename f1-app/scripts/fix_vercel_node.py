import urllib.request
import json
import os

with open(os.path.expanduser('~/.local/share/com.vercel.cli/auth.json')) as f:
    token = json.load(f).get('token')

project_id = "prj_ADC4cAZef0kopkC7VK51h1LniX0J"
url = f"https://api.vercel.com/v9/projects/{project_id}"
payload = json.dumps({"nodeVersion": "24.x"}).encode('utf-8')

req = urllib.request.Request(url, data=payload, headers={
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}, method="PATCH")

with urllib.request.urlopen(req) as res:
    data = json.loads(res.read())
    print("Restored Node Version to:", data.get("nodeVersion"))
