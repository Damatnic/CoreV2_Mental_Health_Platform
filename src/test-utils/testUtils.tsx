/**
 * Test Utils - Extended Testing Utilities
 *
 * Extended testing utilities for React components with full provider support
 * for the mental health platform. Provides comprehensive testing environment
 * with all necessary providers and contexts.
 * 
 * @fileoverview Extended React Testing Library utilities with full provider support
 * @version 2.0.0
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, renderHook as renderHookBase, RenderHookOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nextProvider } from 'react-i18next';
// Mock i18n instance for testing
const mockI18n = {
  t: (key: string) => key,
  init: jest.fn(),
  loadResources: jest.fn(),
  use: jest.fn(),
  changeLanguage: jest.fn(),
  language: 'en',
  languages: ['en', 'es'],
  exists: jest.fn(() => true),
  getFixedT: jest.fn(() => (key: string) => key),
  hasResourceBundle: jest.fn(() => true),
  getResourceBundle: jest.fn(() => ({})),
  addResourceBundle: jest.fn(),
  removeResourceBundle: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  store: {
    on: jest.fn(),
    off: jest.fn()
  },
  services: {
    resourceStore: {
      on: jest.fn(),
      off: jest.fn()
    }
  },
  isInitialized: true,
  options: {},
  modules: {},
  format: jest.fn((value) => value),
  cloneInstance: jest.fn(),
  createInstance: jest.fn()
} as any;
import { ThemeProvider } from '../components/ThemeProvider';

/**
 * Props for the AllTheProviders component
 */
interface AllTheProvidersProps {
  children: React.ReactNode;
}

/**
 * All providers wrapper for comprehensive testing
 */
const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <I18nextProvider i18n={mockI18n}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </I18nextProvider>
    </BrowserRouter>
  );
};

/**
 * Custom render function with all providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

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

  return renderHookBase(hook, {
    wrapper: AllTheProviders,
    ...options
  });
};

/**
 * Create a minimal test wrapper without full providers
 */
const MinimalWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-testid="minimal-wrapper">{children}</div>;
};

/**
 * Custom render with minimal wrapper
 */
const renderMinimal = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: MinimalWrapper, ...options });

/**
 * Router-only wrapper for testing routing components
 */
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

/**
 * Custom render with router only
 */
const renderWithRouter = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: RouterWrapper, ...options });

/**
 * Auth-only wrapper for testing auth components
 */
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

/**
 * Custom render with auth provider only
 */
const renderWithAuth = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AuthWrapper, ...options });

/**
 * Theme-only wrapper for testing theme components
 */
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

/**
 * Custom render with theme provider only
 */
const renderWithTheme = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: ThemeWrapper, ...options });

/**
 * I18n-only wrapper for testing internationalization
 */
const I18nWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <I18nextProvider i18n={mockI18n}>{children}</I18nextProvider>;
};

/**
 * Custom render with i18n provider only
 */
const renderWithI18n = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: I18nWrapper, ...options });

/**
 * Wait for async operations to complete
 */
const waitForAsync = (timeout = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

/**
 * Wait for element to be removed from DOM
 */
const waitForElementToBeRemoved = async (
  element: Element,
  timeout = 5000
): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      if (!document.contains(element)) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        resolve(false);
      } else {
        setTimeout(checkElement, 100);
      }
    };
    
    checkElement();
  });
};

/**
 * Simulate keyboard navigation
 */
const simulateKeyboardNavigation = (element: Element, key: string) => {
  const keyboardEvent = new KeyboardEvent('keydown', {
    key,
    code: key,
    keyCode: key.charCodeAt(0),
    which: key.charCodeAt(0),
    bubbles: true
  });
  
  element.dispatchEvent(keyboardEvent);
};

/**
 * Simulate focus events
 */
const simulateFocus = (element: Element) => {
  const focusEvent = new FocusEvent('focus', { bubbles: true });
  element.dispatchEvent(focusEvent);
  
  if (element instanceof HTMLElement) {
    element.focus();
  }
};

/**
 * Simulate blur events
 */
const simulateBlur = (element: Element) => {
  const blurEvent = new FocusEvent('blur', { bubbles: true });
  element.dispatchEvent(blurEvent);
  
  if (element instanceof HTMLElement) {
    element.blur();
  }
};

/**
 * Get all focusable elements within a container
 */
const getFocusableElements = (container: Element): Element[] => {
  const focusableSelectors = [
    'button',
    'input',
    'select',
    'textarea',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors));
};

/**
 * Test accessibility of an element
 */
const testAccessibility = (element: Element): {
  hasRole: boolean;
  hasLabel: boolean;
  isFocusable: boolean;
  hasValidTabIndex: boolean;
} => {
  const hasRole = element.hasAttribute('role');
  const hasLabel = element.hasAttribute('aria-label') || 
                   element.hasAttribute('aria-labelledby') ||
                   !!element.textContent?.trim();
  
  const focusableElements = ['button', 'input', 'select', 'textarea', 'a'];
  const tagName = element.tagName.toLowerCase();
  const isFocusable = focusableElements.includes(tagName) || 
                     element.hasAttribute('tabindex');
  
  const tabIndex = element.getAttribute('tabindex');
  const hasValidTabIndex = !tabIndex || 
                          tabIndex === '0' || 
                          parseInt(tabIndex) >= 0;
  
  return {
    hasRole,
    hasLabel,
    isFocusable,
    hasValidTabIndex
  };
};

/**
 * Mock component for testing
 */
const MockComponent: React.FC<{ testId?: string; children?: React.ReactNode }> = ({ 
  testId = 'mock-component', 
  children 
}) => {
  return <div data-testid={testId}>{children}</div>;
};

/**
 * Mock hook for testing
 */
const useMockHook = (initialValue: any = null) => {
  const [value, setValue] = React.useState(initialValue);
  
  return {
    value,
    setValue,
    reset: () => setValue(initialValue)
  };
};

/**
 * Create mock props for components
 */
const createMockProps = <T extends Record<string, any>>(
  overrides: Partial<T> = {}
): T => {
  const defaultProps = {
    id: 'test-id',
    className: 'test-class',
    onClick: jest.fn(),
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    'data-testid': 'test-component'
  };
  
  return { ...defaultProps, ...overrides } as T;
};

/**
 * Create mock context values
 */
export const mockContextValues = {
  auth: {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'Starkeeper'
    },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  },
  
  theme: {
    theme: 'light' as const,
    toggleTheme: jest.fn(),
    setTheme: jest.fn()
  },
  
  notification: {
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    clearNotifications: jest.fn()
  }
};

/**
 * Test data factories
 */
export const testDataFactories = {
  createUser: (overrides: any = {}) => ({
    id: 'user-123',
    email: 'user@test.com',
    name: 'Test User',
    role: 'Starkeeper',
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  createAssessment: (overrides: any = {}) => ({
    id: 'assessment-123',
    type: 'phq-9',
    score: 5,
    answers: [1, 1, 1, 1, 1, 0, 0, 0, 0],
    completedAt: new Date().toISOString(),
    interpretation: 'Mild symptoms',
    severity: 'mild',
    recommendations: ['Exercise regularly', 'Get adequate sleep'],
    ...overrides
  }),
  
  createChatMessage: (overrides: any = {}) => ({
    id: 'message-123',
    chatId: 'chat-123',
    senderId: 'user-123',
    content: 'Test message',
    type: 'text',
    timestamp: Date.now(),
    status: 'sent',
    ...overrides
  }),
  
  createDilemma: (overrides: any = {}) => ({
    id: 'dilemma-123',
    title: 'Test Dilemma',
    description: 'Test description',
    category: 'general',
    priority: 'medium',
    status: 'active',
    createdAt: new Date().toISOString(),
    ...overrides
  })
};

/**
 * Performance testing utilities
 */
export const performanceUtils = {
  measureRenderTime: async (renderFn: () => void): Promise<number> => {
    const start = performance.now();
    renderFn();
    await waitForAsync(0); // Wait for next tick
    const end = performance.now();
    return end - start;
  },
  
  measureHookTime: async (hookFn: () => any): Promise<number> => {
    const start = performance.now();
    hookFn();
    await waitForAsync(0);
    const end = performance.now();
    return end - start;
  }
};

/**
 * Exported utilities
 */
export {
  // Main render functions
  customRender as render,
  customRenderHook as renderHook,
  
  // Specialized render functions
  renderMinimal,
  renderWithRouter,
  renderWithAuth,
  renderWithTheme,
  renderWithI18n,
  
  // Wrappers
  AllTheProviders,
  MinimalWrapper,
  RouterWrapper,
  AuthWrapper,
  ThemeWrapper,
  I18nWrapper,
  
  // Utilities
  waitForAsync,
  waitForElementToBeRemoved,
  simulateKeyboardNavigation,
  simulateFocus,
  simulateBlur,
  getFocusableElements,
  testAccessibility,
  
  // Mock utilities
  MockComponent,
  useMockHook,
  createMockProps
};

/**
 * Default export
 */
export default {
  render: customRender,
  renderHook: customRenderHook,
  renderMinimal,
  renderWithRouter,
  renderWithAuth,
  renderWithTheme,
  renderWithI18n,
  AllTheProviders,
  mockContextValues,
  testDataFactories,
  performanceUtils
};
