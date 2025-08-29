/**
 * Error Tracking Configuration
 * Centralized configuration for error tracking and monitoring
 */

// Error tracking configuration interface
export interface ErrorTrackingConfig {
  enabled: boolean;
  dsn?: string;
  environment: string;
  sampleRate: number;
  tracesSampleRate: number;
  beforeSend?: (event: any) => any | null;
  beforeSendTransaction?: (event: any) => any | null;
  integrations?: any[];
  release?: string;
  debug: boolean;
}

// Default error tracking configuration
export const errorTrackingConfig: ErrorTrackingConfig = {
  enabled: process.env.NODE_ENV === 'production',
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  release: process.env.VITE_APP_VERSION || '1.0.0',
  
  // Filter out sensitive information
  beforeSend: (event: any) => {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.VITE_ENABLE_ERROR_TRACKING) {
      return null;
    }

    // Filter out sensitive data
    if (event.exception) {
      const exception = event.exception.values?.[0];
      if (exception?.value) {
        // Remove potential passwords, tokens, etc.
        exception.value = exception.value.replace(/password=[\w\d]+/gi, 'password=[FILTERED]');
        exception.value = exception.value.replace(/token=[\w\d]+/gi, 'token=[FILTERED]');
        exception.value = exception.value.replace(/key=[\w\d]+/gi, 'key=[FILTERED]');
      }
    }

    // Filter out user data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb: any) => {
        if (breadcrumb.data) {
          const filteredData = { ...breadcrumb.data };
          delete filteredData.password;
          delete filteredData.token;
          delete filteredData.apiKey;
          delete filteredData.email;
          breadcrumb.data = filteredData;
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // Filter transactions
  beforeSendTransaction: (event: any) => {
    // Don't send transactions in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    return event;
  }
};

/**
 * Initialize error tracking
 * This function should be called early in the application lifecycle
 */
export const initializeErrorTracking = async (): Promise<void> => {
  if (!errorTrackingConfig.enabled || !errorTrackingConfig.dsn) {
    console.log('Error tracking disabled or no DSN provided');
    return;
  }

  try {
    // Dynamically import Sentry to avoid loading it in development
    const { init, configureScope } = await import('@sentry/browser');
    
    init({
      dsn: errorTrackingConfig.dsn,
      environment: errorTrackingConfig.environment,
      sampleRate: errorTrackingConfig.sampleRate,
      tracesSampleRate: errorTrackingConfig.tracesSampleRate,
      beforeSend: errorTrackingConfig.beforeSend,
      beforeSendTransaction: errorTrackingConfig.beforeSendTransaction,
      debug: errorTrackingConfig.debug,
      release: errorTrackingConfig.release,
      
      integrations: [
        // Add browser-specific integrations
      ],
      
      // Additional configuration
      attachStacktrace: true,
      autoSessionTracking: true,
      sendDefaultPii: false, // Don't send personally identifiable information
    });

    // Configure scope
    configureScope((scope) => {
      scope.setTag('component', 'mental-health-platform');
      scope.setContext('app', {
        name: 'CoreV2',
        version: errorTrackingConfig.release,
      });
    });

    console.log('Error tracking initialized successfully');
  } catch (error) {
    console.error('Failed to initialize error tracking:', error);
  }
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}): void => {
  if (!errorTrackingConfig.enabled) return;

  import('@sentry/browser').then(({ configureScope }) => {
    configureScope((scope) => {
      scope.setUser({
        id: user.id,
        username: user.username,
        // Don't include email in production for privacy
        ...(process.env.NODE_ENV !== 'production' && { email: user.email }),
      });
      scope.setTag('user.role', user.role || 'user');
    });
  }).catch(console.error);
};

/**
 * Clear user context
 */
export const clearUserContext = (): void => {
  if (!errorTrackingConfig.enabled) return;

  import('@sentry/browser').then(({ configureScope }) => {
    configureScope((scope) => {
      scope.clear();
    });
  }).catch(console.error);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (message: string, category = 'custom', level = 'info', data?: any): void => {
  if (!errorTrackingConfig.enabled) return;

  import('@sentry/browser').then(({ addBreadcrumb: sentryAddBreadcrumb }) => {
    sentryAddBreadcrumb({
      message,
      category,
      level: level as any,
      data,
      timestamp: Date.now() / 1000,
    });
  }).catch(console.error);
};

/**
 * Capture exception manually
 */
export const captureException = (error: Error, context?: any): void => {
  if (!errorTrackingConfig.enabled) {
    console.error('Error (tracking disabled):', error, context);
    return;
  }

  import('@sentry/browser').then(({ captureException: sentryCaptureException, withScope }) => {
    if (context) {
      withScope((scope) => {
        scope.setContext('error_context', context);
        sentryCaptureException(error);
      });
    } else {
      sentryCaptureException(error);
    }
  }).catch(console.error);
};

/**
 * Capture message manually
 */
export const captureMessage = (message: string, level = 'info', context?: any): void => {
  if (!errorTrackingConfig.enabled) {
    console.log(`Message (tracking disabled) [${level}]:`, message, context);
    return;
  }

  import('@sentry/browser').then(({ captureMessage: sentryCaptureMessage, withScope }) => {
    if (context) {
      withScope((scope) => {
        scope.setContext('message_context', context);
        sentryCaptureMessage(message, level as any);
      });
    } else {
      sentryCaptureMessage(message, level as any);
    }
  }).catch(console.error);
};

export default errorTrackingConfig;