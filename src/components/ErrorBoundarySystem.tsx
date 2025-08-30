import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'app';
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

/**
 * Comprehensive Error Boundary System
 * Provides multi-level error handling with recovery strategies
 */
export class ErrorBoundarySystem extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private readonly ERROR_RESET_TIME = 5000; // 5 seconds
  private readonly MAX_ERROR_COUNT = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    const { errorCount, lastErrorTime } = this.state;
    
    const now = Date.now();
    const timeSinceLastError = now - lastErrorTime;
    
    // Implement exponential backoff for error recovery
    const newErrorCount = timeSinceLastError < this.ERROR_RESET_TIME 
      ? errorCount + 1 
      : 1;

    // Log error with appropriate severity
    const severity = this.getSeverityLevel(newErrorCount, level);
    logger.error(`Error caught by ${level} boundary`, {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorCount: newErrorCount,
      severity
    }, 'ErrorBoundarySystem');

    // Update state
    this.setState({
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Send error to monitoring service (in production)
    this.reportErrorToService(error, errorInfo, severity);

    // Auto-recovery attempt for non-critical errors
    if (newErrorCount < this.MAX_ERROR_COUNT && level !== 'app') {
      this.scheduleReset();
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
    
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private getSeverityLevel(errorCount: number, level: string): 'low' | 'medium' | 'high' | 'critical' {
    if (level === 'app' || errorCount >= this.MAX_ERROR_COUNT) {
      return 'critical';
    }
    if (level === 'page') {
      return errorCount > 1 ? 'high' : 'medium';
    }
    return errorCount > 1 ? 'medium' : 'low';
  }

  private reportErrorToService(error: Error, errorInfo: ErrorInfo, severity: string) {
    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      console.error('Error reported to monitoring service:', {
        error: error.toString(),
        severity,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  private scheduleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    
    this.resetTimeoutId = setTimeout(() => {
      logger.info('Attempting automatic error recovery', undefined, 'ErrorBoundarySystem');
      this.resetErrorBoundary();
    }, this.ERROR_RESET_TIME);
  };

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    });
    
    logger.info('Error boundary reset', undefined, 'ErrorBoundarySystem');
  };

  render() {
    const { hasError, error, errorCount } = this.state;
    const { children, fallback, level = 'component', isolate } = this.props;

    if (hasError && error) {
      // Critical errors or max error count reached
      if (level === 'app' || errorCount >= this.MAX_ERROR_COUNT) {
        return (
          <div className="error-boundary-critical">
            <div className="error-container">
              <h1>Something went wrong</h1>
              <p>We're experiencing technical difficulties. Please try refreshing the page.</p>
              <div className="error-actions">
                <button onClick={() => window.location.reload()} className="reload-button">
                  Refresh Page
                </button>
                <a href="/help" className="help-link">Get Help</a>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="error-details">
                  <summary>Error Details (Development Only)</summary>
                  <pre>{error.toString()}</pre>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </details>
              )}
            </div>
          </div>
        );
      }

      // Page-level errors
      if (level === 'page') {
        return (
          <div className="error-boundary-page">
            <div className="error-container">
              <h2>This page encountered an error</h2>
              <p>We're having trouble loading this content. It will retry automatically.</p>
              <div className="error-actions">
                <button onClick={this.resetErrorBoundary} className="retry-button">
                  Try Again
                </button>
                <a href="/dashboard" className="dashboard-link">Go to Dashboard</a>
              </div>
              {errorCount > 1 && (
                <p className="error-hint">
                  Error persists? Try clearing your browser cache or contact support.
                </p>
              )}
            </div>
          </div>
        );
      }

      // Component-level errors
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className={`error-boundary-component ${isolate ? 'isolated' : ''}`}>
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>This component is temporarily unavailable</span>
            {errorCount < this.MAX_ERROR_COUNT && (
              <span className="auto-retry">Auto-retrying...</span>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook for using error boundaries declaratively
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return { captureError, resetError };
}

/**
 * Higher-order component for adding error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundarySystem {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundarySystem>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundarySystem;