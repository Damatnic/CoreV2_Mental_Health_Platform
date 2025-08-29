describe('User Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/auth')
    cy.get('[data-testid="register-tab"]').click()
  })

  it('should successfully register a new user', () => {
    const userData = {
      email: 'newuser@test.com',
      password: 'SecurePassword123!',
      username: 'newuser123',
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '555-123-4567'
      }
    }

    cy.fillRegistrationForm(userData)
    cy.get('[data-testid="register-button"]').click()

    // Verify successful registration
    cy.url().should('include', '/onboarding')
    cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome')
    
    // Check accessibility
    cy.checkA11y()
  })

  it('should validate required fields', () => {
    cy.get('[data-testid="register-button"]').click()
    
    // Check for validation errors
    cy.get('[data-testid="email-error"]').should('contain', 'Email is required')
    cy.get('[data-testid="password-error"]').should('contain', 'Password is required')
    cy.get('[data-testid="username-error"]').should('contain', 'Username is required')
    cy.get('[data-testid="terms-error"]').should('contain', 'You must agree to the terms')
    
    cy.checkA11y()
  })

  it('should validate email format', () => {
    cy.get('[data-testid="email-input"]').type('invalid-email')
    cy.get('[data-testid="register-button"]').click()
    
    cy.get('[data-testid="email-error"]').should('contain', 'Please enter a valid email')
  })

  it('should validate password strength', () => {
    const weakPasswords = ['123', 'password', 'Password', 'password123', 'PASSWORD123']
    
    weakPasswords.forEach(password => {
      cy.get('[data-testid="password-input"]').clear().type(password)
      cy.get('[data-testid="password-strength"]').should('contain', 'Weak')
    })
    
    // Test strong password
    cy.get('[data-testid="password-input"]').clear().type('StrongPassword123!')
    cy.get('[data-testid="password-strength"]').should('contain', 'Strong')
  })

  it('should validate password confirmation', () => {
    cy.get('[data-testid="password-input"]').type('Password123!')
    cy.get('[data-testid="confirm-password-input"]').type('DifferentPassword!')
    cy.get('[data-testid="register-button"]').click()
    
    cy.get('[data-testid="confirm-password-error"]').should('contain', 'Passwords do not match')
  })

  it('should handle existing email error', () => {
    const existingUserData = {
      email: 'existing@test.com',
      password: 'Password123!',
      username: 'existinguser',
    }

    // Mock server response for existing email
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 409,
      body: { error: 'Email already exists' }
    }).as('registerError')

    cy.fillRegistrationForm(existingUserData)
    cy.get('[data-testid="terms-checkbox"]').check()
    cy.get('[data-testid="privacy-checkbox"]').check()
    cy.get('[data-testid="register-button"]').click()

    cy.wait('@registerError')
    cy.get('[data-testid="registration-error"]').should('contain', 'Email already exists')
  })

  it('should include emergency contact information', () => {
    const userData = {
      email: 'user@test.com',
      password: 'Password123!',
      username: 'testuser',
      emergencyContact: {
        name: 'John Doe',
        phone: '555-987-6543',
        relationship: 'spouse'
      }
    }

    cy.fillRegistrationForm(userData)
    cy.get('[data-testid="emergency-contact-relationship"]').select(userData.emergencyContact.relationship)
    cy.get('[data-testid="terms-checkbox"]').check()
    cy.get('[data-testid="privacy-checkbox"]').check()
    
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: { success: true, userId: 'user123' }
    }).as('registerSuccess')

    cy.get('[data-testid="register-button"]').click()
    
    cy.wait('@registerSuccess').then((interception) => {
      expect(interception.request.body).to.have.property('emergencyContact')
      expect(interception.request.body.emergencyContact.name).to.equal('John Doe')
    })
  })

  it('should provide privacy information clearly', () => {
    // Check privacy policy link
    cy.get('[data-testid="privacy-policy-link"]').should('be.visible')
    cy.get('[data-testid="privacy-policy-link"]').click()
    
    // Should open privacy policy (in new tab or modal)
    cy.get('[data-testid="privacy-policy-content"]').should('be.visible')
    cy.get('[data-testid="privacy-policy-content"]').should('contain', 'HIPAA')
    cy.get('[data-testid="privacy-policy-content"]').should('contain', 'mental health')
    
    cy.get('[data-testid="close-privacy-policy"]').click()
  })

  it('should support keyboard navigation', () => {
    // Tab through form fields
    cy.get('[data-testid="email-input"]').focus()
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'password-input')
    
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'confirm-password-input')
    
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'username-input')
    
    // Should be able to register with Enter key
    cy.get('[data-testid="email-input"]').type('keyboard@test.com')
    cy.get('[data-testid="password-input"]').type('KeyboardTest123!')
    cy.get('[data-testid="confirm-password-input"]').type('KeyboardTest123!')
    cy.get('[data-testid="username-input"]').type('keyboarduser')
    cy.get('[data-testid="terms-checkbox"]').check()
    cy.get('[data-testid="privacy-checkbox"]').check()
    
    cy.get('[data-testid="register-button"]').focus().type('{enter}')
  })

  it('should handle registration with 2FA setup', () => {
    const userData = {
      email: '2fa@test.com',
      password: 'SecurePassword123!',
      username: '2fauser',
    }

    cy.fillRegistrationForm(userData)
    cy.get('[data-testid="enable-2fa"]').check()
    cy.get('[data-testid="terms-checkbox"]').check()
    cy.get('[data-testid="privacy-checkbox"]').check()
    
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: { 
        success: true, 
        userId: 'user123',
        twoFactorRequired: true,
        qrCode: 'data:image/png;base64,mockqrcode'
      }
    }).as('register2FA')

    cy.get('[data-testid="register-button"]').click()
    
    cy.wait('@register2FA')
    
    // Should show 2FA setup
    cy.get('[data-testid="2fa-setup"]').should('be.visible')
    cy.get('[data-testid="qr-code"]').should('be.visible')
    cy.get('[data-testid="backup-codes"]').should('be.visible')
    
    // Verify 2FA code
    cy.get('[data-testid="2fa-code"]').type('123456')
    cy.get('[data-testid="verify-2fa"]').click()
    
    cy.url().should('include', '/dashboard')
  })

  it('should validate age requirements for mental health services', () => {
    cy.get('[data-testid="age-verification"]').should('be.visible')
    
    // Try to register as under 13
    cy.get('[data-testid="birth-year"]').select('2015')
    cy.get('[data-testid="register-button"]').click()
    
    cy.get('[data-testid="age-error"]').should('contain', 'must be at least 13')
    
    // Register as minor (13-17) - should require parental consent
    cy.get('[data-testid="birth-year"]').select('2008')
    cy.get('[data-testid="register-button"]').click()
    
    cy.get('[data-testid="parental-consent"]').should('be.visible')
  })

  it('should measure registration performance', () => {
    cy.window().then(win => {
      win.performance.mark('registration-start')
    })

    const userData = {
      email: 'performance@test.com',
      password: 'PerformanceTest123!',
      username: 'perfuser',
    }

    cy.fillRegistrationForm(userData)
    cy.get('[data-testid="terms-checkbox"]').check()
    cy.get('[data-testid="privacy-checkbox"]').check()
    cy.get('[data-testid="register-button"]').click()

    cy.url().should('include', '/onboarding').then(() => {
      cy.window().then(win => {
        win.performance.mark('registration-end')
        win.performance.measure('registration-flow', 'registration-start', 'registration-end')
        
        const measure = win.performance.getEntriesByName('registration-flow')[0]
        expect(measure.duration).to.be.lessThan(10000) // Registration should complete within 10 seconds
      })
    })
  })

  it('should handle network errors gracefully', () => {
    // Simulate network error
    cy.intercept('POST', '/api/auth/register', {
      forceNetworkError: true
    }).as('networkError')

    const userData = {
      email: 'network@test.com',
      password: 'NetworkTest123!',
      username: 'networkuser',
    }

    cy.fillRegistrationForm(userData)
    cy.get('[data-testid="terms-checkbox"]').check()
    cy.get('[data-testid="privacy-checkbox"]').check()
    cy.get('[data-testid="register-button"]').click()

    // Should show network error message
    cy.get('[data-testid="network-error"]').should('be.visible')
    cy.get('[data-testid="retry-button"]').should('be.visible')
    
    // Test retry functionality
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: { success: true, userId: 'user123' }
    }).as('retrySuccess')
    
    cy.get('[data-testid="retry-button"]').click()
    cy.wait('@retrySuccess')
    cy.url().should('include', '/onboarding')
  })
})