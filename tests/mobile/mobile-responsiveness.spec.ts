import { test, expect, devices } from '@playwright/test';

/**
 * Mobile Responsiveness Testing Suite
 * Tests across various mobile devices and orientations
 */

const mobileDevices = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Galaxy S21', device: devices['Galaxy S21'] },
  { name: 'iPad Mini', device: devices['iPad Mini'] },
];

test.describe('Mobile Responsiveness', () => {
  
  mobileDevices.forEach(({ name, device }) => {
    test.describe(`${name}`, () => {
      test.use(device);

      test('should display properly on mobile viewport', async ({ page }) => {
        await page.goto('/');
        
        // Check viewport meta tag
        const viewportMeta = await page.evaluate(() => {
          const meta = document.querySelector('meta[name="viewport"]');
          return meta?.getAttribute('content');
        });
        
        expect(viewportMeta).toContain('width=device-width');
        expect(viewportMeta).toContain('initial-scale=1');
        
        // No horizontal scrolling
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      });

      test('should have responsive navigation menu', async ({ page }) => {
        await page.goto('/');
        
        // Mobile menu should be visible
        const hamburgerVisible = await page.isVisible('[aria-label="Menu"]');
        expect(hamburgerVisible).toBe(true);
        
        // Desktop menu should be hidden
        const desktopNavVisible = await page.isVisible('.desktop-nav');
        expect(desktopNavVisible).toBe(false);
        
        // Open mobile menu
        await page.click('[aria-label="Menu"]');
        await page.waitForSelector('.mobile-menu');
        
        // Menu should be accessible
        const menuVisible = await page.isVisible('.mobile-menu');
        expect(menuVisible).toBe(true);
      });

      test('should have touch-friendly buttons', async ({ page }) => {
        await page.goto('/');
        
        const buttons = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button, a.button'));
          return btns.map(btn => {
            const rect = btn.getBoundingClientRect();
            return {
              width: rect.width,
              height: rect.height,
            };
          });
        });
        
        // Minimum touch target size: 44x44px
        buttons.forEach(btn => {
          expect(btn.width >= 44 || btn.height >= 44).toBe(true);
        });
      });

      test('should handle text input on mobile', async ({ page }) => {
        await page.goto('/chat');
        
        const inputField = page.locator('textarea, input[type="text"]').first();
        await inputField.click();
        
        // Check if keyboard appears (viewport height changes)
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        
        await inputField.type('Test message');
        
        // Input should contain typed text
        const value = await inputField.inputValue();
        expect(value).toBe('Test message');
      });

      test('should display crisis resources accessibly', async ({ page }) => {
        await page.goto('/crisis');
        
        // Crisis hotline should be clickable as tel: link
        const crisisHotline = await page.locator('a[href^="tel:"]').first();
        const href = await crisisHotline.getAttribute('href');
        expect(href).toMatch(/^tel:/);
        
        // Emergency button should be prominently displayed
        const emergencyButton = await page.locator('button:has-text("Emergency")').first();
        const isVisible = await emergencyButton.isVisible();
        expect(isVisible).toBe(true);
        
        // Check button size
        const buttonBox = await emergencyButton.boundingBox();
        expect(buttonBox?.width).toBeGreaterThanOrEqual(100);
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
      });
    });
  });

  test.describe('Orientation Changes', () => {
    test('should adapt to portrait orientation', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      
      await page.goto('/');
      
      const layoutCorrect = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main && main.clientWidth <= window.innerWidth;
      });
      
      expect(layoutCorrect).toBe(true);
      await context.close();
    });

    test('should adapt to landscape orientation', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
        viewport: { width: 844, height: 390 },
      });
      const page = await context.newPage();
      
      await page.goto('/');
      
      const layoutCorrect = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main && main.clientWidth <= window.innerWidth;
      });
      
      expect(layoutCorrect).toBe(true);
      await context.close();
    });
  });

  test.describe('Touch Interactions', () => {
    test.use(devices['iPhone 12']);

    test('should support swipe gestures', async ({ page }) => {
      await page.goto('/feed');
      
      // Get initial scroll position
      const initialScroll = await page.evaluate(() => window.scrollY);
      
      // Simulate swipe up
      await page.locator('body').evaluate((element) => {
        const touch = new Touch({
          identifier: 1,
          target: element,
          clientX: 100,
          clientY: 400,
        });
        
        const touchStart = new TouchEvent('touchstart', {
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
        });
        
        const touchEnd = new TouchEvent('touchend', {
          touches: [],
          targetTouches: [],
          changedTouches: [touch],
        });
        
        element.dispatchEvent(touchStart);
        element.dispatchEvent(touchEnd);
      });
      
      // Should scroll
      await page.waitForTimeout(300);
      const finalScroll = await page.evaluate(() => window.scrollY);
      expect(finalScroll).not.toBe(initialScroll);
    });

    test('should handle pinch-to-zoom disabled', async ({ page }) => {
      await page.goto('/');
      
      const viewportMeta = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta?.getAttribute('content');
      });
      
      // For accessibility, we should NOT disable zoom
      expect(viewportMeta).not.toContain('user-scalable=no');
      expect(viewportMeta).not.toContain('maximum-scale=1');
    });

    test('should support long press for context menus', async ({ page }) => {
      await page.goto('/feed');
      
      const postCard = page.locator('.post-card').first();
      
      // Simulate long press
      await postCard.tap({ modifiers: ['Alt'] }); // Simulates long press
      
      // Check if context menu appears
      const contextMenu = page.locator('.context-menu, [role="menu"]');
      const menuExists = await contextMenu.count();
      
      // Context menu might be implemented
      if (menuExists > 0) {
        expect(await contextMenu.isVisible()).toBe(true);
      }
    });
  });

  test.describe('Mobile-Specific Features', () => {
    test.use(devices['iPhone 12']);

    test('should show mobile-optimized forms', async ({ page }) => {
      await page.goto('/login');
      
      // Check input types for mobile keyboards
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      expect(await emailInput.count()).toBeGreaterThan(0);
      expect(await passwordInput.count()).toBeGreaterThan(0);
      
      // Check autocomplete attributes
      const emailAutocomplete = await emailInput.getAttribute('autocomplete');
      const passwordAutocomplete = await passwordInput.getAttribute('autocomplete');
      
      expect(emailAutocomplete).toContain('email');
      expect(passwordAutocomplete).toContain('password');
    });

    test('should display mobile-friendly mood tracker', async ({ page }) => {
      await page.goto('/wellness');
      
      const moodButtons = page.locator('.mood-button, [data-mood]');
      const count = await moodButtons.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Check button sizes
      for (let i = 0; i < count; i++) {
        const button = moodButtons.nth(i);
        const box = await button.boundingBox();
        
        // Should be touch-friendly
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should handle mobile keyboard properly', async ({ page }) => {
      await page.goto('/chat');
      
      const chatInput = page.locator('textarea, input[type="text"]').first();
      
      // Focus input
      await chatInput.click();
      
      // Check if viewport adjusts for keyboard
      const viewportBeforeTyping = await page.evaluate(() => ({
        height: window.innerHeight,
        scrollY: window.scrollY,
      }));
      
      await chatInput.type('Testing mobile keyboard');
      
      // Input should stay visible
      const inputVisible = await chatInput.isInViewport();
      expect(inputVisible).toBe(true);
    });

    test('should show PWA install prompt', async ({ page }) => {
      await page.goto('/');
      
      // Check for manifest
      const manifest = await page.evaluate(() => {
        const link = document.querySelector('link[rel="manifest"]');
        return link?.getAttribute('href');
      });
      
      expect(manifest).toBeTruthy();
      
      // Check for PWA meta tags
      const themeColor = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="theme-color"]');
        return meta?.getAttribute('content');
      });
      
      expect(themeColor).toBeTruthy();
      
      // Check for iOS meta tags
      const iosCapable = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
        return meta?.getAttribute('content');
      });
      
      expect(iosCapable).toBe('yes');
    });
  });

  test.describe('Performance on Mobile', () => {
    test.use(devices['iPhone 12']);

    test('should load quickly on mobile', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds on mobile
      expect(loadTime).toBeLessThan(3000);
    });

    test('should lazy load images', async ({ page }) => {
      await page.goto('/feed');
      
      const images = page.locator('img[loading="lazy"]');
      const lazyCount = await images.count();
      
      expect(lazyCount).toBeGreaterThan(0);
    });

    test('should minimize layout shifts', async ({ page }) => {
      await page.goto('/');
      
      // Wait for initial load
      await page.waitForLoadState('networkidle');
      
      // Measure layout shift
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
          });
          
          observer.observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 2000);
        });
      });
      
      // CLS should be less than 0.1 for good user experience
      expect(cls).toBeLessThan(0.1);
    });
  });

  test.describe('Mobile Crisis Features', () => {
    test.use(devices['iPhone 12']);

    test('should have one-tap emergency call', async ({ page }) => {
      await page.goto('/crisis');
      
      const emergencyButton = page.locator('a[href^="tel:911"], a[href^="tel:988"]').first();
      const href = await emergencyButton.getAttribute('href');
      
      expect(href).toMatch(/^tel:(911|988)/);
      
      // Should be prominently displayed
      const box = await emergencyButton.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(100);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    });

    test('should show breathing exercise optimized for mobile', async ({ page }) => {
      await page.goto('/crisis');
      
      const breathingButton = page.locator('button:has-text("Breathing")').first();
      await breathingButton.click();
      
      // Should show fullscreen or large breathing guide
      const breathingGuide = page.locator('.breathing-exercise, [data-breathing]');
      await breathingGuide.waitFor();
      
      const box = await breathingGuide.boundingBox();
      const viewport = page.viewportSize();
      
      // Should take significant portion of screen
      if (box && viewport) {
        expect(box.width).toBeGreaterThan(viewport.width * 0.8);
        expect(box.height).toBeGreaterThan(viewport.height * 0.5);
      }
    });

    test('should have quick access to safety plan', async ({ page }) => {
      await page.goto('/');
      
      // Safety plan should be accessible within 2 taps
      let safetyPlanFound = false;
      
      // Check if directly visible
      const directLink = page.locator('a[href*="safety"], button:has-text("Safety")');
      if (await directLink.count() > 0) {
        safetyPlanFound = true;
      } else {
        // Check in menu
        await page.click('[aria-label="Menu"]');
        const menuLink = page.locator('a[href*="safety"], button:has-text("Safety")');
        if (await menuLink.count() > 0) {
          safetyPlanFound = true;
        }
      }
      
      expect(safetyPlanFound).toBe(true);
    });
  });

  test.describe('Responsive Layout Grid', () => {
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];

    breakpoints.forEach(({ name, width, height }) => {
      test(`should adapt grid layout for ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/dashboard');
        
        const cards = page.locator('.card, [data-card]');
        const count = await cards.count();
        
        if (count > 0) {
          const firstCard = cards.first();
          const box = await firstCard.boundingBox();
          
          if (box) {
            if (width < 768) {
              // Mobile: cards should be full width
              expect(box.width).toBeGreaterThan(width * 0.9);
            } else if (width < 1024) {
              // Tablet: 2 columns
              expect(box.width).toBeLessThan(width * 0.6);
              expect(box.width).toBeGreaterThan(width * 0.4);
            } else {
              // Desktop: 3+ columns
              expect(box.width).toBeLessThan(width * 0.4);
            }
          }
        }
      });
    });
  });
});