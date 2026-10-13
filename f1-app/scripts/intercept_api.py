from playwright.sync_api import sync_playwright
import json

def intercept_api():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # We will collect all JSON responses
        responses = {}
        
        def handle_response(response):
            if "api" in response.url or "json" in response.url or "live-timing" in response.url:
                try:
                    if response.ok and "application/json" in response.headers.get("content-type", ""):
                        responses[response.url] = response.json()
                except:
                    pass
                    
        page.on("response", handle_response)
        
        print("Navigating to dashboard...")
        page.goto('https://app.formula1dashboard.com/live-timing/', wait_until='networkidle')
        page.wait_for_selector('table tbody tr', timeout=15000)
        
        print("Intercepted APIs:")
        for url in responses.keys():
            print(f"- {url}")
            
        # Save to file
        with open('/home/arthur/Projects/f1-api/app/api/intercepted.json', 'w') as f:
            json.dump(responses, f, indent=2)
            
        browser.close()

if __name__ == "__main__":
    intercept_api()
