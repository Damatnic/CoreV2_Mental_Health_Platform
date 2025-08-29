/**
 * Crisis History Service
 *
 * Tracks and manages crisis detection history with analytics, patterns,
 * and predictive insights for better crisis intervention and prevention.
 */

import { crisisDetectionService } from './crisisDetectionService';
import { notificationService } from './notificationService';

export interface CrisisHistoryEntry {
  id: string;
  timestamp: Date;
  userId: string;
  analysis: CrisisAnalysisResult;
  falsePositive?: boolean;
  userFeedback?: {
    helpful: boolean;
    comment?: string;
    rating?: number; // 1-5
  };
  escalationOutcome?: {
    contacted: string[];
    responseTime: number; // minutes
    resolved: boolean;
    effectiveness: number; // 1-10
    followUpActions: string[];
  };
  contextualData?: {
    timeOfDay: string;
    dayOfWeek: string;
    location?: string;
    trigger?: string;
    mood?: string;
    stressLevel?: number; // 1-10
  };
  interventionResult?: {
    interventionType: string;
    successful: boolean;
    duration: number; // minutes
    resources: string[];
    outcome: string;
  };
}

export interface CrisisPattern {
  id: string;
  type: 'time_based' | 'trigger_based' | 'escalation' | 'seasonal' | 'cyclical';
  pattern: string;
  frequency: number;
  lastOccurrence: Date;
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high';
  predictiveValue: number; // 0-1
  recommendations: string[];
}

export interface CrisisStatistics {
  totalEvents: number;
  severityDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  falsePositiveRate: number;
  averageResponseTime: number;
  escalationRate: number;
  resolutionRate: number;
  interventionSuccessRate: number;
  patternCount: number;
  riskTrend: 'increasing' | 'stable' | 'decreasing';
  lastAnalysis?: Date;
}

export interface RiskPrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  timeframe: '24h' | '48h' | '1week' | '1month';
  factors: string[];
  recommendations: string[];
  confidence: number; // 0-1
  basedOnPatterns: string[];
}

export interface CrisisAlert {
  id: string;
  type: 'pattern_detected' | 'escalation_risk' | 'intervention_needed' | 'follow_up_due';
  severity: 'info' | 'warning' | 'urgent' | 'critical';
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  suggestedActions: string[];
  expiresAt?: Date;
}

export interface HistoryAnalytics {
  totalAnalyses: number;
  averageRisk: number;
  riskTrend: number; // positive = increasing
  mostCommonTriggers: Array<{ trigger: string; count: number }>;
  timePatterns: Array<{ time: string; frequency: number }>;
  interventionEffectiveness: Record<string, number>;
  recoveryTime: number; // average days
  relapseProbability: number; // 0-1
}

class CrisisHistoryService {
  private history: Map<string, CrisisHistoryEntry[]> = new Map();
  private patterns: Map<string, CrisisPattern[]> = new Map();
  private alerts: Map<string, CrisisAlert[]> = new Map();
  private analytics: Map<string, HistoryAnalytics> = new Map();

  /**
   * Record a crisis detection event
   */
  public recordCrisisEvent(
    userId: string,
    analysis: CrisisAnalysisResult,
    metadata?: {
      source?: string;
      sessionId?: string;
      contextualData?: CrisisHistoryEntry['contextualData'];
    }
  ): CrisisHistoryEntry {
    const entry: CrisisHistoryEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      userId,
      analysis,
      followUpActions: [],
      contextualData: metadata?.contextualData
    };

    // Get or create user history
    const userHistory = this.history.get(userId) || [];
    userHistory.push(entry);
    this.history.set(userId, userHistory);

    // Analyze patterns in background
    this.analyzePatterns(userId, entry);

    // Check for escalation needs based on history
    if (this.shouldAutoEscalate(userId, entry)) {
      this.triggerAutoEscalation(userId, entry);
    }

    // Generate alerts if needed
    this.checkForAlerts(userId, entry);

    // Update analytics
    this.updateAnalytics(userId);

    return entry;
  }

  /**
   * Mark an event as false positive
   */
  public markFalsePositive(userId: string, eventId: string, feedback?: string): void {
    const userHistory = this.history.get(userId);
    if (!userHistory) return;

    const entry = userHistory.find(e => e.id === eventId);
    if (entry) {
      entry.falsePositive = true;
      if (feedback) {
        entry.userFeedback = {
          helpful: false,
          comment: feedback,
          rating: 1
        };
      }

      // Update false positive patterns for learning
      this.updateFalsePositivePatterns(entry);
      
      // Update analytics
      this.updateAnalytics(userId);
    }
  }

  /**
   * Record intervention outcome
   */
  public recordInterventionOutcome(
    userId: string,
    eventId: string,
    outcome: CrisisHistoryEntry['interventionResult']
  ): void {
    const userHistory = this.history.get(userId);
    if (!userHistory) return;

    const entry = userHistory.find(e => e.id === eventId);
    if (entry) {
      entry.interventionResult = outcome;
      this.updateAnalytics(userId);
    }
  }

  /**
   * Get user crisis history with filtering options
   */
  public getUserHistory(
    userId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      severity?: string[];
      includeFalsePositives?: boolean;
      sortBy?: 'timestamp' | 'severity' | 'risk';
      sortOrder?: 'asc' | 'desc';
    }
  ): CrisisHistoryEntry[] {
    let history = this.history.get(userId) || [];

    // Apply filters
    if (options) {
      if (!options.includeFalsePositives) {
        history = history.filter(e => !e.falsePositive);
      }
      
      if (options.startDate) {
        history = history.filter(e => e.timestamp >= options.startDate!);
      }
      
      if (options.endDate) {
        history = history.filter(e => e.timestamp <= options.endDate!);
      }
      
      if (options.severity && options.severity.length > 0) {
        history = history.filter(e => options.severity!.includes(e.analysis.severityLevel));
      }

      // Sort results
      if (options.sortBy) {
        history.sort((a, b) => {
          let comparison = 0;
          switch (options.sortBy) {
            case 'timestamp':
              comparison = a.timestamp.getTime() - b.timestamp.getTime();
              break;
            case 'severity':
              const severityOrder = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
              comparison = severityOrder[a.analysis.severityLevel] - severityOrder[b.analysis.severityLevel];
              break;
            case 'risk':
              comparison = a.analysis.riskLevel - b.analysis.riskLevel;
              break;
          }
          return options.sortOrder === 'desc' ? -comparison : comparison;
        });
      }
      
      if (options.limit) {
        history = history.slice(-options.limit);
      }
    }

    return history;
  }

  /**
   * Get crisis statistics for a user
   */
  public getUserStatistics(userId: string): CrisisStatistics {
    const history = this.history.get(userId) || [];
    
    const stats: CrisisStatistics = {
      totalEvents: history.length,
      severityDistribution: {},
      categoryDistribution: {},
      falsePositiveRate: 0,
      averageResponseTime: 0,
      escalationRate: 0,
      resolutionRate: 0,
      interventionSuccessRate: 0,
      patternCount: 0,
      riskTrend: 'stable',
      lastAnalysis: history.length > 0 ? history[history.length - 1].timestamp : undefined
    };

    if (history.length === 0) return stats;

    // Calculate distributions and rates
    let falsePositives = 0;
    let escalations = 0;
    let resolutions = 0;
    let totalResponseTime = 0;
    let responseCount = 0;
    let successfulInterventions = 0;
    let totalInterventions = 0;

    history.forEach(entry => {
      // Severity distribution
      const severity = entry.analysis.severityLevel;
      stats.severityDistribution[severity] = (stats.severityDistribution[severity] || 0) + 1;

      // Category distribution
      entry.analysis.detectedCategories?.forEach(cat => {
        stats.categoryDistribution[cat] = (stats.categoryDistribution[cat] || 0) + 1;
      });

      // False positives
      if (entry.falsePositive) falsePositives++;

      // Escalations
      if (entry.analysis.escalationRequired) escalations++;

      // Resolutions
      if (entry.escalationOutcome?.resolved) resolutions++;

      // Response times
      if (entry.escalationOutcome?.responseTime) {
        totalResponseTime += entry.escalationOutcome.responseTime;
        responseCount++;
      }

      // Intervention success
      if (entry.interventionResult) {
        totalInterventions++;
        if (entry.interventionResult.successful) {
          successfulInterventions++;
        }
      }
    });

    // Calculate rates
    stats.falsePositiveRate = (falsePositives / history.length) * 100;
    stats.escalationRate = (escalations / history.length) * 100;
    stats.resolutionRate = escalations > 0 ? (resolutions / escalations) * 100 : 0;
    stats.averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    stats.interventionSuccessRate = totalInterventions > 0 ? 
      (successfulInterventions / totalInterventions) * 100 : 0;

    // Pattern count
    const patterns = this.patterns.get(userId) || [];
    stats.patternCount = patterns.length;

    // Risk trend
    stats.riskTrend = this.calculateRiskTrend(history);

    return stats;
  }

  /**
   * Detect crisis patterns for a user
   */
  public detectPatterns(userId: string): CrisisPattern[] {
    const history = this.history.get(userId) || [];
    const patterns: CrisisPattern[] = [];

    // Time-based patterns
    const timePatterns = this.detectTimePatterns(history);
    patterns.push(...timePatterns);

    // Trigger-based patterns
    const triggerPatterns = this.detectTriggerPatterns(history);
    patterns.push(...triggerPatterns);

    // Escalation patterns
    const escalationPatterns = this.detectEscalationPatterns(history);
    patterns.push(...escalationPatterns);

    // Seasonal patterns
    const seasonalPatterns = this.detectSeasonalPatterns(history);
    patterns.push(...seasonalPatterns);

    // Cyclical patterns
    const cyclicalPatterns = this.detectCyclicalPatterns(history);
    patterns.push(...cyclicalPatterns);

    // Store patterns
    this.patterns.set(userId, patterns);

    return patterns;
  }

  /**
   * Get risk prediction based on history and patterns
   */
  public getRiskPrediction(
    userId: string,
    timeframe: RiskPrediction['timeframe'] = '24h'
  ): RiskPrediction {
    const history = this.getUserHistory(userId, { limit: 30 });
    const patterns = this.patterns.get(userId) || [];
    const stats = this.getUserStatistics(userId);

    let riskScore = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];
    const basedOnPatterns: string[] = [];

    // Recent high-severity events
    const recentCritical = history.filter(e => 
      e.analysis.severityLevel === 'critical' && this.isRecent(e.timestamp, 7)
    ).length;

    if (recentCritical > 0) {
      riskScore += recentCritical * 30;
      factors.push(`${recentCritical} critical events in past week`);
      recommendations.push('Immediate professional intervention recommended');
    }

    // Escalating pattern
    if (this.isEscalatingPattern(history)) {
      riskScore += 25;
      factors.push('Escalating severity pattern detected');
      recommendations.push('Increase monitoring frequency');
    }

    // High frequency
    const frequency = history.filter(e => this.isRecent(e.timestamp, 30)).length;
    if (frequency > 10) {
      riskScore += 20;
      factors.push(`High frequency: ${frequency} events in 30 days`);
      recommendations.push('Daily check-ins recommended');
    }

    // Pattern-based predictions
    patterns.forEach(pattern => {
      if (pattern.predictiveValue > 0.7) {
        riskScore += pattern.predictiveValue * 15;
        factors.push(`Pattern detected: ${pattern.pattern}`);
        basedOnPatterns.push(pattern.pattern);
        recommendations.push(...pattern.recommendations);
      }
    });

    // Determine risk level
    let riskLevel: RiskPrediction['riskLevel'];
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';
    else riskLevel = 'low';

    // Calculate probability based on historical data
    const probability = Math.min(riskScore / 100, 1.0);

    // Calculate confidence
    const confidence = this.calculatePredictionConfidence(history, patterns);

    // Add general recommendations
    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push(
        'Ensure safety plan is updated and accessible',
        'Verify emergency contacts are current',
        'Consider 24/7 crisis support availability'
      );
    }

    return {
      riskLevel,
      probability,
      timeframe,
      factors,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      confidence,
      basedOnPatterns
    };
  }

  /**
   * Get active alerts for a user
   */
  public getActiveAlerts(userId: string): CrisisAlert[] {
    const alerts = this.alerts.get(userId) || [];
    const now = new Date();
    
    // Filter out expired alerts
    return alerts.filter(alert => !alert.expiresAt || alert.expiresAt > now);
  }

  /**
   * Get analytics for a user
   */
  public getAnalytics(userId: string): HistoryAnalytics | undefined {
    return this.analytics.get(userId);
  }

  /**
   * Private helper methods
   */
  private generateId(): string {
    return `crisis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private analyzePatterns(userId: string, entry: CrisisHistoryEntry): void {
    // Analyze patterns in background
    setTimeout(() => {
      const patterns = this.detectPatterns(userId);
      this.patterns.set(userId, patterns);
    }, 0);
  }

  private shouldAutoEscalate(userId: string, entry: CrisisHistoryEntry): boolean {
    const history = this.getUserHistory(userId, { limit: 5 });
    
    // Multiple high-severity events in short time
    const recentHighSeverity = history.filter(e => 
      e.analysis.severityLevel === 'high' || e.analysis.severityLevel === 'critical'
    ).length;

    return recentHighSeverity >= 3 || entry.analysis.severityLevel === 'critical';
  }

  private async triggerAutoEscalation(userId: string, entry: CrisisHistoryEntry): Promise<void> {
    // Trigger escalation workflow
    await notificationService.sendNotification({
      userId: 'crisis-escalation-team',
      title: 'Auto-Escalation Triggered',
      message: `User ${userId} requires immediate attention based on crisis history patterns`,
      priority: 'critical',
      type: 'crisis'
    });

    console.log(`Auto-escalation triggered for user ${userId} based on crisis history`);
  }

  private updateFalsePositivePatterns(entry: CrisisHistoryEntry): void {
    // Store patterns that led to false positives for ML training
    console.log(`False positive recorded: ${entry.id}`);
  }

  private checkForAlerts(userId: string, entry: CrisisHistoryEntry): void {
    const alerts = this.alerts.get(userId) || [];
    const newAlerts: CrisisAlert[] = [];

    // Pattern detection alert
    if (entry.analysis.severityLevel === 'high' || entry.analysis.severityLevel === 'critical') {
      newAlerts.push({
        id: this.generateId(),
        type: 'escalation_risk',
        severity: 'urgent',
        message: 'High-risk crisis event detected requiring immediate attention',
        timestamp: new Date(),
        actionRequired: true,
        suggestedActions: ['Contact crisis counselor', 'Activate safety plan', 'Notify emergency contacts'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    }

    if (newAlerts.length > 0) {
      alerts.push(...newAlerts);
      this.alerts.set(userId, alerts);
    }
  }

  private updateAnalytics(userId: string): void {
    const history = this.history.get(userId) || [];
    
    if (history.length === 0) return;

    const analytics: HistoryAnalytics = {
      totalAnalyses: history.length,
      averageRisk: history.reduce((sum, e) => sum + e.analysis.riskLevel, 0) / history.length,
      riskTrend: this.calculateRiskTrendValue(history),
      mostCommonTriggers: this.getMostCommonTriggers(history),
      timePatterns: this.getTimePatterns(history),
      interventionEffectiveness: this.getInterventionEffectiveness(history),
      recoveryTime: this.calculateAverageRecoveryTime(history),
      relapseProbability: this.calculateRelapseProbability(history)
    };

    this.analytics.set(userId, analytics);
  }

  // Pattern detection methods
  private detectTimePatterns(history: CrisisHistoryEntry[]): CrisisPattern[] {
    const patterns: CrisisPattern[] = [];
    const hourCounts: Record<number, number> = {};

    history.forEach(entry => {
      const hour = entry.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Find peak hours
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count >= 3) {
        patterns.push({
          id: this.generateId(),
          type: 'time_based',
          pattern: `Peak crisis time: ${hour}:00-${parseInt(hour) + 1}:00`,
          frequency: count,
          lastOccurrence: new Date(),
          confidence: Math.min(count / history.length, 1.0),
          severity: count >= 5 ? 'high' : count >= 3 ? 'medium' : 'low',
          predictiveValue: Math.min(count / history.length * 2, 1.0),
          recommendations: [`Increase monitoring during ${hour}:00-${parseInt(hour) + 1}:00`]
        });
      }
    });

    return patterns;
  }

  private detectTriggerPatterns(history: CrisisHistoryEntry[]): CrisisPattern[] {
    const patterns: CrisisPattern[] = [];
    const triggerCounts: Record<string, number> = {};

    history.forEach(entry => {
      if (entry.contextualData?.trigger) {
        const trigger = entry.contextualData.trigger;
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      }
    });

    Object.entries(triggerCounts).forEach(([trigger, count]) => {
      if (count >= 2) {
        patterns.push({
          id: this.generateId(),
          type: 'trigger_based',
          pattern: `Recurring trigger: ${trigger}`,
          frequency: count,
          lastOccurrence: new Date(),
          confidence: Math.min(count / history.length * 2, 1.0),
          severity: count >= 4 ? 'high' : count >= 2 ? 'medium' : 'low',
          predictiveValue: Math.min(count / history.length * 1.5, 1.0),
          recommendations: [`Develop coping strategies for ${trigger}`, `Early intervention when ${trigger} occurs`]
        });
      }
    });

    return patterns;
  }

  private detectEscalationPatterns(history: CrisisHistoryEntry[]): CrisisPattern[] {
    const patterns: CrisisPattern[] = [];
    
    if (this.isEscalatingPattern(history)) {
      patterns.push({
        id: this.generateId(),
        type: 'escalation',
        pattern: 'Severity escalation detected',
        frequency: 1,
        lastOccurrence: new Date(),
        confidence: 0.8,
        severity: 'high',
        predictiveValue: 0.9,
        recommendations: ['Immediate intervention needed', 'Increase monitoring frequency', 'Review treatment plan']
      });
    }

    return patterns;
  }

  private detectSeasonalPatterns(history: CrisisHistoryEntry[]): CrisisPattern[] {
    const patterns: CrisisPattern[] = [];
    const monthCounts: Record<number, number> = {};

    history.forEach(entry => {
      const month = entry.timestamp.getMonth();
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    // Find seasonal peaks (need at least 6 months of data)
    if (history.length >= 20) {
      Object.entries(monthCounts).forEach(([month, count]) => {
        const avgCount = history.length / 12;
        if (count > avgCount * 1.5) {
          const monthName = new Date(0, parseInt(month)).toLocaleString('en', { month: 'long' });
          patterns.push({
            id: this.generateId(),
            type: 'seasonal',
            pattern: `Seasonal pattern: Higher risk in ${monthName}`,
            frequency: count,
            lastOccurrence: new Date(),
            confidence: 0.7,
            severity: 'medium',
            predictiveValue: 0.6,
            recommendations: [`Increase preventive measures in ${monthName}`, 'Consider seasonal affective factors']
          });
        }
      });
    }

    return patterns;
  }

  private detectCyclicalPatterns(history: CrisisHistoryEntry[]): CrisisPattern[] {
    const patterns: CrisisPattern[] = [];
    
    // Simple cyclical detection - would be more sophisticated in production
    if (history.length >= 10) {
      const intervals: number[] = [];
      
      for (let i = 1; i < history.length; i++) {
        const interval = history[i].timestamp.getTime() - history[i-1].timestamp.getTime();
        intervals.push(interval / (1000 * 60 * 60 * 24)); // Convert to days
      }

      // Check for regular intervals
      const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
      const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
      
      if (variance < avgInterval * 0.5 && avgInterval > 1) { // Low variance, reasonable interval
        patterns.push({
          id: this.generateId(),
          type: 'cyclical',
          pattern: `Cyclical pattern: ~${Math.round(avgInterval)} day intervals`,
          frequency: history.length,
          lastOccurrence: history[history.length - 1].timestamp,
          confidence: 0.6,
          severity: 'medium',
          predictiveValue: 0.7,
          recommendations: ['Monitor for next predicted occurrence', 'Implement preventive measures']
        });
      }
    }

    return patterns;
  }

  // Helper calculation methods
  private calculateRiskTrend(history: CrisisHistoryEntry[]): CrisisStatistics['riskTrend'] {
    if (history.length < 3) return 'stable';

    const recent = history.slice(-5);
    const riskLevels = recent.map(e => this.severityToNumber(e.analysis.severityLevel));
    
    let increasing = 0;
    for (let i = 1; i < riskLevels.length; i++) {
      if (riskLevels[i] > riskLevels[i-1]) increasing++;
    }

    const trend = increasing / (riskLevels.length - 1);
    if (trend > 0.6) return 'increasing';
    if (trend < 0.4) return 'decreasing';
    return 'stable';
  }

  private calculateRiskTrendValue(history: CrisisHistoryEntry[]): number {
    if (history.length < 2) return 0;

    const recent = history.slice(-10);
    const risks = recent.map(e => e.analysis.riskLevel);
    
    // Simple linear regression slope
    const n = risks.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = risks.reduce((sum, risk) => sum + risk, 0);
    const sumXY = risks.reduce((sum, risk, i) => sum + risk * i, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private isEscalatingPattern(history: CrisisHistoryEntry[]): boolean {
    if (history.length < 3) return false;

    const severityWeights = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    const recent = history.slice(-5);
    
    let increasing = 0;
    for (let i = 1; i < recent.length; i++) {
      const prev = severityWeights[recent[i-1].analysis.severityLevel] || 0;
      const curr = severityWeights[recent[i].analysis.severityLevel] || 0;
      if (curr > prev) increasing++;
    }

    return increasing > 2;
  }

  private isRecent(date: Date, days: number): boolean {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff < days * 24 * 60 * 60 * 1000;
  }

  private severityToNumber(severity: string): number {
    const weights = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return weights[severity] || 0;
  }

  private getMostCommonTriggers(history: CrisisHistoryEntry[]): Array<{ trigger: string; count: number }> {
    const triggerCounts: Record<string, number> = {};
    
    history.forEach(entry => {
      if (entry.contextualData?.trigger) {
        const trigger = entry.contextualData.trigger;
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      }
    });

    return Object.entries(triggerCounts)
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getTimePatterns(history: CrisisHistoryEntry[]): Array<{ time: string; frequency: number }> {
    const hourCounts: Record<number, number> = {};
    
    history.forEach(entry => {
      const hour = entry.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .map(([hour, frequency]) => ({ time: `${hour}:00`, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private getInterventionEffectiveness(history: CrisisHistoryEntry[]): Record<string, number> {
    const effectiveness: Record<string, number[]> = {};
    
    history.forEach(entry => {
      if (entry.interventionResult) {
        const type = entry.interventionResult.interventionType;
        if (!effectiveness[type]) effectiveness[type] = [];
        effectiveness[type].push(entry.interventionResult.successful ? 1 : 0);
      }
    });

    const result: Record<string, number> = {};
    Object.entries(effectiveness).forEach(([type, values]) => {
      result[type] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return result;
  }

  private calculateAverageRecoveryTime(history: CrisisHistoryEntry[]): number {
    const recoveryTimes: number[] = [];
    
    for (let i = 0; i < history.length - 1; i++) {
      if (history[i].analysis.severityLevel === 'high' || history[i].analysis.severityLevel === 'critical') {
        // Find next low-severity event
        for (let j = i + 1; j < history.length; j++) {
          if (history[j].analysis.severityLevel === 'low' || history[j].analysis.severityLevel === 'none') {
            const recoveryTime = (history[j].timestamp.getTime() - history[i].timestamp.getTime()) / (1000 * 60 * 60 * 24);
            recoveryTimes.push(recoveryTime);
            break;
          }
        }
      }
    }

    return recoveryTimes.length > 0 ? 
      recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length : 0;
  }

  private calculateRelapseProbability(history: CrisisHistoryEntry[]): number {
    if (history.length < 5) return 0;

    let relapses = 0;
    let recoveries = 0;

    for (let i = 0; i < history.length - 2; i++) {
      const current = this.severityToNumber(history[i].analysis.severityLevel);
      const next = this.severityToNumber(history[i + 1].analysis.severityLevel);
      const afterNext = this.severityToNumber(history[i + 2].analysis.severityLevel);

      // Recovery followed by relapse
      if (current >= 3 && next <= 1 && afterNext >= 2) {
        relapses++;
      }
      
      // Count recoveries
      if (current >= 3 && next <= 1) {
        recoveries++;
      }
    }

    return recoveries > 0 ? relapses / recoveries : 0;
  }

  private calculatePredictionConfidence(
    history: CrisisHistoryEntry[],
    patterns: CrisisPattern[]
  ): number {
    let confidence = 0.5; // baseline
    
    if (history.length >= 10) confidence += 0.2;
    if (patterns.length >= 3) confidence += 0.2;
    if (history.length >= 30) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
}

// Export singleton instance
export const crisisHistoryService = new CrisisHistoryService();
export default crisisHistoryService;

// Additional type exports for external use
export type { CrisisAnalysisResult } from './crisisDetectionService';
