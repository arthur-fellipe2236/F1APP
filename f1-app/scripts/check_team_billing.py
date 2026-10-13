import urllib.request
import json
import os

with open(os.path.expanduser('~/.local/share/com.vercel.cli/auth.json')) as f:
    token = json.load(f).get('token')

team_id = "team_CEPexuwR9EUNbmty3uHaJyBW"
req = urllib.request.Request(f"https://api.vercel.com/v2/teams/{team_id}", headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as res:
    team = json.loads(res.read())
    print("Billing:", team.get("billing"))
    print("Blocked:", team.get("blocked"))
    print("SoftBlock:", team.get("softBlock"))
    print("DisabledReason:", team.get("disabledReason"))
