# Crisis Escalation Workflow Integration

## Overview

The Crisis Escalation Workflow Integration provides seamless automatic escalation of severe crisis cases from detection to professional intervention. This system builds upon the enhanced crisis keyword detection to provide immediate professional help when users are in severe crisis situations.

## Architecture

### Integration Flow

```
User Message → Enhanced Crisis Detection → Risk Assessment → Automatic Escalation → Professional Response
```

1. **Enhanced Crisis Detection**: Uses the comprehensive enhanced crisis keyword detection service
2. **Risk Assessment**: Evaluates severity, urgency, and escalation requirements
3. **Automatic Escalation**: Triggers crisis escalation workflow for severe cases
4. **Professional Response**: Connects users to appropriate crisis intervention resources

### Key Components

- **optimizedAIService.ts**: Enhanced with escalation workflow integration
- **crisisDetectionIntegrationService.ts**: Unified interface for components
- **crisisEscalationWorkflowService.ts**: Comprehensive escalation management
- **enhancedCrisisKeywordDetectionService.ts**: Advanced crisis detection

## Features

### Automatic Escalation Triggers

- **Critical Severity**: Immediate danger indicators
- **Emergency Services Required**: Medical emergency situations  
- **High Risk Threshold**: Risk score > 80
- **Suicide Ideation**: Direct suicide statements
- **Self-Harm Indicators**: Active self-harm expressions

### Escalation Tiers

1. **Peer Support**: Basic support from trained volunteers
2. **Crisis Counselor**: Professional crisis counselors
3. **Emergency Team**: Specialized crisis intervention team
4. **Emergency Services**: Emergency medical/psychiatric services
5. **Medical Emergency**: Immediate medical intervention

### Cultural & Accessibility Support

- **Multi-language Support**: Respects user language preferences
- **Cultural Context**: Considers cultural background in escalation
- **Accessibility Needs**: Accommodates screen readers, mobility issues
- **Contact Preferences**: Phone, text, chat, or video options

## Usage

### Basic Crisis Analysis

```typescript
import { crisisDetectionIntegrationService } from './services/crisisDetectionIntegrationService';

// Analyze single message
const result = await crisisDetectionIntegrationService.analyzeTextForCrisis(
  'I want to end my life',
  {
    userId: 'user-123',
    conversationId: 'chat-456',
    userContext: {
      languageCode: 'en',
      preferredContactMethod: 'chat'
    }
  }
);

if (result.escalationRequired && result.escalationResponse) {
  console.log('Crisis escalation initiated:', result.escalationResponse.escalationId);
  console.log('Response time:', result.escalationResponse.estimatedResponseTime);
}
```

### Conversation Analysis

```typescript
// Analyze entire conversation
const messages = [
  'I have been feeling really depressed',
  'Nothing seems to help anymore',
  'I think about ending it all'
];

const results = await crisisDetectionIntegrationService.analyzeConversationForCrisis(
  messages,
  {
    userId: 'user-789',
    sessionData: {
      messagesSent: 3,
      sessionDuration: 180000,
      riskTrend: 'increasing'
    }
  }
);
```

### User Crisis State Check

```typescript
// Check overall crisis state
const crisisState = await crisisDetectionIntegrationService.checkUserCrisisState(
  'user-123',
  recentMessages,
  {
    userContext: {
      languageCode: 'es',
      culturalContext: 'hispanic',
      preferredContactMethod: 'phone'
    }
  }
);

if (crisisState.isInCrisis) {
  console.log('User in crisis, severity:', crisisState.highestSeverity);
  console.log('Recommended actions:', crisisState.recommendedActions);
}
```

## Enhanced AI Service Integration

### Updated analyze() Method

The crisis detection service now accepts user context for escalation:

```typescript
const crisisService = await aiServiceManager.getCrisisDetectionService();
const result = await crisisService.analyze(text, userContext);

// Enhanced result includes escalation information
console.log('Crisis detected:', result.isCrisis);
console.log('Escalation required:', result.escalationRequired);
console.log('Escalation response:', result.escalationResponse);
```

### Fallback Mechanism

- **Primary**: Enhanced crisis detection with escalation
- **Fallback**: Basic crisis detection if enhanced fails
- **Safety**: Always prioritizes user safety

## Error Handling

### Escalation Service Failures

```typescript
// Graceful degradation when escalation service fails
if (result.escalationRequired && !result.escalationResponse) {
  // Escalation was needed but failed
  console.warn('Crisis escalation failed, manual intervention needed');
  // Show manual crisis resources to user
  showEmergencyResources();
}
```

### Detection Service Failures

```typescript
// Fallback to basic detection
if (result.error && !result.enhanced) {
  console.warn('Enhanced detection failed, using basic:', result.error);
  // Still provides crisis detection, just with less sophistication
}
```

## Security & Privacy

### Data Protection
- **No Personal Data Storage**: Crisis analysis doesn't store personal information
- **Encrypted Communication**: All escalation communications are encrypted
- **Access Logging**: Crisis escalations are logged for audit purposes
- **User Consent**: Respects user privacy preferences

### Compliance
- **HIPAA Considerations**: Designed with healthcare privacy in mind
- **GDPR Compliance**: Respects EU privacy regulations
- **Crisis Standards**: Follows mental health crisis intervention standards

## Testing

### Integration Tests

Run the comprehensive integration test suite:

```bash
npm test tests/integration/crisisEscalationWorkflowIntegration.test.ts
```

### Test Coverage

- ✅ Crisis detection with escalation
- ✅ Non-crisis content handling
- ✅ Conversation analysis
- ✅ User crisis state evaluation
- ✅ Error handling and graceful degradation
- ✅ User context propagation

## Performance

### Optimization Features

- **Lazy Loading**: Crisis services load only when needed
- **Caching**: 1-hour cache for crisis service instances
- **Preloading**: Critical services preload during idle time
- **Progressive Enhancement**: Adapts to device capabilities

### Response Times

- **Enhanced Detection**: ~200-500ms
- **Basic Detection**: ~50-100ms  
- **Escalation Trigger**: ~100-300ms
- **Total Analysis**: ~400-800ms

## Monitoring

### Key Metrics

- **Crisis Detection Rate**: Percentage of messages flagged as crisis
- **Escalation Trigger Rate**: Percentage requiring professional intervention
- **False Positive Rate**: Incorrectly flagged non-crisis content
- **Response Time**: Time from detection to escalation initiation

### Logging

```typescript
// Crisis escalation events are logged
{
  event: 'crisis_escalation_triggered',
  escalationId: 'crisis-123',
  severity: 'critical',
  tier: 'emergency-team',
  timestamp: '2025-08-05T14:30:00Z',
  responseTime: 300000
}
```

## Future Enhancements

### Planned Features

- **Machine Learning Integration**: Improved pattern recognition
- **Real-time Collaboration**: Live crisis counselor integration  
- **Geographic Services**: Location-based emergency services
- **Family Notification**: Configurable family/friend alerts
- **Follow-up Scheduling**: Automatic check-in scheduling

### API Integrations

- **988 Lifeline**: Direct integration with national crisis line
- **Crisis Text Line**: SMS-based crisis support
- **Local Emergency Services**: Geographic emergency contacts
- **Healthcare Providers**: Integration with healthcare systems

## Support

For implementation assistance or escalation service configuration:

1. **Documentation**: Complete integration guides in `/docs`
2. **Testing**: Comprehensive test suites in `/tests`
3. **Examples**: Usage examples in service files
4. **Monitoring**: Built-in logging and metrics

---

**⚠️ Critical Safety Note**: This system is designed to detect and escalate crisis situations. Always ensure proper professional crisis intervention resources are available and configured correctly.
