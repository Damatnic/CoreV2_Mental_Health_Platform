import React, { lazy, Suspense, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Define component registry interface
interface ComponentRegistry {
  [key: string]: {
    component: React.LazyExoticComponent<ComponentType<any>>;
    preload?: () => Promise<any>;
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    metadata?: {
      category: string;
      priority: 'low' | 'medium' | 'high';
      size: 'small' | 'medium' | 'large';
    };
  };
}

// Default fallback components
const DefaultFallback: React.FC = () => (
  <div className="component-loading">
    <LoadingSpinner size="medium" />
    <p>Loading component...</p>
  </div>
);

const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="component-error">
    <h3>Failed to load component</h3>
    <p>{error.message}</p>
    <button onClick={retry} className="retry-btn">
      Try Again
    </button>
  </div>
);

// Component registry
const componentRegistry: ComponentRegistry = {
  // Core components
  'mood-tracker': {
    component: lazy(() => import('./MoodTracker')),
    metadata: { category: 'wellness', priority: 'high', size: 'medium' }
  },
  'journal-editor': {
    component: lazy(() => import('./JournalEditor')),
    metadata: { category: 'wellness', priority: 'high', size: 'large' }
  },
  'crisis-resources': {
    component: lazy(() => import('./CrisisResourcesModal')),
    metadata: { category: 'crisis', priority: 'high', size: 'medium' }
  },
  'safety-plan': {
    component: lazy(() => import('./safety/SafetyPlanBuilder')),
    metadata: { category: 'crisis', priority: 'high', size: 'large' }
  },

  // Wellness components
  'meditation-timer': {
    component: lazy(() => import('./MeditationTimer/MeditationTimer')),
    metadata: { category: 'wellness', priority: 'medium', size: 'medium' }
  },
  'breathing-exercise': {
    component: lazy(() => import('./BreathingExercise/BreathingExercise')),
    metadata: { category: 'wellness', priority: 'medium', size: 'small' }
  },
  'grounding-technique': {
    component: lazy(() => import('./GroundingTechnique/GroundingTechnique')),
    metadata: { category: 'wellness', priority: 'medium', size: 'medium' }
  },
  'habit-tracker': {
    component: lazy(() => import('../features/wellness/HabitTracker')),
    metadata: { category: 'wellness', priority: 'medium', size: 'medium' }
  },
  'sleep-tracker': {
    component: lazy(() => import('../features/wellness/SleepTracker')),
    metadata: { category: 'wellness', priority: 'medium', size: 'medium' }
  },

  // Community components
  'story-sharing': {
    component: lazy(() => import('../features/community/StorySharing')),
    metadata: { category: 'community', priority: 'low', size: 'large' }
  },
  'mentorship-program': {
    component: lazy(() => import('../features/community/MentorshipProgram')),
    metadata: { category: 'community', priority: 'low', size: 'large' }
  },
  'community-events': {
    component: lazy(() => import('../features/community/CommunityEvents')),
    metadata: { category: 'community', priority: 'low', size: 'medium' }
  },

  // Communication components
  'anonymous-chat': {
    component: lazy(() => import('../features/chat/AnonymousTherapyChat')),
    metadata: { category: 'communication', priority: 'medium', size: 'large' }
  },

  // Analytics and data
  'analytics-view': {
    component: lazy(() => import('../views/AnalyticsView')),
    metadata: { category: 'analytics', priority: 'low', size: 'large' }
  },
  'data-export': {
    component: lazy(() => import('../features/data/DataExportManager')),
    metadata: { category: 'settings', priority: 'low', size: 'medium' }
  },

  // Settings and configuration
  'settings-view': {
    component: lazy(() => import('../views/SettingsView')),
    metadata: { category: 'settings', priority: 'low', size: 'large' }
  },

  // Mobile components
  'mobile-breathing': {
    component: lazy(() => import('./MobileBreathing')),
    metadata: { category: 'mobile', priority: 'medium', size: 'small' }
  }
};

// Error boundary for lazy components
class LazyComponentErrorBoundary extends React.Component<
  { 
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    componentId: string;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error loading component ${this.props.componentId}:`, error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const ErrorComponent = this.props.fallback || DefaultErrorFallback;
      return <ErrorComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Registry manager class
class LazyComponentRegistry {
  private preloadedComponents: Set<string> = new Set();
  private preloadPromises: Map<string, Promise<any>> = new Map();

  // Get component by ID
  getComponent(componentId: string): React.LazyExoticComponent<ComponentType<any>> | null {
    const entry = componentRegistry[componentId];
    return entry ? entry.component : null;
  }

  // Render component with error boundary and suspense
  renderComponent(componentId: string, props: any = {}, options: {
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  } = {}): React.ReactElement | null {
    const entry = componentRegistry[componentId];
    if (!entry) {
      console.warn(`Component '${componentId}' not found in registry`);
      return null;
    }

    const Component = entry.component;
    const errorFallback = options.errorFallback || entry.errorFallback;

    return (
      <LazyComponentErrorBoundary 
        componentId={componentId} 
        fallback={errorFallback}
      >
        <Suspense fallback={<fallback />}>
          <Component {...props} />
        </Suspense>
      </LazyComponentErrorBoundary>
    );
  }

  // Preload component
  async preloadComponent(componentId: string): Promise<void> {
    if (this.preloadedComponents.has(componentId)) {
      return;
    }

    const entry = componentRegistry[componentId];
    if (!entry) {
      throw new Error(`Component '${componentId}' not found in registry`);
    }

    if (!this.preloadPromises.has(componentId)) {
      const preloadPromise = entry.preload ? entry.preload() : (entry.component as any)._payload._result;
      this.preloadPromises.set(componentId, preloadPromise);
    }

    try {
      await this.preloadPromises.get(componentId);
      this.preloadedComponents.add(componentId);
    } catch (error) {
      console.error(`Failed to preload component '${componentId}':`, error);
      this.preloadPromises.delete(componentId);
      throw error;
    }
  }

  // Preload components by category
  async preloadByCategory(category: string): Promise<void> {
    const componentIds = Object.keys(componentRegistry).filter(
      id => componentRegistry[id].metadata?.category === category
    );

    await Promise.allSettled(
      componentIds.map(id => this.preloadComponent(id))
    );
  }

  // Preload components by priority
  async preloadByPriority(priority: 'low' | 'medium' | 'high'): Promise<void> {
    const componentIds = Object.keys(componentRegistry).filter(
      id => componentRegistry[id].metadata?.priority === priority
    );

    await Promise.allSettled(
      componentIds.map(id => this.preloadComponent(id))
    );
  }

  // Get all components by category
  getComponentsByCategory(category: string): string[] {
    return Object.keys(componentRegistry).filter(
      id => componentRegistry[id].metadata?.category === category
    );
  }

  // Get component metadata
  getComponentMetadata(componentId: string) {
    const entry = componentRegistry[componentId];
    return entry?.metadata || null;
  }

  // Check if component is preloaded
  isPreloaded(componentId: string): boolean {
    return this.preloadedComponents.has(componentId);
  }

  // Get all available component IDs
  getAllComponentIds(): string[] {
    return Object.keys(componentRegistry);
  }

  // Get registry statistics
  getStats() {
    const total = Object.keys(componentRegistry).length;
    const preloaded = this.preloadedComponents.size;
    const byCategory = Object.values(componentRegistry).reduce((acc, entry) => {
      const category = entry.metadata?.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      preloaded,
      preloadPercentage: Math.round((preloaded / total) * 100),
      byCategory
    };
  }

  // Cleanup preload promises
  clearPreloadCache(): void {
    this.preloadedComponents.clear();
    this.preloadPromises.clear();
  }
}

// Create singleton instance
export const lazyComponentRegistry = new LazyComponentRegistry();

// React hook for using the registry
export const useLazyComponent = (componentId: string) => {
  const [isPreloaded, setIsPreloaded] = React.useState(
    lazyComponentRegistry.isPreloaded(componentId)
  );

  const preload = React.useCallback(async () => {
    try {
      await lazyComponentRegistry.preloadComponent(componentId);
      setIsPreloaded(true);
    } catch (error) {
      console.error(`Failed to preload component ${componentId}:`, error);
    }
  }, [componentId]);

  const render = React.useCallback((props: any = {}, options: any = {}) => {
    return lazyComponentRegistry.renderComponent(componentId, props, options);
  }, [componentId]);

  React.useEffect(() => {
    setIsPreloaded(lazyComponentRegistry.isPreloaded(componentId));
  }, [componentId]);

  return {
    isPreloaded,
    preload,
    render,
    metadata: lazyComponentRegistry.getComponentMetadata(componentId)
  };
};

// Component for rendering lazy components
export const LazyComponent: React.FC<{
  componentId: string;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  [key: string]: any;
}> = ({ componentId, fallback, errorFallback, ...props }) => {
  return lazyComponentRegistry.renderComponent(componentId, props, {
    fallback,
    errorFallback
  });
};

export default lazyComponentRegistry;
