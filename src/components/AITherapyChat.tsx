/**
 * AI Therapy Chat Component
 * 
 * Enhanced AI therapy chat interface with GPT-4 integration,
 * comprehensive safety features, and therapeutic interventions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Bot, User, Shield, AlertTriangle, Phone, MessageSquare,
  Heart, Brain, Activity, FileText, Download, ChevronDown,
  Loader2, CheckCircle, AlertCircle, Clock, Sparkles
} from 'lucide-react';
import { aiTherapyService, AITherapySession, TherapeuticResponse } from '../services/aiTherapyService';
import { aiSafetyGuardrails } from '../services/aiSafetyGuardrails';
import { crisisService } from '../services/api/crisisService';

// ============================
// Type Definitions
// ============================

interface AITherapyChatProps {
  userId: string;
  userName?: string;
  sessionType?: 'general' | 'cbt' | 'dbt' | 'mindfulness' | 'crisis' | 'assessment';
  onSessionEnd?: (session: AITherapySession) => void;
  onCrisisDetected?: (severity: string) => void;
  className?: string;
}

interface Message {
  id: string;
  role: 'user' | 'therapist' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  analysis?: any;
  interventions?: any[];
  suggestedResponses?: string[];
}

interface SessionState {
  isActive: boolean;
  isTyping: boolean;
  riskLevel: string;
  therapeuticAlliance: number;
  interventionsActive: any[];
  sessionNotes: boolean;
}

// ============================
// Main Component
// ============================

export const AITherapyChat: React.FC<AITherapyChatProps> = ({
  userId,
  userName = 'User',
  sessionType = 'general',
  onSessionEnd,
  onCrisisDetected,
  className = ''
}) => {
  // State management
  const [session, setSession] = useState<AITherapySession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    isTyping: false,
    riskLevel: 'minimal',
    therapeuticAlliance: 5,
    interventionsActive: [],
    sessionNotes: false
  });
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const [showInterventions, setShowInterventions] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionRef = useRef<AITherapySession | null>(null);
  
  // ============================
  // Lifecycle & Effects
  // ============================
  
  useEffect(() => {
    initializeSession();
    
    return () => {
      if (sessionRef.current) {
        handleEndSession();
      }
    };
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  
  // ============================
  // Session Management
  // ============================
  
  const initializeSession = async () => {
    try {
      const newSession = await aiTherapyService.startSession(userId, sessionType);
      setSession(newSession);
      setSessionState(prev => ({ ...prev, isActive: true }));
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'therapist',
        content: newSession.messages[0].content,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // Set initial suggested responses
      setSuggestedResponses([
        "I'm feeling anxious today",
        "I've been struggling with my mood",
        "I need someone to talk to",
        "I'm not sure where to start"
      ]);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      showSystemMessage('Failed to start therapy session. Please refresh and try again.');
    }
  };
  
  const handleEndSession = async () => {
    if (!session) return;
    
    try {
      const sessionNotes = await aiTherapyService.endSession(session.id);
      
      if (onSessionEnd) {
        onSessionEnd(session);
      }
      
      // Show session summary
      showSystemMessage(`Session ended. Duration: ${getSessionDuration()} minutes.`);
      setSessionState(prev => ({ ...prev, isActive: false, sessionNotes: true }));
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };
  
  // ============================
  // Message Handling
  // ============================
  
  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputMessage.trim();
    if (!messageContent || !session || sessionState.isTyping) return;
    
    // Clear input
    setInputMessage('');
    setSuggestedResponses([]);
    
    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setSessionState(prev => ({ ...prev, isTyping: true }));
    
    try {
      // Safety check on user input
      const safetyCheck = await aiSafetyGuardrails.checkSafety(messageContent, {
        userId,
        sessionId: session.id,
        messageType: 'user'
      });
      
      if (safetyCheck.violations.some(v => v.severity === 'critical')) {
        setSafetyWarning('Your message contains content that requires immediate attention. Crisis resources have been provided.');
        await handleCrisisDetection('critical', messageContent);
      }
      
      // Check for crisis indicators
      const crisisCheck = await aiSafetyGuardrails.checkUserInputForCrisis(messageContent, userId);
      if (crisisCheck.requiresIntervention) {
        await handleCrisisDetection(crisisCheck.interventionType!, messageContent);
      }
      
      // Process message with AI therapy service
      const response = await aiTherapyService.processMessage(session.id, messageContent);
      
      // Validate AI response
      const validationResult = await aiSafetyGuardrails.validateAIResponse(
        response.message,
        {
          userId,
          sessionId: session.id,
          userMessage: messageContent,
          conversationHistory: messages.map(m => m.content)
        }
      );
      
      const finalResponse = validationResult.modifiedResponse || response.message;
      
      // Update user message status
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
      ));
      
      // Add AI response
      const aiMessage: Message = {
        id: `msg_${Date.now()}_ai`,
        role: 'therapist',
        content: finalResponse,
        timestamp: new Date(),
        interventions: response.interventions,
        suggestedResponses: response.suggestedFollowUps
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setSuggestedResponses(response.suggestedFollowUps || []);
      
      // Update session state
      if (response.riskUpdate) {
        setSessionState(prev => ({
          ...prev,
          riskLevel: response.riskUpdate!.overallRisk
        }));
      }
      
      // Handle interventions
      if (response.interventions && response.interventions.length > 0) {
        setSessionState(prev => ({
          ...prev,
          interventionsActive: [...prev.interventionsActive, ...response.interventions!]
        }));
        setShowInterventions(true);
      }
      
      // Update therapeutic alliance
      const updatedSession = aiTherapyService.getSession(session.id);
      if (updatedSession) {
        setSession(updatedSession);
        setSessionState(prev => ({
          ...prev,
          therapeuticAlliance: updatedSession.therapeuticAlliance.rapport
        }));
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Update message status to error
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
      ));
      
      // Add error message
      showSystemMessage('I apologize, but I encountered an error processing your message. Please try again.');
    } finally {
      setSessionState(prev => ({ ...prev, isTyping: false }));
    }
  };
  
  const handleCrisisDetection = async (severity: string, content: string) => {
    // Report to crisis service
    await crisisService.reportCrisis({
      userId,
      type: 'detection',
      severity: severity as any,
      triggerContent: content,
      triggerSource: 'chat',
      metadata: {
        confidence: 1.0,
        riskFactors: [],
        protectiveFactors: [],
        interventionsTriggered: ['ai_therapy_chat'],
        emergencyContactsNotified: [],
        resourcesProvided: ['crisis_hotline', 'text_support'],
        followUpRequired: true
      }
    });
    
    // Notify parent component
    if (onCrisisDetected) {
      onCrisisDetected(severity);
    }
    
    // Add crisis resources message
    const crisisMessage: Message = {
      id: `msg_${Date.now()}_crisis`,
      role: 'system',
      content: getCrisisResourcesMessage(severity),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, crisisMessage]);
  };
  
  // ============================
  // UI Helpers
  // ============================
  
  const showSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: `msg_${Date.now()}_system`,
      role: 'system',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const getSessionDuration = (): number => {
    if (!session) return 0;
    const now = session.endTime || new Date();
    return Math.round((now.getTime() - session.startTime.getTime()) / 1000 / 60);
  };
  
  const getCrisisResourcesMessage = (severity: string): string => {
    if (severity === 'emergency' || severity === 'critical') {
      return `🚨 IMMEDIATE HELP AVAILABLE:
• Call 988 - Suicide & Crisis Lifeline (24/7)
• Text HOME to 741741 - Crisis Text Line
• Call 911 if in immediate danger
• Go to nearest emergency room

You are not alone. Help is available right now.`;
    }
    
    return `💙 SUPPORT RESOURCES:
• Call 988 for crisis support
• Text HOME to 741741 for text support
• Reach out to a trusted friend or family member
• Contact your therapist or counselor

Your feelings are valid and help is available.`;
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSuggestedResponse = (response: string) => {
    setInputMessage(response);
    inputRef.current?.focus();
  };
  
  const handleExportSession = () => {
    if (!session) return;
    
    const exportData = aiTherapyService.exportSessionNotes(session.id, 'txt');
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `therapy_session_${session.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // ============================
  // Message Rendering
  // ============================
  
  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    
    if (isSystem) {
      return (
        <div key={message.id} className="flex justify-center my-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <div className="text-sm text-blue-800 whitespace-pre-line">{message.content}</div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[70%]`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'ml-2 bg-blue-600' : 'mr-2 bg-gradient-to-r from-purple-600 to-blue-600'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
          </div>
          
          {/* Message Content */}
          <div>
            <div className={`px-4 py-2 rounded-2xl ${
              isUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              
              {/* Message Status */}
              {isUser && message.status && (
                <div className="flex items-center gap-1 mt-1">
                  {message.status === 'sending' && (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-200" />
                  )}
                  {message.status === 'sent' && (
                    <CheckCircle className="w-3 h-3 text-blue-200" />
                  )}
                  {message.status === 'error' && (
                    <AlertCircle className="w-3 h-3 text-red-200" />
                  )}
                </div>
              )}
            </div>
            
            {/* Timestamp */}
            <div className={`text-xs mt-1 ${isUser ? 'text-right text-gray-500' : 'text-gray-500'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            
            {/* Interventions */}
            {message.interventions && message.interventions.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.interventions.map((intervention: any) => (
                  <div
                    key={intervention.id}
                    className="bg-purple-50 border border-purple-200 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-sm text-purple-900">
                        {intervention.name}
                      </span>
                    </div>
                    <p className="text-xs text-purple-700 mb-2">
                      {intervention.description}
                    </p>
                    {intervention.instructions && (
                      <ol className="list-decimal list-inside text-xs text-purple-600 space-y-1">
                        {intervention.instructions.map((instruction: string, idx: number) => (
                          <li key={idx}>{instruction}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // ============================
  // Main Render
  // ============================
  
  return (
    <div className={`ai-therapy-chat flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Therapy Session</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="capitalize">{sessionType} therapy</span>
              {sessionState.isActive && (
                <>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getSessionDuration()} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Risk: {sessionState.riskLevel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Session Info Toggle */}
          <button
            onClick={() => setShowSessionInfo(!showSessionInfo)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Session Information"
          >
            <ChevronDown className={`w-4 h-4 transform transition-transform ${
              showSessionInfo ? 'rotate-180' : ''
            }`} />
          </button>
          
          {/* Crisis Resources */}
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
          
          {/* Export Session */}
          {sessionState.sessionNotes && (
            <button
              onClick={handleExportSession}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              title="Export Session Notes"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {/* End Session */}
          {sessionState.isActive && (
            <button
              onClick={handleEndSession}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              End Session
            </button>
          )}
        </div>
      </div>
      
      {/* Session Info Panel */}
      {showSessionInfo && session && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Therapeutic Alliance</span>
              <div className="flex items-center gap-2 mt-1">
                <Heart className="w-4 h-4 text-pink-500" />
                <span className="font-medium">{sessionState.therapeuticAlliance.toFixed(1)}/10</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Messages</span>
              <div className="font-medium mt-1">{messages.filter(m => m.role === 'user').length}</div>
            </div>
            <div>
              <span className="text-gray-500">Interventions</span>
              <div className="font-medium mt-1">{sessionState.interventionsActive.length}</div>
            </div>
            <div>
              <span className="text-gray-500">Session ID</span>
              <div className="font-mono text-xs mt-1">{session.id.slice(-8)}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Safety Warning */}
      {safetyWarning && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">{safetyWarning}</span>
            <button
              onClick={() => setSafetyWarning(null)}
              className="ml-auto text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(renderMessage)}
        
        {/* Typing Indicator */}
        {sessionState.isTyping && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start max-w-[70%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-gradient-to-r from-purple-600 to-blue-600">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-2 rounded-2xl bg-gray-100">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Suggested Responses */}
      {suggestedResponses.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600">Suggested responses:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedResponses.map((response, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedResponse(response)}
                className="px-3 py-1 text-sm bg-white border border-purple-300 text-purple-700 rounded-full hover:bg-purple-50 transition-colors"
              >
                {response}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={sessionState.isActive ? "Share what's on your mind..." : "Session ended"}
            disabled={!sessionState.isActive || sessionState.isTyping}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={2}
          />
          
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || !sessionState.isActive || sessionState.isTyping}
            className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Privacy Notice */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>Your conversation is private and protected by safety guardrails</span>
        </div>
      </div>
      
      {/* Crisis Resources Footer */}
      <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-center">
        <p className="text-xs text-red-700">
          If you're in crisis: <strong>Call 988</strong> or <strong>Text HOME to 741741</strong>
        </p>
      </div>
    </div>
  );
};

export default AITherapyChat;