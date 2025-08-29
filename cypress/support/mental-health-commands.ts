/// <reference types="cypress" />

/**
 * Mental Health App Specific Cypress Commands
 * These commands are designed specifically for testing mental health app functionality
 * while ensuring safety and ethical testing practices.
 */

// Crisis Support Commands
Cypress.Commands.add('testCrisisFlow', (riskLevel: 'low' | 'moderate' | 'high' | 'critical') => {
  // Mock crisis services to prevent real emergency calls during testing
  cy.mockCrisisServices()
  
  const scenarios = {
    low: {
      message: 'I\'m feeling a bit down today',
      expectedResponse: 'supportive-resources'
    },
    moderate: {
      message: 'I\'ve been feeling really depressed and hopeless lately',
      expectedResponse: 'crisis-resources'
    },
    high: {
      message: 'I don\'t want to live anymore and I have a plan',
      expectedResponse: 'immediate-intervention'
    },
    critical: {
      message: 'I have pills and I\'m going to take them all tonight',
      expectedResponse: 'emergency-services'
    }
  }
  
  const scenario = scenarios[riskLevel]
  
  // Enter crisis scenario
  cy.get('[data-testid="crisis-chat"]').click()
  cy.get('[data-testid="chat-input"]').type(scenario.message)
  cy.get('[data-testid="send-message"]').click()
  
  // Verify appropriate response
  cy.get(`[data-testid="${scenario.expectedResponse}"]`).should('be.visible')
  
  if (riskLevel === 'high' || riskLevel === 'critical') {
    cy.get('[data-testid="988-connection"]').should('be.visible')
    cy.get('[data-testid="safety-plan-activation"]').should('be.visible')
  }
})

// Therapy Session Commands
Cypress.Commands.add('startTherapySession', (sessionType: 'individual' | 'group' | 'crisis') => {
  cy.visit('/therapy')
  
  switch (sessionType) {
    case 'individual':
      cy.get('[data-testid="book-individual-session"]').click()
      break
    case 'group':
      cy.get('[data-testid="join-group-session"]').click()
      break
    case 'crisis':
      cy.get('[data-testid="emergency-session"]').click()
      break
  }
  
  cy.get('[data-testid="session-room"]').should('be.visible')
  cy.get('[data-testid="video-call-interface"]').should('exist')
})

// Wellness Check Commands
Cypress.Commands.add('performWellnessCheck', () => {
  cy.visit('/wellness-check')
  
  // Answer wellness questions
  cy.get('[data-testid="mood-rating"]').click()
  cy.get('[data-rating="6"]').click() // Moderate mood
  
  cy.get('[data-testid="sleep-quality"]').click()
  cy.get('[data-rating="7"]').click()
  
  cy.get('[data-testid="anxiety-level"]').click()
  cy.get('[data-rating="4"]').click()
  
  cy.get('[data-testid="social-connection"]').click()
  cy.get('[data-rating="5"]').click()
  
  cy.get('[data-testid="submit-wellness-check"]').click()
  
  // Verify results and recommendations
  cy.get('[data-testid="wellness-results"]').should('be.visible')
  cy.get('[data-testid="personalized-recommendations"]').should('exist')
})

// Journal Entry Commands
Cypress.Commands.add('createJournalEntry', (entryData: {
  title: string
  content: string
  mood?: string
  private?: boolean
  triggers?: string[]
}) => {
  cy.visit('/journal')
  cy.get('[data-testid="new-entry"]').click()
  
  cy.get('[data-testid="entry-title"]').type(entryData.title)
  cy.get('[data-testid="entry-content"]').type(entryData.content)
  
  if (entryData.mood) {
    cy.get('[data-testid="entry-mood"]').select(entryData.mood)
  }
  
  if (entryData.private) {
    cy.get('[data-testid="private-entry"]').check()
  }
  
  if (entryData.triggers) {
    entryData.triggers.forEach(trigger => {
      cy.get('[data-testid="triggers-input"]').type(`${trigger}{enter}`)
    })
  }
  
  cy.get('[data-testid="save-entry"]').click()
  cy.get('[data-testid="entry-saved"]').should('contain', 'Entry saved')
})

// Community Features Commands
Cypress.Commands.add('joinSupportGroup', (groupName: string) => {
  cy.visit('/community')
  cy.get(`[data-testid="group-${groupName}"]`).click()
  cy.get('[data-testid="join-group"]').click()
  
  // Verify group guidelines are shown
  cy.get('[data-testid="group-guidelines"]').should('be.visible')
  cy.get('[data-testid="accept-guidelines"]').click()
  
  // Verify successful join
  cy.get('[data-testid="group-chat"]').should('be.visible')
  cy.get('[data-testid="member-list"]').should('contain', 'You')
})

Cypress.Commands.add('reportContent', (contentType: 'post' | 'comment', reason: string) => {
  cy.get('[data-testid="report-button"]').click()
  cy.get('[data-testid="report-modal"]').should('be.visible')
  
  cy.get(`[data-testid="reason-${reason}"]`).check()
  cy.get('[data-testid="additional-details"]').type('This content violates community guidelines')
  
  cy.get('[data-testid="submit-report"]').click()
  cy.get('[data-testid="report-confirmation"]').should('contain', 'Report submitted')
})

// Helper/Professional Commands
Cypress.Commands.add('acceptHelperApplication', () => {
  cy.loginAsAdmin()
  cy.visit('/admin/applications')
  
  cy.get('[data-testid="pending-applications"]').should('exist')
  cy.get('[data-testid="application-item"]').first().within(() => {
    cy.get('[data-testid="review-application"]').click()
  })
  
  // Review application details
  cy.get('[data-testid="credentials-verification"]').should('be.visible')
  cy.get('[data-testid="background-check"]').should('contain', 'Passed')
  
  cy.get('[data-testid="approve-application"]').click()
  cy.get('[data-testid="approval-confirmation"]').should('be.visible')
})

// Data Privacy Commands
Cypress.Commands.add('testDataExport', () => {
  cy.visit('/settings/privacy')
  cy.get('[data-testid="export-data"]').click()
  
  // Verify data export request
  cy.get('[data-testid="export-confirmation"]').should('contain', 'export request has been submitted')
  
  // Mock data export completion
  cy.window().then(win => {
    win.postMessage({
      type: 'DATA_EXPORT_READY',
      downloadUrl: '/api/data-export/user123.json'
    }, '*')
  })
  
  cy.get('[data-testid="download-data"]').should('be.visible')
})

Cypress.Commands.add('testDataDeletion', () => {
  cy.visit('/settings/privacy')
  cy.get('[data-testid="delete-account"]').click()
  
  // Confirm deletion with safety checks
  cy.get('[data-testid="deletion-warning"]').should('contain', 'This action cannot be undone')
  cy.get('[data-testid="confirm-deletion"]').type('DELETE MY ACCOUNT')
  cy.get('[data-testid="final-delete-button"]').click()
  
  // Verify account deletion
  cy.get('[data-testid="deletion-success"]').should('be.visible')
  cy.url().should('include', '/goodbye')
})

// Accessibility Testing for Mental Health Context
Cypress.Commands.add('testCrisisAccessibility', () => {
  // Test keyboard navigation in crisis situations
  cy.get('[data-testid="panic-button"]').focus()
  cy.focused().type('{enter}')
  
  // Verify crisis menu is keyboard accessible
  cy.get('[data-testid="988-button"]').should('be.focused')
  cy.focused().type('{tab}')
  cy.get('[data-testid="crisis-text"]').should('be.focused')
  
  // Test screen reader announcements
  cy.get('[data-testid="crisis-alert"]').should('have.attr', 'role', 'alert')
  cy.get('[data-testid="crisis-alert"]').should('have.attr', 'aria-live', 'assertive')
})

Cypress.Commands.add('testMobileAccessibility', () => {
  cy.viewport('iphone-x')
  
  // Test touch targets
  cy.get('[data-testid="panic-button"]').should('have.css', 'min-width', '44px')
  cy.get('[data-testid="panic-button"]').should('have.css', 'min-height', '44px')
  
  // Test mobile crisis flow
  cy.get('[data-testid="panic-button"]').click()
  cy.get('[data-testid="mobile-crisis-menu"]').should('be.visible')
  
  // Test swipe gestures (if implemented)
  cy.get('[data-testid="crisis-resources"]')
    .trigger('touchstart', { which: 1, pageX: 100, pageY: 100 })
    .trigger('touchmove', { which: 1, pageX: 200, pageY: 100 })
    .trigger('touchend')
})

// Performance Testing for Critical Features
Cypress.Commands.add('testCrisisResponseTime', () => {
  cy.window().then(win => {
    win.performance.mark('crisis-start')
  })
  
  cy.get('[data-testid="panic-button"]').click()
  
  cy.get('[data-testid="crisis-menu"]').should('be.visible').then(() => {
    cy.window().then(win => {
      win.performance.mark('crisis-end')
      win.performance.measure('crisis-response', 'crisis-start', 'crisis-end')
      
      const measure = win.performance.getEntriesByName('crisis-response')[0]
      expect(measure.duration).to.be.lessThan(1000) // Crisis UI should load within 1 second
    })
  })
})

// Security Testing
Cypress.Commands.add('testSessionSecurity', () => {
  // Test session timeout
  cy.loginAsUser()
  
  // Mock expired session
  cy.window().then(win => {
    win.localStorage.setItem('sessionExpiry', (Date.now() - 1000).toString())
  })
  
  cy.reload()
  cy.url().should('include', '/auth')
  cy.get('[data-testid="session-expired"]').should('be.visible')
})

Cypress.Commands.add('testCSRFProtection', () => {
  cy.request({
    method: 'POST',
    url: '/api/mood-entries',
    body: { mood: 'happy', score: 8 },
    failOnStatusCode: false
  }).then(response => {
    expect(response.status).to.eq(403) // Should reject without CSRF token
  })
})

// Error Handling Commands
Cypress.Commands.add('testOfflineMode', () => {
  // Simulate offline condition
  cy.window().then(win => {
    win.navigator.onLine = false
    win.dispatchEvent(new Event('offline'))
  })
  
  // Test offline functionality
  cy.get('[data-testid="offline-indicator"]').should('be.visible')
  
  // Try to create mood entry offline
  cy.addMoodEntry('neutral', 5, 'Offline entry')
  cy.get('[data-testid="offline-queue"]').should('contain', '1 item pending sync')
  
  // Simulate coming back online
  cy.window().then(win => {
    win.navigator.onLine = true
    win.dispatchEvent(new Event('online'))
  })
  
  // Verify sync
  cy.get('[data-testid="sync-success"]').should('be.visible')
})

// Declare the new commands in the Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      testCrisisFlow(riskLevel: 'low' | 'moderate' | 'high' | 'critical'): Chainable<Element>
      startTherapySession(sessionType: 'individual' | 'group' | 'crisis'): Chainable<Element>
      performWellnessCheck(): Chainable<Element>
      createJournalEntry(entryData: any): Chainable<Element>
      joinSupportGroup(groupName: string): Chainable<Element>
      reportContent(contentType: 'post' | 'comment', reason: string): Chainable<Element>
      acceptHelperApplication(): Chainable<Element>
      testDataExport(): Chainable<Element>
      testDataDeletion(): Chainable<Element>
      testCrisisAccessibility(): Chainable<Element>
      testMobileAccessibility(): Chainable<Element>
      testCrisisResponseTime(): Chainable<Element>
      testSessionSecurity(): Chainable<Element>
      testCSRFProtection(): Chainable<Element>
      testOfflineMode(): Chainable<Element>
      handleCrisisScenario(scenario: string): Chainable<Element>
    }
  }
}