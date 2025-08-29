/**
 * WCAG AAA Accessibility Validator
 * 
 * Comprehensive validation system ensuring full WCAG 2.1 Level AAA compliance
 * for the mental health platform. Provides real-time validation, automated testing,
 * and detailed reporting for accessibility issues.
 * 
 * @version 3.0.0
 * @wcag 2.1 Level AAA
 */

import { logger } from './logger';

// WCAG AAA Contrast Requirements
const CONTRAST_RATIOS = {
  AAA_NORMAL: 7.0,    // 7:1 for normal text
  AAA_LARGE: 4.5,     // 4.5:1 for large text (18pt+ or 14pt+ bold)
  AA_NORMAL: 4.5,     // For comparison
  AA_LARGE: 3.0,      // For comparison
  GRAPHICS: 3.0,      // For UI components and graphics
};

// Touch target requirements
const TOUCH_TARGETS = {
  MINIMUM: 44,        // WCAG 2.5.5 minimum
  RECOMMENDED: 48,    // Best practice
  SPACING: 8,         // Minimum spacing between targets
};

// Focus indicator requirements
const FOCUS_REQUIREMENTS = {
  MIN_CONTRAST: 3.0,
  MIN_WIDTH: 2,
  MIN_OFFSET: 1,
};

export interface ValidationResult {
  passed: boolean;
  score: number;
  level: 'A' | 'AA' | 'AAA';
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  timestamp: Date;
  duration: number;
}

export interface ValidationIssue {
  id: string;
  type: IssueType;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagCriterion: string;
  element: HTMLElement | null;
  selector: string;
  message: string;
  howToFix: string;
  impact: string[];
  autoFixable: boolean;
}

export interface ValidationWarning {
  id: string;
  type: WarningType;
  message: string;
  recommendation: string;
}

export type IssueType = 
  | 'contrast'
  | 'focus'
  | 'keyboard'
  | 'aria'
  | 'semantics'
  | 'forms'
  | 'images'
  | 'headings'
  | 'landmarks'
  | 'language'
  | 'links'
  | 'tables'
  | 'timing'
  | 'motion'
  | 'audio'
  | 'video'
  | 'touch';

export type WarningType =
  | 'performance'
  | 'bestPractice'
  | 'enhancement'
  | 'cognitive'
  | 'future';

export class AccessibilityValidator {
  private issues: ValidationIssue[] = [];
  private warnings: ValidationWarning[] = [];
  private startTime: number = 0;
  private checkedElements = new WeakSet<Element>();

  /**
   * Run complete WCAG AAA validation
   */
  public async validate(
    rootElement: HTMLElement = document.body,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    this.reset();
    this.startTime = performance.now();

    const config = {
      level: 'AAA' as const,
      includeWarnings: true,
      autoFix: false,
      ...options
    };

    try {
      // Run all validation checks
      await Promise.all([
        this.validateContrast(rootElement, config),
        this.validateKeyboardAccess(rootElement, config),
        this.validateARIA(rootElement, config),
        this.validateSemantics(rootElement, config),
        this.validateForms(rootElement, config),
        this.validateImages(rootElement, config),
        this.validateHeadings(rootElement, config),
        this.validateLandmarks(rootElement, config),
        this.validateLinks(rootElement, config),
        this.validateTables(rootElement, config),
        this.validateMotion(rootElement, config),
        this.validateTiming(rootElement, config),
        this.validateLanguage(rootElement, config),
        this.validateTouchTargets(rootElement, config),
        this.validateCognitive(rootElement, config),
        this.validateCrisisFeatures(rootElement, config),
      ]);

      // Calculate score and determine pass/fail
      const score = this.calculateScore();
      const passed = this.determinePass(score, config.level);

      const duration = performance.now() - this.startTime;

      const result: ValidationResult = {
        passed,
        score,
        level: config.level,
        issues: this.issues,
        warnings: config.includeWarnings ? this.warnings : [],
        timestamp: new Date(),
        duration
      };

      logger.info('Accessibility validation completed', {
        passed,
        score,
        issueCount: this.issues.length,
        warningCount: this.warnings.length,
        duration
      });

      return result;
    } catch (error) {
      logger.error('Accessibility validation failed', error);
      throw error;
    }
  }

  /**
   * Validate color contrast ratios for WCAG AAA
   */
  private async validateContrast(element: HTMLElement, config: ValidationOptions): Promise<void> {
    const textElements = element.querySelectorAll('*:not(script):not(style):not(noscript)');

    for (const el of Array.from(textElements)) {
      if (this.checkedElements.has(el)) continue;
      this.checkedElements.add(el);

      const htmlEl = el as HTMLElement;
      const text = htmlEl.textContent?.trim();
      if (!text || text.length === 0) continue;

      const styles = window.getComputedStyle(htmlEl);
      const bg = this.getBackgroundColor(htmlEl);
      const fg = styles.color;

      if (this.isTransparent(bg) || this.isTransparent(fg)) continue;

      const contrast = this.calculateContrast(fg, bg);
      const isLargeText = this.isLargeText(styles);
      const requiredRatio = isLargeText ? CONTRAST_RATIOS.AAA_LARGE : CONTRAST_RATIOS.AAA_NORMAL;

      if (contrast < requiredRatio) {
        this.addIssue({
          type: 'contrast',
          severity: contrast < requiredRatio * 0.7 ? 'critical' : 'serious',
          wcagCriterion: '1.4.6',
          element: htmlEl,
          selector: this.getSelector(htmlEl),
          message: `Insufficient contrast ratio ${contrast.toFixed(2)}:1 (required: ${requiredRatio}:1)`,
          howToFix: `Adjust colors to achieve ${requiredRatio}:1 contrast ratio for ${isLargeText ? 'large' : 'normal'} text`,
          impact: ['Users with low vision may not be able to read this text'],
          autoFixable: false
        });
      }
    }
  }

  /**
   * Validate keyboard accessibility
   */
  private async validateKeyboardAccess(element: HTMLElement, config: ValidationOptions): Promise<void> {
    // Check for keyboard traps
    const interactiveElements = element.querySelectorAll(
      'a, button, input, select, textarea, [tabindex], [role="button"], [role="link"]'
    );

    for (const el of Array.from(interactiveElements)) {
      const htmlEl = el as HTMLElement;
      const tabIndex = htmlEl.getAttribute('tabindex');

      // Check for positive tabindex (keyboard trap)
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addIssue({
          type: 'keyboard',
          severity: 'serious',
          wcagCriterion: '2.4.3',
          element: htmlEl,
          selector: this.getSelector(htmlEl),
          message: `Positive tabindex (${tabIndex}) disrupts natural tab order`,
          howToFix: 'Use tabindex="0" or remove tabindex to maintain natural tab order',
          impact: ['Keyboard users may experience confusing navigation'],
          autoFixable: true
        });
      }

      // Check for missing focus indicators
      const focusStyles = this.getFocusStyles(htmlEl);
      if (!this.hasSufficientFocusIndicator(focusStyles)) {
        this.addIssue({
          type: 'focus',
          severity: 'serious',
          wcagCriterion: '2.4.7',
          element: htmlEl,
          selector: this.getSelector(htmlEl),
          message: 'Missing or insufficient focus indicator',
          howToFix: 'Add visible focus outline with minimum 3:1 contrast ratio',
          impact: ['Keyboard users cannot see which element has focus'],
          autoFixable: true
        });
      }

      // Check for keyboard accessibility of custom components
      if (htmlEl.getAttribute('role') === 'button' && htmlEl.tagName !== 'BUTTON') {
        if (!htmlEl.hasAttribute('tabindex')) {
          this.addIssue({
            type: 'keyboard',
            severity: 'critical',
            wcagCriterion: '2.1.1',
            element: htmlEl,
            selector: this.getSelector(htmlEl),
            message: 'Custom button not keyboard accessible',
            howToFix: 'Add tabindex="0" and keyboard event handlers',
            impact: ['Keyboard users cannot activate this button'],
            autoFixable: true
          });
        }
      }
    }

    // Check for skip links
    const skipLinks = element.querySelectorAll('a[href^="#"]:first-of-type');
    if (skipLinks.length === 0 && element === document.body) {
      this.addWarning({
        type: 'enhancement',
        message: 'No skip navigation link found',
        recommendation: 'Add skip navigation links at the beginning of the page'
      });
    }
  }

  /**
   * Validate ARIA attributes and roles
   */
  private async validateARIA(element: HTMLElement, config: ValidationOptions): Promise<void> {
    const ariaElements = element.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]');

    for (const el of Array.from(ariaElements)) {
      const htmlEl = el as HTMLElement;
      const role = htmlEl.getAttribute('role');

      // Validate role values
      if (role && !this.isValidARIARole(role)) {
        this.addIssue({
          type: 'aria',
          severity: 'serious',
          wcagCriterion: '4.1.2',
          element: htmlEl,
          selector: this.getSelector(htmlEl),
          message: `Invalid ARIA role: "${role}"`,
          howToFix: 'Use a valid ARIA role from the ARIA specification',
          impact: ['Screen readers may not understand element purpose'],
          autoFixable: false
        });
      }

      // Check for required ARIA properties
      if (role) {
        const requiredProps = this.getRequiredARIAProperties(role);
        for (const prop of requiredProps) {
          if (!htmlEl.hasAttribute(prop)) {
            this.addIssue({
              type: 'aria',
              severity: 'critical',
              wcagCriterion: '4.1.2',
              element: htmlEl,
              selector: this.getSelector(htmlEl),
              message: `Missing required ARIA property: ${prop} for role="${role}"`,
              howToFix: `Add ${prop} attribute to element with role="${role}"`,
              impact: ['Screen readers cannot properly announce this element'],
              autoFixable: false
            });
          }
        }
      }

      // Validate aria-labelledby references
      const labelledBy = htmlEl.getAttribute('aria-labelledby');
      if (labelledBy) {
        const ids = labelledBy.split(' ');
        for (const id of ids) {
          if (!document.getElementById(id)) {
            this.addIssue({
              type: 'aria',
              severity: 'serious',
              wcagCriterion: '1.3.1',
              element: htmlEl,
              selector: this.getSelector(htmlEl),
              message: `aria-labelledby references non-existent ID: "${id}"`,
              howToFix: `Ensure element with id="${id}" exists`,
              impact: ['Screen readers cannot find label for this element'],
              autoFixable: false
            });
          }
        }
      }
    }
  }

  /**
   * Validate semantic HTML structure
   */
  private async validateSemantics(element: HTMLElement, config: ValidationOptions): Promise<void> {
    // Check for proper use of semantic elements
    const divButtons = element.querySelectorAll('div[onclick], span[onclick]');
    for (const el of Array.from(divButtons)) {
      this.addIssue({
        type: 'semantics',
        severity: 'serious',
        wcagCriterion: '4.1.2',
        element: el as HTMLElement,
        selector: this.getSelector(el as HTMLElement),
        message: 'Non-semantic element used as button',
        howToFix: 'Use <button> element or add role="button" and keyboard support',
        impact: ['Screen readers may not recognize this as interactive'],
        autoFixable: false
      });
    }

    // Check for lists without proper structure
    const listItems = element.querySelectorAll('li');
    for (const li of Array.from(listItems)) {
      if (!li.parentElement?.matches('ul, ol, menu')) {
        this.addIssue({
          type: 'semantics',
          severity: 'moderate',
          wcagCriterion: '1.3.1',
          element: li as HTMLElement,
          selector: this.getSelector(li as HTMLElement),
          message: 'List item not in proper list container',
          howToFix: 'Wrap <li> elements in <ul> or <ol>',
          impact: ['Screen readers may not announce list structure correctly'],
          autoFixable: false
        });
      }
    }
  }

  /**
   * Validate form accessibility
   */
  private async validateForms(element: HTMLElement, config: ValidationOptions): Promise<void> {
    const formElements = element.querySelectorAll('input, select, textarea');

    for (const el of Array.from(formElements)) {
      const htmlEl = el as HTMLInputElement;
      const type = htmlEl.type;

      // Skip hidden inputs
      if (type === 'hidden') continue;

      // Check for labels
      const id = htmlEl.id;
      const ariaLabel = htmlEl.getAttribute('aria-label');
      const ariaLabelledBy = htmlEl.getAttribute('aria-labelledby');
      const label = id ? element.querySelector(`label[for="${id}"]`) : null;
      const implicitLabel = htmlEl.closest('label');

      if (!label && !implicitLabel && !ariaLabel && !ariaLabelledBy) {
        this.addIssue({
          type: 'forms',
          severity: 'critical',
          wcagCriterion: '3.3.2',
          element: htmlEl,
          selector: this.getSelector(htmlEl),
          message: 'Form input missing accessible label',
          howToFix: 'Add <label>, aria-label, or aria-labelledby',
          impact: ['Screen reader users cannot identify input purpose'],
          autoFixable: false
        });
      }

      // Check for required field indicators
      if (htmlEl.required && !ariaLabel?.includes('required')) {
        this.addWarning({
          type: 'enhancement',
          message: `Required field "${htmlEl.name || htmlEl.id}" may not clearly indicate it's required`,
          recommendation: 'Include "required" in the accessible name or add visual indicator'
        });
      }

      // Check for error message associations
      if (htmlEl.getAttribute('aria-invalid') === 'true') {
        const describedBy = htmlEl.getAttribute('aria-describedby');
        if (!describedBy) {
          this.addIssue({
            type: 'forms',
            severity: 'serious',
            wcagCriterion: '3.3.3',
            element: htmlEl,
            selector: this.getSelector(htmlEl),
            message: 'Invalid input missing error message association',
            howToFix: 'Use aria-describedby to associate error message',
            impact: ['Screen reader users may not hear error details'],
            autoFixable: false
          });
        }
      }

      // Check for autocomplete attributes for common fields
      const name = htmlEl.name?.toLowerCase() || '';
      const shouldHaveAutocomplete = ['email', 'tel', 'name', 'address'].some(field => 
        name.includes(field) || type === field
      );

      if (shouldHaveAutocomplete && !htmlEl.hasAttribute('autocomplete')) {
        this.addWarning({
          type: 'cognitive',
          message: `Input "${name}" could benefit from autocomplete attribute`,
          recommendation: 'Add appropriate autocomplete attribute to reduce cognitive load'
        });
      }
    }

    // Check for form validation feedback
    const forms = element.querySelectorAll('form');
    for (const form of Array.from(forms)) {
      const hasLiveRegion = form.querySelector('[aria-live], [role="alert"], [role="status"]');
      if (!hasLiveRegion) {
        this.addWarning({
          type: 'enhancement',
          message: 'Form lacks live region for validation feedback',
          recommendation: 'Add aria-live region to announce validation messages'
        });
      }
    }
  }

  /**
   * Validate image accessibility
   */
  private async validateImages(element: HTMLElement, config: ValidationOptions): Promise<void> {
    // Check <img> elements
    const images = element.querySelectorAll('img');
    for (const img of Array.from(images)) {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src');
      const isDecorative = img.getAttribute('role') === 'presentation' || alt === '';

      if (!src) continue;

      if (alt === null && !isDecorative) {
        this.addIssue({
          type: 'images',
          severity: 'critical',
          wcagCriterion: '1.1.1',
          element: img,
          selector: this.getSelector(img),
          message: 'Image missing alt attribute',
          howToFix: 'Add descriptive alt text or alt="" for decorative images',
          impact: ['Screen reader users cannot understand image content'],
          autoFixable: false
        });
      }

      // Check for redundant alt text
      if (alt && (alt.toLowerCase().includes('image of') || alt.toLowerCase().includes('picture of'))) {
        this.addWarning({
          type: 'bestPractice',
          message: `Alt text "${alt}" contains redundant words`,
          recommendation: 'Remove "image of" or "picture of" from alt text'
        });
      }

      // Check for file names as alt text
      if (alt && alt.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
        this.addIssue({
          type: 'images',
          severity: 'serious',
          wcagCriterion: '1.1.1',
          element: img,
          selector: this.getSelector(img),
          message: 'Alt text appears to be a filename',
          howToFix: 'Replace filename with descriptive alt text',
          impact: ['Screen reader users hear filename instead of description'],
          autoFixable: false
        });
      }
    }

    // Check SVGs
    const svgs = element.querySelectorAll('svg');
    for (const svg of Array.from(svgs)) {
      const title = svg.querySelector('title');
      const ariaLabel = svg.getAttribute('aria-label');
      const ariaLabelledBy = svg.getAttribute('aria-labelledby');
      const role = svg.getAttribute('role');

      if (!title && !ariaLabel && !ariaLabelledBy && role !== 'presentation') {
        this.addIssue({
          type: 'images',
          severity: 'serious',
          wcagCriterion: '1.1.1',
          element: svg,
          selector: this.getSelector(svg),
          message: 'SVG missing accessible name',
          howToFix: 'Add <title>, aria-label, or role="presentation"',
          impact: ['Screen reader users cannot understand SVG content'],
          autoFixable: false
        });
      }
    }
  }

  /**
   * Validate heading structure
   */
  private async validateHeadings(element: HTMLElement, config: ValidationOptions): Promise<void> {
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    let h1Count = 0;

    for (const heading of Array.from(headings)) {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level === 1) {
        h1Count++;
        if (h1Count > 1) {
          this.addWarning({
            type: 'bestPractice',
            message: 'Multiple h1 headings found',
            recommendation: 'Use only one h1 per page for main content'
          });
        }
      }

      // Check for skipped heading levels
      if (previousLevel > 0 && level > previousLevel + 1) {
        this.addIssue({
          type: 'headings',
          severity: 'moderate',
          wcagCriterion: '1.3.1',
          element: heading as HTMLElement,
          selector: this.getSelector(heading as HTMLElement),
          message: `Heading level skipped from h${previousLevel} to h${level}`,
          howToFix: 'Use heading levels in sequential order',
          impact: ['Screen reader users may not understand document structure'],
          autoFixable: false
        });
      }

      // Check for empty headings
      const text = heading.textContent?.trim();
      if (!text || text.length === 0) {
        this.addIssue({
          type: 'headings',
          severity: 'serious',
          wcagCriterion: '2.4.6',
          element: heading as HTMLElement,
          selector: this.getSelector(heading as HTMLElement),
          message: 'Empty heading found',
          howToFix: 'Add meaningful text to heading or remove it',
          impact: ['Screen reader users encounter empty heading'],
          autoFixable: false
        });
      }

      previousLevel = level;
    }

    // Check for missing h1
    if (element === document.body && h1Count === 0) {
      this.addIssue({
        type: 'headings',
        severity: 'serious',
        wcagCriterion: '2.4.6',
        element: null,
        selector: 'document',
        message: 'Page missing h1 heading',
        howToFix: 'Add h1 heading to identify main content',
        impact: ['Screen reader users cannot identify main page topic'],
        autoFixable: false
      });
    }
  }

  /**
   * Validate landmark regions
   */
  private async validateLandmarks(element: HTMLElement, config: ValidationOptions): Promise<void> {
    const landmarks = {
      main: element.querySelectorAll('main, [role="main"]'),
      nav: element.querySelectorAll('nav, [role="navigation"]'),
      banner: element.querySelectorAll('header, [role="banner"]'),
      contentinfo: element.querySelectorAll('footer, [role="contentinfo"]'),
      complementary: element.querySelectorAll('aside, [role="complementary"]')
    };

    // Check for missing main landmark
    if (landmarks.main.length === 0 && element === document.body) {
      this.addIssue({
        type: 'landmarks',
        severity: 'serious',
        wcagCriterion: '2.4.1',
        element: null,
        selector: 'document',
        message: 'Page missing main landmark',
        howToFix: 'Add <main> element or role="main" to main content area',
        impact: ['Screen reader users cannot quickly navigate to main content'],
        autoFixable: false
      });
    }

    // Check for multiple unlabeled landmarks of same type
    for (const [type, elements] of Object.entries(landmarks)) {
      if (elements.length > 1) {
        for (const landmark of Array.from(elements)) {
          const ariaLabel = landmark.getAttribute('aria-label');
          const ariaLabelledBy = landmark.getAttribute('aria-labelledby');
          
          if (!ariaLabel && !ariaLabelledBy) {
            this.addIssue({
              type: 'landmarks',
              severity: 'moderate',
              wcagCriterion: '2.4.6',
              element: landmark as HTMLElement,
              selector: this.getSelector(landmark as HTMLElement),
              message: `Multiple ${type} landmarks without distinguishing labels`,
              howToFix: 'Add aria-label to distinguish between similar landmarks',
              impact: ['Screen reader users cannot distinguish between similar regions'],
              autoFixable: false
            });
          }
        }
      }
    }
  }

  /**
   * Validate link accessibility
   */
  private async validateLinks(element: HTMLElement, config: ValidationOptions): Promise<void> {
    const links = element.querySelectorAll('a[href]');

    for (const link of Array.from(links)) {
      const text = link.textContent?.trim();
      const ariaLabel = link.getAttribute('aria-label');
      const img = link.querySelector('img');

      // Check for empty links
      if (!text && !ariaLabel && !img?.getAttribute('alt')) {
        this.addIssue({
          type: 'links',
          severity: 'critical',
          wcagCriterion: '2.4.4',
          element: link as HTMLElement,
          selector: this.getSelector(link as HTMLElement),
          message: 'Link has no accessible name',
          howToFix: 'Add link text, aria-label, or alt text for image',
          impact: ['Screen reader users cannot understand link purpose'],
          autoFixable: false
        });
      }

      // Check for generic link text
      if (text && ['click here', 'read more', 'learn more', 'more'].includes(text.toLowerCase())) {
        this.addWarning({
          type: 'cognitive',
          message: `Generic link text "${text}" lacks context`,
          recommendation: 'Use descriptive link text that explains destination'
        });
      }

      // Check for links that open in new window
      const target = link.getAttribute('target');
      if (target === '_blank') {
        const hasWarning = ariaLabel?.includes('opens in new') || 
                          text?.includes('opens in new') ||
                          link.querySelector('[aria-label*="new window"]');
        
        if (!hasWarning) {
          this.addIssue({
            type: 'links',
            severity: 'moderate',
            wcagCriterion: '3.2.5',
            element: link as HTMLElement,
            selector: this.getSelector(link as HTMLElement),
            message: 'Link opens in new window without warning',
            howToFix: 'Add "(opens in new window)" to link text or aria-label',
            impact: ['Users may be confused by unexpected context change'],
            autoFixable: true
          });
        }
      }
    }
  }

  /**
   * Validate table accessibility
   */
  private async validateTables(element: HTMLElement, config: ValidationOptions): Promise<void> {
    const tables = element.querySelectorAll('table');

    for (const table of Array.from(tables)) {
      const caption = table.querySelector('caption');
      const summary = table.getAttribute('summary');
      const ariaLabel = table.getAttribute('aria-label');

      // Check for table description
      if (!caption && !summary && !ariaLabel) {
        this.addWarning({
          type: 'enhancement',
          message: 'Table lacks description',
          recommendation: 'Add <caption> or aria-label to describe table purpose'
        });
      }

      // Check for header cells
      const headers = table.querySelectorAll('th');
      const hasHeaders = headers.length > 0;
      
      if (!hasHeaders && table.querySelectorAll('tr').length > 1) {
        this.addIssue({
          type: 'tables',
          severity: 'serious',
          wcagCriterion: '1.3.1',
          element: table,
          selector: this.getSelector(table),
          message: 'Data table missing header cells',
          howToFix: 'Use <th> elements for header cells',
          impact: ['Screen reader users cannot understand table structure'],
          autoFixable: false
        });
      }

      // Check for scope attributes on header cells
      for (const th of Array.from(headers)) {
        if (!th.hasAttribute('scope')) {
          this.addWarning({
            type: 'enhancement',
            message: 'Table header missing scope attribute',
            recommendation: 'Add scope="col" or scope="row" to clarify header relationships'
          });
        }
      }
    }
  }

  /**
   * Validate motion and animation accessibility
   */
  private async validateMotion(element: HTMLElement, config: ValidationOptions): Promise<void> {
    const animatedElements = element.querySelectorAll('[class*="animate"], [class*="transition"]');

    if (animatedElements.length > 0) {
      // Check for prefers-reduced-motion support
      const hasReducedMotionCSS = this.checkForReducedMotionSupport();
      
      if (!hasReducedMotionCSS) {
        this.addIssue({
          type: 'motion',
          severity: 'moderate',
          wcagCriterion: '2.3.3',
          element: null,
          selector: 'document',
          message: 'Animations found without reduced motion support',
          howToFix: 'Add CSS @media (prefers-reduced-motion: reduce) rules',
          impact: ['Users with vestibular disorders may experience discomfort'],
          autoFixable: false
        });
      }
    }

    // Check for auto-playing videos
    const videos = element.querySelectorAll('video[autoplay]');
    for (const video of Array.from(videos)) {
      if (!video.hasAttribute('muted')) {
        this.addIssue({
          type: 'audio',
          severity: 'serious',
          wcagCriterion: '1.4.2',
          element: video,
          selector: this.getSelector(video),
          message: 'Auto-playing video with sound',
          howToFix: 'Add muted attribute or remove autoplay',
          impact: ['Users may be startled or disturbed by unexpected audio'],
          autoFixable: true
        });
      }
    }
  }

  /**
   * Validate timing and timeouts
   */
  private async validateTiming(element: HTMLElement, config: ValidationOptions): Promise<void> {
    // Check for meta refresh
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
    if (metaRefresh) {
      const content = metaRefresh.getAttribute('content');
      const seconds = parseInt(content?.split(';')[0] || '0');
      
      if (seconds > 0 && seconds < 20) {
        this.addIssue({
          type: 'timing',
          severity: 'critical',
          wcagCriterion: '2.2.1',
          element: metaRefresh,
          selector: 'meta[http-equiv="refresh"]',
          message: `Page auto-refreshes in ${seconds} seconds`,
          howToFix: 'Remove auto-refresh or extend to at least 20 seconds with user control',
          impact: ['Users may not have enough time to read content'],
          autoFixable: false
        });
      }
    }

    // Check for session timeout warnings
    const hasTimeoutWarning = element.querySelector('[role="timer"], [aria-live*="timeout"]');
    if (!hasTimeoutWarning && config.checkSessionTimeout) {
      this.addWarning({
        type: 'enhancement',
        message: 'No session timeout warning mechanism detected',
        recommendation: 'Implement accessible session timeout warnings with extension options'
      });
    }
  }

  /**
   * Validate language attributes
   */
  private async validateLanguage(element: HTMLElement, config: ValidationOptions): Promise<void> {
    // Check for page language
    if (element === document.body && !document.documentElement.lang) {
      this.addIssue({
        type: 'language',
        severity: 'serious',
        wcagCriterion: '3.1.1',
        element: null,
        selector: 'html',
        message: 'Page language not specified',
        howToFix: 'Add lang attribute to <html> element',
        impact: ['Screen readers may pronounce content incorrectly'],
        autoFixable: false
      });
    }

    // Check for language changes
    const elementsWithLang = element.querySelectorAll('[lang]');
    for (const el of Array.from(elementsWithLang)) {
      const lang = el.getAttribute('lang');
      if (lang && !this.isValidLanguageCode(lang)) {
        this.addIssue({
          type: 'language',
          severity: 'moderate',
          wcagCriterion: '3.1.2',
          element: el as HTMLElement,
          selector: this.getSelector(el as HTMLElement),
          message: `Invalid language code: "${lang}"`,
          howToFix: 'Use valid ISO 639-1 language code',
          impact: ['Screen readers may not recognize language change'],
          autoFixable: false
        });
      }
    }
  }

  /**
   * Validate touch target sizes for mobile accessibility
   */
  private async validateTouchTargets(element: HTMLElement, config: ValidationOptions): Promise<void> {
    const interactiveElements = element.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [onclick]'
    );

    for (const el of Array.from(interactiveElements)) {
      const htmlEl = el as HTMLElement;
      const rect = htmlEl.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Check minimum size
      if (width < TOUCH_TARGETS.MINIMUM || height < TOUCH_TARGETS.MINIMUM) {
        this.addIssue({
          type: 'touch',
          severity: 'serious',
          wcagCriterion: '2.5.5',
          element: htmlEl,
          selector: this.getSelector(htmlEl),
          message: `Touch target too small: ${Math.round(width)}x${Math.round(height)}px (minimum: ${TOUCH_TARGETS.MINIMUM}x${TOUCH_TARGETS.MINIMUM}px)`,
          howToFix: `Increase size to at least ${TOUCH_TARGETS.MINIMUM}x${TOUCH_TARGETS.MINIMUM}px`,
          impact: ['Users with motor impairments may have difficulty activating'],
          autoFixable: true
        });
      }

      // Check spacing between targets
      const nearbyTargets = this.getNearbyInteractiveElements(htmlEl, interactiveElements);
      for (const nearby of nearbyTargets) {
        const distance = this.calculateDistance(htmlEl, nearby);
        if (distance < TOUCH_TARGETS.SPACING) {
          this.addWarning({
            type: 'enhancement',
            message: `Touch targets too close together (${Math.round(distance)}px apart)`,
            recommendation: `Increase spacing to at least ${TOUCH_TARGETS.SPACING}px`
          });
        }
      }
    }
  }

  /**
   * Validate cognitive accessibility features
   */
  private async validateCognitive(element: HTMLElement, config: ValidationOptions): Promise<void> {
    // Check for consistent navigation
    const navElements = element.querySelectorAll('nav, [role="navigation"]');
    if (navElements.length > 1) {
      this.addWarning({
        type: 'cognitive',
        message: 'Multiple navigation regions may confuse users',
        recommendation: 'Ensure navigation is consistent across pages'
      });
    }

    // Check for error prevention
    const forms = element.querySelectorAll('form');
    for (const form of Array.from(forms)) {
      const hasDestructiveAction = form.querySelector('[type="submit"][value*="delete"], [type="submit"][value*="remove"]');
      if (hasDestructiveAction) {
        const hasConfirmation = form.querySelector('[type="checkbox"][required], [aria-label*="confirm"]');
        if (!hasConfirmation) {
          this.addIssue({
            type: 'forms',
            severity: 'serious',
            wcagCriterion: '3.3.4',
            element: form,
            selector: this.getSelector(form),
            message: 'Destructive action without confirmation',
            howToFix: 'Add confirmation step before destructive actions',
            impact: ['Users may accidentally delete data'],
            autoFixable: false
          });
        }
      }
    }

    // Check for help availability
    const hasHelp = element.querySelector('[aria-label*="help"], [title*="help"], .help, #help');
    if (!hasHelp && element === document.body) {
      this.addWarning({
        type: 'cognitive',
        message: 'No help mechanism detected',
        recommendation: 'Provide context-sensitive help for complex features'
      });
    }
  }

  /**
   * Validate crisis-specific accessibility features
   */
  private async validateCrisisFeatures(element: HTMLElement, config: ValidationOptions): Promise<void> {
    // Check for crisis/panic buttons
    const crisisButtons = element.querySelectorAll(
      '[data-crisis], [aria-label*="crisis"], [aria-label*="panic"], [aria-label*="emergency"], .crisis-button, .panic-button'
    );

    for (const button of Array.from(crisisButtons)) {
      const htmlEl = button as HTMLElement;
      
      // Crisis buttons need to be extra large
      const rect = htmlEl.getBoundingClientRect();
      if (rect.width < 60 || rect.height < 60) {
        this.addIssue({
          type: 'touch',
          severity: 'critical',
          wcagCriterion: '2.5.5',
          element: htmlEl,
          selector: this.getSelector(htmlEl),
          message: 'Crisis button too small for emergency use',
          howToFix: 'Increase crisis button to at least 60x60px',
          impact: ['Users in crisis may not be able to activate help quickly'],
          autoFixable: true
        });
      }

      // Check for high contrast
      const styles = window.getComputedStyle(htmlEl);
      const bg = styles.backgroundColor;
      const fg = styles.color;
      const contrast = this.calculateContrast(fg, bg);
      
      if (contrast < CONTRAST_RATIOS.AAA_NORMAL) {
        this.addIssue({
          type: 'contrast',
          severity: 'critical',
          wcagCriterion: '1.4.6',
          element: htmlEl,
          selector: this.getSelector(htmlEl),
          message: 'Crisis button lacks sufficient contrast',
          howToFix: 'Increase contrast to at least 7:1 for crisis visibility',
          impact: ['Users in crisis may not see the help button clearly'],
          autoFixable: false
        });
      }

      // Check for keyboard shortcut
      const accessKey = htmlEl.getAttribute('accesskey');
      if (!accessKey) {
        this.addWarning({
          type: 'enhancement',
          message: 'Crisis button lacks keyboard shortcut',
          recommendation: 'Add accesskey attribute for quick keyboard activation'
        });
      }
    }

    // Check for crisis resources
    const hasResources = element.querySelector('[aria-label*="resources"], [aria-label*="hotline"], .crisis-resources');
    if (!hasResources && element === document.body) {
      this.addWarning({
        type: 'enhancement',
        message: 'No crisis resources section detected',
        recommendation: 'Add clearly marked crisis resources and hotline information'
      });
    }
  }

  // Utility methods

  private reset(): void {
    this.issues = [];
    this.warnings = [];
    this.checkedElements = new WeakSet();
  }

  private addIssue(issue: Omit<ValidationIssue, 'id'>): void {
    this.issues.push({
      ...issue,
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  }

  private addWarning(warning: Omit<ValidationWarning, 'id'>): void {
    this.warnings.push({
      ...warning,
      id: `warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  }

  private calculateScore(): number {
    if (this.issues.length === 0) return 100;

    const weights = {
      critical: 10,
      serious: 5,
      moderate: 2,
      minor: 1
    };

    let deductions = 0;
    for (const issue of this.issues) {
      deductions += weights[issue.severity];
    }

    return Math.max(0, 100 - deductions);
  }

  private determinePass(score: number, level: 'A' | 'AA' | 'AAA'): boolean {
    const thresholds = { A: 80, AA: 90, AAA: 95 };
    return score >= thresholds[level];
  }

  private getSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    
    const classes = Array.from(element.classList).join('.');
    if (classes) return `${element.tagName.toLowerCase()}.${classes}`;
    
    return element.tagName.toLowerCase();
  }

  private getBackgroundColor(element: HTMLElement): string {
    let el: HTMLElement | null = element;
    while (el) {
      const bg = window.getComputedStyle(el).backgroundColor;
      if (!this.isTransparent(bg)) return bg;
      el = el.parentElement;
    }
    return 'rgb(255, 255, 255)';
  }

  private isTransparent(color: string): boolean {
    return color === 'transparent' || 
           color === 'rgba(0, 0, 0, 0)' || 
           (color.includes('rgba') && color.endsWith(', 0)'));
  }

  private calculateContrast(fg: string, bg: string): number {
    const fgRgb = this.parseColor(fg);
    const bgRgb = this.parseColor(bg);
    
    const l1 = this.getRelativeLuminance(fgRgb);
    const l2 = this.getRelativeLuminance(bgRgb);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private parseColor(color: string): { r: number; g: number; b: number } {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return { r: 0, g: 0, b: 0 };
  }

  private getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const sRGB = (c: number) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    
    return 0.2126 * sRGB(rgb.r) + 0.7152 * sRGB(rgb.g) + 0.0722 * sRGB(rgb.b);
  }

  private isLargeText(styles: CSSStyleDeclaration): boolean {
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = parseInt(styles.fontWeight) || 400;
    
    // Large text: 18pt+ (24px+) or 14pt+ bold (18.7px+)
    return fontSize >= 24 || (fontSize >= 18.7 && fontWeight >= 700);
  }

  private getFocusStyles(element: HTMLElement): CSSStyleDeclaration {
    // Create a temporary focus state to check styles
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);
    clone.focus();
    const styles = window.getComputedStyle(clone);
    const result = {
      outline: styles.outline,
      outlineWidth: styles.outlineWidth,
      outlineColor: styles.outlineColor,
      boxShadow: styles.boxShadow,
      border: styles.border
    } as any;
    document.body.removeChild(clone);
    return result;
  }

  private hasSufficientFocusIndicator(styles: any): boolean {
    const hasOutline = styles.outline && styles.outline !== 'none';
    const hasBoxShadow = styles.boxShadow && styles.boxShadow !== 'none';
    const hasBorderChange = styles.border && styles.border !== 'none';
    
    return hasOutline || hasBoxShadow || hasBorderChange;
  }

  private isValidARIARole(role: string): boolean {
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
      'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo',
      'definition', 'dialog', 'directory', 'document', 'feed', 'figure',
      'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link',
      'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math',
      'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
      'navigation', 'none', 'note', 'option', 'presentation', 'progressbar',
      'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
      'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton',
      'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term',
      'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
    ];
    
    return validRoles.includes(role);
  }

  private getRequiredARIAProperties(role: string): string[] {
    const requirements: Record<string, string[]> = {
      'checkbox': ['aria-checked'],
      'combobox': ['aria-expanded'],
      'gridcell': ['aria-colindex', 'aria-rowindex'],
      'heading': ['aria-level'],
      'menuitemcheckbox': ['aria-checked'],
      'menuitemradio': ['aria-checked'],
      'option': ['aria-selected'],
      'radio': ['aria-checked'],
      'scrollbar': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      'separator': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      'slider': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      'spinbutton': ['aria-valuenow'],
      'switch': ['aria-checked'],
      'tab': ['aria-selected']
    };
    
    return requirements[role] || [];
  }

  private checkForReducedMotionSupport(): boolean {
    // Check if any stylesheets contain reduced motion media queries
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSMediaRule && 
              rule.conditionText?.includes('prefers-reduced-motion')) {
            return true;
          }
        }
      } catch (e) {
        // Cross-origin stylesheets will throw
        continue;
      }
    }
    return false;
  }

  private isValidLanguageCode(code: string): boolean {
    // Simplified check for ISO 639-1 codes
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
  }

  private getNearbyInteractiveElements(
    element: HTMLElement, 
    allElements: NodeListOf<Element>
  ): HTMLElement[] {
    const nearby: HTMLElement[] = [];
    const rect = element.getBoundingClientRect();
    
    for (const el of Array.from(allElements)) {
      if (el === element) continue;
      const otherRect = (el as HTMLElement).getBoundingClientRect();
      
      // Check if elements are close horizontally or vertically
      const horizontalDistance = Math.abs(rect.left - otherRect.right) || 
                                Math.abs(otherRect.left - rect.right);
      const verticalDistance = Math.abs(rect.top - otherRect.bottom) || 
                              Math.abs(otherRect.top - rect.bottom);
      
      if (horizontalDistance < 50 || verticalDistance < 50) {
        nearby.push(el as HTMLElement);
      }
    }
    
    return nearby;
  }

  private calculateDistance(el1: HTMLElement, el2: HTMLElement): number {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    
    const horizontalDistance = Math.max(0, 
      Math.max(rect1.left - rect2.right, rect2.left - rect1.right)
    );
    const verticalDistance = Math.max(0,
      Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom)
    );
    
    return Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);
  }
}

export interface ValidationOptions {
  level?: 'A' | 'AA' | 'AAA';
  includeWarnings?: boolean;
  autoFix?: boolean;
  checkSessionTimeout?: boolean;
}

// Export singleton instance
export const accessibilityValidator = new AccessibilityValidator();

export default accessibilityValidator;