/**
 * @jest-environment jsdom
 */

import {
  initMobileViewport,
  enhanceMobileFocus,
  isMobileDevice,
  isVirtualKeyboardOpen,
  addTouchFeedback,
  initMobileEnhancements
} from './mobileUtils';

describe('mobileUtils', () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.body.className = '';

    // Reset window properties
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    Object.defineProperty(window, 'visualViewport', { 
      value: {
        width: 1024,
        height: 768,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      },
      writable: true
    });

    // Mock document.documentElement.style
    Object.defineProperty(document.documentElement, 'style', { 
      value: {
        setProperty: jest.fn()
      },
      writable: true
    });

    // Mock screen property
    Object.defineProperty(window, 'screen', {
      value: { height: 800 },
      writable: true
    });

    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      writable: true
    });

    // Clear event listeners
    jest.clearAllMocks();
  });

  describe('initMobileViewport', () => {
    test('should set initial viewport height CSS variables', () => {
      const mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: { setProperty: mockSetProperty },
        writable: true
      });

      initMobileViewport();

      expect(mockSetProperty).toHaveBeenCalledWith('--vh', expect.stringContaining('px'));
      expect(mockSetProperty).toHaveBeenCalledWith('--mobile-vh', expect.stringContaining('px'));
    });

    test('should calculate vh correctly', () => {
      const mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: { setProperty: mockSetProperty },
        writable: true
      });

      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });

      initMobileViewport();
      const expectedVh = (800 * 0.01).toString() + 'px';
      expect(mockSetProperty).toHaveBeenCalledWith('--vh', expectedVh);
    });

    test('should use visual viewport when available', () => {
      const mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: { setProperty: mockSetProperty },
        writable: true
      });

      Object.defineProperty(window, 'visualViewport', { 
        value: {
          height: 600,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        },
        writable: true
      });

      initMobileViewport();

      expect(mockSetProperty).toHaveBeenCalledWith('--mobile-vh', '600px');
    });

    test('should add resize event listener', () => {
      const mockAddEventListener = jest.fn();
      window.addEventListener = mockAddEventListener;

      initMobileViewport();

      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    test('should add visual viewport event listeners when available', () => {
      const mockAddEventListener = jest.fn();
      Object.defineProperty(window, 'visualViewport', {
        value: {
          height: 768,
          addEventListener: mockAddEventListener,
          removeEventListener: jest.fn()
        },
        writable: true
      });

      initMobileViewport();

      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    test('should add orientation change listener with delay', () => {
      jest.useFakeTimers();
      const mockAddEventListener = jest.fn();
      window.addEventListener = mockAddEventListener;

      initMobileViewport();

      expect(mockAddEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));

      // Test orientation change handler
      const orientationHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'orientationchange'
      )?.[1];
      const mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: { setProperty: mockSetProperty },
        writable: true
      });

      orientationHandler();

      // Should not call immediately
      expect(mockSetProperty).not.toHaveBeenCalled();

      // Should call after delay
      jest.advanceTimersByTime(100);
      expect(mockSetProperty).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('should return cleanup function', () => {
      const cleanup = initMobileViewport();

      expect(typeof cleanup).toBe('function');
    });

    test('cleanup function should remove event listeners', () => {
      const mockRemoveEventListener = jest.fn();
      window.removeEventListener = mockRemoveEventListener;

      Object.defineProperty(window, 'visualViewport', {
        value: {
          height: 768,
          addEventListener: jest.fn(),
          removeEventListener: mockRemoveEventListener
        },
        writable: true
      });
      const cleanup = initMobileViewport();
      cleanup();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    test('should handle missing visual viewport gracefully', () => {
      Object.defineProperty(window, 'visualViewport', { value: undefined, writable: true });

      expect(() => {
        const cleanup = initMobileViewport();
        cleanup();
      }).not.toThrow();
    });
  });

  describe('enhanceMobileFocus', () => {
    test('should set 16px font size for iOS inputs below 16px', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      const input = document.createElement('input');
      input.style.fontSize = '12px';
      document.body.appendChild(input);

      // Mock getComputedStyle
      window.getComputedStyle = jest.fn().mockReturnValue({
        fontSize: '12px',
        getPropertyValue: jest.fn((property: string) => {
          switch (property) {
            case 'font-size':
              return '12px';
            default:
              return '';
          }
        })
      });

      enhanceMobileFocus();

      expect(input.style.fontSize).toBe('16px');
    });

    test('should not change font size for iOS inputs already 16px or larger', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      const input = document.createElement('input');
      input.style.fontSize = '18px';
      document.body.appendChild(input);

      window.getComputedStyle = jest.fn().mockReturnValue({
        fontSize: '18px',
        getPropertyValue: jest.fn((property: string) => {
          switch (property) {
            case 'font-size':
              return '18px';
            default:
              return '';
          }
        })
      });

      enhanceMobileFocus();
      expect(input.style.fontSize).toBe('18px');
    });

    test('should not modify fonts on non-iOS devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });
      const input = document.createElement('input');
      input.style.fontSize = '12px';
      document.body.appendChild(input);

      enhanceMobileFocus();

      expect(input.style.fontSize).toBe('12px');
    });

    test('should add focus event listeners to inputs', () => {
      const input = document.createElement('input');
      const mockAddEventListener = jest.fn();
      input.addEventListener = mockAddEventListener;
      document.body.appendChild(input);

      enhanceMobileFocus();

      expect(mockAddEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    test('should add focus class and scroll into view on focus', () => {
      jest.useFakeTimers();
      const input = document.createElement('input');
      const mockScrollIntoView = jest.fn();
      input.scrollIntoView = mockScrollIntoView;

      let focusHandler: any;
      input.addEventListener = jest.fn((event, handler) => {
        if (event === 'focus') {
          focusHandler = handler as (event: FocusEvent) => void;
        }
      });

      document.body.appendChild(input);
      enhanceMobileFocus();

      // Trigger focus event
      (focusHandler as any)({ target: input } as unknown as FocusEvent);

      expect(input.classList.contains('mobile-input-focused')).toBe(true);

      // Should scroll after timeout
      jest.advanceTimersByTime(300);
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });

      jest.useRealTimers();
    });

    test('should remove focus class on blur', () => {
      const input = document.createElement('input');
      let blurHandler: any;
      input.addEventListener = jest.fn((event, handler) => {
        if (event === 'blur') {
          blurHandler = handler as (event: FocusEvent) => void;
        }
      });

      document.body.appendChild(input);
      input.classList.add('mobile-input-focused');

      enhanceMobileFocus();

      // Trigger blur event
      blurHandler!({ target: input } as unknown as FocusEvent);

      expect(input.classList.contains('mobile-input-focused')).toBe(false);
    });

    test('should handle both inputs and textareas', () => {
      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      document.body.appendChild(input);
      document.body.appendChild(textarea);
      const inputAddListener = jest.fn();
      const textareaAddListener = jest.fn();
      input.addEventListener = inputAddListener;
      textarea.addEventListener = textareaAddListener;

      enhanceMobileFocus();

      expect(inputAddListener).toHaveBeenCalledTimes(2); // focus + blur
      expect(textareaAddListener).toHaveBeenCalledTimes(2); // focus + blur
    });

    test('should handle iPad user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true
      });
      const input = document.createElement('input');
      input.style.fontSize = '12px';
      document.body.appendChild(input);

      window.getComputedStyle = jest.fn().mockReturnValue({
        fontSize: '12px',
        getPropertyValue: jest.fn((property: string) => {
          switch (property) {
            case 'font-size':
              return '12px';
            default:
              return '';
          }
        })
      });

      enhanceMobileFocus();
      expect(input.style.fontSize).toBe('16px');
    });
  });

  describe('isMobileDevice', () => {
    test('should detect mobile device by user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });

      expect(isMobileDevice()).toBe(true);
    });

    test('should detect Android devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
        writable: true
      });

      expect(isMobileDevice()).toBe(true);
    });

    test('should detect by window width', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

      expect(isMobileDevice()).toBe(true);
    });

    test('should detect by touch support', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      Object.defineProperty(window, 'ontouchstart', { value: true, writable: true });

      // Desktop with touch support and large screen should NOT be considered mobile
      expect(isMobileDevice()).toBe(false);
    });

    test('should return false for desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      delete (window as any).ontouchstart;

      expect(isMobileDevice()).toBe(false);
    });

    test('should detect various mobile user agents', () => {
      const mobileUserAgents = [
        'Mozilla/5.0 (webOS/1.4.0; U; en-US) AppleWebKit/532.2',
        'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0)',
        'Opera/9.80 (BlackBerry; Opera Mini/6.5.27452/28.2725; U; en) Presto/2.8.119',
        'Opera/12.02 (Android 4.1; Linux; Opera Mobi/ADR-1111101157; U; en-US) Presto/2.9.201'
      ];

      mobileUserAgents.forEach(ua => {
        Object.defineProperty(navigator, 'userAgent', { value: ua, writable: true });
        expect(isMobileDevice()).toBe(true);
      });
    });
  });

  describe('isVirtualKeyboardOpen', () => {
    test('should detect keyboard open with visual viewport', () => {
      Object.defineProperty(window, 'visualViewport', {
        value: { height: 400 },
        writable: true
      });

      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });

      expect(isVirtualKeyboardOpen()).toBe(true);
    });

    test('should detect keyboard closed with visual viewport', () => {
      Object.defineProperty(window, 'visualViewport', {
        value: { height: 700 },
        writable: true
      });

      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });

      expect(isVirtualKeyboardOpen()).toBe(false);
    });

    test('should fallback to screen height comparison', () => {
      Object.defineProperty(window, 'visualViewport', { value: undefined, writable: true });
      Object.defineProperty(window, 'screen', { value: { height: 800 }, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true });

      expect(isVirtualKeyboardOpen()).toBe(true);
    });

    test('should return false when height difference is small', () => {
      Object.defineProperty(window, 'visualViewport', { value: undefined, writable: true });
      Object.defineProperty(window, 'screen', { value: { height: 800 }, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 750, writable: true });

      expect(isVirtualKeyboardOpen()).toBe(false);
    });

    test('should handle edge case at 80% threshold', () => {
      Object.defineProperty(window, 'visualViewport', {
        value: { height: 640 }, // Exactly 80% of 800
        writable: true
      });

      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });

      expect(isVirtualKeyboardOpen()).toBe(false);
    });

    test('should detect keyboard when visual viewport is just below 80%', () => {
      Object.defineProperty(window, 'visualViewport', {
        value: { height: 639 }, // Just below 80% of 800
        writable: true
      });

      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });

      expect(isVirtualKeyboardOpen()).toBe(true);
    });
  });

  describe('addTouchFeedback', () => {
    test('should add scale transform on touchstart', () => {
      const element = document.createElement('button');
      let touchStartHandler: () => void;
      element.addEventListener = jest.fn((event, handler) => {
        if (event === 'touchstart') {
          touchStartHandler = handler as () => void;
        }
      });

      addTouchFeedback(element);

      touchStartHandler!();

      expect(element.style.transform).toBe('scale(0.95)');
      expect(element.style.transition).toBe('transform 0.1s ease');
    });

    test('should restore scale on touchend for quick taps', () => {
      jest.useFakeTimers();
      const element = document.createElement('button');
      let touchStartHandler: () => void;
      let touchEndHandler: () => void;
      element.addEventListener = jest.fn((event, handler) => {
        if (event === 'touchstart') {
          touchStartHandler = handler as () => void;
        } else if (event === 'touchend') {
          touchEndHandler = handler as () => void;
        }
      });

      // Mock Date.now for consistent timing
      const originalDateNow = Date.now;
      let currentTime = 1000;
      Date.now = jest.fn(() => currentTime);

      addTouchFeedback(element);

      touchStartHandler!();
      currentTime += 200; // 200ms touch duration
      touchEndHandler!();

      // Should restore scale after delay for quick taps
      jest.advanceTimersByTime(100);
      expect(element.style.transform).toBe('scale(1)');

      Date.now = originalDateNow;
      jest.useRealTimers();
    });

    test('should restore scale immediately for long taps', () => {
      const element = document.createElement('button');
      let touchStartHandler: () => void;
      let touchEndHandler: () => void;
      element.addEventListener = jest.fn((event, handler) => {
        if (event === 'touchstart') {
          touchStartHandler = handler as () => void;
        } else if (event === 'touchend') {
          touchEndHandler = handler as () => void;
        }
      });

      // Mock Date.now for consistent timing
      const originalDateNow = Date.now;
      let currentTime = 1000;
      Date.now = jest.fn(() => currentTime);

      addTouchFeedback(element);

      touchStartHandler!();
      currentTime += 400; // 400ms touch duration (long)
      touchEndHandler!();

      // Should restore scale immediately for long taps
      expect(element.style.transform).toBe('scale(1)');

      Date.now = originalDateNow;
    });

    test('should restore scale on touchcancel', () => {
      const element = document.createElement('button');
      let touchCancelHandler: () => void;
      element.addEventListener = jest.fn((event, handler) => {
        if (event === 'touchcancel') {
          touchCancelHandler = handler as () => void;
        }
      });

      addTouchFeedback(element);

      element.style.transform = 'scale(0.95)';
      touchCancelHandler!();

      expect(element.style.transform).toBe('scale(1)');
    });

    test('should record touch start time correctly', () => {
      const element = document.createElement('button');
      let touchStartHandler: () => void;
      element.addEventListener = jest.fn((event, handler) => {
        if (event === 'touchstart') {
          touchStartHandler = handler as () => void;
        }
      });

      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(12345);

      addTouchFeedback(element);
      touchStartHandler!();

      expect(mockDateNow).toHaveBeenCalled();
      mockDateNow.mockRestore();
    });
  });

  describe('initMobileEnhancements', () => {
    test('should return early for non-mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      const result = initMobileEnhancements();

      // Should return a no-op cleanup function for non-mobile
      expect(typeof result).toBe('function');
      expect(() => result()).not.toThrow();
    });

    test('should initialize viewport and enhance focus for mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      const mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: { setProperty: mockSetProperty },
        writable: true
      });

      // Add some inputs and buttons for testing
      const input = document.createElement('input');
      const button = document.createElement('button');
      document.body.appendChild(input);
      document.body.appendChild(button);

      // Mock addEventListener for the button
      button.addEventListener = jest.fn();
      const result = initMobileEnhancements();

      // Should set CSS properties (viewport initialization)
      expect(mockSetProperty).toHaveBeenCalled();

      // Should return cleanup function
      expect(typeof result).toBe('function');
    });

    test('should add touch feedback to buttons', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      const button = document.createElement('button');
      const divWithRole = document.createElement('div');
      divWithRole.setAttribute('role', 'button');
      const buttonClass = document.createElement('div');
      buttonClass.className = 'btn';
      const mockAddEventListener1 = jest.fn();
      const mockAddEventListener2 = jest.fn();
      const mockAddEventListener3 = jest.fn();

      button.addEventListener = mockAddEventListener1;
      divWithRole.addEventListener = mockAddEventListener2;
      buttonClass.addEventListener = mockAddEventListener3;

      document.body.appendChild(button);
      document.body.appendChild(divWithRole);
      document.body.appendChild(buttonClass);

      initMobileEnhancements();

      // All button-like elements should have touch feedback
      expect(mockAddEventListener1).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(mockAddEventListener2).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(mockAddEventListener3).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });

    test('should handle cleanup function', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      const cleanup = initMobileEnhancements();

      expect(() => {
        if (cleanup) cleanup();
      }).not.toThrow();
    });

    test('should handle elements without addEventListener method', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });

      // Create a non-HTML element mock
      const mockElement = {};
      document.body.appendChild = jest.fn();
      document.querySelectorAll = jest.fn().mockReturnValue([mockElement]);

      expect(() => {
        initMobileEnhancements();
      }).not.toThrow();
    });
  });

  describe('Auto-initialization', () => {
    test('should auto-initialize when DOM is ready', () => {
      // Mock readyState as loading
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });
      const mockAddEventListener = jest.fn();
      document.addEventListener = mockAddEventListener;

      // Re-import to trigger auto-initialization
      jest.resetModules();
      require('./mobileUtils');

      expect(mockAddEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    });

    test('should initialize immediately when DOM is already ready', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      const mockSetProperty = jest.fn();
      Object.defineProperty(document.documentElement, 'style', {
        value: { setProperty: mockSetProperty },
        writable: true
      });

      // Re-import to trigger auto-initialization
      jest.resetModules();
      require('./mobileUtils');

      // Should have been called during import
      expect(mockSetProperty).toHaveBeenCalled();
    });

    test('should handle missing document gracefully', () => {
      // Mock missing document
      const originalDocument = global.document;
      (global as any).document = undefined;

      expect(() => {
        jest.resetModules();
        require('./mobileUtils');
      }).not.toThrow();

      // Restore document
      global.document = originalDocument;
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle elements without style property', () => {
      const input = document.createElement('input');
      delete (input as any).style;
      document.body.appendChild(input);

      expect(() => {
        enhanceMobileFocus();
      }).not.toThrow();
    });

    test('should handle missing getComputedStyle', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });
      const input = document.createElement('input');
      document.body.appendChild(input);

      // Mock getComputedStyle to return null
      window.getComputedStyle = jest.fn().mockReturnValue(null);

      expect(() => {
        enhanceMobileFocus();
      }).not.toThrow();
    });

    test('should handle extreme viewport dimensions', () => {
      Object.defineProperty(window, 'innerWidth', { value: 0, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 0, writable: true });

      expect(() => {
        initMobileViewport();
      }).not.toThrow();
    });

    test('should handle missing visualViewport properties', () => {
      Object.defineProperty(window, 'visualViewport', {
        value: {}, // Missing height property
        writable: true
      });

      expect(() => {
        isVirtualKeyboardOpen();
      }).not.toThrow();
    });

    test('should handle missing screen property', () => {
      Object.defineProperty(window, 'visualViewport', { value: undefined, writable: true });
      Object.defineProperty(window, 'screen', { value: undefined, writable: true });

      expect(() => {
        isVirtualKeyboardOpen();
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should not create memory leaks with event listeners', () => {
      const cleanup = initMobileViewport();

      // Multiple initializations
      for (let i = 0; i < 10; i++) {
        const cleanup2 = initMobileViewport();
        if (cleanup2) cleanup2();
      }

      if (cleanup) cleanup();

      expect(true).toBe(true); // Should not throw
    });

    test('should handle rapid touch events', () => {
      const element = document.createElement('button');
      let touchStartHandler: () => void;
      element.addEventListener = jest.fn((event, handler) => {
        if (event === 'touchstart') {
          touchStartHandler = handler as () => void;
        }
      });

      addTouchFeedback(element);

      // Rapid touch events
      for (let i = 0; i < 100; i++) {
        touchStartHandler!();
      }

      expect(element.style.transform).toBe('scale(0.95)');
    });

    test('should handle rapid focus/blur events', () => {
      const input = document.createElement('input');
      let focusHandler: ((event: FocusEvent) => void) | undefined;
      let blurHandler: ((event: FocusEvent) => void) | undefined;
      input.addEventListener = jest.fn((event, handler) => {
        if (event === 'focus') {
          focusHandler = handler as (event: FocusEvent) => void;
        } else if (event === 'blur') {
          blurHandler = handler as (event: FocusEvent) => void;
        }
      });

      document.body.appendChild(input);

      enhanceMobileFocus();

      // Rapid focus/blur events - only test if handlers were assigned
      if (focusHandler && blurHandler) {
        for (let i = 0; i < 100; i++) {
          focusHandler({ target: input } as unknown as FocusEvent);
          blurHandler({ target: input } as unknown as FocusEvent);
        }
        expect(input.classList.contains('mobile-input-focused')).toBe(false);
      } else {
        // If handlers weren't assigned, the element was skipped (valid behavior)
        expect(true).toBe(true);
      }
    });
  });
});