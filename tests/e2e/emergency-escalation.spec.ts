import { test, expect } from '@playwright/test';
import { EmergencyEscalationPage } from './pages/EmergencyEscalationPage';

/**
 * Emergency Escalation E2E Tests
 * Tests emergency escalation workflows and crisis intervention
 */
test.describe('Emergency Escalation Flows', () => {
  let emergencyPage: EmergencyEscalationPage;

  test.beforeEach(async ({ page }) => {
    emergencyPage = new EmergencyEscalationPage(page);
  });

  test('should provide immediate access to 988 crisis lifeline', async () => {
    // Test crisis hotline access
    await emergencyPage.testCrisisHotlineAccess();
    
    // Verify 988 number is displayed and accessible
    await expect(emergencyPage.page.locator('text="988"')).toBeVisible();
  });

  test('should enable crisis text line access (741741)', async () => {
    // Test crisis text access
    await emergencyPage.testCrisisTextAccess();
    
    // Verify text line number is accessible
    await expect(emergencyPage.page.locator('text="741741"')).toBeVisible();
  });

  test('should handle emergency services escalation (911)', async () => {
    // Test emergency services escalation
    await emergencyPage.testEmergencyServicesEscalation();
    
    // Verify proper warning and confirmation flow
    await expect(emergencyPage.escalationConfirmation).toBeVisible();
  });

  test('should escalate based on urgency level assessment', async () => {
    // Test different urgency levels trigger appropriate responses
    await emergencyPage.testUrgencyLevelEscalation();
  });

  test('should respond to emergencies within acceptable timeframes', async () => {
    // Test emergency response times
    await emergencyPage.testEscalationResponseTimes();
  });

  test('should provide offline emergency access', async () => {
    // Test offline emergency resources
    await emergencyPage.testOfflineEmergencyAccess();
  });

  test('should implement emergency contact cascade system', async () => {
    // Test backup contact system when primary fails
    await emergencyPage.testEmergencyContactCascade();
  });

  test('should support location sharing for emergency services', async () => {
    // Test location sharing functionality
    await emergencyPage.testLocationSharingForEmergency();
  });

  test('should ensure emergency features are accessible', async () => {
    // Test accessibility compliance for emergency features
    await emergencyPage.testEmergencyAccessibility();
  });

  test('should handle simultaneous emergency requests', async ({ page }) => {
    // Simulate multiple users triggering emergency at same time
    const emergencyPages = await Promise.all([
      new EmergencyEscalationPage(page),
      new EmergencyEscalationPage(await page.context().newPage()),
      new EmergencyEscalationPage(await page.context().newPage())
    ]);

    // Trigger emergency escalation on all pages simultaneously
    await Promise.all(
      emergencyPages.map(ep => ep.triggerEmergencyEscalation())
    );

    // Verify all emergency escalations are handled
    for (const ep of emergencyPages) {
      await expect(ep.emergencyContactsModal).toBeVisible();
    }
  });

  test('should maintain emergency state across page navigation', async ({ page }) => {
    // Trigger emergency
    await emergencyPage.triggerEmergencyEscalation();
    
    // Navigate to different page
    await page.goto('/safety-plan');
    
    // Verify emergency state is maintained
    await expect(page.locator('[data-testid="emergency-state-indicator"]'))
      .toBeVisible();
    
    // Verify quick access to emergency resources is still available
    await expect(page.locator('[data-testid="emergency-quick-access"]'))
      .toBeVisible();
  });

  test('should provide culturally sensitive emergency resources', async ({ page }) => {
    // Test with different language preferences
    await page.goto('/settings');
    await page.locator('[data-testid="language-spanish"]').click();
    
    // Trigger emergency
    await emergencyPage.triggerEmergencyEscalation();
    
    // Verify Spanish emergency resources are provided
    await expect(page.locator('text="Línea Nacional de Prevención del Suicidio"'))
      .toBeVisible();
    
    // Test with different cultural backgrounds
    await page.locator('[data-testid="cultural-resources"]').click();
    await expect(page.locator('[data-testid="culturally-specific-resources"]'))
      .toBeVisible();
  });

  test('should integrate with external emergency services APIs', async ({ page }) => {
    // Mock external API responses
    await page.route('**/api/emergency-services', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'connected',
          serviceAvailable: true,
          estimatedResponse: '5 minutes'
        })
      });
    });

    // Trigger emergency services
    await emergencyPage.testEmergencyServicesEscalation();
    
    // Verify API integration
    await expect(page.locator('[data-testid="emergency-services-status"]'))
      .toBeVisible();
  });

  test('should handle emergency escalation failures gracefully', async ({ page }) => {
    // Mock service failures
    await page.route('**/api/crisis-hotline', async route => {
      await route.fulfill({ status: 500 });
    });

    // Trigger emergency
    await emergencyPage.triggerEmergencyEscalation();
    await emergencyPage.crisisHotlineButton.click();
    
    // Verify fallback options are provided
    await expect(page.locator('[data-testid="fallback-emergency-options"]'))
      .toBeVisible();
    
    // Verify alternative emergency contacts are suggested
    await expect(emergencyPage.emergencyServicesButton).toBeVisible();
    await expect(emergencyPage.crisisTextButton).toBeVisible();
  });

  test('should log and track emergency escalations for analysis', async ({ page }) => {
    // Trigger emergency escalation
    await emergencyPage.triggerEmergencyEscalation();
    await emergencyPage.crisisHotlineButton.click();
    
    // Verify escalation is logged (for platform improvement)
    const loggedEvent = await page.evaluate(() => {
      return localStorage.getItem('emergencyEscalations');
    });
    
    expect(loggedEvent).toBeTruthy();
    
    // Verify no personal data is logged (privacy compliance)
    expect(loggedEvent).not.toContain('personal');
    expect(loggedEvent).not.toContain('name');
    expect(loggedEvent).not.toContain('address');
  });

  test('should support emergency escalation from different entry points', async ({ page }) => {
    const entryPoints = [
      '/chat',
      '/safety-plan',
      '/community',
      '/helper-dashboard',
      '/crisis-assessment'
    ];

    for (const entryPoint of entryPoints) {
      await page.goto(entryPoint);
      
      // Verify emergency button is always accessible
      await expect(page.locator('[data-testid="emergency-button"]'))
        .toBeVisible();
      
      // Test emergency escalation from this entry point
      await page.locator('[data-testid="emergency-button"]').click();
      await expect(emergencyPage.emergencyContactsModal).toBeVisible();
      
      // Close modal for next iteration
      await page.locator('[data-testid="close-emergency-modal"]').click();
    }
  });
});
