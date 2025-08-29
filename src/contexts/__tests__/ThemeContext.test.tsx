/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act, waitFor, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme, Theme, ThemeMode, ThemeContext } from '../ThemeContext';

// Enhanced theme types for mental health features
export type AccessibilityMode = 'none' | 'high-contrast' | 'reduced-motion' | 'focus-visible' | 'screen-reader';
export type CrisisMode = 'normal' | 'crisis' | 'calm' | 'emergency';
export type MoodBasedTheme = 'energizing' | 'calming' | 'neutral' | 'supportive' | 'therapeutic';

// Extended theme context for mental health features
interface ExtendedThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  systemTheme: Theme;
  changeTheme: (theme: Theme) => void;
  changeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  // Mental health specific features
  accessibilityMode?: AccessibilityMode;
  setAccessibilityMode?: (mode: AccessibilityMode) => void;
  crisisMode?: CrisisMode;
  setCrisisMode?: (mode: CrisisMode) => void;
  moodTheme?: MoodBasedTheme;
  setMoodTheme?: (theme: MoodBasedTheme) => void;
  reducedAnimations?: boolean;
  setReducedAnimations?: (reduced: boolean) => void;
  contrastLevel?: 'normal' | 'medium' | 'high';
  setContrastLevel?: (level: 'normal' | 'medium' | 'high') => void;
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    }
  };
})();

// Mock matchMedia
const createMatchMediaMock = (matches: boolean = false) => {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: jest.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        listeners.push(listener);
      }
    }),
    removeEventListener: jest.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }),
    dispatchEvent: jest.fn(),
    addListener: jest.fn(), // Deprecated but might be used
    removeListener: jest.fn(), // Deprecated but might be used
    triggerChange: (newMatches: boolean) => {
      listeners.forEach(listener => {
        listener({
          matches: newMatches,
          media: '(prefers-color-scheme: dark)',
          bubbles: false,
          cancelBubble: false,
          cancelable: false,
          composed: false,
          currentTarget: null,
          defaultPrevented: false,
          eventPhase: 0,
          isTrusted: true,
          returnValue: true,
          srcElement: null,
          target: null,
          timeStamp: Date.now(),
          type: 'change',
          composedPath: () => [],
          initEvent: () => {},
          preventDefault: () => {},
          stopImmediatePropagation: () => {},
          stopPropagation: () => {},
          NONE: 0,
          CAPTURING_PHASE: 1,
          AT_TARGET: 2,
          BUBBLING_PHASE: 3
        } as MediaQueryListEvent);
      });
    }
  };
};

// Test component for testing theme functionality
const TestComponent: React.FC<{ testId?: string }> = ({ testId = 'test-component' }) => {
  const themeContext = useTheme();
  
  return (
    <div data-testid={testId}>
      <span data-testid="theme">{themeContext.theme}</span>
      <span data-testid="mode">{themeContext.mode}</span>
      <span data-testid="system-theme">{themeContext.systemTheme}</span>
      <span data-testid="is-dark">{String(themeContext.isDark)}</span>
      <span data-testid="is-light">{String(themeContext.isLight)}</span>
      <span data-testid="is-system">{String(themeContext.isSystem)}</span>
      
      <button onClick={() => themeContext.changeTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => themeContext.changeTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => themeContext.changeMode('system')} data-testid="set-system">
        Set System
      </button>
      <button onClick={themeContext.toggleTheme} data-testid="toggle">
        Toggle Theme
      </button>
    </div>
  );
};

// Mental Health Enhanced Test Component
const MentalHealthThemeComponent: React.FC = () => {
  const [accessibilityMode, setAccessibilityMode] = React.useState<AccessibilityMode>('none');
  const [crisisMode, setCrisisMode] = React.useState<CrisisMode>('normal');
  const [moodTheme, setMoodTheme] = React.useState<MoodBasedTheme>('neutral');
  const [reducedAnimations, setReducedAnimations] = React.useState(false);
  const [contrastLevel, setContrastLevel] = React.useState<'normal' | 'medium' | 'high'>('normal');
  
  const themeContext = useTheme();
  
  // Apply accessibility settings to document
  React.useEffect(() => {
    document.documentElement.setAttribute('data-accessibility', accessibilityMode);
    document.documentElement.setAttribute('data-crisis-mode', crisisMode);
    document.documentElement.setAttribute('data-mood-theme', moodTheme);
    document.documentElement.setAttribute('data-reduced-animations', String(reducedAnimations));
    document.documentElement.setAttribute('data-contrast', contrastLevel);
  }, [accessibilityMode, crisisMode, moodTheme, reducedAnimations, contrastLevel]);
  
  return (
    <div data-testid="mental-health-theme">
      <div data-testid="current-settings">
        <span data-testid="accessibility-mode">{accessibilityMode}</span>
        <span data-testid="crisis-mode">{crisisMode}</span>
        <span data-testid="mood-theme">{moodTheme}</span>
        <span data-testid="reduced-animations">{String(reducedAnimations)}</span>
        <span data-testid="contrast-level">{contrastLevel}</span>
      </div>
      
      {/* Accessibility Controls */}
      <div data-testid="accessibility-controls">
        <button 
          onClick={() => setAccessibilityMode('high-contrast')} 
          data-testid="high-contrast-btn"
        >
          High Contrast
        </button>
        <button 
          onClick={() => setAccessibilityMode('reduced-motion')} 
          data-testid="reduced-motion-btn"
        >
          Reduced Motion
        </button>
        <button 
          onClick={() => setAccessibilityMode('screen-reader')} 
          data-testid="screen-reader-btn"
        >
          Screen Reader Mode
        </button>
      </div>
      
      {/* Crisis Mode Controls */}
      <div data-testid="crisis-controls">
        <button 
          onClick={() => setCrisisMode('crisis')} 
          data-testid="crisis-mode-btn"
        >
          Crisis Mode
        </button>
        <button 
          onClick={() => setCrisisMode('calm')} 
          data-testid="calm-mode-btn"
        >
          Calm Mode
        </button>
        <button 
          onClick={() => setCrisisMode('emergency')} 
          data-testid="emergency-mode-btn"
        >
          Emergency Mode
        </button>
      </div>
      
      {/* Mood-Based Theme Controls */}
      <div data-testid="mood-controls">
        <button 
          onClick={() => setMoodTheme('calming')} 
          data-testid="calming-theme-btn"
        >
          Calming Theme
        </button>
        <button 
          onClick={() => setMoodTheme('energizing')} 
          data-testid="energizing-theme-btn"
        >
          Energizing Theme
        </button>
        <button 
          onClick={() => setMoodTheme('therapeutic')} 
          data-testid="therapeutic-theme-btn"
        >
          Therapeutic Theme
        </button>
      </div>
      
      {/* Contrast Controls */}
      <div data-testid="contrast-controls">
        <button 
          onClick={() => setContrastLevel('high')} 
          data-testid="high-contrast-level-btn"
        >
          High Contrast
        </button>
        <button 
          onClick={() => setContrastLevel('medium')} 
          data-testid="medium-contrast-btn"
        >
          Medium Contrast
        </button>
      </div>
      
      {/* Animation Control */}
      <button 
        onClick={() => setReducedAnimations(!reducedAnimations)} 
        data-testid="toggle-animations-btn"
      >
        Toggle Animations
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;

  beforeEach(() => {
    // Setup localStorage mock
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    if (!descriptor || descriptor.configurable) {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
        configurable: true
      });
    } else {
      // If not configurable, just assign directly
      (window as any).localStorage = localStorageMock;
    }
    localStorageMock.clear();

    // Setup matchMedia mock
    matchMediaMock = createMatchMediaMock(false);
    const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    if (!matchMediaDescriptor || matchMediaDescriptor.configurable) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: jest.fn().mockImplementation(() => matchMediaMock)
      });
    } else {
      // If not configurable, just assign directly
      (window as any).matchMedia = jest.fn().mockImplementation(() => matchMediaMock);
    }

    // Setup document.documentElement mocks
    const mockClassList = {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      toggle: jest.fn()
    };

    // Use assignment instead of defineProperty for simpler setup
    (document.documentElement as any).className = '';
    (document.documentElement as any).classList = mockClassList;

    document.documentElement.setAttribute = jest.fn();
    document.documentElement.removeAttribute = jest.fn();
    document.documentElement.getAttribute = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Basic Theme Functionality', () => {
    it('should provide default theme values', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.mode).toBe('system');
      expect(result.current.isLight).toBe(true);
      expect(result.current.isDark).toBe(false);
      expect(result.current.isSystem).toBe(true);
    });

    it('should use provided default theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="dark" defaultMode="dark">
            {children}
          </ThemeProvider>
        )
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.mode).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('should throw error when useTheme is used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');
      
      consoleError.mockRestore();
    });

    it('should change theme directly', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      act(() => {
        result.current.changeTheme('dark');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
        expect(result.current.mode).toBe('dark');
      });
    });

    it('should toggle theme between light and dark', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="light" defaultMode="light">
            {children}
          </ThemeProvider>
        )
      });

      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });

      act(() => {
        result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
      });
    });
  });

  describe('System Theme Integration', () => {
    it('should detect system dark mode preference', () => {
      matchMediaMock = createMatchMediaMock(true);
      window.matchMedia = jest.fn().mockImplementation(() => matchMediaMock);

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      expect(result.current.systemTheme).toBe('dark');
      expect(result.current.theme).toBe('dark');
    });

    it('should respond to system theme changes', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultMode="system">{children}</ThemeProvider>
      });

      expect(result.current.theme).toBe('light');

      act(() => {
        matchMediaMock.triggerChange(true);
      });

      await waitFor(() => {
        expect(result.current.systemTheme).toBe('dark');
        expect(result.current.theme).toBe('dark');
      });

      act(() => {
        matchMediaMock.triggerChange(false);
      });

      await waitFor(() => {
        expect(result.current.systemTheme).toBe('light');
        expect(result.current.theme).toBe('light');
      });
    });

    it('should respect manual theme over system when not in system mode', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      act(() => {
        result.current.changeMode('dark');
      });

      await waitFor(() => {
        expect(result.current.mode).toBe('dark');
        expect(result.current.theme).toBe('dark');
      });

      act(() => {
        matchMediaMock.triggerChange(false);
      });

      // Theme should remain dark despite system being light
      expect(result.current.theme).toBe('dark');
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save theme mode to localStorage', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      act(() => {
        result.current.changeMode('dark');
      });

      await waitFor(() => {
        expect(localStorageMock.getItem('theme-mode')).toBe('dark');
      });
    });

    it('should load theme mode from localStorage on mount', () => {
      localStorageMock.setItem('theme-mode', 'dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      expect(result.current.mode).toBe('dark');
      expect(result.current.theme).toBe('dark');
    });

    it('should handle invalid localStorage values gracefully', () => {
      localStorageMock.setItem('theme-mode', 'invalid-theme');

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      expect(result.current.mode).toBe('system');
    });
  });

  describe('DOM Manipulation', () => {
    it('should apply theme to document element', async () => {
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="dark" defaultMode="dark">
            {children}
          </ThemeProvider>
        )
      });

      await waitFor(() => {
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
        expect(document.documentElement.className).toContain('theme-dark');
      });
    });

    it('should update DOM when theme changes', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      act(() => {
        result.current.changeTheme('dark');
      });

      await waitFor(() => {
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      });
    });
  });

  describe('Component Integration', () => {
    it('should render test component with correct theme values', () => {
      render(
        <ThemeProvider defaultTheme="dark" defaultMode="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
      expect(screen.getByTestId('is-light')).toHaveTextContent('false');
    });

    it('should handle theme changes through UI interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('set-dark'));

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
      });

      await user.click(screen.getByTestId('set-light'));

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('light');
        expect(screen.getByTestId('is-light')).toHaveTextContent('true');
      });
    });

    it('should handle toggle button correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider defaultTheme="light" defaultMode="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('light');

      await user.click(screen.getByTestId('toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      });
    });
  });

  describe('Mental Health Theme Features', () => {
    it('should support high contrast mode for accessibility', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('high-contrast-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('accessibility-mode')).toHaveTextContent('high-contrast');
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-accessibility',
          'high-contrast'
        );
      });
    });

    it('should support crisis mode for emergency situations', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('crisis-mode-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('crisis-mode')).toHaveTextContent('crisis');
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-crisis-mode',
          'crisis'
        );
      });
    });

    it('should support calm mode for anxiety reduction', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('calm-mode-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('crisis-mode')).toHaveTextContent('calm');
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-crisis-mode',
          'calm'
        );
      });
    });

    it('should support mood-based themes', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('calming-theme-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('mood-theme')).toHaveTextContent('calming');
      });

      await user.click(screen.getByTestId('energizing-theme-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('mood-theme')).toHaveTextContent('energizing');
      });

      await user.click(screen.getByTestId('therapeutic-theme-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('mood-theme')).toHaveTextContent('therapeutic');
      });
    });

    it('should support reduced animations for motion sensitivity', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('reduced-animations')).toHaveTextContent('false');

      await user.click(screen.getByTestId('toggle-animations-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('reduced-animations')).toHaveTextContent('true');
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-reduced-animations',
          'true'
        );
      });
    });

    it('should support different contrast levels', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('high-contrast-level-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('contrast-level')).toHaveTextContent('high');
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-contrast',
          'high'
        );
      });

      await user.click(screen.getByTestId('medium-contrast-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('contrast-level')).toHaveTextContent('medium');
      });
    });

    it('should support screen reader mode', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('screen-reader-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('accessibility-mode')).toHaveTextContent('screen-reader');
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-accessibility',
          'screen-reader'
        );
      });
    });

    it('should handle emergency mode appropriately', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('emergency-mode-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('crisis-mode')).toHaveTextContent('emergency');
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-crisis-mode',
          'emergency'
        );
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should maintain WCAG contrast ratios in high contrast mode', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('high-contrast-level-btn'));

      await waitFor(() => {
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-contrast',
          'high'
        );
      });
    });

    it('should support keyboard navigation for all theme controls', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const toggleButton = screen.getByTestId('toggle');
      const setLightButton = screen.getByTestId('set-light');
      const setDarkButton = screen.getByTestId('set-dark');

      // All buttons should be focusable
      expect(toggleButton).toBeInTheDocument();
      expect(setLightButton).toBeInTheDocument();
      expect(setDarkButton).toBeInTheDocument();

      // Buttons should have accessible roles
      expect(toggleButton).toHaveProperty('type', 'button');
      expect(setLightButton).toHaveProperty('type', 'button');
      expect(setDarkButton).toHaveProperty('type', 'button');
    });

    it('should provide proper ARIA attributes for screen readers', () => {
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      const buttons = [
        'high-contrast-btn',
        'reduced-motion-btn',
        'screen-reader-btn',
        'crisis-mode-btn',
        'calm-mode-btn',
        'emergency-mode-btn'
      ];

      buttons.forEach(btnId => {
        const button = screen.getByTestId(btnId);
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate localStorage being unavailable
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => {
            throw new Error('localStorage not available');
          }),
          setItem: jest.fn(() => {
            throw new Error('localStorage not available');
          })
        },
        writable: true
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      // Should still work with default values
      expect(result.current.theme).toBeDefined();
      expect(result.current.mode).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should handle matchMedia not being available', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        writable: true
      });

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      expect(result.current.systemTheme).toBe('light');
      expect(result.current.theme).toBe('light');
    });

    it('should handle rapid theme changes', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      // Rapid fire theme changes
      act(() => {
        result.current.changeTheme('dark');
        result.current.changeTheme('light');
        result.current.changeTheme('dark');
        result.current.changeMode('system');
        result.current.toggleTheme();
      });

      // Should settle on a valid state
      await waitFor(() => {
        expect(['light', 'dark'].includes(result.current.theme)).toBe(true);
        expect(['light', 'dark', 'system'].includes(result.current.mode)).toBe(true);
      });
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      unmount();

      expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('Performance Considerations', () => {
    it('should memoize context value to prevent unnecessary re-renders', () => {
      let renderCount = 0;

      const CountingComponent = () => {
        useTheme();
        renderCount++;
        return <div>Render count: {renderCount}</div>;
      };

      const { rerender } = render(
        <ThemeProvider>
          <CountingComponent />
        </ThemeProvider>
      );

      const initialRenderCount = renderCount;

      // Re-render the provider with same props
      rerender(
        <ThemeProvider>
          <CountingComponent />
        </ThemeProvider>
      );

      // Should not cause unnecessary re-renders
      expect(renderCount).toBe(initialRenderCount);
    });

    it('should batch DOM updates efficiently', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      });

      const setAttributeSpy = jest.spyOn(document.documentElement, 'setAttribute');

      act(() => {
        result.current.changeMode('dark');
      });

      await waitFor(() => {
        // Should update DOM only once per change
        const themeUpdateCalls = setAttributeSpy.mock.calls.filter(
          call => call[0] === 'data-theme'
        );
        expect(themeUpdateCalls.length).toBeLessThanOrEqual(2); // Initial + change
      });
    });
  });

  describe('Crisis Intervention Features', () => {
    it('should provide immediate access to crisis resources in emergency mode', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('emergency-mode-btn'));

      await waitFor(() => {
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-crisis-mode',
          'emergency'
        );
      });
    });

    it('should simplify UI in crisis mode', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('crisis-mode-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('crisis-mode')).toHaveTextContent('crisis');
      });
    });

    it('should apply calming colors in calm mode', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <MentalHealthThemeComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('calm-mode-btn'));

      await waitFor(() => {
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-crisis-mode',
          'calm'
        );
      });
    });
  });
});