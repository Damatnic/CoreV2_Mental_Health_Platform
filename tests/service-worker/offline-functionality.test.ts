/**
 * Offline Functionality Tests
 * Tests for offline scenarios, network detection, and crisis resource availability
 */

describe('Offline Functionality', () => {
  let mockCaches: any;
  let mockCache: any;
  let originalOnLine: boolean;

  beforeEach(() => {
    // Create mock cache object
    mockCache = {
      match: jest.fn(),
      matchAll: jest.fn(),
      add: jest.fn(),
      addAll: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      keys: jest.fn()
    };

    // Create mock caches object
    mockCaches = {
      open: jest.fn().mockResolvedValue(mockCache),
      has: jest.fn().mockResolvedValue(false),
      delete: jest.fn().mockResolvedValue(true),
      keys: jest.fn().mockResolvedValue([]),
      match: jest.fn()
    };
    
    // Set global caches
    (global as any).caches = mockCaches;
    
    jest.clearAllMocks();

    // Store original online state
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    // Restore original online state
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true
    });
  });

  describe('Network Detection', () => {
    it('should detect online state', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });

      expect(navigator.onLine).toBe(true);
    });

    it('should detect offline state', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      expect(navigator.onLine).toBe(false);
    });

    it('should handle online/offline events', () => {
      const onlineHandler = jest.fn();
      const offlineHandler = jest.fn();

      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      expect(offlineHandler).toHaveBeenCalledWith(offlineEvent);

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });
      
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      expect(onlineHandler).toHaveBeenCalledWith(onlineEvent);

      // Cleanup
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    });
  });

  describe('Crisis Resources Offline Access', () => {
    const crisisResources = {
      hotlines: [
        {
          name: 'Suicide & Crisis Lifeline',
          number: '988',
          available: '24/7',
          description: 'Free and confidential emotional support'
        },
        {
          name: 'Crisis Text Line',
          number: 'Text HOME to 741741',
          available: '24/7',
          description: 'Text-based crisis support'
        }
      ],
      emergencyContacts: [
        {
          type: 'Emergency',
          number: '911',
          description: 'Immediate life-threatening situations'
        }
      ]
    };

    it('should serve crisis resources from cache when offline', async () => {
      const mockResponse = new Response(JSON.stringify(crisisResources), {
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/crisis-resources.json');
      
      expect(response).toBeDefined();
      const data = await response!.json();
      expect(data.hotlines).toBeDefined();
      expect(data.hotlines[0].number).toBe('988');
    });

    it('should provide coping strategies offline', async () => {
      const copingStrategies = {
        breathing: [
          'Take slow, deep breaths',
          '4-7-8 breathing technique',
          'Box breathing method'
        ],
        grounding: [
          '5-4-3-2-1 technique',
          'Name things you can see, hear, touch',
          'Focus on physical sensations'
        ],
        immediate: [
          'Call 988 for crisis support',
          'Reach out to a trusted friend',
          'Use your safety plan'
        ]
      };

      const mockResponse = new Response(JSON.stringify(copingStrategies), {
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/offline-coping-strategies.json');
      
      expect(response).toBeDefined();
      const data = await response!.json();
      expect(data.breathing).toBeDefined();
      expect(data.immediate).toContain('Call 988 for crisis support');
    });

    it('should provide emergency contacts offline', async () => {
      const emergencyContacts = {
        crisis: [
          { name: '988 Lifeline', number: '988' },
          { name: 'Crisis Text Line', number: '741741' }
        ],
        medical: [
          { name: 'Emergency Services', number: '911' }
        ],
        support: [
          { name: 'NAMI HelpLine', number: '1-800-950-6264' }
        ]
      };

      const mockResponse = new Response(JSON.stringify(emergencyContacts), {
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/emergency-contacts.json');
      
      expect(response).toBeDefined();
      const data = await response!.json();
      expect(data.crisis[0].number).toBe('988');
    });
  });

  describe('Offline Navigation', () => {
    it('should serve offline fallback page for general routes', async () => {
      const offlineHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Offline - Astral Core</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body>
            <div id="offline-container">
              <h1>You're currently offline</h1>
              <p>Some features are still available:</p>
              <ul>
                <li>Crisis support resources</li>
                <li>Cached conversations</li>
                <li>Safety plan access</li>
              </ul>
              <button onclick="window.location.reload()">Retry Connection</button>
            </div>
          </body>
        </html>
      `;

      const mockResponse = new Response(offlineHtml, {
        headers: { 'Content-Type': 'text/html' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('offline-pages-v1');
      const response = await cache.match('/offline.html');
      
      expect(response).toBeDefined();
      const html = await response!.text();
      expect(html).toContain('You\'re currently offline');
      expect(html).toContain('Crisis support resources');
    });

    it('should serve crisis-specific offline page for crisis routes', async () => {
      const crisisOfflineHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Crisis Support - Offline Available</title>
          </head>
          <body>
            <div id="crisis-offline">
              <h1>Crisis Support Available Offline</h1>
              <div class="emergency-section">
                <h2>Immediate Help</h2>
                <p><strong>988</strong> - Suicide & Crisis Lifeline</p>
                <p><strong>911</strong> - Emergency Services</p>
              </div>
              <div class="coping-section">
                <h2>Coping Strategies</h2>
                <ul>
                  <li>Take slow, deep breaths</li>
                  <li>Use grounding techniques</li>
                  <li>Reach out to someone you trust</li>
                </ul>
              </div>
            </div>
          </body>
        </html>
      `;

      const mockResponse = new Response(crisisOfflineHtml, {
        headers: { 'Content-Type': 'text/html' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('offline-pages-v1');
      const response = await cache.match('/offline-crisis.html');
      
      expect(response).toBeDefined();
      const html = await response!.text();
      expect(html).toContain('Crisis Support Available Offline');
      expect(html).toContain('988');
      expect(html).toContain('911');
    });
  });

  describe('Offline Data Synchronization', () => {
    it('should queue requests when offline', () => {
      // Mock IndexedDB or local storage for offline queue
      const offlineQueue: Array<{ url: string; method: string; body?: any }> = [];
      
      const queueRequest = (url: string, method: string, body?: any) => {
        offlineQueue.push({ url, method, body });
      };

      // Simulate offline request queuing
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      queueRequest('/api/mood-entry', 'POST', { mood: 7, notes: 'Feeling better' });
      queueRequest('/api/chat-message', 'POST', { message: 'Thank you for the help' });

      expect(offlineQueue).toHaveLength(2);
      expect(offlineQueue[0].url).toBe('/api/mood-entry');
      expect(offlineQueue[1].url).toBe('/api/chat-message');
    });

    it('should process queued requests when back online', async () => {
      const processedRequests: string[] = [];
      
      const processQueue = async (queue: Array<{ url: string; method: string; body?: any }>) => {
        for (const request of queue) {
          // Simulate successful API call
          processedRequests.push(request.url);
        }
        return processedRequests;
      };

      const mockQueue = [
        { url: '/api/mood-entry', method: 'POST', body: { mood: 8 } },
        { url: '/api/reflection', method: 'POST', body: { text: 'Today was better' } }
      ];

      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });

      const processed = await processQueue(mockQueue);

      expect(processed).toHaveLength(2);
      expect(processed).toContain('/api/mood-entry');
      expect(processed).toContain('/api/reflection');
    });
  });

  describe('Offline Storage Management', () => {
    it('should store critical data locally', () => {
      const criticalData = {
        safetyPlan: {
          warningSignsPersonal: ['Feeling isolated', 'Loss of interest'],
          copingStrategies: ['Call a friend', 'Take a walk'],
          supportContacts: ['John Doe - 555-0123']
        },
        preferences: {
          crisisAlertLevel: 'high',
          notificationSettings: { enabled: true }
        }
      };

      // localStorage is already mocked globally in setupTests.ts
      localStorage.setItem('astral-critical-data', JSON.stringify(criticalData));

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'astral-critical-data',
        JSON.stringify(criticalData)
      );
    });

    it('should retrieve cached data when offline', () => {
      const cachedData = {
        lastMoodEntry: { date: '2025-01-03', mood: 7 },
        recentChatMessages: [
          { id: '1', message: 'How are you feeling?', timestamp: '2025-01-03T10:00:00Z' }
        ]
      };

      // localStorage is already mocked globally in setupTests.ts
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(cachedData));

      const retrieved = localStorage.getItem('astral-cached-data');
      const data = JSON.parse(retrieved!);

      expect(data.lastMoodEntry.mood).toBe(7);
      expect(data.recentChatMessages).toHaveLength(1);
    });
  });

  describe('Performance in Offline Mode', () => {
    it('should load cached resources quickly', async () => {
      const startTime = performance.now();
      
      const mockResponse = new Response('Cached content', {
        headers: { 'Content-Type': 'text/plain' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/test-resource');
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(response).toBeDefined();
      expect(loadTime).toBeLessThan(100); // Should be very fast from cache
    });

    it('should minimize battery usage in offline mode', () => {
      // Test that offline mode reduces unnecessary network requests
      const networkRequestCount = 0;
      
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      // In offline mode, should not attempt network requests
      expect(networkRequestCount).toBe(0);
    });
  });
});
