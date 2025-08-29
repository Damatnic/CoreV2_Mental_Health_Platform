# Astral Core - Component Dependencies & Integration Map

*Last Updated: August 3, 2025*

## 🗺️ System Architecture Overview

This document maps all component dependencies to prevent breaking changes when modifying interconnected parts of the system.

## 🏗️ Core Dependency Graph

```
index.tsx (Root)
├── AppProviders
│   ├── NotificationProvider → NotificationContext
│   ├── AuthProvider → AuthContext
│   └── ThemeProvider → ThemeContext
├── AppContent
│   ├── Sidebar → Navigation State
│   ├── Views (Lazy Loaded) → Stores, Contexts
│   ├── Modals → Global State
│   └── Notifications → NotificationContext
```

## 📊 Store Dependencies

### DilemmaStore
**Depends on:**
- `ApiClient.dilemmas.*`
- `authState` from AuthContext
- `useChatStore` (for chat integration)
- `useSessionStore` (for help sessions)
- `notificationService`
- `authService`

**Used by:**
- `FeedView`
- `ShareView`
- `MyPostsView`
- `HelperDashboardView`
- `PostCard` component

**Critical Integrations:**
- Crisis detection in AI service
- Helper matching algorithm
- Chat session creation

### ChatStore
**Depends on:**
- `ApiClient.chat.*`
- `useDilemmaStore` (for post data)
- `useSessionStore` (for session management)
- `notificationService`

**Used by:**
- `ChatView`
- `HelperDashboardView`
- `Sidebar` (unread counts)

**Critical Integrations:**
- Real-time messaging
- Helper availability status
- Crisis escalation

### SessionStore
**Depends on:**
- `ApiClient.sessions.*`
- `authState` from AuthContext
- `notificationService`
- `authService`

**Used by:**
- `PastSessionsView`
- `HelperDashboardView`
- `VideoChatView`
- `ChatView`

### AuthContext
**Depends on:**
- Auth0 SDK
- `securityService`
- Browser localStorage
- Session storage

**Used by:**
- All helper-only views
- Role-based component rendering
- API authentication headers

## 🧩 Component Integration Matrix

### High-Impact Components
Components that affect multiple system areas:

#### Sidebar Component
**Dependencies:**
- `AuthContext` (user role)
- `useDilemmaStore` (post counts)
- `useChatStore` (unread messages)
- `useNotification` (alerts)
- `ThemeContext` (styling)

**Affects:**
- All view navigation
- Mobile responsive layout
- Helper vs user experience
- Crisis resource access

#### PostCard Component
**Dependencies:**
- `Dilemma` type interface
- `useDilemmaStore` (support actions)
- `useChatStore` (start chat)
- `securityService` (content filtering)
- Helper authentication status

**Affects:**
- Feed display
- My posts view
- Helper dashboard
- Content moderation

#### Modal System
**Dependencies:**
- `useNotification` context
- Portal rendering
- Focus management
- Keyboard navigation

**Affects:**
- Crisis resources display
- Report content flow
- Video chat consent
- Settings dialogs

## 🔄 Data Flow Dependencies

### User Actions → State Changes
```
User Click → Component Handler → Store Action → API Call → State Update → UI Re-render
```

### Critical Data Flows

#### Post Creation Flow
```
ShareView 
→ useDilemmaStore.createDilemma 
→ ApiClient.dilemmas.create 
→ AI content analysis 
→ Crisis detection 
→ Store update 
→ Feed refresh
```

#### Chat Initiation Flow
```
PostCard.startChat 
→ useChatStore.startChat 
→ useSessionStore.createSession 
→ Helper notification 
→ Chat view navigation
```

#### Crisis Detection Flow
```
Post content 
→ AI analysis 
→ Crisis flag 
→ CrisisAlert component 
→ Resource recommendations 
→ Emergency contacts
```

## 🚨 Breaking Change Impact Analysis

### If AuthContext Changes
**Immediately Affected:**
- All helper views become inaccessible
- Helper authentication in stores fails
- API calls lose authorization headers
- Role-based rendering breaks

**Testing Required:**
- Login/logout flows
- Role-based access control
- API authentication
- Session persistence

### If ApiClient Changes
**Immediately Affected:**
- All data fetching breaks
- Store actions fail
- Real-time updates stop
- Error handling changes

**Testing Required:**
- All CRUD operations
- Error handling
- Network failures
- Rate limiting

### If Store Interfaces Change
**Immediately Affected:**
- Components using the store
- Other stores with dependencies
- Type checking throughout app
- State persistence

**Testing Required:**
- All store consumers
- Cross-store interactions
- State serialization
- Component re-renders

## 🔗 Third-Party Integration Dependencies

### Google Gemini AI
**Used by:**
- Crisis detection
- AI chat responses
- Content analysis
- Helper guidance

**Failure Impact:**
- AI chat becomes unavailable
- Crisis detection relies on fallback
- Helper guidance disabled
- Content moderation affected

### Auth0
**Used by:**
- Helper authentication
- User role management
- Token refresh
- Security enforcement

**Failure Impact:**
- Helpers cannot log in
- Role verification fails
- API authorization breaks
- Security compromised

### Netlify Functions
**Used by:**
- All backend operations
- Data persistence
- External API calls
- Background processing

**Failure Impact:**
- App becomes read-only
- Real-time features break
- Data loss possible
- User sessions affected

## 📱 Platform-Specific Dependencies

### Mobile Dependencies
**Components with mobile-specific code:**
- `Sidebar` (mobile navigation)
- `ChatView` (touch interactions)
- `WellnessVideosView` (video controls)
- All form components (virtual keyboard)

**Critical considerations:**
- Touch event handling
- Viewport configuration
- Performance on low-end devices
- Network condition handling

### Desktop Dependencies
**Components with desktop-specific features:**
- Keyboard navigation
- Hover states
- Right-click menus
- Multi-window support

## 🔧 Build & Deploy Dependencies

### Vite Configuration
**Affects:**
- Code splitting boundaries
- Asset optimization
- Environment variable loading
- Development server behavior

### Netlify Configuration
**Affects:**
- Function deployment
- Redirect rules
- Environment variables
- Build process

## 🧪 Testing Dependencies

### Jest Configuration
**Affects:**
- Module resolution
- Mock implementations
- Test environment setup
- Coverage reporting

### Component Testing Dependencies
```
Component tests → Test utilities → Mock contexts → Mock stores → Mock API client
```

## 📊 Performance Dependencies

### Code Splitting Points
```
index.tsx
├── Views (Lazy loaded)
├── Stores (Eager loaded)
├── Contexts (Eager loaded)
└── Utils (On-demand)
```

### Bundle Dependencies
- React ecosystem (core dependency)
- UI components (shared chunks)
- Utility libraries (vendor chunk)
- AI SDK (separate chunk)

## 🔍 Debugging Dependency Issues

### Common Dependency Problems

#### Circular Dependencies
```bash
# Check for circular imports
npm run build -- --mode development
# Look for warnings about circular dependencies
```

#### Missing Dependencies
```bash
# Check for missing peer dependencies
npm ls
# Look for UNMET DEPENDENCY warnings
```

#### Version Conflicts
```bash
# Check for version conflicts
npm audit
# Review package-lock.json for version mismatches
```

### Dependency Change Checklist

#### Before Modifying Shared Components
- [ ] Identify all consumers
- [ ] Check type compatibility
- [ ] Review state dependencies
- [ ] Test all integration points
- [ ] Update documentation

#### Before Changing Store Interfaces
- [ ] Check all store consumers
- [ ] Verify type definitions
- [ ] Test state migrations
- [ ] Review performance impact
- [ ] Update tests

#### Before API Changes
- [ ] Check all API client consumers
- [ ] Test error handling
- [ ] Verify backward compatibility
- [ ] Review authentication impact
- [ ] Test network failures

## 🔄 Safe Modification Strategies

### 1. Backward Compatible Changes
```typescript
// ✅ Add optional properties
interface OldInterface {
  id: string;
  name: string;
}

interface NewInterface extends OldInterface {
  description?: string; // Optional, won't break existing code
}
```

### 2. Deprecation Strategy
```typescript
// ✅ Deprecate gradually
interface ComponentProps {
  /** @deprecated Use newProp instead */
  oldProp?: string;
  newProp?: string;
}

const Component = ({ oldProp, newProp }: ComponentProps) => {
  const prop = newProp || oldProp; // Support both
  if (oldProp) {
    console.warn('oldProp is deprecated, use newProp instead');
  }
  // ...
};
```

### 3. Feature Flags for Dependencies
```typescript
// ✅ Use feature flags for risky changes
const useNewStore = import.meta.env.VITE_USE_NEW_STORE === 'true';

const store = useNewStore ? newStore : legacyStore;
```

## 📋 Dependency Review Process

### Weekly Dependency Health Check
- [ ] Review npm audit results
- [ ] Check for outdated packages
- [ ] Verify all integrations working
- [ ] Monitor performance metrics
- [ ] Review error logs for dependency issues

### Monthly Architecture Review
- [ ] Review component coupling
- [ ] Identify potential circular dependencies
- [ ] Assess third-party dependency health
- [ ] Plan dependency updates
- [ ] Document new dependencies

### Before Major Changes
- [ ] Map all affected components
- [ ] Create dependency change plan
- [ ] Set up monitoring for affected areas
- [ ] Prepare rollback strategy
- [ ] Schedule thorough testing

This dependency map serves as a reference for understanding the interconnected nature of the Astral Core system and helps prevent unintended breaking changes.
