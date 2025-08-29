import { describe, it, expect, jest, beforeEach } from '@jest/globals';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface UserProfile {
  userId: string;
  traits: Record<string, any>;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId: string | null = null;
  private enabled: boolean = true;
  private debugMode: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  track(event: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: this.sanitizeProperties(properties),
      timestamp: Date.now(),
      userId: this.userId || undefined,
      sessionId: this.sessionId
    };

    this.events.push(analyticsEvent);
    
    if (this.debugMode) {
      console.log('Analytics Event:', analyticsEvent);
    }

    // Send to analytics provider
    this.sendEvent(analyticsEvent);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    
    const profile: UserProfile = {
      userId,
      traits: this.sanitizeProperties(traits) || {}
    };

    // Send to analytics provider
    this.sendIdentify(profile);
  }

  page(name?: string, properties?: Record<string, any>): void {
    const pageName = name || window?.location?.pathname || 'unknown';
    this.track('page_view', { 
      page: pageName, 
      ...properties 
    });
  }

  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
    if (!properties) return undefined;

    const sanitized: Record<string, any> = {};
    const piiFields = ['password', 'ssn', 'creditCard', 'cvv'];

    for (const [key, value] of Object.entries(properties)) {
      if (!piiFields.includes(key)) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendEvent(event: AnalyticsEvent): void {
    // Mock sending to analytics provider
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(event);
    }
  }

  private sendIdentify(profile: UserProfile): void {
    // Mock sending to analytics provider
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.identify(profile);
    }
  }

  reset(): void {
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.events = [];
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    jest.clearAllMocks();
  });

  it('should track events', () => {
    service.track('button_click', { button: 'submit' });
    
    const events = service.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('button_click');
    expect(events[0].properties?.button).toBe('submit');
  });

  it('should include session ID in events', () => {
    service.track('test_event');
    
    const events = service.getEvents();
    expect(events[0].sessionId).toBeDefined();
    expect(events[0].sessionId).toMatch(/^session-/);
  });

  it('should identify users', () => {
    service.identify('user123', { email: 'test@example.com' });
    service.track('test_event');
    
    const events = service.getEvents();
    expect(events[0].userId).toBe('user123');
  });

  it('should track page views', () => {
    service.page('home', { referrer: 'google' });
    
    const events = service.getEvents();
    expect(events[0].event).toBe('page_view');
    expect(events[0].properties?.page).toBe('home');
    expect(events[0].properties?.referrer).toBe('google');
  });

  it('should sanitize PII from properties', () => {
    service.track('form_submit', {
      username: 'john',
      password: 'secret123',
      ssn: '123-45-6789'
    });
    
    const events = service.getEvents();
    expect(events[0].properties?.username).toBe('john');
    expect(events[0].properties?.password).toBeUndefined();
    expect(events[0].properties?.ssn).toBeUndefined();
  });

  it('should respect enabled flag', () => {
    service.disable();
    service.track('test_event');
    
    expect(service.getEvents()).toHaveLength(0);
    
    service.enable();
    service.track('test_event');
    
    expect(service.getEvents()).toHaveLength(1);
  });

  it('should reset service', () => {
    service.identify('user123');
    service.track('event1');
    
    const oldSessionId = service.getSessionId();
    
    service.reset();
    
    expect(service.getEvents()).toHaveLength(0);
    expect(service.getSessionId()).not.toBe(oldSessionId);
    
    service.track('event2');
    const events = service.getEvents();
    expect(events[0].userId).toBeUndefined();
  });

  it('should handle debug mode', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    service.setDebugMode(true);
    service.track('debug_event');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Analytics Event:',
      expect.objectContaining({ event: 'debug_event' })
    );
    
    consoleSpy.mockRestore();
  });

  it('should generate unique session IDs', () => {
    const service1 = new AnalyticsService();
    const service2 = new AnalyticsService();
    
    expect(service1.getSessionId()).not.toBe(service2.getSessionId());
  });
});
