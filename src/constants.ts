/**
 * Application Constants
 * 
 * Central location for all constant values used throughout the mental health platform
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  WEBSOCKET_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Authentication
export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'current_user',
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;

// Mental Health Specific
export const MOOD_LEVELS = {
  TERRIBLE: 1,
  NOT_GOOD: 2,
  OKAY: 3,
  GOOD: 4,
  EXCELLENT: 5,
} as const;

export const MOOD_LABELS = {
  [MOOD_LEVELS.TERRIBLE]: 'Terrible',
  [MOOD_LEVELS.NOT_GOOD]: 'Not Good',
  [MOOD_LEVELS.OKAY]: 'Okay',
  [MOOD_LEVELS.GOOD]: 'Good',
  [MOOD_LEVELS.EXCELLENT]: 'Excellent',
} as const;

export const MOOD_COLORS = {
  [MOOD_LEVELS.TERRIBLE]: '#dc2626', // red-600
  [MOOD_LEVELS.NOT_GOOD]: '#ea580c', // orange-600
  [MOOD_LEVELS.OKAY]: '#facc15', // yellow-400
  [MOOD_LEVELS.GOOD]: '#16a34a', // green-600
  [MOOD_LEVELS.EXCELLENT]: '#059669', // emerald-600
} as const;

// Content and Categories
export const MAX_CONTENT_LENGTH = 5000;
export const CATEGORIES = [
  'Anxiety',
  'Depression', 
  'Grief',
  'Relationships',
  'Stress',
  'Loneliness',
  'Other'
] as const;

export const MOOD_EMOJIS = {
  [MOOD_LEVELS.TERRIBLE]: '😢',
  [MOOD_LEVELS.NOT_GOOD]: '😟',
  [MOOD_LEVELS.OKAY]: '😐',
  [MOOD_LEVELS.GOOD]: '😊',
  [MOOD_LEVELS.EXCELLENT]: '😄',
} as const;

// Crisis Detection
export const CRISIS_LEVELS = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end it all',
  'hurt myself',
  'self harm',
  'not worth living',
  'better off dead',
  'want to die',
  'end my life',
  'no way out',
  'can\'t go on',
] as const;

export const MODERATE_RISK_KEYWORDS = [
  'hopeless',
  'worthless',
  'overwhelming',
  'can\'t cope',
  'giving up',
  'nobody cares',
  'better without me',
  'burden',
  'trapped',
  'desperate',
] as const;

// Emergency Contacts
export const EMERGENCY_CONTACTS = {
  US: {
    EMERGENCY: '911',
    SUICIDE_PREVENTION: '988',
    CRISIS_TEXT: '741741',
    NATIONAL_DOMESTIC_VIOLENCE: '1-800-799-7233',
    SAMHSA_HELPLINE: '1-800-662-4357',
  },
  UK: {
    EMERGENCY: '999',
    SAMARITANS: '116 123',
    CRISIS_TEXT: '85258',
  },
  CANADA: {
    EMERGENCY: '911',
    SUICIDE_PREVENTION: '1-833-456-4566',
    CRISIS_TEXT: '45645',
  },
  INTERNATIONAL: {
    SUICIDE_PREVENTION: 'https://www.iasp.info/resources/Crisis_Centres/',
  },
} as const;

// User Roles
export const USER_ROLES = {
  CLIENT: 'client',
  HELPER: 'helper',
  THERAPIST: 'therapist',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.CLIENT]: [
    'read_own_data',
    'update_own_profile',
    'create_mood_entries',
    'access_peer_support',
    'create_safety_plan',
  ],
  [USER_ROLES.HELPER]: [
    'read_own_data',
    'update_own_profile',
    'access_helper_dashboard',
    'respond_to_clients',
    'view_client_profiles',
    'schedule_sessions',
  ],
  [USER_ROLES.THERAPIST]: [
    'read_own_data',
    'update_own_profile',
    'access_therapist_dashboard',
    'manage_clients',
    'create_treatment_plans',
    'access_clinical_tools',
    'view_detailed_analytics',
  ],
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'access_admin_dashboard',
    'manage_platform_settings',
    'view_system_analytics',
    'manage_content',
    'handle_reports',
  ],
  [USER_ROLES.MODERATOR]: [
    'moderate_content',
    'handle_reports',
    'ban_users',
    'access_moderation_tools',
  ],
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  MOOD_REMINDER: 'mood_reminder',
  SESSION_REMINDER: 'session_reminder',
  MESSAGE_RECEIVED: 'message_received',
  CRISIS_ALERT: 'crisis_alert',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  SYSTEM_UPDATE: 'system_update',
  SAFETY_CHECK: 'safety_check',
} as const;

// Therapy Session Types
export const SESSION_TYPES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group',
  COUPLES: 'couples',
  FAMILY: 'family',
  CRISIS: 'crisis',
  PEER_SUPPORT: 'peer_support',
} as const;

export const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
} as const;

// Communication Preferences
export const COMMUNICATION_METHODS = {
  VIDEO: 'video',
  PHONE: 'phone',
  CHAT: 'chat',
  EMAIL: 'email',
  IN_PERSON: 'in_person',
} as const;

// Privacy Settings
export const PRIVACY_LEVELS = {
  PUBLIC: 'public',
  FRIENDS: 'friends',
  PRIVATE: 'private',
  ANONYMOUS: 'anonymous',
} as const;

// Data Retention
export const DATA_RETENTION = {
  MOOD_ENTRIES: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
  CHAT_MESSAGES: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
  SESSION_NOTES: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
  CRISIS_LOGS: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
  USER_PROFILES: Infinity, // Retained until deletion
} as const;

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILES_PER_UPLOAD: 5,
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_REGEX: /^[a-zA-Z0-9_]+$/,
  BIO_MAX_LENGTH: 500,
  POST_MAX_LENGTH: 2000,
  COMMENT_MAX_LENGTH: 500,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 100,
  LOGIN_ATTEMPTS_PER_HOUR: 10,
  PASSWORD_RESET_PER_HOUR: 3,
  MESSAGE_SEND_PER_MINUTE: 10,
  POST_CREATE_PER_HOUR: 5,
  COMMENT_CREATE_PER_MINUTE: 5,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  CRISIS_DETECTION: process.env.REACT_APP_FEATURE_CRISIS_DETECTION !== 'false',
  AI_CHAT: process.env.REACT_APP_FEATURE_AI_CHAT !== 'false',
  PEER_SUPPORT: process.env.REACT_APP_FEATURE_PEER_SUPPORT !== 'false',
  GROUP_THERAPY: process.env.REACT_APP_FEATURE_GROUP_THERAPY === 'true',
  VIDEO_CALLS: process.env.REACT_APP_FEATURE_VIDEO_CALLS === 'true',
  ANALYTICS: process.env.REACT_APP_FEATURE_ANALYTICS !== 'false',
  PUSH_NOTIFICATIONS: process.env.REACT_APP_FEATURE_PUSH_NOTIFICATIONS === 'true',
  OFFLINE_MODE: process.env.REACT_APP_FEATURE_OFFLINE_MODE !== 'false',
  DARK_MODE: process.env.REACT_APP_FEATURE_DARK_MODE !== 'false',
  ACCESSIBILITY_MODE: process.env.REACT_APP_FEATURE_ACCESSIBILITY_MODE !== 'false',
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  DEFAULT_THEME: 'light',
  AVAILABLE_THEMES: ['light', 'dark', 'high-contrast', 'colorblind-friendly'],
  THEME_STORAGE_KEY: 'user-theme',
  AUTO_THEME_DETECTION: true,
} as const;

// Accessibility
export const ACCESSIBILITY = {
  FOCUS_VISIBLE_CLASS: 'focus-visible',
  SKIP_LINK_ID: 'skip-to-main',
  LANDMARK_SELECTORS: ['main', 'nav', 'header', 'footer', 'aside', 'section'],
  HIGH_CONTRAST_RATIO: 7, // WCAG AAA
  NORMAL_CONTRAST_RATIO: 4.5, // WCAG AA
  REDUCED_MOTION_DURATION: 0, // Milliseconds
  NORMAL_ANIMATION_DURATION: 300, // Milliseconds
} as const;

// Analytics Events
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  MOOD_ENTRY_CREATED: 'mood_entry_created',
  SESSION_STARTED: 'session_started',
  SESSION_COMPLETED: 'session_completed',
  CRISIS_DETECTED: 'crisis_detected',
  HELP_REQUESTED: 'help_requested',
  FEATURE_USED: 'feature_used',
  ERROR_ENCOUNTERED: 'error_encountered',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden. Please contact support if you believe this is an error.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  RATE_LIMITED: 'Too many requests. Please wait before trying again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported file format.',
  CRISIS_DETECTED: 'Crisis language detected. Would you like to speak with someone?',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  MOOD_SAVED: 'Mood entry saved successfully.',
  MESSAGE_SENT: 'Message sent successfully.',
  SESSION_SCHEDULED: 'Session scheduled successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  EMAIL_VERIFIED: 'Email verified successfully.',
  SAFETY_PLAN_SAVED: 'Safety plan saved successfully.',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PRIVACY_POLICY_ACCEPTED: 'privacy_policy_accepted',
  CRISIS_RESOURCES_VIEWED: 'crisis_resources_viewed',
  LAST_MOOD_ENTRY: 'last_mood_entry',
  DRAFT_POSTS: 'draft_posts',
  ACCESSIBILITY_SETTINGS: 'accessibility_settings',
} as const;

// Environment Types
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

// App Metadata
export const APP_METADATA = {
  NAME: 'Mental Health Platform',
  VERSION: '2.0.0',
  DESCRIPTION: 'A comprehensive platform for mental health support and therapy',
  AUTHOR: 'Mental Health Platform Team',
  KEYWORDS: ['mental health', 'therapy', 'support', 'wellness', 'crisis prevention'],
  HOMEPAGE: process.env.REACT_APP_HOMEPAGE || 'https://mentalhealthplatform.com',
  SUPPORT_EMAIL: process.env.REACT_APP_SUPPORT_EMAIL || 'support@mentalhealthplatform.com',
  PRIVACY_POLICY_URL: '/privacy-policy',
  TERMS_OF_SERVICE_URL: '/terms-of-service',
  CRISIS_RESOURCES_URL: '/crisis-resources',
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  USER_PROFILE_TTL: 30 * 60 * 1000, // 30 minutes
  MOOD_ENTRIES_TTL: 10 * 60 * 1000, // 10 minutes
  STATIC_CONTENT_TTL: 60 * 60 * 1000, // 1 hour
  CRISIS_RESOURCES_TTL: 24 * 60 * 60 * 1000, // 24 hours
  MAX_CACHE_SIZE: 100, // Maximum number of cached items
  CLEANUP_INTERVAL: 60 * 1000, // 1 minute
} as const;

// Performance Metrics
export const PERFORMANCE_THRESHOLDS = {
  FIRST_CONTENTFUL_PAINT: 2000, // 2 seconds
  LARGEST_CONTENTFUL_PAINT: 4000, // 4 seconds
  FIRST_INPUT_DELAY: 100, // 100ms
  CUMULATIVE_LAYOUT_SHIFT: 0.1, // 0.1 CLS score
  CRISIS_DETECTION_LATENCY: 500, // 500ms - critical for safety
  API_RESPONSE_TIME: 2000, // 2 seconds
  PAGE_LOAD_TIME: 5000, // 5 seconds
} as const;

// WebRTC Configuration
export const WEBRTC_CONFIG = {
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  VIDEO_CONSTRAINTS: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  AUDIO_CONSTRAINTS: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
} as const;

// Timezone Configuration
export const TIMEZONE_CONFIG = {
  DEFAULT: 'America/New_York',
  SUPPORTED_TIMEZONES: [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
  ],
} as const;

// Type definitions for constants
export type MoodLevel = typeof MOOD_LEVELS[keyof typeof MOOD_LEVELS];
export type CrisisLevel = typeof CRISIS_LEVELS[keyof typeof CRISIS_LEVELS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type SessionType = typeof SESSION_TYPES[keyof typeof SESSION_TYPES];
export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];
export type CommunicationMethod = typeof COMMUNICATION_METHODS[keyof typeof COMMUNICATION_METHODS];
export type PrivacyLevel = typeof PRIVACY_LEVELS[keyof typeof PRIVACY_LEVELS];
export type Environment = typeof ENVIRONMENTS[keyof typeof ENVIRONMENTS];

// Export all constants as default
export default {
  API_CONFIG,
  AUTH_CONFIG,
  MOOD_LEVELS,
  MOOD_LABELS,
  MOOD_COLORS,
  MOOD_EMOJIS,
  CRISIS_LEVELS,
  CRISIS_KEYWORDS,
  MODERATE_RISK_KEYWORDS,
  EMERGENCY_CONTACTS,
  USER_ROLES,
  ROLE_PERMISSIONS,
  NOTIFICATION_TYPES,
  SESSION_TYPES,
  SESSION_STATUS,
  COMMUNICATION_METHODS,
  PRIVACY_LEVELS,
  DATA_RETENTION,
  UPLOAD_LIMITS,
  VALIDATION,
  RATE_LIMITS,
  FEATURE_FLAGS,
  THEME_CONFIG,
  ACCESSIBILITY,
  ANALYTICS_EVENTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  ENVIRONMENTS,
  APP_METADATA,
  CACHE_CONFIG,
  PERFORMANCE_THRESHOLDS,
  WEBRTC_CONFIG,
  TIMEZONE_CONFIG,
};

