import { Page, Locator, expect } from '@playwright/test';

/**
 * Helper Certification Page Object Model
 * Handles helper certification and training flows
 */
export class HelperCertificationPage {
  readonly page: Page;
  readonly startCertificationButton: Locator;
  readonly trainingModules: Locator;
  readonly quizContainer: Locator;
  readonly submitAnswerButton: Locator;
  readonly nextModuleButton: Locator;
  readonly certificationBadge: Locator;
  readonly progressIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startCertificationButton = page.locator('[data-testid="start-certification"]');
    this.trainingModules = page.locator('[data-testid="training-modules"]');
    this.quizContainer = page.locator('[data-testid="quiz-container"]');
    this.submitAnswerButton = page.locator('[data-testid="submit-answer"]');
    this.nextModuleButton = page.locator('[data-testid="next-module"]');
    this.certificationBadge = page.locator('[data-testid="certification-badge"]');
    this.progressIndicator = page.locator('[data-testid="progress-indicator"]');
  }

  async navigateToCertification() {
    await this.page.goto('/helper-training');
    await this.page.waitForLoadState('networkidle');
  }

  async startCertificationProcess() {
    await this.startCertificationButton.click();
    
    // Wait for first training module to load
    await expect(this.trainingModules).toBeVisible({ timeout: 5000 });
  }

  async completeTrainingModule(moduleNumber: number) {
    // Navigate to specific module
    const moduleButton = this.page.locator(`[data-testid="module-${moduleNumber}"]`);
    await moduleButton.click();
    
    // Read module content (simulate reading time)
    await this.page.waitForTimeout(2000);
    
    // Complete module quiz
    await this.completeModuleQuiz();
    
    // Proceed to next module
    if (moduleNumber < 6) { // Assuming 6 modules total
      await this.nextModuleButton.click();
    }
  }

  async completeModuleQuiz() {
    // Wait for quiz to load
    await expect(this.quizContainer).toBeVisible();
    
    // Answer quiz questions (this would be more sophisticated in real implementation)
    const quizQuestions = this.page.locator('[data-testid^="quiz-question-"]');
    const questionCount = await quizQuestions.count();
    
    for (let i = 0; i < questionCount; i++) {
      const question = quizQuestions.nth(i);
      const correctAnswer = question.locator('[data-testid^="correct-answer"]');
      await correctAnswer.click();
    }
    
    // Submit quiz
    await this.submitAnswerButton.click();
    
    // Wait for quiz results
    await this.page.waitForSelector('[data-testid="quiz-results"]', { timeout: 3000 });
  }

  async completeFullCertification() {
    await this.startCertificationProcess();
    
    // Complete all 6 training modules
    const modules = [
      'Crisis Response Fundamentals',
      'Active Listening Techniques',
      'Mental Health Awareness',
      'Crisis De-escalation',
      'Safety Planning',
      'Ethics and Boundaries'
    ];
    
    for (let i = 1; i <= modules.length; i++) {
      await this.completeTrainingModule(i);
      
      // Verify progress
      const expectedProgress = (i / modules.length) * 100;
      const progressText = await this.progressIndicator.textContent();
      expect(progressText).toContain(`${expectedProgress}%`);
    }
    
    // Verify certification completion
    await expect(this.certificationBadge).toBeVisible({ timeout: 10000 });
  }

  async verifyCertificationRequirements() {
    // Check that all required sections are present
    const requiredSections = [
      '[data-testid="peer-support-principles"]',
      '[data-testid="communication-skills"]',
      '[data-testid="crisis-response"]',
      '[data-testid="ethics-training"]',
      '[data-testid="platform-tools"]',
      '[data-testid="special-populations"]'
    ];
    
    for (const selector of requiredSections) {
      await expect(this.page.locator(selector)).toBeVisible();
    }
  }

  async testCertificationValidity() {
    // Verify certification is properly recorded
    await this.page.goto('/helper-dashboard');
    
    // Check for certified helper status
    await expect(this.page.locator('[data-testid="certified-helper-badge"]')).toBeVisible();
    
    // Verify access to helper-only features
    await expect(this.page.locator('[data-testid="crisis-chat-access"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="peer-matching-access"]')).toBeVisible();
  }

  async testRecertificationReminder() {
    // Navigate to certification status
    await this.page.goto('/helper-profile');
    
    // Check for certification expiry information
    const expiryDate = this.page.locator('[data-testid="certification-expiry"]');
    await expect(expiryDate).toBeVisible();
    
    // Verify recertification process is available
    const recertifyButton = this.page.locator('[data-testid="recertify-button"]');
    await expect(recertifyButton).toBeVisible();
  }
}
