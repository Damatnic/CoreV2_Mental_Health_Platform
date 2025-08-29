/**
 * AI-Powered Mental Health Chatbot Service
 * 
 * Comprehensive service for natural language processing, sentiment analysis,
 * crisis detection, and empathetic response generation with HIPAA-compliant storage
 */

import { EventEmitter } from 'events';
import { crisisDetectionService, CrisisAnalysisResult } from '../crisisDetectionService';
import { hipaaEncryption, EncryptedData } from '../hipaaEncryptionService';
import { apiClient } from '../apiClient';
import { logger } from '../../utils/logger';

// Types and Interfaces
export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  encrypted?: boolean;
  voiceInput?: boolean;
}

export interface MessageMetadata {
  sentiment: SentimentScore;
  emotions: EmotionScore[];
  topics: string[];
  crisisIndicators?: string[];
  therapeuticApproach?: string;
  confidence: number;
  processingTime: number;
}

export interface SentimentScore {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
}

export interface EmotionScore {
  emotion: 'anger' | 'fear' | 'sadness' | 'joy' | 'surprise' | 'disgust' | 'trust' | 'anticipation';
  score: number; // 0 to 1
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  messages: ChatMessage[];
  currentMood: number; // 1-10
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  therapeuticGoals: string[];
  personalizedContext: PersonalizedContext;
  lastActivity: Date;
  totalDuration: number; // milliseconds
}

export interface PersonalizedContext {
  userName?: string;
  preferredTone: 'professional' | 'friendly' | 'supportive' | 'casual';
  triggers: string[];
  copingStrategies: string[];
  therapyHistory: string[];
  culturalBackground?: string;
  language: string;
  timezone: string;
}

export interface ChatbotResponse {
  message: ChatMessage;
  suggestions: string[];
  resources: TherapeuticResource[];
  interventions: Intervention[];
  crisisDetected: boolean;
  escalationRequired: boolean;
  followUpRequired: boolean;
}

export interface TherapeuticResource {
  id: string;
  type: 'article' | 'video' | 'exercise' | 'hotline' | 'professional';
  title: string;
  description: string;
  url?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
}

export interface Intervention {
  type: 'breathing' | 'grounding' | 'cognitive' | 'behavioral' | 'mindfulness' | 'crisis';
  name: string;
  description: string;
  steps: string[];
  estimatedTime: number; // minutes
  effectiveness: number; // 0-1
}

export interface ChatbotConfig {
  aiProvider: 'openai' | 'claude' | 'local';
  apiKey?: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  contextWindowSize: number;
  enableVoice: boolean;
  enableCrisisDetection: boolean;
  enablePersonalization: boolean;
  responseDelay: number; // milliseconds
  rateLimitPerMinute: number;
  abuseDetectionThreshold: number;
}

export interface RateLimitInfo {
  userId: string;
  requests: number;
  windowStart: Date;
  blocked: boolean;
  blockReason?: string;
}

// Default Configuration
const DEFAULT_CONFIG: ChatbotConfig = {
  aiProvider: 'openai',
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 1500,
  contextWindowSize: 10,
  enableVoice: true,
  enableCrisisDetection: true,
  enablePersonalization: true,
  responseDelay: 500,
  rateLimitPerMinute: 20,
  abuseDetectionThreshold: 0.8
};

// System prompts for different therapeutic approaches
const SYSTEM_PROMPTS = {
  default: `You are a compassionate mental health support chatbot. Your role is to:
1. Provide empathetic, non-judgmental support
2. Use evidence-based therapeutic techniques (CBT, DBT, mindfulness)
3. Detect and respond appropriately to crisis situations
4. Never provide medical diagnosis or medication advice
5. Encourage professional help when appropriate
6. Maintain confidentiality and respect privacy
7. Use person-first language and avoid stigmatizing terms
8. Validate emotions while promoting healthy coping strategies`,

  crisis: `CRISIS PROTOCOL ACTIVATED. Your immediate priorities are:
1. Ensure user safety
2. Provide immediate emotional support
3. Suggest crisis resources and hotlines
4. Encourage reaching out to emergency services if needed
5. Use de-escalation techniques
6. Do NOT minimize their feelings
7. Stay with them until help arrives or situation stabilizes`,

  supportive: `Be warm, understanding, and supportive. Focus on:
1. Active listening and validation
2. Reflecting feelings and thoughts
3. Offering gentle encouragement
4. Sharing appropriate coping strategies
5. Building hope and resilience
6. Celebrating small victories`,

  cbt: `Apply Cognitive Behavioral Therapy principles:
1. Identify negative thought patterns
2. Challenge cognitive distortions
3. Explore evidence for and against thoughts
4. Develop balanced perspectives
5. Connect thoughts, feelings, and behaviors
6. Practice thought records and behavioral experiments`,

  dbt: `Use Dialectical Behavior Therapy skills:
1. Distress tolerance techniques
2. Emotion regulation strategies
3. Interpersonal effectiveness skills
4. Mindfulness practices
5. Radical acceptance
6. TIPP (Temperature, Intense exercise, Paced breathing, Paired muscle relaxation)`,

  mindfulness: `Guide mindfulness and present-moment awareness:
1. Breathing exercises
2. Body scan techniques
3. Grounding exercises (5-4-3-2-1)
4. Non-judgmental observation
5. Acceptance and letting go
6. Mindful movement suggestions`
};

/**
 * Main AI Chatbot Service Class
 */
export class AIChatbotService extends EventEmitter {
  private config: ChatbotConfig;
  private conversations: Map<string, ConversationContext> = new Map();
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private messageQueue: Map<string, ChatMessage[]> = new Map();
  private processingFlags: Set<string> = new Set();
  private abusivePatterns: RegExp[] = [];
  private resourceLibrary: Map<string, TherapeuticResource> = new Map();
  private interventionLibrary: Map<string, Intervention> = new Map();

  constructor(config: Partial<ChatbotConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeLibraries();
    this.setupAbusivePatterns();
    this.startRateLimitCleanup();
  }

  /**
   * Process user message and generate response
   */
  async processMessage(
    message: string,
    userId: string,
    sessionId: string,
    voiceInput: boolean = false
  ): Promise<ChatbotResponse> {
    const startTime = Date.now();

    try {
      // Check rate limits
      if (this.isRateLimited(userId)) {
        throw new Error('Rate limit exceeded. Please wait before sending another message.');
      }

      // Check for abuse
      if (this.detectAbuse(message)) {
        await this.handleAbusiveContent(userId, message);
        throw new Error('Message contains inappropriate content.');
      }

      // Prevent duplicate processing
      if (this.processingFlags.has(sessionId)) {
        throw new Error('Previous message still being processed.');
      }

      this.processingFlags.add(sessionId);

      // Get or create conversation context
      const context = await this.getOrCreateContext(userId, sessionId);

      // Create user message
      const userMessage: ChatMessage = {
        id: this.generateMessageId(),
        sessionId,
        userId,
        role: 'user',
        content: message,
        timestamp: new Date(),
        voiceInput,
        encrypted: false
      };

      // Analyze message
      const metadata = await this.analyzeMessage(message, context);
      userMessage.metadata = metadata;

      // Crisis detection
      const crisisAnalysis = await crisisDetectionService.analyzeForCrisis(message, userId);
      
      // Store message (encrypted)
      await this.storeMessage(userMessage, true);
      context.messages.push(userMessage);

      // Update risk level based on crisis analysis
      if (crisisAnalysis.severityLevel === 'critical') {
        context.riskLevel = 'critical';
      } else if (crisisAnalysis.severityLevel === 'high') {
        context.riskLevel = 'high';
      } else if (crisisAnalysis.severityLevel === 'medium' && context.riskLevel !== 'high') {
        context.riskLevel = 'moderate';
      }

      // Generate appropriate response
      const response = await this.generateResponse(message, context, crisisAnalysis);

      // Get relevant resources and interventions
      const resources = await this.getRelevantResources(metadata, crisisAnalysis);
      const interventions = await this.getRelevantInterventions(metadata, context);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(context, metadata);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: this.generateMessageId(),
        sessionId,
        userId,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: {
          ...response.metadata,
          processingTime: Date.now() - startTime
        },
        encrypted: false
      };

      // Store assistant message
      await this.storeMessage(assistantMessage, true);
      context.messages.push(assistantMessage);

      // Update conversation context
      context.lastActivity = new Date();
      context.totalDuration += Date.now() - startTime;
      this.conversations.set(sessionId, context);

      // Emit events
      this.emit('message:processed', {
        userId,
        sessionId,
        crisisDetected: crisisAnalysis.hasCrisisIndicators,
        processingTime: Date.now() - startTime
      });

      // Handle crisis escalation if needed
      if (crisisAnalysis.immediateIntervention) {
        await this.escalateCrisis(userId, sessionId, crisisAnalysis);
      }

      // Update rate limits
      this.updateRateLimit(userId);

      return {
        message: assistantMessage,
        suggestions,
        resources,
        interventions,
        crisisDetected: crisisAnalysis.hasCrisisIndicators,
        escalationRequired: crisisAnalysis.immediateIntervention,
        followUpRequired: crisisAnalysis.severityLevel !== 'none'
      };

    } catch (error) {
      logger.error('Error processing message:', error);
      throw error;
    } finally {
      this.processingFlags.delete(sessionId);
    }
  }

  /**
   * Analyze message for sentiment, emotions, and topics
   */
  private async analyzeMessage(
    message: string,
    context: ConversationContext
  ): Promise<MessageMetadata> {
    const startTime = Date.now();

    try {
      // Sentiment analysis
      const sentiment = await this.analyzeSentiment(message);
      
      // Emotion detection
      const emotions = await this.detectEmotions(message);
      
      // Topic extraction
      const topics = await this.extractTopics(message);
      
      // Crisis keywords
      const crisisIndicators = this.detectCrisisKeywords(message);

      // Determine therapeutic approach
      const therapeuticApproach = this.selectTherapeuticApproach(
        sentiment,
        emotions,
        topics,
        context
      );

      return {
        sentiment,
        emotions,
        topics,
        crisisIndicators: crisisIndicators.length > 0 ? crisisIndicators : undefined,
        therapeuticApproach,
        confidence: this.calculateConfidence(sentiment, emotions),
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      logger.error('Error analyzing message:', error);
      
      // Return default metadata on error
      return {
        sentiment: { score: 0, magnitude: 0.5, label: 'neutral' },
        emotions: [],
        topics: [],
        confidence: 0.5,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze sentiment of text
   */
  private async analyzeSentiment(text: string): Promise<SentimentScore> {
    // Simple sentiment analysis - in production, use NLP API
    const positiveWords = ['happy', 'good', 'great', 'wonderful', 'amazing', 'better', 'hopeful', 'grateful', 'peaceful', 'calm'];
    const negativeWords = ['sad', 'angry', 'depressed', 'anxious', 'worried', 'scared', 'hopeless', 'terrible', 'awful', 'bad'];
    const veryNegativeWords = ['suicide', 'kill', 'die', 'worthless', 'unbearable', 'can\'t go on'];

    const textLower = text.toLowerCase();
    let score = 0;
    let magnitude = 0;

    // Check for very negative words first
    for (const word of veryNegativeWords) {
      if (textLower.includes(word)) {
        score -= 0.3;
        magnitude += 0.3;
      }
    }

    // Count positive and negative words
    for (const word of positiveWords) {
      if (textLower.includes(word)) {
        score += 0.1;
        magnitude += 0.1;
      }
    }

    for (const word of negativeWords) {
      if (textLower.includes(word)) {
        score -= 0.15;
        magnitude += 0.15;
      }
    }

    // Normalize score between -1 and 1
    score = Math.max(-1, Math.min(1, score));
    magnitude = Math.min(1, magnitude);

    // Determine label
    let label: SentimentScore['label'] = 'neutral';
    if (score <= -0.6) label = 'very_negative';
    else if (score <= -0.2) label = 'negative';
    else if (score >= 0.6) label = 'very_positive';
    else if (score >= 0.2) label = 'positive';

    return { score, magnitude, label };
  }

  /**
   * Detect emotions in text
   */
  private async detectEmotions(text: string): Promise<EmotionScore[]> {
    const emotions: EmotionScore[] = [];
    const textLower = text.toLowerCase();

    const emotionKeywords = {
      anger: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated'],
      fear: ['scared', 'afraid', 'terrified', 'anxious', 'worried', 'nervous'],
      sadness: ['sad', 'depressed', 'down', 'blue', 'unhappy', 'miserable'],
      joy: ['happy', 'joyful', 'excited', 'pleased', 'delighted', 'cheerful'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected'],
      disgust: ['disgusted', 'revolted', 'repulsed', 'sick', 'nauseated'],
      trust: ['trust', 'believe', 'confident', 'secure', 'safe'],
      anticipation: ['excited', 'looking forward', 'eager', 'hopeful', 'expecting']
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          score += 0.3;
        }
      }
      
      if (score > 0) {
        emotions.push({
          emotion: emotion as EmotionScore['emotion'],
          score: Math.min(1, score)
        });
      }
    }

    // Sort by score
    emotions.sort((a, b) => b.score - a.score);

    return emotions.slice(0, 3); // Return top 3 emotions
  }

  /**
   * Extract topics from message
   */
  private async extractTopics(text: string): Promise<string[]> {
    const topics: string[] = [];
    const textLower = text.toLowerCase();

    const topicKeywords = {
      'relationships': ['family', 'friend', 'partner', 'spouse', 'relationship', 'marriage', 'divorce'],
      'work': ['job', 'work', 'boss', 'colleague', 'career', 'unemployment', 'fired'],
      'health': ['health', 'sick', 'illness', 'pain', 'medication', 'doctor', 'hospital'],
      'anxiety': ['anxiety', 'panic', 'worry', 'nervous', 'stress', 'overwhelmed'],
      'depression': ['depression', 'sad', 'hopeless', 'empty', 'numb', 'worthless'],
      'trauma': ['trauma', 'abuse', 'assault', 'accident', 'ptsd', 'flashback'],
      'addiction': ['addiction', 'alcohol', 'drugs', 'gambling', 'drinking', 'substance'],
      'sleep': ['sleep', 'insomnia', 'nightmare', 'tired', 'exhausted', 'fatigue'],
      'self-esteem': ['confidence', 'self-worth', 'self-esteem', 'insecure', 'inadequate']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          topics.push(topic);
          break;
        }
      }
    }

    return [...new Set(topics)]; // Remove duplicates
  }

  /**
   * Detect crisis keywords
   */
  private detectCrisisKeywords(text: string): string[] {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'can\'t go on',
      'hurt myself', 'self-harm', 'cutting', 'overdose',
      'no point', 'better off dead', 'hopeless', 'give up'
    ];

    const textLower = text.toLowerCase();
    return crisisKeywords.filter(keyword => textLower.includes(keyword));
  }

  /**
   * Select therapeutic approach based on analysis
   */
  private selectTherapeuticApproach(
    sentiment: SentimentScore,
    emotions: EmotionScore[],
    topics: string[],
    context: ConversationContext
  ): string {
    // Crisis situations always use crisis protocol
    if (context.riskLevel === 'critical' || context.riskLevel === 'high') {
      return 'crisis';
    }

    // Check for specific conditions that benefit from certain approaches
    const primaryEmotion = emotions[0]?.emotion;
    
    if (topics.includes('anxiety') || primaryEmotion === 'fear') {
      return 'cbt'; // CBT is effective for anxiety
    }
    
    if (emotions.some(e => e.emotion === 'anger' && e.score > 0.7)) {
      return 'dbt'; // DBT for emotion regulation
    }
    
    if (topics.includes('trauma')) {
      return 'supportive'; // Supportive approach for trauma
    }
    
    if (sentiment.label === 'very_negative' || sentiment.label === 'negative') {
      return 'supportive';
    }
    
    // Default to mindfulness for general wellness
    return 'mindfulness';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(sentiment: SentimentScore, emotions: EmotionScore[]): number {
    let confidence = 0.5; // Base confidence
    
    // Higher magnitude = higher confidence
    confidence += sentiment.magnitude * 0.3;
    
    // Clear emotions increase confidence
    if (emotions.length > 0) {
      confidence += emotions[0].score * 0.2;
    }
    
    return Math.min(1, confidence);
  }

  /**
   * Generate AI response
   */
  private async generateResponse(
    message: string,
    context: ConversationContext,
    crisisAnalysis: CrisisAnalysisResult
  ): Promise<{ content: string; metadata: Partial<MessageMetadata> }> {
    try {
      // Select system prompt based on context
      let systemPrompt = SYSTEM_PROMPTS.default;
      
      if (crisisAnalysis.immediateIntervention) {
        systemPrompt = SYSTEM_PROMPTS.crisis;
      } else if (context.personalizedContext.preferredTone === 'supportive') {
        systemPrompt = SYSTEM_PROMPTS.supportive;
      } else if (context.messages[context.messages.length - 1]?.metadata?.therapeuticApproach) {
        const approach = context.messages[context.messages.length - 1].metadata.therapeuticApproach;
        systemPrompt = SYSTEM_PROMPTS[approach as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.default;
      }

      // Prepare conversation history
      const conversationHistory = this.prepareConversationHistory(context);

      // Generate response based on AI provider
      let response: string;
      
      if (this.config.aiProvider === 'openai') {
        response = await this.generateOpenAIResponse(
          message,
          systemPrompt,
          conversationHistory,
          context
        );
      } else if (this.config.aiProvider === 'claude') {
        response = await this.generateClaudeResponse(
          message,
          systemPrompt,
          conversationHistory,
          context
        );
      } else {
        response = await this.generateLocalResponse(
          message,
          context,
          crisisAnalysis
        );
      }

      // Add empathetic elements
      response = this.enhanceWithEmpathy(response, context);

      // Add crisis resources if needed
      if (crisisAnalysis.hasCrisisIndicators) {
        response = this.addCrisisResources(response, crisisAnalysis);
      }

      return {
        content: response,
        metadata: {
          therapeuticApproach: context.messages[context.messages.length - 1]?.metadata?.therapeuticApproach,
          confidence: 0.8
        }
      };

    } catch (error) {
      logger.error('Error generating response:', error);
      
      // Fallback response
      return {
        content: this.generateFallbackResponse(context, crisisAnalysis),
        metadata: {
          confidence: 0.3
        }
      };
    }
  }

  /**
   * Generate OpenAI response
   */
  private async generateOpenAIResponse(
    message: string,
    systemPrompt: string,
    conversationHistory: string,
    context: ConversationContext
  ): Promise<string> {
    try {
      const response = await apiClient.post('/ai/openai/chat', {
        model: this.config.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${conversationHistory}\n\nUser: ${message}` }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        user: context.userId
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Generate Claude response
   */
  private async generateClaudeResponse(
    message: string,
    systemPrompt: string,
    conversationHistory: string,
    context: ConversationContext
  ): Promise<string> {
    try {
      const response = await apiClient.post('/ai/claude/chat', {
        model: this.config.modelName,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `${conversationHistory}\n\nUser: ${message}` }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      return response.data.content;
    } catch (error) {
      logger.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Generate local response (fallback)
   */
  private async generateLocalResponse(
    message: string,
    context: ConversationContext,
    crisisAnalysis: CrisisAnalysisResult
  ): Promise<string> {
    // Template-based responses for offline/local mode
    if (crisisAnalysis.immediateIntervention) {
      return `I'm deeply concerned about what you've shared. Your safety is the most important thing right now. 

Please reach out for immediate help:
- Call 988 (Suicide & Crisis Lifeline)
- Text HOME to 741741 (Crisis Text Line)
- Call 911 if you're in immediate danger

You don't have to go through this alone. Is there someone you trust who can be with you right now?`;
    }

    const lastMetadata = context.messages[context.messages.length - 1]?.metadata;
    
    if (lastMetadata?.sentiment.label === 'very_negative') {
      return `I hear that you're going through a really difficult time right now. Your feelings are valid, and it's okay to not be okay. 

What you're experiencing sounds overwhelming, and I want you to know that you don't have to face this alone. 

Would you like to talk more about what's happening, or would you prefer to try a coping exercise together?`;
    }

    if (lastMetadata?.emotions.some(e => e.emotion === 'anxiety' && e.score > 0.5)) {
      return `It sounds like you're feeling quite anxious right now. Anxiety can be really uncomfortable, but there are ways to help manage these feelings.

Let's try a simple breathing exercise: Take a slow breath in for 4 counts, hold for 4, and exhale for 6. This can help activate your body's relaxation response.

What specific worries are on your mind right now? Sometimes talking through them can help.`;
    }

    // Default supportive response
    const additionalText = message.length > 100 
      ? 'You\'ve shared quite a bit, and I appreciate your openness. ' 
      : '';
    
    return `Thank you for sharing that with me. I can see this is important to you. ${additionalText}Can you tell me more about how this has been affecting you? I'm here to listen and support you.`;
  }

  /**
   * Enhance response with empathy
   */
  private enhanceWithEmpathy(response: string, context: ConversationContext): string {
    const empathyPhrases = [
      'I understand this must be difficult for you.',
      'Your feelings are completely valid.',
      'It takes courage to share what you\'re going through.',
      'I\'m here to support you.',
      'You\'re not alone in this.'
    ];

    // Add empathy phrase if response doesn't already contain one
    const hasEmpathy = empathyPhrases.some(phrase => 
      response.toLowerCase().includes(phrase.toLowerCase())
    );

    if (!hasEmpathy && context.riskLevel !== 'low') {
      const randomPhrase = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
      response = `${randomPhrase} ${response}`;
    }

    return response;
  }

  /**
   * Add crisis resources to response
   */
  private addCrisisResources(response: string, crisisAnalysis: CrisisAnalysisResult): string {
    if (!response.includes('988') && !response.includes('crisis')) {
      response += '\n\nIf you need immediate support:\n' +
        '- Call 988 for the Suicide & Crisis Lifeline\n' +
        '- Text HOME to 741741 for Crisis Text Line\n' +
        '- Call 911 if you\'re in immediate danger';
    }

    return response;
  }

  /**
   * Generate fallback response
   */
  private generateFallbackResponse(
    context: ConversationContext,
    crisisAnalysis: CrisisAnalysisResult
  ): string {
    if (crisisAnalysis.immediateIntervention) {
      return 'I\'m having trouble processing your message right now, but I\'m very concerned about your safety. Please reach out for immediate help by calling 988 or 911. You\'re not alone.';
    }

    return 'I apologize, but I\'m having difficulty understanding your message right now. Could you try rephrasing what you\'d like to share? I\'m here to listen and support you.';
  }

  /**
   * Prepare conversation history for AI
   */
  private prepareConversationHistory(context: ConversationContext): string {
    const recentMessages = context.messages.slice(-this.config.contextWindowSize);
    
    return recentMessages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Get relevant therapeutic resources
   */
  private async getRelevantResources(
    metadata: MessageMetadata,
    crisisAnalysis: CrisisAnalysisResult
  ): Promise<TherapeuticResource[]> {
    const resources: TherapeuticResource[] = [];

    // Crisis resources take priority
    if (crisisAnalysis.hasCrisisIndicators) {
      resources.push({
        id: 'crisis-hotline',
        type: 'hotline',
        title: 'National Suicide Prevention Lifeline',
        description: '24/7 crisis support',
        url: 'tel:988',
        priority: 'critical'
      });

      resources.push({
        id: 'crisis-text',
        type: 'hotline',
        title: 'Crisis Text Line',
        description: 'Text HOME to 741741',
        url: 'sms:741741',
        priority: 'critical'
      });
    }

    // Add topic-specific resources
    for (const topic of metadata.topics) {
      const topicResources = await this.getTopicResources(topic);
      resources.push(...topicResources);
    }

    // Add emotion-specific resources
    if (metadata.emotions.length > 0) {
      const emotionResources = await this.getEmotionResources(metadata.emotions[0].emotion);
      resources.push(...emotionResources);
    }

    // Limit and sort by priority
    return resources
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
  }

  /**
   * Get topic-specific resources
   */
  private async getTopicResources(topic: string): Promise<TherapeuticResource[]> {
    const resources: TherapeuticResource[] = [];

    switch (topic) {
      case 'anxiety':
        resources.push({
          id: 'anxiety-guide',
          type: 'article',
          title: 'Managing Anxiety: Evidence-Based Techniques',
          description: 'Learn proven strategies for anxiety management',
          url: '/resources/anxiety',
          priority: 'medium'
        });
        break;

      case 'depression':
        resources.push({
          id: 'depression-guide',
          type: 'article',
          title: 'Understanding and Coping with Depression',
          description: 'Comprehensive guide to depression management',
          url: '/resources/depression',
          priority: 'medium'
        });
        break;

      case 'trauma':
        resources.push({
          id: 'trauma-support',
          type: 'professional',
          title: 'Find a Trauma-Informed Therapist',
          description: 'Connect with specialized mental health professionals',
          url: '/find-therapist',
          priority: 'high'
        });
        break;
    }

    return resources;
  }

  /**
   * Get emotion-specific resources
   */
  private async getEmotionResources(emotion: string): Promise<TherapeuticResource[]> {
    const resources: TherapeuticResource[] = [];

    switch (emotion) {
      case 'anger':
        resources.push({
          id: 'anger-management',
          type: 'video',
          title: 'Anger Management Techniques',
          description: '10-minute guided exercise for managing anger',
          url: '/videos/anger-management',
          priority: 'medium',
          duration: 600
        });
        break;

      case 'fear':
        resources.push({
          id: 'fear-exercise',
          type: 'exercise',
          title: 'Overcoming Fear: Gradual Exposure',
          description: 'Step-by-step guide to facing fears',
          url: '/exercises/fear-exposure',
          priority: 'medium'
        });
        break;
    }

    return resources;
  }

  /**
   * Get relevant interventions
   */
  private async getRelevantInterventions(
    metadata: MessageMetadata,
    context: ConversationContext
  ): Promise<Intervention[]> {
    const interventions: Intervention[] = [];

    // Breathing exercise for anxiety
    if (metadata.emotions.some(e => e.emotion === 'fear' || e.emotion === 'anxiety')) {
      interventions.push({
        type: 'breathing',
        name: 'Box Breathing',
        description: 'A calming breathing technique used by Navy SEALs',
        steps: [
          'Breathe in for 4 counts',
          'Hold for 4 counts',
          'Breathe out for 4 counts',
          'Hold for 4 counts',
          'Repeat 4-6 times'
        ],
        estimatedTime: 5,
        effectiveness: 0.85
      });
    }

    // Grounding for dissociation or panic
    if (metadata.sentiment.label === 'very_negative' || context.riskLevel === 'high') {
      interventions.push({
        type: 'grounding',
        name: '5-4-3-2-1 Technique',
        description: 'Sensory grounding exercise',
        steps: [
          'Name 5 things you can see',
          'Name 4 things you can touch',
          'Name 3 things you can hear',
          'Name 2 things you can smell',
          'Name 1 thing you can taste'
        ],
        estimatedTime: 3,
        effectiveness: 0.8
      });
    }

    // Cognitive restructuring for negative thoughts
    if (metadata.topics.includes('depression') || metadata.sentiment.score < -0.3) {
      interventions.push({
        type: 'cognitive',
        name: 'Thought Challenge',
        description: 'Question and reframe negative thoughts',
        steps: [
          'Identify the negative thought',
          'Rate how strongly you believe it (0-100%)',
          'List evidence for the thought',
          'List evidence against the thought',
          'Create a balanced thought',
          'Re-rate your belief in the original thought'
        ],
        estimatedTime: 10,
        effectiveness: 0.75
      });
    }

    return interventions.slice(0, 3);
  }

  /**
   * Generate conversation suggestions
   */
  private async generateSuggestions(
    context: ConversationContext,
    metadata: MessageMetadata
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Based on therapeutic approach
    switch (metadata.therapeuticApproach) {
      case 'cbt':
        suggestions.push('Help me identify my thought patterns');
        suggestions.push('I want to challenge my negative thoughts');
        break;
      case 'dbt':
        suggestions.push('Teach me distress tolerance skills');
        suggestions.push('Help me regulate my emotions');
        break;
      case 'mindfulness':
        suggestions.push('Guide me through a mindfulness exercise');
        suggestions.push('Help me stay present');
        break;
      case 'crisis':
        suggestions.push('I need immediate help');
        suggestions.push('Connect me with crisis support');
        break;
      default:
        suggestions.push('Tell me more about coping strategies');
        suggestions.push('Help me understand my feelings');
    }

    // Based on topics
    if (metadata.topics.includes('anxiety')) {
      suggestions.push('Help me manage my anxiety');
    }
    if (metadata.topics.includes('sleep')) {
      suggestions.push('I\'m having trouble sleeping');
    }

    // Always include a general option
    suggestions.push('I want to talk about something else');

    return suggestions.slice(0, 4);
  }

  /**
   * Store message with HIPAA-compliant encryption
   */
  private async storeMessage(message: ChatMessage, encrypt: boolean = true): Promise<void> {
    try {
      if (encrypt) {
        // Encrypt sensitive content
        const encryptedContent = await hipaaEncryption.encryptPHI(
          message.content,
          `chat:${message.userId}:${message.sessionId}`
        );

        // Store encrypted message
        await apiClient.post('/api/chat/messages', {
          ...message,
          content: JSON.stringify(encryptedContent),
          encrypted: true
        });
      } else {
        // Store unencrypted (for system messages only)
        await apiClient.post('/api/chat/messages', message);
      }

      logger.info('Message stored successfully', {
        messageId: message.id,
        userId: message.userId,
        encrypted
      });
    } catch (error) {
      logger.error('Failed to store message:', error);
      // Don't throw - allow conversation to continue even if storage fails
    }
  }

  /**
   * Get or create conversation context
   */
  private async getOrCreateContext(userId: string, sessionId: string): Promise<ConversationContext> {
    let context = this.conversations.get(sessionId);

    if (!context) {
      // Try to load from storage
      try {
        const response = await apiClient.get(`/api/chat/sessions/${sessionId}`);
        if (response.data) {
          context = response.data;
          
          // Decrypt messages if needed
          if (context.messages) {
            for (const msg of context.messages) {
              if (msg.encrypted) {
                const encrypted = JSON.parse(msg.content) as EncryptedData;
                msg.content = await hipaaEncryption.decryptPHI(
                  encrypted,
                  `chat:${userId}:${sessionId}`
                );
                msg.encrypted = false;
              }
            }
          }
        }
      } catch (error) {
        logger.debug('No existing session found, creating new one');
      }
    }

    if (!context) {
      // Create new context
      context = {
        sessionId,
        userId,
        messages: [],
        currentMood: 5,
        riskLevel: 'low',
        therapeuticGoals: [],
        personalizedContext: await this.loadPersonalizedContext(userId),
        lastActivity: new Date(),
        totalDuration: 0
      };
    }

    this.conversations.set(sessionId, context);
    return context;
  }

  /**
   * Load personalized context for user
   */
  private async loadPersonalizedContext(userId: string): Promise<PersonalizedContext> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/preferences`);
      return response.data;
    } catch (error) {
      // Return default context
      return {
        preferredTone: 'supportive',
        triggers: [],
        copingStrategies: [],
        therapyHistory: [],
        language: 'en',
        timezone: 'UTC'
      };
    }
  }

  /**
   * Check if user is rate limited
   */
  private isRateLimited(userId: string): boolean {
    const limit = this.rateLimits.get(userId);
    
    if (!limit) return false;
    
    const now = new Date();
    const windowEnd = new Date(limit.windowStart.getTime() + 60000); // 1 minute window
    
    if (now > windowEnd) {
      // Reset window
      this.rateLimits.delete(userId);
      return false;
    }
    
    return limit.requests >= this.config.rateLimitPerMinute || limit.blocked;
  }

  /**
   * Update rate limit for user
   */
  private updateRateLimit(userId: string): void {
    const limit = this.rateLimits.get(userId);
    const now = new Date();
    
    if (!limit) {
      this.rateLimits.set(userId, {
        userId,
        requests: 1,
        windowStart: now,
        blocked: false
      });
    } else {
      const windowEnd = new Date(limit.windowStart.getTime() + 60000);
      
      if (now > windowEnd) {
        // New window
        limit.requests = 1;
        limit.windowStart = now;
        limit.blocked = false;
      } else {
        limit.requests++;
        
        if (limit.requests > this.config.rateLimitPerMinute) {
          limit.blocked = true;
          limit.blockReason = 'Rate limit exceeded';
          
          this.emit('rateLimit:exceeded', { userId, requests: limit.requests });
        }
      }
    }
  }

  /**
   * Detect abusive content
   */
  private detectAbuse(message: string): boolean {
    const messageLower = message.toLowerCase();
    
    // Check for abusive patterns
    for (const pattern of this.abusivePatterns) {
      if (pattern.test(messageLower)) {
        return true;
      }
    }
    
    // Check for repeated characters (spam)
    if (/(.)\1{10,}/.test(message)) {
      return true;
    }
    
    // Check for excessive caps (shouting)
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.8 && message.length > 20) {
      return true;
    }
    
    return false;
  }

  /**
   * Handle abusive content
   */
  private async handleAbusiveContent(userId: string, message: string): Promise<void> {
    logger.warn('Abusive content detected', { userId, messageSnippet: message.substring(0, 50) });
    
    // Update rate limit with block
    const limit = this.rateLimits.get(userId) || {
      userId,
      requests: 0,
      windowStart: new Date(),
      blocked: false
    };
    
    limit.blocked = true;
    limit.blockReason = 'Abusive content detected';
    this.rateLimits.set(userId, limit);
    
    // Emit event for monitoring
    this.emit('abuse:detected', { userId, timestamp: new Date() });
    
    // Store incident for review
    try {
      await apiClient.post('/api/moderation/incidents', {
        userId,
        type: 'abusive_content',
        content: message.substring(0, 200), // Truncate for storage
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to store abuse incident:', error);
    }
  }

  /**
   * Escalate crisis situation
   */
  private async escalateCrisis(
    userId: string,
    sessionId: string,
    analysis: CrisisAnalysisResult
  ): Promise<void> {
    logger.error('Crisis escalation triggered', {
      userId,
      sessionId,
      severity: analysis.severityLevel
    });
    
    this.emit('crisis:escalated', {
      userId,
      sessionId,
      analysis,
      timestamp: new Date()
    });
    
    // Notify emergency contacts if configured
    try {
      await apiClient.post('/api/crisis/escalate', {
        userId,
        sessionId,
        analysis,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to escalate crisis:', error);
    }
  }

  /**
   * Initialize resource and intervention libraries
   */
  private initializeLibraries(): void {
    // Initialize with default resources
    this.resourceLibrary.set('crisis-hotline', {
      id: 'crisis-hotline',
      type: 'hotline',
      title: 'National Suicide Prevention Lifeline',
      description: '24/7 crisis support',
      url: 'tel:988',
      priority: 'critical'
    });

    // Initialize with default interventions
    this.interventionLibrary.set('box-breathing', {
      type: 'breathing',
      name: 'Box Breathing',
      description: 'A calming breathing technique',
      steps: [
        'Breathe in for 4 counts',
        'Hold for 4 counts',
        'Breathe out for 4 counts',
        'Hold for 4 counts'
      ],
      estimatedTime: 5,
      effectiveness: 0.85
    });
  }

  /**
   * Setup abusive content patterns
   */
  private setupAbusivePatterns(): void {
    this.abusivePatterns = [
      /\b(hate|kill|murder|rape|assault)\b.*\b(you|therapist|counselor)\b/i,
      /\b(stupid|idiot|dumb|worthless)\b.*\b(bot|ai|computer)\b/i,
      /\b(fuck|shit|damn|hell)\b.*\b(you|this|that)\b/i
    ];
  }

  /**
   * Start rate limit cleanup interval
   */
  private startRateLimitCleanup(): void {
    setInterval(() => {
      const now = new Date();
      
      for (const [userId, limit] of this.rateLimits.entries()) {
        const windowEnd = new Date(limit.windowStart.getTime() + 300000); // 5 minutes
        
        if (now > windowEnd) {
          this.rateLimits.delete(userId);
        }
      }
    }, 60000); // Clean every minute
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId: string): ConversationContext | null {
    return this.conversations.get(sessionId) || null;
  }

  /**
   * Clear conversation
   */
  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
    this.emit('conversation:cleared', { sessionId });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ChatbotConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config:updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ChatbotConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.conversations.clear();
    this.rateLimits.clear();
    this.messageQueue.clear();
    this.processingFlags.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const chatbotService = new AIChatbotService();
export default chatbotService;