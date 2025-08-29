import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, Users, AlertTriangle, Flag, ThumbsUp, ThumbsDown, MoreVertical, UserX, Heart } from 'lucide-react';
import { AppButton } from '../../components/AppButton';

interface PeerChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isSupporter: boolean;
  reactions?: {
    helpful: number;
    supportive: number;
    caring: number;
  };
  reported: boolean;
  edited?: boolean;
  editedAt?: Date;
}

interface PeerChatParticipant {
  id: string;
  name: string;
  isOnline: boolean;
  isSupporter: boolean;
  joinedAt: Date;
  lastSeen?: Date;
  trustLevel: number; // 1-5 scale
  helpfulCount: number;
  isBlocked?: boolean;
}

interface AnonymousPeerChatProps {
  roomId: string;
  userId: string;
  userName: string;
  isSupporter?: boolean;
  maxParticipants?: number;
  moderationEnabled?: boolean;
  allowFileSharing?: boolean;
  className?: string;
  onCrisisDetected?: (message: string, sender: string) => void;
  onUserBlocked?: (userId: string) => void;
}

export const AnonymousPeerChat: React.FC<AnonymousPeerChatProps> = ({
  roomId,
  userId,
  userName,
  isSupporter = false,
  maxParticipants = 10,
  moderationEnabled = true,
  allowFileSharing = false,
  className = '',
  onCrisisDetected,
  onUserBlocked
}) => {
  const [messages, setMessages] = useState<PeerChatMessage[]>([]);
  const [participants, setParticipants] = useState<PeerChatParticipant[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [reportedMessages, setReportedMessages] = useState<Set<string>>(new Set());
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize chat connection
  useEffect(() => {
    initializeChat();
    return () => cleanupChat();
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      setIsConnected(false);
      setConnectionError(null);

      // Initialize WebSocket connection (mock for now)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add current user as participant
      const currentUser: PeerChatParticipant = {
        id: userId,
        name: userName,
        isOnline: true,
        isSupporter,
        joinedAt: new Date(),
        trustLevel: isSupporter ? 5 : 3,
        helpfulCount: 0
      };

      setParticipants([currentUser]);
      setIsConnected(true);

      // Load welcome message
      const welcomeMessage: PeerChatMessage = {
        id: 'welcome',
        content: getWelcomeMessage(),
        senderId: 'system',
        senderName: 'System',
        timestamp: new Date(),
        isSupporter: false,
        reported: false
      };

      setMessages([welcomeMessage]);

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setConnectionError('Failed to connect to chat. Please try again.');
    }
  };

  const cleanupChat = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    // Cleanup WebSocket connection
    setIsConnected(false);
  };

  const getWelcomeMessage = (): string => {
    return `Welcome to the anonymous peer support chat! 

This is a safe space where you can:
• Share your feelings and experiences
• Connect with others who understand
• Give and receive peer support
• Stay completely anonymous

Please remember:
• Be kind and respectful
• No personal information sharing
• Use the report button if needed
• Crisis support: Call 988 if urgent`;
  };

  const sendMessage = async () => {
    const content = inputMessage.trim();
    if (!content || !isConnected) return;

    // Crisis detection
    if (moderationEnabled && detectCrisisLanguage(content)) {
      onCrisisDetected?.(content, userName);
      
      // Show crisis resources
      const crisisMessage: PeerChatMessage = {
        id: `crisis_${Date.now()}`,
        content: 'We noticed your message might indicate you need immediate support. Please consider calling 988 (Suicide & Crisis Lifeline) or reach out to a trusted person. Your safety matters.',
        senderId: 'system',
        senderName: 'Crisis Support',
        timestamp: new Date(),
        isSupporter: false,
        reported: false
      };
      
      setMessages(prev => [...prev, crisisMessage]);
    }

    const newMessage: PeerChatMessage = {
      id: `msg_${Date.now()}_${userId}`,
      content,
      senderId: userId,
      senderName: userName,
      timestamp: new Date(),
      isSupporter,
      reactions: { helpful: 0, supportive: 0, caring: 0 },
      reported: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // Stop typing indicator
    stopTyping();

    // Mock sending to server
    console.log('Sending message:', newMessage);
  };

  const detectCrisisLanguage = (message: string): boolean => {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'want to die', 'better off dead',
      'self harm', 'hurt myself', 'can\'t go on', 'hopeless', 'worthless'
    ];

    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    
    // Typing indicator
    if (!isTyping.includes(userId)) {
      startTyping();
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const startTyping = () => {
    setIsTyping(prev => [...prev.filter(id => id !== userId), userId]);
    // Send typing indicator to other users
  };

  const stopTyping = () => {
    setIsTyping(prev => prev.filter(id => id !== userId));
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addReaction = (messageId: string, reactionType: keyof PeerChatMessage['reactions']) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.reactions) {
        return {
          ...msg,
          reactions: {
            ...msg.reactions,
            [reactionType]: msg.reactions[reactionType] + 1
          }
        };
      }
      return msg;
    }));
  };

  const reportMessage = (messageId: string) => {
    setReportedMessages(prev => new Set([...prev, messageId]));
    
    // In a real app, this would send to moderation system
    console.log('Message reported:', messageId);
    
    // Show confirmation
    alert('Message reported to moderators. Thank you for keeping our community safe.');
  };

  const blockUser = (userIdToBlock: string) => {
    setBlockedUsers(prev => new Set([...prev, userIdToBlock]));
    onUserBlocked?.(userIdToBlock);
    
    // Filter out messages from blocked user
    setMessages(prev => prev.filter(msg => msg.senderId !== userIdToBlock));
    
    console.log('User blocked:', userIdToBlock);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTrustBadge = (participant: PeerChatParticipant) => {
    if (participant.isSupporter) {
      return <Shield className="w-4 h-4 text-green-600" title="Verified Peer Supporter" />;
    }
    if (participant.trustLevel >= 4) {
      return <Heart className="w-4 h-4 text-blue-600" title="Trusted Community Member" />;
    }
    return null;
  };

  const renderMessage = (message: PeerChatMessage) => {
    // Don't render messages from blocked users
    if (blockedUsers.has(message.senderId)) return null;

    const isOwnMessage = message.senderId === userId;
    const isSystemMessage = message.senderId === 'system';

    return (
      <div
        key={message.id}
        className={`mb-4 ${isOwnMessage ? 'text-right' : 'text-left'}`}
      >
        <div className={`inline-block max-w-[80%] ${
          isSystemMessage 
            ? 'bg-blue-50 border border-blue-200 text-blue-800' 
            : isOwnMessage 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-900'
        } rounded-2xl px-4 py-2`}>
          {/* Sender info */}
          {!isOwnMessage && !isSystemMessage && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium opacity-75">
                {message.senderName}
              </span>
              {message.isSupporter && (
                <Shield className="w-3 h-3 text-green-400" />
              )}
            </div>
          )}

          {/* Message content */}
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Timestamp */}
          <div className={`text-xs mt-1 opacity-60`}>
            {formatTimestamp(message.timestamp)}
            {message.edited && <span className="ml-1">(edited)</span>}
          </div>
        </div>

        {/* Reactions and actions */}
        {!isSystemMessage && (
          <div className="flex items-center gap-2 mt-1 justify-start">
            {/* Reactions */}
            {message.reactions && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => addReaction(message.id, 'helpful')}
                  className="text-xs bg-white border rounded-full px-2 py-1 hover:bg-gray-50 flex items-center gap-1"
                  title="Helpful"
                >
                  <ThumbsUp className="w-3 h-3" />
                  {message.reactions.helpful > 0 && message.reactions.helpful}
                </button>
                <button
                  onClick={() => addReaction(message.id, 'supportive')}
                  className="text-xs bg-white border rounded-full px-2 py-1 hover:bg-gray-50 flex items-center gap-1"
                  title="Supportive"
                >
                  <Heart className="w-3 h-3" />
                  {message.reactions.supportive > 0 && message.reactions.supportive}
                </button>
              </div>
            )}

            {/* Message actions */}
            {!isOwnMessage && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => reportMessage(message.id)}
                  className="text-xs text-gray-500 hover:text-red-600 p-1"
                  title="Report message"
                >
                  <Flag className="w-3 h-3" />
                </button>
                <button
                  onClick={() => blockUser(message.senderId)}
                  className="text-xs text-gray-500 hover:text-red-600 p-1"
                  title="Block user"
                >
                  <UserX className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTypingIndicator = () => {
    const typingUsers = isTyping.filter(id => id !== userId);
    if (typingUsers.length === 0) return null;

    return (
      <div className="text-left mb-4">
        <div className="inline-block bg-gray-100 rounded-2xl px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
            <span className="text-xs text-gray-600">
              {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (connectionError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
        <p className="text-gray-600 mb-4">{connectionError}</p>
        <AppButton onClick={initializeChat} variant="primary">
          Try Again
        </AppButton>
      </div>
    );
  }

  return (
    <div className={`anonymous-peer-chat flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Anonymous Peer Support</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
              <span>• {participants.length} online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Show participants"
          >
            <Users className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map(renderMessage)}
            {renderTypingIndicator()}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={isConnected ? "Share your thoughts..." : "Connecting..."}
                  disabled={!isConnected}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <AppButton
                onClick={sendMessage}
                disabled={!inputMessage.trim() || !isConnected}
                variant="primary"
                icon={<Send className="w-4 h-4" />}
                className="px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              <span>Anonymous • Moderated • Crisis support: 988</span>
            </div>
          </div>
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-64 border-l bg-gray-50 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Participants ({participants.length})
            </h4>
            
            <div className="space-y-2">
              {participants.map(participant => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 bg-white rounded-lg"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                    participant.isSupporter ? 'bg-green-600' : 'bg-blue-600'
                  }`}>
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {participant.id === userId ? 'You' : participant.name}
                      </span>
                      {getTrustBadge(participant)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        participant.isOnline ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span>{participant.isOnline ? 'Online' : 'Away'}</span>
                    </div>
                  </div>
                  
                  {participant.id !== userId && (
                    <button
                      onClick={() => blockUser(participant.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Block user"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">Community Guidelines</span>
              </div>
              <ul className="text-xs text-yellow-700 mt-2 space-y-1">
                <li>• Be respectful and kind</li>
                <li>• No personal information</li>
                <li>• Report inappropriate content</li>
                <li>• Seek professional help if needed</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnonymousPeerChat;
