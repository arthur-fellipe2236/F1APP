from playwright.sync_api import sync_playwright
import json
import time

def scrape_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('https://app.formula1dashboard.com/live-timing/', wait_until='networkidle')
        page.wait_for_selector('table tbody tr', timeout=15000)
        time.sleep(2)
        
        rows = page.locator('table tbody tr').all()
        drivers = []
        for row in rows:
            try:
                pos_loc = row.locator('td[data-leaderboard-column-id="position"]')
                code_loc = row.locator('td[data-leaderboard-column-id="driver"]')
                if pos_loc.count() == 0 or code_loc.count() == 0:
                    continue

                pos = pos_loc.inner_text(timeout=2000).strip()
                code = code_loc.inner_text(timeout=2000).strip()
                if not pos or not code:
                    continue

                gap_loc = row.locator('td[data-leaderboard-column-id="gap"]')
                interval_loc = row.locator('td[data-leaderboard-column-id="interval"]')
                laps_loc = row.locator('td[data-leaderboard-column-id="laps"]')

                gap = gap_loc.inner_text(timeout=2000).strip() if gap_loc.count() > 0 else "—"
                interval = interval_loc.inner_text(timeout=2000).strip() if interval_loc.count() > 0 else "—"
                laps = laps_loc.inner_text(timeout=2000).strip() if laps_loc.count() > 0 else "0"
                
                # Check pitlane status
                row_text = row.inner_text(timeout=2000).upper()
                in_pit = "IN PIT" in row_text or "PIT" in row_text.split()
                
                tyre_td = row.locator('td[data-leaderboard-column-id="tyre"]')
                compound = "UNKNOWN"
                if tyre_td.count() > 0 and tyre_td.locator('img').count() > 0:
                    alt = tyre_td.locator('img').first.get_attribute('alt')
                    if alt:
                        compound = alt.split()[0].upper()
                
                drivers.append({
                    'position': pos,
                    'driver': code,
                    'compound': compound,
                    'gap': gap,
                    'interval': interval,
                    'laps': laps,
                    'in_pit': in_pit
                })
            except Exception as err:
                print(f"Skipping problematic row: {err}")
                continue
            
        browser.close()
        
        if drivers:
            output_file = '/home/arthur/Projects/f1-api/app/api/scraped_telemetry.json'
            with open(output_file, 'w') as f:
                json.dump(drivers, f, indent=2)
            print(f"Successfully scraped {len(drivers)} drivers.")

if __name__ == "__main__":
    scrape_dashboard()
