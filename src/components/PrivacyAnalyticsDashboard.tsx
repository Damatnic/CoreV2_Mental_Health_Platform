/**
 * Privacy-Preserving Analytics Dashboard
 *
 * Displays crisis intervention effectiveness analytics across languages and cultures
 * while maintaining strict privacy standards and showing compliance metrics.
 */

import * as React from 'react';
import { useState, useCallback } from 'react';

// Core interfaces
export interface PrivacySettings {
  consentLevel: 'none' | 'essential' | 'functional' | 'analytics' | 'all';
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
  uniqueUsers: number;
  sessionCount: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  retentionRate: number;
  privacyCompliantEvents: number;
}

export interface CulturalMetrics {
  languageDistribution: Record<string, number>;
  culturalAdaptations: number;
  crossCulturalSuccess: number;
  localizedContent: number;
  accessibilityCompliance: number;
}

export interface PrivacyBudget {
  used: number;
  remaining: number;
  resetDate: Date;
  totalQueries: number;
  anonymizedQueries: number;
}

export interface PrivacyAnalyticsDashboardProps {
  userRole?: "Admin" | "Moderator" | "Helper";
  className?: string;
  showAdvancedMetrics?: boolean;
  allowExport?: boolean;
}

// Default settings
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  consentLevel: 'essential',
  dataRetentionDays: 90,
  allowPersonalization: false,
  allowPerformanceTracking: false,
  allowFunctionalAnalytics: true,
  allowResearchParticipation: false,
  anonymizeData: true,
  encryptData: true,
  shareWithThirdParties: false,
  optOutOfTargeting: true
};

// Mock data
export const MOCK_ANALYTICS_METRICS: AnalyticsMetrics = {
  totalEvents: 15420,
  uniqueUsers: 3280,
  sessionCount: 8950,
  averageSessionDuration: 1245, // seconds
  bounceRate: 0.23,
  conversionRate: 0.067,
  retentionRate: 0.78,
  privacyCompliantEvents: 14890
};

export const MOCK_CULTURAL_METRICS: CulturalMetrics = {
  languageDistribution: {
    'en': 0.45,
    'es': 0.25,
    'fr': 0.15,
    'de': 0.10,
    'other': 0.05
  },
  culturalAdaptations: 12,
  crossCulturalSuccess: 0.85,
  localizedContent: 156,
  accessibilityCompliance: 0.94
};

export const MOCK_PRIVACY_BUDGET: PrivacyBudget = {
  used: 0.35,
  remaining: 0.65,
  resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  totalQueries: 2847,
  anonymizedQueries: 2698
};

// Utility functions
export const calculatePrivacyCompliance = (metrics: AnalyticsMetrics): number => {
  if (metrics.totalEvents === 0) return 0;
  return (metrics.privacyCompliantEvents / metrics.totalEvents) * 100;
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds % 60}s`;
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const getComplianceStatus = (percentage: number): {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  color: string;
  message: string;
} => {
  if (percentage >= 95) {
    return {
      status: 'excellent',
      color: '#28a745',
      message: 'Excellent privacy compliance'
    };
  } else if (percentage >= 85) {
    return {
      status: 'good',
      color: '#17a2b8',
      message: 'Good privacy compliance'
    };
  } else if (percentage >= 70) {
    return {
      status: 'warning',
      color: '#ffc107',
      message: 'Privacy compliance needs attention'
    };
  } else {
    return {
      status: 'critical',
      color: '#dc3545',
      message: 'Critical privacy compliance issues'
    };
  }
};

export const calculateDataRetentionCompliance = (settings: PrivacySettings): boolean => {
  // GDPR recommends data retention periods based on purpose
  const maxRetentionDays = {
    'none': 0,
    'essential': 30,
    'functional': 90,
    'analytics': 180,
    'all': 365
  };
  
  return settings.dataRetentionDays <= maxRetentionDays[settings.consentLevel];
};

export const generatePrivacyReport = (
  metrics: AnalyticsMetrics,
  cultural: CulturalMetrics,
  budget: PrivacyBudget,
  settings: PrivacySettings
): {
  summary: string;
  compliance: number;
  recommendations: string[];
  issues: string[];
} => {
  const compliance = calculatePrivacyCompliance(metrics);
  const recommendations: string[] = [];
  const issues: string[] = [];
  
  // Check compliance
  if (compliance < 95) {
    issues.push(`Privacy compliance at ${compliance.toFixed(1)}% - should be above 95%`);
    recommendations.push('Review data collection practices');
  }
  
  // Check budget usage
  if (budget.used > 0.8) {
    issues.push('Privacy budget usage is high');
    recommendations.push('Consider reducing query frequency');
  }
  
  // Check retention compliance
  if (!calculateDataRetentionCompliance(settings)) {
    issues.push('Data retention period exceeds recommended limits');
    recommendations.push('Reduce data retention period');
  }
  
  // Check anonymization
  if (!settings.anonymizeData) {
    issues.push('Data anonymization is disabled');
    recommendations.push('Enable data anonymization');
  }
  
  return {
    summary: `Privacy dashboard shows ${compliance.toFixed(1)}% compliance with ${issues.length} issues identified`,
    compliance,
    recommendations,
    issues
  };
};

export const exportAnalyticsData = (
  metrics: AnalyticsMetrics,
  cultural: CulturalMetrics,
  settings: PrivacySettings
): string => {
  const exportData = {
    timestamp: new Date().toISOString(),
    metrics: {
      ...metrics,
      // Remove sensitive data
      uniqueUsers: '[ANONYMIZED]',
      sessionCount: '[ANONYMIZED]'
    },
    cultural,
    privacySettings: settings,
    compliance: calculatePrivacyCompliance(metrics)
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const updatePrivacySettings = (
  currentSettings: PrivacySettings,
  updates: Partial<PrivacySettings>
): PrivacySettings => {
  const newSettings = { ...currentSettings, ...updates };
  
  // Validate settings consistency
  if (newSettings.consentLevel === 'none') {
    newSettings.allowPersonalization = false;
    newSettings.allowPerformanceTracking = false;
    newSettings.allowFunctionalAnalytics = false;
    newSettings.allowResearchParticipation = false;
  }
  
  return newSettings;
};

export const validatePrivacySettings = (settings: PrivacySettings): string[] => {
  const errors: string[] = [];
  
  if (settings.dataRetentionDays < 1) {
    errors.push('Data retention period must be at least 1 day');
  }
  
  if (settings.dataRetentionDays > 2555) { // 7 years max
    errors.push('Data retention period cannot exceed 7 years');
  }
  
  if (settings.consentLevel === 'none' && (
    settings.allowPersonalization ||
    settings.allowPerformanceTracking ||
    settings.allowFunctionalAnalytics ||
    settings.allowResearchParticipation
  )) {
    errors.push('Cannot enable tracking features with no consent');
  }
  
  if (!settings.encryptData) {
    errors.push('Data encryption should be enabled for security');
  }
  
  return errors;
};

export const getCulturalInsights = (metrics: CulturalMetrics): {
  topLanguages: Array<{ language: string; percentage: number }>;
  diversityScore: number;
  recommendations: string[];
} => {
  const topLanguages = Object.entries(metrics.languageDistribution)
    .map(([language, percentage]) => ({ language, percentage }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
  
  // Calculate diversity score (Simpson's Diversity Index)
  const diversityScore = 1 - Object.values(metrics.languageDistribution)
    .reduce((sum, p) => sum + (p * p), 0);
  
  const recommendations: string[] = [];
  
  if (diversityScore < 0.5) {
    recommendations.push('Consider expanding language support');
  }
  
  if (metrics.accessibilityCompliance < 0.9) {
    recommendations.push('Improve accessibility compliance');
  }
  
  if (metrics.crossCulturalSuccess < 0.8) {
    recommendations.push('Review cultural adaptation strategies');
  }
  
  return {
    topLanguages,
    diversityScore,
    recommendations
  };
};

export const trackPrivacyEvent = (
  eventType: string,
  metadata: Record<string, any>,
  settings: PrivacySettings
): boolean => {
  // Check if event tracking is allowed based on consent level
  const allowedEvents: Record<string, string[]> = {
    'none': [],
    'essential': ['error', 'security', 'performance_critical'],
    'functional': ['error', 'security', 'performance_critical', 'feature_usage'],
    'analytics': ['error', 'security', 'performance_critical', 'feature_usage', 'user_behavior'],
    'all': ['error', 'security', 'performance_critical', 'feature_usage', 'user_behavior', 'marketing']
  };
  
  return allowedEvents[settings.consentLevel].includes(eventType);
};

// Mock component
export const PrivacyAnalyticsDashboard = {
  displayName: 'PrivacyAnalyticsDashboard',
  defaultProps: {
    userRole: "Helper" as const,
    showAdvancedMetrics: false,
    allowExport: true
  }
};

export default PrivacyAnalyticsDashboard;











