import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_admin = '''const AdminPage = lazy(() =>
  import("@/pages/admin").then((m) => ({ default: m.AdminPage })),
)'''

if 'AdminPage' not in content:
    content = content.replace('const ComparePage', import_admin + '\nconst ComparePage')
    content = content.replace('<Route path="comparar" element={<ComparePage />} />', '<Route path="comparar" element={<ComparePage />} />\n            <Route path="admin" element={<AdminPage />} />')
    
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
print("Patched App.tsx with admin route")
