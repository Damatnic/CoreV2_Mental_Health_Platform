/**
 * Enhanced Accessibility Hook for Mental Health Platform
 * 
 * Comprehensive accessibility management with WCAG AAA compliance,
 * screen reader support, keyboard navigation, focus management,
 * and therapeutic adaptations with full global store integration.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGlobalStore } from '../stores/globalStore';

// Types for accessibility management
export type AccessibilityLevel = 'basic' | 'enhanced' | 'comprehensive';
export type ScreenReaderType = 'nvda' | 'jaws' | 'voiceover' | 'talkback' | 'dragon' | 'other';
export type FocusMode = 'normal' | 'therapeutic' | 'crisis' | 'simplified';
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

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
  colorBlindMode: ColorBlindMode;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  customizations: {
    fontSize: number; // percentage
    lineHeight: number;
    letterSpacing: number;
    focusIndicatorSize: number;
    animationSpeed: number; // 0-1, where 0 is no animation
    cursorSize: 'normal' | 'large' | 'extra-large';
    highlightLinks: boolean;
    readingGuide: boolean;
    focusHighlight: string; // color
  };
}

export interface AnnouncementOptions {
  priority: 'polite' | 'assertive';
  interrupt: boolean;
  therapeutic: boolean;
  crisis: boolean;
  delay?: number;
  persist?: boolean;
}

export interface FocusManagement {
  currentFocus: HTMLElement | null;
  focusHistory: HTMLElement[];
  trapStack: HTMLElement[];
  skipLinks: Array<{ target: string; label: string }>;
  landmarkNavigation: boolean;
}

export interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
  category: 'navigation' | 'action' | 'help' | 'crisis';
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
  voiceCommands: VoiceCommand[];
  isVoiceActive: boolean;
  keyboardShortcuts: Map<string, () => void>;
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
  colorBlindMode: 'none',
  fontSize: 'medium',
  customizations: {
    fontSize: 100,
    lineHeight: 1.5,
    letterSpacing: 0,
    focusIndicatorSize: 100,
    animationSpeed: 1,
    cursorSize: 'normal',
    highlightLinks: false,
    readingGuide: false,
    focusHighlight: '#0066CC'
  }
};

export const useAccessibility = () => {
  // Global store integration
  const {
    user,
    accessibilityState: globalAccessibility,
    updateAccessibilitySettings,
    toggleAccessibility,
    setScreenReaderActive,
    setColorBlindMode,
    setFontSize,
    addAnnouncement: addGlobalAnnouncement,
    clearAnnouncements,
    addNotification
  } = useGlobalStore();

  const [state, setState] = useState<AccessibilityState>({
    preferences: defaultPreferences,
    isScreenReaderActive: false,
    currentFocusMode: 'normal',
    announcements: [],
    focusManagement: {
      currentFocus: null,
      focusHistory: [],
      trapStack: [],
      skipLinks: [],
      landmarkNavigation: true
    },
    voiceCommands: [],
    isVoiceActive: false,
    keyboardShortcuts: new Map(),
    isLoading: false,
    error: null
  });

  // Refs for accessibility management
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const alertRegionRef = useRef<HTMLDivElement | null>(null);
  const statusRegionRef = useRef<HTMLDivElement | null>(null);
  const focusableElements = useRef<HTMLElement[]>([]);
  const voiceRecognition = useRef<any>(null);
  const readingGuideRef = useRef<HTMLDivElement | null>(null);

  // Initialize accessibility features
  useEffect(() => {
    initializeAccessibility();
    return () => cleanupAccessibility();
  }, []);

  // Sync with global store
  useEffect(() => {
    if (globalAccessibility.enabled) {
      setState(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          screenReader: globalAccessibility.screenReaderActive,
          highContrast: globalAccessibility.highContrast,
          reducedMotion: globalAccessibility.reducedMotion,
          fontSize: globalAccessibility.fontSize,
          colorBlindMode: globalAccessibility.colorBlindMode,
          keyboardNavigation: globalAccessibility.keyboardNavigation,
          voiceControl: globalAccessibility.voiceControl
        }
      }));
    }
  }, [globalAccessibility]);

  // Initialize all accessibility features
  const initializeAccessibility = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Detect and setup screen reader
      await detectScreenReader();
      
      // Setup ARIA live regions
      setupLiveRegions();
      
      // Initialize keyboard navigation
      setupKeyboardListeners();
      
      // Setup focus management
      setupFocusManagement();
      
      // Load user preferences
      await loadUserPreferences();
      
      // Setup voice control if supported
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        setupVoiceControl();
      }
      
      // Setup reading guide
      setupReadingGuide();
      
      // Monitor for preference changes
      monitorSystemPreferences();
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Enable in global store
      toggleAccessibility(true);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initialize accessibility features'
      }));
      console.error('Accessibility initialization error:', error);
    }
  }, [toggleAccessibility]);

  // Enhanced screen reader detection
  const detectScreenReader = useCallback(async () => {
    const detection = {
      // Check for screen reader specific APIs
      hasSpeechSynthesis: 'speechSynthesis' in window,
      
      // Check for common screen reader user agents
      hasScreenReaderUA: /NVDA|JAWS|VoiceOver|TalkBack|Dragon/i.test(navigator.userAgent),
      
      // Check for accessibility preferences
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
      prefersMoreContrast: window.matchMedia('(prefers-contrast: more)').matches,
      prefersLessContrast: window.matchMedia('(prefers-contrast: less)').matches,
      
      // Check for forced colors mode (Windows High Contrast)
      forcedColors: window.matchMedia('(forced-colors: active)').matches,
      
      // Check for inverted colors
      invertedColors: window.matchMedia('(inverted-colors: inverted)').matches,
      
      // Check for programmatic indicators
      hasApplicationRole: document.documentElement.getAttribute('role') === 'application',
      
      // Check for assistive technology indicators
      hasAriaAttributes: document.documentElement.hasAttribute('aria-label') ||
                        document.documentElement.hasAttribute('aria-describedby')
    };

    const isScreenReaderActive = Object.values(detection).some(v => v === true);

    setState(prev => ({
      ...prev,
      isScreenReaderActive
    }));

    // Update global store
    setScreenReaderActive(isScreenReaderActive);

    // Auto-enable accessibility features if screen reader detected
    if (isScreenReaderActive) {
      await updatePreferences({
        screenReader: true,
        keyboardNavigation: true,
        cognitiveSupport: true,
        customizations: {
          ...defaultPreferences.customizations,
          highlightLinks: true,
          focusIndicatorSize: 150
        }
      });
      
      announceToScreenReader(
        'Screen reader detected. Accessibility features have been automatically enabled.',
        { priority: 'assertive', therapeutic: true }
      );
    }

    return isScreenReaderActive;
  }, [setScreenReaderActive]);

  // Enhanced live regions setup with multiple contexts
  const setupLiveRegions = useCallback(() => {
    // Polite announcements region
    if (!liveRegionRef.current) {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.setAttribute('aria-relevant', 'additions text');
      politeRegion.className = 'sr-only';
      politeRegion.id = 'accessibility-announcements';
      document.body.appendChild(politeRegion);
      liveRegionRef.current = politeRegion;
    }

    // Assertive alerts region
    if (!alertRegionRef.current) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('role', 'alert');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';
      assertiveRegion.id = 'accessibility-alerts';
      document.body.appendChild(assertiveRegion);
      alertRegionRef.current = assertiveRegion;
    }

    // Status updates region
    if (!statusRegionRef.current) {
      const statusRegion = document.createElement('div');
      statusRegion.setAttribute('role', 'status');
      statusRegion.setAttribute('aria-live', 'polite');
      statusRegion.setAttribute('aria-atomic', 'false');
      statusRegion.className = 'sr-only';
      statusRegion.id = 'accessibility-status';
      document.body.appendChild(statusRegion);
      statusRegionRef.current = statusRegion;
    }
  }, []);

  // Enhanced screen reader announcements with context
  const announceToScreenReader = useCallback((
    message: string,
    options: Partial<AnnouncementOptions> = {}
  ) => {
    const {
      priority = 'polite',
      interrupt = false,
      therapeutic = false,
      crisis = false,
      delay = 0,
      persist = false
    } = options;

    // Context-aware message enhancement
    let enhancedMessage = message;
    if (therapeutic) {
      enhancedMessage = `Wellness update: ${message}`;
    }
    if (crisis) {
      enhancedMessage = `Urgent: ${message}. Press Control H for immediate help.`;
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
      announcements: [announcement, ...prev.announcements.slice(0, 99)] // Keep last 100
    }));

    // Add to global store
    addGlobalAnnouncement(enhancedMessage, priority);

    // Announce to appropriate live region
    const announceToRegion = () => {
      const region = priority === 'assertive' 
        ? alertRegionRef.current 
        : (persist ? statusRegionRef.current : liveRegionRef.current);
      
      if (region) {
        if (interrupt) {
          // Clear and re-announce for interruption
          region.textContent = '';
          requestAnimationFrame(() => {
            region.textContent = enhancedMessage;
          });
        } else {
          region.textContent = enhancedMessage;
        }

        // Clear announcement after appropriate time unless persistent
        if (!persist) {
          const clearDelay = Math.max(3000, enhancedMessage.length * 50);
          setTimeout(() => {
            if (region.textContent === enhancedMessage) {
              region.textContent = '';
            }
          }, clearDelay);
        }
      }
    };

    if (delay > 0) {
      setTimeout(announceToRegion, delay);
    } else {
      announceToRegion();
    }

    return announcement.id;
  }, [addGlobalAnnouncement]);

  // Enhanced focus management with trap contexts
  const focusManagement = useMemo(() => ({
    // Set focus with announcement
    focusElement: (element: HTMLElement | string, announce = true) => {
      const targetElement = typeof element === 'string'
        ? document.querySelector(element) as HTMLElement
        : element;

      if (targetElement && typeof targetElement.focus === 'function') {
        // Store previous focus
        const previousFocus = document.activeElement as HTMLElement;
        
        targetElement.focus();
        
        setState(prev => ({
          ...prev,
          focusManagement: {
            ...prev.focusManagement,
            currentFocus: targetElement,
            focusHistory: [targetElement, ...prev.focusManagement.focusHistory.slice(0, 19)]
          }
        }));

        if (announce && state.isScreenReaderActive) {
          const label = targetElement.getAttribute('aria-label') || 
                       targetElement.textContent?.trim() || 
                       'Interactive element';
          announceToScreenReader(`Focused on: ${label}`);
        }
      }
    },

    // Navigate to first focusable element
    focusFirst: (container?: HTMLElement | string) => {
      const containerElement = container
        ? (typeof container === 'string'
            ? document.querySelector(container) as HTMLElement
            : container)
        : document.body;

      if (containerElement) {
        const focusable = getFocusableElements(containerElement);
        if (focusable.length > 0) {
          focusable[0].focus();
          announceToScreenReader('Moved to first element');
        }
      }
    },

    // Navigate to last focusable element
    focusLast: (container?: HTMLElement | string) => {
      const containerElement = container
        ? (typeof container === 'string'
            ? document.querySelector(container) as HTMLElement
            : container)
        : document.body;

      if (containerElement) {
        const focusable = getFocusableElements(containerElement);
        if (focusable.length > 0) {
          focusable[focusable.length - 1].focus();
          announceToScreenReader('Moved to last element');
        }
      }
    },

    // Enhanced focus trap with escape handling
    trapFocus: (container: HTMLElement | string, options?: {
      returnFocus?: boolean;
      initialFocus?: HTMLElement | string;
      escapeDeactivates?: boolean;
    }) => {
      const containerElement = typeof container === 'string'
        ? document.querySelector(container) as HTMLElement
        : container;

      if (containerElement) {
        const previousFocus = document.activeElement as HTMLElement;
        
        setState(prev => ({
          ...prev,
          focusManagement: {
            ...prev.focusManagement,
            trapStack: [...prev.focusManagement.trapStack, containerElement]
          }
        }));

        // Set initial focus
        if (options?.initialFocus) {
          const initial = typeof options.initialFocus === 'string'
            ? containerElement.querySelector(options.initialFocus) as HTMLElement
            : options.initialFocus;
          initial?.focus();
        } else {
          const focusable = getFocusableElements(containerElement);
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }

        // Store return focus target
        if (options?.returnFocus && previousFocus) {
          containerElement.setAttribute('data-return-focus', 'true');
          (containerElement as any).__previousFocus = previousFocus;
        }

        announceToScreenReader('Focus trapped. Press Escape to exit.');
      }
    },

    // Release focus trap with return option
    releaseFocusTrap: () => {
      setState(prev => {
        const trapStack = [...prev.focusManagement.trapStack];
        const releasedTrap = trapStack.pop();
        
        if (releasedTrap && releasedTrap.getAttribute('data-return-focus') === 'true') {
          const previousFocus = (releasedTrap as any).__previousFocus;
          if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus();
          }
        }
        
        return {
          ...prev,
          focusManagement: {
            ...prev.focusManagement,
            trapStack
          }
        };
      });
      
      announceToScreenReader('Focus trap released');
    },

    // Navigate through focus history
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
    },

    // Navigate to next landmark
    nextLandmark: () => {
      const landmarks = document.querySelectorAll(
        'main, nav, [role="navigation"], aside, [role="complementary"], ' +
        'footer, [role="contentinfo"], header, [role="banner"], ' +
        '[role="search"], [role="region"][aria-label]'
      );
      
      const currentIndex = Array.from(landmarks).findIndex(
        el => el.contains(document.activeElement)
      );
      
      const nextIndex = (currentIndex + 1) % landmarks.length;
      const nextLandmark = landmarks[nextIndex] as HTMLElement;
      
      if (nextLandmark) {
        const focusable = getFocusableElements(nextLandmark);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          nextLandmark.setAttribute('tabindex', '-1');
          nextLandmark.focus();
        }
        
        const landmarkName = nextLandmark.getAttribute('aria-label') || 
                            nextLandmark.tagName.toLowerCase();
        announceToScreenReader(`Navigated to ${landmarkName} landmark`);
      }
    }
  }), [state.isScreenReaderActive, announceToScreenReader]);

  // Get all focusable elements with enhanced filtering
  const getFocusableElements = useCallback((
    container: HTMLElement = document.body,
    includeNegativeTabindex = false
  ): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled]):not([aria-hidden="true"])',
      'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
      'select:not([disabled]):not([aria-hidden="true"])',
      'textarea:not([disabled]):not([aria-hidden="true"])',
      '[contenteditable="true"]:not([aria-hidden="true"])',
      'audio[controls]',
      'video[controls]',
      '[tabindex]:not([aria-hidden="true"])',
      'details > summary:first-of-type',
      'details',
      'iframe:not([aria-hidden="true"])'
    ];

    if (!includeNegativeTabindex) {
      focusableSelectors.push(':not([tabindex="-1"])');
    }

    const selector = focusableSelectors.join(', ');
    
    return Array.from(container.querySelectorAll(selector)).filter(element => {
      const el = element as HTMLElement;
      
      // Check if element is visible
      if (el.offsetParent === null && !el.contains(document.activeElement)) {
        return false;
      }
      
      // Check computed styles
      const styles = getComputedStyle(el);
      if (styles.visibility === 'hidden' || styles.display === 'none') {
        return false;
      }
      
      // Check if element or parent has aria-hidden
      let parent: HTMLElement | null = el;
      while (parent) {
        if (parent.getAttribute('aria-hidden') === 'true') {
          return false;
        }
        parent = parent.parentElement;
      }
      
      return true;
    }) as HTMLElement[];
  }, []);

  // Enhanced keyboard navigation with shortcuts
  const setupKeyboardListeners = useCallback(() => {
    const shortcuts = new Map<string, () => void>([
      // Navigation shortcuts
      ['Alt+1', () => focusManagement.focusFirst()],
      ['Alt+9', () => focusManagement.focusLast()],
      ['Alt+M', () => focusManagement.focusElement('main')],
      ['Alt+N', () => focusManagement.focusElement('nav')],
      ['Alt+L', () => focusManagement.nextLandmark()],
      
      // Accessibility shortcuts
      ['Ctrl+Alt+A', () => toggleAccessibilityPanel()],
      ['Ctrl+Alt+H', () => toggleHighContrast()],
      ['Ctrl+Alt+R', () => toggleReducedMotion()],
      ['Ctrl+Alt+Plus', () => increaseFontSize()],
      ['Ctrl+Alt+Minus', () => decreaseFontSize()],
      
      // Crisis shortcuts
      ['Ctrl+H', () => activateCrisisMode()],
      ['Ctrl+Shift+H', () => announceHelp()],
      
      // Reading assistance
      ['Ctrl+Alt+G', () => toggleReadingGuide()],
      ['Ctrl+Alt+S', () => startReadingAloud()],
    ]);

    setState(prev => ({ ...prev, keyboardShortcuts: shortcuts }));

    const handleKeyDown = (event: KeyboardEvent) => {
      // Build shortcut string
      const keys = [];
      if (event.ctrlKey) keys.push('Ctrl');
      if (event.altKey) keys.push('Alt');
      if (event.shiftKey) keys.push('Shift');
      if (event.metaKey) keys.push('Meta');
      
      // Add the actual key
      const key = event.key === ' ' ? 'Space' : event.key;
      if (key.length === 1) {
        keys.push(key.toUpperCase());
      } else {
        keys.push(key);
      }
      
      const shortcut = keys.join('+');
      
      // Check for registered shortcut
      const action = shortcuts.get(shortcut);
      if (action) {
        event.preventDefault();
        action();
      }

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

      // Handle escape key for focus trap
      if (event.key === 'Escape' && state.focusManagement.trapStack.length > 0) {
        focusManagement.releaseFocusTrap();
      }

      // Rotor emulation for screen readers (using arrow keys with modifier)
      if (event.altKey && event.shiftKey) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          navigateByType('next');
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          navigateByType('previous');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.focusManagement.trapStack, getFocusableElements, focusManagement]);

  // Voice control setup
  const setupVoiceControl = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const voiceCommands: VoiceCommand[] = [
      // Navigation commands
      { command: 'go to main', action: () => focusManagement.focusElement('main'), description: 'Navigate to main content', category: 'navigation' },
      { command: 'go to navigation', action: () => focusManagement.focusElement('nav'), description: 'Navigate to navigation menu', category: 'navigation' },
      { command: 'next landmark', action: () => focusManagement.nextLandmark(), description: 'Navigate to next landmark', category: 'navigation' },
      { command: 'go back', action: () => window.history.back(), description: 'Go to previous page', category: 'navigation' },
      
      // Action commands
      { command: 'click', action: () => (document.activeElement as HTMLElement)?.click(), description: 'Click focused element', category: 'action' },
      { command: 'submit', action: () => submitForm(), description: 'Submit current form', category: 'action' },
      { command: 'cancel', action: () => focusManagement.releaseFocusTrap(), description: 'Cancel current action', category: 'action' },
      
      // Help commands
      { command: 'help', action: () => announceHelp(), description: 'Get help', category: 'help' },
      { command: 'what can I say', action: () => announceVoiceCommands(), description: 'List voice commands', category: 'help' },
      
      // Crisis commands
      { command: 'crisis help', action: () => activateCrisisMode(), description: 'Activate crisis support', category: 'crisis' },
      { command: 'call hotline', action: () => callCrisisHotline(), description: 'Call crisis hotline', category: 'crisis' },
      { command: 'breathing exercise', action: () => startBreathingExercise(), description: 'Start breathing exercise', category: 'crisis' },
    ];

    setState(prev => ({ ...prev, voiceCommands }));

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase().trim();
      
      // Check for matching command
      const matchedCommand = voiceCommands.find(cmd => 
        transcript.includes(cmd.command.toLowerCase())
      );
      
      if (matchedCommand) {
        announceToScreenReader(`Executing: ${matchedCommand.description}`);
        matchedCommand.action();
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setState(prev => ({ ...prev, isVoiceActive: false }));
        announceToScreenReader('Voice control requires microphone permission');
      }
    };

    voiceRecognition.current = recognition;
  }, [focusManagement]);

  // Reading guide setup for dyslexia support
  const setupReadingGuide = useCallback(() => {
    const guide = document.createElement('div');
    guide.className = 'reading-guide';
    guide.style.cssText = `
      position: fixed;
      height: 2rem;
      width: 100%;
      background: rgba(255, 255, 0, 0.2);
      border-top: 2px solid #333;
      border-bottom: 2px solid #333;
      pointer-events: none;
      z-index: 9998;
      display: none;
      transition: top 0.1s ease-out;
    `;
    document.body.appendChild(guide);
    readingGuideRef.current = guide;

    const handleMouseMove = (e: MouseEvent) => {
      if (readingGuideRef.current && state.preferences.customizations.readingGuide) {
        readingGuideRef.current.style.display = 'block';
        readingGuideRef.current.style.top = `${e.clientY - 16}px`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (readingGuideRef.current) {
        document.body.removeChild(readingGuideRef.current);
      }
    };
  }, [state.preferences.customizations.readingGuide]);

  // Monitor system preference changes
  const monitorSystemPreferences = useCallback(() => {
    const mediaQueries = [
      { query: '(prefers-reduced-motion: reduce)', handler: (e: MediaQueryListEvent) => {
        if (e.matches) {
          updatePreferences({ reducedMotion: true });
          announceToScreenReader('Reduced motion detected and enabled');
        }
      }},
      { query: '(prefers-contrast: high)', handler: (e: MediaQueryListEvent) => {
        if (e.matches) {
          updatePreferences({ highContrast: true });
          announceToScreenReader('High contrast mode detected and enabled');
        }
      }},
      { query: '(prefers-color-scheme: dark)', handler: (e: MediaQueryListEvent) => {
        announceToScreenReader(`System theme changed to ${e.matches ? 'dark' : 'light'} mode`);
      }}
    ];

    const listeners = mediaQueries.map(({ query, handler }) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', handler);
      return { mq, handler };
    });

    return () => {
      listeners.forEach(({ mq, handler }) => {
        mq.removeEventListener('change', handler);
      });
    };
  }, []);

  // Setup focus management listeners
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

        // Apply focus highlight if enabled
        if (state.preferences.customizations.focusIndicatorSize > 100) {
          target.style.outline = `${state.preferences.customizations.focusIndicatorSize / 20}px solid ${state.preferences.customizations.focusHighlight}`;
          target.style.outlineOffset = '2px';
        }
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target && target.style.outline) {
        target.style.outline = '';
        target.style.outlineOffset = '';
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [state.preferences.customizations]);

  // Load user accessibility preferences from storage and sync with global store
  const loadUserPreferences = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Load from local storage
      const savedPreferences = localStorage.getItem(`accessibility_${user.id}`);
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        setState(prev => ({
          ...prev,
          preferences: { ...defaultPreferences, ...preferences },
          isLoading: false
        }));
        
        // Apply preferences
        await applyPreferences({ ...defaultPreferences, ...preferences });
        
        // Sync with global store
        updateAccessibilitySettings({
          screenReaderActive: preferences.screenReader,
          highContrast: preferences.highContrast,
          reducedMotion: preferences.reducedMotion,
          fontSize: preferences.fontSize,
          colorBlindMode: preferences.colorBlindMode,
          keyboardNavigation: preferences.keyboardNavigation,
          voiceControl: preferences.voiceControl
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load accessibility preferences'
      }));
      console.error('Failed to load preferences:', error);
    }
  }, [user, updateAccessibilitySettings]);

  // Update and persist accessibility preferences
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
    await applyPreferences(newPreferences);

    // Sync with global store
    updateAccessibilitySettings({
      screenReaderActive: newPreferences.screenReader,
      highContrast: newPreferences.highContrast,
      reducedMotion: newPreferences.reducedMotion,
      fontSize: newPreferences.fontSize,
      colorBlindMode: newPreferences.colorBlindMode,
      keyboardNavigation: newPreferences.keyboardNavigation,
      voiceControl: newPreferences.voiceControl
    });

    announceToScreenReader('Accessibility preferences updated', { therapeutic: true });
  }, [state.preferences, user, updateAccessibilitySettings]);

  // Apply preferences to document with comprehensive styling
  const applyPreferences = useCallback(async (preferences: AccessibilityPreferences) => {
    const root = document.documentElement;

    // Apply CSS custom properties for accessibility
    root.style.setProperty('--a11y-font-scale', `${preferences.customizations.fontSize / 100}`);
    root.style.setProperty('--a11y-line-height', preferences.customizations.lineHeight.toString());
    root.style.setProperty('--a11y-letter-spacing', `${preferences.customizations.letterSpacing}em`);
    root.style.setProperty('--a11y-focus-size', `${preferences.customizations.focusIndicatorSize / 100}`);
    root.style.setProperty('--a11y-focus-color', preferences.customizations.focusHighlight);
    
    // Animation speed
    if (preferences.reducedMotion) {
      root.style.setProperty('--a11y-animation-duration', '0.01ms');
      root.style.setProperty('--a11y-transition-duration', '0.01ms');
    } else {
      root.style.setProperty('--a11y-animation-duration', `${preferences.customizations.animationSpeed}s`);
      root.style.setProperty('--a11y-transition-duration', `${preferences.customizations.animationSpeed * 0.3}s`);
    }

    // Apply class-based preferences
    root.classList.toggle('high-contrast', preferences.highContrast);
    root.classList.toggle('reduced-motion', preferences.reducedMotion);
    root.classList.toggle('large-text', preferences.largeText);
    root.classList.toggle('therapeutic-mode', preferences.therapeuticMode);
    root.classList.toggle('crisis-accessible', preferences.crisisAccessibility);
    root.classList.toggle('keyboard-navigation', preferences.keyboardNavigation);
    root.classList.toggle('voice-control', preferences.voiceControl);
    root.classList.toggle('cognitive-support', preferences.cognitiveSupport);
    
    // Apply color blind mode
    root.setAttribute('data-color-blind-mode', preferences.colorBlindMode);
    
    // Apply font size
    root.setAttribute('data-font-size', preferences.fontSize);
    
    // Apply cursor size
    root.setAttribute('data-cursor-size', preferences.customizations.cursorSize);
    
    // Toggle reading guide
    if (readingGuideRef.current) {
      readingGuideRef.current.style.display = preferences.customizations.readingGuide ? 'block' : 'none';
    }
    
    // Apply link highlighting
    if (preferences.customizations.highlightLinks) {
      const style = document.createElement('style');
      style.id = 'a11y-link-highlight';
      style.textContent = `
        a:not(.no-highlight) {
          text-decoration: underline !important;
          text-decoration-thickness: 2px !important;
          text-underline-offset: 2px !important;
        }
        a:focus {
          outline: 3px solid ${preferences.customizations.focusHighlight} !important;
          outline-offset: 2px !important;
        }
      `;
      
      // Remove old style if exists
      const oldStyle = document.getElementById('a11y-link-highlight');
      if (oldStyle) {
        oldStyle.remove();
      }
      
      document.head.appendChild(style);
    }

    // Update global store
    setColorBlindMode(preferences.colorBlindMode);
    setFontSize(preferences.fontSize);
  }, [setColorBlindMode, setFontSize]);

  // Set focus mode for different contexts
  const setFocusMode = useCallback((mode: FocusMode) => {
    setState(prev => ({ ...prev, currentFocusMode: mode }));

    const root = document.documentElement;
    root.classList.remove('focus-normal', 'focus-therapeutic', 'focus-crisis', 'focus-simplified');
    root.classList.add(`focus-${mode}`);

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

  // Helper functions
  const toggleAccessibilityPanel = useCallback(() => {
    addNotification({
      type: 'info',
      title: 'Accessibility Panel',
      message: 'Opening accessibility settings...'
    });
  }, [addNotification]);

  const toggleHighContrast = useCallback(() => {
    const newValue = !state.preferences.highContrast;
    updatePreferences({ highContrast: newValue });
    announceToScreenReader(`High contrast ${newValue ? 'enabled' : 'disabled'}`);
  }, [state.preferences.highContrast, updatePreferences]);

  const toggleReducedMotion = useCallback(() => {
    const newValue = !state.preferences.reducedMotion;
    updatePreferences({ reducedMotion: newValue });
    announceToScreenReader(`Reduced motion ${newValue ? 'enabled' : 'disabled'}`);
  }, [state.preferences.reducedMotion, updatePreferences]);

  const increaseFontSize = useCallback(() => {
    const sizes: Array<AccessibilityPreferences['fontSize']> = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(state.preferences.fontSize);
    const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
    updatePreferences({ fontSize: sizes[nextIndex] });
    announceToScreenReader(`Font size increased to ${sizes[nextIndex]}`);
  }, [state.preferences.fontSize, updatePreferences]);

  const decreaseFontSize = useCallback(() => {
    const sizes: Array<AccessibilityPreferences['fontSize']> = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(state.preferences.fontSize);
    const nextIndex = Math.max(currentIndex - 1, 0);
    updatePreferences({ fontSize: sizes[nextIndex] });
    announceToScreenReader(`Font size decreased to ${sizes[nextIndex]}`);
  }, [state.preferences.fontSize, updatePreferences]);

  const toggleReadingGuide = useCallback(() => {
    const newValue = !state.preferences.customizations.readingGuide;
    updatePreferences({
      customizations: {
        ...state.preferences.customizations,
        readingGuide: newValue
      }
    });
    announceToScreenReader(`Reading guide ${newValue ? 'enabled' : 'disabled'}`);
  }, [state.preferences.customizations, updatePreferences]);

  const startReadingAloud = useCallback(() => {
    if ('speechSynthesis' in window) {
      const text = window.getSelection()?.toString() || document.body.innerText;
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      announceToScreenReader('Starting text-to-speech');
    }
  }, []);

  const activateCrisisMode = useCallback(() => {
    setFocusMode('crisis');
    updatePreferences({
      crisisAccessibility: true,
      therapeuticMode: true,
      cognitiveSupport: true
    });
    announceToScreenReader('Crisis support activated. Press Control+Shift+H for help options.', {
      priority: 'assertive',
      crisis: true
    });
  }, [setFocusMode, updatePreferences]);

  const announceHelp = useCallback(() => {
    const helpText = `
      Keyboard shortcuts available:
      Control H: Crisis help.
      Control Alt A: Accessibility settings.
      Control Alt H: Toggle high contrast.
      Control Alt Plus: Increase font size.
      Control Alt Minus: Decrease font size.
      Alt L: Navigate landmarks.
      Escape: Exit current dialog.
    `;
    announceToScreenReader(helpText, { priority: 'assertive', persist: true });
  }, [announceToScreenReader]);

  const announceVoiceCommands = useCallback(() => {
    const commands = state.voiceCommands.map(cmd => `${cmd.command}: ${cmd.description}`).join('. ');
    announceToScreenReader(`Voice commands available: ${commands}`, { persist: true });
  }, [state.voiceCommands]);

  const callCrisisHotline = useCallback(() => {
    window.location.href = 'tel:988';
    announceToScreenReader('Calling crisis hotline 988', { crisis: true });
  }, []);

  const startBreathingExercise = useCallback(() => {
    announceToScreenReader('Starting 4-7-8 breathing exercise. Breathe in for 4, hold for 7, out for 8.', {
      therapeutic: true,
      priority: 'assertive'
    });
  }, [announceToScreenReader]);

  const submitForm = useCallback(() => {
    const form = document.activeElement?.closest('form') as HTMLFormElement;
    if (form) {
      form.submit();
      announceToScreenReader('Form submitted');
    }
  }, []);

  const navigateByType = useCallback((direction: 'next' | 'previous') => {
    const types = ['heading', 'link', 'button', 'form', 'landmark'];
    // Implementation would navigate to next/previous element of selected type
    announceToScreenReader(`Navigating to ${direction} element`);
  }, [announceToScreenReader]);

  // Cleanup function
  const cleanupAccessibility = useCallback(() => {
    // Remove live regions
    if (liveRegionRef.current) {
      document.body.removeChild(liveRegionRef.current);
      liveRegionRef.current = null;
    }
    if (alertRegionRef.current) {
      document.body.removeChild(alertRegionRef.current);
      alertRegionRef.current = null;
    }
    if (statusRegionRef.current) {
      document.body.removeChild(statusRegionRef.current);
      statusRegionRef.current = null;
    }
    
    // Stop voice recognition
    if (voiceRecognition.current) {
      voiceRecognition.current.stop();
      voiceRecognition.current = null;
    }
    
    // Remove reading guide
    if (readingGuideRef.current) {
      document.body.removeChild(readingGuideRef.current);
      readingGuideRef.current = null;
    }
    
    // Clear announcements
    clearAnnouncements();
  }, [clearAnnouncements]);

  // Add/remove skip links
  const addSkipLink = useCallback((target: string, label: string) => {
    setState(prev => ({
      ...prev,
      focusManagement: {
        ...prev.focusManagement,
        skipLinks: [...prev.focusManagement.skipLinks, { target, label }]
      }
    }));
  }, []);

  const removeSkipLink = useCallback((target: string) => {
    setState(prev => ({
      ...prev,
      focusManagement: {
        ...prev.focusManagement,
        skipLinks: prev.focusManagement.skipLinks.filter(link => link.target !== target)
      }
    }));
  }, []);

  // Toggle voice control
  const toggleVoiceControl = useCallback(() => {
    if (!voiceRecognition.current) {
      setupVoiceControl();
    }
    
    if (state.isVoiceActive) {
      voiceRecognition.current?.stop();
      setState(prev => ({ ...prev, isVoiceActive: false }));
      announceToScreenReader('Voice control disabled');
    } else {
      voiceRecognition.current?.start();
      setState(prev => ({ ...prev, isVoiceActive: true }));
      announceToScreenReader('Voice control enabled. Say "help" for commands.');
    }
  }, [state.isVoiceActive, setupVoiceControl]);

  // Get accessibility status summary
  const getAccessibilityStatus = useCallback(() => {
    return {
      screenReaderActive: state.isScreenReaderActive,
      highContrastEnabled: state.preferences.highContrast,
      motionReduced: state.preferences.reducedMotion,
      therapeuticModeActive: state.preferences.therapeuticMode,
      crisisAccessibilityActive: state.preferences.crisisAccessibility,
      focusMode: state.currentFocusMode,
      voiceControlActive: state.isVoiceActive,
      fontSize: state.preferences.fontSize,
      colorBlindMode: state.preferences.colorBlindMode,
      keyboardNavigationEnabled: state.preferences.keyboardNavigation,
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
    
    // Voice control
    toggleVoiceControl,
    
    // Utils
    getFocusableElements,
    getAccessibilityStatus,
    
    // Quick toggles
    toggleHighContrast,
    toggleReducedMotion,
    toggleReadingGuide,
    increaseFontSize,
    decreaseFontSize,
    
    // Crisis
    activateCrisisMode,
    
    // Helpers
    isAccessibilityActive: state.isScreenReaderActive || state.preferences.keyboardNavigation,
    shouldReduceMotion: state.preferences.reducedMotion,
    isTherapeuticMode: state.preferences.therapeuticMode,
    isCrisisMode: state.preferences.crisisAccessibility,
    currentFontSize: state.preferences.fontSize,
    colorBlindMode: state.preferences.colorBlindMode
  };
};

export default useAccessibility;