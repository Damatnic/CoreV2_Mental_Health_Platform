describe('Mood Tracking Flow', () => {
  beforeEach(() => {
    cy.loginAsUser()
    cy.mockCrisisServices()
    cy.visit('/mood-tracker')
  })

  it('should complete a basic mood entry', () => {
    cy.get('[data-testid="track-mood-button"]').click()
    
    // Select mood
    cy.get('[data-testid="mood-happy"]').click()
    cy.get('[data-testid="mood-selected"]').should('contain', 'Happy')
    
    // Adjust mood intensity
    cy.get('[data-testid="mood-score-slider"]').then($slider => {
      const slider = $slider[0] as HTMLInputElement
      slider.value = '7'
      slider.dispatchEvent(new Event('input'))
    })
    
    cy.get('[data-testid="mood-score-display"]').should('contain', '7')
    
    // Add notes
    cy.get('[data-testid="mood-notes"]').type('Had a great day at work and spent time with friends')
    
    // Add factors
    cy.get('[data-testid="mood-factors"]').within(() => {
      cy.get('[data-testid="factor-work"]').click()
      cy.get('[data-testid="factor-social"]').click()
      cy.get('[data-testid="factor-exercise"]').click()
    })
    
    // Save entry
    cy.get('[data-testid="save-mood"]').click()
    
    // Verify success
    cy.get('[data-testid="mood-saved-confirmation"]').should('contain', 'Mood entry saved')
    cy.get('[data-testid="mood-history-updated"]').should('be.visible')
    
    // Check accessibility
    cy.checkA11y()
  })

  it('should validate required mood selection', () => {
    cy.get('[data-testid="track-mood-button"]').click()
    
    // Try to save without selecting mood
    cy.get('[data-testid="save-mood"]').click()
    
    cy.get('[data-testid="mood-validation-error"]').should('contain', 'Please select a mood')
    cy.get('[data-testid="mood-selector"]').should('have.class', 'error')
  })

  it('should handle mood entry with crisis detection', () => {
    cy.get('[data-testid="track-mood-button"]').click()
    
    // Select very low mood
    cy.get('[data-testid="mood-depressed"]').click()
    cy.get('[data-testid="mood-score-slider"]').then($slider => {
      const slider = $slider[0] as HTMLInputElement
      slider.value = '1'
      slider.dispatchEvent(new Event('input'))
    })
    
    // Add concerning notes
    cy.get('[data-testid="mood-notes"]').type('I feel hopeless and don\'t see any point in continuing')
    
    // Mock crisis detection
    cy.intercept('POST', '/api/mood-entries', {
      statusCode: 200,
      body: {
        success: true,
        entryId: 'mood-123',
        crisisDetected: true,
        riskLevel: 'moderate',
        interventionTriggered: true
      }
    }).as('saveMoodWithCrisis')
    
    cy.get('[data-testid="save-mood"]').click()
    cy.wait('@saveMoodWithCrisis')
    
    // Should trigger crisis intervention
    cy.get('[data-testid="crisis-intervention-modal"]').should('be.visible')
    cy.get('[data-testid="crisis-resources"]').should('be.visible')
    cy.get('[data-testid="therapist-recommendation"]').should('be.visible')
  })

  it('should show mood patterns and insights', () => {
    // Mock mood history data
    cy.intercept('GET', '/api/mood-entries/history*', {
      statusCode: 200,
      body: {
        entries: [
          { id: '1', mood: 'happy', score: 7, date: '2024-01-15', factors: ['work', 'social'] },
          { id: '2', mood: 'neutral', score: 5, date: '2024-01-14', factors: ['sleep'] },
          { id: '3', mood: 'anxious', score: 3, date: '2024-01-13', factors: ['work', 'health'] },
          { id: '4', mood: 'sad', score: 2, date: '2024-01-12', factors: ['relationship'] }
        ],
        insights: {
          averageScore: 4.25,
          mostCommonMood: 'neutral',
          topFactors: ['work', 'sleep', 'social'],
          trends: {
            weekly: 'declining',
            monthly: 'stable'
          }
        }
      }
    }).as('getMoodHistory')
    
    cy.get('[data-testid="view-insights"]').click()
    cy.wait('@getMoodHistory')
    
    // Verify insights display
    cy.get('[data-testid="mood-insights"]').should('be.visible')
    cy.get('[data-testid="average-score"]').should('contain', '4.25')
    cy.get('[data-testid="common-mood"]').should('contain', 'neutral')
    cy.get('[data-testid="mood-trends"]').should('contain', 'declining')
    
    // Test interactive chart
    cy.get('[data-testid="mood-chart"]').should('be.visible')
    cy.get('[data-testid="chart-point"]').should('have.length', 4)
    
    // Test factor correlation
    cy.get('[data-testid="factor-analysis"]').should('be.visible')
    cy.get('[data-testid="factor-work"]').should('contain', 'appears in 50% of entries')
  })

  it('should allow editing of recent mood entries', () => {
    // Mock recent entries
    cy.intercept('GET', '/api/mood-entries/recent', {
      statusCode: 200,
      body: {
        entries: [
          {
            id: 'recent-1',
            mood: 'happy',
            score: 6,
            notes: 'Good day',
            date: new Date().toISOString(),
            editable: true
          }
        ]
      }
    }).as('getRecentEntries')
    
    cy.get('[data-testid="recent-entries"]').click()
    cy.wait('@getRecentEntries')
    
    // Edit entry
    cy.get('[data-testid="edit-mood-recent-1"]').click()
    cy.get('[data-testid="edit-mood-modal"]').should('be.visible')
    
    // Change mood
    cy.get('[data-testid="mood-excited"]').click()
    cy.get('[data-testid="mood-score-slider"]').then($slider => {
      const slider = $slider[0] as HTMLInputElement
      slider.value = '8'
      slider.dispatchEvent(new Event('input'))
    })
    
    // Update notes
    cy.get('[data-testid="mood-notes"]').clear().type('Actually had an amazing day!')
    
    // Mock update
    cy.intercept('PUT', '/api/mood-entries/recent-1', {
      statusCode: 200,
      body: { success: true, updated: true }
    }).as('updateMoodEntry')
    
    cy.get('[data-testid="save-changes"]').click()
    cy.wait('@updateMoodEntry')
    
    cy.get('[data-testid="update-confirmation"]').should('contain', 'Entry updated successfully')
  })

  it('should support mood tracking with photos', () => {
    cy.get('[data-testid="track-mood-button"]').click()
    
    cy.get('[data-testid="mood-neutral"]').click()
    
    // Add photo
    cy.get('[data-testid="add-photo"]').click()
    
    // Mock file upload
    cy.fixture('mood-photo.jpg', 'base64').then(fileContent => {
      cy.get('[data-testid="photo-upload"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'base64'),
        fileName: 'mood-photo.jpg',
        mimeType: 'image/jpeg'
      })
    })
    
    cy.get('[data-testid="photo-preview"]').should('be.visible')
    cy.get('[data-testid="photo-caption"]').type('Sunset from my walk today')
    
    // Mock mood entry with photo
    cy.intercept('POST', '/api/mood-entries', {
      statusCode: 200,
      body: {
        success: true,
        entryId: 'mood-with-photo',
        photoUploaded: true
      }
    }).as('saveMoodWithPhoto')
    
    cy.get('[data-testid="save-mood"]').click()
    cy.wait('@saveMoodWithPhoto')
    
    cy.get('[data-testid="photo-saved-confirmation"]').should('be.visible')
  })

  it('should track mood with location context', () => {
    // Mock geolocation
    cy.window().then(win => {
      const mockGeolocation = {
        getCurrentPosition: (success: Function) => {
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.0060
            }
          })
        }
      }
      Object.defineProperty(win.navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true
      })
    })
    
    cy.get('[data-testid="track-mood-button"]').click()
    
    // Enable location tracking
    cy.get('[data-testid="enable-location"]').click()
    cy.get('[data-testid="location-permission-granted"]').should('be.visible')
    
    cy.get('[data-testid="mood-calm"]').click()
    
    // Should show location context
    cy.get('[data-testid="location-context"]').should('contain', 'New York')
    
    cy.get('[data-testid="save-mood"]').click()
    
    // Verify location was included
    cy.intercept('POST', '/api/mood-entries').as('saveMoodWithLocation')
    cy.wait('@saveMoodWithLocation').then(interception => {
      expect(interception.request.body).to.have.property('location')
      expect(interception.request.body.location.latitude).to.equal(40.7128)
    })
  })

  it('should provide mood tracking reminders', () => {
    // Mock reminder settings
    cy.intercept('GET', '/api/user/mood-reminder-settings', {
      statusCode: 200,
      body: {
        enabled: true,
        frequency: 'daily',
        time: '20:00',
        lastReminder: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      }
    }).as('getReminderSettings')
    
    cy.visit('/mood-tracker')
    cy.wait('@getReminderSettings')
    
    // Should show reminder notification
    cy.get('[data-testid="mood-reminder"]').should('be.visible')
    cy.get('[data-testid="reminder-message"]').should('contain', 'Time for your daily mood check')
    
    // Test snooze functionality
    cy.get('[data-testid="snooze-reminder"]').click()
    cy.get('[data-testid="snooze-options"]').should('be.visible')
    cy.get('[data-testid="snooze-1hour"]').click()
    
    cy.get('[data-testid="reminder-snoozed"]').should('contain', 'Reminder snoozed for 1 hour')
  })

  it('should export mood data', () => {
    cy.get('[data-testid="mood-settings"]').click()
    cy.get('[data-testid="export-data"]').click()
    
    // Select export options
    cy.get('[data-testid="export-range"]').select('last-3-months')
    cy.get('[data-testid="export-format"]').select('csv')
    cy.get('[data-testid="include-notes"]').check()
    cy.get('[data-testid="include-factors"]').check()
    
    // Mock export generation
    cy.intercept('POST', '/api/mood-entries/export', {
      statusCode: 200,
      body: {
        success: true,
        exportId: 'export-123',
        downloadUrl: '/api/downloads/mood-export-123.csv'
      }
    }).as('generateExport')
    
    cy.get('[data-testid="generate-export"]').click()
    cy.wait('@generateExport')
    
    cy.get('[data-testid="export-ready"]').should('be.visible')
    cy.get('[data-testid="download-export"]').should('have.attr', 'href').and('include', 'export-123.csv')
  })

  it('should handle offline mood tracking', () => {
    // Simulate offline mode
    cy.testOfflineMode()
    
    cy.get('[data-testid="track-mood-button"]').click()
    
    // Should show offline indicator
    cy.get('[data-testid="offline-mode-indicator"]').should('be.visible')
    
    // Track mood offline
    cy.get('[data-testid="mood-content"]').click()
    cy.get('[data-testid="mood-notes"]').type('Feeling good despite being offline')
    cy.get('[data-testid="save-mood"]').click()
    
    // Should queue for sync
    cy.get('[data-testid="offline-queue-added"]').should('contain', 'Mood entry saved offline')
    cy.get('[data-testid="sync-pending"]').should('be.visible')
    
    // Simulate coming back online
    cy.window().then(win => {
      win.navigator.onLine = true
      win.dispatchEvent(new Event('online'))
    })
    
    // Should sync automatically
    cy.get('[data-testid="sync-success"]').should('contain', 'Mood entries synced successfully')
  })

  it('should provide mood-based recommendations', () => {
    cy.get('[data-testid="track-mood-button"]').click()
    
    // Track anxious mood
    cy.get('[data-testid="mood-anxious"]').click()
    cy.get('[data-testid="mood-score-slider"]').then($slider => {
      const slider = $slider[0] as HTMLInputElement
      slider.value = '3'
      slider.dispatchEvent(new Event('input'))
    })
    
    cy.get('[data-testid="mood-factors"]').within(() => {
      cy.get('[data-testid="factor-work"]').click()
      cy.get('[data-testid="factor-sleep"]').click()
    })
    
    // Mock recommendations based on mood
    cy.intercept('POST', '/api/mood-entries', {
      statusCode: 200,
      body: {
        success: true,
        entryId: 'anxious-mood',
        recommendations: [
          {
            type: 'breathing-exercise',
            title: 'Try a 5-minute breathing exercise',
            description: 'Deep breathing can help reduce anxiety',
            action: '/breathing-exercises'
          },
          {
            type: 'sleep-hygiene',
            title: 'Improve your sleep routine',
            description: 'Better sleep can reduce work stress',
            action: '/sleep-tracker'
          }
        ]
      }
    }).as('saveMoodWithRecommendations')
    
    cy.get('[data-testid="save-mood"]').click()
    cy.wait('@saveMoodWithRecommendations')
    
    // Verify recommendations display
    cy.get('[data-testid="mood-recommendations"]').should('be.visible')
    cy.get('[data-testid="recommendation-breathing-exercise"]').should('contain', 'breathing exercise')
    cy.get('[data-testid="recommendation-sleep-hygiene"]').should('contain', 'sleep routine')
    
    // Test recommendation action
    cy.get('[data-testid="try-breathing-exercise"]').click()
    cy.url().should('include', '/breathing-exercises')
  })

  it('should measure mood tracking performance', () => {
    cy.window().then(win => {
      win.performance.mark('mood-tracking-start')
    })
    
    cy.get('[data-testid="track-mood-button"]').click()
    cy.get('[data-testid="mood-happy"]').click()
    cy.get('[data-testid="save-mood"]').click()
    
    cy.get('[data-testid="mood-saved-confirmation"]').should('be.visible').then(() => {
      cy.window().then(win => {
        win.performance.mark('mood-tracking-end')
        win.performance.measure('mood-tracking-flow', 'mood-tracking-start', 'mood-tracking-end')
        
        const measure = win.performance.getEntriesByName('mood-tracking-flow')[0]
        expect(measure.duration).to.be.lessThan(3000) // Should complete within 3 seconds
      })
    })
  })

  it('should support keyboard navigation for mood selection', () => {
    cy.get('[data-testid="track-mood-button"]').click()
    
    // Navigate through mood options with keyboard
    cy.get('[data-testid="mood-selector"]').focus()
    cy.focused().type('{rightarrow}')
    cy.get('[data-testid="mood-happy"]').should('have.focus')
    
    cy.focused().type('{rightarrow}')
    cy.get('[data-testid="mood-excited"]').should('have.focus')
    
    cy.focused().type('{enter}')
    cy.get('[data-testid="mood-selected"]').should('contain', 'Excited')
    
    // Navigate to score slider with tab
    cy.focused().tab()
    cy.get('[data-testid="mood-score-slider"]').should('have.focus')
    
    // Adjust score with arrow keys
    cy.focused().type('{rightarrow}{rightarrow}') // Increase score
    cy.get('[data-testid="mood-score-display"]').should('not.contain', '5') // Should have changed
  })

  it('should validate mood entry completion', () => {
    cy.performWellnessCheck() // Use custom command for comprehensive wellness tracking
    
    // Should integrate with other wellness features
    cy.get('[data-testid="wellness-integration"]').should('be.visible')
    cy.get('[data-testid="holistic-view"]').should('contain', 'Complete picture of your wellbeing')
  })
})