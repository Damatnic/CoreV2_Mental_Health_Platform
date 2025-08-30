/**
 * Mobile Validation Utilities for Astral Core Mental Health Platform
 * Ensures optimal mobile experience across all devices
 */

import { logger } from './logger';

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: string;
  viewport: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
  };
  touchEnabled: boolean;
  pixelRatio: number;
  networkSpeed: 'slow' | 'medium' | 'fast' | 'offline';
  reducedMotion: boolean;
  colorScheme: 'light' | 'dark' | 'auto';
}

export interface MobileFeatures {
  touch: boolean;
  gestures: boolean;
  vibration: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  camera: boolean;
  microphone: boolean;
  notification: boolean;
  geolocation: boolean;
  webShare: boolean;
  wakeLock: boolean;
}

export class MobileValidator {
  private static instance: MobileValidator;
  private deviceInfo: DeviceInfo;
  private features: MobileFeatures;
  private performanceMetrics: Map<string, number> = new Map();

  private constructor() {
    this.deviceInfo = this.detectDevice();
    this.features = this.detectFeatures();
    this.initializeMonitoring();
  }

  static getInstance(): MobileValidator {
    if (!MobileValidator.instance) {
      MobileValidator.instance = new MobileValidator();
    }
    return MobileValidator.instance;
  }

  /**
   * Detect device information
   */
  private detectDevice(): DeviceInfo {
    const ua = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Detect device type
    let type: DeviceInfo['type'] = 'desktop';
    if (/mobile|android|iphone/i.test(ua)) {
      type = 'mobile';
    } else if (/ipad|tablet/i.test(ua) || (width >= 768 && width <= 1024)) {
      type = 'tablet';
    }

    // Detect OS
    let os: DeviceInfo['os'] = 'unknown';
    if (/iphone|ipad|ipod/.test(ua)) os = 'ios';
    else if (/android/.test(ua)) os = 'android';
    else if (/windows/.test(ua)) os = 'windows';
    else if (/mac/.test(ua)) os = 'macos';
    else if (/linux/.test(ua)) os = 'linux';

    // Detect browser
    let browser = 'unknown';
    if (/chrome/.test(ua)) browser = 'chrome';
    else if (/safari/.test(ua)) browser = 'safari';
    else if (/firefox/.test(ua)) browser = 'firefox';
    else if (/edge/.test(ua)) browser = 'edge';

    // Detect orientation
    const orientation = width > height ? 'landscape' : 'portrait';

    // Detect touch capability
    const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Detect network speed
    const networkSpeed = this.detectNetworkSpeed();

    // Detect reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detect color scheme preference
    let colorScheme: DeviceInfo['colorScheme'] = 'auto';
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      colorScheme = 'dark';
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      colorScheme = 'light';
    }

    return {
      type,
      os,
      browser,
      viewport: {
        width,
        height,
        orientation
      },
      touchEnabled,
      pixelRatio: window.devicePixelRatio || 1,
      networkSpeed,
      reducedMotion,
      colorScheme
    };
  }

  /**
   * Detect available mobile features
   */
  private detectFeatures(): MobileFeatures {
    return {
      touch: 'ontouchstart' in window,
      gestures: 'ongesturestart' in window,
      vibration: 'vibrate' in navigator,
      accelerometer: 'DeviceMotionEvent' in window,
      gyroscope: 'DeviceOrientationEvent' in window,
      magnetometer: 'AbsoluteOrientationSensor' in window,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      microphone: 'mediaDevices' in navigator,
      notification: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      webShare: 'share' in navigator,
      wakeLock: 'wakeLock' in navigator
    };
  }

  /**
   * Detect network speed
   */
  private detectNetworkSpeed(): DeviceInfo['networkSpeed'] {
    if (!navigator.onLine) return 'offline';
    
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      if (effectiveType === '4g') return 'fast';
      if (effectiveType === '3g') return 'medium';
      return 'slow';
    }
    
    return 'medium'; // Default
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring() {
    // Monitor viewport changes
    window.addEventListener('resize', () => {
      this.deviceInfo = this.detectDevice();
      this.validateResponsiveness();
    });

    // Monitor orientation changes
    window.addEventListener('orientationchange', () => {
      this.deviceInfo = this.detectDevice();
      this.handleOrientationChange();
    });

    // Monitor network changes
    window.addEventListener('online', () => {
      this.deviceInfo.networkSpeed = this.detectNetworkSpeed();
      logger.info('Network status changed: online', undefined, 'MobileValidator');
    });

    window.addEventListener('offline', () => {
      this.deviceInfo.networkSpeed = 'offline';
      logger.warn('Network status changed: offline', undefined, 'MobileValidator');
    });
  }

  /**
   * Validate responsiveness
   */
  validateResponsiveness(): boolean {
    const { width } = this.deviceInfo.viewport;
    const breakpoints = {
      mobile: 640,
      tablet: 1024,
      desktop: 1280
    };

    // Check if current breakpoint matches device type
    let expectedType: DeviceInfo['type'] = 'desktop';
    if (width <= breakpoints.mobile) expectedType = 'mobile';
    else if (width <= breakpoints.tablet) expectedType = 'tablet';

    const isValid = this.deviceInfo.type === expectedType;
    
    if (!isValid) {
      logger.warn('Responsiveness mismatch', {
        expected: expectedType,
        actual: this.deviceInfo.type,
        width
      }, 'MobileValidator');
    }

    return isValid;
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange() {
    const { orientation } = this.deviceInfo.viewport;
    logger.info('Orientation changed', { orientation }, 'MobileValidator');
    
    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('orientationChanged', {
      detail: { orientation }
    }));
  }

  /**
   * Validate touch interactions
   */
  validateTouchInteractions(): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (this.deviceInfo.touchEnabled) {
      // Check for touch-friendly elements
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      buttons.forEach(element => {
        const rect = element.getBoundingClientRect();
        const minSize = 44; // Minimum touch target size (WCAG)
        
        if (rect.width < minSize || rect.height < minSize) {
          warnings.push(`Touch target too small: ${element.textContent || element.className}`);
        }
      });

      // Check for hover-only interactions
      const hoverElements = document.querySelectorAll(':hover');
      if (hoverElements.length > 0) {
        warnings.push('Hover-dependent interactions detected on touch device');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      recommendations: this.getTouchRecommendations()
    };
  }

  /**
   * Validate performance metrics
   */
  async validatePerformance(): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check First Contentful Paint
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcp && fcp.startTime > 2000) {
        warnings.push(`Slow First Contentful Paint: ${fcp.startTime.toFixed(0)}ms`);
      }
    }

    // Check memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usedPercent > 80) {
        warnings.push(`High memory usage: ${usedPercent.toFixed(1)}%`);
      }
    }

    // Check network latency
    if (this.deviceInfo.networkSpeed === 'slow') {
      warnings.push('Slow network detected - consider offline mode');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      recommendations: this.getPerformanceRecommendations()
    };
  }

  /**
   * Validate accessibility on mobile
   */
  validateAccessibility(): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check font sizes
    const texts = document.querySelectorAll('p, span, div, button, a');
    texts.forEach(element => {
      const fontSize = window.getComputedStyle(element).fontSize;
      const size = parseFloat(fontSize);
      
      if (size < 14) {
        warnings.push(`Small font size detected: ${size}px`);
      }
    });

    // Check color contrast
    // This would require more complex calculations
    
    // Check for ARIA labels on interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach(element => {
      if (!element.getAttribute('aria-label') && !element.textContent?.trim()) {
        issues.push('Interactive element missing accessible label');
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      recommendations: this.getAccessibilityRecommendations()
    };
  }

  /**
   * Get touch recommendations
   */
  private getTouchRecommendations(): string[] {
    return [
      'Ensure all touch targets are at least 44x44 pixels',
      'Provide visual feedback for touch interactions',
      'Avoid hover-only interactions',
      'Implement swipe gestures for navigation',
      'Use touch-friendly spacing between elements'
    ];
  }

  /**
   * Get performance recommendations
   */
  private getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.deviceInfo.networkSpeed === 'slow') {
      recommendations.push('Enable offline mode for critical features');
      recommendations.push('Implement progressive loading');
      recommendations.push('Reduce image sizes and use lazy loading');
    }
    
    if (this.deviceInfo.type === 'mobile') {
      recommendations.push('Minimize JavaScript execution');
      recommendations.push('Use CSS animations instead of JavaScript');
      recommendations.push('Implement virtual scrolling for long lists');
    }
    
    return recommendations;
  }

  /**
   * Get accessibility recommendations
   */
  private getAccessibilityRecommendations(): string[] {
    return [
      'Use minimum 16px font size for body text',
      'Ensure 4.5:1 color contrast ratio',
      'Provide clear focus indicators',
      'Support screen reader navigation',
      'Include skip navigation links'
    ];
  }

  /**
   * Run comprehensive validation
   */
  async runFullValidation(): Promise<MobileValidationReport> {
    logger.info('Running mobile validation', this.deviceInfo, 'MobileValidator');
    
    const responsiveness = this.validateResponsiveness();
    const touch = this.validateTouchInteractions();
    const performance = await this.validatePerformance();
    const accessibility = this.validateAccessibility();
    
    const overallValid = responsiveness && touch.valid && performance.valid && accessibility.valid;
    
    const report: MobileValidationReport = {
      timestamp: new Date().toISOString(),
      deviceInfo: this.deviceInfo,
      features: this.features,
      validations: {
        responsiveness: { valid: responsiveness, issues: [], warnings: [], recommendations: [] },
        touch,
        performance,
        accessibility
      },
      overallScore: this.calculateScore(responsiveness, touch, performance, accessibility),
      recommendations: this.getOverallRecommendations(touch, performance, accessibility)
    };
    
    logger.info('Mobile validation complete', { 
      score: report.overallScore,
      valid: overallValid 
    }, 'MobileValidator');
    
    return report;
  }

  /**
   * Calculate overall score
   */
  private calculateScore(...validations: any[]): number {
    let totalPoints = 0;
    let maxPoints = 0;
    
    validations.forEach(validation => {
      maxPoints += 100;
      if (typeof validation === 'boolean') {
        if (validation) totalPoints += 100;
      } else {
        const points = 100 - (validation.issues.length * 20) - (validation.warnings.length * 5);
        totalPoints += Math.max(0, points);
      }
    });
    
    return Math.round((totalPoints / maxPoints) * 100);
  }

  /**
   * Get overall recommendations
   */
  private getOverallRecommendations(...validations: ValidationResult[]): string[] {
    const allRecommendations = new Set<string>();
    
    validations.forEach(validation => {
      validation.recommendations?.forEach(rec => allRecommendations.add(rec));
    });
    
    return Array.from(allRecommendations);
  }

  // Getters
  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  getFeatures(): MobileFeatures {
    return this.features;
  }

  isMobile(): boolean {
    return this.deviceInfo.type === 'mobile';
  }

  isTablet(): boolean {
    return this.deviceInfo.type === 'tablet';
  }

  isTouchDevice(): boolean {
    return this.deviceInfo.touchEnabled;
  }

  isOnline(): boolean {
    return this.deviceInfo.networkSpeed !== 'offline';
  }

  hasSlowConnection(): boolean {
    return this.deviceInfo.networkSpeed === 'slow';
  }
}

// Type definitions
interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
  recommendations?: string[];
}

interface MobileValidationReport {
  timestamp: string;
  deviceInfo: DeviceInfo;
  features: MobileFeatures;
  validations: {
    responsiveness: ValidationResult;
    touch: ValidationResult;
    performance: ValidationResult;
    accessibility: ValidationResult;
  };
  overallScore: number;
  recommendations: string[];
}

// Export singleton instance
export const mobileValidator = MobileValidator.getInstance();

// Export validation function for easy use
export async function validateMobileExperience(): Promise<MobileValidationReport> {
  return mobileValidator.runFullValidation();
}