import urllib.request
import json
import os

with open(os.path.expanduser('~/.local/share/com.vercel.cli/auth.json')) as f:
    token = json.load(f).get('token')

deploy_id = "dpl_7W1q4DW6HM74gkUAmLqHaKxyvhmj"
url = f"https://api.vercel.com/v2/deployments/{deploy_id}/events"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as res:
    events = json.loads(res.read())
    print(f"Total events: {len(events)}")
    for ev in events:
        print(ev.get("type"), ev.get("payload", {}).get("text", "") or ev.get("payload", {}))
