/**
 * Error Handling Service
 *
 * Comprehensive error handling system for mental health platform with
 * HIPAA-compliant error tracking, user-friendly messaging, and automatic
 * recovery strategies for critical mental health workflows.
 *
 * @fileoverview HIPAA-compliant error handling with automatic recovery
 * @version 2.0.0
 */

import { logger } from '../utils/logger';
import { secureStorage } from './secureStorageService';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 
  | 'authentication'
  | 'authorization'
  | 'network'
  | 'storage'
  | 'ui'
  | 'performance'
  | 'security'
  | 'crisis'
  | 'data-validation'
  | 'external-service'
  | 'system'
  | 'user-input'
  | 'unknown';

export type RecoveryAction = 'retry' | 'redirect' | 'reload' | 'logout' | 'fallback' | 'none';

export interface ErrorDetails {
  id: string;
  timestamp: Date;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  technicalDetails?: string;
  stack?: string;
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  context: Record<string, any>;
  recoveryAction: RecoveryAction;
  retryCount: number;
  resolved: boolean;
  reportedToUser: boolean;
}

export interface ErrorRecoveryStrategy {
  category: ErrorCategory;
  severity: ErrorSeverity;
  action: RecoveryAction;
  maxRetries: number;
  retryDelay: number;
  userMessage: string;
  fallbackUrl?: string;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  errors: ErrorDetails[];
  systemInfo: {
    userAgent: string;
    url: string;
    timestamp: Date;
    userId?: string;
    sessionDuration: number;
  };
  resolved: boolean;
}

export interface ErrorHandlingConfig {
  enableSentry: boolean;
  enableLocalStorage: boolean;
  enableUserNotifications: boolean;
  enableAutoRecovery: boolean;
  maxErrorsInMemory: number;
  maxRetryAttempts: number;
  sentryDsn?: string;
  isDevelopment: boolean;
}

class ErrorHandlingService {
  private errorQueue: ErrorDetails[] = [];
  private errorReports: Map<string, ErrorReport> = new Map();
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();
  private config: ErrorHandlingConfig;
  private sessionId: string = '';
  private sessionStartTime: Date = new Date();
  private eventListeners: ((error: ErrorDetails) => void)[] = [];

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = {
      enableSentry: false, // Disabled for HIPAA compliance
      enableLocalStorage: true,
      enableUserNotifications: true,
      enableAutoRecovery: true,
      maxErrorsInMemory: 100,
      maxRetryAttempts: 3,
      isDevelopment: process.env.NODE_ENV === 'development',
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initializeRecoveryStrategies();
    this.setupGlobalErrorHandlers();
    this.loadStoredErrors();
  }

  private initializeRecoveryStrategies(): void {
    const strategies: ErrorRecoveryStrategy[] = [
      // Authentication Errors
      {
        category: 'authentication',
        severity: 'high',
        action: 'logout',
        maxRetries: 0,
        retryDelay: 0,
        userMessage: 'Your session has expired. Please log in again.',
        fallbackUrl: '/login'
      },
      {
        category: 'authorization',
        severity: 'medium',
        action: 'redirect',
        maxRetries: 0,
        retryDelay: 0,
        userMessage: 'You do not have permission to access this resource.',
        fallbackUrl: '/dashboard'
      },

      // Network Errors
      {
        category: 'network',
        severity: 'medium',
        action: 'retry',
        maxRetries: 3,
        retryDelay: 2000,
        userMessage: 'Connection issue detected. Retrying automatically...'
      },
      {
        category: 'network',
        severity: 'high',
        action: 'fallback',
        maxRetries: 1,
        retryDelay: 1000,
        userMessage: 'Unable to connect. Switching to offline mode.'
      },

      // Crisis System Errors (Highest Priority)
      {
        category: 'crisis',
        severity: 'critical',
        action: 'retry',
        maxRetries: 5,
        retryDelay: 500,
        userMessage: 'Crisis system temporarily unavailable. Retrying immediately...'
      },
      {
        category: 'crisis',
        severity: 'high',
        action: 'fallback',
        maxRetries: 2,
        retryDelay: 1000,
        userMessage: 'Accessing backup crisis resources...',
        fallbackUrl: '/crisis-offline'
      },

      // Storage Errors
      {
        category: 'storage',
        severity: 'medium',
        action: 'retry',
        maxRetries: 2,
        retryDelay: 1000,
        userMessage: 'Data save failed. Retrying...'
      },
      {
        category: 'storage',
        severity: 'high',
        action: 'fallback',
        maxRetries: 1,
        retryDelay: 500,
        userMessage: 'Storage issue detected. Using temporary storage.'
      },

      // UI Errors
      {
        category: 'ui',
        severity: 'low',
        action: 'reload',
        maxRetries: 1,
        retryDelay: 0,
        userMessage: 'Interface error. Refreshing component...'
      },
      {
        category: 'ui',
        severity: 'medium',
        action: 'fallback',
        maxRetries: 0,
        retryDelay: 0,
        userMessage: 'Display issue detected. Using simplified interface.'
      },

      // System Errors
      {
        category: 'system',
        severity: 'critical',
        action: 'reload',
        maxRetries: 0,
        retryDelay: 0,
        userMessage: 'Critical system error. Reloading application...'
      },

      // Default Strategy
      {
        category: 'unknown',
        severity: 'medium',
        action: 'retry',
        maxRetries: 1,
        retryDelay: 1000,
        userMessage: 'An unexpected error occurred. Please try again.'
      }
    ];

    strategies.forEach(strategy => {
      const key = `${strategy.category}-${strategy.severity}`;
      this.recoveryStrategies.set(key, strategy);
    });
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        category: 'system',
        severity: 'high',
        context: {
          filename: event.filename,
          lineNumber: event.lineno,
          columnNumber: event.colno,
          type: 'javascript-error'
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          category: 'system',
          severity: 'high',
          context: {
            type: 'unhandled-promise-rejection'
          }
        }
      );
    });

    // Handle authentication errors
    window.addEventListener('auth-error', ((event: CustomEvent) => {
      this.handleError(new Error('Authentication error occurred'), {
        category: 'authentication',
        severity: 'high',
        context: event.detail || {}
      });
    }) as EventListener);

    // Handle network errors
    window.addEventListener('online', () => {
      this.handleNetworkStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleNetworkStatusChange(false);
    });
  }

  public handleError(
    error: Error | string,
    options: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      userId?: string;
      userMessage?: string;
    } = {}
  ): string {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const errorDetails: ErrorDetails = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message: errorObj.message,
      category: options.category || this.categorizeError(errorObj),
      severity: options.severity || this.determineSeverity(errorObj, options.category),
      userMessage: options.userMessage || this.generateUserMessage(errorObj, options.category),
      technicalDetails: this.sanitizeTechnicalDetails(errorObj.stack),
      stack: errorObj.stack,
      userId: options.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      context: this.sanitizeContext(options.context || {}),
      recoveryAction: 'none',
      retryCount: 0,
      resolved: false,
      reportedToUser: false
    };

    // Add to error queue
    this.errorQueue.push(errorDetails);
    this.enforceMemoryLimits();

    // Log error (sanitized for HIPAA compliance)
    this.logError(errorDetails);

    // Store error locally if enabled
    if (this.config.enableLocalStorage) {
      this.storeError(errorDetails);
    }

    // Attempt automatic recovery
    if (this.config.enableAutoRecovery) {
      this.attemptRecovery(errorDetails);
    }

    // Notify listeners
    this.notifyListeners(errorDetails);

    // Show user notification if enabled
    if (this.config.enableUserNotifications && !errorDetails.reportedToUser) {
      this.showUserNotification(errorDetails);
      errorDetails.reportedToUser = true;
    }

    return errorDetails.id;
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = (error.stack || '').toLowerCase();

    // Crisis system errors (highest priority)
    if (message.includes('crisis') || message.includes('emergency') || message.includes('safety')) {
      return 'crisis';
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('token') || message.includes('login')) {
      return 'authentication';
    }

    // Authorization errors
    if (message.includes('forbidden') || message.includes('permission') || message.includes('access denied')) {
      return 'authorization';
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }

    // Storage errors
    if (message.includes('storage') || message.includes('quota') || message.includes('disk')) {
      return 'storage';
    }

    // Security errors
    if (message.includes('security') || message.includes('csp') || message.includes('cors')) {
      return 'security';
    }

    // Performance errors
    if (message.includes('timeout') || message.includes('performance') || message.includes('memory')) {
      return 'performance';
    }

    // UI errors
    if (stack.includes('react') || stack.includes('component') || message.includes('render')) {
      return 'ui';
    }

    // Data validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('format')) {
      return 'data-validation';
    }

    return 'unknown';
  }

  private determineSeverity(error: Error, category?: ErrorCategory): ErrorSeverity {
    const message = error.message.toLowerCase();

    // Crisis-related errors are always critical
    if (category === 'crisis') {
      return 'critical';
    }

    // System crashes and security issues
    if (message.includes('crash') || message.includes('fatal') || category === 'security') {
      return 'critical';
    }

    // Authentication and authorization issues
    if (category === 'authentication' || category === 'authorization') {
      return 'high';
    }

    // Network issues depend on context
    if (category === 'network') {
      return message.includes('timeout') ? 'high' : 'medium';
    }

    // Storage issues are generally medium
    if (category === 'storage') {
      return 'medium';
    }

    // UI errors are usually low to medium
    if (category === 'ui') {
      return message.includes('render') ? 'medium' : 'low';
    }

    // Performance issues
    if (category === 'performance') {
      return 'medium';
    }

    // Default to medium for unknown errors
    return 'medium';
  }

  private generateUserMessage(error: Error, category?: ErrorCategory): string {
    switch (category) {
      case 'crisis':
        return 'Crisis support system is temporarily unavailable. Emergency resources are being activated.';
      case 'authentication':
        return 'Please log in again to continue.';
      case 'authorization':
        return 'You do not have permission to access this feature.';
      case 'network':
        return 'Connection issue detected. Please check your internet connection.';
      case 'storage':
        return 'Unable to save your data. Please try again.';
      case 'ui':
        return 'Interface error occurred. Refreshing the display.';
      case 'performance':
        return 'The application is running slowly. Optimizing performance.';
      case 'security':
        return 'Security check failed. Please refresh and try again.';
      case 'data-validation':
        return 'Please check your input and try again.';
      default:
        return 'An unexpected error occurred. Our team has been notified.';
    }
  }

  private sanitizeTechnicalDetails(stack?: string): string {
    if (!stack) return '';

    // Remove potentially sensitive information
    return stack
      .replace(/\/Users\/[^\/]+/g, '/Users/[user]')
      .replace(/\/home\/[^\/]+/g, '/home/[user]')
      .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[user]')
      .replace(/token[=:]\s*[^\s]+/gi, 'token=[REDACTED]')
      .replace(/password[=:]\s*[^\s]+/gi, 'password=[REDACTED]')
      .replace(/email[=:]\s*[^\s]+/gi, 'email=[REDACTED]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN-REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL-REDACTED]');
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(context)) {
      // Skip sensitive keys
      if (['password', 'token', 'secret', 'key', 'ssn', 'email'].some(sensitive => 
        key.toLowerCase().includes(sensitive)
      )) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeTechnicalDetails(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private attemptRecovery(errorDetails: ErrorDetails): void {
    const strategyKey = `${errorDetails.category}-${errorDetails.severity}`;
    let strategy = this.recoveryStrategies.get(strategyKey);

    // Fallback to default strategy if specific one not found
    if (!strategy) {
      strategy = this.recoveryStrategies.get('unknown-medium');
    }

    if (!strategy) return;

    errorDetails.recoveryAction = strategy.action;

    // Check if we've exceeded retry attempts
    if (errorDetails.retryCount >= strategy.maxRetries) {
      this.executeRecoveryAction(strategy, errorDetails);
      return;
    }

    // Attempt retry with delay
    if (strategy.action === 'retry' && errorDetails.retryCount < strategy.maxRetries) {
      setTimeout(() => {
        errorDetails.retryCount++;
        this.executeRecoveryAction(strategy!, errorDetails);
      }, strategy.retryDelay);
    } else {
      this.executeRecoveryAction(strategy, errorDetails);
    }
  }

  private executeRecoveryAction(strategy: ErrorRecoveryStrategy, errorDetails: ErrorDetails): void {
    switch (strategy.action) {
      case 'retry':
        // Retry is handled by the calling code
        logger.info(`Retrying operation for error: ${errorDetails.id}`);
        break;

      case 'redirect':
        if (strategy.fallbackUrl) {
          window.location.href = strategy.fallbackUrl;
        }
        break;

      case 'reload':
        window.location.reload();
        break;

      case 'logout':
        this.performLogout();
        break;

      case 'fallback':
        this.activateFallbackMode(errorDetails);
        break;

      case 'none':
      default:
        // No automatic recovery action
        break;
    }
  }

  private performLogout(): void {
    try {
      // Clear authentication data
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user-data');
      sessionStorage.clear();
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      logger.error('Failed to perform logout:', error);
      // Force reload as fallback
      window.location.reload();
    }
  }

  private activateFallbackMode(errorDetails: ErrorDetails): void {
    // Implement fallback mode based on error category
    switch (errorDetails.category) {
      case 'crisis':
        // Activate offline crisis resources
        this.activateOfflineCrisisMode();
        break;

      case 'network':
        // Activate offline mode
        this.activateOfflineMode();
        break;

      case 'storage':
        // Use temporary storage
        this.activateTemporaryStorage();
        break;

      default:
        logger.info(`Fallback mode activated for category: ${errorDetails.category}`);
        break;
    }
  }

  private activateOfflineCrisisMode(): void {
    // Dispatch custom event for offline crisis mode
    window.dispatchEvent(new CustomEvent('activate-offline-crisis', {
      detail: { timestamp: new Date() }
    }));
  }

  private activateOfflineMode(): void {
    // Dispatch custom event for offline mode
    window.dispatchEvent(new CustomEvent('activate-offline-mode', {
      detail: { timestamp: new Date() }
    }));
  }

  private activateTemporaryStorage(): void {
    // Switch to sessionStorage or memory storage
    window.dispatchEvent(new CustomEvent('activate-temporary-storage', {
      detail: { timestamp: new Date() }
    }));
  }

  private handleNetworkStatusChange(isOnline: boolean): void {
    if (isOnline) {
      // Network restored - sync pending data
      this.handleNetworkRestoration();
    } else {
      // Network lost - activate offline mode
      this.handleNetworkLoss();
    }
  }

  private handleNetworkRestoration(): void {
    logger.info('Network connection restored');
    
    // Dispatch event for network restoration
    window.dispatchEvent(new CustomEvent('network-restored', {
      detail: { timestamp: new Date() }
    }));
  }

  private handleNetworkLoss(): void {
    logger.warn('Network connection lost');
    
    // Create network error
    this.handleError(new Error('Network connection lost'), {
      category: 'network',
      severity: 'high',
      context: { type: 'network-offline' }
    });
  }

  private showUserNotification(errorDetails: ErrorDetails): void {
    // Dispatch custom event for user notification
    window.dispatchEvent(new CustomEvent('show-error-notification', {
      detail: {
        id: errorDetails.id,
        message: errorDetails.userMessage,
        severity: errorDetails.severity,
        category: errorDetails.category,
        recoveryAction: errorDetails.recoveryAction
      }
    }));
  }

  private logError(errorDetails: ErrorDetails): void {
    const logLevel = this.getLogLevel(errorDetails.severity);
    const logMessage = `[${errorDetails.category.toUpperCase()}] ${errorDetails.message}`;
    const logContext = {
      id: errorDetails.id,
      category: errorDetails.category,
      severity: errorDetails.severity,
      url: errorDetails.url,
      userId: errorDetails.userId ? '[USER-ID-HASH]' : undefined,
      sessionId: errorDetails.sessionId,
      context: errorDetails.context
    };

    switch (logLevel) {
      case 'error':
        logger.error(logMessage, logContext);
        break;
      case 'warn':
        logger.warn(logMessage, logContext);
        break;
      case 'info':
        logger.info(logMessage, logContext);
        break;
      default:
        logger.debug(logMessage, logContext);
        break;
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' | 'debug' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'debug';
    }
  }

  private storeError(errorDetails: ErrorDetails): void {
    try {
      const stored = this.getStoredErrors();
      stored.push(errorDetails);
      
      // Keep only recent errors (last 50)
      const recentErrors = stored.slice(-50);
      
      secureStorage.setItem('error-queue', JSON.stringify(recentErrors));
    } catch (error) {
      logger.error('Failed to store error locally:', error);
    }
  }

  private getStoredErrors(): ErrorDetails[] {
    try {
      const stored = secureStorage.getItem('error-queue');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Failed to load stored errors:', error);
      return [];
    }
  }

  private loadStoredErrors(): void {
    const storedErrors = this.getStoredErrors();
    
    // Convert stored errors back to proper objects
    storedErrors.forEach(error => {
      error.timestamp = new Date(error.timestamp);
      this.errorQueue.push(error);
    });

    this.enforceMemoryLimits();
  }

  private enforceMemoryLimits(): void {
    if (this.errorQueue.length > this.config.maxErrorsInMemory) {
      // Remove oldest errors
      this.errorQueue = this.errorQueue.slice(-this.config.maxErrorsInMemory);
    }
  }

  private notifyListeners(errorDetails: ErrorDetails): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(errorDetails);
      } catch (error) {
        logger.error('Error in error handling listener:', error);
      }
    });
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public addEventListener(listener: (error: ErrorDetails) => void): void {
    this.eventListeners.push(listener);
  }

  public removeEventListener(listener: (error: ErrorDetails) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  public getErrorHistory(): ErrorDetails[] {
    return [...this.errorQueue];
  }

  public getErrorById(id: string): ErrorDetails | undefined {
    return this.errorQueue.find(error => error.id === id);
  }

  public markErrorResolved(id: string): boolean {
    const error = this.getErrorById(id);
    if (error) {
      error.resolved = true;
      this.storeError(error);
      return true;
    }
    return false;
  }

  public clearErrorHistory(): void {
    this.errorQueue = [];
    try {
      secureStorage.removeItem('error-queue');
    } catch (error) {
      logger.error('Failed to clear stored errors:', error);
    }
  }

  public getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    resolved: number;
    unresolved: number;
  } {
    const stats = {
      total: this.errorQueue.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      resolved: 0,
      unresolved: 0
    };

    this.errorQueue.forEach(error => {
      // Count by category
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      
      // Count resolved/unresolved
      if (error.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
    });

    return stats;
  }

  public testErrorHandling(): void {
    if (!this.config.isDevelopment) {
      logger.warn('Error testing is only available in development mode');
      return;
    }

    // Test different error types
    const testErrors = [
      { error: new Error('Test authentication error'), category: 'authentication' as ErrorCategory },
      { error: new Error('Test network error'), category: 'network' as ErrorCategory },
      { error: new Error('Test crisis system error'), category: 'crisis' as ErrorCategory },
      { error: new Error('Test UI error'), category: 'ui' as ErrorCategory }
    ];

    testErrors.forEach(({ error, category }) => {
      setTimeout(() => {
        this.handleError(error, { category, context: { test: true } });
      }, Math.random() * 1000);
    });

    logger.info('Error handling test initiated');
  }
}

// Create singleton instance
export const errorHandlingService = new ErrorHandlingService({
  isDevelopment: process.env.NODE_ENV === 'development',
  enableUserNotifications: true,
  enableAutoRecovery: true,
  enableLocalStorage: true
});

// Export for React hooks and components
export const useErrorHandler = () => {
  const handleError = React.useCallback((
    error: Error | string,
    options?: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      userMessage?: string;
    }
  ) => {
    return errorHandlingService.handleError(error, options);
  }, []);

  const getErrorHistory = React.useCallback(() => {
    return errorHandlingService.getErrorHistory();
  }, []);

  const getErrorStats = React.useCallback(() => {
    return errorHandlingService.getErrorStats();
  }, []);

  return {
    handleError,
    getErrorHistory,
    getErrorStats,
    markResolved: errorHandlingService.markErrorResolved.bind(errorHandlingService),
    clearHistory: errorHandlingService.clearErrorHistory.bind(errorHandlingService)
  };
};

export default errorHandlingService;
