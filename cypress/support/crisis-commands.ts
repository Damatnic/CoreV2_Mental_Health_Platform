/// <reference types="cypress" />

/**
 * Crisis-specific Cypress Commands
 * These commands handle crisis intervention testing safely
 * All crisis services are mocked to prevent real emergency calls
 */

// Crisis Detection and Response Commands
Cypress.Commands.add('simulateCrisisInput', (riskLevel: 'low' | 'moderate' | 'high' | 'critical', input: string) => {
  // Ensure crisis services are mocked
  cy.mockCrisisServices()
  
  const riskIndicators = {
    low: ['sad', 'down', 'tired'],
    moderate: ['hopeless', 'depressed', 'alone'],
    high: ['suicidal thoughts', 'want to die', 'no point'],
    critical: ['suicide plan', 'pills', 'tonight', 'going to kill myself']
  }
  
  // Mock AI crisis detection response
  cy.intercept('POST', '/api/ai/analyze-crisis-risk', {
    statusCode: 200,
    body: {
      riskLevel,
      confidence: 0.85,
      indicators: riskIndicators[riskLevel],
      recommendedAction: riskLevel === 'critical' ? 'emergency_services' : 
                        riskLevel === 'high' ? 'immediate_intervention' :
                        riskLevel === 'moderate' ? 'crisis_resources' : 'supportive_resources'
    }
  }).as(`crisisDetection${riskLevel}`)
  
  // Input the crisis text
  cy.get('[data-testid="crisis-input"]').type(input)
  cy.get('[data-testid="analyze-input"]').click()
  
  cy.wait(`@crisisDetection${riskLevel}`)
})

Cypress.Commands.add('test988Integration', () => {
  cy.mockCrisisServices()
  
  // Mock 988 Lifeline API responses
  cy.intercept('POST', '/api/crisis/988-connect', {
    statusCode: 200,
    body: {
      success: true,
      sessionId: 'lifeline-test-session',
      waitTime: 30,
      counselorAvailable: true
    }
  }).as('connect988')
  
  cy.intercept('GET', '/api/crisis/988-status', {
    statusCode: 200,
    body: {
      available: true,
      averageWaitTime: 45,
      language: 'en',
      specialServices: ['youth', 'veterans', 'lgbtq+']
    }
  }).as('988Status')
  
  // Test 988 connection flow
  cy.get('[data-testid="panic-button"]').click()
  cy.get('[data-testid="988-button"]').click()
  
  cy.wait('@connect988')
  
  // Verify connection interface
  cy.get('[data-testid="988-connecting"]').should('be.visible')
  cy.get('[data-testid="wait-time-display"]').should('contain', '30')
  
  // Simulate successful connection
  cy.window().then(win => {
    win.postMessage({
      type: '988_CONNECTED',
      sessionId: 'lifeline-test-session'
    }, '*')
  })
  
  cy.get('[data-testid="988-connected"]').should('be.visible')
})

Cypress.Commands.add('testEmergencyEscalation', () => {
  cy.mockCrisisServices()
  
  // Mock critical risk scenario
  cy.simulateCrisisInput('critical', 'I have a gun and I\'m going to use it tonight')
  
  // Should automatically escalate to emergency services
  cy.get('[data-testid="emergency-escalation"]').should('be.visible')
  cy.get('[data-testid="911-auto-suggest"]').should('be.visible')
  cy.get('[data-testid="crisis-counselor-alert"]').should('be.visible')
  
  // Mock emergency services notification
  cy.intercept('POST', '/api/crisis/emergency-notification', {
    statusCode: 200,
    body: {
      success: true,
      incidentNumber: 'EMRG-TEST-123',
      responseTime: '8-12 minutes',
      contacted: ['911', 'crisis-team']
    }
  }).as('emergencyNotification')
  
  cy.get('[data-testid="call-911-now"]').click()
  cy.wait('@emergencyNotification')
  
  cy.get('[data-testid="emergency-response-confirmed"]').should('be.visible')
  cy.get('[data-testid="incident-number"]').should('contain', 'EMRG-TEST-123')
})

Cypress.Commands.add('testSafetyPlanActivation', () => {
  // Mock existing safety plan
  cy.intercept('GET', '/api/user/safety-plan', {
    statusCode: 200,
    body: {
      id: 'safety-plan-123',
      warningSignsL: [
        'Feeling hopeless',
        'Withdrawing from friends and family',
        'Having trouble sleeping'
      ],
      copingStrategies: [
        'Practice deep breathing for 5 minutes',
        'Call my best friend',
        'Go for a walk outside',
        'Listen to calming music'
      ],
      supportContacts: [
        {
          name: 'Best Friend',
          phone: '555-123-4567',
          relationship: 'friend',
          available: '9am-11pm'
        },
        {
          name: 'Mom',
          phone: '555-987-6543',
          relationship: 'family',
          available: 'anytime'
        }
      ],
      professionalContacts: [
        {
          name: 'Dr. Sarah Smith',
          phone: '555-555-5555',
          type: 'therapist',
          emergency: '555-555-0911'
        }
      ],
      safeEnvironment: [
        'Remove or secure potential means of self-harm',
        'Stay in public spaces when possible',
        'Avoid alcohol and drugs'
      ]
    }
  }).as('getSafetyPlan')
  
  // Trigger safety plan activation
  cy.get('[data-testid="activate-safety-plan"]').click()
  cy.wait('@getSafetyPlan')
  
  // Verify safety plan display
  cy.get('[data-testid="safety-plan-modal"]').should('be.visible')
  cy.get('[data-testid="warning-signs"]').should('contain', 'Feeling hopeless')
  cy.get('[data-testid="coping-strategies"]').should('contain', 'deep breathing')
  cy.get('[data-testid="support-contacts"]').should('contain', 'Best Friend')
  
  // Test quick contact functionality
  cy.get('[data-testid="quick-call-best-friend"]').click()
  
  // Mock contact notification
  cy.intercept('POST', '/api/crisis/contact-support', {
    statusCode: 200,
    body: { success: true, contactNotified: true }
  }).as('contactSupport')
  
  cy.wait('@contactSupport')
  cy.get('[data-testid="support-contacted"]').should('be.visible')
})

Cypress.Commands.add('testCrisisTextLine', () => {
  cy.mockCrisisServices()
  
  // Mock crisis text line connection
  cy.intercept('POST', '/api/crisis/text-connect', {
    statusCode: 200,
    body: {
      success: true,
      textNumber: '741741',
      keyword: 'HOME',
      estimatedWaitTime: '5 minutes',
      instructions: 'Text HOME to 741741 to connect with a crisis counselor'
    }
  }).as('connectCrisisText')
  
  cy.get('[data-testid="panic-button"]').click()
  cy.get('[data-testid="crisis-text-button"]').click()
  
  cy.wait('@connectCrisisText')
  
  // Verify text instructions
  cy.get('[data-testid="text-instructions"]').should('contain', 'Text HOME to 741741')
  cy.get('[data-testid="text-number"]').should('contain', '741741')
  cy.get('[data-testid="text-wait-time"]').should('contain', '5 minutes')
})

Cypress.Commands.add('testCrisisResourceLibrary', () => {
  // Mock crisis resources
  cy.intercept('GET', '/api/crisis/resources', {
    statusCode: 200,
    body: {
      resources: [
        {
          id: 'suicide-prevention',
          title: '988 Suicide & Crisis Lifeline',
          phone: '988',
          available: '24/7',
          languages: ['English', 'Spanish'],
          specialServices: ['Deaf/Hard of Hearing', 'Veterans', 'LGBTQ+']
        },
        {
          id: 'crisis-text',
          title: 'Crisis Text Line',
          text: '741741',
          keyword: 'HOME',
          available: '24/7'
        },
        {
          id: 'local-emergency',
          title: 'Emergency Services',
          phone: '911',
          description: 'For immediate medical emergencies'
        }
      ],
      selfCareResources: [
        {
          id: 'breathing-exercises',
          title: 'Breathing Exercises',
          description: '5-minute guided breathing to reduce anxiety',
          type: 'interactive'
        },
        {
          id: 'grounding-techniques',
          title: '5-4-3-2-1 Grounding',
          description: 'Sensory grounding technique',
          type: 'guided'
        }
      ]
    }
  }).as('getCrisisResources')
  
  cy.get('[data-testid="crisis-resources"]').click()
  cy.wait('@getCrisisResources')
  
  // Verify resources display
  cy.get('[data-testid="resource-988"]').should('be.visible')
  cy.get('[data-testid="resource-988"]').should('contain', '988')
  cy.get('[data-testid="resource-crisis-text"]').should('contain', '741741')
  
  // Test self-care resources
  cy.get('[data-testid="self-care-resources"]').should('be.visible')
  cy.get('[data-testid="breathing-exercises"]').click()
  cy.get('[data-testid="breathing-exercise-player"]').should('be.visible')
})

Cypress.Commands.add('testCrisisAnalytics', () => {
  // Mock crisis analytics for admin users
  cy.intercept('GET', '/api/admin/crisis-analytics', {
    statusCode: 200,
    body: {
      totalInterventions: 145,
      thisMonth: 23,
      riskLevels: {
        low: 45,
        moderate: 67,
        high: 28,
        critical: 5
      },
      outcomes: {
        resolved: 128,
        escalated: 12,
        ongoing: 5
      },
      responseTime: {
        average: 45, // seconds
        target: 30
      }
    }
  }).as('getCrisisAnalytics')
  
  cy.loginAsAdmin()
  cy.visit('/admin/crisis-analytics')
  cy.wait('@getCrisisAnalytics')
  
  // Verify analytics display
  cy.get('[data-testid="total-interventions"]').should('contain', '145')
  cy.get('[data-testid="monthly-interventions"]').should('contain', '23')
  cy.get('[data-testid="response-time-average"]').should('contain', '45')
  
  // Test crisis trend analysis
  cy.get('[data-testid="crisis-trends-chart"]').should('be.visible')
  cy.get('[data-testid="risk-level-distribution"]').should('be.visible')
})

Cypress.Commands.add('verifyNoCrisisDataLeakage', () => {
  // Verify that sensitive crisis data is not leaked in client storage
  cy.window().then(win => {
    const localStorage = win.localStorage
    const sessionStorage = win.sessionStorage
    
    // Check localStorage
    Object.keys(localStorage).forEach(key => {
      const value = localStorage.getItem(key)
      if (value) {
        // Crisis data should not contain sensitive personal information
        expect(value).to.not.include('suicidal')
        expect(value).to.not.include('self-harm')
        expect(value).to.not.include('911')
        expect(value).to.not.match(/\d{3}-\d{3}-\d{4}/) // Phone numbers
      }
    })
    
    // Check sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      const value = sessionStorage.getItem(key)
      if (value) {
        expect(value).to.not.include('crisis-content')
        expect(value).to.not.include('emergency-details')
      }
    })
  })
})

Cypress.Commands.add('testCrisisCompliance', () => {
  // Test HIPAA compliance for crisis data
  cy.intercept('POST', '/api/crisis/**', (req) => {
    // Verify encryption headers
    expect(req.headers).to.have.property('x-encryption-key')
    expect(req.headers).to.have.property('authorization')
    
    // Verify request is over HTTPS
    expect(req.url).to.match(/^https:\/\//)
    
    // Check for required audit fields
    if (req.body) {
      expect(req.body).to.have.property('sessionId')
      expect(req.body).to.have.property('timestamp')
    }
  }).as('crisisApiCall')
  
  // Trigger a crisis interaction
  cy.simulateCrisisInput('moderate', 'I am feeling very depressed')
  
  // Verify compliance logging
  cy.get('[data-testid="privacy-notice"]').should('be.visible')
  cy.get('[data-testid="data-handling-notice"]').should('contain', 'securely encrypted')
})

// Declare the crisis-specific commands in the Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      simulateCrisisInput(riskLevel: 'low' | 'moderate' | 'high' | 'critical', input: string): Chainable<Element>
      test988Integration(): Chainable<Element>
      testEmergencyEscalation(): Chainable<Element>
      testSafetyPlanActivation(): Chainable<Element>
      testCrisisTextLine(): Chainable<Element>
      testCrisisResourceLibrary(): Chainable<Element>
      testCrisisAnalytics(): Chainable<Element>
      verifyNoCrisisDataLeakage(): Chainable<Element>
      testCrisisCompliance(): Chainable<Element>
    }
  }
}