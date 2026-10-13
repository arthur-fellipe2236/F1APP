import urllib.request
import re

url = 'https://www.formula1.com/en/racing/2026'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print(f'HTML length: {len(html)}')
        
        # O F1 website mudou muito. Vamos tentar procurar qualquer dado json ou titulo
        matches = re.findall(r'<title>(.*?)</title>', html)
        print("Title:", matches)
        
        # Vamos pegar os nomes das corridas
        races = re.findall(r'data-race-name="(.*?)"', html)
        if not races:
            races = re.findall(r'href="/en/racing/2026/(.*?).html"', html)
            
        print("Races found:", len(races))
        print(races[:5])
        
        # Vamos salvar o html para analisar
        with open('f1_2026_cal.html', 'w', encoding='utf-8') as f:
            f.write(html)
except Exception as e:
    print('Error:', e)
