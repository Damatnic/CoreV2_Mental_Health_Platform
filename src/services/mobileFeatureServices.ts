/**
 * Mobile Feature Services
 * Handles mobile-specific functionality and feature detection
 */

export interface MobileFeature {
  id: string;
  name: string;
  available: boolean;
  permission?: PermissionState;
  config?: any;
}

export interface DeviceCapabilities {
  touchSupport: boolean;
  orientationSupport: boolean;
  vibrationSupport: boolean;
  geolocationSupport: boolean;
  cameraSupport: boolean;
  notificationSupport: boolean;
  offlineSupport: boolean;
  installPromptSupport: boolean;
}

export interface MobileConfig {
  enableHaptics: boolean;
  enablePushNotifications: boolean;
  enableGeolocation: boolean;
  enableOfflineMode: boolean;
  adaptiveUI: boolean;
  performanceMode: 'standard' | 'optimized' | 'battery-saver';
}

class MobileFeatureServices {
  private features: Map<string, MobileFeature> = new Map();
  private capabilities: DeviceCapabilities | null = null;
  private config: MobileConfig;
  private listeners: Set<(features: MobileFeature[]) => void> = new Set();

  constructor(config: Partial<MobileConfig> = {}) {
    this.config = {
      enableHaptics: true,
      enablePushNotifications: true,
      enableGeolocation: false,
      enableOfflineMode: true,
      adaptiveUI: true,
      performanceMode: 'standard',
      ...config
    };
    
    this.initializeFeatures();
  }

  private async initializeFeatures(): Promise<void> {
    this.capabilities = await this.detectCapabilities();
    
    const features = [
      'haptics',
      'push-notifications',
      'geolocation',
      'camera',
      'offline-storage',
      'install-prompt',
      'orientation',
      'wake-lock'
    ];

    for (const featureId of features) {
      await this.checkFeature(featureId);
    }

    this.notifyListeners();
  }

  private async detectCapabilities(): Promise<DeviceCapabilities> {
    return {
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      orientationSupport: 'orientation' in window,
      vibrationSupport: 'vibrate' in navigator,
      geolocationSupport: 'geolocation' in navigator,
      cameraSupport: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      notificationSupport: 'Notification' in window && 'serviceWorker' in navigator,
      offlineSupport: 'serviceWorker' in navigator && 'caches' in window,
      installPromptSupport: 'BeforeInstallPromptEvent' in window
    };
  }

  private async checkFeature(featureId: string): Promise<void> {
    let feature: MobileFeature = {
      id: featureId,
      name: this.getFeatureName(featureId),
      available: false
    };

    try {
      switch (featureId) {
        case 'haptics':
          feature.available = this.capabilities?.vibrationSupport || false;
          break;

        case 'push-notifications':
          if (this.capabilities?.notificationSupport) {
            feature.permission = await this.checkNotificationPermission();
            feature.available = feature.permission !== 'denied';
          }
          break;

        case 'geolocation':
          if (this.capabilities?.geolocationSupport) {
            feature.permission = await this.checkGeolocationPermission();
            feature.available = feature.permission !== 'denied';
          }
          break;

        case 'camera':
          feature.available = this.capabilities?.cameraSupport || false;
          if (feature.available) {
            feature.permission = await this.checkCameraPermission();
          }
          break;

        case 'offline-storage':
          feature.available = this.capabilities?.offlineSupport || false;
          if (feature.available) {
            feature.config = await this.getStorageQuota();
          }
          break;

        case 'install-prompt':
          feature.available = this.capabilities?.installPromptSupport || false;
          break;

        case 'orientation':
          feature.available = this.capabilities?.orientationSupport || false;
          break;

        case 'wake-lock':
          feature.available = 'wakeLock' in navigator;
          break;

        default:
          feature.available = false;
      }
    } catch (error) {
      console.warn(`Failed to check feature ${featureId}:`, error);
      feature.available = false;
    }

    this.features.set(featureId, feature);
  }

  private async checkNotificationPermission(): Promise<PermissionState> {
    if (!('permissions' in navigator)) {
      return Notification.permission as PermissionState;
    }
    
    const result = await navigator.permissions.query({ name: 'notifications' });
    return result.state;
  }

  private async checkGeolocationPermission(): Promise<PermissionState> {
    if (!('permissions' in navigator)) {
      return 'prompt';
    }
    
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  }

  private async checkCameraPermission(): Promise<PermissionState> {
    if (!('permissions' in navigator)) {
      return 'prompt';
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state;
    } catch (error) {
      return 'prompt';
    }
  }

  private async getStorageQuota(): Promise<any> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        return await navigator.storage.estimate();
      } catch (error) {
        console.warn('Failed to get storage quota:', error);
      }
    }
    return null;
  }

  private getFeatureName(featureId: string): string {
    const names = {
      'haptics': 'Haptic Feedback',
      'push-notifications': 'Push Notifications',
      'geolocation': 'Location Services',
      'camera': 'Camera Access',
      'offline-storage': 'Offline Storage',
      'install-prompt': 'App Installation',
      'orientation': 'Screen Orientation',
      'wake-lock': 'Screen Wake Lock'
    };
    
    return names[featureId as keyof typeof names] || featureId;
  }

  public isFeatureAvailable(featureId: string): boolean {
    return this.features.get(featureId)?.available || false;
  }

  public getFeature(featureId: string): MobileFeature | undefined {
    return this.features.get(featureId);
  }

  public getAllFeatures(): MobileFeature[] {
    return Array.from(this.features.values());
  }

  public getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }

  public updateConfig(updates: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getConfig(): MobileConfig {
    return { ...this.config };
  }

  // Haptic feedback
  public async triggerHaptic(pattern: number | number[] = 100): Promise<boolean> {
    if (!this.config.enableHaptics || !this.isFeatureAvailable('haptics')) {
      return false;
    }

    try {
      if (Array.isArray(pattern)) {
        return navigator.vibrate(pattern);
      } else {
        return navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      return false;
    }
  }

  // Push notifications
  public async requestNotificationPermission(): Promise<boolean> {
    if (!this.config.enablePushNotifications || !this.isFeatureAvailable('push-notifications')) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      await this.checkFeature('push-notifications');
      this.notifyListeners();
      return permission === 'granted';
    } catch (error) {
      console.warn('Notification permission request failed:', error);
      return false;
    }
  }

  // Geolocation
  public async getCurrentLocation(): Promise<GeolocationPosition | null> {
    if (!this.config.enableGeolocation || !this.isFeatureAvailable('geolocation')) {
      return null;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          console.warn('Geolocation failed:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        }
      );
    });
  }

  // Screen orientation
  public async lockOrientation(orientation: OrientationLockType): Promise<boolean> {
    if (!this.isFeatureAvailable('orientation') || !('orientation' in screen)) {
      return false;
    }

    try {
      await (screen.orientation as any).lock(orientation);
      return true;
    } catch (error) {
      console.warn('Orientation lock failed:', error);
      return false;
    }
  }

  public unlockOrientation(): boolean {
    if (!this.isFeatureAvailable('orientation') || !('orientation' in screen)) {
      return false;
    }

    try {
      (screen.orientation as any).unlock();
      return true;
    } catch (error) {
      console.warn('Orientation unlock failed:', error);
      return false;
    }
  }

  // Wake lock
  private wakeLock: any = null;

  public async requestWakeLock(): Promise<boolean> {
    if (!this.isFeatureAvailable('wake-lock') || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      return true;
    } catch (error) {
      console.warn('Wake lock request failed:', error);
      return false;
    }
  }

  public releaseWakeLock(): boolean {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
        this.wakeLock = null;
        return true;
      } catch (error) {
        console.warn('Wake lock release failed:', error);
      }
    }
    return false;
  }

  // Event listeners
  public subscribe(listener: (features: MobileFeature[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAllFeatures());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const features = this.getAllFeatures();
    this.listeners.forEach(listener => {
      try {
        listener(features);
      } catch (error) {
        console.error('Feature listener error:', error);
      }
    });
  }

  // Performance optimization
  public optimizeForMobile(): void {
    if (this.config.adaptiveUI && this.capabilities?.touchSupport) {
      // Add mobile-specific optimizations
      document.documentElement.classList.add('mobile-optimized');
      
      // Disable hover effects on touch devices
      if (this.capabilities.touchSupport) {
        document.documentElement.classList.add('touch-device');
      }
      
      // Apply performance mode
      this.applyPerformanceMode();
    }
  }

  private applyPerformanceMode(): void {
    const { performanceMode } = this.config;
    
    switch (performanceMode) {
      case 'battery-saver':
        // Reduce animations and background processes
        document.documentElement.classList.add('battery-saver');
        break;
      case 'optimized':
        // Balance between performance and features
        document.documentElement.classList.add('performance-optimized');
        break;
      default:
        // Standard mode - no restrictions
        break;
    }
  }
}

// Create singleton instance
export const mobileFeatureService = new MobileFeatureServices();

export default mobileFeatureService;
