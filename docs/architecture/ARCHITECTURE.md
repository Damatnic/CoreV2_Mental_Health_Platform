# CoreV2 Architecture Documentation

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Performance Architecture](#performance-architecture)
- [Deployment Architecture](#deployment-architecture)

## Overview

CoreV2 is a comprehensive mental health support platform built with React, TypeScript, and modern web technologies. The architecture prioritizes:

- **Privacy & Security**: End-to-end encryption, GDPR compliance
- **Performance**: Sub-3s load times, 95+ Lighthouse scores
- **Accessibility**: WCAG 2.1 AA compliance
- **Scalability**: Serverless architecture, CDN distribution
- **Reliability**: 99.9% uptime, offline support

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                               │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   Web Application       │     │   Mobile PWA            │
│   (React SPA)          │     │   (Service Worker)      │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    CDN (Netlify Edge)                       │
│   - Static Assets                                          │
│   - API Gateway                                            │
│   - Edge Functions                                         │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   Auth Service         │     │   API Services          │
│   (Auth0)             │     │   (Netlify Functions)   │
└─────────────────────────┘     └─────────────────────────┘
```

## Frontend Architecture

### Component Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── privacy/        # Privacy & consent components
│   ├── safety/         # Crisis & safety components
│   └── [feature]/      # Feature-specific components
├── contexts/           # React contexts for global state
├── hooks/              # Custom React hooks
├── services/           # Business logic & API services
├── stores/             # Zustand state stores
├── utils/              # Utility functions
├── views/              # Page-level components
└── i18n/              # Internationalization
```

### Component Hierarchy

```
App
├── Providers (Theme, Auth, i18n, Offline)
├── Router
│   ├── Public Routes
│   │   ├── Landing
│   │   ├── Login/Register
│   │   └── Crisis Resources
│   └── Protected Routes
│       ├── Dashboard
│       ├── Chat/Support
│       ├── Assessments
│       ├── Resources
│       └── Settings
├── Global Components
│   ├── CrisisAlert
│   ├── NetworkBanner
│   └── ServiceWorkerUpdate
└── Error Boundary
```

### State Management

#### Zustand Stores
- **sessionStore**: User session & authentication
- **wellnessStore**: Mental health tracking
- **chatStore**: Real-time messaging
- **assessmentStore**: Mental health assessments
- **dilemmaStore**: Community support posts
- **preferenceStore**: User preferences
- **reflectionStore**: Journal entries
- **tetherStore**: Crisis connections

#### React Context
- **AuthContext**: Authentication state
- **ThemeContext**: Theme preferences
- **OfflineContext**: Offline capabilities
- **NotificationContext**: In-app notifications
- **SessionContext**: Active session management
- **WellnessContext**: Wellness tracking

## Data Flow

### Request Flow

```
User Action
    │
    ▼
Component
    │
    ├─> Hook (useAnalytics, useAuth, etc.)
    │
    ├─> Store Action (Zustand)
    │
    ├─> Service Layer
    │   ├─> API Service
    │   ├─> WebSocket Service
    │   └─> Local Storage
    │
    └─> Update UI
```

### Real-time Communication

```
WebSocket Connection
    │
    ├─> Authentication
    ├─> Subscribe to channels
    ├─> Message handling
    │   ├─> Crisis alerts
    │   ├─> Chat messages
    │   └─> System notifications
    └─> Reconnection logic
```

## Security Architecture

### Authentication Flow

```
User Login
    │
    ├─> Auth0 Universal Login
    ├─> MFA (if enabled)
    ├─> Token Generation
    │   ├─> Access Token (JWT)
    │   └─> Refresh Token
    ├─> Session Creation
    └─> Role-Based Access Control
```

### Data Protection

- **Encryption**: TLS 1.3 for transit, AES-256 for storage
- **Token Management**: Secure token storage, automatic refresh
- **Input Validation**: Zod schemas, XSS prevention
- **Rate Limiting**: API throttling, DDoS protection
- **Privacy**: GDPR compliance, data minimization

### RBAC Permissions

```
Admin
├── All permissions
│
Moderator
├── Content moderation
├── User management
├── Crisis intervention
│
Certified Helper
├── Direct support
├── Resource access
├── Community features
│
Community Helper
├── Basic support
├── Limited resources
│
Seeker
└── Basic access
```

## Performance Architecture

### Optimization Strategies

1. **Code Splitting**
   - Route-based splitting
   - Component lazy loading
   - Dynamic imports

2. **Caching Strategy**
   ```
   Static Assets  -> Cache First (1 year)
   API Responses  -> Network First (5 min cache)
   Crisis Resources -> Cache First (24 hours)
   User Data      -> Network Only
   ```

3. **Bundle Optimization**
   - Tree shaking
   - Minification
   - Compression (Brotli/Gzip)
   - Image optimization (WebP)

4. **Service Worker**
   ```
   Precache
   ├── App shell
   ├── Crisis resources
   ├── Core assets
   │
   Runtime Cache
   ├── API responses
   ├── User content
   └── Dynamic resources
   ```

### Performance Monitoring

```
Web Vitals
├── FCP < 1.8s
├── LCP < 2.5s
├── FID < 100ms
├── CLS < 0.1
└── TTI < 3.8s

Custom Metrics
├── Crisis response time < 300ms
├── Chat latency < 100ms
├── Offline sync < 5s
└── Search results < 200ms
```

## Deployment Architecture

### Infrastructure

```
GitHub Repository
    │
    ├─> GitHub Actions (CI/CD)
    │   ├─> Linting & Type checking
    │   ├─> Unit & Integration tests
    │   ├─> E2E tests (Playwright)
    │   └─> Build & Deploy
    │
    └─> Netlify
        ├─> Edge Network (CDN)
        ├─> Serverless Functions
        ├─> Edge Functions
        └─> Analytics
```

### Environment Strategy

```
Development
├── Local development server
├── Hot module replacement
├── Debug tools enabled
│
Staging
├── Preview deployments
├── Feature branches
├── E2E testing
│
Production
├── Optimized builds
├── Error tracking (Sentry)
├── Analytics (GA4)
└── Performance monitoring
```

## Crisis Response Architecture

### Detection Pipeline

```
User Input
    │
    ├─> Keyword Detection
    ├─> Pattern Analysis
    ├─> Sentiment Analysis
    └─> Risk Assessment
        │
        ├─> Low Risk    -> Suggestions
        ├─> Medium Risk -> Resources + Alert
        └─> High Risk   -> Immediate Intervention
```

### Intervention Workflow

```
Crisis Detected
    │
    ├─> Display Crisis Alert
    ├─> Provide Resources
    │   ├─> Emergency contacts
    │   ├─> Crisis hotlines
    │   └─> Safety planning
    ├─> Notify Support Team
    └─> Track Outcome
```

## Internationalization Architecture

### Language Support

```
i18next
├── Language Detection
│   ├─> Browser preference
│   ├─> User selection
│   └─> Fallback (English)
├── Translation Loading
│   ├─> Lazy loading
│   ├─> Namespace splitting
│   └─> Local caching
└── Cultural Adaptation
    ├─> RTL support (Arabic)
    ├─> Date/time formatting
    ├─> Number formatting
    └─> Cultural resources
```

### Supported Locales

- **en**: English (default)
- **es**: Spanish
- **pt**: Portuguese
- **ar**: Arabic (RTL)
- **zh**: Chinese
- **vi**: Vietnamese
- **tl**: Tagalog

## Testing Architecture

### Testing Pyramid

```
        E2E Tests (Playwright)
       /          \
      /            \
   Integration Tests
  /                \
 /                  \
Unit Tests (Jest/Vitest)
```

### Test Coverage

- **Unit Tests**: 85%+ coverage
- **Integration Tests**: Critical paths
- **E2E Tests**: User journeys
- **Performance Tests**: Lighthouse CI
- **Accessibility Tests**: axe-core

## Monitoring & Observability

### Monitoring Stack

```
Application
    │
    ├─> Performance Monitoring
    │   ├─> Web Vitals
    │   ├─> Custom metrics
    │   └─> User timing
    │
    ├─> Error Tracking
    │   ├─> Sentry
    │   ├─> Console logs
    │   └─> Error boundaries
    │
    ├─> Analytics
    │   ├─> Google Analytics
    │   ├─> Custom events
    │   └─> Privacy-safe tracking
    │
    └─> OpenTelemetry
        ├─> Distributed tracing
        ├─> Metrics collection
        └─> Log aggregation
```

## Scalability Considerations

### Horizontal Scaling
- Stateless architecture
- CDN distribution
- Serverless functions
- Database sharding ready

### Vertical Scaling
- Lazy loading
- Code splitting
- Resource optimization
- Caching strategies

### Future Scaling Plans
- Microservices migration
- GraphQL API layer
- Redis caching layer
- Kubernetes deployment

## Technology Decisions

### Frontend Stack
- **React 18**: Modern UI library
- **TypeScript**: Type safety
- **Vite**: Fast build tool
- **Zustand**: State management

### Backend Services
- **Netlify Functions**: Serverless
- **Auth0**: Authentication
- **WebSocket**: Real-time

### Infrastructure
- **GitHub Actions**: CI/CD
- **Netlify**: Hosting & CDN
- **Sentry**: Error tracking

## Best Practices

### Code Organization
- Feature-based structure
- Shared component library
- Centralized services
- Type-safe APIs

### Development Workflow
- Git flow branching
- PR reviews required
- Automated testing
- Continuous deployment

### Security Practices
- Regular audits
- Dependency updates
- Penetration testing
- Security headers

---

Last Updated: November 2024
Version: 1.0.0