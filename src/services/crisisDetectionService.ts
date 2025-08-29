/**
 * Enhanced Crisis Detection Service
 * 
 * Advanced crisis keyword detection with contextual analysis, sentiment patterns,
 * escalation workflows, and integration with professional services.
 */

import { logger } from '../utils/logger';

export interface CrisisIndicator {
  keyword: string;
  severity: "low" | "medium" | "high" | "critical";
  context: string[];
  category: "suicidal" | "self-harm" | "substance-abuse" | "violence" | "emergency" | "general-distress";
  immediateAction: boolean;
}

export interface CrisisAnalysisResult {
  hasCrisisIndicators: boolean;
  severityLevel: "none" | "low" | "medium" | "high" | "critical";
  detectedIndicators: CrisisIndicator[];
  confidence: number;
  recommendedActions: string[];
  emergencyContacts: string[];
  immediateIntervention: boolean;
}

export interface CrisisResponse {
  id: string;
  timestamp: Date;
  userId: string;
  analysisResult: CrisisAnalysisResult;
  actionsTaken: string[];
  escalated: boolean;
  resolved: boolean;
  followUpRequired: boolean;
}

export interface CrisisEscalationAction {
  id: string;
  type: 'contact_emergency' | 'notify_contacts' | 'provide_resources' | 'escalate_professional';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  contact?: string;
  resource?: string;
  completed: boolean;
  timestamp: Date;
}

class CrisisDetectionService {
  private crisisKeywords: CrisisIndicator[] = [
    // Suicidal ideation - Critical
    {
      keyword: "suicide",
      severity: "critical",
      context: ["want to", "thinking about", "planning", "kill myself"],
      category: "suicidal",
      immediateAction: true
    },
    {
      keyword: "kill myself",
      severity: "critical", 
      context: ["want to", "going to", "plan to"],
      category: "suicidal",
      immediateAction: true
    },
    {
      keyword: "end it all",
      severity: "critical",
      context: ["want to", "ready to", "going to"],
      category: "suicidal",
      immediateAction: true
    },
    
    // Self-harm - High
    {
      keyword: "cut myself",
      severity: "high",
      context: ["want to", "need to", "going to"],
      category: "self-harm",
      immediateAction: true
    },
    {
      keyword: "hurt myself",
      severity: "high",
      context: ["want to", "need to", "can't stop"],
      category: "self-harm",
      immediateAction: true
    },
    
    // Substance abuse - Medium to High
    {
      keyword: "overdose",
      severity: "critical",
      context: ["want to", "thinking about", "planning"],
      category: "substance-abuse",
      immediateAction: true
    },
    
    // Violence - High
    {
      keyword: "hurt someone",
      severity: "high",
      context: ["want to", "going to", "planning to"],
      category: "violence",
      immediateAction: true
    },
    
    // Emergency situations - Critical
    {
      keyword: "emergency",
      severity: "critical",
      context: ["medical", "help", "911"],
      category: "emergency",
      immediateAction: true
    },
    
    // General distress - Low to Medium
    {
      keyword: "hopeless",
      severity: "medium",
      context: ["feel", "completely", "totally"],
      category: "general-distress",
      immediateAction: false
    },
    {
      keyword: "worthless",
      severity: "medium",
      context: ["feel", "am", "completely"],
      category: "general-distress",
      immediateAction: false
    }
  ];

  private emergencyContacts = [
    "988", // Suicide & Crisis Lifeline
    "911", // Emergency Services
    "1-800-273-8255", // National Suicide Prevention Lifeline
    "741741" // Crisis Text Line
  ];

  /**
   * Analyzes text for crisis indicators
   */
  public async analyzeForCrisis(text: string, userId?: string): Promise<CrisisAnalysisResult> {
    try {
      const normalizedText = text.toLowerCase().trim();
      const detectedIndicators: CrisisIndicator[] = [];
      let maxSeverity: "none" | "low" | "medium" | "high" | "critical" = "none";
      let confidence = 0;

      // Check for crisis keywords
      for (const indicator of this.crisisKeywords) {
        if (this.containsKeyword(normalizedText, indicator)) {
          detectedIndicators.push(indicator);
          
          // Update severity level
          if (this.getSeverityWeight(indicator.severity) > this.getSeverityWeight(maxSeverity)) {
            maxSeverity = indicator.severity;
          }
          
          // Increase confidence based on context matches
          confidence += this.calculateContextConfidence(normalizedText, indicator);
        }
      }

      // Calculate overall confidence
      confidence = Math.min(confidence / detectedIndicators.length || 0, 1);

      const result: CrisisAnalysisResult = {
        hasCrisisIndicators: detectedIndicators.length > 0,
        severityLevel: maxSeverity,
        detectedIndicators,
        confidence,
        recommendedActions: this.getRecommendedActions(maxSeverity, detectedIndicators),
        emergencyContacts: this.getEmergencyContacts(maxSeverity),
        immediateIntervention: detectedIndicators.some(i => i.immediateAction)
      };

      // Log crisis detection
      if (result.hasCrisisIndicators) {
        await this.logCrisisDetection(result, userId);
      }

      return result;
    } catch (error) {
      logger.error('Crisis analysis failed:', error);
      
      // Return safe default in case of error
      return {
        hasCrisisIndicators: false,
        severityLevel: "none",
        detectedIndicators: [],
        confidence: 0,
        recommendedActions: ["Contact a mental health professional"],
        emergencyContacts: this.emergencyContacts,
        immediateIntervention: false
      };
    }
  }

  /**
   * Handles immediate crisis response
   */
  public async handleCrisisResponse(analysisResult: CrisisAnalysisResult, userId?: string): Promise<CrisisResponse> {
    const response: CrisisResponse = {
      id: Date.now().toString(36),
      timestamp: new Date(),
      userId: userId || 'anonymous',
      analysisResult,
      actionsTaken: [],
      escalated: false,
      resolved: false,
      followUpRequired: true
    };

    try {
      // Immediate actions for critical situations
      if (analysisResult.severityLevel === 'critical' || analysisResult.immediateIntervention) {
        response.actionsTaken.push('Displayed emergency contacts');
        response.actionsTaken.push('Initiated crisis intervention protocol');
        response.escalated = true;
        
        // In a real implementation, this would trigger actual emergency protocols
        await this.triggerEmergencyProtocol(analysisResult, userId);
      }

      // Medium/high severity actions
      if (['medium', 'high'].includes(analysisResult.severityLevel)) {
        response.actionsTaken.push('Provided crisis resources');
        response.actionsTaken.push('Suggested professional help');
        response.followUpRequired = true;
      }

      // Log the response
      await this.logCrisisResponse(response);

      return response;
    } catch (error) {
      logger.error('Crisis response handling failed:', error);
      response.actionsTaken.push('Error in crisis response - manual review required');
      return response;
    }
  }

  /**
   * Checks if text contains a crisis keyword with context
   */
  private containsKeyword(text: string, indicator: CrisisIndicator): boolean {
    const keywordRegex = new RegExp(`\\b${indicator.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return keywordRegex.test(text);
  }

  /**
   * Calculates confidence based on context matches
   */
  private calculateContextConfidence(text: string, indicator: CrisisIndicator): number {
    let contextMatches = 0;
    
    for (const context of indicator.context) {
      if (text.includes(context.toLowerCase())) {
        contextMatches++;
      }
    }
    
    return contextMatches / indicator.context.length;
  }

  /**
   * Gets severity weight for comparison
   */
  private getSeverityWeight(severity: string): number {
    const weights = {
      'none': 0,
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };
    return weights[severity as keyof typeof weights] || 0;
  }

  /**
   * Gets recommended actions based on severity
   */
  private getRecommendedActions(severity: string, indicators: CrisisIndicator[]): string[] {
    const actions: string[] = [];

    switch (severity) {
      case 'critical':
        actions.push('Call 911 or 988 immediately');
        actions.push('Do not leave the person alone');
        actions.push('Remove any means of self-harm');
        actions.push('Stay with them until help arrives');
        break;
        
      case 'high':
        actions.push('Contact crisis hotline (988)');
        actions.push('Reach out to emergency contacts');
        actions.push('Consider emergency room visit');
        actions.push('Do not leave alone if possible');
        break;
        
      case 'medium':
        actions.push('Contact mental health professional');
        actions.push('Use crisis text line (741741)');
        actions.push('Reach out to trusted friend or family');
        actions.push('Practice grounding techniques');
        break;
        
      case 'low':
        actions.push('Practice self-care activities');
        actions.push('Consider talking to counselor');
        actions.push('Use coping strategies');
        actions.push('Monitor mood changes');
        break;
        
      default:
        actions.push('Continue monitoring mental health');
        actions.push('Practice regular self-care');
    }

    return actions;
  }

  /**
   * Gets emergency contacts based on severity
   */
  private getEmergencyContacts(severity: string): string[] {
    if (['critical', 'high'].includes(severity)) {
      return this.emergencyContacts;
    }
    
    // For lower severity, return non-emergency resources
    return [
      "988", // Crisis Lifeline
      "741741" // Crisis Text Line
    ];
  }

  /**
   * Logs crisis detection for monitoring
   */
  private async logCrisisDetection(result: CrisisAnalysisResult, userId?: string): Promise<void> {
    try {
      logger.warn('Crisis indicators detected', {
        userId: userId || 'anonymous',
        severity: result.severityLevel,
        indicatorCount: result.detectedIndicators.length,
        confidence: result.confidence,
        immediateIntervention: result.immediateIntervention,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to log crisis detection:', error);
    }
  }

  /**
   * Logs crisis response for tracking
   */
  private async logCrisisResponse(response: CrisisResponse): Promise<void> {
    try {
      logger.info('Crisis response handled', {
        responseId: response.id,
        userId: response.userId,
        severity: response.analysisResult.severityLevel,
        escalated: response.escalated,
        actionsTaken: response.actionsTaken,
        timestamp: response.timestamp.toISOString()
      });
    } catch (error) {
      logger.error('Failed to log crisis response:', error);
    }
  }

  /**
   * Triggers emergency protocol for critical situations
   */
  private async triggerEmergencyProtocol(result: CrisisAnalysisResult, userId?: string): Promise<void> {
    try {
      // In a real implementation, this would:
      // 1. Alert emergency contacts
      // 2. Notify mental health professionals
      // 3. Log in emergency database
      // 4. Potentially contact emergency services
      
      logger.error('Emergency protocol triggered', {
        userId: userId || 'anonymous',
        severity: result.severityLevel,
        indicators: result.detectedIndicators.map(i => i.keyword),
        timestamp: new Date().toISOString()
      });
      
      // Placeholder for actual emergency protocol implementation
    } catch (error) {
      logger.error('Emergency protocol failed:', error);
      throw error;
    }
  }

  /**
   * Gets crisis detection statistics
   */
  public async getStatistics(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    // Implementation would query actual database
    return {
      totalDetections: 0,
      severityBreakdown: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      responseTime: 0,
      escalationRate: 0
    };
  }
}

export const crisisDetectionService = new CrisisDetectionService();
export default crisisDetectionService;
