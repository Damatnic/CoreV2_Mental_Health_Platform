/**
 * Accessibility Service
 *
 * Comprehensive accessibility management system for HIPAA-compliant mental health platform.
 * Provides WCAG 2.1 AA compliance, screen reader support, keyboard navigation,
 * and assistive technology integration for inclusive user experience.
 *
 * @fileoverview Complete accessibility service with real-time monitoring and compliance validation
 * @version 2.0.0
 */

import { logger } from '../utils/logger';

export type AccessibilityLevel = 'A' | 'AA' | 'AAA';
export type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
export type MotorImpairmentType = 'tremor' | 'limited-mobility' | 'one-handed' | 'switch-navigation';
export type CognitiveImpairmentType = 'dyslexia' | 'adhd' | 'memory-impairment' | 'processing-delay';
export type VisionImpairmentType = 'low-vision' | 'blindness' | 'light-sensitivity' | 'tunnel-vision';
export type HearingImpairmentType = 'deaf' | 'hard-of-hearing' | 'auditory-processing';

export interface AccessibilityPreferences {
  // Visual preferences
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  colorBlindnessSupport: ColorBlindnessType | null;
  fontSize: number; // percentage, 100 = default
  lineHeight: number; // multiplier, 1.0 = default
  letterSpacing: number; // em units
  
  // Motor preferences
  motorImpairment: MotorImpairmentType | null;
  keyboardNavigation: boolean;
  stickyKeys: boolean;
  slowKeys: boolean;
  bounceKeys: boolean;
  mouseKeys: boolean;
  dwellClick: boolean;
  dwellTime: number; // milliseconds
  
  // Cognitive preferences
  cognitiveImpairment: CognitiveImpairmentType | null;
  simplifiedInterface: boolean;
  extendedTimeouts: boolean;
  readingGuide: boolean;
  focusIndicator: 'default' | 'enhanced' | 'high-contrast';
  
  // Audio preferences
  hearingImpairment: HearingImpairmentType | null;
  captions: boolean;
  audioDescriptions: boolean;
  signLanguage: boolean;
  soundAlerts: boolean;
  
  // Screen reader preferences
  screenReader: boolean;
  screenReaderVerbosity: 'minimal' | 'moderate' | 'verbose';
  announceChanges: boolean;
  skipToContent: boolean;
  landmarkNavigation: boolean;
  
  // Crisis-specific accessibility
  crisisMode: boolean;
  emergencyShortcuts: boolean;
  panicButtonSize: 'small' | 'medium' | 'large' | 'extra-large';
  crisisAudioCues: boolean;
  crisisVibration: boolean;
}

export interface AccessibilityAudit {
  id: string;
  timestamp: Date;
  url: string;
  wcagLevel: AccessibilityLevel;
  score: number; // 0-100
  issues: AccessibilityIssue[];
  recommendations: string[];
  complianceStatus: 'compliant' | 'partial' | 'non-compliant';
  autoFixApplied: boolean;
  manualReviewRequired: boolean;
}

export interface AccessibilityIssue {
  id: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagCriterion: string;
  element: string;
  description: string;
  impact: string;
  solution: string;
  autoFixable: boolean;
  tags: string[];
  context: {
    selector: string;
    html: string;
    attributes: Record<string, string>;
  };
}

export interface AccessibilityMetrics {
  complianceScore: number;
  wcagLevel: AccessibilityLevel;
  totalIssues: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  fixedIssues: number;
  remainingIssues: number;
  lastAuditDate: Date;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

export interface AccessibilityConfiguration {
  wcagLevel: AccessibilityLevel;
  autoFix: boolean;
  realTimeMonitoring: boolean;
  auditFrequency: 'continuous' | 'hourly' | 'daily' | 'weekly';
  reportGeneration: boolean;
  userPreferencesSync: boolean;
  assistiveTechSupport: boolean;
  crisisAccessibilityMode: boolean;
  customRules: AccessibilityRule[];
}

export interface AccessibilityRule {
  id: string;
  name: string;
  description: string;
  wcagCriterion: string;
  selector: string;
  validator: (element: Element) => boolean;
  autoFix?: (element: Element) => void;
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
}

export interface AccessibilityReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  metrics: AccessibilityMetrics;
  audits: AccessibilityAudit[];
  trends: {
    complianceOverTime: Array<{ date: Date; score: number }>;
    issuesByCategory: Record<string, number>;
    userImpactAnalysis: string[];
  };
  recommendations: string[];
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedEffort: string;
    impact: string;
  }>;
}

export interface AccessibilityEvent {
  type: 'audit-completed' | 'issue-detected' | 'issue-fixed' | 'preferences-changed' | 'compliance-updated';
  timestamp: Date;
  data: any;
  userId?: string;
  sessionId?: string;
  url?: string;
}

class AccessibilityService {
  private preferences: AccessibilityPreferences;
  private configuration: AccessibilityConfiguration;
  private auditHistory: AccessibilityAudit[] = [];
  private eventListeners: Array<(event: AccessibilityEvent) => void> = [];
  private isInitialized = false;
  private observer: MutationObserver | null = null;
  private keyboardTrapStack: HTMLElement[] = [];
  private focusHistory: HTMLElement[] = [];

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.configuration = this.getDefaultConfiguration();
    this.initializeService();
  }

  private getDefaultPreferences(): AccessibilityPreferences {
    return {
      // Visual
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      colorBlindnessSupport: null,
      fontSize: 100,
      lineHeight: 1.0,
      letterSpacing: 0,
      
      // Motor
      motorImpairment: null,
      keyboardNavigation: true,
      stickyKeys: false,
      slowKeys: false,
      bounceKeys: false,
      mouseKeys: false,
      dwellClick: false,
      dwellTime: 1000,
      
      // Cognitive
      cognitiveImpairment: null,
      simplifiedInterface: false,
      extendedTimeouts: false,
      readingGuide: false,
      focusIndicator: 'default',
      
      // Audio
      hearingImpairment: null,
      captions: false,
      audioDescriptions: false,
      signLanguage: false,
      soundAlerts: true,
      
      // Screen reader
      screenReader: false,
      screenReaderVerbosity: 'moderate',
      announceChanges: true,
      skipToContent: true,
      landmarkNavigation: true,
      
      // Crisis
      crisisMode: false,
      emergencyShortcuts: true,
      panicButtonSize: 'large',
      crisisAudioCues: true,
      crisisVibration: true
    };
  }

  private getDefaultConfiguration(): AccessibilityConfiguration {
    return {
      wcagLevel: 'AA',
      autoFix: true,
      realTimeMonitoring: true,
      auditFrequency: 'daily',
      reportGeneration: true,
      userPreferencesSync: true,
      assistiveTechSupport: true,
      crisisAccessibilityMode: true,
      customRules: []
    };
  }

  private async initializeService(): Promise<void> {
    try {
      // Load user preferences
      await this.loadUserPreferences();
      
      // Apply initial accessibility settings
      await this.applyAccessibilitySettings();
      
      // Set up real-time monitoring
      if (this.configuration.realTimeMonitoring) {
        this.setupRealTimeMonitoring();
      }
      
      // Initialize keyboard navigation
      this.setupKeyboardNavigation();
      
      // Set up assistive technology support
      if (this.configuration.assistiveTechSupport) {
        this.setupAssistiveTechnologySupport();
      }
      
      // Detect user preferences from system
      this.detectSystemPreferences();
      
      this.isInitialized = true;
      
      this.emitEvent({
        type: 'compliance-updated',
        timestamp: new Date(),
        data: { initialized: true, preferences: this.preferences }
      });
      
      logger.info('Accessibility service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize accessibility service', error);
      throw error;
    }
  }

  public async updatePreferences(newPreferences: Partial<AccessibilityPreferences>): Promise<void> {
    try {
      const oldPreferences = { ...this.preferences };
      this.preferences = { ...this.preferences, ...newPreferences };
      
      // Apply the new settings
      await this.applyAccessibilitySettings();
      
      // Save preferences
      await this.saveUserPreferences();
      
      this.emitEvent({
        type: 'preferences-changed',
        timestamp: new Date(),
        data: { 
          oldPreferences, 
          newPreferences: this.preferences,
          changes: newPreferences
        }
      });
      
      logger.info('Accessibility preferences updated', { changes: newPreferences });
    } catch (error) {
      logger.error('Failed to update accessibility preferences', error);
      throw error;
    }
  }

  public async runAccessibilityAudit(url?: string): Promise<AccessibilityAudit> {
    try {
      const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const targetUrl = url || window.location.href;
      
      logger.info(`Starting accessibility audit for: ${targetUrl}`);
      
      const issues: AccessibilityIssue[] = [];
      
      // Run comprehensive accessibility checks
      issues.push(...await this.checkColorContrast());
      issues.push(...await this.checkKeyboardNavigation());
      issues.push(...await this.checkScreenReaderSupport());
      issues.push(...await this.checkFormAccessibility());
      issues.push(...await this.checkImageAccessibility());
      issues.push(...await this.checkHeadingStructure());
      issues.push(...await this.checkLandmarks());
      issues.push(...await this.checkFocusManagement());
      issues.push(...await this.checkCrisisAccessibility());
      
      // Calculate compliance score
      const score = this.calculateComplianceScore(issues);
      const complianceStatus = this.determineComplianceStatus(score);
      
      // Apply auto-fixes if enabled
      let autoFixApplied = false;
      if (this.configuration.autoFix) {
        autoFixApplied = await this.applyAutoFixes(issues);
      }
      
      const audit: AccessibilityAudit = {
        id: auditId,
        timestamp: new Date(),
        url: targetUrl,
        wcagLevel: this.configuration.wcagLevel,
        score,
        issues,
        recommendations: this.generateRecommendations(issues),
        complianceStatus,
        autoFixApplied,
        manualReviewRequired: issues.some(issue => !issue.autoFixable && issue.severity === 'critical')
      };
      
      this.auditHistory.push(audit);
      
      this.emitEvent({
        type: 'audit-completed',
        timestamp: new Date(),
        data: audit
      });
      
      logger.info(`Accessibility audit completed: ${score}/100 (${complianceStatus})`);
      return audit;
    } catch (error) {
      logger.error('Failed to run accessibility audit', error);
      throw error;
    }
  }

  private async checkColorContrast(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    // Check all text elements for sufficient contrast
    const textElements = document.querySelectorAll('*:not(script):not(style)');
    
    for (const element of Array.from(textElements)) {
      const textContent = element.textContent?.trim();
      if (!textContent || textContent.length === 0) continue;
      
      const styles = window.getComputedStyle(element);
      const backgroundColor = styles.backgroundColor;
      const color = styles.color;
      
      if (this.isTransparent(backgroundColor) || this.isTransparent(color)) continue;
      
      const contrastRatio = this.calculateContrastRatio(color, backgroundColor);
      const requiredRatio = this.getRequiredContrastRatio(styles.fontSize, styles.fontWeight);
      
      if (contrastRatio < requiredRatio) {
        issues.push({
          id: `contrast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: contrastRatio < requiredRatio * 0.7 ? 'critical' : 'serious',
          wcagCriterion: '1.4.3',
          element: element.tagName.toLowerCase(),
          description: `Insufficient color contrast ratio: ${contrastRatio.toFixed(2)}:1 (required: ${requiredRatio}:1)`,
          impact: 'Text may be difficult to read for users with visual impairments',
          solution: 'Increase contrast between text and background colors',
          autoFixable: false,
          tags: ['color', 'contrast', 'visual'],
          context: {
            selector: this.getElementSelector(element),
            html: element.outerHTML.substring(0, 200),
            attributes: this.getElementAttributes(element)
          }
        });
      }
    }
    
    return issues;
  }

  private async checkKeyboardNavigation(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    // Check interactive elements for keyboard accessibility
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex], [role="button"], [role="link"]'
    );
    
    for (const element of Array.from(interactiveElements)) {
      const tabIndex = element.getAttribute('tabindex');
      const role = element.getAttribute('role');
      
      // Check for keyboard traps
      if (tabIndex && parseInt(tabIndex) > 0) {
        issues.push({
          id: `keyboard-trap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: 'serious',
          wcagCriterion: '2.1.2',
          element: element.tagName.toLowerCase(),
          description: 'Positive tabindex creates keyboard trap',
          impact: 'Keyboard users may get trapped in navigation sequence',
          solution: 'Use tabindex="0" or remove tabindex to allow natural tab order',
          autoFixable: true,
          tags: ['keyboard', 'navigation', 'focus'],
          context: {
            selector: this.getElementSelector(element),
            html: element.outerHTML.substring(0, 200),
            attributes: this.getElementAttributes(element)
          }
        });
      }
      
      // Check for missing focus indicators
      const styles = window.getComputedStyle(element, ':focus');
      if (styles.outline === 'none' && !styles.boxShadow && !styles.border) {
        issues.push({
          id: `focus-indicator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: 'moderate',
          wcagCriterion: '2.4.7',
          element: element.tagName.toLowerCase(),
          description: 'Missing visible focus indicator',
          impact: 'Keyboard users cannot see which element has focus',
          solution: 'Add visible focus styles (outline, box-shadow, or border)',
          autoFixable: true,
          tags: ['focus', 'visual', 'keyboard'],
          context: {
            selector: this.getElementSelector(element),
            html: element.outerHTML.substring(0, 200),
            attributes: this.getElementAttributes(element)
          }
        });
      }
    }
    
    return issues;
  }

  private async checkScreenReaderSupport(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    // Check for proper ARIA labels and descriptions
    const elements = document.querySelectorAll('*[role], button, input, select, textarea, img');
    
    for (const element of Array.from(elements)) {
      const tagName = element.tagName.toLowerCase();
      const role = element.getAttribute('role');
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const ariaDescribedBy = element.getAttribute('aria-describedby');
      
      // Check images for alt text
      if (tagName === 'img') {
        const alt = element.getAttribute('alt');
        const src = element.getAttribute('src');
        
        if (!alt && src && !src.startsWith('data:')) {
          issues.push({
            id: `img-alt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: 'serious',
            wcagCriterion: '1.1.1',
            element: tagName,
            description: 'Image missing alt attribute',
            impact: 'Screen readers cannot describe image content',
            solution: 'Add descriptive alt attribute to image',
            autoFixable: false,
            tags: ['images', 'screen-reader', 'content'],
            context: {
              selector: this.getElementSelector(element),
              html: element.outerHTML.substring(0, 200),
              attributes: this.getElementAttributes(element)
            }
          });
        }
      }
      
      // Check form inputs for labels
      if (['input', 'select', 'textarea'].includes(tagName)) {
        const type = element.getAttribute('type');
        if (type !== 'hidden' && !ariaLabel && !ariaLabelledBy) {
          const associatedLabel = document.querySelector(`label[for="${element.id}"]`);
          if (!associatedLabel && !element.closest('label')) {
            issues.push({
              id: `form-label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              severity: 'critical',
              wcagCriterion: '3.3.2',
              element: tagName,
              description: 'Form input missing accessible label',
              impact: 'Screen readers cannot identify input purpose',
              solution: 'Add label element or aria-label attribute',
              autoFixable: false,
              tags: ['forms', 'labels', 'screen-reader'],
              context: {
                selector: this.getElementSelector(element),
                html: element.outerHTML.substring(0, 200),
                attributes: this.getElementAttributes(element)
              }
            });
          }
        }
      }
    }
    
    return issues;
  }

  private async checkFormAccessibility(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    const forms = document.querySelectorAll('form');
    
    for (const form of Array.from(forms)) {
      // Check for fieldsets and legends
      const fieldsets = form.querySelectorAll('fieldset');
      const inputs = form.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      
      if (inputs.length > 1 && fieldsets.length === 0) {
        issues.push({
          id: `form-fieldset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: 'moderate',
          wcagCriterion: '1.3.1',
          element: 'form',
          description: 'Form with multiple related inputs missing fieldset grouping',
          impact: 'Screen readers may not understand input relationships',
          solution: 'Group related form controls with fieldset and legend',
          autoFixable: false,
          tags: ['forms', 'grouping', 'structure'],
          context: {
            selector: this.getElementSelector(form),
            html: form.outerHTML.substring(0, 200),
            attributes: this.getElementAttributes(form)
          }
        });
      }
      
      // Check for error messages
      const errorElements = form.querySelectorAll('[aria-invalid="true"]');
      for (const errorElement of Array.from(errorElements)) {
        const ariaDescribedBy = errorElement.getAttribute('aria-describedby');
        if (!ariaDescribedBy) {
          issues.push({
            id: `form-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: 'serious',
            wcagCriterion: '3.3.3',
            element: errorElement.tagName.toLowerCase(),
            description: 'Invalid form field missing error message association',
            impact: 'Screen readers cannot announce error messages',
            solution: 'Associate error messages using aria-describedby',
            autoFixable: false,
            tags: ['forms', 'errors', 'screen-reader'],
            context: {
              selector: this.getElementSelector(errorElement),
              html: errorElement.outerHTML.substring(0, 200),
              attributes: this.getElementAttributes(errorElement)
            }
          });
        }
      }
    }
    
    return issues;
  }

  private async checkImageAccessibility(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    const images = document.querySelectorAll('img, svg, canvas');
    
    for (const image of Array.from(images)) {
      const tagName = image.tagName.toLowerCase();
      
      if (tagName === 'img') {
        const alt = image.getAttribute('alt');
        const src = image.getAttribute('src');
        
        if (src && !src.startsWith('data:') && alt === null) {
          issues.push({
            id: `img-missing-alt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: 'serious',
            wcagCriterion: '1.1.1',
            element: tagName,
            description: 'Informative image missing alt attribute',
            impact: 'Screen readers cannot convey image information',
            solution: 'Add descriptive alt attribute or alt="" for decorative images',
            autoFixable: false,
            tags: ['images', 'alt-text', 'screen-reader'],
            context: {
              selector: this.getElementSelector(image),
              html: image.outerHTML.substring(0, 200),
              attributes: this.getElementAttributes(image)
            }
          });
        }
      }
      
      if (tagName === 'svg') {
        const titleElement = image.querySelector('title');
        const ariaLabel = image.getAttribute('aria-label');
        const ariaLabelledBy = image.getAttribute('aria-labelledby');
        const role = image.getAttribute('role');
        
        if (!titleElement && !ariaLabel && !ariaLabelledBy && role !== 'presentation') {
          issues.push({
            id: `svg-missing-label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: 'moderate',
            wcagCriterion: '1.1.1',
            element: tagName,
            description: 'SVG missing accessible name',
            impact: 'Screen readers cannot describe SVG content',
            solution: 'Add title element, aria-label, or role="presentation" for decorative SVGs',
            autoFixable: false,
            tags: ['svg', 'labels', 'screen-reader'],
            context: {
              selector: this.getElementSelector(image),
              html: image.outerHTML.substring(0, 200),
              attributes: this.getElementAttributes(image)
            }
          });
        }
      }
    }
    
    return issues;
  }

  private async checkHeadingStructure(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
    let previousLevel = 0;
    let hasH1 = false;
    
    for (const heading of Array.from(headings)) {
      const tagName = heading.tagName.toLowerCase();
      const role = heading.getAttribute('role');
      const ariaLevel = heading.getAttribute('aria-level');
      
      let level: number;
      if (role === 'heading' && ariaLevel) {
        level = parseInt(ariaLevel);
      } else if (tagName.startsWith('h')) {
        level = parseInt(tagName.charAt(1));
      } else {
        continue;
      }
      
      if (level === 1) {
        hasH1 = true;
      }
      
      // Check for skipped heading levels
      if (previousLevel > 0 && level > previousLevel + 1) {
        issues.push({
          id: `heading-skip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: 'moderate',
          wcagCriterion: '1.3.1',
          element: tagName,
          description: `Heading level skipped from h${previousLevel} to h${level}`,
          impact: 'Screen readers may not understand document structure',
          solution: 'Use heading levels in sequential order',
          autoFixable: false,
          tags: ['headings', 'structure', 'navigation'],
          context: {
            selector: this.getElementSelector(heading),
            html: heading.outerHTML.substring(0, 200),
            attributes: this.getElementAttributes(heading)
          }
        });
      }
      
      previousLevel = level;
    }
    
    // Check for missing h1
    if (headings.length > 0 && !hasH1) {
      issues.push({
        id: `missing-h1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        severity: 'serious',
        wcagCriterion: '1.3.1',
        element: 'document',
        description: 'Page missing h1 heading',
        impact: 'Screen readers cannot identify main page content',
        solution: 'Add h1 heading to identify main page content',
        autoFixable: false,
        tags: ['headings', 'structure', 'h1'],
        context: {
          selector: 'document',
          html: '',
          attributes: {}
        }
      });
    }
    
    return issues;
  }

  private async checkLandmarks(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    const landmarks = document.querySelectorAll(
      'main, nav, header, footer, aside, section, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]'
    );
    
    const landmarkTypes = new Set<string>();
    
    for (const landmark of Array.from(landmarks)) {
      const tagName = landmark.tagName.toLowerCase();
      const role = landmark.getAttribute('role');
      
      let landmarkType = role || this.getImplicitRole(tagName);
      if (landmarkType) {
        landmarkTypes.add(landmarkType);
      }
      
      // Check for landmark labels when multiple of same type exist
      const sameTypeLandmarks = document.querySelectorAll(
        `${tagName}${role ? `[role="${role}"]` : ''}`
      );
      
      if (sameTypeLandmarks.length > 1) {
        const ariaLabel = landmark.getAttribute('aria-label');
        const ariaLabelledBy = landmark.getAttribute('aria-labelledby');
        
        if (!ariaLabel && !ariaLabelledBy) {
          issues.push({
            id: `landmark-label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: 'moderate',
            wcagCriterion: '2.4.6',
            element: tagName,
            description: `Multiple ${landmarkType} landmarks without distinguishing labels`,
            impact: 'Screen reader users cannot distinguish between similar landmarks',
            solution: 'Add aria-label or aria-labelledby to distinguish landmarks',
            autoFixable: false,
            tags: ['landmarks', 'labels', 'navigation'],
            context: {
              selector: this.getElementSelector(landmark),
              html: landmark.outerHTML.substring(0, 200),
              attributes: this.getElementAttributes(landmark)
            }
          });
        }
      }
    }
    
    // Check for missing main landmark
    if (!landmarkTypes.has('main')) {
      issues.push({
        id: `missing-main-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        severity: 'serious',
        wcagCriterion: '2.4.1',
        element: 'document',
        description: 'Page missing main landmark',
        impact: 'Screen readers cannot identify main content area',
        solution: 'Add main element or role="main" to identify main content',
        autoFixable: false,
        tags: ['landmarks', 'main', 'structure'],
        context: {
          selector: 'document',
          html: '',
          attributes: {}
        }
      });
    }
    
    return issues;
  }

  private async checkFocusManagement(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    // Check for focus traps in modals and dialogs
    const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal, .dialog');
    
    for (const modal of Array.from(modals)) {
      const focusableElements = this.getFocusableElements(modal);
      
      if (focusableElements.length === 0) {
        issues.push({
          id: `modal-no-focus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: 'critical',
          wcagCriterion: '2.1.2',
          element: modal.tagName.toLowerCase(),
          description: 'Modal/dialog contains no focusable elements',
          impact: 'Keyboard users cannot interact with modal content',
          solution: 'Ensure modal contains focusable elements or add tabindex="-1"',
          autoFixable: false,
          tags: ['focus', 'modals', 'keyboard'],
          context: {
            selector: this.getElementSelector(modal),
            html: modal.outerHTML.substring(0, 200),
            attributes: this.getElementAttributes(modal)
          }
        });
      }
    }
    
    return issues;
  }

  private async checkCrisisAccessibility(): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    // Check crisis/panic buttons for accessibility
    const crisisButtons = document.querySelectorAll(
      '[data-crisis], [data-panic], .crisis-button, .panic-button, [aria-label*="crisis"], [aria-label*="panic"], [aria-label*="emergency"]'
    );
    
    for (const button of Array.from(crisisButtons)) {
      const ariaLabel = button.getAttribute('aria-label');
      const textContent = button.textContent?.trim();
      
      if (!ariaLabel && (!textContent || textContent.length < 3)) {
        issues.push({
          id: `crisis-button-label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: 'critical',
          wcagCriterion: '4.1.2',
          element: button.tagName.toLowerCase(),
          description: 'Crisis/panic button missing accessible name',
          impact: 'Screen readers cannot identify emergency button purpose',
          solution: 'Add descriptive aria-label to crisis button',
          autoFixable: false,
          tags: ['crisis', 'emergency', 'buttons', 'labels'],
          context: {
            selector: this.getElementSelector(button),
            html: button.outerHTML.substring(0, 200),
            attributes: this.getElementAttributes(button)
          }
        });
      }
      
      // Check button size for motor accessibility
      const styles = window.getComputedStyle(button);
      const width = parseFloat(styles.width);
      const height = parseFloat(styles.height);
      
      if (width < 44 || height < 44) {
        issues.push({
          id: `crisis-button-size-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          severity: 'serious',
          wcagCriterion: '2.5.5',
          element: button.tagName.toLowerCase(),
          description: 'Crisis button too small for easy activation',
          impact: 'Users with motor impairments may have difficulty activating button',
          solution: 'Increase button size to minimum 44x44 pixels',
          autoFixable: true,
          tags: ['crisis', 'touch-target', 'motor', 'size'],
          context: {
            selector: this.getElementSelector(button),
            html: button.outerHTML.substring(0, 200),
            attributes: this.getElementAttributes(button)
          }
        });
      }
    }
    
    return issues;
  }

  private calculateComplianceScore(issues: AccessibilityIssue[]): number {
    if (issues.length === 0) return 100;
    
    const weights = {
      critical: 25,
      serious: 15,
      moderate: 8,
      minor: 3
    };
    
    let totalDeductions = 0;
    for (const issue of issues) {
      totalDeductions += weights[issue.severity];
    }
    
    return Math.max(0, 100 - totalDeductions);
  }

  private determineComplianceStatus(score: number): 'compliant' | 'partial' | 'non-compliant' {
    if (score >= 95) return 'compliant';
    if (score >= 70) return 'partial';
    return 'non-compliant';
  }

  private generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations: string[] = [];
    const issueTypes = new Set(issues.map(issue => issue.tags[0]));
    
    if (issueTypes.has('color')) {
      recommendations.push('Review color choices for sufficient contrast ratios');
    }
    
    if (issueTypes.has('keyboard')) {
      recommendations.push('Implement comprehensive keyboard navigation support');
    }
    
    if (issueTypes.has('screen-reader')) {
      recommendations.push('Add proper ARIA labels and descriptions for screen readers');
    }
    
    if (issueTypes.has('forms')) {
      recommendations.push('Ensure all form inputs have associated labels');
    }
    
    if (issueTypes.has('images')) {
      recommendations.push('Provide alternative text for all informative images');
    }
    
    if (issueTypes.has('crisis')) {
      recommendations.push('Optimize crisis features for accessibility in emergency situations');
    }
    
    return recommendations;
  }

  private async applyAutoFixes(issues: AccessibilityIssue[]): Promise<boolean> {
    let fixesApplied = false;
    
    for (const issue of issues) {
      if (!issue.autoFixable) continue;
      
      try {
        const element = document.querySelector(issue.context.selector);
        if (!element) continue;
        
        switch (issue.tags[0]) {
          case 'focus':
            if (issue.description.includes('focus indicator')) {
              (element as HTMLElement).style.outline = '2px solid #005fcc';
              fixesApplied = true;
            }
            break;
            
          case 'touch-target':
            if (issue.description.includes('too small')) {
              (element as HTMLElement).style.minWidth = '44px';
              (element as HTMLElement).style.minHeight = '44px';
              fixesApplied = true;
            }
            break;
            
          case 'keyboard':
            if (issue.description.includes('tabindex')) {
              element.setAttribute('tabindex', '0');
              fixesApplied = true;
            }
            break;
        }
      } catch (error) {
        logger.warn(`Failed to apply auto-fix for issue: ${issue.id}`, error);
      }
    }
    
    return fixesApplied;
  }

  // Utility methods
  private calculateContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    const l1 = this.getRelativeLuminance(rgb1);
    const l2 = this.getRelativeLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private parseColor(color: string): { r: number; g: number; b: number } {
    // Simplified color parsing - in production, use a robust color library
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    return { r, g, b };
  }

  private getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const sRGB = (c: number) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    
    return 0.2126 * sRGB(rgb.r) + 0.7152 * sRGB(rgb.g) + 0.0722 * sRGB(rgb.b);
  }

  private getRequiredContrastRatio(fontSize: string, fontWeight: string): number {
    const size = parseFloat(fontSize);
    const weight = parseInt(fontWeight) || 400;
    
    // Large text (18pt+ or 14pt+ bold) requires 3:1, normal text requires 4.5:1
    const isLargeText = size >= 24 || (size >= 18.7 && weight >= 700);
    return isLargeText ? 3 : 4.5;
  }

  private isTransparent(color: string): boolean {
    return color === 'transparent' || color === 'rgba(0, 0, 0, 0)' || color.includes('rgba') && color.endsWith(', 0)');
  }

  private getElementSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
      }
    }
    
    return element.tagName.toLowerCase();
  }

  private getElementAttributes(element: Element): Record<string, string> {
    const attributes: Record<string, string> = {};
    for (const attr of Array.from(element.attributes)) {
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  private getImplicitRole(tagName: string): string | null {
    const implicitRoles: Record<string, string> = {
      main: 'main',
      nav: 'navigation',
      header: 'banner',
      footer: 'contentinfo',
      aside: 'complementary'
    };
    
    return implicitRoles[tagName] || null;
  }

  private getFocusableElements(container: Element): HTMLElement[] {
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelector)) as HTMLElement[];
  }

  private async applyAccessibilitySettings(): Promise<void> {
    try {
      const root = document.documentElement;
      
      // Apply visual preferences
      if (this.preferences.highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }
      
      if (this.preferences.largeText) {
        root.classList.add('large-text');
      } else {
        root.classList.remove('large-text');
      }
      
      if (this.preferences.reducedMotion) {
        root.classList.add('reduced-motion');
      } else {
        root.classList.remove('reduced-motion');
      }
      
      // Apply font size
      root.style.setProperty('--font-size-multiplier', `${this.preferences.fontSize / 100}`);
      root.style.setProperty('--line-height-multiplier', `${this.preferences.lineHeight}`);
      root.style.setProperty('--letter-spacing-adjustment', `${this.preferences.letterSpacing}em`);
      
      // Apply color blindness support
      if (this.preferences.colorBlindnessSupport) {
        root.classList.add(`color-blindness-${this.preferences.colorBlindnessSupport}`);
      }
      
      // Apply crisis mode settings
      if (this.preferences.crisisMode) {
        root.classList.add('crisis-mode');
        root.style.setProperty('--panic-button-size', this.preferences.panicButtonSize);
      }
      
      logger.info('Accessibility settings applied successfully');
    } catch (error) {
      logger.error('Failed to apply accessibility settings', error);
      throw error;
    }
  }

  private setupRealTimeMonitoring(): void {
    // Set up mutation observer for real-time accessibility monitoring
    this.observer = new MutationObserver((mutations) => {
      let shouldReaudit = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if added nodes contain interactive elements
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (this.hasInteractiveElements(element)) {
                shouldReaudit = true;
                break;
              }
            }
          }
        }
        
        if (mutation.type === 'attributes') {
          const attributeName = mutation.attributeName;
          if (attributeName && ['role', 'aria-label', 'aria-labelledby', 'tabindex'].includes(attributeName)) {
            shouldReaudit = true;
          }
        }
      }
      
      if (shouldReaudit) {
        // Debounce re-auditing
        clearTimeout(this.reauditTimeout);
        this.reauditTimeout = setTimeout(() => {
          this.runAccessibilityAudit();
        }, 1000);
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['role', 'aria-label', 'aria-labelledby', 'tabindex', 'alt']
    });
  }

  private reauditTimeout: NodeJS.Timeout | null = null;

  private hasInteractiveElements(element: Element): boolean {
    const interactiveSelector = 'button, input, select, textarea, a[href], [tabindex], [role="button"]';
    return element.matches(interactiveSelector) || element.querySelector(interactiveSelector) !== null;
  }

  private setupKeyboardNavigation(): void {
    // Enhanced keyboard navigation support
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    
    // Skip to content link
    if (this.preferences.skipToContent) {
      this.createSkipToContentLink();
    }
  }

  private handleKeyboardNavigation(event: KeyboardEvent): void {
    // Handle emergency shortcuts
    if (this.preferences.emergencyShortcuts) {
      if (event.ctrlKey && event.shiftKey && event.key === 'H') {
        event.preventDefault();
        this.triggerCrisisMode();
        return;
      }
    }
    
    // Handle focus management
    if (event.key === 'Tab') {
      this.manageFocusNavigation(event);
    }
    
    // Handle escape key for modal dismissal
    if (event.key === 'Escape') {
      this.handleEscapeKey();
    }
  }

  private manageFocusNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements(document.body);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    // Implement focus trap for modals
    const currentModal = document.querySelector('[role="dialog"][aria-hidden="false"], [role="alertdialog"][aria-hidden="false"]');
    if (currentModal) {
      const modalFocusableElements = this.getFocusableElements(currentModal);
      
      if (modalFocusableElements.length > 0) {
        const currentModalIndex = modalFocusableElements.indexOf(document.activeElement as HTMLElement);
        
        if (event.shiftKey) {
          // Shift+Tab - go to previous element
          if (currentModalIndex <= 0) {
            event.preventDefault();
            modalFocusableElements[modalFocusableElements.length - 1].focus();
          }
        } else {
          // Tab - go to next element
          if (currentModalIndex >= modalFocusableElements.length - 1) {
            event.preventDefault();
            modalFocusableElements[0].focus();
          }
        }
      }
    }
  }

  private handleEscapeKey(): void {
    // Close topmost modal or dialog
    const openModal = document.querySelector('[role="dialog"][aria-hidden="false"], [role="alertdialog"][aria-hidden="false"]');
    if (openModal) {
      const closeButton = openModal.querySelector('[data-dismiss], [aria-label*="close"], .close');
      if (closeButton) {
        (closeButton as HTMLElement).click();
      }
    }
  }

  private createSkipToContentLink(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-to-content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 10000;
      border-radius: 4px;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  private setupAssistiveTechnologySupport(): void {
    // Announce dynamic content changes
    if (this.preferences.announceChanges) {
      this.setupLiveRegions();
    }
    
    // Enhanced screen reader support
    if (this.preferences.screenReader) {
      this.optimizeForScreenReaders();
    }
  }

  private setupLiveRegions(): void {
    // Create polite and assertive live regions
    const politeRegion = document.createElement('div');
    politeRegion.id = 'polite-announcements';
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
    
    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'assertive-announcements';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
    
    document.body.appendChild(politeRegion);
    document.body.appendChild(assertiveRegion);
  }

  private optimizeForScreenReaders(): void {
    // Add skip navigation links
    this.addSkipNavigation();
    
    // Enhance form labels
    this.enhanceFormLabels();
    
    // Add landmark roles where missing
    this.addMissingLandmarks();
  }

  private addSkipNavigation(): void {
    const nav = document.querySelector('nav');
    if (nav) {
      const skipNav = document.createElement('a');
      skipNav.href = '#main-content';
      skipNav.textContent = 'Skip navigation';
      skipNav.className = 'skip-navigation';
      nav.insertBefore(skipNav, nav.firstChild);
    }
  }

  private enhanceFormLabels(): void {
    const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
    
    for (const input of Array.from(inputs)) {
      if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        const label = document.querySelector(`label[for="${input.id}"]`) || input.closest('label');
        if (!label) {
          // Try to find nearby text that could serve as a label
          const placeholder = input.getAttribute('placeholder');
          if (placeholder) {
            input.setAttribute('aria-label', placeholder);
          }
        }
      }
    }
  }

  private addMissingLandmarks(): void {
    // Add main landmark if missing
    if (!document.querySelector('main, [role="main"]')) {
      const content = document.querySelector('.content, .main-content, #content, #main-content');
      if (content) {
        content.setAttribute('role', 'main');
      }
    }
  }

  private detectSystemPreferences(): void {
    // Detect system-level accessibility preferences
    if (window.matchMedia) {
      // Detect reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (prefersReducedMotion.matches && !this.preferences.reducedMotion) {
        this.updatePreferences({ reducedMotion: true });
      }
      
      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      if (prefersHighContrast.matches && !this.preferences.highContrast) {
        this.updatePreferences({ highContrast: true });
      }
      
      // Listen for changes
      prefersReducedMotion.addListener((e) => {
        this.updatePreferences({ reducedMotion: e.matches });
      });
      
      prefersHighContrast.addListener((e) => {
        this.updatePreferences({ highContrast: e.matches });
      });
    }
  }

  private triggerCrisisMode(): void {
    this.updatePreferences({ crisisMode: true });
    
    // Announce crisis mode activation
    this.announceToScreenReader('Crisis mode activated', 'assertive');
    
    // Trigger haptic feedback if available
    if (this.preferences.crisisVibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
    logger.info('Crisis mode activated via keyboard shortcut');
  }

  private announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const regionId = priority === 'assertive' ? 'assertive-announcements' : 'polite-announcements';
    const region = document.getElementById(regionId);
    
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const stored = localStorage.getItem('accessibility-preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = { ...this.preferences, ...parsed };
      }
    } catch (error) {
      logger.warn('Failed to load accessibility preferences', error);
    }
  }

  private async saveUserPreferences(): Promise<void> {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      logger.warn('Failed to save accessibility preferences', error);
    }
  }

  private emitEvent(event: AccessibilityEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        logger.warn('Error in accessibility event listener', error);
      }
    }
  }

  // Public API methods
  public getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }

  public getConfiguration(): AccessibilityConfiguration {
    return { ...this.configuration };
  }

  public updateConfiguration(config: Partial<AccessibilityConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
  }

  public getAuditHistory(): AccessibilityAudit[] {
    return [...this.auditHistory];
  }

  public getLatestAudit(): AccessibilityAudit | null {
    return this.auditHistory.length > 0 ? this.auditHistory[this.auditHistory.length - 1] : null;
  }

  public getMetrics(): AccessibilityMetrics {
    const latestAudit = this.getLatestAudit();
    
    if (!latestAudit) {
      return {
        complianceScore: 0,
        wcagLevel: this.configuration.wcagLevel,
        totalIssues: 0,
        criticalIssues: 0,
        seriousIssues: 0,
        moderateIssues: 0,
        minorIssues: 0,
        fixedIssues: 0,
        remainingIssues: 0,
        lastAuditDate: new Date(),
        improvementTrend: 'stable'
      };
    }
    
    const issuesBySeverity = latestAudit.issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      complianceScore: latestAudit.score,
      wcagLevel: latestAudit.wcagLevel,
      totalIssues: latestAudit.issues.length,
      criticalIssues: issuesBySeverity.critical || 0,
      seriousIssues: issuesBySeverity.serious || 0,
      moderateIssues: issuesBySeverity.moderate || 0,
      minorIssues: issuesBySeverity.minor || 0,
      fixedIssues: latestAudit.autoFixApplied ? latestAudit.issues.filter(i => i.autoFixable).length : 0,
      remainingIssues: latestAudit.issues.filter(i => !i.autoFixable).length,
      lastAuditDate: latestAudit.timestamp,
      improvementTrend: this.calculateImprovementTrend()
    };
  }

  private calculateImprovementTrend(): 'improving' | 'stable' | 'declining' {
    if (this.auditHistory.length < 2) return 'stable';
    
    const recent = this.auditHistory.slice(-3);
    const scores = recent.map(audit => audit.score);
    
    if (scores.every((score, i) => i === 0 || score >= scores[i - 1])) {
      return 'improving';
    } else if (scores.every((score, i) => i === 0 || score <= scores[i - 1])) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  public generateReport(period?: { start: Date; end: Date }): AccessibilityReport {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const defaultPeriod = {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: now
    };
    
    const reportPeriod = period || defaultPeriod;
    const relevantAudits = this.auditHistory.filter(
      audit => audit.timestamp >= reportPeriod.start && audit.timestamp <= reportPeriod.end
    );
    
    const metrics = this.getMetrics();
    
    return {
      id: reportId,
      generatedAt: now,
      period: reportPeriod,
      metrics,
      audits: relevantAudits,
      trends: {
        complianceOverTime: relevantAudits.map(audit => ({
          date: audit.timestamp,
          score: audit.score
        })),
        issuesByCategory: this.categorizeIssues(relevantAudits),
        userImpactAnalysis: this.generateUserImpactAnalysis(relevantAudits)
      },
      recommendations: this.generateReportRecommendations(relevantAudits),
      actionItems: this.generateActionItems(relevantAudits)
    };
  }

  private categorizeIssues(audits: AccessibilityAudit[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    for (const audit of audits) {
      for (const issue of audit.issues) {
        const category = issue.tags[0] || 'other';
        categories[category] = (categories[category] || 0) + 1;
      }
    }
    
    return categories;
  }

  private generateUserImpactAnalysis(audits: AccessibilityAudit[]): string[] {
    const analysis: string[] = [];
    
    if (audits.length === 0) {
      return ['No accessibility audits available for analysis'];
    }
    
    const latestAudit = audits[audits.length - 1];
    const criticalIssues = latestAudit.issues.filter(i => i.severity === 'critical');
    
    if (criticalIssues.length > 0) {
      analysis.push(`${criticalIssues.length} critical accessibility barriers may prevent users from accessing key features`);
    }
    
    const keyboardIssues = latestAudit.issues.filter(i => i.tags.includes('keyboard'));
    if (keyboardIssues.length > 0) {
      analysis.push(`${keyboardIssues.length} issues may impact keyboard-only users`);
    }
    
    const screenReaderIssues = latestAudit.issues.filter(i => i.tags.includes('screen-reader'));
    if (screenReaderIssues.length > 0) {
      analysis.push(`${screenReaderIssues.length} issues may impact screen reader users`);
    }
    
    return analysis;
  }

  private generateReportRecommendations(audits: AccessibilityAudit[]): string[] {
    const recommendations = new Set<string>();
    
    for (const audit of audits) {
      for (const rec of audit.recommendations) {
        recommendations.add(rec);
      }
    }
    
    return Array.from(recommendations);
  }

  private generateActionItems(audits: AccessibilityAudit[]): Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    estimatedEffort: string;
    impact: string;
  }> {
    const actionItems: Array<{
      priority: 'high' | 'medium' | 'low';
      description: string;
      estimatedEffort: string;
      impact: string;
    }> = [];
    
    if (audits.length === 0) return actionItems;
    
    const latestAudit = audits[audits.length - 1];
    const criticalIssues = latestAudit.issues.filter(i => i.severity === 'critical');
    const seriousIssues = latestAudit.issues.filter(i => i.severity === 'serious');
    
    if (criticalIssues.length > 0) {
      actionItems.push({
        priority: 'high',
        description: `Fix ${criticalIssues.length} critical accessibility issues`,
        estimatedEffort: 'High',
        impact: 'Critical - blocks user access'
      });
    }
    
    if (seriousIssues.length > 0) {
      actionItems.push({
        priority: 'medium',
        description: `Address ${seriousIssues.length} serious accessibility issues`,
        estimatedEffort: 'Medium',
        impact: 'High - significantly impacts usability'
      });
    }
    
    return actionItems;
  }

  public addEventListener(listener: (event: AccessibilityEvent) => void): void {
    this.eventListeners.push(listener);
  }

  public removeEventListener(listener: (event: AccessibilityEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.reauditTimeout) {
      clearTimeout(this.reauditTimeout);
      this.reauditTimeout = null;
    }
    
    this.eventListeners = [];
    this.isInitialized = false;
    
    logger.info('Accessibility service destroyed');
  }
}

// Create singleton instance
export const accessibilityService = new AccessibilityService();

export default accessibilityService;
