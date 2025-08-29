/**
 * Error Tracking Service
 *
 * Comprehensive error tracking and monitoring system for mental health platform.
 * Provides error capture, categorization, privacy-compliant logging, and
 * automated incident response with HIPAA-compliant error handling.
 *
 * @fileoverview Privacy-compliant error tracking with automated incident response
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
  | 'crisis-system'
  | 'data-validation'
  | 'external-service'
  | 'unknown';

export type ErrorContext = 
  | 'crisis-intervention'
  | 'user-session'
  | 'data-sync'
  | 'offline-mode'
  | 'assessment'
  | 'therapy-session'
  | 'peer-support'
  | 'safety-plan'
  | 'general';

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  userId?: string; // Anonymized/hashed
  sessionId: string;
  userAgent: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  filename?: string;
  metadata: Record<string, any>;
  resolved: boolean;
  reportedToUser: boolean;
  sanitized: boolean;
}

export interface ErrorPattern {
  pattern: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  frequency: number;
  lastSeen: Date;
  autoResolution?: string;
  escalationRequired: boolean;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByContext: Record<ErrorContext, number>;
  errorRate: number;
  crashRate: number;
  userAffectedCount: number;
  averageResolutionTime: number;
  topErrors: ErrorSummary[];
  trends: ErrorTrend[];
}

export interface ErrorSummary {
  pattern: string;
  count: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  firstSeen: Date;
  lastSeen: Date;
  affectedUsers: number;
}

export interface ErrorTrend {
  date: string;
  count: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
}

export interface IncidentResponse {
  id: string;
  errorId: string;
  severity: ErrorSeverity;
  action: 'log' | 'notify' | 'escalate' | 'auto-resolve';
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

class ErrorTrackingService {
  private errors: Map<string, ErrorEvent> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private incidents: Map<string, IncidentResponse> = new Map();
  private errorQueue: ErrorEvent[] = [];
  private isInitialized = false;
  private sessionId: string = '';
  private readonly MAX_ERRORS_STORED = 1000;
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly BATCH_UPLOAD_INTERVAL = 30000; // 30 seconds

  // Privacy-compliant PII patterns to sanitize
  private readonly PII_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone
    /\b\d{16}\b/g, // Credit card
    /\b[A-Z]{2}\d{9}\b/g, // License
    /password[=:]\s*[^\s]+/gi, // Passwords
    /token[=:]\s*[^\s]+/gi, // Tokens
  ];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Load stored errors and patterns
      await this.loadStoredData();
      
      // Start batch upload timer
      this.startBatchUpload();
      
      this.isInitialized = true;
      logger.info('ErrorTrackingService initialized');
    } catch (error) {
      logger.error('Failed to initialize ErrorTrackingService:', error);
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        category: 'ui',
        context: 'general',
        severity: 'medium',
        metadata: {
          filename: event.filename,
          lineNumber: event.lineno,
          columnNumber: event.colno,
          type: 'javascript-error'
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          category: 'unknown',
          context: 'general',
          severity: 'medium',
          metadata: {
            type: 'unhandled-promise-rejection'
          }
        }
      );
    });

    // Handle console errors (for development)
    if (process.env.NODE_ENV === 'development') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        this.captureError(new Error(args.join(' ')), {
          category: 'unknown',
          context: 'general',
          severity: 'low',
          metadata: {
            type: 'console-error',
            args: args.map(arg => String(arg))
          }
        });
        originalConsoleError.apply(console, args);
      };
    }
  }

  public captureError(
    error: Error,
    options: {
      category?: ErrorCategory;
      context?: ErrorContext;
      severity?: ErrorSeverity;
      userId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): string {
    try {
      const errorEvent = this.createErrorEvent(error, options);
      
      // Sanitize PII
      this.sanitizeErrorEvent(errorEvent);
      
      // Store error
      this.errors.set(errorEvent.id, errorEvent);
      
      // Add to upload queue
      this.errorQueue.push(errorEvent);
      
      // Update patterns
      this.updateErrorPatterns(errorEvent);
      
      // Trigger incident response
      this.handleIncidentResponse(errorEvent);
      
      // Manage storage limits
      this.enforceStorageLimits();
      
      logger.debug(`Error captured: ${errorEvent.id}`, {
        category: errorEvent.category,
        severity: errorEvent.severity
      });
      
      return errorEvent.id;
    } catch (captureError) {
      logger.error('Failed to capture error:', captureError);
      return '';
    }
  }

  private createErrorEvent(
    error: Error,
    options: {
      category?: ErrorCategory;
      context?: ErrorContext;
      severity?: ErrorSeverity;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): ErrorEvent {
    const id = this.generateErrorId();
    const timestamp = new Date();
    
    // Determine category based on error message/stack if not provided
    const category = options.category || this.categorizeError(error);
    
    // Determine severity based on category and context
    const severity = options.severity || this.determineSeverity(error, category, options.context);
    
    return {
      id,
      timestamp,
      message: error.message,
      stack: error.stack,
      severity,
      category,
      context: options.context || 'general',
      userId: options.userId ? this.hashUserId(options.userId) : undefined,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      lineNumber: this.extractLineNumber(error.stack),
      columnNumber: this.extractColumnNumber(error.stack),
      filename: this.extractFilename(error.stack),
      metadata: {
        timestamp: timestamp.toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        ...options.metadata
      },
      resolved: false,
      reportedToUser: false,
      sanitized: false
    };
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = (error.stack || '').toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authorization';
    }
    
    if (message.includes('login') || message.includes('auth')) {
      return 'authentication';
    }
    
    if (message.includes('storage') || message.includes('quota')) {
      return 'storage';
    }
    
    if (message.includes('crisis') || stack.includes('crisis')) {
      return 'crisis-system';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'data-validation';
    }
    
    if (message.includes('performance') || message.includes('timeout')) {
      return 'performance';
    }
    
    if (stack.includes('react') || stack.includes('component')) {
      return 'ui';
    }
    
    return 'unknown';
  }

  private determineSeverity(
    error: Error,
    category: ErrorCategory,
    context?: ErrorContext
  ): ErrorSeverity {
    // Crisis-related errors are always high severity
    if (category === 'crisis-system' || context === 'crisis-intervention') {
      return 'critical';
    }
    
    // Security and authentication errors are high severity
    if (category === 'security' || category === 'authentication') {
      return 'high';
    }
    
    // Network and storage errors depend on context
    if (category === 'network' || category === 'storage') {
      return context === 'offline-mode' ? 'medium' : 'high';
    }
    
    // UI errors are usually low to medium
    if (category === 'ui') {
      return 'low';
    }
    
    // Performance issues are medium
    if (category === 'performance') {
      return 'medium';
    }
    
    // Default to medium for unknown errors
    return 'medium';
  }

  private sanitizeErrorEvent(errorEvent: ErrorEvent): void {
    // Sanitize message
    errorEvent.message = this.sanitizeString(errorEvent.message);
    
    // Sanitize stack trace
    if (errorEvent.stack) {
      errorEvent.stack = this.sanitizeString(errorEvent.stack);
    }
    
    // Sanitize metadata
    errorEvent.metadata = this.sanitizeObject(errorEvent.metadata);
    
    // Mark as sanitized
    errorEvent.sanitized = true;
  }

  private sanitizeString(input: string): string {
    let sanitized = input;
    
    this.PII_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    return sanitized;
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? this.sanitizeString(obj) : obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive keys entirely
      if (['password', 'token', 'secret', 'key', 'ssn'].some(sensitive => 
        key.toLowerCase().includes(sensitive)
      )) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeObject(value);
      }
    }
    
    return sanitized;
  }

  private updateErrorPatterns(errorEvent: ErrorEvent): void {
    const patternKey = this.generatePatternKey(errorEvent);
    
    const existing = this.patterns.get(patternKey);
    if (existing) {
      existing.frequency++;
      existing.lastSeen = errorEvent.timestamp;
      
      // Update escalation requirement based on frequency
      if (existing.frequency > 10 && existing.severity === 'high') {
        existing.escalationRequired = true;
      }
    } else {
      this.patterns.set(patternKey, {
        pattern: patternKey,
        category: errorEvent.category,
        severity: errorEvent.severity,
        frequency: 1,
        lastSeen: errorEvent.timestamp,
        escalationRequired: errorEvent.severity === 'critical'
      });
    }
  }

  private generatePatternKey(errorEvent: ErrorEvent): string {
    // Create a pattern key based on error characteristics
    const messageHash = this.simpleHash(errorEvent.message);
    const locationHash = errorEvent.filename ? 
      this.simpleHash(`${errorEvent.filename}:${errorEvent.lineNumber}`) : 'unknown';
    
    return `${errorEvent.category}-${messageHash}-${locationHash}`;
  }

  private handleIncidentResponse(errorEvent: ErrorEvent): void {
    const incident: IncidentResponse = {
      id: this.generateIncidentId(),
      errorId: errorEvent.id,
      severity: errorEvent.severity,
      action: this.determineResponseAction(errorEvent),
      timestamp: new Date(),
      resolved: false
    };
    
    this.incidents.set(incident.id, incident);
    
    // Execute the response action
    this.executeIncidentResponse(incident, errorEvent);
  }

  private determineResponseAction(errorEvent: ErrorEvent): IncidentResponse['action'] {
    // Critical errors require immediate escalation
    if (errorEvent.severity === 'critical') {
      return 'escalate';
    }
    
    // High severity errors should notify
    if (errorEvent.severity === 'high') {
      return 'notify';
    }
    
    // Check if this is a known pattern with auto-resolution
    const patternKey = this.generatePatternKey(errorEvent);
    const pattern = this.patterns.get(patternKey);
    
    if (pattern && pattern.autoResolution) {
      return 'auto-resolve';
    }
    
    // Default to logging
    return 'log';
  }

  private executeIncidentResponse(incident: IncidentResponse, errorEvent: ErrorEvent): void {
    switch (incident.action) {
      case 'escalate':
        this.escalateError(errorEvent);
        break;
        
      case 'notify':
        this.notifyError(errorEvent);
        break;
        
      case 'auto-resolve':
        this.autoResolveError(errorEvent);
        break;
        
      case 'log':
      default:
        logger.error(`Error logged: ${errorEvent.message}`, {
          id: errorEvent.id,
          category: errorEvent.category,
          severity: errorEvent.severity
        });
        break;
    }
  }

  private escalateError(errorEvent: ErrorEvent): void {
    // In a real implementation, this would trigger alerts to on-call engineers
    logger.error(`CRITICAL ERROR ESCALATED: ${errorEvent.message}`, {
      id: errorEvent.id,
      category: errorEvent.category,
      context: errorEvent.context,
      userId: errorEvent.userId,
      timestamp: errorEvent.timestamp
    });
    
    // Mark as reported to user for critical errors
    errorEvent.reportedToUser = true;
  }

  private notifyError(errorEvent: ErrorEvent): void {
    // Send notification to monitoring system
    logger.warn(`High severity error detected: ${errorEvent.message}`, {
      id: errorEvent.id,
      category: errorEvent.category,
      frequency: this.patterns.get(this.generatePatternKey(errorEvent))?.frequency || 1
    });
  }

  private autoResolveError(errorEvent: ErrorEvent): void {
    const patternKey = this.generatePatternKey(errorEvent);
    const pattern = this.patterns.get(patternKey);
    
    if (pattern && pattern.autoResolution) {
      logger.info(`Auto-resolving error: ${errorEvent.message}`, {
        resolution: pattern.autoResolution
      });
      
      errorEvent.resolved = true;
      
      const incident = Array.from(this.incidents.values())
        .find(i => i.errorId === errorEvent.id);
      
      if (incident) {
        incident.resolved = true;
        incident.resolution = pattern.autoResolution;
      }
    }
  }

  private startBatchUpload(): void {
    setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.uploadErrorBatch();
      }
    }, this.BATCH_UPLOAD_INTERVAL);
  }

  private async uploadErrorBatch(): Promise<void> {
    if (this.errorQueue.length === 0) return;
    
    const batch = this.errorQueue.splice(0, this.MAX_QUEUE_SIZE);
    
    try {
      // In a real implementation, this would send to error tracking service
      logger.debug(`Uploading error batch: ${batch.length} errors`);
      
      // For now, just store locally
      await this.storeErrorsLocally(batch);
    } catch (error) {
      logger.error('Failed to upload error batch:', error);
      
      // Put errors back in queue for retry
      this.errorQueue.unshift(...batch);
    }
  }

  private async storeErrorsLocally(errors: ErrorEvent[]): Promise<void> {
    try {
      const key = `error-batch-${Date.now()}`;
      await secureStorage.setItem(key, JSON.stringify(errors));
    } catch (error) {
      logger.error('Failed to store errors locally:', error);
    }
  }

  private enforceStorageLimits(): void {
    if (this.errors.size > this.MAX_ERRORS_STORED) {
      // Remove oldest errors
      const sortedErrors = Array.from(this.errors.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const toRemove = sortedErrors.slice(0, sortedErrors.length - this.MAX_ERRORS_STORED);
      toRemove.forEach(([id]) => {
        this.errors.delete(id);
      });
    }
  }

  public getErrorMetrics(): ErrorMetrics {
    const errors = Array.from(this.errors.values());
    
    const totalErrors = errors.length;
    const errorsByCategory = this.groupBy(errors, 'category');
    const errorsBySeverity = this.groupBy(errors, 'severity');
    const errorsByContext = this.groupBy(errors, 'context');
    
    const uniqueUsers = new Set(
      errors.map(e => e.userId).filter(Boolean)
    ).size;
    
    const topErrors = this.getTopErrorPatterns();
    const trends = this.getErrorTrends();
    
    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      errorsByContext,
      errorRate: this.calculateErrorRate(),
      crashRate: this.calculateCrashRate(),
      userAffectedCount: uniqueUsers,
      averageResolutionTime: this.calculateAverageResolutionTime(),
      topErrors,
      trends
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const group = String(item[key]);
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopErrorPatterns(): ErrorSummary[] {
    return Array.from(this.patterns.entries())
      .map(([pattern, data]) => {
        const relatedErrors = Array.from(this.errors.values())
          .filter(error => this.generatePatternKey(error) === pattern);
        
        const uniqueUsers = new Set(
          relatedErrors.map(e => e.userId).filter(Boolean)
        ).size;
        
        return {
          pattern,
          count: data.frequency,
          category: data.category,
          severity: data.severity,
          firstSeen: relatedErrors[0]?.timestamp || data.lastSeen,
          lastSeen: data.lastSeen,
          affectedUsers: uniqueUsers
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getErrorTrends(): ErrorTrend[] {
    const now = new Date();
    const trends: ErrorTrend[] = [];
    
    // Get last 7 days of error trends
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayErrors = Array.from(this.errors.values())
        .filter(error => error.timestamp.toISOString().split('T')[0] === dateStr);
      
      const severityGroups = this.groupBy(dayErrors, 'severity');
      const categoryGroups = this.groupBy(dayErrors, 'category');
      
      Object.entries(severityGroups).forEach(([severity, count]) => {
        trends.push({
          date: dateStr,
          count,
          severity: severity as ErrorSeverity,
          category: 'unknown' // Simplified for this example
        });
      });
    }
    
    return trends;
  }

  private calculateErrorRate(): number {
    // Simplified error rate calculation
    const recentErrors = Array.from(this.errors.values())
      .filter(error => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return error.timestamp > hourAgo;
      });
    
    return recentErrors.length;
  }

  private calculateCrashRate(): number {
    const criticalErrors = Array.from(this.errors.values())
      .filter(error => error.severity === 'critical');
    
    return criticalErrors.length / Math.max(this.errors.size, 1);
  }

  private calculateAverageResolutionTime(): number {
    const resolvedIncidents = Array.from(this.incidents.values())
      .filter(incident => incident.resolved);
    
    if (resolvedIncidents.length === 0) return 0;
    
    const totalTime = resolvedIncidents.reduce((sum, incident) => {
      // Simplified calculation - in reality would track actual resolution time
      return sum + (Date.now() - incident.timestamp.getTime());
    }, 0);
    
    return totalTime / resolvedIncidents.length;
  }

  private async loadStoredData(): Promise<void> {
    try {
      // Load error patterns
      const patternsData = await secureStorage.getItem('error-patterns');
      if (patternsData) {
        const patterns: [string, ErrorPattern][] = JSON.parse(patternsData);
        patterns.forEach(([key, pattern]) => {
          pattern.lastSeen = new Date(pattern.lastSeen);
          this.patterns.set(key, pattern);
        });
      }
    } catch (error) {
      logger.debug('No stored error data found');
    }
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateIncidentId(): string {
    return `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashUserId(userId: string): string {
    // Simple hash for user ID anonymization
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user-${Math.abs(hash).toString(36)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private extractLineNumber(stack?: string): number | undefined {
    if (!stack) return undefined;
    const match = stack.match(/:(\d+):\d+/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private extractColumnNumber(stack?: string): number | undefined {
    if (!stack) return undefined;
    const match = stack.match(/:(\d+):(\d+)/);
    return match ? parseInt(match[2], 10) : undefined;
  }

  private extractFilename(stack?: string): string | undefined {
    if (!stack) return undefined;
    const match = stack.match(/at .* \((.+?):\d+:\d+\)/);
    return match ? match[1].split('/').pop() : undefined;
  }

  public async clearErrors(): Promise<void> {
    this.errors.clear();
    this.patterns.clear();
    this.incidents.clear();
    this.errorQueue.length = 0;
    
    try {
      await secureStorage.removeItem('error-patterns');
      logger.info('Error tracking data cleared');
    } catch (error) {
      logger.error('Failed to clear stored error data:', error);
    }
  }
}

export const errorTracking = new ErrorTrackingService();
export default errorTracking;
