import re

with open('../f1-app/src/lib/assets.ts', 'r', encoding='utf-8') as f:
    content = f.read()

missing_keys = '''
  "catar": "qa",
  "uae": "ae",
  "emirados árabes unidos": "ae",
  "abu dhabi": "ae",
  "méxico": "mx",
'''

if '"catar": "qa"' not in content:
    content = content.replace('qatar: "qa",', 'qatar: "qa",' + missing_keys)

with open('../f1-app/src/lib/assets.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added catar, uae, emirados árabes unidos to assets.ts")
