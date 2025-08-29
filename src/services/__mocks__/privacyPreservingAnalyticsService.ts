// Mock implementation of privacy-preserving analytics service
export interface AnalyticsEvent {
  id: string;
  type: string;
  timestamp: string;
  anonymizedData: Record<string, any>;
  privacyLevel: 'minimal' | 'standard' | 'enhanced';
}

export interface AnalyticsMetric {
  name: string;
  value: number | string;
  type: 'counter' | 'gauge' | 'histogram';
  timestamp: string;
  dimensions?: Record<string, string>;
}

class MockPrivacyPreservingAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private metrics: AnalyticsMetric[] = [];
  private isEnabled = false;

  async initialize(config: { apiKey: string; privacyMode: boolean }): Promise<void> {
    this.isEnabled = true;
    console.log('Mock Analytics initialized with privacy mode:', config.privacyMode);
  }

  async trackEvent(eventType: string, data: Record<string, any>): Promise<void> {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      anonymizedData: this.anonymizeData(data),
      privacyLevel: 'enhanced'
    };

    this.events.push(event);
    console.log('Mock event tracked:', event);
  }

  async recordMetric(metric: Omit<AnalyticsMetric, 'timestamp'>): Promise<void> {
    if (!this.isEnabled) return;

    const fullMetric: AnalyticsMetric = {
      ...metric,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(fullMetric);
    console.log('Mock metric recorded:', fullMetric);
  }

  async getInsights(timeRange: string): Promise<Array<{ insight: string; confidence: number }>> {
    return [
      { insight: 'Mock insight: User engagement increased', confidence: 0.85 },
      { insight: 'Mock insight: Crisis support usage stable', confidence: 0.92 }
    ];
  }

  private anonymizeData(data: Record<string, any>): Record<string, any> {
    const anonymized = { ...data };
    
    // Remove or hash sensitive fields
    if (anonymized.userId) {
      anonymized.userId = `anon_${this.simpleHash(anonymized.userId)}`;
    }
    if (anonymized.email) {
      anonymized.email = '[ANONYMIZED]';
    }
    if (anonymized.ip) {
      anonymized.ip = '[ANONYMIZED]';
    }

    return anonymized;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash).toString(36);
  }

  // Mock methods for testing
  getStoredEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getStoredMetrics(): AnalyticsMetric[] {
    return [...this.metrics];
  }

  clearMockData(): void {
    this.events = [];
    this.metrics = [];
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

export default new MockPrivacyPreservingAnalyticsService();
