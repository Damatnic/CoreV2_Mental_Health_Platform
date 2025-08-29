import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock providers
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { OfflineProvider } from '../contexts/OfflineContext';
import { CrisisProvider } from '../contexts/CrisisContext';

// Types
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
  user?: any;
  theme?: 'light' | 'dark';
  isOffline?: boolean;
  crisisMode?: boolean;
}

export interface MockUser {
  id: string;
  email: string;
  name?: string;
  isAnonymous?: boolean;
  preferences?: Record<string, any>;
}

// Default mock user
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  isAnonymous: false,
  preferences: {
    theme: 'light',
    notifications: true,
    language: 'en',
    ...overrides.preferences
  },
  ...overrides
});

// Mock auth context value
export const createMockAuthContext = (user: MockUser | null = null) => ({
  user,
  isAuthenticated: !!user,
  isLoading: false,
  login: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn().mockResolvedValue(undefined),
  register: jest.fn().mockResolvedValue(undefined),
  updateProfile: jest.fn().mockResolvedValue(undefined),
  resetPassword: jest.fn().mockResolvedValue(undefined),
  refreshToken: jest.fn().mockResolvedValue(undefined)
});

// Mock theme context value
export const createMockThemeContext = (theme: 'light' | 'dark' = 'light') => ({
  theme,
  setTheme: jest.fn(),
  toggleTheme: jest.fn(),
  systemPreference: 'light' as const,
  isSystemTheme: false
});

// Mock offline context value
export const createMockOfflineContext = (isOffline: boolean = false) => ({
  isOffline,
  isOnline: !isOffline,
  networkStatus: isOffline ? 'offline' : 'online' as const,
  lastOnline: new Date(),
  connectivity: 'high' as const
});

// Mock crisis context value
export const createMockCrisisContext = (crisisMode: boolean = false) => ({
  isCrisisMode: crisisMode,
  crisisLevel: 0,
  emergencyContacts: [],
  safetyPlan: null,
  activateCrisisMode: jest.fn(),
  deactivateCrisisMode: jest.fn(),
  updateCrisisLevel: jest.fn(),
  addEmergencyContact: jest.fn(),
  removeEmergencyContact: jest.fn()
});

// All Providers Wrapper
const AllProvidersWrapper: React.FC<{
  children: React.ReactNode;
  options: CustomRenderOptions;
}> = ({ children, options }) => {
  const {
    initialEntries = ['/'],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    }),
    user = null,
    theme = 'light',
    isOffline = false,
    crisisMode = false
  } = options;

  // Mock context values
  const authContextValue = createMockAuthContext(user);
  const themeContextValue = createMockThemeContext(theme);
  const offlineContextValue = createMockOfflineContext(isOffline);
  const crisisContextValue = createMockCrisisContext(crisisMode);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider {...authContextValue}>
          <ThemeProvider {...themeContextValue}>
            <OfflineProvider value={offlineContextValue}>
              <CrisisProvider value={crisisContextValue}>
                {children}
              </CrisisProvider>
            </OfflineProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Custom render function
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProvidersWrapper options={options}>
      {children}
    </AllProvidersWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Specialized render functions
export const renderWithAuth = (
  ui: ReactElement,
  user: MockUser = createMockUser(),
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, { ...options, user });
};

export const renderWithoutAuth = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, { ...options, user: null });
};

export const renderWithCrisis = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, { ...options, crisisMode: true });
};

export const renderOffline = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  return renderWithProviders(ui, { ...options, isOffline: true });
};

// Test utilities
export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    const spinner = screen.queryByTestId('loading-spinner');
    expect(spinner).toBeNull();
  }, { timeout: 3000 });
};

export const waitForElementToBeRemoved = async (element: HTMLElement) => {
  await waitFor(() => {
    expect(document.body.contains(element)).toBe(false);
  }, { timeout: 3000 });
};

// Form helpers
export const fillForm = async (formData: Record<string, string>) => {
  for (const [field, value] of Object.entries(formData)) {
    const input = screen.getByLabelText(new RegExp(field, 'i'));
    await act(async () => {
      fireEvent.change(input, { target: { value } });
    });
  }
};

export const submitForm = async (buttonText: string = 'Submit') => {
  const submitButton = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
  await act(async () => {
    fireEvent.click(submitButton);
  });
};

// Navigation helpers
export const navigateTo = async (path: string) => {
  await act(async () => {
    window.history.pushState({}, 'Test page', path);
  });
};

// Error boundary testing
export const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock API responses
export const createMockApiResponse = <T,>(data: T, delay: number = 0): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const createMockApiError = (message: string = 'API Error', delay: number = 0): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
};

// Local storage helpers
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};

// Session storage helpers
export const mockSessionStorage = () => {
  return mockLocalStorage(); // Same interface
};

// Accessibility helpers
export const checkA11y = async (container: HTMLElement) => {
  // Check for common accessibility issues
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    expect(img).toHaveAttribute('alt');
  });

  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    expect(button).toHaveAccessibleName();
  });

  const inputs = container.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    expect(input).toHaveAccessibleName();
  });
};

// Animation helpers
export const advanceTimersByTime = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

// Cleanup helpers
export const cleanupTest = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  localStorage.clear();
  sessionStorage.clear();
};

// Custom matchers
expect.extend({
  toHaveAccessibleName(received: HTMLElement) {
    const hasAriaLabel = received.hasAttribute('aria-label');
    const hasAriaLabelledby = received.hasAttribute('aria-labelledby');
    const hasTitle = received.hasAttribute('title');
    const hasTextContent = received.textContent && received.textContent.trim().length > 0;
    
    const hasAccessibleName = hasAriaLabel || hasAriaLabelledby || hasTitle || hasTextContent;
    
    return {
      message: () => 
        hasAccessibleName
          ? `Expected element not to have accessible name`
          : `Expected element to have accessible name (aria-label, aria-labelledby, title, or text content)`,
      pass: Boolean(hasAccessibleName)
    };
  }
});

// Export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Re-export with custom render as default
export { renderWithProviders as render };
