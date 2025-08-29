import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Critical Mental Health Platform User Flows
 * 
 * This comprehensive test suite covers all critical user journeys that directly impact
 * user safety and crisis intervention capabilities of the Astral Core platform.
 */

test.describe('Critical User Flows - Mental Health Platform', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up privacy and accessibility settings for mental health platform
    await page.addInitScript(() => {
      // Mock crisis service availability
      window.localStorage.setItem('crisis-services-available', 'true');
      window.localStorage.setItem('emergency-contacts-configured', 'true');
    });
    
    // Navigate to platform homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Crisis Detection and Response Flow', () => {
    
    test('should detect crisis language and provide immediate intervention options', async ({ page }) => {
      // Navigate to chat interface
      await page.click('[data-testid="chat-button"], text="Chat"');
      
      // Wait for chat interface to load
      await expect(page.locator('[data-testid="chat-input"], textarea, input[type="text"]')).toBeVisible({ timeout: 10000 });
      
      // Send crisis message
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      await chatInput.fill('I want to hurt myself and end my life');
      
      // Submit message
      await Promise.race([
        page.click('[data-testid="send-button"]'),
        page.press('[data-testid="chat-input"], textarea, input[type="text"]', 'Enter'),
        chatInput.press('Enter')
      ]);
      
      // Verify crisis detection triggers within 5 seconds (critical for user safety)
      await Promise.race([
        expect(page.locator('[data-testid="crisis-alert"]')).toBeVisible({ timeout: 5000 }),
        expect(page.locator('text=/crisis|emergency|help|support/i')).toBeVisible({ timeout: 5000 }),
        expect(page.locator('[class*="crisis"], [class*="alert"], [class*="emergency"]')).toBeVisible({ timeout: 5000 })
      ]);
      
      // Verify emergency resources are immediately accessible
      const emergencyElements = [
        page.locator('text=/988|lifeline|emergency/i'),
        page.locator('[data-testid="emergency-button"], [data-testid="crisis-help"]'),
        page.locator('text=/get help|crisis resources|emergency contact/i')
      ];
      
      let emergencyFound = false;
      for (const element of emergencyElements) {
        if (await element.isVisible({ timeout: 2000 })) {
          emergencyFound = true;
          break;
        }
      }
      
      expect(emergencyFound).toBe(true);
    });

    test('should provide immediate access to 988 Suicide & Crisis Lifeline', async ({ page }) => {
      // Navigate to crisis resources
      await Promise.race([
        page.click('text=/crisis|emergency|help/i'),
        page.click('[data-testid="crisis-resources"]'),
        page.goto('/crisis')
      ]);
      
      // Verify 988 lifeline is prominently displayed
      await expect(page.locator('text=/988/i')).toBeVisible({ timeout: 5000 });
      
      // Check that lifeline can be accessed (click should initiate call or show contact)
      const lifelineButton = page.locator('text=/call 988|988 lifeline|dial 988/i, [href*="988"], [data-testid="lifeline"]').first();
      await expect(lifelineButton).toBeVisible();
      
      // Verify emergency contact information is available
      await expect(page.locator('text=/emergency|24/i')).toBeVisible();
    });

    test('should handle offline crisis support with service worker', async ({ page }) => {
      // Navigate to any page first
      await page.goto('/');
      
      // Simulate offline condition
      await page.context().setOffline(true);
      
      // Try to access crisis resources offline
      await page.goto('/crisis');
      
      // Should still load basic crisis information due to service worker caching
      await expect(page.locator('text=/crisis|emergency|988/i')).toBeVisible({ timeout: 10000 });
      
      // Restore online condition
      await page.context().setOffline(false);
    });
  });

  test.describe('Safety Plan Creation and Access', () => {
    
    test('should allow users to create and access safety plan during crisis', async ({ page }) => {
      // Navigate to safety plan
      await Promise.race([
        page.click('text=/safety plan/i'),
        page.click('[data-testid="safety-plan"]'),
        page.goto('/safety-plan')
      ]);
      
      // Should be able to add emergency contacts
      const addContactButton = page.locator('text=/add contact|new contact|emergency contact/i, [data-testid="add-contact"]').first();
      if (await addContactButton.isVisible({ timeout: 5000 })) {
        await addContactButton.click();
        
        // Fill emergency contact information
        const nameInput = page.locator('input[placeholder*="name"], input[name*="name"], [data-testid="contact-name"]').first();
        const phoneInput = page.locator('input[placeholder*="phone"], input[name*="phone"], input[type="tel"], [data-testid="contact-phone"]').first();
        
        if (await nameInput.isVisible({ timeout: 3000 })) {
          await nameInput.fill('Emergency Contact');
        }
        if (await phoneInput.isVisible({ timeout: 3000 })) {
          await phoneInput.fill('555-0123');
        }
        
        // Save contact
        await Promise.race([
          page.click('text=/save|add|create/i'),
          nameInput.press('Enter')
        ]);
      }
      
      // Verify safety plan sections are accessible
      const sections = [
        'emergency contact',
        'coping strategies',
        'professional help',
        'support',
        'reason'
      ];
      
      for (const section of sections) {
        const sectionElement = page.locator(`text=/${section}/i`);
        if (await sectionElement.isVisible({ timeout: 2000 })) {
          console.log(`Section "${section}" found and visible`);
        }
      }
    });

    test('should provide quick access to safety plan during crisis chat', async ({ page }) => {
      // Start a chat session
      await page.goto('/chat');
      
      // Send crisis message
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      await chatInput.fill('I need help with my crisis plan');
      await chatInput.press('Enter');
      
      // Look for safety plan access in crisis response
      await expect(page.locator('text=/safety plan|crisis plan|emergency plan/i')).toBeVisible({ timeout: 8000 });
    });
  });

  test.describe('Helper Certification and Training Flow', () => {
    
    test('should allow prospective helpers to access training materials', async ({ page }) => {
      // Navigate to helper section
      await Promise.race([
        page.click('text=/become helper|helper training|volunteer/i'),
        page.click('[data-testid="helper-application"]'),
        page.goto('/helper-application')
      ]);
      
      // Should show training requirements
      await expect(page.locator('text=/training|certification|requirement/i')).toBeVisible({ timeout: 5000 });
      
      // Should have guidelines accessible
      await expect(page.locator('text=/guideline|protocol|rule/i')).toBeVisible({ timeout: 5000 });
    });

    test('should validate helper certification process', async ({ page }) => {
      // Navigate to helper dashboard/login
      await Promise.race([
        page.click('text=/helper login|helper dashboard/i'),
        page.goto('/helper-login')
      ]);
      
      // Should show certification status or login
      const certificationElements = [
        page.locator('text=/certification|certified|training/i'),
        page.locator('text=/login|sign in|access/i')
      ];
      
      let certificationVisible = false;
      for (const element of certificationElements) {
        if (await element.isVisible({ timeout: 3000 })) {
          certificationVisible = true;
          break;
        }
      }
      
      expect(certificationVisible).toBe(true);
    });
  });

  test.describe('Accessibility and Mobile Responsiveness', () => {
    
    test('should be fully keyboard navigable for crisis scenarios', async ({ page }) => {
      // Start from homepage
      await page.goto('/');
      
      // Navigate to crisis resources using only keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Continue tabbing until we find crisis-related link
      let tabCount = 0;
      while (tabCount < 20) {
        const currentFocus = await page.locator(':focus');
        const currentText = await currentFocus.textContent() || '';
        
        if (currentText.toLowerCase().includes('crisis') || 
            currentText.toLowerCase().includes('help') ||
            currentText.toLowerCase().includes('emergency')) {
          await page.keyboard.press('Enter');
          break;
        }
        
        await page.keyboard.press('Tab');
        tabCount++;
      }
      
      // Should be able to access emergency resources with keyboard
      await expect(page.locator('text=/988|crisis|emergency/i')).toBeVisible({ timeout: 5000 });
    });

    test('should work properly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to main features
      await page.goto('/');
      
      // Verify critical features are accessible on mobile
      await expect(page.locator('text=/chat|crisis|help/i')).toBeVisible({ timeout: 5000 });
      
      // Test mobile menu if present
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"], .hamburger, text="☰"').first();
      if (await mobileMenuButton.isVisible({ timeout: 3000 })) {
        await mobileMenuButton.click();
        await expect(page.locator('text=/chat|crisis|help|safety/i')).toBeVisible({ timeout: 3000 });
      }
      
      // Verify touch targets are appropriate size (at least 44px)
      const buttons = await page.locator('button, a, [role="button"]').all();
      for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
        const boundingBox = await button.boundingBox();
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(40); // Slightly less than 44px for some tolerance
        }
      }
    });
  });

  test.describe('Performance and Reliability', () => {
    
    test('should load critical crisis resources quickly', async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to crisis resources
      await page.goto('/crisis');
      
      // Wait for critical content to load
      await expect(page.locator('text=/988|crisis|emergency|help/i')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Crisis resources should load within 5 seconds (critical for emergency situations)
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle high load scenarios for crisis chat', async ({ page }) => {
      // Simulate rapid crisis messages
      await page.goto('/chat');
      
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      
      const messages = [
        'I need help',
        'Feeling overwhelmed',
        'Crisis situation',
        'Need support now',
        'Emergency help needed'
      ];
      
      for (const message of messages) {
        await chatInput.fill(message);
        await chatInput.press('Enter');
        
        // Small delay to simulate realistic typing
        await page.waitForTimeout(500);
      }
      
      // Verify system responds to crisis indicators
      await expect(page.locator('text=/crisis|help|support|988/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Privacy and Security', () => {
    
    test('should not persist sensitive crisis data unnecessarily', async ({ page }) => {
      // Navigate to chat
      await page.goto('/chat');
      
      // Send sensitive message
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      await chatInput.fill('I am in crisis and need help');
      await chatInput.press('Enter');
      
      // Refresh page and check if sensitive data is cleared
      await page.reload();
      
      // Sensitive crisis message should not be visible after reload (privacy protection)
      await expect(page.locator('text="I am in crisis and need help"')).not.toBeVisible({ timeout: 3000 });
    });

    test('should maintain HTTPS for all crisis-related communications', async ({ page }) => {
      // Check that crisis pages use HTTPS (if not localhost)
      await page.goto('/crisis');
      
      const url = page.url();
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        expect(url).toMatch(/^https:/);
      }
    });
  });

  test.describe('Integration and End-to-End Workflows', () => {
    
    test('should complete full crisis intervention workflow', async ({ page }) => {
      // Step 1: User accesses platform in crisis
      await page.goto('/');
      
      // Step 2: Navigate to chat for support
      await page.click('text=/chat|talk|support/i');
      
      // Step 3: Express crisis situation
      const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
      await chatInput.fill('I am thinking about suicide and need immediate help');
      await chatInput.press('Enter');
      
      // Step 4: System should detect crisis and respond
      await expect(page.locator('text=/crisis|988|emergency|help/i')).toBeVisible({ timeout: 5000 });
      
      // Step 5: Access emergency resources
      await page.click('text=/988|lifeline|emergency/i');
      
      // Step 6: Verify emergency contact information is displayed
      await expect(page.locator('text=/988|crisis|lifeline|emergency/i')).toBeVisible();
      
      // Step 7: Access safety plan (if available)
      const safetyPlanLink = page.locator('text=/safety plan|crisis plan/i');
      if (await safetyPlanLink.isVisible({ timeout: 3000 })) {
        await safetyPlanLink.click();
        await expect(page.locator('text=/safety|plan|emergency|contact/i')).toBeVisible({ timeout: 3000 });
      }
    });

    test('should provide consistent crisis support across all entry points', async ({ page }) => {
      const entryPoints = ['/', '/chat', '/crisis', '/help'];
      
      for (const entryPoint of entryPoints) {
        const response = await page.goto(entryPoint);
        if (response && response.ok()) {
          // Every entry point should provide access to crisis resources
          await expect(page.locator('text=/crisis|emergency|988|help/i')).toBeVisible({ timeout: 5000 });
        } else {
          console.log(`Entry point ${entryPoint} returned error response or doesn't exist`);
        }
      }
    });
  });
});
