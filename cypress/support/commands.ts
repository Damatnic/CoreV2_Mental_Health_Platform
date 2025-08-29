/// <reference types="cypress" />

// ***********************************************
// This file contains custom commands for Cypress
// ***********************************************

import 'cypress-axe'

// Authentication Commands
Cypress.Commands.add('loginAsUser', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('testUserEmail')
  const testPassword = password || Cypress.env('testUserPassword')
  
  cy.visit('/auth')
  cy.get('[data-testid="email-input"]').type(testEmail)
  cy.get('[data-testid="password-input"]').type(testPassword)
  cy.get('[data-testid="login-button"]').click()
  
  // Wait for login to complete
  cy.url().should('include', '/dashboard')
  cy.get('[data-testid="user-menu"]').should('be.visible')
})

Cypress.Commands.add('loginAsHelper', () => {
  cy.loginAsUser('helper@mentalhealthapp.test', 'HelperPassword123!')
  cy.url().should('include', '/helper-dashboard')
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.loginAsUser('admin@mentalhealthapp.test', 'AdminPassword123!')
  cy.url().should('include', '/admin-dashboard')
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/auth')
})

// Crisis-related Commands
Cypress.Commands.add('triggerCrisisAlert', () => {
  // Mock crisis detection to avoid real emergency services contact
  cy.window().then((win) => {
    win.__MOCK_CRISIS_SERVICES__ = true
  })
  
  cy.get('[data-testid="panic-button"]').click()
  cy.get('[data-testid="crisis-menu"]').should('be.visible')
  cy.get('[data-testid="988-button"]').should('be.visible')
})

Cypress.Commands.add('mockCrisisServices', () => {
  cy.window().then((win) => {
    // Mock 988 service
    win.__MOCK_988_SERVICE__ = {
      connect: () => Promise.resolve({ sessionId: 'mock-988-session' }),
      status: 'available'
    }
    
    // Mock emergency services
    win.__MOCK_EMERGENCY_SERVICES__ = {
      call911: () => Promise.resolve({ incidentNumber: 'mock-911-incident' })
    }
    
    // Mock crisis text line
    win.__MOCK_CRISIS_TEXT__ = {
      connect: () => Promise.resolve({ connected: true })
    }
  })
})

Cypress.Commands.add('createSafetyPlan', () => {
  cy.visit('/safety-plan')
  
  // Fill out safety plan form
  cy.get('[data-testid="warning-signs-input"]')
    .type('Feeling hopeless, withdrawing from friends, having trouble sleeping')
  
  cy.get('[data-testid="coping-strategies-input"]')
    .type('Deep breathing, listening to music, going for a walk')
  
  cy.get('[data-testid="support-contacts"]').within(() => {
    cy.get('[data-testid="contact-name"]').type('Best Friend')
    cy.get('[data-testid="contact-phone"]').type('555-123-4567')
    cy.get('[data-testid="add-contact"]').click()
  })
  
  cy.get('[data-testid="professional-contacts"]').within(() => {
    cy.get('[data-testid="therapist-name"]').type('Dr. Smith')
    cy.get('[data-testid="therapist-phone"]').type('555-987-6543')
  })
  
  cy.get('[data-testid="save-safety-plan"]').click()
  cy.get('[data-testid="success-message"]').should('contain', 'Safety plan saved')
})

// Mood Tracking Commands
Cypress.Commands.add('addMoodEntry', (mood: string, score: number, notes?: string) => {
  cy.visit('/mood-tracker')
  cy.get('[data-testid="track-mood-button"]').click()
  
  // Select mood
  cy.get(`[data-testid="mood-${mood}"]`).click()
  
  // Set score if different from mood default
  if (score) {
    cy.get('[data-testid="mood-score-slider"]').then($slider => {
      const slider = $slider[0] as HTMLInputElement
      slider.value = score.toString()
      slider.dispatchEvent(new Event('input'))
    })
  }
  
  // Add notes if provided
  if (notes) {
    cy.get('[data-testid="mood-notes"]').type(notes)
  }
  
  cy.get('[data-testid="save-mood"]').click()
  cy.get('[data-testid="mood-saved-confirmation"]').should('be.visible')
})

Cypress.Commands.add('viewMoodHistory', () => {
  cy.visit('/mood-tracker')
  cy.get('[data-testid="view-history"]').click()
  cy.get('[data-testid="mood-history-list"]').should('be.visible')
})

// Form Helper Commands
Cypress.Commands.add('fillRegistrationForm', (userData) => {
  cy.get('[data-testid="registration-form"]').within(() => {
    cy.get('[data-testid="email-input"]').type(userData.email)
    cy.get('[data-testid="password-input"]').type(userData.password)
    cy.get('[data-testid="confirm-password-input"]').type(userData.password)
    cy.get('[data-testid="username-input"]').type(userData.username)
    cy.get('[data-testid="terms-checkbox"]').check()
    cy.get('[data-testid="privacy-checkbox"]').check()
    
    if (userData.emergencyContact) {
      cy.get('[data-testid="emergency-contact-name"]').type(userData.emergencyContact.name)
      cy.get('[data-testid="emergency-contact-phone"]').type(userData.emergencyContact.phone)
    }
  })
})

// Navigation Helpers
Cypress.Commands.add('navigateToPage', (page: string) => {
  const routes: { [key: string]: string } = {
    'dashboard': '/dashboard',
    'mood-tracker': '/mood-tracker',
    'journal': '/journal',
    'crisis-resources': '/crisis-resources',
    'safety-plan': '/safety-plan',
    'therapy': '/therapy',
    'community': '/community',
    'settings': '/settings'
  }
  
  if (routes[page]) {
    cy.visit(routes[page])
  } else {
    cy.visit(`/${page}`)
  }
  
  cy.waitForPageLoad()
})

Cypress.Commands.add('waitForPageLoad', () => {
  // Wait for React to finish loading
  cy.get('[data-testid="app-loaded"]').should('exist')
  
  // Wait for any loading spinners to disappear
  cy.get('[data-testid="loading-spinner"]').should('not.exist')
  
  // Wait for critical content to be visible
  cy.get('main').should('be.visible')
})

// Performance Commands
Cypress.Commands.add('measurePerformance', () => {
  cy.window().then((win) => {
    // Measure page load performance
    const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: win.performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: win.performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    }
    
    // Log performance metrics
    cy.task('log', `Performance Metrics: ${JSON.stringify(metrics, null, 2)}`)
    
    // Assert performance thresholds
    expect(metrics.domContentLoaded).to.be.lessThan(3000) // 3 seconds
    expect(metrics.firstContentfulPaint).to.be.lessThan(2000) // 2 seconds
  })
})

// Contact Form Helper
Cypress.Commands.add('submitContactForm', (formData) => {
  cy.get('[data-testid="contact-form"]').within(() => {
    cy.get('[data-testid="name-input"]').type(formData.name)
    cy.get('[data-testid="email-input"]').type(formData.email)
    cy.get('[data-testid="subject-input"]').type(formData.subject)
    cy.get('[data-testid="message-input"]').type(formData.message)
    
    if (formData.urgent) {
      cy.get('[data-testid="urgent-checkbox"]').check()
    }
    
    cy.get('[data-testid="submit-button"]').click()
  })
})

// Accessibility assertion override for mental health context
Cypress.Commands.overwrite('checkA11y', (originalFn, context, options) => {
  const mentalHealthA11yOptions = {
    ...options,
    rules: {
      // Color contrast is critical for mental health apps
      'color-contrast': { enabled: true },
      // Focus management is essential for crisis situations
      'focus-order-semantics': { enabled: true },
      // Keyboard navigation must work for accessibility
      'keyboard': { enabled: true },
      // Screen reader support is crucial
      'label': { enabled: true },
      // Skip certain rules that may conflict with crisis UI
      'region': { enabled: false }, // Crisis buttons may not need regions
      ...options?.rules
    },
    includedImpacts: ['moderate', 'serious', 'critical'],
    ...options
  }
  
  return originalFn(context, mentalHealthA11yOptions)
})

// Error handling for crisis scenarios
Cypress.Commands.add('handleCrisisScenario', (scenario: string) => {
  cy.mockCrisisServices()
  
  switch (scenario) {
    case 'high-risk':
      cy.get('[data-testid="mood-tracker"]').click()
      cy.addMoodEntry('depressed', 1, 'Feeling hopeless and alone')
      break
      
    case 'panic-attack':
      cy.get('[data-testid="panic-button"]').click()
      cy.get('[data-testid="breathing-exercise"]').should('be.visible')
      break
      
    case 'crisis-chat':
      cy.get('[data-testid="crisis-chat"]').click()
      cy.get('[data-testid="chat-input"]').type('I need help right now')
      cy.get('[data-testid="send-message"]').click()
      break
  }
})