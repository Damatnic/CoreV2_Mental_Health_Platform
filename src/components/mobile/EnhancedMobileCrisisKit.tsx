import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Phone, MessageCircle, Heart, Shield, MapPin, Activity, X, AlertCircle, Mic, Volume2 } from 'lucide-react';
import '../../styles/EnhancedMobileCrisisKit.css';

interface CrisisResource {
  id: string;
  name: string;
  type: 'call' | 'text' | 'location' | 'technique' | 'voice';
  action: string;
  description: string;
  icon: React.ReactNode;
  priority: 'emergency' | 'urgent' | 'normal';
}

interface EnhancedMobileCrisisKitProps {
  onActivate?: () => void;
  onResourceUse?: (resource: CrisisResource) => void;
}

const EnhancedMobileCrisisKit: React.FC<EnhancedMobileCrisisKitProps> = ({ 
  onActivate, 
  onResourceUse 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [voiceCommandEnabled, setVoiceCommandEnabled] = useState(false);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const panicButtonRef = useRef<HTMLButtonElement>(null);

  // Enhanced crisis resources with priority levels
  const resources: CrisisResource[] = [
    {
      id: 'emergency-911',
      name: 'Emergency',
      type: 'call',
      action: 'tel:911',
      description: 'Call 911 Now',
      icon: <Shield size={24} className="icon-emergency" />,
      priority: 'emergency'
    },
    {
      id: 'crisis-988',
      name: 'Crisis Lifeline',
      type: 'call',
      action: 'tel:988',
      description: 'Call 988 for support',
      icon: <Phone size={24} className="icon-crisis" />,
      priority: 'urgent'
    },
    {
      id: 'text-support',
      name: 'Text Support',
      type: 'text',
      action: 'sms:741741?body=HOME',
      description: 'Text HOME to 741741',
      icon: <MessageCircle size={24} className="icon-text" />,
      priority: 'urgent'
    },
    {
      id: 'breathing-exercise',
      name: 'Breathe',
      type: 'technique',
      action: 'breathing',
      description: 'Guided breathing',
      icon: <Activity size={24} className="icon-breathing" />,
      priority: 'normal'
    },
    {
      id: 'grounding-technique',
      name: 'Ground',
      type: 'technique',
      action: 'grounding',
      description: '5-4-3-2-1 grounding',
      icon: <Heart size={24} className="icon-grounding" />,
      priority: 'normal'
    },
    {
      id: 'voice-help',
      name: 'Voice Help',
      type: 'voice',
      action: 'voice',
      description: 'Say "help" or "call"',
      icon: <Mic size={24} className="icon-voice" />,
      priority: 'urgent'
    }
  ];

  // Trigger haptic feedback on critical actions
  const triggerHapticFeedback = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [30],
        heavy: [50, 30, 50]
      };
      navigator.vibrate(patterns[pattern]);
    }
  }, []);

  // Handle panic mode activation
  const activatePanicMode = useCallback(() => {
    setIsPanicMode(true);
    setIsExpanded(true);
    triggerHapticFeedback('heavy');
    
    // Focus on emergency button for quick access
    setTimeout(() => {
      const emergencyBtn = document.querySelector('.crisis-resource-btn[data-priority="emergency"]');
      if (emergencyBtn instanceof HTMLElement) {
        emergencyBtn.focus();
      }
    }, 100);

    onActivate?.();
  }, [triggerHapticFeedback, onActivate]);

  // Handle resource activation
  const handleResourceClick = useCallback((resource: CrisisResource) => {
    triggerHapticFeedback('medium');
    onResourceUse?.(resource);

    switch (resource.type) {
      case 'call':
      case 'text':
        window.location.href = resource.action;
        break;
      
      case 'technique':
        if (resource.action === 'breathing') {
          startBreathingExercise();
        } else if (resource.action === 'grounding') {
          startGroundingExercise();
        }
        break;
      
      case 'voice':
        toggleVoiceCommand();
        break;
      
      case 'location':
        // Open maps for nearby crisis centers
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              window.open(`https://maps.google.com/maps?q=crisis+center+near+${latitude},${longitude}`, '_blank');
            },
            () => {
              window.open('https://maps.google.com/maps?q=crisis+center+near+me', '_blank');
            }
          );
        }
        break;
    }
  }, [triggerHapticFeedback, onResourceUse]);

  // Breathing exercise implementation
  const startBreathingExercise = useCallback(() => {
    setIsBreathingActive(true);
    setBreathCount(0);
    
    const breathingCycle = () => {
      setBreathCount(prev => {
        const next = prev + 1;
        if (next <= 8) {
          triggerHapticFeedback('light');
          breathingTimerRef.current = setTimeout(breathingCycle, 4000); // 4 seconds per breath
        } else {
          setIsBreathingActive(false);
        }
        return next;
      });
    };
    
    breathingCycle();
  }, [triggerHapticFeedback]);

  // Grounding exercise implementation
  const startGroundingExercise = useCallback(() => {
    // Open grounding modal or navigate to grounding page
    triggerHapticFeedback('light');
    alert('Starting 5-4-3-2-1 grounding exercise...\n\nName:\n5 things you can see\n4 things you can touch\n3 things you can hear\n2 things you can smell\n1 thing you can taste');
  }, [triggerHapticFeedback]);

  // Voice command toggle
  const toggleVoiceCommand = useCallback(() => {
    setVoiceCommandEnabled(prev => !prev);
    triggerHapticFeedback('light');
    
    if (!voiceCommandEnabled && 'webkitSpeechRecognition' in window) {
      // Initialize voice recognition
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        
        if (transcript.includes('help') || transcript.includes('emergency')) {
          window.location.href = 'tel:911';
        } else if (transcript.includes('crisis') || transcript.includes('suicide')) {
          window.location.href = 'tel:988';
        } else if (transcript.includes('breathe') || transcript.includes('breathing')) {
          startBreathingExercise();
        }
      };
      
      recognition.start();
    }
  }, [voiceCommandEnabled, triggerHapticFeedback, startBreathingExercise]);

  // Keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'h': // Ctrl+H for help
            activatePanicMode();
            break;
          case '9': // Ctrl+9 for 911
            window.location.href = 'tel:911';
            break;
          case '8': // Ctrl+8 for 988
            window.location.href = 'tel:988';
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activatePanicMode]);

  // Clean up breathing timer on unmount
  useEffect(() => {
    return () => {
      if (breathingTimerRef.current) {
        clearTimeout(breathingTimerRef.current);
      }
    };
  }, []);

  // Long press detection for panic activation
  useEffect(() => {
    let pressTimer: NodeJS.Timeout;
    const button = panicButtonRef.current;
    
    if (!button) return;

    const startPress = () => {
      pressTimer = setTimeout(() => {
        activatePanicMode();
      }, 1000); // 1 second long press
    };

    const cancelPress = () => {
      clearTimeout(pressTimer);
    };

    button.addEventListener('touchstart', startPress);
    button.addEventListener('touchend', cancelPress);
    button.addEventListener('touchcancel', cancelPress);
    button.addEventListener('mousedown', startPress);
    button.addEventListener('mouseup', cancelPress);
    button.addEventListener('mouseleave', cancelPress);

    return () => {
      button.removeEventListener('touchstart', startPress);
      button.removeEventListener('touchend', cancelPress);
      button.removeEventListener('touchcancel', cancelPress);
      button.removeEventListener('mousedown', startPress);
      button.removeEventListener('mouseup', cancelPress);
      button.removeEventListener('mouseleave', cancelPress);
    };
  }, [activatePanicMode]);

  return (
    <>
      {/* Floating Crisis Button - Always Visible */}
      <button
        ref={panicButtonRef}
        className={`crisis-fab ${isPanicMode ? 'panic-active' : ''} ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Crisis support (long press for panic mode)"
        aria-expanded={isExpanded}
      >
        {isPanicMode ? (
          <AlertCircle size={28} className="fab-icon panic" />
        ) : (
          <Shield size={28} className="fab-icon" />
        )}
        {!isExpanded && <span className="fab-label">Crisis</span>}
      </button>

      {/* Expanded Crisis Kit */}
      {isExpanded && (
        <div className={`crisis-kit-overlay ${isPanicMode ? 'panic-mode' : ''}`}>
          <div className="crisis-kit-container">
            {/* Header */}
            <div className="crisis-kit-header">
              <h2 className="crisis-title">
                {isPanicMode ? '🚨 Emergency Support' : 'Crisis Support'}
              </h2>
              <button
                className="crisis-close-btn"
                onClick={() => {
                  setIsExpanded(false);
                  setIsPanicMode(false);
                }}
                aria-label="Close crisis kit"
              >
                <X size={24} />
              </button>
            </div>

            {/* Quick Message */}
            {isPanicMode && (
              <div className="panic-message">
                <p>You're not alone. Help is available right now.</p>
              </div>
            )}

            {/* Breathing Indicator */}
            {isBreathingActive && (
              <div className="breathing-indicator">
                <div className="breathing-circle" />
                <p>Breathe slowly... {breathCount}/8</p>
              </div>
            )}

            {/* Crisis Resources Grid */}
            <div className="crisis-resources-grid">
              {resources
                .sort((a, b) => {
                  const priorityOrder = { emergency: 0, urgent: 1, normal: 2 };
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .map(resource => (
                  <button
                    key={resource.id}
                    className={`crisis-resource-btn priority-${resource.priority} type-${resource.type}`}
                    onClick={() => handleResourceClick(resource)}
                    data-priority={resource.priority}
                    aria-label={`${resource.name}: ${resource.description}`}
                  >
                    <div className="resource-icon">{resource.icon}</div>
                    <div className="resource-content">
                      <span className="resource-name">{resource.name}</span>
                      <span className="resource-desc">{resource.description}</span>
                    </div>
                  </button>
                ))}
            </div>

            {/* Voice Command Status */}
            {voiceCommandEnabled && (
              <div className="voice-status">
                <Volume2 size={20} className="voice-icon" />
                <span>Voice commands active. Say "help" or "crisis".</span>
              </div>
            )}

            {/* Safety Message */}
            <div className="crisis-safety-message">
              <p>💜 You matter. Your life has value. Please reach out.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedMobileCrisisKit;