/**
 * PWA Enhancement Service
 * Manages app installation, offline detection, and enhanced app-like experience
 */

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
}

export type PWAStatusType = 'not-supported' | 'installable' | 'installed' | 'offline';

class PWAService {
  private deferredPrompt: InstallPromptEvent | null = null;
  private isInstalled = false;
  private isOffline = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
    });

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
    });

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOffline = false;
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
    });

    // Check if already installed
    this.checkInstallStatus();
  }

  private checkInstallStatus(): void {
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }

    // Check initial offline status
    this.isOffline = !navigator.onLine;
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.isInstalled = true;
      }
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  async getInstallStatus(): Promise<PWAStatusType> {
    if (!('serviceWorker' in navigator)) {
      return 'not-supported';
    }

    if (this.isInstalled) {
      return 'installed';
    }

    if (this.deferredPrompt) {
      return 'installable';
    }

    if (this.isOffline) {
      return 'offline';
    }

    return 'not-supported';
  }

  getPWAStatus(): PWAStatus {
    return {
      isInstallable: !!this.deferredPrompt,
      isInstalled: this.isInstalled,
      isOffline: this.isOffline
    };
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  async registerServiceWorker(swPath = '/sw.js'): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  async unregisterServiceWorker(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const unregistered = await registration.unregister();
      console.log('Service Worker unregistered');
      return unregistered;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  // Mobile-specific enhancements
  optimizeForMobile(): void {
    // Prevent zoom on input focus
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }

    // Add mobile-specific CSS classes
    document.body.classList.add('mobile-optimized');
    
    if (this.isStandalone()) {
      document.body.classList.add('standalone-mode');
    }
  }

  // Notification helpers
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  canShowNotifications(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  showNotification(title: string, options?: NotificationOptions): void {
    if (!this.canShowNotifications()) {
      return;
    }

    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      ...options
    });
  }
}

// Export singleton instance
export const pwaService = new PWAService();
export default pwaService;