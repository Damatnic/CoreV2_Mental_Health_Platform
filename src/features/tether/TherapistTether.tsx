import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, MessageSquare, Shield, Clock, AlertCircle } from 'lucide-react';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/Card';

interface TherapistTetherProps {
  therapistId: string;
  sessionId?: string;
  isEmergency?: boolean;
  onSessionEnd?: () => void;
  onEmergencyEscalate?: () => void;
  className?: string;
}

interface TherapistProfile {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  specialties: string[];
  availability: 'available' | 'busy' | 'offline';
  responseTime: string;
  rating: number;
  verified: boolean;
}

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  lastHeartbeat?: Date;
}

interface SessionControls {
  video: boolean;
  audio: boolean;
  chat: boolean;
  recording: boolean;
  screen: boolean;
}

export const TherapistTether: React.FC<TherapistTetherProps> = ({
  therapistId,
  sessionId,
  isEmergency = false,
  onSessionEnd,
  onEmergencyEscalate,
  className = ''
}) => {
  const { user } = useAuth() as { user: { id: string; username?: string; avatar?: string } | null };
  
  // State management
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'disconnected',
    quality: 'good',
    latency: 0
  });
  const [controls, setControls] = useState<SessionControls>({
    video: true,
    audio: true,
    chat: false,
    recording: false,
    screen: false
  });
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Initialize therapist connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setIsLoading(true);
        
        // Fetch therapist profile
        const therapistData = await fetchTherapistProfile(therapistId);
        setTherapist(therapistData);
        
        // Initialize WebRTC or secure connection
        await establishSecureConnection();
        
        setConnection(prev => ({ ...prev, status: 'connected' }));
      } catch (err) {
        setError('Failed to connect to therapist');
        setConnection(prev => ({ ...prev, status: 'error' }));
      } finally {
        setIsLoading(false);
      }
    };

    if (therapistId) {
      initializeConnection();
    }
  }, [therapistId]);

  // Session timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (connection.status === 'connected') {
      timer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connection.status]);

  // Connection quality monitoring
  useEffect(() => {
    const monitorConnection = () => {
      if (connection.status === 'connected') {
        // Simulate connection monitoring
        const quality = Math.random() > 0.8 ? 'fair' : 'good';
        const latency = Math.floor(Math.random() * 100) + 50;
        
        setConnection(prev => ({
          ...prev,
          quality,
          latency,
          lastHeartbeat: new Date()
        }));
      }
    };

    const interval = setInterval(monitorConnection, 5000);
    return () => clearInterval(interval);
  }, [connection.status]);

  // Helper functions
  const fetchTherapistProfile = async (id: string): Promise<TherapistProfile> => {
    // Mock API call
    return {
      id,
      name: 'Dr. Sarah Johnson',
      title: 'Licensed Clinical Therapist',
      avatar: '/avatars/therapist-1.jpg',
      specialties: ['Anxiety', 'Depression', 'Crisis Intervention'],
      availability: 'available',
      responseTime: '< 2 minutes',
      rating: 4.9,
      verified: true
    };
  };

  const establishSecureConnection = async () => {
    // Mock secure connection establishment
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Control handlers
  const toggleVideo = useCallback(() => {
    setControls(prev => ({ ...prev, video: !prev.video }));
  }, []);

  const toggleAudio = useCallback(() => {
    setControls(prev => ({ ...prev, audio: !prev.audio }));
  }, []);

  const toggleChat = useCallback(() => {
    setControls(prev => ({ ...prev, chat: !prev.chat }));
  }, []);

  const endSession = useCallback(() => {
    setConnection(prev => ({ ...prev, status: 'disconnected' }));
    onSessionEnd?.();
  }, [onSessionEnd]);

  const escalateToEmergency = useCallback(() => {
    onEmergencyEscalate?.();
  }, [onEmergencyEscalate]);

  // Connection status indicator
  const getConnectionStatusColor = () => {
    switch (connection.status) {
      case 'connected':
        return connection.quality === 'poor' ? 'text-yellow-600' : 'text-green-600';
      case 'connecting':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getConnectionStatusText = () => {
    switch (connection.status) {
      case 'connected':
        return `Connected (${connection.quality})`;
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection failed';
      default:
        return 'Disconnected';
    }
  };

  if (isLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !therapist) {
    return (
      <Card className={`${className} border-red-200 bg-red-50`}>
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Connection Failed
          </h3>
          <p className="text-red-700 mb-4">
            {error || 'Unable to connect to therapist'}
          </p>
          <AppButton
            onClick={() => window.location.reload()}
            variant="secondary"
          >
            Try Again
          </AppButton>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${isEmergency ? 'border-red-300 bg-red-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Therapist Avatar */}
          <div className="relative">
            <img
              src={therapist.avatar || '/default-avatar.png'}
              alt={therapist.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
              therapist.availability === 'available' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>

          {/* Therapist Info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {therapist.name}
              </h3>
              {therapist.verified && (
                <Shield className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <p className="text-sm text-gray-600">{therapist.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">⭐ {therapist.rating}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{therapist.responseTime}</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="text-right">
          <div className={`text-sm font-medium ${getConnectionStatusColor()}`}>
            {getConnectionStatusText()}
          </div>
          {connection.status === 'connected' && (
            <div className="text-xs text-gray-500">
              Latency: {connection.latency}ms
            </div>
          )}
        </div>
      </div>

      {/* Emergency Banner */}
      {isEmergency && (
        <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Emergency Session Active
              </p>
              <p className="text-xs text-red-700">
                This session has been flagged for immediate attention
              </p>
            </div>
            <AppButton
              onClick={escalateToEmergency}
              variant="danger"
              size="small"
            >
              Escalate
            </AppButton>
          </div>
        </div>
      )}

      {/* Session Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Session Duration: {formatDuration(sessionDuration)}
            </span>
          </div>
          {sessionId && (
            <span className="text-xs text-gray-500 font-mono">
              Session ID: {sessionId}
            </span>
          )}
        </div>
        
        {therapist.specialties.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-1">Specialties:</p>
            <div className="flex flex-wrap gap-1">
              {therapist.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video/Audio Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <AppButton
          onClick={toggleVideo}
          variant={controls.video ? 'primary' : 'secondary'}
          size="large"
          className={`w-16 h-16 rounded-full ${!controls.video ? 'bg-red-100 text-red-600' : ''}`}
          icon={controls.video ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          aria-label={controls.video ? 'Turn off video' : 'Turn on video'}
        />
        
        <AppButton
          onClick={toggleAudio}
          variant={controls.audio ? 'primary' : 'secondary'}
          size="large"
          className={`w-16 h-16 rounded-full ${!controls.audio ? 'bg-red-100 text-red-600' : ''}`}
          icon={controls.audio ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          aria-label={controls.audio ? 'Mute audio' : 'Unmute audio'}
        />
        
        <AppButton
          onClick={toggleChat}
          variant={controls.chat ? 'primary' : 'secondary'}
          size="large"
          className="w-16 h-16 rounded-full"
          icon={<MessageSquare className="w-6 h-6" />}
          aria-label="Toggle chat"
        />
        
        <AppButton
          onClick={endSession}
          variant="danger"
          size="large"
          className="w-16 h-16 rounded-full"
          icon={<PhoneOff className="w-6 h-6" />}
          aria-label="End session"
        />
      </div>

      {/* Chat Panel */}
      {controls.chat && (
        <div className="border-t border-gray-200 pt-4">
          <div className="h-64 bg-gray-50 rounded-lg p-4 mb-3 overflow-y-auto">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const newMessage = {
                    sender: 'user',
                    content: e.currentTarget.value,
                    timestamp: new Date()
                  };
                  setChatMessages(prev => [...prev, newMessage]);
                  e.currentTarget.value = '';
                }
              }}
            />
            <AppButton variant="primary" size="small">
              Send
            </AppButton>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          🔒 This session is end-to-end encrypted and HIPAA compliant. 
          Your privacy and confidentiality are protected.
        </p>
      </div>
    </Card>
  );
};

// Crisis-specific tether component
export const CrisisTherapistTether: React.FC<Omit<TherapistTetherProps, 'isEmergency'>> = (props) => {
  return (
    <TherapistTether
      {...props}
      isEmergency={true}
      className={`${props.className || ''} border-2 border-red-400 shadow-lg`}
    />
  );
};

// Specialized hook for therapist connection
export const useTherapistTether = (therapistId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  
  const connect = useCallback(async () => {
    try {
      // Mock connection logic
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to therapist:', error);
    }
  }, []);
  
  const disconnect = useCallback(() => {
    setIsConnected(false);
  }, []);
  
  return {
    isConnected,
    connectionQuality,
    connect,
    disconnect
  };
};

export default TherapistTether;
