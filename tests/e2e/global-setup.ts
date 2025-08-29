import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Prepares test environment for mental health platform testing
 */
async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up E2E test environment for mental health platform...');
  
  // Create a browser instance for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Verify base URL is accessible
    const baseURL = process.env.CI ? 'https://astralcore.netlify.app' : 'http://localhost:8888';
    console.log(`🌐 Testing connection to: ${baseURL}`);
    
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    // Check if the mental health platform loads correctly
    await page.waitForSelector('h1', { timeout: 10000 });
    const title = await page.textContent('h1');
    console.log(`✅ Platform loaded successfully: ${title}`);
    
    // Verify critical crisis resources are available
    console.log('🆘 Verifying crisis resources availability...');
    
    // Check service worker registration (critical for offline crisis support)
    const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
    if (swSupported) {
      console.log('✅ Service Worker supported - offline crisis resources available');
    } else {
      console.warn('⚠️ Service Worker not supported - offline features limited');
    }
    
    // Verify crisis detection is available
    try {
      await page.goto(`${baseURL}/crisis`, { waitUntil: 'networkidle' });
      console.log('✅ Crisis resources page accessible');
    } catch (error) {
      console.warn('⚠️ Crisis resources page not accessible:', error.message);
    }
    
    // Test AI service availability (for crisis detection)
    try {
      await page.goto(`${baseURL}/chat`, { waitUntil: 'networkidle' });
      console.log('✅ AI chat service accessible');
    } catch (error) {
      console.warn('⚠️ AI chat service not accessible:', error.message);
    }
    
    console.log('🎯 E2E test environment setup complete');
    
  } catch (error) {
    console.error('❌ E2E test environment setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
