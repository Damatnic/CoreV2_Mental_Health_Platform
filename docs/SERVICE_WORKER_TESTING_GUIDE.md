# Service Worker Testing Implementation Guide

## 📋 Overview

This document provides comprehensive guidance for testing the service worker functionality in Astral Core, including offline scenarios, crisis resource availability, performance validation, and cross-browser compatibility.

## 🎯 Testing Objectives

### Primary Goals
- **Crisis Resource Reliability**: Ensure 988 lifeline and emergency resources are always accessible offline
- **Performance Validation**: Verify service worker loads critical resources in <100ms
- **Offline Functionality**: Test complete offline experience including navigation and data access
- **Cross-Browser Compatibility**: Validate functionality across Chrome, Firefox, Safari, and Edge
- **Error Handling**: Ensure graceful degradation when service worker features are unavailable

## 🧪 Test Suite Structure

### 1. Unit Tests (`registration.test.ts`)
**Purpose**: Test service worker registration, lifecycle, and basic functionality

**Key Test Areas**:
- Service worker registration process
- Lifecycle event handling (waiting, controlling, installed)
- Message passing between main thread and service worker
- Update mechanism testing
- Error handling for registration failures

**Critical Tests**:
```typescript
- Service worker registration success/failure
- Event listener management
- Message sending and receiving
- Update checking and handling
```

### 2. Cache Strategy Tests (`cache-strategies.test.ts`)
**Purpose**: Validate different caching strategies and cache management

**Key Test Areas**:
- Crisis resources cache (Cache First strategy)
- Offline pages cache management
- API cache with Network First fallback
- Image cache with Stale While Revalidate
- Cache size management and eviction policies

**Critical Tests**:
```typescript
- Crisis resources always cached and accessible
- Cache-first strategy performance (<25ms)
- Network fallback when cache miss occurs
- Cache size limits respected (5MB max)
- Cache eviction for API cache (50 max entries)
```

### 3. Offline Functionality Tests (`offline-functionality.test.ts`)
**Purpose**: Comprehensive offline scenario testing

**Key Test Areas**:
- Network detection and online/offline events
- Crisis resource access when offline
- Offline navigation and fallback pages
- Data synchronization queue management
- Local storage for critical data

**Critical Tests**:
```typescript
- 988 lifeline accessible offline
- Crisis page loads with essential information
- Offline queue for API requests
- Background sync when returning online
- Cached data retrieval performance
```

### 4. Crisis Scenario Tests (`crisis-scenarios.test.ts`)
**Purpose**: Test critical mental health support functionality

**Key Test Areas**:
- Crisis keyword detection
- Emergency resource loading speed (<100ms)
- Safety plan template access
- Crisis communication templates
- Resource reliability validation

**Critical Tests**:
```typescript
- Crisis resources load in under 100ms
- All emergency contacts cached (988, 911, Crisis Text Line)
- Safety plan template available offline
- Crisis detection algorithms
- Emergency response workflows
```

### 5. Performance Tests (`performance.test.ts`)
**Purpose**: Validate performance metrics and optimization

**Key Test Areas**:
- Cache operation performance
- Bundle size optimization
- Memory usage management
- Network timeout handling
- Background sync efficiency

**Critical Tests**:
```typescript
- Service worker size <50KB (actual: 2.43KB)
- Precached assets <500KB mobile target (actual: 68.1KB)
- Cache operations complete in <100ms
- Memory usage stays reasonable
- Background sync processes efficiently
```

### 6. Cross-Browser Compatibility Tests (`cross-browser.test.ts`)
**Purpose**: Ensure functionality across different browsers and devices

**Key Test Areas**:
- Browser detection and feature support
- Chrome-specific features (background sync, push notifications)
- Firefox cache behavior differences
- Safari limitations and private browsing
- Mobile browser compatibility

**Critical Tests**:
```typescript
- Service worker support detection
- Progressive enhancement fallbacks
- Browser-specific error handling
- Mobile-specific features
- Feature detection utilities
```

## 🚀 Running Tests

### Basic Test Commands

```bash
# Run all service worker tests
npm run test:sw

# Run specific test categories
npm run test:sw-unit           # Registration and cache strategy tests
npm run test:sw-integration    # Offline and crisis scenario tests
npm run test:sw-performance    # Performance validation tests
npm run test:sw-cross-browser  # Cross-browser compatibility tests

# Run with coverage
npm run test:sw-coverage

# Watch mode for development
npm run test:sw-watch
```

### Advanced Test Runner

```bash
# Use the comprehensive test runner
node scripts/test-service-worker.js all          # Run all test suites
node scripts/test-service-worker.js coverage     # Run with coverage
node scripts/test-service-worker.js performance  # Performance benchmarks
node scripts/test-service-worker.js validate     # Validate deployment
node scripts/test-service-worker.js ci           # Full CI pipeline
```

## 📊 Test Coverage Requirements

### Minimum Coverage Targets
- **Service Worker Registration**: 95% line coverage
- **Cache Strategies**: 90% line coverage
- **Offline Functionality**: 85% line coverage
- **Crisis Scenarios**: 100% line coverage (critical path)
- **Performance Tests**: 80% line coverage
- **Cross-Browser Tests**: 75% line coverage

### Critical Path Coverage
The following functions MUST have 100% test coverage:
- Crisis resource caching and retrieval
- 988 lifeline accessibility
- Emergency contact access
- Offline crisis page loading
- Service worker registration error handling

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  setupFiles: ['<rootDir>/jest-env-setup.js'],
  testMatch: [
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ],
  testTimeout: 10000
};
```

### Mock Setup (`jest-setup.ts`)
The test setup includes comprehensive mocks for:
- Service Worker API (`navigator.serviceWorker`)
- Cache API (`caches`)
- Fetch API (`fetch`)
- Workbox library
- Browser-specific APIs

## 🎯 Performance Benchmarks

### Target Metrics
- **Service Worker Registration**: <200ms
- **Crisis Resource Cache Hit**: <25ms
- **Offline Page Load**: <100ms
- **Cache Operation**: <50ms
- **Background Sync Processing**: <1000ms for 50 items

### Mobile Performance Targets
- **Initial Service Worker Load**: <500ms on 3G
- **Crisis Resource Access**: <100ms on any connection
- **Cache Storage Usage**: <100MB total
- **Memory Usage**: <50MB additional for service worker

## 🌐 Cross-Browser Testing Matrix

### Supported Browsers
| Browser | Version | Service Worker | Cache API | Background Sync | Push Notifications |
|---------|---------|---------------|-----------|-----------------|-------------------|
| Chrome  | 90+     | ✅            | ✅        | ✅              | ✅                |
| Firefox | 90+     | ✅            | ✅        | ❌              | ✅                |
| Safari  | 14+     | ✅            | ✅        | ❌              | ⚠️ Limited        |
| Edge    | 90+     | ✅            | ✅        | ✅              | ✅                |

### Mobile Browser Testing
- **iOS Safari**: Service worker support with limitations
- **Android Chrome**: Full service worker support
- **Samsung Internet**: Chrome-based, full support
- **Firefox Mobile**: Standard Firefox limitations

## 🚨 Crisis Scenario Testing

### Emergency Resource Validation
Every test run MUST validate:
1. **988 Suicide & Crisis Lifeline** - Always accessible offline
2. **911 Emergency Services** - Always accessible offline
3. **Crisis Text Line (741741)** - Always accessible offline
4. **Crisis offline page** - Loads in <100ms
5. **Coping strategies** - Available without network
6. **Safety plan template** - Accessible offline

### Crisis Detection Testing
```typescript
const crisisKeywords = [
  'suicide', 'kill myself', 'end it all', 'want to die',
  'self-harm', 'hurt myself', 'no point living',
  'better off dead', 'suicide plan', 'overdose'
];

// Test cases must validate detection accuracy
const testCases = [
  { text: 'I want to kill myself', expected: true },
  { text: 'There\'s no point in living anymore', expected: true },
  { text: 'I just feel sad today', expected: false }
];
```

## 🔍 Debugging Tests

### Common Issues and Solutions

**Service Worker Registration Fails**:
```bash
# Check if service worker file exists
ls dist/sw.js

# Validate workbox configuration
npx workbox generateSW workbox-simple.js --debug
```

**Cache Tests Failing**:
```bash
# Clear all caches before testing
# Add to test setup:
beforeEach(async () => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
});
```

**Performance Tests Timing Out**:
```bash
# Increase Jest timeout
# In jest.config.js:
testTimeout: 30000  // 30 seconds
```

### Test Data Validation
Use this checklist before running tests:
- [ ] All crisis resource JSON files exist in `/public/`
- [ ] Offline HTML pages exist and contain emergency numbers
- [ ] Service worker builds successfully
- [ ] All mocks are properly configured
- [ ] Network simulation works correctly

## 📈 Continuous Integration

### CI Pipeline Steps
1. **Install Dependencies**: `npm ci`
2. **Run Unit Tests**: `npm run test:sw-unit`
3. **Run Integration Tests**: `npm run test:sw-integration`
4. **Performance Validation**: `npm run test:sw-performance`
5. **Cross-Browser Tests**: `npm run test:sw-cross-browser`
6. **Coverage Report**: `npm run test:sw-coverage`
7. **Deployment Validation**: `npm run verify:sw`

### Quality Gates
- All tests must pass
- Coverage >85% overall
- Crisis scenarios 100% coverage
- Performance benchmarks within targets
- No service worker registration errors

## 📚 Additional Resources

### Documentation
- [Service Worker API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Jest Testing Framework](https://jestjs.io/)

### Tools
- **Workbox CLI**: Service worker generation and testing
- **Chrome DevTools**: Service worker debugging
- **Jest**: Test framework and coverage
- **Testing Library**: React component testing utilities

---

**Last Updated**: January 4, 2025  
**Version**: 1.0.0  
**Maintained by**: Astral Core Development Team
