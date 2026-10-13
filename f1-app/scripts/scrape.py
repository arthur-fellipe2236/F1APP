from playwright.sync_api import sync_playwright
import json
import time
import os

def scrape_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("Navigating to dashboard...")
        page.goto('https://app.formula1dashboard.com/live-timing/', wait_until='networkidle')
        
        # Wait for the table to load
        print("Waiting for table to load...")
        try:
            page.wait_for_selector('table tbody tr', timeout=15000)
        except Exception as e:
            print("Timeout waiting for table:", e)
            
        time.sleep(2) # Extra buffer for JS to populate fields
        
        print("Scraping rows...")
        rows = page.locator('table tbody tr').all()
        drivers = []
        for row in rows:
            cells = row.locator('td').all_inner_texts()
            if len(cells) >= 6:
                # Based on typical formula1dashboard:
                # Pos | Driver | Compound | Gap | Interval | Laps
                drivers.append({
                    'position': cells[0].strip(),
                    'driver': cells[1].strip(),
                    'compound': cells[2].strip(),
                    'gap': cells[3].strip(),
                    'interval': cells[4].strip(),
                    'laps': cells[5].strip()
                })
        
        browser.close()
        
        # Save to JSON
        output_file = '/home/arthur/Projects/f1-api/app/api/scraped_telemetry.json'
        with open(output_file, 'w') as f:
            json.dump(drivers, f, indent=2)
        print(f"Scraped {len(drivers)} drivers to {output_file}!")

if __name__ == "__main__":
    scrape_dashboard()
