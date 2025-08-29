import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, MapPin, AlertTriangle, Shield, ChevronDown, User, Clock } from 'lucide-react';

interface MobileCrisisButtonProps {
  variant?: 'fixed' | 'inline';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
  onCrisisCall?: () => void;
  onTextCrisis?: () => void;
  onEmergencyServices?: () => void;
  showLocationServices?: boolean;
  className?: string;
  alwaysExpanded?: boolean;
}

interface CrisisResource {
  name: string;
  description: string;
  contact: string;
  type: 'call' | 'text' | 'chat';
  available: string;
  icon: React.ComponentType<any>;
}

export const MobileCrisisButton: React.FC<MobileCrisisButtonProps> = ({
  variant = 'fixed',
  position = 'bottom-right',
  size = 'md',
  onCrisisCall,
  onTextCrisis,
  onEmergencyServices,
  showLocationServices = false,
  className = '',
  alwaysExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const crisisResources: CrisisResource[] = [
    {
      name: '988 Lifeline',
      description: 'Suicide & Crisis Lifeline',
      contact: '988',
      type: 'call',
      available: '24/7',
      icon: Phone
    },
    {
      name: 'Crisis Text',
      description: 'Text HOME to connect',
      contact: '741741',
      type: 'text',
      available: '24/7',
      icon: MessageSquare
    },
    {
      name: 'Emergency',
      description: 'Call 911 for immediate danger',
      contact: '911',
      type: 'call',
      available: '24/7',
      icon: AlertTriangle
    }
  ];

  // Auto-collapse after inactivity
  useEffect(() => {
    if (!isExpanded || alwaysExpanded) return;

    const timeout = setTimeout(() => {
      setIsExpanded(false);
    }, 10000); // Auto-collapse after 10 seconds

    return () => clearTimeout(timeout);
  }, [isExpanded, alwaysExpanded]);

  const handleMainButtonClick = () => {
    if (alwaysExpanded) return;
    setIsExpanded(!isExpanded);
  };

  const handleCrisisCall = async (number: string, resourceName: string) => {
    try {
      // Track analytics
      console.log(`Crisis call initiated: ${resourceName}`);
      
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
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Location services are not supported by this device');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGettingLocation(false);
        setShowLocationPrompt(true);
      },
      (error) => {
        console.error('Location error:', error);
        setIsGettingLocation(false);
        alert('Unable to get your location. Please check your location settings.');
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
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'w-12 h-12',
      md: 'w-14 h-14',
      lg: 'w-16 h-16'
    };
    return sizes[size];
  };

  const getTextSizeClasses = () => {
    const sizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };
    return sizes[size];
  };

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`crisis-button-inline space-y-3 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Crisis Support</h3>
              <p className="text-sm text-red-700">Immediate help is available</p>
            </div>
          </div>

          <div className="grid gap-2">
            {crisisResources.map((resource) => {
              const IconComponent = resource.icon;
              return (
                <button
                  key={resource.name}
                  onClick={() => handleCrisisCall(resource.contact, resource.name)}
                  className="flex items-center gap-3 p-3 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-red-900">{resource.name}</div>
                    <div className="text-sm text-red-700">{resource.description}</div>
                    <div className="text-xs text-red-600">{resource.available}</div>
                  </div>
                  <div className="text-lg font-bold text-red-600">{resource.contact}</div>
                </button>
              );
            })}
          </div>

          {showLocationServices && (
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 font-medium">
                {isGettingLocation ? 'Getting Location...' : 'Share My Location'}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Fixed floating button variant
  return (
    <>
      <div className={`fixed z-40 ${getPositionClasses()} ${className}`}>
        {/* Expanded Menu */}
        {isExpanded && (
          <div className="absolute bottom-full right-0 mb-4 w-80 max-w-[90vw]">
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-red-600 p-4 text-white">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold">Crisis Support</h3>
                    <p className="text-sm text-red-100">Help is available 24/7</p>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="p-2">
                {crisisResources.map((resource, index) => {
                  const IconComponent = resource.icon;
                  return (
                    <button
                      key={resource.name}
                      onClick={() => handleCrisisCall(resource.contact, resource.name)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-blue-100' : index === 1 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          index === 0 ? 'text-blue-600' : index === 1 ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{resource.name}</div>
                        <div className="text-sm text-gray-600">{resource.description}</div>
                        <div className="text-xs text-gray-500">{resource.available}</div>
                      </div>
                      <div className={`text-lg font-bold ${
                        index === 0 ? 'text-blue-600' : index === 1 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {resource.contact}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Location Services */}
              {showLocationServices && (
                <div className="p-2 border-t border-gray-200">
                  <button
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      {isGettingLocation ? (
                        <Clock className="w-5 h-5 text-purple-600 animate-spin" />
                      ) : (
                        <MapPin className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Share Location</div>
                      <div className="text-sm text-gray-600">
                        {isGettingLocation ? 'Getting your location...' : 'Send location to emergency services'}
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-600">
                  You are not alone. Help is available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={handleMainButtonClick}
          className={`
            ${getSizeClasses()}
            bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg
            flex items-center justify-center transition-all duration-200
            hover:scale-105 active:scale-95
            ${isExpanded ? 'ring-4 ring-red-200' : 'animate-pulse'}
          `}
          aria-label="Crisis support - get help now"
        >
          {isExpanded ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <Shield className="w-6 h-6" />
          )}
        </button>

        {/* Pulsing indicator when collapsed */}
        {!isExpanded && (
          <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20" />
        )}
      </div>

      {/* Location Confirmation Modal */}
      {showLocationPrompt && userLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Share Your Location?
              </h3>
              <p className="text-gray-600 mb-6">
                This will send your current location to emergency services to help them find you faster.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={shareLocationWithEmergency}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

// Quick access component for crisis situations
export const QuickCrisisAccess: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const handleQuickCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const handleQuickText = () => {
    window.location.href = 'sms:741741?body=HOME';
  };

  return (
    <div className={`quick-crisis-access ${className}`}>
      <div className="flex items-center justify-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-sm font-medium text-red-800 mb-1">Crisis Support</div>
          <div className="text-xs text-red-600">Available 24/7</div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickCall('988')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Call 988
          </button>
          <button
            onClick={handleQuickText}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Text Crisis
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileCrisisButton;
