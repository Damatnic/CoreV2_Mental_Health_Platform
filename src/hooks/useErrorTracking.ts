/**
 * Error Tracking Hook
 * 
 * React hook for error tracking and monitoring in mental health platform components.
 * Provides comprehensive error tracking with user context and performance metrics.
 */

import { useCallback, useEffect, useRef } from 'react';

// Error tracking interfaces
export interface ErrorContext {
  userType?: 'seeker' | 'helper' | 'admin';
  sessionId?: string;
  component?: string;
  action?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface UseErrorTrackingOptions {
  userType?: 'seeker' | 'helper' | 'admin';
  sessionId?: string;
  component?: string;
  enablePerformanceTracking?: boolean;
  enableUserInteractionTracking?: boolean;
  enableGlobalErrorHandler?: boolean;
}

export interface UseErrorTrackingReturn {
  trackError: (error: Error, context?: ErrorContext) => void;
  trackWarning: (message: string, context?: ErrorContext) => void;
  trackInfo: (message: string, context?: ErrorContext) => void;
  trackUserAction: (action: string, data?: any) => void;
  trackPerformance: (metric: string, value: number) => void;
  setUserContext: (context: Partial<ErrorContext>) => void;
  clearErrors: () => void;
  getErrorStats: () => ErrorStats;
}

export interface ErrorStats {
  totalErrors: number;
  totalWarnings: number;
  totalInfo: number;
  lastError?: string;
  lastErrorTime?: string;
  errorsByType: Record<string, number>;
}

// Mock error tracking service for this implementation
class MockErrorTrackingService {
  private context: ErrorContext = {};
  private errors: Array<{ error: any; context: ErrorContext; timestamp: string; type: string }> = [];
  private maxErrorsToStore = 100;

  setContext(context: Partial<ErrorContext>): void {
    this.context = { ...this.context, ...context };
  }

  trackError(error: Error | string, context?: ErrorContext): void {
    const errorData = {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      context: { ...this.context, ...context },
      timestamp: new Date().toISOString(),
      type: 'error'
    };

    this.errors.push(errorData);
    this.trimErrors();

    // In production, this would send to actual error tracking service
    console.error('[Error Tracking]', errorData);

    // For mental health platform, we might want to flag critical errors
    if (context?.severity === 'critical') {
      this.handleCriticalError(errorData);
    }
  }

  trackWarning(message: string, context?: ErrorContext): void {
    const warningData = {
      error: message,
      context: { ...this.context, ...context },
      timestamp: new Date().toISOString(),
      type: 'warning'
    };

    this.errors.push(warningData);
    this.trimErrors();

    console.warn('[Warning Tracking]', warningData);
  }

  trackInfo(message: string, context?: ErrorContext): void {
    const infoData = {
      error: message,
      context: { ...this.context, ...context },
      timestamp: new Date().toISOString(),
      type: 'info'
    };

    this.errors.push(infoData);
    this.trimErrors();

    console.info('[Info Tracking]', infoData);
  }

  trackUserAction(action: string, data?: any): void {
    const actionData = {
      error: `User action: ${action}`,
      context: { ...this.context, action, metadata: data },
      timestamp: new Date().toISOString(),
      type: 'user_action'
    };

    this.errors.push(actionData);
    this.trimErrors();

    console.log('[User Action]', actionData);
  }

  trackPerformance(metric: string, value: number, context?: ErrorContext): void {
    const performanceData = {
      error: `Performance metric: ${metric} = ${value}ms`,
      context: { ...this.context, ...context, metadata: { metric, value } },
      timestamp: new Date().toISOString(),
      type: 'performance'
    };

    this.errors.push(performanceData);
    this.trimErrors();

    console.log('[Performance]', performanceData);
  }

  getErrors(): typeof this.errors {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  getStats(): ErrorStats {
    const stats: ErrorStats = {
      totalErrors: 0,
      totalWarnings: 0,
      totalInfo: 0,
      errorsByType: {}
    };

    this.errors.forEach(entry => {
      stats.errorsByType[entry.type] = (stats.errorsByType[entry.type] || 0) + 1;

      switch (entry.type) {
        case 'error':
          stats.totalErrors++;
          if (!stats.lastError || entry.timestamp > stats.lastErrorTime!) {
            stats.lastError = typeof entry.error === 'string' ? entry.error : entry.error.message;
            stats.lastErrorTime = entry.timestamp;
          }
          break;
        case 'warning':
          stats.totalWarnings++;
          break;
        case 'info':
          stats.totalInfo++;
          break;
      }
    });

    return stats;
  }

  private trimErrors(): void {
    if (this.errors.length > this.maxErrorsToStore) {
      this.errors = this.errors.slice(-this.maxErrorsToStore);
    }
  }

  private handleCriticalError(errorData: any): void {
    // In a real mental health platform, critical errors might trigger:
    // - Immediate alerts to support team
    // - Fallback to safe mode
    // - User notification with support resources
    console.error('[CRITICAL ERROR]', errorData);
  }
}

// Global error tracking service instance
const errorTrackingService = new MockErrorTrackingService();

export const useErrorTracking = (options: UseErrorTrackingOptions = {}): UseErrorTrackingReturn => {
  const {
    userType = 'seeker',
    sessionId = `session_${Date.now()}`,
    component = 'unknown-component',
    enablePerformanceTracking = false,
    enableUserInteractionTracking = false,
    enableGlobalErrorHandler = true
  } = options;

  const contextRef = useRef<ErrorContext>({
    userType,
    sessionId,
    component
  });

  // Initialize error tracking context
  useEffect(() => {
    const context: ErrorContext = {
      userType,
      sessionId,
      component
    };

    contextRef.current = context;
    errorTrackingService.setContext(context);
  }, [userType, sessionId, component]);

  // Set up global error handler
  useEffect(() => {
    if (!enableGlobalErrorHandler) return;

    const handleGlobalError = (event: ErrorEvent) => {
      errorTrackingService.trackError(event.error || new Error(event.message), {
        ...contextRef.current,
        severity: 'high',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          source: 'global-error-handler'
        }
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorTrackingService.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          ...contextRef.current,
          severity: 'high',
          metadata: {
            source: 'unhandled-promise-rejection',
            reason: event.reason
          }
        }
      );
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enableGlobalErrorHandler]);

  const trackError = useCallback((error: Error, context?: ErrorContext) => {
    errorTrackingService.trackError(error, {
      ...contextRef.current,
      ...context,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackWarning = useCallback((message: string, context?: ErrorContext) => {
    errorTrackingService.trackWarning(message, {
      ...contextRef.current,
      ...context,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackInfo = useCallback((message: string, context?: ErrorContext) => {
    errorTrackingService.trackInfo(message, {
      ...contextRef.current,
      ...context,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackUserAction = useCallback((action: string, data?: any) => {
    if (enableUserInteractionTracking) {
      errorTrackingService.trackUserAction(action, {
        ...data,
        userType: contextRef.current.userType,
        sessionId: contextRef.current.sessionId,
        component: contextRef.current.component,
        timestamp: new Date().toISOString()
      });
    }
  }, [enableUserInteractionTracking]);

  const trackPerformance = useCallback((metric: string, value: number) => {
    if (enablePerformanceTracking) {
      errorTrackingService.trackPerformance(metric, value, {
        ...contextRef.current,
        timestamp: new Date().toISOString()
      });
    }
  }, [enablePerformanceTracking]);

  const setUserContext = useCallback((context: Partial<ErrorContext>) => {
    const newContext = { ...contextRef.current, ...context };
    contextRef.current = newContext;
    errorTrackingService.setContext(newContext);
  }, []);

  const clearErrors = useCallback(() => {
    errorTrackingService.clearErrors();
  }, []);

  const getErrorStats = useCallback((): ErrorStats => {
    return errorTrackingService.getStats();
  }, []);

  return {
    trackError,
    trackWarning,
    trackInfo,
    trackUserAction,
    trackPerformance,
    setUserContext,
    clearErrors,
    getErrorStats
  };
};

// Utility hook for automatic error boundary integration
export const useErrorBoundary = (component: string): ((error: Error) => void) => {
  const { trackError } = useErrorTracking({ component, enableGlobalErrorHandler: false });

  return useCallback((error: Error) => {
    trackError(error, {
      severity: 'critical',
      component,
      metadata: {
        source: 'error-boundary',
        componentStack: 'Available in React DevTools'
      }
    });
  }, [trackError, component]);
};

// Utility hook for performance monitoring
export const usePerformanceTracking = (componentName: string) => {
  const { trackPerformance } = useErrorTracking({
    component: componentName,
    enablePerformanceTracking: true
  });

  const measureRender = useCallback(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      trackPerformance(`${componentName}_render_time`, renderTime);
    };
  }, [trackPerformance, componentName]);

  const measureAsyncOperation = useCallback((operationName: string) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      trackPerformance(`${componentName}_${operationName}_time`, operationTime);
    };
  }, [trackPerformance, componentName]);

  return {
    measureRender,
    measureAsyncOperation,
    trackPerformance
  };
};

export default useErrorTracking;