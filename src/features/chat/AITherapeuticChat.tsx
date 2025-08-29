import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Heart, Brain, Loader2, AlertTriangle, Shield, Mic, MicOff } from 'lucide-react';
import { AppButton } from '../../components/AppButton';

interface TherapeuticMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'suggestion' | 'exercise' | 'crisis_response' | 'check_in';
  metadata?: {
    confidence: number;
    therapeuticTechniques: string[];
    sentiment: 'positive' | 'neutral' | 'negative' | 'concerning';
    crisisLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    followUp?: string[];
  };
}

interface TherapeuticSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  approach: 'cbt' | 'dbt' | 'mindfulness' | 'person_centered' | 'solution_focused';
  goalStatus: 'exploring' | 'goal_setting' | 'working' | 'reviewing';
  sessionNotes?: string;
}

interface AITherapeuticChatProps {
  userId: string;
  sessionId?: string;
  approach?: TherapeuticSession['approach'];
  onCrisisDetected?: (level: string, content: string) => void;
  onSessionEnd?: (session: TherapeuticSession) => void;
  className?: string;
}

export const AITherapeuticChat: React.FC<AITherapeuticChatProps> = ({
  userId,
  sessionId,
  approach = 'person_centered',
  onCrisisDetected,
  onSessionEnd,
  className = ''
}) => {
  const [messages, setMessages] = useState<TherapeuticMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [currentSession, setCurrentSession] = useState<TherapeuticSession | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [sessionGoal, setSessionGoal] = useState<string>('');
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    startNewSession();
    setupSpeechRecognition();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  const setupSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          
          if (event.results[0].isFinal) {
            setInputMessage(transcript);
            setIsListening(false);
          }
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  };

  const startNewSession = () => {
    const session: TherapeuticSession = {
      id: sessionId || `session_${Date.now()}`,
      startTime: new Date(),
      approach,
      goalStatus: 'exploring'
    };

    setCurrentSession(session);
    
    // Welcome message based on therapeutic approach
    const welcomeMessage: TherapeuticMessage = {
      id: 'welcome',
      content: getWelcomeMessage(approach),
      sender: 'ai',
      timestamp: new Date(),
      type: 'check_in',
      metadata: {
        confidence: 1.0,
        therapeuticTechniques: ['rapport_building', 'initial_assessment'],
        sentiment: 'positive',
        crisisLevel: 'none'
      }
    };

    setMessages([welcomeMessage]);
  };

  const getWelcomeMessage = (approach: TherapeuticSession['approach']): string => {
    const messages = {
      cbt: "Hello! I'm here to help you explore your thoughts and feelings using cognitive behavioral techniques. What's been on your mind today?",
      dbt: "Welcome! I'm trained in dialectical behavior therapy skills. Let's work on emotional regulation and mindfulness together. How are you feeling right now?",
      mindfulness: "Hi there! I'm here to guide you through mindfulness practices and present-moment awareness. What would you like to explore today?",
      person_centered: "Hello! This is your safe space to share and be heard. I'm here to listen with empathy and support you. What would you like to talk about?",
      solution_focused: "Welcome! I'm here to help you identify your strengths and work toward your goals. What positive changes would you like to see in your life?"
    };
    return messages[approach];
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content || isAITyping) return;

    const userMessage: TherapeuticMessage = {
      id: `user_${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsAITyping(true);

    try {
      // Crisis detection
      const crisisLevel = detectCrisisIndicators(content);
      if (crisisLevel !== 'none') {
        await handleCrisisResponse(content, crisisLevel);
        return;
      }

      // Generate AI response
      const aiResponse = await generateTherapeuticResponse(content, userMessage);
      
      setTimeout(() => {
        setMessages(prev => [...prev, aiResponse]);
        setIsAITyping(false);
      }, 1000 + Math.random() * 2000);

    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: TherapeuticMessage = {
        id: `error_${Date.now()}`,
        content: "I'm having trouble processing that right now. If this is urgent, please reach out to a crisis helpline at 988.",
        sender: 'ai',
        timestamp: new Date(),
        type: 'crisis_response',
        metadata: {
          confidence: 1.0,
          therapeuticTechniques: ['crisis_intervention'],
          sentiment: 'concerning',
          crisisLevel: 'medium'
        }
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsAITyping(false);
    }
  };

  const detectCrisisIndicators = (message: string): TherapeuticMessage['metadata']['crisisLevel'] => {
    const lowerMessage = message.toLowerCase();
    
    // Critical indicators
    const criticalWords = ['suicide', 'kill myself', 'end it all', 'want to die', 'better off dead'];
    if (criticalWords.some(word => lowerMessage.includes(word))) {
      return 'critical';
    }

    // High risk indicators
    const highRiskWords = ['self harm', 'hurt myself', 'can\'t go on', 'hopeless', 'worthless'];
    if (highRiskWords.some(word => lowerMessage.includes(word))) {
      return 'high';
    }

    // Medium risk indicators
    const mediumRiskWords = ['depressed', 'overwhelmed', 'trapped', 'no point', 'give up'];
    if (mediumRiskWords.some(word => lowerMessage.includes(word))) {
      return 'medium';
    }

    return 'none';
  };

  const handleCrisisResponse = async (content: string, crisisLevel: string) => {
    setEmergencyMode(true);
    
    if (onCrisisDetected) {
      onCrisisDetected(crisisLevel, content);
    }

    const crisisResponse: TherapeuticMessage = {
      id: `crisis_${Date.now()}`,
      content: getCrisisResponseMessage(crisisLevel as any),
      sender: 'ai',
      timestamp: new Date(),
      type: 'crisis_response',
      metadata: {
        confidence: 1.0,
        therapeuticTechniques: ['crisis_intervention', 'safety_planning'],
        sentiment: 'concerning',
        crisisLevel: crisisLevel as any,
        followUp: [
          'Would you like help creating a safety plan?',
          'Can we talk about what support you have available?',
          'What has helped you feel better in difficult times before?'
        ]
      }
    };

    setMessages(prev => [...prev, crisisResponse]);
    setIsAITyping(false);
  };

  const getCrisisResponseMessage = (level: 'critical' | 'high' | 'medium'): string => {
    const responses = {
      critical: "I'm very concerned about what you're sharing. Your life has value and you deserve support. Please call 988 (Suicide & Crisis Lifeline) right now, or text HOME to 741741. If you're in immediate danger, please call 911. I want to help you stay safe.",
      high: "I hear that you're in significant pain right now. These feelings can be overwhelming, but you don't have to face them alone. Please consider calling 988 for immediate support, or reach out to someone you trust. Your safety is the priority.",
      medium: "It sounds like you're going through a really difficult time. These feelings are important and I want to help you work through them safely. If things feel too overwhelming, 988 is always available for support."
    };
    return responses[level];
  };

  const generateTherapeuticResponse = async (userInput: string, userMessage: TherapeuticMessage): Promise<TherapeuticMessage> => {
    // Simulate AI processing - in reality would use advanced therapeutic AI
    const techniques = getTherapeuticTechniques(userInput, approach as TherapeuticSession['approach']);
    const sentiment = analyzeSentiment(userInput);
    
    const responseContent = generateResponseContent(userInput, approach as TherapeuticSession['approach'], sentiment);
    
    return {
      id: `ai_${Date.now()}`,
      content: responseContent,
      sender: 'ai',
      timestamp: new Date(),
      type: techniques.includes('guided_exercise') ? 'exercise' : 'text',
      metadata: {
        confidence: 0.85,
        therapeuticTechniques: techniques,
        sentiment: sentiment,
        crisisLevel: 'none',
        followUp: generateFollowUpQuestions(userInput, approach as TherapeuticSession['approach'])
      }
    };
  };

  const getTherapeuticTechniques = (input: string, approach: TherapeuticSession['approach']): string[] => {
    const lowerInput = input.toLowerCase();
    const baseTechniques = ['active_listening', 'empathic_responding'];
    
    switch (approach) {
      case 'cbt':
        if (lowerInput.includes('think') || lowerInput.includes('thought')) {
          return [...baseTechniques, 'thought_challenging', 'cognitive_restructuring'];
        }
        return [...baseTechniques, 'behavioral_activation'];
        
      case 'dbt':
        if (lowerInput.includes('emotion') || lowerInput.includes('feel')) {
          return [...baseTechniques, 'emotion_regulation', 'distress_tolerance'];
        }
        return [...baseTechniques, 'mindfulness_skills'];
        
      case 'mindfulness':
        return [...baseTechniques, 'mindfulness_practice', 'guided_exercise'];
        
      case 'solution_focused':
        return [...baseTechniques, 'strength_identification', 'goal_setting'];
        
      default:
        return baseTechniques;
    }
  };

  const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' | 'concerning' => {
    const lowerText = text.toLowerCase();
    
    const positiveWords = ['good', 'happy', 'better', 'hopeful', 'grateful', 'progress'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious'];
    const concerningWords = ['hopeless', 'worthless', 'trapped', 'overwhelmed'];
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    const concerningCount = concerningWords.filter(word => lowerText.includes(word)).length;
    
    if (concerningCount > 0) return 'concerning';
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const generateResponseContent = (input: string, approach: TherapeuticSession['approach'], sentiment: string): string => {
    // Simplified response generation - would use sophisticated therapeutic AI in reality
    const empathicResponses = [
      "I hear what you're saying, and it sounds like this is really important to you.",
      "That must be difficult to experience. Thank you for sharing that with me.",
      "I can sense that you're putting a lot of thought into this."
    ];
    
    const approachSpecificResponses = {
      cbt: "Let's explore the thoughts that might be connected to those feelings. What goes through your mind when this happens?",
      dbt: "It sounds like this brings up some intense emotions. What skills have you used to manage difficult feelings like these?",
      mindfulness: "Let's take a moment to notice what you're experiencing right now, without trying to change it.",
      person_centered: "I want to understand this from your perspective. Can you tell me more about what this means to you?",
      solution_focused: "What would need to be different for this situation to feel more manageable for you?"
    };
    
    const baseResponse = empathicResponses[Math.floor(Math.random() * empathicResponses.length)];
    const approachResponse = approachSpecificResponses[approach];
    
    return `${baseResponse} ${approachResponse}`;
  };

  const generateFollowUpQuestions = (input: string, approach: TherapeuticSession['approach']): string[] => {
    const commonQuestions = [
      "How does that feel to share?",
      "What support do you have around this?",
      "What would be most helpful right now?"
    ];
    
    const approachQuestions = {
      cbt: ["What evidence supports or challenges that thought?", "How might you reframe this situation?"],
      dbt: ["What emotions are you noticing?", "What coping skills feel accessible right now?"],
      mindfulness: ["What do you notice in your body as you share this?", "Can we sit with this feeling together?"],
      person_centered: ["What does your inner wisdom tell you about this?", "What feels most important to you here?"],
      solution_focused: ["When has this been less of a problem for you?", "What strengths are you drawing on?"]
    };
    
    return [...commonQuestions, ...approachQuestions[approach]].slice(0, 3);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
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

  return (
    <div className={`ai-therapeutic-chat flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Therapeutic AI Session</h3>
            <p className="text-sm text-gray-600 capitalize">
              {approach.replace('_', ' ')} approach
            </p>
          </div>
        </div>

        {emergencyMode && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Crisis Mode</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[80%]`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' ? 'ml-2 bg-blue-600' : 'mr-2 bg-purple-600'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`px-4 py-2 rounded-2xl ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.type === 'crisis_response'
                    ? 'bg-red-50 text-red-900 border border-red-200'
                    : message.type === 'exercise'
                      ? 'bg-purple-50 text-purple-900 border border-purple-200'
                      : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="text-sm">{message.content}</div>
                
                {/* AI Message Metadata */}
                {message.sender === 'ai' && message.metadata && (
                  <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                    <div className="flex items-center gap-2">
                      <Heart className="w-3 h-3" />
                      <span>
                        Using: {message.metadata.therapeuticTechniques.slice(0, 2).join(', ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* AI Typing Indicator */}
        {isAITyping && (
          <div className="flex justify-start">
            <div className="flex items-end max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-purple-600">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-2 rounded-2xl bg-gray-100">
                <div className="flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">AI is reflecting...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              disabled={isAITyping}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Voice Input Button */}
          {recognitionRef.current && (
            <AppButton
              variant={isListening ? "danger" : "ghost"}
              onClick={toggleVoiceInput}
              disabled={isAITyping}
              icon={isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              className="p-2"
            />
          )}

          {/* Send Button */}
          <AppButton
            variant="primary"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isAITyping}
            icon={<Send className="w-4 h-4" />}
            className="p-2"
          />
        </div>

        {/* Privacy Notice */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>Your therapeutic conversations are private and secure</span>
        </div>

        {/* Emergency Resources */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-600">
            Crisis Support: <strong>988</strong> • Text <strong>HOME</strong> to <strong>741741</strong> • Emergency: <strong>911</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AITherapeuticChat;
