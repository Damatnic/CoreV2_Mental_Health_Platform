import '@testing-library/jest-dom';

// Note: DOM element mocking is now handled in jest-env-setup.js to avoid conflicts

// Extend Jest matchers with @testing-library/jest-dom
declare global {
  namespace jest {
    interface Matchers<R, T = {}> {
      toBeInTheDocument(): R;
      toHaveValue(value: string | string[] | number): R;
      toBeVisible(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeEmptyDOMElement(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeInvalid(): R;
      toHaveFocus(): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toBeOneOf(array: any[]): R;
    }
  }
}

// Add custom Jest matchers
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

// Mock crypto.randomUUID for Jest environment
if (!global.crypto) {
  global.crypto = {} as any;
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => {
    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return uuid as `${string}-${string}-${string}-${string}-${string}`;
  };
}

// Mock import.meta for Vite compatibility in tests
(global as any).importMeta = {
  env: {
    DEV: false,
    PROD: true,
    MODE: 'test',
    VITE_OTEL_ENABLED: 'false',
    VITE_USE_NEW_STORE: 'false',
    VITE_FEATURE_NEW_CRISIS_DETECTION: 'false',
    VITE_ROLLOUT_PERCENTAGE: '0',
    VITE_APP_VERSION: '1.0.0',
    VITE_OTEL_ENDPOINT: '',
    VITE_OTEL_API_KEY: '',
    VITE_GEMINI_API_KEY: ''
  },
  hot: {
    accept: jest.fn()
  }
};

// Mock import.meta global property
Object.defineProperty(global, 'import', {
  value: {
    meta: (global as any).importMeta
  },
  writable: true,
  configurable: true
});

// Mock scrollIntoView for JSDOM
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

// Mock Canvas API for chart and image tests
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
    if (contextType === '2d') {
      return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        lineCap: 'butt',
        lineJoin: 'miter',
        font: '10px sans-serif',
        textAlign: 'start',
        textBaseline: 'alphabetic',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        canvas: {
          width: 300,
          height: 150
        },
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        fillText: jest.fn(),
        strokeText: jest.fn(),
        measureText: jest.fn(() => ({ width: 0 })),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        bezierCurveTo: jest.fn(),
        quadraticCurveTo: jest.fn(),
        arc: jest.fn(),
        arcTo: jest.fn(),
        rect: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        clip: jest.fn(),
        isPointInPath: jest.fn(() => false),
        isPointInStroke: jest.fn(() => false),
        save: jest.fn(),
        restore: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        translate: jest.fn(),
        transform: jest.fn(),
        setTransform: jest.fn(),
        resetTransform: jest.fn(),
        createLinearGradient: jest.fn(() => ({
          addColorStop: jest.fn()
        })),
        createRadialGradient: jest.fn(() => ({
          addColorStop: jest.fn()
        })),
        createPattern: jest.fn(() => null),
        createImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(),
          width: 0,
          height: 0
        })),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(),
          width: 0,
          height: 0
        })),
        putImageData: jest.fn(),
        drawImage: jest.fn(),
        getLineDash: jest.fn(() => []),
        setLineDash: jest.fn()
      };
    }
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        viewport: jest.fn(),
        clearColor: jest.fn(),
        clear: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        createShader: jest.fn(),
        shaderSource: jest.fn(),
        compileShader: jest.fn(),
        createProgram: jest.fn(),
        attachShader: jest.fn(),
        linkProgram: jest.fn(),
        useProgram: jest.fn(),
        deleteShader: jest.fn(),
        deleteProgram: jest.fn()
      };
    }
    return null;
  });

  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock');
  HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
    if (callback) {
      callback(new Blob(['mock'], { type: 'image/png' }));
    }
  });
}

// Mock Image for image loading tests
if (typeof Image === 'undefined') {
  (global as any).Image = class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src = '';
    width = 0;
    height = 0;
    complete = false;
    naturalWidth = 0;
    naturalHeight = 0;

    constructor() {
      setTimeout(() => {
        this.width = 100;
        this.height = 100;
        this.naturalWidth = 100;
        this.naturalHeight = 100;
        this.complete = true;
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }
  };
}

// Mock ResizeObserver
if (typeof ResizeObserver === 'undefined') {
  (global as any).ResizeObserver = class MockResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  };
}

// Mock IntersectionObserver
if (typeof IntersectionObserver === 'undefined') {
  (global as any).IntersectionObserver = class MockIntersectionObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
  };
}

// Mock MutationObserver
if (typeof MutationObserver === 'undefined') {
  (global as any).MutationObserver = class MockMutationObserver {
    observe = jest.fn();
    disconnect = jest.fn();
    takeRecords = jest.fn(() => []);
    constructor(callback: MutationCallback) {}
  };
}

// Note: DOM setup is now consolidated in src/setupTests.ts to avoid conflicts

// Mock Web APIs for testing
global.Response = global.Response || class MockResponse {
  public body: any;
  public status: number;
  public statusText: string;
  public headers: Headers;
  public ok: boolean;
  public redirected: boolean;
  public type: ResponseType;
  public url: string;
  public bodyUsed: boolean;

  constructor(body?: any, init?: ResponseInit) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
    this.redirected = false;
    this.type = 'basic';
    this.url = '';
    this.bodyUsed = false;
  }

  async text(): Promise<string> {
    if (typeof this.body === 'string') return this.body;
    if (this.body instanceof ArrayBuffer) return new TextDecoder().decode(this.body);
    return JSON.stringify(this.body);
  }

  async json(): Promise<any> {
    const text = await this.text();
    return JSON.parse(text);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.body instanceof ArrayBuffer) return this.body;
    const text = await this.text();
    return new TextEncoder().encode(text).buffer;
  }

  clone(): Response {
    return new (Response as any)(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers
    });
  }

  // Additional methods required by Response interface
  async blob(): Promise<Blob> {
    return new Blob([await this.arrayBuffer()]);
  }

  async formData(): Promise<FormData> {
    return new FormData();
  }
};

global.Request = global.Request || class MockRequest {
  public method: string;
  public url: string;
  public headers: Headers;
  public body: any;
  public bodyUsed: boolean;
  public cache: RequestCache;
  public credentials: RequestCredentials;
  public destination: RequestDestination;
  public integrity: string;
  public mode: RequestMode;
  public redirect: RequestRedirect;
  public referrer: string;
  public referrerPolicy: ReferrerPolicy;
  public signal: AbortSignal;

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    this.method = init?.method || 'GET';
    this.url = typeof input === 'string' ? input : input.toString();
    this.headers = new Headers(init?.headers);
    this.body = init?.body || null;
    this.bodyUsed = false;
    this.cache = init?.cache || 'default';
    this.credentials = init?.credentials || 'same-origin';
    this.destination = '' as RequestDestination;
    this.integrity = init?.integrity || '';
    this.mode = init?.mode || 'cors';
    this.redirect = init?.redirect || 'follow';
    this.referrer = init?.referrer || '';
    this.referrerPolicy = init?.referrerPolicy || '';
    this.signal = init?.signal || new AbortController().signal;
  }

  clone(): Request {
    return new (Request as any)(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
      cache: this.cache,
      credentials: this.credentials,
      integrity: this.integrity,
      mode: this.mode,
      redirect: this.redirect,
      referrer: this.referrer,
      referrerPolicy: this.referrerPolicy,
      signal: this.signal
    });
  }

  // Additional methods required by Request interface
  async text(): Promise<string> {
    return this.body?.toString() || '';
  }

  async json(): Promise<any> {
    const text = await this.text();
    return JSON.parse(text);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const text = await this.text();
    return new TextEncoder().encode(text).buffer;
  }

  async blob(): Promise<Blob> {
    return new Blob([await this.arrayBuffer()]);
  }

  async formData(): Promise<FormData> {
    return new FormData();
  }
};

global.Headers = global.Headers || class MockHeaders {
  private _headers: Map<string, string> = new Map();

  constructor(init?: HeadersInit) {
    if (init) {
      if (init instanceof Headers) {
        init.forEach((value, key) => this.set(key, value));
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }

  append(name: string, value: string): void {
    const existing = this.get(name);
    this.set(name, existing ? `${existing}, ${value}` : value);
  }

  delete(name: string): void {
    this._headers.delete(name.toLowerCase());
  }

  get(name: string): string | null {
    return this._headers.get(name.toLowerCase()) || null;
  }

  has(name: string): boolean {
    return this._headers.has(name.toLowerCase());
  }

  set(name: string, value: string): void {
    this._headers.set(name.toLowerCase(), value);
  }

  forEach(callback: (value: string, key: string, parent: Headers) => void): void {
    this._headers.forEach((value, key) => callback(value, key, this));
  }

  *entries(): IterableIterator<[string, string]> {
    yield* this._headers.entries();
  }

  *keys(): IterableIterator<string> {
    yield* this._headers.keys();
  }

  *values(): IterableIterator<string> {
    yield* this._headers.values();
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
};

// Mock service worker APIs for testing
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      installing: null,
      waiting: null,
      active: {
        scriptURL: '/sw.js',
        state: 'activated'
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn()
    })),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: {
        scriptURL: '/sw.js',
        state: 'activated'
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn()
    }),
    controller: {
      scriptURL: '/sw.js',
      state: 'activated',
      postMessage: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getRegistration: jest.fn(() => Promise.resolve(null))
  },
  writable: true
});

// Mock Cache API
Object.defineProperty(global, 'caches', {
  value: {
    open: jest.fn(() => Promise.resolve({
      match: jest.fn(() => Promise.resolve(undefined)),
      matchAll: jest.fn(() => Promise.resolve([])),
      add: jest.fn(() => Promise.resolve()),
      addAll: jest.fn(() => Promise.resolve()),
      put: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve(true)),
      keys: jest.fn(() => Promise.resolve([]))
    })),
    match: jest.fn(() => Promise.resolve(undefined)),
    has: jest.fn(() => Promise.resolve(false)),
    delete: jest.fn(() => Promise.resolve(false)),
    keys: jest.fn(() => Promise.resolve([]))
  },
  writable: true
});

// Mock fetch for service worker tests
global.fetch = jest.fn();

// Mock Workbox
jest.mock('workbox-window', () => ({
  Workbox: jest.fn().mockImplementation(() => ({
    register: jest.fn(() => Promise.resolve()),
    addEventListener: jest.fn(),
    messageSW: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    controlling: false,
    waiting: false
  }))
}));

// Setup console mocking for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Mock matchMedia
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

// Mock window.location
delete (window as any).location;
window.location = {
  href: 'http://localhost/',
  origin: 'http://localhost',
  protocol: 'http:',
  host: 'localhost',
  hostname: 'localhost',
  port: '',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  toString: jest.fn(() => 'http://localhost/')
} as any;

// Mock window.open
window.open = jest.fn();

// Mock window.alert, confirm, prompt
window.alert = jest.fn();
window.confirm = jest.fn(() => true);
window.prompt = jest.fn(() => 'mocked prompt');

// Mock requestAnimationFrame
window.requestAnimationFrame = jest.fn(cb => {
  setTimeout(cb, 0);
  return 0;
});
window.cancelAnimationFrame = jest.fn();

// Mock performance API
if (!window.performance) {
  window.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    navigation: {
      type: 0,
      redirectCount: 0
    },
    timing: {} as any
  } as any;
}

// Mock Web Audio API
(window as any).AudioContext = jest.fn(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 440 }
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 1 }
  })),
  destination: {}
}));

// Mock Notification API
(window as any).Notification = {
  permission: 'default',
  requestPermission: jest.fn(() => Promise.resolve('granted'))
};

// Mock navigator APIs
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: jest.fn((success) => {
      success({
        coords: {
          latitude: 0,
          longitude: 0,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      });
    }),
    watchPosition: jest.fn(),
    clearWatch: jest.fn()
  }
});

// Increase default timeout for async tests
jest.setTimeout(10000);
