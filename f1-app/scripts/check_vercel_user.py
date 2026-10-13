import urllib.request
import json
import os

with open(os.path.expanduser('~/.local/share/com.vercel.cli/auth.json')) as f:
    token = json.load(f).get('token')

# Check user and teams
req = urllib.request.Request("https://api.vercel.com/v2/user", headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as res:
    user = json.loads(res.read())
    print("User:", user.get("user", {}).get("username"), user.get("user", {}).get("email"))

req = urllib.request.Request("https://api.vercel.com/v2/teams", headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as res:
    teams = json.loads(res.read())
    print("Teams:", [(t.get("slug"), t.get("name"), t.get("id")) for t in teams.get("teams", [])])
