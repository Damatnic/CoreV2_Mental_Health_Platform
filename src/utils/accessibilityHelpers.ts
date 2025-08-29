/**
 * Accessibility Helper Functions
 *
 * Comprehensive accessibility utilities for mental health platform ensuring
 * WCAG 2.1 AAA compliance with crisis-aware accessibility features.
 * 
 * @fileoverview Accessibility utilities and helper functions
 * @version 2.0.0
 */

/**
 * Screen reader priority levels
 */
export type ScreenReaderPriority = 'polite' | 'assertive';

/**
 * Focus trap configuration
 */
export interface FocusTrapConfig {
  initialFocus?: HTMLElement;
  returnFocusOnDeactivate?: boolean;
  escapeDeactivates?: boolean;
  allowOutsideClick?: boolean;
}

/**
 * Color contrast result
 */
export interface ContrastResult {
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  isAccessible: boolean;
}

/**
 * Animation preferences
 */
export interface AnimationPreferences {
  prefersReducedMotion: boolean;
  duration: number;
  easing: string;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string, 
  priority: ScreenReaderPriority = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-9999px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';

  announcement.textContent = message;
  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}

/**
 * Trap focus within modal for keyboard navigation
 */
export function trapFocus(element: HTMLElement, config: FocusTrapConfig = {}): () => void {
  const focusableElements = element.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusableElement = focusableElements[0] as HTMLElement;
  const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement?.focus();
          e.preventDefault();
        }
      }
    }

    // ESC key to close
    if (e.key === 'Escape' && config.escapeDeactivates !== false) {
      const closeButton = element.querySelector('[aria-label*="Close"], [data-close]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Focus initial element
  const initialFocus = config.initialFocus || firstFocusableElement;
  if (initialFocus) {
    initialFocus.focus();
  }

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get appropriate animation duration based on user preferences
 */
export function getAnimationDuration(defaultDuration: number): number {
  return prefersReducedMotion() ? 0 : defaultDuration;
}

/**
 * Get animation preferences
 */
export function getAnimationPreferences(): AnimationPreferences {
  const reducedMotion = prefersReducedMotion();
  return {
    prefersReducedMotion: reducedMotion,
    duration: reducedMotion ? 0 : 300,
    easing: reducedMotion ? 'linear' : 'ease-in-out'
  };
}

/**
 * Format text for screen readers with context
 */
export function getScreenReaderText(visualText: string, context?: string): string {
  let result = visualText;

  // Add context for ambiguous UI elements
  if (context) {
    result = `${visualText}, ${context}`;
  }

  // Expand common abbreviations in mental health context
  const expansions: Record<string, string> = {
    'CBT': 'Cognitive Behavioral Therapy',
    'DBT': 'Dialectical Behavior Therapy',
    'PTSD': 'Post-Traumatic Stress Disorder',
    'min': 'minutes',
    'hr': 'hour',
    'hrs': 'hours',
    'appt': 'appointment',
    'Dr': 'Doctor',
    'Dr.': 'Doctor',
    'vs': 'versus',
    'w/': 'with',
    'w/o': 'without'
  };

  Object.keys(expansions).forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    result = result.replace(regex, expansions[abbr]);
  });

  return result;
}

/**
 * Check color contrast meets WCAG standards
 */
export function checkColorContrast(foreground: string, background: string): ContrastResult {
  // Convert hex to RGB
  const getRGB = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const fg = getRGB(foreground);
  const bg = getRGB(background);

  if (!fg || !bg) {
    return { ratio: 0, level: 'fail', isAccessible: false };
  }

  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  let level: 'AA' | 'AAA' | 'fail' = 'fail';
  let isAccessible = false;

  if (ratio >= 7) {
    level = 'AAA';
    isAccessible = true;
  } else if (ratio >= 4.5) {
    level = 'AA';
    isAccessible = true;
  }

  return { ratio, level, isAccessible };
}

/**
 * Get accessible color for text based on background
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = checkColorContrast('#ffffff', backgroundColor);
  const blackContrast = checkColorContrast('#000000', backgroundColor);

  return whiteContrast.ratio > blackContrast.ratio ? '#ffffff' : '#000000';
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  
  return !(
    computedStyle.display === 'none' ||
    computedStyle.visibility === 'hidden' ||
    computedStyle.opacity === '0' ||
    element.getAttribute('aria-hidden') === 'true' ||
    element.hasAttribute('hidden')
  );
}

/**
 * Get accessible name for an element
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-label first
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) return labelElement.textContent || '';
  }

  // Check associated label for form elements
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || '';
    }
  }

  // Check title attribute
  const title = element.getAttribute('title');
  if (title) return title;

  // Check alt attribute for images
  if (element.tagName === 'IMG') {
    const alt = (element as HTMLImageElement).alt;
    if (alt) return alt;
  }

  // Fall back to text content
  return element.textContent || '';
}

/**
 * Crisis-specific accessibility helpers
 */

/**
 * Announce crisis alert with high priority
 */
export function announceCrisisAlert(message: string): void {
  announceToScreenReader(`Crisis Alert: ${message}`, 'assertive');
}

/**
 * Focus crisis element with announcement
 */
export function focusCrisisElement(): void {
  const crisisButton = document.querySelector('[aria-label*="crisis"], [aria-label*="emergency"]') as HTMLElement;
  
  if (crisisButton) {
    crisisButton.focus();
    announceToScreenReader('Crisis support button focused. Press Enter to activate.', 'assertive');
  }
}

/**
 * Set up emergency keyboard shortcuts
 */
export function setupEmergencyKeyboardShortcuts(): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl + Shift + E for emergency
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      focusCrisisElement();
      announceCrisisAlert('Emergency shortcut activated');
    }

    // Ctrl + Shift + H for help
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      const helpButton = document.querySelector('[aria-label*="help"]') as HTMLElement;
      if (helpButton) {
        helpButton.focus();
        announceToScreenReader('Help button focused', 'polite');
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Ensure minimum touch target size (44x44px for mobile)
 */
export function validateTouchTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // 44px minimum for WCAG compliance

  return rect.width >= minSize && rect.height >= minSize;
}

/**
 * Add skip link for keyboard navigation
 */
export function addSkipLink(targetId: string, linkText: string = 'Skip to main content'): HTMLAnchorElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = linkText;
  skipLink.className = 'skip-link';
  
  // Style to be visually hidden until focused
  Object.assign(skipLink.style, {
    position: 'absolute',
    left: '-9999px',
    zIndex: '999999',
    padding: '8px 16px',
    background: '#000000',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '4px'
  });

  skipLink.addEventListener('focus', () => {
    skipLink.style.left = '10px';
    skipLink.style.top = '10px';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.left = '-9999px';
  });

  document.body.insertBefore(skipLink, document.body.firstChild);
  return skipLink;
}

/**
 * Manage focus for single page applications
 */
export function manageFocusForSPA(newPageTitle: string): void {
  // Update page title
  document.title = newPageTitle;

  // Announce page change
  announceToScreenReader(`Navigated to ${newPageTitle}`, 'polite');

  // Focus main heading or main content area
  const mainHeading = document.querySelector('h1') as HTMLElement;
  const mainContent = document.querySelector('main, [role="main"]') as HTMLElement;
  const focusTarget = mainHeading || mainContent;

  if (focusTarget) {
    // Make focusable if not already
    if (!focusTarget.hasAttribute('tabindex')) {
      focusTarget.setAttribute('tabindex', '-1');
    }
    
    focusTarget.focus();
    
    // Remove tabindex after focus to restore natural tab order
    setTimeout(() => {
      if (focusTarget.getAttribute('tabindex') === '-1') {
        focusTarget.removeAttribute('tabindex');
      }
    }, 100);
  }
}

/**
 * Create accessible tooltip
 */
export function createAccessibleTooltip(
  triggerElement: HTMLElement,
  tooltipText: string
): { show: () => void; hide: () => void; cleanup: () => void } {
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
  
  const tooltip = document.createElement('div');
  tooltip.id = tooltipId;
  tooltip.setAttribute('role', 'tooltip');
  tooltip.textContent = tooltipText;
  tooltip.style.cssText = `
    position: absolute;
    z-index: 1000;
    background: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
  `;

  document.body.appendChild(tooltip);
  triggerElement.setAttribute('aria-describedby', tooltipId);

  const show = () => {
    tooltip.style.opacity = '1';
  };

  const hide = () => {
    tooltip.style.opacity = '0';
  };

  const cleanup = () => {
    triggerElement.removeAttribute('aria-describedby');
    if (document.body.contains(tooltip)) {
      document.body.removeChild(tooltip);
    }
  };

  return { show, hide, cleanup };
}

/**
 * Validate form accessibility
 */
export function validateFormAccessibility(form: HTMLFormElement): {
  isAccessible: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for form labels
  const inputs = form.querySelectorAll('input, textarea, select');
  inputs.forEach((input: Element) => {
    const htmlInput = input as HTMLInputElement;
    const accessibleName = getAccessibleName(htmlInput);
    
    if (!accessibleName) {
      issues.push(`Input element missing accessible name: ${htmlInput.type || htmlInput.tagName}`);
    }
  });

  // Check for fieldsets with legends
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets.forEach((fieldset: Element) => {
    const legend = fieldset.querySelector('legend');
    if (!legend) {
      issues.push('Fieldset missing legend element');
    }
  });

  // Check for required field indicators
  const requiredFields = form.querySelectorAll('[required]');
  requiredFields.forEach((field: Element) => {
    const htmlField = field as HTMLElement;
    if (!htmlField.getAttribute('aria-required')) {
      issues.push('Required field missing aria-required attribute');
    }
  });

  return {
    isAccessible: issues.length === 0,
    issues
  };
}

export default {
  announceToScreenReader,
  trapFocus,
  prefersReducedMotion,
  getAnimationDuration,
  getAnimationPreferences,
  getScreenReaderText,
  checkColorContrast,
  getAccessibleTextColor,
  isVisibleToScreenReader,
  getAccessibleName,
  announceCrisisAlert,
  focusCrisisElement,
  setupEmergencyKeyboardShortcuts,
  validateTouchTargetSize,
  addSkipLink,
  manageFocusForSPA,
  createAccessibleTooltip,
  validateFormAccessibility
};
