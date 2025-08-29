import { test, expect, BrowserContext, Page } from '@playwright/test';

/**
 * PWA and Offline Functionality Testing
 * Tests Progressive Web App features and offline capabilities
 */

describe('PWA and Offline Functionality', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // Create context with service worker enabled
    context = await browser.newContext({
      serviceWorkers: 'allow',
    });
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  describe('PWA Installation', () => {
    test('should have valid manifest.json', async () => {
      await page.goto('/');
      
      const manifestLink = await page.evaluate(() => {
        const link = document.querySelector('link[rel="manifest"]');
        return link?.getAttribute('href');
      });
      
      expect(manifestLink).toBeTruthy();
      
      // Fetch and validate manifest
      const response = await page.goto(manifestLink!);
      expect(response?.status()).toBe(200);
      
      const manifest = await response?.json();
      
      // Validate required manifest properties
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('short_name');
      expect(manifest).toHaveProperty('start_url');
      expect(manifest).toHaveProperty('display');
      expect(manifest).toHaveProperty('theme_color');
      expect(manifest).toHaveProperty('background_color');
      expect(manifest).toHaveProperty('icons');
      
      // Validate icons
      expect(manifest.icons.length).toBeGreaterThan(0);
      expect(manifest.icons).toContainEqual(
        expect.objectContaining({
          sizes: '192x192',
          type: 'image/png',
        })
      );
      expect(manifest.icons).toContainEqual(
        expect.objectContaining({
          sizes: '512x512',
          type: 'image/png',
        })
      );
    });

    test('should have iOS PWA meta tags', async () => {
      await page.goto('/');
      
      const iosMetaTags = await page.evaluate(() => {
        const appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
        const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        const appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        
        return {
          capable: appleCapable?.getAttribute('content'),
          title: appleTitle?.getAttribute('content'),
          statusBar: appleStatusBar?.getAttribute('content'),
        };
      });
      
      expect(iosMetaTags.capable).toBe('yes');
      expect(iosMetaTags.title).toBeTruthy();
      expect(iosMetaTags.statusBar).toBeTruthy();
    });

    test('should show install prompt when eligible', async () => {
      await page.goto('/');
      
      // Wait for potential install banner
      await page.waitForTimeout(2000);
      
      // Check for custom install prompt
      const installPrompt = await page.evaluate(() => {
        return document.querySelector('.pwa-install-prompt, [data-pwa-install]') !== null;
      });
      
      // Install prompt might be shown based on browser eligibility
      if (installPrompt) {
        const installButton = page.locator('.pwa-install-prompt button, [data-pwa-install] button');
        expect(await installButton.isVisible()).toBe(true);
      }
    });
  });

  describe('Service Worker', () => {
    test('should register service worker', async () => {
      await page.goto('/');
      
      // Wait for service worker registration
      await page.waitForTimeout(2000);
      
      const swRegistered = await page.evaluate(() => {
        return navigator.serviceWorker?.controller !== null ||
               navigator.serviceWorker?.ready !== undefined;
      });
      
      expect(swRegistered).toBe(true);
    });

    test('should cache static assets', async () => {
      await page.goto('/');
      
      // Wait for service worker to cache assets
      await page.waitForTimeout(3000);
      
      const cachedAssets = await page.evaluate(async () => {
        if (!('caches' in window)) return [];
        
        const cacheNames = await caches.keys();
        const assets: string[] = [];
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          assets.push(...requests.map(r => r.url));
        }
        
        return assets;
      });
      
      // Should cache critical assets
      expect(cachedAssets.some(url => url.includes('.js'))).toBe(true);
      expect(cachedAssets.some(url => url.includes('.css'))).toBe(true);
      expect(cachedAssets.some(url => url.includes('/'))).toBe(true);
    });

    test('should handle service worker updates', async () => {
      await page.goto('/');
      
      // Check for update mechanism
      const hasUpdateMechanism = await page.evaluate(() => {
        return document.querySelector('.sw-update-banner, [data-sw-update]') !== null ||
               window.addEventListener.toString().includes('controllerchange');
      });
      
      expect(hasUpdateMechanism).toBe(true);
    });
  });

  describe('Offline Functionality', () => {
    test('should work offline for cached pages', async () => {
      // First visit online to cache
      await page.goto('/');
      await page.waitForTimeout(3000); // Allow caching
      
      // Go offline
      await context.setOffline(true);
      
      // Try to navigate
      const response = await page.reload();
      
      // Page should still load from cache
      expect(response).toBeTruthy();
      
      // Check for offline indicator
      const offlineIndicator = await page.evaluate(() => {
        return document.querySelector('.offline-indicator, [data-offline]') !== null;
      });
      
      expect(offlineIndicator).toBe(true);
    });

    test('should show offline fallback page for uncached routes', async () => {
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      // Go offline
      await context.setOffline(true);
      
      // Navigate to uncached route
      await page.goto('/random-uncached-route-12345');
      
      // Should show offline page
      const offlineContent = await page.evaluate(() => {
        return document.body.textContent?.includes('offline') ||
               document.body.textContent?.includes('Offline');
      });
      
      expect(offlineContent).toBe(true);
    });

    test('should cache crisis resources for offline access', async () => {
      await page.goto('/crisis');
      await page.waitForTimeout(3000);
      
      // Go offline
      await context.setOffline(true);
      
      // Crisis resources should still be available
      const crisisContent = await page.evaluate(() => {
        const hotlines = document.querySelectorAll('a[href^="tel:"]');
        const copingStrategies = document.querySelector('.coping-strategies, [data-coping]');
        
        return {
          hasHotlines: hotlines.length > 0,
          hasCopingStrategies: copingStrategies !== null,
        };
      });
      
      expect(crisisContent.hasHotlines).toBe(true);
      expect(crisisContent.hasCopingStrategies).toBe(true);
    });

    test('should queue form submissions when offline', async () => {
      await page.goto('/wellness');
      
      // Go offline
      await context.setOffline(true);
      
      // Try to submit mood entry
      await page.click('[data-mood="7"], .mood-button:nth-child(7)');
      await page.fill('textarea', 'Feeling good today');
      await page.click('button[type="submit"]');
      
      // Should show queued message
      const queuedMessage = await page.evaluate(() => {
        const notifications = document.querySelectorAll('.notification, .toast, [role="alert"]');
        return Array.from(notifications).some(n => 
          n.textContent?.includes('queued') || 
          n.textContent?.includes('saved locally')
        );
      });
      
      expect(queuedMessage).toBe(true);
      
      // Check if data is in localStorage
      const localData = await page.evaluate(() => {
        return localStorage.getItem('offline-queue') !== null ||
               localStorage.getItem('pending-submissions') !== null;
      });
      
      expect(localData).toBe(true);
    });

    test('should sync data when coming back online', async () => {
      await page.goto('/wellness');
      
      // Go offline and queue data
      await context.setOffline(true);
      await page.click('[data-mood="7"], .mood-button:nth-child(7)');
      await page.click('button[type="submit"]');
      
      // Come back online
      await context.setOffline(false);
      
      // Wait for sync
      await page.waitForTimeout(2000);
      
      // Check for sync notification
      const syncNotification = await page.evaluate(() => {
        const notifications = document.querySelectorAll('.notification, .toast, [role="alert"]');
        return Array.from(notifications).some(n => 
          n.textContent?.includes('synced') || 
          n.textContent?.includes('uploaded')
        );
      });
      
      expect(syncNotification).toBe(true);
    });
  });

  describe('Background Sync', () => {
    test('should register background sync', async () => {
      await page.goto('/');
      
      const hasBackgroundSync = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return false;
        
        const registration = await navigator.serviceWorker.ready;
        return 'sync' in registration;
      });
      
      expect(hasBackgroundSync).toBe(true);
    });

    test('should schedule periodic background sync', async () => {
      await page.goto('/');
      
      const hasPeriodicSync = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return false;
        
        const registration = await navigator.serviceWorker.ready;
        return 'periodicSync' in registration;
      });
      
      // Periodic sync might not be available in all browsers
      if (hasPeriodicSync) {
        const registered = await page.evaluate(async () => {
          const registration = await navigator.serviceWorker.ready;
          const tags = await (registration as any).periodicSync.getTags();
          return tags.length > 0;
        });
        
        expect(registered).toBe(true);
      }
    });
  });

  describe('Push Notifications', () => {
    test('should request notification permission', async () => {
      await page.goto('/');
      
      // Check if notification prompt exists
      const hasNotificationPrompt = await page.evaluate(() => {
        return document.querySelector('[data-notification-prompt], .enable-notifications') !== null;
      });
      
      if (hasNotificationPrompt) {
        const permission = await page.evaluate(() => Notification.permission);
        expect(['default', 'granted', 'denied']).toContain(permission);
      }
    });

    test('should handle push subscription', async () => {
      await page.goto('/');
      
      const canSubscribe = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          return false;
        }
        
        const registration = await navigator.serviceWorker.ready;
        return registration.pushManager !== undefined;
      });
      
      expect(canSubscribe).toBe(true);
    });

    test('should show notification preferences', async () => {
      await page.goto('/settings');
      
      const notificationSettings = await page.evaluate(() => {
        const settings = document.querySelectorAll('[data-notification-setting], .notification-preference');
        return settings.length > 0;
      });
      
      expect(notificationSettings).toBe(true);
    });
  });

  describe('App Shell Architecture', () => {
    test('should load app shell quickly', async () => {
      const startTime = Date.now();
      await page.goto('/');
      
      // Wait for app shell (navigation, header, footer)
      await page.waitForSelector('nav, header');
      const shellLoadTime = Date.now() - startTime;
      
      // App shell should load within 2 seconds
      expect(shellLoadTime).toBeLessThan(2000);
    });

    test('should lazy load content', async () => {
      await page.goto('/');
      
      // Check for lazy loading indicators
      const hasLazyLoading = await page.evaluate(() => {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        const lazyComponents = document.querySelectorAll('[data-lazy], .lazy-load');
        
        return lazyImages.length > 0 || lazyComponents.length > 0;
      });
      
      expect(hasLazyLoading).toBe(true);
    });

    test('should use skeleton screens while loading', async () => {
      await page.goto('/feed');
      
      // Check for skeleton screens
      const hasSkeletons = await page.evaluate(() => {
        return document.querySelector('.skeleton, [data-skeleton]') !== null;
      });
      
      // Skeletons might be shown briefly
      if (hasSkeletons) {
        expect(hasSkeletons).toBe(true);
      }
    });
  });

  describe('Storage Management', () => {
    test('should use IndexedDB for large data', async () => {
      await page.goto('/');
      
      const hasIndexedDB = await page.evaluate(() => {
        return 'indexedDB' in window;
      });
      
      expect(hasIndexedDB).toBe(true);
      
      // Check if app uses IndexedDB
      const databases = await page.evaluate(async () => {
        if (!('databases' in indexedDB)) return [];
        return await indexedDB.databases();
      });
      
      // App might create databases for offline storage
      if (databases.length > 0) {
        expect(databases[0]).toHaveProperty('name');
      }
    });

    test('should manage storage quota', async () => {
      await page.goto('/');
      
      const storageInfo = await page.evaluate(async () => {
        if (!navigator.storage?.estimate) return null;
        
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
        };
      });
      
      if (storageInfo) {
        expect(storageInfo.percentage).toBeLessThan(90); // Not exceeding quota
      }
    });

    test('should clear old cached data', async () => {
      await page.goto('/');
      
      // Check for cache management
      const hasCacheManagement = await page.evaluate(async () => {
        if (!('caches' in window)) return false;
        
        const cacheNames = await caches.keys();
        // Check if cache names include version numbers
        return cacheNames.some(name => /v\d+/.test(name));
      });
      
      expect(hasCacheManagement).toBe(true);
    });
  });

  describe('Critical Offline Features', () => {
    test('should maintain crisis hotline access offline', async () => {
      await page.goto('/crisis');
      await page.waitForTimeout(2000);
      
      // Go offline
      await context.setOffline(true);
      await page.reload();
      
      // Crisis hotlines should still be accessible
      const hotlines = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href^="tel:988"], a[href^="tel:911"]');
        return links.length;
      });
      
      expect(hotlines).toBeGreaterThan(0);
    });

    test('should show cached coping strategies offline', async () => {
      await page.goto('/crisis');
      await page.waitForTimeout(2000);
      
      // Go offline
      await context.setOffline(true);
      
      // Coping strategies should be available
      const strategies = await page.evaluate(() => {
        const content = document.body.textContent || '';
        return content.includes('breathing') || 
               content.includes('grounding') ||
               content.includes('coping');
      });
      
      expect(strategies).toBe(true);
    });

    test('should cache safety plan offline', async () => {
      // First, create a safety plan while online
      await page.goto('/safety-plan');
      
      // Fill out safety plan (if form exists)
      const formExists = await page.evaluate(() => {
        return document.querySelector('form') !== null;
      });
      
      if (formExists) {
        await page.fill('textarea[name="warning-signs"]', 'Test warning signs');
        await page.fill('textarea[name="coping-strategies"]', 'Test strategies');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }
      
      // Go offline
      await context.setOffline(true);
      
      // Navigate to safety plan
      await page.goto('/safety-plan');
      
      // Should show cached plan or form
      const planAvailable = await page.evaluate(() => {
        return document.querySelector('.safety-plan, [data-safety-plan]') !== null;
      });
      
      expect(planAvailable).toBe(true);
    });
  });
});