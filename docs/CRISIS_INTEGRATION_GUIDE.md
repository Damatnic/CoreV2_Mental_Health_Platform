# Crisis Hotline Integration Guide

## Overview
This document describes the comprehensive crisis hotline integration implemented in the Astral Core Mental Health Platform. The system provides **bulletproof, life-critical** connections to emergency services with multiple fallback mechanisms.

## Critical Services Integrated

### 1. 988 Suicide & Crisis Lifeline
- **Primary Methods:**
  - WebRTC direct audio/video calling
  - Direct phone dialing (tel: protocol)
  - WebSocket real-time chat
  - Embedded chat widget
  - REST API integration

- **Features:**
  - Automatic crisis severity assessment
  - Smart counselor routing (veteran, youth, LGBTQ+ specialists)
  - Warm handoff protocols
  - Post-crisis follow-up automation
  - Multi-language support

### 2. Crisis Text Line (741741)
- **Connection Methods:**
  - Direct SMS on mobile devices
  - Web-based text interface
  - API-based conversation initiation
  
### 3. Emergency Services (911)
- **Integration Methods:**
  - WebRTC emergency calling
  - SIP-based VoIP connection
  - RapidSOS API integration
  - Direct dial with location sharing
  - Enhanced 911 (E911) support

### 4. Local Crisis Resources
- **Services:**
  - Hospital emergency departments
  - Psychiatric facilities
  - Mobile crisis teams
  - Poison control centers
  - Local crisis centers

## Implementation Details

### Core Services

#### `crisis988Service.ts`
- Manages 988 Lifeline connections
- Handles consent and data sharing
- Implements counselor routing logic
- Manages follow-up scheduling

#### `emergencyServicesConnector.ts`
- Connects to 911 emergency dispatch
- Finds nearest hospitals
- Locates crisis centers
- Manages location services
- Handles poison control

#### `emergencyEscalationService.ts`
- Detects crisis keywords in multiple languages
- Auto-escalates based on risk scores
- Coordinates between services
- Monitors ongoing crisis events

### PanicButton Component
Located in `src/components/safety/PanicButton.tsx`:
- One-tap access to all crisis services
- Auto-detects user distress
- Provides immediate calming actions
- Shows local resources

## Configuration

### Required API Keys
Create a `.env` file with the following keys:

```env
VITE_988_API_KEY=your_988_api_key
VITE_CRISIS_TEXT_API_KEY=your_crisis_text_key
VITE_RAPIDSOS_API_KEY=your_rapidsos_key
VITE_GOOGLE_PLACES_API_KEY=your_google_places_key
VITE_GOOGLE_GEOCODING_API_KEY=your_google_geocoding_key
```

### Feature Flags
```env
VITE_ENABLE_988_INTEGRATION=true
VITE_ENABLE_911_INTEGRATION=true
VITE_ENABLE_CRISIS_TEXT=true
VITE_ENABLE_WEBRTC_CALLING=true
VITE_AUTO_ESCALATION_ENABLED=true
```

### Safety Thresholds
```env
VITE_CRISIS_AUTO_DIAL_THRESHOLD=0.85
VITE_EMERGENCY_ESCALATION_THRESHOLD=0.95
VITE_MONITORING_ALERT_THRESHOLD=0.7
```

## Usage Examples

### Basic Crisis Connection
```typescript
import crisis988Service from './services/crisis988Service';

// Create crisis event
const crisisEvent = {
  id: 'crisis-123',
  userId: 'user-456',
  timestamp: new Date(),
  severity: 'high',
  triggers: ['anxiety', 'suicidal thoughts']
};

// Create context
const context = {
  triggers: ['depression'],
  recentMoodScores: [8, 9, 7],
  suicidalIdeation: {
    present: true,
    plan: false,
    means: false
  }
};

// Connect to 988
const session = await crisis988Service.assessAndConnect(
  crisisEvent, 
  context
);
```

### Emergency Escalation
```typescript
import emergencyServicesConnector from './services/emergencyServicesConnector';

// Call 911 with location
const contact = await emergencyServicesConnector.call911(
  'Mental Health Crisis'
);

// Find nearest hospital
const hospitals = await emergencyServicesConnector.findNearestHospitals(
  null, // Use current location
  'psychiatric' // Specialty type
);
```

### Crisis Detection
```typescript
import emergencyEscalationService from './services/emergencyEscalationService';

// Detect crisis in text
const text = "I can't go on anymore";
const context = { userId: 'user-123' };

const event = await emergencyEscalationService.detectCrisis(
  text,
  context
);

// Auto-escalates based on severity
```

## Fallback Mechanisms

The system implements multiple layers of fallbacks:

1. **988 Connection Fallbacks:**
   - WebRTC → Direct Dial → WebSocket → Chat Widget → API

2. **911 Connection Fallbacks:**
   - WebRTC → SIP → API → Direct Dial → Display Emergency Info

3. **Location Service Fallbacks:**
   - GPS → IP Geolocation → Manual Entry

4. **Hospital Finder Fallbacks:**
   - Google Places → SAMHSA API → CMS Database → Default List

## Multi-Language Support

Crisis keywords detected in:
- English
- Spanish
- Chinese (Mandarin)
- Arabic
- (Extensible to more languages)

## Privacy & Consent

### Data Sharing Controls
- User consent required for non-emergency connections
- Anonymization options available
- HIPAA-compliant data handling
- Withdrawable consent

### Emergency Override
- Imminent danger bypasses consent requirements
- Location shared automatically in emergencies
- Emergency contacts notified

## Testing

Run the comprehensive test suite:
```bash
npm test tests/crisis/crisis-integration.test.ts
```

Tests cover:
- All connection methods
- Failover mechanisms
- Multi-language detection
- Location services
- Emergency escalation

## Monitoring & Analytics

The system tracks (anonymously):
- Connection success rates
- Average response times
- Failover frequency
- Crisis resolution outcomes
- Follow-up completion rates

## Compliance

The implementation complies with:
- HIPAA regulations
- SAMHSA guidelines
- 988 Implementation Act
- E911 requirements
- Crisis intervention standards

## Support & Maintenance

### Regular Updates Required
- API endpoint changes
- Phone number updates
- Service availability
- Counselor specialization updates

### Monitoring Checklist
- [ ] 988 API connectivity
- [ ] 911 dispatch integration
- [ ] WebRTC server status
- [ ] Location service accuracy
- [ ] Fallback mechanism testing

## Emergency Contacts

**For Platform Issues:**
- Technical Support: [your-support-email]
- Security Issues: [security-email]

**Crisis Services (for reference):**
- 988 Suicide & Crisis Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- Emergency Services: 911
- Poison Control: 1-800-222-1222
- Veterans Crisis Line: 1-800-273-8255

## Important Notes

1. **This is life-critical functionality** - any changes must be thoroughly tested
2. **Always maintain multiple fallbacks** - never rely on a single connection method
3. **Test regularly** - services and APIs may change
4. **Monitor performance** - track success rates and response times
5. **Update documentation** - keep this guide current with any changes

---

*Last Updated: [Current Date]*
*Version: 1.0.0*