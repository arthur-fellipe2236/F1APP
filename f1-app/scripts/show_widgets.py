import re

with open('../f1-app/src/pages/live-timing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the condition that hides the widgets when the API is blocked
old_line = '{liveData?.session?.state !== "API Bloqueada" && ('
new_line = '{true && ('

if old_line in content:
    content = content.replace(old_line, new_line)
    with open('../f1-app/src/pages/live-timing.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed Native Widgets visibility.")
else:
    print("Line not found.")
