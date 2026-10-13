import urllib.request, json
from app import create_app
from app.extensions import db
from app.models import Driver
import urllib.parse
import time

app = create_app()
with app.app_context():
    drivers = Driver.query.filter(Driver.headshot_url.is_(None)).all()
    print(f"Found {len(drivers)} drivers without headshots.")
    
    updated = 0
    for driver in drivers:
        title = urllib.parse.quote(f"{driver.first_name} {driver.last_name}")
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=pageimages&format=json&pithumbsize=300"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'F1App/1.0'})
            resp = json.loads(urllib.request.urlopen(req).read())
            pages = resp['query']['pages']
            page_id = list(pages.keys())[0]
            if page_id != '-1' and 'thumbnail' in pages[page_id]:
                img_url = pages[page_id]['thumbnail']['source']
                driver.headshot_url = img_url
                updated += 1
                print(f"Found image for {driver.first_name} {driver.last_name}: {img_url}")
            time.sleep(1) # Slowed down to avoid 429
        except Exception as e:
            print(f"Error for {driver.first_name} {driver.last_name}: {e}")
    db.session.commit()
    print(f"Updated {updated} drivers.")
