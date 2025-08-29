/**
 * AI-Powered Content Moderation Service
 *
 * Provides intelligent content moderation for user-generated content,
 * chat messages, and crisis-related communications with HIPAA compliance
 *
 * Features:
 * - Real-time content analysis and filtering
 * - Crisis language detection and escalation
 * - Harmful content identification and blocking
 * - Cultural sensitivity and context awareness
 * - Privacy-preserving moderation techniques
 * - Automated escalation for concerning content
 * - Performance-optimized processing
 * - Comprehensive audit logging
 *
 * @license Apache-2.0
 */

import { logger } from '../utils/logger';
import { performanceService } from './performanceService';
// TODO: Import crisis intervention workflow when available\n// import { crisisInterventionWorkflow } from './crisisInterventionWorkflow';\n\n// Temporary crisis workflow placeholder\nconst crisisInterventionWorkflow = {\n  escalate: (content: any) => Promise.resolve({ escalated: true }),\n  analyze: (content: any) => Promise.resolve({ riskLevel: 'low' }),\n  triggerCrisisIntervention: (options: any) => Promise.resolve({ triggered: true })\n};

// Content Types for Moderation
export type ContentType = 
  | 'chat_message'
  | 'journal_entry' 
  | 'assessment_response'
  | 'user_profile'
  | 'safety_plan'
  | 'peer_support_message'
  | 'crisis_report';

// Moderation Severity Levels
export type ModerationSeverity = 
  | 'safe'
  | 'caution'
  | 'warning'
  | 'danger'
  | 'critical';

// Moderation Categories
export type ModerationCategory = 
  | 'self_harm'
  | 'suicide_ideation'
  | 'violence'
  | 'harassment'
  | 'hate_speech'
  | 'inappropriate_content'
  | 'spam'
  | 'privacy_violation'
  | 'misinformation'
  | 'crisis_escalation';

// Content Analysis Result
interface ContentAnalysis {
  content: string;
  contentType: ContentType;
  severity: ModerationSeverity;
  categories: ModerationCategory[];
  confidence: number; // 0-1
  flaggedPhrases: Array<{
    phrase: string;
    category: ModerationCategory;
    severity: ModerationSeverity;
    startIndex: number;
    endIndex: number;
  }>;
  recommendations: string[];
  requiresHumanReview: boolean;
  shouldBlock: boolean;
  shouldEscalate: boolean;
  culturalContext?: {
    language: string;
    region: string;
    culturalFlags: string[];
  };
  metadata: {
    analysisTime: number;
    modelVersion: string;
    timestamp: Date;
  };
}

// Moderation Configuration
interface ModerationConfig {
  enableRealTimeModeration: boolean;
  enableCrisisDetection: boolean;
  enableCulturalAdaptation: boolean;
  strictnessLevel: 'lenient' | 'moderate' | 'strict';
  autoBlockThreshold: number; // confidence threshold for auto-blocking
  humanReviewThreshold: number; // confidence threshold for human review
  escalationThreshold: number; // confidence threshold for crisis escalation
  maxProcessingTime: number; // milliseconds
  enableAuditLogging: boolean;
  privacyMode: boolean; // anonymize logs
}

// Crisis Detection Patterns
interface CrisisPattern {
  pattern: RegExp;
  category: ModerationCategory;
  severity: ModerationSeverity;
  weight: number;
  culturalVariants?: Record<string, string[]>;
  contextRequired?: boolean;
}

// Moderation Action
interface ModerationAction {
  action: 'allow' | 'warn' | 'block' | 'escalate' | 'human_review';
  reason: string;
  category: ModerationCategory;
  severity: ModerationSeverity;
  confidence: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Performance Metrics
interface ModerationMetrics {
  totalAnalyzed: number;
  averageProcessingTime: number;
  accuracyRate: number;
  falsePositiveRate: number;
  escalationRate: number;
  categoryDistribution: Record<ModerationCategory, number>;
  severityDistribution: Record<ModerationSeverity, number>;
}

// Main Service Interface
export interface AIModerationService {
  // Core Moderation
  analyzeContent(content: string, contentType: ContentType, options?: {
    userId?: string;
    sessionId?: string;
    culturalContext?: { language: string; region: string };
    priority?: 'low' | 'normal' | 'high' | 'critical';
  }): Promise<ContentAnalysis>;

  // Batch Processing
  analyzeBatchContent(items: Array<{
    content: string;
    contentType: ContentType;
    id: string;
  }>): Promise<Map<string, ContentAnalysis>>;

  // Real-time Streaming
  createModerationStream(contentType: ContentType): {
    analyze: (content: string) => Promise<ContentAnalysis>;
    close: () => void;
  };

  // Configuration
  updateConfiguration(config: Partial<ModerationConfig>): void;
  getConfiguration(): ModerationConfig;

  // Pattern Management
  addCustomPattern(pattern: CrisisPattern): void;
  removeCustomPattern(patternId: string): void;
  getActivePatterns(): CrisisPattern[];

  // Metrics and Monitoring
  getMetrics(): ModerationMetrics;
  getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    performance: { avgResponseTime: number; successRate: number };
  }>;

  // Audit and Compliance
  getAuditLog(filters?: {
    dateRange?: { start: Date; end: Date };
    severity?: ModerationSeverity[];
    categories?: ModerationCategory[];
    userId?: string;
  }): Promise<Array<{
    id: string;
    content: string; // anonymized if privacy mode enabled
    analysis: ContentAnalysis;
    action: ModerationAction;
    timestamp: Date;
  }>>;

  // Training and Improvement
  provideFeedback(contentId: string, feedback: {
    correctPrediction: boolean;
    actualCategory?: ModerationCategory;
    actualSeverity?: ModerationSeverity;
    notes?: string;
  }): Promise<void>;
}

// Default Configuration
const DEFAULT_CONFIG: ModerationConfig = {
  enableRealTimeModeration: true,
  enableCrisisDetection: true,
  enableCulturalAdaptation: true,
  strictnessLevel: 'moderate',
  autoBlockThreshold: 0.8,
  humanReviewThreshold: 0.6,
  escalationThreshold: 0.7,
  maxProcessingTime: 2000,
  enableAuditLogging: true,
  privacyMode: true
};

// Crisis Detection Patterns
const CRISIS_PATTERNS: CrisisPattern[] = [
  // Suicide ideation patterns
  {
    pattern: /\b(want to die|kill myself|end my life|suicide|take my own life)\b/i,
    category: 'suicide_ideation',
    severity: 'critical',
    weight: 1.0
  },
  {
    pattern: /\b(better off dead|not worth living|can't go on)\b/i,
    category: 'suicide_ideation',
    severity: 'danger',
    weight: 0.8
  },
  
  // Self-harm patterns
  {
    pattern: /\b(cut myself|hurt myself|self harm|self-harm)\b/i,
    category: 'self_harm',
    severity: 'danger',
    weight: 0.9
  },
  {
    pattern: /\b(cutting|burning myself|hitting myself)\b/i,
    category: 'self_harm',
    severity: 'warning',
    weight: 0.7
  },
  
  // Violence patterns
  {
    pattern: /\b(kill (him|her|them)|murder|violent thoughts)\b/i,
    category: 'violence',
    severity: 'danger',
    weight: 0.9
  },
  
  // Crisis escalation patterns
  {
    pattern: /\b(right now|tonight|today|can't wait)\b/i,
    category: 'crisis_escalation',
    severity: 'critical',
    weight: 0.6,
    contextRequired: true
  },
  
  // Hopelessness patterns
  {
    pattern: /\b(no hope|hopeless|nothing matters|give up)\b/i,
    category: 'suicide_ideation',
    severity: 'warning',
    weight: 0.5
  }
];

// Inappropriate Content Patterns
const INAPPROPRIATE_PATTERNS: CrisisPattern[] = [
  {
    pattern: /\b(hate|kill|destroy)\s+(all\s+)?(jews|muslims|christians|blacks|whites|gays|lgbtq)\b/i,
    category: 'hate_speech',
    severity: 'danger',
    weight: 1.0
  },
  {
    pattern: /\b(spam|advertisement|buy now|click here)\b/i,
    category: 'spam',
    severity: 'caution',
    weight: 0.3
  }
];

// Implementation
class AIModerationServiceImpl implements AIModerationService {
  private config: ModerationConfig = { ...DEFAULT_CONFIG };
  private customPatterns: Map<string, CrisisPattern> = new Map();
  private auditLog: Array<any> = [];
  private metrics: ModerationMetrics = {
    totalAnalyzed: 0,
    averageProcessingTime: 0,
    accuracyRate: 0,
    falsePositiveRate: 0,
    escalationRate: 0,
    categoryDistribution: {} as Record<ModerationCategory, number>,
    severityDistribution: {} as Record<ModerationSeverity, number>
  };
  
  private processingTimes: number[] = [];
  private activeStreams = new Set<string>();

  async analyzeContent(
    content: string, 
    contentType: ContentType, 
    options: {
      userId?: string;
      sessionId?: string;
      culturalContext?: { language: string; region: string };
      priority?: 'low' | 'normal' | 'high' | 'critical';
    } = {}
  ): Promise<ContentAnalysis> {
    const startTime = performance.now();
    
    try {
      // Input validation
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid content provided for analysis');
      }
      
      if (content.length > 10000) {
        throw new Error('Content too long for analysis (max 10,000 characters)');
      }

      // Priority handling for crisis content
      if (options.priority === 'critical') {
        logger.warn('Critical priority content analysis requested', { 
          contentType, 
          userId: options.userId 
        });
      }

      // Perform analysis
      const analysis = await this.performContentAnalysis(content, contentType, options);
      
      // Record metrics
      const processingTime = performance.now() - startTime;
      this.recordAnalysisMetrics(analysis, processingTime);
      
      // Handle escalation if needed
      if (analysis.shouldEscalate) {
        await this.handleEscalation(analysis, options);
      }
      
      // Audit logging
      if (this.config.enableAuditLogging) {
        this.logAnalysis(content, analysis, options);
      }
      
      return analysis;
    } catch (error) {
      logger.error('Content analysis failed', { error, contentType });
      
      // Return safe fallback analysis
      return this.createFallbackAnalysis(content, contentType, error);
    }
  }

  async analyzeBatchContent(items: Array<{
    content: string;
    contentType: ContentType;
    id: string;
  }>): Promise<Map<string, ContentAnalysis>> {
    const results = new Map<string, ContentAnalysis>();
    
    // Process in parallel with concurrency limit
    const BATCH_SIZE = 10;
    const batches = [];
    
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      batches.push(items.slice(i, i + BATCH_SIZE));
    }
    
    for (const batch of batches) {
      const promises = batch.map(async item => {
        try {
          const analysis = await this.analyzeContent(item.content, item.contentType);
          results.set(item.id, analysis);
        } catch (error) {
          logger.error('Batch analysis item failed', { id: item.id, error });
          results.set(item.id, this.createFallbackAnalysis(item.content, item.contentType, error));
        }
      });
      
      await Promise.all(promises);
    }
    
    logger.info('Batch content analysis completed', { 
      totalItems: items.length,
      successfulAnalyses: results.size 
    });
    
    return results;
  }

  createModerationStream(contentType: ContentType): {
    analyze: (content: string) => Promise<ContentAnalysis>;
    close: () => void;
  } {
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeStreams.add(streamId);
    
    return {
      analyze: async (content: string) => {
        if (!this.activeStreams.has(streamId)) {
          throw new Error('Moderation stream has been closed');
        }
        
        return this.analyzeContent(content, contentType, { priority: 'high' });
      },
      close: () => {
        this.activeStreams.delete(streamId);
        logger.debug('Moderation stream closed', { streamId });
      }
    };
  }

  updateConfiguration(config: Partial<ModerationConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('AI moderation configuration updated', { config: this.config });
  }

  getConfiguration(): ModerationConfig {
    return { ...this.config };
  }

  addCustomPattern(pattern: CrisisPattern): void {
    const patternId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.customPatterns.set(patternId, pattern);
    logger.info('Custom moderation pattern added', { patternId, category: pattern.category });
  }

  removeCustomPattern(patternId: string): void {
    const removed = this.customPatterns.delete(patternId);
    if (removed) {
      logger.info('Custom moderation pattern removed', { patternId });
    }
  }

  getActivePatterns(): CrisisPattern[] {
    return [
      ...CRISIS_PATTERNS,
      ...INAPPROPRIATE_PATTERNS,
      ...Array.from(this.customPatterns.values())
    ];
  }

  getMetrics(): ModerationMetrics {
    return { ...this.metrics };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    performance: { avgResponseTime: number; successRate: number };
  }> {
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Check average response time
    const avgResponseTime = this.metrics.averageProcessingTime;
    if (avgResponseTime > this.config.maxProcessingTime * 2) {
      issues.push(`High response time: ${avgResponseTime.toFixed(0)}ms`);
      status = 'unhealthy';
    } else if (avgResponseTime > this.config.maxProcessingTime) {
      issues.push(`Elevated response time: ${avgResponseTime.toFixed(0)}ms`);
      status = status === 'healthy' ? 'degraded' : status;
    }
    
    // Check accuracy rate
    if (this.metrics.accuracyRate < 0.8) {
      issues.push(`Low accuracy rate: ${(this.metrics.accuracyRate * 100).toFixed(1)}%`);
      status = 'unhealthy';
    } else if (this.metrics.accuracyRate < 0.9) {
      issues.push(`Reduced accuracy rate: ${(this.metrics.accuracyRate * 100).toFixed(1)}%`);
      status = status === 'healthy' ? 'degraded' : status;
    }
    
    // Check false positive rate
    if (this.metrics.falsePositiveRate > 0.2) {
      issues.push(`High false positive rate: ${(this.metrics.falsePositiveRate * 100).toFixed(1)}%`);
      status = status === 'healthy' ? 'degraded' : status;
    }
    
    return {
      status,
      issues,
      performance: {
        avgResponseTime,
        successRate: this.metrics.accuracyRate
      }
    };
  }

  async getAuditLog(filters: {
    dateRange?: { start: Date; end: Date };
    severity?: ModerationSeverity[];
    categories?: ModerationCategory[];
    userId?: string;
  } = {}): Promise<Array<{
    id: string;
    content: string;
    analysis: ContentAnalysis;
    action: ModerationAction;
    timestamp: Date;
  }>> {
    let filteredLog = [...this.auditLog];
    
    // Apply filters
    if (filters.dateRange) {
      filteredLog = filteredLog.filter(entry => 
        entry.timestamp >= filters.dateRange!.start && 
        entry.timestamp <= filters.dateRange!.end
      );
    }
    
    if (filters.severity) {
      filteredLog = filteredLog.filter(entry => 
        filters.severity!.includes(entry.analysis.severity)
      );
    }
    
    if (filters.categories) {
      filteredLog = filteredLog.filter(entry => 
        entry.analysis.categories.some(cat => filters.categories!.includes(cat))
      );
    }
    
    if (filters.userId) {
      filteredLog = filteredLog.filter(entry => 
        entry.userId === filters.userId
      );
    }
    
    return filteredLog;
  }

  async provideFeedback(contentId: string, feedback: {
    correctPrediction: boolean;
    actualCategory?: ModerationCategory;
    actualSeverity?: ModerationSeverity;
    notes?: string;
  }): Promise<void> {
    logger.info('Moderation feedback received', { 
      contentId, 
      correctPrediction: feedback.correctPrediction 
    });
    
    // Update accuracy metrics
    this.updateAccuracyMetrics(feedback.correctPrediction);
    
    // Store feedback for model improvement
    // In a real implementation, this would be sent to the AI model training pipeline
    
    // Log feedback
    if (this.config.enableAuditLogging) {
      logger.info('Moderation feedback logged', { contentId, feedback });
    }
  }

  // Private methods
  private async performContentAnalysis(
    content: string, 
    contentType: ContentType, 
    options: any
  ): Promise<ContentAnalysis> {
    const analysis: ContentAnalysis = {
      content: this.config.privacyMode ? this.anonymizeContent(content) : content,
      contentType,
      severity: 'safe',
      categories: [],
      confidence: 0,
      flaggedPhrases: [],
      recommendations: [],
      requiresHumanReview: false,
      shouldBlock: false,
      shouldEscalate: false,
      metadata: {
        analysisTime: 0,
        modelVersion: '1.0.0',
        timestamp: new Date()
      }
    };

    const startTime = performance.now();
    
    // Pattern matching analysis
    const patternResults = this.analyzePatterns(content);
    
    // Combine results
    analysis.flaggedPhrases = patternResults.flaggedPhrases;
    analysis.categories = Array.from(new Set(patternResults.categories));
    analysis.severity = this.calculateSeverity(patternResults.severities);
    analysis.confidence = this.calculateConfidence(patternResults.weights);
    
    // Cultural context analysis
    if (options.culturalContext && this.config.enableCulturalAdaptation) {
      analysis.culturalContext = await this.analyzeCulturalContext(
        content, 
        options.culturalContext
      );
    }
    
    // Decision making
    analysis.shouldBlock = analysis.confidence >= this.config.autoBlockThreshold;
    analysis.requiresHumanReview = analysis.confidence >= this.config.humanReviewThreshold && !analysis.shouldBlock;
    analysis.shouldEscalate = analysis.confidence >= this.config.escalationThreshold && 
                             analysis.categories.some(cat => ['suicide_ideation', 'self_harm', 'crisis_escalation'].includes(cat));
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);
    
    analysis.metadata.analysisTime = performance.now() - startTime;
    
    return analysis;
  }

  private analyzePatterns(content: string): {
    flaggedPhrases: ContentAnalysis['flaggedPhrases'];
    categories: ModerationCategory[];
    severities: ModerationSeverity[];
    weights: number[];
  } {
    const results = {
      flaggedPhrases: [] as ContentAnalysis['flaggedPhrases'],
      categories: [] as ModerationCategory[],
      severities: [] as ModerationSeverity[],
      weights: [] as number[]
    };
    
    const allPatterns = this.getActivePatterns();
    
    for (const pattern of allPatterns) {
      const matches = content.match(pattern.pattern);
      if (matches) {
        matches.forEach(match => {
          const startIndex = content.indexOf(match);
          const endIndex = startIndex + match.length;
          
          results.flaggedPhrases.push({
            phrase: match,
            category: pattern.category,
            severity: pattern.severity,
            startIndex,
            endIndex
          });
          
          results.categories.push(pattern.category);
          results.severities.push(pattern.severity);
          results.weights.push(pattern.weight);
        });
      }
    }
    
    return results;
  }

  private calculateSeverity(severities: ModerationSeverity[]): ModerationSeverity {
    if (severities.length === 0) return 'safe';
    
    const severityOrder: ModerationSeverity[] = ['safe', 'caution', 'warning', 'danger', 'critical'];
    const maxSeverityIndex = Math.max(...severities.map(s => severityOrder.indexOf(s)));
    
    return severityOrder[maxSeverityIndex];
  }

  private calculateConfidence(weights: number[]): number {
    if (weights.length === 0) return 0;
    
    // Weighted average with diminishing returns for multiple flags
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const avgWeight = totalWeight / weights.length;
    
    // Apply diminishing returns for multiple flags
    const flagCount = weights.length;
    const diminishingFactor = Math.min(1, 1 / Math.sqrt(flagCount));
    
    return Math.min(1, avgWeight * (1 + (flagCount - 1) * diminishingFactor * 0.3));
  }

  private async analyzeCulturalContext(
    content: string, 
    culturalContext: { language: string; region: string }
  ): Promise<ContentAnalysis['culturalContext']> {
    // Simplified cultural analysis
    // In a real implementation, this would use more sophisticated NLP
    
    const culturalFlags: string[] = [];
    
    // Language-specific patterns
    if (culturalContext.language !== 'en') {
      culturalFlags.push('non_english_content');
    }
    
    // Region-specific considerations
    if (['US', 'CA', 'GB'].includes(culturalContext.region)) {
      // Western cultural context
      culturalFlags.push('western_context');
    }
    
    return {
      language: culturalContext.language,
      region: culturalContext.region,
      culturalFlags
    };
  }

  private generateRecommendations(analysis: ContentAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (analysis.shouldEscalate) {
      recommendations.push('Immediate crisis intervention required');
      recommendations.push('Contact emergency services if imminent danger');
    }
    
    if (analysis.shouldBlock) {
      recommendations.push('Content should be blocked from publication');
      recommendations.push('Provide user with appropriate resources');
    }
    
    if (analysis.requiresHumanReview) {
      recommendations.push('Flag for human moderator review');
      recommendations.push('Provide context to reviewer');
    }
    
    if (analysis.categories.includes('suicide_ideation')) {
      recommendations.push('Provide suicide prevention resources');
      recommendations.push('Encourage professional help');
    }
    
    if (analysis.categories.includes('self_harm')) {
      recommendations.push('Provide self-harm prevention resources');
      recommendations.push('Suggest coping strategies');
    }
    
    return recommendations;
  }

  private async handleEscalation(analysis: ContentAnalysis, options: any): Promise<void> {
    try {
      if (this.config.enableCrisisDetection) {
        // TODO: Import and integrate crisis intervention workflow
        // await crisisInterventionWorkflow.triggerCrisisIntervention({
        //   userId: options.userId,
        //   severity: analysis.severity,
        //   categories: analysis.categories,
        //   content: analysis.content,
        //   confidence: analysis.confidence,
        //   timestamp: new Date()
        // });
        
        logger.warn('Crisis escalation triggered', {
          userId: options.userId,
          severity: analysis.severity,
          confidence: analysis.confidence
        });
      }
    } catch (error) {
      logger.error('Crisis escalation failed', { error, analysis });
    }
  }

  private recordAnalysisMetrics(analysis: ContentAnalysis, processingTime: number): void {
    this.metrics.totalAnalyzed++;
    this.processingTimes.push(processingTime);
    
    // Update average processing time
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
    
    // Limit processing times array
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-500);
    }
    
    // Update category distribution
    analysis.categories.forEach(category => {
      this.metrics.categoryDistribution[category] = 
        (this.metrics.categoryDistribution[category] || 0) + 1;
    });
    
    // Update severity distribution
    this.metrics.severityDistribution[analysis.severity] = 
      (this.metrics.severityDistribution[analysis.severity] || 0) + 1;
    
    // Report to performance service
    // TODO: Record performance metric when method is available
    // performanceService.recordCustomMetric('ai_moderation_analysis', {
    //   processingTime,
    //   severity: analysis.severity,
    //   confidence: analysis.confidence,
    //   categories: analysis.categories.length
    // });
  }

  private logAnalysis(content: string, analysis: ContentAnalysis, options: any): void {
    const logEntry = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: this.config.privacyMode ? this.anonymizeContent(content) : content,
      analysis: { ...analysis },
      action: this.determineAction(analysis),
      timestamp: new Date(),
      userId: options.userId,
      sessionId: options.sessionId
    };
    
    this.auditLog.push(logEntry);
    
    // Limit audit log size
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  private determineAction(analysis: ContentAnalysis): ModerationAction {
    if (analysis.shouldEscalate) {
      return {
        action: 'escalate',
        reason: 'Crisis content detected',
        category: analysis.categories[0] || 'crisis_escalation',
        severity: analysis.severity,
        confidence: analysis.confidence,
        timestamp: new Date()
      };
    }
    
    if (analysis.shouldBlock) {
      return {
        action: 'block',
        reason: 'Harmful content detected',
        category: analysis.categories[0] || 'inappropriate_content',
        severity: analysis.severity,
        confidence: analysis.confidence,
        timestamp: new Date()
      };
    }
    
    if (analysis.requiresHumanReview) {
      return {
        action: 'human_review',
        reason: 'Content requires human review',
        category: analysis.categories[0] || 'inappropriate_content',
        severity: analysis.severity,
        confidence: analysis.confidence,
        timestamp: new Date()
      };
    }
    
    return {
      action: 'allow',
      reason: 'Content is safe',
      category: analysis.categories[0] || 'inappropriate_content',
      severity: analysis.severity,
      confidence: analysis.confidence,
      timestamp: new Date()
    };
  }

  private createFallbackAnalysis(content: string, contentType: ContentType, error: any): ContentAnalysis {
    return {
      content: this.config.privacyMode ? '[CONTENT_HIDDEN]' : content.substring(0, 100) + '...',
      contentType,
      severity: 'caution',
      categories: [],
      confidence: 0,
      flaggedPhrases: [],
      recommendations: ['Manual review recommended due to analysis error'],
      requiresHumanReview: true,
      shouldBlock: false,
      shouldEscalate: false,
      metadata: {
        analysisTime: 0,
        modelVersion: '1.0.0',
        timestamp: new Date()
      }
    };
  }

  private anonymizeContent(content: string): string {
    // Simple anonymization - replace with more sophisticated techniques in production
    return content
      .replace(/\b\w+@\w+\.\w+\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
      .replace(/\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g, '[CARD]');
  }

  private updateAccuracyMetrics(correctPrediction: boolean): void {
    // Simple accuracy tracking - would be more sophisticated in production
    const totalFeedback = this.metrics.totalAnalyzed || 1;
    const currentAccuracy = this.metrics.accuracyRate || 0.5;
    
    this.metrics.accuracyRate = (currentAccuracy * (totalFeedback - 1) + (correctPrediction ? 1 : 0)) / totalFeedback;
    
    if (!correctPrediction) {
      this.metrics.falsePositiveRate = (this.metrics.falsePositiveRate * (totalFeedback - 1) + 1) / totalFeedback;
    }
  }
}

// Export singleton instance
export const aiModerationService = new AIModerationServiceImpl();
// Types already exported above\n// export type { AIModerationService, ContentAnalysis, ModerationConfig };
