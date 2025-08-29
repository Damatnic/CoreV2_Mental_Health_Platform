import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, UserX, Lock, Globe, Wifi, WifiOff } from 'lucide-react';

interface AnonymousIndicatorProps {
  isAnonymous: boolean;
  anonymityLevel?: 'basic' | 'enhanced' | 'maximum';
  showDetails?: boolean;
  onToggleAnonymity?: (enabled: boolean) => void;
  connectionSecure?: boolean;
  className?: string;
}

interface AnonymityFeature {
  name: string;
  enabled: boolean;
  description: string;
  icon: React.ComponentType<any>;
}

interface AnonymityMetrics {
  dataEncrypted: boolean;
  ipMasked: boolean;
  metadataStripped: boolean;
  vpnRecommended: boolean;
  privacyScore: number;
}

export const AnonymousIndicator: React.FC<AnonymousIndicatorProps> = ({
  isAnonymous,
  anonymityLevel = 'basic',
  showDetails = false,
  onToggleAnonymity,
  connectionSecure = true,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  const [anonymityMetrics, setAnonymityMetrics] = useState<AnonymityMetrics | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize anonymity metrics
  useEffect(() => {
    if (isAnonymous) {
      setAnonymityMetrics({
        dataEncrypted: true,
        ipMasked: anonymityLevel !== 'basic',
        metadataStripped: anonymityLevel === 'maximum',
        vpnRecommended: anonymityLevel === 'basic',
        privacyScore: getPrivacyScore(anonymityLevel)
      });
    } else {
      setAnonymityMetrics(null);
    }
  }, [isAnonymous, anonymityLevel]);

  const getPrivacyScore = (level: AnonymousIndicatorProps['anonymityLevel']): number => {
    switch (level) {
      case 'maximum': return 95;
      case 'enhanced': return 80;
      case 'basic': return 60;
      default: return 60;
    }
  };

  const getAnonymityFeatures = (): AnonymityFeature[] => {
    return [
      {
        name: 'End-to-End Encryption',
        enabled: isAnonymous,
        description: 'Messages are encrypted and only you and the recipient can read them',
        icon: Lock
      },
      {
        name: 'IP Address Masking',
        enabled: isAnonymous && anonymityLevel !== 'basic',
        description: 'Your IP address is hidden to protect your location',
        icon: Globe
      },
      {
        name: 'Metadata Removal',
        enabled: isAnonymous && anonymityLevel === 'maximum',
        description: 'Technical metadata is stripped from messages',
        icon: Shield
      },
      {
        name: 'Anonymous Identity',
        enabled: isAnonymous,
        description: 'You appear as an anonymous user without personal identifiers',
        icon: UserX
      }
    ];
  };

  const getStatusColor = () => {
    if (!isAnonymous) return 'text-gray-500';
    
    switch (anonymityLevel) {
      case 'maximum': return 'text-green-600';
      case 'enhanced': return 'text-blue-600';
      case 'basic': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = () => {
    if (!isAnonymous) return 'bg-gray-50';
    
    switch (anonymityLevel) {
      case 'maximum': return 'bg-green-50';
      case 'enhanced': return 'bg-blue-50';
      case 'basic': return 'bg-yellow-50';
      default: return 'bg-gray-50';
    }
  };

  const getStatusBorderColor = () => {
    if (!isAnonymous) return 'border-gray-200';
    
    switch (anonymityLevel) {
      case 'maximum': return 'border-green-200';
      case 'enhanced': return 'border-blue-200';
      case 'basic': return 'border-yellow-200';
      default: return 'border-gray-200';
    }
  };

  const getAnonymityLevelText = () => {
    if (!isAnonymous) return 'Standard Mode';
    
    switch (anonymityLevel) {
      case 'maximum': return 'Maximum Privacy';
      case 'enhanced': return 'Enhanced Privacy';
      case 'basic': return 'Basic Privacy';
      default: return 'Privacy Mode';
    }
  };

  const getAnonymityDescription = () => {
    if (!isAnonymous) return 'Your identity is visible in this conversation';
    
    switch (anonymityLevel) {
      case 'maximum': 
        return 'Highest level of privacy with advanced anonymization features';
      case 'enhanced': 
        return 'Enhanced privacy with IP masking and metadata protection';
      case 'basic': 
        return 'Basic privacy with encryption and anonymous identity';
      default: 
        return 'Privacy mode is active';
    }
  };

  const handleToggle = () => {
    if (onToggleAnonymity) {
      onToggleAnonymity(!isAnonymous);
    }
  };

  return (
    <div className={`anonymous-indicator ${className}`}>
      {/* Main Status Indicator */}
      <div
        className={`
          flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
          ${getStatusBgColor()} ${getStatusBorderColor()}
          ${onToggleAnonymity ? 'cursor-pointer hover:shadow-sm' : ''}
          ${isHovered ? 'scale-[1.02]' : ''}
        `}
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Status Icon */}
        <div className={`flex-shrink-0 ${getStatusColor()}`}>
          {isAnonymous ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </div>

        {/* Status Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium text-sm ${getStatusColor()}`}>
              {getAnonymityLevelText()}
            </h4>
            
            {/* Privacy Score */}
            {isAnonymous && anonymityMetrics && (
              <span className={`
                text-xs px-2 py-1 rounded-full font-medium
                ${anonymityMetrics.privacyScore >= 90 ? 'bg-green-100 text-green-800' :
                  anonymityMetrics.privacyScore >= 75 ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'}
              `}>
                {anonymityMetrics.privacyScore}%
              </span>
            )}

            {/* Connection Security */}
            <div className="flex items-center gap-1">
              {connectionSecure ? (
                <Wifi className="w-3 h-3 text-green-600" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-600" />
              )}
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mt-1">
            {getAnonymityDescription()}
          </p>
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
          {/* Anonymity Features */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Privacy Features</h5>
            <div className="space-y-3">
              {getAnonymityFeatures().map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <div key={feature.name} className="flex items-start gap-3">
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                      ${feature.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}
                    `}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          feature.enabled ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {feature.name}
                        </span>
                        {feature.enabled && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy Metrics */}
          {anonymityMetrics && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Privacy Status</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    anonymityMetrics.dataEncrypted ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-gray-600">Data Encryption</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    anonymityMetrics.ipMasked ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-gray-600">IP Protection</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    anonymityMetrics.metadataStripped ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-gray-600">Metadata Removal</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    !anonymityMetrics.vpnRecommended ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-gray-600">Network Security</span>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {isAnonymous && anonymityLevel === 'basic' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Consider Enhanced Privacy
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    For sensitive conversations, upgrade to Enhanced or Maximum privacy 
                    for better IP protection and metadata removal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tips */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h6 className="text-sm font-medium text-blue-900 mb-2">Privacy Tips</h6>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Avoid sharing personal identifying information</li>
              <li>• Use a VPN for additional network protection</li>
              <li>• Clear your browser data after sensitive sessions</li>
              {!connectionSecure && (
                <li className="text-red-700">• ⚠️ Use a secure connection (HTTPS)</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Simplified version for minimal UI
export const SimpleAnonymousIndicator: React.FC<{
  isAnonymous: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ isAnonymous, size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <div 
      className={`flex items-center gap-1 ${className}`}
      title={isAnonymous ? 'Anonymous mode active' : 'Standard mode'}
    >
      {isAnonymous ? (
        <EyeOff className={`${sizeClasses[size]} text-green-600`} />
      ) : (
        <Eye className={`${sizeClasses[size]} text-gray-400`} />
      )}
      {size !== 'small' && (
        <span className={`text-xs ${isAnonymous ? 'text-green-600' : 'text-gray-500'}`}>
          {isAnonymous ? 'Anonymous' : 'Visible'}
        </span>
      )}
    </div>
  );
};

// Chat message anonymity indicator
export const MessageAnonymityIndicator: React.FC<{
  isAnonymous: boolean;
  showLabel?: boolean;
  className?: string;
}> = ({ isAnonymous, showLabel = false, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isAnonymous ? 'bg-green-500' : 'bg-gray-300'
      }`} />
      {showLabel && (
        <span className="text-xs text-gray-500">
          {isAnonymous ? 'Anonymous' : 'Identified'}
        </span>
      )}
    </div>
  );
};

// Hook for managing anonymity state
export const useAnonymity = (initialState: boolean = false) => {
  const [isAnonymous, setIsAnonymous] = useState(initialState);
  const [anonymityLevel, setAnonymityLevel] = useState<'basic' | 'enhanced' | 'maximum'>('basic');

  const toggleAnonymity = () => {
    setIsAnonymous(!isAnonymous);
  };

  const setAnonymitySettings = (enabled: boolean, level: 'basic' | 'enhanced' | 'maximum' = 'basic') => {
    setIsAnonymous(enabled);
    setAnonymityLevel(level);
  };

  const getPrivacyScore = () => {
    if (!isAnonymous) return 0;
    
    switch (anonymityLevel) {
      case 'maximum': return 95;
      case 'enhanced': return 80;
      case 'basic': return 60;
      default: return 60;
    }
  };

  return {
    isAnonymous,
    anonymityLevel,
    toggleAnonymity,
    setAnonymitySettings,
    getPrivacyScore
  };
};

export default AnonymousIndicator;
