import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Phone, MessageCircle, Heart, Shield, AlertCircle, 
  Mic, Volume2, MapPin, Activity, User, ChevronUp
} from 'lucide-react';
import '../../styles/OptimizedMobileCrisisAccessibility.css';

interface CrisisContact {
  id: string;
  name: string;
  number: string;
  type: 'emergency' | 'crisis' | 'support' | 'personal';
  available247: boolean;
  textEnabled: boolean;
  priority: number;
}

interface AccessibilityFeatures {
  largeButtons: boolean;
  voiceActivation: boolean;
  hapticFeedback: boolean;
  screenReaderOptimized: boolean;
  highContrast: boolean;
  simplifiedUI: boolean;
}

interface CrisisState {
  severity: 'low' | 'medium' | 'high' | 'emergency';
  startTime: number;
  accessAttempts: number;
  methodsUsed: string[];
}

const OptimizedMobileCrisisAccessibility: React.FC = () => {
  // Core state
  const [isActive, setIsActive] = useState(false);
  const [crisisState, setCrisisState] = useState<CrisisState>({
    severity: 'low',
    startTime: 0,
    accessAttempts: 0,
    methodsUsed: []
  });
  
  // Accessibility features state
  const [features, setFeatures] = useState<AccessibilityFeatures>({
    largeButtons: false,
    voiceActivation: false,
    hapticFeedback: true,
    screenReaderOptimized: false,
    highContrast: false,
    simplifiedUI: false
  });

  // UI state
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const emergencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const panicDetectionRef = useRef<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Crisis contacts with accessibility metadata
  const contacts: CrisisContact[] = [
    {
      id: '911',
      name: 'Emergency Services',
      number: '911',
      type: 'emergency',
      available247: true,
      textEnabled: true,
      priority: 1
    },
    {
      id: '988',
      name: 'Crisis Lifeline',
      number: '988',
      type: 'crisis',
      available247: true,
      textEnabled: false,
      priority: 2
    },
    {
      id: '741741',
      name: 'Crisis Text Line',
      number: '741741',
      type: 'support',
      available247: true,
      textEnabled: true,
      priority: 3
    }
  ];

  // Load accessibility preferences
  useEffect(() => {
    const savedFeatures = localStorage.getItem('crisis-accessibility-features');
    if (savedFeatures) {
      setFeatures(JSON.parse(savedFeatures));
    }

    // Check system accessibility settings
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFeatures(prev => ({ ...prev, simplifiedUI: true }));
    }
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      setFeatures(prev => ({ ...prev, highContrast: true }));
    }
  }, []);

  // Haptic feedback with pattern support
  const triggerHaptic = useCallback((pattern: 'light' | 'medium' | 'heavy' | 'sos' = 'medium') => {
    if (!features.hapticFeedback || !('vibrate' in navigator)) return;
    
    const patterns = {
      light: [20],
      medium: [40],
      heavy: [100],
      sos: [100, 30, 100, 30, 100, 50, 300, 50, 300, 50, 300, 50, 100, 30, 100, 30, 100] // SOS in morse
    };
    
    navigator.vibrate(patterns[pattern]);
  }, [features.hapticFeedback]);

  // Screen reader announcement with priority levels
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite', vibrate = false) => {
    // Create or update ARIA live region
    let liveRegion = document.getElementById('crisis-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'crisis-live-region';
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Use Web Speech API for immediate announcement
    if ('speechSynthesis' in window) {
      if (priority === 'assertive') {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = priority === 'assertive' ? 1.2 : 1.0;
      utterance.pitch = priority === 'assertive' ? 1.1 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
    
    if (vibrate) {
      triggerHaptic(priority === 'assertive' ? 'heavy' : 'light');
    }
    
    // Clear after delay
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 5000);
  }, [triggerHaptic]);

  // Initialize voice activation
  const initVoiceActivation = useCallback(() => {
    if (!features.voiceActivation || !('webkitSpeechRecognition' in window)) {
      return;
    }
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ')
        .toLowerCase();
      
      // Crisis trigger words with immediate action
      const emergencyWords = ['help', 'emergency', 'crisis', 'suicide', 'hurt', 'panic', 'scared'];
      const foundEmergency = emergencyWords.some(word => transcript.includes(word));
      
      if (foundEmergency) {
        setCrisisState(prev => ({
          ...prev,
          severity: 'emergency',
          methodsUsed: [...prev.methodsUsed, 'voice']
        }));
        
        triggerHaptic('sos');
        announce('Emergency support activated. Connecting to crisis line.', 'assertive', true);
        
        // Auto-dial after 3 seconds unless cancelled
        emergencyTimeoutRef.current = setTimeout(() => {
          window.location.href = 'tel:988';
        }, 3000);
      }
      
      // Specific commands
      if (transcript.includes('call 911')) {
        window.location.href = 'tel:911';
      } else if (transcript.includes('text help')) {
        window.location.href = 'sms:741741?body=HOME';
      } else if (transcript.includes('breathe') || transcript.includes('breathing')) {
        startBreathingExercise();
      } else if (transcript.includes('cancel') || transcript.includes('stop')) {
        if (emergencyTimeoutRef.current) {
          clearTimeout(emergencyTimeoutRef.current);
          announce('Emergency call cancelled', 'polite');
        }
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      if (event.error === 'no-speech') {
        announce('No speech detected. Try speaking louder or clearer.', 'polite');
      }
    };
    
    recognition.onend = () => {
      // Restart if still active
      if (features.voiceActivation && isActive) {
        recognition.start();
      }
    };
    
    try {
      recognition.start();
      recognitionRef.current = recognition;
      announce('Voice commands activated. Say "help" or "emergency" for immediate support.', 'polite', true);
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      announce('Voice commands unavailable. Use buttons below.', 'polite');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [features.voiceActivation, isActive, announce, triggerHaptic]);

  // Panic gesture detection (rapid taps)
  const detectPanicGesture = useCallback(() => {
    const now = Date.now();
    panicDetectionRef.current.push(now);
    
    // Keep only taps within last 2 seconds
    panicDetectionRef.current = panicDetectionRef.current.filter(
      time => now - time < 2000
    );
    
    // If 5+ taps in 2 seconds, trigger emergency
    if (panicDetectionRef.current.length >= 5) {
      setCrisisState(prev => ({
        ...prev,
        severity: 'emergency',
        methodsUsed: [...prev.methodsUsed, 'panic-gesture']
      }));
      
      triggerHaptic('sos');
      announce('Panic gesture detected. Emergency support activated.', 'assertive', true);
      setIsActive(true);
      setShowQuickAccess(true);
      
      // Reset detection
      panicDetectionRef.current = [];
    }
  }, [announce, triggerHaptic]);

  // Breathing exercise with haptic guidance
  const startBreathingExercise = useCallback(() => {
    setBreathingActive(true);
    setActiveMethod('breathing');
    announce('Starting breathing exercise. Follow the haptic vibrations.', 'polite', true);
    
    let phase: 'inhale' | 'hold' | 'exhale' = 'inhale';
    let count = 0;
    
    const breathingInterval = setInterval(() => {
      switch (phase) {
        case 'inhale':
          setBreathPhase('inhale');
          triggerHaptic('light');
          announce('Breathe in slowly', 'polite');
          phase = 'hold';
          break;
        case 'hold':
          setBreathPhase('hold');
          announce('Hold', 'polite');
          phase = 'exhale';
          break;
        case 'exhale':
          setBreathPhase('exhale');
          triggerHaptic('light');
          announce('Breathe out slowly', 'polite');
          phase = 'inhale';
          count++;
          break;
      }
      
      if (count >= 5) {
        clearInterval(breathingInterval);
        setBreathingActive(false);
        announce('Breathing exercise complete. How are you feeling?', 'polite', true);
      }
    }, 4000);
    
    return () => clearInterval(breathingInterval);
  }, [announce, triggerHaptic]);

  // Handle contact selection with accessibility
  const handleContactSelect = useCallback((contact: CrisisContact) => {
    setCrisisState(prev => ({
      ...prev,
      accessAttempts: prev.accessAttempts + 1,
      methodsUsed: [...prev.methodsUsed, `contact-${contact.id}`]
    }));
    
    triggerHaptic('medium');
    announce(`Connecting to ${contact.name}`, 'assertive', true);
    
    if (contact.textEnabled && activeMethod === 'text') {
      const message = contact.id === '741741' ? 'HOME' : 'HELP';
      window.location.href = `sms:${contact.number}?body=${message}`;
    } else {
      window.location.href = `tel:${contact.number}`;
    }
  }, [activeMethod, announce, triggerHaptic]);

  // Initialize voice commands when activated
  useEffect(() => {
    if (isActive && features.voiceActivation) {
      const cleanup = initVoiceActivation();
      return cleanup;
    }
  }, [isActive, features.voiceActivation, initVoiceActivation]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isActive) return;
      
      // Emergency hotkeys
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'h': // Help
            e.preventDefault();
            setShowQuickAccess(true);
            announce('Quick help menu opened', 'polite');
            break;
          case '9': // 911
            e.preventDefault();
            if (e.shiftKey) {
              window.location.href = 'tel:911';
            } else {
              window.location.href = 'tel:988';
            }
            break;
          case 't': // Text
            e.preventDefault();
            window.location.href = 'sms:741741?body=HOME';
            break;
          case 'b': // Breathing
            e.preventDefault();
            startBreathingExercise();
            break;
        }
      }
      
      // Tab navigation enhancement
      if (e.key === 'Tab' && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll(
          'button, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusables.length > 0 && !containerRef.current.contains(document.activeElement)) {
          e.preventDefault();
          (focusables[0] as HTMLElement).focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, announce, startBreathingExercise]);

  // Automatic severity escalation based on time
  useEffect(() => {
    if (!isActive) return;
    
    const escalationTimer = setInterval(() => {
      const elapsed = Date.now() - crisisState.startTime;
      
      if (elapsed > 300000 && crisisState.severity === 'low') { // 5 minutes
        setCrisisState(prev => ({ ...prev, severity: 'medium' }));
        announce('Do you need additional support? Crisis line available.', 'polite', true);
      } else if (elapsed > 600000 && crisisState.severity === 'medium') { // 10 minutes
        setCrisisState(prev => ({ ...prev, severity: 'high' }));
        announce('You have been here a while. Would you like to speak with someone?', 'assertive', true);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(escalationTimer);
  }, [isActive, crisisState.startTime, crisisState.severity, announce]);

  const renderMainButton = () => (
    <button
      className={`crisis-main-button ${isActive ? 'active' : ''} ${features.largeButtons ? 'large' : ''}`}
      onClick={() => {
        setIsActive(!isActive);
        if (!isActive) {
          setCrisisState({
            severity: 'low',
            startTime: Date.now(),
            accessAttempts: 0,
            methodsUsed: []
          });
          triggerHaptic('medium');
          announce('Crisis support activated. Help is available.', 'assertive', true);
        }
      }}
      onTouchStart={detectPanicGesture}
      aria-label={isActive ? 'Crisis support active. Tap to close.' : 'Activate crisis support. Tap 5 times quickly for emergency.'}
      aria-expanded={isActive}
      aria-describedby="crisis-help-text"
    >
      <Shield size={features.largeButtons ? 32 : 24} />
      <span className="button-label">Crisis Help</span>
    </button>
  );

  const renderQuickAccess = () => (
    <div 
      className={`crisis-quick-access ${showQuickAccess ? 'visible' : ''} ${features.highContrast ? 'high-contrast' : ''}`}
      role="dialog"
      aria-label="Crisis support options"
      aria-modal="true"
    >
      <div className="quick-access-header">
        <h2 id="crisis-help-text">How can we help?</h2>
        <button
          className="close-button"
          onClick={() => setShowQuickAccess(false)}
          aria-label="Close quick access menu"
        >
          ×
        </button>
      </div>

      {/* Emergency Banner for high severity */}
      {crisisState.severity === 'emergency' && (
        <div className="emergency-banner" role="alert">
          <AlertCircle size={20} />
          <span>Emergency support is available now</span>
        </div>
      )}

      {/* Contact Methods */}
      <div className="contact-methods" role="group" aria-label="Contact methods">
        <button
          className={`method-button ${activeMethod === 'call' ? 'active' : ''}`}
          onClick={() => {
            setActiveMethod('call');
            triggerHaptic('light');
            announce('Call method selected. Choose a contact below.', 'polite');
          }}
          aria-pressed={activeMethod === 'call'}
        >
          <Phone size={20} />
          <span>Call</span>
        </button>
        
        <button
          className={`method-button ${activeMethod === 'text' ? 'active' : ''}`}
          onClick={() => {
            setActiveMethod('text');
            triggerHaptic('light');
            announce('Text method selected. Choose a contact below.', 'polite');
          }}
          aria-pressed={activeMethod === 'text'}
        >
          <MessageCircle size={20} />
          <span>Text</span>
        </button>
        
        <button
          className={`method-button ${activeMethod === 'breathing' ? 'active' : ''}`}
          onClick={startBreathingExercise}
          aria-pressed={breathingActive}
        >
          <Activity size={20} />
          <span>Breathe</span>
        </button>
      </div>

      {/* Contact List */}
      <div className="contact-list" role="list" aria-label="Crisis contacts">
        {contacts
          .filter(c => !activeMethod || (activeMethod === 'text' ? c.textEnabled : true))
          .sort((a, b) => a.priority - b.priority)
          .map(contact => (
            <button
              key={contact.id}
              className={`contact-item priority-${contact.type}`}
              onClick={() => handleContactSelect(contact)}
              aria-label={`${contact.name}, ${contact.type} contact, ${contact.available247 ? '24/7 available' : 'limited hours'}`}
            >
              <div className="contact-icon">
                {contact.type === 'emergency' ? <Shield size={24} /> : <Phone size={24} />}
              </div>
              <div className="contact-info">
                <span className="contact-name">{contact.name}</span>
                <span className="contact-number">{contact.number}</span>
                {contact.available247 && <span className="badge-247">24/7</span>}
              </div>
              <ChevronUp className="contact-arrow" />
            </button>
          ))}
      </div>

      {/* Breathing Exercise Overlay */}
      {breathingActive && (
        <div className="breathing-overlay" role="application" aria-label="Breathing exercise">
          <div className={`breathing-circle ${breathPhase}`} />
          <p className="breathing-instruction">
            {breathPhase === 'inhale' ? 'Breathe In' : 
             breathPhase === 'hold' ? 'Hold' : 'Breathe Out'}
          </p>
          <button
            className="stop-breathing"
            onClick={() => {
              setBreathingActive(false);
              announce('Breathing exercise stopped', 'polite');
            }}
          >
            Stop Exercise
          </button>
        </div>
      )}

      {/* Voice Command Status */}
      {features.voiceActivation && (
        <div className="voice-status" role="status">
          <Mic size={16} className="voice-icon" />
          <span>Voice commands active. Say "help" or "emergency".</span>
        </div>
      )}

      {/* Accessibility Quick Settings */}
      <div className="accessibility-quick-settings">
        <button
          onClick={() => {
            setFeatures(prev => ({ ...prev, largeButtons: !prev.largeButtons }));
            announce(`Large buttons ${features.largeButtons ? 'disabled' : 'enabled'}`, 'polite');
          }}
          aria-pressed={features.largeButtons}
        >
          Large Buttons
        </button>
        
        <button
          onClick={() => {
            setFeatures(prev => ({ ...prev, voiceActivation: !prev.voiceActivation }));
            announce(`Voice commands ${features.voiceActivation ? 'disabled' : 'enabled'}`, 'polite');
          }}
          aria-pressed={features.voiceActivation}
        >
          Voice Control
        </button>
        
        <button
          onClick={() => {
            setFeatures(prev => ({ ...prev, highContrast: !prev.highContrast }));
            announce(`High contrast ${features.highContrast ? 'disabled' : 'enabled'}`, 'polite');
          }}
          aria-pressed={features.highContrast}
        >
          High Contrast
        </button>
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`optimized-crisis-accessibility ${features.simplifiedUI ? 'simplified' : ''}`}
      data-severity={crisisState.severity}
    >
      {renderMainButton()}
      {isActive && renderQuickAccess()}
      
      {/* Keyboard shortcut hints */}
      <div className="sr-only" aria-live="polite">
        Press Ctrl+H for help menu, Ctrl+9 for crisis line, Ctrl+T for text support, Ctrl+B for breathing exercise
      </div>
    </div>
  );
};

export default OptimizedMobileCrisisAccessibility;