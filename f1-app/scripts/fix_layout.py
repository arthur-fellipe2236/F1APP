import re

with open('../f1-app/src/components/layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the duplicate navItems block
content = re.sub(
    r'// \.\.\. \(HealthBadge logic remains the same below\).*?\]\n', 
    '', 
    content, 
    flags=re.DOTALL
)

# Insert the RadioPlayer inside the footer or layout div
content = content.replace(
    '</main>\n      <footer',
    '</main>\n      <RadioPlayer />\n      <footer'
)

with open('../f1-app/src/components/layout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Layout fixed!")
