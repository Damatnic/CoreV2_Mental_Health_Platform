/**
 * Comprehensive Error Handling and Logging System
 * 
 * Provides structured error management with crisis-aware logging,
 * user-friendly messaging, and comprehensive error tracking for mental health applications.
 * 
 * @fileoverview Error handling system with crisis-aware features
 * @version 2.0.0
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories specific to mental health platform
 */
export type ErrorCategory = 
  | 'authentication'
  | 'authorization'
  | 'crisis_system'
  | 'data_validation'
  | 'database'
  | 'external_api'
  | 'network'
  | 'performance'
  | 'security'
  | 'user_experience';

/**
 * Error context information
 */
export interface ErrorContext {
  userId?: string;
  userRole?: string;
  feature?: string;
  action?: string;
  timestamp: Date;
  requestId?: string;
  userAgent?: string;
  location?: string;
  deviceInfo?: string;
}

/**
 * Structured error interface
 */
export interface StructuredError {
  id: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  originalError?: Error;
  context: ErrorContext;
  stackTrace?: string;
  metadata?: Record<string, any>;
  isUserFacing: boolean;
  recoveryActions?: string[];
}

/**
 * Error callback function type
 */
export type ErrorCallback = (error: StructuredError) => void;

/**
 * Central error handler for the application
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: Map<string, StructuredError> = new Map();
  private errorCallbacks: ErrorCallback[] = [];

  private constructor() {
    this.setupGlobalHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with structured logging
   */
  public handleError(
    error: Error | string,
    category: ErrorCategory,
    context: Partial<ErrorContext> = {},
    metadata: Record<string, any> = {}
  ): StructuredError {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(category, error);

    const structuredError: StructuredError = {
      id: errorId,
      severity,
      category,
      message: typeof error === 'string' ? error : error.message,
      originalError: typeof error === 'string' ? undefined : error,
      context: {
        ...context,
        timestamp: new Date()
      },
      stackTrace: typeof error === 'string' ? undefined : error.stack,
      metadata,
      isUserFacing: this.isUserFacingError(category, severity),
      recoveryActions: this.getRecoveryActions(category, severity)
    };

    // Store error for analysis
    this.errors.set(errorId, structuredError);

    // Log error based on severity and category
    this.logError(structuredError);

    // Execute callbacks (for monitoring, alerts, etc.)
    this.errorCallbacks.forEach(callback => {
      try {
        callback(structuredError);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    // Handle crisis-related errors immediately
    if (category === 'crisis_system') {
      this.handleCrisisSystemError(structuredError);
    }

    return structuredError;
  }

  /**
   * Handle crisis system errors with special urgency
   */
  private handleCrisisSystemError(error: StructuredError): void {
    // In production, this would trigger immediate alerts
    if (process.env.NODE_ENV === 'production') {
      // Could integrate with external monitoring services here
      // e.g., Sentry, DataDog, PagerDuty
      console.error('🚨 CRISIS SYSTEM ERROR:', {
        errorId: error.id,
        severity: error.severity,
        message: error.message,
        userId: error.context.userId,
        feature: error.context.feature
      });
    }
  }

  /**
   * Register callback for error notifications
   */
  public onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Remove error callback
   */
  public offError(callback: ErrorCallback): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * Get user-friendly error message
   */
  public getUserMessage(error: StructuredError): string {
    if (!error.isUserFacing) {
      return 'Something went wrong. Our team has been notified.';
    }

    const messageMap: Record<ErrorCategory, Record<ErrorSeverity, string>> = {
      authentication: {
        low: 'Please try logging in again.',
        medium: 'Authentication failed. Please check your credentials.',
        high: 'Unable to authenticate. Please contact support.',
        critical: 'Authentication system unavailable. Please try again later.'
      },
      crisis_system: {
        low: 'Crisis system temporarily unavailable.',
        medium: 'Unable to access crisis support. Please try the emergency hotline: 988.',
        high: 'Crisis system error. Please call 988 immediately if you need help.',
        critical: 'EMERGENCY: Crisis system down. Call 988 or go to your nearest emergency room.'
      },
      data_validation: {
        low: 'Please check your input and try again.',
        medium: 'Some information appears invalid. Please review and resubmit.',
        high: 'Unable to process your request. Please contact support.',
        critical: 'System validation error. Please contact support immediately.'
      },
      network: {
        low: 'Connection issue. Please try again.',
        medium: 'Network error. Please check your connection.',
        high: 'Unable to connect. Please try again later.',
        critical: 'Service unavailable. Please try again in a few minutes.'
      },
      database: {
        low: 'Temporary data issue. Please try again.',
        medium: 'Unable to save your information. Please try again.',
        high: 'Data service unavailable. Please try again later.',
        critical: 'Database error. Your data may not be saved.'
      },
      external_api: {
        low: 'External service temporarily unavailable.',
        medium: 'Some features may be limited right now.',
        high: 'External services unavailable. Some features may not work.',
        critical: 'Multiple services down. Limited functionality available.'
      },
      performance: {
        low: 'System running slowly. Please be patient.',
        medium: 'Performance issue detected. Some delays expected.',
        high: 'System overloaded. Please try again in a few minutes.',
        critical: 'System under heavy load. Emergency features still available.'
      },
      security: {
        low: 'Security check failed. Please try again.',
        medium: 'Security verification required. Please log in again.',
        high: 'Security issue detected. Account temporarily restricted.',
        critical: 'Security breach detected. Please change your password immediately.'
      },
      user_experience: {
        low: 'Minor display issue. Functionality not affected.',
        medium: 'Interface issue. Please refresh the page.',
        high: 'Display problem. Please try a different browser.',
        critical: 'Interface unavailable. Please contact support.'
      },
      authorization: {
        low: 'Access restricted for this feature.',
        medium: 'You don\'t have permission for this action.',
        high: 'Access denied. Please contact your administrator.',
        critical: 'Authorization system error. Please contact support.'
      }
    };

    return messageMap[error.category]?.[error.severity] || 
           'An unexpected error occurred. Please try again.';
  }

  /**
   * Get recovery actions for an error
   */
  private getRecoveryActions(category: ErrorCategory, severity: ErrorSeverity): string[] {
    const actionMap: Record<ErrorCategory, string[]> = {
      authentication: ['Clear browser cache', 'Try logging in again', 'Reset password if needed'],
      crisis_system: ['Call 988 immediately', 'Contact emergency services if needed', 'Try accessing safety plan'],
      data_validation: ['Review input data', 'Check required fields', 'Try submitting again'],
      network: ['Check internet connection', 'Try refreshing page', 'Switch to mobile data'],
      database: ['Try again in a few minutes', 'Save work locally if possible', 'Contact support if persistent'],
      external_api: ['Wait and try again', 'Use alternative features', 'Contact support if critical'],
      performance: ['Close other tabs', 'Try again later', 'Clear browser cache'],
      security: ['Log out and log back in', 'Check account security', 'Contact support if suspicious'],
      user_experience: ['Refresh the page', 'Try different browser', 'Clear browser cache'],
      authorization: ['Check account permissions', 'Contact administrator', 'Log out and log back in']
    };

    return actionMap[category] || ['Try again later', 'Contact support if issue persists'];
  }

  /**
   * Determine error severity based on category and error details
   */
  private determineSeverity(category: ErrorCategory, error: Error | string): ErrorSeverity {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const lowerMessage = errorMessage.toLowerCase();

    // Crisis-related errors are always high priority
    if (category === 'crisis_system') {
      if (lowerMessage.includes('emergency') || lowerMessage.includes('critical')) {
        return 'critical';
      }
      return 'high';
    }

    // Security errors are generally high priority
    if (category === 'security') {
      if (lowerMessage.includes('breach') || lowerMessage.includes('unauthorized')) {
        return 'critical';
      }
      if (lowerMessage.includes('authentication') || lowerMessage.includes('permission')) {
        return 'high';
      }
      return 'medium';
    }

    // Database errors affecting data integrity
    if (category === 'database') {
      if (lowerMessage.includes('constraint') || lowerMessage.includes('integrity')) {
        return 'high';
      }
      if (lowerMessage.includes('connection') || lowerMessage.includes('timeout')) {
        return 'medium';
      }
      return 'low';
    }

    // Network and external API errors
    if (category === 'network' || category === 'external_api') {
      if (lowerMessage.includes('timeout') || lowerMessage.includes('unreachable')) {
        return 'medium';
      }
      return 'low';
    }

    // Default severity assessment
    if (lowerMessage.includes('critical') || lowerMessage.includes('fatal')) {
      return 'critical';
    }
    if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Determine if error should be shown to user
   */
  private isUserFacingError(category: ErrorCategory, severity: ErrorSeverity): boolean {
    // Always show crisis-related errors to users
    if (category === 'crisis_system') return true;
    
    // Show authentication and authorization errors
    if (category === 'authentication' || category === 'authorization') return true;
    
    // Show data validation errors
    if (category === 'data_validation') return true;
    
    // Show high-severity errors in other categories
    if (severity === 'high' || severity === 'critical') return true;
    
    // Don't show internal system errors
    return false;
  }

  /**
   * Log error with appropriate level and destination
   */
  private logError(error: StructuredError): void {
    const logData = {
      errorId: error.id,
      severity: error.severity,
      category: error.category,
      message: error.message,
      userId: error.context.userId,
      feature: error.context.feature,
      timestamp: error.context.timestamp.toISOString(),
      metadata: error.metadata
    };

    // Console logging with appropriate level
    switch (error.severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', logData);
        break;
      case 'high':
        console.error('❗ HIGH SEVERITY ERROR:', logData);
        break;
      case 'medium':
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
        break;
      case 'low':
        console.info('ℹ️ LOW SEVERITY ERROR:', logData);
        break;
    }

    // Store in local storage for offline analysis (development)
    if (process.env.NODE_ENV === 'development') {
      try {
        const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
        storedErrors.push(logData);
        
        // Keep only last 100 errors
        if (storedErrors.length > 100) {
          storedErrors.splice(0, storedErrors.length - 100);
        }
        
        localStorage.setItem('app_errors', JSON.stringify(storedErrors));
      } catch (storageError) {
        console.warn('Could not store error in localStorage:', storageError);
      }
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason,
        'user_experience',
        { feature: 'global_handler' },
        { type: 'unhandled_promise_rejection' }
      );
    });

    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(
        event.error || event.message,
        'user_experience',
        {
          feature: 'global_handler',
          location: `${event.filename}:${event.lineno}:${event.colno}`
        },
        { type: 'javascript_error' }
      );
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.handleError(
          `Failed to load resource: ${target.tagName}`,
          'performance',
          { feature: 'resource_loading' },
          {
            type: 'resource_error',
            tagName: target.tagName,
            src: target.getAttribute('src') || target.getAttribute('href')
          }
        );
      }
    }, true);
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): {
    totalErrors: number;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByCategory: Record<ErrorCategory, number>;
    recentErrors: StructuredError[];
  } {
    const errors = Array.from(this.errors.values());

    const errorsBySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const errorsByCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const recentErrors = errors
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
      .slice(0, 10);

    return {
      totalErrors: errors.length,
      errorsBySeverity,
      errorsByCategory,
      recentErrors
    };
  }

  /**
   * Clear error history (for development/testing)
   */
  public clearErrors(): void {
    this.errors.clear();
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('app_errors');
    }
  }
}

// Export singleton instance and utility functions
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleApiError = (error: Error, feature: string, userId?: string): void => {
  errorHandler.handleError(
    error,
    'external_api',
    { feature, userId },
    { apiError: true }
  );
};

export const handleDatabaseError = (error: Error, operation: string, userId?: string): void => {
  errorHandler.handleError(
    error,
    'database',
    { feature: operation, userId },
    { databaseOperation: operation }
  );
};

export const handleCrisisSystemError = (error: Error, feature: string, userId?: string): void => {
  errorHandler.handleError(
    error,
    'crisis_system',
    { feature, userId },
    { crisisRelated: true }
  );
};

export const handleValidationError = (message: string, field: string, userId?: string): void => {
  errorHandler.handleError(
    message,
    'data_validation',
    { feature: 'validation', userId },
    { validationField: field }
  );
};

export const handleSecurityError = (error: Error, context: string, userId?: string): void => {
  errorHandler.handleError(
    error,
    'security',
    { feature: 'security', userId },
    { securityContext: context }
  );
};

// Error boundary helper for React components
export const createErrorBoundaryHandler = (componentName: string) => {
  return (error: Error, errorInfo?: any) => {
    errorHandler.handleError(
      error,
      'user_experience',
      { feature: componentName },
      {
        componentStack: errorInfo?.componentStack,
        errorBoundary: true
      }
    );
  };
};

export default ErrorHandler;
