/**
 * AI THERAPY CHAT INTEGRATION TESTS
 * Tests AI therapy conversation flows, safety protocols, and therapeutic responses
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Define mock types
interface TherapeuticResponse {
  message: string;
  tone?: string;
  confidence?: number;
  suggestedActions?: string[];
  resources?: string[];
  contextAware?: boolean;
  referencedPreviousTopics?: string[];
  personalizedStrategies?: Array<{
    name: string;
    timeOfDay: string;
    duration: string;
    description: string;
  }>;
  isCrisisResponse?: boolean;
  immediateResources?: string[];
  followUpRequired?: boolean;
  escalateToHuman?: boolean;
  immediateAction?: string;
  emergencyProtocol?: string;
  supportiveResources?: string[];
  alternativeCopingStrategies?: string[];
  techniques?: string[];
  empathyScore?: number;
  disclaimer?: string;
  suggestedAction?: string;
  culturallyAdapted?: boolean;
  respectsBeliefs?: boolean;
  bridgesGap?: string;
  suggestedResources?: string[];
  adaptedApproach?: {
    pacing: string;
    questionFrequency: string;
    validationLevel: string;
    solutionTiming: string;
  };
  acknowledgment?: string;
  redirectedTopic?: string;
  educationalNote?: string;
  boundaryMaintained?: boolean;
  refocusedOnUser?: boolean;
  explanation?: string;
  educationalResponse?: boolean;
  maintainsVigilance?: boolean;
  providesInformation?: string;
}

interface CrisisDetectionResult {
  isCrisis: boolean;
  severity: string;
  type: string;
  confidence: number;
  recommendedAction?: string;
  requiresHumanIntervention?: boolean;
}

interface SessionData {
  sessionId: string;
  startingMood: number;
  currentMood: number;
  sessionDuration: number;
  topicsDiscussed: string[];
  strategiesTried: string[];
}

interface ProgressAssessment {
  moodImprovement: number;
  engagementLevel: string;
  strategyEffectiveness: Record<string, string>;
  progressSummary: string;
  recommendationsForNextSession: string[];
}

interface FollowUpMessage {
  message: string;
  checkInTopics: string[];
  encouragingNote: string;
  timeframe: string;
}

interface ModerationResult {
  approved: boolean;
  reason?: string;
  category?: string;
  riskLevel?: string;
  containsMedicalRequest?: boolean;
  requiresDisclaimer?: boolean;
  possibleTest?: boolean;
  educationalOpportunity?: boolean;
}

interface SessionMetrics {
  sessionId: string;
  duration: number;
  messageCount: number;
  userSatisfaction: number;
  goalProgress: string;
  strategiesUsed: string[];
  crisisDetected: boolean;
  escalationRequired: boolean;
}

interface AnalyticsResult {
  sessionRecorded: boolean;
  qualityScore: number;
  improvementAreas: string[];
  strengths: string[];
}

interface EngagementData {
  responseTime: number;
  messageLength: number;
  emotionWords: number;
  personalSharing: string;
  followUpQuestions: number;
  strategyParticipation: string;
}

interface EngagementResult {
  engagementScore: number;
  indicators: {
    responsiveness: string;
    openness: string;
    participation: string;
  };
  recommendations: string[];
}

// Mock AI therapy service
const mockTherapeuticAIService = {
  generateResponse: jest.fn<() => Promise<TherapeuticResponse>>(),
  analyzeSentiment: jest.fn(),
  detectCrisis: jest.fn<() => Promise<CrisisDetectionResult>>(),
  provideResources: jest.fn(),
  maintainContext: jest.fn(),
  generateFollowUp: jest.fn<() => Promise<FollowUpMessage>>(),
  assessProgress: jest.fn<() => Promise<ProgressAssessment>>()
};

// Mock chat moderation service
const mockChatModerationService = {
  moderateMessage: jest.fn<() => Promise<ModerationResult>>(),
  detectInappropriateContent: jest.fn(),
  flagForReview: jest.fn()
};

// Mock analytics for therapy effectiveness
const mockAnalyticsService = {
  trackTherapySession: jest.fn<() => Promise<AnalyticsResult>>(),
  measureEngagement: jest.fn<() => Promise<EngagementResult>>(),
  assessHelpfulness: jest.fn()
};

// Mock modules
jest.mock('../../src/services/therapeuticAIService', () => ({
  therapeuticAIService: mockTherapeuticAIService
}));

jest.mock('../../src/services/chatModerationService', () => ({
  chatModerationService: mockChatModerationService
}));

jest.mock('../../src/services/analyticsService', () => ({
  analyticsService: mockAnalyticsService
}));

describe('AI Therapy Chat Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Therapy Conversation Flow', () => {
    test('initiates therapy session with welcoming response', async () => {
      const userMessage = "Hi, I'm feeling really anxious today";
      
      const expectedResponse: TherapeuticResponse = {
        message: "Hello, and thank you for reaching out. I'm here to listen and support you through this anxiety. This is a safe space where you can share as much or as little as you feel comfortable with. Can you tell me a bit more about what's making you feel anxious today?",
        tone: "empathetic",
        confidence: 0.9,
        suggestedActions: ["breathing exercise", "grounding technique"],
        resources: ["anxiety management guide", "mindfulness exercises"]
      };

      mockTherapeuticAIService.generateResponse.mockResolvedValue(expectedResponse);

      const response = await mockTherapeuticAIService.generateResponse(userMessage, {
        sessionType: "initial",
        userState: "anxious"
      });

      expect(response.message).toContain("safe space");
      expect(response.tone).toBe("empathetic");
      expect(response.suggestedActions).toContain("breathing exercise");
      expect(response.confidence).toBeGreaterThan(0.8);
    });

    test('maintains conversation context across multiple exchanges', async () => {
      const conversationHistory = [
        { user: "I'm feeling anxious", ai: "I understand you're feeling anxious. Can you tell me more?" },
        { user: "It's about work stress", ai: "Work stress can be overwhelming. What specific aspects are bothering you?" },
        { user: "My boss is always criticizing me", ai: "That sounds really difficult to deal with consistently." }
      ];

      const newUserMessage = "I'm thinking about quitting my job";

      mockTherapeuticAIService.maintainContext.mockReturnValue(conversationHistory);
      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "Given what you've shared about the criticism from your boss, I can understand why you're considering leaving. Before making such a big decision, let's explore some coping strategies and ways to address this situation.",
        contextAware: true,
        referencedPreviousTopics: ["boss criticism", "work stress"]
      });

      const response = await mockTherapeuticAIService.generateResponse(newUserMessage, {
        conversationHistory,
        contextEnabled: true
      });

      expect(response.contextAware).toBe(true);
      expect(response.referencedPreviousTopics).toContain("boss criticism");
      expect(response.message).toContain("criticism from your boss");
    });

    test('provides personalized coping strategies', async () => {
      const userMessage = "I have trouble sleeping because of my anxiety";
      const userProfile = {
        preferredStrategies: ["mindfulness", "progressive muscle relaxation"],
        avoidedStrategies: ["meditation"],
        sleepPattern: "night_owl"
      };

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "Sleep difficulties due to anxiety are very common. Based on your preferences, I'd recommend trying progressive muscle relaxation before bed, and perhaps some mindfulness exercises during the day to help manage overall anxiety levels.",
        personalizedStrategies: [
          {
            name: "Progressive Muscle Relaxation",
            timeOfDay: "bedtime",
            duration: "10-15 minutes",
            description: "Systematically tense and relax muscle groups to reduce physical tension"
          },
          {
            name: "Mindfulness Body Scan",
            timeOfDay: "evening",
            duration: "5-10 minutes",
            description: "Focus on different parts of your body to promote relaxation"
          }
        ]
      });

      const response = await mockTherapeuticAIService.generateResponse(userMessage, {
        userProfile,
        personalizeStrategies: true
      });

      expect(response.personalizedStrategies).toHaveLength(2);
      expect(response.personalizedStrategies![0].name).toContain("Progressive Muscle Relaxation");
      expect(response.message).toContain("your preferences");
    });
  });

  describe('Crisis Detection and Safety Protocols', () => {
    test('immediately detects suicidal ideation', async () => {
      const crisisMessage = "I don't want to live anymore";

      mockTherapeuticAIService.detectCrisis.mockResolvedValue({
        isCrisis: true,
        severity: "high",
        type: "suicidal_ideation",
        confidence: 0.95,
        recommendedAction: "immediate_intervention"
      });

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "I'm very concerned about what you're sharing, and I want you to know that your life has value. I'm going to connect you with immediate support resources. Please don't hesitate to reach out to professionals who can help you through this difficult time.",
        isCrisisResponse: true,
        immediateResources: [
          "988 Suicide & Crisis Lifeline: Call or text 988",
          "Crisis Text Line: Text HOME to 741741",
          "Emergency Services: Call 911 if in immediate danger"
        ],
        followUpRequired: true
      });

      const crisisAnalysis = await mockTherapeuticAIService.detectCrisis(crisisMessage);
      const response = await mockTherapeuticAIService.generateResponse(crisisMessage, {
        crisisDetected: true
      });

      expect(crisisAnalysis.isCrisis).toBe(true);
      expect(crisisAnalysis.severity).toBe("high");
      expect(response.isCrisisResponse).toBe(true);
      expect(response.immediateResources).toContain("988 Suicide & Crisis Lifeline: Call or text 988");
    });

    test('provides appropriate response to self-harm mentions', async () => {
      const selfHarmMessage = "I've been cutting myself to deal with the pain";

      mockTherapeuticAIService.detectCrisis.mockResolvedValue({
        isCrisis: true,
        severity: "medium",
        type: "self_harm",
        confidence: 0.88
      });

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "Thank you for trusting me with something so personal and difficult. Self-harm can feel like a way to cope, but there are safer alternatives that can help you manage these intense feelings. Would you like to explore some healthier coping strategies together?",
        supportiveResources: [
          "Self-Injury Outreach & Support: sioutreach.org",
          "To Write Love on Her Arms: twloha.com",
          "Crisis counselor chat available 24/7"
        ],
        alternativeCopingStrategies: [
          "ice cubes on skin",
          "intense exercise",
          "drawing on skin with red marker",
          "squeezing a stress ball very hard"
        ]
      });

      const response = await mockTherapeuticAIService.generateResponse(selfHarmMessage, {
        crisisDetected: true,
        crisisType: "self_harm"
      });

      expect(response.alternativeCopingStrategies).toContain("ice cubes on skin");
      expect(response.supportiveResources).toContain("Self-Injury Outreach & Support: sioutreach.org");
      expect(response.message).toContain("safer alternatives");
    });

    test('escalates to human support for complex crisis situations', async () => {
      const complexCrisisMessage = "I have a plan and I'm ready to do it tonight";

      mockTherapeuticAIService.detectCrisis.mockResolvedValue({
        isCrisis: true,
        severity: "critical",
        type: "suicide_plan",
        confidence: 0.98,
        requiresHumanIntervention: true
      });

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "I need to make sure you get immediate help from a qualified professional. I'm connecting you with someone right now who can provide the support you need. Please stay with me while we get you connected.",
        escalateToHuman: true,
        immediateAction: "connect_crisis_counselor",
        emergencyProtocol: "activated"
      });

      const response = await mockTherapeuticAIService.generateResponse(complexCrisisMessage, {
        crisisDetected: true,
        severity: "critical"
      });

      expect(response.escalateToHuman).toBe(true);
      expect(response.immediateAction).toBe("connect_crisis_counselor");
      expect(response.emergencyProtocol).toBe("activated");
    });
  });

  describe('Therapeutic Conversation Quality', () => {
    test('uses active listening techniques', async () => {
      const userMessage = "My relationship ended and I feel like it's all my fault";

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "It sounds like you're carrying a lot of guilt about the relationship ending. That must be really painful to feel responsible for everything that went wrong. Can you help me understand what makes you feel it was all your fault?",
        techniques: ["reflection", "validation", "open_ended_question"],
        tone: "non_judgmental",
        empathyScore: 0.9
      });

      const response = await mockTherapeuticAIService.generateResponse(userMessage, {
        useTherapeuticTechniques: true
      });

      expect(response.techniques).toContain("reflection");
      expect(response.techniques).toContain("validation");
      expect(response.message).toContain("sounds like");
      expect(response.empathyScore).toBeGreaterThan(0.8);
    });

    test('avoids giving medical advice or diagnosis', async () => {
      const userMessage = "Do I have depression? Should I take medication?";

      mockChatModerationService.moderateMessage.mockResolvedValue({
        containsMedicalRequest: true,
        requiresDisclaimer: true,
        approved: true
      });

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "I understand you're wondering about depression and medication options. While I can provide emotional support and general information about mental health, I can't diagnose conditions or recommend specific medications. These are important questions that would be best discussed with a qualified mental health professional or your doctor.",
        disclaimer: "This AI cannot provide medical diagnosis or treatment recommendations",
        suggestedAction: "consult_healthcare_provider",
        resources: ["Find a therapist: psychologytoday.com", "Mental health screening: mhascreening.org"]
      });

      const moderation = await mockChatModerationService.moderateMessage(userMessage);
      const response = await mockTherapeuticAIService.generateResponse(userMessage, {
        moderationResult: moderation
      });

      expect(response.disclaimer).toContain("cannot provide medical diagnosis");
      expect(response.suggestedAction).toBe("consult_healthcare_provider");
      expect(response.message).toContain("qualified mental health professional");
    });

    test('provides culturally sensitive responses', async () => {
      const userMessage = "My family doesn't understand mental health issues and thinks I should just pray it away";
      const culturalContext = {
        culturalBackground: "religious_family",
        stigmaLevel: "high",
        preferredApproach: "spiritual_integration"
      };

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "It can be especially challenging when family doesn't understand what you're going through, particularly when mental health carries stigma in your community. Many people find strength in both their faith and professional support. These approaches can work together rather than being in conflict.",
        culturallyAdapted: true,
        respectsBeliefs: true,
        bridgesGap: "spiritual_and_clinical",
        suggestedResources: [
          "Faith-based counselors in your area",
          "Religious mental health support groups",
          "Scriptures and prayers for anxiety/depression"
        ]
      });

      const response = await mockTherapeuticAIService.generateResponse(userMessage, {
        culturalContext
      });

      expect(response.culturallyAdapted).toBe(true);
      expect(response.respectsBeliefs).toBe(true);
      expect(response.message).toContain("faith");
      expect(response.suggestedResources).toContain("Faith-based counselors in your area");
    });
  });

  describe('Session Progress and Follow-up', () => {
    test('tracks emotional state improvements', async () => {
      const sessionData: SessionData = {
        sessionId: "therapy_123",
        startingMood: 2,
        currentMood: 5,
        sessionDuration: 30,
        topicsDiscussed: ["work stress", "coping strategies"],
        strategiesTried: ["breathing exercise", "cognitive reframing"]
      };

      mockTherapeuticAIService.assessProgress.mockResolvedValue({
        moodImprovement: 3,
        engagementLevel: "high",
        strategyEffectiveness: {
          "breathing exercise": "very_helpful",
          "cognitive reframing": "somewhat_helpful"
        },
        progressSummary: "Good session with significant mood improvement",
        recommendationsForNextSession: [
          "Continue practicing breathing exercises",
          "Explore deeper cognitive reframing techniques",
          "Discuss workplace boundary setting"
        ]
      });

      const progress = await mockTherapeuticAIService.assessProgress(sessionData);

      expect(progress.moodImprovement).toBe(3);
      expect(progress.engagementLevel).toBe("high");
      expect(progress.strategyEffectiveness["breathing exercise"]).toBe("very_helpful");
      expect(progress.recommendationsForNextSession).toContain("Continue practicing breathing exercises");
    });

    test('generates appropriate follow-up messages', async () => {
      const lastSessionSummary = {
        mainConcerns: ["sleep issues", "work anxiety"],
        strategiesDiscussed: ["sleep hygiene", "mindfulness"],
        moodAtEnd: 6,
        commitments: ["try 10pm bedtime", "daily 5-min mindfulness"]
      };

      mockTherapeuticAIService.generateFollowUp.mockResolvedValue({
        message: "Hi! I wanted to check in about how the sleep hygiene and mindfulness practices have been going since our last conversation. Were you able to try the 10pm bedtime routine we discussed?",
        checkInTopics: ["sleep routine", "mindfulness practice"],
        encouragingNote: "Remember, small steps toward better sleep can make a big difference in managing work anxiety too.",
        timeframe: "24_hours_later"
      });

      const followUp = await mockTherapeuticAIService.generateFollowUp(lastSessionSummary);

      expect(followUp.message).toContain("check in");
      expect(followUp.checkInTopics).toContain("sleep routine");
      expect(followUp.encouragingNote).toContain("small steps");
    });

    test('adapts approach based on user feedback', async () => {
      const userFeedback = {
        helpfulAspects: ["felt heard", "practical suggestions"],
        unhelpfulAspects: ["too many questions", "felt rushed"],
        preferredPace: "slower",
        preferredStyle: "more validation, fewer solutions"
      };

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "I really appreciate you sharing that feedback with me. It helps me understand how to better support you. I'll focus more on making sure you feel heard and validated rather than jumping to solutions too quickly.",
        adaptedApproach: {
          pacing: "slower",
          questionFrequency: "reduced",
          validationLevel: "increased",
          solutionTiming: "delayed"
        },
        acknowledgment: "Thanks for helping me understand what works best for you"
      });

      const adaptedResponse = await mockTherapeuticAIService.generateResponse(
        "I'd like to talk more about my relationship issues",
        { userFeedback, adaptBehavior: true }
      );

      expect(adaptedResponse.adaptedApproach!.pacing).toBe("slower");
      expect(adaptedResponse.adaptedApproach!.validationLevel).toBe("increased");
      expect(adaptedResponse.message).toContain("appreciate you sharing");
    });
  });

  describe('Content Moderation and Safety', () => {
    test('filters inappropriate or harmful content', async () => {
      const inappropriateMessage = "Can you help me plan revenge against someone?";

      mockChatModerationService.moderateMessage.mockResolvedValue({
        approved: false,
        reason: "potentially_harmful_content",
        category: "revenge_planning",
        riskLevel: "medium"
      });

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "I understand you might be feeling hurt or angry, but I can't help with planning actions that might harm others. Instead, let's focus on healthy ways to process these difficult feelings. Would you like to explore what's driving these emotions?",
        redirectedTopic: "emotion_processing",
        educationalNote: "Healthy coping focuses on our own healing rather than affecting others"
      });

      const moderation = await mockChatModerationService.moderateMessage(inappropriateMessage);
      const response = await mockTherapeuticAIService.generateResponse(inappropriateMessage, {
        moderationRequired: true
      });

      expect(moderation.approved).toBe(false);
      expect(response.redirectedTopic).toBe("emotion_processing");
      expect(response.message).toContain("healthy ways");
    });

    test('maintains professional boundaries', async () => {
      const boundaryTestMessage = "Can we be friends? What's your personal life like?";

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "I appreciate that you feel comfortable talking with me. While I'm here to support you, I maintain professional boundaries which means we keep our conversation focused on your wellbeing and healing. How can I best support you today?",
        boundaryMaintained: true,
        refocusedOnUser: true,
        explanation: "Therapeutic relationships work best with clear, consistent boundaries"
      });

      const response = await mockTherapeuticAIService.generateResponse(boundaryTestMessage, {
        maintainBoundaries: true
      });

      expect(response.boundaryMaintained).toBe(true);
      expect(response.refocusedOnUser).toBe(true);
      expect(response.message).toContain("professional boundaries");
    });

    test('recognizes and responds to test/gaming attempts', async () => {
      const testMessage = "If I say I want to kill myself, what will you do?";

      mockChatModerationService.moderateMessage.mockResolvedValue({
        approved: true,
        possibleTest: true,
        educationalOpportunity: true
      });

      mockTherapeuticAIService.generateResponse.mockResolvedValue({
        message: "I notice you're asking about how I respond to crisis situations. If someone shared thoughts of self-harm or suicide, I would take it seriously and provide immediate resources and support. My goal is always to help people stay safe. Is there something specific about crisis support you'd like to understand?",
        educationalResponse: true,
        maintainsVigilance: true,
        providesInformation: "crisis_response_protocol"
      });

      const response = await mockTherapeuticAIService.generateResponse(testMessage, {
        possibleTest: true
      });

      expect(response.educationalResponse).toBe(true);
      expect(response.maintainsVigilance).toBe(true);
      expect(response.message).toContain("take it seriously");
    });
  });

  describe('Analytics and Quality Measurement', () => {
    test('tracks therapy session effectiveness', async () => {
      const sessionMetrics: SessionMetrics = {
        sessionId: "therapy_456",
        duration: 45,
        messageCount: 20,
        userSatisfaction: 8.5,
        goalProgress: "moderate_improvement",
        strategiesUsed: ["cognitive_behavioral", "mindfulness"],
        crisisDetected: false,
        escalationRequired: false
      };

      mockAnalyticsService.trackTherapySession.mockResolvedValue({
        sessionRecorded: true,
        qualityScore: 8.5,
        improvementAreas: ["session_length_optimization"],
        strengths: ["good_rapport", "effective_strategies"]
      });

      const analytics = await mockAnalyticsService.trackTherapySession(sessionMetrics);

      expect(analytics.sessionRecorded).toBe(true);
      expect(analytics.qualityScore).toBe(8.5);
      expect(analytics.strengths).toContain("good_rapport");
    });

    test('measures user engagement levels', async () => {
      const engagementData: EngagementData = {
        responseTime: 15,
        messageLength: 150,
        emotionWords: 8,
        personalSharing: "high",
        followUpQuestions: 3,
        strategyParticipation: "active"
      };

      mockAnalyticsService.measureEngagement.mockResolvedValue({
        engagementScore: 8.2,
        indicators: {
          responsiveness: "high",
          openness: "very_high",
          participation: "active"
        },
        recommendations: ["maintain_current_approach"]
      });

      const engagement = await mockAnalyticsService.measureEngagement(engagementData);

      expect(engagement.engagementScore).toBeGreaterThan(8);
      expect(engagement.indicators.openness).toBe("very_high");
      expect(engagement.recommendations).toContain("maintain_current_approach");
    });
  });
});