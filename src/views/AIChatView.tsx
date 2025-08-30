import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  isTyping?: boolean;
  sentiment?: 'positive' | 'neutral' | 'concerning' | 'critical';
}

const AIChatView: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Crisis keywords detection
  const CRISIS_KEYWORDS = ['suicide', 'kill myself', 'end it all', 'harm myself', 'want to die'];
  const CONCERNING_KEYWORDS = ['depressed', 'anxious', 'panic', 'scared', 'alone', 'crying'];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome-1',
      content: `Hello ${user?.firstName || 'there'}! I'm Aurora, your AI mental health companion. I'm here to listen and support you. How are you feeling today?`,
      sender: 'ai',
      timestamp: new Date()
    };

    const safetyMessage: Message = {
      id: 'safety-1',
      content: '💡 Remember: If you're in crisis, call 988 or text HOME to 741741',
      sender: 'system',
      timestamp: new Date()
    };

    setMessages([welcomeMessage, safetyMessage]);
  }, [user]);

  // Check for crisis keywords
  const checkForCrisis = useCallback((text: string): 'critical' | 'concerning' | 'neutral' => {
    const lowerText = text.toLowerCase();
    if (CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
      return 'critical';
    }
    if (CONCERNING_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
      return 'concerning';
    }
    return 'neutral';
  }, []);

  // Generate contextual AI response
  const generateResponse = useCallback((userText: string, sentiment: string): string => {
    if (sentiment === 'critical') {
      setShowCrisisAlert(true);
      return "I'm very concerned about what you're sharing. Your life has value. Please reach out for immediate help:\n\n📞 Call 988 (Crisis Lifeline)\n💬 Text HOME to 741741\n\nI'm here to listen, but please also connect with a human counselor.";
    }
    if (sentiment === 'concerning') {
      return "I hear that you're going through a difficult time. That takes courage to share. Would you like to talk more about what you're experiencing? Remember, you don't have to face this alone.";
    }
    
    // Context-aware responses
    const lower = userText.toLowerCase();
    if (lower.includes('anxious')) {
      return "I understand you're feeling anxious. Would you like to try a breathing exercise together, or talk about what's making you feel this way?";
    }
    if (lower.includes('sad') || lower.includes('depressed')) {
      return "I'm sorry you're feeling this way. Depression can be overwhelming. What has been the hardest part for you lately?";
    }
    
    return "Thank you for sharing that with me. I'm here to listen and support you. Can you tell me more about what you're experiencing?";
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const sentiment = checkForCrisis(inputMessage);
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
      sentiment
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = generateResponse(userMessage.content, sentiment);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        sentiment: sentiment === 'critical' ? 'critical' : 'neutral'
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (sentiment === 'critical') {
        logger.warn('Crisis keywords detected', { userId: user?.id }, 'AIChatView');
      }
    } catch (error) {
      logger.error('AI chat error', error, 'AIChatView');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-chat-view">
      <div className="chat-header">
        <h1>AI Mental Health Support</h1>
        <p className="chat-subtitle">Aurora is here to listen and support you</p>
      </div>
      
      {showCrisisAlert && (
        <div className="crisis-alert">
          <h3>🆘 Immediate Help Available</h3>
          <div className="crisis-actions">
            <button onClick={() => window.location.href = 'tel:988'} className="crisis-btn">
              📞 Call 988
            </button>
            <button onClick={() => window.location.href = 'sms:741741?body=HOME'} className="crisis-btn">
              💬 Text Crisis Line
            </button>
          </div>
          <button onClick={() => setShowCrisisAlert(false)} className="dismiss-btn">
            I'm safe for now
          </button>
        </div>
      )}
      
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender} ${message.sentiment || ''}`}>
            {message.sender === 'ai' && <span className="ai-avatar">🤖</span>}
            <div className="message-bubble">
              <div className="content">{message.content}</div>
              <div className="timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai typing">
            <span className="ai-avatar">🤖</span>
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="How are you feeling? Type your message..."
          disabled={isLoading}
          className="message-input"
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>
      
      <div className="chat-footer">
        <p className="footer-text">💡 This AI provides support but is not a replacement for professional help</p>
        <div className="quick-links">
          <a href="/crisis">Crisis Resources</a>
          <span>•</span>
          <a href="/wellness">Wellness Tools</a>
        </div>
      </div>
    </div>
  );
  };

export default AIChatView;
