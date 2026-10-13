import re

with open('../f1-api/app/mock_data.py', 'r', encoding='utf-8') as f:
    content = f.read()

teams = set(re.findall(r'"team_name":\s*"([^"]+)"', content))
print("Teams in mock data:")
for t in sorted(teams):
    print(t)
