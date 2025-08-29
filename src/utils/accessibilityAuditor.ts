/**
 * Mobile Accessibility Audit Utility
 *
 * Comprehensive accessibility testing and reporting system for mobile web applications.
 * Performs automated WCAG 2.1 Level AA compliance checks with mobile-specific considerations.
 */

export interface AccessibilityAuditResult {
  score: number; // 0-100 scale
  issues: AccessibilityIssue[];
  suggestions: string[];
  compliantAreas: string[];
  summary: AuditSummary;
}

export interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'perceivable' | 'operable' | 'understandable' | 'robust';
  description: string;
  element?: string;
  wcagCriterion: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fix?: string;
  xpath?: string;
  selector?: string;
}

export interface AuditSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface AccessibilityAuditConfig {
  checkLevel: 'AA' | 'AAA';
  includeWarnings: boolean;
  mobileOptimized: boolean;
  skipElementsWithAriaHidden: boolean;
  customRules: AccessibilityRule[];
  focusableElements: boolean;
  colorContrast: boolean;
  keyboardNavigation: boolean;
  screenReaderCompatibility: boolean;
}

export interface AccessibilityRule {
  id: string;
  description: string;
  wcagCriterion: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  check: (element: Element) => boolean;
  fix?: string;
  category: 'perceivable' | 'operable' | 'understandable' | 'robust';
}

export interface ColorContrastResult {
  ratio: number;
  level: 'AAA' | 'AA' | 'fail';
  foreground: string;
  background: string;
  element: Element;
}

class AccessibilityAuditor {
  private config: AccessibilityAuditConfig;
  private issues: AccessibilityIssue[] = [];
  private compliantAreas: string[] = [];
  private checkCount = 0;
  private passCount = 0;

  constructor(config: Partial<AccessibilityAuditConfig> = {}) {
    this.config = {
      checkLevel: 'AA',
      includeWarnings: true,
      mobileOptimized: true,
      skipElementsWithAriaHidden: false,
      customRules: [],
      focusableElements: true,
      colorContrast: true,
      keyboardNavigation: true,
      screenReaderCompatibility: true,
      ...config
    };
  }

  /**
   * Perform comprehensive accessibility audit
   */
  public async audit(container: Element = document.body): Promise<AccessibilityAuditResult> {
    this.resetAudit();

    try {
      // Core accessibility checks
      await this.checkImages(container);
      await this.checkHeadings(container);
      await this.checkLinks(container);
      await this.checkForms(container);
      await this.checkButtons(container);
      await this.checkLandmarks(container);
      await this.checkTables(container);
      
      if (this.config.colorContrast) {
        await this.checkColorContrast(container);
      }

      if (this.config.focusableElements) {
        await this.checkFocusableElements(container);
      }

      if (this.config.keyboardNavigation) {
        await this.checkKeyboardNavigation(container);
      }

      if (this.config.mobileOptimized) {
        await this.checkMobileAccessibility(container);
      }

      // Run custom rules
      for (const rule of this.config.customRules) {
        await this.runCustomRule(rule, container);
      }

      return this.generateReport();

    } catch (error) {
      console.error('Accessibility audit failed:', error);
      throw new Error('Accessibility audit failed');
    }
  }

  /**
   * Check image accessibility
   */
  private async checkImages(container: Element): Promise<void> {
    const images = container.querySelectorAll('img');
    
    images.forEach((img, index) => {
      this.checkCount++;
      
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src');
      
      if (!alt && alt !== '') {
        this.addIssue({
          id: `img-alt-${index}`,
          type: 'error',
          category: 'perceivable',
          description: 'Image missing alt attribute',
          element: img.tagName.toLowerCase(),
          wcagCriterion: '1.1.1',
          severity: 'high',
          fix: 'Add descriptive alt attribute to image',
          selector: this.getElementSelector(img)
        });
      } else if (alt && alt.trim() === '' && !this.isDecorativeImage(img)) {
        this.addIssue({
          id: `img-empty-alt-${index}`,
          type: 'warning',
          category: 'perceivable',
          description: 'Image with empty alt text may not be decorative',
          element: img.tagName.toLowerCase(),
          wcagCriterion: '1.1.1',
          severity: 'medium',
          fix: 'Ensure empty alt is appropriate for decorative images',
          selector: this.getElementSelector(img)
        });
      } else {
        this.passCount++;
        this.compliantAreas.push('Image alt text');
      }

      // Check for redundant text in alt
      if (alt && (alt.toLowerCase().includes('image of') || alt.toLowerCase().includes('picture of'))) {
        this.addIssue({
          id: `img-redundant-alt-${index}`,
          type: 'warning',
          category: 'perceivable',
          description: 'Alt text contains redundant phrases',
          element: img.tagName.toLowerCase(),
          wcagCriterion: '1.1.1',
          severity: 'low',
          fix: 'Remove redundant phrases like "image of" from alt text',
          selector: this.getElementSelector(img)
        });
      }
    });
  }

  /**
   * Check heading structure
   */
  private async checkHeadings(container: Element): Promise<void> {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    let hasH1 = false;

    headings.forEach((heading, index) => {
      this.checkCount++;
      
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level === 1) {
        hasH1 = true;
      }

      // Check for heading level skipping
      if (previousLevel > 0 && level > previousLevel + 1) {
        this.addIssue({
          id: `heading-skip-${index}`,
          type: 'error',
          category: 'perceivable',
          description: `Heading level skipped from h${previousLevel} to h${level}`,
          element: heading.tagName.toLowerCase(),
          wcagCriterion: '1.3.1',
          severity: 'medium',
          fix: 'Use heading levels sequentially',
          selector: this.getElementSelector(heading)
        });
      }

      // Check for empty headings
      if (!heading.textContent?.trim()) {
        this.addIssue({
          id: `heading-empty-${index}`,
          type: 'error',
          category: 'perceivable',
          description: 'Empty heading element',
          element: heading.tagName.toLowerCase(),
          wcagCriterion: '1.3.1',
          severity: 'high',
          fix: 'Provide meaningful heading text',
          selector: this.getElementSelector(heading)
        });
      } else {
        this.passCount++;
      }

      previousLevel = level;
    });

    // Check for missing H1
    if (headings.length > 0 && !hasH1) {
      this.addIssue({
        id: 'missing-h1',
        type: 'warning',
        category: 'perceivable',
        description: 'Page missing H1 heading',
        wcagCriterion: '1.3.1',
        severity: 'medium',
        fix: 'Add a main H1 heading to the page'
      });
    } else if (hasH1) {
      this.compliantAreas.push('Heading structure');
    }
  }

  /**
   * Check link accessibility
   */
  private async checkLinks(container: Element): Promise<void> {
    const links = container.querySelectorAll('a[href]');
    
    links.forEach((link, index) => {
      this.checkCount++;
      
      const text = this.getLinkText(link);
      const href = link.getAttribute('href');
      
      if (!text.trim()) {
        this.addIssue({
          id: `link-empty-${index}`,
          type: 'error',
          category: 'operable',
          description: 'Link without accessible text',
          element: 'a',
          wcagCriterion: '2.4.4',
          severity: 'high',
          fix: 'Add descriptive text or aria-label to link',
          selector: this.getElementSelector(link)
        });
      } else if (this.isGenericLinkText(text)) {
        this.addIssue({
          id: `link-generic-${index}`,
          type: 'warning',
          category: 'operable',
          description: 'Link text is not descriptive',
          element: 'a',
          wcagCriterion: '2.4.4',
          severity: 'medium',
          fix: 'Use more descriptive link text',
          selector: this.getElementSelector(link)
        });
      } else {
        this.passCount++;
      }

      // Check for target="_blank" without warning
      if (link.getAttribute('target') === '_blank' && 
          !link.getAttribute('aria-label')?.includes('opens in new')) {
        this.addIssue({
          id: `link-new-window-${index}`,
          type: 'warning',
          category: 'operable',
          description: 'Link opens in new window without warning',
          element: 'a',
          wcagCriterion: '3.2.5',
          severity: 'low',
          fix: 'Add indication that link opens in new window',
          selector: this.getElementSelector(link)
        });
      }
    });

    if (links.length > 0 && this.issues.filter(i => i.element === 'a').length === 0) {
      this.compliantAreas.push('Link accessibility');
    }
  }

  /**
   * Check form accessibility
   */
  private async checkForms(container: Element): Promise<void> {
    const inputs = container.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input, index) => {
      this.checkCount++;
      
      const label = this.getAssociatedLabel(input);
      const type = input.getAttribute('type');
      
      if (!label && type !== 'hidden' && type !== 'submit' && type !== 'button') {
        this.addIssue({
          id: `form-no-label-${index}`,
          type: 'error',
          category: 'perceivable',
          description: 'Form control missing label',
          element: input.tagName.toLowerCase(),
          wcagCriterion: '1.3.1',
          severity: 'high',
          fix: 'Associate form control with a label',
          selector: this.getElementSelector(input)
        });
      } else if (label) {
        this.passCount++;
      }

      // Check for required fields
      if (input.hasAttribute('required') && !input.hasAttribute('aria-required')) {
        this.addIssue({
          id: `form-required-${index}`,
          type: 'warning',
          category: 'perceivable',
          description: 'Required field not marked with aria-required',
          element: input.tagName.toLowerCase(),
          wcagCriterion: '1.3.1',
          severity: 'low',
          fix: 'Add aria-required="true" to required fields',
          selector: this.getElementSelector(input)
        });
      }
    });

    const forms = container.querySelectorAll('form');
    forms.forEach((form, index) => {
      this.checkCount++;
      
      if (!form.getAttribute('role') && !form.querySelector('fieldset')) {
        this.addIssue({
          id: `form-structure-${index}`,
          type: 'info',
          category: 'perceivable',
          description: 'Form could benefit from better structure',
          element: 'form',
          wcagCriterion: '1.3.1',
          severity: 'low',
          fix: 'Consider using fieldset and legend for form sections',
          selector: this.getElementSelector(form)
        });
      }
    });

    if (inputs.length > 0 && this.issues.filter(i => i.description.includes('Form')).length === 0) {
      this.compliantAreas.push('Form accessibility');
    }
  }

  /**
   * Check button accessibility
   */
  private async checkButtons(container: Element): Promise<void> {
    const buttons = container.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"]');
    
    buttons.forEach((button, index) => {
      this.checkCount++;
      
      const text = this.getButtonText(button);
      
      if (!text.trim()) {
        this.addIssue({
          id: `button-empty-${index}`,
          type: 'error',
          category: 'operable',
          description: 'Button without accessible text',
          element: button.tagName.toLowerCase(),
          wcagCriterion: '2.4.4',
          severity: 'high',
          fix: 'Add text content or aria-label to button',
          selector: this.getElementSelector(button)
        });
      } else {
        this.passCount++;
      }
    });

    if (buttons.length > 0 && this.issues.filter(i => i.element?.includes('button')).length === 0) {
      this.compliantAreas.push('Button accessibility');
    }
  }

  /**
   * Check landmark accessibility
   */
  private async checkLandmarks(container: Element): Promise<void> {
    const landmarks = container.querySelectorAll('[role="main"], main, [role="navigation"], nav, [role="banner"], header, [role="contentinfo"], footer, [role="complementary"], aside');
    
    this.checkCount++;
    
    const hasMain = container.querySelector('[role="main"], main');
    if (!hasMain) {
      this.addIssue({
        id: 'missing-main-landmark',
        type: 'warning',
        category: 'perceivable',
        description: 'Page missing main landmark',
        wcagCriterion: '1.3.1',
        severity: 'medium',
        fix: 'Add main element or role="main" to primary content'
      });
    } else {
      this.passCount++;
      this.compliantAreas.push('Main landmark');
    }

    // Check for multiple main landmarks
    const mainLandmarks = container.querySelectorAll('[role="main"], main');
    if (mainLandmarks.length > 1) {
      this.addIssue({
        id: 'multiple-main-landmarks',
        type: 'error',
        category: 'perceivable',
        description: 'Multiple main landmarks found',
        wcagCriterion: '1.3.1',
        severity: 'high',
        fix: 'Use only one main landmark per page'
      });
    }
  }

  /**
   * Check table accessibility
   */
  private async checkTables(container: Element): Promise<void> {
    const tables = container.querySelectorAll('table');
    
    tables.forEach((table, index) => {
      this.checkCount++;
      
      const caption = table.querySelector('caption');
      const headers = table.querySelectorAll('th');
      
      if (!caption && !table.getAttribute('aria-label') && !table.getAttribute('aria-labelledby')) {
        this.addIssue({
          id: `table-no-caption-${index}`,
          type: 'warning',
          category: 'perceivable',
          description: 'Table missing caption or accessible name',
          element: 'table',
          wcagCriterion: '1.3.1',
          severity: 'medium',
          fix: 'Add caption element or aria-label to table',
          selector: this.getElementSelector(table)
        });
      }

      if (headers.length === 0) {
        this.addIssue({
          id: `table-no-headers-${index}`,
          type: 'error',
          category: 'perceivable',
          description: 'Table missing header cells',
          element: 'table',
          wcagCriterion: '1.3.1',
          severity: 'high',
          fix: 'Use th elements for table headers',
          selector: this.getElementSelector(table)
        });
      } else {
        this.passCount++;
      }
    });

    if (tables.length > 0 && this.issues.filter(i => i.element === 'table').length === 0) {
      this.compliantAreas.push('Table accessibility');
    }
  }

  /**
   * Check color contrast
   */
  private async checkColorContrast(container: Element): Promise<void> {
    const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label, li');
    
    for (let i = 0; i < Math.min(textElements.length, 50); i++) {
      const element = textElements[i];
      this.checkCount++;
      
      const styles = window.getComputedStyle(element);
      const fontSize = parseInt(styles.fontSize);
      const fontWeight = styles.fontWeight;
      
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
      const requiredRatio = isLargeText ? 3 : 4.5;
      
      try {
        const contrast = this.calculateColorContrast(element);
        if (contrast.ratio < requiredRatio) {
          this.addIssue({
            id: `color-contrast-${i}`,
            type: 'error',
            category: 'perceivable',
            description: `Insufficient color contrast ratio: ${contrast.ratio.toFixed(2)}:1`,
            element: element.tagName.toLowerCase(),
            wcagCriterion: '1.4.3',
            severity: 'high',
            fix: `Increase contrast ratio to at least ${requiredRatio}:1`,
            selector: this.getElementSelector(element)
          });
        } else {
          this.passCount++;
        }
      } catch (error) {
        // Skip elements where contrast cannot be calculated
        continue;
      }
    }

    if (this.issues.filter(i => i.description.includes('contrast')).length === 0) {
      this.compliantAreas.push('Color contrast');
    }
  }

  /**
   * Check focusable elements
   */
  private async checkFocusableElements(container: Element): Promise<void> {
    const focusableElements = container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    focusableElements.forEach((element, index) => {
      this.checkCount++;
      
      const tabindex = element.getAttribute('tabindex');
      
      if (tabindex && parseInt(tabindex) > 0) {
        this.addIssue({
          id: `positive-tabindex-${index}`,
          type: 'warning',
          category: 'operable',
          description: 'Positive tabindex found',
          element: element.tagName.toLowerCase(),
          wcagCriterion: '2.4.3',
          severity: 'medium',
          fix: 'Avoid positive tabindex values',
          selector: this.getElementSelector(element)
        });
      } else {
        this.passCount++;
      }
    });

    if (this.issues.filter(i => i.description.includes('tabindex')).length === 0) {
      this.compliantAreas.push('Focus management');
    }
  }

  /**
   * Check keyboard navigation
   */
  private async checkKeyboardNavigation(container: Element): Promise<void> {
    const interactiveElements = container.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [tabindex="0"]');
    
    interactiveElements.forEach((element, index) => {
      this.checkCount++;
      
      const role = element.getAttribute('role');
      const tagName = element.tagName.toLowerCase();
      
      // Check for custom interactive elements without proper keyboard support
      if ((role === 'button' || role === 'link') && tagName === 'div' && !element.hasAttribute('tabindex')) {
        this.addIssue({
          id: `keyboard-access-${index}`,
          type: 'error',
          category: 'operable',
          description: 'Interactive element not keyboard accessible',
          element: tagName,
          wcagCriterion: '2.1.1',
          severity: 'high',
          fix: 'Add tabindex="0" and keyboard event handlers',
          selector: this.getElementSelector(element)
        });
      } else {
        this.passCount++;
      }
    });

    if (this.issues.filter(i => i.description.includes('keyboard')).length === 0) {
      this.compliantAreas.push('Keyboard navigation');
    }
  }

  /**
   * Check mobile-specific accessibility
   */
  private async checkMobileAccessibility(container: Element): Promise<void> {
    // Check touch target size
    const touchTargets = container.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]');
    
    touchTargets.forEach((target, index) => {
      this.checkCount++;
      
      const rect = target.getBoundingClientRect();
      const minSize = 44; // 44px minimum touch target size
      
      if (rect.width < minSize || rect.height < minSize) {
        this.addIssue({
          id: `touch-target-${index}`,
          type: 'warning',
          category: 'operable',
          description: 'Touch target too small for mobile',
          element: target.tagName.toLowerCase(),
          wcagCriterion: '2.5.5',
          severity: 'medium',
          fix: 'Increase touch target size to at least 44x44 pixels',
          selector: this.getElementSelector(target)
        });
      } else {
        this.passCount++;
      }
    });

    // Check viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    this.checkCount++;
    
    if (!viewportMeta) {
      this.addIssue({
        id: 'missing-viewport-meta',
        type: 'error',
        category: 'robust',
        description: 'Missing viewport meta tag',
        wcagCriterion: '1.4.10',
        severity: 'high',
        fix: 'Add viewport meta tag for responsive design'
      });
    } else {
      this.passCount++;
      this.compliantAreas.push('Mobile viewport');
    }

    if (this.issues.filter(i => i.description.includes('mobile') || i.description.includes('touch')).length === 0) {
      this.compliantAreas.push('Mobile accessibility');
    }
  }

  /**
   * Run custom accessibility rule
   */
  private async runCustomRule(rule: AccessibilityRule, container: Element): Promise<void> {
    const elements = container.querySelectorAll('*');
    
    elements.forEach((element, index) => {
      this.checkCount++;
      
      try {
        if (!rule.check(element)) {
          this.addIssue({
            id: `custom-${rule.id}-${index}`,
            type: 'error',
            category: rule.category,
            description: rule.description,
            element: element.tagName.toLowerCase(),
            wcagCriterion: rule.wcagCriterion,
            severity: rule.severity,
            fix: rule.fix,
            selector: this.getElementSelector(element)
          });
        } else {
          this.passCount++;
        }
      } catch (error) {
        console.warn(`Custom rule ${rule.id} failed:`, error);
      }
    });
  }

  /**
   * Helper methods
   */
  private resetAudit(): void {
    this.issues = [];
    this.compliantAreas = [];
    this.checkCount = 0;
    this.passCount = 0;
  }

  private addIssue(issue: Omit<AccessibilityIssue, 'id'> & { id?: string }): void {
    this.issues.push({
      id: issue.id || `issue-${this.issues.length}`,
      type: issue.type,
      category: issue.category,
      description: issue.description,
      element: issue.element,
      wcagCriterion: issue.wcagCriterion,
      severity: issue.severity,
      fix: issue.fix,
      xpath: issue.xpath,
      selector: issue.selector
    });
  }

  private generateReport(): AccessibilityAuditResult {
    const score = this.checkCount > 0 ? Math.round((this.passCount / this.checkCount) * 100) : 100;
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

    const summary: AuditSummary = {
      totalChecks: this.checkCount,
      passedChecks: this.passCount,
      failedChecks: this.issues.filter(i => i.type === 'error').length,
      warningChecks: this.issues.filter(i => i.type === 'warning').length,
      score,
      grade
    };

    const suggestions = this.generateSuggestions();

    return {
      score,
      issues: this.issues,
      suggestions,
      compliantAreas: [...new Set(this.compliantAreas)],
      summary
    };
  }

  private generateSuggestions(): string[] {
    const suggestions: string[] = [];
    const errorCount = this.issues.filter(i => i.type === 'error').length;
    const warningCount = this.issues.filter(i => i.type === 'warning').length;

    if (errorCount > 0) {
      suggestions.push(`Fix ${errorCount} critical accessibility errors first`);
    }

    if (warningCount > 0) {
      suggestions.push(`Address ${warningCount} accessibility warnings to improve user experience`);
    }

    const commonIssues = this.getCommonIssueTypes();
    if (commonIssues.length > 0) {
      suggestions.push(`Focus on common issues: ${commonIssues.join(', ')}`);
    }

    if (this.issues.length === 0) {
      suggestions.push('Great job! Your content meets basic accessibility requirements');
    }

    return suggestions;
  }

  private getCommonIssueTypes(): string[] {
    const issueTypes: { [key: string]: number } = {};
    
    this.issues.forEach(issue => {
      const type = issue.description.split(' ')[0].toLowerCase();
      issueTypes[type] = (issueTypes[type] || 0) + 1;
    });

    return Object.entries(issueTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  private isDecorativeImage(img: Element): boolean {
    const role = img.getAttribute('role');
    const parent = img.parentElement;
    
    return role === 'presentation' || 
           role === 'none' || 
           parent?.tagName.toLowerCase() === 'figure';
  }

  private getLinkText(link: Element): string {
    return link.textContent?.trim() || 
           link.getAttribute('aria-label') || 
           link.getAttribute('title') || 
           link.querySelector('img')?.getAttribute('alt') || '';
  }

  private isGenericLinkText(text: string): boolean {
    const genericTexts = ['click here', 'read more', 'more', 'link', 'here', 'this'];
    return genericTexts.includes(text.toLowerCase().trim());
  }

  private getAssociatedLabel(input: Element): string | null {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledby = input.getAttribute('aria-labelledby');
    
    if (ariaLabel) return ariaLabel;
    
    if (ariaLabelledby) {
      const labelElement = document.getElementById(ariaLabelledby);
      return labelElement?.textContent?.trim() || null;
    }
    
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      return label?.textContent?.trim() || null;
    }
    
    const parentLabel = input.closest('label');
    return parentLabel?.textContent?.trim() || null;
  }

  private getButtonText(button: Element): string {
    return button.textContent?.trim() || 
           button.getAttribute('aria-label') || 
           button.getAttribute('title') || 
           button.getAttribute('value') || '';
  }

  private calculateColorContrast(element: Element): ColorContrastResult {
    const styles = window.getComputedStyle(element);
    const foreground = styles.color;
    const background = this.getBackgroundColor(element);
    
    const fgRgb = this.parseColor(foreground);
    const bgRgb = this.parseColor(background);
    
    const ratio = this.getContrastRatio(fgRgb, bgRgb);
    const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fail';
    
    return {
      ratio,
      level,
      foreground,
      background,
      element
    };
  }

  private getBackgroundColor(element: Element): string {
    let current: Element | null = element;
    
    while (current) {
      const bg = window.getComputedStyle(current).backgroundColor;
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return bg;
      }
      current = current.parentElement;
    }
    
    return 'rgb(255, 255, 255)'; // Default to white
  }

  private parseColor(color: string): [number, number, number] {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return [0, 0, 0]; // Default to black
  }

  private getContrastRatio([r1, g1, b1]: [number, number, number], [r2, g2, b2]: [number, number, number]): number {
    const l1 = this.getLuminance(r1, g1, b1);
    const l2 = this.getLuminance(r2, g2, b2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  private getElementSelector(element: Element): string {
    const id = element.getAttribute('id');
    if (id) return `#${id}`;
    
    const className = element.getAttribute('class');
    if (className) return `.${className.split(' ')[0]}`;
    
    return element.tagName.toLowerCase();
  }
}

// Export singleton instance and factory function
export const accessibilityAuditor = new AccessibilityAuditor();

export const createAccessibilityAuditor = (config?: Partial<AccessibilityAuditConfig>) => 
  new AccessibilityAuditor(config);

// Export utility functions
export const auditElement = async (element: Element, config?: Partial<AccessibilityAuditConfig>) => {
  const auditor = createAccessibilityAuditor(config);
  return auditor.audit(element);
};

export const quickAccessibilityCheck = async (container: Element = document.body) => {
  const auditor = createAccessibilityAuditor({
    checkLevel: 'AA',
    includeWarnings: false,
    mobileOptimized: true
  });
  
  return auditor.audit(container);
};
