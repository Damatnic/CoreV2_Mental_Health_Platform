import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  anonymousId: string;
}

const usePrivacyAnalytics = (userId?: string) => {
  const [events, setEvents] = React.useState<AnalyticsEvent[]>([]);
  const [consentGiven, setConsentGiven] = React.useState(false);
  const [anonymousId] = React.useState(() => `anon-${Math.random().toString(36).substr(2, 9)}`);

  React.useEffect(() => {
    const savedConsent = localStorage.getItem('analytics-consent');
    setConsentGiven(savedConsent === 'true');
  }, []);

  const trackEvent = React.useCallback((event: string, properties?: Record<string, any>) => {
    if (!consentGiven) return;

    const sanitizedProperties = properties ? sanitizeData(properties) : {};
    
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: sanitizedProperties,
      timestamp: Date.now(),
      anonymousId: userId || anonymousId
    };

    setEvents(prev => [...prev, analyticsEvent]);
    
    // Send to analytics service
    console.log('Analytics event:', analyticsEvent);
  }, [consentGiven, userId, anonymousId]);

  const sanitizeData = (data: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Remove PII fields
      if (['email', 'phone', 'ssn', 'name'].includes(key.toLowerCase())) {
        continue;
      }
      sanitized[key] = value;
    }
    
    return sanitized;
  };

  const giveConsent = React.useCallback(() => {
    setConsentGiven(true);
    localStorage.setItem('analytics-consent', 'true');
  }, []);

  const revokeConsent = React.useCallback(() => {
    setConsentGiven(false);
    localStorage.setItem('analytics-consent', 'false');
    setEvents([]);
  }, []);

  return {
    trackEvent,
    events,
    consentGiven,
    giveConsent,
    revokeConsent,
    anonymousId
  };
};

describe('usePrivacyAnalytics', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should not track without consent', () => {
    const { result } = renderHook(() => usePrivacyAnalytics());
    
    act(() => {
      result.current.trackEvent('test_event');
    });
    
    expect(result.current.events).toHaveLength(0);
  });

  it('should track events with consent', () => {
    const { result } = renderHook(() => usePrivacyAnalytics());
    
    act(() => {
      result.current.giveConsent();
    });
    
    act(() => {
      result.current.trackEvent('test_event', { action: 'click' });
    });
    
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].event).toBe('test_event');
  });

  it('should sanitize PII from properties', () => {
    const { result } = renderHook(() => usePrivacyAnalytics());
    
    act(() => {
      result.current.giveConsent();
    });
    
    act(() => {
      result.current.trackEvent('user_action', {
        email: 'user@example.com',
        action: 'submit',
        phone: '555-1234'
      });
    });
    
    const event = result.current.events[0];
    expect(event.properties?.email).toBeUndefined();
    expect(event.properties?.phone).toBeUndefined();
    expect(event.properties?.action).toBe('submit');
  });

  it('should persist consent in localStorage', () => {
    const { result } = renderHook(() => usePrivacyAnalytics());
    
    act(() => {
      result.current.giveConsent();
    });
    
    expect(localStorage.getItem('analytics-consent')).toBe('true');
  });

  it('should revoke consent and clear events', () => {
    const { result } = renderHook(() => usePrivacyAnalytics());
    
    act(() => {
      result.current.giveConsent();
      result.current.trackEvent('test_event');
    });
    
    expect(result.current.events).toHaveLength(1);
    
    act(() => {
      result.current.revokeConsent();
    });
    
    expect(result.current.consentGiven).toBe(false);
    expect(result.current.events).toHaveLength(0);
  });

  it('should generate anonymous ID', () => {
    const { result } = renderHook(() => usePrivacyAnalytics());
    
    expect(result.current.anonymousId).toMatch(/^anon-[a-z0-9]+$/);
  });
});
