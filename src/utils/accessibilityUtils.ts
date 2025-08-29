/**
 * Accessibility Utilities
 * 
 * Comprehensive utility functions for accessibility auditing, testing,
 * and enhancement of web applications for WCAG compliance.
 * 
 * @fileoverview Accessibility helper functions and utilities
 * @version 2.0.0
 */

/**
 * Accessibility test result interface
 */
export interface AccessibilityTestResult {
  element: Element;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  wcagGuideline?: string;
}

/**
 * Color contrast analysis result
 */
export interface ContrastResult {
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  foreground: string;
  background: string;
  isValid: boolean;
}

/**
 * Accessibility scan configuration
 */
export interface AccessibilityScanConfig {
  includeWarnings: boolean;
  checkContrast: boolean;
  checkKeyboardNavigation: boolean;
  checkScreenReader: boolean;
  checkFocus: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA';
}

/**
 * Default accessibility scan configuration
 */
export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityScanConfig = {
  includeWarnings: true,
  checkContrast: true,
  checkKeyboardNavigation: true,
  checkScreenReader: true,
  checkFocus: true,
  wcagLevel: 'AA'
};

/**
 * Accessibility Utilities Class
 */
export class AccessibilityUtils {
  /**
   * Get element attributes as a record
   */
  static getElementAttributes(element: Element): Record<string, string> {
    const attributes: Record<string, string> = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  /**
   * Generate a CSS selector for an element
   */
  static getElementSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.trim().split(/\s+/);
      if (classes.length > 0 && classes[0]) {
        return `.${classes[0]}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  /**
   * Generate a unique ID for an element
   */
  static generateElementId(element: Element): string {
    return `${element.tagName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if element is focusable
   */
  static isFocusable(element: Element): boolean {
    const focusableSelectors = [
      'a[href]',
      'button',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const htmlElement = element as HTMLElement;
    
    // Check if element matches focusable selectors
    const isFocusableElement = focusableSelectors.some(selector => 
      element.matches(selector)
    );

    // Check if element is disabled
    const isDisabled = htmlElement.hasAttribute('disabled') || 
                      htmlElement.getAttribute('aria-disabled') === 'true';

    // Check if element is hidden
    const isHidden = htmlElement.hidden || 
                    htmlElement.style.display === 'none' ||
                    htmlElement.style.visibility === 'hidden' ||
                    htmlElement.getAttribute('aria-hidden') === 'true';

    return isFocusableElement && !isDisabled && !isHidden;
  }

  /**
   * Get accessible name for an element
   */
  static getAccessibleName(element: Element): string {
    const htmlElement = element as HTMLElement;

    // Check aria-label
    const ariaLabel = htmlElement.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();

    // Check aria-labelledby
    const ariaLabelledby = htmlElement.getAttribute('aria-labelledby');
    if (ariaLabelledby) {
      const labelElements = ariaLabelledby.split(/\s+/)
        .map(id => document.getElementById(id))
        .filter(Boolean);
      
      if (labelElements.length > 0) {
        return labelElements.map(el => el!.textContent?.trim() || '').join(' ');
      }
    }

    // Check associated label
    if (htmlElement.id) {
      const label = document.querySelector(`label[for="${htmlElement.id}"]`);
      if (label) return label.textContent?.trim() || '';
    }

    // Check parent label
    const parentLabel = htmlElement.closest('label');
    if (parentLabel) {
      return parentLabel.textContent?.trim() || '';
    }

    // Check placeholder for inputs
    if (htmlElement.tagName === 'INPUT' || htmlElement.tagName === 'TEXTAREA') {
      const placeholder = htmlElement.getAttribute('placeholder');
      if (placeholder) return placeholder.trim();
    }

    // Check alt attribute for images
    if (htmlElement.tagName === 'IMG') {
      const alt = htmlElement.getAttribute('alt');
      if (alt !== null) return alt.trim();
    }

    // Check title attribute
    const title = htmlElement.getAttribute('title');
    if (title) return title.trim();

    // Check text content
    const textContent = htmlElement.textContent?.trim();
    if (textContent) return textContent;

    return '';
  }

  /**
   * Check color contrast ratio
   */
  static calculateContrastRatio(foreground: string, background: string): number {
    const getLuminance = (color: string): number => {
      // Convert hex to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      // Calculate relative luminance
      const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Evaluate color contrast compliance
   */
  static evaluateContrast(foreground: string, background: string, fontSize: number = 16): ContrastResult {
    const ratio = this.calculateContrastRatio(foreground, background);
    const isLargeText = fontSize >= 18 || fontSize >= 14; // 14pt bold is considered large
    
    let level: ContrastResult['level'];
    let isValid: boolean;

    if (isLargeText) {
      // Large text requirements
      if (ratio >= 4.5) {
        level = 'AAA';
        isValid = true;
      } else if (ratio >= 3) {
        level = 'AA';
        isValid = true;
      } else {
        level = 'fail';
        isValid = false;
      }
    } else {
      // Normal text requirements
      if (ratio >= 7) {
        level = 'AAA';
        isValid = true;
      } else if (ratio >= 4.5) {
        level = 'AA';
        isValid = true;
      } else {
        level = 'fail';
        isValid = false;
      }
    }

    return {
      ratio: Math.round(ratio * 100) / 100,
      level,
      foreground,
      background,
      isValid
    };
  }

  /**
   * Check if element has proper ARIA attributes
   */
  static validateAriaAttributes(element: Element): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    const htmlElement = element as HTMLElement;

    // Check for required ARIA attributes based on role
    const role = htmlElement.getAttribute('role');
    if (role) {
      switch (role) {
        case 'button':
          if (!this.getAccessibleName(element)) {
            results.push({
              element,
              rule: 'button-name',
              severity: 'error',
              message: 'Button must have an accessible name',
              suggestion: 'Add aria-label, aria-labelledby, or text content',
              wcagGuideline: '4.1.2'
            });
          }
          break;

        case 'textbox':
          if (!this.getAccessibleName(element)) {
            results.push({
              element,
              rule: 'textbox-name',
              severity: 'error',
              message: 'Textbox must have an accessible name',
              suggestion: 'Add aria-label, aria-labelledby, or associated label',
              wcagGuideline: '4.1.2'
            });
          }
          break;

        case 'checkbox':
        case 'radio':
          if (!this.getAccessibleName(element)) {
            results.push({
              element,
              rule: 'input-name',
              severity: 'error',
              message: `${role} must have an accessible name`,
              suggestion: 'Add aria-label, aria-labelledby, or associated label',
              wcagGuideline: '4.1.2'
            });
          }
          break;
      }
    }

    // Check for invalid ARIA attribute values
    const ariaExpanded = htmlElement.getAttribute('aria-expanded');
    if (ariaExpanded && !['true', 'false'].includes(ariaExpanded)) {
      results.push({
        element,
        rule: 'aria-expanded-value',
        severity: 'error',
        message: 'aria-expanded must be "true" or "false"',
        suggestion: 'Set aria-expanded to "true" or "false"',
        wcagGuideline: '4.1.2'
      });
    }

    const ariaHidden = htmlElement.getAttribute('aria-hidden');
    if (ariaHidden && !['true', 'false'].includes(ariaHidden)) {
      results.push({
        element,
        rule: 'aria-hidden-value',
        severity: 'error',
        message: 'aria-hidden must be "true" or "false"',
        suggestion: 'Set aria-hidden to "true" or "false"',
        wcagGuideline: '4.1.2'
      });
    }

    return results;
  }

  /**
   * Check keyboard navigation support
   */
  static checkKeyboardNavigation(element: Element): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    const htmlElement = element as HTMLElement;

    // Check if interactive elements are keyboard accessible
    const interactiveElements = ['button', 'a', 'input', 'select', 'textarea'];
    const hasClickHandler = htmlElement.onclick !== null || 
                           htmlElement.addEventListener !== undefined;

    if (interactiveElements.includes(htmlElement.tagName.toLowerCase()) || hasClickHandler) {
      if (!this.isFocusable(element)) {
        results.push({
          element,
          rule: 'keyboard-accessible',
          severity: 'error',
          message: 'Interactive element must be keyboard accessible',
          suggestion: 'Add tabindex="0" or ensure element is naturally focusable',
          wcagGuideline: '2.1.1'
        });
      }
    }

    // Check for keyboard traps
    const tabIndex = htmlElement.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) > 0) {
      results.push({
        element,
        rule: 'no-positive-tabindex',
        severity: 'warning',
        message: 'Avoid positive tabindex values',
        suggestion: 'Use tabindex="0" or rely on natural tab order',
        wcagGuideline: '2.4.3'
      });
    }

    return results;
  }

  /**
   * Validate image accessibility
   */
  static validateImages(element: Element): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    
    if (element.tagName !== 'IMG') return results;

    const img = element as HTMLImageElement;
    const alt = img.getAttribute('alt');

    // Check for missing alt attribute
    if (alt === null) {
      results.push({
        element,
        rule: 'img-alt',
        severity: 'error',
        message: 'Images must have alt attribute',
        suggestion: 'Add alt attribute describing the image or alt="" for decorative images',
        wcagGuideline: '1.1.1'
      });
    }

    // Check for redundant alt text
    if (alt && (alt.toLowerCase().includes('image') || alt.toLowerCase().includes('picture'))) {
      results.push({
        element,
        rule: 'img-redundant-alt',
        severity: 'warning',
        message: 'Alt text should not contain "image" or "picture"',
        suggestion: 'Describe what the image shows, not that it is an image',
        wcagGuideline: '1.1.1'
      });
    }

    return results;
  }

  /**
   * Check heading structure
   */
  static validateHeadingStructure(container: Element = document.body): AccessibilityTestResult[] {
    const results: AccessibilityTestResult[] = [];
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    let previousLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      
      // Check for skipped heading levels
      if (level > previousLevel + 1) {
        results.push({
          element: heading,
          rule: 'heading-order',
          severity: 'warning',
          message: `Heading level ${level} skips level ${previousLevel + 1}`,
          suggestion: 'Use heading levels in sequential order',
          wcagGuideline: '1.3.1'
        });
      }

      // Check for empty headings
      if (!heading.textContent?.trim()) {
        results.push({
          element: heading,
          rule: 'heading-empty',
          severity: 'error',
          message: 'Heading must not be empty',
          suggestion: 'Add descriptive text to the heading',
          wcagGuideline: '2.4.6'
        });
      }

      previousLevel = level;
    });

    // Check for missing h1
    const h1Elements = container.querySelectorAll('h1');
    if (h1Elements.length === 0 && container === document.body) {
      results.push({
        element: container,
        rule: 'page-has-heading-one',
        severity: 'warning',
        message: 'Page should have at least one h1 element',
        suggestion: 'Add an h1 element as the main page heading',
        wcagGuideline: '2.4.6'
      });
    }

    return results;
  }

  /**
   * Run comprehensive accessibility scan
   */
  static scanAccessibility(
    container: Element = document.body, 
    config: Partial<AccessibilityScanConfig> = {}
  ): AccessibilityTestResult[] {
    const fullConfig = { ...DEFAULT_ACCESSIBILITY_CONFIG, ...config };
    const results: AccessibilityTestResult[] = [];

    // Get all elements to test
    const elements = container.querySelectorAll('*');

    elements.forEach(element => {
      // Validate ARIA attributes
      results.push(...this.validateAriaAttributes(element));

      // Check keyboard navigation
      if (fullConfig.checkKeyboardNavigation) {
        results.push(...this.checkKeyboardNavigation(element));
      }

      // Validate images
      if (element.tagName === 'IMG') {
        results.push(...this.validateImages(element));
      }
    });

    // Check heading structure
    results.push(...this.validateHeadingStructure(container));

    // Filter results based on config
    return fullConfig.includeWarnings 
      ? results 
      : results.filter(result => result.severity === 'error');
  }

  /**
   * Generate accessibility report
   */
  static generateAccessibilityReport(results: AccessibilityTestResult[]): {
    summary: {
      total: number;
      errors: number;
      warnings: number;
      info: number;
    };
    byRule: Record<string, number>;
    byWCAG: Record<string, number>;
  } {
    const summary = {
      total: results.length,
      errors: results.filter(r => r.severity === 'error').length,
      warnings: results.filter(r => r.severity === 'warning').length,
      info: results.filter(r => r.severity === 'info').length
    };

    const byRule: Record<string, number> = {};
    const byWCAG: Record<string, number> = {};

    results.forEach(result => {
      byRule[result.rule] = (byRule[result.rule] || 0) + 1;
      if (result.wcagGuideline) {
        byWCAG[result.wcagGuideline] = (byWCAG[result.wcagGuideline] || 0) + 1;
      }
    });

    return { summary, byRule, byWCAG };
  }

  /**
   * Create accessible focus trap
   */
  static createFocusTrap(container: Element): {
    activate: () => void;
    deactivate: () => void;
  } {
    const focusableElements = container.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    return {
      activate: () => {
        document.addEventListener('keydown', handleTabKey);
        firstFocusable?.focus();
      },
      deactivate: () => {
        document.removeEventListener('keydown', handleTabKey);
      }
    };
  }

  /**
   * Announce message to screen readers
   */
  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

export default AccessibilityUtils;
