/**
 * AI Chat Hook
 * Provides AI chat functionality with crisis detection and moderation
 */

import { useState, useCallback, useEffect } from 'react';
import { AIChatSession, AIChatMessage } from '../types';
import { ApiClient } from '../utils/ApiClient';
import { useAuth } from '../contexts/AuthContext';
import { crisisDetectionService, CrisisAnalysisResult } from '../services/crisisDetectionService';
import { aiModerationService, ContentAnalysis, ContentType } from '../services/aiModerationService';

export interface UseAIChatOptions {
  userId?: string;
  provider?: 'openai' | 'claude';
  enableCrisisDetection?: boolean;
  enableModeration?: boolean;
  sessionId?: string;
}

export interface UseAIChatReturn {
  messages: AIChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  session: AIChatSession | null;
  crisisDetected: boolean;
  isTyping: boolean;
}

export const useAIChat = (options: UseAIChatOptions = {}): UseAIChatReturn => {
  const { user } = useAuth();
  const {
    userId = user?.id,
    provider = 'openai',
    enableCrisisDetection = true,
    enableModeration = true,
    sessionId
  } = options;

  // State management
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AIChatSession | null>(null);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const newSession: AIChatSession = {
          id: sessionId || Date.now().toString(36),
          userId: userId || 'anonymous',
          provider,
          startTime: new Date(),
          messages: [],
          metadata: {
            crisisDetectionEnabled: enableCrisisDetection,
            moderationEnabled: enableModeration
          }
        };
        setSession(newSession);
      } catch (err) {
        setError('Failed to initialize chat session');
        console.error('Session initialization error:', err);
      }
    };

    initializeSession();
  }, [userId, provider, enableCrisisDetection, enableModeration, sessionId]);

  // Send message function
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setIsTyping(true);

    try {
      // Create user message
      const userMessage: AIChatMessage = {
        id: Date.now().toString(36),
        sender: 'user',
        text: messageText.trim(),
        timestamp: new Date().toISOString(),
        metadata: {}
      };

      // Add user message to state
      setMessages(prev => [...prev, userMessage]);

      // Crisis detection if enabled
      let crisisAnalysis: CrisisAnalysisResult | null = null;
      if (enableCrisisDetection) {
        try {
          crisisAnalysis = await crisisDetectionService.analyzeForCrisis(messageText, userId);
          setCrisisDetected(crisisAnalysis.hasCrisisIndicators);
          
          if (crisisAnalysis.immediateIntervention) {
            // Handle immediate crisis intervention
            await crisisDetectionService.handleCrisisResponse(crisisAnalysis, userId);
          }
        } catch (crisisError) {
          console.error('Crisis detection error:', crisisError);
        }
      }

      // Content moderation if enabled
      let moderationResult: ContentAnalysis | null = null;
      if (enableModeration) {
        try {
          moderationResult = await aiModerationService.analyzeContent(messageText, 'chat_message', {
            userId,
            sessionId: session?.id,
            priority: 'high'
          });
          
          if (moderationResult.shouldBlock) {
            throw new Error('Message blocked by content moderation');
          }
        } catch (moderationError) {
          console.error('Moderation error:', moderationError);
        }
      }

      // Send to AI service
      const apiClient = new ApiClient();
      const response = await apiClient.post('/api/ai/chat', {
        message: messageText,
        sessionId: session?.id,
        userId: userId || 'anonymous',
        provider,
        context: {
          previousMessages: messages.slice(-5), // Last 5 messages for context
          crisisAnalysis,
          moderationResult
        }
      });

      // Create AI response message
      const aiMessage: AIChatMessage = {
        id: Date.now().toString(36) + '_ai',
        sender: 'ai',
        text: response.data.message,
        timestamp: new Date().toISOString(),
        metadata: {
          provider,
          crisisDetected: crisisAnalysis?.hasCrisisIndicators || false,
          sentiment: response.data?.sentiment,
          topics: response.data?.topics,
          interventionRequired: crisisAnalysis?.immediateIntervention || false,
          supportResourcesOffered: crisisAnalysis?.hasCrisisIndicators || false
        }
      };

      // Add AI message to state
      setMessages(prev => [...prev, aiMessage]);

      // Update session
      if (session) {
        setSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, userMessage, aiMessage],
          lastActivity: new Date()
        } : null);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Send message error:', err);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [isLoading, enableCrisisDetection, enableModeration, userId, session, messages, provider]);

  // Clear chat function
  const clearChat = useCallback(() => {
    setMessages([]);
    setCrisisDetected(false);
    setError(null);
    
    if (session) {
      setSession(prev => prev ? {
        ...prev,
        messages: [],
        lastActivity: new Date()
      } : null);
    }
  }, [session]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    session,
    crisisDetected,
    isTyping
  };
};

export default useAIChat;
