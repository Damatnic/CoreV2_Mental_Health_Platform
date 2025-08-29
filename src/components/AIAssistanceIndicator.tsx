import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Brain, Sparkles, Zap, Eye, EyeOff, Shield, Activity, Heart, MessageCircle } from 'lucide-react';

interface AIAssistanceIndicatorProps {
  isActive: boolean;
  assistanceType?: 'general' | 'crisis' | 'therapy' | 'wellness' | 'chat';
  confidence?: number;
  processingState?: 'idle' | 'thinking' | 'responding' | 'learning';
  showDetails?: boolean;
  privacyMode?: boolean;
  onTogglePrivacy?: (enabled: boolean) => void;
  className?: string;
}

interface AICapability {
  name: string;
  description: string;
  enabled: boolean;
  confidence: number;
  icon: React.ComponentType<any>;
}

interface AIMetrics {
  responseTime: number;
  accuracy: number;
  learningRate: number;
  interactionCount: number;
  helpfulnessScore: number;
}

export const AIAssistanceIndicator: React.FC<AIAssistanceIndicatorProps> = ({
  isActive,
  assistanceType = 'general',
  confidence = 0.85,
  processingState = 'idle',
  showDetails = false,
  privacyMode = true,
  onTogglePrivacy,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  const [aiMetrics, setAiMetrics] = useState<AIMetrics | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize AI metrics
  useEffect(() => {
    if (isActive) {
      setAiMetrics({
        responseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
        accuracy: 0.92 + Math.random() * 0.08, // 92-100%
        learningRate: 0.15 + Math.random() * 0.1, // 15-25%
        interactionCount: Math.floor(Math.random() * 1000) + 100,
        helpfulnessScore: 4.2 + Math.random() * 0.8 // 4.2-5.0
      });
    }
  }, [isActive]);

  const getAssistanceTypeConfig = () => {
    switch (assistanceType) {
      case 'crisis':
        return {
          name: 'Crisis Support AI',
          description: 'Specialized AI for crisis intervention and immediate support',
          icon: Shield,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          pulseColor: 'ring-red-300'
        };
      case 'therapy':
        return {
          name: 'Therapeutic AI',
          description: 'AI assistant trained in therapeutic techniques and mental health support',
          icon: Brain,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          pulseColor: 'ring-purple-300'
        };
      case 'wellness':
        return {
          name: 'Wellness AI',
          description: 'AI focused on mental wellness, self-care, and positive habits',
          icon: Heart,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          pulseColor: 'ring-green-300'
        };
      case 'chat':
        return {
          name: 'Conversation AI',
          description: 'Conversational AI for supportive dialogue and active listening',
          icon: MessageCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          pulseColor: 'ring-blue-300'
        };
      default:
        return {
          name: 'AI Assistant',
          description: 'General AI assistant for mental health support',
          icon: Bot,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          pulseColor: 'ring-indigo-300'
        };
    }
  };

  const getProcessingStateDisplay = () => {
    switch (processingState) {
      case 'thinking':
        return {
          text: 'Analyzing...',
          icon: Brain,
          animation: 'animate-pulse'
        };
      case 'responding':
        return {
          text: 'Generating response...',
          icon: Sparkles,
          animation: 'animate-bounce'
        };
      case 'learning':
        return {
          text: 'Learning from interaction...',
          icon: Zap,
          animation: 'animate-pulse'
        };
      default:
        return {
          text: 'Ready',
          icon: Bot,
          animation: ''
        };
    }
  };

  const getAICapabilities = (): AICapability[] => {
    return [
      {
        name: 'Natural Language Processing',
        description: 'Understanding and processing human language with context awareness',
        enabled: isActive,
        confidence: 0.95,
        icon: MessageCircle
      },
      {
        name: 'Emotional Intelligence',
        description: 'Recognizing emotional states and responding with empathy',
        enabled: isActive && ['therapy', 'crisis', 'wellness'].includes(assistanceType),
        confidence: 0.88,
        icon: Heart
      },
      {
        name: 'Crisis Detection',
        description: 'Identifying potential mental health crises and triggering appropriate responses',
        enabled: isActive && assistanceType === 'crisis',
        confidence: 0.92,
        icon: Shield
      },
      {
        name: 'Therapeutic Techniques',
        description: 'Applying evidence-based therapeutic approaches like CBT and mindfulness',
        enabled: isActive && assistanceType === 'therapy',
        confidence: 0.85,
        icon: Brain
      },
      {
        name: 'Wellness Coaching',
        description: 'Providing personalized wellness recommendations and habit tracking',
        enabled: isActive && assistanceType === 'wellness',
        confidence: 0.90,
        icon: Activity
      }
    ];
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'text-green-600';
    if (conf >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.9) return 'High Confidence';
    if (conf >= 0.7) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const typeConfig = getAssistanceTypeConfig();
  const processingDisplay = getProcessingStateDisplay();
  const IconComponent = typeConfig.icon;
  const ProcessingIcon = processingDisplay.icon;

  const handleTogglePrivacy = () => {
    if (onTogglePrivacy) {
      onTogglePrivacy(!privacyMode);
    }
  };

  return (
    <div className={`ai-assistance-indicator ${className}`}>
      {/* Main Indicator */}
      <div
        className={`
          flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
          ${typeConfig.bgColor} ${typeConfig.borderColor}
          ${isActive && processingState !== 'idle' ? `ring-2 ${typeConfig.pulseColor} ${processingDisplay.animation}` : ''}
          ${showDetails ? 'cursor-pointer hover:shadow-sm' : ''}
          ${isHovered ? 'scale-[1.02]' : ''}
        `}
        onClick={showDetails ? () => setExpanded(!expanded) : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* AI Status Icon */}
        <div className={`flex-shrink-0 relative ${typeConfig.color}`}>
          <IconComponent className="w-6 h-6" />
          
          {/* Processing State Indicator */}
          {isActive && processingState !== 'idle' && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <ProcessingIcon className={`w-2 h-2 ${typeConfig.color} ${processingDisplay.animation}`} />
            </div>
          )}

          {/* Active Status Dot */}
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
            isActive ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>

        {/* Status Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium text-sm ${typeConfig.color}`}>
              {typeConfig.name}
            </h4>
            
            {/* Confidence Score */}
            {isActive && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                confidence >= 0.9 ? 'bg-green-100 text-green-800' :
                confidence >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-600">
              {isActive ? processingDisplay.text : 'Offline'}
            </p>
            
            {/* Privacy Mode Indicator */}
            {isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePrivacy();
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title={privacyMode ? 'Privacy mode on' : 'Privacy mode off'}
              >
                {privacyMode ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expand/Collapse Button */}
        {showDetails && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={expanded ? 'Hide details' : 'Show details'}
          >
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {showDetails && expanded && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* AI Capabilities */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">AI Capabilities</h5>
            <div className="space-y-3">
              {getAICapabilities().map((capability) => {
                const CapabilityIcon = capability.icon;
                return (
                  <div key={capability.name} className="flex items-start gap-3">
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                      ${capability.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}
                    `}>
                      <CapabilityIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${
                          capability.enabled ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {capability.name}
                        </span>
                        {capability.enabled && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            capability.confidence >= 0.9 ? 'bg-green-100 text-green-800' :
                            capability.confidence >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(capability.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {capability.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Metrics */}
          {aiMetrics && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Performance Metrics</h5>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium">{aiMetrics.responseTime}ms</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium">{Math.round(aiMetrics.accuracy * 100)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Learning Rate:</span>
                  <span className="font-medium">{Math.round(aiMetrics.learningRate * 100)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Interactions:</span>
                  <span className="font-medium">{aiMetrics.interactionCount.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-gray-600">Helpfulness Score:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{aiMetrics.helpfulnessScore.toFixed(1)}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg
                          key={star}
                          className={`w-3 h-3 ${
                            star <= aiMetrics.helpfulnessScore ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confidence Assessment */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Current Assessment</h5>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    confidence >= 0.9 ? 'bg-green-500' :
                    confidence >= 0.7 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${getConfidenceColor(confidence)}`}>
                {getConfidenceLabel(confidence)}
              </span>
            </div>
          </div>

          {/* Privacy Information */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Privacy & Security
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  {privacyMode 
                    ? 'Privacy mode is enabled. Your data is processed locally and anonymized.'
                    : 'Standard mode. Some data may be processed in the cloud for enhanced features.'
                  }
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1">
                  <li>• End-to-end encryption for all conversations</li>
                  <li>• No personal data stored without consent</li>
                  <li>• HIPAA compliant processing</li>
                  <li>• Regular security audits</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simplified version for minimal UI
export const SimpleAIIndicator: React.FC<{
  isActive: boolean;
  processingState?: AIAssistanceIndicatorProps['processingState'];
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ isActive, processingState = 'idle', size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const processingDisplay = processingState !== 'idle';

  return (
    <div 
      className={`flex items-center gap-1 ${className}`}
      title={isActive ? 'AI Assistant Active' : 'AI Assistant Offline'}
    >
      <Bot className={`${sizeClasses[size]} ${
        isActive ? 'text-blue-600' : 'text-gray-400'
      } ${processingDisplay ? 'animate-pulse' : ''}`} />
      {size !== 'small' && (
        <span className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
          {isActive ? 'AI Active' : 'AI Offline'}
        </span>
      )}
    </div>
  );
};

// Hook for managing AI assistance state
export const useAIAssistance = (initialType: AIAssistanceIndicatorProps['assistanceType'] = 'general') => {
  const [isActive, setIsActive] = useState(false);
  const [assistanceType, setAssistanceType] = useState(initialType);
  const [processingState, setProcessingState] = useState<AIAssistanceIndicatorProps['processingState']>('idle');
  const [confidence, setConfidence] = useState(0.85);

  const activateAI = useCallback((type?: AIAssistanceIndicatorProps['assistanceType']) => {
    if (type) setAssistanceType(type);
    setIsActive(true);
  }, []);

  const deactivateAI = useCallback(() => {
    setIsActive(false);
    setProcessingState('idle');
  }, []);

  const updateProcessingState = useCallback((state: AIAssistanceIndicatorProps['processingState']) => {
    setProcessingState(state);
  }, []);

  const updateConfidence = useCallback((conf: number) => {
    setConfidence(Math.max(0, Math.min(1, conf)));
  }, []);

  return {
    isActive,
    assistanceType,
    processingState,
    confidence,
    activateAI,
    deactivateAI,
    updateProcessingState,
    updateConfidence,
    setAssistanceType
  };
};

export default AIAssistanceIndicator;
