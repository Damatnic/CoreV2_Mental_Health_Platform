/**
 * Optimized AI Service Manager
 *
 * Provides lazy-loaded AI services with performance optimization,
 * fallback mechanisms, and comprehensive error handling.
 */

import { enhancedCrisisKeywordDetectionService } from './enhancedCrisisKeywordDetectionService';
import { crisisEscalationWorkflowService } from './crisisEscalationWorkflowService';
import { notificationService } from './notificationService';

export interface AIServiceConfig {
  enableTensorFlow: boolean;
  enableNLP: boolean;
  enableSentimentAnalysis: boolean;
  fallbackToBasic: boolean;
  cacheResults: boolean;
  maxCacheSize: number;
  cacheExpiryMs: number;
}

export interface AIAnalysisResult {
  crisisLevel: number; // 0-10 scale
  confidence: number; // 0-1 scale
  riskFactors: string[];
  recommendations: string[];
  immediateAction: boolean;
  escalationRequired: boolean;
  sentiment?: SentimentAnalysis;
  keywords?: string[];
  contextualFactors?: string[];
  timestamp: Date;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1 scale
  magnitude: number; // 0-1 scale
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface CachedResult {
  result: AIAnalysisResult;
  timestamp: Date;
  expiresAt: Date;
}

export interface AIServiceMetrics {
  totalAnalyses: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  lastError?: string;
  uptime: number;
}

class OptimizedAIService {
  private config: AIServiceConfig = {
    enableTensorFlow: false, // Disabled by default due to size
    enableNLP: false, // Disabled by default due to missing deps
    enableSentimentAnalysis: false, // Disabled by default
    fallbackToBasic: true,
    cacheResults: true,
    maxCacheSize: 1000,
    cacheExpiryMs: 5 * 60 * 1000 // 5 minutes
  };

  private cache = new Map<string, CachedResult>();
  private tensorflowPromise: Promise<any> | null = null;
  private nlpPromise: Promise<any> | null = null;
  private metrics: AIServiceMetrics = {
    totalAnalyses: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    uptime: Date.now()
  };
  private responseTimes: number[] = [];
  private errorCount = 0;

  constructor(config?: Partial<AIServiceConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.startCacheCleanup();
  }

  /**
   * Analyze text for crisis indicators
   */
  public async analyzeText(
    text: string,
    userContext?: any
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(text, userContext);

    try {
      // Check cache first
      if (this.config.cacheResults) {
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
          this.updateMetrics(Date.now() - startTime, true);
          return cached.result;
        }
      }

      // Perform analysis
      const result = await this.performAnalysis(text, userContext);

      // Cache result
      if (this.config.cacheResults) {
        this.cacheResult(cacheKey, result);
      }

      this.updateMetrics(Date.now() - startTime, false);
      return result;

    } catch (error) {
      this.errorCount++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error('AI analysis failed:', error);
      
      // Return basic fallback analysis
      return this.createFallbackAnalysis(text);
    }
  }

  /**
   * Perform the actual analysis
   */
  private async performAnalysis(
    text: string,
    userContext?: any
  ): Promise<AIAnalysisResult> {
    const results: Partial<AIAnalysisResult> = {
      timestamp: new Date()
    };

    // Use enhanced crisis keyword detection as primary method
    try {
      const crisisResult = await enhancedCrisisKeywordDetectionService
        .analyzeEnhancedCrisisKeywords(text);

      results.crisisLevel = this.mapCrisisLevel(crisisResult.crisisLevel);
      results.confidence = crisisResult.confidence;
      results.riskFactors = crisisResult.riskFactors || [];
      results.recommendations = crisisResult.recommendations || [];
      results.immediateAction = crisisResult.immediateAction || false;
      results.escalationRequired = crisisResult.escalationRequired || false;
      results.keywords = crisisResult.keywords || [];

    } catch (error) {
      console.warn('Enhanced crisis detection failed, using fallback:', error);
      results.crisisLevel = this.calculateBasicCrisisLevel(text);
      results.confidence = 0.5;
      results.riskFactors = this.detectBasicRiskFactors(text);
      results.immediateAction = results.crisisLevel >= 8;
      results.escalationRequired = results.crisisLevel >= 7;
    }

    // Add sentiment analysis if enabled
    if (this.config.enableSentimentAnalysis) {
      try {
        results.sentiment = await this.performSentimentAnalysis(text);
      } catch (error) {
        console.warn('Sentiment analysis failed:', error);
      }
    }

    // Add contextual factors
    results.contextualFactors = this.extractContextualFactors(text, userContext);

    // Ensure all required fields are present
    return {
      crisisLevel: results.crisisLevel || 0,
      confidence: results.confidence || 0,
      riskFactors: results.riskFactors || [],
      recommendations: results.recommendations || [],
      immediateAction: results.immediateAction || false,
      escalationRequired: results.escalationRequired || false,
      sentiment: results.sentiment,
      keywords: results.keywords,
      contextualFactors: results.contextualFactors,
      timestamp: results.timestamp!
    };
  }

  /**
   * Load TensorFlow.js lazily
   */
  private async loadTensorFlow(): Promise<any> {
    if (!this.config.enableTensorFlow) {
      return null;
    }

    if (!this.tensorflowPromise) {
      this.tensorflowPromise = this.attemptTensorFlowLoad();
    }

    return this.tensorflowPromise;
  }

  /**
   * Attempt to load TensorFlow
   */
  private async attemptTensorFlowLoad(): Promise<any> {
    try {
      // Note: TensorFlow.js is not installed to keep bundle size small
      // This would require: npm install @tensorflow/tfjs-core
      console.warn('TensorFlow.js not installed - using fallback methods');
      return null;
    } catch (error) {
      console.warn('Failed to load TensorFlow:', error);
      return null;
    }
  }

  /**
   * Load Natural NLP lazily
   */
  private async loadNaturalNLP(): Promise<any> {
    if (!this.config.enableNLP) {
      return null;
    }

    if (!this.nlpPromise) {
      this.nlpPromise = this.attemptNaturalLoad();
    }

    return this.nlpPromise;
  }

  /**
   * Attempt to load Natural NLP
   */
  private async attemptNaturalLoad(): Promise<any> {
    try {
      // Note: Natural library is not installed to keep dependencies minimal
      // This would require: npm install natural
      console.warn('Natural NLP library not installed - using fallback methods');
      return null;
    } catch (error) {
      console.warn('Failed to load Natural NLP:', error);
      return null;
    }
  }

  /**
   * Perform sentiment analysis
   */
  private async performSentimentAnalysis(text: string): Promise<SentimentAnalysis> {
    // Basic sentiment analysis fallback
    const positiveWords = ['good', 'happy', 'great', 'excellent', 'amazing', 'wonderful'];
    const negativeWords = ['bad', 'sad', 'terrible', 'awful', 'horrible', 'hate', 'kill', 'die', 'hurt'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    const score = total === 0 ? 0 : (positiveCount - negativeCount) / total;
    const magnitude = Math.abs(score);

    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (score > 0.1) label = 'positive';
    else if (score < -0.1) label = 'negative';

    return {
      score,
      magnitude,
      label,
      confidence: Math.min(magnitude + 0.1, 1.0)
    };
  }

  /**
   * Calculate basic crisis level using keyword matching
   */
  private calculateBasicCrisisLevel(text: string): number {
    const immediateWords = ['suicide', 'kill myself', 'end it all', 'not worth living'];
    const highWords = ['hurt myself', 'self harm', 'cutting', 'overdose'];
    const mediumWords = ['depressed', 'anxious', 'hopeless', 'overwhelmed'];
    
    const lowerText = text.toLowerCase();
    
    for (const word of immediateWords) {
      if (lowerText.includes(word)) return 9;
    }
    
    for (const word of highWords) {
      if (lowerText.includes(word)) return 7;
    }
    
    for (const word of mediumWords) {
      if (lowerText.includes(word)) return 5;
    }
    
    return 2;
  }

  /**
   * Detect basic risk factors
   */
  private detectBasicRiskFactors(text: string): string[] {
    const factors: string[] = [];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('suicide') || lowerText.includes('kill myself')) {
      factors.push('suicide-ideation');
    }
    if (lowerText.includes('hurt') || lowerText.includes('harm')) {
      factors.push('self-harm');
    }
    if (lowerText.includes('alone') || lowerText.includes('isolated')) {
      factors.push('isolation');
    }
    if (lowerText.includes('hopeless') || lowerText.includes('no point')) {
      factors.push('hopelessness');
    }

    return factors;
  }

  /**
   * Extract contextual factors
   */
  private extractContextualFactors(text: string, userContext?: any): string[] {
    const factors: string[] = [];

    // Time-based factors
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 6) {
      factors.push('late-night-activity');
    }

    // Text length factors
    if (text.length > 1000) {
      factors.push('lengthy-expression');
    } else if (text.length < 50) {
      factors.push('brief-expression');
    }

    // User context factors
    if (userContext?.previousCrisis) {
      factors.push('previous-crisis-history');
    }
    if (userContext?.recentActivity === 'low') {
      factors.push('decreased-activity');
    }

    return factors;
  }

  /**
   * Map crisis level to standard scale
   */
  private mapCrisisLevel(level: number | string): number {
    if (typeof level === 'string') {
      const levelMap: Record<string, number> = {
        'none': 0,
        'low': 2,
        'medium': 5,
        'high': 7,
        'critical': 9,
        'emergency': 10
      };
      return levelMap[level] || 0;
    }
    return Math.min(Math.max(level, 0), 10);
  }

  /**
   * Create fallback analysis
   */
  private createFallbackAnalysis(text: string): AIAnalysisResult {
    const crisisLevel = this.calculateBasicCrisisLevel(text);
    
    return {
      crisisLevel,
      confidence: 0.3,
      riskFactors: this.detectBasicRiskFactors(text),
      recommendations: ['Seek professional help if you are in crisis'],
      immediateAction: crisisLevel >= 8,
      escalationRequired: crisisLevel >= 7,
      timestamp: new Date()
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(text: string, userContext?: any): string {
    const contextStr = userContext ? JSON.stringify(userContext) : '';
    return `${text.substring(0, 100)}:${contextStr}`.replace(/[^a-zA-Z0-9:]/g, '');
  }

  /**
   * Get cached result
   */
  private getCachedResult(key: string): CachedResult | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Cache result
   */
  private cacheResult(key: string, result: AIAnalysisResult): void {
    if (this.cache.size >= this.config.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.config.cacheExpiryMs)
    });
  }

  /**
   * Update metrics
   */
  private updateMetrics(responseTime: number, cacheHit: boolean): void {
    this.metrics.totalAnalyses++;
    
    if (!cacheHit) {
      this.responseTimes.push(responseTime);
      if (this.responseTimes.length > 100) {
        this.responseTimes.shift();
      }
      
      this.metrics.averageResponseTime = 
        this.responseTimes.reduce((sum, time) => sum + time, 0) / 
        this.responseTimes.length;
    }

    const totalRequests = this.metrics.totalAnalyses;
    const cacheHits = totalRequests - this.responseTimes.length;
    this.metrics.cacheHitRate = cacheHits / totalRequests;
    this.metrics.errorRate = this.errorCount / totalRequests;
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [key, cached] of this.cache.entries()) {
        if (cached.expiresAt <= now) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  /**
   * Get service metrics
   */
  public getMetrics(): AIServiceMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const metrics = this.getMetrics();
    const status = metrics.errorRate > 0.1 ? 'unhealthy' : 
                  metrics.errorRate > 0.05 ? 'degraded' : 'healthy';

    return {
      status,
      details: {
        ...metrics,
        cacheSize: this.cache.size,
        config: this.config
      }
    };
  }
}

// Create and export service manager
export const aiServiceManager = new OptimizedAIService();

// Export convenience functions
export const analyzeTextForCrisis = (text: string, userContext?: any) => 
  aiServiceManager.analyzeText(text, userContext);

export const getAIServiceMetrics = () => aiServiceManager.getMetrics();

export const clearAICache = () => aiServiceManager.clearCache();
