import json, re

with open('/mnt/c/Users/DESKTOP/.gemini/antigravity/brain/7e2e099d-9992-4d26-bedd-8e873c6e6bf4/.system_generated/steps/15411/content.md', 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'"rows":(\[\[.*?\]\])', text)
if match:
    rows_str = match.group(1)
    # The JSON string in the file might be serialized strangely, let's just print a substring
    print(rows_str[:500])
else:
    print("Could not find rows data")
