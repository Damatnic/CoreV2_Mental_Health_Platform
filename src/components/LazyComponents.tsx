import React, { lazy, Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy load heavy components to improve initial page load
const MoodTracker = lazy(() => import('./MoodTracker'));
const JournalEditor = lazy(() => import('./JournalEditor'));
const SafetyPlanBuilder = lazy(() => import('./safety/SafetyPlanBuilder'));
const CrisisResourcesModal = lazy(() => import('./CrisisResourcesModal'));
const AnalyticsView = lazy(() => import('../views/AnalyticsView'));
const CommunityView = lazy(() => import('../views/CommunityView'));
const SettingsView = lazy(() => import('../views/SettingsView'));
const HabitTracker = lazy(() => import('../features/wellness/HabitTracker'));
const SleepTracker = lazy(() => import('../features/wellness/SleepTracker'));
const MeditationTimer = lazy(() => import('./MeditationTimer/MeditationTimer'));

// Crisis support components - higher priority loading
const CrisisAlert = lazy(() => import('./CrisisAlert'));
const CrisisSupportWidget = lazy(() => import('./CrisisSupportWidget'));

// Chat and communication
const AnonymousTherapyChat = lazy(() => import('../features/chat/AnonymousTherapyChat'));

// Community features
const StorySharing = lazy(() => import('../features/community/StorySharing'));
const MentorshipProgram = lazy(() => import('../features/community/MentorshipProgram'));
const CommunityEvents = lazy(() => import('../features/community/CommunityEvents'));

// Data and export features
const DataExportManager = lazy(() => import('../features/data/DataExportManager'));

// Loading wrapper component
const LazyWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorBoundary?: boolean;
}> = ({ children, fallback, errorBoundary = false }) => {
  const defaultFallback = <LoadingSpinner size="medium" message="Loading..." />;
  
  const content = (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );

  if (errorBoundary) {
    return (
      <ErrorBoundary>
        {content}
      </ErrorBoundary>
    );
  }

  return content;
};

// Simple error boundary for lazy components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <p>Something went wrong loading this component.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Exported lazy components with wrappers
export const LazyMoodTracker: React.FC = () => (
  <LazyWrapper>
    <MoodTracker />
  </LazyWrapper>
);

export const LazyJournalEditor: React.FC = () => (
  <LazyWrapper>
    <JournalEditor />
  </LazyWrapper>
);

export const LazySafetyPlanBuilder: React.FC = () => (
  <LazyWrapper>
    <SafetyPlanBuilder />
  </LazyWrapper>
);

export const LazyCrisisResourcesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = (props) => (
  <LazyWrapper>
    <CrisisResourcesModal {...props} />
  </LazyWrapper>
);

export const LazyAnalyticsView: React.FC = () => (
  <LazyWrapper>
    <AnalyticsView />
  </LazyWrapper>
);

export const LazyCommunityView: React.FC = () => (
  <LazyWrapper>
    <CommunityView />
  </LazyWrapper>
);

export const LazySettingsView: React.FC = () => (
  <LazyWrapper>
    <SettingsView />
  </LazyWrapper>
);

export const LazyHabitTracker: React.FC = () => (
  <LazyWrapper>
    <HabitTracker />
  </LazyWrapper>
);

export const LazySleepTracker: React.FC = () => (
  <LazyWrapper>
    <SleepTracker />
  </LazyWrapper>
);

export const LazyMeditationTimer: React.FC = () => (
  <LazyWrapper>
    <MeditationTimer />
  </LazyWrapper>
);

// Crisis components with higher priority
export const LazyCrisisAlert: React.FC<any> = (props) => (
  <LazyWrapper fallback={<div>Loading crisis support...</div>} errorBoundary>
    <CrisisAlert {...props} />
  </LazyWrapper>
);

export const LazyCrisisSupportWidget: React.FC<any> = (props) => (
  <LazyWrapper fallback={null} errorBoundary>
    <CrisisSupportWidget {...props} />
  </LazyWrapper>
);

// Chat components
export const LazyAnonymousTherapyChat: React.FC = () => (
  <LazyWrapper>
    <AnonymousTherapyChat />
  </LazyWrapper>
);

// Community components
export const LazyStorySharing: React.FC = () => (
  <LazyWrapper>
    <StorySharing />
  </LazyWrapper>
);

export const LazyMentorshipProgram: React.FC = () => (
  <LazyWrapper>
    <MentorshipProgram />
  </LazyWrapper>
);

export const LazyCommunityEvents: React.FC = () => (
  <LazyWrapper>
    <CommunityEvents />
  </LazyWrapper>
);

// Data components
export const LazyDataExportManager: React.FC = () => (
  <LazyWrapper>
    <DataExportManager />
  </LazyWrapper>
);

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload crisis support components
  import('./CrisisAlert');
  import('./CrisisSupportWidget');
  
  // Preload commonly used components
  import('./MoodTracker');
  import('./JournalEditor');
};

// Utility function to preload components based on route
export const preloadForRoute = (route: string) => {
  switch (route) {
    case '/mood':
      import('./MoodTracker');
      import('../features/wellness/HabitTracker');
      break;
    case '/journal':
      import('./JournalEditor');
      break;
    case '/safety-plan':
      import('./safety/SafetyPlanBuilder');
      break;
    case '/community':
      import('../views/CommunityView');
      import('../features/community/StorySharing');
      break;
    case '/settings':
      import('../views/SettingsView');
      import('../features/data/DataExportManager');
      break;
    default:
      // Preload common components for unknown routes
      import('./MoodTracker');
      import('./CrisisAlert');
  }
};

export default LazyWrapper;
