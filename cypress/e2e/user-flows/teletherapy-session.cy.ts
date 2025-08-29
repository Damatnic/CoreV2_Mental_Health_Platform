describe('Teletherapy Session Flow', () => {
  beforeEach(() => {
    cy.loginAsUser()
    cy.mockCrisisServices()
    
    // Mock active appointment
    cy.intercept('GET', '/api/appointments/current', {
      statusCode: 200,
      body: {
        appointment: {
          id: 'session-123',
          therapist: {
            id: 'therapist-1',
            name: 'Dr. Sarah Smith',
            credentials: 'PhD, LCSW'
          },
          startTime: new Date().toISOString(),
          duration: 60,
          sessionType: 'individual-therapy',
          meetingUrl: 'https://video.secure-therapy.com/session-123'
        }
      }
    }).as('getCurrentAppointment')
  })

  it('should join a scheduled therapy session successfully', () => {
    cy.visit('/therapy/session/session-123')
    cy.wait('@getCurrentAppointment')

    // Pre-session checklist
    cy.get('[data-testid="session-checklist"]').should('be.visible')
    cy.get('[data-testid="check-camera"]').click()
    cy.get('[data-testid="check-microphone"]').click()
    cy.get('[data-testid="check-internet"]').click()
    
    // Mock media permissions
    cy.window().then(win => {
      const mockGetUserMedia = cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
        getTracks: () => [
          { kind: 'video', getSettings: () => ({ width: 1280, height: 720 }) },
          { kind: 'audio', getSettings: () => ({ sampleRate: 48000 }) }
        ]
      })
    })

    cy.get('[data-testid="media-check-passed"]').should('be.visible')
    cy.get('[data-testid="join-session"]').click()

    // Verify session interface
    cy.get('[data-testid="video-session-interface"]').should('be.visible')
    cy.get('[data-testid="client-video"]').should('be.visible')
    cy.get('[data-testid="therapist-video"]').should('be.visible')
    cy.get('[data-testid="session-controls"]').should('be.visible')

    // Check accessibility for video session
    cy.checkA11y('[data-testid="video-session-interface"]', {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard': { enabled: true }
      }
    })
  })

  it('should handle media device permissions and setup', () => {
    cy.visit('/therapy/session/session-123')

    // Test camera permission request
    cy.get('[data-testid="check-camera"]').click()
    
    // Mock permission denied
    cy.window().then(win => {
      cy.stub(win.navigator.mediaDevices, 'getUserMedia').rejects(
        new Error('Permission denied')
      )
    })

    cy.get('[data-testid="camera-permission-error"]').should('be.visible')
    cy.get('[data-testid="camera-troubleshooting"]').should('contain', 'Please allow camera access')
    cy.get('[data-testid="audio-only-option"]').should('be.visible')

    // Test audio-only fallback
    cy.get('[data-testid="continue-audio-only"]').click()
    cy.get('[data-testid="audio-only-mode"]').should('be.visible')
  })

  it('should provide session controls during therapy', () => {
    cy.startTherapySession('individual')

    // Mock session in progress
    cy.intercept('POST', '/api/sessions/session-123/join', {
      statusCode: 200,
      body: {
        success: true,
        sessionState: 'active',
        participantId: 'client-456'
      }
    }).as('joinSession')

    cy.wait('@joinSession')

    // Test mute/unmute
    cy.get('[data-testid="mute-audio"]').click()
    cy.get('[data-testid="audio-muted-indicator"]').should('be.visible')
    cy.get('[data-testid="unmute-audio"]').click()
    cy.get('[data-testid="audio-active-indicator"]').should('be.visible')

    // Test video toggle
    cy.get('[data-testid="toggle-video"]').click()
    cy.get('[data-testid="video-disabled"]').should('be.visible')
    cy.get('[data-testid="toggle-video"]').click()
    cy.get('[data-testid="video-enabled"]').should('be.visible')

    // Test screen share (if needed for worksheets)
    cy.get('[data-testid="screen-share"]').should('be.visible')
    
    // Test chat function
    cy.get('[data-testid="open-chat"]').click()
    cy.get('[data-testid="session-chat"]').should('be.visible')
    cy.get('[data-testid="chat-input"]').type('Thank you for the helpful advice')
    cy.get('[data-testid="send-chat"]').click()
    cy.get('[data-testid="chat-message"]').should('contain', 'Thank you for the helpful advice')
  })

  it('should handle session recording with consent', () => {
    cy.startTherapySession('individual')

    // Therapist requests recording
    cy.window().then(win => {
      win.postMessage({
        type: 'RECORDING_REQUEST',
        data: {
          therapistId: 'therapist-1',
          sessionId: 'session-123',
          purpose: 'supervision'
        }
      }, '*')
    })

    // Recording consent dialog
    cy.get('[data-testid="recording-consent"]').should('be.visible')
    cy.get('[data-testid="recording-purpose"]').should('contain', 'supervision')
    cy.get('[data-testid="recording-details"]').should('be.visible')

    // Test consent options
    cy.get('[data-testid="consent-agree"]').click()
    
    cy.intercept('POST', '/api/sessions/session-123/recording/consent', {
      statusCode: 200,
      body: { success: true, recordingStarted: true }
    }).as('giveRecordingConsent')

    cy.get('[data-testid="confirm-recording-consent"]').click()
    cy.wait('@giveRecordingConsent')

    // Verify recording indicator
    cy.get('[data-testid="recording-active"]').should('be.visible')
    cy.get('[data-testid="recording-indicator"]').should('have.class', 'recording')
  })

  it('should handle connection issues gracefully', () => {
    cy.startTherapySession('individual')

    // Simulate poor connection
    cy.window().then(win => {
      win.postMessage({
        type: 'CONNECTION_QUALITY_CHANGE',
        data: { quality: 'poor', bandwidth: '100kb/s' }
      }, '*')
    })

    // Should show connection warning
    cy.get('[data-testid="connection-warning"]').should('be.visible')
    cy.get('[data-testid="connection-quality"]').should('contain', 'poor')
    cy.get('[data-testid="bandwidth-info"]').should('contain', '100kb/s')

    // Should offer connection improvement suggestions
    cy.get('[data-testid="connection-tips"]').should('be.visible')
    cy.get('[data-testid="reduce-video-quality"]').click()
    
    // Mock improved connection
    cy.window().then(win => {
      win.postMessage({
        type: 'CONNECTION_QUALITY_CHANGE',
        data: { quality: 'good', bandwidth: '1mb/s' }
      }, '*')
    })

    cy.get('[data-testid="connection-improved"]').should('be.visible')
  })

  it('should support crisis intervention during session', () => {
    cy.startTherapySession('individual')

    // Simulate crisis detection during session
    cy.get('[data-testid="session-chat"]').within(() => {
      cy.get('[data-testid="chat-input"]').type('I don\'t want to live anymore')
      cy.get('[data-testid="send-chat"]').click()
    })

    // Mock crisis detection
    cy.intercept('POST', '/api/crisis/session-alert', {
      statusCode: 200,
      body: {
        riskLevel: 'high',
        interventionRequired: true,
        emergencyProtocols: true
      }
    }).as('sessionCrisisAlert')

    cy.wait('@sessionCrisisAlert')

    // Should show crisis intervention tools
    cy.get('[data-testid="in-session-crisis-tools"]').should('be.visible')
    cy.get('[data-testid="crisis-assessment"]').should('be.visible')
    cy.get('[data-testid="emergency-contacts-alert"]').should('be.visible')

    // Therapist should have crisis intervention controls
    cy.get('[data-testid="therapist-crisis-tools"]').should('be.visible')
  })

  it('should handle session end and follow-up', () => {
    cy.startTherapySession('individual')

    // Mock session duration
    cy.wait(2000) // Simulate some session time

    // End session
    cy.get('[data-testid="end-session"]').click()
    cy.get('[data-testid="end-session-confirm"]').should('be.visible')
    
    // Mock session summary
    cy.intercept('POST', '/api/sessions/session-123/end', {
      statusCode: 200,
      body: {
        success: true,
        sessionDuration: 58,
        summary: {
          topics: ['anxiety management', 'coping strategies'],
          homework: 'Practice breathing exercises daily',
          nextAppointment: '2024-02-01T15:00:00Z'
        }
      }
    }).as('endSession')

    cy.get('[data-testid="confirm-end-session"]').click()
    cy.wait('@endSession')

    // Session summary screen
    cy.get('[data-testid="session-summary"]').should('be.visible')
    cy.get('[data-testid="session-topics"]').should('contain', 'anxiety management')
    cy.get('[data-testid="homework-assigned"]').should('contain', 'breathing exercises')
    cy.get('[data-testid="next-appointment"]').should('contain', 'February 1')

    // Feedback form
    cy.get('[data-testid="session-feedback"]').should('be.visible')
    cy.get('[data-testid="session-rating"]').click()
    cy.get('[data-rating="5"]').click()
    cy.get('[data-testid="feedback-comments"]').type('Very helpful session, feeling more hopeful')

    cy.intercept('POST', '/api/sessions/session-123/feedback', {
      statusCode: 200,
      body: { success: true }
    }).as('submitFeedback')

    cy.get('[data-testid="submit-feedback"]').click()
    cy.wait('@submitFeedback')

    cy.get('[data-testid="feedback-submitted"]').should('be.visible')
  })

  it('should support group therapy sessions', () => {
    cy.startTherapySession('group')

    // Mock group session with multiple participants
    cy.intercept('POST', '/api/group-sessions/group-123/join', {
      statusCode: 200,
      body: {
        success: true,
        participants: [
          { id: 'participant-1', name: 'Anonymous User 1', isClient: false },
          { id: 'participant-2', name: 'Anonymous User 2', isClient: false },
          { id: 'current-user', name: 'You', isClient: true }
        ],
        facilitator: { id: 'therapist-1', name: 'Dr. Sarah Smith' }
      }
    }).as('joinGroupSession')

    cy.wait('@joinGroupSession')

    // Group session interface
    cy.get('[data-testid="group-session-interface"]').should('be.visible')
    cy.get('[data-testid="participant-list"]').should('contain', 'Anonymous User 1')
    cy.get('[data-testid="facilitator-video"]').should('be.visible')

    // Group chat with moderation
    cy.get('[data-testid="group-chat"]').should('be.visible')
    cy.get('[data-testid="chat-guidelines"]').should('be.visible')

    // Raise hand feature
    cy.get('[data-testid="raise-hand"]').click()
    cy.get('[data-testid="hand-raised-indicator"]').should('be.visible')

    // Test speaking queue
    cy.get('[data-testid="speaking-queue"]').should('be.visible')
    cy.get('[data-testid="your-turn-to-speak"]').should('contain', 'You are next to speak')
  })

  it('should handle session technical difficulties', () => {
    cy.startTherapySession('individual')

    // Simulate audio issues
    cy.get('[data-testid="report-audio-issue"]').click()
    cy.get('[data-testid="technical-support"]').should('be.visible')
    cy.get('[data-testid="audio-test"]').click()

    // Mock technical support
    cy.intercept('POST', '/api/support/technical-issue', {
      statusCode: 200,
      body: {
        ticketId: 'support-123',
        estimatedResolution: '2 minutes',
        troubleshootingSteps: ['Check microphone permissions', 'Restart browser']
      }
    }).as('reportTechnicalIssue')

    cy.get('[data-testid="describe-issue"]').type('Cannot hear therapist clearly')
    cy.get('[data-testid="submit-technical-issue"]').click()
    cy.wait('@reportTechnicalIssue')

    // Should show troubleshooting steps
    cy.get('[data-testid="troubleshooting-steps"]').should('be.visible')
    cy.get('[data-testid="step-1"]').should('contain', 'Check microphone permissions')

    // Test emergency backup communication
    cy.get('[data-testid="emergency-phone-backup"]').should('be.visible')
    cy.get('[data-testid="therapist-phone-number"]').should('be.visible')
  })

  it('should maintain HIPAA compliance during sessions', () => {
    cy.startTherapySession('individual')

    // Verify secure connection
    cy.url().should('include', 'https://')
    
    // Check for encryption indicators
    cy.get('[data-testid="encryption-indicator"]').should('be.visible')
    cy.get('[data-testid="secure-session"]').should('contain', 'End-to-end encrypted')

    // Verify no unauthorized recording warnings
    cy.get('[data-testid="no-recording-warning"]').should('be.visible')
    
    // Test secure chat
    cy.get('[data-testid="secure-chat-indicator"]').should('be.visible')
    
    // Verify session data handling
    cy.window().then(win => {
      // Check that sensitive session data is not stored inappropriately
      const sessionData = win.sessionStorage.getItem('therapySession')
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        expect(parsed).to.not.have.property('recordingData')
        expect(parsed).to.not.have.property('chatHistory')
      }
    })
  })

  it('should support session waiting room', () => {
    cy.visit('/therapy/session/session-123')
    
    // Mock therapist not ready
    cy.intercept('GET', '/api/sessions/session-123/status', {
      statusCode: 200,
      body: {
        status: 'waiting',
        therapistReady: false,
        estimatedWaitTime: 5
      }
    }).as('getSessionStatus')

    cy.wait('@getSessionStatus')

    // Waiting room interface
    cy.get('[data-testid="waiting-room"]').should('be.visible')
    cy.get('[data-testid="wait-message"]').should('contain', 'Dr. Sarah Smith will be with you shortly')
    cy.get('[data-testid="estimated-wait"]').should('contain', '5 minutes')

    // Waiting room activities
    cy.get('[data-testid="breathing-exercise"]').should('be.visible')
    cy.get('[data-testid="session-prep"]').should('be.visible')
    cy.get('[data-testid="previous-notes"]').should('be.visible')

    // Mock therapist ready
    cy.window().then(win => {
      win.postMessage({
        type: 'THERAPIST_READY',
        data: { sessionId: 'session-123' }
      }, '*')
    })

    cy.get('[data-testid="therapist-ready-notification"]').should('be.visible')
    cy.get('[data-testid="join-session-now"]').should('be.visible')
  })

  it('should measure session performance and quality', () => {
    cy.window().then(win => {
      win.performance.mark('session-start')
    })

    cy.startTherapySession('individual')

    // Monitor connection quality
    cy.get('[data-testid="connection-quality-monitor"]').should('be.visible')
    
    // Monitor session metrics
    cy.window().then(win => {
      // Mock WebRTC stats
      win.__mockWebRTCStats = {
        video: {
          framesPerSecond: 30,
          resolution: '1280x720',
          bytesReceived: 1500000
        },
        audio: {
          jitter: 5,
          packetLoss: 0.1,
          bitrate: 64000
        }
      }
    })

    // Session should maintain quality standards
    cy.get('[data-testid="video-quality"]').should('contain', '720p')
    cy.get('[data-testid="audio-quality"]').should('contain', 'Good')

    // End session and check performance
    cy.get('[data-testid="end-session"]').click()
    cy.get('[data-testid="confirm-end-session"]').click()

    cy.get('[data-testid="session-summary"]').should('be.visible').then(() => {
      cy.window().then(win => {
        win.performance.mark('session-end')
        win.performance.measure('session-duration', 'session-start', 'session-end')
        
        const measure = win.performance.getEntriesByName('session-duration')[0]
        // Sessions should be trackable for billing/therapeutic purposes
        expect(measure.duration).to.be.greaterThan(0)
      })
    })
  })

  it('should handle mobile therapy sessions', () => {
    cy.viewport('iphone-x')
    cy.startTherapySession('individual')

    // Mobile-optimized interface
    cy.get('[data-testid="mobile-session-interface"]').should('be.visible')
    cy.get('[data-testid="mobile-controls"]').should('be.visible')

    // Touch-friendly controls
    cy.get('[data-testid="large-mute-button"]').should('have.css', 'min-width', '44px')
    cy.get('[data-testid="large-video-toggle"]').should('have.css', 'min-height', '44px')

    // Orientation handling
    cy.get('[data-testid="rotate-device-suggestion"]').should('be.visible')
    
    // Test portrait mode adjustments
    cy.get('[data-testid="portrait-video-layout"]').should('be.visible')
    
    // Mobile-specific features
    cy.get('[data-testid="mobile-chat-overlay"]').should('exist')
    cy.get('[data-testid="minimize-controls"]').should('be.visible')
  })
})