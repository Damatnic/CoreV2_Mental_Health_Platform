/**
 * Mobile Accessibility Testing Procedures
 * Comprehensive testing framework for mobile accessibility features
 * Ensures crisis-critical features are accessible to all users
 */

const MobileAccessibilityTestProcedures = {
  // Test configuration
  config: {
    testEnvironments: ['iOS', 'Android', 'Mobile Web'],
    screenReaders: ['VoiceOver', 'TalkBack', 'NVDA Mobile'],
    assistiveTech: ['Switch Control', 'Voice Control', 'External Keyboard'],
    deviceTypes: ['Phone', 'Tablet', 'Foldable'],
    orientations: ['Portrait', 'Landscape'],
    networkConditions: ['4G', '3G', 'Offline'],
    batteryStates: ['Normal', 'Low Power Mode', 'Critical']
  },

  // Test results storage
  results: {
    passed: [],
    failed: [],
    warnings: [],
    metrics: {},
    timestamp: null,
    deviceInfo: {}
  },

  /**
   * 1. SCREEN READER TESTING PROCEDURES
   */
  screenReaderTests: {
    // Test 1.1: Crisis Button Announcement
    testCrisisButtonAnnouncement: async function() {
      const testName = 'Crisis Button Screen Reader Announcement';
      console.log(`🔊 Testing: ${testName}`);
      
      try {
        // Find crisis button
        const crisisButton = document.querySelector('.crisis-fab, .crisis-button, [aria-label*="crisis"]');
        
        if (!crisisButton) {
          throw new Error('Crisis button not found');
        }

        // Check for proper ARIA label
        const ariaLabel = crisisButton.getAttribute('aria-label');
        const hasProperLabel = ariaLabel && ariaLabel.length > 10;
        
        // Check for role
        const role = crisisButton.getAttribute('role') || crisisButton.tagName.toLowerCase();
        const hasProperRole = ['button', 'link'].includes(role);
        
        // Check for state announcements
        const ariaPressed = crisisButton.getAttribute('aria-pressed');
        const ariaExpanded = crisisButton.getAttribute('aria-expanded');
        const hasStateInfo = ariaPressed !== null || ariaExpanded !== null;
        
        if (hasProperLabel && hasProperRole) {
          this.results.passed.push({
            test: testName,
            details: `Label: "${ariaLabel}", Role: ${role}`
          });
        } else {
          this.results.failed.push({
            test: testName,
            reason: 'Inadequate screen reader support',
            fix: 'Add descriptive aria-label and proper role'
          });
        }
        
        if (!hasStateInfo) {
          this.results.warnings.push({
            test: testName,
            message: 'No state information for screen readers',
            fix: 'Add aria-pressed or aria-expanded attributes'
          });
        }
        
      } catch (error) {
        this.results.failed.push({
          test: testName,
          error: error.message
        });
      }
    },

    // Test 1.2: Navigation Landmarks
    testNavigationLandmarks: async function() {
      const testName = 'Navigation Landmarks for Screen Readers';
      console.log(`🔊 Testing: ${testName}`);
      
      const requiredLandmarks = {
        'main': 'Main content area',
        'navigation': 'Navigation menu',
        'banner': 'Header/Banner',
        'contentinfo': 'Footer information'
      };
      
      const missingLandmarks = [];
      
      Object.entries(requiredLandmarks).forEach(([landmark, description]) => {
        const element = document.querySelector(`[role="${landmark}"]`) || 
                       document.querySelector(landmark);
        
        if (!element) {
          missingLandmarks.push(`${landmark} (${description})`);
        }
      });
      
      if (missingLandmarks.length === 0) {
        this.results.passed.push({
          test: testName,
          details: 'All required landmarks present'
        });
      } else {
        this.results.failed.push({
          test: testName,
          missing: missingLandmarks,
          fix: 'Add missing ARIA landmarks or HTML5 semantic elements'
        });
      }
    },

    // Test 1.3: Form Labels
    testFormLabels: async function() {
      const testName = 'Form Input Labels for Screen Readers';
      console.log(`🔊 Testing: ${testName}`);
      
      const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
      const unlabeledInputs = [];
      
      inputs.forEach(input => {
        const id = input.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledby = input.getAttribute('aria-labelledby');
        const placeholder = input.getAttribute('placeholder');
        
        if (!label && !ariaLabel && !ariaLabelledby) {
          unlabeledInputs.push({
            element: input,
            type: input.type || input.tagName,
            placeholder: placeholder || 'none'
          });
        }
      });
      
      if (unlabeledInputs.length === 0) {
        this.results.passed.push({
          test: testName,
          details: `All ${inputs.length} inputs properly labeled`
        });
      } else {
        this.results.failed.push({
          test: testName,
          unlabeled: unlabeledInputs.length,
          total: inputs.length,
          fix: 'Add labels or aria-label attributes to all inputs'
        });
      }
    },

    // Test 1.4: Dynamic Content Announcements
    testDynamicAnnouncements: async function() {
      const testName = 'Dynamic Content Announcements';
      console.log(`🔊 Testing: ${testName}`);
      
      const liveRegions = document.querySelectorAll('[aria-live]');
      const alerts = document.querySelectorAll('[role="alert"], [role="status"]');
      
      if (liveRegions.length > 0 || alerts.length > 0) {
        this.results.passed.push({
          test: testName,
          details: `Found ${liveRegions.length} live regions, ${alerts.length} alerts`
        });
      } else {
        this.results.warnings.push({
          test: testName,
          message: 'No ARIA live regions found for dynamic updates',
          fix: 'Add aria-live regions for important updates'
        });
      }
    }
  },

  /**
   * 2. TOUCH ACCESSIBILITY TESTING
   */
  touchAccessibilityTests: {
    // Test 2.1: Touch Target Sizes
    testTouchTargetSizes: async function() {
      const testName = 'Touch Target Size Compliance';
      console.log(`👆 Testing: ${testName}`);
      
      const minSize = 44; // WCAG minimum
      const preferredSize = 48;
      const interactiveElements = document.querySelectorAll('button, a, input, [role="button"], [tabindex]:not([tabindex="-1"])');
      
      const tooSmall = [];
      const suboptimal = [];
      
      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        if (width < minSize || height < minSize) {
          tooSmall.push({
            element: element,
            size: `${Math.round(width)}x${Math.round(height)}px`,
            label: element.textContent || element.getAttribute('aria-label') || 'unnamed'
          });
        } else if (width < preferredSize || height < preferredSize) {
          suboptimal.push({
            element: element,
            size: `${Math.round(width)}x${Math.round(height)}px`
          });
        }
      });
      
      if (tooSmall.length === 0) {
        this.results.passed.push({
          test: testName,
          details: `All ${interactiveElements.length} targets meet minimum size`
        });
      } else {
        this.results.failed.push({
          test: testName,
          tooSmall: tooSmall.length,
          details: tooSmall
        });
      }
      
      if (suboptimal.length > 0) {
        this.results.warnings.push({
          test: testName,
          suboptimal: suboptimal.length,
          message: 'Some targets below preferred size (48px)'
        });
      }
    },

    // Test 2.2: Touch Target Spacing
    testTouchTargetSpacing: async function() {
      const testName = 'Touch Target Spacing';
      console.log(`👆 Testing: ${testName}`);
      
      const minSpacing = 8; // Minimum spacing in pixels
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const tooClose = [];
      
      buttons.forEach((button, index) => {
        const rect1 = button.getBoundingClientRect();
        
        // Check spacing with siblings
        const siblings = Array.from(button.parentElement?.children || [])
          .filter(child => child !== button && (
            child.tagName === 'BUTTON' || 
            child.tagName === 'A' || 
            child.getAttribute('role') === 'button'
          ));
        
        siblings.forEach(sibling => {
          const rect2 = sibling.getBoundingClientRect();
          
          const horizontalGap = Math.min(
            Math.abs(rect1.right - rect2.left),
            Math.abs(rect2.right - rect1.left)
          );
          
          const verticalGap = Math.min(
            Math.abs(rect1.bottom - rect2.top),
            Math.abs(rect2.bottom - rect1.top)
          );
          
          if (horizontalGap < minSpacing || verticalGap < minSpacing) {
            tooClose.push({
              element1: button.textContent || 'Button 1',
              element2: sibling.textContent || 'Button 2',
              gap: Math.min(horizontalGap, verticalGap)
            });
          }
        });
      });
      
      if (tooClose.length === 0) {
        this.results.passed.push({
          test: testName,
          details: 'All touch targets have adequate spacing'
        });
      } else {
        this.results.failed.push({
          test: testName,
          violations: tooClose.length,
          details: tooClose
        });
      }
    },

    // Test 2.3: Gesture Alternatives
    testGestureAlternatives: async function() {
      const testName = 'Gesture Alternative Controls';
      console.log(`👆 Testing: ${testName}`);
      
      // Check for swipe-only interfaces
      const swipeElements = document.querySelectorAll('[class*="swipe"], [class*="carousel"], .slider');
      const missingAlternatives = [];
      
      swipeElements.forEach(element => {
        const buttons = element.querySelectorAll('button, [role="button"]');
        const hasNavButtons = buttons.length >= 2; // Previous/Next buttons
        
        if (!hasNavButtons) {
          missingAlternatives.push({
            element: element.className,
            issue: 'No button alternatives for swipe gestures'
          });
        }
      });
      
      // Check for drag interfaces
      const dragElements = document.querySelectorAll('[draggable="true"], [class*="drag"]');
      dragElements.forEach(element => {
        const hasAlternative = element.querySelector('button, select, input');
        if (!hasAlternative) {
          missingAlternatives.push({
            element: element.className,
            issue: 'No alternative for drag interaction'
          });
        }
      });
      
      if (missingAlternatives.length === 0) {
        this.results.passed.push({
          test: testName,
          details: 'All gesture interactions have alternatives'
        });
      } else {
        this.results.failed.push({
          test: testName,
          missing: missingAlternatives
        });
      }
    }
  },

  /**
   * 3. CRISIS ACCESSIBILITY TESTING
   */
  crisisAccessibilityTests: {
    // Test 3.1: Crisis Button Visibility
    testCrisisButtonVisibility: async function() {
      const testName = 'Crisis Button Visibility and Persistence';
      console.log(`🚨 Testing: ${testName}`);
      
      const crisisButton = document.querySelector('.crisis-fab, .crisis-button, [aria-label*="crisis"]');
      
      if (!crisisButton) {
        this.results.failed.push({
          test: testName,
          error: 'No crisis button found',
          severity: 'CRITICAL'
        });
        return;
      }
      
      const style = window.getComputedStyle(crisisButton);
      const rect = crisisButton.getBoundingClientRect();
      
      // Check visibility
      const isVisible = style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0' &&
                       rect.width > 0 && 
                       rect.height > 0;
      
      // Check if in viewport
      const inViewport = rect.top >= 0 && 
                        rect.left >= 0 && 
                        rect.bottom <= window.innerHeight && 
                        rect.right <= window.innerWidth;
      
      // Check if fixed/sticky positioned
      const isPersistent = style.position === 'fixed' || style.position === 'sticky';
      
      if (isVisible && (inViewport || isPersistent)) {
        this.results.passed.push({
          test: testName,
          details: `Button visible, position: ${style.position}`
        });
      } else {
        this.results.failed.push({
          test: testName,
          visible: isVisible,
          inViewport: inViewport,
          persistent: isPersistent,
          severity: 'CRITICAL'
        });
      }
    },

    // Test 3.2: Emergency Contact Access
    testEmergencyContactAccess: async function() {
      const testName = 'Emergency Contact Accessibility';
      console.log(`🚨 Testing: ${testName}`);
      
      // Check for emergency phone links
      const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
      const emergencyNumbers = ['911', '988', '741741'];
      const foundNumbers = [];
      
      phoneLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        emergencyNumbers.forEach(number => {
          if (href.includes(number)) {
            foundNumbers.push(number);
          }
        });
      });
      
      // Check for text support
      const textLinks = document.querySelectorAll('a[href^="sms:"]');
      const hasTextSupport = textLinks.length > 0;
      
      if (foundNumbers.length >= 2) {
        this.results.passed.push({
          test: testName,
          details: `Found emergency contacts: ${foundNumbers.join(', ')}`
        });
      } else {
        this.results.failed.push({
          test: testName,
          found: foundNumbers,
          missing: emergencyNumbers.filter(n => !foundNumbers.includes(n)),
          severity: 'HIGH'
        });
      }
      
      if (!hasTextSupport) {
        this.results.warnings.push({
          test: testName,
          message: 'No SMS/text support links found'
        });
      }
    },

    // Test 3.3: Crisis Response Time
    testCrisisResponseTime: async function() {
      const testName = 'Crisis Feature Response Time';
      console.log(`🚨 Testing: ${testName}`);
      
      const crisisButton = document.querySelector('.crisis-fab, .crisis-button');
      
      if (!crisisButton) return;
      
      // Measure time to activate crisis features
      const startTime = performance.now();
      
      // Simulate click
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      crisisButton.dispatchEvent(clickEvent);
      
      // Wait for crisis UI to appear
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const crisisUI = document.querySelector('.crisis-kit-overlay, .crisis-quick-access, [role="dialog"]');
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (crisisUI && responseTime < 300) {
        this.results.passed.push({
          test: testName,
          responseTime: `${responseTime.toFixed(2)}ms`
        });
      } else if (crisisUI && responseTime < 1000) {
        this.results.warnings.push({
          test: testName,
          responseTime: `${responseTime.toFixed(2)}ms`,
          message: 'Response time could be improved'
        });
      } else {
        this.results.failed.push({
          test: testName,
          responseTime: crisisUI ? `${responseTime.toFixed(2)}ms` : 'UI not found',
          severity: 'HIGH'
        });
      }
    }
  },

  /**
   * 4. COGNITIVE ACCESSIBILITY TESTING
   */
  cognitiveAccessibilityTests: {
    // Test 4.1: Language Complexity
    testLanguageComplexity: async function() {
      const testName = 'Language Complexity Check';
      console.log(`🧠 Testing: ${testName}`);
      
      // Get all text content
      const textElements = document.querySelectorAll('p, li, label, button, a');
      const complexTerms = [
        'authenticate', 'initialize', 'configure', 'parameter', 
        'validate', 'synchronize', 'optimize', 'deprecated'
      ];
      
      const foundComplexTerms = [];
      
      textElements.forEach(element => {
        const text = element.textContent?.toLowerCase() || '';
        complexTerms.forEach(term => {
          if (text.includes(term)) {
            foundComplexTerms.push({
              term: term,
              context: text.substring(0, 50)
            });
          }
        });
      });
      
      if (foundComplexTerms.length === 0) {
        this.results.passed.push({
          test: testName,
          details: 'No complex technical terms found'
        });
      } else {
        this.results.warnings.push({
          test: testName,
          complexTerms: foundComplexTerms.length,
          examples: foundComplexTerms.slice(0, 3)
        });
      }
    },

    // Test 4.2: Error Message Clarity
    testErrorMessageClarity: async function() {
      const testName = 'Error Message Clarity';
      console.log(`🧠 Testing: ${testName}`);
      
      const errorElements = document.querySelectorAll('.error, .alert, [role="alert"]');
      const issues = [];
      
      errorElements.forEach(element => {
        const text = element.textContent || '';
        
        // Check length
        if (text.length > 150) {
          issues.push({
            issue: 'Too long',
            length: text.length
          });
        }
        
        // Check for actionable language
        const hasAction = /please|try|click|tap|select|enter|check/i.test(text);
        if (!hasAction && text.length > 20) {
          issues.push({
            issue: 'No clear action',
            text: text.substring(0, 50)
          });
        }
        
        // Check for technical jargon
        const hasTechnical = /error code|exception|null|undefined|stack/i.test(text);
        if (hasTechnical) {
          issues.push({
            issue: 'Technical jargon',
            text: text.substring(0, 50)
          });
        }
      });
      
      if (issues.length === 0) {
        this.results.passed.push({
          test: testName,
          details: 'Error messages are clear and actionable'
        });
      } else {
        this.results.failed.push({
          test: testName,
          issues: issues
        });
      }
    },

    // Test 4.3: Timeout Extensions
    testTimeoutExtensions: async function() {
      const testName = 'Timeout Extension Options';
      console.log(`🧠 Testing: ${testName}`);
      
      // Look for forms and timed content
      const forms = document.querySelectorAll('form');
      const timedElements = document.querySelectorAll('[class*="timeout"], [class*="timer"], [class*="countdown"]');
      
      let hasTimeoutWarning = false;
      let hasExtensionOption = false;
      
      // Check for timeout warnings
      const warningText = document.body.textContent || '';
      hasTimeoutWarning = /timeout|session|expire/i.test(warningText);
      
      // Check for extension controls
      const extensionButtons = document.querySelectorAll('[class*="extend"], button:contains("extend"), button:contains("more time")');
      hasExtensionOption = extensionButtons.length > 0;
      
      if (forms.length > 0 || timedElements.length > 0) {
        if (hasTimeoutWarning && hasExtensionOption) {
          this.results.passed.push({
            test: testName,
            details: 'Timeout warnings and extensions available'
          });
        } else {
          this.results.warnings.push({
            test: testName,
            hasWarning: hasTimeoutWarning,
            hasExtension: hasExtensionOption,
            message: 'Consider adding timeout warnings and extension options'
          });
        }
      }
    }
  },

  /**
   * 5. VISUAL ACCESSIBILITY TESTING
   */
  visualAccessibilityTests: {
    // Test 5.1: Zoom Capability
    testZoomCapability: async function() {
      const testName = 'Pinch-to-Zoom Capability';
      console.log(`👁️ Testing: ${testName}`);
      
      const viewport = document.querySelector('meta[name="viewport"]');
      
      if (!viewport) {
        this.results.warnings.push({
          test: testName,
          message: 'No viewport meta tag found'
        });
        return;
      }
      
      const content = viewport.getAttribute('content') || '';
      const disablesZoom = content.includes('user-scalable=no') || 
                          content.includes('user-scalable=0') ||
                          content.includes('maximum-scale=1');
      
      if (disablesZoom) {
        this.results.failed.push({
          test: testName,
          content: content,
          severity: 'CRITICAL',
          fix: 'Remove user-scalable=no and maximum-scale restrictions'
        });
      } else {
        this.results.passed.push({
          test: testName,
          details: 'Zoom is enabled'
        });
      }
    },

    // Test 5.2: Color Contrast
    testColorContrast: async function() {
      const testName = 'Color Contrast Ratios';
      console.log(`👁️ Testing: ${testName}`);
      
      // Sample text elements for contrast checking
      const textElements = document.querySelectorAll('p, span, button, a');
      const lowContrast = [];
      
      // Simple contrast check (would need full implementation)
      textElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const bgColor = style.backgroundColor;
        
        // Basic check for same color text and background
        if (color === bgColor && bgColor !== 'transparent') {
          lowContrast.push({
            element: element.tagName,
            issue: 'Same color text and background'
          });
        }
      });
      
      if (lowContrast.length === 0) {
        this.results.passed.push({
          test: testName,
          details: 'No obvious contrast issues found'
        });
      } else {
        this.results.failed.push({
          test: testName,
          issues: lowContrast
        });
      }
    },

    // Test 5.3: Focus Indicators
    testFocusIndicators: async function() {
      const testName = 'Visible Focus Indicators';
      console.log(`👁️ Testing: ${testName}`);
      
      const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
      const missingFocus = [];
      
      focusableElements.forEach(element => {
        // Temporarily focus to check styles
        const originalFocus = document.activeElement;
        (element as HTMLElement).focus();
        
        const focusStyle = window.getComputedStyle(element);
        const hasOutline = focusStyle.outline !== 'none' && focusStyle.outline !== '0';
        const hasBoxShadow = focusStyle.boxShadow !== 'none';
        const hasBorderChange = focusStyle.borderColor !== window.getComputedStyle(element, null).borderColor;
        
        if (!hasOutline && !hasBoxShadow && !hasBorderChange) {
          missingFocus.push({
            element: element.tagName,
            class: element.className
          });
        }
        
        // Restore focus
        if (originalFocus instanceof HTMLElement) {
          originalFocus.focus();
        }
      });
      
      if (missingFocus.length === 0) {
        this.results.passed.push({
          test: testName,
          details: 'All focusable elements have visible indicators'
        });
      } else {
        this.results.failed.push({
          test: testName,
          missing: missingFocus.length,
          total: focusableElements.length
        });
      }
    }
  },

  /**
   * 6. MOTOR ACCESSIBILITY TESTING
   */
  motorAccessibilityTests: {
    // Test 6.1: One-Handed Operation
    testOneHandedOperation: async function() {
      const testName = 'One-Handed Operation Feasibility';
      console.log(`🤚 Testing: ${testName}`);
      
      // Check if important controls are reachable with thumb
      const importantControls = document.querySelectorAll('.crisis-button, .nav-button, .submit-btn, [aria-label*="important"]');
      const unreachable = [];
      
      importantControls.forEach(control => {
        const rect = control.getBoundingClientRect();
        const screenHeight = window.innerHeight;
        
        // Check if control is in thumb-reachable zone (bottom 60% of screen)
        if (rect.top < screenHeight * 0.4) {
          unreachable.push({
            element: control.textContent || control.getAttribute('aria-label'),
            position: `Top: ${rect.top}px`
          });
        }
      });
      
      if (unreachable.length === 0) {
        this.results.passed.push({
          test: testName,
          details: 'All important controls are thumb-reachable'
        });
      } else {
        this.results.warnings.push({
          test: testName,
          unreachable: unreachable.length,
          details: unreachable
        });
      }
    },

    // Test 6.2: Switch Control Compatibility
    testSwitchControlCompatibility: async function() {
      const testName = 'Switch Control Compatibility';
      console.log(`🤚 Testing: ${testName}`);
      
      // Check for proper focus order
      const focusableElements = Array.from(document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'));
      const tabIndexIssues = [];
      
      focusableElements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex && parseInt(tabIndex) > 0) {
          tabIndexIssues.push({
            element: element.tagName,
            tabIndex: tabIndex,
            issue: 'Positive tabindex disrupts natural flow'
          });
        }
      });
      
      // Check for keyboard shortcuts
      const hasKeyboardShortcuts = document.querySelectorAll('[accesskey]').length > 0;
      
      if (tabIndexIssues.length === 0) {
        this.results.passed.push({
          test: testName,
          details: 'Natural focus order maintained'
        });
      } else {
        this.results.warnings.push({
          test: testName,
          issues: tabIndexIssues
        });
      }
      
      if (hasKeyboardShortcuts) {
        this.results.passed.push({
          test: testName + ' - Shortcuts',
          details: 'Keyboard shortcuts available'
        });
      }
    }
  },

  /**
   * Run all test suites
   */
  async runAllTests() {
    console.log('📱 Starting Comprehensive Mobile Accessibility Testing\n');
    console.log('================================================\n');
    
    this.results.timestamp = new Date().toISOString();
    this.results.deviceInfo = {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      pixelRatio: window.devicePixelRatio,
      touchPoints: navigator.maxTouchPoints
    };
    
    // Run all test suites
    const testSuites = [
      { name: 'Screen Reader', tests: this.screenReaderTests },
      { name: 'Touch Accessibility', tests: this.touchAccessibilityTests },
      { name: 'Crisis Accessibility', tests: this.crisisAccessibilityTests },
      { name: 'Cognitive Accessibility', tests: this.cognitiveAccessibilityTests },
      { name: 'Visual Accessibility', tests: this.visualAccessibilityTests },
      { name: 'Motor Accessibility', tests: this.motorAccessibilityTests }
    ];
    
    for (const suite of testSuites) {
      console.log(`\n📋 Running ${suite.name} Tests...\n`);
      
      for (const [testName, testFunc] of Object.entries(suite.tests)) {
        if (typeof testFunc === 'function') {
          await testFunc.call(this);
        }
      }
    }
    
    // Generate summary
    this.generateSummary();
    
    return this.results;
  },

  /**
   * Generate test summary report
   */
  generateSummary() {
    const totalTests = this.results.passed.length + this.results.failed.length;
    const passRate = totalTests > 0 ? (this.results.passed.length / totalTests * 100).toFixed(1) : 0;
    
    console.log('\n📊 TEST SUMMARY');
    console.log('=====================================');
    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    console.log(`📈 Pass Rate: ${passRate}%`);
    
    // Critical failures
    const criticalFailures = this.results.failed.filter(f => f.severity === 'CRITICAL');
    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL FAILURES:');
      criticalFailures.forEach(failure => {
        console.log(`  - ${failure.test}: ${failure.error || failure.reason}`);
      });
    }
    
    // High priority failures
    const highFailures = this.results.failed.filter(f => f.severity === 'HIGH');
    if (highFailures.length > 0) {
      console.log('\n⚠️ HIGH PRIORITY ISSUES:');
      highFailures.forEach(failure => {
        console.log(`  - ${failure.test}`);
      });
    }
    
    // Save results
    this.saveResults();
  },

  /**
   * Save test results
   */
  saveResults() {
    // Save to localStorage
    localStorage.setItem('mobile-accessibility-test-results', JSON.stringify(this.results));
    
    // Create downloadable report
    const blob = new Blob([JSON.stringify(this.results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = this.results.timestamp.replace(/[:.]/g, '-');
    
    console.log(`\n📥 Download test results: ${url}`);
    console.log(`   Filename: mobile-accessibility-test-${timestamp}.json`);
    
    // Auto-download if critical failures
    const criticalFailures = this.results.failed.filter(f => f.severity === 'CRITICAL');
    if (criticalFailures.length > 0) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `mobile-accessibility-test-${timestamp}.json`;
      a.click();
      console.log('⚠️ Critical failures detected - report auto-downloaded');
    }
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileAccessibilityTestProcedures;
}

// Auto-run if on mobile
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Mobile device detected. Run MobileAccessibilityTestProcedures.runAllTests() to start testing.');
    });
  } else {
    console.log('Mobile device detected. Run MobileAccessibilityTestProcedures.runAllTests() to start testing.');
  }
}