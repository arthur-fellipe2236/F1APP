import re
with open('/mnt/c/Users/DESKTOP/.gemini/antigravity/brain/7e2e099d-9992-4d26-bedd-8e873c6e6bf4/.system_generated/steps/15411/content.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Try to find sequences of driver names followed by numbers
# Let's just find the exact JSON objects that have driver names.
import json

# Find anything that looks like a list of dictionaries with driver names
matches = re.findall(r'\{[^{]*?"(driverFirstName|driverLastName|driverName|name)"[^}]*?\}', text)
for m in matches[:5]:
    pass # this regex is too broad

# Let's search for "Antonelli" or "Norris" and print 100 characters around it.
for match in re.finditer(r'Norris', text):
    start = max(0, match.start() - 50)
    end = min(len(text), match.end() + 250)
    print("MATCH:", text[start:end])
    print("-" * 40)
