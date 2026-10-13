from app import create_app, db
from app.models import Driver
import re

app = create_app()
with app.app_context():
    with open('/mnt/c/Users/DESKTOP/.gemini/antigravity/brain/7e2e099d-9992-4d26-bedd-8e873c6e6bf4/.system_generated/steps/15411/content.md', 'r', encoding='utf-8') as f:
        text = f.read()
        
    urls = set(re.findall(r'https://media\.formula1\.com/[^\"]*\.webp', text))
    driver_imgs = [u for u in urls if 'driver' in u and 'fallback' not in u.split('/')[-1]]
    
    for u in urls:
        if '/common/f1/2026/' in u and 'right.webp' in u:
            # Example: .../common/f1/2026/mercedes/andant01/2026mercedesandant01right.webp
            parts = u.split('/')
            code = parts[-2] # e.g. andant01
            
            # remove w_64 so it can be high res
            high_res_url = u.replace('c_lfill,w_64/q_auto/d_common:f1:2026:fallback:driver:2026fallbackdriverright.webp/', '')
            
            # Find driver by code logic (e.g. andant01 -> Antonelli)
            # We can extract the first 3 letters of the code and match Driver.last_name
            # But the code is 6 letters: and ant 01 -> Andrea Antonelli
            # gab bor 01 -> Gabriel Bortoleto
            # oli bea 01 -> Oliver Bearman
            # fra col 01 -> Franco Colapinto
            # lia law 01 -> Liam Lawson
            # arv lin 01 -> Arvid Lindblad
            
            fname_part = code[:3]
            lname_part = code[3:6]
            
            d = Driver.query.filter(
                Driver.first_name.like(f"%{fname_part}%"),
                Driver.last_name.like(f"%{lname_part}%")
            ).first()
            
            if d:
                d.headshot_url = high_res_url
                db.session.add(d)
                print(f"Updated {d.full_name} -> {high_res_url}")
                
    db.session.commit()
