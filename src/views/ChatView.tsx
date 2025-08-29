import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { LazyMarkdown } from '../components/LazyMarkdown';
import { AIChatSession as ChatSession, Dilemma } from '../types';
import { BackIcon, SendIcon, HeartIcon, CrisisIcon } from '../components/icons.dynamic';
import { TypingIndicator } from '../components/TypingIndicator';
import { formatChatTimestamp } from '../utils/formatTimeAgo';
import { GuidancePanel } from '../components/GuidancePanel';
import { AppButton } from '../components/AppButton';
import { ApiClient } from '../utils/ApiClient';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'helper' | 'system';
  timestamp: Date;
  isRead: boolean;
  metadata?: {
    senderName?: string;
    senderAvatar?: string;
    isEdited?: boolean;
    editedAt?: Date;
    reactions?: Array<{
      type: string;
      userId: string;
      timestamp: Date;
    }>;
  };
}

interface ChatViewProps {
  sessionId?: string;
  partnerId?: string;
  partnerType: 'helper' | 'ai' | 'peer';
  onBack?: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  sessionId,
  partnerId,
  partnerType,
  onBack
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initializeChat();
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [sessionId, partnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      // Mock session data
      const mockSession: ChatSession = {
        id: sessionId || `session-${Date.now()}`,
        userId: user?.id || 'current-user',
        helperId: partnerId,
        startTime: new Date(),
        status: 'active',
        messages: []
      };

      // Mock initial messages
      const initialMessages: ChatMessage[] = [
        {
          id: '1',
          content: `Hello! I'm here to support you. How are you feeling today?`,
          sender: 'helper',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          isRead: true,
          metadata: {
            senderName: partnerType === 'ai' ? 'AI Assistant' : 'Helper',
            senderAvatar: undefined
          }
        }
      ];

      setSession(mockSession);
      setMessages(initialMessages);
      setConnectionStatus('connected');
      
    } catch (error) {
      console.error('Error initializing chat:', error);
      showNotification('error', 'Failed to initialize chat');
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      isRead: false,
      metadata: {
        senderName: user?.username || 'You',
        senderAvatar: user?.avatar
      }
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Simulate partner typing
      setTimeout(() => {
        setPartnerIsTyping(true);
      }, 500);

      // Simulate partner response
      setTimeout(() => {
        const responseMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          content: generateResponse(messageContent, partnerType),
          sender: 'helper',
          timestamp: new Date(),
          isRead: false,
          metadata: {
            senderName: partnerType === 'ai' ? 'AI Assistant' : 'Helper',
            senderAvatar: undefined
          }
        };

        setMessages(prev => [...prev, responseMessage]);
        setPartnerIsTyping(false);
      }, 2000 + Math.random() * 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const generateResponse = (userMessage: string, type: string): string => {
    const responses = {
      ai: [
        "I understand how you're feeling. Let's explore this together.",
        "That's a valid concern. What specific aspects are most challenging for you?",
        "Thank you for sharing that with me. How long have you been experiencing this?",
        "I hear you. Let's work through this step by step.",
        "Your feelings are completely valid. What would help you feel better right now?"
      ],
      helper: [
        "I appreciate you opening up about this. How can I best support you?",
        "That sounds challenging. Would you like to talk more about it?",
        "I'm here to listen. Take your time to express what you're feeling.",
        "Thank you for trusting me with this. What's been on your mind lately?",
        "I understand. Let's explore some coping strategies together."
      ],
      peer: [
        "I can relate to what you're going through. You're not alone in this.",
        "I've experienced something similar. Would you like to hear what helped me?",
        "That's tough. I'm here if you need someone who understands.",
        "Thanks for sharing. It takes courage to open up about these things.",
        "I hear you. Sometimes just talking to someone who gets it helps."
      ]
    };

    const typeResponses = responses[type as keyof typeof responses] || responses.ai;
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Notify partner that user is typing
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Notify partner that user stopped typing
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = (messageId: string, reactionType: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.metadata?.reactions || [];
        const existingReaction = reactions.find(
          r => r.userId === user?.id && r.type === reactionType
        );

        if (existingReaction) {
          // Remove reaction
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              reactions: reactions.filter(r => r !== existingReaction)
            }
          };
        } else {
          // Add reaction
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              reactions: [...reactions, {
                type: reactionType,
                userId: user?.id || 'current-user',
                timestamp: new Date()
              }]
            }
          };
        }
      }
      return msg;
    }));
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <div className="chat-view">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Connecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="header-left">
          {onBack && (
            <button className="back-button" onClick={onBack}>
              <BackIcon />
            </button>
          )}
          <div className="partner-info">
            <div className="partner-avatar">
              {partnerType === 'ai' ? '🤖' : partnerType === 'peer' ? '👥' : '👨‍⚕️'}
            </div>
            <div className="partner-details">
              <div className="partner-name">
                {partnerType === 'ai' ? 'AI Assistant' : partnerType === 'peer' ? 'Peer Support' : 'Helper'}
              </div>
              <div className="connection-status">
                <span 
                  className="status-dot"
                  style={{ backgroundColor: getConnectionStatusColor() }}
                />
                <span className="status-text">{connectionStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="guidance-toggle"
            onClick={() => setShowGuidance(!showGuidance)}
          >
            {showGuidance ? 'Hide' : 'Show'} Tips
          </button>
          {partnerType === 'helper' && (
            <button className="crisis-button">
              <CrisisIcon />
              Crisis
            </button>
          )}
        </div>
      </div>

      <div className="chat-content">
        <div className={`messages-container ${showGuidance ? 'with-guidance' : ''}`}>
          <div className="messages-list">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'sent' : 'received'}`}
              >
                {message.sender !== 'user' && (
                  <div className="message-avatar">
                    {message.metadata?.senderAvatar ? (
                      <img src={message.metadata.senderAvatar} alt={message.metadata.senderName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {message.metadata?.senderName?.[0] || 'H'}
                      </div>
                    )}
                  </div>
                )}

                <div className="message-content">
                  <div className="message-bubble">
                    <LazyMarkdown content={message.content} />
                    {message.metadata?.isEdited && (
                      <span className="edited-indicator">edited</span>
                    )}
                  </div>

                  <div className="message-footer">
                    <span className="message-time">
                      {formatChatTimestamp(message.timestamp)}
                    </span>
                    
                    {message.sender !== 'user' && (
                      <div className="message-reactions">
                        <button
                          className="reaction-button"
                          onClick={() => handleReaction(message.id, 'heart')}
                        >
                          <HeartIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  {message.metadata?.reactions && message.metadata.reactions.length > 0 && (
                    <div className="reactions-display">
                      {message.metadata.reactions.map((reaction, idx) => (
                        <span key={idx} className="reaction">
                          {reaction.type === 'heart' ? '❤️' : reaction.type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {partnerIsTyping && (
              <div className="message received">
                <div className="message-avatar">
                  <div className="avatar-placeholder">
                    {partnerType === 'ai' ? 'AI' : 'H'}
                  </div>
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {showGuidance && (
          <div className="guidance-panel">
            <GuidancePanel 
              context="chat"
              suggestions={[
                "Take your time to express yourself",
                "It's okay to pause if you need to",
                "Share what feels comfortable",
                "Ask for clarification if needed"
              ]}
            />
          </div>
        )}
      </div>

      <div className="chat-input-container">
        {isTyping && (
          <div className="typing-indicator-self">
            You are typing...
          </div>
        )}
        
        <div className="chat-input">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            disabled={isSending || connectionStatus !== 'connected'}
          />
          
          <AppButton
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending || connectionStatus !== 'connected'}
            loading={isSending}
            className="send-button"
          >
            <SendIcon />
          </AppButton>
        </div>

        <div className="input-hints">
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
