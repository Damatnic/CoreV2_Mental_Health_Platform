import { EventEmitter } from 'events';

// Types for therapeutic AI service
export interface TherapeuticProfile {
  userId: string;
  conditions: string[];
  triggers: string[];
  copingStrategies: string[];
  preferredApproaches: TherapeuticApproach[];
  riskFactors: string[];
  strengths: string[];
  goals: string[];
  medications?: string[];
  therapyHistory?: string[];
  emergencyContacts: string[];
  safetyPlan?: SafetyPlan;
  lastUpdated: Date;
}

export interface TherapeuticApproach {
  type: 'CBT' | 'DBT' | 'ACT' | 'Mindfulness' | 'Solution-Focused' | 'Humanistic' | 'Psychodynamic';
  effectiveness: number; // 1-10 scale
  lastUsed?: Date;
  notes?: string;
}

export interface SafetyPlan {
  warningSignals: string[];
  copingStrategies: string[];
  socialSupports: string[];
  professionalContacts: string[];
  environmentalSafety: string[];
  restrictMeans: string[];
  reasonsToLive: string[];
}

export interface AIResponse {
  id: string;
  content: string;
  approach: TherapeuticApproach['type'];
  confidence: number;
  interventions: Intervention[];
  resources: Resource[];
  riskAssessment?: RiskAssessment;
  followUpSuggestions: string[];
  timestamp: Date;
}

export interface Intervention {
  type: 'exercise' | 'technique' | 'resource' | 'referral' | 'crisis_protocol';
  name: string;
  description: string;
  instructions: string[];
  duration?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  categories: string[];
  evidenceBased: boolean;
}

export interface Resource {
  type: 'article' | 'video' | 'audio' | 'worksheet' | 'app' | 'book' | 'crisis_line';
  title: string;
  description: string;
  url?: string;
  author?: string;
  rating?: number;
  duration?: number;
  accessibility: string[];
}

export interface RiskAssessment {
  level: 'low' | 'moderate' | 'high' | 'imminent';
  factors: string[];
  protectiveFactors: string[];
  recommendations: string[];
  requiresImmediateAttention: boolean;
  crisisProtocolActivated: boolean;
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  messages: AIMessage[];
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  anxiety: number; // 1-10 scale
  currentCrisis?: boolean;
  therapeuticGoals: string[];
  sessionNumber?: number;
  lastSession?: Date;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    sentiment?: 'positive' | 'negative' | 'neutral';
    crisisKeywords?: string[];
    emotions?: string[];
    topics?: string[];
  };
}

export interface AIConfig {
  model: 'gpt-4' | 'claude-3' | 'therapeutic-specialized';
  temperature: number;
  maxTokens: number;
  safetyFilters: boolean;
  crisisDetection: boolean;
  personalizedResponses: boolean;
  evidenceBasedOnly: boolean;
}

// Default configuration
const DEFAULT_CONFIG: AIConfig = {
  model: 'therapeutic-specialized',
  temperature: 0.7,
  maxTokens: 1000,
  safetyFilters: true,
  crisisDetection: true,
  personalizedResponses: true,
  evidenceBasedOnly: true
};

/**
 * Therapeutic AI Service
 * Provides AI-powered therapeutic support with safety protocols
 */
export class TherapeuticAIService extends EventEmitter {
  private config: AIConfig;
  private profiles: Map<string, TherapeuticProfile> = new Map();
  private activeConversations: Map<string, ConversationContext> = new Map();
  private interventionLibrary: Map<string, Intervention> = new Map();
  private resourceLibrary: Map<string, Resource> = new Map();
  private crisisProtocols: Map<string, Function> = new Map();

  constructor(config: Partial<AIConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeLibraries();
    this.setupCrisisProtocols();
  }

  /**
   * Generate therapeutic response
   */
  async generateResponse(
    message: string,
    context: Partial<ConversationContext>
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Get or create conversation context
      const fullContext = await this.getOrCreateContext(context);
      
      // Add user message to context
      const userMessage: AIMessage = {
        id: this.generateId(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        metadata: await this.analyzeMessage(message)
      };
      
      fullContext.messages.push(userMessage);
      
      // Crisis detection
      const riskAssessment = await this.assessRisk(message, fullContext);
      
      if (riskAssessment.requiresImmediateAttention) {
        this.emit('crisis:detected', { context: fullContext, assessment: riskAssessment });
        
        if (riskAssessment.crisisProtocolActivated) {
          return await this.generateCrisisResponse(riskAssessment, fullContext);
        }
      }
      
      // Get user profile
      const profile = this.profiles.get(fullContext.userId);
      
      // Determine therapeutic approach
      const approach = await this.selectTherapeuticApproach(message, fullContext, profile);
      
      // Generate response
      const response = await this.generateTherapeuticResponse(
        message,
        fullContext,
        approach,
        profile
      );
      
      // Get relevant interventions and resources
      const interventions = await this.getRelevantInterventions(message, approach, profile);
      const resources = await this.getRelevantResources(message, approach, profile);
      
      // Create AI response
      const aiResponse: AIResponse = {
        id: this.generateId(),
        content: response.content,
        approach: approach.type,
        confidence: response.confidence,
        interventions,
        resources,
        riskAssessment,
        followUpSuggestions: await this.generateFollowUpSuggestions(fullContext, approach),
        timestamp: new Date()
      };
      
      // Add AI response to context
      const assistantMessage: AIMessage = {
        id: aiResponse.id,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date()
      };
      
      fullContext.messages.push(assistantMessage);
      this.activeConversations.set(fullContext.sessionId, fullContext);
      
      // Log interaction
      this.emit('response:generated', {
        context: fullContext,
        response: aiResponse,
        duration: Date.now() - startTime
      });
      
      return aiResponse;
      
    } catch (error) {
      this.emit('error', error);
      
      // Return safe fallback response
      return {
        id: this.generateId(),
        content: "I apologize, but I'm having difficulty processing your message right now. If you're in crisis, please contact emergency services or a crisis helpline immediately. Is there something specific I can help you with?",
        approach: 'Humanistic',
        confidence: 0.1,
        interventions: [],
        resources: await this.getCrisisResources(),
        followUpSuggestions: [
          "Are you currently in a safe place?",
          "Would you like me to provide crisis support resources?",
          "Can you tell me more about how you're feeling right now?"
        ],
        timestamp: new Date()
      };
    }
  }

  /**
   * Create or update therapeutic profile
   */
  async createProfile(userId: string, profileData: Partial<TherapeuticProfile>): Promise<TherapeuticProfile> {
    const existingProfile = this.profiles.get(userId);
    
    const profile: TherapeuticProfile = {
      userId,
      conditions: [],
      triggers: [],
      copingStrategies: [],
      preferredApproaches: [],
      riskFactors: [],
      strengths: [],
      goals: [],
      emergencyContacts: [],
      lastUpdated: new Date(),
      ...existingProfile,
      ...profileData
    };
    
    this.profiles.set(userId, profile);
    this.emit('profile:updated', profile);
    
    return profile;
  }

  /**
   * Assess risk level from message content
   */
  async assessRisk(message: string, context: ConversationContext): Promise<RiskAssessment> {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'better off dead', 'want to die',
      'hurt myself', 'cut myself', 'pills', 'overdose', 'jump', 'hang myself',
      'can\'t go on', 'no hope', 'worthless', 'burden', 'everyone would be better'
    ];
    
    const protectiveKeywords = [
      'family', 'children', 'pets', 'future', 'goals', 'hope', 'help',
      'therapy', 'medication', 'support', 'friends', 'love', 'care'
    ];
    
    const messageLower = message.toLowerCase();
    const foundCrisisKeywords = crisisKeywords.filter(keyword => messageLower.includes(keyword));
    const foundProtectiveFactors = protectiveKeywords.filter(keyword => messageLower.includes(keyword));
    
    // Analyze message sentiment and context
    const recentMessages = context.messages.slice(-5);
    const negativePatterns = recentMessages.filter(msg => 
      msg.metadata?.sentiment === 'negative' || msg.metadata?.crisisKeywords?.length
    ).length;
    
    let level: RiskAssessment['level'] = 'low';
    let requiresImmediateAttention = false;
    let crisisProtocolActivated = false;
    
    if (foundCrisisKeywords.length >= 2) {
      level = 'imminent';
      requiresImmediateAttention = true;
      crisisProtocolActivated = true;
    } else if (foundCrisisKeywords.length === 1 || negativePatterns >= 3) {
      level = 'high';
      requiresImmediateAttention = true;
    } else if (negativePatterns >= 2) {
      level = 'moderate';
    }
    
    const profile = this.profiles.get(context.userId);
    const riskFactors = [...foundCrisisKeywords];
    
    if (profile?.riskFactors) {
      profile.riskFactors.forEach(factor => {
        if (messageLower.includes(factor.toLowerCase())) {
          riskFactors.push(factor);
          if (level === 'low') level = 'moderate';
          else if (level === 'moderate') level = 'high';
        }
      });
    }
    
    return {
      level,
      factors: riskFactors,
      protectiveFactors: foundProtectiveFactors,
      recommendations: await this.generateRiskRecommendations(level, riskFactors),
      requiresImmediateAttention,
      crisisProtocolActivated
    };
  }

  /**
   * Select appropriate therapeutic approach
   */
  async selectTherapeuticApproach(
    message: string,
    context: ConversationContext,
    profile?: TherapeuticProfile
  ): Promise<TherapeuticApproach> {
    // Default to CBT for general cases
    let selectedApproach: TherapeuticApproach = {
      type: 'CBT',
      effectiveness: 7,
      notes: 'Default cognitive-behavioral approach'
    };
    
    // Use preferred approaches from profile
    if (profile?.preferredApproaches?.length) {
      const bestApproach = profile.preferredApproaches
        .sort((a, b) => b.effectiveness - a.effectiveness)[0];
      
      if (bestApproach.effectiveness >= 6) {
        selectedApproach = bestApproach;
      }
    }
    
    // Analyze message content for approach selection
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('mindful') || messageLower.includes('present') || messageLower.includes('breath')) {
      selectedApproach = { type: 'Mindfulness', effectiveness: 8 };
    } else if (messageLower.includes('emotion') || messageLower.includes('intense') || messageLower.includes('overwhelming')) {
      selectedApproach = { type: 'DBT', effectiveness: 8 };
    } else if (messageLower.includes('meaning') || messageLower.includes('purpose') || messageLower.includes('value')) {
      selectedApproach = { type: 'ACT', effectiveness: 7 };
    } else if (messageLower.includes('problem') || messageLower.includes('solve') || messageLower.includes('goal')) {
      selectedApproach = { type: 'Solution-Focused', effectiveness: 7 };
    }
    
    return selectedApproach;
  }

  /**
   * Get relevant interventions
   */
  async getRelevantInterventions(
    message: string,
    approach: TherapeuticApproach,
    profile?: TherapeuticProfile
  ): Promise<Intervention[]> {
    const interventions: Intervention[] = [];
    const messageLower = message.toLowerCase();
    
    // Breathing exercises for anxiety
    if (messageLower.includes('anxious') || messageLower.includes('panic') || messageLower.includes('overwhelm')) {
      interventions.push({
        type: 'exercise',
        name: '4-7-8 Breathing',
        description: 'A calming breathing technique to reduce anxiety',
        instructions: [
          'Inhale through your nose for 4 counts',
          'Hold your breath for 7 counts',
          'Exhale through your mouth for 8 counts',
          'Repeat 4-6 times'
        ],
        duration: 300,
        difficulty: 'easy',
        categories: ['anxiety', 'breathing', 'mindfulness'],
        evidenceBased: true
      });
    }
    
    // Grounding techniques
    if (messageLower.includes('disconnected') || messageLower.includes('unreal') || messageLower.includes('dissociate')) {
      interventions.push({
        type: 'technique',
        name: '5-4-3-2-1 Grounding',
        description: 'Use your senses to ground yourself in the present moment',
        instructions: [
          'Name 5 things you can see',
          'Name 4 things you can touch',
          'Name 3 things you can hear',
          'Name 2 things you can smell',
          'Name 1 thing you can taste'
        ],
        difficulty: 'easy',
        categories: ['grounding', 'mindfulness', 'anxiety'],
        evidenceBased: true
      });
    }
    
    // CBT thought challenging
    if (approach.type === 'CBT' && (messageLower.includes('thought') || messageLower.includes('think'))) {
      interventions.push({
        type: 'technique',
        name: 'Thought Challenging',
        description: 'Examine and challenge negative thought patterns',
        instructions: [
          'Identify the specific thought',
          'What evidence supports this thought?',
          'What evidence contradicts it?',
          'What would you tell a friend in this situation?',
          'What\'s a more balanced thought?'
        ],
        difficulty: 'medium',
        categories: ['CBT', 'thoughts', 'cognitive'],
        evidenceBased: true
      });
    }
    
    return interventions.slice(0, 3); // Limit to most relevant
  }

  /**
   * Get relevant resources
   */
  async getRelevantResources(
    message: string,
    approach: TherapeuticApproach,
    profile?: TherapeuticProfile
  ): Promise<Resource[]> {
    const resources: Resource[] = [];
    const messageLower = message.toLowerCase();
    
    // Crisis resources
    if (messageLower.includes('crisis') || messageLower.includes('emergency')) {
      resources.push(...await this.getCrisisResources());
    }
    
    // Anxiety resources
    if (messageLower.includes('anxiety') || messageLower.includes('panic')) {
      resources.push({
        type: 'article',
        title: 'Understanding Anxiety: A Guide to Coping',
        description: 'Evidence-based strategies for managing anxiety',
        url: '/resources/anxiety-guide',
        rating: 4.8,
        accessibility: ['screen-reader', 'large-text']
      });
    }
    
    // Depression resources
    if (messageLower.includes('depressed') || messageLower.includes('sad') || messageLower.includes('hopeless')) {
      resources.push({
        type: 'article',
        title: 'Depression Self-Help Guide',
        description: 'Practical strategies for managing depression',
        url: '/resources/depression-guide',
        rating: 4.7,
        accessibility: ['screen-reader', 'large-text']
      });
    }
    
    return resources.slice(0, 2); // Limit to most relevant
  }

  /**
   * Generate crisis response
   */
  private async generateCrisisResponse(
    assessment: RiskAssessment,
    context: ConversationContext
  ): Promise<AIResponse> {
    const crisisResources = await this.getCrisisResources();
    
    let content = "I'm very concerned about what you've shared. Your safety is the most important thing right now. ";
    
    if (assessment.level === 'imminent') {
      content += "If you're in immediate danger, please call emergency services (911) or go to your nearest emergency room. ";
    }
    
    content += "You don't have to go through this alone. There are people who want to help you. ";
    content += "Would you like me to provide you with crisis support resources, or is there someone you can reach out to right now?";
    
    return {
      id: this.generateId(),
      content,
      approach: 'Humanistic',
      confidence: 1.0,
      interventions: [{
        type: 'crisis_protocol',
        name: 'Crisis Safety Protocol',
        description: 'Immediate safety assessment and intervention',
        instructions: [
          'Ensure immediate safety',
          'Contact emergency services if in danger',
          'Reach out to crisis support',
          'Remove means of harm',
          'Stay with trusted person'
        ],
        difficulty: 'easy',
        categories: ['crisis', 'safety'],
        evidenceBased: true
      }],
      resources: crisisResources,
      riskAssessment: assessment,
      followUpSuggestions: [
        "Are you in a safe place right now?",
        "Is there someone who can stay with you?",
        "Would you like me to help you create a safety plan?",
        "Can you tell me about your support system?"
      ],
      timestamp: new Date()
    };
  }

  /**
   * Get crisis resources
   */
  private async getCrisisResources(): Promise<Resource[]> {
    return [
      {
        type: 'crisis_line',
        title: 'National Suicide Prevention Lifeline',
        description: '24/7 crisis support and suicide prevention',
        url: 'tel:988',
        accessibility: ['phone', 'text', 'chat']
      },
      {
        type: 'crisis_line',
        title: 'Crisis Text Line',
        description: 'Text HOME to 741741 for 24/7 crisis support',
        url: 'sms:741741',
        accessibility: ['text']
      },
      {
        type: 'app',
        title: 'Crisis Support App',
        description: 'Immediate access to coping strategies and crisis contacts',
        url: '/app/crisis-support',
        rating: 4.9,
        accessibility: ['screen-reader', 'voice-control']
      }
    ];
  }

  /**
   * Initialize intervention and resource libraries
   */
  private initializeLibraries(): void {
    // This would be populated from a database in a real implementation
    // For now, using basic in-memory storage
  }

  /**
   * Setup crisis protocols
   */
  private setupCrisisProtocols(): void {
    this.crisisProtocols.set('imminent', async (context: ConversationContext) => {
      this.emit('crisis:imminent', context);
      // Trigger emergency protocols
    });
    
    this.crisisProtocols.set('high', async (context: ConversationContext) => {
      this.emit('crisis:high', context);
      // Escalate to human oversight
    });
  }

  // Helper methods
  private async getOrCreateContext(partial: Partial<ConversationContext>): Promise<ConversationContext> {
    const sessionId = partial.sessionId || this.generateId();
    const existing = this.activeConversations.get(sessionId);
    
    if (existing) {
      return { ...existing, ...partial };
    }
    
    const newContext: ConversationContext = {
      sessionId,
      userId: partial.userId || 'anonymous',
      messages: [],
      mood: 5,
      energy: 5,
      anxiety: 5,
      therapeuticGoals: [],
      ...partial
    };
    
    this.activeConversations.set(sessionId, newContext);
    return newContext;
  }

  private async analyzeMessage(message: string): Promise<AIMessage['metadata']> {
    // Simple sentiment analysis
    const positiveWords = ['happy', 'good', 'great', 'better', 'hopeful', 'grateful'];
    const negativeWords = ['sad', 'bad', 'terrible', 'worse', 'hopeless', 'angry', 'depressed'];
    
    const messageLower = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => messageLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => messageLower.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    return { sentiment };
  }

  private async generateTherapeuticResponse(
    message: string,
    context: ConversationContext,
    approach: TherapeuticApproach,
    profile?: TherapeuticProfile
  ): Promise<{ content: string; confidence: number }> {
    // This would integrate with actual AI models in production
    // For now, returning structured therapeutic responses based on approach
    
    let content = "";
    let confidence = 0.7;
    
    switch (approach.type) {
      case 'CBT':
        content = this.generateCBTResponse(message, context);
        break;
      case 'DBT':
        content = this.generateDBTResponse(message, context);
        break;
      case 'Mindfulness':
        content = this.generateMindfulnessResponse(message, context);
        break;
      default:
        content = this.generateHumanisticResponse(message, context);
    }
    
    return { content, confidence };
  }

  private generateCBTResponse(message: string, context: ConversationContext): string {
    return "I hear that you're struggling with some difficult thoughts and feelings. In cognitive behavioral therapy, we often explore the connections between our thoughts, feelings, and behaviors. Can you tell me more about what specific thoughts are going through your mind right now?";
  }

  private generateDBTResponse(message: string, context: ConversationContext): string {
    return "It sounds like you're experiencing some intense emotions right now. In DBT, we focus on building skills to help manage these overwhelming feelings. Let's start with validating your experience - what you're feeling is understandable given your situation. What would help you feel more grounded in this moment?";
  }

  private generateMindfulnessResponse(message: string, context: ConversationContext): string {
    return "I can sense that you're going through a difficult time. Let's take a moment to ground ourselves in the present. Can you notice three things around you right now - perhaps something you can see, hear, and feel? This can help us create some space between you and these overwhelming thoughts.";
  }

  private generateHumanisticResponse(message: string, context: ConversationContext): string {
    return "Thank you for sharing that with me. I can hear the pain in your words, and I want you to know that your feelings are completely valid. You've shown courage by reaching out and expressing what you're going through. What feels most important for you to talk about right now?";
  }

  private async generateFollowUpSuggestions(
    context: ConversationContext,
    approach: TherapeuticApproach
  ): Promise<string[]> {
    const suggestions = [
      "How are you feeling right now?",
      "What would be most helpful for you today?",
      "Is there anything specific you'd like to work on together?"
    ];
    
    switch (approach.type) {
      case 'CBT':
        suggestions.push("What thoughts are coming up for you about this situation?");
        suggestions.push("How might we challenge some of these thought patterns?");
        break;
      case 'DBT':
        suggestions.push("What coping skills have helped you in similar situations?");
        suggestions.push("How can we help you tolerate this distress right now?");
        break;
      case 'Mindfulness':
        suggestions.push("Would you like to try a brief mindfulness exercise?");
        suggestions.push("How connected do you feel to the present moment?");
        break;
    }
    
    return suggestions.slice(0, 3);
  }

  private async generateRiskRecommendations(level: RiskAssessment['level'], factors: string[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    switch (level) {
      case 'imminent':
        recommendations.push("Contact emergency services immediately (911)");
        recommendations.push("Go to nearest emergency room");
        recommendations.push("Call National Suicide Prevention Lifeline (988)");
        recommendations.push("Remove means of self-harm");
        recommendations.push("Stay with trusted person");
        break;
      case 'high':
        recommendations.push("Contact crisis helpline (988)");
        recommendations.push("Reach out to mental health professional");
        recommendations.push("Activate safety plan");
        recommendations.push("Contact trusted support person");
        break;
      case 'moderate':
        recommendations.push("Schedule appointment with therapist");
        recommendations.push("Use coping strategies");
        recommendations.push("Monitor mood and symptoms");
        recommendations.push("Maintain social connections");
        break;
      case 'low':
        recommendations.push("Continue self-care practices");
        recommendations.push("Monitor for changes in mood");
        recommendations.push("Engage in therapeutic activities");
        break;
    }
    
    return recommendations;
  }

  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config:updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId: string): ConversationContext | null {
    return this.activeConversations.get(sessionId) || null;
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(sessionId: string): void {
    this.activeConversations.delete(sessionId);
    this.emit('conversation:cleared', sessionId);
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string): TherapeuticProfile | null {
    return this.profiles.get(userId) || null;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.activeConversations.clear();
    this.profiles.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const therapeuticAIService = new TherapeuticAIService();
export default therapeuticAIService;
