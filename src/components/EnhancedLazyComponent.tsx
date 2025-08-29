import React, { Suspense, ComponentType, ReactNode, useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface LazyLoadOptions {
  fallback?: ReactNode;
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  preload?: boolean;
  priority?: 'low' | 'normal' | 'high';
  intersection?: {
    enabled: boolean;
    rootMargin?: string;
    threshold?: number;
  };
}

interface EnhancedLazyComponentProps {
  children: ReactNode;
  className?: string;
  loadingComponent?: ComponentType;
  errorComponent?: ComponentType<{ error: Error; retry: () => void }>;
  options?: LazyLoadOptions;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Default loading component
const DefaultLoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

// Default error component
const DefaultErrorComponent: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Loading Failed
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {!isOnline ? 
            'Please check your internet connection and try again.' :
            'There was an error loading this component. Please try again.'
          }
        </p>

        {!isOnline && (
          <div className="flex items-center justify-center gap-2 text-sm text-red-600 mb-4">
            <WifiOff className="w-4 h-4" />
            <span>You are offline</span>
          </div>
        )}

        {isOnline && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-4">
            <Wifi className="w-4 h-4" />
            <span>Connected</span>
          </div>
        )}
        
        <button
          onClick={retry}
          disabled={!isOnline}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>

        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Error Details
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 overflow-auto">
            {error.message}
            {error.stack && '\n\n' + error.stack}
          </pre>
        </details>
      </div>
    </div>
  );
};

// Skeleton loading component for better UX
const SkeletonLoader: React.FC<{ 
  type?: 'card' | 'text' | 'avatar' | 'button' | 'form';
  lines?: number;
}> = ({ type = 'card', lines = 3 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'avatar':
        return (
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          </div>
        );
      
      case 'button':
        return (
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded-lg w-24"></div>
          </div>
        );
      
      case 'form':
        return (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-300 rounded w-20"></div>
          </div>
        );
      
      case 'text':
        return (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <div 
                key={i}
                className={`h-4 bg-gray-300 rounded ${
                  i === lines - 1 ? 'w-2/3' : 'w-full'
                }`}
              ></div>
            ))}
          </div>
        );
      
      case 'card':
      default:
        return (
          <div className="animate-pulse">
            <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        );
    }
  };

  return (
    <div className="p-4">
      {renderSkeleton()}
    </div>
  );
};

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  {
    children: ReactNode;
    errorComponent: ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error) => void;
  },
  { error: Error | null; retryKey: number }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyComponent Error:', error, errorInfo);
    this.props.onError?.(error);
  }

  retry = () => {
    this.setState({ error: null, retryKey: this.state.retryKey + 1 });
  };

  render() {
    if (this.state.error) {
      const ErrorComponent = this.props.errorComponent;
      return <ErrorComponent error={this.state.error} retry={this.retry} />;
    }

    return (
      <div key={this.state.retryKey}>
        {this.props.children}
      </div>
    );
  }
}

// Intersection Observer hook for lazy loading
const useIntersectionObserver = (
  options: LazyLoadOptions['intersection'] = { enabled: false }
): [React.RefObject<HTMLDivElement>, boolean] => {
  const [isVisible, setIsVisible] = useState(!options.enabled);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!options.enabled || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options.enabled, options.rootMargin, options.threshold, isVisible]);

  return [ref, isVisible];
};

// Performance monitoring
const usePerformanceMonitoring = () => {
  const markStart = useCallback((name: string) => {
    performance.mark(`${name}-start`);
  }, []);

  const markEnd = useCallback((name: string) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    if (measure) {
      console.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
    }
  }, []);

  return { markStart, markEnd };
};

export const EnhancedLazyComponent: React.FC<EnhancedLazyComponentProps> = ({
  children,
  className = '',
  loadingComponent: LoadingComponent = DefaultLoadingComponent,
  errorComponent: ErrorComponent = DefaultErrorComponent,
  options = {},
  onLoad,
  onError
}) => {
  const {
    intersection = { enabled: false },
    timeout = 10000,
    preload = false
  } = options;

  const [ref, isVisible] = useIntersectionObserver(intersection);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [loadStartTime] = useState(Date.now());
  const { markStart, markEnd } = usePerformanceMonitoring();

  useEffect(() => {
    if (isVisible || preload) {
      markStart('lazy-component-load');
      
      const timer = setTimeout(() => {
        setHasTimedOut(true);
        onError?.(new Error('Component loading timed out'));
      }, timeout);

      return () => {
        clearTimeout(timer);
        markEnd('lazy-component-load');
      };
    }
  }, [isVisible, preload, timeout, onError, markStart, markEnd]);

  useEffect(() => {
    if (isVisible && onLoad) {
      const loadTime = Date.now() - loadStartTime;
      console.log(`LazyComponent loaded in ${loadTime}ms`);
      onLoad();
    }
  }, [isVisible, onLoad, loadStartTime]);

  if (hasTimedOut) {
    return (
      <ErrorComponent 
        error={new Error('Component loading timed out')} 
        retry={() => setHasTimedOut(false)}
      />
    );
  }

  if (!isVisible) {
    return (
      <div ref={ref} className={className}>
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className={className}>
      <LazyErrorBoundary 
        errorComponent={ErrorComponent}
        onError={onError}
      >
        <Suspense fallback={<LoadingComponent />}>
          {children}
        </Suspense>
      </LazyErrorBoundary>
    </div>
  );
};

// Higher-order component for lazy loading
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  options?: LazyLoadOptions
) => {
  const WrappedComponent = React.forwardRef<HTMLDivElement, P & { className?: string }>((props, _ref) => {
    const { className, ...componentProps } = props;
    return (
      <EnhancedLazyComponent
        options={options}
        className={className}
      >
        <Component {...(componentProps as P)} />
      </EnhancedLazyComponent>
    );
  });
  
  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Prebuilt lazy loading components for common use cases
export const LazyCard: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <EnhancedLazyComponent 
    className={className}
    loadingComponent={() => <SkeletonLoader type="card" />}
    options={{ intersection: { enabled: true, rootMargin: '100px' } }}
  >
    {children}
  </EnhancedLazyComponent>
);

export const LazyForm: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <EnhancedLazyComponent 
    className={className}
    loadingComponent={() => <SkeletonLoader type="form" />}
    options={{ intersection: { enabled: true, rootMargin: '50px' } }}
  >
    {children}
  </EnhancedLazyComponent>
);

export const LazyChatMessage: React.FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <EnhancedLazyComponent 
    className={className}
    loadingComponent={() => <SkeletonLoader type="text" lines={2} />}
    options={{ 
      intersection: { enabled: true, rootMargin: '200px' },
      priority: 'high'
    }}
  >
    {children}
  </EnhancedLazyComponent>
);

export default EnhancedLazyComponent;
