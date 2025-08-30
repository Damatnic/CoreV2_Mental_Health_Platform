import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/aiRateLimiter';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// AI Chat endpoint
router.post('/chat',
  authenticateToken,
  aiRateLimiter,
  [
    body('message').notEmpty().isString().trim().isLength({ min: 1, max: 2000 }),
    body('provider').optional().isIn(['openai', 'anthropic', 'gemini']),
    body('context').optional().isArray(),
    body('sessionId').optional().isUUID(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { message, provider = 'openai', context = [], sessionId } = req.body;
      const userId = (req as any).user.id;

      // Mental health safety check
      const isCrisis = await checkForCrisisContent(message);
      if (isCrisis) {
        return res.json({
          response: "I notice you may be going through a difficult time. Your safety is important. Please consider reaching out to the 988 Suicide & Crisis Lifeline (call or text 988) or emergency services (911) if you're in immediate danger.",
          crisis_detected: true,
          resources: getCrisisResources(),
        });
      }

      let aiResponse;
      switch (provider) {
        case 'anthropic':
          aiResponse = await getAnthropicResponse(message, context);
          break;
        case 'gemini':
          aiResponse = await getGeminiResponse(message, context);
          break;
        case 'openai':
        default:
          aiResponse = await getOpenAIResponse(message, context);
          break;
      }

      // Log conversation for analysis (with privacy protection)
      await logConversation(userId, sessionId, message, aiResponse, provider);

      res.json({
        response: aiResponse,
        provider,
        sessionId: sessionId || generateSessionId(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: 'Failed to process AI request' });
    }
  }
);

// Mental health assessment endpoint
router.post('/assessment',
  authenticateToken,
  aiRateLimiter,
  [
    body('responses').isArray().notEmpty(),
    body('assessmentType').isIn(['phq9', 'gad7', 'mood', 'crisis']),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { responses, assessmentType } = req.body;
      const userId = (req as any).user.id;

      const analysis = await analyzeAssessment(responses, assessmentType);
      const recommendations = await generateRecommendations(analysis);

      // Store assessment results
      await storeAssessment(userId, assessmentType, responses, analysis, recommendations);

      res.json({
        analysis,
        recommendations,
        riskLevel: analysis.riskLevel,
        followUpRequired: analysis.riskLevel === 'high',
      });
    } catch (error) {
      console.error('Assessment error:', error);
      res.status(500).json({ error: 'Failed to process assessment' });
    }
  }
);

// Crisis prediction endpoint
router.post('/predict-crisis',
  authenticateToken,
  [
    body('indicators').isObject(),
    body('history').optional().isArray(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { indicators, history } = req.body;
      const userId = (req as any).user.id;

      const prediction = await predictCrisisRisk(indicators, history);
      
      if (prediction.riskScore > 0.7) {
        // Trigger crisis intervention protocol
        await triggerCrisisIntervention(userId, prediction);
      }

      res.json({
        riskScore: prediction.riskScore,
        riskLevel: prediction.riskLevel,
        interventions: prediction.recommendedInterventions,
        supportResources: prediction.supportResources,
      });
    } catch (error) {
      console.error('Crisis prediction error:', error);
      res.status(500).json({ error: 'Failed to predict crisis risk' });
    }
  }
);

// Therapy session transcription
router.post('/transcribe',
  authenticateToken,
  aiRateLimiter,
  [
    body('audioUrl').isURL(),
    body('sessionId').isUUID(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { audioUrl, sessionId } = req.body;
      
      const transcription = await transcribeAudio(audioUrl);
      const summary = await generateSessionSummary(transcription);
      const insights = await extractTherapeuticInsights(transcription);

      res.json({
        transcription,
        summary,
        insights,
        sessionId,
      });
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: 'Failed to transcribe audio' });
    }
  }
);

// Wellness content generation
router.post('/generate-content',
  authenticateToken,
  aiRateLimiter,
  [
    body('contentType').isIn(['meditation', 'affirmation', 'journal_prompt', 'coping_strategy']),
    body('preferences').optional().isObject(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { contentType, preferences } = req.body;
      const userId = (req as any).user.id;

      const content = await generateWellnessContent(contentType, preferences, userId);

      res.json({
        content,
        contentType,
        personalized: true,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Content generation error:', error);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  }
);

// Helper functions
async function checkForCrisisContent(message: string): Promise<boolean> {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'not worth living',
    'better off dead', 'no point', 'give up', 'harm myself',
    'self harm', 'cutting', 'overdose', 'jump off',
  ];
  
  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
}

function getCrisisResources() {
  return {
    hotlines: [
      { name: '988 Suicide & Crisis Lifeline', number: '988', available: '24/7' },
      { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7' },
      { name: 'SAMHSA National Helpline', number: '1-800-662-4357', available: '24/7' },
    ],
    online: [
      { name: 'Crisis Chat', url: 'https://988lifeline.org/chat/' },
      { name: 'Veterans Crisis Line', url: 'https://www.veteranscrisisline.net/' },
    ],
    emergency: {
      number: '911',
      text: 'If you are in immediate danger, please call 911',
    },
  };
}

async function getOpenAIResponse(message: string, context: any[]): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a supportive mental health assistant. Provide empathetic, helpful responses while encouraging professional help when appropriate. Never provide medical diagnoses or replace professional therapy.',
      },
      ...context,
      { role: 'user', content: message },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content || 'I understand you\'re reaching out. How can I support you today?';
}

async function getAnthropicResponse(message: string, context: any[]): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `As a supportive mental health assistant, respond to: ${message}`,
      },
    ],
  });

  return response.content[0].type === 'text' 
    ? response.content[0].text 
    : 'I\'m here to support you. Could you tell me more about what you\'re experiencing?';
}

async function getGeminiResponse(message: string, context: any[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `As a supportive mental health assistant, provide an empathetic response to: ${message}
  
  Guidelines:
  - Be supportive and understanding
  - Encourage professional help when appropriate
  - Never provide medical diagnoses
  - Focus on emotional support and coping strategies`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  return response.text() || 'I hear you and I\'m here to support you. What would be most helpful right now?';
}

async function analyzeAssessment(responses: any[], type: string): Promise<any> {
  // Implement assessment scoring logic based on type
  let score = 0;
  let riskLevel = 'low';
  
  // PHQ-9 scoring example
  if (type === 'phq9') {
    score = responses.reduce((sum, r) => sum + r.value, 0);
    if (score >= 20) riskLevel = 'high';
    else if (score >= 10) riskLevel = 'moderate';
  }

  return {
    score,
    riskLevel,
    interpretation: getInterpretation(type, score),
    clinicalRange: getClinicalRange(type, score),
  };
}

function getInterpretation(type: string, score: number): string {
  // Return appropriate interpretation based on assessment type and score
  const interpretations: Record<string, any> = {
    phq9: {
      low: 'Minimal depression symptoms',
      moderate: 'Moderate depression symptoms - consider professional support',
      high: 'Severe depression symptoms - professional help strongly recommended',
    },
    gad7: {
      low: 'Minimal anxiety symptoms',
      moderate: 'Moderate anxiety symptoms - consider coping strategies',
      high: 'Severe anxiety symptoms - professional help recommended',
    },
  };

  const level = score < 5 ? 'low' : score < 15 ? 'moderate' : 'high';
  return interpretations[type]?.[level] || 'Please consult with a mental health professional for interpretation';
}

function getClinicalRange(type: string, score: number): string {
  const ranges: Record<string, any> = {
    phq9: {
      '0-4': 'Minimal',
      '5-9': 'Mild',
      '10-14': 'Moderate',
      '15-19': 'Moderately Severe',
      '20-27': 'Severe',
    },
    gad7: {
      '0-4': 'Minimal',
      '5-9': 'Mild',
      '10-14': 'Moderate',
      '15-21': 'Severe',
    },
  };

  // Find appropriate range
  for (const [range, label] of Object.entries(ranges[type] || {})) {
    const [min, max] = range.split('-').map(Number);
    if (score >= min && score <= max) return label;
  }
  
  return 'Unknown';
}

async function generateRecommendations(analysis: any): Promise<string[]> {
  const recommendations = [];
  
  if (analysis.riskLevel === 'high') {
    recommendations.push('Seek immediate professional mental health support');
    recommendations.push('Contact crisis helpline if experiencing thoughts of self-harm');
  }
  
  if (analysis.riskLevel === 'moderate') {
    recommendations.push('Consider scheduling an appointment with a mental health professional');
    recommendations.push('Practice daily self-care and stress management techniques');
  }
  
  recommendations.push('Maintain regular sleep schedule');
  recommendations.push('Engage in physical activity');
  recommendations.push('Connect with supportive friends or family');
  
  return recommendations;
}

async function storeAssessment(userId: string, type: string, responses: any[], analysis: any, recommendations: any) {
  // Store in database - implementation depends on database setup
  console.log('Storing assessment for user:', userId);
}

async function predictCrisisRisk(indicators: any, history: any[]): Promise<any> {
  // Implement ML-based crisis prediction
  let riskScore = 0;
  
  // Simple rule-based system (should be replaced with ML model)
  if (indicators.moodScore < 3) riskScore += 0.3;
  if (indicators.sleepHours < 4) riskScore += 0.2;
  if (indicators.socialIsolation) riskScore += 0.2;
  if (indicators.substanceUse) riskScore += 0.15;
  if (indicators.recentLoss) riskScore += 0.15;
  
  const riskLevel = riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'moderate' : 'low';
  
  return {
    riskScore,
    riskLevel,
    recommendedInterventions: getInterventions(riskLevel),
    supportResources: getCrisisResources(),
  };
}

function getInterventions(riskLevel: string): string[] {
  const interventions: Record<string, string[]> = {
    high: [
      'Immediate crisis counselor contact',
      'Safety plan activation',
      'Emergency contact notification',
      'Professional intervention required',
    ],
    moderate: [
      'Schedule therapy session',
      'Daily check-ins',
      'Coping skills activation',
      'Support network engagement',
    ],
    low: [
      'Continue self-care routine',
      'Monitor mood changes',
      'Maintain social connections',
    ],
  };
  
  return interventions[riskLevel] || interventions.low;
}

async function triggerCrisisIntervention(userId: string, prediction: any) {
  // Implement crisis intervention protocol
  console.log('Crisis intervention triggered for user:', userId);
  // Send notifications, alert support team, etc.
}

async function transcribeAudio(audioUrl: string): Promise<string> {
  // Implement audio transcription using OpenAI Whisper or similar
  return 'Transcription placeholder - implement with Whisper API';
}

async function generateSessionSummary(transcription: string): Promise<string> {
  // Generate therapy session summary using AI
  return 'Session summary placeholder';
}

async function extractTherapeuticInsights(transcription: string): Promise<any> {
  // Extract key therapeutic insights from session
  return {
    themes: [],
    emotions: [],
    breakthroughs: [],
    homework: [],
  };
}

async function generateWellnessContent(type: string, preferences: any, userId: string): Promise<any> {
  const contentGenerators: Record<string, Function> = {
    meditation: generateMeditationScript,
    affirmation: generateAffirmations,
    journal_prompt: generateJournalPrompt,
    coping_strategy: generateCopingStrategy,
  };
  
  const generator = contentGenerators[type];
  if (!generator) throw new Error('Invalid content type');
  
  return generator(preferences, userId);
}

async function generateMeditationScript(preferences: any, userId: string): Promise<any> {
  return {
    title: 'Calming Breath Meditation',
    duration: '10 minutes',
    script: 'Begin by finding a comfortable position...',
    audioUrl: null,
  };
}

async function generateAffirmations(preferences: any, userId: string): Promise<string[]> {
  return [
    'I am worthy of love and respect',
    'I have the strength to overcome challenges',
    'I choose peace and calm in this moment',
    'I am making progress, one step at a time',
    'I deserve compassion, especially from myself',
  ];
}

async function generateJournalPrompt(preferences: any, userId: string): Promise<string> {
  const prompts = [
    'What are three things you\'re grateful for today?',
    'Describe a moment when you felt truly at peace.',
    'What would you tell your younger self?',
    'What boundaries do you need to set for your wellbeing?',
    'How can you show yourself compassion today?',
  ];
  
  return prompts[Math.floor(Math.random() * prompts.length)];
}

async function generateCopingStrategy(preferences: any, userId: string): Promise<any> {
  return {
    strategy: '5-4-3-2-1 Grounding Technique',
    description: 'Use your senses to ground yourself in the present moment',
    steps: [
      'Name 5 things you can see',
      'Name 4 things you can touch',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste',
    ],
  };
}

async function logConversation(userId: string, sessionId: string | null, message: string, response: string, provider: string) {
  // Log conversation for analysis (with privacy protection)
  console.log('Logging conversation for analysis');
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default router;