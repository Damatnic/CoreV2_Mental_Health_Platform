import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface ServiceWorkerConfig {
  scope: string;
  updateViaCache: 'all' | 'imports' | 'none';
  skipWaiting: boolean;
  clientsClaim: boolean;
  cacheStrategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate';
}

class ServiceWorkerManager {
  private config: ServiceWorkerConfig;
  private registration: ServiceWorkerRegistration | null = null;

  constructor(config: ServiceWorkerConfig) {
    this.config = config;
  }

  async register(scriptURL: string): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register(scriptURL, {
        scope: this.config.scope,
        updateViaCache: this.config.updateViaCache
      });

      return this.registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      return await this.registration.unregister();
    } catch (error) {
      console.error('Service worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<ServiceWorkerRegistration | null> {
    if (!this.registration) return null;

    try {
      return await this.registration.update();
    } catch (error) {
      console.error('Service worker update failed:', error);
      return null;
    }
  }

  getConfig(): ServiceWorkerConfig {
    return { ...this.config };
  }
}

describe('ServiceWorkerManager', () => {
  let mockServiceWorker: any;
  let mockRegistration: any;

  beforeEach(() => {
    mockRegistration = {
      unregister: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(mockRegistration)
    };

    mockServiceWorker = {
      register: jest.fn().mockResolvedValue(mockRegistration)
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register service worker successfully', async () => {
    const config: ServiceWorkerConfig = {
      scope: '/',
      updateViaCache: 'none',
      skipWaiting: true,
      clientsClaim: true,
      cacheStrategy: 'networkFirst'
    };

    const manager = new ServiceWorkerManager(config);
    const registration = await manager.register('/sw.js');

    expect(registration).toBe(mockRegistration);
    expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
  });

  it('should handle registration failure', async () => {
    mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'));

    const config: ServiceWorkerConfig = {
      scope: '/',
      updateViaCache: 'none',
      skipWaiting: true,
      clientsClaim: true,
      cacheStrategy: 'networkFirst'
    };

    const manager = new ServiceWorkerManager(config);
    const registration = await manager.register('/sw.js');

    expect(registration).toBeNull();
  });

  it('should unregister service worker', async () => {
    const config: ServiceWorkerConfig = {
      scope: '/',
      updateViaCache: 'none',
      skipWaiting: true,
      clientsClaim: true,
      cacheStrategy: 'networkFirst'
    };

    const manager = new ServiceWorkerManager(config);
    await manager.register('/sw.js');
    
    const result = await manager.unregister();
    
    expect(result).toBe(true);
    expect(mockRegistration.unregister).toHaveBeenCalled();
  });

  it('should update service worker', async () => {
    const config: ServiceWorkerConfig = {
      scope: '/',
      updateViaCache: 'none',
      skipWaiting: true,
      clientsClaim: true,
      cacheStrategy: 'networkFirst'
    };

    const manager = new ServiceWorkerManager(config);
    await manager.register('/sw.js');
    
    const result = await manager.update();
    
    expect(result).toBe(mockRegistration);
    expect(mockRegistration.update).toHaveBeenCalled();
  });

  it('should return config', () => {
    const config: ServiceWorkerConfig = {
      scope: '/',
      updateViaCache: 'none',
      skipWaiting: true,
      clientsClaim: true,
      cacheStrategy: 'networkFirst'
    };

    const manager = new ServiceWorkerManager(config);
    const returnedConfig = manager.getConfig();

    expect(returnedConfig).toEqual(config);
    expect(returnedConfig).not.toBe(config); // Should be a copy
  });
});
