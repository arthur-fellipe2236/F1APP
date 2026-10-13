import re

# Update App.tsx
with open('src/App.tsx', 'r') as f:
    app_content = f.read()

import_compare = '''const FantasyPage = lazy(() =>
  import("@/pages/fantasy").then((m) => ({ default: m.FantasyPage })),
)
const ComparePage = lazy(() =>
  import("@/pages/compare").then((m) => ({ default: m.ComparePage })),
)'''

if 'ComparePage' not in app_content:
    app_content = app_content.replace('''const FantasyPage = lazy(() =>
  import("@/pages/fantasy").then((m) => ({ default: m.FantasyPage })),
)''', import_compare)
    
    app_content = app_content.replace('<Route path="bolao" element={<FantasyPage />} />', '<Route path="bolao" element={<FantasyPage />} />\n            <Route path="comparar" element={<ComparePage />} />')

with open('src/App.tsx', 'w') as f:
    f.write(app_content)

# Update layout.tsx
with open('src/components/layout.tsx', 'r') as f:
    layout_content = f.read()

nav_item_compare = '''  { to: "/bolao", label: "Bolão" },
  { to: "/comparar", label: "Comparar" },'''

if '"/comparar"' not in layout_content:
    layout_content = layout_content.replace('{ to: "/bolao", label: "Bolão" },', nav_item_compare)

with open('src/components/layout.tsx', 'w') as f:
    f.write(layout_content)
    
print("Patched routing for Comparador")
