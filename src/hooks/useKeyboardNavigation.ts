/**
 * Mental Health Platform - Enhanced Keyboard Navigation Hook
 * 
 * Provides comprehensive keyboard navigation utilities optimized for mental health applications
 * with crisis-aware shortcuts, accessibility enhancements, and therapeutic interaction patterns.
 * 
 * Features:
 * - WCAG 2.1 AA+ compliant navigation
 * - Crisis emergency shortcuts (Ctrl+Shift+E for emergency)
 * - Anxiety-reducing navigation patterns
 * - Motor disability accommodations
 * - Therapeutic breathing cues during navigation
 * - Screen reader optimization for mental health content
 * 
 * @version 2.0.0 - Mental Health Specialized
 * @accessibility Enhanced WCAG compliance with mental health considerations
 * @safety Crisis-aware keyboard shortcuts and emergency navigation
 * @therapeutic Mindful navigation patterns and stress-reducing interactions
 */

import { useEffect, useCallback, useRef, useState } from 'react';

interface KeyboardNavigationOptions {
  // Core navigation settings
  orientation?: 'horizontal' | 'vertical' | 'both';
  wrap?: boolean;
  homeEndKeys?: boolean;
  preventDefaultOnHandled?: boolean;
  
  // Enhanced accessibility features
  accessibilityMode?: 'standard' | 'enhanced' | 'crisis-aware';
  motorAssistance?: {
    slowNavigation?: boolean;
    confirmationRequired?: boolean;
    stickyKeys?: boolean;
    reducedKeyRepeat?: boolean;
  };
  
  // Mental health specific features
  crisisAware?: boolean;
  emergencyShortcuts?: {
    emergency?: string; // Default: 'Ctrl+Shift+E'
    crisis?: string;    // Default: 'Ctrl+Shift+C'
    safety?: string;    // Default: 'Ctrl+Shift+S'
    help?: string;      // Default: 'F1'
  };
  therapeuticNavigation?: {
    mindfulFocus?: boolean;
    breathingCues?: boolean;
    stressReduction?: boolean;
    gentleTransitions?: boolean;
  };
  
  // Anxiety support features
  anxietySupport?: {
    reduceAnimations?: boolean;
    provideFeedback?: boolean;
    confirmBeforeAction?: boolean;
    safeExitOptions?: boolean;
  };
  
  // Standard options with enhancements
  onKeyDown?: (event: KeyboardEvent, currentIndex: number) => boolean | void;
  onSelectionChange?: (index: number, element: HTMLElement) => void;
  
  // Mental health callbacks
  onEmergencyShortcut?: (shortcutType: string) => void;
  onCrisisDetected?: (severity: 'low' | 'medium' | 'high') => void;
  onTherapeuticAction?: (action: string, data: any) => void;
  onAccessibilityAction?: (action: string, element: HTMLElement) => void;
  
  // Enhanced configuration
  enabledKeys?: string[];
  disabledKeys?: string[];
  selector?: string;
  autoFocus?: boolean;
  trapFocus?: boolean;
  
  // Screen reader optimizations
  screenReaderOptimized?: boolean;
  announceChanges?: boolean;
  contextualHelp?: boolean;
}

interface KeyboardNavigationReturn {
  // Core navigation functions
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  containerRef: React.RefObject<HTMLElement>;
  elementRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  
  // Mental health platform additions
  accessibility: {
    isEnhancedMode: boolean;
    motorAssistanceActive: boolean;
    screenReaderActive: boolean;
    currentSensitivity: 'low' | 'medium' | 'high';
  };
  
  crisis: {
    isArmed: boolean;
    detectionEnabled: boolean;
    lastEmergencyTime: number;
    safeExitAvailable: boolean;
  };
  
  therapeutic: {
    mindfulModeActive: boolean;
    breathingCueEnabled: boolean;
    stressLevel: number;
    navigationCount: number;
  };
  
  // Enhanced functions
  emergencyExit: () => void;
  activateCrisisMode: () => void;
  enableMindfulNavigation: (enabled: boolean) => void;
  announceCurrentFocus: () => void;
  getNavigationStats: () => NavigationStats;
}

interface NavigationStats {
  totalNavigations: number;
  averageTimePerNavigation: number;
  stressIndicators: number;
  therapeuticInteractions: number;
  emergencyActivations: number;
}

export const useKeyboardNavigation = (
  options: KeyboardNavigationOptions = {}
): KeyboardNavigationReturn => {
  const {
    // Core options
    orientation = 'vertical',
    wrap = true,
    homeEndKeys = true,
    preventDefaultOnHandled = true,
    
    // Enhanced accessibility
    accessibilityMode = 'standard',
    motorAssistance = {},
    
    // Mental health features
    crisisAware = true,
    emergencyShortcuts = {
      emergency: 'Ctrl+Shift+E',
      crisis: 'Ctrl+Shift+C',
      safety: 'Ctrl+Shift+S',
      help: 'F1'
    },
    therapeuticNavigation = {},
    anxietySupport = {},
    
    // Callbacks
    onKeyDown,
    onSelectionChange,
    onEmergencyShortcut,
    onCrisisDetected,
    onTherapeuticAction,
    onAccessibilityAction,
    
    // Standard options
    enabledKeys = [],
    disabledKeys = [],
    selector = '[role="menuitem"], [role="option"], [role="tab"], button:not([disabled]), [tabindex="0"]',
    autoFocus = false,
    trapFocus = false,
    
    // Screen reader
    screenReaderOptimized = false,
    announceChanges = false,
    contextualHelp = false
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const elementRefs = useRef<(HTMLElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // Mental health platform state
  const navigationStats = useRef<NavigationStats>({
    totalNavigations: 0,
    averageTimePerNavigation: 0,
    stressIndicators: 0,
    therapeuticInteractions: 0,
    emergencyActivations: 0
  });
  
  const lastNavigationTime = useRef<number>(0);
  const emergencyModeRef = useRef<boolean>(false);
  const mindfulModeRef = useRef<boolean>(therapeuticNavigation?.mindfulFocus || false);
  const stressLevelRef = useRef<number>(0);
  const keyPressTimings = useRef<number[]>([]);

  // Enhanced navigable elements detection with mental health considerations
  const getNavigableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const elements = Array.from(containerRef.current.querySelectorAll(selector)) as HTMLElement[];
    return elements.filter(element => {
      // Skip hidden elements
      if (element.offsetParent === null) return false;
      
      // Skip disabled elements
      if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
        return false;
      }
      
      // Crisis-aware filtering - skip potentially triggering elements during crisis
      if (emergencyModeRef.current && element.hasAttribute('data-crisis-skip')) {
        return false;
      }
      
      // Anxiety support - skip complex elements if anxiety support is enabled
      if (anxietySupport?.reduceAnimations && element.hasAttribute('data-complex-animation')) {
        return false;
      }
      
      // Skip elements with negative tabindex (unless specifically included)
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) < 0) return false;
      
      return true;
    });
  }, [selector, anxietySupport]);
  
  // Therapeutic breathing cue function
  const triggerBreathingCue = useCallback(() => {
    if (therapeuticNavigation?.breathingCues && onTherapeuticAction) {
      onTherapeuticAction('breathing-cue', {
        type: 'gentle-reminder',
        duration: 3000,
        pattern: 'in-4-hold-4-out-6'
      });
    }
  }, [therapeuticNavigation, onTherapeuticAction]);
  
  // Stress detection from navigation patterns
  const detectStressFromNavigation = useCallback((timeSinceLastNav: number) => {
    keyPressTimings.current.push(timeSinceLastNav);
    
    // Keep only last 10 timings
    if (keyPressTimings.current.length > 10) {
      keyPressTimings.current.shift();
    }
    
    // Calculate stress indicators
    const avgTiming = keyPressTimings.current.reduce((a, b) => a + b, 0) / keyPressTimings.current.length;
    const rapidNavigation = avgTiming < 200; // Very fast navigation
    const erraticPattern = keyPressTimings.current.some((time, i, arr) => 
      i > 0 && Math.abs(time - arr[i-1]) > 500
    );
    
    let newStressLevel = stressLevelRef.current;
    if (rapidNavigation) newStressLevel += 0.2;
    if (erraticPattern) newStressLevel += 0.3;
    
    newStressLevel = Math.max(0, Math.min(10, newStressLevel - 0.1)); // Gradual decrease
    stressLevelRef.current = newStressLevel;
    
    // Trigger crisis detection if stress is high
    if (crisisAware && newStressLevel > 7 && onCrisisDetected) {
      const severity = newStressLevel > 9 ? 'high' : newStressLevel > 8 ? 'medium' : 'low';
      onCrisisDetected(severity);
    }
    
    return newStressLevel;
  }, [crisisAware, onCrisisDetected]);

  // Update element refs when container changes
  useEffect(() => {
    const elements = getNavigableElements();
    elementRefs.current = elements;
    
    // Auto-focus first element if enabled and no current focus
    if (autoFocus && elements.length > 0 && currentIndex === -1) {
      setCurrentIndex(0);
      elements[0]?.focus();
    }
  }, [getNavigableElements, autoFocus, currentIndex]);

  // Enhanced focus management with mental health features
  const focusElement = useCallback((index: number) => {
    const elements = elementRefs.current;
    if (index >= 0 && index < elements.length && elements[index]) {
      const element = elements[index]!;
      
      // Track navigation timing for stress detection
      const currentTime = Date.now();
      if (lastNavigationTime.current > 0) {
        const timeDiff = currentTime - lastNavigationTime.current;
        detectStressFromNavigation(timeDiff);
      }
      lastNavigationTime.current = currentTime;
      
      // Apply therapeutic navigation if enabled
      if (mindfulModeRef.current) {
        // Add slight delay for mindful navigation
        setTimeout(() => {
          element.focus();
          triggerBreathingCue();
        }, 150);
        
        if (onTherapeuticAction) {
          onTherapeuticAction('mindful-focus', {
            element: element.tagName,
            index,
            stressLevel: stressLevelRef.current
          });
        }
      } else {
        element.focus();
      }
      
      // Accessibility announcements
      if (announceChanges && onAccessibilityAction) {
        onAccessibilityAction('focus-changed', element);
      }
      
      // Screen reader optimization
      if (screenReaderOptimized) {
        // Add ARIA live region announcement
        const liveRegion = document.getElementById('navigation-announcer');
        if (liveRegion) {
          liveRegion.textContent = `Focused on ${element.getAttribute('aria-label') || element.textContent || element.tagName}`;
        }
      }
      
      setCurrentIndex(index);
      onSelectionChange?.(index, element);
      
      // Update navigation stats
      navigationStats.current.totalNavigations++;
    }
  }, [onSelectionChange, detectStressFromNavigation, triggerBreathingCue, announceChanges, screenReaderOptimized, onAccessibilityAction, onTherapeuticAction]);

  const focusNext = useCallback(() => {
    const elements = elementRefs.current;
    if (elements.length === 0) return;

    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= elements.length) {
      nextIndex = wrap ? 0 : elements.length - 1;
    }
    
    // Motor assistance - confirm before navigation if required
    if (motorAssistance?.confirmationRequired) {
      // Would typically show a confirmation dialog
      // For now, just add a delay to prevent accidental navigation
      setTimeout(() => focusElement(nextIndex), 200);
    } else {
      focusElement(nextIndex);
    }
  }, [currentIndex, focusElement, wrap, motorAssistance]);

  const focusPrevious = useCallback(() => {
    const elements = elementRefs.current;
    if (elements.length === 0) return;

    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = wrap ? elements.length - 1 : 0;
    }
    
    // Motor assistance - confirm before navigation if required
    if (motorAssistance?.confirmationRequired) {
      setTimeout(() => focusElement(prevIndex), 200);
    } else {
      focusElement(prevIndex);
    }
  }, [currentIndex, focusElement, wrap, motorAssistance]);

  const focusFirst = useCallback(() => {
    const elements = elementRefs.current;
    if (elements.length > 0) {
      focusElement(0);
    }
  }, [focusElement]);

  const focusLast = useCallback(() => {
    const elements = elementRefs.current;
    if (elements.length > 0) {
      focusElement(elements.length - 1);
    }
  }, [focusElement]);

  // Enhanced keyboard event handling with mental health features
  const handleKeyDown = useCallback((event: React.KeyboardEvent | KeyboardEvent) => {
    const elements = elementRefs.current;
    if (elements.length === 0) return;

    const key = event.key;
    const isCtrl = event.ctrlKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;
    
    // Emergency shortcuts handling (highest priority)
    if (crisisAware && onEmergencyShortcut) {
      const shortcutKey = `${isCtrl ? 'Ctrl+' : ''}${isShift ? 'Shift+' : ''}${isAlt ? 'Alt+' : ''}${key}`;
      
      if (shortcutKey === emergencyShortcuts.emergency) {
        event.preventDefault();
        emergencyModeRef.current = true;
        onEmergencyShortcut('emergency');
        navigationStats.current.emergencyActivations++;
        return;
      }
      
      if (shortcutKey === emergencyShortcuts.crisis) {
        event.preventDefault();
        onEmergencyShortcut('crisis');
        return;
      }
      
      if (shortcutKey === emergencyShortcuts.safety) {
        event.preventDefault();
        onEmergencyShortcut('safety');
        return;
      }
      
      if (key === 'F1' || shortcutKey === emergencyShortcuts.help) {
        event.preventDefault();
        onEmergencyShortcut('help');
        return;
      }
    }
    
    // Check if key is disabled
    if (disabledKeys.includes(key)) return;
    
    // Check if only specific keys are enabled
    if (enabledKeys.length > 0 && !enabledKeys.includes(key)) return;

    let handled = false;

    // Allow custom key handling first
    if (onKeyDown) {
      const result = onKeyDown(event as KeyboardEvent, currentIndex);
      if (result === false) return; // Explicitly prevented
    }

    // Handle navigation keys with mental health considerations
    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          if (motorAssistance?.slowNavigation) {
            setTimeout(() => focusNext(), 100);
          } else {
            focusNext();
          }
          handled = true;
        }
        break;
        
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          if (motorAssistance?.slowNavigation) {
            setTimeout(() => focusPrevious(), 100);
          } else {
            focusPrevious();
          }
          handled = true;
        }
        break;
        
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          if (motorAssistance?.slowNavigation) {
            setTimeout(() => focusNext(), 100);
          } else {
            focusNext();
          }
          handled = true;
        }
        break;
        
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          if (motorAssistance?.slowNavigation) {
            setTimeout(() => focusPrevious(), 100);
          } else {
            focusPrevious();
          }
          handled = true;
        }
        break;
        
      case 'Home':
        if (homeEndKeys) {
          focusFirst();
          handled = true;
        }
        break;
        
      case 'End':
        if (homeEndKeys) {
          focusLast();
          handled = true;
        }
        break;
        
      case 'Tab':
        // Handle focus trapping
        if (trapFocus) {
          if (event.shiftKey) {
            if (currentIndex === 0) {
              focusLast();
              handled = true;
            }
          } else {
            if (currentIndex === elements.length - 1) {
              focusFirst();
              handled = true;
            }
          }
        } else {
          // Update current index based on focus change
          const activeElement = document.activeElement as HTMLElement;
          const newIndex = elements.indexOf(activeElement);
          if (newIndex >= 0) {
            setCurrentIndex(newIndex);
          }
        }
        break;
        
      case 'Escape':
        // Enhanced escape handling with anxiety support
        if (anxietySupport?.safeExitOptions && currentIndex >= 0) {
          // Provide gentle exit with confirmation
          if (onTherapeuticAction) {
            onTherapeuticAction('safe-exit-requested', {
              currentElement: elements[currentIndex]?.tagName,
              stressLevel: stressLevelRef.current
            });
          }
        }
        
        if (currentIndex >= 0) {
          (elements[currentIndex] as HTMLElement)?.blur();
          setCurrentIndex(-1);
          handled = true;
          
          // Reset emergency mode on escape
          emergencyModeRef.current = false;
        }
        break;
        
      // Therapeutic shortcuts
      case 'm':
      case 'M':
        if (isCtrl && !isShift) {
          // Ctrl+M - Toggle mindful mode
          event.preventDefault();
          mindfulModeRef.current = !mindfulModeRef.current;
          if (onTherapeuticAction) {
            onTherapeuticAction('mindful-mode-toggle', {
              enabled: mindfulModeRef.current,
              stressLevel: stressLevelRef.current
            });
          }
          handled = true;
        }
        break;
        
      case 'b':
      case 'B':
        if (isCtrl && !isShift) {
          // Ctrl+B - Breathing exercise
          event.preventDefault();
          triggerBreathingCue();
          handled = true;
        }
        break;
    }

    // Prevent default if we handled the key
    if (handled && preventDefaultOnHandled) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Update therapeutic interactions counter
    if (handled && (key.startsWith('Arrow') || key === 'Tab')) {
      navigationStats.current.therapeuticInteractions++;
    }
  }, [
    currentIndex,
    orientation,
    homeEndKeys,
    trapFocus,
    wrap,
    preventDefaultOnHandled,
    onKeyDown,
    enabledKeys,
    disabledKeys,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    crisisAware,
    emergencyShortcuts,
    onEmergencyShortcut,
    motorAssistance,
    anxietySupport,
    onTherapeuticAction,
    triggerBreathingCue
  ]);

  // Set up global keyboard listener for container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const keyDownHandler = (event: KeyboardEvent) => {
      // Only handle if focus is within our container
      if (container.contains(document.activeElement)) {
        handleKeyDown(event);
      }
    };

    container.addEventListener('keydown', keyDownHandler);
    
    return () => {
      container.removeEventListener('keydown', keyDownHandler);
    };
  }, [handleKeyDown]);

  // Track focus changes to update current index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const elements = elementRefs.current;
      const index = elements.indexOf(target);
      
      if (index >= 0) {
        setCurrentIndex(index);
        onSelectionChange?.(index, target);
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      // If focus is moving outside the container, reset index
      const relatedTarget = event.relatedTarget as HTMLElement;
      if (!relatedTarget || !container.contains(relatedTarget)) {
        if (!trapFocus) {
          setCurrentIndex(-1);
        }
      }
    };

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);
    
    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, [onSelectionChange, trapFocus]);

  // Enhanced return object with mental health features
  const emergencyExit = useCallback(() => {
    emergencyModeRef.current = false;
    setCurrentIndex(-1);
    if (currentIndex >= 0 && elementRefs.current[currentIndex]) {
      elementRefs.current[currentIndex]?.blur();
    }
    onEmergencyShortcut?.('emergency-exit');
  }, [currentIndex, onEmergencyShortcut]);
  
  const activateCrisisMode = useCallback(() => {
    emergencyModeRef.current = true;
    stressLevelRef.current = 10;
    onCrisisDetected?.('high');
  }, [onCrisisDetected]);
  
  const enableMindfulNavigation = useCallback((enabled: boolean) => {
    mindfulModeRef.current = enabled;
    if (onTherapeuticAction) {
      onTherapeuticAction('mindful-navigation', { enabled });
    }
  }, [onTherapeuticAction]);
  
  const announceCurrentFocus = useCallback(() => {
    if (currentIndex >= 0 && elementRefs.current[currentIndex]) {
      const element = elementRefs.current[currentIndex]!;
      const announcement = element.getAttribute('aria-label') || element.textContent || element.tagName;
      if (onAccessibilityAction) {
        onAccessibilityAction('announce-focus', element);
      }
      // Also update live region for screen readers
      if (screenReaderOptimized) {
        const liveRegion = document.getElementById('navigation-announcer');
        if (liveRegion) {
          liveRegion.textContent = `Currently focused: ${announcement}`;
        }
      }
    }
  }, [currentIndex, onAccessibilityAction, screenReaderOptimized]);
  
  const getNavigationStats = useCallback((): NavigationStats => {
    return { ...navigationStats.current };
  }, []);

  return {
    // Core functionality
    currentIndex,
    setCurrentIndex: (index: number) => {
      if (index >= 0 && index < elementRefs.current.length) {
        focusElement(index);
      }
    },
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    handleKeyDown,
    containerRef,
    elementRefs,
    
    // Mental health platform additions
    accessibility: {
      isEnhancedMode: accessibilityMode !== 'standard',
      motorAssistanceActive: Object.keys(motorAssistance).length > 0,
      screenReaderActive: screenReaderOptimized,
      currentSensitivity: motorAssistance?.slowNavigation ? 'high' : 'medium'
    },
    
    crisis: {
      isArmed: crisisAware,
      detectionEnabled: crisisAware,
      lastEmergencyTime: lastNavigationTime.current,
      safeExitAvailable: anxietySupport?.safeExitOptions || false
    },
    
    therapeutic: {
      mindfulModeActive: mindfulModeRef.current,
      breathingCueEnabled: therapeuticNavigation?.breathingCues || false,
      stressLevel: stressLevelRef.current,
      navigationCount: navigationStats.current.totalNavigations
    },
    
    // Enhanced functions
    emergencyExit,
    activateCrisisMode,
    enableMindfulNavigation,
    announceCurrentFocus,
    getNavigationStats
  };
};

// Specialized hooks for common use cases

export const useMenuNavigation = (options: Omit<KeyboardNavigationOptions, 'selector'> = {}) => {
  return useKeyboardNavigation({
    ...options,
    selector: '[role="menuitem"], [role="option"]',
    orientation: 'vertical',
    trapFocus: true
  });
};

export const useTabNavigation = (options: Omit<KeyboardNavigationOptions, 'selector' | 'orientation'> = {}) => {
  return useKeyboardNavigation({
    ...options,
    selector: '[role="tab"]',
    orientation: 'horizontal'
  });
};

export const useGridNavigation = (
  columns: number,
  options: Omit<KeyboardNavigationOptions, 'orientation'> = {}
) => {
  const navigation = useKeyboardNavigation({
    ...options,
    orientation: 'both',
    onKeyDown: (event, currentIndex) => {
      const elements = navigation.elementRefs.current;
      const rows = Math.ceil(elements.length / columns);
      const currentRow = Math.floor(currentIndex / columns);
      const currentCol = currentIndex % columns;

      switch (event.key) {
        case 'ArrowRight':
          if (currentCol < columns - 1 && currentIndex < elements.length - 1) {
            navigation.setCurrentIndex(currentIndex + 1);
          } else if (options.wrap && currentRow < rows - 1) {
            // Wrap to next row
            navigation.setCurrentIndex((currentRow + 1) * columns);
          }
          return false; // Prevent default handling
          
        case 'ArrowLeft':
          if (currentCol > 0) {
            navigation.setCurrentIndex(currentIndex - 1);
          } else if (options.wrap && currentRow > 0) {
            // Wrap to previous row
            navigation.setCurrentIndex(currentRow * columns - 1);
          }
          return false;
          
        case 'ArrowDown':
          const nextRowIndex = currentIndex + columns;
          if (nextRowIndex < elements.length) {
            navigation.setCurrentIndex(nextRowIndex);
          } else if (options.wrap) {
            // Wrap to first row
            navigation.setCurrentIndex(currentCol);
          }
          return false;
          
        case 'ArrowUp':
          const prevRowIndex = currentIndex - columns;
          if (prevRowIndex >= 0) {
            navigation.setCurrentIndex(prevRowIndex);
          } else if (options.wrap) {
            // Wrap to last row
            const lastRowStart = (rows - 1) * columns;
            const targetIndex = Math.min(lastRowStart + currentCol, elements.length - 1);
            navigation.setCurrentIndex(targetIndex);
          }
          return false;
      }
      
      // Allow default handling for other keys
      return options.onKeyDown?.(event, currentIndex);
    }
  });

  return navigation;
};

// Mental Health Platform - Enhanced Crisis Navigation Hooks

interface CrisisNavigationActions {
  onEmergencyCall?: () => void;
  onCrisisChat?: () => void;
  onSafetyPlan?: () => void;
  onHelpModal?: () => void;
  onBreathingExercise?: () => void;
  onGroundingTechnique?: () => void;
  onCalmingMusic?: () => void;
  onTherapistContact?: () => void;
}

export const useCrisisNavigationShortcuts = (actions: CrisisNavigationActions) => {
  const [crisisLevel, setCrisisLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const emergencySequenceRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Crisis shortcuts (Ctrl+Shift+key) - Enhanced with more options
      if (event.ctrlKey && event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case 'e': // Emergency
            event.preventDefault();
            setCrisisLevel('high');
            actions.onEmergencyCall?.();
            break;
          case 'c': // Crisis chat
            event.preventDefault();
            setCrisisLevel('medium');
            actions.onCrisisChat?.();
            break;
          case 's': // Safety plan
            event.preventDefault();
            actions.onSafetyPlan?.();
            break;
          case 'h': // Help
            event.preventDefault();
            actions.onHelpModal?.();
            break;
          case 'b': // Breathing exercise
            event.preventDefault();
            setCrisisLevel('low');
            actions.onBreathingExercise?.();
            break;
          case 'g': // Grounding technique
            event.preventDefault();
            actions.onGroundingTechnique?.();
            break;
          case 'm': // Calming music
            event.preventDefault();
            actions.onCalmingMusic?.();
            break;
          case 't': // Therapist contact
            event.preventDefault();
            setCrisisLevel('medium');
            actions.onTherapistContact?.();
            break;
        }
      }

      // Quick emergency shortcut (F1) - Enhanced with context
      if (event.key === 'F1') {
        event.preventDefault();
        actions.onHelpModal?.();
      }
      
      // Panic sequence detection (rapid key presses)
      const timeSinceLastKey = currentTime - lastKeyTimeRef.current;
      if (timeSinceLastKey < 200) { // Very rapid typing
        emergencySequenceRef.current.push(event.key);
        if (emergencySequenceRef.current.length > 5) {
          emergencySequenceRef.current.shift();
        }
        
        // Detect panic patterns (repeated keys, random mashing)
        const hasRepeatedKeys = emergencySequenceRef.current.some((key, i, arr) => 
          arr.filter(k => k === key).length > 2
        );
        
        if (hasRepeatedKeys && emergencySequenceRef.current.length >= 4) {
          setCrisisLevel('high');
          // Auto-trigger help after panic detection
          setTimeout(() => {
            actions.onHelpModal?.();
          }, 1000);
        }
      } else {
        // Reset sequence if typing slows down
        emergencySequenceRef.current = [];
      }
      
      lastKeyTimeRef.current = currentTime;
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [actions]);
  
  return {
    crisisLevel,
    setCrisisLevel,
    resetCrisisLevel: () => setCrisisLevel('none')
  };
};

export const useAccessibilityNavigation = () => {
  const [skipLinksVisible, setSkipLinksVisible] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [focusTrail, setFocusTrail] = useState<HTMLElement[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Detect user's motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show skip links on first Tab
      if (event.key === 'Tab' && !skipLinksVisible) {
        setSkipLinksVisible(true);
      }
      
      // Enhanced keyboard navigation for mental health content
      if (event.key === 'Tab') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          setFocusTrail(prev => {
            const newTrail = [...prev, activeElement].slice(-5); // Keep last 5 elements
            return newTrail;
          });
          
          // Announce mental health specific elements
          if (activeElement.hasAttribute('data-mental-health-element')) {
            const elementType = activeElement.getAttribute('data-mental-health-element');
            const announcement = `Mental health ${elementType} - ${activeElement.getAttribute('aria-label') || activeElement.textContent}`;
            setAnnouncements(prev => [...prev, announcement].slice(-3));
          }
        }
      }
    };

    const handleClick = () => {
      // Hide skip links on click
      if (skipLinksVisible) {
        setSkipLinksVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [skipLinksVisible]);

  const skipToMain = useCallback(() => {
    const main = document.querySelector('main, #main, [role="main"]') as HTMLElement;
    if (main) {
      main.focus();
      main.scrollIntoView({ 
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      setAnnouncements(prev => [...prev, 'Navigated to main content'].slice(-3));
    }
  }, [reduceMotion]);

  const skipToNavigation = useCallback(() => {
    const nav = document.querySelector('nav, [role="navigation"]') as HTMLElement;
    if (nav) {
      nav.focus();
      nav.scrollIntoView({ 
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      setAnnouncements(prev => [...prev, 'Navigated to main navigation'].slice(-3));
    }
  }, [reduceMotion]);
  
  const skipToCrisisResources = useCallback(() => {
    const crisisSection = document.querySelector('[data-crisis-resources], #crisis-resources') as HTMLElement;
    if (crisisSection) {
      crisisSection.focus();
      crisisSection.scrollIntoView({ 
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      setAnnouncements(prev => [...prev, 'Navigated to crisis resources - immediate help available'].slice(-3));
    }
  }, [reduceMotion]);
  
  const skipToTherapeuticTools = useCallback(() => {
    const toolsSection = document.querySelector('[data-therapeutic-tools], #therapeutic-tools') as HTMLElement;
    if (toolsSection) {
      toolsSection.focus();
      toolsSection.scrollIntoView({ 
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      setAnnouncements(prev => [...prev, 'Navigated to therapeutic tools and exercises'].slice(-3));
    }
  }, [reduceMotion]);

  const goBackInFocusTrail = useCallback(() => {
    if (focusTrail.length > 1) {
      const previousElement = focusTrail[focusTrail.length - 2];
      if (previousElement && document.contains(previousElement)) {
        previousElement.focus();
        setFocusTrail(prev => prev.slice(0, -1));
        setAnnouncements(prev => [...prev, 'Returned to previous focus'].slice(-3));
      }
    }
  }, [focusTrail]);

  return {
    skipLinksVisible,
    skipToMain,
    skipToNavigation,
    skipToCrisisResources,
    skipToTherapeuticTools,
    goBackInFocusTrail,
    announcements,
    focusTrail,
    reduceMotion
  };
};

export default useKeyboardNavigation;

