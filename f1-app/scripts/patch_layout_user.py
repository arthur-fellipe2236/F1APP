with open('src/components/layout.tsx', 'r') as f:
    content = f.read()

import_stmt = 'import { UserProfile } from "@/components/user-profile"'
if import_stmt not in content:
    content = content.replace('import { ModeToggle }', import_stmt + '\nimport { ModeToggle }')

if '<UserProfile />' not in content:
    content = content.replace('<TeamThemeSelector />', '<UserProfile />\n            <TeamThemeSelector />')

with open('src/components/layout.tsx', 'w') as f:
    f.write(content)
print("Patched layout.tsx")
