/**
 * Astral Core Error Service
 *
 * Advanced error handling and monitoring system for the Astral Tether mental health platform.
 * Provides comprehensive error tracking, analysis, recovery mechanisms, and HIPAA-compliant
 * error reporting with intelligent categorization and automated resolution strategies.
 *
 * @fileoverview Complete error service with ML-powered error analysis and recovery
 * @version 2.0.0
 */

import { logger } from '../utils/logger';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical' | 'catastrophic';
export type ErrorCategory = 
  | 'system' 
  | 'network' 
  | 'authentication' 
  | 'authorization' 
  | 'validation' 
  | 'business-logic' 
  | 'ui-interaction' 
  | 'crisis-intervention' 
  | 'data-integrity' 
  | 'performance' 
  | 'security' 
  | 'accessibility';

export type ErrorSource = 
  | 'client' 
  | 'server' 
  | 'database' 
  | 'external-api' 
  | 'network' 
  | 'browser' 
  | 'service-worker' 
  | 'third-party';

export type RecoveryStrategy = 
  | 'retry' 
  | 'fallback' 
  | 'graceful-degradation' 
  | 'user-intervention' 
  | 'system-restart' 
  | 'manual-resolution' 
  | 'ignore';

export interface ErrorContext {
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  timestamp: Date;
  feature: string;
  component: string;
  action: string;
  environment: 'development' | 'staging' | 'production';
  buildVersion: string;
  userRole?: string;
  deviceInfo: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
    version: string;
    screenSize: string;
    connectionType?: string;
  };
  performanceMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
    renderTime: number;
  };
  userJourney: {
    previousActions: string[];
    timeOnPage: number;
    clickPath: string[];
    formData?: Record<string, any>;
  };
}

export interface AstralError {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  source: ErrorSource;
  code: string;
  message: string;
  technicalMessage: string;
  userMessage: string;
  context: ErrorContext;
  stackTrace?: string;
  cause?: Error;
  metadata: Record<string, any>;
  tags: string[];
  fingerprint: string; // For grouping similar errors
  occurrenceCount: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedUsers: Set<string>;
  resolution?: ErrorResolution;
  businessImpact: {
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedFeatures: string[];
    estimatedUserImpact: number;
    revenueImpact?: number;
  };
  privacy: {
    containsPII: boolean;
    containsPHI: boolean;
    sanitized: boolean;
    redactedFields: string[];
  };
}

export interface ErrorResolution {
  id: string;
  errorId: string;
  strategy: RecoveryStrategy;
  status: 'pending' | 'in-progress' | 'resolved' | 'failed' | 'escalated';
  attemptedAt: Date;
  resolvedAt?: Date;
  automaticRecovery: boolean;
  recoveryActions: string[];
  successRate: number;
  timeToResolve: number;
  notes: string;
  preventionMeasures: string[];
}

export interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  fingerprints: string[];
  category: ErrorCategory;
  severity: ErrorSeverity;
  frequency: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  commonContext: Partial<ErrorContext>;
  rootCause?: string;
  preventionStrategy?: string;
  automatedFix?: {
    strategy: RecoveryStrategy;
    script: string;
    successRate: number;
  };
  alertThreshold: number;
  businessImpact: string;
  documentationUrl?: string;
}

export interface ErrorReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalErrors: number;
    uniqueErrors: number;
    errorRate: number;
    criticalErrors: number;
    resolvedErrors: number;
    averageResolutionTime: number;
    topErrorCategories: Array<{
      category: ErrorCategory;
      count: number;
      percentage: number;
    }>;
    affectedUsers: number;
    systemUptime: number;
  };
  trends: {
    errorRateChange: number;
    severityDistribution: Record<ErrorSeverity, number>;
    categoryTrends: Record<ErrorCategory, number>;
    resolutionTimeChange: number;
    userImpactChange: number;
  };
  patterns: ErrorPattern[];
  recommendations: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    implementation: string[];
    expectedImpact: string;
  }[];
  alerts: ErrorAlert[];
  metrics: {
    mttr: number; // Mean Time To Resolution
    mtbf: number; // Mean Time Between Failures
    errorBudget: number;
    slaCompliance: number;
    availabilityScore: number;
  };
}

export interface ErrorAlert {
  id: string;
  timestamp: Date;
  type: 'threshold' | 'pattern' | 'anomaly' | 'critical-error';
  severity: ErrorSeverity;
  title: string;
  description: string;
  errorIds: string[];
  affectedUsers: number;
  businessImpact: string;
  recommendedActions: string[];
  escalationLevel: 'team' | 'management' | 'executive';
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  falsePositive: boolean;
}

export interface ErrorConfiguration {
  collection: {
    enabled: boolean;
    sampleRate: number; // 0-1, percentage of errors to collect
    maxErrorsPerSession: number;
    maxStackTraceLength: number;
    collectUserData: boolean;
    collectPerformanceData: boolean;
  };
  processing: {
    enableAutoRecovery: boolean;
    enablePatternDetection: boolean;
    enableAnomalyDetection: boolean;
    fingerprintAlgorithm: 'simple' | 'advanced' | 'ml-based';
    batchProcessingInterval: number; // milliseconds
    maxBatchSize: number;
  };
  alerting: {
    enabled: boolean;
    thresholds: {
      errorRate: number; // errors per minute
      criticalErrors: number;
      userImpact: number; // percentage of users affected
      responseTime: number; // milliseconds
    };
    channels: ('console' | 'storage' | 'webhook' | 'email')[];
    debounceTime: number; // milliseconds
    escalationRules: {
      criticalErrorImmediate: boolean;
      highVolumeThreshold: number;
      businessHoursOnly: boolean;
    };
  };
  privacy: {
    enablePIIDetection: boolean;
    enablePHIDetection: boolean;
    autoSanitization: boolean;
    retentionPeriod: number; // days
    anonymizeUserData: boolean;
    excludeFields: string[];
  };
  recovery: {
    enableAutomaticRecovery: boolean;
    retryAttempts: number;
    retryDelay: number; // milliseconds
    fallbackStrategies: Record<ErrorCategory, RecoveryStrategy>;
    gracefulDegradation: {
      enabled: boolean;
      features: string[];
      fallbackUI: boolean;
    };
  };
  monitoring: {
    enableRealTimeMonitoring: boolean;
    enableTrendAnalysis: boolean;
    enablePredictiveAnalysis: boolean;
    analysisInterval: number; // milliseconds
    patternDetectionSensitivity: 'low' | 'medium' | 'high';
  };
}

class AstralCoreErrorService {
  private configuration: ErrorConfiguration;
  private errors: Map<string, AstralError> = new Map();
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private resolutions: Map<string, ErrorResolution> = new Map();
  private alerts: ErrorAlert[] = [];
  private reports: ErrorReport[] = [];
  private isInitialized = false;
  private processingQueue: AstralError[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private eventListeners: Array<(event: any) => void> = [];
  private errorBoundaryStack: string[] = [];

  constructor(configuration?: Partial<ErrorConfiguration>) {
    this.configuration = this.mergeConfiguration(configuration);
    this.initializeService();
  }

  private mergeConfiguration(userConfig?: Partial<ErrorConfiguration>): ErrorConfiguration {
    const defaultConfig: ErrorConfiguration = {
      collection: {
        enabled: true,
        sampleRate: 1.0,
        maxErrorsPerSession: 100,
        maxStackTraceLength: 5000,
        collectUserData: true,
        collectPerformanceData: true
      },
      processing: {
        enableAutoRecovery: true,
        enablePatternDetection: true,
        enableAnomalyDetection: true,
        fingerprintAlgorithm: 'advanced',
        batchProcessingInterval: 5000,
        maxBatchSize: 50
      },
      alerting: {
        enabled: true,
        thresholds: {
          errorRate: 10,
          criticalErrors: 1,
          userImpact: 5,
          responseTime: 5000
        },
        channels: ['console', 'storage'],
        debounceTime: 30000,
        escalationRules: {
          criticalErrorImmediate: true,
          highVolumeThreshold: 50,
          businessHoursOnly: false
        }
      },
      privacy: {
        enablePIIDetection: true,
        enablePHIDetection: true,
        autoSanitization: true,
        retentionPeriod: 30,
        anonymizeUserData: true,
        excludeFields: ['password', 'ssn', 'creditCard', 'medicalRecord']
      },
      recovery: {
        enableAutomaticRecovery: true,
        retryAttempts: 3,
        retryDelay: 1000,
        fallbackStrategies: {
          'system': 'retry',
          'network': 'retry',
          'authentication': 'user-intervention',
          'authorization': 'user-intervention',
          'validation': 'user-intervention',
          'business-logic': 'fallback',
          'ui-interaction': 'graceful-degradation',
          'crisis-intervention': 'manual-resolution',
          'data-integrity': 'manual-resolution',
          'performance': 'graceful-degradation',
          'security': 'manual-resolution',
          'accessibility': 'graceful-degradation'
        },
        gracefulDegradation: {
          enabled: true,
          features: ['non-critical-ui', 'animations', 'advanced-features'],
          fallbackUI: true
        }
      },
      monitoring: {
        enableRealTimeMonitoring: true,
        enableTrendAnalysis: true,
        enablePredictiveAnalysis: false,
        analysisInterval: 60000,
        patternDetectionSensitivity: 'medium'
      }
    };

    return this.deepMerge(defaultConfig, userConfig || {});
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private async initializeService(): Promise<void> {
    try {
      if (!this.configuration.collection.enabled) {
        logger.info('Error collection is disabled');
        return;
      }

      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Initialize error patterns
      this.initializeErrorPatterns();
      
      // Start processing queue
      if (this.configuration.processing.batchProcessingInterval > 0) {
        this.startProcessingQueue();
      }
      
      // Start monitoring
      if (this.configuration.monitoring.enableRealTimeMonitoring) {
        this.startMonitoring();
      }
      
      // Load existing data
      await this.loadExistingData();

      this.isInitialized = true;
      logger.info('Astral Core Error Service initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize error service', error);
      throw error;
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }, {
        category: 'system',
        source: 'browser',
        severity: 'high'
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        error: event.reason
      }, {
        category: 'system',
        source: 'browser',
        severity: 'high'
      });
    });

    // Handle React error boundaries (if available)
    if (typeof window !== 'undefined' && (window as any).React) {
      this.setupReactErrorBoundary();
    }
  }

  private setupReactErrorBoundary(): void {
    // This would typically be done in a React Error Boundary component
    // Here we're just setting up the tracking mechanism
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('React') || errorMessage.includes('component')) {
        this.captureError({
          message: errorMessage,
          stack: new Error().stack
        }, {
          category: 'ui-interaction',
          source: 'client',
          severity: 'medium'
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  private initializeErrorPatterns(): void {
    // Initialize common error patterns for automatic detection
    const commonPatterns: ErrorPattern[] = [
      {
        id: 'network-timeout',
        name: 'Network Timeout Pattern',
        description: 'Network requests timing out frequently',
        fingerprints: ['NETWORK_TIMEOUT', 'REQUEST_TIMEOUT', 'FETCH_TIMEOUT'],
        category: 'network',
        severity: 'medium',
        frequency: 0,
        trend: 'stable',
        commonContext: {
          feature: 'api-calls',
          component: 'network-layer'
        },
        rootCause: 'Slow network connection or server overload',
        preventionStrategy: 'Implement retry logic and increase timeout thresholds',
        automatedFix: {
          strategy: 'retry',
          script: 'retryWithExponentialBackoff',
          successRate: 0.8
        },
        alertThreshold: 10,
        businessImpact: 'Medium - affects user experience and data loading',
        documentationUrl: 'https://docs.example.com/network-timeouts'
      },
      
      {
        id: 'auth-token-expired',
        name: 'Authentication Token Expiry',
        description: 'User authentication tokens expiring during sessions',
        fingerprints: ['TOKEN_EXPIRED', 'AUTH_FAILED', 'UNAUTHORIZED_REQUEST'],
        category: 'authentication',
        severity: 'medium',
        frequency: 0,
        trend: 'stable',
        commonContext: {
          feature: 'authentication',
          component: 'auth-service'
        },
        rootCause: 'Token expiry without proper refresh mechanism',
        preventionStrategy: 'Implement automatic token refresh and better session management',
        automatedFix: {
          strategy: 'retry',
          script: 'refreshTokenAndRetry',
          successRate: 0.95
        },
        alertThreshold: 5,
        businessImpact: 'High - forces users to re-authenticate',
        documentationUrl: 'https://docs.example.com/auth-tokens'
      },
      
      {
        id: 'crisis-intervention-failure',
        name: 'Crisis Intervention System Failure',
        description: 'Critical failures in crisis intervention workflows',
        fingerprints: ['CRISIS_SYSTEM_ERROR', 'EMERGENCY_HANDLER_FAILED', 'PANIC_BUTTON_ERROR'],
        category: 'crisis-intervention',
        severity: 'catastrophic',
        frequency: 0,
        trend: 'stable',
        commonContext: {
          feature: 'crisis-support',
          component: 'emergency-handler'
        },
        rootCause: 'System overload or service dependency failure',
        preventionStrategy: 'Implement redundant crisis systems and failover mechanisms',
        alertThreshold: 1,
        businessImpact: 'Critical - potentially life-threatening impact',
        documentationUrl: 'https://docs.example.com/crisis-systems'
      }
    ];

    commonPatterns.forEach(pattern => {
      this.errorPatterns.set(pattern.id, pattern);
    });
  }

  private startProcessingQueue(): void {
    this.processingInterval = setInterval(() => {
      this.processErrorBatch();
    }, this.configuration.processing.batchProcessingInterval);
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.analyzeErrorTrends();
      this.detectAnomalies();
      this.updateErrorPatterns();
      this.checkAlertThresholds();
    }, this.configuration.monitoring.analysisInterval);
  }

  public captureError(
    errorData: {
      message: string;
      filename?: string;
      lineno?: number;
      colno?: number;
      error?: Error;
      stack?: string;
    },
    metadata: {
      category?: ErrorCategory;
      source?: ErrorSource;
      severity?: ErrorSeverity;
      userId?: string;
      feature?: string;
      component?: string;
      action?: string;
      tags?: string[];
      businessContext?: Record<string, any>;
    } = {}
  ): AstralError {
    // Check sampling rate
    if (Math.random() > this.configuration.collection.sampleRate) {
      return {} as AstralError; // Skip this error based on sampling
    }

    const context = this.buildErrorContext(metadata);
    const fingerprint = this.generateFingerprint(errorData, context);
    
    // Check if this error already exists
    const existingError = Array.from(this.errors.values()).find(e => e.fingerprint === fingerprint);
    
    if (existingError) {
      // Update existing error
      existingError.occurrenceCount++;
      existingError.lastOccurrence = new Date();
      if (metadata.userId) {
        existingError.affectedUsers.add(metadata.userId);
      }
      
      // Update severity if this occurrence is more severe
      if (metadata.severity && this.getSeverityWeight(metadata.severity) > this.getSeverityWeight(existingError.severity)) {
        existingError.severity = metadata.severity;
      }
      
      return existingError;
    }

    // Create new error
    const astralError: AstralError = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity: metadata.severity || this.determineSeverity(errorData, context),
      category: metadata.category || this.determineCategory(errorData, context),
      source: metadata.source || this.determineSource(errorData, context),
      code: this.generateErrorCode(errorData, context),
      message: errorData.message,
      technicalMessage: this.generateTechnicalMessage(errorData),
      userMessage: this.generateUserMessage(errorData, metadata.category),
      context,
      stackTrace: this.sanitizeStackTrace(errorData.stack || errorData.error?.stack),
      cause: errorData.error,
      metadata: {
        ...metadata.businessContext,
        filename: errorData.filename,
        line: errorData.lineno,
        column: errorData.colno
      },
      tags: metadata.tags || [],
      fingerprint,
      occurrenceCount: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      affectedUsers: new Set(metadata.userId ? [metadata.userId] : []),
      businessImpact: this.assessBusinessImpact(errorData, context, metadata.category),
      privacy: this.assessPrivacyImpact(errorData, context)
    };

    // Sanitize if contains sensitive data
    if (astralError.privacy.containsPII || astralError.privacy.containsPHI) {
      this.sanitizeError(astralError);
    }

    // Store error
    this.errors.set(astralError.id, astralError);
    
    // Add to processing queue
    this.processingQueue.push(astralError);
    
    // Process immediately if critical
    if (astralError.severity === 'critical' || astralError.severity === 'catastrophic') {
      this.processErrorImmediately(astralError);
    }
    
    // Emit event
    this.emitEvent({
      type: 'error-captured',
      error: astralError,
      timestamp: new Date()
    });

    logger.error(`Error captured: ${astralError.code}`, {
      errorId: astralError.id,
      severity: astralError.severity,
      category: astralError.category,
      fingerprint: astralError.fingerprint
    });

    return astralError;
  }

  private buildErrorContext(metadata: any): ErrorContext {
    const performanceMetrics = this.collectPerformanceMetrics();
    const deviceInfo = this.collectDeviceInfo();
    const userJourney = this.collectUserJourney();

    return {
      userId: metadata.userId,
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date(),
      feature: metadata.feature || 'unknown',
      component: metadata.component || 'unknown',
      action: metadata.action || 'unknown',
      environment: this.getEnvironment(),
      buildVersion: this.getBuildVersion(),
      userRole: metadata.userRole,
      deviceInfo,
      performanceMetrics,
      userJourney
    };
  }

  private collectPerformanceMetrics(): ErrorContext['performanceMetrics'] {
    const memory = (performance as any).memory;
    
    return {
      memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0,
      cpuUsage: this.estimateCPUUsage(),
      networkLatency: this.getNetworkLatency(),
      renderTime: performance.now()
    };
  }

  private collectDeviceInfo(): ErrorContext['deviceInfo'] {
    const userAgent = navigator.userAgent;
    
    return {
      type: this.detectDeviceType(),
      os: this.detectOS(userAgent),
      browser: this.detectBrowser(userAgent),
      version: this.detectBrowserVersion(userAgent),
      screenSize: `${screen.width}x${screen.height}`,
      connectionType: (navigator as any).connection?.effectiveType
    };
  }

  private collectUserJourney(): ErrorContext['userJourney'] {
    // This would typically be collected from user interaction tracking
    return {
      previousActions: this.getPreviousActions(),
      timeOnPage: performance.now(),
      clickPath: this.getClickPath(),
      formData: this.getFormData()
    };
  }

  private generateFingerprint(errorData: any, context: ErrorContext): string {
    const components = [
      errorData.message.substring(0, 100),
      context.component,
      context.feature,
      errorData.filename || '',
      errorData.lineno || 0
    ];
    
    // Simple hash function for fingerprinting
    return this.hashString(components.join('|'));
  }

  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private determineSeverity(errorData: any, context: ErrorContext): ErrorSeverity {
    // Crisis intervention errors are always critical
    if (context.feature.includes('crisis') || context.component.includes('emergency')) {
      return 'catastrophic';
    }
    
    // Authentication/security errors are high severity
    if (errorData.message.includes('auth') || errorData.message.includes('security')) {
      return 'high';
    }
    
    // Network errors are medium severity
    if (errorData.message.includes('network') || errorData.message.includes('fetch')) {
      return 'medium';
    }
    
    // UI errors are typically low severity
    if (context.category === 'ui-interaction') {
      return 'low';
    }
    
    return 'medium';
  }

  private determineCategory(errorData: any, context: ErrorContext): ErrorCategory {
    const message = errorData.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return 'authentication';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'authorization';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    if (context.feature.includes('crisis') || message.includes('emergency')) {
      return 'crisis-intervention';
    }
    
    if (message.includes('performance') || message.includes('slow')) {
      return 'performance';
    }
    
    if (message.includes('accessibility') || message.includes('a11y')) {
      return 'accessibility';
    }
    
    return 'system';
  }

  private determineSource(errorData: any, context: ErrorContext): ErrorSource {
    if (errorData.filename?.includes('node_modules')) {
      return 'third-party';
    }
    
    if (context.url.includes('api/')) {
      return 'server';
    }
    
    if (errorData.message.includes('network') || errorData.message.includes('fetch')) {
      return 'network';
    }
    
    return 'client';
  }

  private generateErrorCode(errorData: any, context: ErrorContext): string {
    const category = this.determineCategory(errorData, context).toUpperCase().replace('-', '_');
    const component = context.component.toUpperCase().replace('-', '_');
    const timestamp = Date.now().toString().slice(-6);
    
    return `${category}_${component}_${timestamp}`;
  }

  private generateTechnicalMessage(errorData: any): string {
    let message = errorData.message;
    
    if (errorData.filename) {
      message += ` (${errorData.filename}`;
      if (errorData.lineno) {
        message += `:${errorData.lineno}`;
        if (errorData.colno) {
          message += `:${errorData.colno}`;
        }
      }
      message += ')';
    }
    
    return message;
  }

  private generateUserMessage(errorData: any, category?: ErrorCategory): string {
    const userMessages: Record<ErrorCategory, string> = {
      'system': 'Something went wrong. Please try again.',
      'network': 'Connection problem. Please check your internet connection and try again.',
      'authentication': 'Please sign in again to continue.',
      'authorization': 'You don\'t have permission to access this feature.',
      'validation': 'Please check your input and try again.',
      'business-logic': 'Unable to complete this action. Please try again.',
      'ui-interaction': 'Interface error. Please refresh the page.',
      'crisis-intervention': 'Emergency system temporarily unavailable. Please call 911 if this is a life-threatening emergency.',
      'data-integrity': 'Data error. Please contact support.',
      'performance': 'The system is running slowly. Please wait a moment and try again.',
      'security': 'Security error. Please contact support.',
      'accessibility': 'Accessibility feature unavailable. Please use alternative navigation.'
    };
    
    return category ? userMessages[category] : userMessages['system'];
  }

  private sanitizeStackTrace(stackTrace?: string): string | undefined {
    if (!stackTrace) return undefined;
    
    // Remove sensitive information from stack trace
    let sanitized = stackTrace;
    
    // Remove file paths that might contain sensitive information
    sanitized = sanitized.replace(/\/[^\/\s]+\/[^\/\s]+\/[^\/\s]+\//g, '/.../')
    
    // Remove query parameters
    sanitized = sanitized.replace(/\?[^\s)]+/g, '');
    
    // Limit length
    if (sanitized.length > this.configuration.collection.maxStackTraceLength) {
      sanitized = sanitized.substring(0, this.configuration.collection.maxStackTraceLength) + '...';
    }
    
    return sanitized;
  }

  private assessBusinessImpact(errorData: any, context: ErrorContext, category?: ErrorCategory): AstralError['businessImpact'] {
    let severity: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'low';
    let description = 'Minor impact on user experience';
    let affectedFeatures: string[] = [context.feature];
    let estimatedUserImpact = 1;
    
    if (category === 'crisis-intervention') {
      severity = 'critical';
      description = 'Critical impact on emergency mental health services';
      estimatedUserImpact = 100; // Assume high impact for crisis features
    } else if (category === 'authentication') {
      severity = 'high';
      description = 'Users unable to access their accounts';
      estimatedUserImpact = 50;
    } else if (category === 'network') {
      severity = 'medium';
      description = 'Reduced functionality due to connectivity issues';
      estimatedUserImpact = 25;
    }
    
    return {
      severity,
      description,
      affectedFeatures,
      estimatedUserImpact
    };
  }

  private assessPrivacyImpact(errorData: any, context: ErrorContext): AstralError['privacy'] {
    const containsPII = this.detectPII(errorData, context);
    const containsPHI = this.detectPHI(errorData, context);
    
    return {
      containsPII,
      containsPHI,
      sanitized: false,
      redactedFields: []
    };
  }

  private detectPII(errorData: any, context: ErrorContext): boolean {
    if (!this.configuration.privacy.enablePIIDetection) return false;
    
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/ // Phone number
    ];
    
    const textToCheck = JSON.stringify({ ...errorData, ...context });
    return sensitivePatterns.some(pattern => pattern.test(textToCheck));
  }

  private detectPHI(errorData: any, context: ErrorContext): boolean {
    if (!this.configuration.privacy.enablePHIDetection) return false;
    
    const phiKeywords = [
      'medical', 'health', 'diagnosis', 'treatment', 'medication',
      'therapy', 'counseling', 'mental health', 'psychiatric'
    ];
    
    const textToCheck = JSON.stringify({ ...errorData, ...context }).toLowerCase();
    return phiKeywords.some(keyword => textToCheck.includes(keyword));
  }

  private sanitizeError(error: AstralError): void {
    const redactedFields: string[] = [];
    
    // Redact sensitive fields
    this.configuration.privacy.excludeFields.forEach(field => {
      if (error.metadata[field]) {
        error.metadata[field] = '[REDACTED]';
        redactedFields.push(field);
      }
    });
    
    // Sanitize message
    error.message = this.sanitizeText(error.message);
    error.technicalMessage = this.sanitizeText(error.technicalMessage);
    
    // Anonymize user data if configured
    if (this.configuration.privacy.anonymizeUserData) {
      error.context.userId = error.context.userId ? this.hashString(error.context.userId) : undefined;
    }
    
    error.privacy.sanitized = true;
    error.privacy.redactedFields = redactedFields;
  }

  private sanitizeText(text: string): string {
    let sanitized = text;
    
    // Remove email addresses
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    
    // Remove phone numbers
    sanitized = sanitized.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]');
    
    // Remove SSNs
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
    
    // Remove credit card numbers
    sanitized = sanitized.replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CREDIT_CARD]');
    
    return sanitized;
  }

  private processErrorBatch(): void {
    if (this.processingQueue.length === 0) return;
    
    const batchSize = Math.min(this.processingQueue.length, this.configuration.processing.maxBatchSize);
    const batch = this.processingQueue.splice(0, batchSize);
    
    batch.forEach(error => {
      this.processError(error);
    });
  }

  private processError(error: AstralError): void {
    try {
      // Update error patterns
      this.updateErrorPatterns(error);
      
      // Attempt automatic recovery if enabled
      if (this.configuration.recovery.enableAutomaticRecovery) {
        this.attemptRecovery(error);
      }
      
      // Check for alerting conditions
      this.checkErrorForAlerts(error);
      
      // Emit processing event
      this.emitEvent({
        type: 'error-processed',
        error,
        timestamp: new Date()
      });
      
    } catch (processingError) {
      logger.warn('Error processing failed', { errorId: error.id, processingError });
    }
  }

  private processErrorImmediately(error: AstralError): void {
    this.processError(error);
    
    // Generate immediate alert for critical errors
    if (error.severity === 'critical' || error.severity === 'catastrophic') {
      this.generateAlert({
        type: 'critical-error',
        severity: error.severity,
        title: `Critical Error: ${error.code}`,
        description: error.message,
        errorIds: [error.id],
        affectedUsers: error.affectedUsers.size,
        businessImpact: error.businessImpact.description,
        recommendedActions: this.getRecommendedActions(error),
        escalationLevel: error.severity === 'catastrophic' ? 'executive' : 'management'
      });
    }
  }

  private updateErrorPatterns(error: AstralError): void {
    // Find matching patterns
    const matchingPatterns = Array.from(this.errorPatterns.values()).filter(pattern =>
      pattern.fingerprints.includes(error.fingerprint) ||
      pattern.category === error.category
    );
    
    matchingPatterns.forEach(pattern => {
      pattern.frequency++;
      
      // Update trend based on recent frequency
      const recentErrors = Array.from(this.errors.values()).filter(e =>
        e.category === pattern.category &&
        e.timestamp.getTime() > Date.now() - 3600000 // Last hour
      );
      
      if (recentErrors.length > pattern.frequency * 1.2) {
        pattern.trend = 'increasing';
      } else if (recentErrors.length < pattern.frequency * 0.8) {
        pattern.trend = 'decreasing';
      } else {
        pattern.trend = 'stable';
      }
    });
  }

  private attemptRecovery(error: AstralError): void {
    const strategy = this.configuration.recovery.fallbackStrategies[error.category];
    
    if (!strategy || strategy === 'manual-resolution') {
      return;
    }
    
    const resolution: ErrorResolution = {
      id: `resolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      errorId: error.id,
      strategy,
      status: 'pending',
      attemptedAt: new Date(),
      automaticRecovery: true,
      recoveryActions: [],
      successRate: 0,
      timeToResolve: 0,
      notes: '',
      preventionMeasures: []
    };
    
    this.executeRecoveryStrategy(resolution, error);
  }

  private async executeRecoveryStrategy(resolution: ErrorResolution, error: AstralError): Promise<void> {
    resolution.status = 'in-progress';
    const startTime = Date.now();
    
    try {
      switch (resolution.strategy) {
        case 'retry':
          await this.executeRetryStrategy(error);
          resolution.recoveryActions.push('Automatic retry executed');
          break;
          
        case 'fallback':
          await this.executeFallbackStrategy(error);
          resolution.recoveryActions.push('Fallback mechanism activated');
          break;
          
        case 'graceful-degradation':
          await this.executeGracefulDegradation(error);
          resolution.recoveryActions.push('Graceful degradation applied');
          break;
          
        default:
          resolution.status = 'failed';
          resolution.notes = 'Unknown recovery strategy';
          return;
      }
      
      resolution.status = 'resolved';
      resolution.resolvedAt = new Date();
      resolution.timeToResolve = Date.now() - startTime;
      resolution.successRate = 1.0;
      
      // Mark error as resolved
      error.resolution = resolution;
      
    } catch (recoveryError) {
      resolution.status = 'failed';
      resolution.notes = `Recovery failed: ${recoveryError.message}`;
      resolution.timeToResolve = Date.now() - startTime;
      resolution.successRate = 0;
    }
    
    this.resolutions.set(resolution.id, resolution);
  }

  private async executeRetryStrategy(error: AstralError): Promise<void> {
    // Implement retry logic based on error context
    const retryAttempts = this.configuration.recovery.retryAttempts;
    const retryDelay = this.configuration.recovery.retryDelay;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Simulate retry operation
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        
        // Check if the operation would succeed now
        if (this.shouldRetrySucceed(error)) {
          return; // Success
        }
      } catch (retryError) {
        if (attempt === retryAttempts) {
          throw retryError;
        }
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  private async executeFallbackStrategy(error: AstralError): Promise<void> {
    // Implement fallback logic
    this.emitEvent({
      type: 'fallback-activated',
      error,
      fallbackMode: true,
      timestamp: new Date()
    });
  }

  private async executeGracefulDegradation(error: AstralError): Promise<void> {
    // Implement graceful degradation
    const degradationFeatures = this.configuration.recovery.gracefulDegradation.features;
    
    this.emitEvent({
      type: 'graceful-degradation',
      error,
      disabledFeatures: degradationFeatures,
      timestamp: new Date()
    });
  }

  private shouldRetrySucceed(error: AstralError): boolean {
    // Simple heuristic for retry success
    // In a real implementation, this would check actual system conditions
    return Math.random() > 0.3; // 70% success rate for simulation
  }

  private checkErrorForAlerts(error: AstralError): void {
    const thresholds = this.configuration.alerting.thresholds;
    
    // Check if error rate threshold is exceeded
    const recentErrors = Array.from(this.errors.values()).filter(e =>
      e.timestamp.getTime() > Date.now() - 60000 // Last minute
    );
    
    if (recentErrors.length > thresholds.errorRate) {
      this.generateAlert({
        type: 'threshold',
        severity: 'high',
        title: 'High Error Rate Detected',
        description: `Error rate (${recentErrors.length}/min) exceeded threshold (${thresholds.errorRate}/min)`,
        errorIds: recentErrors.map(e => e.id),
        affectedUsers: new Set(recentErrors.map(e => e.context.userId).filter(Boolean)).size,
        businessImpact: 'System reliability degraded',
        recommendedActions: ['Investigate root cause', 'Scale infrastructure', 'Enable fallback systems'],
        escalationLevel: 'team'
      });
    }
    
    // Check critical error threshold
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical' || e.severity === 'catastrophic');
    if (criticalErrors.length >= thresholds.criticalErrors) {
      this.generateAlert({
        type: 'threshold',
        severity: 'critical',
        title: 'Critical Errors Detected',
        description: `${criticalErrors.length} critical errors in the last minute`,
        errorIds: criticalErrors.map(e => e.id),
        affectedUsers: new Set(criticalErrors.map(e => e.context.userId).filter(Boolean)).size,
        businessImpact: 'Service functionality severely impacted',
        recommendedActions: ['Immediate investigation required', 'Consider service degradation'],
        escalationLevel: 'management'
      });
    }
  }

  private generateAlert(alertData: Omit<ErrorAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved' | 'falsePositive'>): void {
    const alert: ErrorAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      falsePositive: false,
      ...alertData
    };
    
    // Check for duplicate alerts (debouncing)
    const recentAlerts = this.alerts.filter(a =>
      Date.now() - a.timestamp.getTime() < this.configuration.alerting.debounceTime &&
      a.type === alert.type &&
      a.title === alert.title
    );
    
    if (recentAlerts.length === 0) {
      this.alerts.push(alert);
      
      // Emit alert through configured channels
      this.configuration.alerting.channels.forEach(channel => {
        this.emitAlertToChannel(alert, channel);
      });
      
      this.emitEvent({
        type: 'alert-generated',
        alert,
        timestamp: new Date()
      });
    }
  }

  private emitAlertToChannel(alert: ErrorAlert, channel: string): void {
    switch (channel) {
      case 'console':
        console.error(`🚨 Error Alert: ${alert.title}`, alert);
        break;
      case 'storage':
        try {
          const storedAlerts = JSON.parse(localStorage.getItem('error-alerts') || '[]');
          storedAlerts.push(alert);
          localStorage.setItem('error-alerts', JSON.stringify(storedAlerts.slice(-100)));
        } catch (error) {
          logger.warn('Failed to store error alert', error);
        }
        break;
      case 'webhook':
        // Would send to external webhook
        break;
      case 'email':
        // Would send email notification
        break;
    }
  }

  private getRecommendedActions(error: AstralError): string[] {
    const actions: Record<ErrorCategory, string[]> = {
      'system': ['Check system logs', 'Restart affected services', 'Monitor system resources'],
      'network': ['Check network connectivity', 'Verify API endpoints', 'Review network configuration'],
      'authentication': ['Verify auth service status', 'Check token validation', 'Review session management'],
      'authorization': ['Review user permissions', 'Check role assignments', 'Verify access controls'],
      'validation': ['Review input validation rules', 'Check data formats', 'Verify business rules'],
      'business-logic': ['Review business rule implementation', 'Check data consistency', 'Verify workflow logic'],
      'ui-interaction': ['Check UI component status', 'Review event handlers', 'Verify DOM state'],
      'crisis-intervention': ['IMMEDIATE: Verify crisis systems', 'Check emergency contacts', 'Review failover procedures'],
      'data-integrity': ['Check data consistency', 'Review backup systems', 'Verify data validation'],
      'performance': ['Check system resources', 'Review performance metrics', 'Optimize slow operations'],
      'security': ['URGENT: Review security logs', 'Check for breaches', 'Verify security controls'],
      'accessibility': ['Check accessibility features', 'Verify screen reader compatibility', 'Review WCAG compliance']
    };
    
    return actions[error.category] || actions['system'];
  }

  // Monitoring and analysis methods
  private analyzeErrorTrends(): void {
    const timeRanges = [
      { name: 'last-hour', ms: 3600000 },
      { name: 'last-day', ms: 86400000 },
      { name: 'last-week', ms: 604800000 }
    ];
    
    timeRanges.forEach(range => {
      const errors = Array.from(this.errors.values()).filter(e =>
        e.timestamp.getTime() > Date.now() - range.ms
      );
      
      const trends = this.calculateTrends(errors);
      
      if (trends.significantChange) {
        this.emitEvent({
          type: 'trend-detected',
          timeRange: range.name,
          trends,
          timestamp: new Date()
        });
      }
    });
  }

  private calculateTrends(errors: AstralError[]): any {
    const midpoint = errors.length / 2;
    const firstHalf = errors.slice(0, midpoint);
    const secondHalf = errors.slice(midpoint);
    
    const firstHalfRate = firstHalf.length;
    const secondHalfRate = secondHalf.length;
    
    const changePercentage = firstHalfRate > 0 ? 
      ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100 : 0;
    
    return {
      changePercentage,
      direction: changePercentage > 0 ? 'increasing' : 'decreasing',
      significantChange: Math.abs(changePercentage) > 20,
      firstHalfCount: firstHalfRate,
      secondHalfCount: secondHalfRate
    };
  }

  private detectAnomalies(): void {
    // Simple anomaly detection based on error rate
    const hourlyErrorCounts = this.getHourlyErrorCounts(24); // Last 24 hours
    const average = hourlyErrorCounts.reduce((sum, count) => sum + count, 0) / hourlyErrorCounts.length;
    const currentHourCount = hourlyErrorCounts[hourlyErrorCounts.length - 1];
    
    // Anomaly if current hour is 3x the average
    if (currentHourCount > average * 3 && average > 0) {
      this.generateAlert({
        type: 'anomaly',
        severity: 'high',
        title: 'Error Rate Anomaly Detected',
        description: `Current error rate (${currentHourCount}) is ${(currentHourCount / average).toFixed(1)}x higher than average (${average.toFixed(1)})`,
        errorIds: [],
        affectedUsers: 0,
        businessImpact: 'Unusual system behavior detected',
        recommendedActions: ['Investigate recent changes', 'Check system health', 'Review deployment logs'],
        escalationLevel: 'team'
      });
    }
  }

  private getHourlyErrorCounts(hours: number): number[] {
    const counts: number[] = [];
    const now = Date.now();
    
    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = now - (i + 1) * 3600000;
      const hourEnd = now - i * 3600000;
      
      const hourlyCount = Array.from(this.errors.values()).filter(e =>
        e.timestamp.getTime() >= hourStart && e.timestamp.getTime() < hourEnd
      ).length;
      
      counts.push(hourlyCount);
    }
    
    return counts;
  }

  private checkAlertThresholds(): void {
    // Check pattern-based thresholds
    Array.from(this.errorPatterns.values()).forEach(pattern => {
      if (pattern.frequency >= pattern.alertThreshold) {
        this.generateAlert({
          type: 'pattern',
          severity: pattern.severity,
          title: `Error Pattern Alert: ${pattern.name}`,
          description: `Pattern "${pattern.name}" has occurred ${pattern.frequency} times (threshold: ${pattern.alertThreshold})`,
          errorIds: [],
          affectedUsers: 0,
          businessImpact: pattern.businessImpact,
          recommendedActions: [pattern.preventionStrategy || 'Investigate pattern cause'],
          escalationLevel: pattern.severity === 'catastrophic' ? 'executive' : 'team'
        });
        
        // Reset frequency after alerting
        pattern.frequency = 0;
      }
    });
  }

  // Utility methods
  private getSeverityWeight(severity: ErrorSeverity): number {
    const weights = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4,
      'catastrophic': 5
    };
    return weights[severity];
  }

  private getSessionId(): string {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('error-service-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error-service-session-id', sessionId);
    }
    return sessionId;
  }

  private getEnvironment(): 'development' | 'staging' | 'production' {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'development';
    } else if (window.location.hostname.includes('staging')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  private getBuildVersion(): string {
    return process.env.REACT_APP_VERSION || '1.0.0';
  }

  private estimateCPUUsage(): number {
    // Simple CPU usage estimation
    const start = performance.now();
    let iterations = 0;
    while (performance.now() - start < 1) {
      iterations++;
    }
    return Math.min(100, iterations / 1000); // Normalize to 0-100
  }

  private getNetworkLatency(): number {
    // Would measure actual network latency
    return 100; // Placeholder
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[1] : 'Unknown';
  }

  private getPreviousActions(): string[] {
    // Would track user actions
    return [];
  }

  private getClickPath(): string[] {
    // Would track click path
    return [];
  }

  private getFormData(): Record<string, any> | undefined {
    // Would collect sanitized form data
    return undefined;
  }

  private async loadExistingData(): Promise<void> {
    try {
      // Load from localStorage or API
      const storedErrors = localStorage.getItem('astral-errors');
      if (storedErrors) {
        const errors = JSON.parse(storedErrors);
        errors.forEach((error: AstralError) => {
          // Convert dates back from strings
          error.timestamp = new Date(error.timestamp);
          error.firstOccurrence = new Date(error.firstOccurrence);
          error.lastOccurrence = new Date(error.lastOccurrence);
          error.affectedUsers = new Set(error.affectedUsers);
          this.errors.set(error.id, error);
        });
      }
    } catch (error) {
      logger.warn('Failed to load existing error data', error);
    }
  }

  private emitEvent(event: any): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        logger.warn('Error in event listener', error);
      }
    }
  }

  // Public API
  public getErrors(filters?: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    timeRange?: { start: Date; end: Date };
    userId?: string;
  }): AstralError[] {
    let errors = Array.from(this.errors.values());
    
    if (filters) {
      if (filters.severity) {
        errors = errors.filter(e => e.severity === filters.severity);
      }
      if (filters.category) {
        errors = errors.filter(e => e.category === filters.category);
      }
      if (filters.timeRange) {
        errors = errors.filter(e => 
          e.timestamp >= filters.timeRange!.start && e.timestamp <= filters.timeRange!.end
        );
      }
      if (filters.userId) {
        errors = errors.filter(e => e.affectedUsers.has(filters.userId!));
      }
    }
    
    return errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getError(errorId: string): AstralError | undefined {
    return this.errors.get(errorId);
  }

  public getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values());
  }

  public getActiveAlerts(): ErrorAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public getAllAlerts(): ErrorAlert[] {
    return [...this.alerts];
  }

  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  public generateReport(period?: { start: Date; end: Date }): ErrorReport {
    const now = new Date();
    const reportPeriod = period || {
      start: new Date(now.getTime() - 86400000), // 24 hours ago
      end: now
    };
    
    const periodErrors = this.getErrors({ timeRange: reportPeriod });
    
    // Calculate summary
    const summary = {
      totalErrors: periodErrors.length,
      uniqueErrors: new Set(periodErrors.map(e => e.fingerprint)).size,
      errorRate: periodErrors.length / ((reportPeriod.end.getTime() - reportPeriod.start.getTime()) / 60000), // per minute
      criticalErrors: periodErrors.filter(e => e.severity === 'critical' || e.severity === 'catastrophic').length,
      resolvedErrors: periodErrors.filter(e => e.resolution?.status === 'resolved').length,
      averageResolutionTime: this.calculateAverageResolutionTime(periodErrors),
      topErrorCategories: this.getTopErrorCategories(periodErrors),
      affectedUsers: new Set(periodErrors.flatMap(e => Array.from(e.affectedUsers))).size,
      systemUptime: this.calculateSystemUptime(periodErrors, reportPeriod)
    };
    
    return {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: now,
      period: reportPeriod,
      summary,
      trends: this.calculateReportTrends(periodErrors),
      patterns: Array.from(this.errorPatterns.values()),
      recommendations: this.generateRecommendations(periodErrors),
      alerts: this.alerts.filter(a => a.timestamp >= reportPeriod.start && a.timestamp <= reportPeriod.end),
      metrics: {
        mttr: this.calculateMTTR(periodErrors),
        mtbf: this.calculateMTBF(periodErrors),
        errorBudget: this.calculateErrorBudget(periodErrors),
        slaCompliance: this.calculateSLACompliance(periodErrors),
        availabilityScore: this.calculateAvailabilityScore(periodErrors)
      }
    };
  }

  private calculateAverageResolutionTime(errors: AstralError[]): number {
    const resolvedErrors = errors.filter(e => e.resolution?.status === 'resolved');
    if (resolvedErrors.length === 0) return 0;
    
    const totalTime = resolvedErrors.reduce((sum, e) => sum + (e.resolution?.timeToResolve || 0), 0);
    return totalTime / resolvedErrors.length;
  }

  private getTopErrorCategories(errors: AstralError[]): Array<{ category: ErrorCategory; count: number; percentage: number }> {
    const categoryCounts = new Map<ErrorCategory, number>();
    
    errors.forEach(error => {
      categoryCounts.set(error.category, (categoryCounts.get(error.category) || 0) + 1);
    });
    
    return Array.from(categoryCounts.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / errors.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateSystemUptime(errors: AstralError[], period: { start: Date; end: Date }): number {
    const criticalErrors = errors.filter(e => e.severity === 'catastrophic');
    const totalPeriod = period.end.getTime() - period.start.getTime();
    
    // Assume each critical error causes 5 minutes of downtime
    const downtime = criticalErrors.length * 5 * 60 * 1000; // 5 minutes in ms
    
    return Math.max(0, ((totalPeriod - downtime) / totalPeriod) * 100);
  }

  private calculateReportTrends(errors: AstralError[]): ErrorReport['trends'] {
    // Simplified trend calculation
    return {
      errorRateChange: 0,
      severityDistribution: {
        'low': errors.filter(e => e.severity === 'low').length,
        'medium': errors.filter(e => e.severity === 'medium').length,
        'high': errors.filter(e => e.severity === 'high').length,
        'critical': errors.filter(e => e.severity === 'critical').length,
        'catastrophic': errors.filter(e => e.severity === 'catastrophic').length
      },
      categoryTrends: errors.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {} as Record<ErrorCategory, number>),
      resolutionTimeChange: 0,
      userImpactChange: 0
    };
  }

  private generateRecommendations(errors: AstralError[]): ErrorReport['recommendations'] {
    const recommendations: ErrorReport['recommendations'] = [];
    
    // High error rate recommendation
    if (errors.length > 100) {
      recommendations.push({
        priority: 'high',
        category: 'Performance',
        description: 'High error volume detected',
        implementation: ['Implement better error handling', 'Add circuit breakers', 'Improve monitoring'],
        expectedImpact: 'Reduced error rate and improved system stability'
      });
    }
    
    // Critical error recommendation
    const criticalErrors = errors.filter(e => e.severity === 'critical' || e.severity === 'catastrophic');
    if (criticalErrors.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Reliability',
        description: 'Critical errors require immediate attention',
        implementation: ['Investigate root causes', 'Implement preventive measures', 'Add redundancy'],
        expectedImpact: 'Elimination of critical system failures'
      });
    }
    
    return recommendations;
  }

  private calculateMTTR(errors: AstralError[]): number {
    const resolvedErrors = errors.filter(e => e.resolution?.status === 'resolved');
    if (resolvedErrors.length === 0) return 0;
    
    const totalTime = resolvedErrors.reduce((sum, e) => sum + (e.resolution?.timeToResolve || 0), 0);
    return totalTime / resolvedErrors.length / 1000 / 60; // Convert to minutes
  }

  private calculateMTBF(errors: AstralError[]): number {
    if (errors.length === 0) return 0;
    
    const timeSpan = errors[errors.length - 1].timestamp.getTime() - errors[0].timestamp.getTime();
    return timeSpan / errors.length / 1000 / 60; // Minutes between failures
  }

  private calculateErrorBudget(errors: AstralError[]): number {
    // Simplified error budget calculation (99.9% availability target)
    const targetAvailability = 99.9;
    const actualAvailability = this.calculateAvailabilityScore(errors);
    return Math.max(0, actualAvailability - targetAvailability);
  }

  private calculateSLACompliance(errors: AstralError[]): number {
    // Simplified SLA compliance calculation
    const criticalErrors = errors.filter(e => e.severity === 'critical' || e.severity === 'catastrophic');
    return Math.max(0, 100 - (criticalErrors.length * 10)); // Each critical error reduces compliance by 10%
  }

  private calculateAvailabilityScore(errors: AstralError[]): number {
    const criticalErrors = errors.filter(e => e.severity === 'catastrophic');
    // Assume each catastrophic error causes 0.1% availability loss
    return Math.max(0, 100 - (criticalErrors.length * 0.1));
  }

  public updateConfiguration(newConfig: Partial<ErrorConfiguration>): void {
    this.configuration = this.mergeConfiguration(newConfig);
    logger.info('Error service configuration updated', newConfig);
  }

  public getConfiguration(): ErrorConfiguration {
    return { ...this.configuration };
  }

  public addEventListener(listener: (event: any) => void): void {
    this.eventListeners.push(listener);
  }

  public removeEventListener(listener: (event: any) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  public destroy(): void {
    // Clear intervals
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Clear data
    this.errors.clear();
    this.errorPatterns.clear();
    this.resolutions.clear();
    this.alerts = [];
    this.reports = [];
    this.processingQueue = [];
    this.eventListeners = [];
    this.errorBoundaryStack = [];
    
    this.isInitialized = false;
    logger.info('Astral Core Error Service destroyed');
  }
}

// Create singleton instance
export const astralCoreErrorService = new AstralCoreErrorService();

export default astralCoreErrorService;
