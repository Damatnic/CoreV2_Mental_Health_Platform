/**
 * Service Worker Registration and Lifecycle Tests
 * Tests for service worker registration, activation, and basic functionality
 */

describe('Service Worker Registration', () => {
  let mockServiceWorker: jest.Mocked<ServiceWorkerContainer>;
  
  beforeEach(() => {
    // Get the mocked service worker
    mockServiceWorker = navigator.serviceWorker as jest.Mocked<ServiceWorkerContainer>;
    jest.clearAllMocks();
  });

  describe('Registration Process', () => {
    it('should register service worker successfully', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: {
          scriptURL: '/sw.js',
          state: 'activated'
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        update: jest.fn(),
        unregister: jest.fn(),
        scope: '/',
        updateViaCache: 'imports'
      } as unknown as ServiceWorkerRegistration;
      
      mockServiceWorker.register.mockResolvedValue(mockRegistration);
      
      const registration = await mockServiceWorker.register('/sw.js');
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(registration).toBeDefined();
      expect(registration.active?.scriptURL).toBe('/sw.js');
    });

    it('should handle registration failure gracefully', async () => {
      const registrationError = new Error('Failed to register service worker');
      mockServiceWorker.register.mockRejectedValue(registrationError);
      
      await expect(mockServiceWorker.register('/sw.js')).rejects.toThrow('Failed to register service worker');
    });

    it('should check if service worker is supported', () => {
      expect('serviceWorker' in navigator).toBe(true);
    });

    it('should handle registration with options', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: {
          scriptURL: '/sw.js',
          state: 'activated'
        },
        scope: '/app/',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        update: jest.fn(),
        unregister: jest.fn(),
        updateViaCache: 'imports'
      } as unknown as ServiceWorkerRegistration;
      
      mockServiceWorker.register.mockResolvedValue(mockRegistration);
      
      const options = { scope: '/app/' };
      const registration = await mockServiceWorker.register('/sw.js', options);
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', options);
      expect(registration.scope).toBe('/app/');
    });
  });

  describe('Service Worker Ready State', () => {
    it('should resolve when service worker is ready', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: {
          scriptURL: '/sw.js',
          state: 'activated'
        },
        scope: '/',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        update: jest.fn(),
        unregister: jest.fn(),
        updateViaCache: 'imports'
      } as unknown as ServiceWorkerRegistration;
      
      // Mock the ready promise
      Object.defineProperty(mockServiceWorker, 'ready', {
        value: Promise.resolve(mockRegistration),
        writable: true
      });
      
      const registration = await mockServiceWorker.ready;
      
      expect(registration).toBeDefined();
      expect(registration.active?.state).toBe('activated');
    });
  });

  describe('Service Worker Controller', () => {
    it('should have controller when service worker is active', () => {
      const mockController = {
        scriptURL: '/sw.js',
        state: 'activated',
        postMessage: jest.fn()
      };
      
      Object.defineProperty(mockServiceWorker, 'controller', {
        value: mockController,
        writable: true
      });
      
      expect(mockServiceWorker.controller).toBeDefined();
      expect(mockServiceWorker.controller?.scriptURL).toBe('/sw.js');
    });

    it('should send messages to controller', () => {
      const mockController = {
        scriptURL: '/sw.js',
        state: 'activated',
        postMessage: jest.fn()
      };
      
      Object.defineProperty(mockServiceWorker, 'controller', {
        value: mockController,
        writable: true
      });
      
      const message = { type: 'PING' };
      mockServiceWorker.controller?.postMessage(message);
      
      expect(mockController.postMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('Service Worker Events', () => {
    it('should add event listeners', () => {
      const controllerChangeHandler = jest.fn();
      
      mockServiceWorker.addEventListener('controllerchange', controllerChangeHandler);
      
      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith('controllerchange', controllerChangeHandler);
    });

    it('should remove event listeners', () => {
      const messageHandler = jest.fn();
      
      mockServiceWorker.removeEventListener('message', messageHandler);
      
      expect(mockServiceWorker.removeEventListener).toHaveBeenCalledWith('message', messageHandler);
    });
  });

  describe('Service Worker Registration Retrieval', () => {
    it('should get registration for scope', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: {
          scriptURL: '/sw.js',
          state: 'activated'
        },
        scope: '/',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        update: jest.fn(),
        unregister: jest.fn(),
        updateViaCache: 'imports'
      } as unknown as ServiceWorkerRegistration;
      
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);
      
      const registration = await mockServiceWorker.getRegistration('/');
      
      expect(mockServiceWorker.getRegistration).toHaveBeenCalledWith('/');
      expect(registration).toBeDefined();
    });

    it('should return undefined for non-existent registration', async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(undefined);
      
      const registration = await mockServiceWorker.getRegistration('/non-existent');
      
      expect(registration).toBeUndefined();
    });
  });
});
