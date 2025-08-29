/**
 * Group Therapy Component
 * 
 * Facilitates group therapy sessions with real-time communication,
 * moderation tools, and therapeutic guidance
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, 
  MessageCircle, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Users, 
  Shield, 
  Heart, 
  AlertTriangle,
  Clock,
  Play,
  LogOut
} from 'lucide-react';

interface GroupTherapyParticipant {
  id: string;
  name: string;
  isAnonymous: boolean;
  isTherapist: boolean;
  isModerator: boolean;
  status: 'active' | 'away' | 'offline';
  joinedAt: Date;
  audioEnabled: boolean;
  videoEnabled: boolean;
  avatar?: string;
  mood?: 'good' | 'okay' | 'struggling' | 'crisis';
}

interface TherapySession {
  id: string;
  title: string;
  description: string;
  therapistId: string;
  maxParticipants: number;
  currentParticipants: number;
  startTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'ended';
  topic: string;
  guidelines: string[];
  isPrivate: boolean;
}

interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'therapeutic' | 'crisis-alert';
  isAnonymous: boolean;
  reactions?: { [key: string]: string[] }; // emoji -> user IDs
}

interface GroupTherapyProps {
  sessionId: string;
  currentUser: {
    id: string;
    name: string;
    isTherapist?: boolean;
    isModerator?: boolean;
  };
  onLeaveSession: () => void;
  onCrisisDetected?: (userId: string, severity: 'low' | 'medium' | 'high' | 'critical') => void;
}

const GroupTherapy: React.FC<GroupTherapyProps> = ({
  sessionId,
  currentUser,
  onLeaveSession,
  onCrisisDetected
}) => {
  const [session, setSession] = useState<TherapySession | null>(null);
  const [participants, setParticipants] = useState<GroupTherapyParticipant[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize session and connection
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        
        // Simulate loading session data
        const sessionData: TherapySession = {
          id: sessionId,
          title: 'Mental Wellness Support Group',
          description: 'A supportive environment for sharing experiences',
          therapistId: 'therapist-1',
          maxParticipants: 12,
          currentParticipants: 5,
          startTime: new Date(),
          duration: 60,
          status: 'active',
          topic: 'Coping Strategies',
          guidelines: [
            'Respect others privacy and anonymity',
            'No judgment or criticism',
            'Share only what you are comfortable with',
            'Use appropriate language',
            'Support each other with kindness'
          ],
          isPrivate: false
        };
        
        setSession(sessionData);

        // Simulate WebSocket connection
        const mockConnection = () => {
          setIsConnected(true);
          
          // Add some mock participants
          const mockParticipants: GroupTherapyParticipant[] = [
            {
              id: currentUser.id,
              name: currentUser.name,
              isAnonymous: anonymousMode,
              isTherapist: currentUser.isTherapist || false,
              isModerator: currentUser.isModerator || false,
              status: 'active',
              joinedAt: new Date(),
              audioEnabled: false,
              videoEnabled: false,
              mood: 'okay'
            }
          ];
          
          setParticipants(mockParticipants);
        };

        mockConnection();

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      initializeSession();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId, currentUser, anonymousMode]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!currentMessage.trim() || !isConnected) return;

    const message: GroupMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: anonymousMode ? 'Anonymous' : currentUser.name,
      content: currentMessage.trim(),
      timestamp: new Date(),
      type: 'text',
      isAnonymous: anonymousMode
    };

    setMessages(prev => [...prev, message]);
    setCurrentMessage('');
    scrollToBottom();
  }, [currentMessage, anonymousMode, isConnected, currentUser]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle audio
  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    setVideoEnabled(prev => !prev);
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Leave session
  const handleLeaveSession = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    onLeaveSession();
  }, [onLeaveSession]);

  // Format participant mood
  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'good': return 'text-green-600';
      case 'okay': return 'text-yellow-600';
      case 'struggling': return 'text-orange-600';
      case 'crisis': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Format message timestamp
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to therapy session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {session?.title || 'Group Therapy Session'}
              </h1>
              <p className="text-sm text-gray-600">
                {participants.length} participant{participants.length !== 1 ? 's' : ''} • 
                {session?.topic}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGuidelines(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              title="Session Guidelines"
            >
              <Shield className="h-5 w-5" />
            </button>
            
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-lg ${
                audioEnabled 
                  ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title={audioEnabled ? 'Mute Audio' : 'Enable Audio'}
            >
              {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-lg ${
                videoEnabled 
                  ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title={videoEnabled ? 'Turn Off Video' : 'Enable Video'}
            >
              {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
            
            <button
              onClick={handleLeaveSession}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Leave Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Participants Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Participants ({participants.length})
            </h2>
          </div>
          
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="relative">
                  {participant.avatar ? (
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                    participant.status === 'active' ? 'bg-green-500' :
                    participant.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {participant.isAnonymous ? 'Anonymous' : participant.name}
                    </p>
                    {participant.isTherapist && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                        Therapist
                      </span>
                    )}
                    {participant.isModerator && (
                      <Shield className="h-3 w-3 text-gray-600" />
                    )}
                  </div>
                  {participant.mood && (
                    <p className={`text-xs ${getMoodColor(participant.mood)}`}>
                      {participant.mood}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {message.isAnonymous ? 'Anonymous' : message.senderName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.type === 'therapeutic' && (
                      <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                        Therapeutic
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={anonymousMode}
                  onChange={(e) => setAnonymousMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Anonymous</span>
              </label>
              
              <div className="flex-1">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share your thoughts with the group..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={!isConnected}
                />
              </div>
              
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || !isConnected}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guidelines Modal */}
      {showGuidelines && session && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full m-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Session Guidelines</h3>
              <button
                onClick={() => setShowGuidelines(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {session.guidelines.map((guideline, index) => (
                <p key={index} className="text-sm text-gray-700">
                  • {guideline}
                </p>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowGuidelines(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupTherapy;
