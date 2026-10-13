with open('../f1-app/src/lib/assets.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('singapore: "sg",', 'singapore: "sg",\n  singapura: "sg",')

with open('../f1-app/src/lib/assets.ts', 'w', encoding='utf-8') as f:
    f.write(content)
