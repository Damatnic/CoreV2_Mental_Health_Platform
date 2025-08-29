import { test, expect } from '@playwright/test';
import { SafetyPlanPage } from './pages/SafetyPlanPage';

/**
 * Safety Plan Creation E2E Tests
 * Tests safety plan creation, editing, and emergency access workflows
 */
test.describe('Safety Plan Creation Flows', () => {
  let safetyPlanPage: SafetyPlanPage;

  test.beforeEach(async ({ page }) => {
    safetyPlanPage = new SafetyPlanPage(page);
    await safetyPlanPage.navigateToSafetyPlan();
  });

  test('should create a comprehensive safety plan', async () => {
    // Create a complete safety plan with all sections
    await safetyPlanPage.completeFullSafetyPlan();
    
    // Verify all sections are saved
    const expectedSections = [
      'warning signs',
      'coping strategies', 
      'support contacts',
      'professional contacts',
      'environment safety',
      'reasons to live'
    ];
    
    for (const section of expectedSections) {
      await expect(safetyPlanPage.page.locator(`[data-testid="${section}-section"]`))
        .toBeVisible();
    }
  });

  test('should allow editing of existing safety plan', async () => {
    // First create a safety plan
    await safetyPlanPage.completeFullSafetyPlan();
    
    // Then edit it
    await safetyPlanPage.editExistingSafetyPlan();
    
    // Verify changes were saved
    await expect(safetyPlanPage.page.locator('text="Helping others through difficult times"'))
      .toBeVisible();
  });

  test('should ensure safety plan data privacy and encryption', async () => {
    // Create safety plan with sensitive data
    await safetyPlanPage.completeFullSafetyPlan();
    
    // Test that data is encrypted in local storage
    await safetyPlanPage.testSafetyPlanPrivacy();
  });

  test('should provide quick access to safety plan during crisis', async () => {
    // Create safety plan first
    await safetyPlanPage.completeFullSafetyPlan();
    
    // Test quick access during crisis scenario
    await safetyPlanPage.testQuickAccessToSafetyPlan();
  });

  test('should support sharing safety plan with trusted contacts', async () => {
    // Create safety plan
    await safetyPlanPage.completeFullSafetyPlan();
    
    // Test sharing functionality
    await safetyPlanPage.testSafetyPlanSharing();
  });

  test('should work offline for emergency access', async () => {
    // Create safety plan while online
    await safetyPlanPage.completeFullSafetyPlan();
    
    // Test offline access
    await safetyPlanPage.testOfflineSafetyPlanAccess();
  });

  test('should validate required sections before saving', async () => {
    await safetyPlanPage.createNewSafetyPlan();
    
    // Try to save without filling required sections
    await safetyPlanPage.savePlanButton.click();
    
    // Verify validation messages appear
    await expect(safetyPlanPage.page.locator('[data-testid="validation-error"]'))
      .toBeVisible();
    
    // Fill minimum required sections
    await safetyPlanPage.fillSafetyPlanSection('professionalContacts', [
      '988 Suicide & Crisis Lifeline'
    ]);
    
    await safetyPlanPage.fillSafetyPlanSection('reasonsToLive', [
      'My family needs me'
    ]);
    
    // Should now be able to save
    await safetyPlanPage.savePlanButton.click();
    await expect(safetyPlanPage.planPreview).toBeVisible();
  });

  test('should provide guided safety plan creation for first-time users', async () => {
    // Test guided experience for new users
    await safetyPlanPage.createNewSafetyPlan();
    
    // Verify step-by-step guidance is provided
    await expect(safetyPlanPage.page.locator('[data-testid="safety-plan-guide"]'))
      .toBeVisible();
    
    // Check for helpful prompts and examples
    await expect(safetyPlanPage.page.locator('[data-testid="example-warning-signs"]'))
      .toBeVisible();
    await expect(safetyPlanPage.page.locator('[data-testid="example-coping-strategies"]'))
      .toBeVisible();
  });

  test('should integrate with crisis detection system', async () => {
    // Create safety plan
    await safetyPlanPage.completeFullSafetyPlan();
    
    // Navigate to chat and trigger crisis detection
    await safetyPlanPage.page.goto('/chat');
    await safetyPlanPage.page.locator('[data-testid="chat-input"]')
      .fill('I am having thoughts of self-harm');
    await safetyPlanPage.page.locator('[data-testid="send-button"]').click();
    
    // Verify safety plan is automatically suggested
    await expect(safetyPlanPage.page.locator('[data-testid="safety-plan-suggestion"]'))
      .toBeVisible({ timeout: 3000 });
  });

  test('should support multiple safety plans for different situations', async () => {
    // Create primary safety plan
    await safetyPlanPage.completeFullSafetyPlan();
    
    // Create additional safety plan for different context (e.g., work stress)
    await safetyPlanPage.page.locator('[data-testid="create-additional-plan"]').click();
    
    await safetyPlanPage.fillSafetyPlanSection('warningSigns', [
      'Work deadline pressure',
      'Conflict with colleagues',
      'Overwhelming workload'
    ]);
    
    await safetyPlanPage.fillSafetyPlanSection('copingStrategies', [
      'Take a break',
      'Talk to supervisor',
      'Use breathing exercises'
    ]);
    
    await safetyPlanPage.savePlanButton.click();
    
    // Verify multiple plans are managed
    await expect(safetyPlanPage.page.locator('[data-testid="safety-plan-list"]'))
      .toBeVisible();
  });

  test('should ensure accessibility for users with disabilities', async ({ page }) => {
    // Test with screen reader simulation
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await safetyPlanPage.createNewSafetyPlan();
    
    // Verify form labels and ARIA attributes
    const warningSignsLabel = await safetyPlanPage.warningSignsInput.getAttribute('aria-label');
    expect(warningSignsLabel).toContain('warning signs');
    
    // Test keyboard navigation through form
    await page.keyboard.press('Tab');
    await page.keyboard.type('Feeling overwhelmed');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Deep breathing');
    
    // Verify form can be completed using only keyboard
    await page.keyboard.press('Tab'); // Navigate to save button
    await page.keyboard.press('Enter'); // Save plan
  });

  test('should handle safety plan updates during active crisis', async () => {
    // Create initial safety plan
    await safetyPlanPage.completeFullSafetyPlan();
    
    // Simulate crisis state in application
    await safetyPlanPage.page.evaluate(() => {
      localStorage.setItem('crisisState', 'active');
    });
    
    // Try to edit safety plan during crisis
    await safetyPlanPage.editPlanButton.click();
    
    // Verify crisis-aware editing interface
    await expect(safetyPlanPage.page.locator('[data-testid="crisis-aware-editing"]'))
      .toBeVisible();
    
    // Verify critical sections are highlighted
    await expect(safetyPlanPage.page.locator('[data-testid="highlighted-emergency-contacts"]'))
      .toBeVisible();
  });
});
