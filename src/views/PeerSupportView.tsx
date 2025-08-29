/**
 * Peer Support View - CoreV2 Mental Health Platform
 * Connects users with peer supporters for mutual mental health support
 * HIPAA-compliant with privacy controls and safety features
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

export interface PeerProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  avatar?: string;
  interests: string[];
  supportAreas: string[];
  experience: string;
  languages: string[];
  timezone: string;
  isOnline: boolean;
  lastActive: Date;
  rating: number;
  totalSessions: number;
  isVerified: boolean;
  badges: string[];
}

export interface PeerMatch {
  peer: PeerProfile;
  matchScore: number;
  commonInterests: string[];
  commonSupportAreas: string[];
  reasonForMatch: string;
}

export interface SupportRequest {
  id: string;
  userId: string;
  peerId: string;
  type: 'immediate' | 'scheduled' | 'ongoing';
  topic: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'declined' | 'active' | 'completed';
  scheduledFor?: Date;
  createdAt: Date;
}

export interface PeerSupportViewProps {
  className?: string;
  initialTab?: 'discover' | 'matches' | 'sessions' | 'requests';
}

const supportAreas = [
  'Anxiety',
  'Depression',
  'Stress Management',
  'Grief & Loss',
  'Relationship Issues',
  'Work-Life Balance',
  'Self-Esteem',
  'Trauma Recovery',
  'Addiction Recovery',
  'LGBTQ+ Support',
  'Parenting Stress',
  'Chronic Illness'
];

const interests = [
  'Mindfulness',
  'Exercise & Fitness',
  'Art & Creativity',
  'Music',
  'Reading',
  'Nature & Outdoors',
  'Cooking',
  'Gaming',
  'Travel',
  'Volunteering',
  'Spirituality',
  'Learning'
];

export const PeerSupportView: React.FC<PeerSupportViewProps> = ({
  className = '',
  initialTab = 'discover'
}) => {
  // Auth and notifications
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showWarning } = useNotifications();

  // State management
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [peerMatches, setPeerMatches] = useState<PeerMatch[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<SupportRequest[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    supportAreas: [] as string[],
    interests: [] as string[],
    languages: [] as string[],
    isOnlineOnly: false,
    minRating: 0
  });

  // Load peer matches
  const loadPeerMatches = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await apiService.get<PeerMatch[]>('/peer-support/matches', {
        params: searchFilters
      });

      if (response.success && response.data) {
        setPeerMatches(response.data);
        logger.info('Loaded peer matches:', response.data.length);
      }
    } catch (error) {
      logger.error('Failed to load peer matches:', error);
      showError('Failed to load peer matches');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, searchFilters, showError]);

  // Load support requests
  const loadSupportRequests = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiService.get<SupportRequest[]>('/peer-support/requests');
      
      if (response.success && response.data) {
        setSupportRequests(response.data.filter(req => 
          req.status === 'pending' || req.status === 'accepted'
        ));
        setActiveSessions(response.data.filter(req => 
          req.status === 'active'
        ));
      }
    } catch (error) {
      logger.error('Failed to load support requests:', error);
      showError('Failed to load support requests');
    }
  }, [isAuthenticated, showError]);

  // Send support request
  const sendSupportRequest = useCallback(async (
    peerId: string,
    topic: string,
    description: string,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!isAuthenticated) {
      showError('Please sign in to request peer support');
      return;
    }

    try {
      const response = await apiService.post<SupportRequest>('/peer-support/requests', {
        peerId,
        type: 'immediate',
        topic: topic.trim(),
        description: description.trim(),
        urgency
      });

      if (response.success && response.data) {
        setSupportRequests(prev => [response.data, ...prev]);
        showSuccess('Support request sent! You will be notified when the peer responds.');
        logger.info('Support request sent:', response.data);
      }
    } catch (error) {
      logger.error('Failed to send support request:', error);
      showError('Failed to send support request');
    }
  }, [isAuthenticated, showSuccess, showError]);

  // Update search filters
  const updateFilters = useCallback((updates: Partial<typeof searchFilters>) => {
    setSearchFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Toggle filter array item
  const toggleFilterItem = useCallback((filterKey: 'supportAreas' | 'interests' | 'languages', item: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey].includes(item)
        ? prev[filterKey].filter(i => i !== item)
        : [...prev[filterKey], item]
    }));
  }, []);

  // Load data on mount and filter changes
  useEffect(() => {
    if (activeTab === 'matches' || activeTab === 'discover') {
      loadPeerMatches();
    }
    if (activeTab === 'requests' || activeTab === 'sessions') {
      loadSupportRequests();
    }
  }, [activeTab, loadPeerMatches, loadSupportRequests]);

  // Memoized filtered matches
  const filteredMatches = useMemo(() => {
    return peerMatches.filter(match => {
      if (searchFilters.isOnlineOnly && !match.peer.isOnline) return false;
      if (searchFilters.minRating > 0 && match.peer.rating < searchFilters.minRating) return false;
      return true;
    });
  }, [peerMatches, searchFilters]);

  if (!isAuthenticated) {
    return (
      <div className={`peer-support-view ${className}`}>
        <div className="max-w-4xl mx-auto p-6 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <div className="text-4xl mb-4">🤝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Join Our Peer Support Community
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Connect with others who understand your journey. Share experiences, 
              offer support, and find encouragement from peers who care.
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Sign In to Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`peer-support-view ${className}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Peer Support Community
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect with peers who understand your journey. Share experiences and support each other 
            in a safe, moderated environment.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8 border-b border-gray-200">
          {[
            { id: 'discover', label: 'Discover Peers', icon: '👥' },
            { id: 'matches', label: 'My Matches', icon: '💫' },
            { id: 'requests', label: 'Requests', icon: '📩' },
            { id: 'sessions', label: 'Active Sessions', icon: '💬' }
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
              {tab.id === 'requests' && supportRequests.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center">
                  {supportRequests.length}
                </span>
              )}
              {tab.id === 'sessions' && activeSessions.length > 0 && (
                <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center">
                  {activeSessions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Filters */}
        {(activeTab === 'discover' || activeTab === 'matches') && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Peers</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Support Areas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Areas
                </label>
                <div className="flex flex-wrap gap-2">
                  {supportAreas.map((area) => (
                    <button
                      key={area}
                      onClick={() => toggleFilterItem('supportAreas', area)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        searchFilters.supportAreas.includes(area)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Common Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleFilterItem('interests', interest)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        searchFilters.interests.includes(interest)
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchFilters.isOnlineOnly}
                  onChange={(e) => updateFilters({ isOnlineOnly: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Online now only</span>
              </label>

              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Min Rating:</label>
                <select
                  value={searchFilters.minRating}
                  onChange={(e) => updateFilters({ minRating: Number(e.target.value) })}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={0}>Any</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        <div className="space-y-6">
          {/* Discover/Matches Tab */}
          {(activeTab === 'discover' || activeTab === 'matches') && (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Finding peer matches...</p>
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Matches Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters or check back later for new peer supporters.
                  </p>
                  <button
                    onClick={() => setSearchFilters({
                      supportAreas: [],
                      interests: [],
                      languages: [],
                      isOnlineOnly: false,
                      minRating: 0
                    })}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMatches.map((match) => (
                    <PeerCard
                      key={match.peer.id}
                      match={match}
                      onRequestSupport={sendSupportRequest}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <RequestsList requests={supportRequests} />
          )}

          {/* Active Sessions Tab */}
          {activeTab === 'sessions' && (
            <ActiveSessionsList sessions={activeSessions} />
          )}
        </div>
      </div>
    </div>
  );
};

// Peer Card Component
interface PeerCardProps {
  match: PeerMatch;
  onRequestSupport: (peerId: string, topic: string, description: string) => Promise<void>;
}

const PeerCard: React.FC<PeerCardProps> = ({ match, onRequestSupport }) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestTopic, setRequestTopic] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    if (!requestTopic.trim() || !requestDescription.trim()) return;

    try {
      setSubmitting(true);
      await onRequestSupport(match.peer.id, requestTopic, requestDescription);
      setShowRequestForm(false);
      setRequestTopic('');
      setRequestDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Peer Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {match.peer.displayName.charAt(0)}
              </span>
            </div>
            {match.peer.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center">
              {match.peer.displayName}
              {match.peer.isVerified && (
                <span className="ml-1 text-blue-500" title="Verified peer supporter">✓</span>
              )}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>⭐ {match.peer.rating.toFixed(1)}</span>
              <span>•</span>
              <span>{match.peer.totalSessions} sessions</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-blue-600">
            {Math.round(match.matchScore)}% match
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {match.peer.bio}
      </p>

      {/* Support Areas */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-700 mb-2">Support Areas:</div>
        <div className="flex flex-wrap gap-1">
          {match.peer.supportAreas.slice(0, 3).map((area, index) => (
            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
              {area}
            </span>
          ))}
          {match.peer.supportAreas.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{match.peer.supportAreas.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Common Interests */}
      {match.commonInterests.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-700 mb-2">Common Interests:</div>
          <div className="flex flex-wrap gap-1">
            {match.commonInterests.slice(0, 3).map((interest, index) => (
              <span key={index} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Request Support Form */}
      {showRequestForm ? (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="What would you like to talk about?"
            value={requestTopic}
            onChange={(e) => setRequestTopic(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            maxLength={100}
          />
          <textarea
            placeholder="Provide more details about what kind of support you're looking for..."
            value={requestDescription}
            onChange={(e) => setRequestDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            maxLength={300}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSubmitRequest}
              disabled={!requestTopic.trim() || !requestDescription.trim() || submitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
            <button
              onClick={() => setShowRequestForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowRequestForm(true)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Request Support
        </button>
      )}
    </div>
  );
};

// Requests List Component
const RequestsList: React.FC<{ requests: SupportRequest[] }> = ({ requests }) => {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📩</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Requests</h3>
        <p className="text-gray-600">
          Your support requests will appear here. Start by discovering peers to connect with.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">{request.topic}</h3>
              <p className="text-gray-600 text-sm mt-1">{request.description}</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 text-xs rounded-full ${
                request.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {request.status}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(request.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className={`text-sm ${
              request.urgency === 'high' ? 'text-red-600' :
              request.urgency === 'medium' ? 'text-orange-600' : 'text-gray-600'
            }`}>
              {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)} priority
            </div>
            
            {request.status === 'accepted' && (
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">
                Start Session
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Active Sessions List Component
const ActiveSessionsList: React.FC<{ sessions: SupportRequest[] }> = ({ sessions }) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Sessions</h3>
        <p className="text-gray-600">
          Your active peer support sessions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">{session.topic}</h3>
              <p className="text-gray-600 text-sm mt-1">Active peer support session</p>
            </div>
            <div className="flex space-x-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                Continue Chat
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm">
                End Session
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PeerSupportView;
