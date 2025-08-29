import { Page, Locator, expect } from '@playwright/test';

/**
 * Crisis Chat Page Object Model
 * Handles crisis chat interactions and emergency escalation flows
 */
export class CrisisChatPage {
  readonly page: Page;
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly messagesContainer: Locator;
  readonly emergencyButton: Locator;
  readonly crisisAlert: Locator;
  readonly emergencyContactsButton: Locator;
  readonly callLifelineButton: Locator;
  readonly safetyPlanButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatInput = page.locator('[data-testid="chat-input"]');
    this.sendButton = page.locator('[data-testid="send-button"]');
    this.messagesContainer = page.locator('[data-testid="messages-container"]');
    this.emergencyButton = page.locator('[data-testid="emergency-button"]');
    this.crisisAlert = page.locator('[data-testid="crisis-alert"]');
    this.emergencyContactsButton = page.locator('[data-testid="emergency-contacts-button"]');
    this.callLifelineButton = page.locator('[data-testid="call-lifeline-button"]');
    this.safetyPlanButton = page.locator('[data-testid="safety-plan-button"]');
  }

  async navigateToChat() {
    await this.page.goto('/chat');
    await this.page.waitForLoadState('networkidle');
  }

  async sendMessage(message: string) {
    await this.chatInput.fill(message);
    await this.sendButton.click();
    
    // Wait for message to appear in chat
    await this.page.waitForSelector(`text="${message}"`, { timeout: 5000 });
  }

  async sendCrisisMessage(message: string) {
    await this.sendMessage(message);
    
    // Wait for crisis detection to trigger
    await this.page.waitForTimeout(2000);
    
    // Check if crisis alert appears
    const alertVisible = await this.crisisAlert.isVisible();
    return alertVisible;
  }

  async clickEmergencyButton() {
    await this.emergencyButton.click();
    
    // Wait for emergency response UI
    await this.page.waitForSelector('[data-testid="emergency-response"]', { timeout: 3000 });
  }

  async accessEmergencyContacts() {
    await this.emergencyContactsButton.click();
    
    // Verify emergency contacts are displayed
    await expect(this.page.locator('[data-testid="emergency-contacts-list"]')).toBeVisible();
  }

  async callLifeline() {
    await this.callLifelineButton.click();
    
    // Check if lifeline call is initiated (988 number)
    const lifelineNumber = this.page.locator('text="988"');
    await expect(lifelineNumber).toBeVisible();
  }

  async accessSafetyPlan() {
    await this.safetyPlanButton.click();
    
    // Wait for safety plan to load
    await this.page.waitForSelector('[data-testid="safety-plan"]', { timeout: 5000 });
  }

  async verifyCrisisDetection() {
    // Test various crisis keywords
    const crisisKeywords = [
      'I want to end my life',
      'I am going to hurt myself',
      'I have a plan to kill myself',
      'I feel suicidal',
      'I want to die'
    ];

    for (const keyword of crisisKeywords) {
      const alertTriggered = await this.sendCrisisMessage(keyword);
      if (!alertTriggered) {
        throw new Error(`Crisis detection failed for: "${keyword}"`);
      }
    }
  }

  async testEmergencyEscalation() {
    // Simulate severe crisis scenario
    await this.sendCrisisMessage('I am going to hurt myself right now');
    
    // Verify immediate emergency response
    await expect(this.crisisAlert).toBeVisible({ timeout: 1000 });
    await expect(this.emergencyButton).toBeVisible();
    await expect(this.callLifelineButton).toBeVisible();
    
    // Test emergency button functionality
    await this.clickEmergencyButton();
    
    // Verify emergency escalation UI
    await expect(this.page.locator('[data-testid="emergency-escalation"]')).toBeVisible();
  }

  async verifyOfflineSupport() {
    // Simulate network interruption
    await this.page.context().setOffline(true);
    
    // Verify offline crisis resources are available
    await this.page.goto('/crisis-offline');
    await expect(this.page.locator('[data-testid="offline-crisis-resources"]')).toBeVisible();
    
    // Restore network
    await this.page.context().setOffline(false);
  }
}
