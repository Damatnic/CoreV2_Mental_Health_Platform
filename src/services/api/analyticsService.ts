import { EventEmitter } from 'events';

// Types and interfaces
export interface AnalyticsEvent {
  id: string;
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  context: AnalyticsContext;
}

export interface AnalyticsContext {
  page: string;
  url: string;
  referrer?: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone: string;
  };
  feature: string;
  version: string;
}

export interface MentalHealthMetrics {
  moodEntries: number;
  journalEntries: number;
  crisisAlertsTriggered: number;
  resourcesAccessed: number;
  sessionDuration: number;
  supportInteractions: number;
  goalCompletions: number;
  meditationMinutes: number;
  breathingExercises: number;
  safetyPlanActivations: number;
}

export interface UserEngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: number;
  bounceRate: number;
  retentionRate: {
    day1: number;
    day7: number;
    day30: number;
  };
  featureAdoption: Record<string, number>;
  userPathways: string[];
}

export interface PrivacyCompliantConfig {
  enableGoogleAnalytics: boolean;
  enableHotjar: boolean;
  enableMixpanel: boolean;
  enableCustomAnalytics: boolean;
  anonymizeIP: boolean;
  cookieConsent: boolean;
  dataRetentionDays: number;
  excludePII: boolean;
  enableCrashlytics: boolean;
  enablePerformanceMonitoring: boolean;
}

export class AnalyticsService extends EventEmitter {
  private config: PrivacyCompliantConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private isInitialized: boolean = false;
  private batchSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: ReturnType<typeof setTimeout>;
  private offlineQueue: AnalyticsEvent[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor(config: Partial<PrivacyCompliantConfig> = {}) {
    super();
    
    this.config = {
      enableGoogleAnalytics: false,
      enableHotjar: false,
      enableMixpanel: false,
      enableCustomAnalytics: true,
      anonymizeIP: true,
      cookieConsent: false,
      dataRetentionDays: 90,
      excludePII: true,
      enableCrashlytics: true,
      enablePerformanceMonitoring: true,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
  }

  // Initialization
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    this.userId = userId;
    
    try {
      // Initialize Google Analytics 4 (if enabled and consent given)
      if (this.config.enableGoogleAnalytics && this.hasConsent('analytics')) {
        await this.initializeGA4();
      }

      // Initialize Hotjar (if enabled and consent given)
      if (this.config.enableHotjar && this.hasConsent('analytics')) {
        await this.initializeHotjar();
      }

      // Initialize Mixpanel (if enabled and consent given)
      if (this.config.enableMixpanel && this.hasConsent('analytics')) {
        await this.initializeMixpanel();
      }

      // Initialize custom analytics
      if (this.config.enableCustomAnalytics) {
        await this.initializeCustomAnalytics();
      }

      this.startBatchProcessor();
      this.trackPageView();
      
      this.isInitialized = true;
      this.emit('initialized');

    } catch (error) {
      console.error('Analytics initialization failed:', error);
      this.emit('error', error);
    }
  }

  // Core tracking methods
  track(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized. Call initialize() first.');
      return;
    }

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      name: eventName,
      category: this.extractCategory(eventName),
      action: this.extractAction(eventName),
      label: properties.label,
      value: properties.value,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: this.sanitizeProperties(properties),
      context: this.getAnalyticsContext()
    };

    this.addToQueue(event);
    this.emit('event_tracked', event);
  }

  trackMentalHealthEvent(eventType: string, data: Partial<MentalHealthMetrics>): void {
    const sanitizedData = this.sanitizeMentalHealthData(data);
    
    this.track(`mental_health_${eventType}`, {
      ...sanitizedData,
      category: 'mental_health',
      feature: 'wellness_tracking'
    });
  }

  trackUserEngagement(action: string, details: Record<string, any> = {}): void {
    this.track(`user_engagement_${action}`, {
      ...details,
      category: 'engagement',
      feature: 'user_interaction'
    });
  }

  trackCrisisEvent(severity: 'low' | 'medium' | 'high' | 'critical', context: Record<string, any>): void {
    // Special handling for crisis events - highest priority
    const crisisEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      name: 'crisis_alert',
      category: 'crisis',
      action: 'alert_triggered',
      label: severity,
      value: this.getSeverityValue(severity),
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      properties: {
        severity,
        ...this.sanitizeProperties(context),
        priority: 'critical'
      },
      context: this.getAnalyticsContext()
    };

    // Send immediately for crisis events
    this.sendEventImmediate(crisisEvent);
    this.emit('crisis_tracked', crisisEvent);
  }

  trackPageView(page?: string, title?: string): void {
    const pageData = {
      page: page || window.location.pathname,
      title: title || document.title,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    };

    this.track('page_view', pageData);

    // Also send to Google Analytics if enabled
    if (this.config.enableGoogleAnalytics && this.hasConsent('analytics')) {
      this.sendGA4PageView(pageData);
    }
  }

  trackTiming(category: string, variable: string, time: number, label?: string): void {
    this.track('timing', {
      category,
      variable,
      time,
      label,
      type: 'performance'
    });
  }

  trackError(error: Error, context: Record<string, any> = {}): void {
    const errorEvent = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
      category: 'error',
      severity: context.severity || 'error'
    };

    this.track('error_occurred', errorEvent);

    // Also send to crash reporting if enabled
    if (this.config.enableCrashlytics) {
      this.sendToCrashlytics(error, context);
    }
  }

  trackPerformance(metrics: Record<string, number>): void {
    if (!this.config.enablePerformanceMonitoring) return;

    this.track('performance_metrics', {
      ...metrics,
      category: 'performance',
      type: 'web_vitals'
    });
  }

  // Mental health specific tracking
  trackMoodEntry(mood: number, context: string[]): void {
    this.trackMentalHealthEvent('mood_entry', {
      moodEntries: 1
    });

    this.track('mood_logged', {
      mood_level: mood,
      context_tags: context.length,
      category: 'wellness',
      feature: 'mood_tracker'
    });
  }

  trackJournalEntry(wordCount: number, sentiment?: string): void {
    this.trackMentalHealthEvent('journal_entry', {
      journalEntries: 1
    });

    this.track('journal_created', {
      word_count: wordCount,
      sentiment,
      category: 'wellness',
      feature: 'journaling'
    });
  }

  trackResourceAccess(resourceType: string, resourceId: string): void {
    this.trackMentalHealthEvent('resource_access', {
      resourcesAccessed: 1
    });

    this.track('resource_accessed', {
      resource_type: resourceType,
      resource_id: resourceId,
      category: 'resources',
      feature: 'help_content'
    });
  }

  trackMeditationSession(duration: number, type: string): void {
    this.trackMentalHealthEvent('meditation_session', {
      meditationMinutes: Math.round(duration / 60)
    });

    this.track('meditation_completed', {
      duration_seconds: duration,
      meditation_type: type,
      category: 'wellness',
      feature: 'meditation'
    });
  }

  trackBreathingExercise(duration: number, technique: string): void {
    this.trackMentalHealthEvent('breathing_exercise', {
      breathingExercises: 1
    });

    this.track('breathing_exercise_completed', {
      duration_seconds: duration,
      technique,
      category: 'wellness',
      feature: 'breathing'
    });
  }

  trackSafetyPlanActivation(trigger: string): void {
    this.trackMentalHealthEvent('safety_plan_activation', {
      safetyPlanActivations: 1
    });

    this.track('safety_plan_activated', {
      trigger,
      category: 'crisis',
      feature: 'safety_planning',
      priority: 'high'
    });
  }

  // User flow tracking
  trackUserFlow(flowName: string, step: string, completed: boolean = false): void {
    this.track('user_flow', {
      flow_name: flowName,
      step,
      completed,
      category: 'user_flow',
      feature: 'onboarding'
    });
  }

  trackFeatureUsage(featureName: string, action: string, context?: Record<string, any>): void {
    this.track('feature_usage', {
      feature: featureName,
      action,
      ...context,
      category: 'features'
    });
  }

  trackABTest(experimentName: string, variant: string, converted: boolean = false): void {
    this.track('ab_test', {
      experiment: experimentName,
      variant,
      converted,
      category: 'experiments'
    });
  }

  // Privacy and compliance
  setUserConsent(consentTypes: string[]): void {
    localStorage.setItem('analytics_consent', JSON.stringify({
      types: consentTypes,
      timestamp: Date.now()
    }));

    this.track('consent_updated', {
      consent_types: consentTypes,
      category: 'privacy'
    });

    // Re-initialize services based on new consent
    this.updateServicesConsent(consentTypes);
  }

  hasConsent(type: string): boolean {
    try {
      const consent = JSON.parse(localStorage.getItem('analytics_consent') || '{}');
      return consent.types?.includes(type) || false;
    } catch {
      return false;
    }
  }

  optOut(): void {
    this.setUserConsent([]);
    this.clearAllData();
    this.track('user_opted_out', { category: 'privacy' });
  }

  // Data management
  clearAllData(): void {
    this.eventQueue = [];
    this.offlineQueue = [];
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_session');
    
    this.emit('data_cleared');
  }

  exportData(): any {
    if (!this.hasConsent('data_export')) {
      throw new Error('No consent for data export');
    }

    return {
      events: this.eventQueue,
      session: {
        id: this.sessionId,
        userId: this.userId
      },
      timestamp: Date.now()
    };
  }

  // Utilities and helpers
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAnalyticsContext(): AnalyticsContext {
    return {
      page: window.location.pathname,
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      device: this.getDeviceInfo(),
      location: this.getLocationInfo(),
      feature: this.getCurrentFeature(),
      version: process.env.REACT_APP_VERSION || '1.0.0'
    };
  }

  private getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
      type: this.getDeviceType(),
      os: this.getOperatingSystem(ua),
      browser: this.getBrowser(ua)
    };
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getOperatingSystem(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getLocationInfo() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private getCurrentFeature(): string {
    const path = window.location.pathname;
    if (path.includes('/mood')) return 'mood_tracker';
    if (path.includes('/journal')) return 'journaling';
    if (path.includes('/crisis')) return 'crisis_support';
    if (path.includes('/meditation')) return 'meditation';
    if (path.includes('/resources')) return 'resources';
    if (path.includes('/chat')) return 'ai_chat';
    return 'general';
  }

  private extractCategory(eventName: string): string {
    const parts = eventName.split('_');
    return parts[0] || 'general';
  }

  private extractAction(eventName: string): string {
    const parts = eventName.split('_');
    return parts.slice(1).join('_') || 'action';
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized = { ...properties };
    
    // Remove PII if configured
    if (this.config.excludePII) {
      const piiFields = ['email', 'phone', 'name', 'address', 'ssn', 'dob'];
      piiFields.forEach(field => {
        if (sanitized[field]) {
          delete sanitized[field];
        }
      });
    }

    // Remove sensitive mental health details
    const sensitiveFields = ['specific_thoughts', 'personal_details', 'crisis_details'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[redacted]';
      }
    });

    return sanitized;
  }

  private sanitizeMentalHealthData(data: Partial<MentalHealthMetrics>): Record<string, any> {
    // Only include aggregate metrics, not individual content
    return {
      mood_entries: data.moodEntries || 0,
      journal_entries: data.journalEntries || 0,
      resources_accessed: data.resourcesAccessed || 0,
      session_duration: data.sessionDuration || 0,
      support_interactions: data.supportInteractions || 0,
      goal_completions: data.goalCompletions || 0,
      meditation_minutes: data.meditationMinutes || 0,
      breathing_exercises: data.breathingExercises || 0
    };
  }

  private getSeverityValue(severity: string): number {
    const values = { low: 1, medium: 2, high: 3, critical: 4 };
    return values[severity as keyof typeof values] || 0;
  }

  private addToQueue(event: AnalyticsEvent): void {
    if (this.isOnline) {
      this.eventQueue.push(event);
      
      if (this.eventQueue.length >= this.batchSize) {
        this.flushEvents();
      }
    } else {
      this.offlineQueue.push(event);
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
      this.emit('events_sent', events.length);
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
      console.error('Failed to send analytics events:', error);
      this.emit('send_failed', error);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.enableCustomAnalytics) return;

    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId
      },
      body: JSON.stringify({
        events,
        session: {
          id: this.sessionId,
          userId: this.userId
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }

  private async sendEventImmediate(event: AnalyticsEvent): Promise<void> {
    try {
      await this.sendEvents([event]);
    } catch (error) {
      // For critical events like crisis, add to priority queue
      this.eventQueue.unshift(event);
      console.error('Failed to send immediate event:', error);
    }
  }

  private startBatchProcessor(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private setupEventListeners(): void {
    // Online/offline handling
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.offlineQueue.length > 0) {
        this.eventQueue.push(...this.offlineQueue);
        this.offlineQueue = [];
        this.flushEvents();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility for session tracking
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden', { category: 'engagement' });
        this.flushEvents(); // Ensure events are sent before page becomes hidden
      } else {
        this.track('page_visible', { category: 'engagement' });
      }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
      this.cleanup();
    });
  }

  private async initializeGA4(): Promise<void> {
    // Implementation would load and configure Google Analytics 4
    console.log('GA4 initialized');
  }

  private async initializeHotjar(): Promise<void> {
    // Implementation would load and configure Hotjar
    console.log('Hotjar initialized');
  }

  private async initializeMixpanel(): Promise<void> {
    // Implementation would load and configure Mixpanel
    console.log('Mixpanel initialized');
  }

  private async initializeCustomAnalytics(): Promise<void> {
    // Custom analytics initialization
    console.log('Custom analytics initialized');
  }

  private sendGA4PageView(pageData: any): void {
    if ((window as any).gtag) {
      (window as any).gtag('config', process.env.REACT_APP_GA4_ID, {
        page_title: pageData.title,
        page_location: pageData.url,
        anonymize_ip: this.config.anonymizeIP
      });
    }
  }

  private sendToCrashlytics(error: Error, context: Record<string, any>): void {
    // Implementation would send to crash reporting service
    console.error('Crashlytics:', error, context);
  }

  private updateServicesConsent(consentTypes: string[]): void {
    // Re-initialize services based on consent changes
    if (consentTypes.includes('analytics') && !this.config.enableGoogleAnalytics) {
      this.config.enableGoogleAnalytics = true;
      this.initializeGA4();
    }
  }

  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushEvents();
    this.removeAllListeners();
  }

  // Getter methods for metrics
  getSessionId(): string {
    return this.sessionId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  isActive(): boolean {
    return this.isInitialized;
  }

  getQueueSize(): number {
    return this.eventQueue.length + this.offlineQueue.length;
  }

  getConfig(): PrivacyCompliantConfig {
    return { ...this.config };
  }
}

export default AnalyticsService;
