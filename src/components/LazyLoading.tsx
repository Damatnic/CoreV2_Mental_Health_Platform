/**
 * Lazy Loading Component
 * 
 * Provides lazy loading functionality for components with loading states
 */

import React, { Suspense, lazy, ComponentType } from 'react';

interface LazyLoadingProps {
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error }>;
  delay?: number;
  threshold?: number;
}

interface LazyComponentOptions {
  loader: () => Promise<{ default: ComponentType<any> }>;
  loading?: React.ReactNode;
  error?: React.ComponentType<{ error: Error }>;
  delay?: number;
}

/**
 * Lazy load a component with loading and error states
 */
export function lazyLoad<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  _options: LazyLoadingProps = {}
): React.LazyExoticComponent<T> {
  const LazyComponent = lazy(loader);
  
  return LazyComponent;
}

/**
 * Loading fallback component
 */
export const LoadingFallback: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

/**
 * Error boundary for lazy loaded components
 */
export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
        <h3 className="text-red-800 font-semibold mb-2">Failed to load component</h3>
        <p className="text-red-600 text-sm">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

/**
 * Lazy loading wrapper component
 */
export const LazyLoading: React.FC<LazyLoadingProps & { children: React.ReactNode }> = ({
  children,
  fallback = <LoadingFallback />,
  errorFallback = DefaultErrorFallback,
  delay = 0
}) => {
  const [shouldRender, setShouldRender] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0 && !shouldRender) {
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <LazyErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
};

/**
 * HOC for lazy loading with intersection observer
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: LazyLoadingProps = {}
): ComponentType<P> {
  return (props: P) => {
    const [isIntersecting, setIsIntersecting] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        },
        { threshold: options.threshold || 0 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, [options.threshold]);

    return (
      <div ref={ref}>
        {isIntersecting ? (
          <LazyLoading {...options}>
            <Component {...props} />
          </LazyLoading>
        ) : (
          options.fallback || <div style={{ minHeight: '100px' }} />
        )}
      </div>
    );
  };
}

export default LazyLoading;



