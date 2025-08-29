describe('User Login Flow', () => {
  beforeEach(() => {
    cy.visit('/auth')
    cy.mockCrisisServices()
  })

  it('should successfully log in with valid credentials', () => {
    cy.get('[data-testid="email-input"]').type('user@test.com')
    cy.get('[data-testid="password-input"]').type('ValidPassword123!')
    cy.get('[data-testid="login-button"]').click()

    cy.url().should('include', '/dashboard')
    cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome back')
    cy.get('[data-testid="user-menu"]').should('be.visible')

    // Check accessibility
    cy.checkA11y()
  })

  it('should validate required fields', () => {
    cy.get('[data-testid="login-button"]').click()
    
    cy.get('[data-testid="email-error"]').should('contain', 'Email is required')
    cy.get('[data-testid="password-error"]').should('contain', 'Password is required')
    
    cy.checkA11y()
  })

  it('should validate email format', () => {
    cy.get('[data-testid="email-input"]').type('invalid-email')
    cy.get('[data-testid="password-input"]').type('Password123!')
    cy.get('[data-testid="login-button"]').click()
    
    cy.get('[data-testid="email-error"]').should('contain', 'Please enter a valid email')
  })

  it('should handle invalid credentials', () => {
    // Mock authentication failure
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { error: 'Invalid credentials' }
    }).as('loginError')

    cy.get('[data-testid="email-input"]').type('wrong@test.com')
    cy.get('[data-testid="password-input"]').type('WrongPassword!')
    cy.get('[data-testid="login-button"]').click()

    cy.wait('@loginError')
    cy.get('[data-testid="login-error"]').should('contain', 'Invalid credentials')
    cy.url().should('include', '/auth') // Should remain on auth page
  })

  it('should handle account lockout after multiple failed attempts', () => {
    const attemptLogin = () => {
      cy.get('[data-testid="email-input"]').clear().type('user@test.com')
      cy.get('[data-testid="password-input"]').clear().type('WrongPassword!')
      cy.get('[data-testid="login-button"]').click()
    }

    // Mock first 4 failed attempts
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { error: 'Invalid credentials', attemptsRemaining: 2 }
    }).as('loginAttempt1')

    attemptLogin()
    cy.wait('@loginAttempt1')

    // Mock final attempt that triggers lockout
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 429,
      body: { 
        error: 'Account temporarily locked due to too many failed attempts',
        lockoutExpires: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    }).as('accountLockout')

    attemptLogin()
    cy.wait('@accountLockout')

    cy.get('[data-testid="lockout-message"]').should('contain', 'Account temporarily locked')
    cy.get('[data-testid="lockout-timer"]').should('be.visible')
  })

  it('should successfully complete 2FA login flow', () => {
    // Mock initial login success with 2FA required
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        twoFactorRequired: true,
        sessionToken: 'temp-session-token'
      }
    }).as('loginWith2FA')

    cy.get('[data-testid="email-input"]').type('2fa@test.com')
    cy.get('[data-testid="password-input"]').type('SecurePassword123!')
    cy.get('[data-testid="login-button"]').click()

    cy.wait('@loginWith2FA')

    // Should show 2FA verification screen
    cy.get('[data-testid="2fa-verification"]').should('be.visible')
    cy.get('[data-testid="2fa-input"]').should('be.focused')

    // Mock 2FA verification success
    cy.intercept('POST', '/api/auth/verify-2fa', {
      statusCode: 200,
      body: {
        success: true,
        accessToken: 'valid-access-token',
        user: { id: 'user123', email: '2fa@test.com' }
      }
    }).as('verify2FA')

    // Enter 2FA code
    cy.get('[data-testid="2fa-input"]').type('123456')
    cy.get('[data-testid="verify-2fa-button"]').click()

    cy.wait('@verify2FA')

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard')
    cy.get('[data-testid="user-menu"]').should('be.visible')
  })

  it('should handle invalid 2FA codes', () => {
    // Set up 2FA flow
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { success: true, twoFactorRequired: true }
    }).as('loginWith2FA')

    cy.get('[data-testid="email-input"]').type('2fa@test.com')
    cy.get('[data-testid="password-input"]').type('SecurePassword123!')
    cy.get('[data-testid="login-button"]').click()
    cy.wait('@loginWith2FA')

    // Mock invalid 2FA code
    cy.intercept('POST', '/api/auth/verify-2fa', {
      statusCode: 401,
      body: { error: 'Invalid 2FA code', attemptsRemaining: 2 }
    }).as('invalid2FA')

    cy.get('[data-testid="2fa-input"]').type('000000')
    cy.get('[data-testid="verify-2fa-button"]').click()

    cy.wait('@invalid2FA')
    cy.get('[data-testid="2fa-error"]').should('contain', 'Invalid 2FA code')
    cy.get('[data-testid="attempts-remaining"]').should('contain', '2 attempts remaining')
  })

  it('should provide backup code option for 2FA', () => {
    // Set up 2FA flow
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { success: true, twoFactorRequired: true }
    }).as('loginWith2FA')

    cy.loginAsUser('2fa@test.com', 'SecurePassword123!')
    cy.wait('@loginWith2FA')

    // Click backup code option
    cy.get('[data-testid="use-backup-code"]').click()
    cy.get('[data-testid="backup-code-input"]').should('be.visible')

    // Mock backup code verification
    cy.intercept('POST', '/api/auth/verify-backup-code', {
      statusCode: 200,
      body: {
        success: true,
        accessToken: 'valid-access-token',
        backupCodeUsed: true
      }
    }).as('verifyBackupCode')

    cy.get('[data-testid="backup-code-input"]').type('BACKUP123456')
    cy.get('[data-testid="verify-backup-code-button"]').click()

    cy.wait('@verifyBackupCode')
    cy.url().should('include', '/dashboard')

    // Should show backup code used warning
    cy.get('[data-testid="backup-code-warning"]').should('contain', 'backup code has been used')
  })

  it('should support password reset flow', () => {
    cy.get('[data-testid="forgot-password-link"]').click()
    
    cy.get('[data-testid="reset-password-modal"]').should('be.visible')
    cy.get('[data-testid="reset-email-input"]').type('forgot@test.com')

    // Mock password reset request
    cy.intercept('POST', '/api/auth/forgot-password', {
      statusCode: 200,
      body: { message: 'Password reset email sent' }
    }).as('forgotPassword')

    cy.get('[data-testid="send-reset-button"]').click()
    cy.wait('@forgotPassword')

    cy.get('[data-testid="reset-confirmation"]').should('contain', 'Password reset email sent')
    cy.get('[data-testid="check-email-message"]').should('be.visible')
  })

  it('should maintain session across page reloads', () => {
    cy.loginAsUser()
    
    // Reload the page
    cy.reload()
    
    // Should still be logged in
    cy.url().should('include', '/dashboard')
    cy.get('[data-testid="user-menu"]').should('be.visible')
  })

  it('should handle session expiration gracefully', () => {
    cy.loginAsUser()
    
    // Mock session expiration
    cy.window().then(win => {
      win.localStorage.setItem('sessionExpiry', (Date.now() - 1000).toString())
    })

    // Navigate to a protected route
    cy.visit('/mood-tracker')
    
    // Should redirect to auth with session expired message
    cy.url().should('include', '/auth')
    cy.get('[data-testid="session-expired"]').should('be.visible')
    cy.get('[data-testid="session-expired"]').should('contain', 'session has expired')
  })

  it('should support remember me functionality', () => {
    cy.get('[data-testid="email-input"]').type('remember@test.com')
    cy.get('[data-testid="password-input"]').type('RememberPassword123!')
    cy.get('[data-testid="remember-me"]').check()

    // Mock successful login with extended session
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        accessToken: 'extended-token',
        refreshToken: 'remember-refresh-token',
        expiresIn: 2592000 // 30 days
      }
    }).as('rememberLogin')

    cy.get('[data-testid="login-button"]').click()
    cy.wait('@rememberLogin')

    // Verify extended session is stored
    cy.window().then(win => {
      expect(win.localStorage.getItem('rememberMe')).to.equal('true')
      expect(win.localStorage.getItem('refreshToken')).to.exist
    })
  })

  it('should support keyboard navigation', () => {
    // Tab through form fields
    cy.get('body').tab()
    cy.focused().should('have.attr', 'data-testid', 'email-input')
    
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'password-input')
    
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'remember-me')
    
    cy.focused().tab()
    cy.focused().should('have.attr', 'data-testid', 'login-button')

    // Should be able to login with Enter key
    cy.get('[data-testid="email-input"]').type('keyboard@test.com')
    cy.get('[data-testid="password-input"]').type('KeyboardLogin123!')
    cy.get('[data-testid="login-button"]').focus().type('{enter}')
  })

  it('should measure login performance', () => {
    cy.window().then(win => {
      win.performance.mark('login-start')
    })

    cy.get('[data-testid="email-input"]').type('performance@test.com')
    cy.get('[data-testid="password-input"]').type('PerformanceTest123!')
    cy.get('[data-testid="login-button"]').click()

    cy.url().should('include', '/dashboard').then(() => {
      cy.window().then(win => {
        win.performance.mark('login-end')
        win.performance.measure('login-flow', 'login-start', 'login-end')
        
        const measure = win.performance.getEntriesByName('login-flow')[0]
        expect(measure.duration).to.be.lessThan(5000) // Login should complete within 5 seconds
      })
    })
  })

  it('should handle network errors gracefully', () => {
    // Simulate network error
    cy.intercept('POST', '/api/auth/login', {
      forceNetworkError: true
    }).as('networkError')

    cy.get('[data-testid="email-input"]').type('network@test.com')
    cy.get('[data-testid="password-input"]').type('NetworkTest123!')
    cy.get('[data-testid="login-button"]').click()

    // Should show network error message
    cy.get('[data-testid="network-error"]').should('be.visible')
    cy.get('[data-testid="retry-button"]').should('be.visible')
    
    // Test retry functionality
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { success: true, accessToken: 'retry-token' }
    }).as('retrySuccess')
    
    cy.get('[data-testid="retry-button"]').click()
    cy.wait('@retrySuccess')
    cy.url().should('include', '/dashboard')
  })

  it('should redirect to intended page after login', () => {
    // Try to access protected page while logged out
    cy.visit('/mood-tracker')
    
    // Should redirect to auth with return URL
    cy.url().should('include', '/auth')
    cy.url().should('include', 'returnTo=%2Fmood-tracker')

    // Login successfully
    cy.loginAsUser()

    // Should redirect to originally intended page
    cy.url().should('include', '/mood-tracker')
    cy.get('[data-testid="mood-tracker-dashboard"]').should('be.visible')
  })

  it('should prevent brute force attacks', () => {
    // Mock rate limiting response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 429,
      body: { 
        error: 'Too many login attempts',
        retryAfter: 60
      }
    }).as('rateLimited')

    cy.get('[data-testid="email-input"]').type('brute@test.com')
    cy.get('[data-testid="password-input"]').type('BruteForce123!')
    cy.get('[data-testid="login-button"]').click()

    cy.wait('@rateLimited')
    cy.get('[data-testid="rate-limit-error"]').should('contain', 'Too many login attempts')
    cy.get('[data-testid="retry-after"]').should('contain', '60 seconds')
    cy.get('[data-testid="login-button"]').should('be.disabled')
  })
})