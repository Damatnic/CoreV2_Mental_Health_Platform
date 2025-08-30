/**
 * OPTIMIZED CRISIS INTERVENTION FLOW COMPONENT
 * 
 * Enhanced crisis intervention system with streamlined user flows,
 * therapeutic animations, and immediate access to help resources.
 * Designed to minimize cognitive load during high-stress situations.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AlertTriangle, 
  Phone, 
  MessageCircle, 
  Heart, 
  Shield,
  User,
  ChevronRight,
  X,
  Mic,
  Volume2
} from 'lucide-react';
import { 
  DURATIONS, 
  EASINGS, 
  createAnimation,
  createTransition,
  getPrefersReducedMotion,
  CRISIS_ANIMATIONS
} from '../utils/animations';
import {
  RippleEffect,
  PressScale,
  GentlePulse,
  LoadingDots,
  ProgressBar
} from './MicroInteractions';

interface CrisisFlowProps {
  onClose?: () => void;
  userId?: string;
}

type FlowStep = 'assessment' | 'resources' | 'contact' | 'safety-plan' | 'follow-up';
type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

const CrisisFlowOptimized: React.FC<CrisisFlowProps> = ({ onClose, userId }) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('assessment');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = getPrefersReducedMotion();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const command = event.results[0][0].transcript.toLowerCase();
          handleVoiceCommand(command);
        };
        
        recognition.onerror = () => {
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        setSpeechRecognition(recognition);
      }
    }
  }, []);

  // Voice command handler
  const handleVoiceCommand = (command: string) => {
    if (command.includes('help') || command.includes('emergency')) {
      handleEmergencyCall();
    } else if (command.includes('text') || command.includes('message')) {
      handleTextCrisis();
    } else if (command.includes('safe') || command.includes('plan')) {
      setCurrentStep('safety-plan');
    } else if (command.includes('talk') || command.includes('someone')) {
      setCurrentStep('contact');
    }
  };

  // Toggle voice control
  const toggleVoiceControl = () => {
    if (!speechRecognition) return;
    
    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      speechRecognition.start();
      setIsListening(true);
    }
  };

  // Assessment questions
  const assessmentQuestions = [
    {
      id: 'feeling',
      question: "How are you feeling right now?",
      options: [
        { label: "Overwhelmed", value: 'high' },
        { label: "Anxious", value: 'medium' },
        { label: "Sad", value: 'low' },
        { label: "In crisis", value: 'critical' }
      ]
    },
    {
      id: 'safety',
      question: "Are you safe right now?",
      options: [
        { label: "Yes, I'm safe", value: 'low' },
        { label: "I'm not sure", value: 'medium' },
        { label: "I need help", value: 'high' },
        { label: "Emergency", value: 'critical' }
      ]
    }
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Handle assessment answer
  const handleAssessmentAnswer = (value: string) => {
    const newAnswers = { ...answers, [assessmentQuestions[currentQuestion].id]: value };
    setAnswers(newAnswers);
    
    // Update severity based on answer
    setSeverity(value as SeverityLevel);
    
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Assessment complete, move to appropriate next step
      if (value === 'critical') {
        setCurrentStep('contact');
      } else {
        setCurrentStep('resources');
      }
    }
  };

  // Emergency call handler
  const handleEmergencyCall = () => {
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(() => {
      window.location.href = 'tel:988';
    }, 500);
  };

  // Text crisis handler
  const handleTextCrisis = () => {
    setIsConnecting(true);
    setTimeout(() => {
      window.location.href = 'sms:741741?body=HOME';
    }, 500);
  };

  // Get step animation duration based on severity
  const getAnimationDuration = () => {
    if (severity === 'critical') return CRISIS_ANIMATIONS.immediate.duration;
    if (severity === 'high') return CRISIS_ANIMATIONS.urgent.duration;
    return CRISIS_ANIMATIONS.clear.duration;
  };

  // Render assessment step
  const renderAssessment = () => {
    const question = assessmentQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;

    return (
      <div className="crisis-flow-assessment">
        <ProgressBar 
          progress={progress} 
          color="#059ae9" 
          height={4}
          animated={!prefersReducedMotion}
        />
        
        <h2 className="assessment-question">{question.question}</h2>
        
        <div className="assessment-options">
          {question.options.map((option, index) => (
            <PressScale key={option.value} disabled={prefersReducedMotion}>
              <button
                className={`assessment-option severity-${option.value}`}
                onClick={() => handleAssessmentAnswer(option.value)}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: prefersReducedMotion 
                    ? 'none' 
                    : createAnimation('slideInUp', { 
                        duration: getAnimationDuration(),
                        delay: index * 50 
                      })
                }}
              >
                <span className="option-label">{option.label}</span>
                <ChevronRight className="option-arrow" />
                <RippleEffect disabled={prefersReducedMotion} />
              </button>
            </PressScale>
          ))}
        </div>

        <div className="assessment-footer">
          <button className="skip-assessment" onClick={() => setCurrentStep('resources')}>
            Skip to Resources
          </button>
        </div>
      </div>
    );
  };

  // Render resources step
  const renderResources = () => {
    const resources = [
      {
        icon: Phone,
        title: "988 Lifeline",
        description: "24/7 crisis support",
        action: handleEmergencyCall,
        color: "#dc2626",
        priority: severity === 'critical'
      },
      {
        icon: MessageCircle,
        title: "Crisis Text Line",
        description: "Text HOME to 741741",
        action: handleTextCrisis,
        color: "#ea580c",
        priority: severity === 'high'
      },
      {
        icon: Heart,
        title: "Safety Plan",
        description: "Your personalized coping strategies",
        action: () => setCurrentStep('safety-plan'),
        color: "#059669",
        priority: false
      },
      {
        icon: User,
        title: "Contact Support",
        description: "Reach trusted contacts",
        action: () => setCurrentStep('contact'),
        color: "#3b82f6",
        priority: false
      }
    ];

    // Sort by priority if in crisis
    const sortedResources = severity === 'critical' || severity === 'high'
      ? [...resources].sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
      : resources;

    return (
      <div className="crisis-flow-resources">
        <h2 className="resources-title">Support Resources</h2>
        <p className="resources-subtitle">Help is available. You're not alone.</p>
        
        <div className="resources-grid">
          {sortedResources.map((resource, index) => (
            <PressScale key={resource.title} disabled={prefersReducedMotion}>
              <button
                className={`resource-card ${resource.priority ? 'priority' : ''}`}
                onClick={resource.action}
                style={{
                  animation: prefersReducedMotion 
                    ? 'none' 
                    : createAnimation('scaleIn', { 
                        duration: getAnimationDuration(),
                        delay: index * 50 
                      })
                }}
              >
                {resource.priority && (
                  <GentlePulse active={!prefersReducedMotion}>
                    <div className="priority-badge">Recommended</div>
                  </GentlePulse>
                )}
                
                <div className="resource-icon" style={{ color: resource.color }}>
                  <resource.icon size={32} />
                </div>
                
                <h3 className="resource-title">{resource.title}</h3>
                <p className="resource-description">{resource.description}</p>
                
                {isConnecting && (
                  <div className="connecting-overlay">
                    <LoadingDots color="white" />
                    <span>Connecting...</span>
                  </div>
                )}
                
                <RippleEffect color={resource.color} disabled={prefersReducedMotion} />
              </button>
            </PressScale>
          ))}
        </div>
      </div>
    );
  };

  // Render safety plan step
  const renderSafetyPlan = () => {
    const safetyStrategies = [
      { icon: Heart, title: "Breathing Exercise", action: "Start 4-7-8 breathing" },
      { icon: Shield, title: "Safe Space", action: "Go to your safe place" },
      { icon: User, title: "Call Someone", action: "Contact your support person" },
      { icon: MessageCircle, title: "Journal", action: "Write your feelings" }
    ];

    return (
      <div className="crisis-flow-safety-plan">
        <h2 className="safety-title">Your Safety Plan</h2>
        
        <div className="safety-strategies">
          {safetyStrategies.map((strategy, index) => (
            <div 
              key={strategy.title}
              className="safety-strategy"
              style={{
                animation: prefersReducedMotion 
                  ? 'none' 
                  : createAnimation('slideInLeft', { 
                      duration: getAnimationDuration(),
                      delay: index * 75 
                    })
              }}
            >
              <div className="strategy-icon">
                <strategy.icon size={24} />
              </div>
              <div className="strategy-content">
                <h3>{strategy.title}</h3>
                <p>{strategy.action}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="safety-action-btn"
          onClick={() => setCurrentStep('resources')}
        >
          Back to Resources
        </button>
      </div>
    );
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'assessment':
        return renderAssessment();
      case 'resources':
        return renderResources();
      case 'safety-plan':
        return renderSafetyPlan();
      default:
        return renderResources();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`crisis-flow-container severity-${severity}`}
      role="dialog"
      aria-modal="true"
      aria-label="Crisis Support Flow"
      style={{
        animation: prefersReducedMotion 
          ? 'none' 
          : createAnimation('scaleIn', { duration: getAnimationDuration() })
      }}
    >
      {/* Header */}
      <div className="crisis-flow-header">
        <div className="header-left">
          <AlertTriangle className="header-icon" />
          <h1 className="header-title">Crisis Support</h1>
        </div>
        
        <div className="header-actions">
          {speechRecognition && (
            <button
              className={`voice-control-btn ${isListening ? 'active' : ''}`}
              onClick={toggleVoiceControl}
              aria-label={isListening ? 'Stop voice control' : 'Start voice control'}
            >
              {isListening ? (
                <GentlePulse active={!prefersReducedMotion}>
                  <Volume2 size={20} />
                </GentlePulse>
              ) : (
                <Mic size={20} />
              )}
            </button>
          )}
          
          {onClose && severity !== 'critical' && (
            <button
              className="close-btn"
              onClick={onClose}
              aria-label="Close crisis support"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="crisis-flow-content">
        {renderCurrentStep()}
      </div>

      {/* Emergency Bar (always visible for critical severity) */}
      {severity === 'critical' && (
        <div className="emergency-bar">
          <GentlePulse active={!prefersReducedMotion}>
            <button className="emergency-call-btn" onClick={handleEmergencyCall}>
              <Phone size={16} />
              <span>Call 988 Now</span>
            </button>
          </GentlePulse>
        </div>
      )}

      <style jsx>{`
        .crisis-flow-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          z-index: 10000;
        }

        .crisis-flow-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          color: #dc2626;
          width: 24px;
          height: 24px;
        }

        .header-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .voice-control-btn,
        .close-btn {
          padding: 8px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          color: #6b7280;
          transition: all ${DURATIONS.fast}ms ${EASINGS.easeOut};
        }

        .voice-control-btn:hover,
        .close-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .voice-control-btn.active {
          background: #fee2e2;
          color: #dc2626;
        }

        .crisis-flow-content {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(90vh - 140px);
        }

        /* Assessment Styles */
        .assessment-question {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin: 24px 0;
          text-align: center;
        }

        .assessment-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 32px 0;
        }

        .assessment-option {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          overflow: hidden;
          transition: all ${DURATIONS.base}ms ${EASINGS.therapeutic};
        }

        .assessment-option:hover {
          border-color: #059ae9;
          background: #f9fafb;
        }

        .assessment-option.severity-critical {
          border-color: #fca5a5;
        }

        .assessment-option.severity-critical:hover {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .option-arrow {
          width: 20px;
          height: 20px;
          color: #9ca3af;
        }

        .assessment-footer {
          text-align: center;
          margin-top: 24px;
        }

        .skip-assessment {
          color: #6b7280;
          background: none;
          border: none;
          font-size: 14px;
          text-decoration: underline;
          cursor: pointer;
        }

        /* Resources Styles */
        .resources-title {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .resources-subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 24px 0;
        }

        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .resource-card {
          position: relative;
          padding: 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          overflow: hidden;
          transition: all ${DURATIONS.base}ms ${EASINGS.therapeutic};
        }

        .resource-card:hover {
          border-color: currentColor;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .resource-card.priority {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .priority-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          background: #dc2626;
          color: white;
          font-size: 11px;
          font-weight: 600;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .resource-icon {
          margin-bottom: 12px;
        }

        .resource-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .resource-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .connecting-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: white;
          font-size: 14px;
        }

        /* Safety Plan Styles */
        .safety-title {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 24px 0;
        }

        .safety-strategies {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .safety-strategy {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .strategy-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 8px;
          color: #059ae9;
        }

        .strategy-content h3 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .strategy-content p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .safety-action-btn {
          width: 100%;
          padding: 12px;
          background: #059ae9;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all ${DURATIONS.base}ms ${EASINGS.therapeutic};
        }

        .safety-action-btn:hover {
          background: #0077c7;
        }

        /* Emergency Bar */
        .emergency-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          background: #dc2626;
          display: flex;
          justify-content: center;
        }

        .emergency-call-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: white;
          color: #dc2626;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Severity-based styles */
        .severity-critical .crisis-flow-header {
          background: #fef2f2;
          border-bottom-color: #fca5a5;
        }

        .severity-critical .header-icon {
          animation: ${prefersReducedMotion ? 'none' : `gentlePulse ${DURATIONS.therapeutic}ms ${EASINGS.therapeutic} infinite`};
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .crisis-flow-container {
            width: 100%;
            height: 100%;
            max-width: none;
            max-height: none;
            border-radius: 0;
          }

          .resources-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CrisisFlowOptimized;