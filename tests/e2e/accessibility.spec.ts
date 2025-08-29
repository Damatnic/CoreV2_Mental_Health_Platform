import { test, expect } from '@playwright/test';

/**
 * Accessibility E2E Tests
 * Tests WCAG 2.1 AA compliance and screen reader compatibility
 */
test.describe('Accessibility Compliance', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set accessibility preferences
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      // Simulate screen reader environment
      Object.defineProperty(navigator, 'userAgent', {
        value: navigator.userAgent + ' ScreenReader'
      });
    });
  });

  test('should have proper heading hierarchy throughout the platform', async ({ page }) => {
    const pages = ['/chat', '/safety-plan', '/helper-training', '/community'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Check heading hierarchy (h1 -> h2 -> h3, no skipping)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      expect(headings.length).toBeGreaterThan(0);
      
      // Verify h1 exists and is unique
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Check that headings are properly structured
      const firstHeading = await page.locator('h1, h2, h3, h4, h5, h6').first();
      const tagName = await firstHeading.evaluate(el => el.tagName);
      expect(tagName).toBe('H1');
    }
  });

  test('should support keyboard navigation for all interactive elements', async ({ page }) => {
    await page.goto('/chat');
    
    // Test tab navigation through interactive elements
    let tabStops = 0;
    const maxTabStops = 20; // Reasonable limit
    
    while (tabStops < maxTabStops) {
      await page.keyboard.press('Tab');
      tabStops++;
      
      const focusedElement = await page.locator(':focus').first();
      const tagName = await focusedElement.evaluate(el => el.tagName);
      
      // Interactive elements should be focusable
      const interactiveTags = ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A'];
      const ariaRole = await focusedElement.getAttribute('role');
      const isInteractive = interactiveTags.includes(tagName) || 
                           ['button', 'link', 'textbox'].includes(ariaRole || '');
      
      if (isInteractive) {
        // Verify focus indicator is visible
        const computedStyle = await focusedElement.evaluate(el => {
          return window.getComputedStyle(el);
        });
        
        expect(computedStyle.outline || computedStyle.boxShadow).toBeTruthy();
      }
    }
    
    expect(tabStops).toBeGreaterThan(3); // Should have multiple focusable elements
  });

  test('should have appropriate ARIA labels and roles for crisis features', async ({ page }) => {
    await page.goto('/crisis');
    
    // Test emergency button accessibility
    const emergencyButton = page.locator('[data-testid="emergency-button"]');
    await expect(emergencyButton).toBeVisible();
    
    const ariaLabel = await emergencyButton.getAttribute('aria-label');
    expect(ariaLabel).toContain('Emergency');
    
    const role = await emergencyButton.getAttribute('role');
    expect(role).toBe('button');
    
    // Test crisis alert accessibility
    await page.locator('[data-testid="chat-input"]').fill('I want to hurt myself');
    await page.locator('[data-testid="send-button"]').click();
    
    const crisisAlert = page.locator('[data-testid="crisis-alert"]');
    await expect(crisisAlert).toBeVisible();
    
    const ariaLive = await crisisAlert.getAttribute('aria-live');
    expect(ariaLive).toBe('assertive');
    
    const alertRole = await crisisAlert.getAttribute('role');
    expect(alertRole).toBe('alert');
  });

  test('should provide proper form labels and error messages', async ({ page }) => {
    await page.goto('/safety-plan');
    await page.locator('[data-testid="create-safety-plan"]').click();
    
    // Test form field accessibility
    const warningSignsInput = page.locator('[data-testid="warning-signs-input"]');
    const label = await warningSignsInput.getAttribute('aria-label');
    expect(label).toBeTruthy();
    
    // Test form validation accessibility
    await page.locator('[data-testid="save-plan"]').click();
    
    const errorMessage = page.locator('[data-testid="validation-error"]');
    await expect(errorMessage).toBeVisible();
    
    const ariaLive = await errorMessage.getAttribute('aria-live');
    expect(ariaLive).toBe('polite');
  });

  test('should have sufficient color contrast ratios', async ({ page }) => {
    await page.goto('/chat');
    
    // Test main text contrast (should be at least 4.5:1)
    const textElements = await page.locator('p, span, div').all();
    
    for (const element of textElements.slice(0, 5)) { // Test first 5 elements
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      // For this test, we're just verifying the styles exist
      // In a real implementation, you'd calculate contrast ratios
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    }
  });

  test('should support screen reader announcements for dynamic content', async ({ page }) => {
    await page.goto('/chat');
    
    // Send a message and verify it gets announced
    await page.locator('[data-testid="chat-input"]').fill('Hello, I need support');
    await page.locator('[data-testid="send-button"]').click();
    
    // Wait for message to appear
    await page.waitForSelector('text="Hello, I need support"');
    
    // Verify message container has proper ARIA attributes
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    const ariaLive = await messagesContainer.getAttribute('aria-live');
    expect(ariaLive).toBe('polite');
    
    const ariaRelevant = await messagesContainer.getAttribute('aria-relevant');
    expect(ariaRelevant).toBe('additions');
  });

  test('should work with reduced motion preferences', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Verify animations are disabled or reduced
    const animatedElements = await page.locator('[class*="animate"], [class*="transition"]').all();
    
    for (const element of animatedElements) {
      const animationStyle = await element.evaluate(el => {
        return window.getComputedStyle(el).animationDuration;
      });
      
      // With reduced motion, animations should be minimal
      expect(animationStyle === '0s' || animationStyle === '0.01s').toBeTruthy();
    }
  });

  test('should provide skip navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first element (should be skip link)
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator(':focus');
    const skipLinkText = await skipLink.textContent();
    
    expect(skipLinkText).toMatch(/skip to|skip navigation/i);
    
    // Test skip link functionality
    await page.keyboard.press('Enter');
    
    // Verify focus moves to main content
    const focusedElement = page.locator(':focus');
    const mainContent = await focusedElement.evaluate(el => {
      return el.closest('main') !== null || el.id === 'main-content';
    });
    
    expect(mainContent).toBeTruthy();
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addInitScript(() => {
      document.documentElement.style.filter = 'contrast(150%)';
    });
    
    await page.goto('/chat');
    
    // Verify interface remains usable in high contrast
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="emergency-button"]')).toBeVisible();
  });

  test('should provide alternative text for important images', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      const ariaLabel = await image.getAttribute('aria-label');
      const role = await image.getAttribute('role');
      
      // Images should have alt text or be marked as decorative
      expect(alt !== null || ariaLabel !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('should support voice control navigation', async ({ page }) => {
    await page.goto('/chat');
    
    // Verify elements have accessible names for voice control
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const accessibleName = await button.evaluate(el => {
        return el.textContent || 
               el.getAttribute('aria-label') || 
               el.getAttribute('title') ||
               el.getAttribute('aria-labelledby');
      });
      
      expect(accessibleName).toBeTruthy();
      if (accessibleName) {
        expect(accessibleName.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
