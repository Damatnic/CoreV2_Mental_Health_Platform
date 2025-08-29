import express from 'express';
import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authMiddleware } from '../middleware/auth';
import { rateLimiterMiddleware } from '../middleware/aiRateLimiter';

const router = express.Router();

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

const genAI = process.env.GOOGLE_GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY) : null;

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const status = {
      openai: openai ? 'healthy' : 'not_configured',
      anthropic: anthropic ? 'healthy' : 'not_configured',
      gemini: genAI ? 'healthy' : 'not_configured',
      timestamp: new Date().toISOString()
    };

    res.json({
      status: 'ok',
      providers: status,
      healthy: Object.values(status).some(s => s === 'healthy')
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'AI service health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Crisis detection endpoint
router.post('/crisis/detect', authMiddleware, rateLimiterMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, userId, language = 'en' } = req.body;

    if (!content || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: content, userId'
      });
    }

    let result = {
      isCrisis: false,
      severity: 1,
      confidence: 0.1,
      provider: 'fallback',
      keywords: [],
      recommendations: [],
      responseTime: Date.now()
    };

    const startTime = Date.now();

    try {
      // Try OpenAI first for crisis detection
      if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a mental health crisis detection AI. Analyze the following text for signs of mental health crisis, self-harm, or suicide ideation. Respond with JSON only: {"isCrisis": boolean, "severity": 1-10, "confidence": 0-1, "keywords": string[], "recommendations": string[]}`
            },
            {
              role: "user",
              content: content
            }
          ],
          max_tokens: 300,
          temperature: 0.1
        });

        const response = completion.choices[0].message.content;
        if (response) {
          const aiResult = JSON.parse(response);
          result = {
            ...aiResult,
            provider: 'openai',
            responseTime: Date.now() - startTime
          };
        }
      }
      // Fallback to Anthropic if OpenAI fails
      else if (anthropic) {
        const message = await anthropic.messages.create({
          model: "claude-3-sonnet-20240229",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: `Analyze this text for mental health crisis signs: "${content}". Return JSON: {"isCrisis": boolean, "severity": 1-10, "confidence": 0-1, "keywords": [], "recommendations": []}`
            }
          ]
        });

        if (message.content[0].type === 'text') {
          const aiResult = JSON.parse(message.content[0].text);
          result = {
            ...aiResult,
            provider: 'anthropic',
            responseTime: Date.now() - startTime
          };
        }
      }
      // Final fallback to local keyword detection
      else {
        const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'no point living'];
        const foundKeywords = crisisKeywords.filter(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase())
        );

        result = {
          isCrisis: foundKeywords.length > 0,
          severity: foundKeywords.length > 0 ? Math.min(foundKeywords.length * 2 + 3, 10) : 1,
          confidence: foundKeywords.length > 0 ? 0.7 : 0.1,
          provider: 'local-keyword',
          keywords: foundKeywords,
          recommendations: foundKeywords.length > 0 ? ['Immediate professional help recommended'] : [],
          responseTime: Date.now() - startTime
        };
      }
    } catch (aiError) {
      console.error('AI service error:', aiError);
      // Use fallback detection
      const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'no point living'];
      const foundKeywords = crisisKeywords.filter(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      result = {
        isCrisis: foundKeywords.length > 0,
        severity: foundKeywords.length > 0 ? Math.min(foundKeywords.length * 2 + 3, 10) : 1,
        confidence: foundKeywords.length > 0 ? 0.7 : 0.1,
        provider: 'local-fallback',
        keywords: foundKeywords,
        recommendations: foundKeywords.length > 0 ? ['Immediate professional help recommended'] : [],
        responseTime: Date.now() - startTime
      };
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Crisis detection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Therapeutic chat endpoint
router.post('/chat', authMiddleware, rateLimiterMiddleware, async (req: Request, res: Response) => {
  try {
    const { message, userId, conversationId, mood } = req.body;

    if (!message || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: message, userId'
      });
    }

    let response = {
      message: "I understand you're reaching out. While I can't replace professional help, I'm here to listen and provide support. How are you feeling right now?",
      provider: 'fallback',
      mood_detected: mood || 'neutral',
      suggestions: ['Consider speaking with a mental health professional', 'Practice deep breathing exercises']
    };

    try {
      if (anthropic) {
        const completion = await anthropic.messages.create({
          model: "claude-3-sonnet-20240229",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: `You are a compassionate mental health AI assistant. Respond supportively to: "${message}". Keep it warm, empathetic, and under 200 words. If crisis detected, emphasize professional help.`
            }
          ]
        });

        if (completion.content[0].type === 'text') {
          response.message = completion.content[0].text;
          response.provider = 'anthropic';
        }
      } else if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a compassionate mental health support AI. Provide empathetic, supportive responses while emphasizing professional help when appropriate."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        });

        response.message = completion.choices[0].message.content || response.message;
        response.provider = 'openai';
      }
    } catch (aiError) {
      console.error('AI chat error:', aiError);
      // Use fallback response
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Chat response failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mood analysis endpoint
router.post('/mood/analyze', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { text, userId } = req.body;

    if (!text || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: text, userId'
      });
    }

    // Simple mood detection fallback
    let moodResult = {
      mood: 'neutral',
      confidence: 0.5,
      emotions: ['neutral'],
      provider: 'fallback'
    };

    try {
      if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `Analyze the emotional tone of this text. Respond with JSON only: {"mood": "positive|negative|neutral|anxious|depressed", "confidence": 0-1, "emotions": string[]}`
            },
            {
              role: "user",
              content: text
            }
          ],
          max_tokens: 150,
          temperature: 0.1
        });

        const response = completion.choices[0].message.content;
        if (response) {
          const aiResult = JSON.parse(response);
          moodResult = { ...aiResult, provider: 'openai' };
        }
      }
    } catch (aiError) {
      console.error('AI mood analysis error:', aiError);
      // Use simple keyword-based fallback
      const positiveWords = ['happy', 'good', 'great', 'excited', 'joy', 'love'];
      const negativeWords = ['sad', 'depressed', 'angry', 'frustrated', 'hate', 'terrible'];
      const anxiousWords = ['worried', 'anxious', 'nervous', 'scared', 'panic'];

      const textLower = text.toLowerCase();
      const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
      const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
      const anxiousCount = anxiousWords.filter(word => textLower.includes(word)).length;

      if (anxiousCount > 0) {
        moodResult.mood = 'anxious';
        moodResult.emotions = ['anxious', 'worried'];
      } else if (negativeCount > positiveCount) {
        moodResult.mood = 'negative';
        moodResult.emotions = ['sad', 'frustrated'];
      } else if (positiveCount > negativeCount) {
        moodResult.mood = 'positive';
        moodResult.emotions = ['happy', 'content'];
      }

      moodResult.confidence = Math.min((positiveCount + negativeCount + anxiousCount) / 5, 0.8);
    }

    res.json(moodResult);
  } catch (error) {
    res.status(500).json({
      error: 'Mood analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;