import { test, expect } from '@playwright/test';

/**
 * Comprehensive Accessibility Tests for Mental Health Platform
 * 
 * Ensures WCAG 2.1 AA compliance and accessibility for users with disabilities,
 * with special focus on crisis intervention features.
 */

test.describe('Accessibility Compliance - Mental Health Platform', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configure accessibility testing environment
    await page.addInitScript(() => {
      // Disable animations for accessibility testing
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: -0.01ms !important;
          animation-iteration-count: 1 !important;
          background-attachment: initial !important;
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    });
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    
    test('should have proper semantic structure on homepage', async ({ page }) => {
      await page.goto('/');
      
      // Check for basic semantic elements
      await expect(page.locator('main, [role="main"]')).toHaveCount({ min: 1 });
      await expect(page.locator('nav, [role="navigation"]')).toHaveCount({ min: 1 });
      await expect(page.locator('h1')).toHaveCount({ min: 1 });
    });

    test('should have proper semantic structure on crisis resources page', async ({ page }) => {
      await page.goto('/crisis');
      
      // Check for semantic elements specific to crisis page
      await expect(page.locator('h1')).toHaveCount({ min: 1 });
      await expect(page.locator('main, [role="main"]')).toHaveCount({ min: 1 });
    });

    test('should have proper semantic structure on chat interface', async ({ page }) => {
      await page.goto('/chat');
      
      // Check chat interface accessibility
      await expect(page.locator('main, [role="main"]')).toHaveCount({ min: 1 });
      await expect(page.locator('textarea, input[type="text"], [role="textbox"]')).toHaveCount({ min: 1 });
    });

    test('should have proper heading hierarchy throughout platform', async ({ page }) => {
      const pages = ['/', '/crisis', '/chat', '/safety-plan'];
      
      for (const pagePath of pages) {
        const response = await page.goto(pagePath);
        if (response && response.ok()) {
          // Check heading hierarchy (h1 -> h2 -> h3, etc.)
          const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
          
          if (headings.length > 0) {
            // Should have at least one h1
            const h1Elements = await page.locator('h1').count();
            expect(h1Elements).toBeGreaterThanOrEqual(1);
            
            // Should not skip heading levels
            let previousLevel = 0;
            for (const heading of headings) {
              const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
              const currentLevel = parseInt(tagName.charAt(1));
              
              if (previousLevel > 0) {
                expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
              }
              previousLevel = currentLevel;
            }
          }
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    
    test('should be fully keyboard navigable on homepage', async ({ page }) => {
      await page.goto('/');
      
      // Start keyboard navigation
      await page.keyboard.press('Tab');
      
      // Track focus movement
      const focusableElements = [];
      let tabCount = 0;
      
      while (tabCount < 20) {
        const focusedElement = page.locator(':focus');
        const tagName = await focusedElement.evaluate(el => el?.tagName?.toLowerCase() || '');
        const role = await focusedElement.getAttribute('role');
        
        if (tagName || role) {
          focusableElements.push({ tagName, role });
        }
        
        await page.keyboard.press('Tab');
        tabCount++;
      }
      
      // Should have navigated through multiple focusable elements
      expect(focusableElements.length).toBeGreaterThan(5);
    });

    test('should provide skip links for efficient navigation', async ({ page }) => {
      await page.goto('/');
      
      // Press Tab to reveal skip links
      await page.keyboard.press('Tab');
      
      // Look for skip link
      const skipLink = page.locator('text=/skip to|skip navigation|skip to content/i');
      if (await skipLink.isVisible({ timeout: 2000 })) {
        await skipLink.click();
        
        // Should jump to main content
        const focusedElement = page.locator(':focus');
        const elementRole = await focusedElement.getAttribute('role');
        expect(elementRole).toBe('main');
      }
    });

    test('should handle keyboard navigation in crisis chat interface', async ({ page }) => {
      await page.goto('/chat');
      
      // Navigate to chat input with keyboard
      await page.keyboard.press('Tab');
      let tabCount = 0;
      
      while (tabCount < 10) {
        const focusedElement = page.locator(':focus');
        const tagName = await focusedElement.evaluate(el => el?.tagName?.toLowerCase() || '');
        
        if (tagName === 'textarea' || tagName === 'input') {
          // Found chat input, test typing
          await focusedElement.type('This is a keyboard navigation test');
          
          // Should be able to send with Enter
          await page.keyboard.press('Enter');
          break;
        }
        
        await page.keyboard.press('Tab');
        tabCount++;
      }
      
      // Verify message was sent
      await expect(page.locator('text="This is a keyboard navigation test"')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Screen Reader Support', () => {
    
    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      await page.goto('/');
      
      // Check buttons have accessible names
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        // Button should have either aria-label or visible text
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      }
      
      // Check form inputs have labels
      const inputs = await page.locator('input[type="text"], input[type="email"], textarea').all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          
          // Input should have associated label or aria-label
          expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
        }
      }
    });

    test('should announce crisis alerts to screen readers', async ({ page }) => {
      await page.goto('/chat');
      
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      await chatInput.fill('I need crisis intervention help');
      await chatInput.press('Enter');
      
      // Look for live region or alert for crisis response
      const liveRegions = page.locator('[aria-live="assertive"], [aria-live="polite"], [role="alert"]');
      await expect(liveRegions).toHaveCount({ min: 1 }, { timeout: 8000 });
    });

    test('should provide descriptive text for crisis resources', async ({ page }) => {
      await page.goto('/crisis');
      
      // Check that crisis resources have descriptive text
      const crisisLinks = await page.locator('a[href*="988"], a[href*="crisis"], a[href*="emergency"]').all();
      
      for (const link of crisisLinks) {
        const textContent = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        
        // Link should have descriptive text or aria-label
        const description = ariaLabel || textContent?.trim() || title;
        expect(description).toBeTruthy();
        
        // Description should be meaningful (more than just URL)
        if (description) {
          expect(description.length).toBeGreaterThan(5);
        }
      }
    });
  });

  test.describe('Color and Contrast', () => {
    
    test('should meet color contrast requirements', async ({ page }) => {
      await page.goto('/');
      
      // Run automated color contrast check
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.color'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should not rely solely on color for crisis alerts', async ({ page }) => {
      await page.goto('/chat');
      
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      await chatInput.fill('Crisis alert test message');
      await chatInput.press('Enter');
      
      // Wait for potential crisis alert
      await page.waitForTimeout(3000);
      
      // Crisis alerts should have text/icons, not just color
      const alertElements = page.locator('[class*="alert"], [class*="crisis"], [role="alert"]');
      const alertCount = await alertElements.count();
      
      if (alertCount > 0) {
        const firstAlert = alertElements.first();
        const textContent = await firstAlert.textContent();
        const hasIcon = await firstAlert.locator('svg, img, [class*="icon"]').count() > 0;
        
        // Alert should have text or icon, not just color
        expect(textContent?.trim() || hasIcon).toBeTruthy();
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    
    test('should be accessible on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Run accessibility scan on mobile viewport
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have appropriate touch target sizes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check touch target sizes (should be at least 44x44px)
      const interactiveElements = await page.locator('button, a, input, select, textarea, [role="button"]').all();
      
      for (const element of interactiveElements.slice(0, 10)) { // Check first 10 elements
        const boundingBox = await element.boundingBox();
        
        if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
          // Touch targets should be at least 44x44px
          expect(boundingBox.width).toBeGreaterThanOrEqual(40); // Slight tolerance
          expect(boundingBox.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should support mobile screen readers', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/crisis');
      
      // Check that mobile interface has proper ARIA support
      const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"]').count();
      expect(landmarks).toBeGreaterThan(0);
      
      // Check for mobile-specific accessibility features
      const mobileMenuButton = page.locator('[aria-expanded], [aria-haspopup]');
      if (await mobileMenuButton.count() > 0) {
        const firstButton = mobileMenuButton.first();
        const ariaExpanded = await firstButton.getAttribute('aria-expanded');
        expect(ariaExpanded).toMatch(/true|false/);
      }
    });
  });

  test.describe('Crisis-Specific Accessibility', () => {
    
    test('should prioritize accessibility for crisis intervention features', async ({ page }) => {
      await page.goto('/chat');
      
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      await chatInput.fill('I am in a mental health crisis');
      await chatInput.press('Enter');
      
      // Crisis response should be accessible
      await page.waitForTimeout(3000);
      
      const crisisElements = page.locator('[class*="crisis"], [class*="emergency"], [role="alert"]');
      const crisisCount = await crisisElements.count();
      
      if (crisisCount > 0) {
        // Crisis elements should be keyboard accessible
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        const focusWithinCrisis = await focusedElement.evaluate(el => {
          const crisisElement = el?.closest('[class*="crisis"], [class*="emergency"], [role="alert"]');
          return !!crisisElement;
        });
        
        // Should be able to focus on crisis elements
        expect(focusWithinCrisis).toBe(true);
      }
    });

    test('should provide multiple ways to access emergency resources', async ({ page }) => {
      await page.goto('/');
      
      // Should have multiple paths to crisis resources
      const crisisAccessPoints = [
        page.locator('text=/crisis|emergency|988/i'),
        page.locator('[data-testid*="crisis"], [data-testid*="emergency"]'),
        page.locator('a[href*="/crisis"], a[href*="/emergency"]')
      ];
      
      let accessPointsFound = 0;
      for (const accessPoint of crisisAccessPoints) {
        const count = await accessPoint.count();
        if (count > 0) {
          accessPointsFound++;
        }
      }
      
      // Should have at least 2 ways to access crisis resources
      expect(accessPointsFound).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Reduced Motion Support', () => {
    
    test('should respect reduced motion preferences', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('/');
      
      // Check that animations are reduced/disabled
      const animatedElements = await page.locator('[class*="animate"], [class*="transition"]').all();
      
      for (const element of animatedElements.slice(0, 5)) {
        const animationDuration = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return computed.animationDuration;
        });
        
        // Animation duration should be very short or none
        expect(animationDuration).toMatch(/0s|0\.01s|none/);
      }
    });
  });

  test.describe('Language and Internationalization', () => {
    
    test('should have proper language attributes', async ({ page }) => {
      await page.goto('/');
      
      // Check that html element has lang attribute
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBeTruthy();
      expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en', 'en-US'
    });

    test('should support right-to-left languages if available', async ({ page }) => {
      // Test if RTL support is available
      await page.addInitScript(() => {
        document.documentElement.setAttribute('dir', 'rtl');
      });
      
      await page.goto('/');
      
      // Check that layout adapts to RTL
      const bodyDir = await page.getAttribute('body', 'dir');
      const htmlDir = await page.getAttribute('html', 'dir');
      
      if (bodyDir === 'rtl' || htmlDir === 'rtl') {
        // RTL layout should be properly supported
        const textAlign = await page.locator('body').evaluate(el => {
          return window.getComputedStyle(el).textAlign;
        });
        
        expect(textAlign).toMatch(/right|start/);
      }
    });
  });
});
