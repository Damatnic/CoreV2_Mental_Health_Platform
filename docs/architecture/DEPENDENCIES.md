# Dependencies Documentation

## Core Dependencies

### React Ecosystem
- **react** (^18.2.0): Core React library for building user interfaces
- **react-dom** (^18.2.0): React renderer for web applications
- **react-router-dom** (^6.16.0): Declarative routing for React applications

### Build Tools
- **vite** (^4.4.5): Fast build tool with HMR support
- **@vitejs/plugin-react** (^4.0.3): Official React plugin for Vite
- **esbuild** (^0.18.20): Fast JavaScript bundler used by Vite

### Authentication
- **@auth0/auth0-react** (^2.2.1): Auth0 SDK for React applications

### State Management
- **zustand** (^4.4.1): Lightweight state management solution

### Internationalization
- **i18next** (^23.5.1): Internationalization framework
- **react-i18next** (^13.2.2): React bindings for i18next
- **i18next-browser-languagedetector** (^7.1.0): Language detection for browsers
- **i18next-http-backend** (^2.2.2): Backend plugin for loading translations

### Testing
- **@testing-library/react** (^14.0.0): React testing utilities
- **@testing-library/jest-dom** (^6.1.3): Custom Jest matchers for DOM
- **@testing-library/user-event** (^14.4.3): User interaction simulation
- **jest** (^29.6.4): JavaScript testing framework
- **vitest** (^0.34.4): Unit test framework for Vite

### Development Tools
- **typescript** (^5.2.2): TypeScript language support
- **eslint** (^8.49.0): JavaScript linter
- **prettier** (^3.0.3): Code formatter
- **netlify-cli** (^16.3.4): Netlify deployment CLI

### Performance Monitoring
- **web-vitals** (^3.4.0): Library for measuring web vitals metrics
- **@opentelemetry/api** (^1.4.1): OpenTelemetry API for distributed tracing
- **@opentelemetry/sdk-trace-web** (^1.15.2): OpenTelemetry web tracing SDK

### UI/UX
- **framer-motion** (^10.16.4): Animation library for React
- **chart.js** (^4.4.0): Charting library
- **react-chartjs-2** (^5.2.0): React wrapper for Chart.js

### Utilities
- **date-fns** (^2.30.0): Modern JavaScript date utility library
- **zod** (^3.22.2): TypeScript-first schema validation
- **immer** (^10.0.2): Immutable state updates
- **fuse.js** (^6.6.2): Lightweight fuzzy-search library

### Security
- **dompurify** (^3.0.5): DOM-only XSS sanitizer
- **js-cookie** (^3.0.5): JavaScript cookie library

### Service Worker & PWA
- **workbox-cli** (^7.0.0): Workbox command line tool
- **workbox-precaching** (^7.0.0): Precaching with Workbox
- **workbox-routing** (^7.0.0): Routing with Workbox
- **workbox-strategies** (^7.0.0): Caching strategies

## Development Dependencies

### Build & Bundle
- **@types/node** (^20.6.0): TypeScript definitions for Node.js
- **@types/react** (^18.2.21): TypeScript definitions for React
- **@types/react-dom** (^18.2.7): TypeScript definitions for React DOM

### Testing
- **@playwright/test** (^1.37.1): End-to-end testing framework
- **jest-environment-jsdom** (^29.6.4): JSDOM environment for Jest
- **msw** (^1.3.0): Mock Service Worker for API mocking

### Code Quality
- **eslint-plugin-react** (^7.33.2): React specific linting rules
- **eslint-plugin-react-hooks** (^4.6.0): Rules of Hooks
- **@typescript-eslint/parser** (^6.6.0): TypeScript parser for ESLint
- **@typescript-eslint/eslint-plugin** (^6.6.0): TypeScript linting rules

## Dependency Decisions

### Why Vite over Create React App?
- **Performance**: Significantly faster HMR and build times
- **Modern**: Native ES modules support
- **Flexibility**: Better configuration options
- **Active Development**: CRA is no longer actively maintained

### Why Zustand over Redux?
- **Simplicity**: Less boilerplate code
- **Performance**: Built-in optimization
- **Size**: Much smaller bundle size (8KB vs 60KB)
- **TypeScript**: Better TypeScript support out of the box

### Why Auth0?
- **Security**: Industry-standard authentication
- **Features**: MFA, social logins, passwordless
- **Compliance**: GDPR, HIPAA-eligible
- **Mental Health Focus**: Appropriate for sensitive data

### Why i18next?
- **Maturity**: Most mature i18n solution for React
- **Features**: Pluralization, interpolation, formatting
- **Community**: Large ecosystem and community
- **Performance**: Lazy loading and code splitting support

### Why Jest + Vitest?
- **Jest**: Industry standard, great ecosystem
- **Vitest**: Native Vite support, faster execution
- **Coverage**: Comprehensive testing capabilities
- **Migration Path**: Easy to migrate between them

### Why Workbox?
- **PWA**: Complete PWA solution
- **Caching**: Advanced caching strategies
- **Google**: Maintained by Google
- **Integration**: Works well with Vite

## Security Considerations

### Known Vulnerabilities
- Most vulnerabilities are in development dependencies (netlify-cli, workbox-cli)
- Production dependencies are regularly audited
- Critical updates are applied immediately

### Security Measures
- Regular `npm audit` checks
- Dependabot alerts enabled
- Conservative update strategy for production deps
- Thorough testing before major updates

## Update Strategy

### Production Dependencies
- **Patch versions**: Update weekly
- **Minor versions**: Update monthly after testing
- **Major versions**: Update quarterly with thorough testing

### Development Dependencies
- **All versions**: Update as needed
- **Security patches**: Apply immediately

## Bundle Size Considerations

### Current Bundle Sizes (approximate)
- React + React DOM: ~140KB
- Auth0: ~90KB
- i18next: ~40KB
- Zustand: ~8KB
- Total vendor bundle: ~350KB (gzipped)

### Optimization Strategies
- Code splitting by route
- Lazy loading for non-critical features
- Tree shaking enabled
- Dynamic imports for heavy libraries

## Future Considerations

### Potential Additions
- **React Query/TanStack Query**: For server state management
- **Radix UI**: For accessible UI components
- **Sentry**: For production error tracking
- **PostHog**: For product analytics

### Potential Removals
- **workbox-cli**: May switch to Vite PWA plugin
- **netlify-cli**: Only needed for deployment

## License Compatibility

All dependencies are compatible with Apache 2.0 license:
- MIT licensed: Most dependencies
- Apache 2.0: Compatible
- BSD: Compatible
- ISC: Compatible

No GPL or AGPL dependencies are included.

---

Last Updated: November 2024
Version: 1.0.0