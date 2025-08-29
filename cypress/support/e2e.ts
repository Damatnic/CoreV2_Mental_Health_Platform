// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Import custom commands for mental health app
import './mental-health-commands'
import './crisis-commands'

// Global configuration for mental health app testing
beforeEach(() => {
  // Clear application state before each test
  cy.clearLocalStorage()
  cy.clearCookies()
  
  // Set up test environment
  cy.window().then((win) => {
    win.sessionStorage.clear()
    
    // Mock external services for testing
    win.__CYPRESS_TEST_MODE__ = true
    
    // Mock 988 crisis line for safety during testing
    win.__MOCK_CRISIS_SERVICES__ = true
  })
})

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on certain expected errors
  if (
    err.message.includes('ResizeObserver loop limit exceeded') ||
    err.message.includes('Non-Error promise rejection captured') ||
    err.message.includes('Loading CSS chunk') ||
    err.message.includes('Network request failed')
  ) {
    return false
  }
  
  // Don't fail tests on crisis service mock errors
  if (err.message.includes('MOCK_CRISIS') || err.message.includes('TEST_MODE')) {
    return false
  }
  
  return true
})

// Custom configuration for accessibility testing
before(() => {
  cy.injectAxe()
})

// Performance monitoring setup
beforeEach(() => {
  // Start performance monitoring
  cy.window().then((win) => {
    win.performance.mark('test-start')
  })
})

afterEach(() => {
  // End performance monitoring
  cy.window().then((win) => {
    win.performance.mark('test-end')
    win.performance.measure('test-duration', 'test-start', 'test-end')
  })
  
  // Check for accessibility violations
  cy.checkA11y(null, {
    includedImpacts: ['moderate', 'serious', 'critical']
  })
})

// Mental health app specific global setup
declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication commands
      loginAsUser(email?: string, password?: string): Chainable<Element>
      loginAsHelper(): Chainable<Element>
      loginAsAdmin(): Chainable<Element>
      logout(): Chainable<Element>
      
      // Crisis-related commands
      triggerCrisisAlert(): Chainable<Element>
      mockCrisisServices(): Chainable<Element>
      createSafetyPlan(): Chainable<Element>
      
      // Mood tracking commands
      addMoodEntry(mood: string, score: number, notes?: string): Chainable<Element>
      viewMoodHistory(): Chainable<Element>
      
      // Accessibility commands
      checkA11y(context?: any, options?: any): Chainable<Element>
      injectAxe(): Chainable<Element>
      
      // Performance commands
      measurePerformance(): Chainable<Element>
      
      // Form helpers
      fillRegistrationForm(userData: any): Chainable<Element>
      submitContactForm(formData: any): Chainable<Element>
      
      // Navigation helpers
      navigateToPage(page: string): Chainable<Element>
      waitForPageLoad(): Chainable<Element>
    }
  }
}

// Set up test data
cy.fixture('users').then((users) => {
  Cypress.env('testUsers', users)
})

cy.fixture('crisis-scenarios').then((scenarios) => {
  Cypress.env('crisisScenarios', scenarios)
})