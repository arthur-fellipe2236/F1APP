import re
with open('/mnt/c/Users/DESKTOP/.gemini/antigravity/brain/7e2e099d-9992-4d26-bedd-8e873c6e6bf4/.system_generated/steps/15411/content.md', 'r', encoding='utf-8') as f:
    text = f.read()

for match in re.finditer(r'McLaren-Mercedes', text):
    start = max(0, match.start() - 50)
    end = min(len(text), match.end() + 250)
    print("MATCH:", text[start:end])
    print("-" * 40)
