describe('Appointment Booking Flow', () => {
  beforeEach(() => {
    cy.loginAsUser()
    cy.visit('/appointments')
  })

  it('should book a therapy appointment successfully', () => {
    // Mock available therapists
    cy.intercept('GET', '/api/therapists/available*', {
      statusCode: 200,
      body: {
        therapists: [
          {
            id: 'therapist-1',
            name: 'Dr. Sarah Smith',
            specialties: ['anxiety', 'depression', 'trauma'],
            rating: 4.8,
            nextAvailable: '2024-01-20',
            profileImage: '/images/therapist-1.jpg',
            bio: 'Specializes in CBT and mindfulness approaches',
            languages: ['English', 'Spanish']
          },
          {
            id: 'therapist-2',
            name: 'Dr. Michael Johnson',
            specialties: ['addiction', 'family therapy'],
            rating: 4.9,
            nextAvailable: '2024-01-18',
            profileImage: '/images/therapist-2.jpg',
            bio: 'Family systems therapy expert',
            languages: ['English']
          }
        ]
      }
    }).as('getAvailableTherapists')

    cy.get('[data-testid="book-appointment"]').click()
    cy.wait('@getAvailableTherapists')

    // Select therapy type
    cy.get('[data-testid="appointment-type"]').select('individual-therapy')
    
    // Select therapist
    cy.get('[data-testid="therapist-list"]').should('be.visible')
    cy.get('[data-testid="therapist-therapist-1"]').click()
    
    // View therapist details
    cy.get('[data-testid="therapist-details"]').should('contain', 'Dr. Sarah Smith')
    cy.get('[data-testid="therapist-specialties"]').should('contain', 'anxiety, depression, trauma')
    cy.get('[data-testid="therapist-rating"]').should('contain', '4.8')

    // Mock available time slots
    cy.intercept('GET', '/api/therapists/therapist-1/availability*', {
      statusCode: 200,
      body: {
        availability: [
          {
            date: '2024-01-20',
            slots: ['09:00', '10:00', '14:00', '15:00']
          },
          {
            date: '2024-01-21',
            slots: ['11:00', '13:00', '16:00']
          }
        ]
      }
    }).as('getTherapistAvailability')

    cy.get('[data-testid="select-therapist"]').click()
    cy.wait('@getTherapistAvailability')

    // Select date and time
    cy.get('[data-testid="date-2024-01-20"]').click()
    cy.get('[data-testid="time-slot-14:00"]').click()

    // Fill appointment details
    cy.get('[data-testid="appointment-reason"]').select('initial-consultation')
    cy.get('[data-testid="appointment-notes"]').type('Seeking help with anxiety management and stress')
    cy.get('[data-testid="session-format"]').select('video-call')

    // Confirm insurance/payment method
    cy.get('[data-testid="payment-method"]').select('insurance')
    cy.get('[data-testid="insurance-provider"]').select('blue-cross')

    // Mock successful booking
    cy.intercept('POST', '/api/appointments/book', {
      statusCode: 200,
      body: {
        success: true,
        appointmentId: 'appt-123',
        confirmationNumber: 'CONF-789',
        appointmentDetails: {
          therapist: 'Dr. Sarah Smith',
          date: '2024-01-20',
          time: '14:00',
          duration: 60,
          format: 'video-call'
        },
        calendarInvite: true,
        reminderScheduled: true
      }
    }).as('bookAppointment')

    cy.get('[data-testid="book-appointment-confirm"]').click()
    cy.wait('@bookAppointment')

    // Verify booking confirmation
    cy.get('[data-testid="booking-success"]').should('be.visible')
    cy.get('[data-testid="confirmation-number"]').should('contain', 'CONF-789')
    cy.get('[data-testid="appointment-details"]').should('contain', 'Dr. Sarah Smith')
    cy.get('[data-testid="appointment-date-time"]').should('contain', 'Jan 20, 2024 at 2:00 PM')
    
    // Should show calendar and reminder confirmations
    cy.get('[data-testid="calendar-added"]').should('contain', 'Added to your calendar')
    cy.get('[data-testid="reminder-set"]').should('contain', 'Reminder notifications set')

    // Check accessibility
    cy.checkA11y()
  })

  it('should handle no available appointments', () => {
    // Mock no availability
    cy.intercept('GET', '/api/therapists/available*', {
      statusCode: 200,
      body: {
        therapists: [],
        message: 'No therapists available for selected criteria'
      }
    }).as('getNoAvailableTherapists')

    cy.get('[data-testid="book-appointment"]').click()
    cy.wait('@getNoAvailableTherapists')

    cy.get('[data-testid="no-availability-message"]').should('be.visible')
    cy.get('[data-testid="join-waitlist"]').should('be.visible')
    cy.get('[data-testid="emergency-resources"]').should('be.visible')
  })

  it('should allow filtering therapists by specialty', () => {
    cy.intercept('GET', '/api/therapists/available*', {
      statusCode: 200,
      body: {
        therapists: [
          {
            id: 'therapist-1',
            name: 'Dr. Sarah Smith',
            specialties: ['anxiety', 'depression'],
            rating: 4.8
          },
          {
            id: 'therapist-2',
            name: 'Dr. Michael Johnson',
            specialties: ['addiction', 'trauma'],
            rating: 4.9
          }
        ]
      }
    }).as('getAllTherapists')

    cy.get('[data-testid="book-appointment"]').click()
    cy.wait('@getAllTherapists')

    // Apply specialty filter
    cy.get('[data-testid="specialty-filter"]').select('anxiety')
    
    // Mock filtered results
    cy.intercept('GET', '/api/therapists/available*specialty=anxiety*', {
      statusCode: 200,
      body: {
        therapists: [
          {
            id: 'therapist-1',
            name: 'Dr. Sarah Smith',
            specialties: ['anxiety', 'depression'],
            rating: 4.8
          }
        ]
      }
    }).as('getFilteredTherapists')

    cy.wait('@getFilteredTherapists')
    
    cy.get('[data-testid="therapist-list"]').should('contain', 'Dr. Sarah Smith')
    cy.get('[data-testid="therapist-list"]').should('not.contain', 'Dr. Michael Johnson')
  })

  it('should support emergency appointment booking', () => {
    cy.get('[data-testid="emergency-appointment"]').click()
    
    // Should show crisis resources first
    cy.get('[data-testid="crisis-resources-first"]').should('be.visible')
    cy.get('[data-testid="988-lifeline"]').should('be.visible')
    cy.get('[data-testid="crisis-text"]').should('be.visible')

    cy.get('[data-testid="continue-emergency-booking"]').click()

    // Mock emergency slots
    cy.intercept('GET', '/api/appointments/emergency-slots', {
      statusCode: 200,
      body: {
        availableSlots: [
          {
            therapistId: 'crisis-therapist-1',
            name: 'Dr. Emergency Smith',
            specialty: 'Crisis Intervention',
            nextSlot: '2024-01-15T16:00:00Z',
            format: 'video-call'
          }
        ]
      }
    }).as('getEmergencySlots')

    cy.wait('@getEmergencySlots')

    cy.get('[data-testid="emergency-slot-crisis-therapist-1"]').click()
    
    // Simplified booking for emergency
    cy.get('[data-testid="crisis-reason"]').select('suicidal-thoughts')
    cy.get('[data-testid="immediate-risk"]').select('low')
    
    cy.intercept('POST', '/api/appointments/emergency-book', {
      statusCode: 200,
      body: {
        success: true,
        appointmentId: 'emergency-123',
        waitTime: 15
      }
    }).as('bookEmergencyAppointment')

    cy.get('[data-testid="book-emergency"]').click()
    cy.wait('@bookEmergencyAppointment')

    cy.get('[data-testid="emergency-booking-success"]').should('contain', 'Emergency session scheduled')
    cy.get('[data-testid="wait-time"]').should('contain', '15 minutes')
  })

  it('should handle appointment rescheduling', () => {
    // Mock existing appointments
    cy.intercept('GET', '/api/appointments/upcoming', {
      statusCode: 200,
      body: {
        appointments: [
          {
            id: 'appt-456',
            therapist: 'Dr. Sarah Smith',
            date: '2024-01-25',
            time: '15:00',
            type: 'individual-therapy',
            canReschedule: true
          }
        ]
      }
    }).as('getUpcomingAppointments')

    cy.visit('/appointments/manage')
    cy.wait('@getUpcomingAppointments')

    cy.get('[data-testid="reschedule-appt-456"]').click()
    
    // Mock new availability
    cy.intercept('GET', '/api/therapists/therapist-1/availability*', {
      statusCode: 200,
      body: {
        availability: [
          {
            date: '2024-01-26',
            slots: ['10:00', '14:00', '16:00']
          }
        ]
      }
    }).as('getRescheduleAvailability')

    cy.wait('@getRescheduleAvailability')

    // Select new time
    cy.get('[data-testid="date-2024-01-26"]').click()
    cy.get('[data-testid="time-slot-14:00"]').click()

    cy.get('[data-testid="reschedule-reason"]').type('Work conflict with original time')

    // Mock successful reschedule
    cy.intercept('PUT', '/api/appointments/appt-456/reschedule', {
      statusCode: 200,
      body: {
        success: true,
        newDateTime: '2024-01-26T14:00:00Z'
      }
    }).as('rescheduleAppointment')

    cy.get('[data-testid="confirm-reschedule"]').click()
    cy.wait('@rescheduleAppointment')

    cy.get('[data-testid="reschedule-success"]').should('contain', 'Appointment rescheduled')
  })

  it('should support group therapy session booking', () => {
    cy.get('[data-testid="book-group-session"]').click()

    // Mock available group sessions
    cy.intercept('GET', '/api/group-sessions/available', {
      statusCode: 200,
      body: {
        sessions: [
          {
            id: 'group-1',
            title: 'Anxiety Support Group',
            facilitator: 'Dr. Lisa Johnson',
            schedule: 'Tuesdays, 7:00 PM',
            nextSession: '2024-01-23T19:00:00Z',
            spotsAvailable: 3,
            maxParticipants: 8,
            description: 'Weekly support group for anxiety management',
            format: 'video-conference'
          }
        ]
      }
    }).as('getGroupSessions')

    cy.wait('@getGroupSessions')

    cy.get('[data-testid="group-session-group-1"]').should('be.visible')
    cy.get('[data-testid="group-title"]').should('contain', 'Anxiety Support Group')
    cy.get('[data-testid="spots-available"]').should('contain', '3 spots available')

    cy.get('[data-testid="join-group-1"]').click()

    // Group session agreement
    cy.get('[data-testid="group-guidelines"]').should('be.visible')
    cy.get('[data-testid="confidentiality-agreement"]').should('be.visible')
    cy.get('[data-testid="agree-to-guidelines"]').check()

    cy.intercept('POST', '/api/group-sessions/group-1/join', {
      statusCode: 200,
      body: {
        success: true,
        sessionDetails: {
          meetingLink: 'https://video.example.com/group-1',
          nextSession: '2024-01-23T19:00:00Z'
        }
      }
    }).as('joinGroupSession')

    cy.get('[data-testid="confirm-join-group"]').click()
    cy.wait('@joinGroupSession')

    cy.get('[data-testid="group-join-success"]').should('contain', 'Successfully joined group')
    cy.get('[data-testid="meeting-details"]').should('be.visible')
  })

  it('should handle insurance verification', () => {
    cy.get('[data-testid="book-appointment"]').click()
    
    // Select therapist and time (using mocked data from previous tests)
    cy.intercept('GET', '/api/therapists/available*', {
      statusCode: 200,
      body: {
        therapists: [
          {
            id: 'therapist-1',
            name: 'Dr. Sarah Smith',
            acceptedInsurance: ['blue-cross', 'aetna']
          }
        ]
      }
    }).as('getTherapistsWithInsurance')

    cy.wait('@getTherapistsWithInsurance')
    cy.get('[data-testid="therapist-therapist-1"]').click()

    // Mock time slots and select one
    cy.intercept('GET', '/api/therapists/therapist-1/availability*', {
      statusCode: 200,
      body: {
        availability: [{ date: '2024-01-20', slots: ['14:00'] }]
      }
    }).as('getAvailability')

    cy.get('[data-testid="select-therapist"]').click()
    cy.wait('@getAvailability')
    cy.get('[data-testid="date-2024-01-20"]').click()
    cy.get('[data-testid="time-slot-14:00"]').click()

    // Insurance verification
    cy.get('[data-testid="verify-insurance"]').click()
    
    cy.intercept('POST', '/api/insurance/verify', {
      statusCode: 200,
      body: {
        verified: true,
        coverage: {
          copay: 25,
          deductibleMet: false,
          remainingDeductible: 150,
          coveragePercentage: 80
        }
      }
    }).as('verifyInsurance')

    cy.get('[data-testid="insurance-provider"]').select('blue-cross')
    cy.get('[data-testid="insurance-id"]').type('BC123456789')
    cy.get('[data-testid="verify-coverage"]').click()
    cy.wait('@verifyInsurance')

    cy.get('[data-testid="insurance-verified"]').should('contain', 'Insurance verified')
    cy.get('[data-testid="copay-amount"]').should('contain', '$25')
    cy.get('[data-testid="coverage-details"]').should('be.visible')
  })

  it('should support appointment cancellation with appropriate notice', () => {
    // Navigate to manage appointments
    cy.intercept('GET', '/api/appointments/upcoming', {
      statusCode: 200,
      body: {
        appointments: [
          {
            id: 'appt-789',
            therapist: 'Dr. Sarah Smith',
            date: '2024-01-30',
            time: '15:00',
            canCancel: true,
            cancellationDeadline: '2024-01-28T15:00:00Z'
          }
        ]
      }
    }).as('getUpcomingAppointments')

    cy.visit('/appointments/manage')
    cy.wait('@getUpcomingAppointments')

    cy.get('[data-testid="cancel-appt-789"]').click()

    // Show cancellation policy
    cy.get('[data-testid="cancellation-policy"]').should('be.visible')
    cy.get('[data-testid="cancellation-deadline"]').should('contain', 'January 28')
    
    cy.get('[data-testid="cancellation-reason"]').select('schedule-conflict')
    cy.get('[data-testid="additional-notes"]').type('Unexpected work commitment')

    cy.intercept('DELETE', '/api/appointments/appt-789', {
      statusCode: 200,
      body: {
        success: true,
        refundEligible: true,
        refundAmount: 25
      }
    }).as('cancelAppointment')

    cy.get('[data-testid="confirm-cancellation"]').click()
    cy.wait('@cancelAppointment')

    cy.get('[data-testid="cancellation-success"]').should('contain', 'Appointment cancelled')
    cy.get('[data-testid="refund-info"]').should('contain', '$25 refund')
  })

  it('should measure appointment booking performance', () => {
    cy.window().then(win => {
      win.performance.mark('booking-start')
    })

    // Quick booking flow
    cy.get('[data-testid="book-appointment"]').click()
    
    // Mock quick responses for performance test
    cy.intercept('GET', '/api/therapists/available*', {
      statusCode: 200,
      body: { therapists: [{ id: 't1', name: 'Dr. Test' }] },
      delay: 100
    }).as('fastTherapists')

    cy.intercept('GET', '/api/therapists/t1/availability*', {
      statusCode: 200,
      body: { availability: [{ date: '2024-01-20', slots: ['14:00'] }] },
      delay: 50
    }).as('fastAvailability')

    cy.intercept('POST', '/api/appointments/book', {
      statusCode: 200,
      body: { success: true, appointmentId: 'fast-book' },
      delay: 200
    }).as('fastBooking')

    cy.wait('@fastTherapists')
    cy.get('[data-testid="therapist-t1"]').click()
    cy.get('[data-testid="select-therapist"]').click()
    
    cy.wait('@fastAvailability')
    cy.get('[data-testid="date-2024-01-20"]').click()
    cy.get('[data-testid="time-slot-14:00"]').click()
    cy.get('[data-testid="book-appointment-confirm"]').click()
    
    cy.wait('@fastBooking')
    cy.get('[data-testid="booking-success"]').should('be.visible').then(() => {
      cy.window().then(win => {
        win.performance.mark('booking-end')
        win.performance.measure('booking-flow', 'booking-start', 'booking-end')
        
        const measure = win.performance.getEntriesByName('booking-flow')[0]
        expect(measure.duration).to.be.lessThan(8000) // Booking should complete within 8 seconds
      })
    })
  })

  it('should handle appointment reminders and notifications', () => {
    // Mock upcoming appointment
    cy.intercept('GET', '/api/appointments/upcoming', {
      statusCode: 200,
      body: {
        appointments: [
          {
            id: 'appt-reminder',
            therapist: 'Dr. Sarah Smith',
            date: '2024-01-20',
            time: '15:00',
            reminderSent: false
          }
        ]
      }
    }).as('getUpcomingAppointments')

    cy.visit('/appointments/manage')
    cy.wait('@getUpcomingAppointments')

    // Test reminder preferences
    cy.get('[data-testid="reminder-settings"]').click()
    cy.get('[data-testid="reminder-email"]').check()
    cy.get('[data-testid="reminder-sms"]').check()
    cy.get('[data-testid="reminder-timing"]').select('24-hours')

    cy.intercept('PUT', '/api/appointments/appt-reminder/reminders', {
      statusCode: 200,
      body: { success: true }
    }).as('updateReminders')

    cy.get('[data-testid="save-reminder-settings"]').click()
    cy.wait('@updateReminders')

    // Simulate reminder notification
    cy.window().then(win => {
      win.postMessage({
        type: 'APPOINTMENT_REMINDER',
        data: {
          appointmentId: 'appt-reminder',
          therapist: 'Dr. Sarah Smith',
          time: '24 hours'
        }
      }, '*')
    })

    cy.get('[data-testid="reminder-notification"]').should('be.visible')
    cy.get('[data-testid="reminder-message"]').should('contain', '24 hours until your appointment')
  })

  it('should provide accessibility for appointment booking', () => {
    cy.get('[data-testid="book-appointment"]').click()
    
    // Test keyboard navigation
    cy.get('body').tab()
    cy.focused().should('have.attr', 'data-testid', 'appointment-type')
    
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'specialty-filter')
    
    // Test screen reader labels
    cy.get('[data-testid="therapist-list"]').should('have.attr', 'role', 'list')
    cy.get('[data-testid="therapist-therapist-1"]').should('have.attr', 'aria-label')
    
    // Test focus management
    cy.get('[data-testid="therapist-therapist-1"]').click()
    cy.get('[data-testid="therapist-details"]').should('have.focus')
    
    cy.checkA11y('[data-testid="appointment-booking"]', {
      rules: {
        'focus-order-semantics': { enabled: true },
        'keyboard': { enabled: true }
      }
    })
  })
})