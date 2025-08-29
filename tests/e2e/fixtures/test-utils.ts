/**
 * E2E Test Utilities for Mental Health Platform
 * Helper functions for common test operations
 */

import { Page, Locator } from '@playwright/test';

export class TestUtils {
  
  /**
   * Simulates a crisis scenario and verifies appropriate response
   */
  static async simulateCrisisScenario(page: Page, crisisMessage: string) {
    // Navigate to chat if not already there
    if (!page.url().includes('/chat')) {
      await page.goto('/chat');
    }
    
    // Send crisis message
    await page.locator('[data-testid="chat-input"]').fill(crisisMessage);
    await page.locator('[data-testid="send-button"]').click();
    
    // Wait for crisis detection
    await page.waitForTimeout(2000);
    
    return {
      crisisAlert: page.locator('[data-testid="crisis-alert"]'),
      emergencyButton: page.locator('[data-testid="emergency-button"]'),
      emergencyContacts: page.locator('[data-testid="emergency-contacts-button"]'),
      safetyPlan: page.locator('[data-testid="safety-plan-button"]')
    };
  }
  
  /**
   * Creates a mock user session for testing
   */
  static async setupMockUserSession(page: Page, userType: 'seeker' | 'helper' = 'seeker') {
    // Set up local storage for user session
    await page.addInitScript((type) => {
      localStorage.setItem('userType', type);
      localStorage.setItem('sessionId', 'test-session-' + Date.now());
      localStorage.setItem('isAuthenticated', 'true');
      
      if (type === 'helper') {
        localStorage.setItem('helperCertified', 'true');
        localStorage.setItem('certificationDate', new Date().toISOString());
      }
    }, userType);
  }
  
  /**
   * Waits for network idle and ensures page is fully loaded
   */
  static async waitForPageLoad(page: Page, timeout: number = 10000) {
    await page.waitForLoadState('networkidle', { timeout });
    
    // Wait for React to finish rendering
    await page.waitForFunction(() => {
      return document.readyState === 'complete' && 
             !document.querySelector('[data-testid="loading-spinner"]');
    }, { timeout });
  }
  
  /**
   * Verifies accessibility requirements for a page element
   */
  static async verifyAccessibility(element: Locator) {
    // Check for ARIA attributes
    const ariaLabel = await element.getAttribute('aria-label');
    const ariaLabelledBy = await element.getAttribute('aria-labelledby');
    const ariaDescribedBy = await element.getAttribute('aria-describedby');
    const role = await element.getAttribute('role');
    
    // At least one accessibility attribute should be present
    const hasAccessibilityInfo = ariaLabel || ariaLabelledBy || ariaDescribedBy || role;
    
    if (!hasAccessibilityInfo) {
      const textContent = await element.textContent();
      if (!textContent || textContent.trim().length === 0) {
        throw new Error('Element lacks accessibility information (ARIA attributes or text content)');
      }
    }
    
    // Check for minimum touch target size on interactive elements
    const tagName = await element.evaluate(el => el.tagName);
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    
    if (interactiveTags.includes(tagName)) {
      const boundingBox = await element.boundingBox();
      if (boundingBox) {
        if (boundingBox.width < 44 || boundingBox.height < 44) {
          console.warn('Interactive element may be too small for touch interaction');
        }
      }
    }
  }
  
  /**
   * Simulates offline mode for testing offline functionality
   */
  static async goOffline(page: Page) {
    await page.context().setOffline(true);
    
    // Wait a moment for offline state to register
    await page.waitForTimeout(1000);
  }
  
  /**
   * Restores online mode after offline testing
   */
  static async goOnline(page: Page) {
    await page.context().setOffline(false);
    
    // Wait for reconnection
    await page.waitForTimeout(1000);
  }
  
  /**
   * Tests response time for critical actions (emergency features)
   */
  static async measureResponseTime(page: Page, action: () => Promise<void>) {
    const startTime = Date.now();
    await action();
    const endTime = Date.now();
    
    return endTime - startTime;
  }
  
  /**
   * Verifies crisis alert appears and contains required elements
   */
  static async verifyCrisisAlert(page: Page) {
    const crisisAlert = page.locator('[data-testid="crisis-alert"]');
    
    // Verify alert is visible
    if (!(await crisisAlert.isVisible())) {
      throw new Error('Crisis alert did not appear');
    }
    
    // Verify required emergency options are present
    const requiredElements = [
      '[data-testid="emergency-button"]',
      '[data-testid="call-lifeline-button"]',
      '[data-testid="crisis-resources-link"]'
    ];
    
    for (const selector of requiredElements) {
      const element = page.locator(selector);
      if (!(await element.isVisible())) {
        throw new Error(`Required crisis element missing: ${selector}`);
      }
    }
    
    // Verify ARIA attributes for screen readers
    const ariaLive = await crisisAlert.getAttribute('aria-live');
    if (ariaLive !== 'assertive') {
      throw new Error('Crisis alert should have aria-live="assertive" for immediate announcement');
    }
  }
  
  /**
   * Tests keyboard navigation through a set of elements
   */
  static async testKeyboardNavigation(page: Page, containerSelector: string) {
    const container = page.locator(containerSelector);
    await container.focus();
    
    const focusableElements = await container.locator('button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])').all();
    
    for (let i = 0; i < focusableElements.length; i++) {
      await page.keyboard.press('Tab');
      
      // Verify current element is focused
      const currentFocus = page.locator(':focus');
      const isFocused = await currentFocus.count() > 0;
      
      if (!isFocused) {
        throw new Error(`Keyboard navigation failed at element ${i}`);
      }
    }
  }
  
  /**
   * Simulates mobile touch gestures
   */
  static async simulateSwipeGesture(page: Page, element: Locator, direction: 'left' | 'right' | 'up' | 'down') {
    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
      throw new Error('Cannot perform swipe gesture on element without bounding box');
    }
    
    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;
    
    let startX = centerX;
    let startY = centerY;
    let endX = centerX;
    let endY = centerY;
    
    const swipeDistance = 100;
    
    switch (direction) {
      case 'left':
        endX = centerX - swipeDistance;
        break;
      case 'right':
        endX = centerX + swipeDistance;
        break;
      case 'up':
        endY = centerY - swipeDistance;
        break;
      case 'down':
        endY = centerY + swipeDistance;
        break;
    }
    
    // Perform swipe gesture
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();
  }
  
  /**
   * Cleans up test data and resets application state
   */
  static async cleanupTestData(page: Page) {
    // Clear local storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Clear any test-specific cookies
    await page.context().clearCookies();
    
    // Reset any mocked network responses
    await page.unroute('**/*');
  }
  
  /**
   * Verifies emergency contact information is properly displayed
   */
  static async verifyEmergencyContacts(page: Page) {
    const expectedContacts = ['988', '911', '741741'];
    
    for (const contact of expectedContacts) {
      const contactElement = page.locator(`text="${contact}"`);
      if (!(await contactElement.isVisible())) {
        throw new Error(`Emergency contact ${contact} not found`);
      }
    }
  }
  
  /**
   * Tests form validation and error handling
   */
  static async testFormValidation(page: Page, formSelector: string, requiredFields: string[]) {
    const form = page.locator(formSelector);
    
    // Try to submit empty form
    await form.locator('[type="submit"], [data-testid*="submit"]').click();
    
    // Verify validation errors appear
    for (const field of requiredFields) {
      const errorMessage = page.locator(`[data-testid="${field}-error"]`);
      if (!(await errorMessage.isVisible())) {
        throw new Error(`Validation error not shown for required field: ${field}`);
      }
    }
  }
}
