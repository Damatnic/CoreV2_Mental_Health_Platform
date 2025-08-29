/**
 * Live Chat Component
 * Real-time chat interface for mental health platform with crisis detection
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Phone, 
  MoreVertical, 
  AlertTriangle, 
  Shield, 
  User, 
  Bot,
  X,
  Check,
  CheckCheck
} from 'lucide-react';

// Types for chat functionality
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: ChatParticipant;
  type: 'text' | 'image' | 'file' | 'system' | 'crisis_alert';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
    crisisLevel?: 'low' | 'medium' | 'high' | 'critical';
    replyTo?: string; // Reference to message being replied to
    emergencyTriggered?: boolean;
    culturalContext?: string;
    translatedFrom?: string;
    confidenceScore?: number; // AI confidence in crisis detection
    therapeuticCategory?: 'support' | 'validation' | 'coping' | 'crisis';
    accessibilityFeatures?: string[];
  };
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'user' | 'therapist' | 'ai' | 'peer_supporter' | 'moderator';
  isOnline: boolean;
  lastSeen?: Date;
  verified?: boolean;
  specializations?: string[];
}

export interface ChatRoom {
  id: string;
  type: 'one_on_one' | 'group_therapy' | 'crisis_support' | 'ai_chat' | 'peer_support';
  name: string;
  participants: ChatParticipant[];
  isEncrypted: boolean;
  isAnonymous: boolean;
  crisisMode?: boolean;
  moderators?: string[];
  settings: {
    allowFiles: boolean;
    allowImages: boolean;
    maxParticipants?: number;
    autoSaveChat?: boolean;
    crisisDetection?: boolean;
  };
}

interface LiveChatProps {
  room: ChatRoom;
  currentUser: ChatParticipant;
  messages: ChatMessage[];
  onSendMessage: (content: string, type?: ChatMessage['type'], metadata?: ChatMessage['metadata']) => void;
  onJoinCall?: () => void;
  onLeaveRoom?: () => void;
  onReportMessage?: (messageId: string, reason: string) => void;
  onBlockUser?: (userId: string) => void;
  onRequestHelp?: () => void;
  onCrisisDetected?: (message: ChatMessage, severity: 'medium' | 'high' | 'critical') => void;
  onEmergencyTrigger?: (userId: string, context: string) => void;
  onTherapistRequest?: (urgency: 'low' | 'medium' | 'high') => void;
  onTranslationRequest?: (messageId: string, targetLanguage: string) => void;
  className?: string;
  disabled?: boolean;
  // Mental health specific props
  crisisMode?: boolean;
  therapeuticContext?: 'therapy' | 'crisis' | 'support' | 'peer';
  culturallyAdapted?: boolean;
  accessibilityEnhanced?: boolean;
}

// Message status icons
const MessageStatusIcon: React.FC<{ status: ChatMessage['status'] }> = ({ status }) => {
  switch (status) {
    case 'sending':
      return <div className="w-3 h-3 animate-spin rounded-full border border-gray-300 border-t-blue-600" />;
    case 'sent':
      return <Check className="w-3 h-3 text-gray-400" />;
    case 'delivered':
      return <CheckCheck className="w-3 h-3 text-gray-400" />;
    case 'read':
      return <CheckCheck className="w-3 h-3 text-blue-600" />;
    case 'failed':
      return <X className="w-3 h-3 text-red-600" />;
    default:
      return null;
  }
};

// Role icon component
const RoleIcon: React.FC<{ role: ChatParticipant['role'] }> = ({ role }) => {
  switch (role) {
    case 'therapist':
      return <Shield className="w-4 h-4 text-green-600" />;
    case 'ai':
      return <Bot className="w-4 h-4 text-purple-600" />;
    case 'moderator':
      return <Shield className="w-4 h-4 text-blue-600" />;
    default:
      return <User className="w-4 h-4 text-gray-600" />;
  }
};

// Crisis keywords for detection
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'hurt myself', 'want to die',
  'self harm', 'overdose', 'cutting', 'jump', 'hanging'
];

export const LiveChat: React.FC<LiveChatProps> = ({
  room,
  currentUser,
  messages = [],
  onSendMessage,
  onJoinCall,
  onLeaveRoom: _onLeaveRoom, // Renamed to indicate it's intentionally unused
  onReportMessage,
  onBlockUser,
  onRequestHelp,
  onCrisisDetected: _onCrisisDetected, // Available for future crisis handling implementation
  onEmergencyTrigger: _onEmergencyTrigger, // Available for emergency escalation
  onTherapistRequest: _onTherapistRequest, // Available for therapist connection requests
  onTranslationRequest: _onTranslationRequest, // Available for real-time translation
  className = '',
  disabled = false,
  crisisMode: _crisisMode = false, // Available for crisis mode activation
  therapeuticContext: _therapeuticContext = 'support', // Available for context-aware features
  culturallyAdapted: _culturallyAdapted = false, // Available for cultural adaptations
  accessibilityEnhanced: _accessibilityEnhanced = true // Available for accessibility enhancements
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, _setTypingUsers] = useState<string[]>([]); // Renamed to indicate future use
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle typing indicators
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping]);

  // Crisis detection function
  const detectCrisis = useCallback((text: string) => {
    if (!room.settings.crisisDetection) return;
    
    const lowerText = text.toLowerCase();
    const hasCrisisKeywords = CRISIS_KEYWORDS.some(keyword => 
      lowerText.includes(keyword)
    );

    if (hasCrisisKeywords && !crisisDetected) {
      setCrisisDetected(true);
      console.warn('Crisis keywords detected in message');
    }
  }, [crisisDetected, room.settings.crisisDetection]);

  // Handle message sending
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || disabled) return;

    const messageType: ChatMessage['type'] = 'text';
    const metadata = replyingTo ? { replyTo: replyingTo.id } : undefined;

    // Check for crisis keywords before sending
    detectCrisis(newMessage);

    onSendMessage(newMessage.trim(), messageType, metadata);
    setNewMessage('');
    setReplyingTo(null);
    setIsTyping(false);
  }, [newMessage, disabled, replyingTo, onSendMessage, detectCrisis]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || disabled) return;

    const fileUrl = URL.createObjectURL(file);
    const metadata = {
      fileUrl,
      fileName: file.name,
      fileSize: file.size
    };

    const fileType: ChatMessage['type'] = file.type.startsWith('image/') ? 'image' : 'file';
    onSendMessage(`File: ${file.name}`, fileType, metadata);
    event.target.value = '';
  }, [disabled, onSendMessage]);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setNewMessage(value);
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
    }
  }, [isTyping]);

  // Handle key press
  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, []);

  // Handle message actions
  const handleMessageAction = useCallback((action: string, message: ChatMessage) => {
    switch (action) {
      case 'reply':
        setReplyingTo(message);
        inputRef.current?.focus();
        break;
      case 'report':
        onReportMessage?.(message.id, 'Inappropriate content');
        break;
      case 'block':
        onBlockUser?.(message.sender.id);
        break;
      default:
        break;
    }
    setSelectedMessage(null);
  }, [onReportMessage, onBlockUser]);

  // Get participant by ID
  const getParticipantName = useCallback((participantId: string) => {
    const participant = room.participants.find(p => p.id === participantId);
    return participant?.name || 'Unknown User';
  }, [room.participants]);

  // Message component
  const MessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isOwnMessage = message.sender.id === currentUser.id;
    const isCrisisMessage = message.type === 'crisis_alert';
    const isSystemMessage = message.type === 'system';

    if (isSystemMessage) {
      return (
        <div className="flex justify-center py-2">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
        onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
      >
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-blue-600 text-white' 
            : isCrisisMessage 
              ? 'bg-red-100 border border-red-300' 
              : 'bg-gray-100 text-gray-800'
        }`}>
          {!isOwnMessage && (
            <div className="flex items-center mb-1">
              <RoleIcon role={message.sender.role} />
              <span className="text-sm font-semibold ml-1 mr-2">
                {message.sender.name}
              </span>
              {message.sender.verified && (
                <div className="w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
          )}
          
          {message.metadata?.replyTo && (
            <div className="text-xs opacity-75 mb-2 p-2 bg-black/10 rounded">
              Replying to {getParticipantName(message.metadata.replyTo)}
            </div>
          )}

          <div className="break-words">{message.content}</div>
          
          {message.type === 'image' && message.metadata?.imageUrl && (
            <img 
              src={message.metadata.imageUrl} 
              alt="Shared image" 
              className="mt-2 max-w-full rounded" 
            />
          )}
          
          {message.type === 'file' && message.metadata?.fileName && (
            <div className="mt-2 flex items-center p-2 bg-black/10 rounded">
              <Paperclip className="w-4 h-4 mr-2" />
              <span className="text-sm">{message.metadata.fileName}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs opacity-75">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwnMessage && (
              <MessageStatusIcon status={message.status} />
            )}
          </div>

          {selectedMessage === message.id && (
            <div className="absolute mt-2 bg-white border shadow-lg rounded-lg p-2 z-10">
              <button
                className="block w-full text-left px-3 py-1 hover:bg-gray-100 rounded"
                onClick={() => handleMessageAction('reply', message)}
              >
                Reply
              </button>
              {!isOwnMessage && (
                <>
                  <button
                    className="block w-full text-left px-3 py-1 hover:bg-gray-100 rounded"
                    onClick={() => handleMessageAction('report', message)}
                  >
                    Report
                  </button>
                  <button
                    className="block w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-red-600"
                    onClick={() => handleMessageAction('block', message)}
                  >
                    Block User
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Typing indicator
  const TypingIndicator: React.FC = () => {
    if (typingUsers.length === 0) return null;

    return (
      <div className="flex items-center mb-4 text-gray-500">
        <div className="flex space-x-1 mr-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        <span className="text-sm">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </span>
      </div>
    );
  };

  // Crisis alert banner
  const CrisisAlert: React.FC = () => {
    if (!crisisDetected) return null;

    return (
      <div className="bg-red-50 border border-red-200 p-4 mb-4 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-red-800 font-semibold mb-1">Crisis Support Available</h3>
            <p className="text-red-700 text-sm mb-3">
              If you&apos;re in crisis, help is available 24/7. You&apos;re not alone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onRequestHelp}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Get Help Now
              </button>
              <button
                onClick={() => setCrisisDetected(false)}
                className="text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Simple emoji picker
  const EmojiPicker: React.FC = () => {
    if (!showEmojiPicker) return null;

    const emojis = ['😊', '😂', '❤️', '👍', '👎', '😢', '😮', '😡', '🎉', '💪', '🙏', '✨'];

    return (
      <div className="absolute bottom-12 left-0 bg-white border shadow-lg rounded-lg p-3 z-20">
        <div className="grid grid-cols-6 gap-2">
          {emojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleEmojiSelect(emoji)}
              className="w-8 h-8 hover:bg-gray-100 rounded text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`} data-testid="live-chat">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{room.name}</h2>
          <div className="flex items-center text-sm text-gray-500">
            <span>{room.type.replace('_', ' ')}</span>
            {room.isEncrypted && <Shield className="w-4 h-4 ml-2" />}
            <span className="ml-2">{room.participants.length} participants</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onJoinCall && (
            <button
              onClick={onJoinCall}
              className="p-2 hover:bg-gray-200 rounded-lg"
              title="Join call"
            >
              <Phone className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-2 hover:bg-gray-200 rounded-lg"
            title="View participants"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Crisis alert */}
      <CrisisAlert />

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
        <TypingIndicator />
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-t">
          <span className="text-sm text-blue-700">
            Replying to {replyingTo.sender.name}
          </span>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-blue-700 hover:text-blue-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-4 relative">
        <EmojiPicker />
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={replyingTo ? 'Type your reply...' : 'Type a message...'}
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          
          <div className="flex items-center gap-1">
            {room.settings.allowFiles && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || disabled}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  );
};

export default LiveChat;