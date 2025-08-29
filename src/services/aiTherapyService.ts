/**
 * AI Therapy Service
 * 
 * Advanced AI therapy service with GPT-4 integration, crisis detection,
 * therapeutic patterns, and comprehensive session management.
 */

import { EventEmitter } from 'events';
import { crisisService } from './api/crisisService';

// ============================
// Type Definitions
// ============================

export interface AITherapySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'ended' | 'crisis_escalated';
  type: 'general' | 'cbt' | 'dbt' | 'mindfulness' | 'crisis' | 'assessment';
  messages: AITherapyMessage[];
  insights: SessionInsight[];
  interventions: TherapeuticIntervention[];
  riskAssessment: RiskAssessment;
  therapeuticAlliance: TherapeuticAlliance;
  sessionNotes?: SessionNotes;
  metadata: SessionMetadata;
}

export interface AITherapyMessage {
  id: string;
  role: 'user' | 'therapist' | 'system';
  content: string;
  timestamp: Date;
  analysis?: MessageAnalysis;
  suggestedResponses?: string[];
  interventionTriggers?: string[];
}

export interface MessageAnalysis {
  sentiment: number; // -1 to 1
  emotions: EmotionProfile;
  riskIndicators: RiskIndicator[];
  therapeuticThemes: string[];
  cognitiveDistortions?: CognitiveDistortion[];
  copingMechanisms?: string[];
  languagePatterns: LanguagePattern[];
}

export interface EmotionProfile {
  primary: Emotion;
  secondary?: Emotion;
  intensity: number; // 0-1
  valence: number; // -1 to 1
  arousal: number; // 0-1
  confidence: number; // 0-1
}

export interface Emotion {
  name: string;
  score: number;
  category: 'positive' | 'negative' | 'neutral';
}

export interface RiskIndicator {
  type: 'suicide' | 'self_harm' | 'violence' | 'substance' | 'crisis' | 'deterioration';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  keywords: string[];
  context: string;
}

export interface CognitiveDistortion {
  type: 'all_or_nothing' | 'overgeneralization' | 'mental_filter' | 'disqualifying_positive' | 
        'jumping_conclusions' | 'magnification' | 'emotional_reasoning' | 'should_statements' | 
        'labeling' | 'personalization' | 'catastrophizing';
  example: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface LanguagePattern {
  pattern: 'absolutist' | 'negative_self_talk' | 'rumination' | 'hopelessness' | 
          'positive_coping' | 'help_seeking' | 'future_orientation' | 'social_connection';
  frequency: number;
  examples: string[];
}

export interface SessionInsight {
  id: string;
  type: 'pattern' | 'progress' | 'concern' | 'strength' | 'recommendation';
  content: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  actionable: boolean;
  relatedMessages?: string[];
}

export interface TherapeuticIntervention {
  id: string;
  type: 'psychoeducation' | 'coping_skill' | 'grounding' | 'breathing' | 'cognitive_restructuring' | 
        'behavioral_activation' | 'mindfulness' | 'crisis_support' | 'safety_planning';
  name: string;
  description: string;
  instructions?: string[];
  duration?: number; // minutes
  effectiveness?: number; // 0-10 scale
  userEngagement?: 'low' | 'medium' | 'high';
  timestamp: Date;
  completed: boolean;
}

export interface RiskAssessment {
  overallRisk: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
  suicideRisk: RiskLevel;
  selfHarmRisk: RiskLevel;
  violenceRisk: RiskLevel;
  substanceRisk: RiskLevel;
  lastAssessed: Date;
  protectiveFactors: string[];
  riskFactors: string[];
  immediateActionRequired: boolean;
  recommendedActions: string[];
}

export interface RiskLevel {
  level: 'none' | 'low' | 'moderate' | 'high' | 'imminent';
  confidence: number;
  indicators: string[];
  lastElevated?: Date;
}

export interface TherapeuticAlliance {
  rapport: number; // 0-10
  engagement: number; // 0-10
  collaboration: number; // 0-10
  trust: number; // 0-10
  lastMeasured: Date;
}

export interface SessionNotes {
  subjective: string; // What the client reported
  objective: string; // Observable behaviors and facts
  assessment: string; // Clinical assessment
  plan: string; // Treatment plan
  additionalNotes?: string;
  exportFormat?: 'soap' | 'dap' | 'birp' | 'girp';
}

export interface SessionMetadata {
  platform: 'web' | 'mobile' | 'tablet';
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  interruptions: number;
  therapeuticApproach: string[];
  techniques: string[];
  homework?: string[];
  followUpRequired: boolean;
  nextSessionRecommended?: Date;
}

export interface GPT4Config {
  apiKey: string;
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-4o';
  temperature: number; // 0-1
  maxTokens: number;
  systemPrompt: string;
  safetyMode: boolean;
  contextWindow: number;
}

export interface TherapeuticResponse {
  message: string;
  type: 'empathetic' | 'exploratory' | 'psychoeducational' | 'directive' | 'crisis';
  suggestedFollowUps: string[];
  interventions?: TherapeuticIntervention[];
  riskUpdate?: Partial<RiskAssessment>;
  sessionUpdate?: Partial<AITherapySession>;
}

// ============================
// Therapeutic Prompts & Patterns
// ============================

const THERAPEUTIC_PROMPTS = {
  general: `You are an experienced, compassionate AI therapist trained in evidence-based therapeutic approaches. Your role is to:
- Provide empathetic, non-judgmental support
- Use active listening and reflection techniques
- Ask open-ended questions to explore thoughts and feelings
- Identify patterns and gently challenge cognitive distortions
- Suggest evidence-based coping strategies when appropriate
- Maintain professional boundaries
- Recognize crisis situations and respond appropriately
- Encourage professional help when needed

Remember: You are a support tool, not a replacement for professional therapy. Always prioritize user safety.`,

  cbt: `You are an AI therapist specializing in Cognitive Behavioral Therapy (CBT). Focus on:
- Identifying negative thought patterns and cognitive distortions
- Exploring the connection between thoughts, feelings, and behaviors
- Using Socratic questioning to challenge unhelpful beliefs
- Teaching cognitive restructuring techniques
- Assigning behavioral experiments and homework
- Developing balanced, evidence-based thinking
- Creating thought records and behavioral activation plans`,

  dbt: `You are an AI therapist trained in Dialectical Behavior Therapy (DBT). Emphasize:
- Balancing acceptance and change
- Teaching distress tolerance skills (TIPP, ACCEPTS, IMPROVE)
- Emotion regulation techniques
- Interpersonal effectiveness skills (DEARMAN, GIVE, FAST)
- Mindfulness and radical acceptance
- Validating emotions while encouraging skillful responses
- Managing crisis situations with DBT-specific protocols`,

  mindfulness: `You are an AI therapist specializing in mindfulness-based approaches. Focus on:
- Present-moment awareness
- Non-judgmental observation of thoughts and feelings
- Body scan and breathing exercises
- Mindful meditation techniques
- Acceptance and letting go
- Reducing rumination and worry through mindfulness
- Integrating mindfulness into daily activities`,

  crisis: `CRISIS MODE ACTIVE. You are responding to someone in acute distress. Your priorities are:
1. Ensure immediate safety
2. Provide calm, direct support
3. Use grounding techniques
4. Encourage professional help or emergency services if needed
5. Create a safety plan
6. Stay with them until the crisis passes or help arrives
7. Use simple, clear language
8. Avoid complex therapeutic techniques

If there's any indication of immediate danger, strongly encourage calling 988 (Suicide & Crisis Lifeline) or 911.`
};

const CRISIS_KEYWORDS = {
  imminent: [
    'kill myself', 'end my life', 'suicide plan', 'suicide method', 'goodbye forever',
    'last day', 'final decision', 'no way out', 'can\'t go on', 'better off dead',
    'loaded gun', 'overdose', 'jump off', 'hang myself', 'cut wrists'
  ],
  high: [
    'want to die', 'wish I was dead', 'suicidal thoughts', 'self harm', 'hurt myself',
    'cutting', 'burning myself', 'not worth living', 'everyone better without me',
    'no hope', 'give up', 'can\'t take it anymore'
  ],
  moderate: [
    'hopeless', 'worthless', 'trapped', 'no future', 'burden to everyone',
    'hate myself', 'failure', 'empty inside', 'numb', 'don\'t care anymore',
    'what\'s the point', 'meaningless', 'alone forever'
  ]
};

// ============================
// AI Therapy Service Class
// ============================

export class AITherapyService extends EventEmitter {
  private sessions: Map<string, AITherapySession> = new Map();
  private config: GPT4Config;
  private activeConnections: Map<string, WebSocket> = new Map();
  private sessionHistories: Map<string, AITherapyMessage[]> = new Map();
  
  constructor(config: Partial<GPT4Config> = {}) {
    super();
    
    this.config = {
      apiKey: process.env.VITE_OPENAI_API_KEY || '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
      systemPrompt: THERAPEUTIC_PROMPTS.general,
      safetyMode: true,
      contextWindow: 10,
      ...config
    };
    
    this.initializeService();
  }
  
  private initializeService(): void {
    // Set up periodic session cleanup
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 30 * 60 * 1000); // Every 30 minutes
  }
  
  /**
   * Start a new therapy session
   */
  async startSession(
    userId: string,
    sessionType: AITherapySession['type'] = 'general'
  ): Promise<AITherapySession> {
    const sessionId = this.generateSessionId();
    
    const session: AITherapySession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      status: 'active',
      type: sessionType,
      messages: [],
      insights: [],
      interventions: [],
      riskAssessment: this.initializeRiskAssessment(),
      therapeuticAlliance: this.initializeTherapeuticAlliance(),
      metadata: {
        platform: this.detectPlatform(),
        connectionQuality: 'good',
        interruptions: 0,
        therapeuticApproach: [sessionType],
        techniques: [],
        followUpRequired: false
      }
    };
    
    // Add welcome message
    const welcomeMessage = await this.generateWelcomeMessage(sessionType);
    session.messages.push(welcomeMessage);
    
    this.sessions.set(sessionId, session);
    this.sessionHistories.set(sessionId, []);
    
    this.emit('session:started', session);
    
    return session;
  }
  
  /**
   * Process a user message and generate therapeutic response
   */
  async processMessage(
    sessionId: string,
    content: string
  ): Promise<TherapeuticResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Perform comprehensive message analysis
    const analysis = await this.analyzeMessage(content, session);
    
    // Create user message
    const userMessage: AITherapyMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date(),
      analysis,
      interventionTriggers: this.identifyInterventionTriggers(analysis)
    };
    
    session.messages.push(userMessage);
    
    // Check for crisis situations
    const crisisCheck = await this.performCrisisCheck(content, analysis, session);
    if (crisisCheck.requiresIntervention) {
      return this.handleCrisisIntervention(session, crisisCheck);
    }
    
    // Update risk assessment
    session.riskAssessment = this.updateRiskAssessment(
      session.riskAssessment,
      analysis
    );
    
    // Generate therapeutic response
    const response = await this.generateTherapeuticResponse(
      session,
      userMessage,
      analysis
    );
    
    // Add therapist message to session
    const therapistMessage: AITherapyMessage = {
      id: this.generateMessageId(),
      role: 'therapist',
      content: response.message,
      timestamp: new Date(),
      suggestedResponses: response.suggestedFollowUps
    };
    
    session.messages.push(therapistMessage);
    
    // Update session insights
    const insights = this.generateSessionInsights(session, analysis);
    session.insights.push(...insights);
    
    // Update therapeutic alliance
    session.therapeuticAlliance = this.updateTherapeuticAlliance(
      session.therapeuticAlliance,
      userMessage,
      therapistMessage
    );
    
    // Track interventions
    if (response.interventions) {
      session.interventions.push(...response.interventions);
    }
    
    this.emit('message:processed', { session, userMessage, response });
    
    return response;
  }
  
  /**
   * Analyze message for therapeutic indicators
   */
  private async analyzeMessage(
    content: string,
    session: AITherapySession
  ): Promise<MessageAnalysis> {
    // Perform sentiment analysis
    const sentiment = this.analyzeSentiment(content);
    
    // Detect emotions
    const emotions = this.detectEmotions(content);
    
    // Identify risk indicators
    const riskIndicators = this.identifyRiskIndicators(content);
    
    // Detect therapeutic themes
    const therapeuticThemes = this.detectTherapeuticThemes(content, session);
    
    // Identify cognitive distortions
    const cognitiveDistortions = this.identifyCognitiveDistortions(content);
    
    // Detect coping mechanisms
    const copingMechanisms = this.detectCopingMechanisms(content);
    
    // Analyze language patterns
    const languagePatterns = this.analyzeLanguagePatterns(content);
    
    return {
      sentiment,
      emotions,
      riskIndicators,
      therapeuticThemes,
      cognitiveDistortions,
      copingMechanisms,
      languagePatterns
    };
  }
  
  /**
   * Analyze sentiment of message
   */
  private analyzeSentiment(content: string): number {
    const positiveWords = [
      'good', 'great', 'happy', 'joy', 'love', 'hope', 'grateful', 'blessed',
      'wonderful', 'amazing', 'positive', 'better', 'improving', 'progress'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'hate', 'angry', 'sad', 'depressed', 'anxious',
      'worried', 'scared', 'hopeless', 'worthless', 'failure', 'pain'
    ];
    
    const words = content.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, score / Math.max(1, words.length / 10)));
  }
  
  /**
   * Detect emotions in message
   */
  private detectEmotions(content: string): EmotionProfile {
    const emotionKeywords = {
      joy: ['happy', 'joyful', 'excited', 'elated', 'cheerful', 'delighted'],
      sadness: ['sad', 'depressed', 'down', 'blue', 'melancholy', 'grief', 'sorrow'],
      anger: ['angry', 'mad', 'furious', 'rage', 'frustrated', 'irritated', 'annoyed'],
      fear: ['afraid', 'scared', 'terrified', 'anxious', 'worried', 'nervous', 'panic'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned'],
      disgust: ['disgusted', 'revolted', 'repulsed', 'sick', 'nauseated'],
      shame: ['ashamed', 'embarrassed', 'humiliated', 'guilty', 'remorseful']
    };
    
    const lowerContent = content.toLowerCase();
    const detectedEmotions: Array<{name: string, score: number, category: 'positive' | 'negative' | 'neutral'}> = [];
    
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (lowerContent.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > 0) {
        const category = ['joy', 'surprise'].includes(emotion) ? 'positive' :
                        ['sadness', 'anger', 'fear', 'disgust', 'shame'].includes(emotion) ? 'negative' :
                        'neutral';
        detectedEmotions.push({ name: emotion, score, category });
      }
    });
    
    // Sort by score and get primary/secondary
    detectedEmotions.sort((a, b) => b.score - a.score);
    const primary = detectedEmotions[0] || { name: 'neutral', score: 0, category: 'neutral' };
    const secondary = detectedEmotions[1];
    
    // Calculate emotional metrics
    const intensity = Math.min(1, (primary.score + (secondary?.score || 0)) / 5);
    const valence = this.analyzeSentiment(content);
    const arousal = this.calculateArousal(content);
    
    return {
      primary,
      secondary,
      intensity,
      valence,
      arousal,
      confidence: Math.min(1, primary.score / 3)
    };
  }
  
  /**
   * Calculate emotional arousal level
   */
  private calculateArousal(content: string): number {
    const highArousalIndicators = [
      /!+/g, // Exclamation marks
      /\b(VERY|EXTREMELY|TOTALLY|ABSOLUTELY|COMPLETELY)\b/gi,
      /\b(panic|emergency|urgent|crisis|desperate)\b/gi
    ];
    
    let arousalScore = 0;
    highArousalIndicators.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) arousalScore += matches.length;
    });
    
    return Math.min(1, arousalScore / 5);
  }
  
  /**
   * Identify risk indicators in message
   */
  private identifyRiskIndicators(content: string): RiskIndicator[] {
    const indicators: RiskIndicator[] = [];
    const lowerContent = content.toLowerCase();
    
    // Check for suicide risk
    const suicideKeywords = CRISIS_KEYWORDS.imminent.concat(CRISIS_KEYWORDS.high);
    const foundSuicideKeywords = suicideKeywords.filter(kw => lowerContent.includes(kw));
    
    if (foundSuicideKeywords.length > 0) {
      const severity = CRISIS_KEYWORDS.imminent.some(kw => lowerContent.includes(kw)) ? 'critical' :
                      CRISIS_KEYWORDS.high.some(kw => lowerContent.includes(kw)) ? 'high' :
                      'moderate';
      
      indicators.push({
        type: 'suicide',
        severity,
        confidence: Math.min(1, foundSuicideKeywords.length / 3),
        keywords: foundSuicideKeywords,
        context: content.substring(0, 200)
      });
    }
    
    // Check for self-harm risk
    const selfHarmKeywords = ['cut', 'cutting', 'burn', 'hurt myself', 'self harm', 'self-harm'];
    const foundSelfHarmKeywords = selfHarmKeywords.filter(kw => lowerContent.includes(kw));
    
    if (foundSelfHarmKeywords.length > 0) {
      indicators.push({
        type: 'self_harm',
        severity: foundSelfHarmKeywords.length > 2 ? 'high' : 'moderate',
        confidence: Math.min(1, foundSelfHarmKeywords.length / 2),
        keywords: foundSelfHarmKeywords,
        context: content.substring(0, 200)
      });
    }
    
    // Check for violence risk
    const violenceKeywords = ['kill', 'hurt someone', 'attack', 'revenge', 'make them pay'];
    const foundViolenceKeywords = violenceKeywords.filter(kw => lowerContent.includes(kw));
    
    if (foundViolenceKeywords.length > 0) {
      indicators.push({
        type: 'violence',
        severity: 'high',
        confidence: Math.min(1, foundViolenceKeywords.length / 2),
        keywords: foundViolenceKeywords,
        context: content.substring(0, 200)
      });
    }
    
    // Check for substance risk
    const substanceKeywords = ['drunk', 'high', 'overdose', 'pills', 'drugs', 'alcohol problem'];
    const foundSubstanceKeywords = substanceKeywords.filter(kw => lowerContent.includes(kw));
    
    if (foundSubstanceKeywords.length > 0) {
      indicators.push({
        type: 'substance',
        severity: lowerContent.includes('overdose') ? 'critical' : 'moderate',
        confidence: Math.min(1, foundSubstanceKeywords.length / 2),
        keywords: foundSubstanceKeywords,
        context: content.substring(0, 200)
      });
    }
    
    return indicators;
  }
  
  /**
   * Detect therapeutic themes in conversation
   */
  private detectTherapeuticThemes(content: string, session: AITherapySession): string[] {
    const themes: string[] = [];
    const lowerContent = content.toLowerCase();
    
    const themePatterns = {
      'relationships': ['relationship', 'partner', 'spouse', 'family', 'friend', 'lonely'],
      'work_stress': ['work', 'job', 'boss', 'career', 'stress', 'pressure'],
      'self_esteem': ['worthless', 'failure', 'not good enough', 'hate myself', 'ugly'],
      'trauma': ['trauma', 'abuse', 'assault', 'ptsd', 'flashback', 'nightmare'],
      'grief': ['loss', 'death', 'died', 'grief', 'mourning', 'miss them'],
      'anxiety': ['anxious', 'worry', 'panic', 'nervous', 'scared', 'fear'],
      'depression': ['depressed', 'sad', 'hopeless', 'empty', 'numb', 'meaningless'],
      'identity': ['who am i', 'confused', 'lost', 'don\'t know', 'identity', 'purpose']
    };
    
    Object.entries(themePatterns).forEach(([theme, keywords]) => {
      if (keywords.some(kw => lowerContent.includes(kw))) {
        themes.push(theme);
      }
    });
    
    return themes;
  }
  
  /**
   * Identify cognitive distortions
   */
  private identifyCognitiveDistortions(content: string): CognitiveDistortion[] {
    const distortions: CognitiveDistortion[] = [];
    const lowerContent = content.toLowerCase();
    
    const distortionPatterns = {
      'all_or_nothing': {
        patterns: ['always', 'never', 'every', 'nothing', 'completely', 'totally'],
        example: 'I always fail at everything'
      },
      'overgeneralization': {
        patterns: ['everyone', 'no one', 'all', 'none', 'everywhere'],
        example: 'Everyone hates me'
      },
      'catastrophizing': {
        patterns: ['worst', 'terrible', 'disaster', 'awful', 'nightmare', 'end of the world'],
        example: 'This is the worst thing that could happen'
      },
      'personalization': {
        patterns: ['my fault', 'blame myself', 'because of me', 'i caused'],
        example: 'It\'s all my fault'
      },
      'should_statements': {
        patterns: ['should', 'must', 'ought to', 'have to', 'supposed to'],
        example: 'I should be better than this'
      }
    };
    
    Object.entries(distortionPatterns).forEach(([type, config]) => {
      const found = config.patterns.some(pattern => lowerContent.includes(pattern));
      if (found) {
        distortions.push({
          type: type as CognitiveDistortion['type'],
          example: config.example,
          severity: 'moderate'
        });
      }
    });
    
    return distortions;
  }
  
  /**
   * Detect coping mechanisms mentioned
   */
  private detectCopingMechanisms(content: string): string[] {
    const mechanisms: string[] = [];
    const lowerContent = content.toLowerCase();
    
    const copingPatterns = {
      'exercise': ['exercise', 'workout', 'gym', 'running', 'yoga', 'walk'],
      'meditation': ['meditate', 'meditation', 'mindfulness', 'breathing'],
      'social_support': ['talk to', 'friend', 'family', 'support', 'help'],
      'creative': ['music', 'art', 'writing', 'drawing', 'creative'],
      'distraction': ['distract', 'busy', 'activity', 'hobby'],
      'professional_help': ['therapist', 'counselor', 'doctor', 'medication'],
      'self_care': ['self-care', 'bath', 'relax', 'rest', 'sleep']
    };
    
    Object.entries(copingPatterns).forEach(([mechanism, keywords]) => {
      if (keywords.some(kw => lowerContent.includes(kw))) {
        mechanisms.push(mechanism);
      }
    });
    
    return mechanisms;
  }
  
  /**
   * Analyze language patterns
   */
  private analyzeLanguagePatterns(content: string): LanguagePattern[] {
    const patterns: LanguagePattern[] = [];
    const lowerContent = content.toLowerCase();
    const sentences = content.split(/[.!?]+/);
    
    // Absolutist thinking
    const absolutistWords = ['always', 'never', 'completely', 'totally', 'everyone', 'no one'];
    const absolutistCount = absolutistWords.filter(word => lowerContent.includes(word)).length;
    if (absolutistCount > 0) {
      patterns.push({
        pattern: 'absolutist',
        frequency: absolutistCount / sentences.length,
        examples: absolutistWords.filter(word => lowerContent.includes(word))
      });
    }
    
    // Negative self-talk
    const negativeSelfPhrases = ['i\'m worthless', 'i\'m a failure', 'i hate myself', 'i\'m stupid'];
    const negativeSelfCount = negativeSelfPhrases.filter(phrase => lowerContent.includes(phrase)).length;
    if (negativeSelfCount > 0) {
      patterns.push({
        pattern: 'negative_self_talk',
        frequency: negativeSelfCount / sentences.length,
        examples: negativeSelfPhrases.filter(phrase => lowerContent.includes(phrase))
      });
    }
    
    // Rumination
    const ruminationIndicators = ['keep thinking', 'can\'t stop', 'over and over', 'stuck in my head'];
    const ruminationCount = ruminationIndicators.filter(phrase => lowerContent.includes(phrase)).length;
    if (ruminationCount > 0) {
      patterns.push({
        pattern: 'rumination',
        frequency: ruminationCount / sentences.length,
        examples: ruminationIndicators.filter(phrase => lowerContent.includes(phrase))
      });
    }
    
    // Hopelessness
    const hopelessPhrases = ['no hope', 'hopeless', 'pointless', 'give up', 'no future'];
    const hopelessCount = hopelessPhrases.filter(phrase => lowerContent.includes(phrase)).length;
    if (hopelessCount > 0) {
      patterns.push({
        pattern: 'hopelessness',
        frequency: hopelessCount / sentences.length,
        examples: hopelessPhrases.filter(phrase => lowerContent.includes(phrase))
      });
    }
    
    // Positive coping
    const positiveCopingPhrases = ['i can', 'i will try', 'getting better', 'making progress'];
    const positiveCopingCount = positiveCopingPhrases.filter(phrase => lowerContent.includes(phrase)).length;
    if (positiveCopingCount > 0) {
      patterns.push({
        pattern: 'positive_coping',
        frequency: positiveCopingCount / sentences.length,
        examples: positiveCopingPhrases.filter(phrase => lowerContent.includes(phrase))
      });
    }
    
    return patterns;
  }
  
  /**
   * Identify intervention triggers
   */
  private identifyInterventionTriggers(analysis: MessageAnalysis): string[] {
    const triggers: string[] = [];
    
    // Check risk indicators
    if (analysis.riskIndicators.some(r => r.severity === 'critical')) {
      triggers.push('crisis_protocol');
    }
    
    if (analysis.riskIndicators.some(r => r.type === 'suicide')) {
      triggers.push('safety_planning');
    }
    
    // Check emotional state
    if (analysis.emotions.arousal > 0.8) {
      triggers.push('grounding_exercise');
    }
    
    if (analysis.emotions.primary.name === 'fear' && analysis.emotions.intensity > 0.7) {
      triggers.push('breathing_exercise');
    }
    
    // Check cognitive patterns
    if (analysis.cognitiveDistortions && analysis.cognitiveDistortions.length > 2) {
      triggers.push('cognitive_restructuring');
    }
    
    // Check language patterns
    if (analysis.languagePatterns.some(p => p.pattern === 'rumination' && p.frequency > 0.3)) {
      triggers.push('mindfulness_exercise');
    }
    
    return triggers;
  }
  
  /**
   * Perform crisis check
   */
  private async performCrisisCheck(
    content: string,
    analysis: MessageAnalysis,
    session: AITherapySession
  ): Promise<{ requiresIntervention: boolean; severity?: string; type?: string }> {
    // Check for critical risk indicators
    const criticalRisk = analysis.riskIndicators.find(r => r.severity === 'critical');
    if (criticalRisk) {
      // Report to crisis service
      await crisisService.reportCrisis({
        userId: session.userId,
        type: 'detection',
        severity: 'critical',
        triggerContent: content,
        triggerSource: 'chat',
        metadata: {
          confidence: criticalRisk.confidence,
          riskFactors: criticalRisk.keywords,
          protectiveFactors: [],
          interventionsTriggered: ['ai_therapy_crisis_detection'],
          emergencyContactsNotified: [],
          resourcesProvided: [],
          followUpRequired: true
        }
      });
      
      return {
        requiresIntervention: true,
        severity: 'critical',
        type: criticalRisk.type
      };
    }
    
    // Check for high risk
    const highRisk = analysis.riskIndicators.find(r => r.severity === 'high');
    if (highRisk) {
      return {
        requiresIntervention: true,
        severity: 'high',
        type: highRisk.type
      };
    }
    
    return { requiresIntervention: false };
  }
  
  /**
   * Handle crisis intervention
   */
  private async handleCrisisIntervention(
    session: AITherapySession,
    crisisCheck: { severity?: string; type?: string }
  ): Promise<TherapeuticResponse> {
    session.status = 'crisis_escalated';
    
    // Switch to crisis mode
    this.config.systemPrompt = THERAPEUTIC_PROMPTS.crisis;
    
    // Generate crisis response
    const crisisMessage = this.generateCrisisResponse(crisisCheck.severity!, crisisCheck.type!);
    
    // Create crisis interventions
    const interventions: TherapeuticIntervention[] = [
      {
        id: this.generateInterventionId(),
        type: 'crisis_support',
        name: 'Crisis Support Protocol',
        description: 'Immediate crisis intervention and safety resources',
        instructions: [
          'Call 988 for the Suicide & Crisis Lifeline',
          'Text HOME to 741741 for Crisis Text Line',
          'If in immediate danger, call 911',
          'Reach out to a trusted friend or family member',
          'Go to your nearest emergency room if needed'
        ],
        timestamp: new Date(),
        completed: false
      }
    ];
    
    // Add safety planning if suicide risk
    if (crisisCheck.type === 'suicide') {
      interventions.push({
        id: this.generateInterventionId(),
        type: 'safety_planning',
        name: 'Safety Plan Development',
        description: 'Create a personalized safety plan',
        instructions: [
          'Identify warning signs',
          'Use internal coping strategies',
          'Reach out to social contacts',
          'Contact family or friends who can help',
          'Contact mental health professionals',
          'Make environment safe'
        ],
        timestamp: new Date(),
        completed: false
      });
    }
    
    return {
      message: crisisMessage,
      type: 'crisis',
      suggestedFollowUps: [
        'Are you safe right now?',
        'Can you tell me where you are?',
        'Is there someone with you or someone you can call?'
      ],
      interventions,
      riskUpdate: {
        overallRisk: 'critical',
        immediateActionRequired: true,
        recommendedActions: ['immediate_professional_help', 'crisis_hotline', 'emergency_services']
      }
    };
  }
  
  /**
   * Generate crisis response message
   */
  private generateCrisisResponse(severity: string, type: string): string {
    const responses: { [key: string]: string } = {
      suicide_critical: `I'm very concerned about what you're sharing. Your life has value and this pain you're feeling can get better with help. 

Please reach out for immediate support:
• Call 988 for the Suicide & Crisis Lifeline
• Text HOME to 741741 for Crisis Text Line
• Call 911 if you're in immediate danger

You don't have to go through this alone. There are people who want to help you through this crisis.`,

      suicide_high: `I can hear that you're in tremendous pain right now. These thoughts you're having are a sign that you need and deserve immediate support.

Please consider reaching out:
• Call 988 to speak with a crisis counselor
• Text HOME to 741741 for text support
• Contact your therapist or doctor
• Reach out to someone you trust

Your life matters, and there is help available.`,

      self_harm: `I'm concerned about your safety and wellbeing. Self-harm might provide temporary relief, but there are healthier ways to cope with these intense feelings.

For immediate support:
• Call 988 for crisis support
• Text HOME to 741741
• Try the TIPP technique: Temperature change, Intense exercise, Paced breathing, Paired muscle relaxation

Would you like to explore some safer alternatives to manage these feelings?`,

      violence: `I understand you're feeling intense anger and hurt. These feelings are valid, but it's important to find safe ways to express them that don't harm you or others.

If you're having thoughts of hurting someone:
• Remove yourself from the situation if possible
• Call 988 to talk through these feelings
• Use grounding techniques to calm down
• Consider calling 911 if you feel you might act on these thoughts

Let's work together to find a safe way forward.`,

      substance: `I'm concerned about what you've shared regarding substance use. This is a sign that you're struggling and need support.

For immediate help:
• SAMHSA National Helpline: 1-800-662-4357
• Call 988 for crisis support
• If you've overdosed or are at risk, call 911 immediately
• Reach out to a trusted friend or family member

You deserve support and recovery is possible.`
    };
    
    const key = `${type}_${severity}`;
    return responses[key] || responses.suicide_high;
  }
  
  /**
   * Update risk assessment based on analysis
   */
  private updateRiskAssessment(
    current: RiskAssessment,
    analysis: MessageAnalysis
  ): RiskAssessment {
    const updated = { ...current };
    updated.lastAssessed = new Date();
    
    // Update specific risk levels based on indicators
    analysis.riskIndicators.forEach(indicator => {
      const riskType = `${indicator.type}Risk` as keyof RiskAssessment;
      if (riskType in updated) {
        const riskLevel = updated[riskType] as RiskLevel;
        riskLevel.level = this.mapSeverityToLevel(indicator.severity);
        riskLevel.confidence = indicator.confidence;
        riskLevel.indicators = indicator.keywords;
        if (indicator.severity !== 'low') {
          riskLevel.lastElevated = new Date();
        }
      }
    });
    
    // Calculate overall risk
    const riskLevels = [
      updated.suicideRisk.level,
      updated.selfHarmRisk.level,
      updated.violenceRisk.level,
      updated.substanceRisk.level
    ];
    
    if (riskLevels.includes('imminent')) {
      updated.overallRisk = 'critical';
      updated.immediateActionRequired = true;
    } else if (riskLevels.includes('high')) {
      updated.overallRisk = 'high';
      updated.immediateActionRequired = true;
    } else if (riskLevels.includes('moderate')) {
      updated.overallRisk = 'moderate';
    } else if (riskLevels.includes('low')) {
      updated.overallRisk = 'low';
    } else {
      updated.overallRisk = 'minimal';
    }
    
    // Update risk and protective factors
    if (analysis.languagePatterns.some(p => p.pattern === 'hopelessness')) {
      updated.riskFactors.push('hopelessness');
    }
    
    if (analysis.copingMechanisms && analysis.copingMechanisms.length > 0) {
      updated.protectiveFactors.push(...analysis.copingMechanisms);
    }
    
    return updated;
  }
  
  /**
   * Map severity to risk level
   */
  private mapSeverityToLevel(severity: string): RiskLevel['level'] {
    const mapping: { [key: string]: RiskLevel['level'] } = {
      'critical': 'imminent',
      'high': 'high',
      'moderate': 'moderate',
      'low': 'low'
    };
    return mapping[severity] || 'none';
  }
  
  /**
   * Generate therapeutic response using GPT-4
   */
  private async generateTherapeuticResponse(
    session: AITherapySession,
    userMessage: AITherapyMessage,
    analysis: MessageAnalysis
  ): Promise<TherapeuticResponse> {
    // Build context from recent messages
    const recentMessages = session.messages.slice(-this.config.contextWindow);
    const context = this.buildConversationContext(recentMessages);
    
    // Determine response type based on analysis
    const responseType = this.determineResponseType(analysis, session);
    
    // Generate response using GPT-4 (or fallback)
    let aiResponse: string;
    
    try {
      aiResponse = await this.callGPT4(context, userMessage.content, responseType, session.type);
    } catch (error) {
      console.error('GPT-4 API error, using fallback response:', error);
      aiResponse = this.generateFallbackResponse(userMessage.content, analysis, responseType);
    }
    
    // Generate suggested follow-ups
    const suggestedFollowUps = this.generateSuggestedFollowUps(analysis, session);
    
    // Create interventions if needed
    const interventions = this.createInterventions(analysis, userMessage.interventionTriggers || []);
    
    return {
      message: aiResponse,
      type: responseType,
      suggestedFollowUps,
      interventions: interventions.length > 0 ? interventions : undefined
    };
  }
  
  /**
   * Build conversation context for GPT-4
   */
  private buildConversationContext(messages: AITherapyMessage[]): string {
    return messages
      .map(msg => `${msg.role === 'user' ? 'Client' : 'Therapist'}: ${msg.content}`)
      .join('\n\n');
  }
  
  /**
   * Determine appropriate response type
   */
  private determineResponseType(
    analysis: MessageAnalysis,
    session: AITherapySession
  ): TherapeuticResponse['type'] {
    if (analysis.riskIndicators.some(r => r.severity === 'high' || r.severity === 'critical')) {
      return 'crisis';
    }
    
    if (analysis.cognitiveDistortions && analysis.cognitiveDistortions.length > 0) {
      return 'psychoeducational';
    }
    
    if (session.messages.length < 3) {
      return 'exploratory';
    }
    
    if (analysis.emotions.intensity > 0.7) {
      return 'empathetic';
    }
    
    return 'empathetic';
  }
  
  /**
   * Call GPT-4 API
   */
  private async callGPT4(
    context: string,
    userMessage: string,
    responseType: string,
    sessionType: string
  ): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    const systemPrompt = THERAPEUTIC_PROMPTS[sessionType as keyof typeof THERAPEUTIC_PROMPTS] || 
                        THERAPEUTIC_PROMPTS.general;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context:\n${context}\n\nClient's latest message: ${userMessage}\n\nPlease provide a ${responseType} therapeutic response.` }
    ];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });
    
    if (!response.ok) {
      throw new Error(`GPT-4 API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  /**
   * Generate fallback response when GPT-4 is unavailable
   */
  private generateFallbackResponse(
    userMessage: string,
    analysis: MessageAnalysis,
    responseType: string
  ): string {
    const responses: { [key: string]: string[] } = {
      empathetic: [
        "I can hear that you're going through a difficult time. Your feelings are valid and it's okay to feel this way. Can you tell me more about what's been happening?",
        "Thank you for sharing that with me. It takes courage to open up about these feelings. What has been the most challenging part for you?",
        "I understand this is really hard for you. You're not alone in this. How long have you been feeling this way?"
      ],
      exploratory: [
        "That's interesting. Can you help me understand more about what that means for you?",
        "I'd like to explore this further with you. What thoughts come up when you think about this?",
        "Let's dive deeper into this. When did you first notice these patterns?"
      ],
      psychoeducational: [
        "What you're describing sounds like a common thinking pattern that many people experience. Have you noticed this pattern in other areas of your life?",
        "Sometimes our thoughts can create patterns that affect how we feel. Would you like to explore some strategies to work with these thoughts?",
        "This is something many people struggle with. There are evidence-based techniques that can help. Would you be interested in learning more?"
      ],
      directive: [
        "I'd like to suggest trying something that might help. Are you open to exploring a coping strategy together?",
        "Based on what you've shared, I think it might be helpful to focus on developing a specific skill. How does that sound to you?",
        "Let's work on creating a plan to address this. What would be a small, manageable first step?"
      ],
      crisis: [
        "I'm very concerned about what you're sharing. Your safety is my top priority right now. Are you in a safe place?",
        "These feelings you're describing worry me. Have you had thoughts of hurting yourself or others?",
        "I want to make sure you get the support you need right now. Would you be willing to reach out to a crisis helpline with me?"
      ]
    };
    
    const responseOptions = responses[responseType] || responses.empathetic;
    return responseOptions[Math.floor(Math.random() * responseOptions.length)];
  }
  
  /**
   * Generate suggested follow-up questions
   */
  private generateSuggestedFollowUps(
    analysis: MessageAnalysis,
    session: AITherapySession
  ): string[] {
    const followUps: string[] = [];
    
    // Based on emotions
    if (analysis.emotions.primary.name === 'sadness') {
      followUps.push('What usually helps when you feel this sad?');
    } else if (analysis.emotions.primary.name === 'anxiety') {
      followUps.push('What triggers your anxiety the most?');
    } else if (analysis.emotions.primary.name === 'anger') {
      followUps.push('How do you usually express your anger?');
    }
    
    // Based on themes
    if (analysis.therapeuticThemes.includes('relationships')) {
      followUps.push('How are your relationships affecting you?');
    }
    
    if (analysis.therapeuticThemes.includes('work_stress')) {
      followUps.push('What aspects of work are most stressful?');
    }
    
    // General therapeutic questions
    followUps.push(
      'How does that make you feel?',
      'Can you tell me more about that?',
      'What would you like to be different?'
    );
    
    return followUps.slice(0, 3);
  }
  
  /**
   * Create therapeutic interventions
   */
  private createInterventions(
    analysis: MessageAnalysis,
    triggers: string[]
  ): TherapeuticIntervention[] {
    const interventions: TherapeuticIntervention[] = [];
    
    if (triggers.includes('breathing_exercise')) {
      interventions.push({
        id: this.generateInterventionId(),
        type: 'breathing',
        name: '4-7-8 Breathing Technique',
        description: 'A calming breathing exercise to reduce anxiety',
        instructions: [
          'Exhale completely through your mouth',
          'Close your mouth and inhale through your nose for 4 counts',
          'Hold your breath for 7 counts',
          'Exhale completely through your mouth for 8 counts',
          'Repeat 3-4 times'
        ],
        duration: 5,
        timestamp: new Date(),
        completed: false
      });
    }
    
    if (triggers.includes('grounding_exercise')) {
      interventions.push({
        id: this.generateInterventionId(),
        type: 'grounding',
        name: '5-4-3-2-1 Grounding',
        description: 'Use your senses to ground yourself in the present',
        instructions: [
          'Name 5 things you can see',
          'Name 4 things you can touch',
          'Name 3 things you can hear',
          'Name 2 things you can smell',
          'Name 1 thing you can taste'
        ],
        duration: 3,
        timestamp: new Date(),
        completed: false
      });
    }
    
    if (triggers.includes('cognitive_restructuring')) {
      interventions.push({
        id: this.generateInterventionId(),
        type: 'cognitive_restructuring',
        name: 'Thought Challenging',
        description: 'Examine and reframe negative thought patterns',
        instructions: [
          'Identify the negative thought',
          'Rate how much you believe it (0-100%)',
          'List evidence for and against the thought',
          'Create a balanced, realistic thought',
          'Rate your belief in the new thought'
        ],
        duration: 10,
        timestamp: new Date(),
        completed: false
      });
    }
    
    return interventions;
  }
  
  /**
   * Generate session insights
   */
  private generateSessionInsights(
    session: AITherapySession,
    analysis: MessageAnalysis
  ): SessionInsight[] {
    const insights: SessionInsight[] = [];
    
    // Pattern insights
    if (analysis.cognitiveDistortions && analysis.cognitiveDistortions.length > 0) {
      insights.push({
        id: this.generateInsightId(),
        type: 'pattern',
        content: `Cognitive distortions detected: ${analysis.cognitiveDistortions.map(d => d.type).join(', ')}`,
        confidence: 0.8,
        priority: 'medium',
        timestamp: new Date(),
        actionable: true
      });
    }
    
    // Progress insights
    if (analysis.copingMechanisms && analysis.copingMechanisms.length > 0) {
      insights.push({
        id: this.generateInsightId(),
        type: 'strength',
        content: `Positive coping mechanisms identified: ${analysis.copingMechanisms.join(', ')}`,
        confidence: 0.9,
        priority: 'low',
        timestamp: new Date(),
        actionable: false
      });
    }
    
    // Concern insights
    if (analysis.riskIndicators.length > 0) {
      const highestRisk = analysis.riskIndicators.reduce((prev, current) => 
        this.compareSeverity(prev.severity, current.severity) > 0 ? prev : current
      );
      
      insights.push({
        id: this.generateInsightId(),
        type: 'concern',
        content: `Elevated ${highestRisk.type} risk detected (${highestRisk.severity})`,
        confidence: highestRisk.confidence,
        priority: highestRisk.severity === 'critical' ? 'critical' : 'high',
        timestamp: new Date(),
        actionable: true
      });
    }
    
    return insights;
  }
  
  /**
   * Compare severity levels
   */
  private compareSeverity(a: string, b: string): number {
    const levels = ['low', 'moderate', 'high', 'critical'];
    return levels.indexOf(a) - levels.indexOf(b);
  }
  
  /**
   * Update therapeutic alliance metrics
   */
  private updateTherapeuticAlliance(
    current: TherapeuticAlliance,
    userMessage: AITherapyMessage,
    therapistMessage: AITherapyMessage
  ): TherapeuticAlliance {
    const updated = { ...current };
    
    // Simple heuristics for alliance metrics
    // Would be more sophisticated in production
    
    // Engagement: based on message length and frequency
    if (userMessage.content.length > 100) {
      updated.engagement = Math.min(10, updated.engagement + 0.1);
    }
    
    // Rapport: based on positive language
    if (userMessage.content.toLowerCase().includes('thank') || 
        userMessage.content.toLowerCase().includes('helpful')) {
      updated.rapport = Math.min(10, updated.rapport + 0.2);
    }
    
    // Trust: increases over time with consistent interaction
    updated.trust = Math.min(10, updated.trust + 0.05);
    
    // Collaboration: based on user following suggestions
    if (userMessage.content.toLowerCase().includes('i tried') || 
        userMessage.content.toLowerCase().includes('i will')) {
      updated.collaboration = Math.min(10, updated.collaboration + 0.15);
    }
    
    updated.lastMeasured = new Date();
    
    return updated;
  }
  
  /**
   * Initialize risk assessment
   */
  private initializeRiskAssessment(): RiskAssessment {
    return {
      overallRisk: 'minimal',
      suicideRisk: { level: 'none', confidence: 0, indicators: [] },
      selfHarmRisk: { level: 'none', confidence: 0, indicators: [] },
      violenceRisk: { level: 'none', confidence: 0, indicators: [] },
      substanceRisk: { level: 'none', confidence: 0, indicators: [] },
      lastAssessed: new Date(),
      protectiveFactors: [],
      riskFactors: [],
      immediateActionRequired: false,
      recommendedActions: []
    };
  }
  
  /**
   * Initialize therapeutic alliance
   */
  private initializeTherapeuticAlliance(): TherapeuticAlliance {
    return {
      rapport: 5,
      engagement: 5,
      collaboration: 5,
      trust: 5,
      lastMeasured: new Date()
    };
  }
  
  /**
   * Generate welcome message
   */
  private async generateWelcomeMessage(sessionType: string): Promise<AITherapyMessage> {
    const welcomeMessages = {
      general: "Hello, I'm here to provide a safe, supportive space for you to explore your thoughts and feelings. Everything you share here is confidential. How are you feeling today, and what brings you here?",
      cbt: "Welcome! I specialize in Cognitive Behavioral Therapy, which focuses on understanding how our thoughts, feelings, and behaviors are connected. Together, we can work on identifying and changing patterns that may be causing you distress. What would you like to focus on today?",
      dbt: "Hello! I'm trained in Dialectical Behavior Therapy techniques. DBT helps us balance acceptance of where we are with skills to create positive change. We'll work on emotion regulation, distress tolerance, and interpersonal effectiveness. What's bringing you here today?",
      mindfulness: "Welcome to this mindfulness-focused session. We'll explore ways to be more present, reduce stress, and develop a compassionate awareness of your thoughts and feelings. Let's start by taking a moment to check in - how are you feeling right now in this moment?",
      crisis: "I'm here to support you through this difficult time. Your safety is my top priority. Can you tell me what's happening right now and if you're in a safe place?",
      assessment: "Hello! Today we'll spend some time getting to know each other and understanding what brings you here. I'll ask you some questions to better understand your situation and how I can best support you. Is that okay with you?"
    };
    
    return {
      id: this.generateMessageId(),
      role: 'therapist',
      content: welcomeMessages[sessionType as keyof typeof welcomeMessages] || welcomeMessages.general,
      timestamp: new Date()
    };
  }
  
  /**
   * End therapy session
   */
  async endSession(sessionId: string): Promise<SessionNotes> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    session.endTime = new Date();
    session.status = 'ended';
    
    // Generate session notes
    const notes = this.generateSessionNotes(session);
    session.sessionNotes = notes;
    
    // Save session to history
    await this.saveSessionToHistory(session);
    
    // Clean up
    this.sessions.delete(sessionId);
    this.sessionHistories.delete(sessionId);
    
    this.emit('session:ended', session);
    
    return notes;
  }
  
  /**
   * Generate session notes in SOAP format
   */
  private generateSessionNotes(session: AITherapySession): SessionNotes {
    // Subjective: What the client reported
    const subjective = this.summarizeUserMessages(session.messages);
    
    // Objective: Observable facts
    const objective = this.summarizeObjectiveObservations(session);
    
    // Assessment: Clinical assessment
    const assessment = this.generateClinicalAssessment(session);
    
    // Plan: Treatment plan
    const plan = this.generateTreatmentPlan(session);
    
    return {
      subjective,
      objective,
      assessment,
      plan,
      exportFormat: 'soap'
    };
  }
  
  /**
   * Summarize user messages for subjective section
   */
  private summarizeUserMessages(messages: AITherapyMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const themes = new Set<string>();
    const emotions = new Set<string>();
    
    userMessages.forEach(msg => {
      if (msg.analysis) {
        msg.analysis.therapeuticThemes.forEach(t => themes.add(t));
        if (msg.analysis.emotions.primary) {
          emotions.add(msg.analysis.emotions.primary.name);
        }
      }
    });
    
    return `Client discussed: ${Array.from(themes).join(', ')}. Expressed emotions: ${Array.from(emotions).join(', ')}.`;
  }
  
  /**
   * Summarize objective observations
   */
  private summarizeObjectiveObservations(session: AITherapySession): string {
    const messageCount = session.messages.filter(m => m.role === 'user').length;
    const sessionDuration = session.endTime ? 
      Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60) : 0;
    
    return `Session duration: ${sessionDuration} minutes. Client messages: ${messageCount}. Engagement level: ${session.therapeuticAlliance.engagement}/10. Risk level: ${session.riskAssessment.overallRisk}.`;
  }
  
  /**
   * Generate clinical assessment
   */
  private generateClinicalAssessment(session: AITherapySession): string {
    const insights = session.insights
      .filter(i => i.type === 'pattern' || i.type === 'concern')
      .map(i => i.content)
      .join('. ');
    
    return insights || 'No significant clinical concerns identified during this session.';
  }
  
  /**
   * Generate treatment plan
   */
  private generateTreatmentPlan(session: AITherapySession): string {
    const interventions = session.interventions
      .map(i => i.name)
      .join(', ');
    
    const followUp = session.metadata.followUpRequired ? 
      'Follow-up session recommended.' : '';
    
    return `Interventions provided: ${interventions || 'None'}. ${followUp}`;
  }
  
  /**
   * Save session to history
   */
  private async saveSessionToHistory(session: AITherapySession): Promise<void> {
    try {
      const response = await fetch(`${process.env.VITE_API_URL || '/api'}/therapy-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });
      
      if (!response.ok) {
        console.error('Failed to save session to server');
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }
  
  /**
   * Get session by ID
   */
  getSession(sessionId: string): AITherapySession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Get user's session history
   */
  async getUserSessions(userId: string): Promise<AITherapySession[]> {
    try {
      const response = await fetch(`${process.env.VITE_API_URL || '/api'}/therapy-sessions/user/${userId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching user sessions:', error);
    }
    return [];
  }
  
  /**
   * Export session notes
   */
  exportSessionNotes(sessionId: string, format: 'pdf' | 'txt' | 'json' = 'txt'): string {
    const session = this.sessions.get(sessionId);
    if (!session || !session.sessionNotes) {
      throw new Error('Session or notes not found');
    }
    
    const notes = session.sessionNotes;
    
    switch (format) {
      case 'txt':
        return `THERAPY SESSION NOTES
Date: ${session.startTime.toLocaleDateString()}
Session Type: ${session.type}

SUBJECTIVE:
${notes.subjective}

OBJECTIVE:
${notes.objective}

ASSESSMENT:
${notes.assessment}

PLAN:
${notes.plan}

${notes.additionalNotes ? `ADDITIONAL NOTES:\n${notes.additionalNotes}` : ''}`;
        
      case 'json':
        return JSON.stringify(notes, null, 2);
        
      default:
        return '';
    }
  }
  
  /**
   * Clean up inactive sessions
   */
  private cleanupInactiveSessions(): void {
    const inactiveThreshold = 60 * 60 * 1000; // 1 hour
    const now = Date.now();
    
    Array.from(this.sessions.entries()).forEach(([sessionId, session]) => {
      const lastMessageTime = session.messages[session.messages.length - 1]?.timestamp.getTime() || 0;
      
      if (now - lastMessageTime > inactiveThreshold && session.status === 'active') {
        session.status = 'ended';
        this.endSession(sessionId);
      }
    });
  }
  
  /**
   * Detect platform
   */
  private detectPlatform(): 'web' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile/.test(userAgent)) return 'mobile';
    if (/tablet|ipad/.test(userAgent)) return 'tablet';
    return 'web';
  }
  
  /**
   * Generate unique IDs
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateInterventionId(): string {
    return `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiTherapyService = new AITherapyService();
export default aiTherapyService;