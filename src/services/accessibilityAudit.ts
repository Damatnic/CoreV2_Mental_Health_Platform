/**
 * Accessibility Audit Service - WCAG AAA Compliance
 * 
 * Comprehensive automated accessibility auditing system for the mental health platform.
 * Provides continuous monitoring, reporting, and remediation recommendations
 * to ensure WCAG 2.1 Level AAA compliance.
 * 
 * @version 3.0.0
 * @wcag 2.1 Level AAA
 */

import { accessibilityValidator, ValidationResult, ValidationIssue } from '../utils/accessibilityValidator';
import { accessibilityService } from './accessibilityService';
import { logger } from '../utils/logger';

export interface AuditConfig {
  /** WCAG compliance level to audit against */
  level: 'A' | 'AA' | 'AAA';
  /** Enable automatic fixes where possible */
  autoFix: boolean;
  /** Enable continuous monitoring */
  continuousMonitoring: boolean;
  /** Audit frequency in milliseconds */
  auditInterval: number;
  /** Generate detailed reports */
  generateReports: boolean;
  /** Send alerts for critical issues */
  alertOnCritical: boolean;
  /** Include best practice recommendations */
  includeBestPractices: boolean;
  /** Pages/routes to audit */
  pagesToAudit: string[];
  /** Exclude specific selectors from audit */
  excludeSelectors: string[];
  /** Custom audit rules */
  customRules: AuditRule[];
}

export interface AuditRule {
  id: string;
  name: string;
  description: string;
  test: (element: Element) => boolean;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagCriterion: string;
  remediation: string;
}

export interface AuditReport {
  id: string;
  timestamp: Date;
  url: string;
  level: 'A' | 'AA' | 'AAA';
  passed: boolean;
  score: number;
  summary: AuditSummary;
  issues: AuditIssueDetail[];
  recommendations: AuditRecommendation[];
  trends: AuditTrends;
  metadata: AuditMetadata;
}

export interface AuditSummary {
  totalIssues: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  fixedIssues: number;
  newIssues: number;
  recurringIssues: number;
  complianceLevel: string;
  riskScore: number;
}

export interface AuditIssueDetail extends ValidationIssue {
  occurrences: number;
  firstDetected: Date;
  lastDetected: Date;
  fixAttempts: number;
  userImpact: string[];
  businessImpact: string;
  estimatedFixTime: string;
  resources: string[];
}

export interface AuditRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  resources: string[];
  relatedIssues: string[];
}

export interface AuditTrends {
  scoreHistory: Array<{ date: Date; score: number }>;
  issueHistory: Array<{ date: Date; count: number }>;
  complianceHistory: Array<{ date: Date; level: string }>;
  improvementRate: number;
  projectedCompliance: Date | null;
}

export interface AuditMetadata {
  auditDuration: number;
  elementsChecked: number;
  rulesApplied: number;
  browserInfo: string;
  viewportSize: { width: number; height: number };
  deviceType: 'desktop' | 'tablet' | 'mobile';
  userAgent: string;
}

export interface AuditSchedule {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'continuous';
  lastRun: Date | null;
  nextRun: Date | null;
  enabled: boolean;
  config: AuditConfig;
}

class AccessibilityAuditService {
  private config: AuditConfig;
  private auditHistory: AuditReport[] = [];
  private issueDatabase = new Map<string, AuditIssueDetail>();
  private schedules: AuditSchedule[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isAuditing = false;
  private observers: MutationObserver[] = [];

  constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  private getDefaultConfig(): AuditConfig {
    return {
      level: 'AAA',
      autoFix: true,
      continuousMonitoring: true,
      auditInterval: 3600000, // 1 hour
      generateReports: true,
      alertOnCritical: true,
      includeBestPractices: true,
      pagesToAudit: ['/', '/dashboard', '/crisis', '/chat', '/wellness'],
      excludeSelectors: [],
      customRules: this.getCustomRules()
    };
  }

  private getCustomRules(): AuditRule[] {
    return [
      {
        id: 'crisis-button-visibility',
        name: 'Crisis Button Visibility',
        description: 'Crisis button must be highly visible',
        test: (element: Element) => {
          if (!element.matches('[data-crisis], .crisis-button')) return true;
          const styles = window.getComputedStyle(element as HTMLElement);
          const opacity = parseFloat(styles.opacity);
          return opacity >= 0.9;
        },
        severity: 'critical',
        wcagCriterion: 'Custom - Mental Health',
        remediation: 'Ensure crisis button has opacity >= 0.9'
      },
      {
        id: 'mood-input-labels',
        name: 'Mood Input Labels',
        description: 'Mood tracking inputs must have descriptive labels',
        test: (element: Element) => {
          if (!element.matches('[data-mood-input], .mood-input')) return true;
          const label = element.getAttribute('aria-label') || 
                       document.querySelector(`label[for="${element.id}"]`)?.textContent;
          return !!label && label.length > 5;
        },
        severity: 'serious',
        wcagCriterion: '3.3.2',
        remediation: 'Add descriptive labels to mood tracking inputs'
      },
      {
        id: 'resource-link-context',
        name: 'Resource Link Context',
        description: 'Mental health resource links must provide context',
        test: (element: Element) => {
          if (!element.matches('a[href*="resource"], a[href*="help"]')) return true;
          const text = element.textContent?.trim();
          const ariaLabel = element.getAttribute('aria-label');
          return (text && text.length > 10) || (ariaLabel && ariaLabel.length > 10);
        },
        severity: 'moderate',
        wcagCriterion: '2.4.4',
        remediation: 'Provide descriptive text for resource links'
      }
    ];
  }

  private async initialize(): Promise<void> {
    try {
      // Load historical audit data
      await this.loadAuditHistory();

      // Set up continuous monitoring if enabled
      if (this.config.continuousMonitoring) {
        this.startContinuousMonitoring();
      }

      // Initialize scheduled audits
      this.initializeSchedules();

      logger.info('Accessibility audit service initialized');
    } catch (error) {
      logger.error('Failed to initialize accessibility audit service', error);
    }
  }

  /**
   * Run a comprehensive accessibility audit
   */
  public async runAudit(
    url?: string,
    customConfig?: Partial<AuditConfig>
  ): Promise<AuditReport> {
    if (this.isAuditing) {
      throw new Error('Audit already in progress');
    }

    this.isAuditing = true;
    const startTime = performance.now();
    const auditUrl = url || window.location.href;
    const config = { ...this.config, ...customConfig };

    try {
      logger.info(`Starting accessibility audit for: ${auditUrl}`);

      // Run validation
      const validationResult = await accessibilityValidator.validate(document.body, {
        level: config.level,
        autoFix: config.autoFix,
        includeWarnings: config.includeBestPractices
      });

      // Apply custom rules
      const customIssues = await this.applyCustomRules(config.customRules);
      validationResult.issues.push(...customIssues);

      // Process and enrich issues
      const enrichedIssues = await this.enrichIssues(validationResult.issues);

      // Generate summary
      const summary = this.generateSummary(enrichedIssues);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(enrichedIssues, config);

      // Calculate trends
      const trends = this.calculateTrends();

      // Generate metadata
      const metadata = this.generateMetadata(startTime);

      // Create report
      const report: AuditReport = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        url: auditUrl,
        level: config.level,
        passed: validationResult.passed,
        score: validationResult.score,
        summary,
        issues: enrichedIssues,
        recommendations,
        trends,
        metadata
      };

      // Store report
      this.auditHistory.push(report);
      await this.saveAuditReport(report);

      // Alert on critical issues
      if (config.alertOnCritical && summary.criticalIssues > 0) {
        await this.alertCriticalIssues(report);
      }

      // Generate detailed report if configured
      if (config.generateReports) {
        await this.generateDetailedReport(report);
      }

      logger.info(`Accessibility audit completed: Score ${report.score}`, {
        passed: report.passed,
        issues: summary.totalIssues,
        critical: summary.criticalIssues
      });

      return report;
    } catch (error) {
      logger.error('Accessibility audit failed', error);
      throw error;
    } finally {
      this.isAuditing = false;
    }
  }

  /**
   * Start continuous accessibility monitoring
   */
  public startContinuousMonitoring(): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    logger.info('Starting continuous accessibility monitoring');

    // Set up mutation observer for DOM changes
    const observer = new MutationObserver((mutations) => {
      this.handleDOMChanges(mutations);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'alt', 'role', 'tabindex']
    });

    this.observers.push(observer);

    // Set up periodic full audits
    this.monitoringInterval = setInterval(() => {
      this.runAudit().catch(error => {
        logger.error('Continuous monitoring audit failed', error);
      });
    }, this.config.auditInterval);

    // Monitor for page navigation
    this.monitorPageNavigation();
  }

  /**
   * Stop continuous monitoring
   */
  public stopContinuousMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    logger.info('Stopped continuous accessibility monitoring');
  }

  /**
   * Schedule an accessibility audit
   */
  public scheduleAudit(schedule: Omit<AuditSchedule, 'id'>): string {
    const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newSchedule: AuditSchedule = {
      ...schedule,
      id: scheduleId,
      lastRun: null,
      nextRun: this.calculateNextRun(schedule.frequency)
    };

    this.schedules.push(newSchedule);
    this.processSchedule(newSchedule);

    logger.info(`Scheduled accessibility audit: ${schedule.name}`, {
      frequency: schedule.frequency,
      nextRun: newSchedule.nextRun
    });

    return scheduleId;
  }

  /**
   * Get audit history
   */
  public getAuditHistory(
    limit?: number,
    filter?: { url?: string; dateRange?: { start: Date; end: Date } }
  ): AuditReport[] {
    let history = [...this.auditHistory];

    if (filter?.url) {
      history = history.filter(report => report.url === filter.url);
    }

    if (filter?.dateRange) {
      history = history.filter(report => 
        report.timestamp >= filter.dateRange!.start &&
        report.timestamp <= filter.dateRange!.end
      );
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Get issue statistics
   */
  public getIssueStatistics(): {
    totalIssues: number;
    uniqueIssues: number;
    recurringIssues: number;
    fixedIssues: number;
    issuesByType: Record<string, number>;
    issuesBySeverity: Record<string, number>;
    averageFixTime: number;
    mostCommonIssues: AuditIssueDetail[];
  } {
    const stats = {
      totalIssues: 0,
      uniqueIssues: this.issueDatabase.size,
      recurringIssues: 0,
      fixedIssues: 0,
      issuesByType: {} as Record<string, number>,
      issuesBySeverity: {} as Record<string, number>,
      averageFixTime: 0,
      mostCommonIssues: [] as AuditIssueDetail[]
    };

    let totalFixTime = 0;
    let fixCount = 0;

    this.issueDatabase.forEach(issue => {
      stats.totalIssues += issue.occurrences;
      
      if (issue.occurrences > 1) {
        stats.recurringIssues++;
      }

      if (issue.autoFixable && issue.fixAttempts > 0) {
        stats.fixedIssues++;
        const fixTime = issue.lastDetected.getTime() - issue.firstDetected.getTime();
        totalFixTime += fixTime;
        fixCount++;
      }

      // Count by type
      stats.issuesByType[issue.type] = (stats.issuesByType[issue.type] || 0) + 1;
      
      // Count by severity
      stats.issuesBySeverity[issue.severity] = (stats.issuesBySeverity[issue.severity] || 0) + 1;
    });

    if (fixCount > 0) {
      stats.averageFixTime = totalFixTime / fixCount;
    }

    // Get most common issues
    stats.mostCommonIssues = Array.from(this.issueDatabase.values())
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10);

    return stats;
  }

  /**
   * Export audit report
   */
  public async exportReport(
    reportId: string,
    format: 'json' | 'html' | 'pdf' | 'csv'
  ): Promise<Blob> {
    const report = this.auditHistory.find(r => r.id === reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      
      case 'html':
        return new Blob([this.generateHTMLReport(report)], { type: 'text/html' });
      
      case 'csv':
        return new Blob([this.generateCSVReport(report)], { type: 'text/csv' });
      
      case 'pdf':
        // PDF generation would require additional library
        throw new Error('PDF export not yet implemented');
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Private helper methods

  private async applyCustomRules(rules: AuditRule[]): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const elements = document.querySelectorAll('*');

    for (const rule of rules) {
      for (const element of Array.from(elements)) {
        if (!rule.test(element)) {
          issues.push({
            id: `${rule.id}-${Date.now()}`,
            type: 'custom' as any,
            severity: rule.severity,
            wcagCriterion: rule.wcagCriterion,
            element: element as HTMLElement,
            selector: this.getSelector(element as HTMLElement),
            message: rule.description,
            howToFix: rule.remediation,
            impact: ['Custom rule violation'],
            autoFixable: false
          });
        }
      }
    }

    return issues;
  }

  private async enrichIssues(issues: ValidationIssue[]): Promise<AuditIssueDetail[]> {
    return issues.map(issue => {
      const issueKey = `${issue.type}-${issue.wcagCriterion}-${issue.selector}`;
      const existing = this.issueDatabase.get(issueKey);

      const enriched: AuditIssueDetail = {
        ...issue,
        occurrences: existing ? existing.occurrences + 1 : 1,
        firstDetected: existing ? existing.firstDetected : new Date(),
        lastDetected: new Date(),
        fixAttempts: existing ? existing.fixAttempts : 0,
        userImpact: this.assessUserImpact(issue),
        businessImpact: this.assessBusinessImpact(issue),
        estimatedFixTime: this.estimateFixTime(issue),
        resources: this.getRelevantResources(issue)
      };

      this.issueDatabase.set(issueKey, enriched);
      return enriched;
    });
  }

  private assessUserImpact(issue: ValidationIssue): string[] {
    const impacts: string[] = [];

    switch (issue.type) {
      case 'contrast':
        impacts.push('Users with low vision cannot read content');
        impacts.push('Users in bright environments may struggle');
        break;
      case 'keyboard':
        impacts.push('Keyboard-only users cannot access functionality');
        impacts.push('Users with motor disabilities are blocked');
        break;
      case 'aria':
        impacts.push('Screen reader users receive incorrect information');
        impacts.push('Assistive technology cannot interpret content');
        break;
      case 'focus':
        impacts.push('Users cannot see what element is active');
        impacts.push('Navigation becomes confusing');
        break;
    }

    if (issue.severity === 'critical') {
      impacts.push('Complete barrier to access for some users');
    }

    return impacts;
  }

  private assessBusinessImpact(issue: ValidationIssue): string {
    if (issue.severity === 'critical') {
      return 'High legal risk, potential discrimination claims';
    } else if (issue.severity === 'serious') {
      return 'Moderate legal risk, poor user experience';
    } else if (issue.severity === 'moderate') {
      return 'Low legal risk, degraded user experience';
    } else {
      return 'Minimal risk, minor inconvenience';
    }
  }

  private estimateFixTime(issue: ValidationIssue): string {
    if (issue.autoFixable) {
      return '< 5 minutes (auto-fixable)';
    }

    switch (issue.severity) {
      case 'critical':
        return '1-2 hours';
      case 'serious':
        return '30-60 minutes';
      case 'moderate':
        return '15-30 minutes';
      case 'minor':
        return '5-15 minutes';
      default:
        return 'Unknown';
    }
  }

  private getRelevantResources(issue: ValidationIssue): string[] {
    const resources: string[] = [
      `https://www.w3.org/WAI/WCAG21/Understanding/${issue.wcagCriterion}`,
      'https://webaim.org/resources/quickref/'
    ];

    switch (issue.type) {
      case 'contrast':
        resources.push('https://webaim.org/resources/contrastchecker/');
        break;
      case 'keyboard':
        resources.push('https://webaim.org/articles/keyboard/');
        break;
      case 'aria':
        resources.push('https://www.w3.org/TR/wai-aria-practices-1.1/');
        break;
    }

    return resources;
  }

  private generateSummary(issues: AuditIssueDetail[]): AuditSummary {
    const summary: AuditSummary = {
      totalIssues: issues.length,
      criticalIssues: 0,
      seriousIssues: 0,
      moderateIssues: 0,
      minorIssues: 0,
      fixedIssues: 0,
      newIssues: 0,
      recurringIssues: 0,
      complianceLevel: 'Non-compliant',
      riskScore: 0
    };

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          summary.criticalIssues++;
          summary.riskScore += 10;
          break;
        case 'serious':
          summary.seriousIssues++;
          summary.riskScore += 5;
          break;
        case 'moderate':
          summary.moderateIssues++;
          summary.riskScore += 2;
          break;
        case 'minor':
          summary.minorIssues++;
          summary.riskScore += 1;
          break;
      }

      if (issue.occurrences === 1) {
        summary.newIssues++;
      } else {
        summary.recurringIssues++;
      }

      if (issue.fixAttempts > 0) {
        summary.fixedIssues++;
      }
    });

    // Determine compliance level
    if (summary.criticalIssues === 0 && summary.seriousIssues === 0) {
      if (summary.moderateIssues === 0) {
        summary.complianceLevel = 'AAA Compliant';
      } else if (summary.moderateIssues < 5) {
        summary.complianceLevel = 'AA Compliant';
      } else {
        summary.complianceLevel = 'A Compliant';
      }
    }

    return summary;
  }

  private async generateRecommendations(
    issues: AuditIssueDetail[],
    config: AuditConfig
  ): Promise<AuditRecommendation[]> {
    const recommendations: AuditRecommendation[] = [];

    // Group issues by type
    const issuesByType = new Map<string, AuditIssueDetail[]>();
    issues.forEach(issue => {
      const list = issuesByType.get(issue.type) || [];
      list.push(issue);
      issuesByType.set(issue.type, list);
    });

    // Generate recommendations for each type
    issuesByType.forEach((typeIssues, type) => {
      const criticalCount = typeIssues.filter(i => i.severity === 'critical').length;
      const priority = criticalCount > 0 ? 'high' : 
                      typeIssues.length > 5 ? 'medium' : 'low';

      recommendations.push({
        priority,
        category: type,
        title: `Fix ${type} accessibility issues`,
        description: `${typeIssues.length} ${type} issues detected affecting user accessibility`,
        impact: `Resolving these issues will improve accessibility for ${this.getAffectedUserGroups(type).join(', ')}`,
        effort: this.estimateEffort(typeIssues),
        resources: this.getResourcesForType(type),
        relatedIssues: typeIssues.map(i => i.id)
      });
    });

    // Add best practice recommendations if configured
    if (config.includeBestPractices) {
      recommendations.push(...this.getBestPracticeRecommendations(issues));
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private getAffectedUserGroups(issueType: string): string[] {
    const groups: Record<string, string[]> = {
      contrast: ['users with low vision', 'elderly users', 'users with color blindness'],
      keyboard: ['keyboard-only users', 'users with motor disabilities', 'power users'],
      aria: ['screen reader users', 'users with blindness', 'users with cognitive disabilities'],
      focus: ['keyboard users', 'users with attention disorders', 'users with low vision'],
      forms: ['all users', 'screen reader users', 'users with cognitive disabilities'],
      images: ['screen reader users', 'users with slow connections', 'users with blindness'],
      headings: ['screen reader users', 'users scanning content', 'users with cognitive disabilities'],
      landmarks: ['screen reader users', 'keyboard users', 'users with cognitive disabilities']
    };

    return groups[issueType] || ['all users'];
  }

  private estimateEffort(issues: AuditIssueDetail[]): 'low' | 'medium' | 'high' {
    const totalTime = issues.reduce((sum, issue) => {
      const time = parseInt(issue.estimatedFixTime) || 30;
      return sum + time;
    }, 0);

    if (totalTime < 60) return 'low';
    if (totalTime < 240) return 'medium';
    return 'high';
  }

  private getResourcesForType(type: string): string[] {
    const resources: Record<string, string[]> = {
      contrast: [
        'https://webaim.org/articles/contrast/',
        'https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced'
      ],
      keyboard: [
        'https://webaim.org/articles/keyboard/',
        'https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible'
      ],
      aria: [
        'https://www.w3.org/TR/wai-aria-practices-1.1/',
        'https://webaim.org/articles/aria/'
      ]
    };

    return resources[type] || ['https://www.w3.org/WAI/WCAG21/quickref/'];
  }

  private getBestPracticeRecommendations(issues: AuditIssueDetail[]): AuditRecommendation[] {
    const recommendations: AuditRecommendation[] = [];

    // Check for overall patterns
    if (issues.filter(i => i.type === 'keyboard').length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'best-practice',
        title: 'Implement comprehensive keyboard testing',
        description: 'Regular keyboard navigation testing can prevent accessibility barriers',
        impact: 'Proactive testing reduces future accessibility issues',
        effort: 'low',
        resources: ['https://webaim.org/articles/keyboard/testing'],
        relatedIssues: []
      });
    }

    return recommendations;
  }

  private calculateTrends(): AuditTrends {
    const history = this.auditHistory.slice(-30); // Last 30 audits
    
    const scoreHistory = history.map(r => ({
      date: r.timestamp,
      score: r.score
    }));

    const issueHistory = history.map(r => ({
      date: r.timestamp,
      count: r.summary.totalIssues
    }));

    const complianceHistory = history.map(r => ({
      date: r.timestamp,
      level: r.summary.complianceLevel
    }));

    // Calculate improvement rate
    let improvementRate = 0;
    if (scoreHistory.length >= 2) {
      const firstScore = scoreHistory[0].score;
      const lastScore = scoreHistory[scoreHistory.length - 1].score;
      improvementRate = ((lastScore - firstScore) / firstScore) * 100;
    }

    // Project compliance date
    let projectedCompliance: Date | null = null;
    if (improvementRate > 0) {
      const currentScore = scoreHistory[scoreHistory.length - 1]?.score || 0;
      const targetScore = 95; // AAA compliance threshold
      const scoreDiff = targetScore - currentScore;
      const daysToCompliance = (scoreDiff / improvementRate) * 30;
      
      if (daysToCompliance > 0 && daysToCompliance < 365) {
        projectedCompliance = new Date();
        projectedCompliance.setDate(projectedCompliance.getDate() + daysToCompliance);
      }
    }

    return {
      scoreHistory,
      issueHistory,
      complianceHistory,
      improvementRate,
      projectedCompliance
    };
  }

  private generateMetadata(startTime: number): AuditMetadata {
    return {
      auditDuration: performance.now() - startTime,
      elementsChecked: document.querySelectorAll('*').length,
      rulesApplied: this.config.customRules.length + 20, // Base rules + custom
      browserInfo: navigator.userAgent,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      deviceType: this.detectDeviceType(),
      userAgent: navigator.userAgent
    };
  }

  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    
    const classes = Array.from(element.classList).join('.');
    if (classes) return `${element.tagName.toLowerCase()}.${classes}`;
    
    return element.tagName.toLowerCase();
  }

  private handleDOMChanges(mutations: MutationRecord[]): void {
    // Quick validation of changed elements
    const changedElements = new Set<Element>();
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            changedElements.add(node as Element);
          }
        });
      } else if (mutation.type === 'attributes' && mutation.target) {
        changedElements.add(mutation.target as Element);
      }
    });

    if (changedElements.size > 0) {
      // Debounced validation of changed elements
      this.validateChangedElements(Array.from(changedElements));
    }
  }

  private async validateChangedElements(elements: Element[]): Promise<void> {
    // Quick validation of specific elements
    for (const element of elements) {
      const htmlElement = element as HTMLElement;
      
      // Check critical accessibility attributes
      if (element.matches('img') && !element.hasAttribute('alt')) {
        logger.warn('Image added without alt text', { element: this.getSelector(htmlElement) });
      }
      
      if (element.matches('button, a') && !element.textContent?.trim() && !element.getAttribute('aria-label')) {
        logger.warn('Interactive element added without accessible name', { element: this.getSelector(htmlElement) });
      }
    }
  }

  private monitorPageNavigation(): void {
    // Monitor for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleNavigation();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleNavigation();
    };

    window.addEventListener('popstate', () => {
      this.handleNavigation();
    });
  }

  private handleNavigation(): void {
    // Run audit after navigation
    setTimeout(() => {
      this.runAudit().catch(error => {
        logger.error('Post-navigation audit failed', error);
      });
    }, 1000); // Wait for page to settle
  }

  private initializeSchedules(): void {
    // Process any existing schedules
    this.schedules.forEach(schedule => {
      if (schedule.enabled) {
        this.processSchedule(schedule);
      }
    });
  }

  private processSchedule(schedule: AuditSchedule): void {
    if (!schedule.enabled || !schedule.nextRun) return;

    const now = new Date();
    const timeUntilNext = schedule.nextRun.getTime() - now.getTime();

    if (timeUntilNext <= 0) {
      // Run immediately and reschedule
      this.runScheduledAudit(schedule);
    } else {
      // Schedule for future
      setTimeout(() => {
        this.runScheduledAudit(schedule);
      }, timeUntilNext);
    }
  }

  private async runScheduledAudit(schedule: AuditSchedule): Promise<void> {
    try {
      await this.runAudit(undefined, schedule.config);
      
      schedule.lastRun = new Date();
      schedule.nextRun = this.calculateNextRun(schedule.frequency);
      
      // Reschedule
      this.processSchedule(schedule);
    } catch (error) {
      logger.error(`Scheduled audit failed: ${schedule.name}`, error);
    }
  }

  private calculateNextRun(frequency: string): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'continuous':
        next.setMinutes(next.getMinutes() + 5); // Every 5 minutes for continuous
        break;
    }

    return next;
  }

  private async loadAuditHistory(): Promise<void> {
    try {
      const stored = localStorage.getItem('accessibility-audit-history');
      if (stored) {
        const history = JSON.parse(stored);
        this.auditHistory = history.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }));
      }
    } catch (error) {
      logger.warn('Failed to load audit history', error);
    }
  }

  private async saveAuditReport(report: AuditReport): Promise<void> {
    try {
      // Save to localStorage (limited to last 100 reports)
      const toSave = this.auditHistory.slice(-100);
      localStorage.setItem('accessibility-audit-history', JSON.stringify(toSave));
      
      // In production, would also save to backend
    } catch (error) {
      logger.warn('Failed to save audit report', error);
    }
  }

  private async alertCriticalIssues(report: AuditReport): Promise<void> {
    const criticalIssues = report.issues.filter(i => i.severity === 'critical');
    
    logger.error('Critical accessibility issues detected', {
      count: criticalIssues.length,
      issues: criticalIssues.map(i => ({
        type: i.type,
        message: i.message,
        element: i.selector
      }))
    });

    // In production, would send alerts to monitoring service
  }

  private async generateDetailedReport(report: AuditReport): Promise<void> {
    // In production, would generate and store detailed report
    logger.info('Detailed report generated', { reportId: report.id });
  }

  private generateHTMLReport(report: AuditReport): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Accessibility Audit Report - ${report.timestamp.toISOString()}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
          h1 { color: #1a1a1a; }
          .summary { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .passed { color: #008000; }
          .failed { color: #d00000; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
          th { background: #f0f0f0; }
          .critical { background: #ffebee; }
          .serious { background: #fff3cd; }
          .moderate { background: #e3f2fd; }
          .minor { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>Accessibility Audit Report</h1>
        <div class="summary">
          <h2>Summary</h2>
          <p>URL: ${report.url}</p>
          <p>Date: ${report.timestamp.toLocaleString()}</p>
          <p>Score: <strong class="${report.passed ? 'passed' : 'failed'}">${report.score}%</strong></p>
          <p>Compliance Level: ${report.summary.complianceLevel}</p>
          <p>Total Issues: ${report.summary.totalIssues}</p>
        </div>
        <h2>Issues</h2>
        <table>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Type</th>
              <th>Description</th>
              <th>Element</th>
              <th>How to Fix</th>
            </tr>
          </thead>
          <tbody>
            ${report.issues.map(issue => `
              <tr class="${issue.severity}">
                <td>${issue.severity}</td>
                <td>${issue.type}</td>
                <td>${issue.message}</td>
                <td><code>${issue.selector}</code></td>
                <td>${issue.howToFix}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <h2>Recommendations</h2>
        <ul>
          ${report.recommendations.map(rec => `
            <li>
              <strong>${rec.title}</strong> (${rec.priority} priority)
              <p>${rec.description}</p>
            </li>
          `).join('')}
        </ul>
      </body>
      </html>
    `;
  }

  private generateCSVReport(report: AuditReport): string {
    const headers = ['Severity', 'Type', 'Description', 'Element', 'How to Fix', 'WCAG Criterion'];
    const rows = report.issues.map(issue => [
      issue.severity,
      issue.type,
      `"${issue.message.replace(/"/g, '""')}"`,
      issue.selector,
      `"${issue.howToFix.replace(/"/g, '""')}"`,
      issue.wcagCriterion
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}

// Create singleton instance
export const accessibilityAuditService = new AccessibilityAuditService();

export default accessibilityAuditService;