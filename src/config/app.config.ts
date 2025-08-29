/**
 * Application Configuration
 * Central configuration for the CoreV2 Mental Health Platform
 */

export interface AppConfig {
  app: {
    name: string;
    version: string;
    description: string;
    url: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  auth: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  features: {
    aiChat: boolean;
    offlineMode: boolean;
    analytics: boolean;
    notifications: boolean;
    pwa: boolean;
  };
  crisis: {
    hotlineNumber: string;
    textLine: string;
    emergencyNumber: string;
    escalationThreshold: number;
  };
  performance: {
    cacheTimeout: number;
    maxBundleSize: number;
    lazyLoadingEnabled: boolean;
  };
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const appConfig: AppConfig = {
  app: {
    name: 'CoreV2 Mental Health Platform',
    version: '1.0.0',
    description: 'Comprehensive mental health support platform with AI assistance and crisis intervention',
    url: isProduction 
      ? 'https://corev2-mental-health.netlify.app' 
      : 'http://localhost:5173'
  },

  api: {
    baseUrl: process.env.VITE_API_URL || 'http://localhost:3001',
    timeout: 30000, // 30 seconds
    retries: 3
  },

  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },

  features: {
    aiChat: true,
    offlineMode: true,
    analytics: isProduction,
    notifications: true,
    pwa: true
  },

  crisis: {
    hotlineNumber: '988',
    textLine: '741741',
    emergencyNumber: '911',
    escalationThreshold: 0.8 // 80% confidence threshold for crisis detection
  },

  performance: {
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxBundleSize: 500 * 1024, // 500KB
    lazyLoadingEnabled: true
  }
};

export default appConfig;
