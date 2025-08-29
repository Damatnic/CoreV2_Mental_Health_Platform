import { test, expect } from '@playwright/test';
import { TestUtils } from './fixtures/test-utils';
import { testData } from './fixtures/test-fixtures';

/**
 * Comprehensive Crisis Workflow E2E Tests
 * End-to-end testing of complete crisis intervention workflows
 */
test.describe('Complete Crisis Workflow Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    await TestUtils.setupMockUserSession(page, 'seeker');
    await TestUtils.waitForPageLoad(page);
  });

  test.afterEach(async ({ page }) => {
    await TestUtils.cleanupTestData(page);
  });

  test('should handle complete crisis intervention workflow from detection to resolution', async ({ page }) => {
    // Step 1: User enters crisis chat
    await page.goto('/chat');
    await TestUtils.waitForPageLoad(page);
    
    // Step 2: Send initial support-seeking message
    await page.locator('[data-testid="chat-input"]').fill('I am struggling today and need someone to talk to');
    await page.locator('[data-testid="send-button"]').click();
    
    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });
    
    // Step 3: Escalate to crisis language
    const crisisMessage = testData.crisisMessages[0]; // "I want to end my life"
    const crisisElements = await TestUtils.simulateCrisisScenario(page, crisisMessage);
    
    // Step 4: Verify immediate crisis response
    await expect(crisisElements.crisisAlert).toBeVisible({ timeout: 3000 });
    await TestUtils.verifyCrisisAlert(page);
    
    // Step 5: Access safety plan during crisis
    await crisisElements.safetyPlan.click();
    await expect(page.locator('[data-testid="safety-plan"]')).toBeVisible();
    
    // Verify safety plan sections are accessible
    const safetyPlanSections = [
      'professional-contacts',
      'support-contacts', 
      'coping-strategies',
      'reasons-to-live'
    ];
    
    for (const section of safetyPlanSections) {
      await expect(page.locator(`[data-testid="${section}"]`)).toBeVisible();
    }
    
    // Step 6: Test emergency escalation
    await page.locator('[data-testid="emergency-button"]').click();
    await expect(page.locator('[data-testid="emergency-contacts-modal"]')).toBeVisible();
    
    // Verify all emergency contacts are available
    await TestUtils.verifyEmergencyContacts(page);
    
    // Step 7: Test 988 lifeline access
    await page.locator('[data-testid="call-lifeline-button"]').click();
    await expect(page.locator('[data-testid="lifeline-confirmation"]')).toBeVisible();
    
    // Step 8: Return to chat and verify crisis state is maintained
    await page.goto('/chat');
    await expect(page.locator('[data-testid="crisis-state-indicator"]')).toBeVisible();
    
    // Step 9: Test crisis resource persistence
    await expect(page.locator('[data-testid="crisis-resources-banner"]')).toBeVisible();
  });

  test('should maintain crisis support during network interruptions', async ({ page }) => {
    // Start crisis scenario
    await page.goto('/chat');
    const crisisElements = await TestUtils.simulateCrisisScenario(page, 'I am having thoughts of self-harm');
    
    // Verify crisis detection works online
    await expect(crisisElements.crisisAlert).toBeVisible();
    
    // Go offline
    await TestUtils.goOffline(page);
    
    // Verify offline crisis resources are available
    await page.goto('/crisis-offline');
    await expect(page.locator('[data-testid="offline-crisis-resources"]')).toBeVisible();
    
    // Verify emergency numbers are still accessible
    await expect(page.locator('text="988"')).toBeVisible();
    await expect(page.locator('text="911"')).toBeVisible();
    
    // Test offline safety plan access
    await page.goto('/safety-plan');
    await expect(page.locator('[data-testid="safety-plan"]')).toBeVisible();
    
    // Restore online and verify seamless transition
    await TestUtils.goOnline(page);
    await page.goto('/chat');
    await expect(crisisElements.crisisAlert).toBeVisible();
  });

  test('should provide culturally sensitive crisis intervention', async ({ page }) => {
    // Set Spanish language preference
    await page.goto('/settings');
    await page.locator('[data-testid="language-spanish"]').click();
    
    // Trigger crisis in Spanish
    await page.goto('/chat');
    await page.locator('[data-testid="chat-input"]').fill('Quiero hacerme daño');
    await page.locator('[data-testid="send-button"]').click();
    
    // Verify Spanish crisis resources
    await page.waitForSelector('[data-testid="crisis-alert"]', { timeout: 5000 });
    await expect(page.locator('text="Línea Nacional de Prevención del Suicidio"')).toBeVisible();
    
    // Test culturally appropriate resources
    await expect(page.locator('[data-testid="cultural-crisis-resources"]')).toBeVisible();
  });

  test('should handle multiple simultaneous crisis sessions', async ({ page, context }) => {
    // Create multiple browser tabs for concurrent crisis scenarios
    const pages = await Promise.all([
      page,
      context.newPage(),
      context.newPage()
    ]);
    
    // Setup user sessions for each page
    for (const p of pages) {
      await TestUtils.setupMockUserSession(p, 'seeker');
    }
    
    // Trigger crisis scenarios simultaneously
    const crisisPromises = pages.map(async (p, index) => {
      await p.goto('/chat');
      return TestUtils.simulateCrisisScenario(p, testData.crisisMessages[index]);
    });
    
    const crisisResults = await Promise.all(crisisPromises);
    
    // Verify all crisis scenarios are handled properly
    for (let i = 0; i < pages.length; i++) {
      await expect(crisisResults[i].crisisAlert).toBeVisible();
      await expect(crisisResults[i].emergencyButton).toBeVisible();
    }
  });

  test('should escalate to human helper when available', async ({ page, context }) => {
    // Setup helper session
    const helperPage = await context.newPage();
    await TestUtils.setupMockUserSession(helperPage, 'helper');
    await helperPage.goto('/helper-dashboard');
    
    // Mark helper as available for crisis support
    await helperPage.locator('[data-testid="available-for-crisis"]').click();
    
    // Create crisis scenario in seeker session
    await page.goto('/chat');
    await TestUtils.simulateCrisisScenario(page, 'I need to talk to someone right now');
    
    // Request human helper
    await page.locator('[data-testid="request-human-helper"]').click();
    
    // Verify helper receives crisis notification
    await expect(helperPage.locator('[data-testid="crisis-notification"]')).toBeVisible({ timeout: 5000 });
    
    // Helper accepts crisis chat
    await helperPage.locator('[data-testid="accept-crisis-chat"]').click();
    
    // Verify connection is established
    await expect(page.locator('[data-testid="helper-connected"]')).toBeVisible();
    await expect(helperPage.locator('[data-testid="crisis-chat-active"]')).toBeVisible();
  });

  test('should track crisis intervention metrics without exposing personal data', async ({ page }) => {
    // Trigger crisis scenario
    await page.goto('/chat');
    await TestUtils.simulateCrisisScenario(page, 'I am in crisis and need help');
    
    // Interact with crisis resources
    await page.locator('[data-testid="emergency-button"]').click();
    await page.locator('[data-testid="call-lifeline-button"]').click();
    await page.locator('[data-testid="safety-plan-button"]').click();
    
    // Verify intervention tracking (anonymized)
    const trackingData = await page.evaluate(() => {
      return localStorage.getItem('crisisInterventionMetrics');
    });
    
    expect(trackingData).toBeTruthy();
    
    // Verify no personal data is tracked
    expect(trackingData).not.toContain('personal');
    expect(trackingData).not.toContain('name');
    expect(trackingData).not.toContain('email');
    
    // But verify intervention effectiveness data is captured
    const metrics = JSON.parse(trackingData || '{}');
    expect(metrics.interventionUsed).toBeTruthy();
    expect(metrics.responseTime).toBeDefined();
    expect(metrics.escalationPath).toBeDefined();
  });

  test('should provide crisis intervention accessibility compliance', async ({ page }) => {
    // Setup accessibility environment
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Trigger crisis scenario
    await page.goto('/chat');
    const crisisElements = await TestUtils.simulateCrisisScenario(page, 'I want to hurt myself');
    
    // Verify crisis alert accessibility
    await TestUtils.verifyAccessibility(crisisElements.crisisAlert);
    await TestUtils.verifyAccessibility(crisisElements.emergencyButton);
    
    // Test keyboard navigation through crisis interface
    await TestUtils.testKeyboardNavigation(page, '[data-testid="crisis-interface"]');
    
    // Test with screen reader simulation
    const emergencyButton = crisisElements.emergencyButton;
    const ariaLabel = await emergencyButton.getAttribute('aria-label');
    expect(ariaLabel).toContain('Emergency');
    
    // Verify crisis alert announces immediately
    const crisisAlert = crisisElements.crisisAlert;
    const ariaLive = await crisisAlert.getAttribute('aria-live');
    expect(ariaLive).toBe('assertive');
  });

  test('should handle crisis workflow response times within acceptable limits', async ({ page }) => {
    await page.goto('/chat');
    
    // Measure crisis detection response time
    const detectionTime = await TestUtils.measureResponseTime(page, async () => {
      await page.locator('[data-testid="chat-input"]').fill('I want to end my life');
      await page.locator('[data-testid="send-button"]').click();
      await page.waitForSelector('[data-testid="crisis-alert"]', { timeout: 5000 });
    });
    
    // Crisis detection should be near-instantaneous (< 2 seconds)
    expect(detectionTime).toBeLessThan(2000);
    
    // Measure emergency escalation response time
    const escalationTime = await TestUtils.measureResponseTime(page, async () => {
      await page.locator('[data-testid="emergency-button"]').click();
      await page.waitForSelector('[data-testid="emergency-contacts-modal"]', { timeout: 3000 });
    });
    
    // Emergency escalation should be immediate (< 500ms)
    expect(escalationTime).toBeLessThan(500);
    
    // Measure safety plan access time
    const safetyPlanTime = await TestUtils.measureResponseTime(page, async () => {
      await page.locator('[data-testid="safety-plan-button"]').click();
      await page.waitForSelector('[data-testid="safety-plan"]', { timeout: 5000 });
    });
    
    // Safety plan should load quickly (< 3 seconds)
    expect(safetyPlanTime).toBeLessThan(3000);
  });

  test('should provide comprehensive crisis resource library', async ({ page }) => {
    await page.goto('/crisis-resources');
    
    // Verify all required crisis resources are available
    const requiredResources = [
      'suicide-prevention',
      'crisis-hotlines',
      'emergency-contacts',
      'safety-planning',
      'coping-strategies',
      'professional-help',
      'crisis-text-support',
      'local-resources'
    ];
    
    for (const resource of requiredResources) {
      await expect(page.locator(`[data-testid="resource-${resource}"]`)).toBeVisible();
    }
    
    // Test resource accessibility and functionality
    await page.locator('[data-testid="resource-safety-planning"]').click();
    await expect(page.locator('[data-testid="safety-plan-guide"]')).toBeVisible();
    
    // Verify resources work offline
    await TestUtils.goOffline(page);
    await page.reload();
    await expect(page.locator('[data-testid="offline-crisis-resources"]')).toBeVisible();
  });
});
