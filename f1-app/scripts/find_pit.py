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
            html = row.inner_html()
            
            # Check for greyed out text (often used for drivers in pits)
            is_muted = 'text-muted-foreground' in row.locator('td[data-leaderboard-column-id="driver"]').inner_html()
            
            # Check if interval or gap says "IN PIT" or "PIT"
            interval = row.locator('td[data-leaderboard-column-id="interval"]').inner_text().strip()
            gap = row.locator('td[data-leaderboard-column-id="gap"]').inner_text().strip()
            
            # Check if there is an img with alt="PIT"
            has_pit_img = 'pit' in html.lower()
            
            # Print analysis for this driver
            if is_muted or 'pit' in interval.lower() or 'pit' in gap.lower():
                print(f"{code}: Muted={is_muted}, Interval={interval}, Gap={gap}")
            
        browser.close()

if __name__ == "__main__":
    find_pit_status()
