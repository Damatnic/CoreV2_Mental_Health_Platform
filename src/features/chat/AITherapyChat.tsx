import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Heart, Brain, Loader2, Phone, MessageSquare, Shield } from 'lucide-react';

interface TherapyMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'suggestion' | 'exercise' | 'resource';
  metadata?: {
    confidence?: number;
    sentiment?: string;
    techniques?: string[];
    followUpQuestions?: string[];
  };
}

interface AITherapyChatProps {
  userId: string;
  initialMessage?: string;
  therapyType?: 'cbt' | 'dbt' | 'mindfulness' | 'general';
  onCrisisDetected?: (level: 'low' | 'medium' | 'high' | 'critical') => void;
  className?: string;
}

export const AITherapyChat: React.FC<AITherapyChatProps> = ({
  userId,
  initialMessage,
  therapyType = 'general',
  onCrisisDetected,
  className = ''
}) => {
  const [messages, setMessages] = useState<TherapyMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [aiPersonality, setAiPersonality] = useState<'empathetic' | 'analytical' | 'supportive'>('empathetic');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize chat
  useEffect(() => {
    startTherapySession();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 1) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, messages.length]);

  const startTherapySession = () => {
    const welcomeMessage: TherapyMessage = {
      id: 'welcome',
      content: getWelcomeMessage(),
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages([welcomeMessage]);
    setSessionActive(true);
  };

  const getWelcomeMessage = () => {
    const messages = {
      cbt: "Hello! I'm here to help you explore your thoughts and feelings using cognitive behavioral techniques. How are you feeling today?",
      dbt: "Welcome! I'm trained in dialectical behavior therapy techniques. Let's work together on emotional regulation and mindfulness. What's on your mind?",
      mindfulness: "Hi there! I'm here to guide you through mindfulness and meditation practices. What would you like to focus on in our session?",
      general: "Hello! I'm your AI therapy companion. I'm here to listen, support, and help you work through whatever is on your mind. How are you feeling today?"
    };
    return messages[therapyType];
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content) return;

    const userMessage: TherapyMessage = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Crisis detection
      const crisisLevel = detectCrisisLanguage(content);
      if (crisisLevel !== 'low') {
        onCrisisDetected?.(crisisLevel);
      }

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      const aiResponse = await generateAIResponse(content, userMessage);
      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: TherapyMessage = {
        id: `error-${Date.now()}`,
        content: "I apologize, but I'm having trouble processing your message right now. Please try again, or if this is urgent, consider reaching out to a crisis helpline.",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const detectCrisisLanguage = (message: string): 'low' | 'medium' | 'high' | 'critical' => {
    const criticalWords = ['suicide', 'kill myself', 'end it all', 'want to die'];
    const highRiskWords = ['self harm', 'hurt myself', 'no point', 'giving up'];
    const mediumRiskWords = ['hopeless', 'worthless', 'can\'t go on', 'trapped'];

    const lowerMessage = message.toLowerCase();
    
    if (criticalWords.some(word => lowerMessage.includes(word))) {
      return 'critical';
    }
    if (highRiskWords.some(word => lowerMessage.includes(word))) {
      return 'high';
    }
    if (mediumRiskWords.some(word => lowerMessage.includes(word))) {
      return 'medium';
    }
    return 'low';
  };

  const generateAIResponse = async (userInput: string, userMessage: TherapyMessage): Promise<TherapyMessage> => {
    // This would integrate with actual AI therapy service
    const responses = generateTherapeuticResponse(userInput, therapyType, aiPersonality);
    
    return {
      id: `ai-${Date.now()}`,
      content: responses.content,
      sender: 'ai',
      timestamp: new Date(),
      type: responses.type,
      metadata: {
        confidence: 0.85,
        sentiment: analyzeSentiment(userInput),
        techniques: responses.techniques,
        followUpQuestions: responses.followUpQuestions
      }
    };
  };

  const generateTherapeuticResponse = (userInput: string, type: string, personality: string) => {
    // Simplified response generation - in reality would use advanced AI
    const input = userInput.toLowerCase();
    
    if (input.includes('anxious') || input.includes('worry')) {
      return {
        content: "I hear that you're feeling anxious. That's completely understandable. Let's try a grounding technique together. Can you name 5 things you can see around you right now?",
        type: 'exercise' as const,
        techniques: ['grounding', '5-4-3-2-1'],
        followUpQuestions: ['What are 5 things you can see?', 'How is your breathing right now?']
      };
    }
    
    if (input.includes('sad') || input.includes('depressed')) {
      return {
        content: "I'm sorry you're feeling this way. Your feelings are valid, and I'm here to support you. Sometimes when we feel sad, it helps to explore what might be contributing to these feelings. What's been on your mind lately?",
        type: 'text' as const,
        techniques: ['validation', 'exploration'],
        followUpQuestions: ['What has been weighing on you?', 'When did you first notice feeling this way?']
      };
    }
    
    if (input.includes('angry') || input.includes('frustrated')) {
      return {
        content: "Anger and frustration are natural emotions. Let's work on understanding what's behind these feelings and finding healthy ways to express them. Can you tell me more about what triggered these feelings?",
        type: 'text' as const,
        techniques: ['emotion_regulation', 'trigger_identification'],
        followUpQuestions: ['What happened right before you felt angry?', 'How does anger show up in your body?']
      };
    }
    
    // Default empathetic response
    return {
      content: "Thank you for sharing that with me. I can sense that you're going through something important. I'm here to listen and support you. Can you tell me more about how you're feeling right now?",
      type: 'text' as const,
      techniques: ['active_listening', 'validation'],
      followUpQuestions: ['How are you feeling in this moment?', 'What would be most helpful for you right now?']
    };
  };

  const analyzeSentiment = (text: string): string => {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'happy', 'better', 'hopeful'];
    const negativeWords = ['bad', 'terrible', 'sad', 'worse', 'hopeless'];
    
    const words = text.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: TherapyMessage) => {
    const isUser = message.sender === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[80%]`}>
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'ml-2 bg-blue-600' : 'mr-2 bg-green-600'}`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
          
          {/* Message Content */}
          <div className={`px-4 py-2 rounded-2xl ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : message.type === 'exercise' 
                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                : 'bg-gray-100 text-gray-900'
          }`}>
            <div className="text-sm">{message.content}</div>
            
            {/* Metadata for AI messages */}
            {!isUser && message.metadata?.techniques && (
              <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  <span>Techniques: {message.metadata.techniques.join(', ')}</span>
                </div>
              </div>
            )}
            
            {/* Timestamp */}
            <div className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`ai-therapy-chat flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Therapy Session</h3>
            <p className="text-sm text-gray-600 capitalize">{therapyType} approach</p>
          </div>
        </div>
        
        {/* Emergency Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('tel:988')}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            title="Crisis Hotline: 988"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.open('sms:741741?body=HOME')}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title="Crisis Text Line"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map(renderMessage)}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="flex items-end max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-green-600">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-2 rounded-2xl bg-gray-100">
                <div className="flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              disabled={isTyping}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>Your conversations are private and secure</span>
        </div>
      </div>

      {/* Crisis Resources Banner */}
      <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-center">
        <p className="text-xs text-red-700">
          If you're in crisis: <strong>Call 988</strong> or <strong>Text HOME to 741741</strong>
        </p>
      </div>
    </div>
  );
};

export default AITherapyChat;
