/**
 * AI Therapy Engine Service
 * 
 * Core AI service for therapeutic interactions, crisis detection,
 * and mental health support using advanced language models
 */

interface TherapySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  messages: TherapyMessage[];
  mood?: {
    before: number;
    after?: number;
  };
  insights: TherapyInsight[];
  riskLevel: CrisisLevel;
  interventions: Intervention[];
  sessionType: 'crisis' | 'general' | 'followup' | 'assessment';
}

interface TherapyMessage {
  id: string;
  role: 'user' | 'therapist' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sentiment?: number;
    riskFlags?: string[];
    interventionTriggers?: string[];
    emotionDetection?: EmotionAnalysis;
  };
}

interface TherapyInsight {
  type: 'pattern' | 'concern' | 'improvement' | 'recommendation';
  content: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

interface Intervention {
  type: 'breathing' | 'grounding' | 'cognitive' | 'emergency' | 'referral';
  title: string;
  description: string;
  instructions: string[];
  duration?: number; // in minutes
  priority: 'low' | 'medium' | 'high' | 'urgent';
  triggered: boolean;
  effectiveness?: number; // 1-10 scale
}

interface EmotionAnalysis {
  primary: string;
  secondary?: string;
  intensity: number; // 0-1 scale
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0-1 scale (calm to excited)
}

type CrisisLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

interface TherapeuticResponse {
  message: string;
  insights: TherapyInsight[];
  interventions: Intervention[];
  riskLevel: CrisisLevel;
  recommendedActions: string[];
  sessionContinuation: boolean;
}

class TherapyEngineService {
  private sessions: Map<string, TherapySession> = new Map();
  private crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm',
    'not worth living', 'better off dead', 'want to die', 'end my life',
    'no way out', 'can\'t go on', 'nobody cares'
  ];
  
  private moderateRiskKeywords = [
    'hopeless', 'worthless', 'overwhelming', 'can\'t cope', 'giving up',
    'trapped', 'desperate', 'burden', 'empty', 'numb'
  ];

  private therapeuticPrompts = {
    general: "You are a compassionate, professional mental health AI assistant. Provide empathetic, evidence-based support while maintaining appropriate boundaries. Focus on validation, coping strategies, and encouraging professional help when needed.",
    crisis: "CRISIS MODE: Prioritize immediate safety. Provide calm, direct support. Encourage immediate professional help or emergency services. Use grounding techniques and safety planning.",
    followup: "Continue previous conversation with awareness of user's history and progress. Check in on previously discussed coping strategies and any recommended actions.",
    assessment: "Conduct a gentle mental health assessment. Ask open-ended questions to understand current state, recent changes, and support needs."
  };

  /**
   * Start a new therapy session
   */
  async startSession(userId: string, sessionType: TherapySession['sessionType'] = 'general'): Promise<string> {
    const sessionId = `session_${Date.now()}_${userId}`;
    
    const session: TherapySession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      messages: [],
      insights: [],
      riskLevel: 'none',
      interventions: [],
      sessionType
    };

    this.sessions.set(sessionId, session);
    
    return sessionId;
  }

  /**
   * Process user message and generate therapeutic response
   */
  async processMessage(sessionId: string, userMessage: string): Promise<TherapeuticResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Analyze user message
    const messageAnalysis = await this.analyzeMessage(userMessage);
    
    // Add user message to session
    const userMsg: TherapyMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      metadata: messageAnalysis
    };
    
    session.messages.push(userMsg);

    // Update session risk level
    session.riskLevel = this.calculateRiskLevel(messageAnalysis, session);

    // Generate therapeutic response
    const response = await this.generateResponse(session, userMessage, messageAnalysis);

    // Add AI response to session
    const aiMsg: TherapyMessage = {
      id: `msg_${Date.now()}_ai`,
      role: 'therapist',
      content: response.message,
      timestamp: new Date()
    };
    
    session.messages.push(aiMsg);

    // Update session with new insights and interventions
    session.insights.push(...response.insights);
    session.interventions.push(...response.interventions);

    return response;
  }

  /**
   * Analyze user message for emotional content and risk factors
   */
  private async analyzeMessage(message: string): Promise<TherapyMessage['metadata']> {
    const lowerMessage = message.toLowerCase();
    
    // Crisis risk detection
    const riskFlags: string[] = [];
    
    this.crisisKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        riskFlags.push(`crisis:${keyword}`);
      }
    });
    
    this.moderateRiskKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        riskFlags.push(`moderate:${keyword}`);
      }
    });

    // Sentiment analysis (simplified)
    const sentiment = this.calculateSentiment(message);
    
    // Emotion detection (simplified)
    const emotionDetection = this.detectEmotions(message);

    // Intervention triggers
    const interventionTriggers: string[] = [];
    if (riskFlags.some(flag => flag.startsWith('crisis'))) {
      interventionTriggers.push('emergency_protocol');
    }
    if (lowerMessage.includes('panic') || lowerMessage.includes('anxiety attack')) {
      interventionTriggers.push('breathing_exercise');
    }
    if (lowerMessage.includes('overwhelmed') || lowerMessage.includes('racing thoughts')) {
      interventionTriggers.push('grounding_technique');
    }

    return {
      sentiment,
      riskFlags,
      interventionTriggers,
      emotionDetection
    };
  }

  /**
   * Calculate sentiment score (-1 to 1)
   */
  private calculateSentiment(message: string): number {
    const positiveWords = ['good', 'better', 'happy', 'grateful', 'hope', 'positive', 'calm', 'peaceful', 'joy'];
    const negativeWords = ['bad', 'worse', 'sad', 'angry', 'hate', 'hopeless', 'terrible', 'awful', 'depressed'];
    
    const words = message.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, score / Math.max(1, words.length / 5)));
  }

  /**
   * Detect emotions in message
   */
  private detectEmotions(message: string): EmotionAnalysis {
    const lowerMessage = message.toLowerCase();
    
    // Simple emotion detection based on keywords
    const emotionKeywords = {
      sadness: ['sad', 'depressed', 'down', 'blue', 'melancholy', 'grief'],
      anxiety: ['anxious', 'worried', 'nervous', 'panic', 'scared', 'afraid'],
      anger: ['angry', 'mad', 'furious', 'rage', 'frustrated', 'annoyed'],
      joy: ['happy', 'joyful', 'excited', 'elated', 'cheerful', 'glad'],
      fear: ['afraid', 'scared', 'terrified', 'frightened', 'fearful'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished'],
      disgust: ['disgusted', 'revolted', 'repulsed', 'sick']
    };
    
    let primaryEmotion = 'neutral';
    let maxScore = 0;
    
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (lowerMessage.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        primaryEmotion = emotion;
      }
    });
    
    // Calculate intensity based on emotional words and punctuation
    const emotionalWords = Object.values(emotionKeywords).flat();
    const emotionCount = emotionalWords.filter(word => lowerMessage.includes(word)).length;
    const exclamationCount = (message.match(/!/g) || []).length;
    const intensity = Math.min(1, (emotionCount + exclamationCount * 0.3) / 5);
    
    // Calculate valence (negative to positive)
    const sentiment = this.calculateSentiment(message);
    const valence = sentiment;
    
    // Calculate arousal (calm to excited)
    const highArousalWords = ['excited', 'panic', 'rage', 'ecstatic', 'terrified'];
    const arousalScore = highArousalWords.filter(word => lowerMessage.includes(word)).length;
    const arousal = Math.min(1, arousalScore / 3 + exclamationCount * 0.2);
    
    return {
      primary: primaryEmotion,
      intensity,
      valence,
      arousal
    };
  }

  /**
   * Calculate overall risk level for session
   */
  private calculateRiskLevel(messageAnalysis: TherapyMessage['metadata'], session: TherapySession): CrisisLevel {
    const riskFlags = messageAnalysis?.riskFlags || [];
    
    // Check for immediate crisis flags
    if (riskFlags.some(flag => flag.startsWith('crisis'))) {
      return 'critical';
    }
    
    // Check recent message history for escalating patterns
    const recentMessages = session.messages.slice(-5);
    const recentRiskFlags = recentMessages.flatMap(msg => msg.metadata?.riskFlags || []);
    
    const moderateRiskCount = recentRiskFlags.filter(flag => flag.startsWith('moderate')).length;
    const sentimentTrend = recentMessages
      .map(msg => msg.metadata?.sentiment || 0)
      .reduce((acc, sentiment, index) => acc + sentiment * (index + 1), 0) / recentMessages.length;
    
    if (moderateRiskCount >= 3 || sentimentTrend < -0.7) {
      return 'high';
    } else if (moderateRiskCount >= 2 || sentimentTrend < -0.5) {
      return 'medium';
    } else if (moderateRiskCount >= 1 || sentimentTrend < -0.3) {
      return 'low';
    }
    
    return 'none';
  }

  /**
   * Generate therapeutic response based on session context
   */
  private async generateResponse(
    session: TherapySession, 
    userMessage: string, 
    analysis: TherapyMessage['metadata']
  ): Promise<TherapeuticResponse> {
    
    const insights: TherapyInsight[] = [];
    const interventions: Intervention[] = [];
    const recommendedActions: string[] = [];
    
    // Generate insights
    if (analysis?.sentiment && analysis.sentiment < -0.5) {
      insights.push({
        type: 'concern',
        content: 'User expressing significant negative emotions',
        confidence: Math.abs(analysis.sentiment),
        priority: analysis.sentiment < -0.8 ? 'high' : 'medium',
        timestamp: new Date()
      });
    }
    
    // Generate interventions based on triggers
    if (analysis?.interventionTriggers?.includes('breathing_exercise')) {
      interventions.push({
        type: 'breathing',
        title: 'Box Breathing Exercise',
        description: 'A calming breathing technique to reduce anxiety',
        instructions: [
          'Breathe in for 4 counts',
          'Hold your breath for 4 counts', 
          'Breathe out for 4 counts',
          'Hold for 4 counts',
          'Repeat 4-6 times'
        ],
        duration: 5,
        priority: 'medium',
        triggered: true
      });
    }
    
    if (analysis?.interventionTriggers?.includes('grounding_technique')) {
      interventions.push({
        type: 'grounding',
        title: '5-4-3-2-1 Grounding Technique',
        description: 'Use your senses to ground yourself in the present moment',
        instructions: [
          'Name 5 things you can see',
          'Name 4 things you can touch',
          'Name 3 things you can hear',
          'Name 2 things you can smell',
          'Name 1 thing you can taste'
        ],
        duration: 3,
        priority: 'medium',
        triggered: true
      });
    }
    
    if (analysis?.interventionTriggers?.includes('emergency_protocol')) {
      interventions.push({
        type: 'emergency',
        title: 'Crisis Safety Plan',
        description: 'Immediate safety resources and support',
        instructions: [
          'If in immediate danger, call 911',
          'National Suicide Prevention Lifeline: 988',
          'Crisis Text Line: Text HOME to 741741',
          'Consider going to your nearest emergency room',
          'Contact a trusted friend or family member'
        ],
        priority: 'urgent',
        triggered: true
      });
      
      recommendedActions.push('immediate_professional_intervention');
    }
    
    // Generate contextual response message
    let message = '';
    const sessionType = session.sessionType;
    const riskLevel = session.riskLevel;
    
    if (riskLevel === 'critical') {
      message = this.generateCrisisResponse(userMessage, analysis);
    } else {
      message = this.generateSupportiveResponse(userMessage, analysis, session);
    }
    
    return {
      message,
      insights,
      interventions,
      riskLevel: session.riskLevel,
      recommendedActions,
      sessionContinuation: riskLevel !== 'critical'
    };
  }

  /**
   * Generate crisis response
   */
  private generateCrisisResponse(userMessage: string, analysis: TherapyMessage['metadata']): string {
    const responses = [
      "I'm very concerned about what you're sharing with me. Your safety is the most important thing right now. Please consider reaching out to a crisis counselor immediately - you can call 988 for the Suicide & Crisis Lifeline or text HOME to 741741.",
      
      "Thank you for sharing something so difficult with me. I want you to know that you're not alone, and there are people who want to help you through this. Right now, I'm worried about your safety. Can you please reach out to a crisis helpline or emergency services?",
      
      "I hear that you're in a lot of pain right now. Crisis situations can feel overwhelming, but there is help available. Please contact 988 (Suicide & Crisis Lifeline) or 911 if you're in immediate danger. You deserve support during this difficult time."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate supportive therapeutic response
   */
  private generateSupportiveResponse(
    userMessage: string, 
    analysis: TherapyMessage['metadata'], 
    session: TherapySession
  ): string {
    
    const emotion = analysis?.emotionDetection?.primary || 'neutral';
    const sentiment = analysis?.sentiment || 0;
    
    // Validation and reflection
    let response = '';
    
    if (sentiment < -0.5) {
      response += "I can hear that you're going through a really difficult time. Those feelings you're experiencing are valid, and it's understandable that you're struggling. ";
    } else if (sentiment > 0.3) {
      response += "I'm glad to hear some positive feelings in what you're sharing. It's wonderful that you're able to recognize these moments. ";
    } else {
      response += "Thank you for sharing that with me. I appreciate your openness in talking about what's on your mind. ";
    }
    
    // Emotion-specific responses
    switch (emotion) {
      case 'sadness':
        response += "Sadness can feel very heavy and overwhelming. It's okay to sit with these feelings while also taking care of yourself. ";
        break;
      case 'anxiety':
        response += "Anxiety can make everything feel more intense and uncertain. Remember that anxiety is your mind trying to protect you, even when it feels uncomfortable. ";
        break;
      case 'anger':
        response += "Anger is often a signal that something important to you has been threatened or hurt. It's a valid emotion, and finding healthy ways to express it can be helpful. ";
        break;
      case 'fear':
        response += "Fear can be paralyzing, but it's also your body's way of trying to keep you safe. You're brave for facing these feelings and talking about them. ";
        break;
    }
    
    // Coping suggestions
    if (analysis?.riskFlags?.length) {
      response += "Have you been able to use any coping strategies that have helped you before? Sometimes when we're struggling, it can help to focus on small, manageable steps we can take to care for ourselves.";
    } else {
      response += "What has been most helpful for you during challenging times in the past? Sometimes reflecting on our strengths and resources can provide guidance for moving forward.";
    }
    
    return response;
  }

  /**
   * End therapy session
   */
  async endSession(sessionId: string): Promise<TherapySession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    session.endTime = new Date();
    
    // Generate session summary insights
    const summaryInsight: TherapyInsight = {
      type: 'pattern',
      content: this.generateSessionSummary(session),
      confidence: 0.8,
      priority: 'medium',
      timestamp: new Date()
    };
    
    session.insights.push(summaryInsight);
    
    return session;
  }

  /**
   * Generate session summary
   */
  private generateSessionSummary(session: TherapySession): string {
    const messageCount = session.messages.length;
    const avgSentiment = session.messages
      .filter(msg => msg.metadata?.sentiment)
      .reduce((acc, msg) => acc + (msg.metadata?.sentiment || 0), 0) / messageCount;
    
    const riskFlags = session.messages.flatMap(msg => msg.metadata?.riskFlags || []);
    const interventions = session.interventions.length;
    
    return `Session completed with ${messageCount} exchanges. Average sentiment: ${avgSentiment.toFixed(2)}. Risk level: ${session.riskLevel}. ${interventions} interventions provided. ${riskFlags.length} risk factors detected.`;
  }

  /**
   * Get session history
   */
  getSession(sessionId: string): TherapySession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get user's session history
   */
  getUserSessions(userId: string): TherapySession[] {
    return Array.from(this.sessions.values()).filter(session => session.userId === userId);
  }
}

// Export singleton instance
export const therapyEngine = new TherapyEngineService();
export default therapyEngine;

