/**
 * Environment Service
 * 
 * Manages environment configuration and runtime detection
 */

interface EnvironmentConfig {
  production: boolean;
  development: boolean;
  testing: boolean;
  staging: boolean;
  apiUrl: string;
  wsUrl: string;
  authDomain: string;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  features: Record<string, boolean>;
}

interface RuntimeEnvironment {
  platform: 'web' | 'mobile' | 'desktop';
  browser: string;
  version: string;
  os: string;
  device: 'mobile' | 'tablet' | 'desktop';
  capabilities: {
    serviceWorker: boolean;
    webGL: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    notifications: boolean;
    geolocation: boolean;
    camera: boolean;
    microphone: boolean;
  };
}

class EnvironmentService {
  private config: EnvironmentConfig;
  private runtime: RuntimeEnvironment;

  constructor() {
    this.config = this.loadConfiguration();
    this.runtime = this.detectRuntime();
  }

  private loadConfiguration(): EnvironmentConfig {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    return {
      production: nodeEnv === 'production',
      development: nodeEnv === 'development',
      testing: nodeEnv === 'test',
      staging: nodeEnv === 'staging',
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
      authDomain: process.env.REACT_APP_AUTH_DOMAIN || 'localhost',
      enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
      enableCrashReporting: process.env.REACT_APP_ENABLE_CRASH_REPORTING === 'true',
      logLevel: (process.env.REACT_APP_LOG_LEVEL as any) || 'info',
      features: {
        aiChat: process.env.REACT_APP_FEATURE_AI_CHAT !== 'false',
        crisisDetection: process.env.REACT_APP_FEATURE_CRISIS_DETECTION !== 'false',
        peerSupport: process.env.REACT_APP_FEATURE_PEER_SUPPORT !== 'false',
        moodTracking: process.env.REACT_APP_FEATURE_MOOD_TRACKING !== 'false',
        safetyPlanning: process.env.REACT_APP_FEATURE_SAFETY_PLANNING !== 'false',
        therapistConnect: process.env.REACT_APP_FEATURE_THERAPIST_CONNECT === 'true',
        groupTherapy: process.env.REACT_APP_FEATURE_GROUP_THERAPY === 'true',
        emergencyContacts: process.env.REACT_APP_FEATURE_EMERGENCY_CONTACTS !== 'false',
        offlineMode: process.env.REACT_APP_FEATURE_OFFLINE_MODE !== 'false',
        pushNotifications: process.env.REACT_APP_FEATURE_PUSH_NOTIFICATIONS === 'true'
      }
    };
  }

  private detectRuntime(): RuntimeEnvironment {
    const userAgent = navigator.userAgent;
    const platform = this.detectPlatform();
    const browser = this.detectBrowser(userAgent);
    const os = this.detectOS(userAgent);
    const device = this.detectDevice();

    return {
      platform,
      browser: browser.name,
      version: browser.version,
      os,
      device,
      capabilities: this.detectCapabilities()
    };
  }

  private detectPlatform(): RuntimeEnvironment['platform'] {
    if (typeof window === 'undefined') return 'web';
    
    // Check for mobile app wrapper
    if ((window as any).ReactNativeWebView) return 'mobile';
    if ((window as any).electronAPI) return 'desktop';
    
    return 'web';
  }

  private detectBrowser(userAgent: string): { name: string; version: string } {
    const browsers = [
      { name: 'Chrome', pattern: /Chrome\/([0-9.]+)/ },
      { name: 'Firefox', pattern: /Firefox\/([0-9.]+)/ },
      { name: 'Safari', pattern: /Version\/([0-9.]+).*Safari/ },
      { name: 'Edge', pattern: /Edg\/([0-9.]+)/ },
      { name: 'Opera', pattern: /Opera\/([0-9.]+)/ }
    ];

    for (const browser of browsers) {
      const match = userAgent.match(browser.pattern);
      if (match) {
        return { name: browser.name, version: match[1] };
      }
    }

    return { name: 'Unknown', version: '0.0.0' };
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    
    return 'Unknown';
  }

  private detectDevice(): RuntimeEnvironment['device'] {
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen?.width || 0;

    // Mobile devices
    if (/Mobi|Android/i.test(userAgent) || screenWidth < 768) {
      return 'mobile';
    }

    // Tablets
    if (/Tablet|iPad/i.test(userAgent) || (screenWidth >= 768 && screenWidth < 1024)) {
      return 'tablet';
    }

    return 'desktop';
  }

  private detectCapabilities(): RuntimeEnvironment['capabilities'] {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      webGL: this.hasWebGL(),
      localStorage: this.hasLocalStorage(),
      sessionStorage: this.hasSessionStorage(),
      indexedDB: 'indexedDB' in window,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      camera: this.hasMediaDevices('video'),
      microphone: this.hasMediaDevices('audio')
    };
  }

  private hasWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  private hasLocalStorage(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private hasSessionStorage(): boolean {
    try {
      const test = '__test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private hasMediaDevices(kind: 'video' | 'audio'): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Public API
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  getRuntime(): RuntimeEnvironment {
    return { ...this.runtime };
  }

  isDevelopment(): boolean {
    return this.config.development;
  }

  isProduction(): boolean {
    return this.config.production;
  }

  isTesting(): boolean {
    return this.config.testing;
  }

  isStaging(): boolean {
    return this.config.staging;
  }

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  getWebSocketUrl(): string {
    return this.config.wsUrl;
  }

  isFeatureEnabled(feature: string): boolean {
    return this.config.features[feature] === true;
  }

  isMobile(): boolean {
    return this.runtime.device === 'mobile';
  }

  isTablet(): boolean {
    return this.runtime.device === 'tablet';
  }

  isDesktop(): boolean {
    return this.runtime.device === 'desktop';
  }

  hasCapability(capability: keyof RuntimeEnvironment['capabilities']): boolean {
    return this.runtime.capabilities[capability];
  }

  getBrowser(): { name: string; version: string } {
    return {
      name: this.runtime.browser,
      version: this.runtime.version
    };
  }

  getOS(): string {
    return this.runtime.os;
  }

  getPlatform(): RuntimeEnvironment['platform'] {
    return this.runtime.platform;
  }

  shouldEnableAnalytics(): boolean {
    return this.config.enableAnalytics && this.isProduction();
  }

  shouldEnableCrashReporting(): boolean {
    return this.config.enableCrashReporting && this.isProduction();
  }

  getLogLevel(): EnvironmentConfig['logLevel'] {
    return this.config.logLevel;
  }

  // Mental health platform specific methods
  isCrisisDetectionEnabled(): boolean {
    return this.isFeatureEnabled('crisisDetection');
  }

  isAIChatEnabled(): boolean {
    return this.isFeatureEnabled('aiChat');
  }

  isPeerSupportEnabled(): boolean {
    return this.isFeatureEnabled('peerSupport');
  }

  isMoodTrackingEnabled(): boolean {
    return this.isFeatureEnabled('moodTracking');
  }

  isSafetyPlanningEnabled(): boolean {
    return this.isFeatureEnabled('safetyPlanning');
  }

  isTherapistConnectEnabled(): boolean {
    return this.isFeatureEnabled('therapistConnect');
  }

  isOfflineModeSupported(): boolean {
    return this.isFeatureEnabled('offlineMode') && 
           this.hasCapability('serviceWorker') && 
           this.hasCapability('indexedDB');
  }

  arePushNotificationsEnabled(): boolean {
    return this.isFeatureEnabled('pushNotifications') && 
           this.hasCapability('notifications');
  }

  // Environment-specific configurations
  getCrisisHotlines(): Record<string, string> {
    const baseHotlines = {
      'suicide-prevention': '988',
      'crisis-text': '741741',
      'emergency': '911'
    };

    // Add international numbers based on detected location
    if (this.runtime.os === 'Android' || this.runtime.os === 'iOS') {
      // Could detect country code from timezone or locale
      // For now, return US numbers
    }

    return baseHotlines;
  }

  getPrivacyLevel(): 'basic' | 'enhanced' | 'maximum' {
    if (this.isProduction()) {
      return 'enhanced';
    }
    return this.isDevelopment() ? 'basic' : 'enhanced';
  }

  shouldUseHttps(): boolean {
    return this.isProduction() || this.isStaging();
  }

  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.shouldUseHttps()) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    if (this.isProduction()) {
      headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'";
      headers['X-Content-Type-Options'] = 'nosniff';
      headers['X-Frame-Options'] = 'DENY';
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    return headers;
  }

  // Debug and monitoring
  getEnvironmentInfo(): Record<string, any> {
    return {
      config: this.config,
      runtime: this.runtime,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    };
  }

  logEnvironmentInfo(): void {
    if (this.isDevelopment()) {
      console.group('🌍 Environment Information');
      console.log('Config:', this.config);
      console.log('Runtime:', this.runtime);
      console.log('Capabilities:', this.runtime.capabilities);
      console.groupEnd();
    }
  }
}

// Singleton instance
export const environmentService = new EnvironmentService();

// Development helper
if (typeof window !== 'undefined' && environmentService.isDevelopment()) {
  (window as any).environmentService = environmentService;
}

export default environmentService;
export type { EnvironmentConfig, RuntimeEnvironment };

