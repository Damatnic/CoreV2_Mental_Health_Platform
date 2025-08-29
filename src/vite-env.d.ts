/// <reference types="vite/client" />

/**
 * Vite environment variable type definitions
 * Provides proper typing for import.meta.env variables
 */

interface ImportMetaEnv {
  // Core application environment
  readonly VITE_NODE_ENV?: string;
  readonly VITE_APP_ENV?: 'development' | 'staging' | 'production';
  readonly VITE_APP_VERSION?: string;
  
  // API and Backend Configuration
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_WEBSOCKET_URL?: string;
  
  // Supabase Configuration
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_SERVICE_KEY?: string;
  
  // Auth0 Configuration
  readonly VITE_AUTH0_DOMAIN?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
  readonly VITE_AUTH0_AUDIENCE?: string;
  readonly VITE_AUTH0_REDIRECT_URI?: string;
  
  // Crisis and Emergency Services
  readonly VITE_CRISIS_API_KEY?: string;
  readonly VITE_988_API_KEY?: string;
  readonly VITE_CRISIS_TEXT_LINE_API?: string;
  readonly VITE_EMERGENCY_SERVICES_ENABLED?: string;
  readonly VITE_CRISIS_DETECTION_ENABLED?: string;
  
  // Error Tracking and Analytics
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  readonly VITE_SENTRY_TRACE_SAMPLE_RATE?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_GA_TRACKING_ID?: string;
  readonly VITE_MIXPANEL_TOKEN?: string;
  
  // Feature Flags
  readonly VITE_ENABLE_PWA?: string;
  readonly VITE_ENABLE_OFFLINE_MODE?: string;
  readonly VITE_ENABLE_PUSH_NOTIFICATIONS?: string;
  readonly VITE_ENABLE_PEER_SUPPORT?: string;
  readonly VITE_ENABLE_AI_CHAT?: string;
  readonly VITE_ENABLE_VOICE_CHAT?: string;
  readonly VITE_ENABLE_VIDEO_SESSIONS?: string;
  readonly VITE_ENABLE_CRISIS_DETECTION?: string;
  readonly VITE_ENABLE_MOOD_TRACKING?: string;
  readonly VITE_ENABLE_JOURNALING?: string;
  readonly VITE_ENABLE_MEDITATION?: string;
  readonly VITE_ENABLE_COMMUNITY?: string;
  
  // Security and Encryption
  readonly VITE_ENCRYPTION_KEY?: string;
  readonly VITE_JWT_SECRET?: string;
  readonly VITE_SESSION_SECRET?: string;
  readonly VITE_ENABLE_CSP?: string;
  readonly VITE_CSP_REPORT_URI?: string;
  
  // Third-party Services
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_TWILIO_ACCOUNT_SID?: string;
  readonly VITE_TWILIO_AUTH_TOKEN?: string;
  readonly VITE_TWILIO_PHONE_NUMBER?: string;
  readonly VITE_SENDGRID_API_KEY?: string;
  readonly VITE_STRIPE_PUBLIC_KEY?: string;
  
  // Push Notifications
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_VAPID_PRIVATE_KEY?: string;
  readonly VITE_FCM_SERVER_KEY?: string;
  
  // Storage and CDN
  readonly VITE_STORAGE_BUCKET?: string;
  readonly VITE_CDN_URL?: string;
  readonly VITE_CLOUDINARY_URL?: string;
  
  // Development and Testing
  readonly VITE_MOCK_API?: string;
  readonly VITE_DEBUG_MODE?: string;
  readonly VITE_LOG_LEVEL?: string;
  readonly VITE_TEST_MODE?: string;
  readonly VITE_E2E_TEST?: string;
  
  // Localization
  readonly VITE_DEFAULT_LOCALE?: string;
  readonly VITE_SUPPORTED_LOCALES?: string;
  
  // Performance
  readonly VITE_ENABLE_PERFORMANCE_MONITORING?: string;
  readonly VITE_PERFORMANCE_API_KEY?: string;
  
  // HIPAA Compliance
  readonly VITE_ENABLE_HIPAA_MODE?: string;
  readonly VITE_AUDIT_LOG_ENABLED?: string;
  readonly VITE_DATA_RETENTION_DAYS?: string;
  
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

// Module declarations for static assets
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.avif' {
  const src: string;
  export default src;
}

declare module '*.ico' {
  const src: string;
  export default src;
}

declare module '*.bmp' {
  const src: string;
  export default src;
}

// Style modules
declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.styl' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.styl' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// JSON modules
declare module '*.json' {
  const value: any;
  export default value;
}

// Worker modules
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

declare module '*?worker&inline' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

declare module '*?sharedworker' {
  const sharedWorkerConstructor: {
    new (): SharedWorker;
  };
  export default sharedWorkerConstructor;
}

// URL imports
declare module '*?url' {
  const src: string;
  export default src;
}

declare module '*?raw' {
  const src: string;
  export default src;
}

// WebAssembly
declare module '*.wasm' {
  const initWasm: (options?: WebAssembly.Imports) => Promise<WebAssembly.Exports>;
  export default initWasm;
}

// Web Workers
declare module 'worker:*' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}