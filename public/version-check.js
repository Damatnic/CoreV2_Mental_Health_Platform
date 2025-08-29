// Version check to force refresh on updates
(function() {
    'use strict';
    
    // Don't run if React isn't loaded yet
    if (typeof window === 'undefined' || !window.React) {
        // Wait for React to load
        window.addEventListener('load', function() {
            // Re-run this script after page load
            setTimeout(checkForUpdates, 1000);
        });
        return;
    }
    
    const CURRENT_VERSION = Date.now().toString();
    const VERSION_KEY = 'astral_app_version';
    const LAST_CHECK_KEY = 'astral_last_version_check';
    
    function checkForUpdates() {
        const storedVersion = localStorage.getItem(VERSION_KEY);
        const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
        const now = Date.now();
        
        // Check for updates every 5 minutes
        if (!lastCheck || (now - parseInt(lastCheck)) > 300000) {
            localStorage.setItem(LAST_CHECK_KEY, now.toString());
            
            // Fetch a timestamp from the server to check for updates
            fetch('/version.json?t=' + now)
                .then(response => response.json())
                .then(data => {
                    if (data.version && data.version !== storedVersion) {
                        console.log('🔄 New version detected, refreshing...');
                        localStorage.setItem(VERSION_KEY, data.version);
                        
                        // Show update notification
                        if (storedVersion) {
                            showUpdateNotification();
                        }
                    }
                })
                .catch(error => {
                    console.log('Version check failed:', error);
                });
        }
    }
    
    function showUpdateNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 300px;
            ">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">🔄 Update Available</div>
                <div style="font-size: 0.9rem; margin-bottom: 1rem;">A new version is available. Refresh to get the latest features!</div>
                <button onclick="window.location.reload(true)" style="
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-right: 0.5rem;
                ">Refresh Now</button>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: transparent;
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                ">Later</button>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
    
    // Initialize version tracking
    if (!localStorage.getItem(VERSION_KEY)) {
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
    
    // Check for updates when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForUpdates);
    } else {
        checkForUpdates();
    }
    
    // Check for updates periodically
    setInterval(checkForUpdates, 300000); // Every 5 minutes
})();