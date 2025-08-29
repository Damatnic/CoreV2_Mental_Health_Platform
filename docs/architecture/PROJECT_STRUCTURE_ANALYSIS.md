# Astral Core React - Project Structure Analysis

## Project Overview
**Name**: astral-core-react  
**Version**: 1.0.0  
**Description**: An anonymous app for peer-to-peer mental-health support  
**Author**: Astral Team  

## Technology Stack

### Frontend Technologies
- **React**: 18.3.1 (Latest stable)
- **TypeScript**: 5.6.3 (Strong typing)
- **Vite**: 5.4.19 (Build tool & dev server)
- **React Router DOM**: 7.7.1 (Client-side routing)

### State Management
- **Zustand**: 4.5.7 (Lightweight state management)
- **React Context**: Custom providers for themes, sessions, notifications

### UI & Styling
- **CSS Modules**: Component-specific styling
- **React Markdown**: 9.0.1 (Markdown rendering)
- **Design System**: Custom CSS design system

### PWA & Offline Support
- **Service Workers**: Enhanced SW with intelligent caching
- **Workbox**: 7.3.0 (Service worker management)
- **Web Vitals**: 5.1.0 (Performance monitoring)

### Internationalization
- **i18next**: 25.3.2 (Core i18n framework)
- **react-i18next**: 15.6.1 (React integration)
- **7 Languages Supported**: en, es, pt, ar, vi, tl, zh

### AI & Analytics
- **Google GenAI**: 1.12.0 (AI integration)
- **TensorFlow.js**: 4.22.0 (ML capabilities)
- **Natural Language Processing**: compromise, natural, sentiment

### Security & Monitoring
- **Sentry**: 10.1.0 (Error tracking)
- **Crypto-js**: 4.2.0 (Encryption)
- **Helmet**: 8.1.0 (Security headers)

### Testing Framework
- **Jest**: 29.7.0 (Unit testing)
- **Playwright**: 1.54.2 (E2E testing)
- **Testing Library**: React, Jest DOM, User Event
- **Storybook**: 8.6.14 (Component documentation)

### Development & Build
- **ESLint**: Code linting
- **Terser**: Code minification
- **Netlify**: Deployment platform
- **PM2**: Process management

## Directory Structure

```
astral-core-react/
├── public/                     # Static assets
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── sw-enhanced.js         # Enhanced service worker
│   ├── offline.html           # Offline fallback page
│   ├── crisis-resources.json  # Crisis support data
│   └── Videos/                # Video content
├── src/                       # Source code
│   ├── components/            # Reusable UI components
│   ├── views/                 # Page-level components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # Business logic & APIs
│   ├── stores/                # Zustand state stores
│   ├── utils/                 # Utility functions
│   ├── styles/                # CSS stylesheets
│   ├── i18n/                  # Internationalization
│   ├── types.ts               # TypeScript definitions
│   └── constants.ts           # Application constants
├── tests/                     # Test suites
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── e2e/                   # End-to-end tests
│   └── service-worker/        # SW-specific tests
├── docs/                      # Documentation
├── scripts/                   # Build & utility scripts
├── backups/                   # Project backups
└── netlify/                   # Netlify functions
```

## Key Architecture Components

### Service Worker Strategy
- **Enhanced SW**: [`src/sw-enhanced.ts`](src/sw-enhanced.ts)
- **Custom SW**: [`src/sw-custom.js`](src/sw-custom.js)
- **Crisis Resource Caching**: Offline crisis support
- **Background Sync**: Queue requests when offline
- **Push Notifications**: Crisis alerts and notifications

### State Management Architecture
- **Session Store**: User authentication & session data
- **Wellness Store**: Health tracking & mood data
- **Chat Store**: Conversation history
- **Assessment Store**: Mental health assessments
- **Dilemma Store**: Peer support scenarios

### Context Providers
- **ThemeContext**: Dark/light mode theming
- **NotificationContext**: Toast notifications
- **SessionContext**: User session management
- **OfflineProvider**: Offline state detection
- **WellnessContext**: Health data management

### Service Layer
- **Crisis Detection**: AI-powered crisis identification
- **Encryption Service**: Data security & privacy
- **Analytics Service**: Usage tracking & insights
- **Auth Service**: Authentication management
- **Cache Integration**: Intelligent caching strategies

### Component Architecture
- **Atomic Design**: Components organized by complexity
- **Responsive**: Mobile-first design approach
- **Accessible**: WCAG compliance focus
- **Internationalized**: Multi-language support

## Build Configuration

### Vite Configuration Highlights
- **Code Splitting**: Optimized chunks for performance
- **Asset Optimization**: Image & video handling
- **Bundle Analysis**: Tree-shaking & optimization
- **Mobile Optimization**: Chunk size limits for mobile networks
- **Legacy Support**: ES2015 target for older browsers

### Build Scripts
- **Production Build**: `npm run build:production`
- **Mobile Build**: `npm run build:mobile`
- **Optimized Build**: `npm run build:optimized`
- **Bundle Analysis**: `npm run build:analyze`

### Performance Features
- **Critical CSS**: Inlined for faster loading
- **Lazy Loading**: Route-based code splitting
- **Service Worker**: Aggressive caching strategy
- **Image Optimization**: WebP & AVIF support

## Testing Strategy

### Unit Testing
- **Jest Configuration**: Custom setup for React/TS
- **Component Testing**: React Testing Library
- **Service Testing**: Business logic validation
- **Store Testing**: State management verification

### Integration Testing
- **API Integration**: Service layer testing
- **Context Integration**: Provider testing
- **Store Integration**: Cross-store communication

### E2E Testing
- **Playwright Setup**: Multi-browser testing
- **Crisis Scenarios**: Critical path testing
- **Mobile Responsive**: Device-specific testing
- **Accessibility**: A11y compliance testing
- **Helper Certification**: Workflow testing

### Service Worker Testing
- **Cache Strategies**: Offline functionality
- **Background Sync**: Request queuing
- **Push Notifications**: Alert system
- **Cross-browser**: Compatibility testing

## Deployment Architecture

### Netlify Configuration
- **Functions**: [`netlify/functions/`](netlify/functions/)
- **Redirects**: [`public/_redirects`](public/_redirects)
- **Build Command**: `npm run build:netlify`
- **PWA Support**: Service worker deployment

### Performance Monitoring
- **Web Vitals**: Core metrics tracking
- **Sentry Integration**: Error monitoring
- **Analytics**: User behavior tracking
- **Performance Loader**: Custom performance tracking

## Security Implementation

### Data Protection
- **Encryption**: Client-side data encryption
- **Anonymous Authentication**: Privacy-focused auth
- **CORS Configuration**: Secure API access
- **Content Security Policy**: XSS protection

### Crisis Safety Features
- **Crisis Detection**: AI-powered identification
- **Emergency Contacts**: Quick access to help
- **Safety Plans**: Personalized crisis plans
- **Escalation Workflow**: Professional intervention

## Mental Health Features

### Core Functionality
- **Peer-to-Peer Support**: Anonymous chat system
- **Crisis Detection**: AI-powered safety monitoring
- **Helper Certification**: Trained volunteer system
- **Wellness Tracking**: Mood & habit monitoring
- **Assessment Tools**: Mental health screening

### Specialized Components
- **Crisis Resources**: Emergency support information
- **Coping Strategies**: Offline-accessible content
- **Safety Planning**: Personalized crisis management
- **Community Features**: Group discussions & challenges

## Development Workflow

### Local Development
- **Dev Server**: `npm run dev` (Netlify integration)
- **Vite Dev**: `npm run dev:vite` (Direct Vite)
- **Hot Reload**: Instant feedback during development
- **Debug Mode**: Comprehensive logging

### Code Quality
- **ESLint**: Code style enforcement
- **TypeScript**: Type safety
- **Jest**: Test coverage requirements
- **Storybook**: Component documentation

## Project Strengths

1. **Robust PWA Implementation**: Comprehensive offline support
2. **Strong Type Safety**: Full TypeScript implementation
3. **Comprehensive Testing**: Unit, integration, and E2E coverage
4. **Performance Optimized**: Mobile-first build configuration
5. **Security Focused**: Encryption and privacy by design
6. **Accessibility**: WCAG compliance focus
7. **Internationalization**: Multi-language support
8. **Mental Health Specialized**: Purpose-built for crisis support

## Areas for Enhancement

1. **Bundle Size Optimization**: Further code splitting opportunities
2. **Performance Monitoring**: Enhanced real-time metrics
3. **Test Coverage**: Expand E2E scenario coverage
4. **Documentation**: API documentation gaps
5. **Security Auditing**: Regular vulnerability scanning
6. **Mobile UX**: Touch interaction improvements
7. **Error Boundaries**: Comprehensive error handling

## Technology Dependencies Analysis

### Production Dependencies (29 packages)
- **Critical**: React, TypeScript, Zustand, i18next
- **Performance**: TensorFlow.js, Web Vitals, Compromise
- **Security**: Crypto-js, Sentry, Helmet
- **AI/ML**: Google GenAI, Natural, Sentiment

### Development Dependencies (28 packages)
- **Testing**: Jest, Playwright, Testing Library
- **Build Tools**: Vite, Workbox, Terser
- **Documentation**: Storybook
- **Quality**: ESLint, TypeScript

### Engine Requirements
- **Node.js**: >=18.0.0
- **NPM**: >=9.0.0

---

*Analysis completed on: ${new Date().toISOString()}*  
*Project backup: astral-backup-2025-08-11T04-59-08*