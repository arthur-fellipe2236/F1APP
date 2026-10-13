import re

with open('../f1-app/src/pages/dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to add isF12026 if it doesn't exist, and update totalRaces.
# It seems isF12026 doesn't exist yet, but we have seasonParam and seriesParam.
# Wait, let's just do `seasonParam === 2026 && seriesParam === "f1" ? 18`

old_line = "  const totalRaces = isF12021 ? 22 : isF22026 ? 22 : isF32026 ? 19 : (races.data?.meta.total ?? 0)"
new_line = "  const totalRaces = (seasonParam === 2026 && seriesParam === 'f1') ? 18 : isF12021 ? 22 : isF22026 ? 22 : isF32026 ? 19 : (races.data?.meta.total ?? 0)"

if old_line in content:
    content = content.replace(old_line, new_line)
    with open('../f1-app/src/pages/dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced totalRaces logic.")
else:
    print("Could not find the totalRaces line.")
