/**
 * Accessibility Hook for Mental Health Platform
 *
 * Comprehensive accessibility management with screen reader support,
 * keyboard navigation, focus management, and therapeutic adaptations.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Types for accessibility management
export type AccessibilityLevel = 'basic' | 'enhanced' | 'comprehensive';
export type ScreenReaderType = 'nvda' | 'jaws' | 'voiceover' | 'talkback' | 'dragon' | 'other';
export type FocusMode = 'normal' | 'therapeutic' | 'crisis' | 'simplified';

export interface AccessibilityPreferences {
  screenReader: boolean;
  screenReaderType?: ScreenReaderType;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  voiceControl: boolean;
  cognitiveSupport: boolean;
  therapeuticMode: boolean;
  crisisAccessibility: boolean;
  customizations: {
    fontSize: number; // percentage
    lineHeight: number;
    letterSpacing: number;
    focusIndicatorSize: number;
    animationSpeed: number; // 0-1, where 0 is no animation
  };
}

export interface AnnouncementOptions {
  priority: 'polite' | 'assertive';
  interrupt: boolean;
  therapeutic: boolean;
  crisis: boolean;
  delay?: number;
}

export interface FocusManagement {
  currentFocus: HTMLElement | null;
  focusHistory: HTMLElement[];
  trapStack: HTMLElement[];
  skipLinks: Array<{ target: string; label: string }>;
}

export interface AccessibilityState {
  preferences: AccessibilityPreferences;
  isScreenReaderActive: boolean;
  currentFocusMode: FocusMode;
  announcements: Array<{
    id: string;
    message: string;
    timestamp: Date;
    priority: 'polite' | 'assertive';
    acknowledged: boolean;
  }>;
  focusManagement: FocusManagement;
  isLoading: boolean;
  error: string | null;
}

// Default accessibility preferences
const defaultPreferences: AccessibilityPreferences = {
  screenReader: false,
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  keyboardNavigation: true,
  voiceControl: false,
  cognitiveSupport: false,
  therapeuticMode: false,
  crisisAccessibility: false,
  customizations: {
    fontSize: 100,
    lineHeight: 1.5,
    letterSpacing: 0,
    focusIndicatorSize: 100,
    animationSpeed: 1
  }
};

export const useAccessibility = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AccessibilityState>({
    preferences: defaultPreferences,
    isScreenReaderActive: false,
    currentFocusMode: 'normal',
    announcements: [],
    focusManagement: {
      currentFocus: null,
      focusHistory: [],
      trapStack: [],
      skipLinks: []
    },
    isLoading: false,
    error: null
  });

  // Refs for accessibility management
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const alertRegionRef = useRef<HTMLDivElement | null>(null);
  const focusableElements = useRef<HTMLElement[]>([]);

  // Initialize accessibility features
  useEffect(() => {
    detectScreenReader();
    setupLiveRegions();
    setupKeyboardListeners();
    setupFocusManagement();
    loadUserPreferences();
    
    return () => {
      cleanupListeners();
    };
  }, []);

  // Detect screen reader presence
  const detectScreenReader = useCallback(() => {
    // Multiple methods to detect screen reader
    const hasScreenReader = 
      // Check for screen reader specific APIs
      typeof (window as any).speechSynthesis !== 'undefined' ||
      // Check for common screen reader user agents
      /NVDA|JAWS|VoiceOver|TalkBack/i.test(navigator.userAgent) ||
      // Check for accessibility preferences
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(prefers-contrast: high)').matches ||
      // Check for programmatic indicators
      document.documentElement.getAttribute('role') === 'application' ||
      // Check for screen reader specific CSS
      getComputedStyle(document.documentElement).getPropertyValue('-ms-high-contrast') !== '';

    setState(prev => ({
      ...prev,
      isScreenReaderActive: hasScreenReader
    }));

    // Auto-enable screen reader mode if detected
    if (hasScreenReader) {
      updatePreferences({
        screenReader: true,
        keyboardNavigation: true,
        cognitiveSupport: true
      });
    }
  }, []);

  // Setup live regions for screen reader announcements
  const setupLiveRegions = useCallback(() => {
    // Create polite live region if it doesn't exist
    if (!liveRegionRef.current) {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.className = 'sr-only';
      politeRegion.id = 'accessibility-announcements';
      document.body.appendChild(politeRegion);
      liveRegionRef.current = politeRegion;
    }

    // Create assertive live region if it doesn't exist
    if (!alertRegionRef.current) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';
      assertiveRegion.id = 'accessibility-alerts';
      document.body.appendChild(assertiveRegion);
      alertRegionRef.current = assertiveRegion;
    }
  }, []);

  // Announce message to screen readers
  const announceToScreenReader = useCallback((
    message: string, 
    options: Partial<AnnouncementOptions> = {}
  ) => {
    const {
      priority = 'polite',
      interrupt = false,
      therapeutic = false,
      crisis = false,
      delay = 0
    } = options;

    // Enhance message for therapeutic context
    let enhancedMessage = message;
    if (therapeutic) {
      enhancedMessage = `Therapeutic update: ${message}`;
    }
    if (crisis) {
      enhancedMessage = `Important: ${message}`;
    }

    // Create announcement record
    const announcement = {
      id: `announcement_${Date.now()}`,
      message: enhancedMessage,
      timestamp: new Date(),
      priority,
      acknowledged: false
    };

    setState(prev => ({
      ...prev,
      announcements: [announcement, ...prev.announcements.slice(0, 49)] // Keep last 50
    }));

    // Announce to appropriate live region
    const announceToRegion = () => {
      const region = priority === 'assertive' ? alertRegionRef.current : liveRegionRef.current;
      if (region) {
        if (interrupt) {
          region.textContent = '';
          setTimeout(() => {
            region.textContent = enhancedMessage;
          }, 100);
        } else {
          region.textContent = enhancedMessage;
        }

        // Clear announcement after a delay to allow re-announcement
        setTimeout(() => {
          if (region.textContent === enhancedMessage) {
            region.textContent = '';
          }
        }, Math.max(3000, enhancedMessage.length * 100));
      }
    };

    if (delay > 0) {
      setTimeout(announceToRegion, delay);
    } else {
      announceToRegion();
    }
  }, []);

  // Focus management utilities
  const focusManagement = useMemo(() => ({
    // Set focus to element
    focusElement: (element: HTMLElement | string) => {
      const targetElement = typeof element === 'string' 
        ? document.querySelector(element) as HTMLElement
        : element;

      if (targetElement && typeof targetElement.focus === 'function') {
        targetElement.focus();
        setState(prev => ({
          ...prev,
          focusManagement: {
            ...prev.focusManagement,
            currentFocus: targetElement,
            focusHistory: [targetElement, ...prev.focusManagement.focusHistory.slice(0, 9)]
          }
        }));
      }
    },

    // Focus first element in container
    focusFirst: (container: HTMLElement | string) => {
      const containerElement = typeof container === 'string'
        ? document.querySelector(container) as HTMLElement
        : container;

      if (containerElement) {
        const focusable = getFocusableElements(containerElement);
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    },

    // Focus last element in container
    focusLast: (container: HTMLElement | string) => {
      const containerElement = typeof container === 'string'
        ? document.querySelector(container) as HTMLElement
        : container;

      if (containerElement) {
        const focusable = getFocusableElements(containerElement);
        if (focusable.length > 0) {
          focusable[focusable.length - 1].focus();
        }
      }
    },

    // Trap focus within container
    trapFocus: (container: HTMLElement | string) => {
      const containerElement = typeof container === 'string'
        ? document.querySelector(container) as HTMLElement
        : container;

      if (containerElement) {
        setState(prev => ({
          ...prev,
          focusManagement: {
            ...prev.focusManagement,
            trapStack: [...prev.focusManagement.trapStack, containerElement]
          }
        }));

        // Focus first element in container
        const focusable = getFocusableElements(containerElement);
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    },

    // Release focus trap
    releaseFocusTrap: () => {
      setState(prev => ({
        ...prev,
        focusManagement: {
          ...prev.focusManagement,
          trapStack: prev.focusManagement.trapStack.slice(0, -1)
        }
      }));
    },

    // Return focus to previous element
    returnFocus: () => {
      setState(prev => {
        const previousFocus = prev.focusManagement.focusHistory[1];
        if (previousFocus && typeof previousFocus.focus === 'function') {
          previousFocus.focus();
          return {
            ...prev,
            focusManagement: {
              ...prev.focusManagement,
              currentFocus: previousFocus
            }
          };
        }
        return prev;
      });
    }
  }), []);

  // Get focusable elements within a container
  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)).filter(
      element => {
        const el = element as HTMLElement;
        return el.offsetParent !== null && // Element is visible
               getComputedStyle(el).visibility !== 'hidden' &&
               !el.hasAttribute('aria-hidden');
      }
    ) as HTMLElement[];
  }, []);

  // Setup keyboard event listeners
  const setupKeyboardListeners = useCallback(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle focus trapping
      if (state.focusManagement.trapStack.length > 0 && event.key === 'Tab') {
        const currentTrap = state.focusManagement.trapStack[state.focusManagement.trapStack.length - 1];
        const focusableElements = getFocusableElements(currentTrap);
        
        if (focusableElements.length === 0) return;

        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
        
        if (event.shiftKey) {
          // Shift+Tab - go backwards
          if (currentIndex <= 0) {
            event.preventDefault();
            focusableElements[focusableElements.length - 1].focus();
          }
        } else {
          // Tab - go forwards
          if (currentIndex >= focusableElements.length - 1) {
            event.preventDefault();
            focusableElements[0].focus();
          }
        }
      }

      // Handle escape key
      if (event.key === 'Escape' && state.focusManagement.trapStack.length > 0) {
        focusManagement.releaseFocusTrap();
        focusManagement.returnFocus();
      }

      // Handle therapeutic shortcuts
      if (state.preferences.therapeuticMode) {
        if (event.ctrlKey && event.key === 'h') {
          event.preventDefault();
          announceToScreenReader('Help: Press Ctrl+1 for crisis support, Ctrl+2 for mood check-in, Ctrl+3 for breathing exercise', {
            priority: 'assertive',
            therapeutic: true
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.focusManagement.trapStack, state.preferences.therapeuticMode, getFocusableElements, focusManagement, announceToScreenReader]);

  // Setup focus management
  const setupFocusManagement = useCallback(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target) {
        setState(prev => ({
          ...prev,
          focusManagement: {
            ...prev.focusManagement,
            currentFocus: target
          }
        }));
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  // Load user accessibility preferences
  const loadUserPreferences = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // In a real app, this would load from user's saved preferences
      const savedPreferences = localStorage.getItem(`accessibility_${user.id}`);
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        setState(prev => ({
          ...prev,
          preferences: { ...defaultPreferences, ...preferences },
          isLoading: false
        }));
        applyPreferences({ ...defaultPreferences, ...preferences });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load accessibility preferences'
      }));
    }
  }, [user]);

  // Update accessibility preferences
  const updatePreferences = useCallback(async (updates: Partial<AccessibilityPreferences>) => {
    const newPreferences = { ...state.preferences, ...updates };
    
    setState(prev => ({
      ...prev,
      preferences: newPreferences
    }));

    // Save to local storage
    if (user) {
      localStorage.setItem(`accessibility_${user.id}`, JSON.stringify(newPreferences));
    }

    // Apply preferences to document
    applyPreferences(newPreferences);

    announceToScreenReader('Accessibility preferences updated', { therapeutic: true });
  }, [state.preferences, user]);

  // Apply preferences to document
  const applyPreferences = useCallback((preferences: AccessibilityPreferences) => {
    const root = document.documentElement;

    // Apply font size
    root.style.setProperty('--accessibility-font-scale', `${preferences.customizations.fontSize / 100}`);

    // Apply line height
    root.style.setProperty('--accessibility-line-height', preferences.customizations.lineHeight.toString());

    // Apply letter spacing
    root.style.setProperty('--accessibility-letter-spacing', `${preferences.customizations.letterSpacing}em`);

    // Apply focus indicator size
    root.style.setProperty('--accessibility-focus-size', `${preferences.customizations.focusIndicatorSize / 100}`);

    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.style.setProperty('--accessibility-animation-duration', '0.01ms');
      root.style.setProperty('--accessibility-transition-duration', '0.01ms');
    } else {
      root.style.setProperty('--accessibility-animation-duration', `${preferences.customizations.animationSpeed}s`);
      root.style.setProperty('--accessibility-transition-duration', `${preferences.customizations.animationSpeed * 0.3}s`);
    }

    // Apply high contrast
    root.classList.toggle('high-contrast', preferences.highContrast);

    // Apply therapeutic mode
    root.classList.toggle('therapeutic-mode', preferences.therapeuticMode);

    // Apply crisis accessibility
    root.classList.toggle('crisis-accessible', preferences.crisisAccessibility);
  }, []);

  // Set focus mode for different contexts
  const setFocusMode = useCallback((mode: FocusMode) => {
    setState(prev => ({ ...prev, currentFocusMode: mode }));

    const root = document.documentElement;
    root.classList.remove('focus-normal', 'focus-therapeutic', 'focus-crisis', 'focus-simplified');
    root.classList.add(`focus-${mode}`);

    // Announce mode change
    const modeDescriptions = {
      normal: 'Normal focus mode active',
      therapeutic: 'Therapeutic focus mode active - enhanced for wellness activities',
      crisis: 'Crisis focus mode active - simplified navigation for emergency support',
      simplified: 'Simplified focus mode active - reduced complexity'
    };

    announceToScreenReader(modeDescriptions[mode], { 
      priority: 'assertive', 
      therapeutic: mode === 'therapeutic',
      crisis: mode === 'crisis'
    });
  }, [announceToScreenReader]);

  // Cleanup function
  const cleanupListeners = useCallback(() => {
    // Remove live regions
    if (liveRegionRef.current) {
      document.body.removeChild(liveRegionRef.current);
      liveRegionRef.current = null;
    }
    if (alertRegionRef.current) {
      document.body.removeChild(alertRegionRef.current);
      alertRegionRef.current = null;
    }
  }, []);

  // Add skip link
  const addSkipLink = useCallback((target: string, label: string) => {
    setState(prev => ({
      ...prev,
      focusManagement: {
        ...prev.focusManagement,
        skipLinks: [...prev.focusManagement.skipLinks, { target, label }]
      }
    }));
  }, []);

  // Remove skip link
  const removeSkipLink = useCallback((target: string) => {
    setState(prev => ({
      ...prev,
      focusManagement: {
        ...prev.focusManagement,
        skipLinks: prev.focusManagement.skipLinks.filter(link => link.target !== target)
      }
    }));
  }, []);

  // Get current accessibility status
  const getAccessibilityStatus = useCallback(() => {
    return {
      screenReaderActive: state.isScreenReaderActive,
      highContrastEnabled: state.preferences.highContrast,
      motionReduced: state.preferences.reducedMotion,
      therapeuticModeActive: state.preferences.therapeuticMode,
      crisisAccessibilityActive: state.preferences.crisisAccessibility,
      focusMode: state.currentFocusMode,
      recentAnnouncements: state.announcements.slice(0, 5)
    };
  }, [state]);

  return {
    // State
    ...state,
    
    // Core functions
    announceToScreenReader,
    focusManagement,
    
    // Preferences
    updatePreferences,
    setFocusMode,
    
    // Skip links
    addSkipLink,
    removeSkipLink,
    
    // Utils
    getFocusableElements,
    getAccessibilityStatus,
    
    // Helpers
    isAccessibilityActive: state.isScreenReaderActive || state.preferences.keyboardNavigation,
    shouldReduceMotion: state.preferences.reducedMotion,
    isTherapeuticMode: state.preferences.therapeuticMode,
    isCrisisMode: state.preferences.crisisAccessibility,
    isFocusMode: state.preferences.focusMode
  };
};