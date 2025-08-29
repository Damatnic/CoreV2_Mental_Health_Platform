import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Users, Bot, Shield, Heart, ArrowLeft, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppButton } from '../components/AppButton';

interface ChatRouteProps {
  className?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'ai' | 'peer' | 'group' | 'crisis' | 'therapist';
  participants: number;
  isActive: boolean;
  lastActivity: string;
  description?: string;
  isPrivate: boolean;
}

export const ChatRoute: React.FC<ChatRouteProps> = ({ className = '' }) => {
  const { chatId, roomType } = useParams<{ chatId?: string; roomType?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [availableRooms, setAvailableRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Route parameters
  const chatMode = searchParams.get('mode') || 'default';
  const isEmergency = searchParams.get('emergency') === 'true';
  const isAnonymous = searchParams.get('anonymous') === 'true';

  // Initialize chat route
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/signin?redirect=/chat');
      return;
    }

    initializeChatRoute();
  }, [isAuthenticated, chatId, roomType, navigate]);

  const initializeChatRoute = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load available chat rooms
      const rooms = await loadAvailableRooms();
      setAvailableRooms(rooms);

      // If specific chat ID provided, load that room
      if (chatId) {
        const room = rooms.find(r => r.id === chatId);
        if (room) {
          setCurrentRoom(room);
        } else {
          setError(`Chat room "${chatId}" not found`);
        }
      } else if (roomType) {
        // Navigate to first room of specified type
        const roomOfType = rooms.find(r => r.type === roomType);
        if (roomOfType) {
          navigate(`/chat/${roomOfType.id}`);
        } else {
          setError(`No ${roomType} chat rooms available`);
        }
      }

    } catch (err) {
      setError('Failed to load chat rooms');
      console.error('Chat initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableRooms = async (): Promise<ChatRoom[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    return [
      {
        id: 'ai-therapist',
        name: 'AI Therapist',
        type: 'ai',
        participants: 1,
        isActive: true,
        lastActivity: new Date().toISOString(),
        description: 'Private AI therapy session',
        isPrivate: true
      },
      {
        id: 'crisis-support',
        name: 'Crisis Support',
        type: 'crisis',
        participants: 12,
        isActive: true,
        lastActivity: new Date(Date.now() - 5 * 60000).toISOString(),
        description: '24/7 crisis support chat',
        isPrivate: false
      },
      {
        id: 'peer-support',
        name: 'General Peer Support',
        type: 'peer',
        participants: 34,
        isActive: true,
        lastActivity: new Date(Date.now() - 2 * 60000).toISOString(),
        description: 'Open peer support community',
        isPrivate: false
      },
      {
        id: 'anxiety-group',
        name: 'Anxiety Support Group',
        type: 'group',
        participants: 18,
        isActive: true,
        lastActivity: new Date(Date.now() - 10 * 60000).toISOString(),
        description: 'Support group for anxiety management',
        isPrivate: true
      }
    ];
  };

  const getChatIcon = (type: ChatRoom['type']) => {
    switch (type) {
      case 'ai': return Bot;
      case 'crisis': return Shield;
      case 'peer': return Heart;
      case 'group': return Users;
      case 'therapist': return MessageCircle;
      default: return MessageCircle;
    }
  };

  const getChatTypeColor = (type: ChatRoom['type']) => {
    switch (type) {
      case 'ai': return 'text-blue-600';
      case 'crisis': return 'text-red-600';
      case 'peer': return 'text-green-600';
      case 'group': return 'text-purple-600';
      case 'therapist': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  const handleRoomSelect = (room: ChatRoom) => {
    navigate(`/chat/${room.id}${isEmergency ? '?emergency=true' : ''}`);
  };

  const handleBackToList = () => {
    navigate('/chat');
  };

  const memoizedRoomList = useMemo(() => {
    return availableRooms.sort((a, b) => {
      // Priority order: crisis > active rooms > by last activity
      if (a.type === 'crisis' && b.type !== 'crisis') return -1;
      if (b.type === 'crisis' && a.type !== 'crisis') return 1;
      if (a.isActive && !b.isActive) return -1;
      if (b.isActive && !a.isActive) return 1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
  }, [availableRooms]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Sign in to Chat
          </h2>
          <p className="text-gray-600 mb-4">
            Join our supportive community and connect with others.
          </p>
          <AppButton
            onClick={() => navigate('/auth/signin?redirect=/chat')}
            variant="primary"
          >
            Sign In
          </AppButton>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`chat-route-loading ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`chat-route-error ${className}`}>
        <div className="text-center p-8">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Chat
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <AppButton
              onClick={initializeChatRoute}
              variant="primary"
            >
              Try Again
            </AppButton>
            <AppButton
              onClick={handleBackToList}
              variant="ghost"
            >
              Back to Chat List
            </AppButton>
          </div>
        </div>
      </div>
    );
  }

  // Individual chat room view
  if (currentRoom) {
    const IconComponent = getChatIcon(currentRoom.type);
    
    return (
      <div className={`chat-route-room ${className}`}>
        {/* Room Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <AppButton
              onClick={handleBackToList}
              variant="ghost"
              size="small"
              icon={<ArrowLeft className="w-4 h-4" />}
            />
            <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center`}>
              <IconComponent className={`w-5 h-5 ${getChatTypeColor(currentRoom.type)}`} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentRoom.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className={`w-2 h-2 rounded-full ${
                  currentRoom.isActive ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span>
                  {currentRoom.participants} {currentRoom.participants === 1 ? 'participant' : 'participants'}
                </span>
                {currentRoom.isPrivate && (
                  <span className="text-yellow-600">• Private</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEmergency && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                Emergency Mode
              </div>
            )}
            {isAnonymous && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Anonymous
              </div>
            )}
            <AppButton
              variant="ghost"
              size="small"
              icon={<Settings className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Chat Content Area */}
        <div className="flex-1 p-4">
          <div className="text-center text-gray-500">
            {/* This would contain the actual chat component */}
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to {currentRoom.name}
            </h3>
            <p className="text-gray-600 mb-4">
              {currentRoom.description || 'Start a conversation in this chat room'}
            </p>
            
            {currentRoom.type === 'crisis' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                <Shield className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-red-800 text-sm">
                  <strong>Crisis Support Active</strong><br />
                  If this is a life-threatening emergency, please call 911 immediately.
                  For crisis support, call 988.
                </p>
              </div>
            )}

            {/* Chat interface would be rendered here */}
            <div className="text-sm text-gray-400">
              Chat interface loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat room list view
  return (
    <div className={`chat-route-list ${className}`}>
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat Rooms</h1>
            <p className="text-gray-600">Connect with others for support and conversation</p>
          </div>
          
          {isEmergency && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Emergency Mode</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                Crisis support rooms are prioritized
              </p>
            </div>
          )}
        </div>

        {/* Chat Mode Indicator */}
        {chatMode !== 'default' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              <strong>Mode:</strong> {chatMode.charAt(0).toUpperCase() + chatMode.slice(1)}
              {isAnonymous && ' • Anonymous'}
            </p>
          </div>
        )}
      </div>

      {/* Room List */}
      <div className="p-6">
        {memoizedRoomList.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Chat Rooms Available
            </h3>
            <p className="text-gray-600">
              Check back later or contact support if this seems incorrect.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {memoizedRoomList.map((room) => {
              const IconComponent = getChatIcon(room.type);
              const lastActivityTime = new Date(room.lastActivity);
              const timeAgo = Math.floor((Date.now() - lastActivityTime.getTime()) / 60000);

              return (
                <div
                  key={room.id}
                  onClick={() => handleRoomSelect(room)}
                  className={`
                    flex items-center gap-4 p-4 bg-white rounded-lg border cursor-pointer
                    transition-all hover:shadow-md hover:border-blue-300
                    ${room.type === 'crisis' ? 'border-red-200 bg-red-50' : 'border-gray-200'}
                  `}
                >
                  {/* Room Icon */}
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${room.type === 'crisis' ? 'bg-red-100' : 'bg-gray-100'}
                  `}>
                    <IconComponent className={`w-6 h-6 ${getChatTypeColor(room.type)}`} />
                  </div>

                  {/* Room Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {room.name}
                      </h3>
                      {room.isPrivate && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                          Private
                        </span>
                      )}
                      {room.type === 'crisis' && (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">
                          Crisis
                        </span>
                      )}
                    </div>
                    
                    {room.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {room.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{room.participants} active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          room.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span>
                          {timeAgo === 0 ? 'Active now' :
                           timeAgo < 60 ? `${timeAgo}m ago` :
                           `${Math.floor(timeAgo / 60)}h ago`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Entry Arrow */}
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Emergency Notice */}
        {availableRooms.some(room => room.type === 'crisis') && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Crisis Support Available
                </h4>
                <p className="text-blue-800 text-sm">
                  If you're experiencing a mental health crisis, our crisis support chat 
                  is available 24/7. For immediate life-threatening emergencies, call 911.
                </p>
                <div className="flex gap-2 mt-2">
                  <AppButton
                    onClick={() => window.open('tel:988')}
                    variant="primary"
                    size="small"
                  >
                    Call 988
                  </AppButton>
                  <AppButton
                    onClick={() => window.open('sms:741741?body=HOME')}
                    variant="secondary"
                    size="small"
                  >
                    Text HOME to 741741
                  </AppButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoute;
