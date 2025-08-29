/**
 * Central export file for all type definitions
 * This makes importing types more convenient throughout the application
 */

// Common utility types
export * from './common';

// API response types - selective exports to avoid conflicts
export {
  // Base API types
  ApiError,
  ApiMeta,
  EnhancedApiResponse,
  // Auth types (renamed to avoid conflicts)
  ApiUser,
  ApiUserProfile,
  ApiUserPreferences,
  UserRole,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
  UsersResponse,
  // Settings types
  NotificationSettings,
  PrivacySettings,
  AccessibilitySettings,
  // Mental health API types (renamed to avoid conflicts)
  ApiMoodEntry,
  ApiJournalEntry,
  ApiSafetyPlan,
  ApiEmergencyContact,
  SafetyContact,
  // Response types
  MoodEntryResponse,
  MoodEntriesResponse,
  JournalEntryResponse,
  JournalEntriesResponse,
  SafetyPlanResponse,
  SafetyPlansResponse,
  TherapySessionResponse,
  TherapySessionsResponse,
  CrisisEventResponse,
  CrisisEventsResponse,
  // Other API types
  TherapySession,
  ApiCrisisEvent,
  Community,
  Post,
  Comment,
  Attachment,
  Poll,
  PollOption,
  PollVote,
  ApiNotification,
  NotificationAction,
  Report,
  ModerationAction,
  Analytics,
  UserInsights,
  CommunityInsights,
  EngagementMetrics,
  WellnessScore,
  CrisisStatistics,
  SystemHealth,
  ResourceUsage,
  // Export type (keep as is)
  ExportFormat,
  DataExportRequest,
  DataExportResponse,
  DataImportRequest,
  DataImportResponse,
  // Webhook types
  WebhookEvent,
  WebhookPayload,
  WebhookSubscription,
  // Response types for other entities
  CommunityResponse,
  CommunitiesResponse,
  PostResponse,
  PostsResponse,
  CommentResponse,
  CommentsResponse,
  NotificationResponse,
  NotificationsResponse,
  ReportResponse,
  ReportsResponse,
  AnalyticsResponse,
  UserInsightsResponse,
  CommunityInsightsResponse,
  SystemHealthResponse,
  ResourceUsageResponse,
  WebhookSubscriptionResponse,
  WebhookSubscriptionsResponse
} from './api.types';

// Authentication and user types
export * from './auth.types';

// Mental health specific types
export * from './mentalHealth.types';

// Database types
export * from './database.types';

// Global type declarations
// Jest DOM types are imported via TypeScript config

// Re-export commonly used React types for convenience
export type { 
  ReactNode,
  ComponentType,
  FC,
  PropsWithChildren,
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  ButtonHTMLAttributes,
  FormHTMLAttributes,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  FocusEvent
} from 'react';

// View types (commonly used throughout the app)
export type ActiveView = 
  | 'dashboard'
  | 'mood-tracker'
  | 'journal'
  | 'resources'
  | 'crisis-support'
  | 'community'
  | 'settings'
  | 'profile'
  | 'ai-chat'
  | 'video-call'
  | 'safety-plan'
  | 'analytics'
  | 'help'
  | 'feedback'
  | 'about'
  | 'privacy'
  | 'terms';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Device types
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// Screen size types
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Language types
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko';

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'test';

// Log level types
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

// Storage types
export type StorageType = 'localStorage' | 'sessionStorage' | 'indexedDB' | 'memory';

// Animation types
export type AnimationType = 'none' | 'fade' | 'slide' | 'scale' | 'bounce' | 'pulse';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Modal types
export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

// Button types
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';

// Input types
export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'outline' | 'underlined';

// Color scheme types
export type ColorScheme = 
  | 'gray' | 'red' | 'orange' | 'yellow' | 'green' 
  | 'teal' | 'blue' | 'cyan' | 'purple' | 'pink';

// Status types
export type Status = 'idle' | 'loading' | 'success' | 'error' | 'warning';

// Permission types
export type Permission = 
  | 'read' | 'write' | 'delete' | 'admin'
  | 'user:read' | 'user:write' | 'user:delete'
  | 'post:read' | 'post:write' | 'post:delete' | 'post:moderate'
  | 'community:read' | 'community:write' | 'community:moderate' | 'community:admin'
  | 'crisis:respond' | 'crisis:escalate'
  | 'analytics:view' | 'analytics:export'
  | 'system:config' | 'system:monitor';

// Crisis severity levels
export type CrisisSeverity = 'low' | 'medium' | 'high' | 'critical' | 'emergency';

// Support types
export type SupportType = 
  | 'peer' | 'professional' | 'crisis' | 'emergency'
  | 'chat' | 'video' | 'phone' | 'text';

// Export type guards for runtime type checking
export const isValidActiveView = (view: string): view is ActiveView => {
  const validViews: ActiveView[] = [
    'dashboard', 'mood-tracker', 'journal', 'resources', 'crisis-support',
    'community', 'settings', 'profile', 'ai-chat', 'video-call',
    'safety-plan', 'analytics', 'help', 'feedback', 'about', 'privacy', 'terms'
  ];
  return validViews.includes(view as ActiveView);
};

export const isValidThemeMode = (mode: string): mode is ThemeMode => {
  return ['light', 'dark', 'system'].includes(mode);
};

export const isValidCrisisSeverity = (severity: string): severity is CrisisSeverity => {
  return ['low', 'medium', 'high', 'critical', 'emergency'].includes(severity);
};

export const isValidEnvironment = (env: string): env is Environment => {
  return ['development', 'staging', 'production', 'test'].includes(env);
};

// Utility type for creating branded types (prevents accidental mixing)
export type Brand<T, B> = T & { __brand: B };

// Branded types for better type safety
export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type PostId = Brand<string, 'PostId'>;
export type CommentId = Brand<string, 'CommentId'>;
export type CommunityId = Brand<string, 'CommunityId'>;
export type ResourceId = Brand<string, 'ResourceId'>;
export type NotificationId = Brand<string, 'NotificationId'>;

// Helper functions for creating branded types
export const createUserId = (id: string): UserId => id as UserId;
export const createSessionId = (id: string): SessionId => id as SessionId;
export const createPostId = (id: string): PostId => id as PostId;
export const createCommentId = (id: string): CommentId => id as CommentId;
export const createCommunityId = (id: string): CommunityId => id as CommunityId;
export const createResourceId = (id: string): ResourceId => id as ResourceId;
export const createNotificationId = (id: string): NotificationId => id as NotificationId;

// AI Chat types for therapeutic conversations with crisis detection
export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  metadata?: {
    provider?: string;
    crisisDetected?: boolean;
    sentiment?: string;
    topics?: string[];
    interventionRequired?: boolean;
    supportResourcesOffered?: boolean;
  };
}

export interface AIChatSession {
  id: string;
  userId: string;
  provider: 'openai' | 'claude' | 'local';
  startTime: Date;
  lastActivity?: Date;
  messages: AIChatMessage[];
  metadata?: {
    crisisDetectionEnabled?: boolean;
    moderationEnabled?: boolean;
    therapeuticMode?: boolean;
    sessionType?: 'support' | 'crisis' | 'general';
    interventionHistory?: CrisisIntervention[];
  };
}

export interface CrisisIntervention {
  timestamp: Date;
  severity: CrisisSeverity;
  action: 'resources_provided' | 'professional_contacted' | 'emergency_services' | 'safety_plan_activated';
  details: string;
  followUpRequired: boolean;
}

export interface CrisisAnalysis {
  hasCrisisIndicators: boolean;
  severity: CrisisSeverity;
  indicators: string[];
  immediateIntervention: boolean;
  recommendedActions: string[];
  confidence: number;
  timestamp: Date;
}

export interface ModerationResult {
  blocked: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
  categories?: string[];
  confidence: number;
}