import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Phone, 
  MessageSquare, 
  MapPin, 
  AlertTriangle, 
  Shield, 
  ChevronDown, 
  Mic, 
  MicOff,
  Volume2,
  Heart,
  Users,
  Clock,
  Battery,
  Wifi,
  WifiOff
} from 'lucide-react';

interface MobileCrisisButtonEnhancedProps {
  variant?: 'fixed' | 'inline';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
  onCrisisCall?: () => void;
  onTextCrisis?: () => void;
  onEmergencyServices?: () => void;
  showLocationServices?: boolean;
  enableVoiceActivation?: boolean;
  className?: string;
  alwaysExpanded?: boolean;
  highContrastMode?: boolean;
}

interface CrisisResource {
  name: string;
  description: string;
  contact: string;
  type: 'call' | 'text' | 'chat';
  available: string;
  icon: React.ComponentType<any>;
  ariaLabel: string;
  color: string;
  vibrationPattern?: number[];
}

// Speech recognition setup
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const MobileCrisisButtonEnhanced: React.FC<MobileCrisisButtonEnhancedProps> = ({
  variant = 'fixed',
  position = 'bottom-right',
  size = 'lg', // Default to large for better accessibility
  onCrisisCall,
  onTextCrisis,
  onEmergencyServices,
  showLocationServices = true,
  enableVoiceActivation = true,
  className = '',
  alwaysExpanded = false,
  highContrastMode = false
}) => {
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const expandedMenuRef = useRef<HTMLDivElement>(null);

  // Enhanced crisis resources with WCAG AAA compliance
  const crisisResources: CrisisResource[] = [
    {
      name: '988 Lifeline',
      description: 'Suicide & Crisis Lifeline',
      contact: '988',
      type: 'call',
      available: '24/7',
      icon: Phone,
      ariaLabel: 'Call 988 Suicide and Crisis Lifeline, available 24/7',
      color: 'blue',
      vibrationPattern: [200, 100, 200]
    },
    {
      name: 'Crisis Text',
      description: 'Text HOME to connect',
      contact: '741741',
      type: 'text',
      available: '24/7',
      icon: MessageSquare,
      ariaLabel: 'Text HOME to 741741 for Crisis Text Line, available 24/7',
      color: 'green',
      vibrationPattern: [100, 50, 100, 50, 100]
    },
    {
      name: 'Emergency',
      description: 'Call 911 for immediate danger',
      contact: '911',
      type: 'call',
      available: '24/7',
      icon: AlertTriangle,
      ariaLabel: 'Call 911 for emergency services, available 24/7',
      color: 'red',
      vibrationPattern: [500, 200, 500]
    }
  ];

  // Offline crisis resources
  const offlineResources = [
    'Box Breathing: Inhale 4 seconds, Hold 4 seconds, Exhale 4 seconds, Hold 4 seconds',
    'Grounding: Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste',
    'Crisis Contacts: 988 (Lifeline), 741741 (Text HOME), 911 (Emergency)',
    'Safe Place: Go to a safe, comfortable location',
    'Reach Out: Contact a trusted friend or family member'
  ];

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor battery level for emergency situations
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level);
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level);
        });
      });
    }
  }, []);

  // Initialize voice recognition
  useEffect(() => {
    if (enableVoiceActivation && SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase();
        setVoiceCommand(transcript);

        // Crisis keywords detection
        const crisisKeywords = [
          'help', 'crisis', 'emergency', 'suicide', 'hurt', 'scared',
          'panic', 'attack', 'danger', 'unsafe', 'depressed', 'anxious'
        ];

        if (crisisKeywords.some(keyword => transcript.includes(keyword))) {
          setIsExpanded(true);
          speakResponse('I heard you need help. Crisis resources are now available.');
          vibrateDevice([500, 200, 500]);
        }

        // Direct commands
        if (transcript.includes('call 988')) {
          handleCrisisCall('988', '988 Lifeline');
        } else if (transcript.includes('call 911')) {
          handleCrisisCall('911', 'Emergency');
        } else if (transcript.includes('text crisis')) {
          handleCrisisCall('741741', 'Crisis Text');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [enableVoiceActivation]);

  // Text-to-speech for accessibility
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Haptic feedback
  const vibrateDevice = (pattern: number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Toggle voice listening
  const toggleVoiceListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      speakResponse('Voice activation enabled. Say help or crisis to activate support.');
    }
  };

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + H for help
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        setIsExpanded(!isExpanded);
        buttonRef.current?.focus();
      }
      
      // Escape to close
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Focus management for accessibility
  useEffect(() => {
    if (isExpanded && expandedMenuRef.current) {
      const firstButton = expandedMenuRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, [isExpanded]);

  const handleMainButtonClick = () => {
    if (alwaysExpanded) return;
    setIsExpanded(!isExpanded);
    vibrateDevice([50]);
    
    if (!isExpanded) {
      speakResponse('Crisis support menu opened. Help is available.');
    }
  };

  const handleCrisisCall = async (number: string, resourceName: string) => {
    try {
      // Vibrate for feedback
      const resource = crisisResources.find(r => r.name === resourceName);
      if (resource?.vibrationPattern) {
        vibrateDevice(resource.vibrationPattern);
      }

      // Track analytics
      console.log(`Crisis call initiated: ${resourceName}`);
      
      // Announce action
      speakResponse(`Connecting you to ${resourceName}`);
      
      // Trigger custom callback
      if (number === '988' && onCrisisCall) {
        onCrisisCall();
      } else if (number === '741741' && onTextCrisis) {
        onTextCrisis();
      } else if (number === '911' && onEmergencyServices) {
        onEmergencyServices();
      }

      // Initiate call/text
      if (number === '741741') {
        window.location.href = `sms:${number}?body=${encodeURIComponent('HOME')}`;
      } else {
        window.location.href = `tel:${number}`;
      }
    } catch (error) {
      console.error('Failed to initiate crisis contact:', error);
      speakResponse('Unable to connect. Please try again or use another method.');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      speakResponse('Location services are not available on this device');
      return;
    }

    setIsGettingLocation(true);
    speakResponse('Getting your location for emergency services');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGettingLocation(false);
        setShowLocationPrompt(true);
        speakResponse('Location found. Ready to share with emergency services.');
      },
      (error) => {
        console.error('Location error:', error);
        setIsGettingLocation(false);
        speakResponse('Unable to get location. Please check your settings.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const shareLocationWithEmergency = () => {
    if (!userLocation) return;

    const locationText = `Emergency: I need help. My location is https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
    
    // For SMS
    window.location.href = `sms:911?body=${encodeURIComponent(locationText)}`;
    setShowLocationPrompt(false);
    speakResponse('Location shared with emergency services');
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-center':
        return 'bottom-6 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'w-14 h-14', // 56px - Still above WCAG minimum
      md: 'w-16 h-16', // 64px
      lg: 'w-20 h-20'  // 80px - Recommended for crisis
    };
    return sizes[size];
  };

  // Inline variant for embedded crisis support
  if (variant === 'inline') {
    return (
      <div className={`crisis-button-inline space-y-3 ${className}`}>
        <div className={`
          ${highContrastMode ? 'bg-white border-4 border-black' : 'bg-red-50 border-2 border-red-300'}
          rounded-xl p-6 shadow-lg
        `}>
          {/* Header with status indicators */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${highContrastMode ? 'bg-black text-white' : 'bg-red-600 text-white'}
              `}>
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${highContrastMode ? 'text-black' : 'text-red-900'}`}>
                  Crisis Support
                </h3>
                <p className={`text-sm ${highContrastMode ? 'text-black' : 'text-red-700'}`}>
                  Immediate help available 24/7
                </p>
              </div>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center gap-2">
              {isOffline ? (
                <WifiOff className="w-5 h-5 text-gray-500" aria-label="Offline" />
              ) : (
                <Wifi className="w-5 h-5 text-green-500" aria-label="Online" />
              )}
              {batteryLevel !== null && batteryLevel < 0.2 && (
                <Battery className="w-5 h-5 text-red-500" aria-label={`Battery ${Math.round(batteryLevel * 100)}%`} />
              )}
            </div>
          </div>

          {/* Voice activation button */}
          {enableVoiceActivation && SpeechRecognition && (
            <button
              onClick={toggleVoiceListening}
              className={`
                w-full mb-4 p-4 rounded-lg flex items-center justify-center gap-3
                transition-all duration-200 min-h-[60px]
                ${isListening 
                  ? 'bg-blue-500 text-white animate-pulse' 
                  : highContrastMode 
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }
              `}
              aria-label={isListening ? 'Voice activation listening' : 'Activate voice commands'}
            >
              {isListening ? (
                <>
                  <Mic className="w-6 h-6" />
                  <span className="font-medium">Listening... Say "help" or "crisis"</span>
                </>
              ) : (
                <>
                  <MicOff className="w-6 h-6" />
                  <span className="font-medium">Tap to activate voice commands</span>
                </>
              )}
            </button>
          )}

          {/* Crisis resources grid */}
          <div className="grid gap-3">
            {crisisResources.map((resource) => {
              const IconComponent = resource.icon;
              const bgColors = {
                blue: highContrastMode ? 'bg-black' : 'bg-blue-100',
                green: highContrastMode ? 'bg-black' : 'bg-green-100',
                red: highContrastMode ? 'bg-black' : 'bg-red-100'
              };
              const textColors = {
                blue: highContrastMode ? 'text-white' : 'text-blue-600',
                green: highContrastMode ? 'text-white' : 'text-green-600',
                red: highContrastMode ? 'text-white' : 'text-red-600'
              };

              return (
                <button
                  key={resource.name}
                  onClick={() => handleCrisisCall(resource.contact, resource.name)}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg
                    transition-all duration-200 text-left min-h-[72px]
                    ${highContrastMode 
                      ? 'bg-white border-4 border-black hover:bg-gray-100' 
                      : 'bg-white border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
                    }
                    transform active:scale-98 focus:outline-none focus:ring-4 focus:ring-blue-500
                  `}
                  aria-label={resource.ariaLabel}
                >
                  <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
                    ${bgColors[resource.color as keyof typeof bgColors]}
                  `}>
                    <IconComponent className={`w-7 h-7 ${textColors[resource.color as keyof typeof textColors]}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-lg ${highContrastMode ? 'text-black' : 'text-gray-900'}`}>
                      {resource.name}
                    </div>
                    <div className={`text-sm ${highContrastMode ? 'text-black' : 'text-gray-700'}`}>
                      {resource.description}
                    </div>
                    <div className={`text-xs mt-1 ${highContrastMode ? 'text-black' : 'text-gray-600'}`}>
                      {resource.available}
                    </div>
                  </div>
                  <div className={`
                    text-2xl font-bold
                    ${textColors[resource.color as keyof typeof textColors]}
                  `}>
                    {resource.contact}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Location services */}
          {showLocationServices && (
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className={`
                w-full mt-4 p-4 rounded-lg flex items-center justify-center gap-3
                transition-all duration-200 disabled:opacity-50 min-h-[60px]
                ${highContrastMode
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-purple-100 border-2 border-purple-200 hover:bg-purple-200'
                }
              `}
              aria-label="Share your location with emergency services"
            >
              {isGettingLocation ? (
                <Clock className="w-6 h-6 animate-spin" />
              ) : (
                <MapPin className="w-6 h-6" />
              )}
              <span className="font-medium">
                {isGettingLocation ? 'Getting Location...' : 'Share My Location'}
              </span>
            </button>
          )}

          {/* Offline resources */}
          {isOffline && (
            <div className={`
              mt-4 p-4 rounded-lg
              ${highContrastMode ? 'bg-gray-100 border-2 border-black' : 'bg-yellow-50 border-2 border-yellow-200'}
            `}>
              <h4 className="font-semibold mb-2">Offline Coping Strategies:</h4>
              <ul className="space-y-2 text-sm">
                {offlineResources.map((resource, index) => (
                  <li key={index} className="flex items-start">
                    <Heart className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{resource}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fixed floating button variant
  return (
    <>
      <div 
        className={`fixed z-50 ${getPositionClasses()} ${className}`}
        role="region"
        aria-label="Crisis support button"
      >
        {/* Expanded Menu */}
        {isExpanded && (
          <div 
            ref={expandedMenuRef}
            className="absolute bottom-full right-0 mb-4 w-96 max-w-[90vw]"
            role="dialog"
            aria-label="Crisis support menu"
          >
            <div className={`
              rounded-xl shadow-2xl overflow-hidden
              ${highContrastMode ? 'border-4 border-black' : 'border-2 border-gray-200'}
            `}>
              {/* Header */}
              <div className={`
                p-5 text-white
                ${highContrastMode ? 'bg-black' : 'bg-gradient-to-r from-red-600 to-red-700'}
              `}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8" />
                    <div>
                      <h3 className="font-bold text-lg">Crisis Support</h3>
                      <p className="text-sm opacity-90">Help is available 24/7</p>
                    </div>
                  </div>
                  {/* Voice indicator */}
                  {isListening && (
                    <div className="flex items-center gap-2 animate-pulse">
                      <Volume2 className="w-5 h-5" />
                      <span className="text-xs">Listening</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resources */}
              <div className={`p-3 ${highContrastMode ? 'bg-white' : 'bg-gray-50'}`}>
                {crisisResources.map((resource, index) => {
                  const IconComponent = resource.icon;
                  const colors = ['blue', 'green', 'red'];
                  const color = colors[index];
                  
                  return (
                    <button
                      key={resource.name}
                      onClick={() => handleCrisisCall(resource.contact, resource.name)}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-lg mb-2
                        transition-all duration-200 text-left min-h-[72px]
                        ${highContrastMode
                          ? 'bg-white border-2 border-black hover:bg-gray-100'
                          : 'bg-white hover:bg-gray-50 hover:shadow-md'
                        }
                        transform active:scale-98
                      `}
                      aria-label={resource.ariaLabel}
                    >
                      <div className={`
                        w-14 h-14 rounded-full flex items-center justify-center
                        ${highContrastMode ? 'bg-black text-white' : `bg-${color}-100`}
                      `}>
                        <IconComponent className={`w-7 h-7 ${highContrastMode ? '' : `text-${color}-600`}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{resource.name}</div>
                        <div className="text-sm text-gray-600">{resource.description}</div>
                        <div className="text-xs text-gray-500 mt-1">{resource.available}</div>
                      </div>
                      <div className={`
                        text-xl font-bold
                        ${highContrastMode ? 'text-black' : `text-${color}-600`}
                      `}>
                        {resource.contact}
                      </div>
                    </button>
                  );
                })}

                {/* Voice activation toggle */}
                {enableVoiceActivation && SpeechRecognition && (
                  <button
                    onClick={toggleVoiceListening}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-lg mb-2
                      transition-all duration-200 min-h-[72px]
                      ${isListening
                        ? 'bg-blue-500 text-white animate-pulse'
                        : highContrastMode
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }
                    `}
                    aria-label={isListening ? 'Stop voice commands' : 'Start voice commands'}
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white bg-opacity-20">
                      {isListening ? (
                        <Mic className="w-7 h-7" />
                      ) : (
                        <MicOff className="w-7 h-7" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold">
                        {isListening ? 'Listening...' : 'Voice Commands'}
                      </div>
                      <div className="text-sm opacity-90">
                        {isListening ? 'Say "help" or a command' : 'Tap to activate'}
                      </div>
                    </div>
                  </button>
                )}

                {/* Location Services */}
                {showLocationServices && (
                  <button
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-lg
                      transition-all duration-200 disabled:opacity-50 min-h-[72px]
                      ${highContrastMode
                        ? 'bg-white border-2 border-black hover:bg-gray-100'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }
                    `}
                    aria-label="Share your location with emergency services"
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-purple-200">
                      {isGettingLocation ? (
                        <Clock className="w-7 h-7 text-purple-600 animate-spin" />
                      ) : (
                        <MapPin className="w-7 h-7 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-gray-900">Share Location</div>
                      <div className="text-sm text-gray-600">
                        {isGettingLocation ? 'Getting location...' : 'Send to emergency services'}
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className={`
                p-4 text-center text-sm
                ${highContrastMode ? 'bg-gray-100 text-black border-t-2 border-black' : 'bg-gray-100 text-gray-600'}
              `}>
                <Users className="w-4 h-4 inline mr-1" />
                You are not alone. Help is available.
              </div>
            </div>
          </div>
        )}

        {/* Main Crisis Button */}
        <button
          ref={buttonRef}
          onClick={handleMainButtonClick}
          className={`
            ${getSizeClasses()}
            rounded-full shadow-2xl
            flex items-center justify-center transition-all duration-200
            transform hover:scale-110 active:scale-95
            ${isExpanded 
              ? highContrastMode
                ? 'bg-black text-white ring-4 ring-white'
                : 'bg-red-700 text-white ring-4 ring-red-300'
              : highContrastMode
                ? 'bg-black text-white animate-pulse'
                : 'bg-red-600 text-white animate-pulse hover:bg-red-700'
            }
            focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2
          `}
          aria-label="Crisis support - get help now. Press Alt+H to toggle."
          aria-expanded={isExpanded}
          aria-haspopup="true"
        >
          {isExpanded ? (
            <ChevronDown className="w-8 h-8" />
          ) : (
            <Shield className="w-8 h-8" />
          )}
        </button>

        {/* Pulsing indicator when collapsed */}
        {!isExpanded && (
          <div className={`
            absolute inset-0 rounded-full animate-ping opacity-30
            ${highContrastMode ? 'bg-white' : 'bg-red-600'}
          `} />
        )}

        {/* Screen reader announcement */}
        <div className="sr-only" role="status" aria-live="polite">
          {isExpanded ? 'Crisis support menu is open' : 'Crisis support menu is closed'}
        </div>
      </div>

      {/* Location Confirmation Modal */}
      {showLocationPrompt && userLocation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-labelledby="location-modal-title"
          aria-describedby="location-modal-description"
        >
          <div className={`
            rounded-xl p-6 max-w-sm w-full
            ${highContrastMode ? 'bg-white border-4 border-black' : 'bg-white'}
          `}>
            <div className="text-center">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
                ${highContrastMode ? 'bg-black text-white' : 'bg-blue-100'}
              `}>
                <MapPin className={`w-8 h-8 ${highContrastMode ? '' : 'text-blue-600'}`} />
              </div>
              <h3 
                id="location-modal-title"
                className={`text-xl font-bold mb-2 ${highContrastMode ? 'text-black' : 'text-gray-900'}`}
              >
                Share Your Location?
              </h3>
              <p 
                id="location-modal-description"
                className={`mb-6 ${highContrastMode ? 'text-black' : 'text-gray-600'}`}
              >
                This will send your current location to emergency services to help them find you faster.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className={`
                    flex-1 px-6 py-3 rounded-lg font-medium min-h-[48px]
                    ${highContrastMode
                      ? 'border-2 border-black text-black hover:bg-gray-100'
                      : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  aria-label="Cancel location sharing"
                >
                  Cancel
                </button>
                <button
                  onClick={shareLocationWithEmergency}
                  className={`
                    flex-1 px-6 py-3 rounded-lg font-medium text-white min-h-[48px]
                    ${highContrastMode
                      ? 'bg-black hover:bg-gray-800'
                      : 'bg-red-600 hover:bg-red-700'
                    }
                  `}
                  aria-label="Confirm location sharing"
                >
                  Share Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileCrisisButtonEnhanced;