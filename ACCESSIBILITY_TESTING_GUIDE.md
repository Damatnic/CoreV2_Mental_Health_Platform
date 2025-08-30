# Accessibility Testing Guide for Astral Core Mental Health Platform

## Table of Contents
1. [Introduction](#introduction)
2. [Testing Tools Setup](#testing-tools-setup)
3. [Manual Testing Procedures](#manual-testing-procedures)
4. [Automated Testing](#automated-testing)
5. [Component-Specific Tests](#component-specific-tests)
6. [Crisis Feature Testing](#crisis-feature-testing)
7. [Continuous Testing Process](#continuous-testing-process)

---

## Introduction

This guide provides comprehensive testing procedures to ensure the Astral Core Mental Health Platform maintains WCAG 2.1 AA compliance and provides an accessible experience for all users.

### Testing Frequency
- **Daily**: Automated tests on CI/CD
- **Weekly**: Manual keyboard navigation tests
- **Monthly**: Full accessibility audit
- **Quarterly**: User testing with people with disabilities

---

## Testing Tools Setup

### Required Tools

#### Browser Extensions
```bash
# Chrome/Edge Extensions
1. axe DevTools - Web Accessibility Testing
2. WAVE Evaluation Tool
3. Lighthouse (built into Chrome DevTools)
4. ChromeVox Screen Reader
5. Accessibility Insights for Web
```

#### Desktop Applications
```bash
# Screen Readers
- NVDA (Windows) - Free: https://www.nvaccess.org/
- JAWS (Windows) - Trial: https://www.freedomscientific.com/
- VoiceOver (Mac) - Built-in: System Preferences > Accessibility

# Voice Control
- Dragon NaturallySpeaking (Windows)
- Voice Control (Mac) - Built-in
- Voice Access (Android)
```

#### Command Line Tools
```bash
# Install Pa11y for automated testing
npm install -g pa11y

# Install axe-core for programmatic testing
npm install --save-dev @axe-core/playwright

# Install jest-axe for unit test integration
npm install --save-dev jest-axe
```

---

## Manual Testing Procedures

### 1. Keyboard Navigation Testing

#### Test Checklist
```markdown
☐ Tab through entire page - logical order?
☐ Shift+Tab backwards navigation works?
☐ Enter/Space activate buttons?
☐ Arrow keys work in menus/selects?
☐ Escape closes modals/dropdowns?
☐ No keyboard traps?
☐ Focus visible at all times?
☐ Skip links functional?
```

#### Test Script
```javascript
// Keyboard Navigation Test Script
describe('Keyboard Navigation', () => {
  it('should navigate through all interactive elements', () => {
    // Start at top of page
    cy.visit('/');
    cy.get('body').tab();
    
    // Check skip link
    cy.focused().should('contain', 'Skip to main content');
    cy.focused().type('{enter}');
    
    // Check main navigation
    cy.get('nav').within(() => {
      cy.tab().should('have.focus');
      cy.tab().should('have.focus');
    });
    
    // Check crisis button always accessible
    cy.get('[data-crisis-button]').focus();
    cy.focused().should('have.attr', 'aria-label');
  });
});
```

### 2. Screen Reader Testing

#### NVDA Quick Commands
```markdown
## Essential NVDA Commands
- NVDA + F7: List all links
- NVDA + F6: List all headings
- NVDA + F5: List all form fields
- NVDA + B: Read entire page
- H: Next heading
- K: Next link
- F: Next form field
- T: Next table
```

#### Screen Reader Test Checklist
```markdown
☐ Page title announced on load?
☐ Main heading structure logical (H1 > H2 > H3)?
☐ All images have alt text?
☐ Form labels read correctly?
☐ Error messages announced?
☐ Status updates announced (live regions)?
☐ Buttons/links have descriptive text?
☐ Tables have headers?
```

### 3. Color Contrast Testing

#### Manual Contrast Check
```javascript
// Color Contrast Validation
function checkContrast(foreground, background) {
  // WCAG AA requires:
  // - Normal text: 4.5:1
  // - Large text (18pt+): 3:1
  // - UI components: 3:1
  
  const ratio = getContrastRatio(foreground, background);
  
  return {
    normalText: ratio >= 4.5,
    largeText: ratio >= 3,
    uiComponent: ratio >= 3,
    ratio: ratio.toFixed(2)
  };
}

// Test critical colors
const criticalColors = [
  { fg: '#ffffff', bg: '#dc2626', component: 'Crisis Alert' },
  { fg: '#000000', bg: '#fbbf24', component: 'Warning' },
  { fg: '#ffffff', bg: '#3b82f6', component: 'Primary Button' }
];
```

### 4. Mobile Accessibility Testing

#### iOS VoiceOver Testing
```markdown
## VoiceOver Gestures
- Triple-click Home/Side button: Enable VoiceOver
- Swipe right: Next item
- Swipe left: Previous item
- Double-tap: Activate
- Three-finger swipe: Scroll
- Two-finger twist: Rotor

## Test Areas
☐ All buttons tappable with VoiceOver?
☐ Correct reading order?
☐ Modal dialogs trap focus?
☐ Form inputs accessible?
```

#### Android TalkBack Testing
```markdown
## TalkBack Gestures
- Swipe right: Next item
- Swipe left: Previous item
- Double-tap: Activate
- Swipe up then down: Global gesture
- Two-finger swipe: Scroll

## Test Areas
☐ Touch targets 48x48dp minimum?
☐ All controls labeled?
☐ Custom views accessible?
```

---

## Automated Testing

### 1. Jest + jest-axe Setup

```javascript
// setupTests.js
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// Component test example
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import CrisisAlert from './CrisisAlert';

describe('CrisisAlert Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <CrisisAlert severity="critical" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 2. Playwright Accessibility Testing

```javascript
// playwright.accessibility.spec.js
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test('Crisis page should be accessible', async ({ page }) => {
    await page.goto('/crisis');
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });
  
  test('Keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Tab to crisis button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check focus
    const focusedElement = await page.evaluate(() => 
      document.activeElement?.getAttribute('aria-label')
    );
    expect(focusedElement).toContain('Crisis');
  });
});
```

### 3. Pa11y Configuration

```javascript
// .pa11yci.json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 10000,
    "wait": 2000,
    "includeWarnings": true,
    "chromeLaunchConfig": {
      "args": ["--no-sandbox"]
    }
  },
  "urls": [
    {
      "url": "http://localhost:3000/",
      "actions": [
        "wait for element .crisis-alert to be visible"
      ]
    },
    {
      "url": "http://localhost:3000/mood-tracker",
      "screenCapture": "mood-tracker.png"
    },
    {
      "url": "http://localhost:3000/journal"
    }
  ]
}

// package.json script
"scripts": {
  "test:a11y": "pa11y-ci"
}
```

---

## Component-Specific Tests

### CrisisAlert Component

```javascript
describe('CrisisAlert Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  
  it('Crisis alert should be keyboard accessible', () => {
    // Trigger crisis alert
    cy.get('[data-testid="trigger-crisis"]').click();
    
    // Check ARIA attributes
    cy.get('.crisis-alert')
      .should('have.attr', 'role', 'alert')
      .should('have.attr', 'aria-live', 'assertive');
    
    // Test keyboard shortcuts
    cy.get('body').type('{alt}9');
    cy.on('window:alert', (text) => {
      expect(text).to.contains('Calling 988');
    });
    
    // Check touch target sizes
    cy.get('.crisis-btn').each(($btn) => {
      cy.wrap($btn).should('have.css', 'min-width', '48px');
      cy.wrap($btn).should('have.css', 'min-height', '48px');
    });
  });
  
  it('Should announce to screen readers', () => {
    cy.injectAxe();
    cy.get('[data-testid="trigger-crisis"]').click();
    
    // Check for screen reader announcement
    cy.get('[role="status"]')
      .should('contain', 'Crisis support activated');
    
    cy.checkA11y('.crisis-alert');
  });
});
```

### JournalEditor Component

```javascript
describe('JournalEditor Accessibility Tests', () => {
  it('Voice input should work', () => {
    cy.visit('/journal');
    
    // Check voice input button
    cy.get('[aria-label*="voice input"]')
      .should('exist')
      .should('be.visible');
    
    // Test keyboard shortcut
    cy.get('body').type('{alt}v');
    cy.get('[aria-pressed="true"]').should('exist');
  });
  
  it('Auto-save should announce to screen readers', () => {
    cy.visit('/journal');
    cy.get('textarea').type('Test content');
    
    // Wait for auto-save
    cy.wait(30000);
    
    // Check announcement
    cy.get('[role="status"]')
      .should('contain', 'Journal auto-saved');
  });
});
```

### MoodTracker Component

```javascript
describe('MoodTracker Accessibility Tests', () => {
  it('All moods should be keyboard selectable', () => {
    cy.visit('/mood-tracker');
    
    // Tab through mood options
    cy.get('.mood-option').first().focus();
    
    // Use arrow keys
    cy.focused().type('{rightarrow}');
    cy.focused().should('have.attr', 'aria-selected', 'true');
    
    // Check ARIA labels
    cy.get('.mood-option').each(($mood) => {
      cy.wrap($mood).should('have.attr', 'aria-label');
    });
  });
});
```

---

## Crisis Feature Testing

### Critical Path Testing
**MUST PASS - No exceptions**

```javascript
describe('Crisis Critical Path', () => {
  it('Crisis resources MUST be accessible at all times', () => {
    // Test from every page
    const pages = ['/', '/mood', '/journal', '/settings'];
    
    pages.forEach(page => {
      cy.visit(page);
      
      // Keyboard shortcut test
      cy.get('body').type('{alt}c');
      cy.get('.crisis-alert').should('be.visible');
      
      // Voice command test (if supported)
      cy.window().then(win => {
        if (win.speechRecognition) {
          cy.speak('crisis');
          cy.get('.crisis-alert').should('be.visible');
        }
      });
      
      // Direct click test
      cy.get('[data-crisis-button]').click();
      cy.get('.crisis-resources').should('be.visible');
    });
  });
  
  it('Emergency numbers must be callable', () => {
    cy.visit('/');
    cy.get('[data-crisis-button]').click();
    
    // Check 988 button
    cy.get('[aria-label*="988"]')
      .should('have.attr', 'href', 'tel:988');
    
    // Check text crisis line
    cy.get('[aria-label*="741741"]')
      .should('have.attr', 'href', 'sms:741741?body=HOME');
  });
});
```

---

## Continuous Testing Process

### 1. Pre-commit Hooks

```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run accessibility tests
npm run test:a11y:components
```

### 2. CI/CD Pipeline

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Jest accessibility tests
        run: npm run test:a11y:unit
      
      - name: Start application
        run: npm run start &
        
      - name: Wait for app
        run: npx wait-on http://localhost:3000
      
      - name: Run Pa11y tests
        run: npm run test:a11y:pa11y
      
      - name: Run Playwright tests
        run: npm run test:a11y:e2e
      
      - name: Upload accessibility report
        uses: actions/upload-artifact@v2
        with:
          name: accessibility-report
          path: a11y-report/
```

### 3. Monitoring Dashboard

```javascript
// accessibility-monitor.js
class AccessibilityMonitor {
  constructor() {
    this.violations = [];
    this.metrics = {
      keyboardTraps: 0,
      missingAltText: 0,
      lowContrast: 0,
      missingLabels: 0
    };
  }
  
  async runDailyAudit() {
    const pages = await this.getAllPages();
    
    for (const page of pages) {
      const results = await this.auditPage(page);
      this.processResults(results);
    }
    
    await this.sendReport();
  }
  
  async auditPage(url) {
    const results = await axe.run(url);
    return results.violations;
  }
  
  sendAlert(violation) {
    if (violation.impact === 'critical') {
      // Send immediate alert
      this.notifyTeam({
        severity: 'CRITICAL',
        message: `Accessibility violation: ${violation.description}`,
        url: violation.url
      });
    }
  }
}
```

---

## Testing Checklist Template

### Daily Checklist
```markdown
## Date: ___________

### Automated Tests
☐ All unit tests passing
☐ Pa11y CI green
☐ No new axe violations

### Manual Spot Checks
☐ Crisis button accessible
☐ Navigation keyboard-friendly
☐ Forms properly labeled

### Notes:
_________________________________
```

### Weekly Checklist
```markdown
## Week of: ___________

### Keyboard Navigation
☐ Full site navigation without mouse
☐ All modals escapable
☐ Focus indicators visible
☐ Tab order logical

### Screen Reader
☐ Page titles descriptive
☐ Headings hierarchical
☐ Images have alt text
☐ Forms announce errors

### Mobile
☐ Touch targets 44x44px+
☐ Pinch-to-zoom works
☐ Orientation change handled

### Notes:
_________________________________
```

### Monthly Audit Checklist
```markdown
## Month: ___________

### WCAG 2.1 AA Compliance
☐ 1.1 Text Alternatives
☐ 1.2 Time-based Media
☐ 1.3 Adaptable
☐ 1.4 Distinguishable
☐ 2.1 Keyboard Accessible
☐ 2.2 Enough Time
☐ 2.3 Seizures
☐ 2.4 Navigable
☐ 2.5 Input Modalities
☐ 3.1 Readable
☐ 3.2 Predictable
☐ 3.3 Input Assistance
☐ 4.1 Compatible

### User Testing
☐ Screen reader users
☐ Keyboard-only users
☐ Voice control users
☐ Cognitive accessibility
☐ Mobile users

### Performance
☐ Load time < 3s
☐ Time to interactive < 5s
☐ Focus delay < 100ms

### Documentation
☐ Update test results
☐ Document new issues
☐ Update accessibility statement

### Notes:
_________________________________
```

---

## Reporting Issues

### Issue Template

```markdown
## Accessibility Issue Report

**Component:** [Component name]
**Page URL:** [URL]
**WCAG Criterion:** [e.g., 1.4.3 Contrast]
**Severity:** Critical | High | Medium | Low
**User Impact:** [Who is affected and how]

### Description
[Clear description of the issue]

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots/Videos
[Attach if applicable]

### Assistive Technology
- [ ] NVDA
- [ ] JAWS
- [ ] VoiceOver
- [ ] TalkBack
- [ ] Keyboard only
- [ ] Voice control

### Proposed Solution
[If known]
```

---

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Pa11y](https://pa11y.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Training
- [Web Accessibility by Google](https://www.udacity.com/course/web-accessibility--ud891)
- [Introduction to Web Accessibility](https://www.edx.org/course/web-accessibility-introduction)
- [Deque University](https://dequeuniversity.com/)

---

*This testing guide should be reviewed and updated quarterly to ensure it remains current with best practices and platform changes.*