import re

with open('../f1-app/src/pages/dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_line = "  const totalRaces = (seasonParam === 2026 && seriesParam === 'f1') ? 18 : isF12021 ? 22 : isF22026 ? 22 : isF32026 ? 19 : (races.data?.meta.total ?? 0)"
new_line = "  const totalRaces = (seasonParam === 2026 && series === 'f1') ? 18 : isF12021 ? 22 : isF22026 ? 22 : isF32026 ? 19 : (races.data?.meta.total ?? 0)"

if old_line in content:
    content = content.replace(old_line, new_line)
    with open('../f1-app/src/pages/dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed React crash.")
else:
    print("Line not found.")
