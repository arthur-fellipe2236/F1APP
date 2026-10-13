import re

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "r") as f:
    content = f.read()

content = content.replace('className: "p-2"', 'className: "bg-white p-0.5 rounded-sm"')

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "w") as f:
    f.write(content)
