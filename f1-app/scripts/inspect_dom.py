from playwright.sync_api import sync_playwright

def inspect_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('https://app.formula1dashboard.com/live-timing/', wait_until='networkidle')
        page.wait_for_selector('table tbody tr', timeout=15000)
        
        # Get the inner HTML of the first row to inspect it
        row_html = page.locator('table tbody tr').first.inner_html()
        with open('/home/arthur/Projects/f1-api/app/api/row_html.txt', 'w', encoding='utf-8') as f:
            f.write(row_html)
            
        browser.close()
        print("Saved row HTML!")

if __name__ == "__main__":
    inspect_dashboard()
