import re

with open('../f1-api/app/api/standings.py', 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'def team_standings\(\):.*?return jsonify', text, re.DOTALL)
if match:
    print(match.group(0))
