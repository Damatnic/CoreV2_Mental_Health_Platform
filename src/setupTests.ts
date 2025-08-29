
/// <reference types="@testing-library/jest-dom" />

/**
 * Test Setup Configuration
 * 
 * Global setup for all tests in the mental health platform
 */

// Import testing library extensions
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Add type declarations for jest-dom matchers
declare global {
  namespace jest {
    interface Matchers<R = void, T = {}> {
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveAttribute(attr: string, value?: any): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeDisabled(): R;
      toBeVisible(): R;
      toHaveValue(value?: string | number): R;
      toHaveStyle(style: Record<string, any>): R;
      toHaveAccessibleName(name?: string | RegExp): R;
      toHaveAccessibleDescription(description?: string | RegExp): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveDisplayValue(value?: string | RegExp | (string | RegExp)[]): R;
      toBeEmptyDOMElement(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveErrorMessage(text?: string | RegExp): R;
    }
  }
}

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000
});

// Mock canvas API (minimal for compatibility)
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn();
}

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

global.fetch = jest.fn((_url, _options) => 
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
  getItem: jest.fn((_key) => null),
  setItem: jest.fn((_key, _value) => {}),
  removeItem: jest.fn((_key) => {}),
  clear: jest.fn(() => {}),
  length: 0,
  key: jest.fn((_index) => null),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const mockGeolocation = {
  getCurrentPosition: jest.fn((success, _error, _options) => {
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
  watchPosition: jest.fn((success, _error, _options) => {
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
  clearWatch: jest.fn((_watchId) => {}),
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn((_key) => null),
  setItem: jest.fn((_key, _value) => {}),
  removeItem: jest.fn((_key) => {}),
  clear: jest.fn(() => {}),
  length: 0,
  key: jest.fn((_index) => null),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock console methods with proper parameter handling
global.console = {
  ...console,
  log: jest.fn((..._args) => {}),
  warn: jest.fn((..._args) => {}),
  error: jest.fn((..._args) => {}),
  info: jest.fn((..._args) => {}),
  debug: jest.fn((..._args) => {}),
};

// Mock setTimeout and setInterval with proper parameter types
global.setTimeout = jest.fn((_callback, _delay, ..._args) => {
  return 1 as any;
}) as any;

global.setInterval = jest.fn((_callback, _delay, ..._args) => {
  return 1 as any;
}) as any;

global.clearTimeout = jest.fn((_id) => {}) as any;
global.clearInterval = jest.fn((_id) => {}) as any;

// Mock URL constructor
global.URL = class URL {
  constructor(public href: string, _base?: string) {}
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
    writeText: jest.fn((_text) => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
  writable: true,
});

// Mock navigator.share
Object.defineProperty(global.navigator, 'share', {
  value: jest.fn((_data) => Promise.resolve()),
  writable: true,
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});
