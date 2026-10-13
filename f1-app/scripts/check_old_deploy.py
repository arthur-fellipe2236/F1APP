import urllib.request
import json
import os

with open(os.path.expanduser('~/.local/share/com.vercel.cli/auth.json')) as f:
    token = json.load(f).get('token')

# Successful deployment from 35d ago
deploy_url = "https://f1-3xzqtxv09-f1-app.vercel.app"
req = urllib.request.Request(f"https://api.vercel.com/v13/deployments/f1-3xzqtxv09-f1-app.vercel.app", headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read())
    print("Id:", data.get("id"))
    print("ReadyState:", data.get("readyState"))
    print("NodeVersion:", data.get("nodeVersion"))
    print("ProjectSettings:", json.dumps(data.get("projectSettings"), indent=2))
    print("Build:", json.dumps(data.get("build"), indent=2))
