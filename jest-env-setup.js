// Environment setup for Jest tests
process.env.NODE_ENV = 'test';

// Mock environment variables for testing
process.env.NETLIFY_SITE_URL = 'https://test-astralcore.netlify.app';
process.env.NETLIFY_DEV = 'false';

// Don't skip auto cleanup - let RTL manage containers properly
// process.env.RTL_SKIP_AUTO_CLEANUP = 'true';

// Mock Service Worker globals for service worker tests
global.caches = {
  open: jest.fn(() => Promise.resolve({
    match: jest.fn(),
    matchAll: jest.fn(),
    add: jest.fn(),
    addAll: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    keys: jest.fn()
  })),
  match: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn()
};

// Mock navigator.serviceWorker
if (!global.navigator) {
  global.navigator = {};
}

global.navigator.serviceWorker = {
  register: jest.fn(() => Promise.resolve({
    installing: null,
    waiting: null,
    active: {
      state: 'activated',
      postMessage: jest.fn()
    },
    scope: '/',
    updateViaCache: 'imports',
    update: jest.fn(() => Promise.resolve()),
    unregister: jest.fn(() => Promise.resolve(true)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  ready: Promise.resolve({
    installing: null,
    waiting: null,
    active: {
      state: 'activated',
      postMessage: jest.fn()
    },
    scope: '/',
    updateViaCache: 'imports',
    update: jest.fn(() => Promise.resolve()),
    unregister: jest.fn(() => Promise.resolve(true)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }),
  controller: {
    state: 'activated',
    postMessage: jest.fn()
  },
  getRegistration: jest.fn(() => Promise.resolve({
    installing: null,
    waiting: null,
    active: {
      state: 'activated',
      postMessage: jest.fn()
    },
    scope: '/',
    updateViaCache: 'imports',
    update: jest.fn(() => Promise.resolve()),
    unregister: jest.fn(() => Promise.resolve(true)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  getRegistrations: jest.fn(() => Promise.resolve([])),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  startMessages: jest.fn()
};

// Mock navigator.onLine for offline tests
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock performance API
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => [])
  };
}
