import urllib.request
import json
import os

with open(os.path.expanduser('~/.local/share/com.vercel.cli/auth.json')) as f:
    token = json.load(f).get('token')

deploy_id = "dpl_7W1q4DW6HM74gkUAmLqHaKxyvhmj"
req = urllib.request.Request(f"https://api.vercel.com/v13/deployments/{deploy_id}", headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read())
    print("ReadyState:", data.get("readyState"))
    print("ErrorCode:", data.get("errorCode"))
    print("ErrorMessage:", data.get("errorMessage"))
    print("ErrorDetails:", json.dumps(data.get("error"), indent=2))
