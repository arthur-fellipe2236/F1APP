with open('../f1-app/src/lib/assets.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. In NATIONALITY_TO_ISO, remove duplicate lines:
# line 41 português: "pt" (line 8 already has it)
# line 90 "hongconguês": "hk" (line 9 already has it)
# line 91 dinamarquês: "dk" (line 20 already has it)

# 2. In COUNTRY_TO_ISO:
# remove duplicate "méxico": "mx", duplicate "países baixos": "nl", duplicate "emirados árabes unidos": "ae"

# 3. In TEAM_LOGO_BY_NAME:
# remove duplicate keys:
# "Aston Martin": { url: "/aston/aston-5.jpg", className: "bg-white rounded-sm" },
# "Red Bull Racing": { url: f1Logo("Red Bull") },
# Ferrari: { url: f1Logo("Ferrari") },
# McLaren: { url: f1Logo("McLaren") },
# Mercedes: { url: f1Logo("Mercedes") },
# Williams: { url: f1Logo("Williams") },
# "Kick Sauber": { url: f1Logo("Kick Sauber") },

# Let's clean NATIONALITY_TO_ISO
text = text.replace('  português: "pt",\n  húngaro:', '  húngaro:')
text = text.replace('  "hongconguês": "hk",\n  dinamarquês: "dk",\n  "ar":', '  "ar":')

# Clean COUNTRY_TO_ISO
text = text.replace('  "méxico": "mx",\n\n  mexico: "mx",\n  méxico: "mx",', '  "méxico": "mx",\n  mexico: "mx",')
text = text.replace('  "países baixos": "nl",\n  "países baixos": "nl",', '  "países baixos": "nl",')
text = text.replace('  "emirados árabes unidos": "ae",\n  "abu dhabi": "ae",', '  "abu dhabi": "ae",')

# Clean TEAM_LOGO_BY_NAME duplicates around lines 503-519
text = text.replace('  "Aston Martin": { url: "/aston/aston-5.jpg", className: "bg-white rounded-sm" },\n', '')
text = text.replace('  "Red Bull Racing": { url: f1Logo("Red Bull") },\n', '')
text = text.replace('  Ferrari: { url: f1Logo("Ferrari") },\n', '')
text = text.replace('  McLaren: { url: f1Logo("McLaren") },\n', '')
text = text.replace('  Mercedes: { url: f1Logo("Mercedes") },\n', '')
text = text.replace('  Williams: { url: f1Logo("Williams") },\n', '')
text = text.replace('  "Kick Sauber": { url: f1Logo("Kick Sauber") },\n', '')

with open('../f1-app/src/lib/assets.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("assets.ts deduplicated successfully!")
