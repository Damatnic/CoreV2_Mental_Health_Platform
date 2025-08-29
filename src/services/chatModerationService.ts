/**
 * Chat Moderation Service
 * 
 * Handles automated and manual moderation of chat content with mental health considerations
 */

interface ModerationRule {
  id: string;
  name: string;
  type: 'keyword' | 'pattern' | 'ml' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'flag' | 'warn' | 'block' | 'escalate' | 'crisis_intervention';
  patterns: string[];
  isActive: boolean;
  mentalHealthContext?: boolean;
  crisisKeywords?: boolean;
}

interface ModerationResult {
  messageId: string;
  isApproved: boolean;
  flagged: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  suggestedAction: 'allow' | 'warn' | 'block' | 'escalate' | 'crisis_support';
  confidence: number;
  requiresManualReview: boolean;
  crisisDetected: boolean;
  supportResources?: string[];
}

interface ModeratorAction {
  id: string;
  moderatorId: string;
  messageId: string;
  action: 'approve' | 'reject' | 'edit' | 'escalate' | 'crisis_response';
  reason: string;
  timestamp: Date;
  notes?: string;
}

interface ChatContext {
  chatId: string;
  userId: string;
  userHistory: {
    recentMessages: number;
    flaggedMessages: number;
    crisisAlerts: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  conversationContext: {
    topic?: string;
    participants: string[];
    isGroupChat: boolean;
    isTherapySession: boolean;
    isCrisisSupport: boolean;
  };
}

class ChatModerationService {
  private rules: Map<string, ModerationRule> = new Map();
  private moderationHistory: ModeratorAction[] = [];
  private whitelistedUsers: Set<string> = new Set();
  private isEnabled: boolean = true;

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaultRules: ModerationRule[] = [
      {
        id: 'crisis_keywords',
        name: 'Crisis Keywords Detection',
        type: 'keyword',
        severity: 'critical',
        action: 'crisis_intervention',
        patterns: [
          'suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm',
          'not worth living', 'better off dead', 'want to die', 'end my life'
        ],
        isActive: true,
        mentalHealthContext: true,
        crisisKeywords: true
      },
      {
        id: 'moderate_risk',
        name: 'Moderate Risk Indicators',
        type: 'keyword',
        severity: 'high',
        action: 'escalate',
        patterns: [
          'hopeless', 'worthless', 'overwhelming', 'can\'t cope', 'giving up',
          'nobody cares', 'better without me', 'can\'t go on'
        ],
        isActive: true,
        mentalHealthContext: true,
        crisisKeywords: false
      },
      {
        id: 'harassment',
        name: 'Harassment Detection',
        type: 'pattern',
        severity: 'high',
        action: 'block',
        patterns: [
          'you should kill yourself', 'kys', 'go die', 'worthless piece',
          'nobody likes you', 'everyone hates you'
        ],
        isActive: true,
        mentalHealthContext: false,
        crisisKeywords: false
      },
      {
        id: 'spam',
        name: 'Spam Detection',
        type: 'pattern',
        severity: 'low',
        action: 'warn',
        patterns: [
          '(.)\\1{10,}', // Repeated characters
          '(https?://\\S+\\s*){3,}', // Multiple links
          '([A-Z]{5,}\\s*){3,}' // Excessive caps
        ],
        isActive: true,
        mentalHealthContext: false,
        crisisKeywords: false
      },
      {
        id: 'personal_info',
        name: 'Personal Information Protection',
        type: 'pattern',
        severity: 'medium',
        action: 'warn',
        patterns: [
          '\\b\\d{3}-\\d{2}-\\d{4}\\b', // SSN
          '\\b\\d{16}\\b', // Credit card
          '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', // Email
          '\\b\\d{3}[.-]\\d{3}[.-]\\d{4}\\b' // Phone
        ],
        isActive: true,
        mentalHealthContext: false,
        crisisKeywords: false
      },
      {
        id: 'supportive_language',
        name: 'Supportive Language Encouragement',
        type: 'keyword',
        severity: 'low',
        action: 'flag',
        patterns: [
          'you\'re not alone', 'here for you', 'sending support', 'proud of you',
          'you matter', 'things will get better', 'seeking help is brave'
        ],
        isActive: true,
        mentalHealthContext: true,
        crisisKeywords: false
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  async moderateMessage(
    message: string,
    context: ChatContext,
    options: {
      skipCrisisDetection?: boolean;
      skipAutomatedActions?: boolean;
      requireManualReview?: boolean;
    } = {}
  ): Promise<ModerationResult> {
    if (!this.isEnabled) {
      return this.createPassThroughResult(context.userId + '_' + Date.now());
    }

    const messageId = context.userId + '_' + Date.now();
    const result: ModerationResult = {
      messageId,
      isApproved: true,
      flagged: false,
      reasons: [],
      suggestedAction: 'allow',
      confidence: 0,
      requiresManualReview: options.requireManualReview || false,
      crisisDetected: false,
      supportResources: []
    };

    // Check against all active rules
    for (const rule of this.rules.values()) {
      if (!rule.isActive) continue;

      const ruleResult = await this.checkRule(message, rule, context);
      
      if (ruleResult.matched) {
        result.flagged = true;
        result.reasons.push(ruleResult.reason);
        result.confidence = Math.max(result.confidence, ruleResult.confidence);

        // Update severity to highest found
        if (!result.severity || this.getSeverityLevel(rule.severity) > this.getSeverityLevel(result.severity)) {
          result.severity = rule.severity;
        }

        // Update suggested action based on most severe rule
        if (this.getActionSeverity(rule.action) > this.getActionSeverity(result.suggestedAction)) {
          result.suggestedAction = this.mapRuleActionToSuggestion(rule.action);
        }

        // Special handling for crisis detection
        if (rule.crisisKeywords && !options.skipCrisisDetection) {
          result.crisisDetected = true;
          result.supportResources = this.getCrisisSupportResources();
        }
      }
    }

    // Apply context-based adjustments
    result.requiresManualReview = result.requiresManualReview || 
      this.shouldRequireManualReview(result, context);

    // Determine final approval status
    result.isApproved = this.determineApprovalStatus(result, options);

    // Log moderation result
    await this.logModerationResult(result, context);

    return result;
  }

  private async checkRule(
    message: string,
    rule: ModerationRule,
    context: ChatContext
  ): Promise<{ matched: boolean; reason: string; confidence: number }> {
    const lowerMessage = message.toLowerCase();

    switch (rule.type) {
      case 'keyword':
        for (const pattern of rule.patterns) {
          if (lowerMessage.includes(pattern.toLowerCase())) {
            return {
              matched: true,
              reason: `Matched keyword rule: ${rule.name}`,
              confidence: 0.9
            };
          }
        }
        break;

      case 'pattern':
        for (const pattern of rule.patterns) {
          const regex = new RegExp(pattern, 'gi');
          if (regex.test(message)) {
            return {
              matched: true,
              reason: `Matched pattern rule: ${rule.name}`,
              confidence: 0.85
            };
          }
        }
        break;

      case 'ml':
        // Placeholder for ML-based detection
        return {
          matched: false,
          reason: '',
          confidence: 0
        };

      case 'custom':
        // Placeholder for custom rule logic
        return await this.executeCustomRule(rule, message, context);
    }

    return {
      matched: false,
      reason: '',
      confidence: 0
    };
  }

  private async executeCustomRule(
    rule: ModerationRule,
    message: string,
    context: ChatContext
  ): Promise<{ matched: boolean; reason: string; confidence: number }> {
    // Placeholder for custom rule execution
    // This would implement specific business logic rules
    return {
      matched: false,
      reason: '',
      confidence: 0
    };
  }

  private getSeverityLevel(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private getActionSeverity(action: string): number {
    switch (action) {
      case 'crisis_intervention': return 5;
      case 'escalate': return 4;
      case 'block': return 3;
      case 'warn': return 2;
      case 'flag': return 1;
      case 'allow': return 0;
      default: return 0;
    }
  }

  private mapRuleActionToSuggestion(action: string): ModerationResult['suggestedAction'] {
    switch (action) {
      case 'crisis_intervention': return 'crisis_support';
      case 'escalate': return 'escalate';
      case 'block': return 'block';
      case 'warn': return 'warn';
      case 'flag': return 'allow';
      default: return 'allow';
    }
  }

  private shouldRequireManualReview(result: ModerationResult, context: ChatContext): boolean {
    // Require manual review for high-severity issues
    if (result.severity === 'critical' || result.severity === 'high') {
      return true;
    }

    // Require review for users with history of issues
    if (context.userHistory.flaggedMessages > 3) {
      return true;
    }

    // Require review in therapy sessions
    if (context.conversationContext.isTherapySession) {
      return true;
    }

    // Require review for crisis support contexts
    if (context.conversationContext.isCrisisSupport && result.flagged) {
      return true;
    }

    return false;
  }

  private determineApprovalStatus(
    result: ModerationResult,
    options: { skipAutomatedActions?: boolean }
  ): boolean {
    if (options.skipAutomatedActions) {
      return true;
    }

    switch (result.suggestedAction) {
      case 'block':
        return false;
      case 'crisis_support':
      case 'escalate':
        return result.requiresManualReview; // Approved pending review
      case 'warn':
      case 'allow':
      default:
        return true;
    }
  }

  private getCrisisSupportResources(): string[] {
    return [
      'National Suicide Prevention Lifeline: 988',
      'Crisis Text Line: Text HOME to 741741',
      'International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/',
      'Emergency Services: 911'
    ];
  }

  private createPassThroughResult(messageId: string): ModerationResult {
    return {
      messageId,
      isApproved: true,
      flagged: false,
      reasons: [],
      suggestedAction: 'allow',
      confidence: 0,
      requiresManualReview: false,
      crisisDetected: false
    };
  }

  private async logModerationResult(result: ModerationResult, context: ChatContext): Promise<void> {
    // In production, this would log to a proper logging system
    if (result.flagged) {
      console.log(`Message ${result.messageId} flagged:`, {
        severity: result.severity,
        reasons: result.reasons,
        suggestedAction: result.suggestedAction,
        crisisDetected: result.crisisDetected,
        chatId: context.chatId,
        userId: context.userId
      });
    }
  }

  // Rule management methods
  addRule(rule: ModerationRule): void {
    this.rules.set(rule.id, rule);
  }

  updateRule(ruleId: string, updates: Partial<ModerationRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.set(ruleId, { ...rule, ...updates });
    return true;
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRules(): ModerationRule[] {
    return Array.from(this.rules.values());
  }

  getActiveRules(): ModerationRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.isActive);
  }

  // Moderator action methods
  async executeModeratorAction(action: Omit<ModeratorAction, 'id' | 'timestamp'>): Promise<ModeratorAction> {
    const moderatorAction: ModeratorAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...action
    };

    this.moderationHistory.push(moderatorAction);

    // Execute the action
    await this.processModeratorAction(moderatorAction);

    return moderatorAction;
  }

  private async processModeratorAction(action: ModeratorAction): Promise<void> {
    switch (action.action) {
      case 'crisis_response':
        await this.handleCrisisResponse(action);
        break;
      case 'escalate':
        await this.escalateToSeniorModerator(action);
        break;
      case 'approve':
      case 'reject':
      case 'edit':
        // Handle standard moderation actions
        break;
    }
  }

  private async handleCrisisResponse(action: ModeratorAction): Promise<void> {
    // Implement crisis response protocol
    console.log(`Crisis response initiated for message ${action.messageId}`);
    
    // In production, this would:
    // 1. Alert crisis counselors
    // 2. Provide immediate support resources
    // 3. Connect user to crisis chat
    // 4. Log for follow-up
  }

  private async escalateToSeniorModerator(action: ModeratorAction): Promise<void> {
    // Implement escalation protocol
    console.log(`Escalating message ${action.messageId} to senior moderator`);
  }

  // Whitelist management
  addUserToWhitelist(userId: string): void {
    this.whitelistedUsers.add(userId);
  }

  removeUserFromWhitelist(userId: string): void {
    this.whitelistedUsers.delete(userId);
  }

  isUserWhitelisted(userId: string): boolean {
    return this.whitelistedUsers.has(userId);
  }

  // Service control
  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  // Analytics and reporting
  getModerationStats(timeRange?: { start: Date; end: Date }): {
    totalMessagesModerated: number;
    flaggedMessages: number;
    crisisInterventions: number;
    falsePositives: number;
    averageResponseTime: number;
  } {
    let filteredActions = this.moderationHistory;
    
    if (timeRange) {
      filteredActions = this.moderationHistory.filter(
        action => action.timestamp >= timeRange.start && action.timestamp <= timeRange.end
      );
    }

    return {
      totalMessagesModerated: filteredActions.length,
      flaggedMessages: filteredActions.filter(a => a.action === 'reject').length,
      crisisInterventions: filteredActions.filter(a => a.action === 'crisis_response').length,
      falsePositives: 0, // Would be calculated based on moderator reversals
      averageResponseTime: 0 // Would be calculated from timestamps
    };
  }

  // Crisis-specific methods for mental health platform
  async detectCrisisContent(message: string): Promise<{
    isCrisis: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    triggers: string[];
    recommendedAction: string;
  }> {
    const crisisRule = this.rules.get('crisis_keywords');
    const moderateRiskRule = this.rules.get('moderate_risk');

    const result = {
      isCrisis: false,
      riskLevel: 'low' as const,
      confidence: 0,
      triggers: [] as string[],
      recommendedAction: 'monitor'
    };

    if (crisisRule) {
      const crisisCheck = await this.checkRule(message, crisisRule, {} as ChatContext);
      if (crisisCheck.matched) {
        result.isCrisis = true;
        result.riskLevel = 'critical';
        result.confidence = crisisCheck.confidence;
        result.triggers.push('crisis_keywords');
        result.recommendedAction = 'immediate_intervention';
      }
    }

    if (!result.isCrisis && moderateRiskRule) {
      const riskCheck = await this.checkRule(message, moderateRiskRule, {} as ChatContext);
      if (riskCheck.matched) {
        result.isCrisis = true;
        result.riskLevel = 'high';
        result.confidence = riskCheck.confidence;
        result.triggers.push('moderate_risk');
        result.recommendedAction = 'escalate_support';
      }
    }

    return result;
  }

  // Mental health specific helper methods
  generateSupportMessage(crisisLevel: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (crisisLevel) {
      case 'critical':
        return 'We\'re concerned about your safety. Please reach out to a crisis counselor immediately or call 988.';
      case 'high':
        return 'It sounds like you\'re going through a difficult time. Support is available - would you like to speak with someone?';
      case 'medium':
        return 'Thank you for sharing. Remember that support is available if you need someone to talk to.';
      default:
        return 'We\'re here to support you on your mental health journey.';
    }
  }
}

// Singleton instance
export const chatModerationService = new ChatModerationService();

export default chatModerationService;
export type {
  ModerationRule,
  ModerationResult,
  ModeratorAction,
  ChatContext
};

