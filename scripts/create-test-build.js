const fs = require('fs');
const path = require('path');

/**
 * Service Worker Integration Test Script
 * 
 * This script tests the service worker generation and integration
 * without requiring a full React build.
 */

const DIST_DIR = path.join(__dirname, '..', 'dist');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Create basic dist structure for testing
function createTestBuild() {
    console.log('📦 Creating test build structure...');
    
    // Ensure dist directory exists
    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }
    
    // Copy critical files to dist
    const filesToCopy = [
        'crisis-resources.json',
        'offline-coping-strategies.json',
        'emergency-contacts.json',
        'offline.html',
        'offline-crisis.html',
        'manifest.json',
        'icon-192.png',
        'icon-512.png',
        'icon.svg'
    ];
    
    filesToCopy.forEach(file => {
        const srcPath = path.join(PUBLIC_DIR, file);
        const destPath = path.join(DIST_DIR, file);
        
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Copied ${file}`);
        } else {
            console.warn(`⚠️  Missing file: ${file}`);
        }
    });
    
    // Create a basic index.html for testing
    const testIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Astral Core - Service Worker Test</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#667eea">
</head>
<body>
    <h1>Service Worker Integration Test</h1>
    <p>This is a test page to verify service worker functionality.</p>
    
    <div id="sw-status">
        <h2>Service Worker Status</h2>
        <p id="sw-support"></p>
        <p id="sw-registration"></p>
        <p id="sw-active"></p>
    </div>
    
    <div id="crisis-resources">
        <h2>Crisis Resources Test</h2>
        <button onclick="testCrisisResources()">Test Crisis Resources Cache</button>
        <div id="crisis-results"></div>
    </div>
    
    <script>
        // Test service worker functionality
        async function testServiceWorker() {
            const supportEl = document.getElementById('sw-support');
            const registrationEl = document.getElementById('sw-registration');
            const activeEl = document.getElementById('sw-active');
            
            if ('serviceWorker' in navigator) {
                supportEl.textContent = '✅ Service Worker supported';
                
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    registrationEl.textContent = '✅ Service Worker registered: ' + registration.scope;
                    
                    if (registration.active) {
                        activeEl.textContent = '✅ Service Worker active';
                    } else {
                        activeEl.textContent = '⏳ Service Worker installing...';
                        
                        registration.addEventListener('updatefound', () => {
                            const worker = registration.installing;
                            worker.addEventListener('statechange', () => {
                                if (worker.state === 'activated') {
                                    activeEl.textContent = '✅ Service Worker activated';
                                }
                            });
                        });
                    }
                } catch (error) {
                    registrationEl.textContent = '❌ Service Worker registration failed: ' + error.message;
                }
            } else {
                supportEl.textContent = '❌ Service Worker not supported';
            }
        }
        
        // Test crisis resources caching
        async function testCrisisResources() {
            const resultsEl = document.getElementById('crisis-results');
            resultsEl.innerHTML = '<p>Testing crisis resources cache...</p>';
            
            const resources = [
                '/crisis-resources.json',
                '/offline-coping-strategies.json',
                '/emergency-contacts.json',
                '/offline-crisis.html'
            ];
            
            const results = [];
            
            for (const resource of resources) {
                try {
                    const response = await fetch(resource);
                    if (response.ok) {
                        results.push('✅ ' + resource + ' - loaded successfully');
                    } else {
                        results.push('❌ ' + resource + ' - failed to load');
                    }
                } catch (error) {
                    results.push('❌ ' + resource + ' - error: ' + error.message);
                }
            }
            
            resultsEl.innerHTML = '<ul><li>' + results.join('</li><li>') + '</li></ul>';
        }
        
        // Initialize tests
        window.addEventListener('load', () => {
            testServiceWorker();
        });
    </script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), testIndexHtml);
    console.log('✅ Created test index.html');
    
    // Create basic assets directory
    const assetsDir = path.join(DIST_DIR, 'assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Create dummy JS and CSS files for testing
    fs.writeFileSync(
        path.join(assetsDir, 'index-test.js'),
        '// Test JavaScript file for service worker caching\nconsole.log("Test JS loaded");'
    );
    
    fs.writeFileSync(
        path.join(assetsDir, 'index-test.css'),
        '/* Test CSS file for service worker caching */\nbody { font-family: Arial, sans-serif; }'
    );
    
    console.log('✅ Created test assets');
    console.log('📦 Test build structure ready!');
}

// Run the test build creation
if (require.main === module) {
    createTestBuild();
}

module.exports = { createTestBuild };
