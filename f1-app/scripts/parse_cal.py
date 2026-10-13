import sys
from bs4 import BeautifulSoup
import json

try:
    with open('../f1-app/f1_2026_cal.html', 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    
    # In recent versions, F1 stores the JSON in a script block like <script id="__NEXT_DATA__"> or similar
    next_data = soup.find('script', id='__NEXT_DATA__')
    if next_data:
        data = json.loads(next_data.string)
        print("Found NEXT_DATA")
        sys.exit(0)
        
    # If not NEXT_DATA, let's find the links that look like race events
    # Example: href="/en/racing/2026/Australia.html"
    events = soup.find_all('a', href=lambda h: h and '/en/racing/2026/' in h)
    seen = set()
    races = []
    
    for a in events:
        href = a.get('href')
        if href in seen:
            continue
        seen.add(href)
        
        # Tentamos achar o data-race-name
        text = a.get_text(separator=' ').strip()
        print(f"Href: {href} -> Text: {text[:50]}")
        
except Exception as e:
    print(e)
