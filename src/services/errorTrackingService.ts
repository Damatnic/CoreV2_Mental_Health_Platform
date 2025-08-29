/**
 * Error Tracking Service
 * Provides centralized error handling and reporting for the mental health platform
 */

import { logger } from '../utils/logger';

// Sentry-like interface for error tracking
export interface ErrorTrackingService {
  captureException(error: Error, context?: ErrorContext): void;
  captureMessage(message: string, level?: LogLevel, context?: ErrorContext): void;
  setUserContext(user: UserContext): void;
  clearUserContext(): void;
  addBreadcrumb(message: string, category?: string, level?: string, data?: any): void;
}

// Error classification for mental health context
export interface ErrorContext {
  errorType: "system" | "user-action" | "network" | "security" | "crisis";
  severity: "low" | "medium" | "high" | "critical";
  userType?: "seeker" | "helper" | "admin";
  feature?: string;
  privacyLevel?: "public" | "sensitive" | "confidential";
  sessionId?: string;
  userId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface UserContext {
  id: string;
  email?: string;
  username?: string;
  userType?: "seeker" | "helper" | "admin";
  subscriptionTier?: string;
}

export type LogLevel = "debug" | "info" | "warning" | "error" | "fatal";

// Breadcrumb for tracking user actions leading to errors
export interface Breadcrumb {
  message: string;
  category: string;
  level: string;
  timestamp: string;
  data?: any;
}

class ErrorTrackingServiceImpl implements ErrorTrackingService {
  private userContext: UserContext | null = null;
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private isInitialized = false;

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    // Initialize error tracking service
    // In a real implementation, this would initialize Sentry or similar service
    this.isInitialized = true;
    logger.info("Error tracking service initialized", undefined, "ErrorTrackingService");
  }

  captureException(error: Error, context?: ErrorContext): void {
    if (!this.isInitialized) {
      console.error("Error tracking service not initialized");
      return;
    }

    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: context || {},
      userContext: this.userContext,
      breadcrumbs: [...this.breadcrumbs],
      timestamp: new Date().toISOString()
    };

    // Log the error
    logger.error("Exception captured", errorData, "ErrorTrackingService");

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService('exception', errorData);
    }

    // Handle crisis-related errors with higher priority
    if (context?.errorType === 'crisis') {
      this.handleCrisisError(error, context);
    }
  }

  captureMessage(message: string, level: LogLevel = "info", context?: ErrorContext): void {
    if (!this.isInitialized) {
      console.error("Error tracking service not initialized");
      return;
    }

    const messageData = {
      message,
      level,
      context: context || {},
      userContext: this.userContext,
      breadcrumbs: [...this.breadcrumbs],
      timestamp: new Date().toISOString()
    };

    // Log the message
    logger[level === 'warning' ? 'warn' : level === 'fatal' ? 'error' : level](
      message, 
      messageData, 
      "ErrorTrackingService"
    );

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService('message', messageData);
    }
  }

  setUserContext(user: UserContext): void {
    this.userContext = user;
    logger.info("User context set", { userId: user.id }, "ErrorTrackingService");
  }

  clearUserContext(): void {
    this.userContext = null;
    logger.info("User context cleared", undefined, "ErrorTrackingService");
  }

  addBreadcrumb(message: string, category = "default", level = "info", data?: any): void {
    const breadcrumb: Breadcrumb = {
      message,
      category,
      level,
      timestamp: new Date().toISOString(),
      data
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep breadcrumbs within limit
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  private handleCrisisError(error: Error, context: ErrorContext): void {
    // Special handling for crisis-related errors
    logger.error("Crisis-related error detected", {
      error: error.message,
      severity: context.severity,
      userType: context.userType,
      feature: context.feature
    }, "CrisisErrorHandler");

    // In a real implementation, this might:
    // - Send immediate alerts to crisis response team
    // - Log to special crisis monitoring system
    // - Trigger failover mechanisms for critical features
  }

  private sendToExternalService(type: 'exception' | 'message', data: any): void {
    // In production, this would send data to external error tracking service
    // For now, we'll just log it
    logger.info(`Sending ${type} to external service`, data, "ErrorTrackingService");
  }

  // Utility method to get current breadcrumbs
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  // Utility method to clear breadcrumbs
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}

// Export singleton instance
export const errorTrackingService = new ErrorTrackingServiceImpl();

// Convenience functions for common error tracking operations
export const captureException = (error: Error, context?: ErrorContext) => {
  errorTrackingService.captureException(error, context);
};

export const captureMessage = (message: string, level?: LogLevel, context?: ErrorContext) => {
  errorTrackingService.captureMessage(message, level, context);
};

export const setUserContext = (user: UserContext) => {
  errorTrackingService.setUserContext(user);
};

export const clearUserContext = () => {
  errorTrackingService.clearUserContext();
};

export const addBreadcrumb = (message: string, category?: string, level?: string, data?: any) => {
  errorTrackingService.addBreadcrumb(message, category, level, data);
};

// Initialize Sentry-like service (stub implementation)
export const initializeSentry = () => {
  // This would initialize the actual Sentry SDK in production
  logger.info("Sentry initialization (stub)", undefined, "ErrorTrackingService");
  return errorTrackingService;
};

// Export the main service as default
export default errorTrackingService;

// Re-export the service instance for compatibility
export { errorTrackingService as ErrorTrackingService };