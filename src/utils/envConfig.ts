/**
 * Environment Configuration Utility
 * 
 * Handles both Vite (import.meta.env) and Jest (process.env) environments
 * with comprehensive configuration management for mental health platform.
 * 
 * @fileoverview Environment configuration with cross-platform support
 * @version 2.0.0
 */

// Declare process for TypeScript compatibility
declare const process: any;

/**
 * Environment variable interface
 */
export interface EnvironmentConfig {
  // API Configuration
  API_BASE_URL: string;
  
  // Auth0 Configuration
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_CALLBACK_URL: string;
  AUTH0_AUDIENCE: string;
  AUTH0_CLIENT_SECRET: string;
  
  // Anonymous Access Configuration
  AUTH_OPTIONAL: boolean;
  ALLOW_ANONYMOUS: boolean;
  ENABLE_ANONYMOUS_CHAT: boolean;
  BYPASS_AUTH: boolean;
  MOCK_API: boolean;
  
  // Crisis Resources
  CRISIS_HOTLINE: string;
  CRISIS_TEXT_LINE: string;
  
  // Push Notifications
  VAPID_PUBLIC_KEY: string;
  
  // WebSocket
  WS_URL: string;
  
  // Sentry
  SENTRY_DSN: string;
  SENTRY_DEV_ENABLED: boolean;
  
  // App Info
  APP_VERSION: string;
  ENV: string;
  
  // Flags
  IS_DEV: boolean;
  IS_PROD: boolean;
  IS_TEST: boolean;
}

/**
 * Get environment variable value with fallback support
 * Works in both Vite and Jest environments
 */
export function getEnvVar(key: string, defaultValue: string = ''): string {
  // Check if we're in a Node/Jest environment
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  // For Vite environment, check import.meta.env
  if (typeof window !== 'undefined') {
    // @ts-ignore - Vite specific
    const viteEnv = (globalThis as any).import?.meta?.env;
    if (viteEnv && viteEnv[key]) {
      return viteEnv[key];
    }

    // Fallback to global env object
    // @ts-ignore
    const globalEnv = window.__VITE_ENV__ || {};
    if (globalEnv[key]) {
      return globalEnv[key];
    }
  }

  return defaultValue;
}

/**
 * Check if we're in development mode
 */
export function isDev(): boolean {
  // Check Node environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return true;
  }

  // Check Vite environment
  if (typeof window !== 'undefined') {
    // @ts-ignore - Vite specific
    const viteEnv = (globalThis as any).import?.meta?.env;
    if (viteEnv?.DEV === true) {
      return true;
    }

    // @ts-ignore
    return window.__VITE_ENV__?.DEV === true;
  }

  return false;
}

/**
 * Check if we're in production mode
 */
export function isProd(): boolean {
  // Check Node environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return true;
  }

  // Check Vite environment
  if (typeof window !== 'undefined') {
    // @ts-ignore - Vite specific
    const viteEnv = (globalThis as any).import?.meta?.env;
    if (viteEnv?.PROD === true) {
      return true;
    }

    // @ts-ignore
    return window.__VITE_ENV__?.PROD === true;
  }

  return false;
}

/**
 * Check if we're in test mode
 */
export function isTest(): boolean {
  // Check Node environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return true;
  }

  // Check for Jest environment
  if (typeof process !== 'undefined' && process.env?.JEST_WORKER_ID) {
    return true;
  }

  return false;
}

/**
 * Get boolean environment variable
 */
export function getBoolEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key, defaultValue.toString()).toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Get numeric environment variable
 */
export function getNumEnvVar(key: string, defaultValue: number = 0): number {
  const value = getEnvVar(key, defaultValue.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Initialize the global env object for Vite runtime
 */
function initializeGlobalEnv(): void {
  if (typeof window !== 'undefined' && !window.__VITE_ENV__) {
    try {
      // Check if we're in a Vite environment (import.meta is available)
      // @ts-ignore - This will only work in Vite environment
      const importMeta = (globalThis as any).import?.meta;
      
      if (importMeta?.env && typeof importMeta.env === 'object') {
        // @ts-ignore - This will only work in Vite environment
        window.__VITE_ENV__ = importMeta.env;
      } else {
        window.__VITE_ENV__ = {};
      }
    } catch {
      // Not in Vite environment (Jest, Node, etc.)
      window.__VITE_ENV__ = {};
    }
  }
}

// Initialize global environment
initializeGlobalEnv();

/**
 * Get all environment variables for the app
 */
export const ENV: EnvironmentConfig = {
  // API Configuration
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3847/api'),

  // Auth0 Configuration
  AUTH0_DOMAIN: getEnvVar('VITE_AUTH0_DOMAIN', 'dev-placeholder.auth0.com'),
  AUTH0_CLIENT_ID: getEnvVar('VITE_AUTH0_CLIENT_ID', 'placeholder-client-id'),
  AUTH0_CALLBACK_URL: getEnvVar(
    'VITE_AUTH0_CALLBACK_URL',
    typeof window !== 'undefined' ? window.location.origin + '/callback' : ''
  ),
  AUTH0_AUDIENCE: getEnvVar('VITE_AUTH0_AUDIENCE', 'http://localhost:3847/api'),
  AUTH0_CLIENT_SECRET: getEnvVar('VITE_AUTH0_CLIENT_SECRET', 'placeholder-secret'),

  // Anonymous Access Configuration
  AUTH_OPTIONAL: getBoolEnvVar('VITE_AUTH_OPTIONAL', true),
  ALLOW_ANONYMOUS: getBoolEnvVar('VITE_ALLOW_ANONYMOUS', true),
  ENABLE_ANONYMOUS_CHAT: getBoolEnvVar('VITE_ENABLE_ANONYMOUS_CHAT', true),
  BYPASS_AUTH: getBoolEnvVar('VITE_BYPASS_AUTH', true),
  MOCK_API: getBoolEnvVar('VITE_MOCK_API', true),

  // Crisis Resources
  CRISIS_HOTLINE: getEnvVar('VITE_CRISIS_HOTLINE', '988'),
  CRISIS_TEXT_LINE: getEnvVar('VITE_CRISIS_TEXT_LINE', '741741'),

  // Push Notifications
  VAPID_PUBLIC_KEY: getEnvVar(
    'VITE_VAPID_PUBLIC_KEY',
    isDev() ? 'BPrE3_xJcGZo5xOiKh_1G5VhbGxqr4K7SLkJtNhE9f2sQcDvRwXfOhY3zP8mKnN1wRtYuCvBmNzLkDhElLLr-I' : ''
  ),

  // WebSocket
  WS_URL: getEnvVar(
    'VITE_WS_URL',
    isDev() ? 'ws://localhost:3001' : 'wss://api.astralcore.app'
  ),

  // Sentry
  SENTRY_DSN: getEnvVar('VITE_SENTRY_DSN', ''),
  SENTRY_DEV_ENABLED: getBoolEnvVar('VITE_SENTRY_DEV_ENABLED', false),

  // App Info
  APP_VERSION: getEnvVar('VITE_APP_VERSION', 'unknown'),
  ENV: getEnvVar('VITE_ENV', 'production'),

  // Flags
  IS_DEV: isDev(),
  IS_PROD: isProd(),
  IS_TEST: isTest()
};

/**
 * Validate required environment variables
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required in production
  if (isProd()) {
    const requiredProdVars = [
      'VITE_API_BASE_URL',
      'VITE_AUTH0_DOMAIN',
      'VITE_AUTH0_CLIENT_ID'
    ];

    requiredProdVars.forEach(varName => {
      if (!getEnvVar(varName)) {
        errors.push(`Missing required production environment variable: ${varName}`);
      }
    });
  }

  // Validate URLs
  const urlVars = [
    { key: 'VITE_API_BASE_URL', value: ENV.API_BASE_URL },
    { key: 'VITE_WS_URL', value: ENV.WS_URL }
  ];

  urlVars.forEach(({ key, value }) => {
    if (value && !isValidUrl(value)) {
      errors.push(`Invalid URL format for ${key}: ${value}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    ...ENV,
    validation: validateEnvironment()
  };
}

/**
 * Debug environment configuration (development only)
 */
export function debugEnvironment(): void {
  if (isDev()) {
    console.group('🔧 Environment Configuration');
    console.log('Environment:', ENV.ENV);
    console.log('Development Mode:', ENV.IS_DEV);
    console.log('Production Mode:', ENV.IS_PROD);
    console.log('Test Mode:', ENV.IS_TEST);
    console.log('API Base URL:', ENV.API_BASE_URL);
    console.log('WebSocket URL:', ENV.WS_URL);
    console.log('Auth Optional:', ENV.AUTH_OPTIONAL);
    console.log('Mock API:', ENV.MOCK_API);
    
    const validation = validateEnvironment();
    if (!validation.isValid) {
      console.warn('Environment Validation Errors:', validation.errors);
    }
    
    console.groupEnd();
  }
}

// Auto-debug in development
if (isDev() && typeof window !== 'undefined') {
  // Delay to ensure all modules are loaded
  setTimeout(debugEnvironment, 1000);
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    __VITE_ENV__?: any;
  }
}

// Default export
export default ENV;
