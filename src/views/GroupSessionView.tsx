/**
 * Group Session View - CoreV2 Mental Health Platform
 * Facilitates group therapy and support sessions with real-time communication
 * HIPAA-compliant with privacy controls and professional moderation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

export interface GroupSession {
  id: string;
  title: string;
  description: string;
  facilitatorId: string;
  facilitatorName: string;
  type: 'therapy' | 'support' | 'educational' | 'peer-led';
  topic: string;
  scheduledFor: Date;
  duration: number; // in minutes
  maxParticipants: number;
  currentParticipants: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  isPrivate: boolean;
  requiresApproval: boolean;
  tags: string[];
  participants: SessionParticipant[];
  waitingList: SessionParticipant[];
  rules: string[];
  resources: SessionResource[];
}

export interface SessionParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  role: 'facilitator' | 'participant' | 'observer';
  joinedAt: Date;
  isActive: boolean;
  isMuted: boolean;
  hasVideo: boolean;
}

export interface SessionResource {
  id: string;
  title: string;
  type: 'document' | 'video' | 'audio' | 'link';
  url: string;
  description?: string;
}

export interface SessionMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'private';
  isFromFacilitator: boolean;
}

export interface GroupSessionViewProps {
  sessionId?: string;
  className?: string;
  onLeaveSession?: () => void;
}

const sessionTypes = [
  { value: 'therapy', label: 'Group Therapy', icon: '🧠' },
  { value: 'support', label: 'Support Group', icon: '🤝' },
  { value: 'educational', label: 'Educational', icon: '📚' },
  { value: 'peer-led', label: 'Peer-Led', icon: '👥' }
];

const commonTopics = [
  'Anxiety Management',
  'Depression Support',
  'Stress Reduction',
  'Grief & Loss',
  'Relationship Issues',
  'Work-Life Balance',
  'Self-Esteem Building',
  'Trauma Recovery',
  'Addiction Recovery',
  'LGBTQ+ Support',
  'Parenting Challenges',
  'Chronic Illness'
];

export const GroupSessionView: React.FC<GroupSessionViewProps> = ({
  sessionId,
  className = '',
  onLeaveSession
}) => {
  // Auth and notifications
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showWarning } = useNotifications();

  // State management
  const [currentSession, setCurrentSession] = useState<GroupSession | null>(null);
  const [availableSessions, setAvailableSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'joined' | 'active'>('browse');
  const [joinedSessions, setJoinedSessions] = useState<GroupSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<GroupSession[]>([]);
  
  // Session interaction state
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInSession, setIsInSession] = useState(false);
  const [sessionFilters, setSessionFilters] = useState({
    type: '' as GroupSession['type'] | '',
    topic: '',
    dateRange: 'upcoming' // 'today' | 'week' | 'upcoming'
  });

  // Load available sessions
  const loadAvailableSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<GroupSession[]>('/group-sessions', {
        params: {
          status: 'scheduled',
          ...sessionFilters
        }
      });

      if (response.success && response.data) {
        setAvailableSessions(response.data);
        logger.info('Loaded available sessions:', response.data.length);
      }
    } catch (error) {
      logger.error('Failed to load available sessions:', error);
      showError('Failed to load available sessions');
    } finally {
      setLoading(false);
    }
  }, [sessionFilters, showError]);

  // Load joined sessions
  const loadJoinedSessions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiService.get<GroupSession[]>('/group-sessions/joined');
      
      if (response.success && response.data) {
        setJoinedSessions(response.data.filter(s => s.status === 'scheduled'));
        setActiveSessions(response.data.filter(s => s.status === 'active'));
      }
    } catch (error) {
      logger.error('Failed to load joined sessions:', error);
      showError('Failed to load your sessions');
    }
  }, [isAuthenticated, showError]);

  // Join session
  const joinSession = useCallback(async (session: GroupSession) => {
    if (!isAuthenticated) {
      showError('Please sign in to join group sessions');
      return;
    }

    try {
      const response = await apiService.post(`/group-sessions/${session.id}/join`);
      
      if (response.success) {
        showSuccess(`Successfully joined "${session.title}"`);
        setJoinedSessions(prev => [...prev, session]);
        loadAvailableSessions();
        logger.info('Joined session:', session.id);
      }
    } catch (error) {
      logger.error('Failed to join session:', error);
      showError('Failed to join session');
    }
  }, [isAuthenticated, showSuccess, showError, loadAvailableSessions]);

  // Leave session
  const leaveSession = useCallback(async (sessionId: string) => {
    try {
      const response = await apiService.post(`/group-sessions/${sessionId}/leave`);
      
      if (response.success) {
        showSuccess('Left session successfully');
        setJoinedSessions(prev => prev.filter(s => s.id !== sessionId));
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
        setIsInSession(false);
        onLeaveSession?.();
        logger.info('Left session:', sessionId);
      }
    } catch (error) {
      logger.error('Failed to leave session:', error);
      showError('Failed to leave session');
    }
  }, [showSuccess, showError, onLeaveSession]);

  // Enter active session
  const enterSession = useCallback(async (session: GroupSession) => {
    try {
      setCurrentSession(session);
      setIsInSession(true);
      
      // Load session messages
      const messagesResponse = await apiService.get<SessionMessage[]>(`/group-sessions/${session.id}/messages`);
      if (messagesResponse.success && messagesResponse.data) {
        setMessages(messagesResponse.data);
      }
      
      logger.info('Entered session:', session.id);
    } catch (error) {
      logger.error('Failed to enter session:', error);
      showError('Failed to enter session');
    }
  }, [showError]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentSession) return;

    try {
      const response = await apiService.post<SessionMessage>(`/group-sessions/${currentSession.id}/messages`, {
        content: newMessage.trim(),
        type: 'text'
      });

      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        logger.info('Message sent');
      }
    } catch (error) {
      logger.error('Failed to send message:', error);
      showError('Failed to send message');
    }
  }, [newMessage, currentSession, showError]);

  // Filter sessions based on criteria
  const filteredSessions = useMemo(() => {
    return availableSessions.filter(session => {
      if (sessionFilters.type && session.type !== sessionFilters.type) return false;
      if (sessionFilters.topic && !session.topic.toLowerCase().includes(sessionFilters.topic.toLowerCase())) return false;
      
      const sessionDate = new Date(session.scheduledFor);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (sessionFilters.dateRange === 'today') {
        const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
        return sessionDay.getTime() === today.getTime();
      } else if (sessionFilters.dateRange === 'week') {
        return sessionDate >= now && sessionDate <= weekFromNow;
      }
      
      return sessionDate >= now; // upcoming
    });
  }, [availableSessions, sessionFilters]);

  // Load data on mount and tab changes
  useEffect(() => {
    if (activeTab === 'browse') {
      loadAvailableSessions();
    } else if (activeTab === 'joined' || activeTab === 'active') {
      loadJoinedSessions();
    }
  }, [activeTab, loadAvailableSessions, loadJoinedSessions]);

  // If in session, show session interface
  if (isInSession && currentSession) {
    return (
      <div className={`group-session-view in-session ${className}`}>
        <div className="flex flex-col h-screen">
          {/* Session Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentSession.title}</h1>
                <p className="text-gray-600 text-sm">
                  Facilitated by {currentSession.facilitatorName} • 
                  {currentSession.currentParticipants} participants
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsInSession(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Minimize
                </button>
                <button
                  onClick={() => leaveSession(currentSession.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Leave Session
                </button>
              </div>
            </div>
          </div>

          {/* Session Content */}
          <div className="flex-1 flex">
            {/* Main Session Area */}
            <div className="flex-1 flex flex-col">
              {/* Participants Grid */}
              <div className="bg-gray-900 flex-1 p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
                  {currentSession.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center text-white"
                    >
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                        <span className="text-xl font-semibold">
                          {participant.displayName.charAt(0)}
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{participant.displayName}</div>
                        <div className="text-xs text-gray-400">
                          {participant.role === 'facilitator' ? '👑 Facilitator' : 'Participant'}
                        </div>
                      </div>
                      {participant.isMuted && (
                        <div className="mt-2 text-red-400 text-xs">🔇 Muted</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Controls */}
              <div className="bg-gray-800 p-4 flex justify-center space-x-4">
                <button className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600">
                  🎤 {/* Microphone */}
                </button>
                <button className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600">
                  📹 {/* Camera */}
                </button>
                <button className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600">
                  💬 {/* Chat */}
                </button>
                <button className="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600">
                  ✋ {/* Raise Hand */}
                </button>
              </div>
            </div>

            {/* Chat Sidebar */}
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Group Chat</h3>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium text-sm ${
                        message.isFromFacilitator ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {message.userName}
                        {message.isFromFacilitator && ' 👑'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">{message.content}</div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main session browser interface
  return (
    <div className={`group-session-view ${className}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Group Sessions
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join facilitated group sessions for therapy, support, and educational content. 
            Connect with others in a safe, moderated environment.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8 border-b border-gray-200">
          {[
            { id: 'browse', label: 'Browse Sessions', icon: '🔍' },
            { id: 'joined', label: 'My Sessions', icon: '📅' },
            { id: 'active', label: 'Active Now', icon: '🔴' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'joined' && joinedSessions.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center">
                  {joinedSessions.length}
                </span>
              )}
              {tab.id === 'active' && activeSessions.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center">
                  {activeSessions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        {activeTab === 'browse' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Sessions</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Type
                </label>
                <select
                  value={sessionFilters.type}
                  onChange={(e) => setSessionFilters(prev => ({ 
                    ...prev, 
                    type: e.target.value as GroupSession['type'] | '' 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Types</option>
                  {sessionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  value={sessionFilters.topic}
                  onChange={(e) => setSessionFilters(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="Search topics..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range
                </label>
                <select
                  value={sessionFilters.dateRange}
                  onChange={(e) => setSessionFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="upcoming">All Upcoming</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div>
          {activeTab === 'browse' && (
            <SessionsList
              sessions={filteredSessions}
              loading={loading}
              onJoinSession={joinSession}
              userSessions={joinedSessions}
            />
          )}

          {activeTab === 'joined' && (
            <UserSessionsList
              sessions={joinedSessions}
              onEnterSession={enterSession}
              onLeaveSession={leaveSession}
            />
          )}

          {activeTab === 'active' && (
            <ActiveSessionsList
              sessions={activeSessions}
              onEnterSession={enterSession}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Sessions List Component
interface SessionsListProps {
  sessions: GroupSession[];
  loading: boolean;
  onJoinSession: (session: GroupSession) => void;
  userSessions: GroupSession[];
}

const SessionsList: React.FC<SessionsListProps> = ({
  sessions,
  loading,
  onJoinSession,
  userSessions
}) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Available</h3>
        <p className="text-gray-600">
          No group sessions match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => {
        const isJoined = userSessions.some(s => s.id === session.id);
        const isFull = session.currentParticipants >= session.maxParticipants;
        
        return (
          <div key={session.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Session Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{session.title}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{sessionTypes.find(t => t.value === session.type)?.icon}</span>
                  <span>{session.type}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {session.currentParticipants}/{session.maxParticipants}
                </div>
                {isFull && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Full
                  </span>
                )}
              </div>
            </div>

            {/* Session Details */}
            <div className="space-y-2 mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Topic:</span> {session.topic}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Facilitator:</span> {session.facilitatorName}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">When:</span> {' '}
                {new Date(session.scheduledFor).toLocaleDateString()} at{' '}
                {new Date(session.scheduledFor).toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Duration:</span> {session.duration} minutes
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {session.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {session.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={() => onJoinSession(session)}
              disabled={isJoined || isFull}
              className={`w-full py-2 px-4 rounded-md transition-colors ${
                isJoined
                  ? 'bg-green-100 text-green-800 cursor-default'
                  : isFull
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isJoined ? '✓ Joined' : isFull ? 'Session Full' : 'Join Session'}
            </button>
          </div>
        );
      })}
    </div>
  );
};

// User Sessions List Component
interface UserSessionsListProps {
  sessions: GroupSession[];
  onEnterSession: (session: GroupSession) => void;
  onLeaveSession: (sessionId: string) => void;
}

const UserSessionsList: React.FC<UserSessionsListProps> = ({
  sessions,
  onEnterSession,
  onLeaveSession
}) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📅</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Joined Sessions</h3>
        <p className="text-gray-600">
          You haven't joined any group sessions yet. Browse available sessions to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">{session.title}</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <div><span className="font-medium">Type:</span> {session.type}</div>
                  <div><span className="font-medium">Topic:</span> {session.topic}</div>
                </div>
                <div>
                  <div><span className="font-medium">Facilitator:</span> {session.facilitatorName}</div>
                  <div><span className="font-medium">Participants:</span> {session.currentParticipants}/{session.maxParticipants}</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Scheduled:</span> {' '}
                {new Date(session.scheduledFor).toLocaleString()}
              </div>
            </div>
            
            <div className="flex space-x-2 ml-4">
              {session.status === 'active' && (
                <button
                  onClick={() => onEnterSession(session)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Enter Session
                </button>
              )}
              <button
                onClick={() => onLeaveSession(session.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Active Sessions List Component
interface ActiveSessionsListProps {
  sessions: GroupSession[];
  onEnterSession: (session: GroupSession) => void;
}

const ActiveSessionsList: React.FC<ActiveSessionsListProps> = ({
  sessions,
  onEnterSession
}) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔴</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Sessions</h3>
        <p className="text-gray-600">
          You don't have any active group sessions. Check your joined sessions or browse for new ones.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{session.title}</h3>
              <p className="text-gray-600 text-sm">
                Active session • {session.currentParticipants} participants
              </p>
            </div>
            <button
              onClick={() => onEnterSession(session)}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium"
            >
              🔴 Join Now
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupSessionView;
