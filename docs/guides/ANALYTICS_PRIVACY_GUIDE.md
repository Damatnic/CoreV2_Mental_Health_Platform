# Privacy-Compliant Analytics System

## Overview

The Astral Core platform now includes a comprehensive privacy-compliant analytics system designed specifically for mental health applications. This system follows GDPR regulations, HIPAA-adjacent principles, and prioritizes user privacy while providing valuable insights for platform improvement.

## Key Features

### 🔒 Privacy-First Design
- **GDPR Compliant**: Full compliance with European data protection regulations
- **HIPAA-Adjacent**: Mental health-specific privacy protections
- **Automatic Anonymization**: Personal data anonymized after 7 days
- **Data Purging**: All data automatically deleted after 90 days maximum
- **User Consent Management**: Granular consent controls for different data types

### 📊 Analytics Capabilities
- **Usage Analytics**: Anonymous platform usage patterns and feature adoption
- **Performance Monitoring**: Load times, error tracking, and optimization insights
- **Crisis Intervention Tracking**: Special handling for crisis-related events (anonymized)
- **Wellness Activity Monitoring**: Anonymous wellness feature usage patterns
- **User Journey Analysis**: Session-based user flow analysis

### 🛡️ Data Protection
- **Automatic PII Removal**: Emails, phone numbers, and tokens automatically sanitized
- **Sensitivity Levels**: Events classified by privacy sensitivity (public, private, sensitive, crisis)
- **Local Storage Limits**: Automatic cleanup to prevent data accumulation
- **Consent-Based Collection**: Data only collected with explicit user consent

## Implementation

### Analytics Service

```typescript
import { getAnalyticsService } from './services/analyticsService';

const analytics = getAnalyticsService();

// Track basic events
analytics.track('button_click', 'user_action', { buttonId: 'help' });

// Track page views
analytics.trackPageView('/dashboard');

// Track feature usage
analytics.trackFeatureUsage('mood_tracker', 'completed');

// Track crisis interventions (high priority)
analytics.trackCrisisIntervention('help_requested', { urgency: 'high' });

// Track wellness activities
analytics.trackWellnessActivity('meditation_completed', { duration: 300 });
```

### UI Components

#### Consent Banner
```typescript
import { ConsentBanner } from './components/privacy';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ConsentBanner onConsentChange={(consent) => console.log(consent)} />
    </div>
  );
}
```

#### Privacy Dashboard
```typescript
import { PrivacyDashboard } from './components/privacy';

function PrivacySettings() {
  return (
    <div>
      <PrivacyDashboard />
    </div>
  );
}
```

## Configuration

### Default Configuration
```typescript
const config = {
  enabled: true,
  collectPersonalData: false,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  privacySettings: {
    dataRetentionDays: 30,
    allowCrossSession: false,
    anonymizeAfterDays: 7,
    purgeAfterDays: 90,
    collectLocationData: false,
    collectDeviceData: true,
    shareCrisisData: true // Important for safety
  },
  requireConsent: true,
  gdprCompliant: true,
  hipaaAdjacent: true,
  crisisPriority: true
};
```

### Custom Configuration
```typescript
const customAnalytics = new AnalyticsService({
  endpoint: 'https://your-analytics-endpoint.com',
  privacySettings: {
    dataRetentionDays: 14, // Shorter retention
    anonymizeAfterDays: 3,  // Faster anonymization
  }
});
```

## Consent Management

### Consent Types
- **Analytics**: Usage patterns and feature adoption (optional)
- **Performance**: Error tracking and optimization (required)
- **Functionality**: Core platform features (required)
- **Marketing**: Wellness tips and updates (optional)

### Consent Controls
```typescript
// Update consent
analytics.updateConsent({
  analytics: true,
  performance: true,
  functionality: true,
  marketing: false
});

// Get current consent
const consent = analytics.getConsentStatus();

// Opt out completely
analytics.optOut();

// Opt back in
analytics.optIn();
```

## GDPR Rights

### Right to Access (Data Export)
```typescript
const exportRequest = await analytics.exportUserData(userId);
// Downloads JSON file with all user data
```

### Right to Erasure (Data Deletion)
```typescript
const deletionRequest = await analytics.deleteUserData(userId, true);
// Deletes user data, optionally retains anonymous crisis data for safety
```

## Crisis Data Handling

Crisis intervention data receives special treatment:
- **Immediate Flush**: Crisis events are sent immediately, not batched
- **High Priority**: Bypasses normal queuing for urgent processing
- **Safety Retention**: Anonymous crisis patterns may be retained for platform safety
- **Encrypted Storage**: All crisis data is encrypted during storage
- **Automatic Anonymization**: Personal identifiers removed immediately after processing

## Privacy Compliance Features

### Data Retention
- **30-day retention**: Default data storage period
- **7-day anonymization**: Personal data anonymized automatically
- **90-day purge**: Maximum data lifetime with automatic cleanup
- **Daily cleanup**: Automated background data retention enforcement

### Anonymization Process
- **User ID removal**: Personal identifiers stripped
- **Property sanitization**: PII patterns automatically detected and removed
- **Context preservation**: Usage patterns maintained without personal data
- **Irreversible process**: Anonymized data cannot be re-identified

### Storage Limits
- **Local storage caps**: Prevents data accumulation on user devices
- **Failed event limits**: Maximum 100 failed events stored for retry
- **Event history limits**: Configurable maximum events per user

## Monitoring and Reporting

### Privacy Report
```typescript
const report = analytics.getPrivacyReport();
console.log({
  totalEvents: report.totalEvents,
  personalDataEvents: report.personalDataEvents,
  anonymizedEvents: report.anonymizedEvents,
  crisisEvents: report.crisisEvents,
  dataRetentionDays: report.dataRetentionDays,
  gdprCompliant: report.gdprCompliant,
  hipaaAdjacent: report.hipaaAdjacent
});
```

### Debug Information
```typescript
// Get stored events
const events = analytics.getStoredEvents();

// Get user journey
const journey = analytics.getJourney();

// Clear all local data
analytics.clearStoredData();
```

## Integration with Mental Health Platform

### Wellness Tracking
- Anonymous mood pattern analysis
- Feature effectiveness measurement
- User engagement insights
- Crisis intervention effectiveness

### Platform Optimization
- Performance bottleneck identification
- Error pattern analysis
- User flow optimization
- Accessibility improvement insights

### Safety Analytics
- Crisis detection pattern analysis
- Help-seeking behavior insights
- Intervention effectiveness measurement
- Platform safety improvement

## Security Considerations

- **No PII Storage**: Personal information automatically filtered
- **Encrypted Transit**: All data encrypted during transmission
- **Local Encryption**: Sensitive data encrypted in local storage
- **Audit Trails**: Full logging of data access and modifications
- **Regular Purging**: Automatic cleanup prevents data accumulation

This analytics system provides valuable insights for improving the mental health platform while maintaining the highest standards of user privacy and data protection.
