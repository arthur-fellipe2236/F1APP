from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('https://app.formula1dashboard.com/live-timing/', wait_until='networkidle')
        page.wait_for_selector('table tbody tr', timeout=15000)
        
        for r in page.locator('table tbody tr').all():
            print(r.inner_text().replace('\n', ' | '))
            
        browser.close()

if __name__ == "__main__":
    run()
