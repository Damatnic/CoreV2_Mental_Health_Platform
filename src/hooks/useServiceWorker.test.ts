import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const useServiceWorker = () => {
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [registration, setRegistration] = React.useState<ServiceWorkerRegistration | null>(null);

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);
      setIsInstalled(true);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  };

  const checkForUpdates = React.useCallback(async () => {
    if (!registration) return;
    
    setIsUpdating(true);
    try {
      await registration.update();
    } catch (error) {
      console.error('Update check failed:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [registration]);

  const skipWaiting = React.useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  const unregister = React.useCallback(async () => {
    if (!registration) return;
    
    try {
      const success = await registration.unregister();
      if (success) {
        setIsInstalled(false);
        setRegistration(null);
      }
      return success;
    } catch (error) {
      console.error('Unregistration failed:', error);
      return false;
    }
  }, [registration]);

  return {
    isInstalled,
    isUpdating,
    updateAvailable,
    checkForUpdates,
    skipWaiting,
    unregister
  };
};

describe('useServiceWorker', () => {
  let mockServiceWorker: any;
  let mockRegistration: any;

  beforeEach(() => {
    mockRegistration = {
      update: jest.fn().mockResolvedValue(undefined),
      unregister: jest.fn().mockResolvedValue(true),
      waiting: null,
      addEventListener: jest.fn()
    };

    mockServiceWorker = {
      register: jest.fn().mockResolvedValue(mockRegistration),
      controller: {}
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true
    });
  });

  it('should register service worker on mount', async () => {
    const { result } = renderHook(() => useServiceWorker());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
    expect(result.current.isInstalled).toBe(true);
  });

  it('should check for updates', async () => {
    const { result } = renderHook(() => useServiceWorker());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    await act(async () => {
      await result.current.checkForUpdates();
    });
    
    expect(mockRegistration.update).toHaveBeenCalled();
  });

  it('should unregister service worker', async () => {
    const { result } = renderHook(() => useServiceWorker());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    let success: boolean = false;
    await act(async () => {
      success = await result.current.unregister();
    });
    
    expect(mockRegistration.unregister).toHaveBeenCalled();
    expect(success).toBe(true);
    expect(result.current.isInstalled).toBe(false);
  });

  it('should handle no service worker support', () => {
    const originalSW = navigator.serviceWorker;
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      writable: true
    });
    
    const { result } = renderHook(() => useServiceWorker());
    
    expect(result.current.isInstalled).toBe(false);
    
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalSW,
      writable: true
    });
  });

  it('should skip waiting when update available', async () => {
    const mockWaiting = {
      postMessage: jest.fn()
    };
    
    mockRegistration.waiting = mockWaiting;
    
    const originalReload = window.location.reload;
    window.location.reload = jest.fn();
    
    const { result } = renderHook(() => useServiceWorker());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    act(() => {
      result.current.skipWaiting();
    });
    
    expect(mockWaiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(window.location.reload).toHaveBeenCalled();
    
    window.location.reload = originalReload;
  });
});
