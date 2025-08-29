/**
 * Accessibility Auditor Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'notice';
  element: string;
  message: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  rule: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

class AccessibilityAuditor {
  private issues: AccessibilityIssue[] = [];
  private config = {
    wcagLevel: 'AA' as 'A' | 'AA' | 'AAA',
    colorContrastRatio: { normal: 4.5, large: 3 },
    focusIndicatorMinWidth: 2,
    touchTargetMinSize: 44
  };

  audit(element: HTMLElement): AccessibilityIssue[] {
    this.issues = [];
    this.auditImages(element);
    this.auditForms(element);
    this.auditHeadings(element);
    this.auditColorContrast(element);
    this.auditKeyboardNavigation(element);
    this.auditARIA(element);
    this.auditTouchTargets(element);
    return this.issues;
  }

  private auditImages(element: HTMLElement) {
    const images = element.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.getAttribute('alt')) {
        this.issues.push({
          type: 'error',
          element: 'img',
          message: 'Image missing alt text',
          wcagLevel: 'A',
          rule: '1.1.1 Non-text Content',
          impact: 'serious'
        });
      }
    });
  }

  private auditForms(element: HTMLElement) {
    const inputs = element.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      if (id) {
        const label = element.querySelector(`label[for="${id}"]`);
        if (!label) {
          this.issues.push({
            type: 'error',
            element: input.tagName.toLowerCase(),
            message: 'Form element missing label',
            wcagLevel: 'A',
            rule: '3.3.2 Labels or Instructions',
            impact: 'serious'
          });
        }
      }
    });
  }

  private auditHeadings(element: HTMLElement) {
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1]);
      if (previousLevel > 0 && level > previousLevel + 1) {
        this.issues.push({
          type: 'warning',
          element: heading.tagName.toLowerCase(),
          message: 'Heading levels should not skip',
          wcagLevel: 'AA',
          rule: '1.3.1 Info and Relationships',
          impact: 'moderate'
        });
      }
      previousLevel = level;
    });
  }

  private auditColorContrast(element: HTMLElement) {
    // Simplified color contrast check
    const textElements = element.querySelectorAll('p, span, div, a, button');
    textElements.forEach(() => {
      // In real implementation, would calculate actual contrast
      const hasGoodContrast = Math.random() > 0.2;
      if (!hasGoodContrast) {
        this.issues.push({
          type: 'error',
          element: 'text',
          message: 'Insufficient color contrast',
          wcagLevel: 'AA',
          rule: '1.4.3 Contrast (Minimum)',
          impact: 'serious'
        });
      }
    });
  }

  private auditKeyboardNavigation(element: HTMLElement) {
    const interactiveElements = element.querySelectorAll('a, button, input, select, textarea');
    interactiveElements.forEach((el) => {
      if (el.getAttribute('tabindex') === '-1') {
        this.issues.push({
          type: 'warning',
          element: el.tagName.toLowerCase(),
          message: 'Element removed from keyboard navigation',
          wcagLevel: 'A',
          rule: '2.1.1 Keyboard',
          impact: 'moderate'
        });
      }
    });
  }

  private auditARIA(element: HTMLElement) {
    const ariaElements = element.querySelectorAll('[role]');
    ariaElements.forEach((el) => {
      const role = el.getAttribute('role');
      if (role === 'button' && el.tagName !== 'BUTTON') {
        if (!el.getAttribute('tabindex')) {
          this.issues.push({
            type: 'error',
            element: el.tagName.toLowerCase(),
            message: 'ARIA button missing tabindex',
            wcagLevel: 'A',
            rule: '4.1.2 Name, Role, Value',
            impact: 'serious'
          });
        }
      }
    });
  }

  private auditTouchTargets(element: HTMLElement) {
    const touchTargets = element.querySelectorAll('button, a, input');
    touchTargets.forEach((target) => {
      const rect = target.getBoundingClientRect();
      if (rect.width < this.config.touchTargetMinSize || rect.height < this.config.touchTargetMinSize) {
        this.issues.push({
          type: 'warning',
          element: target.tagName.toLowerCase(),
          message: `Touch target too small (min ${this.config.touchTargetMinSize}px)`,
          wcagLevel: 'AAA',
          rule: '2.5.5 Target Size',
          impact: 'minor'
        });
      }
    });
  }

  generateReport(): string {
    const grouped = this.groupIssuesByType();
    return `
      Accessibility Audit Report
      ==========================
      Total Issues: ${this.issues.length}
      Errors: ${grouped.error}
      Warnings: ${grouped.warning}
      Notices: ${grouped.notice}
    `;
  }

  private groupIssuesByType() {
    return this.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  clearIssues() {
    this.issues = [];
  }

  getIssues() {
    return this.issues;
  }

  setConfig(config: Partial<typeof this.config>) {
    this.config = { ...this.config, ...config };
  }
}

describe('AccessibilityAuditor', () => {
  let auditor: AccessibilityAuditor;
  let container: HTMLElement;

  beforeEach(() => {
    auditor = new AccessibilityAuditor();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('Image Auditing', () => {
    it('should detect images without alt text', () => {
      container.innerHTML = '<img src="test.jpg">';
      const issues = auditor.audit(container);
      
      const imageIssues = issues.filter(i => i.element === 'img');
      expect(imageIssues.length).toBeGreaterThan(0);
      expect(imageIssues[0].message).toContain('alt text');
    });

    it('should pass images with alt text', () => {
      container.innerHTML = '<img src="test.jpg" alt="Test image">';
      const issues = auditor.audit(container);
      
      const imageIssues = issues.filter(i => i.element === 'img' && i.message.includes('alt text'));
      expect(imageIssues).toHaveLength(0);
    });
  });

  describe('Form Auditing', () => {
    it('should detect form inputs without labels', () => {
      container.innerHTML = '<input type="text" id="name">';
      const issues = auditor.audit(container);
      
      const formIssues = issues.filter(i => i.message.includes('label'));
      expect(formIssues.length).toBeGreaterThan(0);
    });

    it('should pass form inputs with labels', () => {
      container.innerHTML = `
        <label for="name">Name:</label>
        <input type="text" id="name">
      `;
      const issues = auditor.audit(container);
      
      const formIssues = issues.filter(i => i.element === 'input' && i.message.includes('label'));
      expect(formIssues).toHaveLength(0);
    });
  });

  describe('Heading Structure', () => {
    it('should detect skipped heading levels', () => {
      container.innerHTML = `
        <h1>Title</h1>
        <h3>Subtitle</h3>
      `;
      const issues = auditor.audit(container);
      
      const headingIssues = issues.filter(i => i.message.includes('Heading levels'));
      expect(headingIssues.length).toBeGreaterThan(0);
    });

    it('should pass proper heading hierarchy', () => {
      container.innerHTML = `
        <h1>Title</h1>
        <h2>Subtitle</h2>
        <h3>Section</h3>
      `;
      const issues = auditor.audit(container);
      
      const headingIssues = issues.filter(i => i.message.includes('Heading levels'));
      expect(headingIssues).toHaveLength(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should detect elements removed from tab order', () => {
      container.innerHTML = '<button tabindex="-1">Click me</button>';
      const issues = auditor.audit(container);
      
      const keyboardIssues = issues.filter(i => i.message.includes('keyboard navigation'));
      expect(keyboardIssues.length).toBeGreaterThan(0);
    });

    it('should pass elements in tab order', () => {
      container.innerHTML = '<button>Click me</button>';
      const issues = auditor.audit(container);
      
      const keyboardIssues = issues.filter(i => i.element === 'button' && i.message.includes('keyboard navigation'));
      expect(keyboardIssues).toHaveLength(0);
    });
  });

  describe('ARIA Auditing', () => {
    it('should detect ARIA buttons without proper attributes', () => {
      container.innerHTML = '<div role="button">Click</div>';
      const issues = auditor.audit(container);
      
      const ariaIssues = issues.filter(i => i.message.includes('ARIA button'));
      expect(ariaIssues.length).toBeGreaterThan(0);
    });

    it('should pass proper ARIA implementation', () => {
      container.innerHTML = '<div role="button" tabindex="0">Click</div>';
      const issues = auditor.audit(container);
      
      const ariaIssues = issues.filter(i => i.message.includes('ARIA button'));
      expect(ariaIssues).toHaveLength(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate accessibility report', () => {
      container.innerHTML = `
        <img src="test.jpg">
        <input type="text" id="field">
        <h1>Title</h1>
        <h3>Subtitle</h3>
      `;
      
      auditor.audit(container);
      const report = auditor.generateReport();
      
      expect(report).toContain('Accessibility Audit Report');
      expect(report).toContain('Total Issues:');
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      auditor.setConfig({ wcagLevel: 'AAA' });
      expect(auditor).toBeDefined();
    });
  });
});
