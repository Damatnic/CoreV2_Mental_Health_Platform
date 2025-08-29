/**
 * Environment Variable Validator
 * Validates and provides type-safe access to environment variables
 */

import { z } from 'zod';

// Environment schema for validation
const envSchema = z.object({
  // Vite environment variables
  VITE_API_URL: z.string().url().default('http://localhost:3001'),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  VITE_ENABLE_PWA: z.string().transform(val => val === 'true').default('true'),
  VITE_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),

  // PWA Configuration
  VITE_PWA_NAME: z.string().default('CoreV2 - Mental Health Support'),
  VITE_PWA_SHORT_NAME: z.string().default('CoreV2'),
  VITE_PWA_THEME_COLOR: z.string().default('#2563eb'),
  VITE_PWA_BACKGROUND_COLOR: z.string().default('#ffffff'),
  VITE_PWA_DISPLAY: z.enum(['standalone', 'fullscreen', 'minimal-ui', 'browser']).default('standalone'),

  // Feature flags
  VITE_ENABLE_CRISIS_DETECTION: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_AI_CHAT: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_VIDEO_CHAT: z.string().transform(val => val === 'true').default('false'),
  VITE_ENABLE_GROUP_SESSIONS: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_PEER_SUPPORT: z.string().transform(val => val === 'true').default('true'),

  // Security
  VITE_ENABLE_CSP: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_HTTPS_ONLY: z.string().transform(val => val === 'true').default('false'),

  // Performance
  VITE_ENABLE_SERVICE_WORKER: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_OFFLINE_MODE: z.string().transform(val => val === 'true').default('true'),
  VITE_CACHE_MAX_AGE: z.string().transform(val => parseInt(val) || 3600).default('3600'),

  // Monitoring and Logging
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  VITE_ENABLE_ERROR_TRACKING: z.string().transform(val => val === 'true').default('true'),
  VITE_SENTRY_DSN: z.string().optional(),

  // External Services
  VITE_GOOGLE_ANALYTICS_ID: z.string().optional(),
  VITE_HOTJAR_ID: z.string().optional(),
  VITE_CRISP_WEBSITE_ID: z.string().optional(),

  // Crisis Resources
  VITE_CRISIS_HOTLINE: z.string().default('988'),
  VITE_CRISIS_TEXT_LINE: z.string().default('741741'),
  VITE_EMERGENCY_NUMBER: z.string().default('911'),

  // Accessibility
  VITE_ENABLE_HIGH_CONTRAST: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_SCREEN_READER: z.string().transform(val => val === 'true').default('true'),
  VITE_ENABLE_KEYBOARD_NAV: z.string().transform(val => val === 'true').default('true'),

  // Development
  VITE_ENABLE_DEVTOOLS: z.string().transform(val => val === 'true').default('false'),
  VITE_ENABLE_DEBUG_MODE: z.string().transform(val => val === 'true').default('false')
});

// Type for validated environment variables
export type ValidatedEnv = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): ValidatedEnv {
  try {
    // Get environment variables from import.meta.env (Vite)
    const env = import.meta.env || {};
    
    // Parse and validate
    const parsed = envSchema.parse(env);
    
    return parsed;
  } catch (error) {
    console.error('Environment validation failed:', error);
    
    // Return default values in case of validation failure
    return envSchema.parse({});
  }
}

// Export validated environment variables
export const env = validateEnv();

// Helper functions for common environment checks
export const isDevelopment = () => env.VITE_ENVIRONMENT === 'development';
export const isProduction = () => env.VITE_ENVIRONMENT === 'production';
export const isStaging = () => env.VITE_ENVIRONMENT === 'staging';

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof ValidatedEnv): boolean => {
  const value = env[feature];
  return typeof value === 'boolean' ? value : false;
};

// API URL helpers
export const getApiUrl = (path = ''): string => {
  const baseUrl = env.VITE_API_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
};

// PWA configuration helper
export const getPWAConfig = () => ({
  name: env.VITE_PWA_NAME,
  shortName: env.VITE_PWA_SHORT_NAME,
  themeColor: env.VITE_PWA_THEME_COLOR,
  backgroundColor: env.VITE_PWA_BACKGROUND_COLOR,
  display: env.VITE_PWA_DISPLAY
});

// Crisis resources helper
export const getCrisisResources = () => ({
  hotline: env.VITE_CRISIS_HOTLINE,
  textLine: env.VITE_CRISIS_TEXT_LINE,
  emergency: env.VITE_EMERGENCY_NUMBER
});

// Logging configuration
export const getLogConfig = () => ({
  level: env.VITE_LOG_LEVEL,
  enableErrorTracking: env.VITE_ENABLE_ERROR_TRACKING,
  sentryDsn: env.VITE_SENTRY_DSN
});

// Load and validate environment variables
export const loadAndValidateEnv = () => {
  try {
    return env;
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw new Error('Failed to load and validate environment variables');
  }
};

// Export the schema for testing
export { envSchema };

// Default export
export default env;