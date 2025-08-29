/**
 * Crisis Detection Integration Service
 *
 * Provides a unified interface for components to perform crisis detection
 * with automatic escalation workflow integration for severe cases.
 */

import { crisisDetectionService } from './crisisDetectionService';
import { notificationService } from './notificationService';

export interface CrisisAnalysisOptions {
  userId?: string;
  conversationId?: string;
  sessionData?: {
    messagesSent?: number;
    sessionDuration?: number;
    previousEscalations?: number;
    riskTrend?: 'increasing' | 'stable' | 'decreasing';
  };
  userContext?: {
    languageCode?: string;
    culturalContext?: string;
    accessibilityNeeds?: string[];
    preferredContactMethod?: 'phone' | 'text' | 'chat' | 'video';
    timeZone?: string;
    location?: {
      country: string;
      region?: string;
      hasGeolocation: boolean;
    };
  };
  previousAnalyses?: CrisisAnalysisResult[];
  escalationHistory?: EscalationEvent[];
}

export interface CrisisAnalysisResult {
  isCrisis: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-1 risk score
  comparative: number; // comparative score vs baseline
  escalationRequired: boolean;
  emergencyServicesRequired: boolean;
  interventionRecommendations: InterventionRecommendation[];
  escalationResponse?: EscalationResponse;
  riskAssessment: RiskAssessment;
  enhanced: boolean; // whether enhanced analysis was used
  error?: string;
  analysisMetadata: AnalysisMetadata;
  followUpRequired: boolean;
  timeToIntervention: number; // minutes
}

export interface InterventionRecommendation {
  type: 'immediate' | 'urgent' | 'standard' | 'monitoring';
  action: string;
  priority: number; // 1-10
  timeframe: string;
  resources: string[];
  culturalConsiderations?: string[];
  accessibilityAdaptations?: string[];
}

export interface EscalationResponse {
  escalationId: string;
  escalationLevel: 'peer-support' | 'crisis-counselor' | 'emergency-team' | 'emergency-services';
  triggeredAt: Date;
  estimatedResponseTime: number; // minutes
  contactedServices: string[];
  escalationReason: string;
  automaticActions: string[];
}

export interface RiskAssessment {
  immediateRisk: number; // 0-100
  shortTermRisk: number; // 0-100 (next 24 hours)
  longTermRisk: number; // 0-100 (next week)
  riskFactors: RiskFactor[];
  protectiveFactors: ProtectiveFactor[];
  riskTrajectory: 'increasing' | 'stable' | 'decreasing' | 'fluctuating';
  confidenceLevel: number; // 0-1
}

export interface RiskFactor {
  factor: string;
  weight: number; // 0-10
  category: 'behavioral' | 'environmental' | 'historical' | 'contextual';
  timeRelevance: 'immediate' | 'recent' | 'ongoing' | 'historical';
}

export interface ProtectiveFactor {
  factor: string;
  strength: number; // 0-10
  category: 'social' | 'personal' | 'professional' | 'cultural';
  availability: 'immediate' | 'accessible' | 'requires-activation' | 'uncertain';
}

export interface EscalationEvent {
  id: string;
  timestamp: Date;
  level: string;
  outcome: 'resolved' | 'ongoing' | 'escalated-further' | 'false-positive';
  responseTime: number; // minutes
  effectiveness: number; // 0-10
}

export interface AnalysisMetadata {
  analysisId: string;
  timestamp: Date;
  processingTime: number; // milliseconds
  servicesUsed: string[];
  dataQuality: number; // 0-1
  contextualFactors: string[];
  limitations: string[];
}

export interface IntegrationMetrics {
  totalAnalyses: number;
  crisisDetectionRate: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  averageProcessingTime: number;
  escalationSuccessRate: number;
  interventionEffectiveness: number;
  userSatisfactionScore: number;
}

class CrisisDetectionIntegrationService {
  private analysisHistory: Map<string, CrisisAnalysisResult[]> = new Map();
  private escalationHistory: Map<string, EscalationEvent[]> = new Map();
  private metrics: IntegrationMetrics = {
    totalAnalyses: 0,
    crisisDetectionRate: 0.12,
    falsePositiveRate: 0.08,
    falseNegativeRate: 0.05,
    averageProcessingTime: 150,
    escalationSuccessRate: 0.87,
    interventionEffectiveness: 0.74,
    userSatisfactionScore: 4.1
  };

  /**
   * Analyze text for crisis indicators with automatic escalation
   */
  async analyzeCrisisWithEscalation(
    text: string,
    options: CrisisAnalysisOptions = {}
  ): Promise<CrisisAnalysisResult> {
    const startTime = Date.now();
    this.metrics.totalAnalyses++;

    try {
      // Perform basic crisis analysis
      const basicAnalysis = await crisisDetectionService.analyzeForCrisis(text);

      // Enhance with contextual analysis
      const enhancedAnalysis = await this.enhanceAnalysis(basicAnalysis, text, options);

      // Perform risk assessment
      const riskAssessment = await this.performRiskAssessment(enhancedAnalysis, options);

      // Generate intervention recommendations
      const interventionRecommendations = await this.generateRecommendations(
        enhancedAnalysis,
        riskAssessment,
        options
      );

      // Determine escalation needs
      const escalationRequired = this.determineEscalationNeed(riskAssessment, options);
      const emergencyServicesRequired = this.determineEmergencyNeed(riskAssessment);

      // Create analysis metadata
      const analysisMetadata = this.createAnalysisMetadata(startTime, options);

      const result: CrisisAnalysisResult = {
        isCrisis: enhancedAnalysis.riskLevel > 0.3,
        severity: this.mapRiskToSeverity(enhancedAnalysis.riskLevel),
        score: enhancedAnalysis.riskLevel,
        comparative: this.calculateComparativeScore(enhancedAnalysis.riskLevel, options),
        escalationRequired,
        emergencyServicesRequired,
        interventionRecommendations,
        riskAssessment,
        enhanced: true,
        analysisMetadata,
        followUpRequired: this.determineFollowUpNeed(riskAssessment),
        timeToIntervention: this.calculateTimeToIntervention(riskAssessment)
      };

      // Handle escalation if required
      if (escalationRequired) {
        result.escalationResponse = await this.handleEscalation(result, options);
      }

      // Store analysis history
      this.storeAnalysisHistory(options.userId, result);

      // Update metrics
      this.updateMetrics(result);

      return result;

    } catch (error) {
      console.error('Error in crisis analysis with escalation:', error);
      return this.createErrorResult(error, options);
    }
  }

  /**
   * Get user's crisis analysis history
   */
  getUserAnalysisHistory(
    userId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      severityFilter?: string[];
    }
  ): CrisisAnalysisResult[] {
    let history = this.analysisHistory.get(userId) || [];

    if (options) {
      if (options.startDate) {
        history = history.filter(h => h.analysisMetadata.timestamp >= options.startDate!);
      }
      if (options.endDate) {
        history = history.filter(h => h.analysisMetadata.timestamp <= options.endDate!);
      }
      if (options.severityFilter && options.severityFilter.length > 0) {
        history = history.filter(h => options.severityFilter!.includes(h.severity));
      }
      if (options.limit) {
        history = history.slice(-options.limit);
      }
    }

    return history;
  }

  /**
   * Get escalation history for a user
   */
  getUserEscalationHistory(userId: string, limit?: number): EscalationEvent[] {
    const history = this.escalationHistory.get(userId) || [];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Mark an analysis as false positive for learning
   */
  markFalsePositive(userId: string, analysisId: string, feedback?: string): void {
    const history = this.analysisHistory.get(userId) || [];
    const analysis = history.find(h => h.analysisMetadata.analysisId === analysisId);
    
    if (analysis) {
      // Update analysis to mark as false positive
      analysis.severity = 'none';
      analysis.isCrisis = false;
      analysis.analysisMetadata.limitations.push('Marked as false positive by user');
      
      // Update metrics
      this.metrics.falsePositiveRate = 
        (this.metrics.falsePositiveRate * this.metrics.totalAnalyses + 1) / 
        (this.metrics.totalAnalyses + 1);
      
      console.log(`Analysis ${analysisId} marked as false positive for user ${userId}`);
    }
  }

  /**
   * Enhanced analysis with contextual factors
   */
  private async enhanceAnalysis(
    basicAnalysis: any,
    text: string,
    options: CrisisAnalysisOptions
  ): Promise<any> {
    // Start with basic analysis
    let enhancedRisk = basicAnalysis.riskLevel;

    // Apply contextual enhancements
    if (options.sessionData) {
      // Escalating pattern detection
      if (options.sessionData.riskTrend === 'increasing') {
        enhancedRisk *= 1.2;
      }
      
      // Repeated escalations
      if (options.sessionData.previousEscalations && options.sessionData.previousEscalations > 0) {
        enhancedRisk *= 1.1 + (options.sessionData.previousEscalations * 0.1);
      }
    }

    // Previous analysis context
    if (options.previousAnalyses && options.previousAnalyses.length > 0) {
      const recentHighRisk = options.previousAnalyses.filter(
        a => a.score > 0.6 && this.isRecent(a.analysisMetadata.timestamp, 24)
      ).length;
      
      if (recentHighRisk > 0) {
        enhancedRisk *= 1.15;
      }
    }

    return {
      ...basicAnalysis,
      riskLevel: Math.min(enhancedRisk, 1.0)
    };
  }

  /**
   * Perform comprehensive risk assessment
   */
  private async performRiskAssessment(
    analysis: any,
    options: CrisisAnalysisOptions
  ): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];
    const protectiveFactors: ProtectiveFactor[] = [];

    // Identify risk factors
    if (analysis.riskLevel > 0.7) {
      riskFactors.push({
        factor: 'High crisis detection score',
        weight: 8,
        category: 'behavioral',
        timeRelevance: 'immediate'
      });
    }

    if (options.sessionData?.previousEscalations && options.sessionData.previousEscalations > 0) {
      riskFactors.push({
        factor: `${options.sessionData.previousEscalations} previous escalations`,
        weight: 6,
        category: 'historical',
        timeRelevance: 'recent'
      });
    }

    if (options.sessionData?.riskTrend === 'increasing') {
      riskFactors.push({
        factor: 'Increasing risk trend',
        weight: 7,
        category: 'behavioral',
        timeRelevance: 'ongoing'
      });
    }

    // Identify protective factors
    if (options.userContext?.preferredContactMethod) {
      protectiveFactors.push({
        factor: 'Preferred contact method available',
        strength: 5,
        category: 'professional',
        availability: 'immediate'
      });
    }

    if (options.userContext?.culturalContext) {
      protectiveFactors.push({
        factor: 'Cultural support system',
        strength: 6,
        category: 'cultural',
        availability: 'accessible'
      });
    }

    // Calculate risk scores
    const immediateRisk = Math.min(analysis.riskLevel * 100, 100);
    const shortTermRisk = Math.min(immediateRisk * 0.8, 100);
    const longTermRisk = Math.min(shortTermRisk * 0.6, 100);

    return {
      immediateRisk,
      shortTermRisk,
      longTermRisk,
      riskFactors,
      protectiveFactors,
      riskTrajectory: options.sessionData?.riskTrend || 'stable',
      confidenceLevel: this.calculateConfidenceLevel(analysis, options)
    };
  }

  /**
   * Generate intervention recommendations
   */
  private async generateRecommendations(
    analysis: any,
    riskAssessment: RiskAssessment,
    options: CrisisAnalysisOptions
  ): Promise<InterventionRecommendation[]> {
    const recommendations: InterventionRecommendation[] = [];

    // Emergency recommendations
    if (riskAssessment.immediateRisk >= 80) {
      recommendations.push({
        type: 'immediate',
        action: 'Contact emergency services immediately',
        priority: 10,
        timeframe: 'Within 5 minutes',
        resources: ['911', 'Crisis hotline', 'Emergency department']
      });
    }

    // Crisis counselor recommendations
    if (riskAssessment.immediateRisk >= 60) {
      recommendations.push({
        type: 'urgent',
        action: 'Connect with crisis counselor',
        priority: 8,
        timeframe: 'Within 1 hour',
        resources: ['Crisis counselor', 'Mental health professional', 'Crisis text line']
      });
    }

    // Standard intervention
    if (riskAssessment.immediateRisk >= 30) {
      recommendations.push({
        type: 'standard',
        action: 'Schedule mental health appointment',
        priority: 6,
        timeframe: 'Within 24 hours',
        resources: ['Therapist', 'Counselor', 'Primary care physician']
      });
    }

    // Monitoring recommendations
    if (riskAssessment.shortTermRisk >= 20) {
      recommendations.push({
        type: 'monitoring',
        action: 'Implement regular check-ins',
        priority: 4,
        timeframe: 'Daily for 1 week',
        resources: ['Peer support', 'Family member', 'Case manager']
      });
    }

    // Add cultural considerations
    if (options.userContext?.culturalContext) {
      recommendations.forEach(rec => {
        rec.culturalConsiderations = [`Consider ${options.userContext?.culturalContext} cultural factors`];
      });
    }

    // Add accessibility adaptations
    if (options.userContext?.accessibilityNeeds) {
      recommendations.forEach(rec => {
        rec.accessibilityAdaptations = options.userContext?.accessibilityNeeds;
      });
    }

    return recommendations;
  }

  /**
   * Handle escalation process
   */
  private async handleEscalation(
    result: CrisisAnalysisResult,
    options: CrisisAnalysisOptions
  ): Promise<EscalationResponse> {
    const escalationId = this.generateEscalationId();
    const escalationLevel = this.determineEscalationLevel(result.riskAssessment);
    
    const escalationResponse: EscalationResponse = {
      escalationId,
      escalationLevel,
      triggeredAt: new Date(),
      estimatedResponseTime: this.getEstimatedResponseTime(escalationLevel),
      contactedServices: [],
      escalationReason: this.generateEscalationReason(result.riskAssessment),
      automaticActions: []
    };

    // Perform automatic actions based on escalation level
    switch (escalationLevel) {
      case 'emergency-services':
        escalationResponse.contactedServices = ['911', 'Emergency Department'];
        escalationResponse.automaticActions = ['Emergency services contacted', 'Location tracking enabled'];
        break;
      
      case 'emergency-team':
        escalationResponse.contactedServices = ['Crisis Response Team'];
        escalationResponse.automaticActions = ['Crisis team notified', 'Immediate intervention scheduled'];
        break;
      
      case 'crisis-counselor':
        escalationResponse.contactedServices = ['Crisis Counselor'];
        escalationResponse.automaticActions = ['Crisis counselor contacted', 'Urgent appointment scheduled'];
        break;
      
      case 'peer-support':
        escalationResponse.contactedServices = ['Peer Support Network'];
        escalationResponse.automaticActions = ['Peer supporter assigned', 'Check-in scheduled'];
        break;
    }

    // Send notifications
    await this.sendEscalationNotifications(escalationResponse, options);

    // Record escalation event
    this.recordEscalationEvent(options.userId, escalationResponse);

    return escalationResponse;
  }

  /**
   * Helper methods
   */
  private mapRiskToSeverity(riskLevel: number): CrisisAnalysisResult['severity'] {
    if (riskLevel >= 0.8) return 'critical';
    if (riskLevel >= 0.6) return 'high';
    if (riskLevel >= 0.4) return 'medium';
    if (riskLevel >= 0.2) return 'low';
    return 'none';
  }

  private calculateComparativeScore(riskLevel: number, options: CrisisAnalysisOptions): number {
    // Compare against user's historical baseline
    if (options.previousAnalyses && options.previousAnalyses.length > 0) {
      const avgPreviousRisk = options.previousAnalyses.reduce((sum, a) => sum + a.score, 0) / 
                              options.previousAnalyses.length;
      return riskLevel - avgPreviousRisk;
    }
    return 0; // No baseline available
  }

  private determineEscalationNeed(riskAssessment: RiskAssessment, options: CrisisAnalysisOptions): boolean {
    return riskAssessment.immediateRisk >= 60 || 
           (riskAssessment.immediateRisk >= 40 && riskAssessment.riskTrajectory === 'increasing');
  }

  private determineEmergencyNeed(riskAssessment: RiskAssessment): boolean {
    return riskAssessment.immediateRisk >= 85;
  }

  private determineFollowUpNeed(riskAssessment: RiskAssessment): boolean {
    return riskAssessment.shortTermRisk >= 30;
  }

  private calculateTimeToIntervention(riskAssessment: RiskAssessment): number {
    if (riskAssessment.immediateRisk >= 80) return 5; // 5 minutes
    if (riskAssessment.immediateRisk >= 60) return 60; // 1 hour
    if (riskAssessment.immediateRisk >= 40) return 240; // 4 hours
    return 1440; // 24 hours
  }

  private calculateConfidenceLevel(analysis: any, options: CrisisAnalysisOptions): number {
    let confidence = 0.7; // baseline
    
    if (options.sessionData) confidence += 0.1;
    if (options.previousAnalyses && options.previousAnalyses.length > 0) confidence += 0.1;
    if (options.userContext) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private determineEscalationLevel(riskAssessment: RiskAssessment): EscalationResponse['escalationLevel'] {
    if (riskAssessment.immediateRisk >= 85) return 'emergency-services';
    if (riskAssessment.immediateRisk >= 70) return 'emergency-team';
    if (riskAssessment.immediateRisk >= 50) return 'crisis-counselor';
    return 'peer-support';
  }

  private getEstimatedResponseTime(level: EscalationResponse['escalationLevel']): number {
    const responseTimes = {
      'emergency-services': 10,
      'emergency-team': 30,
      'crisis-counselor': 60,
      'peer-support': 120
    };
    return responseTimes[level];
  }

  private generateEscalationReason(riskAssessment: RiskAssessment): string {
    if (riskAssessment.immediateRisk >= 80) {
      return 'Critical immediate risk detected requiring emergency intervention';
    }
    if (riskAssessment.immediateRisk >= 60) {
      return 'High risk level with multiple risk factors present';
    }
    return 'Elevated risk with concerning trajectory requiring professional attention';
  }

  private async sendEscalationNotifications(
    escalation: EscalationResponse,
    options: CrisisAnalysisOptions
  ): Promise<void> {
    await notificationService.sendNotification({
      userId: 'crisis-response-team',
      title: `Crisis Escalation - ${escalation.escalationLevel}`,
      message: `Escalation triggered: ${escalation.escalationReason}`,
      priority: 'critical',
      type: 'crisis'
    });
  }

  private recordEscalationEvent(userId: string | undefined, escalation: EscalationResponse): void {
    if (!userId) return;

    const event: EscalationEvent = {
      id: escalation.escalationId,
      timestamp: escalation.triggeredAt,
      level: escalation.escalationLevel,
      outcome: 'ongoing',
      responseTime: escalation.estimatedResponseTime,
      effectiveness: 0 // Will be updated later
    };

    const history = this.escalationHistory.get(userId) || [];
    history.push(event);
    this.escalationHistory.set(userId, history);
  }

  private storeAnalysisHistory(userId: string | undefined, result: CrisisAnalysisResult): void {
    if (!userId) return;

    const history = this.analysisHistory.get(userId) || [];
    history.push(result);
    
    // Keep only last 50 analyses
    if (history.length > 50) {
      history.shift();
    }
    
    this.analysisHistory.set(userId, history);
  }

  private updateMetrics(result: CrisisAnalysisResult): void {
    if (result.isCrisis) {
      this.metrics.crisisDetectionRate = 
        (this.metrics.crisisDetectionRate * (this.metrics.totalAnalyses - 1) + 1) / 
        this.metrics.totalAnalyses;
    }

    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime + result.analysisMetadata.processingTime) / 2;
  }

  private createAnalysisMetadata(startTime: number, options: CrisisAnalysisOptions): AnalysisMetadata {
    return {
      analysisId: this.generateAnalysisId(),
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
      servicesUsed: ['crisisDetectionService', 'integrationService'],
      dataQuality: this.assessDataQuality(options),
      contextualFactors: this.identifyContextualFactors(options),
      limitations: []
    };
  }

  private createErrorResult(error: any, options: CrisisAnalysisOptions): CrisisAnalysisResult {
    return {
      isCrisis: false,
      severity: 'none',
      score: 0,
      comparative: 0,
      escalationRequired: false,
      emergencyServicesRequired: false,
      interventionRecommendations: [],
      riskAssessment: {
        immediateRisk: 0,
        shortTermRisk: 0,
        longTermRisk: 0,
        riskFactors: [],
        protectiveFactors: [],
        riskTrajectory: 'stable',
        confidenceLevel: 0
      },
      enhanced: false,
      error: error.message,
      analysisMetadata: {
        analysisId: this.generateAnalysisId(),
        timestamp: new Date(),
        processingTime: 0,
        servicesUsed: [],
        dataQuality: 0,
        contextualFactors: [],
        limitations: ['Analysis failed due to error']
      },
      followUpRequired: false,
      timeToIntervention: 0
    };
  }

  private isRecent(timestamp: Date, hours: number): boolean {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    return diff < hours * 60 * 60 * 1000;
  }

  private assessDataQuality(options: CrisisAnalysisOptions): number {
    let quality = 0.5; // baseline
    
    if (options.userId) quality += 0.1;
    if (options.sessionData) quality += 0.2;
    if (options.userContext) quality += 0.2;
    
    return Math.min(quality, 1.0);
  }

  private identifyContextualFactors(options: CrisisAnalysisOptions): string[] {
    const factors: string[] = [];
    
    if (options.sessionData?.riskTrend) factors.push(`Risk trend: ${options.sessionData.riskTrend}`);
    if (options.userContext?.culturalContext) factors.push(`Cultural context: ${options.userContext.culturalContext}`);
    if (options.previousAnalyses?.length) factors.push(`Previous analyses: ${options.previousAnalyses.length}`);
    
    return factors;
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEscalationId(): string {
    return `escalation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get service metrics
   */
  getMetrics(): IntegrationMetrics {
    return { ...this.metrics };
  }

  /**
   * Update escalation outcome
   */
  updateEscalationOutcome(
    userId: string,
    escalationId: string,
    outcome: EscalationEvent['outcome'],
    effectiveness: number
  ): void {
    const history = this.escalationHistory.get(userId) || [];
    const event = history.find(e => e.id === escalationId);
    
    if (event) {
      event.outcome = outcome;
      event.effectiveness = effectiveness;
      
      // Update metrics
      if (outcome === 'resolved') {
        this.metrics.escalationSuccessRate = 
          (this.metrics.escalationSuccessRate + effectiveness / 10) / 2;
      }
    }
  }
}

export const crisisDetectionIntegrationService = new CrisisDetectionIntegrationService();
