import re

with open('../f1-app/src/pages/live-timing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add in_pit to interface
interface_old = '''    compound: string | null
  }>'''
interface_new = '''    compound: string | null
    in_pit?: boolean
  }>'''
content = content.replace(interface_old, interface_new)

# Add P badge
badge_old = '''<span className="font-bold">{driver.name}</span>'''
badge_new = '''<span className="font-bold flex items-center gap-2">
                          {driver.name}
                          {driver.in_pit && <span className="bg-white text-black px-1.5 rounded-sm text-[10px] font-black tracking-widest leading-none py-0.5" title="No Pitlane">P</span>}
                        </span>'''
content = content.replace(badge_old, badge_new)

# Dim the driver row if in pit? Let's just add the badge as requested.

with open('../f1-app/src/pages/live-timing.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added P badge to UI!")
