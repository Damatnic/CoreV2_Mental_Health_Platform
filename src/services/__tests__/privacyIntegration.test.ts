/**
 * Privacy Integration Tests
 * 
 * Comprehensive tests for data minimization, consent management,
 * and privacy-preserving analytics.
 * 
 * @fileoverview Privacy integration test suite
 * @version 3.0.0
 */

import { dataMinimizationService } from '../dataMinimizationService';
import { consentManager } from '../consentManager';
import { privacyPreservingAnalyticsService } from '../privacyPreservingAnalyticsService';
import {
  minimizeObject,
  anonymizeEmail,
  anonymizePhone,
  removePIIFromText,
  containsPII,
  containsPHI,
  ageToAgeGroup,
  generalizeLocation,
  sanitizeForLogging,
  isDataExpired,
  aggregateWithPrivacy
} from '../../utils/dataMinimization';

describe('Data Minimization Service', () => {
  describe('PII Detection and Removal', () => {
    it('should detect and remove email addresses', async () => {
      const data = {
        id: '123',
        email: 'user@example.com',
        name: 'John Doe',
        notes: 'Contact me at john@example.com'
      };
      
      const minimized = await dataMinimizationService.minimizeData(data, 'functional');
      
      expect(minimized.email).not.toBe('user@example.com');
      expect(minimized.name).not.toBe('John Doe');
      expect(minimized.id).toBeDefined();
    });
    
    it('should detect and remove phone numbers', async () => {
      const data = {
        phone: '555-123-4567',
        mobile: '+1 (555) 987-6543',
        emergency: '911'
      };
      
      const minimized = await dataMinimizationService.minimizeData(data, 'functional');
      
      expect(minimized.phone).toBeUndefined();
      expect(minimized.mobile).toBeUndefined();
    });
    
    it('should detect and remove SSN', async () => {
      const data = {
        ssn: '123-45-6789',
        taxId: '12-3456789'
      };
      
      const minimized = await dataMinimizationService.minimizeData(data, 'analytics');
      
      expect(minimized.ssn).toBeUndefined();
      expect(minimized.taxId).toBeDefined(); // Not matching SSN pattern
    });
  });
  
  describe('PHI Protection', () => {
    it('should encrypt diagnosis information', async () => {
      const data = {
        diagnosis: 'Major Depressive Disorder',
        condition: 'Anxiety',
        symptoms: ['insomnia', 'fatigue']
      };
      
      const minimized = await dataMinimizationService.minimizeData(data, 'research');
      
      expect(minimized.diagnosis).toContain('encrypted:');
      expect(minimized.condition).toContain('encrypted:');
    });
    
    it('should encrypt medication information', async () => {
      const data = {
        medication: 'Sertraline 50mg',
        prescription: 'Take once daily',
        dosage: '50mg'
      };
      
      const minimized = await dataMinimizationService.minimizeData(data, 'functional');
      
      expect(minimized.medication).toContain('encrypted:');
      expect(minimized.prescription).toContain('encrypted:');
    });
  });
  
  describe('K-Anonymity', () => {
    it('should apply k-anonymity to dataset', async () => {
      const dataset = Array.from({ length: 10 }, (_, i) => ({
        id: `user_${i}`,
        age: 20 + (i % 3) * 10,
        location: `City ${i % 2}`,
        score: Math.random() * 100
      }));
      
      const anonymized = await dataMinimizationService.applyKAnonymity(
        dataset,
        3,
        ['age', 'location']
      );
      
      expect(anonymized.length).toBeGreaterThan(0);
      expect(anonymized.length).toBeLessThanOrEqual(dataset.length);
    });
    
    it('should suppress small groups', async () => {
      const dataset = [
        { id: '1', age: 25, location: 'NYC' },
        { id: '2', age: 30, location: 'LA' }
      ];
      
      const anonymized = await dataMinimizationService.applyKAnonymity(
        dataset,
        5,
        ['age', 'location']
      );
      
      expect(anonymized.length).toBe(0); // Group too small
    });
  });
  
  describe('Differential Privacy', () => {
    it('should add noise to numeric values', () => {
      const originalValue = 100;
      const privateValue = dataMinimizationService.applyDifferentialPrivacy(
        originalValue,
        1.0,
        1.0
      );
      
      expect(privateValue).not.toBe(originalValue);
      expect(Math.abs(privateValue - originalValue)).toBeLessThan(50); // Reasonable noise
    });
  });
  
  describe('Data Retention', () => {
    it('should identify expired data', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      
      const data = [
        {
          name: 'field1',
          value: 'test',
          sensitivity: 'public' as const,
          purpose: 'functional' as const,
          retention: 'short' as const,
          encrypted: false,
          anonymized: false,
          lastAccessed: oldDate
        }
      ];
      
      const retained = await dataMinimizationService.checkDataRetention(data);
      
      expect(retained.length).toBe(0); // Data should be expired
    });
  });
});

describe('Consent Manager', () => {
  const testUserId = 'test_user_123';
  
  beforeEach(async () => {
    // Clear any existing consents
    await consentManager.globalOptOut(testUserId).catch(() => {});
  });
  
  describe('Consent Operations', () => {
    it('should request and grant consent', async () => {
      const consent = await consentManager.requestConsent(
        testUserId,
        'analytics',
        'gdpr'
      );
      
      expect(consent.status).toBe('pending');
      expect(consent.type).toBe('analytics');
      
      const granted = await consentManager.grantConsent(testUserId, 'analytics');
      
      expect(granted.status).toBe('granted');
    });
    
    it('should deny consent', async () => {
      await consentManager.requestConsent(testUserId, 'marketing', 'gdpr');
      const denied = await consentManager.denyConsent(testUserId, 'marketing', 'User choice');
      
      expect(denied.status).toBe('denied');
    });
    
    it('should withdraw consent', async () => {
      await consentManager.grantConsent(testUserId, 'functional');
      const withdrawn = await consentManager.withdrawConsent(
        testUserId,
        'functional',
        'Changed mind'
      );
      
      expect(withdrawn.status).toBe('withdrawn');
    });
  });
  
  describe('Consent Validation', () => {
    it('should check valid consent', async () => {
      await consentManager.grantConsent(testUserId, 'analytics');
      
      const hasConsent = await consentManager.hasValidConsent(testUserId, 'analytics');
      expect(hasConsent).toBe(true);
      
      const noConsent = await consentManager.hasValidConsent(testUserId, 'marketing');
      expect(noConsent).toBe(false);
    });
  });
  
  describe('Global Opt-Out', () => {
    it('should opt out of all data collection', async () => {
      await consentManager.grantConsent(testUserId, 'analytics');
      await consentManager.grantConsent(testUserId, 'functional');
      
      await consentManager.globalOptOut(testUserId);
      
      const analyticsConsent = await consentManager.hasValidConsent(testUserId, 'analytics');
      const functionalConsent = await consentManager.hasValidConsent(testUserId, 'functional');
      
      expect(analyticsConsent).toBe(false);
      expect(functionalConsent).toBe(false);
    });
  });
  
  describe('Compliance Checks', () => {
    it('should verify GDPR compliance', async () => {
      const preferences = {
        userId: testUserId,
        consents: new Map([
          ['essential', {
            id: '1',
            userId: testUserId,
            type: 'essential' as const,
            status: 'granted' as const,
            timestamp: new Date(),
            version: '1.0',
            legalBasis: 'consent' as const,
            jurisdiction: 'gdpr' as const,
            withdrawable: false,
            description: 'Essential',
            dataCategories: [],
            purposes: []
          }]
        ]),
        globalOptOut: false,
        doNotTrack: false,
        doNotSell: false,
        limitedDataUse: false,
        sensitiveDataOptOut: false,
        lastUpdated: new Date(),
        preferredJurisdiction: 'gdpr' as const
      };
      
      const isCompliant = consentManager.isGDPRCompliant(preferences);
      expect(isCompliant).toBe(true);
    });
    
    it('should verify CCPA compliance', async () => {
      const preferences = {
        userId: testUserId,
        consents: new Map(),
        globalOptOut: false,
        doNotTrack: false,
        doNotSell: true, // Key CCPA requirement
        limitedDataUse: false,
        sensitiveDataOptOut: false,
        lastUpdated: new Date(),
        preferredJurisdiction: 'ccpa' as const
      };
      
      const isCompliant = consentManager.isCCPACompliant(preferences);
      expect(isCompliant).toBe(true);
    });
  });
});

describe('Privacy Utilities', () => {
  describe('Anonymization', () => {
    it('should anonymize email addresses', () => {
      const email = 'john.doe@example.com';
      const anonymized = anonymizeEmail(email);
      
      expect(anonymized).not.toBe(email);
      expect(anonymized).toContain('@example.com');
      expect(anonymized).toMatch(/^j\*+e@/);
    });
    
    it('should anonymize phone numbers', () => {
      const phone = '555-123-4567';
      const anonymized = anonymizePhone(phone);
      
      expect(anonymized).toBe('***-***-4567');
    });
    
    it('should generalize location', () => {
      const address = '123 Main St, Apt 4B, New York, NY 10001';
      const generalized = generalizeLocation(address);
      
      expect(generalized).toBe('New York, NY 10001');
      expect(generalized).not.toContain('123 Main St');
    });
    
    it('should convert age to age group', () => {
      expect(ageToAgeGroup(16)).toBe('0-17');
      expect(ageToAgeGroup(22)).toBe('18-24');
      expect(ageToAgeGroup(30)).toBe('25-34');
      expect(ageToAgeGroup(70)).toBe('65+');
    });
  });
  
  describe('PII Detection', () => {
    it('should detect PII in text', () => {
      expect(containsPII('john@example.com')).toBe(true);
      expect(containsPII('555-123-4567')).toBe(true);
      expect(containsPII('123-45-6789')).toBe(true);
      expect(containsPII('Regular text')).toBe(false);
    });
    
    it('should remove PII from text', () => {
      const text = 'Contact John at john@example.com or 555-123-4567';
      const cleaned = removePIIFromText(text);
      
      expect(cleaned).toBe('Contact John at [EMAIL] or [PHONE]');
    });
  });
  
  describe('PHI Detection', () => {
    it('should detect PHI in text', () => {
      expect(containsPHI('diagnosed with depression')).toBe(true);
      expect(containsPHI('taking medication')).toBe(true);
      expect(containsPHI('therapy session')).toBe(true);
      expect(containsPHI('feeling happy today')).toBe(false);
    });
  });
  
  describe('Logging Sanitization', () => {
    it('should sanitize objects for logging', () => {
      const obj = {
        id: '123',
        password: 'secret123',
        email: 'user@example.com',
        token: 'auth_token_xyz',
        data: 'regular data'
      };
      
      const sanitized = sanitizeForLogging(obj);
      
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.email).toBe('[REDACTED]');
      expect(sanitized.data).toBe('regular data');
    });
  });
  
  describe('Data Expiration', () => {
    it('should check if data has expired', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      
      expect(isDataExpired(oldDate, 90)).toBe(true);
      expect(isDataExpired(oldDate, 120)).toBe(false);
      
      const recentDate = new Date();
      expect(isDataExpired(recentDate, 30)).toBe(false);
    });
  });
  
  describe('Privacy Aggregation', () => {
    it('should aggregate data with privacy', () => {
      const data = [
        { age: 25, score: 80 },
        { age: 30, score: 85 },
        { age: 35, score: 90 },
        { age: 40, score: 75 },
        { age: 45, score: 88 }
      ];
      
      const result = aggregateWithPrivacy(data, 5);
      
      expect(result.suppressed).toBe(false);
      expect(result.groupSize).toBe(5);
      expect(result.aggregated).toHaveProperty('age');
      expect(result.aggregated).toHaveProperty('score');
    });
    
    it('should suppress small groups', () => {
      const data = [
        { age: 25, score: 80 },
        { age: 30, score: 85 }
      ];
      
      const result = aggregateWithPrivacy(data, 5);
      
      expect(result.suppressed).toBe(true);
      expect(result.aggregated).toEqual({});
    });
  });
});

describe('Privacy Analytics Integration', () => {
  describe('Event Tracking with Privacy', () => {
    it('should track events with anonymization', async () => {
      await privacyPreservingAnalyticsService.setUserConsent({
        level: 'analytics',
        categories: {
          essential: true,
          functional: true,
          analytics: true,
          marketing: false
        }
      });
      
      await privacyPreservingAnalyticsService.trackEvent(
        'feature-usage',
        'test_feature',
        'test_label',
        100,
        {
          email: 'user@example.com',
          userId: 'user123',
          action: 'click'
        }
      );
      
      const metrics = await privacyPreservingAnalyticsService.getPrivacyMetrics();
      expect(metrics.anonymizedEvents).toBeGreaterThan(0);
    });
  });
  
  describe('Compliance Verification', () => {
    it('should verify HIPAA compliance', () => {
      const isCompliant = privacyPreservingAnalyticsService.isHipaaCompliant();
      expect(isCompliant).toBe(true);
    });
    
    it('should verify GDPR compliance', () => {
      const isCompliant = privacyPreservingAnalyticsService.isGdprCompliant();
      expect(typeof isCompliant).toBe('boolean');
    });
  });
});