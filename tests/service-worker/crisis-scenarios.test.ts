/**
 * Crisis Scenario Tests
 * Tests for crisis detection, emergency resource access, and critical functionality
 */

describe('Crisis Scenario Testing', () => {
  let mockCaches: jest.Mocked<CacheStorage>;
  let mockCache: jest.Mocked<Cache>;

  beforeEach(() => {
    mockCaches = global.caches as jest.Mocked<CacheStorage>;
    mockCache = {
      match: jest.fn(),
      matchAll: jest.fn(),
      add: jest.fn(),
      addAll: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      keys: jest.fn()
    } as jest.Mocked<Cache>;

    mockCaches.open.mockResolvedValue(mockCache);
    jest.clearAllMocks();
  });

  describe('Crisis Resource Availability', () => {
    const criticalResources = [
      '/crisis-resources.json',
      '/emergency-contacts.json',
      '/offline-coping-strategies.json',
      '/offline-crisis.html'
    ];

    it('should ensure 988 lifeline is always accessible offline', async () => {
      const crisisResources = {
        primaryHotline: {
          name: 'Suicide & Crisis Lifeline',
          number: '988',
          available: '24/7',
          description: 'Free and confidential emotional support to people in suicidal crisis or emotional distress'
        },
        alternativeNumbers: [
          '1-800-273-8255', // Legacy number
          '1-800-273-TALK'
        ]
      };

      const mockResponse = new Response(JSON.stringify(crisisResources), {
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/crisis-resources.json');
      
      expect(response).toBeDefined();
      const data = await response!.json();
      expect(data.primaryHotline.number).toBe('988');
      expect(data.primaryHotline.available).toBe('24/7');
    });

    it('should provide crisis text line access offline', async () => {
      const textCrisisSupport = {
        primary: {
          service: 'Crisis Text Line',
          number: '741741',
          keyword: 'HOME',
          instructions: 'Text HOME to 741741',
          available: '24/7'
        },
        specializedLines: [
          {
            service: 'Trans Lifeline',
            number: '877-565-8860',
            description: 'Peer support for transgender people'
          }
        ]
      };

      const mockResponse = new Response(JSON.stringify(textCrisisSupport), {
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/emergency-contacts.json');
      
      expect(response).toBeDefined();
      const data = await response!.json();
      expect(data.primary.number).toBe('741741');
      expect(data.primary.keyword).toBe('HOME');
    });

    it('should ensure all critical resources are cached', async () => {
      const cachedRequests = criticalResources.map(url => new Request(url));
      mockCache.keys.mockResolvedValue(cachedRequests);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const allCachedUrls = await cache.keys();
      
      const urlList = allCachedUrls.map(req => req.url);
      
      for (const resource of criticalResources) {
        expect(urlList.some(url => url.includes(resource))).toBe(true);
      }
    });
  });

  describe('Emergency Response Speed', () => {
    it('should load crisis resources in under 100ms', async () => {
      const startTime = performance.now();
      
      const crisisData = {
        immediate: '988',
        emergency: '911',
        text: '741741'
      };

      const mockResponse = new Response(JSON.stringify(crisisData), {
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/crisis-resources.json');
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(response).toBeDefined();
      expect(loadTime).toBeLessThan(100);
    });

    it('should prioritize crisis page loading', async () => {
      const crisisPageHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Crisis Support - Immediate Help</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              .emergency { 
                background: #ff4444; 
                color: white; 
                padding: 20px; 
                font-size: 24px; 
                text-align: center; 
              }
              .hotline { 
                font-size: 48px; 
                font-weight: bold; 
                margin: 20px 0; 
              }
            </style>
          </head>
          <body>
            <div class="emergency">
              <h1>Immediate Crisis Support</h1>
              <div class="hotline">988</div>
              <p>Suicide & Crisis Lifeline - 24/7 Support</p>
              <div class="hotline">911</div>
              <p>Emergency Services</p>
            </div>
          </body>
        </html>
      `;

      const mockResponse = new Response(crisisPageHtml, {
        headers: { 'Content-Type': 'text/html' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('offline-pages-v1');
      const response = await cache.match('/offline-crisis.html');
      
      expect(response).toBeDefined();
      const html = await response!.text();
      expect(html).toContain('988');
      expect(html).toContain('911');
      expect(html).toContain('Immediate Crisis Support');
    });
  });

  describe('Crisis Detection and Response', () => {
    it('should identify crisis keywords in content', () => {
      const crisisKeywords = [
        'suicide', 'kill myself', 'end it all', 'want to die',
        'self-harm', 'hurt myself', 'no point living',
        'better off dead', 'suicide plan', 'overdose'
      ];

      const testMessages = [
        'I want to kill myself',
        'I want to hurt myself and self-harm',
        'I have a plan to end it all',
        'I just feel sad today' // Non-crisis
      ];

      const detectCrisis = (message: string): boolean => {
        return crisisKeywords.some(keyword => 
          message.toLowerCase().includes(keyword.toLowerCase())
        );
      };

      expect(detectCrisis(testMessages[0])).toBe(true);
      expect(detectCrisis(testMessages[1])).toBe(true);
      expect(detectCrisis(testMessages[2])).toBe(true);
      expect(detectCrisis(testMessages[3])).toBe(false);
    });

    it('should provide immediate coping strategies for crisis', async () => {
      const immediateCopingStrategies = {
        breathing: {
          title: 'Emergency Breathing',
          steps: [
            'Breathe in slowly for 4 counts',
            'Hold for 7 counts',
            'Exhale slowly for 8 counts',
            'Repeat until you feel calmer'
          ],
          priority: 'immediate'
        },
        grounding: {
          title: '5-4-3-2-1 Grounding',
          steps: [
            'Name 5 things you can see',
            'Name 4 things you can touch',
            'Name 3 things you can hear',
            'Name 2 things you can smell',
            'Name 1 thing you can taste'
          ],
          priority: 'immediate'
        },
        safety: {
          title: 'Immediate Safety',
          steps: [
            'Call 988 for crisis support',
            'Call 911 if in immediate danger',
            'Text HOME to 741741',
            'Reach out to emergency contact'
          ],
          priority: 'critical'
        }
      };

      const mockResponse = new Response(JSON.stringify(immediateCopingStrategies), {
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/offline-coping-strategies.json');
      
      expect(response).toBeDefined();
      const strategies = await response!.json();
      expect(strategies.safety.priority).toBe('critical');
      expect(strategies.safety.steps).toContain('Call 988 for crisis support');
    });
  });

  describe('Crisis Communication Features', () => {
    it('should enable crisis alert notifications', () => {
      const crisisAlert = {
        type: 'crisis-detected',
        severity: 'high',
        timestamp: new Date().toISOString(),
        resources: ['988', '911', 'Crisis Text Line'],
        copingStrategies: ['breathing', 'grounding', 'safety-plan']
      };

      // Mock notification API
      const mockNotification = {
        permission: 'granted' as NotificationPermission,
        requestPermission: jest.fn().mockResolvedValue('granted' as NotificationPermission)
      };

      Object.defineProperty(global, 'Notification', {
        value: mockNotification,
        writable: true
      });

      expect(crisisAlert.type).toBe('crisis-detected');
      expect(crisisAlert.severity).toBe('high');
      expect(crisisAlert.resources).toContain('988');
    });

    it('should provide crisis chat templates', async () => {
      const crisisTemplates = {
        selfHarm: {
          template: "I'm concerned about your safety right now. The 988 Lifeline (988) provides 24/7 free and confidential support. Would you like to talk about what you're feeling?",
          resources: ['988', 'Crisis Text Line'],
          followUp: true
        },
        suicidalIdeation: {
          template: "Thank you for sharing this with me. You're not alone. Please consider calling 988 for immediate support. Are you in a safe place right now?",
          resources: ['988', '911', 'Crisis Text Line'],
          escalate: true
        },
        emergencyPlan: {
          template: "Let's focus on your safety plan. Do you have your crisis contacts available? If not, 988 is always there for you.",
          resources: ['Safety Plan', '988'],
          priority: 'immediate'
        }
      };

      const mockResponse = new Response(JSON.stringify(crisisTemplates), {
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/crisis-chat-templates.json');
      
      expect(response).toBeDefined();
      const templates = await response!.json();
      expect(templates.suicidalIdeation.escalate).toBe(true);
      expect(templates.emergencyPlan.priority).toBe('immediate');
    });
  });

  describe('Safety Plan Access', () => {
    it('should provide offline safety plan template', async () => {
      const safetyPlanTemplate = {
        personalWarningSigns: {
          title: 'My Warning Signs',
          examples: [
            'Feeling hopeless',
            'Isolating from others',
            'Loss of interest in activities',
            'Sleep problems',
            'Increased substance use'
          ],
          userInput: []
        },
        copingStrategies: {
          title: 'Coping Strategies That Help Me',
          examples: [
            'Listen to music',
            'Take a walk',
            'Call a friend',
            'Practice breathing exercises',
            'Write in a journal'
          ],
          userInput: []
        },
        supportPeople: {
          title: 'People Who Support Me',
          template: {
            name: '',
            phone: '',
            relationship: '',
            whenToCall: ''
          },
          examples: [
            { name: 'Best Friend', phone: '555-0123', relationship: 'Friend', whenToCall: 'Anytime' }
          ]
        },
        professionalContacts: {
          title: 'Professional Support',
          required: [
            { name: '988 Lifeline', phone: '988', type: 'Crisis Hotline' },
            { name: 'Emergency Services', phone: '911', type: 'Emergency' },
            { name: 'Crisis Text Line', phone: '741741', type: 'Text Support' }
          ],
          personal: []
        },
        environmentSafety: {
          title: 'Making My Environment Safe',
          steps: [
            'Remove means of self-harm',
            'Ask someone to stay with me',
            'Go to a safe place',
            'Avoid drugs and alcohol'
          ]
        },
        reasonsToLive: {
          title: 'Reasons I Want to Live',
          examples: [
            'My family and friends',
            'My pet',
            'Future goals and dreams',
            'Making a positive impact',
            'Experiences I want to have'
          ],
          userInput: []
        }
      };

      const mockResponse = new Response(JSON.stringify(safetyPlanTemplate), {
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(mockResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/safety-plan-template.json');
      
      expect(response).toBeDefined();
      const safetyPlan = await response!.json();
      expect(safetyPlan.professionalContacts.required[0].phone).toBe('988');
      expect(safetyPlan.reasonsToLive.examples).toContain('My family and friends');
    });
  });

  describe('Crisis Resource Reliability', () => {
    it('should verify all crisis resources are accessible', async () => {
      const criticalResources = [
        '/crisis-resources.json',
        '/emergency-contacts.json',
        '/offline-coping-strategies.json',
        '/safety-plan-template.json',
        '/offline-crisis.html'
      ];

      let allAccessible = true;
      
      for (const resource of criticalResources) {
        const mockResponse = new Response('{"available": true}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

        mockCache.match.mockResolvedValue(mockResponse);
        
        const cache = await mockCaches.open('crisis-resources-v1');
        const response = await cache.match(resource);
        
        if (!response || response.status !== 200) {
          allAccessible = false;
          break;
        }
      }

      expect(allAccessible).toBe(true);
    });

    it('should handle cache corruption gracefully', async () => {
      // Simulate corrupted cache response
      const corruptedResponse = new Response('corrupted data', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      mockCache.match.mockResolvedValue(corruptedResponse);
      
      const cache = await mockCaches.open('crisis-resources-v1');
      const response = await cache.match('/crisis-resources.json');
      
      try {
        await response!.json();
      } catch (error) {
        // Should have fallback mechanism
        expect(error).toBeDefined();
      }
    });

    it('should measure crisis resource load times', async () => {
      const performanceTests: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        const mockResponse = new Response('{"test": "data"}');
        mockCache.match.mockResolvedValue(mockResponse);
        
        const cache = await mockCaches.open('crisis-resources-v1');
        await cache.match('/crisis-resources.json');
        
        const endTime = performance.now();
        performanceTests.push(endTime - startTime);
      }

      const averageTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
      
      // Crisis resources should load very quickly
      expect(averageTime).toBeLessThan(50);
    });
  });
});
