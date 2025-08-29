# AstralCore V4 - Complete Mental Health Platform Architecture Blueprint

## 🚀 Executive Summary

AstralCore V4 is a production-ready mental health crisis support platform designed with a **CRISIS-FIRST** approach. This comprehensive architecture blueprint defines the complete system for 40+ development agents to build from.

**Core Mission**: Provide immediate, accessible mental health crisis intervention and ongoing support through a mobile-first, offline-capable progressive web application.

---

## 🏗️ Complete Project Structure

```
AstralCoreV4/
├── 📁 src/
│   ├── 📁 components/           # Reusable UI components
│   │   ├── 📁 crisis/          # Crisis intervention components
│   │   │   ├── PanicButton.tsx          # Immediate crisis button
│   │   │   ├── CrisisDetector.tsx       # AI-powered crisis detection
│   │   │   ├── EmergencyContactsWidget.tsx
│   │   │   ├── CrisisResourcesModal.tsx
│   │   │   ├── CrisisEscalationFlow.tsx
│   │   │   ├── QuickExitButton.tsx      # ESC x3 functionality
│   │   │   ├── CalmingBreather.tsx      # Breathing exercises
│   │   │   └── SafeSpaceIndicator.tsx   # Visual safety cues
│   │   │
│   │   ├── 📁 chat/             # AI therapeutic chat system
│   │   │   ├── AITherapistChat.tsx      # Main chat interface
│   │   │   ├── CrisisKeywordDetector.tsx
│   │   │   ├── ChatHistoryManager.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── VoiceToText.tsx
│   │   │   └── ChatAccessibility.tsx
│   │   │
│   │   ├── 📁 wellness/         # Wellness tracking components
│   │   │   ├── MoodTracker.tsx          # Daily mood logging
│   │   │   ├── WellnessChart.tsx        # Visual mood trends
│   │   │   ├── TriggerLogger.tsx        # Identify triggers
│   │   │   ├── CopingStrategies.tsx     # Personalized coping
│   │   │   ├── ProgressIndicator.tsx
│   │   │   ├── WellnessInsights.tsx     # AI-generated insights
│   │   │   └── WellnessGoals.tsx
│   │   │
│   │   ├── 📁 community/        # Anonymous peer support
│   │   │   ├── PeerSupportFeed.tsx      # Anonymous sharing
│   │   │   ├── SupportGroupChat.tsx     # Group conversations
│   │   │   ├── PeerModerationSystem.tsx
│   │   │   ├── AnonymousProfile.tsx
│   │   │   ├── CommunityGuidelines.tsx
│   │   │   ├── ReportingSystem.tsx
│   │   │   └── PeerVerification.tsx
│   │   │
│   │   ├── 📁 safety/           # Safety planning tools
│   │   │   ├── SafetyPlanBuilder.tsx    # Personalized safety plans
│   │   │   ├── WarningSignTracker.tsx   # Early warning detection
│   │   │   ├── CopingStrategyBank.tsx   # Strategy repository
│   │   │   ├── SupportNetworkMap.tsx    # Contact visualization
│   │   │   ├── CrisisActionPlan.tsx     # Step-by-step crisis plan
│   │   │   ├── EnvironmentSafety.tsx    # Location safety
│   │   │   └── SafetyPlanExport.tsx     # PDF/print export
│   │   │
│   │   ├── 📁 exercises/        # Grounding and therapeutic exercises
│   │   │   ├── BreathingExercises.tsx   # Multiple breathing patterns
│   │   │   ├── GroundingTechniques.tsx  # 5-4-3-2-1, body scan
│   │   │   ├── MindfulnessGuides.tsx    # Guided meditation
│   │   │   ├── ProgressiveRelaxation.tsx
│   │   │   ├── VisualizationTherapy.tsx
│   │   │   ├── CognitiveBehavioralTools.tsx
│   │   │   └── ExerciseTracker.tsx
│   │   │
│   │   ├── 📁 mobile/           # Mobile-optimized components
│   │   │   ├── MobileNavigation.tsx     # Bottom tab navigation
│   │   │   ├── SwipeGestures.tsx        # Touch interactions
│   │   │   ├── MobileCrisisFloat.tsx    # Floating crisis button
│   │   │   ├── TouchOptimized.tsx       # 60px+ touch targets
│   │   │   ├── MobileKeyboard.tsx       # Keyboard handling
│   │   │   ├── PullToRefresh.tsx        # Mobile refresh
│   │   │   └── MobileAccessibility.tsx
│   │   │
│   │   ├── 📁 offline/          # Offline support components
│   │   │   ├── OfflineIndicator.tsx     # Connection status
│   │   │   ├── CachedResources.tsx      # Offline crisis resources
│   │   │   ├── OfflineChat.tsx          # Offline chat support
│   │   │   ├── LocalStorageManager.tsx
│   │   │   ├── SyncManager.tsx          # Data synchronization
│   │   │   └── OfflineFallbacks.tsx
│   │   │
│   │   └── 📁 common/           # Shared components
│   │       ├── LoadingStates.tsx        # Consistent loading UX
│   │       ├── ErrorBoundaries.tsx      # Error handling
│   │       ├── AccessibilityWrapper.tsx
│   │       ├── ThemeProvider.tsx        # Dark/light themes
│   │       ├── NotificationSystem.tsx   # Push notifications
│   │       ├── ModalSystem.tsx          # Modal management
│   │       ├── TooltipSystem.tsx
│   │       └── AnimationProvider.tsx
│   │
│   ├── 📁 features/             # Feature modules (business logic)
│   │   ├── 📁 crisis-intervention/
│   │   │   ├── CrisisManager.ts         # Central crisis coordination
│   │   │   ├── EmergencyProtocols.ts    # 988, emergency services
│   │   │   ├── CrisisAnalytics.ts       # Crisis pattern analysis
│   │   │   └── CrisisConfiguration.ts
│   │   │
│   │   ├── 📁 ai-therapy/
│   │   │   ├── TherapeuticAI.ts         # AI conversation engine
│   │   │   ├── CrisisDetectionAI.ts     # ML crisis detection
│   │   │   ├── PersonalizationEngine.ts # Adaptive responses
│   │   │   └── ConversationMemory.ts
│   │   │
│   │   ├── 📁 wellness-tracking/
│   │   │   ├── MoodAnalytics.ts         # Mood pattern analysis
│   │   │   ├── TriggerAnalysis.ts       # Trigger identification
│   │   │   ├── ProgressTracking.ts      # Wellness progress
│   │   │   └── InsightGenerator.ts
│   │   │
│   │   ├── 📁 peer-support/
│   │   │   ├── CommunityManager.ts      # Community moderation
│   │   │   ├── AnonymityEngine.ts       # Privacy protection
│   │   │   ├── SupportMatching.ts       # Peer matching algorithm
│   │   │   └── ContentModeration.ts
│   │   │
│   │   └── 📁 safety-planning/
│   │       ├── SafetyPlanEngine.ts      # Plan generation logic
│   │       ├── RiskAssessment.ts        # Risk evaluation
│   │       ├── InterventionTriggers.ts  # Automated interventions
│   │       └── SafetyNetworkManager.ts
│   │
│   ├── 📁 pages/                # Route pages
│   │   ├── HomePage.tsx                 # Landing/dashboard
│   │   ├── CrisisPage.tsx               # Crisis intervention hub
│   │   ├── ChatPage.tsx                 # AI therapy chat
│   │   ├── WellnessPage.tsx             # Mood tracking dashboard
│   │   ├── CommunityPage.tsx            # Peer support community
│   │   ├── SafetyPlanPage.tsx           # Safety planning tools
│   │   ├── ExercisesPage.tsx            # Grounding exercises
│   │   ├── ResourcesPage.tsx            # Mental health resources
│   │   ├── SettingsPage.tsx             # User preferences
│   │   ├── ProfilePage.tsx              # Anonymous profile
│   │   ├── OnboardingPage.tsx           # Initial setup
│   │   ├── AccessibilityPage.tsx        # Accessibility settings
│   │   └── OfflinePage.tsx              # Offline experience
│   │
│   ├── 📁 hooks/                # Custom React hooks
│   │   ├── useCrisisDetection.ts        # Crisis state management
│   │   ├── useAIChat.ts                 # AI chat functionality
│   │   ├── useWellnessTracking.ts       # Wellness data management
│   │   ├── usePeerSupport.ts            # Community interactions
│   │   ├── useSafetyPlan.ts             # Safety plan management
│   │   ├── useOfflineSupport.ts         # Offline capabilities
│   │   ├── useMobileOptimization.ts     # Mobile UX optimization
│   │   ├── useAccessibility.ts          # A11y features
│   │   ├── usePerformanceMonitoring.ts  # Performance tracking
│   │   ├── useEmergencyContacts.ts      # Emergency contact management
│   │   ├── useLocationServices.ts       # Location-based resources
│   │   └── useTherapeuticExercises.ts   # Exercise management
│   │
│   ├── 📁 services/             # External service integrations
│   │   ├── 📁 api/
│   │   │   ├── supabaseClient.ts        # Supabase configuration
│   │   │   ├── authService.ts           # Authentication
│   │   │   ├── crisisAPIService.ts      # Crisis data API
│   │   │   ├── wellnessAPIService.ts    # Wellness data API
│   │   │   ├── communityAPIService.ts   # Community API
│   │   │   └── notificationAPIService.ts
│   │   │
│   │   ├── 📁 ai/
│   │   │   ├── openAIService.ts         # OpenAI integration
│   │   │   ├── crisisMLModel.ts         # Crisis detection ML
│   │   │   ├── sentimentAnalysis.ts     # Mood analysis
│   │   │   └── personalizationAI.ts
│   │   │
│   │   ├── 📁 emergency/
│   │   │   ├── emergencyServices.ts     # 988, emergency contacts
│   │   │   ├── locationServices.ts      # Emergency location
│   │   │   ├── crisisHotlines.ts        # Crisis hotline integration
│   │   │   └── emergencyProtocols.ts
│   │   │
│   │   ├── 📁 offline/
│   │   │   ├── cacheManager.ts          # Offline data caching
│   │   │   ├── syncService.ts           # Data synchronization
│   │   │   ├── offlineStorage.ts        # Local storage management
│   │   │   └── backgroundSync.ts
│   │   │
│   │   └── 📁 monitoring/
│   │       ├── analyticsService.ts      # Privacy-first analytics
│   │       ├── errorReporting.ts        # Error tracking
│   │       ├── performanceMonitoring.ts # Performance metrics
│   │       └── crisisMetrics.ts         # Crisis response metrics
│   │
│   ├── 📁 stores/               # Zustand state management
│   │   ├── crisisStore.ts               # Crisis state management
│   │   ├── chatStore.ts                 # AI chat state
│   │   ├── wellnessStore.ts             # Wellness tracking state
│   │   ├── communityStore.ts            # Community interactions
│   │   ├── safetyPlanStore.ts           # Safety plan data
│   │   ├── userPreferencesStore.ts      # User settings
│   │   ├── offlineStore.ts              # Offline data management
│   │   ├── notificationStore.ts         # Notification state
│   │   ├── themeStore.ts                # Theme and accessibility
│   │   └── navigationStore.ts           # Navigation state
│   │
│   ├── 📁 styles/               # Global styles and design system
│   │   ├── 📁 design-system/
│   │   │   ├── colors.css               # Calming color palette
│   │   │   ├── typography.css           # Inter + Poppins fonts
│   │   │   ├── spacing.css              # 4px base unit system
│   │   │   ├── components.css           # Component styles
│   │   │   ├── animations.css           # Calming transitions
│   │   │   └── accessibility.css        # A11y enhancements
│   │   │
│   │   ├── 📁 themes/
│   │   │   ├── light-theme.css          # Light mode (default)
│   │   │   ├── dark-theme.css           # Dark mode
│   │   │   ├── high-contrast.css        # High contrast mode
│   │   │   └── calming-mode.css         # Extra calming theme
│   │   │
│   │   ├── 📁 mobile/
│   │   │   ├── mobile-base.css          # Mobile foundations
│   │   │   ├── touch-targets.css        # 60px+ touch targets
│   │   │   ├── gestures.css             # Swipe animations
│   │   │   └── keyboard-handling.css    # Mobile keyboard UX
│   │   │
│   │   ├── globals.css                  # Global styles
│   │   ├── reset.css                    # CSS reset
│   │   └── utilities.css                # Utility classes
│   │
│   ├── 📁 utils/                # Utility functions
│   │   ├── 📁 crisis/
│   │   │   ├── crisisDetectionUtils.ts  # Crisis detection helpers
│   │   │   ├── emergencyUtils.ts        # Emergency response utils
│   │   │   └── safetyUtils.ts           # Safety planning utils
│   │   │
│   │   ├── 📁 data/
│   │   │   ├── dataValidation.ts        # Data validation schemas
│   │   │   ├── dataTransformation.ts    # Data processing
│   │   │   ├── dataEncryption.ts        # Privacy protection
│   │   │   └── dataSynchronization.ts   # Sync utilities
│   │   │
│   │   ├── 📁 mobile/
│   │   │   ├── touchUtils.ts            # Touch interaction helpers
│   │   │   ├── gestureUtils.ts          # Gesture recognition
│   │   │   ├── keyboardUtils.ts         # Mobile keyboard handling
│   │   │   └── performanceUtils.ts      # Mobile performance
│   │   │
│   │   ├── 📁 accessibility/
│   │   │   ├── a11yUtils.ts             # Accessibility helpers
│   │   │   ├── screenReaderUtils.ts     # Screen reader support
│   │   │   ├── focusManagement.ts       # Focus management
│   │   │   └── contrastUtils.ts         # Color contrast checking
│   │   │
│   │   ├── formatters.ts                # Data formatting
│   │   ├── constants.ts                 # App constants
│   │   ├── errorHandling.ts             # Error utilities
│   │   ├── localStorage.ts              # Local storage helpers
│   │   ├── dateUtils.ts                 # Date/time utilities
│   │   └── validationSchemas.ts         # Zod schemas
│   │
│   ├── 📁 types/                # TypeScript type definitions
│   │   ├── crisis.types.ts              # Crisis-related types
│   │   ├── chat.types.ts                # AI chat types
│   │   ├── wellness.types.ts            # Wellness tracking types
│   │   ├── community.types.ts           # Community types
│   │   ├── safety.types.ts              # Safety plan types
│   │   ├── user.types.ts                # User profile types
│   │   ├── api.types.ts                 # API response types
│   │   ├── component.types.ts           # Component prop types
│   │   └── global.types.ts              # Global type definitions
│   │
│   └── 📁 config/               # Configuration files
│       ├── supabase.config.ts           # Supabase configuration
│       ├── ai.config.ts                 # AI service configuration
│       ├── crisis.config.ts             # Crisis detection config
│       ├── offline.config.ts            # Offline capabilities config
│       ├── mobile.config.ts             # Mobile optimization config
│       ├── accessibility.config.ts      # A11y configuration
│       ├── performance.config.ts        # Performance monitoring
│       ├── environment.config.ts        # Environment variables
│       └── app.config.ts                # Main app configuration
│
├── 📁 public/                   # Static assets
│   ├── 📁 icons/                # PWA and app icons
│   │   ├── crisis-icon.svg              # Crisis button icon
│   │   ├── app-icon-192.png             # PWA icon 192x192
│   │   ├── app-icon-512.png             # PWA icon 512x512
│   │   ├── favicon.ico                  # Browser favicon
│   │   └── touch-icon.png               # iOS touch icon
│   │
│   ├── 📁 audio/                # Therapeutic audio files
│   │   ├── breathing-guide.mp3          # Breathing exercise audio
│   │   ├── calming-sounds/              # Background calming sounds
│   │   └── guided-meditations/          # Meditation audio files
│   │
│   ├── 📁 crisis-resources/     # Offline crisis resources
│   │   ├── crisis-keywords.json         # Crisis detection keywords
│   │   ├── emergency-contacts.json      # Emergency contact database
│   │   ├── crisis-hotlines.json         # Crisis hotline numbers
│   │   ├── offline-resources.json       # Offline crisis support
│   │   └── safety-plan-templates.json   # Safety plan templates
│   │
│   ├── 📁 images/               # Optimized images
│   │   ├── calming-backgrounds/         # Therapeutic backgrounds
│   │   ├── exercise-illustrations/      # Exercise visual guides
│   │   └── ui-illustrations/            # Interface illustrations
│   │
│   ├── manifest.json                    # PWA manifest
│   ├── robots.txt                       # Search engine directives
│   ├── offline.html                     # Offline fallback page
│   ├── crisis-offline.html              # Crisis offline page
│   └── service-worker.js                # Service worker registration
│
├── 📁 tests/                    # Comprehensive testing
│   ├── 📁 unit/                 # Unit tests
│   │   ├── components/                  # Component tests
│   │   ├── hooks/                       # Hook tests
│   │   ├── services/                    # Service tests
│   │   ├── stores/                      # State management tests
│   │   └── utils/                       # Utility tests
│   │
│   ├── 📁 integration/          # Integration tests
│   │   ├── crisis-flow.test.ts          # Crisis intervention flow
│   │   ├── ai-chat.test.ts              # AI chat integration
│   │   ├── wellness-tracking.test.ts    # Wellness feature integration
│   │   ├── offline-support.test.ts      # Offline functionality
│   │   └── mobile-experience.test.ts    # Mobile UX integration
│   │
│   ├── 📁 e2e/                  # End-to-end tests
│   │   ├── crisis-scenarios.spec.ts     # Crisis response scenarios
│   │   ├── user-journeys.spec.ts        # Complete user flows
│   │   ├── accessibility.spec.ts        # A11y compliance tests
│   │   ├── performance.spec.ts          # Performance benchmarks
│   │   └── mobile-responsive.spec.ts    # Mobile responsiveness
│   │
│   ├── 📁 load/                 # Load testing
│   │   ├── crisis-load.test.ts          # Crisis response under load
│   │   ├── ai-chat-load.test.ts         # AI chat performance
│   │   └── database-load.test.ts        # Database performance
│   │
│   └── 📁 fixtures/             # Test data and fixtures
│       ├── crisis-scenarios.json        # Crisis test scenarios
│       ├── user-profiles.json           # Test user profiles
│       ├── wellness-data.json           # Wellness tracking test data
│       └── chat-conversations.json      # AI chat test conversations
│
├── 📁 docs/                     # Comprehensive documentation
│   ├── 📁 architecture/         # Architecture documentation
│   │   ├── SYSTEM_OVERVIEW.md           # High-level system design
│   │   ├── CRISIS_ARCHITECTURE.md       # Crisis intervention design
│   │   ├── AI_INTEGRATION.md            # AI therapy integration
│   │   ├── MOBILE_STRATEGY.md           # Mobile-first approach
│   │   ├── OFFLINE_ARCHITECTURE.md      # Offline capabilities
│   │   ├── SECURITY_DESIGN.md           # Security and privacy
│   │   └── PERFORMANCE_STRATEGY.md      # Performance optimization
│   │
│   ├── 📁 api/                  # API documentation
│   │   ├── SUPABASE_INTEGRATION.md      # Database integration
│   │   ├── AI_API_DESIGN.md             # AI service APIs
│   │   ├── CRISIS_APIs.md               # Crisis-related APIs
│   │   ├── WELLNESS_APIs.md             # Wellness tracking APIs
│   │   └── COMMUNITY_APIs.md            # Community feature APIs
│   │
│   ├── 📁 deployment/           # Deployment guides
│   │   ├── NETLIFY_SETUP.md             # Netlify deployment
│   │   ├── SUPABASE_SETUP.md            # Supabase configuration
│   │   ├── PWA_DEPLOYMENT.md            # PWA deployment
│   │   ├── MONITORING_SETUP.md          # Monitoring configuration
│   │   └── CRISIS_PROTOCOLS.md          # Crisis response protocols
│   │
│   ├── 📁 user-guides/          # User documentation
│   │   ├── CRISIS_SUPPORT_GUIDE.md      # Crisis intervention guide
│   │   ├── AI_CHAT_GUIDE.md             # AI therapy guide
│   │   ├── WELLNESS_TRACKING_GUIDE.md   # Wellness feature guide
│   │   ├── SAFETY_PLANNING_GUIDE.md     # Safety plan creation
│   │   ├── ACCESSIBILITY_GUIDE.md       # Accessibility features
│   │   └── MOBILE_APP_GUIDE.md          # Mobile app usage
│   │
│   └── 📁 development/          # Developer documentation
│       ├── GETTING_STARTED.md           # Setup instructions
│       ├── CONTRIBUTION_GUIDE.md        # Contribution guidelines
│       ├── CODING_STANDARDS.md          # Code style and standards
│       ├── TESTING_STRATEGY.md          # Testing approach
│       ├── CRISIS_DEVELOPMENT.md        # Crisis feature development
│       └── PERFORMANCE_GUIDELINES.md    # Performance best practices
│
├── 📁 scripts/                  # Build and deployment scripts
│   ├── build-production.js             # Production build script
│   ├── deploy-netlify.js               # Netlify deployment
│   ├── setup-supabase.js               # Supabase initialization
│   ├── optimize-assets.js              # Asset optimization
│   ├── generate-pwa-assets.js          # PWA asset generation
│   └── crisis-deployment-check.js      # Crisis feature validation
│
├── 📁 database/                 # Database schema and migrations
│   ├── 📁 migrations/           # Supabase migrations
│   ├── 📁 schemas/              # Database schemas
│   ├── 📁 seeds/                # Initial data seeds
│   └── 📁 functions/            # Database functions
│
├── package.json                         # Project dependencies
├── tsconfig.json                        # TypeScript configuration
├── vite.config.ts                       # Vite build configuration
├── tailwind.config.js                   # Tailwind CSS configuration
├── netlify.toml                         # Netlify deployment config
├── supabase.config.js                   # Supabase configuration
├── workbox.config.js                    # Service worker configuration
├── playwright.config.ts                 # E2E testing configuration
├── jest.config.js                       # Unit testing configuration
└── README.md                            # Project overview
```

---

## 🎨 Design System Architecture

### Color Palette (Crisis-First Design)
```css
:root {
  /* Primary Colors - Calming Blues */
  --color-primary-50: #eff6ff;    /* Lightest blue - backgrounds */
  --color-primary-100: #dbeafe;   /* Light blue - hover states */
  --color-primary-500: #3b82f6;   /* Main blue - primary actions */
  --color-primary-700: #1d4ed8;   /* Dark blue - text */
  --color-primary-900: #1e3a8a;   /* Darkest blue - emphasis */

  /* Secondary Colors - Soft Greens */
  --color-secondary-50: #f0fdf4;  /* Success backgrounds */
  --color-secondary-500: #22c55e; /* Success states */
  --color-secondary-700: #15803d; /* Success text */

  /* Crisis Colors - Warm, Non-Alarming */
  --color-crisis-50: #fef7f2;     /* Crisis background */
  --color-crisis-500: #f97316;    /* Crisis button */
  --color-crisis-700: #c2410c;    /* Crisis text */

  /* Neutral Colors - Calming Grays */
  --color-neutral-50: #f9fafb;    /* Light backgrounds */
  --color-neutral-100: #f3f4f6;   /* Card backgrounds */
  --color-neutral-500: #6b7280;   /* Secondary text */
  --color-neutral-700: #374151;   /* Primary text */
  --color-neutral-900: #111827;   /* Heading text */

  /* Semantic Colors */
  --color-warning-50: #fffbeb;    /* Warning background */
  --color-warning-500: #f59e0b;   /* Warning accent */
  --color-error-50: #fef2f2;      /* Error background */
  --color-error-500: #ef4444;     /* Error accent */
}
```

### Typography System
```css
:root {
  /* Font Families */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-headings: 'Poppins', 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', 'Monaco', 'Consolas', monospace;

  /* Font Sizes - Fluid Typography */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --text-3xl: clamp(2rem, 1.7rem + 1.5vw, 2.5rem);

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Spacing System (4px Base Unit)
```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Component Design Principles
```css
/* Card-based design with soft shadows */
.card-base {
  background: var(--color-neutral-50);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-neutral-200);
  transition: all 0.2s ease-in-out;
}

.card-hover:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

/* Calming transitions */
.transition-calming {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus states for accessibility */
.focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

---

## 📱 Mobile-First Architecture

### Responsive Breakpoints
```javascript
export const breakpoints = {
  // Mobile devices
  xs: '320px',   // Small phones
  sm: '375px',   // Standard phones
  md: '414px',   // Large phones
  
  // Tablets
  lg: '768px',   // Tablets portrait
  xl: '1024px',  // Tablets landscape
  
  // Desktop
  '2xl': '1440px', // Desktop
  '3xl': '1920px', // Large desktop
} as const;
```

### Touch Target Optimization
```css
/* Minimum 60px touch targets for mobile */
.touch-target {
  min-height: 60px;
  min-width: 60px;
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Crisis button - larger for urgent access */
.crisis-touch-target {
  min-height: 72px;
  min-width: 72px;
  padding: var(--space-6);
}
```

### Mobile Navigation Strategy
- **Bottom Tab Navigation**: Primary navigation at thumb reach
- **Floating Crisis Button**: Always accessible crisis intervention
- **Swipe Gestures**: Quick access to common actions
- **Pull-to-Refresh**: Natural mobile interaction patterns
- **Haptic Feedback**: Tactile confirmation for critical actions

---

## ⚡ Crisis-First Features Architecture

### Crisis Detection System
```typescript
interface CrisisDetectionConfig {
  // AI-powered text analysis
  keywordDetection: {
    urgencyLevels: ['low', 'medium', 'high', 'critical'];
    keywords: {
      critical: string[];    // "suicide", "kill myself", etc.
      high: string[];        // "hopeless", "can't go on", etc.
      medium: string[];      // "struggling", "overwhelmed", etc.
      low: string[];         // "sad", "worried", etc.
    };
  };

  // Behavioral pattern analysis
  behavioralIndicators: {
    rapidMessageFrequency: boolean;
    prolongedInactivity: boolean;
    moodPatternChanges: boolean;
    safetyPlanDeviations: boolean;
  };

  // Immediate response protocols
  responseProtocols: {
    critical: 'immediate_intervention';     // Direct to 988
    high: 'escalated_support';             // Crisis counselor
    medium: 'enhanced_monitoring';         // AI + human check-in
    low: 'supportive_guidance';            // AI therapeutic response
  };
}
```

### Emergency Escalation Flow
```typescript
interface EmergencyEscalationFlow {
  // Step 1: Crisis Detection
  detection: {
    trigger: 'ai_analysis' | 'user_panic_button' | 'behavioral_pattern';
    confidence: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  };

  // Step 2: Immediate Response
  immediateResponse: {
    crisisUI: 'show_calming_interface';
    breathingExercise: 'auto_start_breathing';
    safetyPlan: 'display_personalized_plan';
    contactOptions: 'show_emergency_contacts';
  };

  // Step 3: Escalation Options
  escalationOptions: {
    call988: boolean;           // National Suicide Prevention Lifeline
    emergencyServices: boolean;  // 911 if imminent danger
    emergencyContacts: boolean;  // Personal emergency contacts
    crisisCounselor: boolean;   // Platform crisis counselor
    peerSupport: boolean;       // Trained peer supporter
  };

  // Step 4: Follow-up Protocol
  followUp: {
    immediateCheckIn: 'within_1_hour';
    shortTermMonitoring: 'within_24_hours';
    longTermSupport: 'weekly_check_ins';
    safetyPlanUpdate: 'within_48_hours';
  };
}
```

### Quick Exit Functionality
```typescript
interface QuickExitSystem {
  triggers: {
    escapeKeySequence: 'esc_x3';           // ESC key pressed 3 times
    mobileGesture: 'three_finger_tap';     // 3-finger tap on mobile
    panicButton: 'crisis_exit_button';     // Dedicated panic exit
  };

  exitBehavior: {
    redirectUrl: 'https://weather.com';    // Innocent website
    clearHistory: boolean;                 // Clear browser history
    closeAllTabs: boolean;                 // Close related tabs
    showCoverScreen: boolean;              // Show weather page immediately
  };

  accessibility: {
    screenReaderAnnouncement: 'Quick exit activated - redirecting to weather';
    keyboardShortcut: 'Alt + Q';
    voiceCommand: 'emergency exit';
  };
}
```

---

## 🤖 AI Integration Architecture

### Therapeutic AI Configuration
```typescript
interface TherapeuticAIConfig {
  // Core AI Models
  models: {
    primary: 'gpt-4-turbo';              // Main therapeutic conversation
    crisis: 'claude-3-opus';             // Crisis detection and response
    sentiment: 'bert-base-uncased';      // Mood analysis
    personalization: 'custom-fine-tuned'; // User adaptation
  };

  // Conversation Management
  conversationFlow: {
    greeting: 'warm_personalized_welcome';
    crisisProtocol: 'immediate_safety_assessment';
    therapeuticTechniques: ['cbt', 'dbt', 'mindfulness', 'solution_focused'];
    responseStyle: 'empathetic_professional';
    sessionManagement: 'adaptive_length';
  };

  // Safety Guardrails
  safetyMeasures: {
    crisisDetection: 'real_time_monitoring';
    responseFiltering: 'therapeutic_appropriateness';
    escalationTriggers: 'automatic_human_handoff';
    dataPrivacy: 'end_to_end_encryption';
  };

  // Personalization Engine
  personalization: {
    learningRate: 'gradual_adaptation';
    userPreferences: 'communication_style_memory';
    therapeuticHistory: 'progress_tracking';
    culturalSensitivity: 'multi_cultural_awareness';
  };
}
```

### Crisis Detection AI Model
```typescript
interface CrisisDetectionAI {
  // Multi-modal Detection
  inputSources: {
    textAnalysis: 'nlp_sentiment_analysis';
    voiceAnalysis: 'tone_stress_detection';    // If voice chat enabled
    behavioralPatterns: 'usage_pattern_analysis';
    contextualCues: 'conversation_context';
  };

  // Real-time Analysis
  processing: {
    responseTime: '<200ms';                    // Real-time crisis detection
    confidenceThreshold: 0.85;               // High confidence required
    falsePositiveReduction: 'contextual_verification';
    culturalSensitivity: 'cultural_context_awareness';
  };

  // Output Classification
  classification: {
    riskLevels: ['none', 'low', 'medium', 'high', 'critical'];
    actionTriggers: {
      none: 'continue_normal_conversation';
      low: 'gentle_check_in';
      medium: 'enhanced_support_resources';
      high: 'crisis_intervention_protocol';
      critical: 'immediate_emergency_response';
    };
  };
}
```

---

## 💾 Data Architecture & Privacy

### Data Storage Strategy
```typescript
interface DataArchitecture {
  // Supabase Database Schema
  database: {
    // User data (minimal, anonymous)
    users: {
      anonymous_id: 'uuid';               // No personal identifiers
      created_at: 'timestamp';
      preferences: 'jsonb';               // App preferences only
      crisis_plan: 'encrypted_blob';      // Encrypted safety plan
    };

    // Wellness tracking (encrypted)
    wellness_logs: {
      id: 'uuid';
      user_id: 'uuid';
      mood_rating: 'integer';
      encrypted_notes: 'text';            // Client-side encrypted
      created_at: 'timestamp';
      triggers: 'jsonb';
    };

    // Crisis events (for improvement, anonymized)
    crisis_events: {
      id: 'uuid';
      anonymized_user: 'uuid';            // Anonymized identifier
      crisis_type: 'text';
      response_effectiveness: 'integer';
      created_at: 'timestamp';
      resolution_method: 'text';
    };

    // Community posts (anonymous)
    community_posts: {
      id: 'uuid';
      anonymous_author: 'uuid';           // Anonymous posting
      content_hash: 'text';               // Hashed content for moderation
      created_at: 'timestamp';
      moderation_status: 'text';
    };
  };

  // Client-side Storage
  localStorage: {
    userPreferences: 'unencrypted';       // UI preferences only
    safetPlan: 'encrypted_client_side';   // Never sent to server
    emergencyContacts: 'encrypted_local'; // Local only
    offlineData: 'encrypted_cache';       // Temporary offline data
  };

  // Privacy Principles
  privacy: {
    dataMinimization: 'collect_only_necessary';
    anonymization: 'no_personal_identifiers';
    encryption: 'end_to_end_where_possible';
    userControl: 'full_data_export_delete';
    retention: 'automatic_data_expiration';
  };
}
```

### Privacy-First Analytics
```typescript
interface PrivacyAnalytics {
  // Anonymous Usage Metrics
  metrics: {
    featureUsage: 'anonymous_aggregated';
    crisisResponseTimes: 'statistical_only';
    userJourneyPatterns: 'anonymized_flows';
    performanceMetrics: 'technical_data_only';
  };

  // No Personal Data
  exclusions: {
    personalInfo: 'never_collected';
    conversationContent: 'never_stored';
    locationData: 'never_tracked';
    deviceFingerprinting: 'actively_prevented';
  };

  // User Control
  userRights: {
    optOut: 'complete_analytics_disable';
    dataExport: 'full_transparency';
    dataDelete: 'immediate_removal';
    consentManagement: 'granular_control';
  };
}
```

---

## 🔌 API Architecture

### Supabase Integration
```typescript
// Database Schema Overview
interface DatabaseSchema {
  // Core tables
  tables: {
    users: UserProfile;
    wellness_logs: WellnessEntry;
    safety_plans: SafetyPlan;
    crisis_events: CrisisEvent;
    community_posts: CommunityPost;
    emergency_contacts: EmergencyContact;
    ai_conversations: ConversationLog;
  };

  // Real-time subscriptions
  realtime: {
    crisisAlerts: 'real_time_crisis_monitoring';
    communityUpdates: 'live_community_feed';
    aiResponses: 'streaming_chat_responses';
    wellnessReminders: 'scheduled_check_ins';
  };

  // Row Level Security (RLS)
  security: {
    users: 'own_data_only';
    wellness_logs: 'user_specific_access';
    safety_plans: 'encrypted_user_only';
    community_posts: 'anonymous_read_own_write';
  };
}
```

### API Endpoints Structure
```typescript
// Crisis Management APIs
interface CrisisAPIs {
  '/api/crisis/detect': {
    method: 'POST';
    input: { message: string; context: ConversationContext };
    output: { riskLevel: RiskLevel; suggestions: string[] };
  };

  '/api/crisis/escalate': {
    method: 'POST';
    input: { userId: string; crisisType: CrisisType };
    output: { escalationPath: EscalationStep[] };
  };

  '/api/crisis/resources': {
    method: 'GET';
    input: { location?: string; crisisType?: string };
    output: { resources: CrisisResource[] };
  };
}

// AI Chat APIs
interface AIChatAPIs {
  '/api/chat/message': {
    method: 'POST';
    input: { message: string; conversationId: string };
    output: { response: string; metadata: ChatMetadata };
  };

  '/api/chat/crisis-check': {
    method: 'POST';
    input: { conversationId: string };
    output: { riskAssessment: RiskAssessment };
  };
}

// Wellness Tracking APIs
interface WellnessAPIs {
  '/api/wellness/log': {
    method: 'POST';
    input: { mood: number; triggers: string[]; notes: string };
    output: { success: boolean; insights: WellnessInsight[] };
  };

  '/api/wellness/trends': {
    method: 'GET';
    input: { timeframe: 'week' | 'month' | 'year' };
    output: { trends: MoodTrend[]; recommendations: string[] };
  };
}
```

---

## 🚀 Performance Targets & Optimization

### Performance Benchmarks
```typescript
interface PerformanceTargets {
  // Core Web Vitals
  coreWebVitals: {
    firstContentfulPaint: '<1.2s';      // FCP target
    largestContentfulPaint: '<2.5s';    // LCP target
    firstInputDelay: '<100ms';          // FID target
    cumulativeLayoutShift: '<0.1';      // CLS target
  };

  // Crisis Response Performance
  crisisResponse: {
    crisisDetectionLatency: '<200ms';   // AI crisis detection
    panicButtonResponse: '<50ms';       // Panic button activation
    emergencyContactLoad: '<500ms';     // Emergency contact display
    safetyPlanRetrieval: '<300ms';      // Safety plan loading
  };

  // Mobile Performance
  mobileTargets: {
    bundleSize: '<200KB';               // Initial bundle size
    imageOptimization: 'webp_avif';     // Modern image formats
    fontLoading: 'font_display_swap';   // Prevent font blocking
    scrollPerformance: '60fps';         // Smooth scrolling
  };

  // Offline Performance
  offlineTargets: {
    offlineReadyTime: '<3s';            // Time to offline capability
    cacheEfficiency: '>90%';            // Cache hit rate
    syncLatency: '<1s';                 // Data sync on reconnection
  };
}
```

### Bundle Optimization Strategy
```typescript
interface BundleOptimization {
  // Code Splitting Strategy
  codeSplitting: {
    routeBased: 'lazy_load_pages';      // Page-level splitting
    featureBased: 'dynamic_imports';    // Feature-level splitting
    vendorSplitting: 'separate_vendors'; // Third-party library splitting
    criticalPath: 'inline_critical_css'; // Critical CSS inlining
  };

  // Tree Shaking
  treeShaking: {
    unusedCode: 'aggressive_removal';
    libraryOptimization: 'import_specific_functions';
    deadCodeElimination: 'production_only';
  };

  // Asset Optimization
  assetOptimization: {
    images: 'webp_with_fallback';
    icons: 'svg_sprite_optimization';
    fonts: 'woff2_subset_loading';
    audio: 'compressed_therapeutic_audio';
  };
}
```

---

## 🔒 Security & Compliance Architecture

### Security Measures
```typescript
interface SecurityArchitecture {
  // Data Protection
  dataProtection: {
    encryption: {
      atRest: 'AES_256_encryption';
      inTransit: 'TLS_1_3';
      clientSide: 'browser_crypto_api';
    };
    
    anonymization: {
      userIdentifiers: 'uuid_based_anonymous';
      conversationLogs: 'hashed_content';
      analyticsData: 'aggregated_anonymous';
    };
  };

  // Access Control
  accessControl: {
    authentication: 'optional_anonymous_mode';
    authorization: 'role_based_access';
    sessionManagement: 'secure_session_tokens';
    dataAccess: 'row_level_security';
  };

  // Crisis Data Security
  crisisDataSecurity: {
    safetyPlans: 'client_side_encryption_only';
    emergencyContacts: 'local_storage_encrypted';
    crisisLogs: 'anonymized_statistical_only';
    conversationHistory: 'ephemeral_short_term';
  };

  // Compliance
  compliance: {
    hipaa: 'privacy_rule_compliant';
    gdpr: 'data_minimization_consent';
    coppa: 'age_appropriate_safeguards';
    accessibility: 'wcag_2_1_aa_compliant';
  };
}
```

---

## 📋 Implementation Strategy

### Phase 1: Crisis-First Foundation (Weeks 1-4)
1. **Crisis Detection System**
   - AI-powered keyword detection
   - Panic button implementation
   - Quick exit functionality
   - Emergency contact integration

2. **Basic Safety Features**
   - Safety plan builder
   - Crisis resource library
   - Breathing exercises
   - Grounding techniques

3. **Mobile-First UI**
   - Responsive design system
   - Touch-optimized interactions
   - Bottom navigation
   - Accessibility compliance

### Phase 2: AI Therapeutic Chat (Weeks 5-8)
1. **AI Integration**
   - OpenAI/Claude integration
   - Crisis detection in conversations
   - Therapeutic response system
   - Conversation memory

2. **Chat Interface**
   - Real-time messaging
   - Voice-to-text support
   - Accessibility features
   - Crisis escalation flows

### Phase 3: Wellness Tracking (Weeks 9-12)
1. **Mood Tracking**
   - Daily mood logging
   - Trigger identification
   - Pattern analysis
   - Progress visualization

2. **Insights Engine**
   - AI-powered insights
   - Personalized recommendations
   - Wellness goal setting
   - Progress celebrations

### Phase 4: Community & Advanced Features (Weeks 13-16)
1. **Peer Support Community**
   - Anonymous posting
   - Moderation system
   - Support group matching
   - Crisis peer support

2. **Advanced Crisis Features**
   - Location-based resources
   - Crisis hotline integration
   - Family/friend notifications
   - Professional crisis counselor connection

### Phase 5: PWA & Offline Capabilities (Weeks 17-20)
1. **Progressive Web App**
   - Service worker implementation
   - Offline functionality
   - Push notifications
   - App installation

2. **Performance Optimization**
   - Bundle size optimization
   - Image optimization
   - Caching strategies
   - Mobile performance tuning

---

## 🧪 Testing Strategy

### Testing Pyramid
```typescript
interface TestingStrategy {
  // Unit Tests (60% of tests)
  unitTests: {
    components: 'react_testing_library';
    hooks: 'react_hooks_testing_library';
    utils: 'jest_unit_tests';
    stores: 'zustand_testing';
    services: 'service_mocking';
  };

  // Integration Tests (30% of tests)
  integrationTests: {
    crisisFlow: 'full_crisis_intervention_flow';
    aiChat: 'ai_conversation_integration';
    wellnessTracking: 'mood_tracking_workflow';
    offlineSync: 'offline_data_synchronization';
  };

  // E2E Tests (10% of tests)
  e2eTests: {
    crisisScenarios: 'playwright_crisis_simulation';
    userJourneys: 'complete_user_workflows';
    accessibility: 'automated_a11y_testing';
    performance: 'lighthouse_ci_testing';
    crossBrowser: 'browser_compatibility';
  };

  // Specialized Testing
  specializedTesting: {
    loadTesting: 'crisis_response_under_load';
    securityTesting: 'penetration_testing';
    usabilityTesting: 'user_experience_validation';
    crisisProtocolTesting: 'emergency_response_simulation';
  };
}
```

---

## 🚀 Deployment Architecture

### Netlify Deployment Strategy
```typescript
interface DeploymentStrategy {
  // Build Configuration
  buildConfig: {
    buildCommand: 'npm run build:production';
    publishDirectory: 'dist';
    nodeVersion: '20.x';
    environmentVariables: 'crisis_optimized_env';
  };

  // Performance Optimization
  optimization: {
    assetOptimization: 'automatic_image_optimization';
    cdnConfiguration: 'global_edge_distribution';
    caching: 'intelligent_cache_headers';
    compression: 'brotli_gzip_compression';
  };

  // Crisis-Specific Configuration
  crisisOptimization: {
    priorityResources: 'crisis_resources_edge_cache';
    failoverProtocols: 'crisis_service_redundancy';
    monitoring: 'crisis_response_alerting';
    uptime: '99.99_percent_availability';
  };

  // Security Headers
  securityHeaders: {
    contentSecurityPolicy: 'strict_csp_configuration';
    httpsRedirect: 'enforce_https_everywhere';
    frameOptions: 'deny_iframe_embedding';
    referrerPolicy: 'strict_origin_when_cross_origin';
  };
}
```

### Environment Configuration
```typescript
interface EnvironmentConfig {
  // Development Environment
  development: {
    aiService: 'openai_development_api';
    database: 'supabase_development_instance';
    crisisSimulation: 'safe_testing_mode';
    analytics: 'development_analytics_disabled';
  };

  // Staging Environment
  staging: {
    aiService: 'openai_staging_api';
    database: 'supabase_staging_instance';
    crisisTesting: 'controlled_crisis_simulation';
    analytics: 'limited_staging_analytics';
  };

  // Production Environment
  production: {
    aiService: 'openai_production_api';
    database: 'supabase_production_instance';
    crisisProtocols: 'live_crisis_intervention';
    analytics: 'privacy_first_analytics';
    monitoring: 'comprehensive_error_tracking';
  };
}
```

---

## 📊 Success Metrics & KPIs

### Crisis Response Metrics
```typescript
interface CrisisMetrics {
  // Response Time Metrics
  responseMetrics: {
    crisisDetectionLatency: 'sub_200ms_detection';
    escalationResponseTime: 'under_30_second_escalation';
    emergencyContactTime: 'under_10_second_contact_access';
    resourceRetrievalTime: 'under_5_second_resource_load';
  };

  // Effectiveness Metrics
  effectivenessMetrics: {
    crisisResolutionRate: 'percentage_successful_interventions';
    userSafetyFeedback: 'post_crisis_safety_assessment';
    falsePositiveRate: 'crisis_detection_accuracy';
    userRetention: 'continued_app_usage_post_crisis';
  };

  // User Experience Metrics
  userExperienceMetrics: {
    accessibilityCompliance: 'wcag_aa_compliance_rate';
    mobileUsability: 'mobile_task_completion_rate';
    offlineCapability: 'offline_feature_usage_rate';
    userSatisfaction: 'crisis_support_satisfaction_score';
  };
}
```

### Technical Performance KPIs
```typescript
interface PerformanceKPIs {
  // Core Web Vitals
  webVitals: {
    lighthouseScore: '>95_average_score';
    firstContentfulPaint: '<1.2s_95th_percentile';
    largestContentfulPaint: '<2.5s_95th_percentile';
    cumulativeLayoutShift: '<0.1_95th_percentile';
  };

  // Availability Metrics
  availability: {
    uptime: '99.99_percent_availability';
    crisisServiceUptime: '99.999_percent_crisis_availability';
    meanTimeToRecovery: '<5_minute_recovery_time';
    errorRate: '<0.1_percent_error_rate';
  };

  // Security Metrics
  security: {
    dataBreaches: 'zero_tolerance_breaches';
    vulnerabilityResponse: '<24_hour_patch_time';
    encryptionCompliance: '100_percent_data_encryption';
    privacyCompliance: 'full_gdpr_hipaa_compliance';
  };
}
```

---

## 🤝 Agent Coordination Strategy

### Development Team Structure (40+ Agents)
```typescript
interface AgentCoordination {
  // Core Teams
  coreTeams: {
    crisisTeam: {
      lead: 'crisis_intervention_specialist';
      agents: 8;
      focus: 'crisis_detection_and_response';
      deliverables: ['panic_button', 'ai_crisis_detection', 'emergency_protocols'];
    };

    aiTeam: {
      lead: 'ai_integration_specialist';
      agents: 6;
      focus: 'therapeutic_ai_development';
      deliverables: ['chat_interface', 'crisis_detection_ai', 'personalization'];
    };

    mobileTeam: {
      lead: 'mobile_experience_specialist';
      agents: 6;
      focus: 'mobile_first_development';
      deliverables: ['responsive_design', 'touch_optimization', 'pwa_features'];
    };

    wellnessTeam: {
      lead: 'wellness_tracking_specialist';
      agents: 5;
      focus: 'wellness_and_mood_tracking';
      deliverables: ['mood_tracker', 'wellness_insights', 'progress_visualization'];
    };

    communityTeam: {
      lead: 'community_platform_specialist';
      agents: 5;
      focus: 'peer_support_community';
      deliverables: ['anonymous_posting', 'moderation_system', 'peer_matching'];
    };

    infrastructureTeam: {
      lead: 'platform_infrastructure_specialist';
      agents: 4;
      focus: 'deployment_and_monitoring';
      deliverables: ['netlify_deployment', 'performance_monitoring', 'security'];
    };

    testingTeam: {
      lead: 'quality_assurance_specialist';
      agents: 4;
      focus: 'comprehensive_testing';
      deliverables: ['unit_tests', 'e2e_tests', 'crisis_simulation_testing'];
    };

    accessibilityTeam: {
      lead: 'accessibility_specialist';
      agents: 2;
      focus: 'universal_accessibility';
      deliverables: ['wcag_compliance', 'screen_reader_support', 'keyboard_navigation'];
    };
  };

  // Coordination Protocols
  coordination: {
    dailyStandups: 'team_specific_standups';
    weeklySync: 'cross_team_coordination';
    crisisReviews: 'weekly_crisis_protocol_review';
    codeReviews: 'peer_review_requirements';
    integrationTesting: 'continuous_integration_pipeline';
  };

  // Communication Channels
  communication: {
    emergencyChannel: 'crisis_team_immediate_response';
    technicalChannel: 'cross_team_technical_discussions';
    designChannel: 'ui_ux_design_coordination';
    testingChannel: 'quality_assurance_updates';
    deploymentChannel: 'deployment_and_infrastructure';
  };
}
```

---

## 🎯 Next Steps for Implementation

### Immediate Actions (Week 1)
1. **Repository Setup**
   - Initialize AstralCoreV4 repository
   - Configure development environment
   - Set up Supabase database
   - Configure Netlify deployment

2. **Crisis Foundation**
   - Implement panic button component
   - Create crisis detection service
   - Set up emergency contact system
   - Implement quick exit functionality

3. **Mobile-First Setup**
   - Configure responsive design system
   - Implement touch-optimized components
   - Set up mobile navigation
   - Ensure accessibility compliance

### Week 2-4 Deliverables
1. **Core Crisis Features**
   - AI crisis detection system
   - Safety plan builder
   - Crisis resource library
   - Emergency escalation protocols

2. **Foundation Components**
   - Design system implementation
   - Mobile-first component library
   - Accessibility framework
   - Performance monitoring setup

---

## 📚 Technical Documentation Requirements

Each agent team must maintain:

1. **Component Documentation**
   - TypeScript interfaces
   - Usage examples
   - Accessibility considerations
   - Mobile optimization notes

2. **API Documentation**
   - Endpoint specifications
   - Authentication requirements
   - Error handling protocols
   - Rate limiting policies

3. **Crisis Protocol Documentation**
   - Emergency response procedures
   - Escalation workflows
   - Testing protocols
   - Performance requirements

4. **Testing Documentation**
   - Test coverage requirements
   - Crisis simulation procedures
   - Performance benchmarks
   - Accessibility testing protocols

---

This comprehensive architecture blueprint provides the foundation for building AstralCore V4 as a production-ready mental health crisis support platform. The design prioritizes crisis intervention, mobile accessibility, and user privacy while ensuring scalable, maintainable code architecture.

**Next Step**: Begin implementation with the Crisis-First Foundation (Phase 1) focusing on immediate crisis intervention capabilities.