import re

with open('../f1-app/src/lib/assets.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to add missing countries to COUNTRY_TO_ISO mapping
missing_countries = """
  mexico: "mx",
  "méxico": "mx",
  qatar: "qa",
  catar: "qa",
  "united arab emirates": "ae",
  "emirados árabes unidos": "ae",
  "uae": "ae",
  "abu dhabi": "ae",
  singapore: "sg",
  singapura: "sg",
  brazil: "br",
  brasil: "br",
  japan: "jp",
  "japão": "jp",
  china: "cn",
  holanda: "nl",
  netherlands: "nl",
  hungary: "hu",
  hungria: "hu",
"""

if 'mexico: "mx"' not in content:
    # Find `const COUNTRY_TO_ISO = {`
    content = content.replace("const COUNTRY_TO_ISO = {", "const COUNTRY_TO_ISO = {" + missing_countries)

with open('../f1-app/src/lib/assets.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated assets.ts with missing country flags.")
