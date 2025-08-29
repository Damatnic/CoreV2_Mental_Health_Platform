/**
 * Environment Variable Utility
 * Provides consistent access to environment variables across different contexts
 * Handles both Vite (import.meta.env) and Node.js (process.env) environments
 */

type EnvSource = 'vite' | 'process' | 'window';

interface EnvConfig {
  source?: EnvSource;
  prefix?: string;
  fallback?: Record<string, string>;
}

class EnvironmentManager {
  private cache: Map<string, string | undefined> = new Map();
  private source: EnvSource;
  private prefix: string;
  private fallback: Record<string, string>;

  constructor(config: EnvConfig = {}) {
    this.source = config.source || this.detectSource();
    this.prefix = config.prefix || '';
    this.fallback = config.fallback || {};
  }

  private detectSource(): EnvSource {
    // Check for Vite environment
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return 'vite';
    }
    
    // Check for Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return 'process';
    }
    
    // Fallback to window object
    return 'window';
  }

  /**
   * Get an environment variable value
   */
  get(key: string, defaultValue?: string): string | undefined {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    let value: string | undefined;
    const prefixedKey = this.prefix + key;

    switch (this.source) {
      case 'vite':
        // Vite environment variables
        if (typeof import.meta !== 'undefined' && import.meta.env) {
          value = (import.meta.env as any)[prefixedKey] || 
                  (import.meta.env as any)[key];
        }
        break;
        
      case 'process':
        // Node.js process.env
        if (typeof process !== 'undefined' && process.env) {
          value = process.env[prefixedKey] || process.env[key];
        }
        break;
        
      case 'window':
        // Window object (for runtime config)
        if (typeof window !== 'undefined' && (window as any).__ENV__) {
          value = (window as any).__ENV__[prefixedKey] || 
                  (window as any).__ENV__[key];
        }
        break;
    }

    // Check fallback values
    if (!value && this.fallback[key]) {
      value = this.fallback[key];
    }

    // Use default value if provided
    if (!value && defaultValue !== undefined) {
      value = defaultValue;
    }

    // Cache the result
    this.cache.set(key, value);
    
    return value;
  }

  /**
   * Get a boolean environment variable
   */
  getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.get(key);
    if (value === undefined) {
      return defaultValue;
    }
    return value === 'true' || value === '1' || value === 'yes';
  }

  /**
   * Get a number environment variable
   */
  getNumber(key: string, defaultValue: number = 0): number {
    const value = this.get(key);
    if (value === undefined) {
      return defaultValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get a JSON environment variable
   */
  getJSON<T>(key: string, defaultValue?: T): T | undefined {
    const value = this.get(key);
    if (!value) {
      return defaultValue;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.DEV === true;
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development';
    }
    return false;
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.PROD === true;
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'production';
    }
    return true; // Default to production for safety
  }

  /**
   * Check if running in test mode
   */
  isTest(): boolean {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'test';
    }
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.MODE === 'test';
    }
    return false;
  }

  /**
   * Get the current environment mode
   */
  getMode(): string {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.MODE || 'production';
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV || 'production';
    }
    return 'production';
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all environment variables matching a pattern
   */
  getAll(pattern?: RegExp): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (this.source === 'vite' && typeof import.meta !== 'undefined' && import.meta.env) {
      Object.keys(import.meta.env).forEach(key => {
        if (!pattern || pattern.test(key)) {
          result[key] = (import.meta.env as any)[key];
        }
      });
    } else if (this.source === 'process' && typeof process !== 'undefined' && process.env) {
      Object.keys(process.env).forEach(key => {
        if (!pattern || pattern.test(key)) {
          result[key] = process.env[key] || '';
        }
      });
    }
    
    return result;
  }
}

// Create default instance with Vite prefix for React app compatibility
const env = new EnvironmentManager({
  prefix: 'VITE_',
  fallback: {
    // Default values for critical environment variables
    API_URL: '/api',
    WS_URL: 'ws://localhost:3001',
    AUTH0_DOMAIN: 'corev2-mental-health.auth0.com',
    ENABLE_ANALYTICS: 'false',
    ENABLE_PWA: 'true',
    ENABLE_CRISIS_DETECTION: 'true',
    LOG_LEVEL: 'info'
  }
});

// Create a compatibility layer for REACT_APP_ prefixed variables
const reactEnv = new EnvironmentManager({
  prefix: 'REACT_APP_',
  fallback: env['fallback']
});

// Export convenience functions
export const getEnv = (key: string, defaultValue?: string): string | undefined => {
  // Try VITE_ prefix first, then REACT_APP_ for backward compatibility
  return env.get(key, defaultValue) || reactEnv.get(key, defaultValue);
};

export const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnv(key);
  if (value === undefined) {
    return defaultValue;
  }
  return value === 'true' || value === '1' || value === 'yes';
};

export const getEnvNumber = (key: string, defaultValue: number = 0): number => {
  const value = getEnv(key);
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const getEnvJSON = <T>(key: string, defaultValue?: T): T | undefined => {
  const value = getEnv(key);
  if (!value) {
    return defaultValue;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

export const isDevelopment = (): boolean => env.isDevelopment();
export const isProduction = (): boolean => env.isProduction();
export const isTest = (): boolean => env.isTest();
export const getMode = (): string => env.getMode();

// Export the manager instances for advanced usage
export { env, reactEnv };
export default env;