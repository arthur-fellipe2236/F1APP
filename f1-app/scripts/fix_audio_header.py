import re

with open('src/components/race-news-cards.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

header_start = '<h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">'

if 'AudioBulletinButton' not in content.split('RaceNewsCards({')[1]:
    # We need to wrap the h2 and add the button
    
    # Let's find the h2 closing tag
    pattern = r'(<h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">.*?Últimas notícias\s*</h2>)'
    
    replacement = r'''<div className="flex items-center justify-between">
        \1
        {user && <AudioBulletinButton />}
      </div>'''
      
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open('src/components/race-news-cards.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
print("Patched UI header")
