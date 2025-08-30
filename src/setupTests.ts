/**
 * Test Setup Configuration
 * 
 * Global setup for all tests in the mental health platform
 */

// Import testing library extensions
import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import { configure } from '@testing-library/react';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000
});

// Mock global objects
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.fetch = jest.fn((url, options) => 
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    clone: () => ({})
  } as Response)
);

const localStorageMock = {
  getItem: jest.fn((key) => null),
  setItem: jest.fn((key, value) => {}),
  removeItem: jest.fn((key) => {}),
  clear: jest.fn(() => {}),
  length: 0,
  key: jest.fn((index) => null),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const mockGeolocation = {
  getCurrentPosition: jest.fn((success, error, options) => {
    setTimeout(() => success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    }), 100);
  }),
  watchPosition: jest.fn((success, error, options) => {
    setTimeout(() => success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    }), 100);
    return 1;
  }),
  clearWatch: jest.fn((watchId) => {}),
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn((key) => null),
  setItem: jest.fn((key, value) => {}),
  removeItem: jest.fn((key) => {}),
  clear: jest.fn(() => {}),
  length: 0,
  key: jest.fn((index) => null),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock console methods with proper parameter handling
global.console = {
  ...console,
  log: jest.fn((...args) => {}),
  warn: jest.fn((...args) => {}),
  error: jest.fn((...args) => {}),
  info: jest.fn((...args) => {}),
  debug: jest.fn((...args) => {}),
};

// Mock setTimeout and setInterval with proper parameter types
global.setTimeout = jest.fn((callback, delay, ...args) => {
  return 1 as any;
}) as any;

global.setInterval = jest.fn((callback, delay, ...args) => {
  return 1 as any;
}) as any;

global.clearTimeout = jest.fn((id) => {}) as any;
global.clearInterval = jest.fn((id) => {}) as any;

// Mock URL constructor
global.URL = class URL {
  constructor(public href: string, base?: string) {}
  toString() { return this.href; }
  pathname = '';
  search = '';
  hash = '';
  host = '';
  hostname = '';
  origin = '';
  port = '';
  protocol = '';
} as any;

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => '12345678-1234-1234-1234-123456789abc'),
    getRandomValues: jest.fn((array) => array.map(() => Math.floor(Math.random() * 256))),
  },
  writable: true,
});

// Mock navigator.clipboard
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: jest.fn((text) => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
  writable: true,
});

// Mock navigator.share
Object.defineProperty(global.navigator, 'share', {
  value: jest.fn((data) => Promise.resolve()),
  writable: true,
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});
