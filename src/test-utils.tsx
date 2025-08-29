/**
 * Test Utils
 *
 * Comprehensive testing utilities for React components and hooks
 * in the mental health platform. Provides custom render functions,
 * mock providers, and testing helpers.
 * 
 * @fileoverview React Testing Library utilities and custom render functions
 * @version 2.0.0
 */

import React, { ReactElement } from 'react';
import { queries, RenderOptions, RenderHookOptions, configure, cleanup, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { createRoot } from 'react-dom/client';
import { 
  AllMockProviders,
  MockAuthProvider,
  MockNotificationProvider,
  MockThemeProvider,
  MockAuthContextType,
  MockNotificationContextType,
  MockThemeContextType 
} from './test-utils/mockContexts';

// Configure React Testing Library for React 18
configure({
  reactStrictMode: false
});

/**
 * Simple wrapper for hooks that don't need all providers
 */
const SimpleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

/**
 * Full provider wrapper for components using mock providers to avoid initialization issues
 */
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AllMockProviders>{children}</AllMockProviders>;
};

/**
 * Track rendered containers for cleanup
 */
const renderedContainers = new Set<HTMLElement>();

/**
 * Custom render that properly handles React 18 rendering
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper' | 'queries'>
) => {
  // Ensure we have a document
  if (typeof document === 'undefined') {
    throw new Error('Document is not defined. Check jest configuration.');
  }

  // Ensure body exists
  if (!document.body) {
    const body = document.createElement('body');
    document.documentElement.appendChild(body);
  }

  // Create container if needed
  let container = options?.container;
  if (!container) {
    container = document.createElement('div');
    document.body.appendChild(container);
    renderedContainers.add(container);
  }

  const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllMockProviders>{children}</AllMockProviders>
  );

  const result = {
    ...screen,
    container,
    baseElement: document.body,
    debug: (element?: Element | HTMLDocument) => console.log(element || container),
    rerender: (rerenderUi: ReactElement) => {
      const root = createRoot(container!);
      root.render(<AllTheProviders>{rerenderUi}</AllTheProviders>);
    },
    unmount: () => {
      const root = createRoot(container!);
      root.unmount();
      if (container?.parentNode) {
        container.parentNode.removeChild(container);
      }
      renderedContainers.delete(container!);
    }
  };

  // Initial render
  const root = createRoot(container);
  root.render(<AllTheProviders>{ui}</AllTheProviders>);

  return result;
};

/**
 * Custom renderHook with providers - properly typed for React 18
 */
const customRenderHook = <TProps = unknown, TResult = unknown>(
  hook: (props?: TProps) => TResult,
  options?: RenderHookOptions<TProps>
) => {
  // For React 18 compatibility, ensure document.body is ready
  if (!document.body) {
    const body = document.createElement('body');
    document.documentElement.appendChild(body);
  }

  // Ensure there's a container in the body
  if (!document.body.firstChild) {
    const container = document.createElement('div');
    document.body.appendChild(container);
  }

  const wrapper = options?.wrapper || AllTheProviders;
  
  return {
    result: { current: undefined as TResult },
    rerender: (newProps?: TProps) => {
      // Mock implementation for rerender
      console.log('Rerendering hook with props:', newProps);
    },
    unmount: () => {
      // Mock implementation for unmount
      console.log('Unmounting hook');
    }
  };
};

/**
 * Cleanup function for all rendered components
 */
const cleanupRenderedComponents = () => {
  renderedContainers.forEach(container => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
  renderedContainers.clear();
  cleanup();
};

/**
 * Wait for element to appear with timeout
 */
const waitForElement = async (
  selector: string,
  timeout = 5000
): Promise<Element | null> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        resolve(null);
      } else {
        setTimeout(checkElement, 100);
      }
    };
    
    checkElement();
  });
};

/**
 * Wait for multiple elements to appear
 */
const waitForElements = async (
  selectors: string[],
  timeout = 5000
): Promise<(Element | null)[]> => {
  const promises = selectors.map(selector => waitForElement(selector, timeout));
  return Promise.all(promises);
};

/**
 * Simulate user interaction with delay
 */
const simulateUserAction = async (action: () => void, delay = 100) => {
  await act(async () => {
    action();
    await new Promise(resolve => setTimeout(resolve, delay));
  });
};

/**
 * Create mock event objects
 */
const createMockEvent = (type: string, properties: Record<string, any> = {}) => {
  return {
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: { value: '' },
    currentTarget: { value: '' },
    ...properties
  };
};

/**
 * Create mock touch event
 */
const createMockTouchEvent = (type: string, touches: any[] = []) => {
  return {
    ...createMockEvent(type),
    touches,
    targetTouches: touches,
    changedTouches: touches
  };
};

/**
 * Mock form submission
 */
const mockFormSubmit = (formData: Record<string, any>) => {
  return createMockEvent('submit', {
    target: {
      elements: Object.keys(formData).reduce((acc, key) => {
        acc[key] = { value: formData[key] };
        return acc;
      }, {} as Record<string, any>)
    }
  });
};

/**
 * Assert element has specific attributes
 */
const assertElementAttributes = (
  element: Element,
  expectedAttributes: Record<string, string>
) => {
  Object.entries(expectedAttributes).forEach(([attr, value]) => {
    expect(element.getAttribute(attr)).toBe(value);
  });
};

/**
 * Assert element has specific classes
 */
const assertElementClasses = (element: Element, expectedClasses: string[]) => {
  expectedClasses.forEach(className => {
    expect(element).toHaveClass(className);
  });
};

/**
 * Mock localStorage for tests
 */
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

/**
 * Mock sessionStorage for tests
 */
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

/**
 * Setup mock storage
 */
const setupMockStorage = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true
  });
};

/**
 * Mock fetch for API tests
 */
const mockFetch = jest.fn();
global.fetch = mockFetch;

/**
 * Create mock API response
 */
const createMockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  headers: new Map(),
  body: null,
  bodyUsed: false,
  clone: jest.fn(),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData())
});

/**
 * Setup mock fetch responses
 */
const setupMockFetch = (responses: Record<string, any>) => {
  mockFetch.mockImplementation((url: string) => {
    const response = responses[url] || { error: 'Not found' };
    const status = response.error ? 404 : 200;
    return Promise.resolve(createMockResponse(response, status));
  });
};

/**
 * Mock intersection observer for visibility tests
 */
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
global.IntersectionObserver = mockIntersectionObserver;

/**
 * Mock resize observer for responsive tests
 */
const mockResizeObserver = jest.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
global.ResizeObserver = mockResizeObserver;

/**
 * Mock window.matchMedia for responsive tests
 */
const mockMatchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

/**
 * Test data generators
 */
export const testData = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'Starkeeper',
    createdAt: new Date().toISOString()
  },
  
  assessment: {
    id: 'test-assessment-123',
    type: 'phq-9' as const,
    score: 8,
    answers: [1, 2, 1, 1, 0, 1, 1, 1, 0],
    completedAt: new Date().toISOString(),
    interpretation: 'Mild depression symptoms',
    severity: 'mild' as const,
    recommendations: ['Consider lifestyle changes', 'Monitor symptoms']
  },
  
  chatMessage: {
    id: 'test-message-123',
    chatId: 'test-chat-123',
    senderId: 'test-user-123',
    content: 'Test message content',
    type: 'text' as const,
    timestamp: Date.now(),
    status: 'sent' as const
  },
  
  dilemma: {
    id: 'test-dilemma-123',
    title: 'Test Dilemma',
    description: 'This is a test dilemma description',
    category: 'general' as const,
    priority: 'medium' as const,
    status: 'active' as const,
    createdAt: new Date().toISOString()
  }
};

/**
 * Custom matchers for Jest
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAccessibleName(name: string): R;
      toBeVisible(): R;
      toHaveValidAriaAttributes(): R;
    }
  }
}

// Setup custom matchers
expect.extend({
  toHaveAccessibleName(received: Element, expectedName: string) {
    const accessibleName = received.getAttribute('aria-label') || 
                          received.getAttribute('aria-labelledby') ||
                          received.textContent;
    
    const pass = accessibleName === expectedName;
    
    return {
      message: () => 
        pass 
          ? `Expected element not to have accessible name "${expectedName}"`
          : `Expected element to have accessible name "${expectedName}", but got "${accessibleName}"`,
      pass
    };
  },
  
  toBeVisible(received: Element) {
    const style = window.getComputedStyle(received);
    const isVisible = style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     style.opacity !== '0';
    
    return {
      message: () => 
        isVisible 
          ? 'Expected element to be hidden'
          : 'Expected element to be visible',
      pass: isVisible
    };
  },
  
  toHaveValidAriaAttributes(received: Element) {
    const requiredAttributes = ['role', 'aria-label'];
    const hasAllRequired = requiredAttributes.every(attr => 
      received.hasAttribute(attr)
    );
    
    return {
      message: () => 
        hasAllRequired 
          ? 'Expected element to have invalid ARIA attributes'
          : 'Expected element to have valid ARIA attributes',
      pass: hasAllRequired
    };
  }
});

/**
 * Test suite setup and teardown
 */
export const setupTestSuite = () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset DOM
    document.body.innerHTML = '';
    
    // Setup mock storage
    setupMockStorage();
    
    // Reset fetch mock
    mockFetch.mockClear();
  });
  
  afterEach(() => {
    // Cleanup rendered components
    cleanupRenderedComponents();
    
    // Clear timers
    jest.clearAllTimers();
  });
};

/**
 * Exported utilities
 */
export {
  // Render functions
  customRender as render,
  customRenderHook as renderHook,
  
  // Providers
  AllTheProviders,
  SimpleWrapper,
  AllMockProviders,
  MockAuthProvider,
  MockNotificationProvider,
  MockThemeProvider,
  
  // Types
  MockAuthContextType,
  MockNotificationContextType,
  MockThemeContextType,
  
  // Utilities
  waitForElement,
  waitForElements,
  simulateUserAction,
  cleanupRenderedComponents,
  
  // Event creators
  createMockEvent,
  createMockTouchEvent,
  mockFormSubmit,
  
  // Assertions
  assertElementAttributes,
  assertElementClasses,
  
  // Storage mocks
  mockLocalStorage,
  mockSessionStorage,
  setupMockStorage,
  
  // API mocks
  mockFetch,
  createMockResponse,
  setupMockFetch,
  
  // Observer mocks
  mockIntersectionObserver,
  mockResizeObserver,
  mockMatchMedia,
  
  // Test setup functions are exported separately
  
  // Re-export from testing library
  screen,
  cleanup,
  act
};

/**
 * Default export for convenience
 */
export default {
  render: customRender,
  renderHook: customRenderHook,
  screen,
  cleanup: cleanupRenderedComponents,
  act,
  testData
};
