import re

with open('../f1-api/app/api/standings.py', 'r', encoding='utf-8') as f:
    text = f.read()

# just print the lines for team_standings
lines = text.split('\n')
in_func = False
for line in lines:
    if line.startswith("def team_standings"):
        in_func = True
    if in_func:
        print(line)
        if line.startswith("def "):
            if line.startswith("def team_standings"):
                pass
            else:
                break
