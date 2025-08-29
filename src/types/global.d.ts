/**
 * Global type definitions for Node.js and browser environments
 * Provides typing for process, global, and other runtime globals
 */

/// <reference types="node" />

// Node.js global types
declare global {
  // Process environment variables
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      PUBLIC_URL?: string;
      
      // React and Build
      REACT_APP_VERSION?: string;
      REACT_APP_BUILD_TIME?: string;
      
      // API Configuration
      REACT_APP_API_URL?: string;
      REACT_APP_BACKEND_URL?: string;
      
      // Auth Configuration
      REACT_APP_AUTH0_DOMAIN?: string;
      REACT_APP_AUTH0_CLIENT_ID?: string;
      
      // Crisis Services
      REACT_APP_CRISIS_API_KEY?: string;
      REACT_APP_988_ENABLED?: string;
      
      // Testing
      CI?: string;
      JEST_WORKER_ID?: string;
      
      // Custom environment variables
      [key: string]: string | undefined;
    }
    
    interface Process {
      env: ProcessEnv;
    }
    
    interface Global {
      // Testing utilities
      __DEV__?: boolean;
      __TEST__?: boolean;
      __PROD__?: boolean;
      
      // Crisis detection flags
      __CRISIS_MODE__?: boolean;
      __SAFETY_MODE__?: boolean;
      
      // Performance monitoring
      __PERFORMANCE_MARK__?: (name: string) => void;
      __PERFORMANCE_MEASURE__?: (name: string, startMark: string, endMark: string) => void;
      
      // Error tracking
      __ERROR_HANDLER__?: (error: Error, errorInfo?: any) => void;
      __SENTRY__?: any;
      
      // Feature flags
      __FEATURES__?: {
        [key: string]: boolean;
      };
      
      // Debugging
      __DEBUG__?: boolean;
      __LOG_LEVEL__?: 'debug' | 'info' | 'warn' | 'error';
      
      // Testing helpers
      __MOCK_API__?: boolean;
      __TEST_USER__?: any;
      
      // Browser globals in Node environment (for SSR)
      window?: Window & typeof globalThis;
      document?: Document;
      navigator?: Navigator;
      location?: Location;
    }
  }
  
  // Ensure process is available globally
  var process: NodeJS.Process;
  var global: NodeJS.Global;
  
  // Buffer type for Node.js
  var Buffer: {
    from(data: any, encoding?: string): Buffer;
    alloc(size: number): Buffer;
    allocUnsafe(size: number): Buffer;
    isBuffer(obj: any): obj is Buffer;
    concat(buffers: Buffer[]): Buffer;
  };
  
  // Common Node.js globals
  var __dirname: string;
  var __filename: string;
  var require: NodeRequire;
  var module: NodeModule;
  var exports: any;
  
  // Timer functions
  var setImmediate: (callback: () => void) => NodeJS.Immediate;
  var clearImmediate: (immediate: NodeJS.Immediate) => void;
  
  // Console extensions
  interface Console {
    success?(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    error(message?: any, ...optionalParams: any[]): void;
    debug?(message?: any, ...optionalParams: any[]): void;
    trace(message?: any, ...optionalParams: any[]): void;
    group(label?: string): void;
    groupCollapsed(label?: string): void;
    groupEnd(): void;
    time(label?: string): void;
    timeEnd(label?: string): void;
    timeLog(label?: string, ...data: any[]): void;
    table(data: any, columns?: string[]): void;
    dir(obj: any, options?: any): void;
    dirxml(obj: any): void;
    profile(label?: string): void;
    profileEnd(label?: string): void;
  }
  
  // Window extensions for browser environment
  interface Window {
    // Environment flags
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
    __REDUX_DEVTOOLS_EXTENSION__?: any;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
    
    // Service Worker
    workbox?: any;
    
    // Analytics
    gtag?: (...args: any[]) => void;
    ga?: (...args: any[]) => void;
    mixpanel?: any;
    
    // Error tracking
    Sentry?: any;
    
    // Crisis services
    __CRISIS_HOTLINE__?: string;
    __CRISIS_TEXT_LINE__?: string;
    __EMERGENCY_CONTACTS__?: any[];
    
    // Performance
    performance: Performance;
    PerformanceObserver?: any;
    
    // Crypto
    crypto: Crypto;
    
    // Storage
    localStorage: Storage;
    sessionStorage: Storage;
    
    // IndexedDB
    indexedDB: IDBFactory;
    
    // Web APIs
    Notification?: any;
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
    MediaRecorder?: any;
    
    // Custom properties
    __APP_VERSION__?: string;
    __APP_BUILD_TIME__?: string;
    __USER_PREFERENCES__?: any;
    __FEATURE_FLAGS__?: Record<string, boolean>;
  }
  
  // Navigator extensions
  interface Navigator {
    // Network Information API
    connection?: {
      effectiveType?: '2g' | '3g' | '4g' | '5g';
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
      addEventListener?: (type: string, handler: () => void) => void;
      removeEventListener?: (type: string, handler: () => void) => void;
    };
    
    // Permissions API
    permissions?: {
      query(descriptor: any): Promise<any>;
    };
    
    // Clipboard API
    clipboard?: {
      writeText(text: string): Promise<void>;
      readText(): Promise<string>;
    };
    
    // Share API
    share?: (data: any) => Promise<void>;
    canShare?: (data: any) => boolean;
    
    // Vibration API
    vibrate?: (pattern: number | number[]) => boolean;
    
    // Battery API
    getBattery?: () => Promise<any>;
    
    // Device Memory
    deviceMemory?: number;
    
    // Hardware Concurrency
    hardwareConcurrency?: number;
    
    // Storage
    storage?: {
      estimate(): Promise<{ usage: number; quota: number }>;
      persist(): Promise<boolean>;
      persisted(): Promise<boolean>;
    };
    
    // Service Worker
    serviceWorker?: ServiceWorkerContainer;
  }
  
  // Performance extensions
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
    measureUserAgentSpecificMemory?: () => Promise<any>;
  }
  
  // Crypto extensions
  interface Crypto {
    randomUUID?: () => string;
  }
  
  // Document extensions
  interface Document {
    // Fullscreen API
    exitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => void;
    mozCancelFullScreen?: () => void;
    msExitFullscreen?: () => void;
    
    // Visibility API
    hidden?: boolean;
    visibilityState?: 'visible' | 'hidden' | 'prerender';
    
    // Picture-in-Picture API
    exitPictureInPicture?: () => Promise<void>;
    pictureInPictureElement?: Element | null;
  }
  
  // Element extensions
  interface Element {
    // Fullscreen API
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => void;
    mozRequestFullScreen?: () => void;
    msRequestFullscreen?: () => void;
    
    // Picture-in-Picture API
    requestPictureInPicture?: () => Promise<any>;
  }
  
  // Testing globals (Jest)
  var jest: typeof import('@jest/globals')['jest'];
  var expect: typeof import('@jest/globals')['expect'];
  var describe: typeof import('@jest/globals')['describe'];
  var it: typeof import('@jest/globals')['it'];
  var test: typeof import('@jest/globals')['test'];
  var beforeEach: typeof import('@jest/globals')['beforeEach'];
  var afterEach: typeof import('@jest/globals')['afterEach'];
  var beforeAll: typeof import('@jest/globals')['beforeAll'];
  var afterAll: typeof import('@jest/globals')['afterAll'];
  
  // Testing library globals
  var screen: typeof import('@testing-library/react')['screen'];
  var render: typeof import('@testing-library/react')['render'];
  var fireEvent: typeof import('@testing-library/react')['fireEvent'];
  var waitFor: typeof import('@testing-library/react')['waitFor'];
  var act: typeof import('@testing-library/react')['act'];
  
  // Environment detection helpers
  const IS_BROWSER: boolean;
  const IS_NODE: boolean;
  const IS_WEBWORKER: boolean;
  const IS_PRODUCTION: boolean;
  const IS_DEVELOPMENT: boolean;
  const IS_TEST: boolean;
}

// Export to make this a module
export {};

// Type helpers for environment detection
export const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.document !== 'undefined';
export const isNode = (): boolean => typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
export const isWebWorker = (): boolean => typeof self === 'object' && self.constructor && self.constructor.name === 'DedicatedWorkerGlobalScope';
export const isJsDom = (): boolean => (typeof window !== 'undefined' && window.name === 'nodejs') || (typeof navigator !== 'undefined' && (navigator.userAgent.includes('Node.js') || navigator.userAgent.includes('jsdom')));

// Type-safe environment variable access
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as any)[key] || defaultValue;
  }
  return defaultValue;
}

// Type-safe feature flag access
export function isFeatureEnabled(feature: string): boolean {
  if (typeof window !== 'undefined' && window.__FEATURE_FLAGS__) {
    return window.__FEATURE_FLAGS__[feature] === true;
  }
  return false;
}