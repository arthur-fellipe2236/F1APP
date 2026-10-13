from playwright.sync_api import sync_playwright

def find_pit_status():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('https://app.formula1dashboard.com/live-timing/', wait_until='networkidle')
        page.wait_for_selector('table tbody tr', timeout=15000)
        
        rows = page.locator('table tbody tr').all()
        for row in rows:
            code = row.locator('td[data-leaderboard-column-id="driver"]').inner_text().strip()
            
            try:
                last_lap = row.locator('td[data-leaderboard-column-id="last-lap"]').inner_text().strip()
            except:
                last_lap = ""
                
            try:
                best_lap = row.locator('td[data-leaderboard-column-id="best-lap"]').inner_text().strip()
            except:
                best_lap = ""
                
            try:
                pit_count = row.locator('td[data-leaderboard-column-id="pit"]').inner_text().strip()
            except:
                pit_count = ""
            
            # Print ALL column data to see what stands out
            print(f"{code} -> Last: '{last_lap}' | Best: '{best_lap}' | PitCount: '{pit_count}'")
            
        browser.close()

if __name__ == "__main__":
    find_pit_status()
