import { test, expect } from '@playwright/test';
import { CrisisChatPage } from './pages/CrisisChatPage';

/**
 * Crisis Chat Flow E2E Tests
 * Tests critical crisis detection and intervention workflows
 */
test.describe('Crisis Chat Flows', () => {
  let crisisChatPage: CrisisChatPage;

  test.beforeEach(async ({ page }) => {
    crisisChatPage = new CrisisChatPage(page);
    await crisisChatPage.navigateToChat();
  });

  test('should detect crisis language and trigger appropriate alerts', async () => {
    // Test crisis detection with multiple crisis indicators
    await crisisChatPage.verifyCrisisDetection();
    
    // Verify crisis alert is displayed
    await expect(crisisChatPage.crisisAlert).toBeVisible();
    
    // Verify emergency resources are immediately available
    await expect(crisisChatPage.emergencyButton).toBeVisible();
    await expect(crisisChatPage.callLifelineButton).toBeVisible();
  });

  test('should provide immediate emergency escalation for severe crisis', async () => {
    // Test immediate escalation for severe crisis language
    await crisisChatPage.testEmergencyEscalation();
    
    // Verify all emergency options are available
    await expect(crisisChatPage.emergencyContactsButton).toBeVisible();
    await expect(crisisChatPage.safetyPlanButton).toBeVisible();
  });

  test('should maintain crisis chat functionality offline', async () => {
    // Test offline crisis support
    await crisisChatPage.verifyOfflineSupport();
  });

  test('should handle high-volume crisis chat scenarios', async ({ page }) => {
    // Simulate multiple rapid crisis messages
    const crisisMessages = [
      'I feel hopeless',
      'Nothing matters anymore', 
      'I want to end the pain',
      'Nobody would miss me',
      'I have a plan'
    ];

    for (const message of crisisMessages) {
      const alertTriggered = await crisisChatPage.sendCrisisMessage(message);
      expect(alertTriggered).toBe(true);
      
      // Brief pause to simulate real typing
      await page.waitForTimeout(500);
    }
    
    // Verify crisis alert remains persistent
    await expect(crisisChatPage.crisisAlert).toBeVisible();
  });

  test('should provide contextual crisis resources based on conversation', async () => {
    // Test different types of crisis scenarios
    const scenarios = [
      {
        message: 'I am being abused at home',
        expectedResource: 'domestic-violence-resources'
      },
      {
        message: 'I am addicted and want to quit',
        expectedResource: 'addiction-resources'
      },
      {
        message: 'I am having thoughts of self-harm',
        expectedResource: 'self-harm-prevention'
      }
    ];

    for (const scenario of scenarios) {
      await crisisChatPage.sendCrisisMessage(scenario.message);
      
      // Verify contextually appropriate resources are provided
      await expect(crisisChatPage.page.locator(`[data-testid="${scenario.expectedResource}"]`))
        .toBeVisible({ timeout: 5000 });
    }
  });

  test('should track crisis intervention effectiveness', async () => {
    // Send crisis message
    await crisisChatPage.sendCrisisMessage('I want to hurt myself');
    
    // Interact with crisis resources
    await crisisChatPage.accessEmergencyContacts();
    await crisisChatPage.accessSafetyPlan();
    
    // Verify intervention tracking
    await expect(crisisChatPage.page.locator('[data-testid="intervention-logged"]'))
      .toBeVisible();
  });

  test('should ensure crisis response accessibility', async ({ page }) => {
    // Test with screen reader simulation
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Send crisis message
    await crisisChatPage.sendCrisisMessage('I am in crisis');
    
    // Verify ARIA announcements for crisis alerts
    const crisisAlert = crisisChatPage.crisisAlert;
    const ariaLive = await crisisAlert.getAttribute('aria-live');
    expect(ariaLive).toBe('assertive');
    
    // Test keyboard navigation to emergency resources
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify emergency resources are keyboard accessible
    await expect(crisisChatPage.emergencyContactsButton).toBeFocused();
  });

  test('should handle crisis chat during network interruptions', async ({ page }) => {
    // Start crisis chat session
    await crisisChatPage.sendMessage('I am struggling today');
    
    // Simulate network interruption
    await page.context().setOffline(true);
    
    // Try to send crisis message while offline
    await crisisChatPage.sendCrisisMessage('I want to hurt myself');
    
    // Verify offline crisis resources are provided
    await expect(crisisChatPage.page.locator('[data-testid="offline-crisis-support"]'))
      .toBeVisible();
    
    // Restore network
    await page.context().setOffline(false);
    
    // Verify chat session recovery
    await expect(crisisChatPage.messagesContainer).toBeVisible();
  });
});
