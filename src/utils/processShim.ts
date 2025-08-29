/**
 * Process shim for browser environment
 * Provides compatibility layer for code that uses process.env
 */

// Create a process shim if it doesn't exist
if (typeof globalThis.process === 'undefined') {
  // Create process object with env property
  (globalThis as any).process = {
    env: {
      // Map import.meta.env to process.env for compatibility
      get NODE_ENV() {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
          return import.meta.env.MODE === 'production' ? 'production' : 
                 import.meta.env.MODE === 'test' ? 'test' : 'development';
        }
        return 'development';
      },
      
      // Map REACT_APP_ prefixed variables to VITE_ prefixed ones
      get REACT_APP_API_URL() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_API_URL : undefined;
      },
      
      get REACT_APP_WS_URL() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_WS_URL : undefined;
      },
      
      get REACT_APP_AUTH_DOMAIN() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_AUTH0_DOMAIN : undefined;
      },
      
      get REACT_APP_VERSION() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_APP_VERSION : '1.0.0';
      },
      
      // Add more mappings as needed
      get REACT_APP_ENABLE_ANALYTICS() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_ANALYTICS : 'false';
      },
      
      get REACT_APP_ENABLE_CRASH_REPORTING() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_SENTRY_DSN ? 'true' : 'false' : 'false';
      },
      
      get REACT_APP_LOG_LEVEL() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_LOG_LEVEL : 'info';
      },
      
      // Feature flags
      get REACT_APP_FEATURE_AI_CHAT() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_AI_CHAT : 'true';
      },
      
      get REACT_APP_FEATURE_CRISIS_DETECTION() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_CRISIS_DETECTION : 'true';
      },
      
      get REACT_APP_FEATURE_PEER_SUPPORT() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_PEER_SUPPORT : 'true';
      },
      
      get REACT_APP_FEATURE_MOOD_TRACKING() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_MOOD_TRACKING : 'true';
      },
      
      get REACT_APP_FEATURE_SAFETY_PLANNING() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_SAFETY_PLANNING : 'true';
      },
      
      get REACT_APP_FEATURE_THERAPIST_CONNECT() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_THERAPIST_CONNECT : 'false';
      },
      
      get REACT_APP_FEATURE_GROUP_THERAPY() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_GROUP_THERAPY : 'false';
      },
      
      get REACT_APP_FEATURE_EMERGENCY_CONTACTS() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_EMERGENCY_CONTACTS : 'true';
      },
      
      get REACT_APP_FEATURE_OFFLINE_MODE() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_OFFLINE_MODE : 'true';
      },
      
      get REACT_APP_FEATURE_PUSH_NOTIFICATIONS() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS : 'false';
      },
      
      // Auth0 configuration
      get VITE_AUTH0_DOMAIN() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_AUTH0_DOMAIN : undefined;
      },
      
      get VITE_AUTH0_CLIENT_ID() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_AUTH0_CLIENT_ID : undefined;
      },
      
      get VITE_AUTH0_AUDIENCE() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_AUTH0_AUDIENCE : undefined;
      },
      
      get VITE_AUTH0_CALLBACK_URL() {
        return typeof import.meta !== 'undefined' && import.meta.env 
          ? import.meta.env.VITE_AUTH0_REDIRECT_URI : undefined;
      }
    },
    
    // Add other process properties for compatibility
    version: 'v16.0.0',
    versions: {
      node: '16.0.0',
      v8: '9.0.0'
    },
    platform: 'browser',
    arch: 'x64',
    pid: 1,
    ppid: 0,
    cwd: () => '/',
    exit: (code?: number) => {
      console.warn(`process.exit(${code}) called in browser environment`);
    },
    nextTick: (callback: Function, ...args: any[]) => {
      Promise.resolve().then(() => callback(...args));
    }
  };
}

// Export for TypeScript type checking
export const processShim = (globalThis as any).process;

// Auto-initialize on import
export default processShim;