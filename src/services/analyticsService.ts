/**
 * Analytics Service for Mental Health Platform
 * HIPAA-compliant analytics with privacy-first design
 */

export interface ConsentStatus {
  analytics: boolean;
  performance: boolean;
  functionality: boolean;
  marketing: boolean;
  timestamp?: number;
  version?: string;
}

class AnalyticsService {
  private consentStatus: ConsentStatus | null = null;
  private readonly CONSENT_KEY = 'analytics_consent';

  constructor() {
    this.loadConsentFromStorage();
  }

  private loadConsentFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.CONSENT_KEY);
      if (stored) {
        this.consentStatus = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load consent status:', error);
    }
  }

  getConsentStatus(): ConsentStatus | null {
    return this.consentStatus;
  }

  updateConsent(consent: ConsentStatus): void {
    this.consentStatus = consent;
    try {
      localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consent));
    } catch (error) {
      console.error('Failed to save consent status:', error);
    }

    // Initialize or disable tracking based on consent
    this.applyConsentSettings(consent);
  }

  private applyConsentSettings(consent: ConsentStatus): void {
    if (consent.analytics) {
      // Enable anonymous analytics
      this.initializeAnalytics();
    } else {
      // Disable analytics
      this.disableAnalytics();
    }

    if (consent.performance) {
      // Enable performance monitoring
      this.initializePerformanceMonitoring();
    }

    if (consent.marketing) {
      // Enable marketing features
      this.initializeMarketing();
    }
  }

  private initializeAnalytics(): void {
    // Initialize privacy-compliant analytics
    console.log('Analytics enabled with privacy settings');
  }

  private disableAnalytics(): void {
    // Disable all analytics
    console.log('Analytics disabled');
  }

  private initializePerformanceMonitoring(): void {
    // Initialize performance monitoring
    console.log('Performance monitoring enabled');
  }

  private initializeMarketing(): void {
    // Initialize marketing features
    console.log('Marketing features enabled');
  }

  // Track events with consent check
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.consentStatus?.analytics) {
      return;
    }

    // Sanitize and anonymize data before tracking
    const sanitizedProperties = this.sanitizeProperties(properties);
    
    console.log('Tracking event:', eventName, sanitizedProperties);
  }

  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
    if (!properties) return {};
    
    // Remove any PII or sensitive data
    const sanitized: Record<string, any> = { ...properties };
    const sensitiveKeys: readonly string[] = ['email', 'name', 'phone', 'ssn', 'diagnosis', 'medication'] as const;
    
    for (const key of sensitiveKeys) {
      delete sanitized[key];
    }
    
    return sanitized;
  }
}

// Singleton instance
let analyticsServiceInstance: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService();
  }
  return analyticsServiceInstance;
}

export default AnalyticsService;