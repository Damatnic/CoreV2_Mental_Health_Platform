import React, { useState, useRef } from 'react';
import { MessageCircle, Bot, User, Clock, Trash2, Download, Search } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    modelUsed?: string;
    tokensUsed?: number;
    responseTime?: number;
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

interface AIChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onSessionDelete?: (sessionId: string) => void;
  onMessageSelect?: (messageId: string) => void;
  onExportSession?: (sessionId: string) => void;
  className?: string;
  maxHeight?: string;
}

export const AIChatHistory: React.FC<AIChatHistoryProps> = ({
  sessions = [],
  currentSessionId,
  onSessionSelect,
  onSessionDelete,
  onMessageSelect,
  onExportSession,
  className = '',
  maxHeight = '500px'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const historyRef = useRef<HTMLDivElement>(null);

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(message => 
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Sort sessions by most recent first
  const sortedSessions = filteredSessions.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect?.(sessionId);
    
    // Toggle expansion
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat session?')) {
      onSessionDelete?.(sessionId);
    }
  };

  const handleExportSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onExportSession?.(sessionId);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'assistant':
        return <Bot className="w-4 h-4 text-green-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const truncateMessage = (content: string, maxLength: number = 100) => {
    return content.length > maxLength 
      ? `${content.substring(0, maxLength)}...`
      : content;
  };

  return (
    <div className={`ai-chat-history ${className}`}>
      <div className="chat-history-header p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat History
            <span className="text-sm font-normal text-gray-500">
              ({sessions.length} sessions)
            </span>
          </h3>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div 
        ref={historyRef}
        className="chat-history-content overflow-y-auto"
        style={{ maxHeight }}
      >
        {sortedSessions.length === 0 ? (
          <div className="empty-state p-8 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">No conversations yet</p>
            <p className="text-sm">Start a conversation to see your chat history here.</p>
          </div>
        ) : (
          <div className="sessions-list">
            {sortedSessions.map((session) => {
              const isExpanded = expandedSessions.has(session.id);
              const isSelected = session.id === currentSessionId;
              
              return (
                <div
                  key={session.id}
                  className={`session-item border-b border-gray-100 ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="session-header p-4 cursor-pointer"
                    onClick={() => handleSessionClick(session.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {session.title}
                          </h4>
                          {session.tags && (
                            <div className="flex gap-1">
                              {session.tags.slice(0, 2).map((tag, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(session.updatedAt)}
                          </span>
                          <span>{session.messages.length} messages</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        {onExportSession && (
                          <button
                            onClick={(e) => handleExportSession(session.id, e)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="Export session"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {onSessionDelete && (
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="session-messages px-4 pb-4">
                      <div className="space-y-2 ml-4 border-l-2 border-gray-200 pl-4">
                        {session.messages.slice(-5).map((message) => (
                          <div
                            key={message.id}
                            className={`message-preview p-2 rounded cursor-pointer transition-colors ${
                              message.role === 'user' 
                                ? 'bg-blue-50 hover:bg-blue-100' 
                                : 'bg-green-50 hover:bg-green-100'
                            }`}
                            onClick={() => onMessageSelect?.(message.id)}
                          >
                            <div className="flex items-start gap-2">
                              {getRoleIcon(message.role)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 mb-1">
                                  {truncateMessage(message.content)}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{formatTimestamp(message.timestamp)}</span>
                                  {message.metadata?.modelUsed && (
                                    <span>• {message.metadata.modelUsed}</span>
                                  )}
                                  {message.metadata?.tokensUsed && (
                                    <span>• {message.metadata.tokensUsed} tokens</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {session.messages.length > 5 && (
                          <p className="text-xs text-gray-500 text-center py-2">
                            + {session.messages.length - 5} more messages
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatHistory;
