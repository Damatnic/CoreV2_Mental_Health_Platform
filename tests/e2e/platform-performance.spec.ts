import { test, expect } from '@playwright/test';

/**
 * Mental Health Platform Performance and Reliability Tests
 * 
 * Tests focused on performance, reliability, and system resilience
 * for critical mental health platform features.
 */

test.describe('Performance and Reliability - Mental Health Platform', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up performance monitoring
    await page.addInitScript(() => {
      window.performance.mark('test-start');
    });
  });

  test.describe('Crisis Response Performance', () => {
    
    test('should load crisis resources within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/crisis');
      await expect(page.locator('text=/988|crisis|emergency|help/i')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should detect crisis keywords quickly in chat', async ({ page }) => {
      await page.goto('/chat');
      
      const startTime = Date.now();
      
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      await chatInput.fill('I want to hurt myself');
      await chatInput.press('Enter');
      
      // Crisis detection should trigger quickly
      await expect(page.locator('text=/crisis|help|support|988/i')).toBeVisible({ timeout: 5000 });
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 second max for user safety
    });

    test('should handle rapid successive crisis messages', async ({ page }) => {
      await page.goto('/chat');
      
      const messages = [
        'I need help',
        'Feeling suicidal',
        'Want to end my life',
        'Crisis situation'
      ];
      
      for (const message of messages) {
        const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
        await chatInput.fill(message);
        await chatInput.press('Enter');
        
        // Small delay between messages
        await page.waitForTimeout(200);
      }
      
      // Should still respond appropriately to crisis content
      await expect(page.locator('text=/crisis|help|988/i')).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('System Reliability', () => {
    
    test('should gracefully handle network interruptions', async ({ page }) => {
      await page.goto('/');
      
      // Simulate network failure
      await page.context().setOffline(true);
      
      // Try to navigate to crisis resources
      await page.goto('/crisis');
      
      // Should show some form of offline message or cached content
      const offlineIndicators = [
        page.locator('text=/offline|disconnected|network/i'),
        page.locator('text=/988|crisis|emergency/i') // Cached content
      ];
      
      let hasOfflineSupport = false;
      for (const indicator of offlineIndicators) {
        if (await indicator.isVisible({ timeout: 5000 })) {
          hasOfflineSupport = true;
          break;
        }
      }
      
      expect(hasOfflineSupport).toBe(true);
      
      // Restore connection
      await page.context().setOffline(false);
    });

    test('should maintain chat functionality under load', async ({ page }) => {
      await page.goto('/chat');
      
      // Send multiple messages quickly
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      
      for (let i = 0; i < 10; i++) {
        await chatInput.fill(`Test message ${i + 1}`);
        await chatInput.press('Enter');
        await page.waitForTimeout(100); // Very short delay
      }
      
      // Should still be responsive
      await chatInput.fill('Final test message');
      await chatInput.press('Enter');
      
      await expect(page.locator('text="Final test message"')).toBeVisible({ timeout: 5000 });
    });

    test('should recover from JavaScript errors gracefully', async ({ page }) => {
      let jsErrors: string[] = [];
      
      // Capture JavaScript errors
      page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });
      
      await page.goto('/');
      
      // Navigate through critical functions
      const criticalPaths = ['/chat', '/crisis', '/safety-plan'];
      
      for (const path of criticalPaths) {
        const response = await page.goto(path);
        if (response && response.ok()) {
          // Basic functionality should work
          await expect(page.locator('h1, h2, main')).toHaveCount(1);
        }
      }
      
      // Should have minimal JavaScript errors
      expect(jsErrors.length).toBeLessThan(5);
    });
  });

  test.describe('Mobile Performance', () => {
    
    test('should load quickly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await page.goto('/');
      
      // Core content should load quickly on mobile
      await expect(page.locator('h1, main, [role="main"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(4000); // Slightly more lenient for mobile
    });

    test('should handle touch interactions smoothly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Test touch on interactive elements
      const buttons = await page.locator('button, a, [role="button"]').all();
      
      if (buttons.length > 0) {
        const firstButton = buttons[0];
        
        // Simulate touch
        await firstButton.tap();
        
        // Should respond to touch interaction
        await page.waitForTimeout(500);
        
        // Page should still be functional after touch
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Data Persistence and Privacy', () => {
    
    test('should not persist sensitive crisis data', async ({ page }) => {
      await page.goto('/chat');
      
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      await chatInput.fill('Sensitive crisis information');
      await chatInput.press('Enter');
      
      // Wait for processing
      await page.waitForTimeout(1000);
      
      // Refresh page
      await page.reload();
      
      // Sensitive data should not persist
      await expect(page.locator('text="Sensitive crisis information"')).not.toBeVisible();
    });

    test('should handle session timeouts gracefully', async ({ page }) => {
      await page.goto('/chat');
      
      // Simulate session timeout by clearing storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to use chat functionality
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      if (await chatInput.isVisible({ timeout: 2000 })) {
        await chatInput.fill('Test after session timeout');
        await chatInput.press('Enter');
        
        // Should either work or show appropriate message
        await page.waitForTimeout(2000);
      }
      
      // Page should remain functional
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    
    test('should work with different user agents', async ({ page }) => {
      // Test with different user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (compatible; TestBot/1.0)'
      });
      
      await page.goto('/');
      
      // Basic functionality should work regardless of user agent
      await expect(page.locator('h1, main, [role="main"]')).toBeVisible();
    });

    test('should handle different viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // Small mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 } // Desktop
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/');
        
        // Should have responsive layout
        await expect(page.locator('body')).toBeVisible();
        
        // Content should be accessible at all sizes
        await expect(page.locator('h1, main')).toBeVisible();
      }
    });
  });

  test.describe('Security and Error Handling', () => {
    
    test('should handle malformed input gracefully', async ({ page }) => {
      await page.goto('/chat');
      
      const malformedInputs = [
        '<script>alert("test")</script>',
        '".eval(alert(1))"',
        'javascript:void(0)',
        Array(1000).fill('A').join('') // Very long string
      ];
      
      for (const input of malformedInputs) {
        const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
        
        if (await chatInput.isVisible({ timeout: 2000 })) {
          await chatInput.fill(input);
          await chatInput.press('Enter');
          
          // Should not execute malicious code or crash
          await page.waitForTimeout(500);
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('should provide appropriate error messages', async ({ page }) => {
      // Try to access non-existent page
      const response = await page.goto('/non-existent-page');
      
      if (response && !response.ok()) {
        // Should show user-friendly error page
        await expect(page.locator('text=/error|not found|404/i')).toBeVisible();
      }
    });
  });

  test.describe('Resource Management', () => {
    
    test('should not consume excessive memory', async ({ page }) => {
      await page.goto('/');
      
      // Navigate through several pages
      const pages = ['/', '/chat', '/crisis', '/'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Check basic functionality is maintained
        await expect(page.locator('body')).toBeVisible();
      }
      
      // Memory should not grow excessively (basic check)
      const memoryUsage = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Basic memory check (less than 50MB)
      if (memoryUsage > 0) {
        expect(memoryUsage).toBeLessThan(50 * 1024 * 1024);
      }
    });

    test('should clean up resources properly', async ({ page }) => {
      await page.goto('/chat');
      
      // Start multiple interactions
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      
      if (await chatInput.isVisible({ timeout: 2000 })) {
        // Send multiple messages
        for (let i = 0; i < 5; i++) {
          await chatInput.fill(`Cleanup test message ${i}`);
          await chatInput.press('Enter');
          await page.waitForTimeout(200);
        }
      }
      
      // Navigate away and back
      await page.goto('/');
      await page.goto('/chat');
      
      // Should still be functional
      if (await chatInput.isVisible({ timeout: 2000 })) {
        await chatInput.fill('Final cleanup test');
        await chatInput.press('Enter');
        
        await expect(page.locator('text="Final cleanup test"')).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
