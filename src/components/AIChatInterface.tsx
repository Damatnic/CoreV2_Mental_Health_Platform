/**
 * AI Chat Interface Component
 * Provides a complete AI chat interface with crisis detection and safety features
 */

import React, { useState, useEffect, useRef } from 'react';
import { AIChatMessage } from '../types';
import { TypingIndicator } from './TypingIndicator';
import { AIAssistanceIndicator } from './AIAssistanceIndicator';
import CrisisAlert from './CrisisAlert';
import { formatChatTimestamp } from '../utils/formatTimeAgo';
import { AppButton } from './AppButton';
import { AppTextArea } from './AppTextArea';
import { 
  AICompanionIcon,
  SendIcon,
  WarningIcon,
  LockIcon,
  SparkleIcon,
  RefreshIcon,
  MoreIcon 
} from './icons.dynamic';
import { useAIChat } from '../hooks/useAIChat';
import './AIChatInterface.css';

export interface AIChatInterfaceProps {
  userId: string;
  userName?: string;
  onClose?: () => void;
  provider?: 'openai' | 'claude';
  enableCrisisDetection?: boolean;
  className?: string;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  userId,
  userName,
  onClose,
  provider = 'openai',
  enableCrisisDetection = true,
  className = ''
}) => {
  // Chat state
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    session,
    crisisDetected,
    isTyping
  } = useAIChat({
    userId,
    provider,
    enableCrisisDetection
  });

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show crisis alert when crisis is detected
  useEffect(() => {
    if (crisisDetected) {
      setShowCrisisAlert(true);
    }
  }, [crisisDetected]);

  // Handle message send
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageText = inputValue.trim();
    setInputValue('');
    
    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  // Render message
  const renderMessage = (message: AIChatMessage) => {
    const isUser = message.sender === 'user';
    const isAI = message.sender === 'ai';

    return (
      <div
        key={message.id}
        className={`chat-message ${isUser ? 'user-message' : 'ai-message'}`}
      >
        <div className="message-header">
          <div className="message-sender">
            {isAI && <AICompanionIcon className="ai-icon" />}
            <span className="sender-name">
              {isUser ? (userName || 'You') : 'AI Assistant'}
            </span>
            {message.metadata?.crisisDetected && (
              <WarningIcon className="crisis-warning" />
            )}
          </div>
          <span className="message-timestamp">
            {formatChatTimestamp(message.timestamp)}
          </span>
        </div>
        
        <div className="message-content">
          <p>{message.text}</p>
          
          {message.metadata?.topics && message.metadata.topics.length > 0 && (
            <div className="message-topics">
              {message.metadata.topics.map((topic, index) => (
                <span key={index} className="topic-tag">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render crisis alert
  const renderCrisisAlert = () => {
    if (!showCrisisAlert) return null;

    return (
      <CrisisAlert
        onDismiss={() => setShowCrisisAlert(false)}
        onGetHelp={() => {
          window.open('tel:988', '_blank');
          setShowCrisisAlert(false);
        }}
        severity="urgent"
        message="I'm concerned about what you're sharing. Would you like to connect with crisis support resources?"
      />
    );
  };

  if (isMinimized) {
    return (
      <div className={`ai-chat-minimized ${className}`}>
        <button
          className="expand-button"
          onClick={() => setIsMinimized(false)}
          aria-label="Expand AI Chat"
        >
          <AICompanionIcon />
          <span>AI Assistant</span>
          {crisisDetected && <WarningIcon className="crisis-indicator" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`ai-chat-interface ${className}`}>
      {renderCrisisAlert()}
      
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <AICompanionIcon className="header-icon" />
          <div className="header-info">
            <h3>AI Assistant</h3>
            <span className="provider-badge">{provider}</span>
            {session && (
              <span className="session-info">
                Session: {session.id.slice(-6)}
              </span>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={clearChat}
            title="Clear chat"
            disabled={messages.length === 0}
          >
            <RefreshIcon />
          </button>
          
          <button
            className="icon-button"
            onClick={() => setIsMinimized(true)}
            title="Minimize"
          >
            <MoreIcon />
          </button>
          
          {onClose && (
            <button
              className="icon-button close-button"
              onClick={onClose}
              title="Close chat"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <AICompanionIcon className="empty-icon" />
            <h4>Start a conversation</h4>
            <p>I'm here to provide support and answer your questions about mental health and wellness.</p>
            <div className="safety-notice">
              <LockIcon />
              <span>Your privacy is protected. This is a safe, confidential space.</span>
            </div>
          </div>
        )}
        
        {messages.map(renderMessage)}
        
        {isTyping && (
          <div className="typing-message">
            <AICompanionIcon className="ai-icon" />
            <TypingIndicator isVisible={true} />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input">
        {error && (
          <div className="error-message">
            <WarningIcon />
            <span>{error}</span>
          </div>
        )}
        
        <div className="input-container">
          <AppTextArea
            ref={inputRef}
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={1}
            maxRows={4}
            className="chat-textarea"
          />
          
          <AppButton
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            variant="primary"
            className="send-button"
            icon={<SendIcon />}
            loading={isLoading}
          >
            Send
          </AppButton>
        </div>
        
        <div className="input-footer">
          <AIAssistanceIndicator isActive={!isLoading && !error} />
          
          {enableCrisisDetection && (
            <div className="crisis-detection-indicator">
              <SparkleIcon />
              <span>Crisis detection enabled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;
