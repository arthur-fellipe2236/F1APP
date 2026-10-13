import re

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "r") as f:
    content = f.read()

# Replace all occurrences of bg-zinc-100 p-2 with bg-white p-0.5 rounded-sm
content = content.replace('className: "bg-zinc-100 p-2"', 'className: "bg-white p-0.5 rounded-sm"')

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "w") as f:
    f.write(content)

print("Updated padding for historic logos in assets.ts")
