import { Page, Locator, expect } from '@playwright/test';

/**
 * Emergency Escalation Page Object Model
 * Handles emergency escalation workflows and crisis intervention
 */
export class EmergencyEscalationPage {
  readonly page: Page;
  readonly emergencyButton: Locator;
  readonly crisisHotlineButton: Locator;
  readonly emergencyServicesButton: Locator;
  readonly emergencyContactsModal: Locator;
  readonly lifelineButton: Locator;
  readonly crisisTextButton: Locator;
  readonly localEmergencyButton: Locator;
  readonly escalationConfirmation: Locator;
  readonly helpRequestForm: Locator;
  readonly urgencyLevel: Locator;
  readonly locationSharing: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emergencyButton = page.locator('[data-testid="emergency-button"]');
    this.crisisHotlineButton = page.locator('[data-testid="crisis-hotline"]');
    this.emergencyServicesButton = page.locator('[data-testid="emergency-services"]');
    this.emergencyContactsModal = page.locator('[data-testid="emergency-contacts-modal"]');
    this.lifelineButton = page.locator('[data-testid="lifeline-988"]');
    this.crisisTextButton = page.locator('[data-testid="crisis-text-741741"]');
    this.localEmergencyButton = page.locator('[data-testid="local-emergency"]');
    this.escalationConfirmation = page.locator('[data-testid="escalation-confirmation"]');
    this.helpRequestForm = page.locator('[data-testid="help-request-form"]');
    this.urgencyLevel = page.locator('[data-testid="urgency-level"]');
    this.locationSharing = page.locator('[data-testid="location-sharing"]');
  }

  async triggerEmergencyEscalation() {
    // Click the emergency button (should be prominently available)
    await this.emergencyButton.click();
    
    // Wait for emergency contacts modal to appear
    await expect(this.emergencyContactsModal).toBeVisible({ timeout: 2000 });
  }

  async testCrisisHotlineAccess() {
    await this.triggerEmergencyEscalation();
    
    // Test 988 Lifeline access
    await this.lifelineButton.click();
    
    // Verify lifeline connection (mock in test environment)
    await expect(this.escalationConfirmation).toBeVisible();
    await expect(this.page.locator('text="988"')).toBeVisible();
  }

  async testCrisisTextAccess() {
    await this.triggerEmergencyEscalation();
    
    // Test Crisis Text Line access
    await this.crisisTextButton.click();
    
    // Verify text service connection
    await expect(this.escalationConfirmation).toBeVisible();
    await expect(this.page.locator('text="741741"')).toBeVisible();
  }

  async testEmergencyServicesEscalation() {
    await this.triggerEmergencyEscalation();
    
    // Click emergency services (911)
    await this.emergencyServicesButton.click();
    
    // Verify emergency services confirmation
    await expect(this.page.locator('[data-testid="emergency-services-warning"]')).toBeVisible();
    
    // Confirm emergency services call
    const confirmButton = this.page.locator('[data-testid="confirm-emergency-call"]');
    await confirmButton.click();
    
    // Verify escalation is processed
    await expect(this.escalationConfirmation).toBeVisible();
  }

  async testLocationSharingForEmergency() {
    await this.triggerEmergencyEscalation();
    
    // Test location sharing for emergency services
    const shareLocationButton = this.page.locator('[data-testid="share-location"]');
    await shareLocationButton.click();
    
    // Verify location permission request
    await expect(this.locationSharing).toBeVisible();
    
    // Accept location sharing (mocked)
    const allowLocationButton = this.page.locator('[data-testid="allow-location"]');
    await allowLocationButton.click();
    
    // Verify location is shared
    await expect(this.page.locator('[data-testid="location-shared"]')).toBeVisible();
  }

  async testUrgencyLevelEscalation() {
    // Test different urgency levels trigger appropriate responses
    const urgencyLevels = [
      { level: 'low', description: 'Feeling down' },
      { level: 'medium', description: 'Having suicidal thoughts' },
      { level: 'high', description: 'Planning to hurt myself' },
      { level: 'critical', description: 'About to hurt myself right now' }
    ];

    for (const urgency of urgencyLevels) {
      // Navigate to crisis assessment
      await this.page.goto('/crisis-assessment');
      
      // Select urgency level
      await this.page.locator(`[data-testid="urgency-${urgency.level}"]`).click();
      
      // Fill description
      await this.page.locator('[data-testid="crisis-description"]').fill(urgency.description);
      
      // Submit assessment
      await this.page.locator('[data-testid="submit-assessment"]').click();
      
      // Verify appropriate escalation response
      if (urgency.level === 'critical') {
        // Should immediately show emergency options
        await expect(this.emergencyContactsModal).toBeVisible({ timeout: 1000 });
        await expect(this.emergencyServicesButton).toBeVisible();
      } else if (urgency.level === 'high') {
        // Should show crisis resources and hotlines
        await expect(this.crisisHotlineButton).toBeVisible();
        await expect(this.lifelineButton).toBeVisible();
      }
    }
  }

  async testEscalationResponseTimes() {
    // Test that emergency escalation happens within acceptable timeframes
    const startTime = Date.now();
    
    await this.triggerEmergencyEscalation();
    
    const escalationTime = Date.now() - startTime;
    
    // Emergency escalation should be near-instantaneous (< 500ms)
    expect(escalationTime).toBeLessThan(500);
    
    // Verify all emergency options are immediately available
    await expect(this.lifelineButton).toBeVisible();
    await expect(this.crisisTextButton).toBeVisible();
    await expect(this.emergencyServicesButton).toBeVisible();
  }

  async testOfflineEmergencyAccess() {
    // Go offline
    await this.page.context().setOffline(true);
    
    // Try to access emergency resources
    await this.page.goto('/emergency');
    
    // Verify offline emergency resources are available
    await expect(this.page.locator('[data-testid="offline-emergency-resources"]')).toBeVisible();
    
    // Verify critical numbers are displayed
    await expect(this.page.locator('text="988"')).toBeVisible();
    await expect(this.page.locator('text="911"')).toBeVisible();
    await expect(this.page.locator('text="741741"')).toBeVisible();
    
    // Restore online status
    await this.page.context().setOffline(false);
  }

  async testEmergencyContactCascade() {
    // Test that if primary contact fails, backup contacts are tried
    await this.triggerEmergencyEscalation();
    
    // Try primary emergency contact
    const primaryContact = this.page.locator('[data-testid="primary-emergency-contact"]');
    await primaryContact.click();
    
    // Simulate primary contact failure
    await this.page.locator('[data-testid="contact-failed"]').click();
    
    // Verify backup contact is automatically suggested
    await expect(this.page.locator('[data-testid="backup-contact-suggestion"]')).toBeVisible();
    
    // Verify multiple contact options are available
    await expect(this.page.locator('[data-testid="contact-cascade-options"]')).toBeVisible();
  }

  async testEmergencyAccessibility() {
    // Test emergency features work with screen readers
    await this.page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Verify emergency button has proper ARIA labels
    const emergencyButtonAriaLabel = await this.emergencyButton.getAttribute('aria-label');
    expect(emergencyButtonAriaLabel).toContain('Emergency');
    
    // Test keyboard navigation to emergency features
    await this.page.keyboard.press('Tab'); // Should focus emergency button
    await this.page.keyboard.press('Enter'); // Should activate emergency
    
    // Verify emergency modal is keyboard accessible
    await expect(this.emergencyContactsModal).toBeVisible();
    
    // Test keyboard navigation within emergency modal
    await this.page.keyboard.press('Tab'); // Should focus first emergency option
    await this.page.keyboard.press('Enter'); // Should activate first option
  }
}
