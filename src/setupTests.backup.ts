/**
 * Test Setup Configuration
 * 
 * Global setup for all tests in the mental health platform
 */

// Import testing library extensions
import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// DOM setup function
function setupDOM(config: { url: string; pretendToBeVisual: boolean; resources: string }) {
  // Set up jsdom environment configuration
  Object.defineProperty(window, 'location', {
    value: new URL(config.url),
    writable: true
  });
}

// DOM cleanup function
function cleanupDOM() {
  // Clean up any DOM modifications
  document.body.innerHTML = '';
  document.head.innerHTML = '';
}

// Set up DOM environment
setupDOM({
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Global test configuration
jest.setTimeout(30000); // 30 seconds timeout for tests

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress React warnings in tests unless debugging
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:') &&
      !process.env.DEBUG_TESTS
    ) {
      return;
    }
    originalError(...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps') &&
      !process.env.DEBUG_TESTS
    ) {
      return;
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  cleanupDOM();
});

// Global test utilities
global.testUtils = {
  // Mock user for tests
  mockUser: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://via.placeholder.com/40',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true
    },
    profile: {
      age: 25,
      location: 'Test City',
      therapistId: null,
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+1-555-0123'
      }
    },
    permissions: {
      canAccessCrisisSupport: true,
      canMessageTherapist: false,
      canJoinPeerSupport: true
    }
  },

  // Mock session data
  mockSession: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    user: 'test-user-123'
  },

  // Mock API responses
  mockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' })
  }),

  // Mock error response
  mockErrorResponse: (message: string, status = 500) => ({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(JSON.stringify({ error: message })),
    headers: new Headers({ 'content-type': 'application/json' })
  }),

  // Wait for async operations
  waitFor: (condition: () => boolean, timeout = 5000): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime >= timeout) {
          reject(new Error(`Condition not met within ${timeout}ms`));
        } else {
          setTimeout(check, 50);
        }
      };
      
      check();
    });
  }
};

// Mock common Web APIs
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }
});

// Mock Web Workers
Object.defineProperty(window, 'Worker', {
  value: class MockWorker {
    constructor(scriptURL: string) {
      this.scriptURL = scriptURL;
    }
    
    scriptURL: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((error: ErrorEvent) => void) | null = null;
    
    postMessage = jest.fn();
    terminate = jest.fn();
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
    dispatchEvent = jest.fn();
  }
});

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      update: jest.fn(),
      unregister: jest.fn(() => Promise.resolve(true))
    })),
    getRegistration: jest.fn(() => Promise.resolve(undefined)),
    getRegistrations: jest.fn(() => Promise.resolve([])),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      update: jest.fn(),
      unregister: jest.fn(() => Promise.resolve(true))
    }),
    controller: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
});

// Mock Push API
Object.defineProperty(navigator, 'permissions', {
  value: {
    query: jest.fn(() => Promise.resolve({ state: 'granted' }))
  }
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: class MockNotification {
    constructor(title: string, options?: NotificationOptions) {
      this.title = title;
      Object.assign(this, options);
    }
    
    title: string;
    body?: string;
    icon?: string;
    tag?: string;
    static permission: NotificationPermission = 'granted';
    static requestPermission = jest.fn(() => Promise.resolve('granted' as NotificationPermission));
    
    onclick: ((event: Event) => void) | null = null;
    onshow: ((event: Event) => void) | null = null;
    onerror: ((error: Event) => void) | null = null;
    onclose: ((event: Event) => void) | null = null;
    
    close = jest.fn();
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
    dispatchEvent = jest.fn();
  }
});

// Mock WebSocket
Object.defineProperty(window, 'WebSocket', {
  value: class MockWebSocket {
    constructor(url: string, protocols?: string | string[]) {
      this.url = url;
      this.protocols = protocols;
      setTimeout(() => {
        if (this.onopen) this.onopen(new Event('open'));
      }, 10);
    }
    
    url: string;
    protocols?: string | string[];
    readyState: number = WebSocket.CONNECTING;
    
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((error: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    
    send = jest.fn();
    close = jest.fn(() => {
      this.readyState = WebSocket.CLOSED;
      if (this.onclose) this.onclose(new CloseEvent('close'));
    });
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
    dispatchEvent = jest.fn();
  }
});

// Mock Speech Recognition for crisis detection
Object.defineProperty(window, 'SpeechRecognition', {
  value: class MockSpeechRecognition {
    continuous = false;
    interimResults = false;
    lang = 'en-US';
    
    onstart: ((event: Event) => void) | null = null;
    onend: ((event: Event) => void) | null = null;
    onerror: ((error: Event) => void) | null = null;
    onresult: ((event: any) => void) | null = null;
    
    start = jest.fn(() => {
      if (this.onstart) this.onstart(new Event('start'));
      setTimeout(() => {
        if (this.onresult) {
          this.onresult({
            results: [{
              0: { transcript: 'mock speech recognition result' }
            }]
          });
        }
        if (this.onend) this.onend(new Event('end'));
      }, 100);
    });
    
    stop = jest.fn(() => {
      if (this.onend) this.onend(new Event('end'));
    });
    
    abort = jest.fn(() => {
      if (this.onend) this.onend(new Event('end'));
    });
  }
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: (window as any).SpeechRecognition
});

// Mock Canvas API for charts and visualizations
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: (contextType: string) => {
    if (contextType === '2d') {
      return {
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({ data: [] })),
        putImageData: jest.fn(),
        createImageData: jest.fn(() => ({ data: [] })),
        setTransform: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        translate: jest.fn(),
        clip: jest.fn(),
        measureText: jest.fn(() => ({ width: 100 })),
        isPointInPath: jest.fn(() => true),
        canvas: {
          width: 800,
          height: 600
        }
      };
    }
    return null;
  }
});

// Mental health platform specific mocks
global.mentalHealthTestMocks = {
  crisisDetection: {
    analyzeCrisisRisk: jest.fn(() => Promise.resolve({
      riskLevel: 'low',
      confidence: 0.3,
      triggers: [],
      recommendations: ['monitor']
    })),
    
    triggerCrisisAlert: jest.fn(),
    
    getCrisisResources: jest.fn(() => [
      { name: 'Crisis Hotline', number: '988', available: '24/7' },
      { name: 'Emergency Services', number: '911', available: '24/7' }
    ])
  },
  
  moodTracking: {
    saveMoodEntry: jest.fn(() => Promise.resolve({
      id: 'mood-123',
      mood: 'good',
      timestamp: new Date().toISOString()
    })),
    
    getMoodHistory: jest.fn(() => Promise.resolve([])),
    
    analyzeMoodTrends: jest.fn(() => Promise.resolve({
      trend: 'stable',
      averageMood: 7,
      riskFactors: []
    }))
  },
  
  therapySession: {
    scheduleSession: jest.fn(() => Promise.resolve({
      id: 'session-123',
      therapistId: 'therapist-456',
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })),
    
    joinSession: jest.fn(() => Promise.resolve({
      sessionUrl: 'https://therapy.example.com/session/123',
      accessToken: 'session-token-123'
    }))
  },
  
  safetyPlan: {
    createSafetyPlan: jest.fn(() => Promise.resolve({
      id: 'plan-123',
      warningSignals: ['Feeling hopeless'],
      copingStrategies: ['Call friend', 'Deep breathing'],
      emergencyContacts: [{ name: 'Crisis Line', phone: '988' }]
    })),
    
    getSafetyPlan: jest.fn(() => Promise.resolve(null)),
    
    updateSafetyPlan: jest.fn()
  }
};

// Mock screen reader utility
const mockScreenReader = {
  announcements: [] as string[],
  clear: function() {
    this.announcements = [];
  },
  announce: function(text: string) {
    this.announcements.push(text);
  },
  getLastAnnouncement: function() {
    return this.announcements[this.announcements.length - 1];
  }
};

// Set up screen reader mock
beforeEach(() => {
  mockScreenReader.clear();
});

// Test environment detection
export const isTestEnvironment = () => {
  return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
};

// Accessibility testing helpers
global.a11yTestHelpers = {
  expectToBeAccessible: (element: HTMLElement) => {
    // Basic accessibility checks
    if (element.tagName === 'BUTTON' && !element.hasAttribute('type')) {
      throw new Error('Button element should have a type attribute');
    }
    
    if (element.tagName === 'INPUT' && !element.hasAttribute('aria-label') && !element.closest('label')) {
      throw new Error('Input element should have aria-label or be wrapped in label');
    }
    
    if (element.getAttribute('role') === 'button' && !element.hasAttribute('aria-label')) {
      throw new Error('Element with button role should have aria-label');
    }
  },
  
  expectToHaveScreenReaderText: (text: string) => {
    const lastAnnouncement = mockScreenReader.getLastAnnouncement();
    expect(lastAnnouncement).toBe(text);
  }
};

export default {};

