# 988 Suicide & Crisis Lifeline Integration Guide

## Overview

This mental health platform includes comprehensive automation for the 988 Suicide & Crisis Lifeline, providing immediate, seamless crisis intervention with intelligent routing and post-crisis follow-up.

## Key Features

### 1. Automated Crisis Detection & Connection
- **Real-time Severity Assessment**: ML-based detection analyzes user input for crisis indicators
- **Auto-dial Capability**: Automatically connects to 988 when critical thresholds are met (with consent)
- **Pre-populated Information**: Shares relevant crisis context with counselors for faster, more effective support
- **Connection Stability**: Maintains stable connections with automatic reconnection on quality degradation

### 2. Smart Routing & Escalation
- **Specialized Counselor Matching**: Routes to counselors based on:
  - Veteran status → Veterans Crisis Line specialists
  - Youth (under 25) → Youth-trained counselors
  - LGBTQ+ individuals → LGBTQ+-affirming counselors
  - Substance use issues → Substance abuse specialists
- **Warm Handoff Protocols**: Seamless transfer between counselors when specialization is needed
- **Multi-tier Escalation**: Automatic escalation path from chat → call → emergency services

### 3. Fallback Mechanisms
- **Crisis Text Line (741741)**: Automatic fallback to text support if voice unavailable
- **Local Hotlines**: Connection to regional crisis services
- **Online Chat**: Web-based crisis chat as alternative
- **Emergency Services**: Direct 911 integration for imminent danger

### 4. Post-Crisis Follow-up
- **Automated Welfare Checks**: Scheduled check-ins at 1hr, 24hrs, 72hrs, and 1 week
- **Appointment Scheduling**: Helps connect users with ongoing mental health care
- **Resource Delivery**: Personalized coping strategies and support materials
- **Outcome Tracking**: Monitors crisis resolution and long-term wellness

## Implementation

### Quick Start

1. **Add the Crisis Widget to Your App**:
```tsx
import { Crisis988Widget } from './components/Crisis988Widget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <Crisis988Widget 
        position="bottom-right"
        autoShow={false}
        theme="auto"
      />
    </div>
  );
}
```

2. **Use the Hook for Custom Integration**:
```tsx
import { use988Hotline } from './hooks/use988Hotline';

function CrisisButton() {
  const [state, actions] = use988Hotline({
    autoConnect: true,
    requireExplicitConsent: true
  });
  
  return (
    <button onClick={() => actions.connect()}>
      Get Crisis Support
    </button>
  );
}
```

### Advanced Configuration

```typescript
// Configure the service
import crisis988Service from './services/crisis988Service';

crisis988Service.updateConfig({
  autoDialThreshold: 0.85,  // Auto-connect at 85% crisis confidence
  dataSharing: {
    enabled: true,
    includeHistory: true,
    includeMedications: false,
    anonymizeData: false
  },
  routing: {
    enabled: true,
    preferredLanguage: 'es',
    veteranPriority: true
  },
  followUp: {
    enabled: true,
    intervals: [1, 24, 72, 168] // hours
  }
});
```

## Consent Management

### User Consent Options
- **Data Sharing**: Share crisis context with counselors
- **Recording Consent**: Allow call recording for quality assurance
- **Emergency Contact Notification**: Alert designated contacts
- **Follow-up Consent**: Enable welfare checks and resource delivery

### Consent Flow
```tsx
const [state, actions] = use988Hotline();

// Show consent dialog
actions.showConsent();

// Grant consent programmatically
actions.grantConsent({
  dataSharing: true,
  recordingConsent: false,
  emergencyContactNotification: true,
  followUpConsent: true
});

// Revoke consent
actions.revokeConsent();
```

## Crisis Detection

### Automatic Detection
The system monitors for crisis indicators including:
- **Keywords**: Suicide, self-harm, hopelessness, etc.
- **Mood Scores**: Persistent low mood (≤2/10)
- **Behavioral Patterns**: Isolation, withdrawal, aggression
- **Risk Factors**: Previous attempts, lack of support, substance use
- **Contextual Factors**: Time of day, recent losses, medication non-adherence

### Manual Triggering
```tsx
// Report crisis with specific severity
actions.reportCrisis('high', ['depression', 'isolation']);

// Connect with full context
actions.connect({
  triggers: ['suicidal thoughts'],
  recentMoodScores: [2, 1, 2],
  medicationAdherence: false,
  supportSystem: {
    available: false,
    contacted: false
  },
  suicidalIdeation: {
    present: true,
    plan: true,
    means: true
  },
  previousAttempts: 1
});
```

## Session Management

### Active Session Information
```tsx
const { activeSession } = state;

if (activeSession) {
  console.log('Session ID:', activeSession.id);
  console.log('Counselor:', activeSession.counselor);
  console.log('Duration:', activeSession.startTime);
  console.log('Quality:', activeSession.connectionQuality);
  console.log('Interventions:', activeSession.interventions);
}
```

### Session Actions
```tsx
// End session
actions.endSession('resolved');

// Request transfer to specialist
actions.requestTransfer('trauma');

// Update crisis context during session
actions.updateCrisisContext({
  substanceUse: true,
  currentLocation: { safe: false }
});
```

## Follow-up Management

### Schedule Custom Follow-ups
```tsx
// Schedule a welfare check in 6 hours
actions.scheduleFollowUp('welfare-check', 6);

// Schedule appointment reminder in 48 hours
actions.scheduleFollowUp('appointment-reminder', 48);
```

### Handle Follow-up Events
```tsx
crisis988Service.on('welfare-check', (data) => {
  // Send notification to user
  sendNotification(data.userId, data.message);
});

crisis988Service.on('followup-completed', (data) => {
  console.log('Follow-up completed:', data.task);
});
```

## Safety Features

### Emergency Escalation
- **Imminent Risk**: Auto-dials 988 + notifies emergency contacts
- **Critical Risk**: Connects to 988 with high priority routing
- **High Risk**: Offers immediate connection with follow-up scheduled
- **Moderate Risk**: Provides resources with monitoring activated

### Privacy & Security
- **HIPAA Compliant**: All data transmission encrypted
- **Consent Required**: No automatic connection without user permission
- **Data Minimization**: Only essential information shared
- **Audit Logging**: All crisis events logged for safety review
- **Withdrawable Consent**: Users can revoke permissions anytime

## Testing

### Test Crisis Detection
```bash
npm run test:crisis-detection
```

### Test 988 Connection
```bash
npm run test:988-integration
```

### End-to-End Crisis Flow
```bash
npm run test:e2e-crisis
```

## Monitoring & Analytics

### Get Service Statistics
```typescript
const stats = crisis988Service.getStatistics();
console.log('Active Sessions:', stats.activeSessions);
console.log('Success Rate:', stats.successfulConnections);
console.log('Avg Duration:', stats.averageSessionDuration);
console.log('Pending Follow-ups:', stats.pendingFollowUps);
```

### Monitor Events
```typescript
crisis988Service.on('crisis-detected', (event) => {
  logAnalytics('crisis_detected', {
    severity: event.level,
    userId: event.userId
  });
});

crisis988Service.on('988-connected', (data) => {
  logAnalytics('lifeline_connected', {
    sessionId: data.session.id,
    waitTime: data.session.startTime
  });
});
```

## Best Practices

### DO:
- ✅ Always obtain consent before automated connections
- ✅ Provide manual override options for all automated features
- ✅ Display clear crisis status indicators to users
- ✅ Test fallback mechanisms regularly
- ✅ Keep counselor routing preferences up to date
- ✅ Monitor connection quality and user satisfaction
- ✅ Provide alternative contact methods (text, chat)
- ✅ Schedule follow-ups for all crisis events

### DON'T:
- ❌ Auto-dial without explicit consent (except imminent danger)
- ❌ Share unnecessary personal information
- ❌ Rely solely on automated detection
- ❌ Ignore user preferences for communication
- ❌ Delay emergency response for technical issues
- ❌ Store crisis recordings without permission
- ❌ Overwhelm users with too many follow-ups

## Troubleshooting

### Connection Issues
```typescript
// Check connection status
if (state.connectionError) {
  console.error('Connection failed:', state.connectionError);
  
  // Try fallback
  actions.connectCrisisTextLine();
}

// Monitor connection quality
if (state.connectionQuality === 'poor') {
  // Switch from video to voice
  actions.switchConnectionType('voice');
}
```

### Consent Problems
```typescript
// Check consent status
if (!state.hasConsent) {
  // Show consent dialog
  actions.showConsent();
}

// Handle consent rejection
crisis988Service.on('consent-required', () => {
  // Provide alternative resources
  showLocalResources();
});
```

## Support

For implementation support or questions about the 988 integration:
- Technical Documentation: `/docs/988_TECHNICAL_SPECS.md`
- API Reference: `/docs/api/crisis988Service.md`
- Example Code: `/src/examples/Crisis988Integration.tsx`

## Compliance

This integration complies with:
- **988 Implementation Act**: Federal requirements for crisis hotline access
- **HIPAA**: Protected health information standards
- **SAMHSA Guidelines**: Substance Abuse and Mental Health Services Administration
- **ADA**: Accessibility requirements for crisis services
- **State Regulations**: Local crisis intervention requirements

## Version History

- **v2.0.0** (Current): Full automation with ML detection and smart routing
- **v1.5.0**: Added follow-up automation and consent management
- **v1.0.0**: Basic 988 connection capability

---

**Remember**: The 988 Lifeline is available 24/7 for anyone in suicidal crisis or emotional distress. This automation enhances access but never replaces human judgment in crisis situations.