import re

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "r") as f:
    content = f.read()

# Pattern: /thumb/ + (hash_dir) + /filename + /300px-filename.png
def repl(m):
    # m.group(0) is the full match
    # m.group(1) is 'en' or 'commons'
    # m.group(2) is the hash directory like '1/1a'
    # m.group(3) is the filename like 'Renault_F1_Team_logo.svg'
    return f'url: "https://upload.wikimedia.org/wikipedia/{m.group(1)}/{m.group(2)}/{m.group(3)}"'

content = re.sub(r'url: "https://upload\.wikimedia\.org/wikipedia/([^/]+)/thumb/([^/]+/[^/]+)/([^/]+)/[^"]+"', repl, content)

with open("/home/arthur/Projects/f1-app/src/lib/assets.ts", "w") as f:
    f.write(content)

print("Fixed all thumb URLs!")
