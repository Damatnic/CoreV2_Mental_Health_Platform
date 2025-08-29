import { Page, Locator, expect } from '@playwright/test';

/**
 * Safety Plan Page Object Model
 * Handles safety plan creation and management flows
 */
export class SafetyPlanPage {
  readonly page: Page;
  readonly createPlanButton: Locator;
  readonly warningSignsInput: Locator;
  readonly copingStrategiesInput: Locator;
  readonly supportContactsInput: Locator;
  readonly professionalContactsInput: Locator;
  readonly environmentSafetyInput: Locator;
  readonly reasonsToLiveInput: Locator;
  readonly savePlanButton: Locator;
  readonly planPreview: Locator;
  readonly editPlanButton: Locator;
  readonly deletePlanButton: Locator;
  readonly sharePlanButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createPlanButton = page.locator('[data-testid="create-safety-plan"]');
    this.warningSignsInput = page.locator('[data-testid="warning-signs-input"]');
    this.copingStrategiesInput = page.locator('[data-testid="coping-strategies-input"]');
    this.supportContactsInput = page.locator('[data-testid="support-contacts-input"]');
    this.professionalContactsInput = page.locator('[data-testid="professional-contacts-input"]');
    this.environmentSafetyInput = page.locator('[data-testid="environment-safety-input"]');
    this.reasonsToLiveInput = page.locator('[data-testid="reasons-to-live-input"]');
    this.savePlanButton = page.locator('[data-testid="save-plan"]');
    this.planPreview = page.locator('[data-testid="plan-preview"]');
    this.editPlanButton = page.locator('[data-testid="edit-plan"]');
    this.deletePlanButton = page.locator('[data-testid="delete-plan"]');
    this.sharePlanButton = page.locator('[data-testid="share-plan"]');
  }

  async navigateToSafetyPlan() {
    await this.page.goto('/safety-plan');
    await this.page.waitForLoadState('networkidle');
  }

  async createNewSafetyPlan() {
    await this.createPlanButton.click();
    
    // Wait for safety plan form to load
    await expect(this.warningSignsInput).toBeVisible({ timeout: 5000 });
  }

  async fillSafetyPlanSection(section: string, content: string[]) {
    let inputField: Locator;
    
    switch (section) {
      case 'warningSigns':
        inputField = this.warningSignsInput;
        break;
      case 'copingStrategies':
        inputField = this.copingStrategiesInput;
        break;
      case 'supportContacts':
        inputField = this.supportContactsInput;
        break;
      case 'professionalContacts':
        inputField = this.professionalContactsInput;
        break;
      case 'environmentSafety':
        inputField = this.environmentSafetyInput;
        break;
      case 'reasonsToLive':
        inputField = this.reasonsToLiveInput;
        break;
      default:
        throw new Error(`Unknown safety plan section: ${section}`);
    }
    
    // Clear existing content
    await inputField.clear();
    
    // Add each item in the content array
    for (const item of content) {
      await inputField.fill(item);
      await this.page.keyboard.press('Enter');
    }
  }

  async completeFullSafetyPlan() {
    await this.createNewSafetyPlan();
    
    // Fill all sections of the safety plan
    await this.fillSafetyPlanSection('warningSigns', [
      'Feeling overwhelmed',
      'Social isolation',
      'Sleep disturbances',
      'Increased anxiety'
    ]);
    
    await this.fillSafetyPlanSection('copingStrategies', [
      'Deep breathing exercises',
      'Go for a walk',
      'Listen to calming music',
      'Practice mindfulness'
    ]);
    
    await this.fillSafetyPlanSection('supportContacts', [
      'Best friend - 555-0123',
      'Sister - 555-0456',
      'Therapist - 555-0789'
    ]);
    
    await this.fillSafetyPlanSection('professionalContacts', [
      '988 Suicide & Crisis Lifeline',
      'Crisis Text Line - Text HOME to 741741',
      'Local Crisis Center - 555-HELP'
    ]);
    
    await this.fillSafetyPlanSection('environmentSafety', [
      'Remove harmful objects',
      'Ask someone to stay with me',
      'Go to a safe location',
      'Avoid substance use'
    ]);
    
    await this.fillSafetyPlanSection('reasonsToLive', [
      'My family and friends',
      'My pet needs me',
      'Future goals and dreams',
      'Making a positive impact'
    ]);
    
    // Save the safety plan
    await this.savePlanButton.click();
    
    // Verify plan was saved successfully
    await expect(this.planPreview).toBeVisible({ timeout: 5000 });
  }

  async editExistingSafetyPlan() {
    // Navigate to existing plan
    await this.navigateToSafetyPlan();
    
    // Click edit button
    await this.editPlanButton.click();
    
    // Make changes to the plan
    await this.fillSafetyPlanSection('reasonsToLive', [
      'My family and friends',
      'My pet needs me',
      'Future goals and dreams',
      'Making a positive impact',
      'Helping others through difficult times' // New addition
    ]);
    
    // Save changes
    await this.savePlanButton.click();
    
    // Verify changes were saved
    await expect(this.page.locator('text="Helping others through difficult times"')).toBeVisible();
  }

  async testSafetyPlanPrivacy() {
    // Verify safety plan data is encrypted locally
    const localStorage = await this.page.evaluate(() => {
      return localStorage.getItem('safetyPlan');
    });
    
    // Safety plan should be encrypted (not plain text)
    expect(localStorage).not.toContain('My family and friends');
    expect(localStorage).not.toContain('555-0123');
  }

  async testQuickAccessToSafetyPlan() {
    // Test accessing safety plan during crisis
    await this.page.goto('/chat');
    
    // Trigger crisis detection
    await this.page.locator('[data-testid="chat-input"]').fill('I am in crisis');
    await this.page.locator('[data-testid="send-button"]').click();
    
    // Wait for crisis alert
    await this.page.waitForSelector('[data-testid="crisis-alert"]', { timeout: 3000 });
    
    // Verify quick access to safety plan
    const safetyPlanLink = this.page.locator('[data-testid="quick-safety-plan"]');
    await expect(safetyPlanLink).toBeVisible();
    
    // Click and verify it opens safety plan
    await safetyPlanLink.click();
    await expect(this.planPreview).toBeVisible();
  }

  async testSafetyPlanSharing() {
    await this.navigateToSafetyPlan();
    
    // Test sharing functionality
    await this.sharePlanButton.click();
    
    // Verify share options are available
    await expect(this.page.locator('[data-testid="share-options"]')).toBeVisible();
    
    // Test sharing with trusted contact
    const shareWithContact = this.page.locator('[data-testid="share-with-contact"]');
    await shareWithContact.click();
    
    // Verify sharing confirmation
    await expect(this.page.locator('[data-testid="sharing-confirmation"]')).toBeVisible();
  }

  async testOfflineSafetyPlanAccess() {
    // Go offline
    await this.page.context().setOffline(true);
    
    // Try to access safety plan
    await this.navigateToSafetyPlan();
    
    // Verify safety plan is still accessible offline
    await expect(this.planPreview).toBeVisible();
    
    // Restore online status
    await this.page.context().setOffline(false);
  }
}
