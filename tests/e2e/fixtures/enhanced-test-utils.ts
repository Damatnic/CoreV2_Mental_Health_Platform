import { Page, Locator } from '@playwright/test';

/**
 * Enhanced Test Utilities for E2E Testing
 * 
 * Provides helper functions for common testing scenarios
 * in the mental health platform.
 */

export class TestUtils {
  
  /**
   * Setup mock user session for testing
   */
  static async setupMockUserSession(page: Page, userType: 'seeker' | 'helper' = 'seeker') {
    await page.addInitScript((type) => {
      window.localStorage.setItem('user-type', type);
      window.localStorage.setItem('session-active', 'true');
      window.localStorage.setItem('user-id', `test-${type}-${Date.now()}`);
    }, userType);
  }

  /**
   * Wait for page to fully load including async content
   */
  static async waitForPageLoad(page: Page, timeout: number = 10000) {
    await page.waitForLoadState('networkidle', { timeout });
    
    // Wait for any lazy-loaded components
    await page.waitForTimeout(500);
  }

  /**
   * Simulate crisis scenario with enhanced detection
   */
  static async simulateCrisisScenario(page: Page, crisisMessage: string) {
    const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
    await chatInput.fill(crisisMessage);
    await chatInput.press('Enter');
    
    // Wait for crisis detection to process
    await page.waitForTimeout(2000);
    
    return {
      crisisAlert: page.locator('[data-testid="crisis-alert"], [class*="crisis"], [class*="alert"], [role="alert"]'),
      emergencyButton: page.locator('[data-testid="emergency-button"], text=/emergency|911/i'),
      safetyPlan: page.locator('[data-testid="safety-plan"], text=/safety plan/i'),
      lifeline: page.locator('text=/988|lifeline/i')
    };
  }

  /**
   * Verify crisis alert functionality
   */
  static async verifyCrisisAlert(page: Page) {
    const crisisElements = [
      page.locator('[data-testid="crisis-alert"]'),
      page.locator('text=/crisis|emergency|988/i'),
      page.locator('[class*="crisis"], [class*="alert"]')
    ];
    
    let alertFound = false;
    for (const element of crisisElements) {
      if (await element.isVisible({ timeout: 3000 })) {
        alertFound = true;
        break;
      }
    }
    
    return alertFound;
  }

  /**
   * Clean up test data and reset state
   */
  static async cleanupTestData(page: Page) {
    await page.evaluate(() => {
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any test-specific data
      const testElements = document.querySelectorAll('[data-test-id]');
      testElements.forEach(element => element.remove());
    });
  }

  /**
   * Simulate network conditions
   */
  static async simulateNetworkConditions(page: Page, condition: 'slow' | 'offline' | 'normal') {
    switch (condition) {
      case 'offline':
        await page.context().setOffline(true);
        break;
      case 'slow':
        await page.route('**/*', async (route) => {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          route.continue();
        });
        break;
      case 'normal':
        await page.context().setOffline(false);
        await page.unroute('**/*');
        break;
    }
  }

  /**
   * Find and interact with crisis elements
   */
  static async findCrisisElements(page: Page) {
    const selectors = {
      crisisAlert: '[data-testid="crisis-alert"], [class*="crisis"], [role="alert"]',
      emergencyButton: '[data-testid="emergency-button"], text=/emergency|911/i',
      lifelineButton: 'text=/988|lifeline/i, [href*="988"]',
      safetyPlan: '[data-testid="safety-plan"], text=/safety plan/i',
      helpResources: 'text=/help|support|resources/i'
    };
    
    const elements: Record<string, Locator> = {};
    
    for (const [key, selector] of Object.entries(selectors)) {
      elements[key] = page.locator(selector);
    }
    
    return elements;
  }

  /**
   * Test accessibility features
   */
  static async testAccessibility(page: Page) {
    const results = {
      hasMainLandmark: false,
      hasNavLandmark: false,
      hasHeadings: false,
      hasSkipLinks: false,
      keyboardNavigable: false
    };
    
    // Check for landmarks
    results.hasMainLandmark = await page.locator('main, [role="main"]').count() > 0;
    results.hasNavLandmark = await page.locator('nav, [role="navigation"]').count() > 0;
    
    // Check for headings
    results.hasHeadings = await page.locator('h1, h2, h3, h4, h5, h6').count() > 0;
    
    // Check for skip links
    await page.keyboard.press('Tab');
    const firstFocus = page.locator(':focus');
    const firstFocusText = await firstFocus.textContent();
    results.hasSkipLinks = firstFocusText?.toLowerCase().includes('skip') || false;
    
    // Test basic keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const secondFocus = page.locator(':focus');
    results.keyboardNavigable = await secondFocus.count() > 0;
    
    return results;
  }

  /**
   * Check performance metrics
   */
  static async checkPerformanceMetrics(page: Page) {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
        firstContentfulPaint: 0, // Would need additional setup for this
        interactiveTime: navigation.domInteractive - navigation.fetchStart
      };
    });
    
    return metrics;
  }

  /**
   * Simulate user interactions realistically
   */
  static async simulateRealisticTyping(page: Page, selector: string, text: string, delay: number = 100) {
    const element = page.locator(selector);
    
    for (const char of text) {
      await element.type(char);
      await page.waitForTimeout(delay + Math.random() * 50); // Add some randomness
    }
  }

  /**
   * Test mobile-specific functionality
   */
  static async testMobileFeatures(page: Page) {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileFeatures = {
      hasResponsiveLayout: false,
      hasTouchTargets: false,
      hasMobileMenu: false
    };
    
    // Check responsive layout
    const bodyWidth = await page.locator('body').evaluate(el => el.clientWidth);
    mobileFeatures.hasResponsiveLayout = bodyWidth <= 400;
    
    // Check touch target sizes
    const buttons = await page.locator('button, a, [role="button"]').all();
    if (buttons.length > 0) {
      const firstButton = buttons[0];
      const boundingBox = await firstButton.boundingBox();
      mobileFeatures.hasTouchTargets = boundingBox ? (boundingBox.height >= 40 && boundingBox.width >= 40) : false;
    }
    
    // Check for mobile menu
    const mobileMenuSelectors = [
      '[data-testid="mobile-menu"]',
      'button[aria-label*="menu"]',
      '.hamburger',
      'text="☰"'
    ];
    
    for (const selector of mobileMenuSelectors) {
      if (await page.locator(selector).count() > 0) {
        mobileFeatures.hasMobileMenu = true;
        break;
      }
    }
    
    return mobileFeatures;
  }

  /**
   * Validate crisis escalation workflow
   */
  static async validateCrisisEscalation(page: Page, severityLevel: 'low' | 'medium' | 'high' | 'emergency') {
    const crisisMessages = {
      low: 'I am feeling sad today',
      medium: 'I am having suicidal thoughts',
      high: 'I want to hurt myself',
      emergency: 'I am about to kill myself right now'
    };
    
    const chatInput = page.locator('[data-testid="chat-input"], textarea, input[type="text"]').first();
    await chatInput.fill(crisisMessages[severityLevel]);
    await chatInput.press('Enter');
    
    // Check appropriate response based on severity
    const expectedResponses = {
      low: ['support', 'resources', 'help'],
      medium: ['crisis', '988', 'professional'],
      high: ['emergency', 'immediate', 'crisis'],
      emergency: ['911', 'emergency services', 'immediate intervention']
    };
    
    const responses = expectedResponses[severityLevel];
    let appropriateResponse = false;
    
    for (const response of responses) {
      const responseElement = page.locator(`text=/${response}/i`);
      if (await responseElement.isVisible({ timeout: 5000 })) {
        appropriateResponse = true;
        break;
      }
    }
    
    return appropriateResponse;
  }
}

/**
 * Test data fixtures for consistent testing
 */
export const testData = {
  crisisMessages: [
    'I want to end my life',
    'I have been planning my suicide',
    'I feel hopeless and want to die',
    'Nothing matters anymore',
    'I am going to hurt myself tonight'
  ],
  
  supportMessages: [
    'I am feeling sad',
    'Need someone to talk to',
    'Having a hard time',
    'Feeling overwhelmed',
    'Need advice'
  ],
  
  emergencyContacts: [
    { name: 'Emergency Contact 1', phone: '555-0123', relationship: 'family' },
    { name: 'Crisis Counselor', phone: '555-0456', relationship: 'professional' },
    { name: 'Support Person', phone: '555-0789', relationship: 'friend' }
  ],
  
  userProfiles: {
    seeker: {
      id: 'test-seeker-001',
      type: 'seeker',
      needsCrisisSupport: false
    },
    helper: {
      id: 'test-helper-001',
      type: 'helper',
      certified: true,
      specialties: ['crisis-intervention', 'general-support']
    }
  }
};

/**
 * Mock API responses for testing
 */
export class MockAPI {
  static async setupCrisisDetectionMocks(page: Page) {
    await page.route('/api/crisis-detection', async (route) => {
      const request = route.request();
      const data = request.postData();
      
      let response = {
        hasCrisisIndicators: false,
        severity: 'none',
        escalationRequired: false,
        emergencyServicesRequired: false
      };
      
      if (data && (data.includes('suicide') || data.includes('kill myself'))) {
        response = {
          hasCrisisIndicators: true,
          severity: 'emergency',
          escalationRequired: true,
          emergencyServicesRequired: true
        };
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }
  
  static async setupChatMocks(page: Page) {
    await page.route('/api/chat', async (route) => {
      const request = route.request();
      const data = request.postData();
      
      let response = {
        message: 'I understand you are reaching out for support. How can I help you today?',
        crisisDetected: false
      };
      
      if (data && (data.includes('crisis') || data.includes('suicide'))) {
        response = {
          message: 'I notice you may be in crisis. Please reach out to 988 Suicide & Crisis Lifeline for immediate help.',
          crisisDetected: true
        };
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }
}
