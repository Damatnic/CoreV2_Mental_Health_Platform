# Offline UI Components Implementation

## Overview

This document outlines the comprehensive offline UI component system for the Astral Core mental health platform. These components provide seamless offline experience with crisis intervention priority and accessibility compliance.

## Components Created

### 1. useConnectionStatus Hook (`src/hooks/useConnectionStatus.ts`)

**Purpose**: Real-time connection monitoring and service worker communication

**Key Features**:
- Network status detection with connection quality assessment
- Service worker registration and status monitoring
- Crisis resources availability checking
- Offline capabilities tracking
- Two-way communication with service worker

**Usage**:
```typescript
const {
  connectionStatus,
  updateCrisisResources,
  forceCacheUpdate,
  sendMessageToServiceWorker
} = useConnectionStatus();
```

**Connection Status Properties**:
- `isOnline`: Basic online/offline status
- `connectionQuality`: 'excellent' | 'good' | 'poor' | 'offline'
- `crisisResourcesAvailable`: Emergency resources cached
- `serviceWorkerStatus`: SW lifecycle state
- `offlineCapabilities`: Array of feature availability

### 2. OfflineProvider Context (`src/contexts/OfflineProvider.tsx`)

**Purpose**: App-wide offline state management and feature availability

**Key Features**:
- Centralized offline state distribution
- Feature availability checking
- Crisis resource access coordination
- Service worker communication wrapper

**Usage**:
```typescript
const {
  connectionStatus,
  isFeatureAvailable,
  getOfflineCapability
} = useOffline();
```

**Methods**:
- `isFeatureAvailable(feature)`: Check if feature works offline
- `getOfflineCapability(feature)`: Get detailed capability info
- `updateCrisisResources()`: Refresh emergency resources
- `forceCacheUpdate()`: Force service worker cache refresh

### 3. OfflineIndicator Component (`src/components/OfflineIndicator.tsx`)

**Purpose**: Visual connection status indicator with crisis priority

**Variants**:
- `minimal`: Simple dot indicator
- `detailed`: Icon with text and crisis status
- `banner`: Full-width status banner

**Key Features**:
- WCAG 2.1 AA accessibility compliance
- Crisis resource availability indication
- Connection quality visualization
- Dark mode support
- Reduced motion support

**Usage**:
```typescript
<OfflineIndicator 
  variant="detailed"
  showCrisisStatus={true}
  onClick={handleStatusClick}
/>
```

### 4. NetworkBanner Component (`src/components/NetworkBanner.tsx`)

**Purpose**: Full-width alerts for connection status changes

**Key Features**:
- Auto-dismiss functionality
- Crisis resource priority messaging
- Service worker status display
- Responsive design
- Smooth animations

**Usage**:
```typescript
<NetworkBanner
  showWhenOnline={false}
  autoDismiss={true}
  onDismiss={handleDismiss}
/>
```

### 5. CrisisResourcesModal Component (`src/components/CrisisResourcesModal.tsx`)

**Purpose**: Emergency offline access to crisis intervention resources

**Tabs**:
- Emergency: Critical contacts (911, 988)
- Support: Mental health resources
- Coping: Self-help strategies
- Safety Plan: Crisis planning tools

**Key Features**:
- Offline-first data loading
- Emergency contact quick access
- Expandable coping strategies
- Safety planning guidance
- Fallback emergency contacts

**Usage**:
```typescript
<CrisisResourcesModal
  isOpen={showCrisis}
  onClose={handleClose}
  initialTab="emergency"
/>
```

### 6. OfflineCapabilities Component (`src/components/OfflineCapabilities.tsx`)

**Purpose**: Display available features and offline functionality status

**Variants**:
- `compact`: Summary with counts
- `list`: Simple feature list
- `detailed`: Full feature cards

**Key Features**:
- Feature availability visualization
- Offline alternatives display
- Interactive feature access
- Expandable details
- Action buttons

**Usage**:
```typescript
<OfflineCapabilities
  variant="detailed"
  showActions={true}
  onFeatureClick={handleFeatureClick}
/>
```

## Offline Capabilities System

### Feature Categories

1. **Crisis Resources**
   - Emergency contacts (911, 988, Crisis Text Line)
   - Mental health support lines
   - Treatment referrals
   - **Status**: Always available offline

2. **Safety Plan**
   - Personal safety planning
   - Warning signs recognition
   - Coping strategies
   - **Status**: Available offline

3. **Coping Strategies**
   - Breathing exercises
   - Grounding techniques
   - Self-soothing methods
   - **Status**: Available offline

4. **Community Posts**
   - View cached posts
   - Create queued posts
   - Background sync
   - **Status**: Limited offline functionality

5. **AI Assistant**
   - Requires online connection
   - Fallback to offline guidance
   - **Status**: Online only

6. **Helper Chat**
   - Queue messages for sync
   - View recent conversations
   - **Status**: Limited offline functionality

### Service Worker Integration

The components integrate with the service worker for:
- Crisis resource caching priority
- Background sync for user actions
- Cache update notifications
- Offline capability detection

### Accessibility Features

All components include:
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast mode support
- Reduced motion support
- Proper ARIA labels and roles

## Integration Guide

### 1. Context Setup

Wrap your app with the OfflineProvider:

```typescript
import { OfflineProvider } from './contexts/OfflineProvider';

function App() {
  return (
    <OfflineProvider>
      <YourAppContent />
    </OfflineProvider>
  );
}
```

### 2. Component Usage

Use components throughout your app:

```typescript
import { 
  OfflineIndicator, 
  NetworkBanner, 
  OfflineCapabilities 
} from './components';

function Dashboard() {
  const [showBanner, setShowBanner] = useState(true);
  
  return (
    <div>
      {/* Header status indicator */}
      <OfflineIndicator variant="minimal" />
      
      {/* Connection alerts */}
      {showBanner && (
        <NetworkBanner onDismiss={() => setShowBanner(false)} />
      )}
      
      {/* Feature availability */}
      <OfflineCapabilities variant="compact" />
    </div>
  );
}
```

### 3. Crisis Resource Access

Provide quick access to crisis resources:

```typescript
import { CrisisResourcesModal } from './components';

function EmergencyButton() {
  const [showCrisis, setShowCrisis] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowCrisis(true)}>
        Need Help Now?
      </button>
      
      <CrisisResourcesModal
        isOpen={showCrisis}
        onClose={() => setShowCrisis(false)}
        initialTab="emergency"
      />
    </>
  );
}
```

## CSS Integration

Each component exports its styles. Include them in your CSS:

```css
/* Import component styles */
@import './components/OfflineIndicator.css';
@import './components/NetworkBanner.css';
@import './components/OfflineCapabilities.css';
/* Or include the exported style strings */
```

## Testing Considerations

### Unit Tests
- Component rendering in online/offline states
- Feature availability calculations
- Service worker message handling
- User interaction flows

### Integration Tests
- Cross-component communication
- Service worker integration
- Crisis resource loading
- Offline capability detection

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- Color contrast ratios
- Focus management

## Performance Considerations

### Optimization Features
- Lazy loading of crisis resources
- Memoized capability calculations
- Efficient re-rendering patterns
- Minimal bundle impact

### Bundle Size
- Components are tree-shakable
- Styles are optional
- No unnecessary dependencies
- Efficient TypeScript compilation

## Browser Support

### Modern Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Fallbacks
- Service worker feature detection
- Network Information API graceful degradation
- Progressive enhancement approach

## Future Enhancements

### Planned Features
1. **Push Notifications**: Crisis alert system
2. **Background Updates**: Automatic resource refresh
3. **Enhanced Analytics**: Offline usage tracking
4. **Voice Integration**: Accessibility improvements
5. **Multi-language Support**: Internationalization

### Performance Improvements
1. **Virtual Scrolling**: Large resource lists
2. **Image Optimization**: Cached resource images
3. **Compression**: Resource data optimization
4. **Prefetching**: Predictive resource loading

## Security Considerations

### Data Protection
- No sensitive data in localStorage
- Encrypted crisis resource cache
- Privacy-compliant analytics
- Secure service worker communication

### Content Security
- Validated crisis resource data
- Sanitized user inputs
- XSS protection
- CSRF mitigation

---

This offline UI component system provides a comprehensive foundation for mental health platform offline functionality with crisis intervention priority and accessibility compliance.
