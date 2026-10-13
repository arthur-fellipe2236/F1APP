import re
with open('/mnt/c/Users/DESKTOP/.gemini/antigravity/brain/7e2e099d-9992-4d26-bedd-8e873c6e6bf4/.system_generated/steps/15411/content.md', 'r', encoding='utf-8') as f:
    text = f.read()

points = re.findall(r'<td class="[^"]*">([0-9]+(?:\.[0-9]+)?)</td>', text)
print(points[:20])
