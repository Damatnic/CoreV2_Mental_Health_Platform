# Astral Core - Project Architecture Reference

## 🏗️ Project Overview
**Astral Core** is a comprehensive mental health support platform built with React, TypeScript, and modern web technologies. It provides anonymous peer-to-peer support, AI-powered assistance, wellness tracking, and crisis intervention tools.

### Core Purpose
- **Anonymous Support**: Provide safe, judgment-free mental health support
- **Crisis Prevention**: Early detection and intervention for mental health crises
- **Peer-to-Peer**: Connect users with trained helpers and community support
- **Wellness Tracking**: Monitor mood, habits, and progress over time
- **AI Integration**: Enhance support with AI-powered insights and guidance

## 🏛️ Technical Architecture

### Frontend Stack
- **React 18.3.1** - UI framework with modern hooks and Suspense
- **TypeScript 5.6.3** - Type safety and enhanced developer experience
- **Vite 5.4.19** - Fast build tool and development server
- **Zustand 4.5.7** - Lightweight state management
- **React Router DOM 7.7.1** - Client-side routing

### Backend Architecture
- **Netlify Functions** - Serverless backend API endpoints
- **Google Gemini AI** - AI-powered chat and analysis
- **Auth0** - Authentication for helper accounts
- **Anonymous UUIDs** - User tracking without personal data

### Build & Deployment
- **Netlify** - Static site hosting with serverless functions
- **Vite Build** - Optimized production builds with code splitting
- **Jest + React Testing Library** - Testing framework
- **Storybook** - Component development and documentation

## 📁 Project Structure

```
astralcore/
├── backup-2025-01-03-18-12/         # Complete project backup
│   ├── src/                         # Source code
│   │   ├── components/              # Reusable UI components
│   │   ├── contexts/                # React contexts for global state
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # Business logic services
│   │   ├── stores/                  # Zustand state stores
│   │   ├── styles/                  # CSS stylesheets
│   │   ├── utils/                   # Utility functions
│   │   ├── views/                   # Page/route components
│   │   ├── types.ts                 # TypeScript type definitions
│   │   ├── constants.ts             # App constants
│   │   └── test-utils.tsx           # Testing utilities
│   ├── netlify/functions/           # Serverless API endpoints
│   ├── public/                      # Static assets
│   ├── scripts/                     # Build scripts
│   ├── Videos/                      # Wellness video content
│   ├── package.json                 # Dependencies and scripts
│   ├── vite.config.ts              # Vite configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── netlify.toml                # Netlify deployment config
│   └── jest.config.js              # Jest test configuration
```

## 🧩 Core Components Architecture

### 1. Views (Pages)
All main application screens are located in `src/views/`:

**User Views:**
- `ShareView` - Create new posts/dilemmas
- `FeedView` - Browse community posts
- `MyPostsView` - User's own posts
- `PastSessionsView` - Previous help sessions
- `SettingsView` - User preferences
- `WellnessView` - Mood tracking and wellness tools
- `AssessmentsView` - Mental health assessments

**Helper Views:**
- `HelperDashboardView` - Helper main interface
- `HelperProfileView` - Profile management
- `HelperCommunityView` - Helper-only forum
- `HelperTrainingView` - Training and certification

**Chat Views:**
- `ChatView` - 1-on-1 text chat sessions
- `VideoChatView` - Video calling interface
- `AIChatView` - AI assistant chat

**Admin Views:**
- `AdminDashboardView` - Platform administration
- `ModerationDashboardView` - Content moderation

### 2. Components Library
Reusable UI components in `src/components/`:

**Core Components:**
- `AppButton` - Standardized button component
- `Modal` - Modal dialog system
- `Card` - Content container
- `LoadingSpinner` - Loading states
- `EmptyState` - Empty data states

**Form Components:**
- `AppInput` - Text input with validation
- `AppTextArea` - Multi-line text input

**Navigation:**
- `Sidebar` - Main navigation menu
- `ViewHeader` - Page headers with breadcrumbs

**Specialized:**
- `PostCard` - Display dilemma posts
- `ChatMessage` - Chat message display
- `MoodTracker` - Mood tracking interface
- `CrisisAlert` - Crisis intervention banner

### 3. State Management

#### Zustand Stores (`src/stores/`)
- `dilemmaStore` - Posts/dilemmas state
- `chatStore` - Chat sessions and messages
- `sessionStore` - Help session management
- `assessmentStore` - Mental health assessments
- `preferenceStore` - User preferences

#### React Contexts (`src/contexts/`)
- `AuthContext` - Authentication state
- `ThemeContext` - Light/dark theme
- `NotificationContext` - Toast notifications

### 4. Services Layer (`src/services/`)
Business logic separated from UI:

- `analyticsService` - Usage tracking
- `securityService` - Input validation and security
- `notificationService` - Push notifications
- `moodAnalysisService` - Mood pattern analysis
- `gamificationService` - XP and achievements
- `dataExportService` - Data export/import

### 5. API Client (`src/utils/ApiClient.ts`)
Centralized API communication:

```typescript
export const ApiClient = {
  dilemmas: { /* CRUD operations */ },
  helpers: { /* Helper management */ },
  ai: { /* AI chat and analysis */ },
  wellness: { /* Mood tracking, assessments */ },
  moderation: { /* Content moderation */ }
}
```

## 🔒 Security Architecture

### Anonymous User System
- **UUID-based tracking** - No personal data collection
- **Local storage only** - User data stays on device
- **Optional authentication** - Only required for helpers

### Data Protection
- **Input sanitization** - All user input is sanitized
- **Rate limiting** - Prevents abuse and spam
- **Content filtering** - Automated harmful content detection
- **Crisis detection** - AI-powered crisis intervention

### Helper Authentication
- **Auth0 integration** - Secure helper authentication
- **Role-based access** - Different permissions for different roles
- **Training requirements** - Helpers must complete training

## 🎨 UI/UX Architecture

### Design System
- **CSS Variables** - Consistent theming
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG 2.1 AA compliance
- **Dark/Light Theme** - User preference support

### Navigation Flow
```
Welcome Screen → Main App
├── Sidebar Navigation
│   ├── Seeker Views (anonymous users)
│   └── Helper Views (authenticated)
├── Modal System
│   ├── Crisis Resources
│   ├── Report Content
│   └── Video Chat Consent
└── Toast Notifications
```

### State Flow
```
User Action → Store Update → Component Re-render
     ↓
API Call → Backend Processing → Response
     ↓
Store Update → UI Update
```

## 🔌 API Architecture

### Netlify Functions
All backend logic runs as serverless functions:

- `admin.ts` - Administrative functions
- `ai.ts` - AI chat and analysis
- `chat.ts` - Chat message handling
- `dilemmas.ts` - Post management
- `helpers.ts` - Helper operations
- `moderation.ts` - Content moderation
- `sessions.ts` - Help session management
- `wellness.ts` - Wellness tracking

### Request Flow
```
Frontend → Netlify Functions → External APIs
                ↓
        Response Processing
                ↓
        Frontend State Update
```

## 🧪 Testing Strategy

### Test Types
- **Unit Tests** - Component and function testing
- **Integration Tests** - Store and service testing
- **E2E Tests** - Full user flow testing

### Test Structure
```
src/
├── components/
│   ├── Component.tsx
│   ├── Component.test.tsx
│   └── Component.stories.tsx
├── stores/
│   ├── store.ts
│   └── store.test.ts
```

## 🚀 Deployment Pipeline

### Build Process
1. **Development** - `npm run dev` (Vite dev server)
2. **Testing** - `npm test` (Jest test runner)
3. **Building** - `npm run build` (Vite production build)
4. **Deployment** - Automatic via Netlify

### Environment Configuration
- **Development** - Local development with mock data
- **Production** - Netlify with real APIs

## 📊 Performance Considerations

### Code Splitting
- **Lazy loading** - Views loaded on demand
- **Suspense boundaries** - Loading states for async components
- **Bundle optimization** - Vite automatic code splitting

### Caching Strategy
- **Static assets** - CDN caching
- **API responses** - Client-side caching where appropriate
- **User data** - Local storage persistence

### Monitoring
- **Error tracking** - Built-in error boundaries
- **Performance metrics** - Analytics service integration
- **User feedback** - In-app feedback system

## 🔄 Data Flow Summary

1. **User Interaction** → Component Event Handler
2. **Store Action** → Zustand Store Update
3. **API Call** → Netlify Function
4. **External Service** → Google AI, Auth0, etc.
5. **Response Processing** → Store Update
6. **UI Re-render** → React Component Update

This architecture ensures scalability, maintainability, and security while providing a smooth user experience for mental health support.
