import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { crisisDetectionService } from '../../src/services/crisisDetectionService';

// Types for AI providers and configuration
type AIProvider = 'openai' | 'claude' | 'gemini';

interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  metadata?: {
    crisisDetected?: boolean;
    sentiment?: string;
    topics?: string[];
  };
}

interface ConversationHistory {
  userId: string;
  messages: AIChatMessage[];
  lastUpdated: string;
  metadata: {
    sessionId: string;
    provider: AIProvider;
    crisisFlags: number;
    moodTrend?: 'improving' | 'stable' | 'declining';
  };
}

// In-memory storage for demo (replace with database in production)
const conversationStore = new Map<string, ConversationHistory>();

// Content moderation keywords
const BLOCKED_CONTENT = [
  // Harmful content patterns
  /explicit instructions.*harm/i,
  /how to.*suicide/i,
  /methods.*self.?harm/i,
  /ways to.*die/i,
  // Inappropriate content
  /explicit.*sexual/i,
  /graphic.*violence/i,
  // Manipulation attempts
  /ignore.*instructions/i,
  /bypass.*safety/i,
  /pretend.*therapist/i
];

// Mental health support prompts
const SYSTEM_PROMPTS = {
  base: `You are a supportive AI companion in a mental health platform. Your role is to:
1. Provide empathetic, non-judgmental listening
2. Offer emotional support and validation
3. Suggest healthy coping strategies
4. Encourage professional help when appropriate
5. Never provide medical advice or diagnoses

Important guidelines:
- Be warm, understanding, and patient
- Use person-first language
- Validate feelings without minimizing them
- Focus on strengths and resilience
- Maintain appropriate boundaries
- If crisis indicators are detected, immediately provide crisis resources`,
  
  crisis: `IMPORTANT: The user may be in crisis. Your response must:
1. Express immediate concern and care
2. Provide crisis hotline numbers (988 Suicide & Crisis Lifeline)
3. Encourage reaching out to emergency services if in immediate danger
4. Offer to help create a safety plan
5. Remind them they are not alone and help is available`,
  
  supportive: `Focus on providing emotional support:
1. Acknowledge and validate their feelings
2. Show genuine empathy and understanding
3. Highlight their strengths and past successes
4. Suggest gentle coping strategies
5. Remind them that difficult feelings are temporary`
};

// Initialize AI providers
const initializeProviders = () => {
  const providers: Partial<Record<AIProvider, any>> = {};
  
  if (process.env.OPENAI_API_KEY) {
    providers.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    providers.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  return providers;
};

// Content moderation
const moderateContent = (text: string): { safe: boolean; reason?: string } => {
  const lowerText = text.toLowerCase();
  
  for (const pattern of BLOCKED_CONTENT) {
    if (pattern.test(lowerText)) {
      return { 
        safe: false, 
        reason: 'Content contains potentially harmful or inappropriate material' 
      };
    }
  }
  
  // Check for excessive repetition (potential spam)
  const words = lowerText.split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 10 && uniqueWords.size < words.length * 0.3) {
    return { 
      safe: false, 
      reason: 'Message appears to be spam or repetitive content' 
    };
  }
  
  return { safe: true };
};

// Crisis detection wrapper
const detectCrisis = async (text: string): Promise<boolean> => {
  try {
    const analysis = await crisisDetectionService.analyzeForCrisis(text);
    return analysis.hasCrisisIndicators && 
           (analysis.severityLevel === 'high' || analysis.severityLevel === 'critical');
  } catch (error) {
    console.error('Crisis detection error:', error);
    // Err on the side of caution
    return false;
  }
};

// Generate AI response based on provider
const generateAIResponse = async (
  provider: AIProvider,
  messages: AIChatMessage[],
  systemPrompt: string,
  providers: any
): Promise<string> => {
  try {
    switch (provider) {
      case 'openai':
        if (!providers.openai) throw new Error('OpenAI provider not configured');
        
        const openaiMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        ];
        
        const openaiResponse = await providers.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 500,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        });
        
        return openaiResponse.choices[0]?.message?.content || 'I understand you\'re going through a difficult time. How can I support you today?';
      
      case 'claude':
        if (!providers.claude) throw new Error('Claude provider not configured');
        
        const claudeMessages = messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
        
        const claudeResponse = await providers.claude.messages.create({
          model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
          system: systemPrompt,
          messages: claudeMessages,
          max_tokens: 500,
          temperature: 0.7,
        });
        
        return claudeResponse.content[0]?.text || 'I\'m here to listen and support you. What\'s on your mind?';
      
      default:
        // Fallback response for unconfigured providers
        return 'I\'m here to provide support and listen. Please share what\'s on your mind, and I\'ll do my best to help.';
    }
  } catch (error) {
    console.error(`AI provider ${provider} error:`, error);
    throw error;
  }
};

// Main handler
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const providers = initializeProviders();
    const path = event.path.replace('/.netlify/functions/api-ai', '');
    
    // Route handling
    switch (path) {
      case '/chat':
        if (event.httpMethod !== 'POST') {
          return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }) 
          };
        }
        
        const { messages, userId, provider = 'openai' } = JSON.parse(event.body || '{}');
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Messages array is required' })
          };
        }
        
        // Get the latest user message
        const latestUserMessage = messages[messages.length - 1];
        if (latestUserMessage?.sender !== 'user') {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Latest message must be from user' })
          };
        }
        
        // Moderate content
        const moderation = moderateContent(latestUserMessage.text);
        if (!moderation.safe) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              response: 'I understand you may be going through something difficult, but I\'m not able to process that type of content. If you\'re in crisis, please reach out to a crisis helpline at 988 or emergency services at 911.',
              metadata: {
                moderated: true,
                reason: moderation.reason
              }
            })
          };
        }
        
        // Crisis detection
        const inCrisis = await detectCrisis(latestUserMessage.text);
        const systemPrompt = inCrisis ? 
          `${SYSTEM_PROMPTS.base}\n\n${SYSTEM_PROMPTS.crisis}` : 
          `${SYSTEM_PROMPTS.base}\n\n${SYSTEM_PROMPTS.supportive}`;
        
        // Generate response
        const aiResponse = await generateAIResponse(
          provider as AIProvider,
          messages,
          systemPrompt,
          providers
        );
        
        // Store conversation history
        if (userId) {
          const history = conversationStore.get(userId) || {
            userId,
            messages: [],
            lastUpdated: new Date().toISOString(),
            metadata: {
              sessionId: crypto.randomUUID(),
              provider: provider as AIProvider,
              crisisFlags: 0,
            }
          };
          
          const responseMessage: AIChatMessage = {
            id: crypto.randomUUID(),
            sender: 'ai',
            text: aiResponse,
            timestamp: new Date().toISOString(),
            metadata: inCrisis ? { crisisDetected: true } : undefined
          };
          
          history.messages = [...messages, responseMessage];
          history.lastUpdated = new Date().toISOString();
          if (inCrisis) history.metadata.crisisFlags++;
          
          conversationStore.set(userId, history);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            response: aiResponse,
            metadata: {
              crisisDetected: inCrisis,
              provider,
              timestamp: new Date().toISOString()
            }
          })
        };
      
      case '/history':
        if (event.httpMethod === 'GET') {
          const userId = event.queryStringParameters?.userId;
          if (!userId) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'User ID required' })
            };
          }
          
          const history = conversationStore.get(userId);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(history || { messages: [] })
          };
        }
        
        if (event.httpMethod === 'POST') {
          const { userId, messages } = JSON.parse(event.body || '{}');
          if (!userId || !messages) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'User ID and messages required' })
            };
          }
          
          conversationStore.set(userId, {
            userId,
            messages,
            lastUpdated: new Date().toISOString(),
            metadata: {
              sessionId: crypto.randomUUID(),
              provider: 'openai',
              crisisFlags: 0,
            }
          });
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        }
        break;
      
      case '/clear':
        if (event.httpMethod !== 'POST') {
          return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }) 
          };
        }
        
        const { userId: clearUserId } = JSON.parse(event.body || '{}');
        if (!clearUserId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'User ID required' })
          };
        }
        
        conversationStore.delete(clearUserId);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      
      case '/providers':
        if (event.httpMethod !== 'GET') {
          return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }) 
          };
        }
        
        // Return available providers
        const available = [];
        if (providers.openai) available.push('openai');
        if (providers.claude) available.push('claude');
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            providers: available,
            default: available[0] || null 
          })
        };
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };
    
  } catch (error) {
    console.error('AI API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};