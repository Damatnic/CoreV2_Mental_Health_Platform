/**
 * Privacy Analytics Hook
 *
 * HIPAA-compliant analytics hook for mental health platform.
 * Provides privacy-preserving analytics with user consent management,
 * data anonymization, and secure data handling for therapeutic insights.
 *
 * @fileoverview Privacy-compliant analytics with anonymization and consent management
 * @version 2.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';
import { secureStorage } from '../services/secureStorageService';

export type AnalyticsEvent = 
  | 'mood_entry'
  | 'journal_entry'
  | 'breathing_exercise'
  | 'meditation_session'
  | 'therapy_session'
  | 'crisis_resource_access'
  | 'peer_support_interaction'
  | 'goal_completion'
  | 'assessment_completion'
  | 'feature_usage'
  | 'user_journey'
  | 'performance_metric';

export type ConsentLevel = 'none' | 'essential' | 'functional' | 'analytics' | 'all';

export interface AnalyticsData {
  event: AnalyticsEvent;
  timestamp: Date;
  sessionId: string;
  userId?: string; // Hashed/anonymized
  properties: Record<string, any>;
  context: AnalyticsContext;
  consentLevel: ConsentLevel;
  anonymized: boolean;
  encrypted: boolean;
}

export interface AnalyticsContext {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  sessionDuration: number;
  pageUrl: string;
  referrer?: string;
  networkType?: string;
}

export interface PrivacySettings {
  consentLevel: ConsentLevel;
  dataRetentionDays: number;
  allowPersonalization: boolean;
  allowPerformanceTracking: boolean;
  allowFunctionalAnalytics: boolean;
  allowResearchParticipation: boolean;
  anonymizeData: boolean;
  encryptData: boolean;
  shareWithThirdParties: boolean;
  optOutOfTargeting: boolean;
}

export interface AnalyticsMetrics {
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  eventsByType: Record<AnalyticsEvent, number>;
  privacyCompliantEvents: number;
  anonymizedEvents: number;
  encryptedEvents: number;
  consentLevelDistribution: Record<ConsentLevel, number>;
}

export interface DataExportOptions {
  format: 'json' | 'csv';
  includePersonalData: boolean;
  anonymizeExport: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  eventTypes?: AnalyticsEvent[];
}

export interface UsePrivacyAnalyticsReturn {
  // Analytics functions
  trackEvent: (event: AnalyticsEvent, properties?: Record<string, any>) => Promise<void>;
  trackMoodEntry: (mood: string, intensity: number, context?: Record<string, any>) => Promise<void>;
  trackTherapySession: (duration: number, type: string, effectiveness: number) => Promise<void>;
  trackCrisisResourceAccess: (resource: string, context?: Record<string, any>) => Promise<void>;
  trackFeatureUsage: (feature: string, duration: number, context?: Record<string, any>) => Promise<void>;
  
  // Privacy management
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  requestDataExport: (options: DataExportOptions) => Promise<Blob>;
  requestDataDeletion: (categories?: string[]) => Promise<boolean>;
  
  // Consent management
  giveConsent: (level: ConsentLevel) => Promise<void>;
  revokeConsent: () => Promise<void>;
  updateConsent: (level: ConsentLevel) => Promise<void>;
  
  // Data access
  getAnalyticsMetrics: () => AnalyticsMetrics;
  getPrivacySettings: () => PrivacySettings;
  getStoredEvents: (limit?: number) => AnalyticsData[];
  
  // State
  privacySettings: PrivacySettings;
  consentGiven: boolean;
  isTracking: boolean;
  error: string | null;
  loading: boolean;
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  consentLevel: 'none',
  dataRetentionDays: 90,
  allowPersonalization: false,
  allowPerformanceTracking: false,
  allowFunctionalAnalytics: false,
  allowResearchParticipation: false,
  anonymizeData: true,
  encryptData: true,
  shareWithThirdParties: false,
  optOutOfTargeting: true
};

export const usePrivacyAnalytics = (): UsePrivacyAnalyticsReturn => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const sessionId = useRef<string>('');
  const analyticsQueue = useRef<AnalyticsData[]>([]);
  const batchTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize analytics service
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        setLoading(true);
        
        // Generate session ID
        sessionId.current = generateSessionId();
        
        // Load privacy settings
        await loadPrivacySettings();
        
        // Load consent status
        await loadConsentStatus();
        
        // Start batch processing
        startBatchProcessing();
        
        // Clean up old data
        await cleanupOldData();
        
        setIsTracking(true);
        logger.info('Privacy analytics initialized');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize analytics';
        setError(errorMessage);
        logger.error('Failed to initialize privacy analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAnalytics();

    // Cleanup on unmount
    return () => {
      if (batchTimer.current) {
        clearInterval(batchTimer.current);
      }
      processBatch(); // Process any remaining events
    };
  }, []);

  // Load privacy settings from storage
  const loadPrivacySettings = async (): Promise<void> => {
    try {
      const stored = await secureStorage.getItem('privacy-analytics-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        setPrivacySettings({ ...DEFAULT_PRIVACY_SETTINGS, ...settings });
      }
    } catch (err) {
      logger.error('Failed to load privacy settings:', err);
      setPrivacySettings(DEFAULT_PRIVACY_SETTINGS);
    }
  };

  // Load consent status from storage
  const loadConsentStatus = async (): Promise<void> => {
    try {
      const consentData = await secureStorage.getItem('analytics-consent');
      if (consentData) {
        const consent = JSON.parse(consentData);
        setConsentGiven(consent.given && consent.level !== 'none');
      }
    } catch (err) {
      logger.error('Failed to load consent status:', err);
      setConsentGiven(false);
    }
  };

  // Save privacy settings to storage
  const savePrivacySettings = async (settings: PrivacySettings): Promise<void> => {
    try {
      await secureStorage.setItem('privacy-analytics-settings', JSON.stringify(settings));
      setPrivacySettings(settings);
    } catch (err) {
      logger.error('Failed to save privacy settings:', err);
      throw new Error('Failed to save privacy settings');
    }
  };

  // Save consent status to storage
  const saveConsentStatus = async (given: boolean, level: ConsentLevel): Promise<void> => {
    try {
      const consentData = {
        given,
        level,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      await secureStorage.setItem('analytics-consent', JSON.stringify(consentData));
      setConsentGiven(given && level !== 'none');
    } catch (err) {
      logger.error('Failed to save consent status:', err);
      throw new Error('Failed to save consent status');
    }
  };

  // Check if tracking is allowed for a specific event
  const isTrackingAllowed = (event: AnalyticsEvent): boolean => {
    if (!consentGiven || privacySettings.consentLevel === 'none') {
      return false;
    }

    // Essential events are always allowed
    const essentialEvents: AnalyticsEvent[] = ['crisis_resource_access'];
    if (essentialEvents.includes(event)) {
      return true;
    }

    // Functional events require functional consent
    const functionalEvents: AnalyticsEvent[] = [
      'mood_entry',
      'journal_entry',
      'therapy_session',
      'goal_completion'
    ];
    if (functionalEvents.includes(event) && privacySettings.consentLevel === 'essential') {
      return false;
    }

    // Analytics events require analytics consent
    const analyticsEvents: AnalyticsEvent[] = [
      'feature_usage',
      'user_journey',
      'performance_metric'
    ];
    if (analyticsEvents.includes(event) && 
        !['analytics', 'all'].includes(privacySettings.consentLevel)) {
      return false;
    }

    return true;
  };

  // Anonymize user data
  const anonymizeData = (data: any): any => {
    if (!privacySettings.anonymizeData) {
      return data;
    }

    const anonymized = { ...data };

    // Remove or hash personally identifiable information
    if (anonymized.userId) {
      anonymized.userId = hashString(anonymized.userId);
    }

    if (anonymized.email) {
      delete anonymized.email;
    }

    if (anonymized.name) {
      delete anonymized.name;
    }

    if (anonymized.ipAddress) {
      delete anonymized.ipAddress;
    }

    // Generalize sensitive properties
    if (anonymized.age && typeof anonymized.age === 'number') {
      anonymized.ageGroup = getAgeGroup(anonymized.age);
      delete anonymized.age;
    }

    if (anonymized.location) {
      // Keep only general location (city/state)
      anonymized.generalLocation = generalizeLocation(anonymized.location);
      delete anonymized.location;
    }

    return anonymized;
  };

  // Create analytics context
  const createAnalyticsContext = (): AnalyticsContext => {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      sessionDuration: Date.now() - parseInt(sessionId.current.split('-')[1]),
      pageUrl: window.location.pathname,
      referrer: document.referrer || undefined,
      networkType: (navigator as any).connection?.effectiveType || undefined
    };
  };

  // Track an analytics event
  const trackEvent = useCallback(async (
    event: AnalyticsEvent,
    properties: Record<string, any> = {}
  ): Promise<void> => {
    try {
      if (!isTrackingAllowed(event)) {
        return;
      }

      // Create analytics data
      const analyticsData: AnalyticsData = {
        event,
        timestamp: new Date(),
        sessionId: sessionId.current,
        userId: privacySettings.anonymizeData ? 
          hashString(await secureStorage.getItem('userId') || 'anonymous') :
          await secureStorage.getItem('userId') || undefined,
        properties: anonymizeData(properties),
        context: createAnalyticsContext(),
        consentLevel: privacySettings.consentLevel,
        anonymized: privacySettings.anonymizeData,
        encrypted: privacySettings.encryptData
      };

      // Add to batch queue
      analyticsQueue.current.push(analyticsData);

      // Process immediately for critical events
      if (event === 'crisis_resource_access') {
        await processBatch();
      }

    } catch (err) {
      logger.error('Failed to track event:', err);
      setError(err instanceof Error ? err.message : 'Failed to track event');
    }
  }, [consentGiven, privacySettings]);

  // Specialized tracking methods
  const trackMoodEntry = useCallback(async (
    mood: string,
    intensity: number,
    context: Record<string, any> = {}
  ): Promise<void> => {
    await trackEvent('mood_entry', {
      mood,
      intensity,
      ...context
    });
  }, [trackEvent]);

  const trackTherapySession = useCallback(async (
    duration: number,
    type: string,
    effectiveness: number
  ): Promise<void> => {
    await trackEvent('therapy_session', {
      duration,
      type,
      effectiveness,
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  const trackCrisisResourceAccess = useCallback(async (
    resource: string,
    context: Record<string, any> = {}
  ): Promise<void> => {
    await trackEvent('crisis_resource_access', {
      resource,
      urgency: 'high',
      ...context
    });
  }, [trackEvent]);

  const trackFeatureUsage = useCallback(async (
    feature: string,
    duration: number,
    context: Record<string, any> = {}
  ): Promise<void> => {
    await trackEvent('feature_usage', {
      feature,
      duration,
      ...context
    });
  }, [trackEvent]);

  // Process batch of analytics events
  const processBatch = async (): Promise<void> => {
    if (analyticsQueue.current.length === 0) {
      return;
    }

    try {
      const events = [...analyticsQueue.current];
      analyticsQueue.current = [];

      // Store events locally
      await storeEvents(events);

      // Send to analytics service if consent allows
      if (privacySettings.consentLevel === 'all' || 
          privacySettings.allowPerformanceTracking) {
        await sendToAnalyticsService(events);
      }

    } catch (err) {
      logger.error('Failed to process analytics batch:', err);
      // Put events back in queue for retry
      analyticsQueue.current.unshift(...analyticsQueue.current);
    }
  };

  // Store events locally
  const storeEvents = async (events: AnalyticsData[]): Promise<void> => {
    try {
      const existingEvents = await getStoredEvents();
      const allEvents = [...existingEvents, ...events];

      // Limit storage to prevent overflow
      const maxEvents = 1000;
      const eventsToStore = allEvents.slice(-maxEvents);

      let dataToStore = JSON.stringify(eventsToStore);

      // Encrypt if required
      if (privacySettings.encryptData) {
        dataToStore = await encryptData(dataToStore);
      }

      await secureStorage.setItem('analytics-events', dataToStore);
    } catch (err) {
      logger.error('Failed to store analytics events:', err);
    }
  };

  // Send events to analytics service
  const sendToAnalyticsService = async (events: AnalyticsData[]): Promise<void> => {
    try {
      // In a real implementation, this would send to an analytics service
      // For now, just log the events
      logger.info(`Sending ${events.length} analytics events to service`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      logger.error('Failed to send events to analytics service:', err);
    }
  };

  // Start batch processing timer
  const startBatchProcessing = (): void => {
    batchTimer.current = setInterval(() => {
      processBatch();
    }, 30000); // Process every 30 seconds
  };

  // Privacy management methods
  const updatePrivacySettings = useCallback(async (
    settings: Partial<PrivacySettings>
  ): Promise<void> => {
    try {
      const newSettings = { ...privacySettings, ...settings };
      await savePrivacySettings(newSettings);
      
      // If consent level changed, update consent status
      if (settings.consentLevel !== undefined) {
        await saveConsentStatus(settings.consentLevel !== 'none', settings.consentLevel);
      }
    } catch (err) {
      logger.error('Failed to update privacy settings:', err);
      throw err;
    }
  }, [privacySettings]);

  // Consent management methods
  const giveConsent = useCallback(async (level: ConsentLevel): Promise<void> => {
    try {
      await saveConsentStatus(true, level);
      await updatePrivacySettings({ consentLevel: level });
    } catch (err) {
      logger.error('Failed to give consent:', err);
      throw err;
    }
  }, [updatePrivacySettings]);

  const revokeConsent = useCallback(async (): Promise<void> => {
    try {
      await saveConsentStatus(false, 'none');
      await updatePrivacySettings({ consentLevel: 'none' });
      
      // Clear stored analytics data
      await secureStorage.removeItem('analytics-events');
    } catch (err) {
      logger.error('Failed to revoke consent:', err);
      throw err;
    }
  }, [updatePrivacySettings]);

  const updateConsent = useCallback(async (level: ConsentLevel): Promise<void> => {
    try {
      await saveConsentStatus(level !== 'none', level);
      await updatePrivacySettings({ consentLevel: level });
    } catch (err) {
      logger.error('Failed to update consent:', err);
      throw err;
    }
  }, [updatePrivacySettings]);

  // Data access methods
  const getAnalyticsMetrics = useCallback((): AnalyticsMetrics => {
    try {
      const events = getStoredEvents();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const metrics: AnalyticsMetrics = {
        totalEvents: events.length,
        eventsToday: events.filter(e => new Date(e.timestamp) >= today).length,
        eventsThisWeek: events.filter(e => new Date(e.timestamp) >= thisWeek).length,
        eventsThisMonth: events.filter(e => new Date(e.timestamp) >= thisMonth).length,
        eventsByType: {} as Record<AnalyticsEvent, number>,
        privacyCompliantEvents: events.filter(e => e.consentLevel !== 'none').length,
        anonymizedEvents: events.filter(e => e.anonymized).length,
        encryptedEvents: events.filter(e => e.encrypted).length,
        consentLevelDistribution: {} as Record<ConsentLevel, number>
      };

      // Count events by type
      events.forEach(event => {
        metrics.eventsByType[event.event] = (metrics.eventsByType[event.event] || 0) + 1;
        metrics.consentLevelDistribution[event.consentLevel] = 
          (metrics.consentLevelDistribution[event.consentLevel] || 0) + 1;
      });

      return metrics;
    } catch (err) {
      logger.error('Failed to get analytics metrics:', err);
      return {
        totalEvents: 0,
        eventsToday: 0,
        eventsThisWeek: 0,
        eventsThisMonth: 0,
        eventsByType: {} as Record<AnalyticsEvent, number>,
        privacyCompliantEvents: 0,
        anonymizedEvents: 0,
        encryptedEvents: 0,
        consentLevelDistribution: {} as Record<ConsentLevel, number>
      };
    }
  }, []);

  const getStoredEvents = useCallback((limit?: number): AnalyticsData[] => {
    try {
      const stored = secureStorage.getItem('analytics-events');
      if (!stored) {
        return [];
      }

      let data = stored;
      
      // Decrypt if encrypted
      if (privacySettings.encryptData && data.startsWith('encrypted:')) {
        data = decryptData(data);
      }

      const events: AnalyticsData[] = JSON.parse(data);
      
      // Convert timestamp strings back to Date objects
      const parsedEvents = events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }));

      return limit ? parsedEvents.slice(-limit) : parsedEvents;
    } catch (err) {
      logger.error('Failed to get stored events:', err);
      return [];
    }
  }, [privacySettings.encryptData]);

  // Data export method
  const requestDataExport = useCallback(async (
    options: DataExportOptions
  ): Promise<Blob> => {
    try {
      let events = getStoredEvents();

      // Filter by date range
      if (options.dateRange) {
        events = events.filter(event => {
          const eventDate = new Date(event.timestamp);
          return eventDate >= options.dateRange!.start && eventDate <= options.dateRange!.end;
        });
      }

      // Filter by event types
      if (options.eventTypes) {
        events = events.filter(event => options.eventTypes!.includes(event.event));
      }

      // Anonymize export if requested
      if (options.anonymizeExport) {
        events = events.map(event => ({
          ...event,
          userId: event.userId ? hashString(event.userId) : undefined,
          properties: anonymizeData(event.properties)
        }));
      }

      // Remove personal data if not included
      if (!options.includePersonalData) {
        events = events.map(event => ({
          ...event,
          userId: undefined,
          context: {
            ...event.context,
            userAgent: 'redacted',
            pageUrl: 'redacted'
          }
        }));
      }

      // Generate export data
      let exportData: string;
      if (options.format === 'csv') {
        exportData = convertToCSV(events);
      } else {
        exportData = JSON.stringify(events, null, 2);
      }

      return new Blob([exportData], { 
        type: options.format === 'csv' ? 'text/csv' : 'application/json' 
      });
    } catch (err) {
      logger.error('Failed to export data:', err);
      throw new Error('Failed to export data');
    }
  }, [getStoredEvents, anonymizeData]);

  // Data deletion method
  const requestDataDeletion = useCallback(async (
    categories?: string[]
  ): Promise<boolean> => {
    try {
      if (!categories || categories.length === 0) {
        // Delete all analytics data
        await secureStorage.removeItem('analytics-events');
        await secureStorage.removeItem('analytics-consent');
        await secureStorage.removeItem('privacy-analytics-settings');
        
        // Reset state
        setPrivacySettings(DEFAULT_PRIVACY_SETTINGS);
        setConsentGiven(false);
        analyticsQueue.current = [];
        
        return true;
      } else {
        // Selective deletion (simplified implementation)
        const events = getStoredEvents();
        const filteredEvents = events.filter(event => 
          !categories.includes(event.event)
        );
        
        await storeEvents(filteredEvents);
        return true;
      }
    } catch (err) {
      logger.error('Failed to delete data:', err);
      return false;
    }
  }, [getStoredEvents]);

  // Cleanup old data
  const cleanupOldData = async (): Promise<void> => {
    try {
      const events = getStoredEvents();
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - privacySettings.dataRetentionDays);

      const filteredEvents = events.filter(event => 
        new Date(event.timestamp) >= retentionDate
      );

      if (filteredEvents.length !== events.length) {
        await storeEvents(filteredEvents);
        logger.info(`Cleaned up ${events.length - filteredEvents.length} old analytics events`);
      }
    } catch (err) {
      logger.error('Failed to cleanup old data:', err);
    }
  };

  // Utility functions
  const generateSessionId = (): string => {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const hashString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const getAgeGroup = (age: number): string => {
    if (age < 18) return '0-17';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  };

  const generalizeLocation = (location: string): string => {
    // Return only city/state, remove specific addresses
    const parts = location.split(',');
    return parts.slice(-2).join(',').trim();
  };

  const encryptData = async (data: string): Promise<string> => {
    // Simplified encryption (use proper encryption in production)
    const encoded = btoa(data);
    return `encrypted:${encoded}`;
  };

  const decryptData = (encryptedData: string): string => {
    // Simplified decryption
    const encoded = encryptedData.replace('encrypted:', '');
    return atob(encoded);
  };

  const convertToCSV = (events: AnalyticsData[]): string => {
    if (events.length === 0) return '';

    const headers = [
      'timestamp',
      'event',
      'sessionId',
      'userId',
      'consentLevel',
      'anonymized',
      'encrypted'
    ];

    const csvContent = [
      headers.join(','),
      ...events.map(event => [
        event.timestamp.toISOString(),
        event.event,
        event.sessionId,
        event.userId || '',
        event.consentLevel,
        event.anonymized.toString(),
        event.encrypted.toString()
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  return {
    // Analytics functions
    trackEvent,
    trackMoodEntry,
    trackTherapySession,
    trackCrisisResourceAccess,
    trackFeatureUsage,
    
    // Privacy management
    updatePrivacySettings,
    requestDataExport,
    requestDataDeletion,
    
    // Consent management
    giveConsent,
    revokeConsent,
    updateConsent,
    
    // Data access
    getAnalyticsMetrics,
    getPrivacySettings: () => privacySettings,
    getStoredEvents,
    
    // State
    privacySettings,
    consentGiven,
    isTracking,
    error,
    loading
  };
};
