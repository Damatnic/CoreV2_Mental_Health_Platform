# E2E Testing Implementation Guide

## Overview

This document outlines the comprehensive End-to-End (E2E) testing implementation for the Astral Core Mental Health Platform using Playwright. The testing strategy focuses on critical user flows that directly impact user safety and crisis intervention.

## Test Architecture

### 🎯 Critical User Flows Covered

1. **Crisis Chat Flows** - Crisis detection, AI responses, emergency escalation
2. **Helper Certification** - Training modules, quizzes, certification process
3. **Safety Plan Creation** - Personal safety planning, emergency contacts, coping strategies
4. **Emergency Escalation** - 988 lifeline, emergency services, crisis intervention
5. **Accessibility Compliance** - WCAG 2.1 AA compliance, screen reader support
6. **Mobile Responsiveness** - Touch interactions, mobile layouts, gesture support

### 📁 Test Structure

```
tests/e2e/
├── fixtures/
│   ├── test-fixtures.ts    # Test data and page object fixtures
│   └── test-utils.ts       # Utility functions for common operations
├── pages/
│   ├── CrisisChatPage.ts           # Crisis chat page object model
│   ├── HelperCertificationPage.ts  # Helper training page object model
│   ├── SafetyPlanPage.ts           # Safety plan page object model
│   └── EmergencyEscalationPage.ts  # Emergency escalation page object model
├── crisis-chat-flows.spec.ts       # Crisis detection and intervention tests
├── helper-certification.spec.ts    # Helper training and certification tests
├── safety-plan-creation.spec.ts    # Safety plan creation and management tests
├── emergency-escalation.spec.ts    # Emergency escalation workflow tests
├── accessibility.spec.ts           # Accessibility compliance tests
├── mobile-responsive.spec.ts       # Mobile-specific functionality tests
├── complete-crisis-workflow.spec.ts # End-to-end crisis workflow integration
├── global-setup.ts                 # Global test environment setup
└── global-teardown.ts              # Global test cleanup
```

## Configuration

### Playwright Configuration (`playwright.config.ts`)

The configuration is optimized for mental health platform testing:

- **Multi-browser testing**: Chrome, Firefox, Safari, Mobile devices
- **Accessibility testing**: Screen reader simulation, reduced motion support
- **Crisis-specific timeouts**: Fast response times for emergency features
- **Privacy settings**: Secure handling of sensitive mental health data
- **Mobile optimization**: Touch targets, gesture support, responsive layouts

### Key Configuration Features:

```typescript
// Crisis response timeouts
actionTimeout: 10000,
navigationTimeout: 30000,

// Privacy settings for mental health data
ignoreHTTPSErrors: false,
permissions: ['clipboard-read', 'clipboard-write', 'geolocation'],

// Accessibility testing support
reducedMotion: 'reduce',
recordVideo: 'retain-on-failure'
```

## Test Execution

### 🚀 Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with browser UI (for debugging)
npm run test:e2e-ui

# Run specific test suites
npm run test:e2e-crisis        # Crisis flows only
npm run test:e2e-accessibility # Accessibility tests only
npm run test:e2e-mobile        # Mobile tests only
npm run test:e2e-helper        # Helper certification tests
npm run test:e2e-safety        # Safety plan tests

# Debug mode
npm run test:e2e-debug

# Generate test report
npm run test:e2e-report
```

### 🎮 Test Environment Setup

Tests can run against different environments:

- **Local Development**: `http://localhost:8888` (default)
- **Staging**: Set `PLAYWRIGHT_BASE_URL` environment variable
- **Production**: Configured in CI for smoke testing

## Critical Test Scenarios

### 1. Crisis Detection and Response

**Test**: `crisis-chat-flows.spec.ts`

**Scenarios**:
- Crisis keyword detection (suicide, self-harm, hopelessness)
- Immediate crisis alert display
- Emergency resource accessibility
- Response time validation (< 2 seconds)
- Offline crisis support
- Contextual crisis resources

**Success Criteria**:
- All crisis keywords trigger alerts within 2 seconds
- Emergency resources are immediately accessible
- Offline crisis support functions properly
- Crisis state persists across navigation

### 2. Emergency Escalation

**Test**: `emergency-escalation.spec.ts`

**Scenarios**:
- 988 Lifeline access
- Crisis Text Line (741741) access
- Emergency services (911) escalation
- Location sharing for emergency services
- Accessibility compliance for emergency features
- Emergency contact cascade system

**Success Criteria**:
- Emergency escalation responds within 500ms
- All emergency contact methods are accessible
- Emergency features work with assistive technology
- Proper escalation warnings and confirmations

### 3. Safety Plan Creation

**Test**: `safety-plan-creation.spec.ts`

**Scenarios**:
- Complete safety plan creation
- Data privacy and encryption
- Quick access during crisis
- Offline availability
- Sharing with trusted contacts
- Mobile-optimized interface

**Success Criteria**:
- All safety plan sections can be completed
- Data is encrypted in local storage
- Safety plan accessible during crisis scenarios
- Works offline for emergency access

### 4. Helper Certification

**Test**: `helper-certification.spec.ts`

**Scenarios**:
- Complete training module progression
- Quiz completion and validation
- Progress tracking
- Certification badge award
- Access to helper-specific features
- Recertification process

**Success Criteria**:
- All 6 training modules complete successfully
- Quiz validation prevents progression without completion
- Certified helpers gain access to crisis support features
- Certification expiry tracking works properly

### 5. Accessibility Compliance

**Test**: `accessibility.spec.ts`

**Scenarios**:
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Reduced motion support
- Focus management

**Success Criteria**:
- All interactive elements are keyboard accessible
- Crisis alerts announce immediately to screen readers
- Minimum 4.5:1 color contrast ratios
- Proper heading hierarchy throughout
- Skip navigation links function correctly

### 6. Mobile Responsiveness

**Test**: `mobile-responsive.spec.ts`

**Scenarios**:
- Touch target sizes (minimum 44px)
- Mobile keyboard handling
- Swipe gesture support
- Orientation changes
- Pull-to-refresh functionality
- Mobile emergency features

**Success Criteria**:
- All touch targets meet accessibility standards
- Mobile keyboard doesn't obscure input fields
- Swipe gestures work for navigation and actions
- Interface adapts to orientation changes
- Emergency features optimized for mobile use

## Page Object Models

### CrisisChatPage

Handles crisis chat interactions and emergency escalation flows:

```typescript
class CrisisChatPage {
  async sendCrisisMessage(message: string): Promise<boolean>
  async testEmergencyEscalation(): Promise<void>
  async verifyCrisisDetection(): Promise<void>
  async verifyOfflineSupport(): Promise<void>
}
```

### SafetyPlanPage

Manages safety plan creation and access:

```typescript
class SafetyPlanPage {
  async completeFullSafetyPlan(): Promise<void>
  async testSafetyPlanPrivacy(): Promise<void>
  async testQuickAccessToSafetyPlan(): Promise<void>
  async testOfflineSafetyPlanAccess(): Promise<void>
}
```

### EmergencyEscalationPage

Handles emergency escalation workflows:

```typescript
class EmergencyEscalationPage {
  async testCrisisHotlineAccess(): Promise<void>
  async testEmergencyServicesEscalation(): Promise<void>
  async testLocationSharingForEmergency(): Promise<void>
  async testEmergencyAccessibility(): Promise<void>
}
```

## Test Data Management

### Crisis Test Data

```typescript
const testData = {
  crisisMessages: [
    'I want to end my life',
    'I am going to hurt myself',
    'I have a plan to kill myself',
    // ... more crisis indicators
  ],
  
  safetyPlanData: {
    warningSigns: ['Feeling overwhelmed', 'Social isolation'],
    copingStrategies: ['Deep breathing', 'Go for a walk'],
    // ... complete safety plan structure
  }
}
```

### Test Utilities

```typescript
class TestUtils {
  static async simulateCrisisScenario(page: Page, message: string)
  static async verifyAccessibility(element: Locator)
  static async measureResponseTime(page: Page, action: Function)
  static async testKeyboardNavigation(page: Page, selector: string)
}
```

## Continuous Integration

### GitHub Actions Workflow

**File**: `.github/workflows/e2e-testing.yml`

**Jobs**:
1. **Crisis Flow Tests** - Run after every commit (critical safety features)
2. **Accessibility Tests** - Ensure WCAG compliance
3. **Mobile Tests** - Validate mobile user experience
4. **Comprehensive Suite** - Full test suite on main branch

**Scheduling**:
- Crisis flow tests run every 4 hours (critical safety monitoring)
- Full suite runs on main branch pushes
- All tests run on pull requests

### Test Artifacts

- HTML test reports with screenshots
- Video recordings of failed tests
- Performance metrics for crisis response times
- Accessibility audit results

## Privacy and Security

### Data Handling

- **No Personal Data**: Tests use anonymized mock data only
- **Encrypted Storage**: Safety plan data encryption is validated
- **Privacy Compliance**: HIPAA considerations in test design
- **Secure Communications**: All test communications use HTTPS

### Crisis Simulation Safety

- Tests use controlled crisis keywords
- No real emergency services are contacted during testing
- Test environment clearly identified to prevent confusion
- Proper cleanup after crisis scenario testing

## Performance Monitoring

### Response Time Requirements

- **Crisis Detection**: < 2 seconds
- **Emergency Escalation**: < 500ms
- **Safety Plan Access**: < 3 seconds
- **Page Load Times**: < 5 seconds

### Monitoring

Tests continuously monitor these metrics and fail if thresholds are exceeded, ensuring the platform remains responsive during crisis situations.

## Troubleshooting

### Common Issues

1. **Tests timing out**: Check server startup and network conditions
2. **Crisis detection false negatives**: Verify AI service availability
3. **Accessibility failures**: Check ARIA attributes and keyboard navigation
4. **Mobile test failures**: Verify touch target sizes and gesture support

### Debug Mode

```bash
# Run tests with browser UI for debugging
npm run test:e2e-debug

# Run specific test with debug output
npx playwright test crisis-chat-flows.spec.ts --debug
```

### Test Reports

Generated HTML reports include:
- Test execution timeline
- Screenshots of failures
- Network activity logs
- Console error messages

## Future Enhancements

### Planned Additions

1. **Visual Regression Testing** - Detect UI changes that might affect crisis workflows
2. **Load Testing** - Test platform performance under high crisis volume
3. **Cross-Platform Testing** - Extended mobile device coverage
4. **Internationalization Testing** - Crisis support in multiple languages
5. **Integration Testing** - Test with real crisis hotline APIs (staging environment)

### Continuous Improvement

- Regular review of crisis detection accuracy
- Performance benchmark updates
- Accessibility standard updates
- New crisis scenario additions based on user feedback

## Contributing

### Adding New Tests

1. Follow page object model pattern
2. Include accessibility verification
3. Test both online and offline scenarios
4. Validate crisis response times
5. Include mobile-specific tests
6. Add comprehensive documentation

### Test Review Criteria

- Does the test cover a critical user safety scenario?
- Are response times within acceptable limits?
- Is accessibility properly verified?
- Does the test work across all supported browsers?
- Is the test data properly anonymized?

---

This E2E testing implementation ensures the Astral Core Mental Health Platform maintains the highest standards of reliability and accessibility for users in crisis situations. The comprehensive test coverage provides confidence that critical safety features will function properly when users need them most.
