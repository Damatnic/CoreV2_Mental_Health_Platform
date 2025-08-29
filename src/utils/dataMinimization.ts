/**
 * Data Minimization Utilities
 * 
 * Helper functions for data minimization, anonymization, and privacy-preserving
 * operations throughout the mental health platform.
 * 
 * @fileoverview Data minimization utility functions
 * @version 3.0.0
 */

import { dataMinimizationService, DataPurpose } from '../services/dataMinimizationService';
import { logger } from './logger';

/**
 * Minimize object before storage or transmission
 */
export async function minimizeObject<T extends Record<string, any>>(
  obj: T,
  purpose: DataPurpose = 'functional'
): Promise<Partial<T>> {
  try {
    const minimized = await dataMinimizationService.minimizeData(obj, purpose);
    return minimized as Partial<T>;
  } catch (error) {
    logger.error('Failed to minimize object:', error);
    return obj;
  }
}

/**
 * Minimize array of objects
 */
export async function minimizeArray<T extends Record<string, any>>(
  arr: T[],
  purpose: DataPurpose = 'functional'
): Promise<Partial<T>[]> {
  const minimizedArray: Partial<T>[] = [];
  
  for (const item of arr) {
    const minimized = await minimizeObject(item, purpose);
    minimizedArray.push(minimized);
  }
  
  return minimizedArray;
}

/**
 * Apply k-anonymity to dataset
 */
export async function anonymizeDataset<T extends Record<string, any>>(
  dataset: T[],
  k: number = 5,
  quasiIdentifiers: (keyof T)[] = []
): Promise<T[]> {
  if (dataset.length < k) {
    logger.warn(`Dataset too small for k-anonymity (size: ${dataset.length}, k: ${k})`);
    return [];
  }
  
  const identifiers = quasiIdentifiers.map(String);
  return await dataMinimizationService.applyKAnonymity(dataset, k, identifiers) as T[];
}

/**
 * Add differential privacy noise to numeric value
 */
export function addPrivacyNoise(
  value: number,
  epsilon: number = 1.0,
  sensitivity: number = 1.0
): number {
  return dataMinimizationService.applyDifferentialPrivacy(value, epsilon, sensitivity);
}

/**
 * Hash sensitive string
 */
export function hashSensitiveString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

/**
 * Anonymize email address
 */
export function anonymizeEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return 'anonymous@example.com';
  
  const username = parts[0];
  const domain = parts[1];
  
  const anonymizedUsername = username.charAt(0) + 
    '*'.repeat(Math.max(username.length - 2, 1)) + 
    username.charAt(username.length - 1);
  
  return `${anonymizedUsername}@${domain}`;
}

/**
 * Anonymize phone number
 */
export function anonymizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return '***-***-****';
  
  return `***-***-${cleaned.slice(-4)}`;
}

/**
 * Generalize location to city/state level
 */
export function generalizeLocation(location: string): string {
  const parts = location.split(',');
  if (parts.length >= 2) {
    // Keep only city and state
    return parts.slice(-2).map(p => p.trim()).join(', ');
  }
  return '[Location]';
}

/**
 * Convert age to age group
 */
export function ageToAgeGroup(age: number): string {
  if (age < 18) return '0-17';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65+';
}

/**
 * Convert date to generalized date (year-month only)
 */
export function generalizeDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Remove PII from text
 */
export function removePIIFromText(text: string): string {
  // Email pattern
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  
  // Phone pattern
  text = text.replace(/(\+\d{1,3}[- ]?)?\(?\d{1,4}\)?[- ]?\d{1,4}[- ]?\d{1,4}/g, '[PHONE]');
  
  // SSN pattern
  text = text.replace(/\d{3}-?\d{2}-?\d{4}/g, '[SSN]');
  
  // Credit card pattern
  text = text.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '[CREDIT_CARD]');
  
  // IP address pattern
  text = text.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP_ADDRESS]');
  
  return text;
}

/**
 * Check if value contains PII
 */
export function containsPII(value: any): boolean {
  if (typeof value !== 'string') return false;
  
  const patterns = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
    /(\+\d{1,3}[- ]?)?\(?\d{1,4}\)?[- ]?\d{1,4}[- ]?\d{1,4}/, // Phone
    /\d{3}-?\d{2}-?\d{4}/, // SSN
    /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, // Credit card
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/ // IP address
  ];
  
  return patterns.some(pattern => pattern.test(value));
}

/**
 * Check if value contains PHI (Protected Health Information)
 */
export function containsPHI(value: any): boolean {
  if (typeof value !== 'string') return false;
  
  const phiKeywords = [
    'diagnosis', 'condition', 'disorder', 'disease', 'illness', 'symptom',
    'medication', 'prescription', 'drug', 'dosage', 'treatment',
    'therapy', 'counseling', 'psychiatric', 'mental health',
    'depression', 'anxiety', 'bipolar', 'schizophrenia', 'ptsd'
  ];
  
  const lowerValue = value.toLowerCase();
  return phiKeywords.some(keyword => lowerValue.includes(keyword));
}

/**
 * Sanitize object for logging
 */
export function sanitizeForLogging(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return containsPII(obj) ? '[REDACTED]' : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLogging);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'session'];
    
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Create data retention policy
 */
export function createRetentionPolicy(
  purpose: DataPurpose,
  days: number
): {
  purpose: DataPurpose;
  retentionDays: number;
  expirationDate: Date;
} {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  
  return {
    purpose,
    retentionDays: days,
    expirationDate
  };
}

/**
 * Check if data has expired
 */
export function isDataExpired(
  createdAt: Date | string,
  retentionDays: number
): boolean {
  const created = new Date(createdAt);
  const expirationDate = new Date(created);
  expirationDate.setDate(expirationDate.getDate() + retentionDays);
  
  return new Date() > expirationDate;
}

/**
 * Generate privacy-safe ID
 */
export function generatePrivacyId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Aggregate data with privacy preservation
 */
export function aggregateWithPrivacy<T extends Record<string, number>>(
  data: T[],
  minGroupSize: number = 5
): {
  aggregated: Partial<T>;
  groupSize: number;
  suppressed: boolean;
} {
  if (data.length < minGroupSize) {
    return {
      aggregated: {},
      groupSize: data.length,
      suppressed: true
    };
  }
  
  const aggregated: any = {};
  const keys = data.length > 0 ? Object.keys(data[0]) : [];
  
  for (const key of keys) {
    const values = data.map(item => item[key as keyof T] as number).filter(v => typeof v === 'number');
    if (values.length > 0) {
      aggregated[key] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length
      };
    }
  }
  
  return {
    aggregated,
    groupSize: data.length,
    suppressed: false
  };
}

/**
 * Export compliance report
 */
export async function exportComplianceReport(): Promise<{
  metrics: any;
  policies: any[];
  compliance: {
    gdpr: boolean;
    ccpa: boolean;
    hipaa: boolean;
    coppa: boolean;
  };
  timestamp: Date;
}> {
  const report = dataMinimizationService.exportPrivacyReport();
  
  return {
    ...report,
    timestamp: new Date()
  };
}

// Export all utilities
export default {
  minimizeObject,
  minimizeArray,
  anonymizeDataset,
  addPrivacyNoise,
  hashSensitiveString,
  anonymizeEmail,
  anonymizePhone,
  generalizeLocation,
  ageToAgeGroup,
  generalizeDate,
  removePIIFromText,
  containsPII,
  containsPHI,
  sanitizeForLogging,
  createRetentionPolicy,
  isDataExpired,
  generatePrivacyId,
  aggregateWithPrivacy,
  exportComplianceReport
};