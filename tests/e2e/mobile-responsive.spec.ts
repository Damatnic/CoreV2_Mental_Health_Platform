import { test, expect } from '@playwright/test';

/**
 * Mobile Responsiveness E2E Tests
 * Tests mobile-specific functionality and touch interactions
 */
test.describe('Mobile Responsiveness', () => {
  
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE dimensions
  });

  test('should display mobile-optimized crisis chat interface', async ({ page }) => {
    await page.goto('/chat');
    
    // Verify mobile chat layout
    const chatContainer = page.locator('[data-testid="chat-container"]');
    await expect(chatContainer).toBeVisible();
    
    // Check that chat input is properly positioned at bottom
    const chatInput = page.locator('[data-testid="chat-input"]');
    const inputRect = await chatInput.boundingBox();
    const viewportHeight = page.viewportSize()?.height || 667;
    
    // Input should be near bottom of screen
    expect(inputRect?.y || 0).toBeGreaterThan(viewportHeight * 0.8);
    
    // Verify emergency button is easily accessible on mobile
    const emergencyButton = page.locator('[data-testid="emergency-button"]');
    await expect(emergencyButton).toBeVisible();
    
    const buttonRect = await emergencyButton.boundingBox();
    expect(buttonRect?.width || 0).toBeGreaterThan(44); // Minimum touch target
    expect(buttonRect?.height || 0).toBeGreaterThan(44);
  });

  test('should handle mobile keyboard interactions properly', async ({ page }) => {
    await page.goto('/chat');
    
    // Focus on chat input
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.click();
    
    // Verify virtual keyboard doesn't obscure input
    await chatInput.fill('I need help with my mental health');
    
    // Check that input remains visible and functional
    await expect(chatInput).toBeVisible();
    
    // Test sending message on mobile
    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.tap(); // Use tap instead of click for mobile
    
    // Verify message appears
    await expect(page.locator('text="I need help with my mental health"')).toBeVisible();
  });

  test('should support touch gestures for navigation', async ({ page }) => {
    await page.goto('/community');
    
    // Test swipe gestures on post cards
    const postCard = page.locator('[data-testid="post-card"]').first();
    await expect(postCard).toBeVisible();
    
    // Simulate swipe gesture
    const cardRect = await postCard.boundingBox();
    if (cardRect) {
      // Swipe right to left (for potential actions like reply/support)
      await page.mouse.move(cardRect.x + cardRect.width - 10, cardRect.y + cardRect.height / 2);
      await page.mouse.down();
      await page.mouse.move(cardRect.x + 10, cardRect.y + cardRect.height / 2, { steps: 10 });
      await page.mouse.up();
      
      // Check if swipe action UI appears
      await expect(page.locator('[data-testid="swipe-actions"]')).toBeVisible();
    }
  });

  test('should display mobile-optimized safety plan creation', async ({ page }) => {
    await page.goto('/safety-plan');
    await page.locator('[data-testid="create-safety-plan"]').tap();
    
    // Verify mobile form layout
    const formSections = await page.locator('[data-testid*="section"]').all();
    
    for (const section of formSections) {
      await expect(section).toBeVisible();
      
      // Check that form sections stack vertically on mobile
      const sectionRect = await section.boundingBox();
      expect(sectionRect?.width || 0).toBeGreaterThan(300); // Should use most of screen width
    }
    
    // Test mobile text input
    const warningSignsInput = page.locator('[data-testid="warning-signs-input"]');
    await warningSignsInput.tap();
    await warningSignsInput.fill('Feeling overwhelmed');
    
    // Verify input works properly on mobile
    await expect(warningSignsInput).toHaveValue('Feeling overwhelmed');
  });

  test('should provide mobile-optimized emergency escalation', async ({ page }) => {
    await page.goto('/crisis');
    
    // Test emergency button on mobile
    const emergencyButton = page.locator('[data-testid="emergency-button"]');
    await emergencyButton.tap();
    
    // Verify mobile emergency modal
    const emergencyModal = page.locator('[data-testid="emergency-contacts-modal"]');
    await expect(emergencyModal).toBeVisible();
    
    // Check that emergency options are properly sized for mobile
    const emergencyOptions = await page.locator('[data-testid*="emergency-"]').all();
    
    for (const option of emergencyOptions) {
      const optionRect = await option.boundingBox();
      expect(optionRect?.height || 0).toBeGreaterThan(44); // Minimum touch target
      expect(optionRect?.width || 0).toBeGreaterThan(100); // Reasonable button width
    }
    
    // Test calling emergency services from mobile
    const callButton = page.locator('[data-testid="call-lifeline-button"]');
    await callButton.tap();
    
    // Verify call initiation (would trigger tel: link in real implementation)
    await expect(page.locator('[data-testid="call-initiated"]')).toBeVisible();
  });

  test('should handle mobile orientation changes', async ({ page }) => {
    await page.goto('/chat');
    
    // Test portrait mode first
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Switch to landscape mode
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Verify layout adapts to landscape
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Chat should still be functional in landscape
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.tap();
    await chatInput.fill('Testing landscape mode');
    
    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.tap();
    
    await expect(page.locator('text="Testing landscape mode"')).toBeVisible();
  });

  test('should support pull-to-refresh on mobile feeds', async ({ page }) => {
    await page.goto('/community');
    
    // Simulate pull-to-refresh gesture
    const feedContainer = page.locator('[data-testid="community-feed"]');
    await expect(feedContainer).toBeVisible();
    
    const containerRect = await feedContainer.boundingBox();
    if (containerRect) {
      // Pull down from top
      await page.mouse.move(containerRect.x + containerRect.width / 2, containerRect.y + 10);
      await page.mouse.down();
      await page.mouse.move(containerRect.x + containerRect.width / 2, containerRect.y + 100, { steps: 10 });
      await page.mouse.up();
      
      // Check for refresh indicator
      await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible();
    }
  });

  test('should optimize helper certification for mobile', async ({ page }) => {
    await page.goto('/helper-training');
    
    // Test mobile training interface
    const startButton = page.locator('[data-testid="start-certification"]');
    await startButton.tap();
    
    // Verify training modules are mobile-friendly
    const trainingModule = page.locator('[data-testid="training-modules"]');
    await expect(trainingModule).toBeVisible();
    
    // Check module navigation on mobile
    const nextButton = page.locator('[data-testid="next-module"]');
    const buttonRect = await nextButton.boundingBox();
    expect(buttonRect?.height || 0).toBeGreaterThan(44); // Mobile touch target
    
    // Test quiz interaction on mobile
    const quizQuestion = page.locator('[data-testid^="quiz-question-"]').first();
    await quizQuestion.tap();
    
    // Verify quiz answers are easily selectable on mobile
    const answerOption = page.locator('[data-testid^="answer-option-"]').first();
    const answerRect = await answerOption.boundingBox();
    expect(answerRect?.height || 0).toBeGreaterThan(44);
  });

  test('should provide mobile-optimized navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile hamburger menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(hamburgerButton).toBeVisible();
    await hamburgerButton.tap();
    
    // Verify mobile sidebar opens
    const mobileSidebar = page.locator('[data-testid="mobile-sidebar"]');
    await expect(mobileSidebar).toBeVisible();
    
    // Test navigation links on mobile
    const navLinks = await page.locator('[data-testid="mobile-nav-link"]').all();
    
    for (const link of navLinks) {
      const linkRect = await link.boundingBox();
      expect(linkRect?.height || 0).toBeGreaterThan(44); // Mobile touch target
    }
    
    // Test closing mobile menu
    const overlay = page.locator('[data-testid="mobile-menu-overlay"]');
    await overlay.tap();
    await expect(mobileSidebar).not.toBeVisible();
  });

  test('should handle mobile-specific crisis scenarios', async ({ page }) => {
    await page.goto('/crisis-assessment');
    
    // Test mobile crisis assessment form
    const urgencyHigh = page.locator('[data-testid="urgency-high"]');
    await urgencyHigh.tap();
    
    // Fill crisis description using mobile keyboard
    const descriptionField = page.locator('[data-testid="crisis-description"]');
    await descriptionField.tap();
    await descriptionField.fill('I am having thoughts of self-harm and need immediate help');
    
    // Submit assessment
    const submitButton = page.locator('[data-testid="submit-assessment"]');
    await submitButton.tap();
    
    // Verify mobile emergency response interface
    await expect(page.locator('[data-testid="mobile-emergency-response"]')).toBeVisible();
    
    // Test mobile emergency contact calling
    const callLifeline = page.locator('[data-testid="mobile-call-lifeline"]');
    await callLifeline.tap();
    
    // Verify call interface (tel: link would open native dialer)
    await expect(page.locator('[data-testid="call-confirmation"]')).toBeVisible();
  });

  test('should support mobile accessibility features', async ({ page }) => {
    // Test with larger text size (accessibility setting)
    await page.addInitScript(() => {
      document.documentElement.style.fontSize = '20px';
    });
    
    await page.goto('/chat');
    
    // Verify interface remains usable with larger text
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();
    
    const emergencyButton = page.locator('[data-testid="emergency-button"]');
    await expect(emergencyButton).toBeVisible();
    
    // Test voice-over support (simulated)
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Verify elements have proper mobile accessibility attributes
    const ariaLabel = await emergencyButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });
});
