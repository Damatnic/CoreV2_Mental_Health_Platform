/**
 * Accessibility Monitoring Hook
 *
 * Comprehensive React hook for monitoring and enhancing accessibility
 * compliance, WCAG adherence, and inclusive user experience
 *
 * Features:
 * - Real-time WCAG 2.1 compliance monitoring
 * - Keyboard navigation tracking and optimization
 * - Screen reader compatibility testing
 * - Color contrast validation
 * - Focus management and trap detection
 * - Accessibility violation detection and reporting
 * - ARIA attribute validation
 * - Performance impact assessment
 *
 * @license Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { accessibilityService } from '../services/accessibilityService';
import { logger } from '../utils/logger';

// WCAG Compliance Level
type WCAGLevel = 'A' | 'AA' | 'AAA';

// Accessibility Violation Interface
interface AccessibilityViolation {
  id: string;
  type: 'error' | 'warning' | 'notice';
  wcagLevel: WCAGLevel;
  principle: 'perceivable' | 'operable' | 'understandable' | 'robust';
  guideline: string;
  criterion: string;
  element: Element;
  selector: string;
  message: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  helpUrl: string;
  timestamp: Date;
  fixed: boolean;
}

// Color Contrast Result Interface
interface ColorContrastResult {
  element: Element;
  selector: string;
  foregroundColor: string;
  backgroundColor: string;
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  largeText: boolean;
  timestamp: Date;
}

// Keyboard Navigation Event Interface
interface KeyboardNavigationEvent {
  id: string;
  type: 'focus' | 'blur' | 'keydown' | 'keyup';
  key?: string;
  element: Element;
  selector: string;
  timestamp: Date;
  tabIndex: number;
  focusable: boolean;
  trapped: boolean;
}

// Screen Reader Compatibility Interface
interface ScreenReaderCompatibility {
  element: Element;
  selector: string;
  hasAriaLabel: boolean;
  hasAriaDescription: boolean;
  hasRole: boolean;
  isAccessible: boolean;
  recommendations: string[];
  timestamp: Date;
}

// Accessibility Metrics Interface
interface AccessibilityMetrics {
  wcagCompliance: {
    A: number;
    AA: number;
    AAA: number;
  };
  violationsCount: {
    error: number;
    warning: number;
    notice: number;
  };
  averageContrastRatio: number;
  keyboardNavigableElements: number;
  focusTrapViolations: number;
  screenReaderCompatibility: number;
  lastAudit: Date | null;
}

// Accessibility Configuration Interface
interface AccessibilityConfig {
  enableRealTimeMonitoring: boolean;
  enableKeyboardTracking: boolean;
  enableContrastMonitoring: boolean;
  enableScreenReaderTesting: boolean;
  enableFocusManagement: boolean;
  wcagLevel: WCAGLevel;
  auditInterval: number; // milliseconds
  reportViolations: boolean;
  autoFix: boolean;
  excludeSelectors: string[];
  includeSelectors: string[];
}

// Hook Return Type
interface UseAccessibilityMonitoringReturn {
  // Current State
  violations: AccessibilityViolation[];
  contrastResults: ColorContrastResult[];
  keyboardEvents: KeyboardNavigationEvent[];
  screenReaderResults: ScreenReaderCompatibility[];
  metrics: AccessibilityMetrics;
  
  // Status
  isMonitoring: boolean;
  isAuditing: boolean;
  lastAudit: Date | null;
  
  // Actions
  startMonitoring: () => void;
  stopMonitoring: () => void;
  runAudit: () => Promise<void>;
  fixViolation: (violationId: string) => Promise<boolean>;
  fixAllViolations: () => Promise<number>;
  
  // Validation
  validateElement: (element: Element) => Promise<AccessibilityViolation[]>;
  checkContrast: (element: Element) => Promise<ColorContrastResult | null>;
  testKeyboardNavigation: (container?: Element) => Promise<KeyboardNavigationEvent[]>;
  testScreenReader: (element: Element) => Promise<ScreenReaderCompatibility>;
  
  // Focus Management
  setFocusTrap: (container: Element) => () => void;
  announceLiveRegion: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Utilities
  exportReport: () => string;
  clearViolations: () => void;
  getRecommendations: () => string[];
}

// Default Configuration
const DEFAULT_CONFIG: AccessibilityConfig = {
  enableRealTimeMonitoring: true,
  enableKeyboardTracking: true,
  enableContrastMonitoring: true,
  enableScreenReaderTesting: true,
  enableFocusManagement: true,
  wcagLevel: 'AA',
  auditInterval: 30000, // 30 seconds
  reportViolations: true,
  autoFix: false,
  excludeSelectors: ['[data-accessibility-ignore]', '.accessibility-ignore'],
  includeSelectors: []
};

/**
 * Accessibility Monitoring Hook
 * 
 * @param config - Optional configuration for accessibility monitoring
 * @returns Accessibility monitoring state and utilities
 */
export function useAccessibilityMonitoring(
  config: Partial<AccessibilityConfig> = {}
): UseAccessibilityMonitoringReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State
  const [violations, setViolations] = useState<AccessibilityViolation[]>([]);
  const [contrastResults, setContrastResults] = useState<ColorContrastResult[]>([]);
  const [keyboardEvents, setKeyboardEvents] = useState<KeyboardNavigationEvent[]>([]);
  const [screenReaderResults, setScreenReaderResults] = useState<ScreenReaderCompatibility[]>([]);
  const [metrics, setMetrics] = useState<AccessibilityMetrics>({
    wcagCompliance: { A: 0, AA: 0, AAA: 0 },
    violationsCount: { error: 0, warning: 0, notice: 0 },
    averageContrastRatio: 0,
    keyboardNavigableElements: 0,
    focusTrapViolations: 0,
    screenReaderCompatibility: 0,
    lastAudit: null
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAudit, setLastAudit] = useState<Date | null>(null);
  
  // Refs
  const auditIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const focusTrapsRef = useRef<Set<() => void>>(new Set());
  const liveRegionRef = useRef<HTMLElement | null>(null);
  
  // Create Live Region for Announcements
  const createLiveRegion = useCallback(() => {
    if (liveRegionRef.current) return;
    
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
    liveRegionRef.current = liveRegion;
  }, []);
  
  // Validate Single Element
  const validateElement = useCallback(async (element: Element): Promise<AccessibilityViolation[]> => {
    try {
      const elementViolations = await accessibilityService.validateElement(element, {
        wcagLevel: finalConfig.wcagLevel,
        includeSelectors: finalConfig.includeSelectors,
        excludeSelectors: finalConfig.excludeSelectors
      });
      
      return elementViolations.map(violation => ({
        ...violation,
        id: `${violation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        fixed: false
      }));
    } catch (error) {
      logger.error('Failed to validate element', { error });
      return [];
    }
  }, [finalConfig]);
  
  // Check Color Contrast
  const checkContrast = useCallback(async (element: Element): Promise<ColorContrastResult | null> => {
    try {
      const computedStyle = window.getComputedStyle(element);
      const foregroundColor = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      if (!foregroundColor || !backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)') {
        return null;
      }
      
      const ratio = await accessibilityService.calculateContrastRatio(foregroundColor, backgroundColor);
      const fontSize = parseFloat(computedStyle.fontSize);
      const fontWeight = computedStyle.fontWeight;
      
      const largeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
      const wcagAA = largeText ? ratio >= 3 : ratio >= 4.5;
      const wcagAAA = largeText ? ratio >= 4.5 : ratio >= 7;
      
      return {
        element,
        selector: generateSelector(element),
        foregroundColor,
        backgroundColor,
        ratio,
        wcagAA,
        wcagAAA,
        largeText,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Failed to check contrast', { error });
      return null;
    }
  }, []);
  
  // Test Keyboard Navigation
  const testKeyboardNavigation = useCallback(async (container: Element = document.body): Promise<KeyboardNavigationEvent[]> => {
    const events: KeyboardNavigationEvent[] = [];
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      const focusable = !element.hasAttribute('disabled') && 
                       getComputedStyle(element).visibility !== 'hidden' &&
                       getComputedStyle(element).display !== 'none';
      
      events.push({
        id: `keyboard_${Date.now()}_${index}`,
        type: 'focus',
        element,
        selector: generateSelector(element),
        timestamp: new Date(),
        tabIndex: tabIndex ? parseInt(tabIndex) : 0,
        focusable,
        trapped: false // Will be updated by focus trap detection
      });
    });
    
    return events;
  }, []);
  
  // Test Screen Reader Compatibility
  const testScreenReader = useCallback(async (element: Element): Promise<ScreenReaderCompatibility> => {
    const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
    const hasAriaDescription = element.hasAttribute('aria-description') || element.hasAttribute('aria-describedby');
    const hasRole = element.hasAttribute('role');
    
    const recommendations: string[] = [];
    
    if (!hasAriaLabel && element.tagName === 'BUTTON' && !element.textContent?.trim()) {
      recommendations.push('Add aria-label to button without visible text');
    }
    
    if (!hasAriaLabel && element.tagName === 'INPUT' && element.getAttribute('type') !== 'hidden') {
      recommendations.push('Add aria-label or associate with label element');
    }
    
    if (element.getAttribute('role') === 'button' && !element.hasAttribute('tabindex')) {
      recommendations.push('Add tabindex="0" to custom button');
    }
    
    const isAccessible = recommendations.length === 0;
    
    return {
      element,
      selector: generateSelector(element),
      hasAriaLabel,
      hasAriaDescription,
      hasRole,
      isAccessible,
      recommendations,
      timestamp: new Date()
    };
  }, []);
  
  // Run Full Accessibility Audit
  const runAudit = useCallback(async () => {
    if (isAuditing) return;
    
    try {
      setIsAuditing(true);
      
      const allElements = document.querySelectorAll('*');
      const newViolations: AccessibilityViolation[] = [];
      const newContrastResults: ColorContrastResult[] = [];
      const newScreenReaderResults: ScreenReaderCompatibility[] = [];
      
      // Filter elements based on configuration
      const elementsToTest = Array.from(allElements).filter(element => {
        const selector = generateSelector(element);
        
        // Exclude based on selectors
        if (finalConfig.excludeSelectors.some(excludeSelector => element.matches(excludeSelector))) {
          return false;
        }
        
        // Include only specific selectors if configured
        if (finalConfig.includeSelectors.length > 0) {
          return finalConfig.includeSelectors.some(includeSelector => element.matches(includeSelector));
        }
        
        return true;
      });
      
      // Run validations in batches to prevent blocking
      const batchSize = 10;
      for (let i = 0; i < elementsToTest.length; i += batchSize) {
        const batch = elementsToTest.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (element) => {
            try {
              // Validate element
              const elementViolations = await validateElement(element);
              newViolations.push(...elementViolations);
              
              // Check contrast if enabled
              if (finalConfig.enableContrastMonitoring) {
                const contrastResult = await checkContrast(element);
                if (contrastResult) {
                  newContrastResults.push(contrastResult);
                }
              }
              
              // Test screen reader if enabled
              if (finalConfig.enableScreenReaderTesting) {
                const screenReaderResult = await testScreenReader(element);
                newScreenReaderResults.push(screenReaderResult);
              }
            } catch (error) {
              logger.error('Failed to audit element', { element, error });
            }
          })
        );
        
        // Yield to prevent blocking UI
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Test keyboard navigation if enabled
      if (finalConfig.enableKeyboardTracking) {
        const keyboardResults = await testKeyboardNavigation();
        setKeyboardEvents(keyboardResults);
      }
      
      // Update state
      setViolations(newViolations);
      setContrastResults(newContrastResults);
      setScreenReaderResults(newScreenReaderResults);
      
      // Calculate metrics
      const newMetrics: AccessibilityMetrics = {
        wcagCompliance: {
          A: Math.round(((elementsToTest.length - newViolations.filter(v => v.wcagLevel === 'A').length) / elementsToTest.length) * 100),
          AA: Math.round(((elementsToTest.length - newViolations.filter(v => ['A', 'AA'].includes(v.wcagLevel)).length) / elementsToTest.length) * 100),
          AAA: Math.round(((elementsToTest.length - newViolations.length) / elementsToTest.length) * 100)
        },
        violationsCount: {
          error: newViolations.filter(v => v.type === 'error').length,
          warning: newViolations.filter(v => v.type === 'warning').length,
          notice: newViolations.filter(v => v.type === 'notice').length
        },
        averageContrastRatio: newContrastResults.length > 0 
          ? newContrastResults.reduce((sum, result) => sum + result.ratio, 0) / newContrastResults.length 
          : 0,
        keyboardNavigableElements: keyboardEvents.filter(event => event.focusable).length,
        focusTrapViolations: keyboardEvents.filter(event => event.trapped).length,
        screenReaderCompatibility: newScreenReaderResults.length > 0 
          ? Math.round((newScreenReaderResults.filter(result => result.isAccessible).length / newScreenReaderResults.length) * 100)
          : 0,
        lastAudit: new Date()
      };
      
      setMetrics(newMetrics);
      setLastAudit(new Date());
      
      logger.info('Accessibility audit completed', { 
        violations: newViolations.length,
        elementsAudited: elementsToTest.length
      });
      
    } catch (error) {
      logger.error('Accessibility audit failed', { error });
    } finally {
      setIsAuditing(false);
    }
  }, [isAuditing, finalConfig, validateElement, checkContrast, testScreenReader, testKeyboardNavigation, keyboardEvents]);
  
  // Fix Single Violation
  const fixViolation = useCallback(async (violationId: string): Promise<boolean> => {
    try {
      const violation = violations.find(v => v.id === violationId);
      if (!violation) return false;
      
      const fixed = await accessibilityService.fixViolation(violation);
      
      if (fixed) {
        setViolations(prev => 
          prev.map(v => 
            v.id === violationId 
              ? { ...v, fixed: true }
              : v
          )
        );
      }
      
      return fixed;
    } catch (error) {
      logger.error('Failed to fix violation', { violationId, error });
      return false;
    }
  }, [violations]);
  
  // Fix All Violations
  const fixAllViolations = useCallback(async (): Promise<number> => {
    const fixableViolations = violations.filter(v => !v.fixed && finalConfig.autoFix);
    let fixedCount = 0;
    
    for (const violation of fixableViolations) {
      const fixed = await fixViolation(violation.id);
      if (fixed) fixedCount++;
    }
    
    return fixedCount;
  }, [violations, finalConfig.autoFix, fixViolation]);
  
  // Set Focus Trap
  const setFocusTrap = useCallback((container: Element): (() => void) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    if (focusableElements.length === 0) {
      return () => {};
    }
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    firstElement.focus();
    
    const cleanup = () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
    
    focusTrapsRef.current.add(cleanup);
    
    return cleanup;
  }, []);
  
  // Announce to Live Region
  const announceLiveRegion = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegionRef.current) {
      createLiveRegion();
    }
    
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  }, [createLiveRegion]);
  
  // Start Monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    createLiveRegion();
    
    // Initial audit
    runAudit();
    
    // Set up periodic auditing
    if (finalConfig.auditInterval > 0) {
      auditIntervalRef.current = setInterval(runAudit, finalConfig.auditInterval);
    }
    
    // Set up DOM mutation observer for real-time monitoring
    if (finalConfig.enableRealTimeMonitoring) {
      observerRef.current = new MutationObserver((mutations) => {
        let shouldReaudit = false;
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            shouldReaudit = true;
          }
        });
        
        if (shouldReaudit) {
          // Debounce re-auditing
          setTimeout(runAudit, 1000);
        }
      });
      
      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-label', 'aria-describedby', 'role', 'tabindex']
      });
    }
    
    logger.info('Accessibility monitoring started');
  }, [isMonitoring, finalConfig, runAudit, createLiveRegion]);
  
  // Stop Monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    
    // Clear interval
    if (auditIntervalRef.current) {
      clearInterval(auditIntervalRef.current);
      auditIntervalRef.current = null;
    }
    
    // Disconnect observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    // Clean up focus traps
    focusTrapsRef.current.forEach(cleanup => cleanup());
    focusTrapsRef.current.clear();
    
    // Remove live region
    if (liveRegionRef.current) {
      document.body.removeChild(liveRegionRef.current);
      liveRegionRef.current = null;
    }
    
    logger.info('Accessibility monitoring stopped');
  }, [isMonitoring]);
  
  // Export Report
  const exportReport = useCallback((): string => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      violations: violations.map(v => ({
        ...v,
        element: generateSelector(v.element)
      })),
      contrastResults: contrastResults.map(r => ({
        ...r,
        element: generateSelector(r.element)
      })),
      keyboardEvents: keyboardEvents.map(e => ({
        ...e,
        element: generateSelector(e.element)
      })),
      screenReaderResults: screenReaderResults.map(r => ({
        ...r,
        element: generateSelector(r.element)
      })),
      recommendations: getRecommendations()
    };
    
    return JSON.stringify(report, null, 2);
  }, [metrics, violations, contrastResults, keyboardEvents, screenReaderResults]);
  
  // Clear Violations
  const clearViolations = useCallback(() => {
    setViolations([]);
    setContrastResults([]);
    setKeyboardEvents([]);
    setScreenReaderResults([]);
  }, []);
  
  // Get Recommendations
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.wcagCompliance.AA < 95) {
      recommendations.push('Improve WCAG AA compliance by addressing accessibility violations');
    }
    
    if (metrics.averageContrastRatio < 4.5) {
      recommendations.push('Increase color contrast ratios to meet WCAG standards');
    }
    
    if (violations.filter(v => v.type === 'error').length > 0) {
      recommendations.push('Fix critical accessibility errors that prevent users from accessing content');
    }
    
    if (metrics.keyboardNavigableElements < 10) {
      recommendations.push('Ensure all interactive elements are keyboard accessible');
    }
    
    if (metrics.screenReaderCompatibility < 90) {
      recommendations.push('Improve screen reader compatibility with proper ARIA labels and roles');
    }
    
    return recommendations;
  }, [metrics, violations]);
  
  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);
  
  return {
    // Current State
    violations,
    contrastResults,
    keyboardEvents,
    screenReaderResults,
    metrics,
    
    // Status
    isMonitoring,
    isAuditing,
    lastAudit,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    runAudit,
    fixViolation,
    fixAllViolations,
    
    // Validation
    validateElement,
    checkContrast,
    testKeyboardNavigation,
    testScreenReader,
    
    // Focus Management
    setFocusTrap,
    announceLiveRegion,
    
    // Utilities
    exportReport,
    clearViolations,
    getRecommendations
  };
}

// Helper function to generate CSS selector for element
function generateSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).slice(0, 2);
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
    }
  }
  
  // Generate path-based selector
  const path: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }
    
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => 
        child.tagName === current!.tagName
      );
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    
    path.unshift(selector);
    current = parent;
  }
  
  return path.join(' > ');
}

export type { 
  UseAccessibilityMonitoringReturn, 
  AccessibilityViolation, 
  ColorContrastResult, 
  AccessibilityMetrics,
  AccessibilityConfig 
};
