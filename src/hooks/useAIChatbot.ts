/**
 * useAIChatbot Hook
 * 
 * Custom hook for managing AI chatbot state, conversations,
 * and interactions with the chatbot service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  chatbotService,
  ChatMessage,
  ChatbotResponse,
  TherapeuticResource,
  Intervention,
  ConversationContext,
  PersonalizedContext
} from '../services/ai/chatbotService';
import { logger } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './useToast';

export interface ChatbotSettings {
  preferredTone: 'professional' | 'friendly' | 'supportive' | 'casual';
  enableVoice: boolean;
  enableNotifications: boolean;
  autoSaveConversation: boolean;
  contextWindowSize: number;
}

export interface UseAIChatbotReturn {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  currentResponse: ChatbotResponse | null;
  suggestions: string[];
  resources: TherapeuticResource[];
  interventions: Intervention[];
  conversationContext: ConversationContext | null;
  settings: ChatbotSettings;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';

  // Actions
  sendMessage: (content: string, voiceInput?: boolean) => Promise<void>;
  clearConversation: () => void;
  retryLastMessage: () => Promise<void>;
  loadConversationHistory: (sessionId: string) => Promise<void>;
  updateSettings: (settings: Partial<ChatbotSettings>) => void;
  exportConversation: () => void;
  reportMessage: (messageId: string, reason: string) => Promise<void>;
}

const DEFAULT_SETTINGS: ChatbotSettings = {
  preferredTone: 'supportive',
  enableVoice: true,
  enableNotifications: true,
  autoSaveConversation: true,
  contextWindowSize: 10
};

export const useAIChatbot = (
  userId: string,
  sessionId?: string
): UseAIChatbotReturn => {
  // Generate session ID if not provided
  const sessionIdRef = useRef(sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Auth context
  const { user } = useAuth() || {};
  const { showToast } = useToast() || {};

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<ChatbotResponse | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [resources, setResources] = useState<TherapeuticResource[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [conversationContext, setConversationContext] = useState<ConversationContext | null>(null);
  const [settings, setSettings] = useState<ChatbotSettings>(DEFAULT_SETTINGS);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  // Refs
  const lastMessageRef = useRef<string>('');
  const retryCountRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize chatbot service
  useEffect(() => {
    initializeChatbot();
    
    // Setup event listeners
    chatbotService.on('message:processed', handleMessageProcessed);
    chatbotService.on('crisis:detected', handleCrisisDetected);
    chatbotService.on('crisis:escalated', handleCrisisEscalated);
    chatbotService.on('error', handleError);
    chatbotService.on('rateLimit:exceeded', handleRateLimitExceeded);
    chatbotService.on('abuse:detected', handleAbuseDetected);

    // Load saved settings
    loadSettings();

    // Load conversation history if exists
    if (sessionIdRef.current) {
      loadConversationHistory(sessionIdRef.current);
    }

    return () => {
      // Cleanup
      chatbotService.off('message:processed', handleMessageProcessed);
      chatbotService.off('crisis:detected', handleCrisisDetected);
      chatbotService.off('crisis:escalated', handleCrisisEscalated);
      chatbotService.off('error', handleError);
      chatbotService.off('rateLimit:exceeded', handleRateLimitExceeded);
      chatbotService.off('abuse:detected', handleAbuseDetected);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Initialize chatbot with configuration
  const initializeChatbot = async () => {
    try {
      // Configure chatbot based on user preferences
      const config = {
        enableVoice: settings.enableVoice,
        enableCrisisDetection: true,
        enablePersonalization: true,
        contextWindowSize: settings.contextWindowSize
      };

      chatbotService.updateConfig(config);
      
      logger.info('Chatbot initialized', { userId, sessionId: sessionIdRef.current });
    } catch (error) {
      logger.error('Failed to initialize chatbot:', error);
      setError('Failed to initialize chat. Please refresh the page.');
    }
  };

  // Send message to chatbot
  const sendMessage = useCallback(async (content: string, voiceInput: boolean = false) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    lastMessageRef.current = content;

    // Add user message to UI immediately
    const tempUserMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      sessionId: sessionIdRef.current,
      userId,
      role: 'user',
      content,
      timestamp: new Date(),
      voiceInput
    };

    setMessages(prev => [...prev, tempUserMessage]);

    // Show typing indicator
    setIsTyping(true);
    
    // Simulate typing delay
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(true);
    }, 500);

    try {
      // Process message through chatbot service
      const response = await chatbotService.processMessage(
        content,
        userId,
        sessionIdRef.current,
        voiceInput
      );

      // Update state with response
      setCurrentResponse(response);
      
      // Add assistant message
      setMessages(prev => {
        // Replace temp message with real one if needed
        const updatedMessages = prev.map(msg => 
          msg.id === tempUserMessage.id ? response.message : msg
        );
        return [...updatedMessages, response.message];
      });

      // Update suggestions, resources, and interventions
      setSuggestions(response.suggestions);
      setResources(response.resources);
      setInterventions(response.interventions);

      // Update conversation context
      const context = chatbotService.getConversationHistory(sessionIdRef.current);
      if (context) {
        setConversationContext(context);
      }

      // Reset retry count on success
      retryCountRef.current = 0;

      // Show notifications for important responses
      if (response.crisisDetected && settings.enableNotifications) {
        showToast?.({
          type: 'warning',
          title: 'Support Available',
          message: 'Crisis indicators detected. Additional resources are available.',
          duration: 10000
        });
      }

      if (response.escalationRequired) {
        showToast?.({
          type: 'error',
          title: 'Immediate Support Needed',
          message: 'Based on your message, we recommend immediate professional support.',
          duration: 15000,
          action: {
            label: 'Call Crisis Line',
            onClick: () => window.location.href = 'tel:988'
          }
        });
      }

      // Auto-save conversation if enabled
      if (settings.autoSaveConversation) {
        saveConversation();
      }

    } catch (error: any) {
      logger.error('Failed to send message:', error);
      
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      
      // Handle specific errors
      if (error.message?.includes('Rate limit')) {
        setError('You\'re sending messages too quickly. Please wait a moment.');
      } else if (error.message?.includes('inappropriate')) {
        setError('Your message was flagged as inappropriate. Please rephrase.');
      } else if (connectionStatus === 'disconnected') {
        setError('Connection lost. Your message will be sent when reconnected.');
        // Queue message for retry
        handleOfflineMessage(content, voiceInput);
      } else {
        setError('Failed to send message. Please try again.');
      }

      showToast?.({
        type: 'error',
        title: 'Message Failed',
        message: error.message || 'Failed to send message',
        duration: 5000
      });

    } finally {
      setIsLoading(false);
      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [isLoading, userId, settings, connectionStatus, showToast]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    if (!confirm('Are you sure you want to clear this conversation? This action cannot be undone.')) {
      return;
    }

    setMessages([]);
    setCurrentResponse(null);
    setSuggestions([]);
    setResources([]);
    setInterventions([]);
    setConversationContext(null);
    setError(null);

    chatbotService.clearConversation(sessionIdRef.current);
    
    // Generate new session ID
    sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    showToast?.({
      type: 'success',
      title: 'Conversation Cleared',
      message: 'Your conversation has been cleared.',
      duration: 3000
    });

    logger.info('Conversation cleared', { userId });
  }, [userId, showToast]);

  // Retry last message
  const retryLastMessage = useCallback(async () => {
    if (!lastMessageRef.current || retryCountRef.current >= 3) {
      setError('Maximum retry attempts reached. Please try sending a new message.');
      return;
    }

    retryCountRef.current++;
    await sendMessage(lastMessageRef.current);
  }, [sendMessage]);

  // Load conversation history
  const loadConversationHistory = useCallback(async (sessionId: string) => {
    try {
      const context = chatbotService.getConversationHistory(sessionId);
      
      if (context) {
        setMessages(context.messages);
        setConversationContext(context);
        
        // Get last response details
        const lastAssistantMessage = context.messages
          .filter(m => m.role === 'assistant')
          .pop();
          
        if (lastAssistantMessage) {
          // Restore suggestions from last interaction
          const lastUserMessage = context.messages
            .filter(m => m.role === 'user')
            .pop();
            
          if (lastUserMessage) {
            // Generate suggestions based on context
            const metadata = lastUserMessage.metadata;
            if (metadata) {
              // This would typically come from the service
              setSuggestions([
                'Continue our conversation',
                'Tell me more about coping strategies',
                'I need different help'
              ]);
            }
          }
        }

        logger.info('Conversation history loaded', { sessionId, messageCount: context.messages.length });
      }
    } catch (error) {
      logger.error('Failed to load conversation history:', error);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<ChatbotSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Save to localStorage
    localStorage.setItem('chatbot_settings', JSON.stringify(updated));
    
    // Update chatbot configuration
    chatbotService.updateConfig({
      enableVoice: updated.enableVoice,
      contextWindowSize: updated.contextWindowSize
    });

    showToast?.({
      type: 'success',
      title: 'Settings Updated',
      message: 'Your preferences have been saved.',
      duration: 2000
    });
  }, [settings, showToast]);

  // Export conversation
  const exportConversation = useCallback(() => {
    const conversationData = {
      sessionId: sessionIdRef.current,
      userId,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata
      })),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(conversationData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${sessionIdRef.current}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast?.({
      type: 'success',
      title: 'Conversation Exported',
      message: 'Your conversation has been downloaded.',
      duration: 3000
    });

    logger.info('Conversation exported', { sessionId: sessionIdRef.current });
  }, [messages, userId, showToast]);

  // Report message
  const reportMessage = useCallback(async (messageId: string, reason: string) => {
    try {
      // This would typically call an API endpoint
      logger.warn('Message reported', { messageId, reason, userId });
      
      showToast?.({
        type: 'success',
        title: 'Report Submitted',
        message: 'Thank you for your feedback. We\'ll review this message.',
        duration: 3000
      });
    } catch (error) {
      logger.error('Failed to report message:', error);
      
      showToast?.({
        type: 'error',
        title: 'Report Failed',
        message: 'Failed to submit report. Please try again.',
        duration: 3000
      });
    }
  }, [userId, showToast]);

  // Load saved settings
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('chatbot_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      logger.error('Failed to load settings:', error);
    }
  };

  // Save conversation to storage
  const saveConversation = async () => {
    try {
      const conversationData = {
        sessionId: sessionIdRef.current,
        userId,
        messages: messages.slice(-20), // Save last 20 messages
        lastActivity: new Date().toISOString()
      };

      localStorage.setItem(
        `conversation_${sessionIdRef.current}`,
        JSON.stringify(conversationData)
      );
    } catch (error) {
      logger.error('Failed to save conversation:', error);
    }
  };

  // Handle offline messages
  const handleOfflineMessage = (content: string, voiceInput: boolean) => {
    // Queue message for later sending
    const queuedMessages = JSON.parse(
      localStorage.getItem('queued_messages') || '[]'
    );
    
    queuedMessages.push({
      content,
      voiceInput,
      timestamp: new Date().toISOString(),
      sessionId: sessionIdRef.current,
      userId
    });
    
    localStorage.setItem('queued_messages', JSON.stringify(queuedMessages));
  };

  // Event handlers
  const handleMessageProcessed = (data: any) => {
    logger.debug('Message processed', data);
  };

  const handleCrisisDetected = (data: any) => {
    logger.warn('Crisis detected', data);
    
    if (settings.enableNotifications) {
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Support Available', {
          body: 'We\'ve detected you may need additional support. Crisis resources are available.',
          icon: '/icon-192x192.png',
          tag: 'crisis-support'
        });
      }
    }
  };

  const handleCrisisEscalated = (data: any) => {
    logger.error('Crisis escalated', data);
    
    // Show urgent notification
    showToast?.({
      type: 'error',
      title: 'Immediate Help Available',
      message: 'Your safety is important. Please reach out to crisis support immediately.',
      duration: 0, // Don't auto-dismiss
      action: {
        label: 'Get Help Now',
        onClick: () => window.location.href = 'tel:988'
      }
    });
  };

  const handleError = (error: any) => {
    logger.error('Chatbot error:', error);
    setError('An error occurred. Please try again.');
  };

  const handleRateLimitExceeded = (data: any) => {
    logger.warn('Rate limit exceeded', data);
    setError('You\'re sending messages too quickly. Please wait a moment.');
  };

  const handleAbuseDetected = (data: any) => {
    logger.warn('Abuse detected', data);
    setError('Your message was flagged as inappropriate. Please be respectful.');
  };

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('connected');
      
      // Send queued messages
      const queuedMessages = JSON.parse(
        localStorage.getItem('queued_messages') || '[]'
      );
      
      if (queuedMessages.length > 0) {
        queuedMessages.forEach((msg: any) => {
          if (msg.sessionId === sessionIdRef.current) {
            sendMessage(msg.content, msg.voiceInput);
          }
        });
        
        // Clear queue
        localStorage.setItem('queued_messages', '[]');
      }
    };

    const handleOffline = () => {
      setConnectionStatus('disconnected');
      
      showToast?.({
        type: 'warning',
        title: 'Connection Lost',
        message: 'You\'re offline. Messages will be sent when connection is restored.',
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sendMessage, showToast]);

  return {
    // State
    messages,
    isLoading,
    isTyping,
    error,
    currentResponse,
    suggestions,
    resources,
    interventions,
    conversationContext,
    settings,
    connectionStatus,

    // Actions
    sendMessage,
    clearConversation,
    retryLastMessage,
    loadConversationHistory,
    updateSettings,
    exportConversation,
    reportMessage
  };
};