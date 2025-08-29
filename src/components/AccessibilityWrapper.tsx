/**
 * WCAG AAA Accessibility Wrapper Component
 * 
 * Provides comprehensive accessibility features and enhancements for all child components.
 * Ensures WCAG 2.1 Level AAA compliance with automatic detection and adaptation.
 * 
 * @version 3.0.0
 * @wcag 2.1 Level AAA
 */

import React, { useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { accessibilityService } from '../services/accessibilityService';
import { accessibilityValidator } from '../utils/accessibilityValidator';
import { useAccessibility } from '../hooks/useAccessibility';
import { logger } from '../utils/logger';

interface AccessibilityWrapperProps {
  children: ReactNode;
  /** Enable automatic accessibility validation */
  enableValidation?: boolean;
  /** Show accessibility toolbar */
  showToolbar?: boolean;
  /** Custom accessibility preferences */
  preferences?: Partial<AccessibilityPreferences>;
  /** Crisis mode override */
  crisisMode?: boolean;
  /** Component identifier for analytics */
  componentId?: string;
  /** Accessibility level requirement */
  wcagLevel?: 'A' | 'AA' | 'AAA';
  /** Enable automatic fixes for detected issues */
  autoFix?: boolean;
  /** Custom CSS classes */
  className?: string;
}

interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardOnly: boolean;
  focusIndicator: 'default' | 'enhanced' | 'high-contrast';
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

interface AccessibilityState {
  isInitialized: boolean;
  validationScore: number;
  activeIssues: number;
  lastValidation: Date | null;
  isScreenReaderActive: boolean;
  isKeyboardUser: boolean;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
}

/**
 * WCAG AAA Compliant Accessibility Wrapper
 * Provides comprehensive accessibility features for mental health platform
 */
export const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  enableValidation = true,
  showToolbar = false,
  preferences: customPreferences,
  crisisMode = false,
  componentId,
  wcagLevel = 'AAA',
  autoFix = true,
  className = ''
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const validationTimerRef = useRef<NodeJS.Timeout>();
  const lastMouseMoveRef = useRef<number>(0);
  
  const [state, setState] = useState<AccessibilityState>({
    isInitialized: false,
    validationScore: 100,
    activeIssues: 0,
    lastValidation: null,
    isScreenReaderActive: false,
    isKeyboardUser: false,
    prefersReducedMotion: false,
    prefersHighContrast: false
  });

  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderMode: false,
    keyboardOnly: false,
    focusIndicator: 'enhanced',
    fontSize: 100,
    lineHeight: 1.6,
    letterSpacing: 0.02,
    colorBlindMode: 'none',
    ...customPreferences
  });

  const [toolbarVisible, setToolbarVisible] = useState(showToolbar);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Detect user preferences and capabilities
  useEffect(() => {
    const detectUserPreferences = () => {
      // Detect reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      // Detect color scheme preference
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

      setState(prev => ({
        ...prev,
        prefersReducedMotion,
        prefersHighContrast,
        isInitialized: true
      }));

      // Auto-apply system preferences
      if (prefersReducedMotion) {
        setPreferences(prev => ({ ...prev, reducedMotion: true }));
      }
      if (prefersHighContrast) {
        setPreferences(prev => ({ ...prev, highContrast: true }));
      }
    };

    detectUserPreferences();

    // Listen for preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, prefersReducedMotion: e.matches }));
      if (e.matches) {
        setPreferences(prev => ({ ...prev, reducedMotion: true }));
        announceToScreenReader('Reduced motion enabled');
      }
    };

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, prefersHighContrast: e.matches }));
      if (e.matches) {
        setPreferences(prev => ({ ...prev, highContrast: true }));
        announceToScreenReader('High contrast mode enabled');
      }
    };

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Detect keyboard vs mouse user
  useEffect(() => {
    let keyboardUsed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        keyboardUsed = true;
        if (!state.isKeyboardUser) {
          setState(prev => ({ ...prev, isKeyboardUser: true }));
          announceToScreenReader('Keyboard navigation detected');
        }
      }
    };

    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseMoveRef.current > 50) {
        lastMouseMoveRef.current = now;
        if (state.isKeyboardUser && keyboardUsed) {
          setState(prev => ({ ...prev, isKeyboardUser: false }));
        }
        keyboardUsed = false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [state.isKeyboardUser]);

  // Apply accessibility styles
  useEffect(() => {
    if (!wrapperRef.current) return;

    const wrapper = wrapperRef.current;
    
    // Apply font size
    wrapper.style.setProperty('--accessibility-font-size', `${preferences.fontSize}%`);
    wrapper.style.setProperty('--accessibility-line-height', `${preferences.lineHeight}`);
    wrapper.style.setProperty('--accessibility-letter-spacing', `${preferences.letterSpacing}em`);

    // Apply classes
    wrapper.classList.toggle('high-contrast', preferences.highContrast);
    wrapper.classList.toggle('large-text', preferences.largeText);
    wrapper.classList.toggle('reduced-motion', preferences.reducedMotion);
    wrapper.classList.toggle('keyboard-only', preferences.keyboardOnly);
    wrapper.classList.toggle('screen-reader-mode', preferences.screenReaderMode);
    wrapper.classList.toggle('crisis-mode', crisisMode);
    
    // Apply focus indicator style
    wrapper.setAttribute('data-focus-indicator', preferences.focusIndicator);
    
    // Apply color blind mode
    if (preferences.colorBlindMode !== 'none') {
      wrapper.setAttribute('data-colorblind-mode', preferences.colorBlindMode);
    } else {
      wrapper.removeAttribute('data-colorblind-mode');
    }

    // Update accessibility service preferences
    accessibilityService.updatePreferences({
      highContrast: preferences.highContrast,
      largeText: preferences.largeText,
      reducedMotion: preferences.reducedMotion,
      fontSize: preferences.fontSize,
      lineHeight: preferences.lineHeight,
      letterSpacing: preferences.letterSpacing,
      screenReader: preferences.screenReaderMode,
      keyboardNavigation: preferences.keyboardOnly,
      focusIndicator: preferences.focusIndicator,
      crisisMode
    });

  }, [preferences, crisisMode]);

  // Run accessibility validation
  useEffect(() => {
    if (!enableValidation || !wrapperRef.current) return;

    const runValidation = async () => {
      try {
        const result = await accessibilityValidator.validate(wrapperRef.current!, {
          level: wcagLevel,
          autoFix,
          includeWarnings: true
        });

        setState(prev => ({
          ...prev,
          validationScore: result.score,
          activeIssues: result.issues.length,
          lastValidation: new Date()
        }));

        if (result.issues.length > 0) {
          logger.warn(`Accessibility issues detected in ${componentId || 'component'}`, {
            score: result.score,
            issues: result.issues.length,
            critical: result.issues.filter(i => i.severity === 'critical').length
          });

          // Announce critical issues to screen reader
          const criticalIssues = result.issues.filter(i => i.severity === 'critical');
          if (criticalIssues.length > 0) {
            announceToScreenReader(
              `Warning: ${criticalIssues.length} critical accessibility issues detected`
            );
          }
        }
      } catch (error) {
        logger.error('Accessibility validation failed', error);
      }
    };

    // Run initial validation
    runValidation();

    // Set up periodic validation
    validationTimerRef.current = setInterval(runValidation, 30000); // Every 30 seconds

    return () => {
      if (validationTimerRef.current) {
        clearInterval(validationTimerRef.current);
      }
    };
  }, [enableValidation, wcagLevel, autoFix, componentId]);

  // Keyboard navigation enhancements
  useEffect(() => {
    if (!wrapperRef.current) return;

    const handleKeyNavigation = (e: KeyboardEvent) => {
      // Skip navigation with Alt+S
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const main = wrapperRef.current?.querySelector('main, [role="main"]');
        if (main) {
          (main as HTMLElement).focus();
          announceToScreenReader('Skipped to main content');
        }
      }

      // Toggle accessibility toolbar with Alt+A
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        setToolbarVisible(prev => !prev);
        announceToScreenReader(toolbarVisible ? 'Accessibility toolbar hidden' : 'Accessibility toolbar shown');
      }

      // Crisis mode activation with Ctrl+Shift+H
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        activateCrisisMode();
      }
    };

    document.addEventListener('keydown', handleKeyNavigation);

    return () => {
      document.removeEventListener('keydown', handleKeyNavigation);
    };
  }, [toolbarVisible]);

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message]);
    
    // Clear old announcements
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 5000);
  }, []);

  // Crisis mode activation
  const activateCrisisMode = useCallback(() => {
    logger.info('Crisis mode activated via accessibility wrapper');
    
    // Update preferences for crisis mode
    setPreferences(prev => ({
      ...prev,
      highContrast: true,
      largeText: true,
      focusIndicator: 'high-contrast'
    }));

    // Announce to screen reader
    announceToScreenReader('Crisis mode activated. Emergency resources are now highlighted.', 'assertive');

    // Vibrate if supported (for mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Focus on crisis button if available
    const crisisButton = wrapperRef.current?.querySelector(
      '[data-crisis], [aria-label*="crisis"], .crisis-button'
    ) as HTMLElement;
    if (crisisButton) {
      crisisButton.focus();
    }
  }, [announceToScreenReader]);

  // Preference update handlers
  const updatePreference = useCallback((key: keyof AccessibilityPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    announceToScreenReader(`${key} ${value ? 'enabled' : 'disabled'}`);
  }, [announceToScreenReader]);

  // Render accessibility toolbar
  const renderToolbar = () => {
    if (!toolbarVisible) return null;

    return (
      <div 
        className="accessibility-toolbar"
        role="toolbar"
        aria-label="Accessibility options"
      >
        <button
          onClick={() => updatePreference('highContrast', !preferences.highContrast)}
          aria-pressed={preferences.highContrast}
          aria-label="Toggle high contrast"
        >
          High Contrast
        </button>
        
        <button
          onClick={() => updatePreference('largeText', !preferences.largeText)}
          aria-pressed={preferences.largeText}
          aria-label="Toggle large text"
        >
          Large Text
        </button>
        
        <button
          onClick={() => updatePreference('reducedMotion', !preferences.reducedMotion)}
          aria-pressed={preferences.reducedMotion}
          aria-label="Toggle reduced motion"
        >
          Reduce Motion
        </button>
        
        <label htmlFor="font-size-slider">
          Font Size
          <input
            id="font-size-slider"
            type="range"
            min="80"
            max="200"
            value={preferences.fontSize}
            onChange={(e) => updatePreference('fontSize', parseInt(e.target.value))}
            aria-label="Adjust font size"
            aria-valuemin={80}
            aria-valuemax={200}
            aria-valuenow={preferences.fontSize}
          />
          <span aria-live="polite">{preferences.fontSize}%</span>
        </label>
        
        <select
          value={preferences.colorBlindMode}
          onChange={(e) => updatePreference('colorBlindMode', e.target.value)}
          aria-label="Color blind mode"
        >
          <option value="none">Normal vision</option>
          <option value="protanopia">Protanopia</option>
          <option value="deuteranopia">Deuteranopia</option>
          <option value="tritanopia">Tritanopia</option>
        </select>
        
        <select
          value={preferences.focusIndicator}
          onChange={(e) => updatePreference('focusIndicator', e.target.value)}
          aria-label="Focus indicator style"
        >
          <option value="default">Default focus</option>
          <option value="enhanced">Enhanced focus</option>
          <option value="high-contrast">High contrast focus</option>
        </select>
        
        {state.activeIssues > 0 && (
          <div 
            className="accessibility-status"
            role="status"
            aria-live="polite"
          >
            <span className="warning">
              {state.activeIssues} accessibility {state.activeIssues === 1 ? 'issue' : 'issues'} detected
            </span>
            <span className="score">Score: {state.validationScore}%</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Skip navigation link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Main wrapper */}
      <div
        ref={wrapperRef}
        className={`accessibility-wrapper ${className}`}
        data-accessibility-initialized={state.isInitialized}
        data-keyboard-user={state.isKeyboardUser}
        data-screen-reader={state.isScreenReaderActive}
        data-wcag-level={wcagLevel}
        aria-live="polite"
        aria-relevant="additions"
      >
        {/* Accessibility toolbar */}
        {renderToolbar()}
        
        {/* Screen reader announcements */}
        <div 
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcements.map((announcement, index) => (
            <span key={index}>{announcement}</span>
          ))}
        </div>
        
        {/* Main content */}
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        
        {/* Keyboard instructions (visible only to screen readers) */}
        <div className="sr-only" aria-label="Keyboard shortcuts">
          <h2>Keyboard Shortcuts</h2>
          <ul>
            <li>Alt + S: Skip to main content</li>
            <li>Alt + A: Toggle accessibility toolbar</li>
            <li>Ctrl + Shift + H: Activate crisis mode</li>
            <li>Tab: Navigate through interactive elements</li>
            <li>Escape: Close dialogs and modals</li>
          </ul>
        </div>
      </div>
      
      {/* Crisis mode indicator */}
      {crisisMode && (
        <div 
          className="crisis-mode-indicator"
          role="alert"
          aria-live="assertive"
        >
          Crisis mode active - Emergency resources highlighted
        </div>
      )}
      
      {/* Accessibility styles */}
      <style jsx>{`
        .skip-link {
          position: absolute;
          top: -40px;
          left: 0;
          background: #0066ff;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 0 0 4px 0;
          z-index: 10000;
          font-weight: 600;
        }
        
        .skip-link:focus {
          top: 0;
        }
        
        .accessibility-wrapper {
          position: relative;
          font-size: calc(var(--accessibility-font-size, 100%) * 1%);
          line-height: var(--accessibility-line-height, 1.6);
          letter-spacing: var(--accessibility-letter-spacing, 0.02em);
        }
        
        .accessibility-wrapper.high-contrast {
          filter: contrast(1.2);
        }
        
        .accessibility-wrapper.large-text {
          font-size: 125%;
        }
        
        .accessibility-wrapper.reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .accessibility-wrapper[data-focus-indicator="enhanced"] *:focus {
          outline: 3px solid #0066ff !important;
          outline-offset: 2px !important;
        }
        
        .accessibility-wrapper[data-focus-indicator="high-contrast"] *:focus {
          outline: 4px solid #ff0000 !important;
          outline-offset: 4px !important;
          box-shadow: 0 0 0 8px rgba(255, 0, 0, 0.2) !important;
        }
        
        .accessibility-wrapper.crisis-mode {
          background: linear-gradient(
            180deg,
            rgba(255, 0, 0, 0.05) 0%,
            transparent 100px
          );
        }
        
        .accessibility-wrapper.crisis-mode .crisis-button,
        .accessibility-wrapper.crisis-mode [data-crisis] {
          animation: pulse 1s infinite;
          transform: scale(1.1);
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(255, 0, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
        }
        
        .accessibility-toolbar {
          position: fixed;
          top: 0;
          right: 0;
          background: white;
          border: 2px solid #0066ff;
          border-radius: 0 0 0 8px;
          padding: 16px;
          z-index: 9999;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 300px;
        }
        
        .accessibility-toolbar button {
          min-height: 44px;
          padding: 8px 16px;
          background: #f0f0f0;
          border: 2px solid #333;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }
        
        .accessibility-toolbar button[aria-pressed="true"] {
          background: #0066ff;
          color: white;
        }
        
        .accessibility-toolbar label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-weight: 600;
        }
        
        .accessibility-toolbar input[type="range"] {
          min-height: 44px;
        }
        
        .accessibility-toolbar select {
          min-height: 44px;
          padding: 8px;
          border: 2px solid #333;
          border-radius: 4px;
        }
        
        .accessibility-status {
          padding: 8px;
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .accessibility-status .warning {
          color: #856404;
          font-weight: 600;
          display: block;
        }
        
        .accessibility-status .score {
          color: #666;
          display: block;
          margin-top: 4px;
        }
        
        .crisis-mode-indicator {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 0, 0, 0.9);
          color: white;
          padding: 20px 40px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: bold;
          z-index: 10001;
          animation: fadeInOut 3s forwards;
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        
        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
        
        /* Color blind mode filters */
        [data-colorblind-mode="protanopia"] {
          filter: url('#protanopia-filter');
        }
        
        [data-colorblind-mode="deuteranopia"] {
          filter: url('#deuteranopia-filter');
        }
        
        [data-colorblind-mode="tritanopia"] {
          filter: url('#tritanopia-filter');
        }
      `}</style>
      
      {/* SVG filters for color blind modes */}
      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="
              0.567, 0.433, 0, 0, 0
              0.558, 0.442, 0, 0, 0
              0, 0.242, 0.758, 0, 0
              0, 0, 0, 1, 0
            "/>
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="
              0.625, 0.375, 0, 0, 0
              0.7, 0.3, 0, 0, 0
              0, 0.3, 0.7, 0, 0
              0, 0, 0, 1, 0
            "/>
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="
              0.95, 0.05, 0, 0, 0
              0, 0.433, 0.567, 0, 0
              0, 0.475, 0.525, 0, 0
              0, 0, 0, 1, 0
            "/>
          </filter>
        </defs>
      </svg>
    </>
  );
};

export default AccessibilityWrapper;