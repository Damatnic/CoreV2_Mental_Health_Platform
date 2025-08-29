/**
 * Service Worker Configuration
 * Handles PWA service worker registration and management
 */

export interface ServiceWorkerConfig {
  swUrl: string;
  scope: string;
  updateViaCache: 'imports' | 'all' | 'none';
  skipWaiting: boolean;
  clientsClaim: boolean;
}

export interface ServiceWorkerCallbacks {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
  onNeedRefresh?: () => void;
  onError?: (error: Error) => void;
}

// Default service worker configuration
const defaultConfig: ServiceWorkerConfig = {
  swUrl: '/sw.js',
  scope: '/',
  updateViaCache: 'none',
  skipWaiting: false,
  clientsClaim: true
};

/**
 * Register service worker for PWA functionality
 */
export const registerServiceWorker = async (
  config: Partial<ServiceWorkerConfig> = {},
  callbacks: ServiceWorkerCallbacks = {}
): Promise<ServiceWorkerRegistration | null> => {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }

  // Only register in production or when explicitly enabled
  const isProduction = process.env.NODE_ENV === 'production';
  const isEnabled = process.env.VITE_ENABLE_SERVICE_WORKER === 'true';
  
  if (!isProduction && !isEnabled) {
    console.log('Service Worker registration skipped in development');
    return null;
  }

  const finalConfig = { ...defaultConfig, ...config };

  try {
    const registration = await navigator.serviceWorker.register(finalConfig.swUrl, {
      scope: finalConfig.scope,
      updateViaCache: finalConfig.updateViaCache
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content available, update ready
            console.log('New content available, update ready');
            callbacks.onUpdate?.(registration);
            callbacks.onNeedRefresh?.();
          } else {
            // Content cached for offline use
            console.log('Content cached for offline use');
            callbacks.onOfflineReady?.();
          }
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        window.location.reload();
      }
    });

    callbacks.onSuccess?.(registration);
    return registration;

  } catch (error) {
    console.error('Service Worker registration failed:', error);
    callbacks.onError?.(error as Error);
    return null;
  }
};

/**
 * Unregister service worker
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const unregistered = await registration.unregister();
    
    if (unregistered) {
      console.log('Service Worker unregistered successfully');
    }
    
    return unregistered;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
};

/**
 * Update service worker
 */
export const updateServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('Service Worker update check completed');
  } catch (error) {
    console.error('Service Worker update failed:', error);
  }
};

/**
 * Skip waiting and activate new service worker immediately
 */
export const skipWaiting = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      // Send skip waiting message to service worker
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  } catch (error) {
    console.error('Skip waiting failed:', error);
  }
};

/**
 * Check if service worker is active
 */
export const isServiceWorkerActive = (): boolean => {
  return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
};

/**
 * Get service worker registration
 */
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('Failed to get service worker registration:', error);
    return null;
  }
};

/**
 * Send message to service worker
 */
export const sendMessageToServiceWorker = (message: any): void => {
  if (!isServiceWorkerActive()) {
    console.warn('No active service worker to send message to');
    return;
  }

  navigator.serviceWorker.controller?.postMessage(message);
};

// Default export
export default {
  register: registerServiceWorker,
  unregister: unregisterServiceWorker,
  update: updateServiceWorker,
  skipWaiting,
  isActive: isServiceWorkerActive,
  getRegistration: getServiceWorkerRegistration,
  sendMessage: sendMessageToServiceWorker
};