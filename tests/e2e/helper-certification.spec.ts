import { test, expect } from '@playwright/test';
import { HelperCertificationPage } from './pages/HelperCertificationPage';

/**
 * Helper Certification Flow E2E Tests
 * Tests helper training and certification workflows
 */
test.describe('Helper Certification Flows', () => {
  let certificationPage: HelperCertificationPage;

  test.beforeEach(async ({ page }) => {
    certificationPage = new HelperCertificationPage(page);
    await certificationPage.navigateToCertification();
  });

  test('should complete full helper certification process', async () => {
    // Complete the entire certification process
    await certificationPage.completeFullCertification();
    
    // Verify certification badge is awarded
    await expect(certificationPage.certificationBadge).toBeVisible();
    
    // Verify helper status is updated
    await certificationPage.testCertificationValidity();
  });

  test('should verify all required training modules are present', async () => {
    // Check that all required training sections exist
    await certificationPage.verifyCertificationRequirements();
  });

  test('should track certification progress accurately', async () => {
    await certificationPage.startCertificationProcess();
    
    // Complete first module
    await certificationPage.completeTrainingModule(1);
    
    // Verify progress is tracked (should be ~16.7% for 1/6 modules)
    const progressText = await certificationPage.progressIndicator.textContent();
    expect(progressText).toContain('16');
    
    // Complete second module
    await certificationPage.completeTrainingModule(2);
    
    // Verify progress update (should be ~33.3% for 2/6 modules)
    const updatedProgress = await certificationPage.progressIndicator.textContent();
    expect(updatedProgress).toContain('33');
  });

  test('should enforce quiz completion for each module', async () => {
    await certificationPage.startCertificationProcess();
    
    // Try to skip to next module without completing quiz
    const nextButton = certificationPage.nextModuleButton;
    
    // Next button should be disabled without quiz completion
    const isDisabled = await nextButton.isDisabled();
    expect(isDisabled).toBe(true);
    
    // Complete the quiz
    await certificationPage.completeModuleQuiz();
    
    // Next button should now be enabled
    const isEnabledAfterQuiz = await nextButton.isDisabled();
    expect(isEnabledAfterQuiz).toBe(false);
  });

  test('should provide appropriate content for crisis response training', async () => {
    await certificationPage.startCertificationProcess();
    
    // Navigate to crisis response module
    await certificationPage.page.locator('[data-testid="module-3"]').click();
    
    // Verify crisis response content is present
    const expectedTopics = [
      'De-escalation techniques',
      'Risk assessment',
      'Safety planning',
      'Emergency protocols',
      'Professional boundaries'
    ];
    
    for (const topic of expectedTopics) {
      await expect(certificationPage.page.locator(`text="${topic}"`)).toBeVisible();
    }
  });

  test('should handle certification expiry and renewal', async () => {
    // Complete certification first
    await certificationPage.completeFullCertification();
    
    // Test certification expiry tracking
    await certificationPage.testRecertificationReminder();
  });

  test('should ensure certified helpers have appropriate access', async () => {
    // Complete certification
    await certificationPage.completeFullCertification();
    
    // Verify helper-specific features are accessible
    await certificationPage.testCertificationValidity();
    
    // Test access to crisis chat features
    await certificationPage.page.goto('/crisis-chat-helper');
    await expect(certificationPage.page.locator('[data-testid="helper-crisis-interface"]'))
      .toBeVisible();
  });

  test('should provide ethics training and verification', async () => {
    await certificationPage.startCertificationProcess();
    
    // Navigate to ethics module
    await certificationPage.page.locator('[data-testid="module-6"]').click();
    
    // Verify ethics content
    const ethicsTopics = [
      'Confidentiality',
      'Professional boundaries',
      'Scope of practice',
      'Mandatory reporting',
      'Self-care'
    ];
    
    for (const topic of ethicsTopics) {
      await expect(certificationPage.page.locator(`text="${topic}"`)).toBeVisible();
    }
    
    // Complete ethics quiz (should be more rigorous)
    await certificationPage.completeModuleQuiz();
    
    // Verify ethics completion is tracked
    await expect(certificationPage.page.locator('[data-testid="ethics-completed"]'))
      .toBeVisible();
  });

  test('should support different learning styles and accessibility needs', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await certificationPage.startCertificationProcess();
    
    // Verify training content is accessible
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Test keyboard navigation through training modules
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify content loads without relying on mouse interactions
    await expect(certificationPage.trainingModules).toBeVisible();
  });

  test('should track and report on helper training effectiveness', async () => {
    await certificationPage.completeFullCertification();
    
    // Navigate to helper dashboard
    await certificationPage.page.goto('/helper-dashboard');
    
    // Verify training metrics are tracked
    await expect(certificationPage.page.locator('[data-testid="training-completion-date"]'))
      .toBeVisible();
    await expect(certificationPage.page.locator('[data-testid="quiz-scores"]'))
      .toBeVisible();
    await expect(certificationPage.page.locator('[data-testid="certification-level"]'))
      .toBeVisible();
  });
});
