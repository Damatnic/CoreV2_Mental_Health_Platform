describe('Crisis Intervention Flow', () => {
  beforeEach(() => {
    cy.loginAsUser()
    cy.mockCrisisServices()
    
    // Ensure crisis detection is enabled for testing
    cy.window().then((win) => {
      win.__CRISIS_DETECTION_ENABLED__ = true
    })
  })

  it('should activate panic button and show crisis resources', () => {
    cy.testCrisisResponseTime() // Performance test for crisis response
    
    cy.get('[data-testid="panic-button"]').should('be.visible')
    cy.get('[data-testid="panic-button"]').click()

    // Verify crisis menu appears immediately
    cy.get('[data-testid="crisis-menu"]').should('be.visible')
    cy.get('[data-testid="988-button"]').should('be.visible')
    cy.get('[data-testid="crisis-text"]').should('be.visible')
    cy.get('[data-testid="emergency-contacts"]').should('be.visible')
    cy.get('[data-testid="safety-plan"]').should('be.visible')

    // Check accessibility for crisis interface
    cy.testCrisisAccessibility()
  })

  it('should connect to 988 Lifeline when requested', () => {
    cy.triggerCrisisAlert()
    
    // Mock 988 connection
    cy.intercept('POST', '/api/crisis/988-connect', {
      statusCode: 200,
      body: {
        success: true,
        connectionId: 'lifeline-session-123',
        estimatedWaitTime: 30,
        status: 'connecting'
      }
    }).as('connect988')

    cy.get('[data-testid="988-button"]').click()
    cy.wait('@connect988')

    // Verify connection interface
    cy.get('[data-testid="988-connection"]').should('be.visible')
    cy.get('[data-testid="wait-time"]').should('contain', '30 seconds')
    cy.get('[data-testid="connection-status"]').should('contain', 'Connecting')
    
    // Mock successful connection
    cy.window().then(win => {
      win.postMessage({
        type: '988_CONNECTED',
        data: { sessionId: 'lifeline-session-123', counselorId: 'counselor-456' }
      }, '*')
    })

    cy.get('[data-testid="988-chat-interface"]').should('be.visible')
    cy.get('[data-testid="counselor-connected"]').should('contain', 'Connected to counselor')
  })

  it('should handle crisis text line connection', () => {
    cy.triggerCrisisAlert()

    // Mock crisis text connection
    cy.intercept('POST', '/api/crisis/text-connect', {
      statusCode: 200,
      body: {
        success: true,
        textNumber: '741741',
        instructions: 'Text HOME to 741741'
      }
    }).as('connectCrisisText')

    cy.get('[data-testid="crisis-text"]').click()
    cy.wait('@connectCrisisText')

    cy.get('[data-testid="text-instructions"]').should('contain', 'Text HOME to 741741')
    cy.get('[data-testid="text-number"]').should('contain', '741741')
    
    // Should offer alternative contact methods if texting isn't available
    cy.get('[data-testid="alternative-contacts"]').should('be.visible')
  })

  it('should display and activate safety plan during crisis', () => {
    cy.triggerCrisisAlert()
    
    cy.get('[data-testid="safety-plan"]').click()
    
    // Mock safety plan retrieval
    cy.intercept('GET', '/api/user/safety-plan', {
      statusCode: 200,
      body: {
        warningSignsL: ['Feeling hopeless', 'Withdrawing from friends'],
        copingStrategies: ['Deep breathing', 'Call a friend', 'Go for a walk'],
        supportContacts: [
          { name: 'Best Friend', phone: '555-123-4567', relationship: 'friend' },
          { name: 'Mom', phone: '555-987-6543', relationship: 'family' }
        ],
        professionalContacts: [
          { name: 'Dr. Smith', phone: '555-555-5555', type: 'therapist' }
        ],
        environmentSafety: 'Remove harmful objects, stay in public spaces'
      }
    }).as('getSafetyPlan')

    cy.wait('@getSafetyPlan')
    
    cy.get('[data-testid="safety-plan-modal"]').should('be.visible')
    cy.get('[data-testid="warning-signs"]').should('contain', 'Feeling hopeless')
    cy.get('[data-testid="coping-strategies"]').should('contain', 'Deep breathing')
    cy.get('[data-testid="support-contacts"]').should('contain', 'Best Friend')
    cy.get('[data-testid="professional-contacts"]').should('contain', 'Dr. Smith')

    // Test quick contact functionality
    cy.get('[data-testid="quick-call-best-friend"]').should('be.visible')
    cy.get('[data-testid="quick-call-therapist"]').should('be.visible')
  })

  it('should escalate to emergency services when critical risk is detected', () => {
    cy.testCrisisFlow('critical')

    // Mock critical risk assessment
    cy.intercept('POST', '/api/crisis/assess-risk', {
      statusCode: 200,
      body: {
        riskLevel: 'critical',
        indicators: ['suicidal ideation', 'immediate plan', 'access to means'],
        recommendation: 'emergency_services',
        emergencyAlert: true
      }
    }).as('assessCriticalRisk')

    // Simulate high-risk input
    cy.get('[data-testid="crisis-chat"]').click()
    cy.get('[data-testid="chat-input"]').type('I have pills and I\'m going to take them all tonight')
    cy.get('[data-testid="send-message"]').click()

    cy.wait('@assessCriticalRisk')

    // Should automatically show emergency escalation
    cy.get('[data-testid="emergency-escalation"]').should('be.visible')
    cy.get('[data-testid="emergency-warning"]').should('contain', 'immediate help')
    cy.get('[data-testid="call-911-button"]').should('be.visible')
    cy.get('[data-testid="crisis-counselor-connect"]').should('be.visible')

    // Should also notify emergency contacts if enabled
    cy.get('[data-testid="emergency-contacts-notified"]').should('be.visible')
  })

  it('should handle different crisis risk levels appropriately', () => {
    const riskLevels = ['low', 'moderate', 'high', 'critical'] as const

    riskLevels.forEach(riskLevel => {
      cy.testCrisisFlow(riskLevel)
      
      switch (riskLevel) {
        case 'low':
          cy.get('[data-testid="supportive-resources"]').should('be.visible')
          cy.get('[data-testid="self-care-suggestions"]').should('be.visible')
          break
        case 'moderate':
          cy.get('[data-testid="crisis-resources"]').should('be.visible')
          cy.get('[data-testid="therapist-contact"]').should('be.visible')
          break
        case 'high':
          cy.get('[data-testid="immediate-intervention"]').should('be.visible')
          cy.get('[data-testid="988-connection"]').should('be.visible')
          cy.get('[data-testid="safety-plan-activation"]').should('be.visible')
          break
        case 'critical':
          cy.get('[data-testid="emergency-services"]').should('be.visible')
          cy.get('[data-testid="call-911-button"]').should('be.visible')
          break
      }
      
      // Reset for next test
      cy.reload()
    })
  })

  it('should provide breathing exercises during panic attacks', () => {
    cy.handleCrisisScenario('panic-attack')

    cy.get('[data-testid="breathing-exercise"]').should('be.visible')
    cy.get('[data-testid="breathing-instructions"]').should('contain', 'breathe in for 4 seconds')

    // Test interactive breathing guide
    cy.get('[data-testid="start-breathing"]').click()
    cy.get('[data-testid="breathing-timer"]').should('be.visible')
    cy.get('[data-testid="inhale-phase"]').should('be.visible')

    // Wait for breath cycle
    cy.wait(4000)
    cy.get('[data-testid="exhale-phase"]').should('be.visible')

    // Should show progress and calming measures
    cy.get('[data-testid="breathing-progress"]').should('exist')
    cy.get('[data-testid="heart-rate-indicator"]').should('exist')
  })

  it('should connect to emergency contacts during crisis', () => {
    cy.triggerCrisisAlert()

    // Mock emergency contacts
    cy.intercept('GET', '/api/user/emergency-contacts', {
      statusCode: 200,
      body: {
        contacts: [
          {
            id: 'contact1',
            name: 'Emergency Contact',
            phone: '555-123-4567',
            relationship: 'spouse',
            priority: 1,
            notificationPrefs: ['call', 'text']
          },
          {
            id: 'contact2',
            name: 'Backup Contact',
            phone: '555-987-6543',
            relationship: 'parent',
            priority: 2,
            notificationPrefs: ['text']
          }
        ]
      }
    }).as('getEmergencyContacts')

    cy.get('[data-testid="emergency-contacts"]').click()
    cy.wait('@getEmergencyContacts')

    cy.get('[data-testid="emergency-contacts-list"]').should('be.visible')
    cy.get('[data-testid="contact-emergency-contact"]').should('contain', 'Emergency Contact')
    
    // Test quick call functionality
    cy.intercept('POST', '/api/crisis/notify-contact', {
      statusCode: 200,
      body: { success: true, notificationSent: true }
    }).as('notifyContact')

    cy.get('[data-testid="call-emergency-contact"]').click()
    cy.wait('@notifyContact')

    cy.get('[data-testid="contact-notification-sent"]').should('contain', 'Emergency contact has been notified')
  })

  it('should maintain crisis session state across page reloads', () => {
    cy.triggerCrisisAlert()
    cy.get('[data-testid="988-button"]').click()

    // Mock active crisis session
    cy.window().then(win => {
      win.localStorage.setItem('activeCrisisSession', JSON.stringify({
        sessionId: 'crisis-123',
        startTime: Date.now(),
        type: '988-lifeline',
        status: 'active'
      }))
    })

    cy.reload()

    // Should restore crisis session
    cy.get('[data-testid="active-crisis-session"]').should('be.visible')
    cy.get('[data-testid="session-timer"]').should('be.visible')
    cy.get('[data-testid="crisis-menu"]').should('be.visible')
  })

  it('should handle crisis detection in mood entries', () => {
    cy.visit('/mood-tracker')
    
    // Mock crisis detection in mood entry
    cy.intercept('POST', '/api/mood-entries', (req) => {
      if (req.body.notes?.includes('want to die')) {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            crisisDetected: true,
            riskLevel: 'high',
            entryId: 'mood-entry-123'
          }
        })
      }
    }).as('createMoodEntryWithCrisis')

    cy.get('[data-testid="track-mood-button"]').click()
    cy.get('[data-testid="mood-depressed"]').click()
    cy.get('[data-testid="mood-notes"]').type('I don\'t want to live anymore, I just want to die')
    cy.get('[data-testid="save-mood"]').click()

    cy.wait('@createMoodEntryWithCrisis')

    // Should immediately show crisis intervention
    cy.get('[data-testid="crisis-intervention-modal"]').should('be.visible')
    cy.get('[data-testid="crisis-detected-message"]').should('contain', 'detected concerning language')
    cy.get('[data-testid="immediate-resources"]').should('be.visible')
  })

  it('should provide offline crisis resources', () => {
    // Simulate offline condition
    cy.testOfflineMode()

    cy.get('[data-testid="panic-button"]').click()

    // Should show offline crisis resources
    cy.get('[data-testid="offline-crisis-resources"]').should('be.visible')
    cy.get('[data-testid="call-988-directly"]').should('contain', 'Call 988')
    cy.get('[data-testid="call-911-directly"]').should('contain', 'Call 911')
    cy.get('[data-testid="offline-safety-plan"]').should('be.visible')
    cy.get('[data-testid="cached-breathing-exercises"]').should('be.visible')
  })

  it('should track crisis intervention metrics', () => {
    cy.window().then(win => {
      win.performance.mark('crisis-intervention-start')
    })

    cy.triggerCrisisAlert()
    cy.get('[data-testid="988-button"]').click()

    // Mock successful intervention
    cy.intercept('POST', '/api/crisis/intervention-complete', {
      statusCode: 200,
      body: { success: true, sessionId: 'intervention-123' }
    }).as('completeIntervention')

    cy.get('[data-testid="crisis-resolved"]').click()
    cy.get('[data-testid="intervention-feedback"]').type('Feeling much better now')
    cy.get('[data-testid="submit-feedback"]').click()

    cy.wait('@completeIntervention').then(() => {
      cy.window().then(win => {
        win.performance.mark('crisis-intervention-end')
        win.performance.measure(
          'crisis-intervention-duration',
          'crisis-intervention-start',
          'crisis-intervention-end'
        )

        const measure = win.performance.getEntriesByName('crisis-intervention-duration')[0]
        // Crisis interventions should be tracked for analysis but no time limit
        expect(measure.duration).to.be.greaterThan(0)
      })
    })
  })

  it('should handle mobile crisis interface', () => {
    cy.testMobileAccessibility()

    cy.viewport('iphone-x')
    cy.get('[data-testid="panic-button"]').click()

    // Verify mobile-optimized crisis interface
    cy.get('[data-testid="mobile-crisis-menu"]').should('be.visible')
    cy.get('[data-testid="large-touch-targets"]').should('exist')
    
    // Test swipe gestures for crisis resources
    cy.get('[data-testid="crisis-resources-carousel"]')
      .trigger('touchstart', { which: 1, pageX: 100, pageY: 100 })
      .trigger('touchmove', { which: 1, pageX: 200, pageY: 100 })
      .trigger('touchend')

    cy.get('[data-testid="next-crisis-resource"]').should('be.visible')
  })

  it('should maintain HIPAA compliance during crisis', () => {
    cy.triggerCrisisAlert()

    // Verify data handling compliance
    cy.window().then(win => {
      // Check that sensitive data is not stored in localStorage inappropriately
      const localStorage = win.localStorage
      const sensitiveKeys = Object.keys(localStorage).filter(key => 
        key.includes('crisis') || key.includes('emergency')
      )
      
      sensitiveKeys.forEach(key => {
        const value = localStorage.getItem(key)
        if (value) {
          const parsed = JSON.parse(value)
          // Crisis data should be encrypted or minimal
          expect(parsed).to.not.have.property('personalDetails')
          expect(parsed).to.not.have.property('medicalInfo')
        }
      })
    })

    // Verify secure transmission
    cy.intercept('POST', '/api/crisis/**', (req) => {
      expect(req.headers).to.have.property('authorization')
      expect(req.headers).to.have.property('x-csrf-token')
    })
  })
})