/**
 * AI Chatbot Component
 * 
 * Modern chat interface with voice input/output, typing indicators,
 * emotion detection, crisis escalation, and therapeutic conversation flows
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  AlertTriangle,
  Heart,
  Brain,
  Sparkles,
  ChevronDown,
  Phone,
  MessageCircle,
  Activity,
  Loader,
  X,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAIChatbot } from '../../hooks/useAIChatbot';
import { ChatMessage, ChatbotResponse, TherapeuticResource, Intervention } from '../../services/ai/chatbotService';
import { formatDistanceToNow } from 'date-fns';
import './AIChatbot.css';

// Voice recognition and synthesis
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const speechSynthesis = window.speechSynthesis;

interface AIChatbotProps {
  userId: string;
  sessionId?: string;
  initialMessage?: string;
  onCrisisDetected?: (response: ChatbotResponse) => void;
  onClose?: () => void;
  className?: string;
  embedded?: boolean;
}

interface EmotionIndicator {
  emotion: string;
  score: number;
  color: string;
  icon: React.ReactNode;
}

interface TypingIndicatorProps {
  isTyping: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping }) => {
  if (!isTyping) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="typing-indicator"
    >
      <div className="typing-dots">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
      <span className="typing-text">AI is thinking...</span>
    </motion.div>
  );
};

const MessageBubble: React.FC<{ 
  message: ChatMessage; 
  onResourceClick?: (resource: TherapeuticResource) => void;
  onInterventionStart?: (intervention: Intervention) => void;
}> = ({ message, onResourceClick, onInterventionStart }) => {
  const [expanded, setExpanded] = useState(false);
  const isUser = message.role === 'user';

  const emotionColors: Record<string, string> = {
    joy: '#FFD700',
    sadness: '#4169E1',
    anger: '#DC143C',
    fear: '#9370DB',
    surprise: '#FF69B4',
    disgust: '#8B4513',
    trust: '#32CD32',
    anticipation: '#FF8C00'
  };

  const sentimentIcons: Record<string, React.ReactNode> = {
    very_positive: <Sparkles className="w-4 h-4" />,
    positive: <Heart className="w-4 h-4" />,
    neutral: <Activity className="w-4 h-4" />,
    negative: <Brain className="w-4 h-4" />,
    very_negative: <AlertTriangle className="w-4 h-4" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`message-bubble ${isUser ? 'user' : 'assistant'}`}
    >
      {!isUser && (
        <div className="avatar">
          <Brain className="w-6 h-6" />
        </div>
      )}

      <div className="message-content">
        <div className="message-header">
          <span className="message-role">{isUser ? 'You' : 'AI Assistant'}</span>
          <span className="message-time">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
        </div>

        <div className="message-text">{message.content}</div>

        {message.metadata && (
          <div className="message-metadata">
            {/* Sentiment indicator */}
            {message.metadata.sentiment && (
              <div className="sentiment-indicator">
                {sentimentIcons[message.metadata.sentiment.label]}
                <span className="sentiment-label">
                  {message.metadata.sentiment.label.replace('_', ' ')}
                </span>
              </div>
            )}

            {/* Emotions */}
            {message.metadata.emotions && message.metadata.emotions.length > 0 && (
              <div className="emotions-container">
                {message.metadata.emotions.map((emotion, index) => (
                  <div
                    key={index}
                    className="emotion-badge"
                    style={{ 
                      backgroundColor: emotionColors[emotion.emotion] + '20',
                      borderColor: emotionColors[emotion.emotion]
                    }}
                  >
                    <span>{emotion.emotion}</span>
                    <span className="emotion-score">{Math.round(emotion.score * 100)}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Topics */}
            {message.metadata.topics && message.metadata.topics.length > 0 && (
              <div className="topics-container">
                {message.metadata.topics.map((topic, index) => (
                  <span key={index} className="topic-tag">#{topic}</span>
                ))}
              </div>
            )}

            {/* Crisis indicators */}
            {message.metadata.crisisIndicators && message.metadata.crisisIndicators.length > 0 && (
              <div className="crisis-alert">
                <AlertTriangle className="w-4 h-4" />
                <span>Crisis indicators detected</span>
              </div>
            )}

            {/* Voice input indicator */}
            {message.voiceInput && (
              <div className="voice-indicator">
                <Mic className="w-3 h-3" />
                <span>Voice message</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="avatar user-avatar">
          <span>{message.userId.charAt(0).toUpperCase()}</span>
        </div>
      )}
    </motion.div>
  );
};

const QuickResponseButton: React.FC<{
  suggestion: string;
  onClick: (text: string) => void;
  disabled?: boolean;
}> = ({ suggestion, onClick, disabled }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="quick-response-btn"
      onClick={() => onClick(suggestion)}
      disabled={disabled}
    >
      {suggestion}
    </motion.button>
  );
};

const ResourceCard: React.FC<{
  resource: TherapeuticResource;
  onClick?: () => void;
}> = ({ resource, onClick }) => {
  const typeIcons = {
    article: <MessageCircle className="w-4 h-4" />,
    video: <Activity className="w-4 h-4" />,
    exercise: <Brain className="w-4 h-4" />,
    hotline: <Phone className="w-4 h-4" />,
    professional: <Heart className="w-4 h-4" />
  };

  const priorityColors = {
    critical: '#DC143C',
    high: '#FF8C00',
    medium: '#FFD700',
    low: '#32CD32'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="resource-card"
      onClick={onClick}
      style={{ borderLeftColor: priorityColors[resource.priority] }}
    >
      <div className="resource-icon">{typeIcons[resource.type]}</div>
      <div className="resource-content">
        <h4>{resource.title}</h4>
        <p>{resource.description}</p>
        {resource.duration && (
          <span className="resource-duration">{resource.duration} min</span>
        )}
      </div>
      <div className={`priority-badge priority-${resource.priority}`}>
        {resource.priority}
      </div>
    </motion.div>
  );
};

const InterventionCard: React.FC<{
  intervention: Intervention;
  onStart?: () => void;
}> = ({ intervention, onStart }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="intervention-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="intervention-header" onClick={() => setExpanded(!expanded)}>
        <div className="intervention-title">
          <h4>{intervention.name}</h4>
          <span className="intervention-type">{intervention.type}</span>
        </div>
        <div className="intervention-meta">
          <span className="intervention-time">{intervention.estimatedTime} min</span>
          <ChevronDown className={`expand-icon ${expanded ? 'expanded' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="intervention-body"
          >
            <p>{intervention.description}</p>
            <ol className="intervention-steps">
              {intervention.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <div className="intervention-footer">
              <div className="effectiveness-meter">
                <span>Effectiveness:</span>
                <div className="meter">
                  <div 
                    className="meter-fill"
                    style={{ width: `${intervention.effectiveness * 100}%` }}
                  />
                </div>
                <span>{Math.round(intervention.effectiveness * 100)}%</span>
              </div>
              <button className="start-intervention-btn" onClick={onStart}>
                Start Exercise
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const AIChatbot: React.FC<AIChatbotProps> = ({
  userId,
  sessionId,
  initialMessage,
  onCrisisDetected,
  onClose,
  className = '',
  embedded = false
}) => {
  const {
    messages,
    isLoading,
    isTyping,
    currentResponse,
    suggestions,
    resources,
    interventions,
    sendMessage,
    clearConversation,
    retryLastMessage,
    updateSettings,
    settings
  } = useAIChatbot(userId, sessionId);

  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showResources, setShowResources] = useState(false);
  const [showInterventions, setShowInterventions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        handleSendMessage(transcript, true);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  // Send initial message
  useEffect(() => {
    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]);

  // Handle crisis detection
  useEffect(() => {
    if (currentResponse?.crisisDetected && onCrisisDetected) {
      onCrisisDetected(currentResponse);
    }
  }, [currentResponse, onCrisisDetected]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text?: string, voiceInput: boolean = false) => {
    const messageText = text || inputValue.trim();
    
    if (!messageText || isLoading) return;

    setInputValue('');
    await sendMessage(messageText, voiceInput);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakMessage = (text: string) => {
    if (!voiceEnabled || !speechSynthesis) return;

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleResourceClick = (resource: TherapeuticResource) => {
    if (resource.url) {
      if (resource.url.startsWith('tel:') || resource.url.startsWith('sms:')) {
        window.location.href = resource.url;
      } else {
        window.open(resource.url, '_blank');
      }
    }
  };

  const handleInterventionStart = (intervention: Intervention) => {
    // Navigate to intervention or start guided exercise
    console.log('Starting intervention:', intervention.name);
  };

  const handleQuickResponse = (text: string) => {
    setInputValue(text);
    handleSendMessage(text);
  };

  // Calculate mood indicator
  const moodIndicator = useMemo(() => {
    if (messages.length === 0) return null;

    const recentMessages = messages.slice(-5);
    const userMessages = recentMessages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) return null;

    let totalSentiment = 0;
    let count = 0;

    userMessages.forEach(msg => {
      if (msg.metadata?.sentiment) {
        totalSentiment += msg.metadata.sentiment.score;
        count++;
      }
    });

    if (count === 0) return null;

    const avgSentiment = totalSentiment / count;
    let mood = 'neutral';
    let color = '#808080';

    if (avgSentiment < -0.5) {
      mood = 'very negative';
      color = '#DC143C';
    } else if (avgSentiment < -0.2) {
      mood = 'negative';
      color = '#FF6347';
    } else if (avgSentiment > 0.5) {
      mood = 'very positive';
      color = '#32CD32';
    } else if (avgSentiment > 0.2) {
      mood = 'positive';
      color = '#90EE90';
    }

    return { mood, color, score: avgSentiment };
  }, [messages]);

  return (
    <div className={`ai-chatbot ${className} ${embedded ? 'embedded' : 'fullscreen'}`}>
      {/* Header */}
      <div className="chatbot-header">
        <div className="header-left">
          <Brain className="header-icon" />
          <div className="header-info">
            <h3>AI Mental Health Assistant</h3>
            <p className="header-status">
              {isTyping ? 'Typing...' : 'Ready to help'}
            </p>
          </div>
        </div>

        <div className="header-right">
          {moodIndicator && (
            <div className="mood-indicator" style={{ backgroundColor: moodIndicator.color }}>
              <span>{moodIndicator.mood}</span>
            </div>
          )}

          <button
            className="header-btn"
            onClick={() => setShowResources(!showResources)}
            title="Resources"
          >
            <HelpCircle className="w-5 h-5" />
            {resources.length > 0 && <span className="badge">{resources.length}</span>}
          </button>

          <button
            className="header-btn"
            onClick={() => setShowInterventions(!showInterventions)}
            title="Exercises"
          >
            <Activity className="w-5 h-5" />
            {interventions.length > 0 && <span className="badge">{interventions.length}</span>}
          </button>

          <button
            className="header-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {!embedded && (
            <button
              className="header-btn"
              onClick={onClose}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Crisis Alert */}
      {currentResponse?.crisisDetected && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="crisis-alert-banner"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Crisis indicators detected. Your safety is our priority.</span>
          <button onClick={() => window.location.href = 'tel:988'}>
            Call 988 Now
          </button>
        </motion.div>
      )}

      {/* Main Chat Area */}
      <div className="chatbot-body">
        {/* Resources Panel */}
        <AnimatePresence>
          {showResources && resources.length > 0 && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="side-panel resources-panel"
            >
              <h3>Helpful Resources</h3>
              <div className="resources-list">
                {resources.map((resource, index) => (
                  <ResourceCard
                    key={index}
                    resource={resource}
                    onClick={() => handleResourceClick(resource)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="messages-container">
          <div className="messages-scroll">
            {messages.length === 0 && (
              <div className="welcome-message">
                <Brain className="w-12 h-12 mb-4" />
                <h3>Welcome to Your Safe Space</h3>
                <p>I'm here to listen and support you. Everything you share is confidential and encrypted.</p>
                <p className="mt-2">How are you feeling today?</p>
              </div>
            )}

            {messages.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                onResourceClick={handleResourceClick}
                onInterventionStart={handleInterventionStart}
              />
            ))}

            <AnimatePresence>
              <TypingIndicator isTyping={isTyping} />
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Interventions Panel */}
        <AnimatePresence>
          {showInterventions && interventions.length > 0 && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="side-panel interventions-panel"
            >
              <h3>Suggested Exercises</h3>
              <div className="interventions-list">
                {interventions.map((intervention, index) => (
                  <InterventionCard
                    key={index}
                    intervention={intervention}
                    onStart={() => handleInterventionStart(intervention)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Responses */}
      {suggestions.length > 0 && (
        <div className="quick-responses">
          {suggestions.map((suggestion, index) => (
            <QuickResponseButton
              key={index}
              suggestion={suggestion}
              onClick={handleQuickResponse}
              disabled={isLoading}
            />
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="chatbot-footer">
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Type your message here..."}
            disabled={isLoading || isListening}
            rows={1}
            className="message-input"
          />

          <div className="input-actions">
            <button
              className={`action-btn ${isListening ? 'active' : ''}`}
              onClick={toggleVoiceInput}
              disabled={isLoading}
              title="Voice input"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              className={`action-btn ${isSpeaking ? 'active' : ''}`}
              onClick={() => isSpeaking ? stopSpeaking() : null}
              title={isSpeaking ? "Stop speaking" : "Voice output"}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              className="send-btn"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="footer-info">
          <span className="privacy-notice">
            🔒 Your conversations are encrypted and confidential
          </span>
          {currentResponse?.escalationRequired && (
            <span className="escalation-notice">
              ⚠️ Professional support recommended
            </span>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="settings-modal"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="settings-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Chat Settings</h3>
              
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                  />
                  Enable voice output
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                  />
                  Auto-scroll to new messages
                </label>
              </div>

              <div className="setting-item">
                <label>
                  Response tone:
                  <select
                    value={settings.preferredTone}
                    onChange={(e) => updateSettings({ preferredTone: e.target.value as any })}
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="supportive">Supportive</option>
                    <option value="casual">Casual</option>
                  </select>
                </label>
              </div>

              <div className="settings-actions">
                <button onClick={clearConversation} className="clear-btn">
                  Clear Conversation
                </button>
                <button onClick={() => setShowSettings(false)} className="close-btn">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChatbot;