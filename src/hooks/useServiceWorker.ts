import { useState, useEffect, useCallback } from 'react';

interface UseServiceWorkerReturn {
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isInstalling: boolean;
  updateServiceWorker: () => Promise<void>;
  skipWaiting: () => Promise<void>;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = (): UseServiceWorkerReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          setRegistration(reg);
          
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              setIsInstalling(true);
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  setIsInstalling(false);
                  if (navigator.serviceWorker.controller) {
                    setIsUpdateAvailable(true);
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          window.location.reload();
        }
      });
    }
  }, []);

  const updateServiceWorker = useCallback(async () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
    }
  }, [registration]);

  const skipWaiting = useCallback(async () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
    }
  }, [registration]);

  return {
    isOnline,
    isUpdateAvailable,
    isInstalling,
    updateServiceWorker,
    skipWaiting,
    registration
  };
};