import re

# Update App.tsx
with open('src/App.tsx', 'r') as f:
    app_content = f.read()

import_fantasy = '''const TeamsPage = lazy(() =>
  import("@/pages/teams").then((m) => ({ default: m.TeamsPage })),
)
const FantasyPage = lazy(() =>
  import("@/pages/fantasy").then((m) => ({ default: m.FantasyPage })),
)'''

if 'FantasyPage' not in app_content:
    app_content = app_content.replace('''const TeamsPage = lazy(() =>
  import("@/pages/teams").then((m) => ({ default: m.TeamsPage })),
)''', import_fantasy)
    
    app_content = app_content.replace('<Route path="live" element={<LiveTimingPage />} />', '<Route path="live" element={<LiveTimingPage />} />\n            <Route path="bolao" element={<FantasyPage />} />')

with open('src/App.tsx', 'w') as f:
    f.write(app_content)

# Update layout.tsx
with open('src/components/layout.tsx', 'r') as f:
    layout_content = f.read()

nav_item_fantasy = '''  { to: "/live", label: "Ao Vivo" },
  { to: "/bolao", label: "Bolão" },'''

if '"/bolao"' not in layout_content:
    layout_content = layout_content.replace('{ to: "/live", label: "Ao Vivo" },', nav_item_fantasy)

with open('src/components/layout.tsx', 'w') as f:
    f.write(layout_content)
    
print("Patched routing for Fantasy League")
