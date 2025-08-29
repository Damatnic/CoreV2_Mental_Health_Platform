import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Phone, MessageCircle, Shield, MapPin, Heart, Clock, User } from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  available24h?: boolean;
}

interface CrisisResource {
  id: string;
  name: string;
  phone: string;
  description: string;
  available24h: boolean;
  type: 'hotline' | 'text' | 'chat' | 'local';
}

interface PanicButtonConfig {
  countdown?: number;
  requireConfirmation?: boolean;
  autoLocation?: boolean;
  emergencyContacts?: EmergencyContact[];
  crisisResources?: CrisisResource[];
  customMessage?: string;
}

interface EnhancedPanicButtonProps {
  config?: PanicButtonConfig;
  onActivate?: (activationType: 'immediate' | 'countdown' | 'false_alarm') => void;
  onEmergencyCall?: (contact: EmergencyContact) => void;
  onResourceAccess?: (resource: CrisisResource) => void;
  onLocationShare?: (location: GeolocationPosition) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'button' | 'floating' | 'embedded';
  className?: string;
}

const DEFAULT_CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'nspl',
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    description: '24/7 suicide prevention and crisis support',
    available24h: true,
    type: 'hotline'
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    phone: '741741',
    description: 'Text HOME to 741741 for crisis support',
    available24h: true,
    type: 'text'
  },
  {
    id: 'emergency',
    name: 'Emergency Services',
    phone: '911',
    description: 'Immediate emergency response',
    available24h: true,
    type: 'hotline'
  }
];

export const EnhancedPanicButton: React.FC<EnhancedPanicButtonProps> = ({
  config = {},
  onActivate,
  onEmergencyCall,
  onResourceAccess,
  onLocationShare,
  disabled = false,
  size = 'large',
  variant = 'button',
  className = ''
}) => {
  const [isActivated, setIsActivated] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [lastActivation, setLastActivation] = useState<Date | null>(null);

  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    countdown: countdownSeconds = 5,
    requireConfirmation = true,
    autoLocation = true,
    emergencyContacts = [],
    crisisResources = DEFAULT_CRISIS_RESOURCES,
    customMessage = "I'm in crisis and need immediate support."
  } = config;

  // Size configurations
  const sizeConfig = {
    small: {
      button: 'w-12 h-12 text-sm',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    medium: {
      button: 'w-16 h-16 text-base',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    large: {
      button: 'w-24 h-24 text-lg',
      icon: 'w-8 h-8',
      text: 'text-base'
    }
  };

  const currentSize = sizeConfig[size];

  // Get location if needed
  useEffect(() => {
    if (autoLocation && !location && !isGettingLocation) {
      setIsGettingLocation(true);
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setLocation(pos);
          setIsGettingLocation(false);
          onLocationShare?.(pos);
        },
        (error) => {
          console.warn('Location access denied:', error);
          setIsGettingLocation(false);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    }
  }, [autoLocation, location, isGettingLocation, onLocationShare]);

  // Countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Countdown completed - activate crisis mode
      handleCrisisActivation('countdown');
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);

  const handlePanicButtonClick = () => {
    if (disabled) return;

    if (requireConfirmation && !isActivated) {
      // Start confirmation process
      setIsActivated(true);
      setCountdown(countdownSeconds);
      setLastActivation(new Date());
      
      // Focus button for accessibility
      buttonRef.current?.focus();
    } else {
      // Immediate activation
      handleCrisisActivation('immediate');
    }
  };

  const handleCrisisActivation = (type: 'immediate' | 'countdown' | 'false_alarm') => {
    setIsActivated(false);
    setCountdown(null);
    
    if (type !== 'false_alarm') {
      // Show resources and contacts
      setShowResources(true);
      setShowContacts(emergencyContacts.length > 0);
    }
    
    onActivate?.(type);
    
    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const handleCancelCountdown = () => {
    setCountdown(null);
    setIsActivated(false);
    handleCrisisActivation('false_alarm');
  };

  const handleEmergencyContact = (contact: EmergencyContact) => {
    onEmergencyCall?.(contact);
    
    // Attempt to initiate call
    try {
      window.location.href = `tel:${contact.phone}`;
    } catch (error) {
      console.warn('Unable to initiate call:', error);
    }
  };

  const handleResourceAccess = (resource: CrisisResource) => {
    onResourceAccess?.(resource);
    
    if (resource.type === 'hotline') {
      try {
        window.location.href = `tel:${resource.phone}`;
      } catch (error) {
        console.warn('Unable to initiate call:', error);
      }
    } else if (resource.type === 'text') {
      try {
        window.location.href = `sms:${resource.phone}`;
      } catch (error) {
        console.warn('Unable to initiate text:', error);
      }
    }
  };

  const shareLocation = async () => {
    if (location) {
      const locationText = `My current location: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'My Location',
            text: locationText
          });
        } catch (error) {
          // Fallback to clipboard
          copyToClipboard(locationText);
        }
      } else {
        copyToClipboard(locationText);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(console.warn);
    }
  };

  // Floating variant positioning
  const floatingClass = variant === 'floating' 
    ? 'fixed bottom-6 right-6 z-50 shadow-2xl' 
    : '';

  // Button styling based on state
  const getButtonClass = () => {
    const baseClass = `${currentSize.button} rounded-full font-bold transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed ${floatingClass}`;
    
    if (countdown !== null) {
      return `${baseClass} bg-red-600 text-white shadow-lg animate-pulse ring-4 ring-red-200`;
    } else if (isActivated) {
      return `${baseClass} bg-red-600 text-white shadow-lg`;
    } else {
      return `${baseClass} bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`;
    }
  };

  return (
    <div className={`enhanced-panic-button ${className}`}>
      {/* Main Panic Button */}
      <button
        ref={buttonRef}
        onClick={handlePanicButtonClick}
        disabled={disabled}
        className={getButtonClass()}
        aria-label={countdown !== null ? `Crisis activation in ${countdown} seconds. Click to cancel.` : "Emergency crisis button"}
        role="button"
        tabIndex={0}
      >
        <div className="flex flex-col items-center justify-center">
          {countdown !== null ? (
            <>
              <div className={`${currentSize.text} font-bold`}>{countdown}</div>
              <div className="text-xs">Cancel?</div>
            </>
          ) : (
            <>
              <AlertTriangle className={currentSize.icon} />
              {size !== 'small' && (
                <div className={`${currentSize.text} font-semibold mt-1`}>
                  {size === 'large' ? 'CRISIS' : 'Help'}
                </div>
              )}
            </>
          )}
        </div>
      </button>

      {/* Cancel Countdown Button */}
      {countdown !== null && (
        <div className="mt-4 text-center">
          <button
            onClick={handleCancelCountdown}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel ({countdown}s)
          </button>
        </div>
      )}

      {/* Last Activation Info */}
      {lastActivation && variant !== 'floating' && (
        <div className="mt-2 text-xs text-gray-600 text-center">
          <Clock className="w-3 h-3 inline mr-1" />
          Last used: {lastActivation.toLocaleTimeString()}
        </div>
      )}

      {/* Emergency Resources Modal */}
      {showResources && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Crisis Support</h3>
                  <p className="text-sm text-gray-600">Get immediate help</p>
                </div>
              </div>

              {/* Emergency Message */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-2">
                  If you're in immediate danger, call 911 now.
                </p>
                <p className="text-sm text-red-700">
                  You are not alone. Help is available 24/7.
                </p>
              </div>

              {/* Crisis Resources */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Crisis Support Lines</h4>
                {crisisResources.map((resource) => (
                  <button
                    key={resource.id}
                    onClick={() => handleResourceAccess(resource)}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {resource.type === 'text' ? (
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Phone className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{resource.name}</span>
                          {resource.available24h && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">24/7</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{resource.description}</p>
                        <p className="text-sm font-medium text-blue-600">{resource.phone}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Emergency Contacts */}
              {showContacts && emergencyContacts.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Emergency Contacts</h4>
                  {emergencyContacts
                    .sort((a, b) => a.priority - b.priority)
                    .slice(0, 3)
                    .map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleEmergencyContact(contact)}
                        className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{contact.name}</span>
                              {contact.available24h && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">24/7</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{contact.relationship}</p>
                            <p className="text-sm font-medium text-blue-600">{contact.phone}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {/* Location Sharing */}
              {location && (
                <div className="mb-6">
                  <button
                    onClick={shareLocation}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 mb-1">Share Location</p>
                        <p className="text-sm text-gray-600">Send your location to support</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Custom Message */}
              {customMessage && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Your crisis message:</strong> {customMessage}
                  </p>
                </div>
              )}

              {/* Close Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResources(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  I'm Safe Now
                </button>
                <button
                  onClick={() => handleResourceAccess(crisisResources[0])}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Call 988
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breathing Exercise Overlay (when countdown is active) */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-xl p-6 text-center max-w-sm">
            <Heart className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Take a Deep Breath</h3>
            <p className="text-sm text-gray-600 mb-4">
              Crisis activation in {countdown} seconds. Breathe with me.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCancelCountdown}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                I'm Better Now
              </button>
              <button
                onClick={() => handleCrisisActivation('immediate')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Get Help Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPanicButton;
