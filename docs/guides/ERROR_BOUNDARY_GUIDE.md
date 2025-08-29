# Error Boundary System Documentation

## Overview

The Astral Core error boundary system provides comprehensive error handling for the mental health platform, with specialized components for different contexts and crisis intervention priority. The system ensures users can always access critical mental health resources, even when technical issues occur.

## System Architecture

### Core Components

1. **ErrorBoundary.tsx** - Base error boundary with comprehensive configuration
2. **SpecializedErrorBoundaries.tsx** - Context-specific error boundaries
3. **ErrorBoundary.css** - Complete styling system
4. **SimpleErrorBoundary.tsx** - Lightweight error handling (from LazyComponent system)

### Error Severity Levels

- **Critical**: Crisis intervention features, emergency contacts
- **High**: Authentication, network failures, chunk loading errors
- **Medium**: Form validation, UI rendering issues
- **Low**: Minor UI glitches, non-essential features

### Error Categories

- **crisis-intervention**: Errors in crisis support features
- **network**: Connection and API failures
- **authentication**: Login/session issues
- **validation**: Form and data validation errors
- **ui-rendering**: Component rendering failures
- **service-worker**: PWA and caching issues
- **data-corruption**: Data integrity problems
- **unknown**: Unclassified errors

## Implementation Guide

### Basic Error Boundary Usage

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

// Basic usage with default configuration
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// Custom configuration
<ErrorBoundary
  reportErrors={true}
  enableRetry={true}
  maxRetries={3}
  isCrisisContext={true}
  crisisContactInfo={{
    phone: '988',
    text: '741741',
    chat: 'https://suicidepreventionlifeline.org/chat/'
  }}
>
  <CrisisComponent />
</ErrorBoundary>
```

### Specialized Error Boundaries

#### Crisis Intervention (Highest Priority)

```typescript
import { CrisisErrorBoundary } from './components/SpecializedErrorBoundaries';

<CrisisErrorBoundary>
  <SafetyPlanView />
  <EmergencyContactsView />
  <CrisisResourcesView />
</CrisisErrorBoundary>
```

**Features:**
- Full-screen error overlay
- Immediate crisis contact access
- Multiple retry attempts (5)
- Auto-retry enabled
- Cannot be dismissed
- Always reports errors

#### Authentication Flow

```typescript
import { AuthErrorBoundary } from './components/SpecializedErrorBoundaries';

<AuthErrorBoundary>
  <LoginForm />
  <RegisterForm />
  <PasswordReset />
</AuthErrorBoundary>
```

**Features:**
- Clears corrupted auth data
- Redirects to login on failure
- Moderate retry attempts (3)
- Can be dismissed

#### Communication Features

```typescript
import { CommunicationErrorBoundary } from './components/SpecializedErrorBoundaries';

<CommunicationErrorBoundary>
  <ChatInterface />
  <VideoCall />
  <Messaging />
</CommunicationErrorBoundary>
```

**Features:**
- Custom reconnection UI
- Offline resource information
- Limited retry attempts
- Grace degradation messaging

#### Form Validation

```typescript
import { FormErrorBoundary } from './components/SpecializedErrorBoundaries';

<FormErrorBoundary>
  <UserProfileForm />
  <MoodTrackingForm />
  <SessionNotesForm />
</FormErrorBoundary>
```

**Features:**
- Form reset functionality
- Technical details shown
- Quick recovery options
- Preserves user context

#### Dashboard and Analytics

```typescript
import { DashboardErrorBoundary } from './components/SpecializedErrorBoundaries';

<DashboardErrorBoundary>
  <MoodChart />
  <ProgressTracker />
  <InsightsPanel />
</DashboardErrorBoundary>
```

**Features:**
- Non-blocking error display
- Core feature availability message
- Dashboard refresh option
- Maintains navigation

#### Admin Panel

```typescript
import { AdminErrorBoundary } from './components/SpecializedErrorBoundaries';

<AdminErrorBoundary>
  <UserManagement />
  <SystemSettings />
  <Analytics />
</AdminErrorBoundary>
```

**Features:**
- Detailed error information
- Admin navigation preserved
- System state information
- Cannot be dismissed

#### Page-Level Protection

```typescript
import { PageErrorBoundary } from './components/SpecializedErrorBoundaries';

<PageErrorBoundary pageName="Wellness Dashboard">
  <WellnessView />
</PageErrorBoundary>
```

**Features:**
- Full page error handling
- Home navigation option
- Crisis support links
- Page-specific messaging

#### Network-Aware Handling

```typescript
import { NetworkErrorBoundary } from './components/SpecializedErrorBoundaries';

<NetworkErrorBoundary>
  <DataSyncComponent />
  <CloudStorage />
  <RemoteResources />
</NetworkErrorBoundary>
```

**Features:**
- Online/offline detection
- Adaptive retry behavior
- Offline feature listing
- Connection status display

### Higher-Order Component Usage

```typescript
import { withErrorBoundary } from './components/SpecializedErrorBoundaries';

// Automatic error boundary wrapping
const SafeMoodTracker = withErrorBoundary(MoodTracker, 'form');
const SafeChatInterface = withErrorBoundary(ChatInterface, 'communication');
const SafeAdminPanel = withErrorBoundary(AdminPanel, 'admin');
```

### Development Error Boundary

```typescript
import { DevErrorBoundary } from './components/SpecializedErrorBoundaries';

// Only active in development mode
<DevErrorBoundary>
  <ExperimentalFeature />
</DevErrorBoundary>
```

**Features:**
- Detailed stack traces
- Component stack information
- Full error context
- Development-only activation

## Configuration Options

### ErrorBoundaryConfig Interface

```typescript
interface ErrorBoundaryConfig {
  // Error reporting
  reportErrors?: boolean;           // Enable error reporting
  reportingUrl?: string;           // Error reporting endpoint
  includeErrorInfo?: boolean;      // Include React error info
  includeStackTrace?: boolean;     // Include full stack trace
  
  // Recovery behavior
  enableRetry?: boolean;           // Show retry button
  maxRetries?: number;            // Maximum retry attempts
  autoRetry?: boolean;            // Automatic retry
  retryDelay?: number;            // Delay between retries (ms)
  
  // Crisis intervention
  isCrisisContext?: boolean;       // Enable crisis handling
  crisisContactInfo?: {           // Crisis contact information
    phone: string;
    text: string;
    chat: string;
  };
  
  // User experience
  showErrorDetails?: boolean;      // Show technical details
  allowErrorDismiss?: boolean;     // Allow error dismissal
  redirectOnError?: string;        // Redirect URL on error
  
  // Development
  isDevelopment?: boolean;         // Development mode
  logToConsole?: boolean;         // Console logging
}
```

### Custom Fallback Components

```typescript
interface ErrorFallbackProps {
  error: Error;                   // The caught error
  errorInfo: ErrorInfo;          // React error information
  resetErrorBoundary: () => void; // Function to reset state
  severity: ErrorSeverity;       // Error severity level
  category: ErrorCategory;       // Error category
  config: ErrorBoundaryConfig;   // Boundary configuration
  retryCount: number;            // Current retry count
}

// Custom fallback example
const CustomFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  severity,
  category
}) => (
  <div className="custom-error">
    <h3>Custom Error Handler</h3>
    <p>Severity: {severity}</p>
    <p>Category: {category}</p>
    <p>Message: {error.message}</p>
    <button onClick={resetErrorBoundary}>
      Try Again
    </button>
  </div>
);

<ErrorBoundary fallback={CustomFallback}>
  <MyComponent />
</ErrorBoundary>
```

## Error Reporting and Monitoring

### Error Report Structure

```typescript
interface ErrorReport {
  id: string;                    // Unique error ID
  timestamp: Date;               // When error occurred
  error: {                       // Error details
    name: string;
    message: string;
    stack?: string;
  };
  errorInfo?: ErrorInfo;         // React error info
  severity: ErrorSeverity;       // Error severity
  category: ErrorCategory;       // Error category
  userAgent: string;             // Browser information
  url: string;                   // Current page URL
  userId?: string;               // User identifier
  sessionId?: string;            // Session identifier
  retryCount: number;            // Retry attempts
  context: {                     // Additional context
    isCrisisContext: boolean;
    route: string;
    userState?: any;
  };
}
```

### Local Error Storage

Errors are automatically stored locally for offline reporting:

```typescript
// Stored in localStorage as 'error_reports'
const localReports = JSON.parse(localStorage.getItem('error_reports') || '[]');

// Crisis errors stored separately
const crisisError = localStorage.getItem('crisis_error');
```

### Remote Error Reporting

```typescript
// Configure error reporting endpoint
<ErrorBoundary
  reportErrors={true}
  reportingUrl="/api/errors"
  onReport={(errorReport) => {
    // Custom error reporting logic
    analytics.track('error_occurred', {
      severity: errorReport.severity,
      category: errorReport.category
    });
  }}
>
  <MyComponent />
</ErrorBoundary>
```

## Crisis Intervention Priority

### Crisis Error Handling

When `isCrisisContext` is true or error category is `crisis-intervention`:

1. **Immediate Display**: Full-screen crisis error overlay
2. **Contact Access**: Direct links to crisis hotlines
3. **Multiple Contacts**: Phone, text, and chat options
4. **Persistent UI**: Cannot be dismissed or hidden
5. **Maximum Retries**: Up to 5 retry attempts
6. **Auto-Retry**: Automatic recovery attempts
7. **Local Storage**: Crisis errors stored for recovery
8. **Event Dispatching**: Crisis error events for system response

### Crisis Contact Information

```typescript
const crisisContacts = {
  phone: '988',                              // National Suicide Prevention Lifeline
  text: '741741',                           // Crisis Text Line
  chat: 'https://suicidepreventionlifeline.org/chat/' // Online chat
};
```

### Crisis Event System

```typescript
// Listen for crisis errors
window.addEventListener('crisis-error', (event) => {
  const { phone, text, chat } = event.detail;
  // Handle crisis error event
  showCrisisResourcesModal({ phone, text, chat });
});
```

## Accessibility Features

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: High contrast error displays
- **Focus Management**: Proper focus handling during errors
- **Alternative Text**: Descriptive error messages

### Accessibility Implementation

```typescript
// Accessible error display
<div
  role="alert"
  aria-live="assertive"
  aria-label="Error occurred"
>
  <h2 id="error-title">Error Title</h2>
  <p aria-describedby="error-title">
    Error description for screen readers
  </p>
  <button
    onClick={resetErrorBoundary}
    aria-label="Retry the failed operation"
  >
    Try Again
  </button>
</div>
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .error-button {
    transition: none;
  }
  
  .error-animation {
    animation: none;
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('ErrorBoundary', () => {
  test('catches and displays errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
  });
  
  test('calls error reporting', () => {
    const onReport = jest.fn();
    
    render(
      <ErrorBoundary onReport={onReport}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(onReport).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Test error'
        })
      })
    );
  });
});
```

### Integration Tests

```typescript
describe('Crisis Error Handling', () => {
  test('displays crisis contacts on crisis errors', () => {
    render(
      <CrisisErrorBoundary>
        <CrisisComponent />
      </CrisisErrorBoundary>
    );
    
    // Simulate crisis error
    fireEvent.click(screen.getByText('Trigger Error'));
    
    expect(screen.getByText('Call 988')).toBeInTheDocument();
    expect(screen.getByText('Text 741741')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
describe('Error Recovery', () => {
  test('recovers from network errors', async () => {
    // Simulate network failure
    await page.setOfflineMode(true);
    
    // Trigger network-dependent action
    await page.click('[data-testid="sync-button"]');
    
    // Should see network error boundary
    await expect(page.locator('.network-error')).toBeVisible();
    
    // Restore network
    await page.setOfflineMode(false);
    
    // Retry should succeed
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('.sync-success')).toBeVisible();
  });
});
```

## Performance Considerations

### Error Boundary Overhead

- **Minimal Impact**: Error boundaries only activate during errors
- **Lazy Loading**: Fallback components can be lazy-loaded
- **Memory Management**: Automatic cleanup of retry timeouts
- **Bundle Splitting**: Error handling code in separate chunks

### Optimization Strategies

```typescript
// Lazy-loaded fallback components
const LazyErrorFallback = React.lazy(() => import('./ErrorFallback'));

<ErrorBoundary
  fallback={(error, errorInfo) => (
    <Suspense fallback={<div>Loading error handler...</div>}>
      <LazyErrorFallback error={error} errorInfo={errorInfo} />
    </Suspense>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

### Memory Usage

- **Error Reports**: Limited to 10 most recent errors
- **Retry Timeouts**: Automatically cleared on unmount
- **Event Listeners**: Properly removed during cleanup
- **State Management**: Minimal error boundary state

## Deployment Considerations

### Environment Configuration

```typescript
// Production configuration
const productionConfig: ErrorBoundaryConfig = {
  reportErrors: true,
  reportingUrl: process.env.REACT_APP_ERROR_REPORTING_URL,
  showErrorDetails: false,
  isDevelopment: false,
  includeStackTrace: false
};

// Development configuration
const developmentConfig: ErrorBoundaryConfig = {
  reportErrors: false,
  showErrorDetails: true,
  isDevelopment: true,
  logToConsole: true,
  includeStackTrace: true
};
```

### Error Monitoring Integration

```typescript
// Sentry integration example
import * as Sentry from '@sentry/react';

<ErrorBoundary
  onError={(error, errorInfo) => {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });
  }}
>
  <MyComponent />
</ErrorBoundary>
```

### CDN and Caching

```nginx
# Cache error boundary assets
location ~* /error-boundary\.(js|css)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Don't cache error reporting endpoints
location /api/errors {
  add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

## Best Practices

### Error Boundary Placement

1. **Page Level**: Wrap entire pages/views
2. **Feature Level**: Wrap major feature components
3. **Critical Paths**: Always wrap crisis intervention features
4. **Form Level**: Wrap complex forms and inputs
5. **Data Level**: Wrap data-dependent components

### Error Message Guidelines

1. **User-Friendly**: Avoid technical jargon
2. **Actionable**: Provide clear next steps
3. **Contextual**: Match message to user's situation
4. **Empathetic**: Use supportive language
5. **Crisis-Aware**: Always provide crisis support links

### Recovery Strategies

1. **Automatic**: Auto-retry for network errors
2. **User-Initiated**: Retry button for user control
3. **Graceful Degradation**: Maintain core functionality
4. **Alternative Paths**: Provide workarounds
5. **Crisis Priority**: Always preserve crisis access

### Security Considerations

1. **Sanitize Errors**: Remove sensitive information
2. **Rate Limiting**: Limit error reporting frequency
3. **Authentication**: Secure error reporting endpoints
4. **Data Privacy**: Respect user privacy in reports
5. **Crisis Safety**: Ensure crisis resources remain accessible

## Troubleshooting

### Common Issues

1. **Error Boundaries Not Catching**: Check for event handlers and async errors
2. **Infinite Re-renders**: Verify fallback components don't throw errors
3. **Missing Crisis Contacts**: Ensure crisis configuration is complete
4. **Memory Leaks**: Check timeout cleanup in componentWillUnmount
5. **Accessibility Issues**: Verify ARIA labels and keyboard navigation

### Debug Mode

```typescript
// Enable debug mode for detailed logging
<ErrorBoundary
  isDevelopment={true}
  logToConsole={true}
  showErrorDetails={true}
>
  <MyComponent />
</ErrorBoundary>
```

### Error Analysis

```typescript
// Analyze error patterns
const analyzeErrors = () => {
  const reports = JSON.parse(localStorage.getItem('error_reports') || '[]');
  
  const analysis = {
    totalErrors: reports.length,
    bySeverity: {},
    byCategory: {},
    mostCommon: {}
  };
  
  reports.forEach(report => {
    analysis.bySeverity[report.severity] = 
      (analysis.bySeverity[report.severity] || 0) + 1;
    analysis.byCategory[report.category] = 
      (analysis.byCategory[report.category] || 0) + 1;
  });
  
  return analysis;
};
```

This comprehensive error boundary system ensures that the Astral Core mental health platform maintains reliability and accessibility, with special protection for crisis intervention features that are critical to user safety.
