import re
with open('/mnt/c/Users/DESKTOP/.gemini/antigravity/brain/7e2e099d-9992-4d26-bedd-8e873c6e6bf4/.system_generated/steps/15411/content.md', 'r', encoding='utf-8') as f:
    text = f.read()

# find all names before the points
# The structure is likely:
# <span class="max-md:hidden">Verstappen</span>
# <td ...>302</td>
matches = re.finditer(r'<span class="max-md:hidden">([^<]+)</span>.*?<td class="[^"]*">([0-9]+(?:\.[0-9]+)?)</td>', text, re.DOTALL)
for m in list(matches)[:20]:
    print(m.group(1), m.group(2))
