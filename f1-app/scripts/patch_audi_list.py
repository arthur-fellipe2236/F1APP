import re

with open('../f1-api/app/api/teams.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_list = '                "RB", "Sauber"'
new_list = '                "RB", "Audi"'

if old_list in content:
    content = content.replace(old_list, new_list)
else:
    print("Warning: could not find the exact string to replace.")

with open('../f1-api/app/api/teams.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated F1 2026 grid list to use Audi instead of Sauber.")
