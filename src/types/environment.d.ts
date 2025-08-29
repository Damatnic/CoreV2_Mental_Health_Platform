/**
 * Comprehensive Environment Type Definitions
 * Unifies environment variable access across different contexts
 */

/// <reference types="vite/client" />
/// <reference types="node" />

// Extend global namespace for cross-environment compatibility
declare global {
  // Unified environment interface
  interface EnvironmentVariables {
    // Core Environment
    NODE_ENV?: 'development' | 'production' | 'test' | 'staging';
    APP_ENV?: 'development' | 'staging' | 'production';
    MODE?: string;
    DEBUG?: string;
    
    // API Configuration
    API_URL?: string;
    API_BASE_URL?: string;
    BACKEND_URL?: string;
    WS_URL?: string;
    WEBSOCKET_URL?: string;
    GRAPHQL_URL?: string;
    
    // Authentication
    AUTH0_DOMAIN?: string;
    AUTH0_CLIENT_ID?: string;
    AUTH0_AUDIENCE?: string;
    AUTH0_REDIRECT_URI?: string;
    AUTH0_SCOPE?: string;
    
    // Supabase
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_KEY?: string;
    
    // Crisis Services
    CRISIS_API_KEY?: string;
    CRISIS_API_URL?: string;
    CRISIS_HOTLINE_988_ENABLED?: string;
    CRISIS_TEXT_LINE_API?: string;
    CRISIS_DETECTION_ENABLED?: string;
    CRISIS_DETECTION_SENSITIVITY?: string;
    EMERGENCY_SERVICES_ENABLED?: string;
    
    // Analytics and Monitoring
    SENTRY_DSN?: string;
    SENTRY_ENVIRONMENT?: string;
    SENTRY_RELEASE?: string;
    SENTRY_TRACE_SAMPLE_RATE?: string;
    GA_TRACKING_ID?: string;
    MIXPANEL_TOKEN?: string;
    ENABLE_ANALYTICS?: string;
    ENABLE_PERFORMANCE_MONITORING?: string;
    
    // Feature Flags
    ENABLE_PWA?: string;
    ENABLE_OFFLINE_MODE?: string;
    ENABLE_PUSH_NOTIFICATIONS?: string;
    ENABLE_PEER_SUPPORT?: string;
    ENABLE_AI_CHAT?: string;
    ENABLE_VOICE_CHAT?: string;
    ENABLE_VIDEO_SESSIONS?: string;
    ENABLE_CRISIS_DETECTION?: string;
    ENABLE_MOOD_TRACKING?: string;
    ENABLE_JOURNALING?: string;
    ENABLE_MEDITATION?: string;
    ENABLE_COMMUNITY?: string;
    ENABLE_THERAPIST_CONNECT?: string;
    ENABLE_GROUP_THERAPY?: string;
    ENABLE_SAFETY_PLANNING?: string;
    
    // Security
    ENCRYPTION_KEY?: string;
    JWT_SECRET?: string;
    SESSION_SECRET?: string;
    CSP_ENABLED?: string;
    CSP_REPORT_URI?: string;
    ENABLE_HIPAA_MODE?: string;
    AUDIT_LOG_ENABLED?: string;
    
    // Third-party Services
    OPENAI_API_KEY?: string;
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_PHONE_NUMBER?: string;
    SENDGRID_API_KEY?: string;
    STRIPE_PUBLIC_KEY?: string;
    STRIPE_SECRET_KEY?: string;
    
    // Push Notifications
    VAPID_PUBLIC_KEY?: string;
    VAPID_PRIVATE_KEY?: string;
    FCM_SERVER_KEY?: string;
    
    // Storage
    STORAGE_BUCKET?: string;
    CDN_URL?: string;
    CLOUDINARY_URL?: string;
    
    // Development
    MOCK_API?: string;
    DEBUG_MODE?: string;
    LOG_LEVEL?: string;
    TEST_MODE?: string;
    E2E_TEST?: string;
    
    // Localization
    DEFAULT_LOCALE?: string;
    SUPPORTED_LOCALES?: string;
    
    // App Metadata
    APP_NAME?: string;
    APP_VERSION?: string;
    APP_BUILD_TIME?: string;
    APP_BUILD_NUMBER?: string;
    
    // Custom
    [key: string]: string | undefined;
  }
  
  // Process.env extension for Node.js compatibility
  namespace NodeJS {
    interface ProcessEnv extends EnvironmentVariables {
      // Node-specific variables
      PATH?: string;
      HOME?: string;
      USER?: string;
      SHELL?: string;
      TERM?: string;
      LANG?: string;
      TZ?: string;
      
      // CI/CD
      CI?: string;
      CI_COMMIT_SHA?: string;
      CI_BRANCH?: string;
      CI_TAG?: string;
      GITHUB_ACTIONS?: string;
      GITHUB_SHA?: string;
      GITHUB_REF?: string;
      
      // Testing
      JEST_WORKER_ID?: string;
      TEST_SUITE?: string;
      COVERAGE?: string;
    }
  }
  
  // Vite's import.meta.env extension
  interface ImportMetaEnv extends EnvironmentVariables {
    // Vite-specific prefixed variables
    readonly VITE_NODE_ENV?: string;
    readonly VITE_API_URL?: string;
    readonly VITE_AUTH0_DOMAIN?: string;
    readonly VITE_AUTH0_CLIENT_ID?: string;
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_SENTRY_DSN?: string;
    readonly VITE_ENABLE_ANALYTICS?: string;
    readonly VITE_ENABLE_PWA?: string;
    readonly VITE_CRISIS_API_KEY?: string;
    readonly VITE_988_API_KEY?: string;
    
    // Built-in Vite variables
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly SSR: boolean;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
    readonly hot?: {
      readonly data: any;
      accept(): void;
      accept(cb: (mod: any) => void): void;
      accept(dep: string, cb: (mod: any) => void): void;
      accept(deps: readonly string[], cb: (mods: any[]) => void): void;
      dispose(cb: (data: any) => void): void;
      decline(): void;
      invalidate(): void;
      on(event: string, cb: (...args: any[]) => void): void;
    };
  }
  
  // Window environment for runtime config
  interface Window {
    __ENV__?: EnvironmentVariables;
    __RUNTIME_CONFIG__?: {
      apiUrl?: string;
      wsUrl?: string;
      authDomain?: string;
      features?: Record<string, boolean>;
      [key: string]: any;
    };
    __FEATURE_FLAGS__?: Record<string, boolean>;
    __DEBUG__?: boolean;
    __APP_VERSION__?: string;
    __BUILD_TIME__?: string;
  }
}

// Environment detection type guards
export type EnvironmentMode = 'development' | 'production' | 'test' | 'staging';
export type Platform = 'browser' | 'node' | 'webworker' | 'electron' | 'react-native';

export interface EnvironmentInfo {
  mode: EnvironmentMode;
  platform: Platform;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  isStaging: boolean;
  isBrowser: boolean;
  isNode: boolean;
  isWebWorker: boolean;
  features: Record<string, boolean>;
}

// Environment variable access interface
export interface IEnvironmentService {
  get(key: string, defaultValue?: string): string | undefined;
  getBoolean(key: string, defaultValue?: boolean): boolean;
  getNumber(key: string, defaultValue?: number): number;
  getJSON<T>(key: string, defaultValue?: T): T | undefined;
  getMode(): EnvironmentMode;
  getPlatform(): Platform;
  getInfo(): EnvironmentInfo;
  isFeatureEnabled(feature: string): boolean;
}

// Crisis service configuration
export interface CrisisServiceConfig {
  enabled: boolean;
  apiKey?: string;
  apiUrl?: string;
  hotline988Enabled: boolean;
  textLineEnabled: boolean;
  detectionEnabled: boolean;
  detectionSensitivity: 'low' | 'medium' | 'high';
  emergencyServicesEnabled: boolean;
  hotlines: {
    suicide: string;
    crisis: string;
    emergency: string;
    text: string;
  };
}

// Mental health platform specific configuration
export interface MentalHealthConfig {
  crisis: CrisisServiceConfig;
  features: {
    aiChat: boolean;
    peerSupport: boolean;
    moodTracking: boolean;
    journaling: boolean;
    meditation: boolean;
    community: boolean;
    therapistConnect: boolean;
    groupTherapy: boolean;
    safetyPlanning: boolean;
    voiceChat: boolean;
    videoSessions: boolean;
  };
  privacy: {
    hipaaMode: boolean;
    auditLogEnabled: boolean;
    dataRetentionDays: number;
    encryptionEnabled: boolean;
  };
  notifications: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    inAppEnabled: boolean;
  };
}

// Export empty object to make this a module
export {};

// Module augmentation for libraries
declare module '@auth0/auth0-react' {
  export interface Auth0ProviderOptions {
    domain?: string;
    clientId?: string;
    redirectUri?: string;
    audience?: string;
    scope?: string;
    cacheLocation?: 'memory' | 'localstorage';
  }
}

declare module '@supabase/supabase-js' {
  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
  }
}