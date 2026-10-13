import re

with open('../f1-app/src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the Team Themes block (if it still exists somehow)
if '/* Team Themes */' in content:
    content = content.split('/* Team Themes */')[0]
else:
    # the sed might have deleted it
    # Just split at the start of the broken block if any
    content = content.split('--primary: #34D399;')[0]
    
# clean up trailing bracket or whatever is left
lines = content.split('\n')
clean_lines = []
for line in lines:
    if '--primary: #34D399;' in line:
        break
    clean_lines.append(line)

while clean_lines and clean_lines[-1].strip() in ['}', '', '.dark .dark-invert { filter: brightness(0) invert(1) !important; }']:
    if '.dark .dark-invert { filter: brightness(0) invert(1) !important; }' in clean_lines[-1]:
        break # keep this one
    clean_lines.pop()

if clean_lines[-1] != '.dark .dark-invert { filter: brightness(0) invert(1) !important; }':
    clean_lines.append('.dark .dark-invert { filter: brightness(0) invert(1) !important; }')

with open('../f1-app/src/index.css', 'w', encoding='utf-8') as f:
    f.write('\n'.join(clean_lines) + '\n')
