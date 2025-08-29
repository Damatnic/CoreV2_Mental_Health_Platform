/**
 * Accessibility Audit System - Rewritten for Type Safety
 * 
 * Comprehensive accessibility auditing with WCAG 2.1 compliance
 * Optimized for mental health platform requirements
 */

// Type-safe logger
const logger = {
  info: (msg: string, data?: any) => console.log(msg, data),
  error: (msg: string, data?: any) => console.error(msg, data),
  warn: (msg: string, data?: any) => console.warn(msg, data)
};

export type AuditSeverity = 'critical' | 'major' | 'moderate' | 'minor' | 'info';
export type AuditCategory = 'perceivable' | 'operable' | 'understandable' | 'robust';
export type ComplianceLevel = 'A' | 'AA' | 'AAA';

export interface AuditRule {
  id: string;
  name: string;
  description: string;
  wcagCriterion: string;
  category: AuditCategory;
  level: ComplianceLevel;
  severity: AuditSeverity;
  enabled: boolean;
  validator: (element?: Element) => AuditResult[];
}

export interface AuditResult {
  ruleId: string;
  severity: AuditSeverity;
  message: string;
  element?: Element;
  selector: string;
  wcagCriterion: string;
  category: AuditCategory;
  level: ComplianceLevel;
  solution: string;
  autoFixable: boolean;
}

export interface AuditReport {
  id: string;
  timestamp: Date;
  url: string;
  title: string;
  duration: number;
  summary: {
    totalIssues: number;
    critical: number;
    major: number;
    moderate: number;
    minor: number;
    info: number;
    score: number;
    level: ComplianceLevel | null;
  };
  results: AuditResult[];
}

export class AccessibilityAuditSystem {
  private rules: Map<string, AuditRule> = new Map();
  private reports: Map<string, AuditReport> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    // Image alt text rule
    this.addRule({
      id: 'img-alt',
      name: 'Images must have alt text',
      description: 'All images must have alternative text for screen readers',
      wcagCriterion: '1.1.1',
      category: 'perceivable',
      level: 'A',
      severity: 'critical',
      enabled: true,
      validator: () => {
        const results: AuditResult[] = [];
        if (typeof document === 'undefined') return results;
        
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          if (!img.hasAttribute('alt')) {
            results.push({
              ruleId: 'img-alt',
              severity: 'critical',
              message: 'Image missing alt attribute',
              element: img,
              selector: this.getSelector(img),
              wcagCriterion: '1.1.1',
              category: 'perceivable',
              level: 'A',
              solution: 'Add descriptive alt attribute to image',
              autoFixable: false
            });
          }
        });
        return results;
      }
    });

    // Form labels rule
    this.addRule({
      id: 'form-labels',
      name: 'Form inputs must have labels',
      description: 'All form inputs must have associated labels',
      wcagCriterion: '1.3.1',
      category: 'perceivable',
      level: 'A',
      severity: 'critical',
      enabled: true,
      validator: () => {
        const results: AuditResult[] = [];
        if (typeof document === 'undefined') return results;
        
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          const hasLabel = input.hasAttribute('aria-label') || 
                          input.hasAttribute('aria-labelledby') ||
                          document.querySelector(`label[for="${input.id}"]`);
          
          if (!hasLabel) {
            results.push({
              ruleId: 'form-labels',
              severity: 'critical',
              message: 'Form input missing label',
              element: input,
              selector: this.getSelector(input),
              wcagCriterion: '1.3.1',
              category: 'perceivable',
              level: 'A',
              solution: 'Add label element or aria-label attribute',
              autoFixable: false
            });
          }
        });
        return results;
      }
    });

    // Heading structure rule
    this.addRule({
      id: 'heading-structure',
      name: 'Proper heading hierarchy',
      description: 'Headings must follow proper hierarchical structure',
      wcagCriterion: '1.3.1',
      category: 'perceivable',
      level: 'AA',
      severity: 'major',
      enabled: true,
      validator: () => {
        const results: AuditResult[] = [];
        if (typeof document === 'undefined') return results;
        
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let lastLevel = 0;
        
        headings.forEach(heading => {
          const level = parseInt(heading.tagName.charAt(1));
          if (level > lastLevel + 1) {
            results.push({
              ruleId: 'heading-structure',
              severity: 'major',
              message: `Heading level ${level} skips levels`,
              element: heading,
              selector: this.getSelector(heading),
              wcagCriterion: '1.3.1',
              category: 'perceivable',
              level: 'AA',
              solution: 'Use proper heading hierarchy without skipping levels',
              autoFixable: false
            });
          }
          lastLevel = level;
        });
        return results;
      }
    });

    // Focus management rule
    this.addRule({
      id: 'focus-visible',
      name: 'Interactive elements must be focusable',
      description: 'All interactive elements must be keyboard accessible',
      wcagCriterion: '2.1.1',
      category: 'operable',
      level: 'A',
      severity: 'critical',
      enabled: true,
      validator: () => {
        const results: AuditResult[] = [];
        if (typeof document === 'undefined') return results;
        
        const interactive = document.querySelectorAll('button, a, input, textarea, select');
        interactive.forEach(element => {
          const tabIndex = element.getAttribute('tabindex');
          if (tabIndex === '-1' && !element.hasAttribute('disabled')) {
            results.push({
              ruleId: 'focus-visible',
              severity: 'critical',
              message: 'Interactive element not keyboard accessible',
              element: element,
              selector: this.getSelector(element),
              wcagCriterion: '2.1.1',
              category: 'operable',
              level: 'A',
              solution: 'Remove tabindex="-1" or add keyboard event handlers',
              autoFixable: false
            });
          }
        });
        return results;
      }
    });

    // ARIA roles rule
    this.addRule({
      id: 'aria-roles',
      name: 'Valid ARIA roles and properties',
      description: 'ARIA roles and properties must be valid and properly used',
      wcagCriterion: '4.1.2',
      category: 'robust',
      level: 'A',
      severity: 'major',
      enabled: true,
      validator: () => {
        const results: AuditResult[] = [];
        if (typeof document === 'undefined') return results;
        
        const elementsWithRole = document.querySelectorAll('[role]');
        const validRoles = ['button', 'link', 'heading', 'banner', 'navigation', 'main', 'complementary', 'contentinfo'];
        
        elementsWithRole.forEach(element => {
          const role = element.getAttribute('role');
          if (role && !validRoles.includes(role)) {
            results.push({
              ruleId: 'aria-roles',
              severity: 'major',
              message: `Invalid ARIA role: ${role}`,
              element: element,
              selector: this.getSelector(element),
              wcagCriterion: '4.1.2',
              category: 'robust',
              level: 'A',
              solution: 'Use valid ARIA role or remove role attribute',
              autoFixable: false
            });
          }
        });
        return results;
      }
    });
  }

  public addRule(rule: AuditRule): void {
    this.rules.set(rule.id, rule);
    logger.info(`Added audit rule: ${rule.id}`);
  }

  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    logger.info(`Removed audit rule: ${ruleId}`);
  }

  public async runAudit(): Promise<AuditReport> {
    if (this.isRunning) {
      throw new Error('Audit is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const reportId = this.generateReportId();

    try {
      const results: AuditResult[] = [];

      // Run each enabled rule
      for (const [ruleId, rule] of this.rules) {
        if (!rule.enabled) continue;

        try {
          const ruleResults = rule.validator();
          results.push(...ruleResults);
        } catch (error) {
          logger.error(`Error running rule ${ruleId}:`, error);
        }
      }

      const report: AuditReport = {
        id: reportId,
        timestamp: new Date(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        title: typeof document !== 'undefined' ? document.title : '',
        duration: Date.now() - startTime,
        summary: this.calculateSummary(results),
        results
      };

      this.reports.set(reportId, report);
      logger.info(`Audit completed: ${reportId}`, report.summary);
      return report;
    } finally {
      this.isRunning = false;
    }
  }

  private calculateSummary(results: AuditResult[]): AuditReport['summary'] {
    const summary = {
      totalIssues: results.length,
      critical: 0,
      major: 0,
      moderate: 0,
      minor: 0,
      info: 0,
      score: 100,
      level: null as ComplianceLevel | null
    };

    results.forEach(result => {
      switch (result.severity) {
        case 'critical':
          summary.critical++;
          summary.score -= 10;
          break;
        case 'major':
          summary.major++;
          summary.score -= 5;
          break;
        case 'moderate':
          summary.moderate++;
          summary.score -= 3;
          break;
        case 'minor':
          summary.minor++;
          summary.score -= 1;
          break;
        case 'info':
          summary.info++;
          break;
      }
    });

    summary.score = Math.max(0, summary.score);
    
    if (summary.score >= 95) {
      summary.level = 'AAA';
    } else if (summary.score >= 85) {
      summary.level = 'AA';
    } else if (summary.score >= 75) {
      summary.level = 'A';
    }

    return summary;
  }

  private getSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    let selector = element.tagName.toLowerCase();
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    return selector;
  }

  private generateReportId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getReport(reportId: string): AuditReport | undefined {
    return this.reports.get(reportId);
  }

  public getAllReports(): AuditReport[] {
    return Array.from(this.reports.values());
  }

  public clearReports(): void {
    this.reports.clear();
    logger.info('Cleared all audit reports');
  }

  public exportReport(reportId: string): string {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }
    
    return JSON.stringify(report, null, 2);
  }

  // Quick audit for mental health platform specific checks
  public async runMentalHealthAudit(): Promise<AuditReport> {
    // Add mental health specific rules
    this.addRule({
      id: 'crisis-button-accessible',
      name: 'Crisis buttons must be accessible',
      description: 'Crisis intervention buttons must be keyboard accessible and properly labeled',
      wcagCriterion: '2.1.1',
      category: 'operable',
      level: 'A',
      severity: 'critical',
      enabled: true,
      validator: () => {
        const results: AuditResult[] = [];
        if (typeof document === 'undefined') return results;
        
        const crisisButtons = document.querySelectorAll('[data-crisis], .crisis-button, #crisis-help');
        crisisButtons.forEach(button => {
          if (!button.hasAttribute('aria-label') && !button.textContent?.trim()) {
            results.push({
              ruleId: 'crisis-button-accessible',
              severity: 'critical',
              message: 'Crisis button missing accessible label',
              element: button,
              selector: this.getSelector(button),
              wcagCriterion: '2.1.1',
              category: 'operable',
              level: 'A',
              solution: 'Add aria-label or visible text to crisis button',
              autoFixable: false
            });
          }
        });
        return results;
      }
    });

    return this.runAudit();
  }
}

// Export singleton instance
export const accessibilityAuditSystem = new AccessibilityAuditSystem();
export default accessibilityAuditSystem;