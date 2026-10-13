import re

with open('/mnt/c/Users/DESKTOP/.gemini/antigravity/brain/7e2e099d-9992-4d26-bedd-8e873c6e6bf4/.system_generated/steps/15411/content.md', 'r', encoding='utf-8') as f:
    text = f.read()

urls = re.findall(r'https://media\.formula1\.com/[^\"]*andant[^\"]*', text)
for u in urls[:3]:
    print(u)
