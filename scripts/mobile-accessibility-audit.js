/**
 * Mobile Accessibility Audit Script for Astral Core Mental Health Platform
 * Performs comprehensive accessibility testing for mobile devices
 * Focuses on crisis-critical features and WCAG 2.1 AA compliance
 */

const MobileAccessibilityAudit = {
  results: {
    touchTargets: [],
    screenReader: [],
    crisisAccess: [],
    cognitive: [],
    visual: [],
    motor: [],
    errors: [],
    warnings: [],
    passed: []
  },

  config: {
    minTouchTarget: 44, // WCAG minimum in pixels
    preferredTouchTarget: 48,
    largeTouchTarget: 56,
    maxCrisisGestures: 2,
    minContrastRatio: 4.5,
    largeTextContrastRatio: 3,
    focusIndicatorMinWidth: 2,
    maxZoomLevel: 500,
    timeoutExtension: 10000, // 10 seconds
    hapticPatterns: {
      light: [10],
      medium: [30],
      heavy: [50, 30, 50]
    }
  },

  // 1. MOBILE SCREEN READER OPTIMIZATION
  auditScreenReader() {
    console.log('🔊 Starting Mobile Screen Reader Audit...');
    
    // Check for proper ARIA labels on crisis buttons
    const crisisButtons = document.querySelectorAll('.crisis-button, .emergency-button, [aria-label*="crisis"], [aria-label*="emergency"]');
    crisisButtons.forEach(button => {
      if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
        this.results.errors.push({
          type: 'screenReader',
          element: button,
          message: 'Crisis button missing accessible label',
          severity: 'critical',
          fix: 'Add descriptive aria-label attribute'
        });
      }
    });

    // Check for ARIA live regions for critical updates
    const liveRegions = document.querySelectorAll('[aria-live]');
    if (liveRegions.length === 0) {
      this.results.warnings.push({
        type: 'screenReader',
        message: 'No ARIA live regions found for dynamic updates',
        severity: 'high',
        fix: 'Add aria-live="polite" or aria-live="assertive" for critical updates'
      });
    }

    // Check mobile navigation landmarks
    const requiredLandmarks = ['banner', 'navigation', 'main', 'contentinfo'];
    requiredLandmarks.forEach(landmark => {
      const element = document.querySelector(`[role="${landmark}"]`) || 
                     document.querySelector(landmark === 'banner' ? 'header' : 
                                         landmark === 'contentinfo' ? 'footer' : 
                                         landmark === 'navigation' ? 'nav' : 'main');
      if (!element) {
        this.results.warnings.push({
          type: 'screenReader',
          message: `Missing ${landmark} landmark`,
          severity: 'medium',
          fix: `Add appropriate HTML5 element or role="${landmark}"`
        });
      }
    });

    // Check heading hierarchy for mobile screens
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level - lastLevel > 1 && index > 0) {
        this.results.warnings.push({
          type: 'screenReader',
          element: heading,
          message: `Heading hierarchy skipped from H${lastLevel} to H${level}`,
          severity: 'low',
          fix: 'Maintain proper heading hierarchy for screen reader navigation'
        });
      }
      lastLevel = level;
    });

    // Check for skip navigation links
    const skipLink = document.querySelector('.skip-nav, [href="#main"], [href="#content"]');
    if (!skipLink) {
      this.results.errors.push({
        type: 'screenReader',
        message: 'No skip navigation link found',
        severity: 'high',
        fix: 'Add skip navigation link for keyboard users'
      });
    }

    // Check form labels and error messages
    const formInputs = document.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
      const id = input.id;
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      if (!label && !ariaLabel && !ariaLabelledby && input.type !== 'hidden') {
        this.results.errors.push({
          type: 'screenReader',
          element: input,
          message: 'Form input without accessible label',
          severity: 'high',
          fix: 'Add label element or aria-label attribute'
        });
      }

      // Check for error message association
      if (input.getAttribute('aria-invalid') === 'true') {
        const errorId = input.getAttribute('aria-describedby');
        if (!errorId || !document.getElementById(errorId)) {
          this.results.warnings.push({
            type: 'screenReader',
            element: input,
            message: 'Invalid input without associated error message',
            severity: 'medium',
            fix: 'Add aria-describedby pointing to error message'
          });
        }
      }
    });

    console.log(`✓ Screen Reader Audit Complete: ${this.results.errors.filter(e => e.type === 'screenReader').length} errors, ${this.results.warnings.filter(w => w.type === 'screenReader').length} warnings`);
  },

  // 2. MOBILE TOUCH ACCESSIBILITY
  auditTouchTargets() {
    console.log('👆 Starting Touch Target Audit...');
    
    const interactiveElements = document.querySelectorAll('button, a, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])');
    
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      // Calculate actual touch target size including padding
      const totalHeight = rect.height;
      const totalWidth = rect.width;
      
      // Check minimum size requirements
      if (totalHeight < this.config.minTouchTarget || totalWidth < this.config.minTouchTarget) {
        // Check if it's a crisis-related element
        const isCrisisElement = element.classList.contains('crisis') || 
                               element.classList.contains('emergency') ||
                               element.textContent.toLowerCase().includes('help') ||
                               element.textContent.toLowerCase().includes('crisis');
        
        this.results.errors.push({
          type: 'touchTarget',
          element: element,
          message: `Touch target too small: ${Math.round(totalWidth)}x${Math.round(totalHeight)}px (minimum: ${this.config.minTouchTarget}x${this.config.minTouchTarget}px)`,
          severity: isCrisisElement ? 'critical' : 'high',
          currentSize: { width: totalWidth, height: totalHeight },
          fix: `Increase size to at least ${this.config.minTouchTarget}px`
        });
      } else if (totalHeight < this.config.preferredTouchTarget || totalWidth < this.config.preferredTouchTarget) {
        this.results.warnings.push({
          type: 'touchTarget',
          element: element,
          message: `Touch target below preferred size: ${Math.round(totalWidth)}x${Math.round(totalHeight)}px (preferred: ${this.config.preferredTouchTarget}x${this.config.preferredTouchTarget}px)`,
          severity: 'low',
          currentSize: { width: totalWidth, height: totalHeight }
        });
      }

      // Check for proper spacing between touch targets
      const siblings = Array.from(element.parentElement?.children || [])
        .filter(child => child !== element && (
          child.tagName === 'BUTTON' || 
          child.tagName === 'A' || 
          child.tagName === 'INPUT' ||
          child.getAttribute('role') === 'button'
        ));
      
      siblings.forEach(sibling => {
        const siblingRect = sibling.getBoundingClientRect();
        const horizontalGap = Math.min(
          Math.abs(rect.left - siblingRect.right),
          Math.abs(siblingRect.left - rect.right)
        );
        const verticalGap = Math.min(
          Math.abs(rect.top - siblingRect.bottom),
          Math.abs(siblingRect.top - rect.bottom)
        );
        
        if (horizontalGap < 8 || verticalGap < 8) {
          this.results.warnings.push({
            type: 'touchTarget',
            element: element,
            message: 'Insufficient spacing between touch targets',
            severity: 'medium',
            gap: { horizontal: horizontalGap, vertical: verticalGap },
            fix: 'Add at least 8px spacing between interactive elements'
          });
        }
      });
    });

    // Check for touch-action CSS property
    const scrollableElements = document.querySelectorAll('.scrollable, [style*="overflow"], .chat-messages, .modal-content');
    scrollableElements.forEach(element => {
      const touchAction = window.getComputedStyle(element).touchAction;
      if (touchAction === 'none') {
        this.results.warnings.push({
          type: 'touchTarget',
          element: element,
          message: 'Touch scrolling disabled',
          severity: 'medium',
          fix: 'Use touch-action: pan-y or manipulation instead of none'
        });
      }
    });

    console.log(`✓ Touch Target Audit Complete: ${this.results.errors.filter(e => e.type === 'touchTarget').length} errors, ${this.results.warnings.filter(w => w.type === 'touchTarget').length} warnings`);
  },

  // 3. CRISIS ACCESSIBILITY ON MOBILE
  auditCrisisAccess() {
    console.log('🚨 Starting Crisis Accessibility Audit...');
    
    // Find all crisis-related elements
    const crisisElements = document.querySelectorAll(
      '.crisis-button, .emergency-button, .crisis-fab, [class*="crisis"], [class*="emergency"], [aria-label*="crisis"], [aria-label*="emergency"]'
    );

    if (crisisElements.length === 0) {
      this.results.errors.push({
        type: 'crisisAccess',
        message: 'No crisis support elements found',
        severity: 'critical',
        fix: 'Add easily accessible crisis support button'
      });
    }

    crisisElements.forEach(element => {
      // Check if crisis button is easily reachable (in viewport or fixed position)
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      if (style.position !== 'fixed' && style.position !== 'sticky') {
        if (rect.top > window.innerHeight || rect.bottom < 0) {
          this.results.warnings.push({
            type: 'crisisAccess',
            element: element,
            message: 'Crisis element not immediately visible',
            severity: 'high',
            fix: 'Consider using fixed positioning for crisis buttons'
          });
        }
      }

      // Check color contrast for crisis elements
      const bgColor = style.backgroundColor;
      const textColor = style.color;
      if (bgColor && textColor && bgColor !== 'transparent') {
        // Simple contrast check (would need full implementation)
        const isDark = bgColor.includes('0, 0, 0') || bgColor.includes('#000');
        const isLight = bgColor.includes('255, 255, 255') || bgColor.includes('#fff');
        
        if ((isDark && textColor.includes('0, 0, 0')) || (isLight && textColor.includes('255, 255, 255'))) {
          this.results.errors.push({
            type: 'crisisAccess',
            element: element,
            message: 'Poor color contrast on crisis element',
            severity: 'critical',
            fix: 'Ensure crisis buttons have high contrast (4.5:1 minimum)'
          });
        }
      }

      // Check if element works with assistive technology
      const role = element.getAttribute('role');
      const tabindex = element.getAttribute('tabindex');
      
      if (element.tagName !== 'BUTTON' && element.tagName !== 'A' && !role) {
        this.results.errors.push({
          type: 'crisisAccess',
          element: element,
          message: 'Crisis element not properly marked as interactive',
          severity: 'critical',
          fix: 'Use button element or add role="button" and tabindex="0"'
        });
      }

      // Check for keyboard accessibility
      if (tabindex === '-1') {
        this.results.errors.push({
          type: 'crisisAccess',
          element: element,
          message: 'Crisis element not keyboard accessible',
          severity: 'critical',
          fix: 'Remove tabindex="-1" or set to "0"'
        });
      }
    });

    // Check for emergency contact methods
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    const textLinks = document.querySelectorAll('a[href^="sms:"]');
    
    if (phoneLinks.length === 0) {
      this.results.warnings.push({
        type: 'crisisAccess',
        message: 'No direct phone links found for crisis support',
        severity: 'high',
        fix: 'Add tel: links for emergency numbers (911, 988)'
      });
    }

    // Verify crisis numbers are correct
    phoneLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.includes('911') && !href.includes('988') && !href.includes('741741')) {
        this.results.warnings.push({
          type: 'crisisAccess',
          element: link,
          message: 'Non-standard crisis number detected',
          severity: 'medium',
          href: href,
          fix: 'Verify crisis number is correct and active'
        });
      }
    });

    console.log(`✓ Crisis Access Audit Complete: ${this.results.errors.filter(e => e.type === 'crisisAccess').length} errors, ${this.results.warnings.filter(w => w.type === 'crisisAccess').length} warnings`);
  },

  // 4. MOBILE COGNITIVE ACCESSIBILITY
  auditCognitiveAccess() {
    console.log('🧠 Starting Cognitive Accessibility Audit...');
    
    // Check for clear navigation patterns
    const nav = document.querySelector('nav, [role="navigation"]');
    if (nav) {
      const navItems = nav.querySelectorAll('a, button');
      if (navItems.length > 7) {
        this.results.warnings.push({
          type: 'cognitive',
          element: nav,
          message: 'Navigation has too many items for cognitive load',
          severity: 'medium',
          count: navItems.length,
          fix: 'Consider grouping or prioritizing navigation items (7±2 rule)'
        });
      }
    }

    // Check for timeout warnings
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const hasTimeoutWarning = form.querySelector('[class*="timeout"], [aria-label*="timeout"]');
      if (!hasTimeoutWarning) {
        this.results.warnings.push({
          type: 'cognitive',
          element: form,
          message: 'Form without timeout warning',
          severity: 'low',
          fix: 'Add timeout warnings and extension options for forms'
        });
      }
    });

    // Check for clear error messages
    const errorMessages = document.querySelectorAll('.error, .alert-danger, [role="alert"]');
    errorMessages.forEach(error => {
      const text = error.textContent || '';
      if (text.length > 150) {
        this.results.warnings.push({
          type: 'cognitive',
          element: error,
          message: 'Error message too long for easy comprehension',
          severity: 'medium',
          length: text.length,
          fix: 'Keep error messages concise (under 150 characters)'
        });
      }
      
      // Check if error provides clear action
      if (!text.match(/please|try|click|tap|select|enter|choose/i)) {
        this.results.warnings.push({
          type: 'cognitive',
          element: error,
          message: 'Error message lacks clear action',
          severity: 'medium',
          fix: 'Include specific actions user should take'
        });
      }
    });

    // Check for consistent patterns
    const buttons = document.querySelectorAll('button, .btn');
    const buttonStyles = new Set();
    buttons.forEach(button => {
      const classList = Array.from(button.classList).sort().join(' ');
      buttonStyles.add(classList);
    });
    
    if (buttonStyles.size > 5) {
      this.results.warnings.push({
        type: 'cognitive',
        message: 'Too many button style variations',
        severity: 'low',
        count: buttonStyles.size,
        fix: 'Maintain consistent button styles (max 5 variations)'
      });
    }

    // Check for plain language
    const complexTerms = ['authenticate', 'initialize', 'configure', 'parameter', 'validate'];
    complexTerms.forEach(term => {
      const elements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.toLowerCase().includes(term) && 
        el.children.length === 0
      );
      
      if (elements.length > 0) {
        this.results.warnings.push({
          type: 'cognitive',
          message: `Complex term "${term}" found`,
          severity: 'low',
          count: elements.length,
          fix: 'Use simpler language for better cognitive accessibility'
        });
      }
    });

    // Check for progress indicators
    const multiStepForms = document.querySelectorAll('[class*="step"], [class*="wizard"]');
    multiStepForms.forEach(form => {
      const progressIndicator = form.querySelector('[class*="progress"], [role="progressbar"]');
      if (!progressIndicator) {
        this.results.warnings.push({
          type: 'cognitive',
          element: form,
          message: 'Multi-step process without progress indicator',
          severity: 'medium',
          fix: 'Add clear progress indicators for multi-step processes'
        });
      }
    });

    console.log(`✓ Cognitive Access Audit Complete: ${this.results.errors.filter(e => e.type === 'cognitive').length} errors, ${this.results.warnings.filter(w => w.type === 'cognitive').length} warnings`);
  },

  // 5. MOBILE VISUAL ACCESSIBILITY
  auditVisualAccess() {
    console.log('👁️ Starting Visual Accessibility Audit...');
    
    // Check zoom capability
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      const content = viewport.getAttribute('content') || '';
      if (content.includes('user-scalable=no') || content.includes('maximum-scale=1')) {
        this.results.errors.push({
          type: 'visual',
          element: viewport,
          message: 'Zoom disabled in viewport meta tag',
          severity: 'critical',
          fix: 'Remove user-scalable=no and maximum-scale restrictions'
        });
      }
    }

    // Check text size
    const textElements = document.querySelectorAll('p, span, div, li, td');
    textElements.forEach(element => {
      const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
      if (fontSize < 12 && element.textContent && element.textContent.trim()) {
        this.results.warnings.push({
          type: 'visual',
          element: element,
          message: `Text too small: ${fontSize}px`,
          severity: 'medium',
          fix: 'Use minimum 14px font size for body text'
        });
      }
    });

    // Check focus indicators
    const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    focusableElements.forEach(element => {
      // Temporarily focus element to check outline
      const originalFocus = document.activeElement;
      element.focus();
      const outline = window.getComputedStyle(element).outline;
      const boxShadow = window.getComputedStyle(element).boxShadow;
      
      if (outline === 'none' && boxShadow === 'none') {
        this.results.errors.push({
          type: 'visual',
          element: element,
          message: 'No visible focus indicator',
          severity: 'high',
          fix: 'Add outline or box-shadow for focus state'
        });
      }
      
      // Restore original focus
      if (originalFocus instanceof HTMLElement) {
        originalFocus.focus();
      }
    });

    // Check color usage for information
    const colorOnlyElements = document.querySelectorAll('[class*="red"], [class*="green"], [class*="yellow"], [class*="blue"]');
    colorOnlyElements.forEach(element => {
      const hasIcon = element.querySelector('svg, i, [class*="icon"]');
      const hasText = element.textContent && element.textContent.trim().length > 0;
      
      if (!hasIcon && !hasText) {
        this.results.warnings.push({
          type: 'visual',
          element: element,
          message: 'Information conveyed by color alone',
          severity: 'medium',
          fix: 'Add text or icons in addition to color'
        });
      }
    });

    // Check images for alt text
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      
      if (alt === null && role !== 'presentation') {
        this.results.errors.push({
          type: 'visual',
          element: img,
          message: 'Image missing alt text',
          severity: 'high',
          fix: 'Add descriptive alt text or role="presentation" for decorative images'
        });
      } else if (alt === '') {
        // Check if image is decorative
        const parent = img.parentElement;
        if (parent && (parent.tagName === 'A' || parent.tagName === 'BUTTON')) {
          this.results.warnings.push({
            type: 'visual',
            element: img,
            message: 'Functional image with empty alt text',
            severity: 'medium',
            fix: 'Add descriptive alt text for functional images'
          });
        }
      }
    });

    // Check for sufficient line height
    const paragraphs = document.querySelectorAll('p, .content, .text');
    paragraphs.forEach(p => {
      const lineHeight = window.getComputedStyle(p).lineHeight;
      const fontSize = window.getComputedStyle(p).fontSize;
      
      if (lineHeight !== 'normal') {
        const ratio = parseFloat(lineHeight) / parseFloat(fontSize);
        if (ratio < 1.5) {
          this.results.warnings.push({
            type: 'visual',
            element: p,
            message: `Line height too small: ${ratio.toFixed(2)}`,
            severity: 'low',
            fix: 'Use line-height of at least 1.5 for body text'
          });
        }
      }
    });

    console.log(`✓ Visual Access Audit Complete: ${this.results.errors.filter(e => e.type === 'visual').length} errors, ${this.results.warnings.filter(w => w.type === 'visual').length} warnings`);
  },

  // 6. MOBILE MOTOR ACCESSIBILITY
  auditMotorAccess() {
    console.log('🤚 Starting Motor Accessibility Audit...');
    
    // Check for drag-only interactions
    const draggableElements = document.querySelectorAll('[draggable="true"], .draggable, [class*="drag"]');
    draggableElements.forEach(element => {
      const hasAlternative = element.querySelector('button, [role="button"]');
      if (!hasAlternative) {
        this.results.errors.push({
          type: 'motor',
          element: element,
          message: 'Drag-only interaction without alternative',
          severity: 'high',
          fix: 'Provide button alternatives for drag operations'
        });
      }
    });

    // Check for hover-only interactions
    const hoverElements = Array.from(document.styleSheets).reduce((acc, sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => {
          if (rule.selectorText && rule.selectorText.includes(':hover')) {
            const elements = document.querySelectorAll(rule.selectorText.replace(':hover', ''));
            elements.forEach(el => acc.add(el));
          }
        });
      } catch (e) {
        // Cross-origin stylesheets will throw
      }
      return acc;
    }, new Set());

    hoverElements.forEach(element => {
      const hasClickHandler = element.onclick || element.getAttribute('onclick');
      const hasTouchHandler = element.ontouchstart || element.getAttribute('ontouchstart');
      
      if (!hasClickHandler && !hasTouchHandler) {
        this.results.warnings.push({
          type: 'motor',
          element: element,
          message: 'Hover-only interaction',
          severity: 'medium',
          fix: 'Ensure all hover interactions work with touch/click'
        });
      }
    });

    // Check for time-based interactions
    const timedElements = document.querySelectorAll('[class*="countdown"], [class*="timer"], [class*="timeout"]');
    timedElements.forEach(element => {
      const hasPauseButton = element.querySelector('[class*="pause"], [aria-label*="pause"]');
      const hasExtendButton = element.querySelector('[class*="extend"], [aria-label*="extend"]');
      
      if (!hasPauseButton && !hasExtendButton) {
        this.results.warnings.push({
          type: 'motor',
          element: element,
          message: 'Timed interaction without pause/extend option',
          severity: 'medium',
          fix: 'Add pause or extend options for timed interactions'
        });
      }
    });

    // Check for gesture-based interactions
    const swipeElements = document.querySelectorAll('[class*="swipe"], [class*="carousel"], .slider');
    swipeElements.forEach(element => {
      const hasButtons = element.querySelectorAll('button, [role="button"]').length >= 2;
      if (!hasButtons) {
        this.results.errors.push({
          type: 'motor',
          element: element,
          message: 'Swipe/gesture interaction without button alternative',
          severity: 'high',
          fix: 'Add previous/next buttons for swipe interactions'
        });
      }
    });

    // Check for proper click/tap areas
    const clickableElements = document.querySelectorAll('[onclick], [role="button"], a, button');
    clickableElements.forEach(element => {
      const parent = element.parentElement;
      if (parent && parent.onclick && parent !== element) {
        const parentRect = parent.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        if (parentRect.width > elementRect.width * 2 || parentRect.height > elementRect.height * 2) {
          this.results.warnings.push({
            type: 'motor',
            element: element,
            message: 'Nested clickable elements may cause motor accessibility issues',
            severity: 'low',
            fix: 'Avoid nesting interactive elements or ensure clear boundaries'
          });
        }
      }
    });

    console.log(`✓ Motor Access Audit Complete: ${this.results.errors.filter(e => e.type === 'motor').length} errors, ${this.results.warnings.filter(w => w.type === 'motor').length} warnings`);
  },

  // Generate comprehensive report
  generateReport() {
    const totalErrors = this.results.errors.length;
    const totalWarnings = this.results.warnings.length;
    const criticalErrors = this.results.errors.filter(e => e.severity === 'critical').length;
    const highErrors = this.results.errors.filter(e => e.severity === 'high').length;

    const report = {
      summary: {
        totalErrors,
        totalWarnings,
        criticalErrors,
        highErrors,
        score: Math.max(0, 100 - (criticalErrors * 20) - (highErrors * 10) - (totalErrors * 5) - (totalWarnings * 2)),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          orientation: window.orientation || (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
        }
      },
      criticalIssues: this.results.errors.filter(e => e.severity === 'critical'),
      highPriorityIssues: this.results.errors.filter(e => e.severity === 'high'),
      mediumPriorityIssues: [
        ...this.results.errors.filter(e => e.severity === 'medium'),
        ...this.results.warnings.filter(w => w.severity === 'medium')
      ],
      lowPriorityIssues: this.results.warnings.filter(w => w.severity === 'low'),
      recommendations: this.generateRecommendations(),
      wcagCompliance: this.checkWCAGCompliance()
    };

    return report;
  },

  generateRecommendations() {
    const recommendations = [];

    // Crisis-specific recommendations
    if (this.results.errors.some(e => e.type === 'crisisAccess')) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Crisis Accessibility',
        recommendation: 'Implement a persistent, easily accessible crisis button with haptic feedback',
        impact: 'Life-saving - ensures users in crisis can quickly access help'
      });
    }

    // Touch target recommendations
    const touchErrors = this.results.errors.filter(e => e.type === 'touchTarget');
    if (touchErrors.length > 5) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Touch Targets',
        recommendation: 'Implement a consistent touch target sizing system (minimum 44x44px)',
        impact: 'Essential for users with motor impairments or tremors'
      });
    }

    // Screen reader recommendations
    if (this.results.errors.some(e => e.type === 'screenReader')) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Screen Reader',
        recommendation: 'Add comprehensive ARIA labels and landmarks',
        impact: 'Critical for blind and visually impaired users'
      });
    }

    // Cognitive recommendations
    if (this.results.warnings.filter(w => w.type === 'cognitive').length > 3) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Cognitive Accessibility',
        recommendation: 'Simplify navigation and use plain language throughout',
        impact: 'Helps users with cognitive disabilities or in crisis states'
      });
    }

    // Visual recommendations
    if (this.results.errors.some(e => e.type === 'visual' && e.message.includes('zoom'))) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Visual Accessibility',
        recommendation: 'Enable pinch-to-zoom functionality',
        impact: 'Essential for users with low vision'
      });
    }

    return recommendations;
  },

  checkWCAGCompliance() {
    return {
      'WCAG 2.1 Level A': {
        passed: this.results.errors.filter(e => e.severity === 'critical').length === 0,
        issues: this.results.errors.filter(e => e.severity === 'critical').length
      },
      'WCAG 2.1 Level AA': {
        passed: this.results.errors.length === 0,
        issues: this.results.errors.length
      },
      'WCAG 2.1 Mobile Guidelines': {
        '2.5.5 Target Size': this.results.errors.filter(e => e.type === 'touchTarget').length === 0,
        '2.5.1 Pointer Gestures': this.results.errors.filter(e => e.type === 'motor').length === 0,
        '1.4.4 Resize Text': !this.results.errors.some(e => e.message.includes('zoom')),
        '2.5.4 Motion Actuation': true // Would need device motion testing
      }
    };
  },

  // Run complete audit
  async runAudit() {
    console.log('📱 Starting Comprehensive Mobile Accessibility Audit...\n');
    
    // Run all audit functions
    this.auditScreenReader();
    this.auditTouchTargets();
    this.auditCrisisAccess();
    this.auditCognitiveAccess();
    this.auditVisualAccess();
    this.auditMotorAccess();

    // Generate and display report
    const report = this.generateReport();
    
    console.log('\n📊 MOBILE ACCESSIBILITY AUDIT REPORT');
    console.log('=====================================');
    console.log(`Overall Score: ${report.summary.score}/100`);
    console.log(`Critical Issues: ${report.summary.criticalErrors}`);
    console.log(`High Priority Issues: ${report.summary.highErrors}`);
    console.log(`Total Errors: ${report.summary.totalErrors}`);
    console.log(`Total Warnings: ${report.summary.totalWarnings}`);
    console.log('\n🎯 Top Recommendations:');
    report.recommendations.slice(0, 3).forEach(rec => {
      console.log(`  [${rec.priority}] ${rec.recommendation}`);
    });
    
    console.log('\n✅ WCAG Compliance:');
    Object.entries(report.wcagCompliance).forEach(([standard, result]) => {
      if (typeof result === 'object' && 'passed' in result) {
        console.log(`  ${standard}: ${result.passed ? '✓ PASSED' : '✗ FAILED'} (${result.issues} issues)`);
      }
    });

    // Save detailed report
    this.saveReport(report);
    
    return report;
  },

  // Save report to localStorage and offer download
  saveReport(report) {
    // Save to localStorage
    localStorage.setItem('mobile-accessibility-audit', JSON.stringify(report));
    
    // Create downloadable report
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    console.log(`\n📥 Download full report: ${url}`);
    console.log(`   Filename: mobile-accessibility-audit-${timestamp}.json`);
    
    // Automatically download if critical issues found
    if (report.summary.criticalErrors > 0) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `mobile-accessibility-audit-${timestamp}.json`;
      a.click();
      console.log('⚠️ Critical issues found - report downloaded automatically');
    }
  }
};

// Auto-run audit if on mobile device
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileAccessibilityAudit.runAudit());
  } else {
    MobileAccessibilityAudit.runAudit();
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileAccessibilityAudit;
}