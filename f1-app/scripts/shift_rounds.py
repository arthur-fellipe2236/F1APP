import re

with open('../f1-api/app/api/races.py', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace round 23 with 24, 22 with 23, etc down to 16 with 17 to avoid cascades
for i in range(23, 15, -1):
    c = c.replace(f'"round": {i}', f'"round": {i+1}')

with open('../f1-api/app/api/races.py', 'w', encoding='utf-8') as f:
    f.write(c)

print("Shifted payload rounds!")
