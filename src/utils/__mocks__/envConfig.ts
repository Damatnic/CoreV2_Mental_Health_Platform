// Mock environment configuration for testing
export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  API_BASE_URL: string;
  WEBSOCKET_URL: string;
  ANALYTICS_KEY?: string;
  SENTRY_DSN?: string;
  AI_SERVICE_URL: string;
  AI_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  CRISIS_HOTLINE_NUMBER: string;
  CRISIS_TEXT_NUMBER: string;
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_TRACKING: boolean;
  ENABLE_AI_FEATURES: boolean;
  ENABLE_PEER_SUPPORT: boolean;
  MAX_FILE_UPLOAD_SIZE: number;
  SESSION_TIMEOUT: number;
  PRIVACY_MODE: boolean;
  DEBUG_MODE: boolean;
}

// Mock environment values for testing
const mockEnvConfig: EnvConfig = {
  NODE_ENV: 'test',
  API_BASE_URL: 'http://localhost:3001/api',
  WEBSOCKET_URL: 'ws://localhost:3001',
  ANALYTICS_KEY: 'mock-analytics-key-123',
  SENTRY_DSN: 'mock-sentry-dsn-for-testing',
  AI_SERVICE_URL: 'http://localhost:8000/ai',
  AI_API_KEY: 'mock-ai-api-key-456',
  SUPABASE_URL: 'https://mock.supabase.co',
  SUPABASE_ANON_KEY: 'mock-supabase-anon-key-789',
  CRISIS_HOTLINE_NUMBER: '988',
  CRISIS_TEXT_NUMBER: '741741',
  ENABLE_ANALYTICS: false, // Disabled in tests
  ENABLE_ERROR_TRACKING: false, // Disabled in tests
  ENABLE_AI_FEATURES: true,
  ENABLE_PEER_SUPPORT: true,
  MAX_FILE_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  PRIVACY_MODE: true,
  DEBUG_MODE: true
};

// Environment-specific overrides
const envOverrides: Partial<Record<EnvConfig['NODE_ENV'], Partial<EnvConfig>>> = {
  development: {
    DEBUG_MODE: true,
    ENABLE_ANALYTICS: false,
    PRIVACY_MODE: false,
    SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour in dev
  },
  production: {
    DEBUG_MODE: false,
    ENABLE_ANALYTICS: true,
    ENABLE_ERROR_TRACKING: true,
    PRIVACY_MODE: true,
    AI_SERVICE_URL: 'https://api.example.com/ai',
    API_BASE_URL: 'https://api.example.com',
    WEBSOCKET_URL: 'wss://api.example.com',
    SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes in prod
  },
  test: {
    DEBUG_MODE: false,
    ENABLE_ANALYTICS: false,
    ENABLE_ERROR_TRACKING: false,
    PRIVACY_MODE: true,
    API_BASE_URL: 'http://mock-api.test',
    WEBSOCKET_URL: 'ws://mock-api.test',
    AI_SERVICE_URL: 'http://mock-ai.test',
    SESSION_TIMEOUT: 5 * 60 * 1000, // 5 minutes in tests
  }
};

// Merge configuration based on environment
export function getEnvConfig(environment?: EnvConfig['NODE_ENV']): EnvConfig {
  const env = environment || mockEnvConfig.NODE_ENV;
  const overrides = envOverrides[env] || {};
  
  return {
    ...mockEnvConfig,
    NODE_ENV: env,
    ...overrides
  };
}

// Individual config getters
export function getApiBaseUrl(env?: EnvConfig['NODE_ENV']): string {
  return getEnvConfig(env).API_BASE_URL;
}

export function getWebSocketUrl(env?: EnvConfig['NODE_ENV']): string {
  return getEnvConfig(env).WEBSOCKET_URL;
}

export function getAIServiceUrl(env?: EnvConfig['NODE_ENV']): string {
  return getEnvConfig(env).AI_SERVICE_URL;
}

export function isFeatureEnabled(feature: keyof Pick<EnvConfig, 
  'ENABLE_ANALYTICS' | 'ENABLE_ERROR_TRACKING' | 'ENABLE_AI_FEATURES' | 'ENABLE_PEER_SUPPORT'
>, env?: EnvConfig['NODE_ENV']): boolean {
  return getEnvConfig(env)[feature];
}

export function getUploadLimits(env?: EnvConfig['NODE_ENV']): {
  maxFileSize: number;
  allowedTypes: string[];
} {
  const config = getEnvConfig(env);
  return {
    maxFileSize: config.MAX_FILE_UPLOAD_SIZE,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/markdown'
    ]
  };
}

export function getCrisisContactInfo(env?: EnvConfig['NODE_ENV']): {
  hotline: string;
  textLine: string;
  emergencyMessage: string;
} {
  const config = getEnvConfig(env);
  return {
    hotline: config.CRISIS_HOTLINE_NUMBER,
    textLine: config.CRISIS_TEXT_NUMBER,
    emergencyMessage: 'If you are in immediate danger, please call 911 or go to your nearest emergency room.'
  };
}

export function getPrivacySettings(env?: EnvConfig['NODE_ENV']): {
  privacyMode: boolean;
  dataRetentionDays: number;
  anonymousAllowed: boolean;
  encryptionEnabled: boolean;
} {
  const config = getEnvConfig(env);
  return {
    privacyMode: config.PRIVACY_MODE,
    dataRetentionDays: config.NODE_ENV === 'production' ? 90 : 30,
    anonymousAllowed: true,
    encryptionEnabled: config.NODE_ENV === 'production' || config.PRIVACY_MODE
  };
}

export function getSessionConfig(env?: EnvConfig['NODE_ENV']): {
  timeout: number;
  refreshThreshold: number;
  maxConcurrentSessions: number;
} {
  const config = getEnvConfig(env);
  return {
    timeout: config.SESSION_TIMEOUT,
    refreshThreshold: config.SESSION_TIMEOUT * 0.8, // Refresh at 80% of timeout
    maxConcurrentSessions: config.NODE_ENV === 'production' ? 3 : 10
  };
}

// Mock feature flags for A/B testing
export function getFeatureFlags(env?: EnvConfig['NODE_ENV']): Record<string, boolean> {
  const config = getEnvConfig(env);
  
  return {
    // Core features
    enableAIChat: config.ENABLE_AI_FEATURES,
    enablePeerSupport: config.ENABLE_PEER_SUPPORT,
    enableAnalytics: config.ENABLE_ANALYTICS,
    enableErrorTracking: config.ENABLE_ERROR_TRACKING,
    
    // Experimental features (always false in production for safety)
    enableBetaFeatures: config.NODE_ENV !== 'production',
    enableAdvancedAnalytics: config.NODE_ENV === 'development',
    enableExperimentalUI: config.NODE_ENV === 'development',
    enableOfflineMode: true,
    enablePushNotifications: config.NODE_ENV !== 'test',
    enableVoiceMessages: config.NODE_ENV !== 'test',
    enableVideoChat: false, // Not implemented yet
    enableFileSharing: config.NODE_ENV !== 'test',
    
    // Mental health specific
    enableMoodTracking: true,
    enableWellnessGoals: true,
    enableCrisisDetection: true,
    enableSafetyPlanning: true,
    enableJournaling: true,
    enableMindfulnessTimer: true,
    
    // Privacy features
    enableAnonymousMode: true,
    enableDataExport: true,
    enableAccountDeletion: true,
    enableE2EEncryption: config.PRIVACY_MODE
  };
}

// Validation helpers
export function validateConfig(config: Partial<EnvConfig>): string[] {
  const errors: string[] = [];
  
  if (!config.API_BASE_URL) {
    errors.push('API_BASE_URL is required');
  }
  
  if (!config.AI_SERVICE_URL) {
    errors.push('AI_SERVICE_URL is required');
  }
  
  if (!config.CRISIS_HOTLINE_NUMBER) {
    errors.push('CRISIS_HOTLINE_NUMBER is required');
  }
  
  if (config.MAX_FILE_UPLOAD_SIZE && config.MAX_FILE_UPLOAD_SIZE > 50 * 1024 * 1024) {
    errors.push('MAX_FILE_UPLOAD_SIZE should not exceed 50MB');
  }
  
  if (config.SESSION_TIMEOUT && config.SESSION_TIMEOUT < 60000) {
    errors.push('SESSION_TIMEOUT should be at least 1 minute');
  }
  
  return errors;
}

// Test utilities
export function createTestConfig(overrides: Partial<EnvConfig> = {}): EnvConfig {
  return {
    ...mockEnvConfig,
    NODE_ENV: 'test',
    ...overrides
  };
}

export function resetMockConfig(): void {
  // Reset any internal state if needed
  console.log('Mock environment config reset');
}

// Export the default mock config
export default getEnvConfig();
