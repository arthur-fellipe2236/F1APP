import urllib.request
import re
import time
from threading import Lock

_cache = {}
_lock = Lock()
TTL = 60

DRIVER_DATA = {
    "Nikola Tsolov": {"nationality": "Búlgaro", "team": "Campos Racing", "wins": 5, "podiums": 10},
    "Rafael Câmara": {"nationality": "Brasileiro", "team": "Invicta Racing", "wins": 5, "podiums": 10, "headshot": "https://media.formula1.com/image/upload/t_16by9North/f_auto/q_auto/v1788533549/fom-website/2026/Formula%202/GettyImages-2293510516.jpg"},
    "Gabriele Minì": {"nationality": "Italiano", "team": "MP Motorsport", "wins": 2, "podiums": 7},
    "Alex Dunne": {"nationality": "Irlandês", "team": "Rodin Motorsport", "wins": 0, "podiums": 6},
    "Alexander Dunne": {"nationality": "Irlandês", "team": "Rodin Motorsport", "wins": 0, "podiums": 6},
    "Noel León": {"nationality": "Mexicano", "team": "Campos Racing", "wins": 3, "podiums": 5},
    "Noel Leon": {"nationality": "Mexicano", "team": "Campos Racing", "wins": 3, "podiums": 5},
    "Dino Beganovic": {"nationality": "Sueco", "team": "DAMS Lucas Oil", "wins": 1, "podiums": 4},
    "Joshua Dürksen": {"nationality": "Paraguaio", "team": "Invicta Racing", "wins": 3, "podiums": 4},
    "Kush Maini": {"nationality": "Indiano", "team": "ART Grand Prix", "wins": 1, "podiums": 2},
    "Laurens van Hoepen": {"nationality": "nl", "team": "Trident", "wins": 0, "podiums": 3},
    "Tasanapol Inthraphuvasak": {"nationality": "Tailandês", "team": "ART Grand Prix", "wins": 0, "podiums": 2},
    "Martinius Stenshorne": {"nationality": "Norueguês", "team": "Rodin Motorsport", "wins": 1, "podiums": 2},
    "Ritomo Miyata": {"nationality": "Japonês", "team": "Hitech Pulse-Eight", "wins": 1, "podiums": 2},
    "John Bennett": {"nationality": "Britânico", "team": "Trident", "wins": 1, "podiums": 2},
    "Rafael Villagómez": {"nationality": "Mexicano", "team": "Van Amersfoort Racing", "wins": 0, "podiums": 1},
    "Rafael Villagomez": {"nationality": "Mexicano", "team": "Van Amersfoort Racing", "wins": 0, "podiums": 1},
    "Oliver Goethe": {"nationality": "Alemão", "team": "MP Motorsport", "wins": 0, "podiums": 0},
    "Sebastián Montoya": {"nationality": "co", "team": "Prema Racing", "wins": 0, "podiums": 0},
    "Sebastian Montoya": {"nationality": "co", "team": "Prema Racing", "wins": 0, "podiums": 0},
    "Colton Herta": {"nationality": "Americano", "team": "Hitech Pulse-Eight", "wins": 0, "podiums": 0},
    "Roman Bilinski": {"nationality": "Polonês", "team": "DAMS Lucas Oil", "wins": 0, "podiums": 1},
    "Nico Varrone": {"nationality": "ar", "team": "Van Amersfoort Racing", "wins": 0, "podiums": 1},
    "Mari Boya": {"nationality": "Espanhol", "team": "Prema Racing", "wins": 0, "podiums": 0},
    "Emerson Fittipaldi Jr.": {"nationality": "Brasileiro", "team": "AIX Racing", "wins": 0, "podiums": 0},
    "Emerson Fittipaldi": {"nationality": "Brasileiro", "team": "AIX Racing", "wins": 0, "podiums": 0},
    "Cian Shields": {"nationality": "Britânico", "team": "AIX Racing", "wins": 0, "podiums": 0},
    "Gabriele Mini": {"nationality": "Italiano", "team": "MP Motorsport", "wins": 2, "podiums": 7},
    "Hiyu Yamakoshi": {"nationality": "Japonês", "team": "Trident", "wins": 0, "podiums": 0},
    "Ugo Ugochukwu": {"nationality": "Estadunidense", "team": "Prema Racing", "wins": 0, "podiums": 0, "headshot": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Ugo_Ugochukwu_2026_%28headshot%29.jpg"},
    "Freddie Slater": {"nationality": "Britânico", "team": "Prema Racing", "wins": 0, "podiums": 0},
    "Tuukka Taponen": {"nationality": "Finlandês", "team": "ART Grand Prix", "wins": 0, "podiums": 0},
    "Brando Badoer": {"nationality": "Italiano", "team": "Prema Racing", "wins": 0, "podiums": 0},
    "Théophile Naël": {"nationality": "Francês", "team": "Van Amersfoort Racing", "wins": 0, "podiums": 0},
    "Noah Strømsted": {"nationality": "Dinamarquês", "team": "Campos Racing", "wins": 0, "podiums": 0},
    "James Wharton": {"nationality": "Australiano", "team": "Hitech Pulse-Eight", "wins": 0, "podiums": 0},
    "Maciej Gładysz": {"nationality": "Polonês", "team": "ART Grand Prix", "wins": 0, "podiums": 0},
    "Ernesto Rivera": {"nationality": "Mexicano", "team": "Campos Racing", "wins": 0, "podiums": 0},
    "Pedro Clerot": {"nationality": "Brasileiro", "team": "Rodin Motorsport", "wins": 0, "podiums": 0},
    "Bruno del Pino": {"nationality": "Espanhol", "team": "MP Motorsport", "wins": 0, "podiums": 0},
    "Gerrard Xie": {"nationality": "Hongconguês", "team": "Hitech Pulse-Eight", "wins": 0, "podiums": 0},
    "Nicola Lacorte": {"nationality": "Italiano", "team": "DAMS Lucas Oil", "wins": 0, "podiums": 0},
    "Jin Nakamura": {"nationality": "Japonês", "team": "Hitech Pulse-Eight", "wins": 0, "podiums": 0},
    "Taito Kato": {"nationality": "Japonês", "team": "ART Grand Prix", "wins": 0, "podiums": 0},
    "Ivan Domingues": {"nationality": "Português", "team": "Van Amersfoort Racing", "wins": 0, "podiums": 0},
    "Christian Ho": {"nationality": "sg", "team": "Campos Racing", "wins": 0, "podiums": 0},
    "Louis Sharp": {"nationality": "nz", "team": "Rodin Motorsport", "wins": 0, "podiums": 0},
    "Kean Nakamura-Berta": {"nationality": "gb", "team": "Prema Racing", "wins": 0, "podiums": 0},
    "Alex Powell": {"nationality": "Jamaicano", "team": "ART Grand Prix", "wins": 0, "podiums": 0},
    "Enzo Deligny": {"nationality": "Francês", "team": "MP Motorsport", "wins": 0, "podiums": 0},
    "Tim Gerhards": {"nationality": "gb", "team": "Jenzer Motorsport", "wins": 0, "podiums": 0},
    "Valerio Rinicella": {"nationality": "gb", "team": "MP Motorsport", "wins": 0, "podiums": 0},
    "Joseph Loake": {"nationality": "gb", "team": "Rodin Motorsport", "wins": 0, "podiums": 0},
    "Roman Bilinski": {"nationality": "Britânico", "team": "Rodin Motorsport", "wins": 0, "podiums": 0},
    "Sophia Flörsch": {"nationality": "gb", "team": "Van Amersfoort Racing", "wins": 0, "podiums": 0},
    "Charlie Wurz": {"nationality": "at", "team": "Jenzer Motorsport", "wins": 0, "podiums": 0},
    "Cian Shields": {"nationality": "gb", "team": "Jenzer Motorsport", "wins": 0, "podiums": 0},
    "Nikita Bedrin": {"nationality": "it", "team": "PHM AIX Racing", "wins": 0, "podiums": 0},
    "Joshua Dufek": {"nationality": "ch", "team": "PHM AIX Racing", "wins": 0, "podiums": 0},

    "Noah Stromsted": {"nationality": "Dinamarquês", "team": "Campos Racing", "wins": 0, "podiums": 0},
    "Bruno Del Pino": {"nationality": "Espanhol", "team": "MP Motorsport", "wins": 0, "podiums": 0},
    "Maciej Gladysz": {"nationality": "Polonês", "team": "ART Grand Prix", "wins": 0, "podiums": 0},
    "Mattia Colnaghi": {"nationality": "Italiano", "team": "TRIDENT", "wins": 0, "podiums": 0},
    "Alessandro Giusti": {"nationality": "Francês", "team": "Van Amersfoort Racing", "wins": 0, "podiums": 0},
    "Yevan David": {"nationality": "Cingalês", "team": "PREMA Racing", "wins": 0, "podiums": 0},
    "Kanato Le": {"nationality": "Japonês", "team": "Hitech", "wins": 0, "podiums": 0},
    "Matteo De Palo": {"nationality": "Italiano", "team": "DAMS Lucas Oil", "wins": 0, "podiums": 0},
    "Brad Benavides": {"nationality": "Estadunidense", "team": "AIX Racing", "wins": 0, "podiums": 0},
    "Fionn Mclaughlin": {"nationality": "Irlandês", "team": "Rodin Motorsport", "wins": 0, "podiums": 0},
    "Fernando Barrichello": {"nationality": "Brasileiro", "team": "PREMA Racing", "wins": 0, "podiums": 0},
    "Jose Garfias": {"nationality": "Mexicano", "team": "Campos Racing", "wins": 0, "podiums": 0},
    "Nandhavud Bhirombhakdi": {"nationality": "Tailandês", "team": "AIX Racing", "wins": 0, "podiums": 0},
    "Ricardo Escotto": {"nationality": "Mexicano", "team": "TRIDENT", "wins": 0, "podiums": 0},
    "Patrick Heuzenroeder": {"nationality": "Australiano", "team": "MP Motorsport", "wins": 0, "podiums": 0},
    "Woohyun Shin": {"nationality": "Sul-Coreano", "team": "ART Grand Prix", "wins": 0, "podiums": 0},
    "Salim Hanna": {"nationality": "Colombiano", "team": "Van Amersfoort Racing", "wins": 0, "podiums": 0},
}



TEAM_DATA = {
    "Campos Racing": {"wins": 8, "podiums": 15},
    "Invicta Racing": {"wins": 8, "podiums": 14},
    "Rodin Motorsport": {"wins": 1, "podiums": 8},
    "MP Motorsport": {"wins": 2, "podiums": 7},
    "ART Grand Prix": {"wins": 1, "podiums": 4},
    "DAMS Lucas Oil": {"wins": 1, "podiums": 5},
    "Trident": {"wins": 1, "podiums": 5},
    "Hitech Pulse-Eight": {"wins": 1, "podiums": 2},
    "Van Amersfoort Racing": {"wins": 0, "podiums": 2},
    "Prema Racing": {"wins": 0, "podiums": 0},
    "AIX Racing": {"wins": 0, "podiums": 0},
}

def _scrape_series(series, category):
    if series == 'f2':
        url = f"https://www.fiaformula2.com/Standings/{category.capitalize()}"
    else:
        url = f"https://www.fiaformula3.com/Standings/{category.capitalize()}"
        
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        html = html.replace('\\"', '"')
        html = html.replace('\\u00e2', 'â')
        html = html.replace('\\u00E2', 'â')
        
        data = []
        if category == 'driver':
            # We must use regex to capture the full driver blocks to count the races array
            blocks = re.findall(r'(\{[^{}]*"driverFirstName":"[^"]+"[^{}]*\})', html)
            
            for i, block in enumerate(blocks):
                try:
                    pts_match = re.search(r'"championshipPoints":([0-9.]+)', block)
                    fn_match = re.search(r'"driverFirstName":"([^"]+)"', block)
                    ln_match = re.search(r'"driverLastName":"([^"]+)"', block)
                    
                    if not (pts_match and fn_match and ln_match):
                        continue
                        
                    points = float(pts_match.group(1))
                    first = fn_match.group(1)
                    last = ln_match.group(1)
                    name = f"{first} {last}"
                    
                    # Calculate races by counting non-null pairs in the points array
                    # "points":[[0,18],[0,16],...,[null,null]]
                    pts_array_match = re.search(r'"points":\[(.*?)\]\}', block)
                    races = 0
                    if pts_array_match:
                        # count pairs that contain numbers, ignoring [null,null]
                        pairs = re.findall(r'\[([0-9]+,[0-9]+|[0-9]+,[0-9]+,null)\]', pts_array_match.group(1))
                        races = len(pairs)
                        
                    meta = DRIVER_DATA.get(name, {})
                    
                    data.append({
                        "driver_id": f"scraped_{series}_{i}",
                        "driver_name": name,
                        "driver_code": last[:3].upper(),
                        "nationality": meta.get("nationality", ""),
                        "headshot_url": meta.get("headshot", None),
                        "team_name": meta.get("team", "TBC"),
                        "points": points,
                        "wins": meta.get("wins", 0),
                        "podiums": meta.get("podiums", 0),
                        "races": races,
                        "position": i + 1
                    })
                except Exception:
                    pass
                    
        elif category == 'team':
            # Extract the standings array for Team
            standings_match = re.search(r'"standings":(\[.*?\]),"category":"Team"', html)
            if standings_match:
                import json
                try:
                    standings = json.loads(standings_match.group(1))
                    for i, t in enumerate(standings):
                        name = t.get("teamName")
                        points = float(t.get("championshipPoints", 0))
                        
                        races = 0
                        for pt_pair in t.get("points", []):
                            if isinstance(pt_pair, list) and len(pt_pair) >= 2:
                                if pt_pair[0] is not None or pt_pair[1] is not None:
                                    races += 1
                                    
                        meta = TEAM_DATA.get(name, {})
                        data.append({
                            "team_id": f"scraped_{series}_{i}",
                            "team_name": name,
                            "points": points,
                            "wins": meta.get("wins", 0),
                            "podiums": meta.get("podiums", 0),
                            "races": races,
                            "position": i + 1
                        })
                except Exception as e:
                    print("JSON Parse error:", e)
                    
        return data
    except Exception as e:
        print(f"Scrape error {series} {category}: {e}")
        return []

def get_standings(series, category):
    key = f"{series}_{category}"
    now = time.time()
    
    with _lock:
        if key in _cache and now - _cache[key]['time'] < TTL:
            return _cache[key]['data']
            
    data = _scrape_series(series, category)
    
    with _lock:
        _cache[key] = {'time': now, 'data': data}
        
    return data
