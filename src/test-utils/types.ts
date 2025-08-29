/**
 * Test Utility Type Definitions
 * Provides comprehensive type definitions for testing infrastructure
 */

import { ReactElement } from 'react';
import { RenderOptions, RenderResult } from '@testing-library/react';
import { Config } from '@jest/types';

// Mock function types
export type MockFunction<T = any, R = any> = jest.Mock<R, T>;
export type SpyFunction<T = any, R = any> = jest.SpyInstance<R, T>;

// Test data types for mental health platform
export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'seeker' | 'helper' | 'admin' | 'moderator';
  isAnonymous?: boolean;
  preferences?: UserPreferences;
  mentalHealthProfile?: MentalHealthProfile;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  crisisAlerts: boolean;
  checkInReminders: boolean;
}

export interface PrivacySettings {
  shareData: boolean;
  allowAnalytics: boolean;
  publicProfile: boolean;
  anonymousMode: boolean;
}

export interface MentalHealthProfile {
  currentMood: number; // 1-10 scale
  anxietyLevel: number; // 1-10 scale
  stressLevel: number; // 1-10 scale
  sleepQuality: number; // 1-10 scale
  lastCrisisDate?: Date;
  triggers?: string[];
  copingStrategies?: string[];
  medications?: string[];
  therapist?: string;
  emergencyContacts?: EmergencyContact[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

// Crisis detection test types
export interface CrisisTestScenario {
  input: string;
  expectedSeverity: 'low' | 'medium' | 'high' | 'critical';
  expectedType: CrisisType;
  expectedConfidence: number;
  shouldTriggerAlert: boolean;
  shouldEscalate: boolean;
}

export type CrisisType = 
  | 'suicidal_ideation'
  | 'self_harm'
  | 'substance_abuse'
  | 'domestic_violence'
  | 'panic_attack'
  | 'severe_depression'
  | 'psychosis'
  | 'eating_disorder'
  | 'none';

// Mock service types
export interface MockAuthService {
  login: MockFunction<[email: string, password: string], Promise<TestUser>>;
  logout: MockFunction<[], Promise<void>>;
  register: MockFunction<[userData: Partial<TestUser>], Promise<TestUser>>;
  getCurrentUser: MockFunction<[], Promise<TestUser | null>>;
  updateProfile: MockFunction<[updates: Partial<TestUser>], Promise<TestUser>>;
  resetPassword: MockFunction<[email: string], Promise<void>>;
}

export interface MockCrisisService {
  detectCrisis: MockFunction<[message: string], Promise<CrisisDetectionResult>>;
  escalateCrisis: MockFunction<[userId: string, crisis: CrisisDetectionResult], Promise<void>>;
  getEmergencyResources: MockFunction<[], Promise<EmergencyResource[]>>;
  notifyEmergencyContacts: MockFunction<[userId: string], Promise<void>>;
}

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: CrisisType;
  confidence: number;
  keywords: string[];
  recommendedActions: string[];
  resources: EmergencyResource[];
}

export interface EmergencyResource {
  name: string;
  phone: string;
  website?: string;
  available247: boolean;
  specialties: string[];
}

// Test context providers
export interface TestProviderProps {
  children: ReactElement;
  initialUser?: TestUser;
  initialTheme?: 'light' | 'dark';
  initialNotifications?: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'crisis';
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Custom render options
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialUser?: TestUser;
  initialTheme?: 'light' | 'dark';
  initialNotifications?: Notification[];
  mockServices?: {
    auth?: Partial<MockAuthService>;
    crisis?: Partial<MockCrisisService>;
  };
}

// Test utilities return types
export interface RenderWithProvidersResult extends RenderResult {
  user: TestUser | null;
  updateUser: (user: TestUser | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

// Accessibility test types
export interface AccessibilityTestOptions {
  checkColorContrast?: boolean;
  checkAriaLabels?: boolean;
  checkKeyboardNavigation?: boolean;
  checkScreenReaderSupport?: boolean;
  wcagLevel?: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
  }>;
}

// Performance test types
export interface PerformanceMetrics {
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  networkRequests: number;
  bundleSize: number;
}

export interface PerformanceTestOptions {
  measureRenderTime?: boolean;
  measureInteractionTime?: boolean;
  measureMemoryUsage?: boolean;
  measureNetworkRequests?: boolean;
  threshold?: Partial<PerformanceMetrics>;
}

// Mock data generators
export interface TestDataGenerators {
  generateUser: (overrides?: Partial<TestUser>) => TestUser;
  generateCrisisScenario: (severity?: 'low' | 'medium' | 'high' | 'critical') => CrisisTestScenario;
  generateMoodEntry: (date?: Date) => MoodEntry;
  generateTherapySession: (duration?: number) => TherapySession;
  generateSafetyPlan: () => SafetyPlan;
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: number;
  anxiety: number;
  stress: number;
  sleep: number;
  notes?: string;
  timestamp: Date;
  triggers?: string[];
  copingStrategiesUsed?: string[];
}

export interface TherapySession {
  id: string;
  userId: string;
  therapistId?: string;
  startTime: Date;
  endTime: Date;
  type: 'ai' | 'peer' | 'professional';
  notes?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  topicsDiscussed: string[];
  actionItems?: string[];
}

export interface SafetyPlan {
  id: string;
  userId: string;
  warningSignsContent: string;
  internalCopingContent: string;
  socialDistractionsContent: string;
  socialSupportsContent: string;
  professionalContactsContent: string;
  safeEnvironmentContent: string;
  reasonsToLiveContent: string;
  createdAt: Date;
  updatedAt: Date;
}

// Test matcher extensions
export interface CustomMatchers<R = unknown> {
  toBeAccessible(options?: AccessibilityTestOptions): R;
  toMeetPerformanceThreshold(threshold: Partial<PerformanceMetrics>): R;
  toHaveCrisisDetection(expectedType: CrisisType): R;
  toBeHIPAACompliant(): R;
  toBeWCAGCompliant(level?: 'A' | 'AA' | 'AAA'): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

// Export utility type guards
export const isCrisisMessage = (message: any): message is CrisisDetectionResult => {
  return (
    typeof message === 'object' &&
    'isCrisis' in message &&
    'severity' in message &&
    'type' in message
  );
};

export const isEmergencyResource = (resource: any): resource is EmergencyResource => {
  return (
    typeof resource === 'object' &&
    'name' in resource &&
    'phone' in resource &&
    'available247' in resource
  );
};

export const isTestUser = (user: any): user is TestUser => {
  return (
    typeof user === 'object' &&
    'id' in user &&
    'email' in user &&
    'role' in user
  );
};