window.addEventListener('DOMContentLoaded', () => {
    const url = window.location.href;
    
    // Inject only in F1/F2/F3 official domains
    if (url.includes('formula1.com') || url.includes('fiaformula2.com') || url.includes('fiaformula3.com')) {
        const style = document.createElement('style');
        style.innerHTML = `
            /* Hide F1 global headers, menus, promo banners and cookie popups */
            #globalheader, .global-header-container, .f1-unlocked-promo, 
            #onetrust-consent-sdk, .nav-wrapper, footer, .primary-nav,
            /* F2 & F3 headers */
            header, .site-header, .navbar, .cookie-banner, .banner-container {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                min-height: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                pointer-events: none !important;
            }
            
            /* Remove top paddings from body so the timing board goes to the top */
            body, html {
                margin-top: 0 !important;
                padding-top: 0 !important;
            }
            
            /* Specific fix for F1 Live Timing main container */
            main {
                padding-top: 0 !important;
                margin-top: 0 !important;
            }
        `;
        document.head.appendChild(style);
        
        // Sometimes React/Angular apps remove our styles, so we observe and force them
        const observer = new MutationObserver(() => {
            if (!document.head.contains(style)) {
                document.head.appendChild(style);
            }
        });
        observer.observe(document.head, { childList: true });
    }
});
