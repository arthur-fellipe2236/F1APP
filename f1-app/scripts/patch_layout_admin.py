import re

with open('src/components/layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add user to store destructuring
if 'const { series, setSeries, teamTheme } = useAppStore()' in content:
    content = content.replace('const { series, setSeries, teamTheme } = useAppStore()', 'const { series, setSeries, teamTheme, user } = useAppStore()')

# Add the admin link logic
nav_loop = '''{navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-2 py-4 font-f1 uppercase text-sm tracking-widest font-semibold text-white/70 transition-all hover:text-white",
                    isActive && "text-base font-bold text-white tracking-widest"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}'''

new_nav_loop = '''{navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-2 py-4 font-f1 uppercase text-sm tracking-widest font-semibold text-white/70 transition-all hover:text-white",
                    isActive && "text-base font-bold text-white tracking-widest"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            
            {user?.is_admin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-2 py-4 font-f1 uppercase text-sm tracking-widest font-semibold text-amber-500/70 transition-all hover:text-amber-500",
                    isActive && "text-base font-bold text-amber-500 tracking-widest"
                  )
                }
              >
                Admin
              </NavLink>
            )}'''

if 'user?.is_admin' not in content:
    content = content.replace(nav_loop, new_nav_loop)
    with open('src/components/layout.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
print("Patched layout.tsx to show admin link")
