import urllib.request
import json
import os

with open(os.path.expanduser('~/.local/share/com.vercel.cli/auth.json')) as f:
    token = json.load(f).get('token')

project_id = "prj_ADC4cAZef0kopkC7VK51h1LniX0J"
req = urllib.request.Request(f"https://api.vercel.com/v9/projects/{project_id}", headers={"Authorization": f"Bearer {token}"})
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read())
    print("Project Name:", data.get("name"))
    print("Node Version:", data.get("nodeVersion"))
    print("Framework:", data.get("framework"))
    print("Root Directory:", data.get("rootDirectory"))
