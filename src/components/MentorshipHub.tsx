/**
 * MentorshipHub Component
 * Central hub for mentorship connections, featuring mentor/mentee profiles,
 * match suggestions, connection requests, messaging, and progress tracking
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  MessageCircle, 
  Calendar, 
  Star, 
  Clock,
  ChevronRight,
  Send,
  X,
  Check,
  Globe,
  Target,
  Award,
  Activity,
  Heart,
  AlertCircle,
  Filter,
  Search
} from 'lucide-react';
import { 
  mentorshipMatchingService,
  MentorshipProfile,
  MatchScore,
  MentorshipMatch,
  ConnectionRequest
} from '../services/mentorshipMatchingService';
import './MentorshipHub.css';

interface MentorshipHubProps {
  userId: string;
  onNavigateToOnboarding?: () => void;
}

type TabType = 'matches' | 'connections' | 'requests' | 'messages' | 'progress';

const MentorshipHub: React.FC<MentorshipHubProps> = ({ 
  userId, 
  onNavigateToOnboarding 
}) => {
  // State management
  const [userProfile, setUserProfile] = useState<MentorshipProfile | null>(null);
  const [suggestedMatches, setSuggestedMatches] = useState<MatchScore[]>([]);
  const [activeMatches, setActiveMatches] = useState<MentorshipMatch[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<MentorshipProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCriteria, setFilterCriteria] = useState({
    role: 'all',
    availability: 'all',
    language: 'all',
    topic: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  // Load user profile and data
  useEffect(() => {
    loadUserData();
    
    // Subscribe to service events
    const handleProfileUpdate = () => loadUserData();
    const handleMatchCreated = () => loadActiveMatches();
    const handleConnectionRequest = () => loadPendingRequests();

    mentorshipMatchingService.on('profileUpdated', handleProfileUpdate);
    mentorshipMatchingService.on('matchCreated', handleMatchCreated);
    mentorshipMatchingService.on('connectionRequest', handleConnectionRequest);

    return () => {
      mentorshipMatchingService.off('profileUpdated', handleProfileUpdate);
      mentorshipMatchingService.off('matchCreated', handleMatchCreated);
      mentorshipMatchingService.off('connectionRequest', handleConnectionRequest);
    };
  }, [userId]);

  // Load user data
  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      // Get user profile
      const profile = mentorshipMatchingService.getProfile(userId);
      
      if (!profile) {
        // User needs to complete onboarding
        if (onNavigateToOnboarding) {
          onNavigateToOnboarding();
        }
        return;
      }

      setUserProfile(profile);

      // Load matches and requests
      if (profile.status === 'active') {
        const matches = mentorshipMatchingService.findMatches(userId);
        setSuggestedMatches(matches);
      }

      loadActiveMatches();
      loadPendingRequests();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, onNavigateToOnboarding]);

  // Load active matches
  const loadActiveMatches = useCallback(() => {
    const matches = mentorshipMatchingService.getUserMatches(userId);
    setActiveMatches(matches);
  }, [userId]);

  // Load pending requests
  const loadPendingRequests = useCallback(() => {
    const requests = mentorshipMatchingService.getPendingRequests(userId);
    setPendingRequests(requests);
  }, [userId]);

  // Send connection request
  const sendConnectionRequest = useCallback(async (targetUserId: string) => {
    if (!connectionMessage.trim()) {
      alert('Please write a message for your connection request');
      return;
    }

    setSendingRequest(targetUserId);
    try {
      mentorshipMatchingService.sendConnectionRequest(
        userId,
        targetUserId,
        connectionMessage
      );
      
      // Remove from suggested matches
      setSuggestedMatches(prev => prev.filter(m => m.userId !== targetUserId));
      setConnectionMessage('');
      setSelectedProfile(null);
      
      // Show success message
      alert('Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request. Please try again.');
    } finally {
      setSendingRequest(null);
    }
  }, [userId, connectionMessage]);

  // Accept connection request
  const acceptRequest = useCallback((requestId: string) => {
    const match = mentorshipMatchingService.acceptConnectionRequest(requestId);
    if (match) {
      loadActiveMatches();
      loadPendingRequests();
      setActiveTab('connections');
    }
  }, []);

  // Reject connection request
  const rejectRequest = useCallback((requestId: string) => {
    mentorshipMatchingService.rejectConnectionRequest(requestId);
    loadPendingRequests();
  }, []);

  // End match
  const endMatch = useCallback((matchId: string, reason: string) => {
    if (confirm(`Are you sure you want to end this mentorship connection? Reason: ${reason}`)) {
      mentorshipMatchingService.endMatch(matchId, reason);
      loadActiveMatches();
    }
  }, []);

  // Submit feedback
  const submitFeedback = useCallback((matchId: string, rating: number, comment: string) => {
    mentorshipMatchingService.submitFeedback(matchId, userId, rating, comment);
    alert('Thank you for your feedback!');
  }, [userId]);

  // Filter matches based on search and criteria
  const filteredMatches = useMemo(() => {
    return suggestedMatches.filter(match => {
      const profile = mentorshipMatchingService.getProfile(match.userId);
      if (!profile) return false;

      // Search filter
      if (searchQuery && !profile.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Role filter
      if (filterCriteria.role !== 'all' && profile.role !== filterCriteria.role) {
        return false;
      }

      // Additional filters can be added here

      return true;
    });
  }, [suggestedMatches, searchQuery, filterCriteria]);

  // Render loading state
  if (loading) {
    return (
      <div className="mentorship-hub-loading">
        <div className="loading-spinner" />
        <p>Loading mentorship hub...</p>
      </div>
    );
  }

  // Render no profile state
  if (!userProfile) {
    return (
      <div className="mentorship-hub-empty">
        <Users className="empty-icon" />
        <h3>Welcome to the Mentorship Hub</h3>
        <p>Complete your profile to start connecting with mentors and mentees</p>
        <button 
          className="btn-primary"
          onClick={onNavigateToOnboarding}
        >
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div className="mentorship-hub">
      {/* Header */}
      <div className="hub-header">
        <div className="header-content">
          <h2>Mentorship Hub</h2>
          <p>Connect, grow, and support each other</p>
        </div>
        
        <div className="header-stats">
          <div className="stat">
            <UserCheck />
            <span>{activeMatches.length} Active</span>
          </div>
          <div className="stat">
            <MessageCircle />
            <span>{pendingRequests.length} Requests</span>
          </div>
          <div className="stat">
            <Star />
            <span>{userProfile.rating?.toFixed(1) || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="hub-tabs">
        <button
          className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <Users />
          <span>Find Matches</span>
        </button>
        <button
          className={`tab ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          <UserCheck />
          <span>My Connections</span>
          {activeMatches.length > 0 && (
            <span className="badge">{activeMatches.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <Send />
          <span>Requests</span>
          {pendingRequests.length > 0 && (
            <span className="badge">{pendingRequests.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <MessageCircle />
          <span>Messages</span>
        </button>
        <button
          className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <Activity />
          <span>Progress</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="hub-content">
        {/* Find Matches Tab */}
        {activeTab === 'matches' && (
          <div className="matches-section">
            {/* Search and Filters */}
            <div className="search-filters">
              <div className="search-bar">
                <Search />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="filters">
                <select
                  value={filterCriteria.role}
                  onChange={(e) => setFilterCriteria(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="all">All Roles</option>
                  <option value="mentor">Mentors</option>
                  <option value="mentee">Mentees</option>
                  <option value="both">Peers</option>
                </select>
              </div>
            </div>

            {/* Match Cards */}
            <div className="match-grid">
              {filteredMatches.length === 0 ? (
                <div className="no-matches">
                  <Users className="empty-icon" />
                  <p>No matches found. Try adjusting your filters or check back later.</p>
                </div>
              ) : (
                filteredMatches.map(match => {
                  const profile = mentorshipMatchingService.getProfile(match.userId);
                  if (!profile) return null;

                  return (
                    <div key={match.userId} className="match-card">
                      <div className="match-header">
                        <div className="match-score">
                          <span className="score">{Math.round(match.score * 100)}%</span>
                          <span className="label">Match</span>
                        </div>
                        <div className="match-badges">
                          {profile.verified && (
                            <span className="badge verified">
                              <Check />
                              Verified
                            </span>
                          )}
                          {profile.role === 'mentor' && (
                            <span className="badge role">Mentor</span>
                          )}
                          {profile.role === 'mentee' && (
                            <span className="badge role">Mentee</span>
                          )}
                          {profile.role === 'both' && (
                            <span className="badge role">Peer</span>
                          )}
                        </div>
                      </div>

                      <div className="match-profile">
                        <h4>{profile.name}</h4>
                        {profile.pronouns && (
                          <span className="pronouns">({profile.pronouns})</span>
                        )}
                      </div>

                      <div className="match-details">
                        <div className="detail">
                          <Globe />
                          <span>{profile.languages.join(', ')}</span>
                        </div>
                        <div className="detail">
                          <Clock />
                          <span>{profile.timezone}</span>
                        </div>
                        {profile.rating && (
                          <div className="detail">
                            <Star />
                            <span>{profile.rating.toFixed(1)} ({profile.reviewCount} reviews)</span>
                          </div>
                        )}
                      </div>

                      <div className="match-topics">
                        <h5>Areas of Support:</h5>
                        <div className="topic-tags">
                          {(profile.role === 'mentor' ? profile.areasOfExperience : profile.areasSeekingSupport)
                            .slice(0, 3)
                            .map(area => (
                              <span key={area} className="tag">{area}</span>
                            ))}
                        </div>
                      </div>

                      <div className="match-strengths">
                        {match.strengths.slice(0, 2).map(strength => (
                          <div key={strength} className="strength">
                            <Check className="icon-sm" />
                            <span>{strength}</span>
                          </div>
                        ))}
                      </div>

                      <div className="match-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => setSelectedProfile(profile)}
                        >
                          View Profile
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => {
                            setSelectedProfile(profile);
                            setConnectionMessage(`Hi ${profile.name}, I'd love to connect with you for mentorship support.`);
                          }}
                          disabled={sendingRequest === profile.userId}
                        >
                          {sendingRequest === profile.userId ? 'Sending...' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* My Connections Tab */}
        {activeTab === 'connections' && (
          <div className="connections-section">
            {activeMatches.length === 0 ? (
              <div className="no-connections">
                <UserCheck className="empty-icon" />
                <p>You don't have any active connections yet.</p>
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab('matches')}
                >
                  Find Matches
                </button>
              </div>
            ) : (
              <div className="connections-grid">
                {activeMatches.map(match => {
                  const partnerId = match.mentorId === userId ? match.menteeId : match.mentorId;
                  const partner = mentorshipMatchingService.getProfile(partnerId);
                  if (!partner) return null;

                  const role = match.mentorId === userId ? 'Mentee' : 'Mentor';

                  return (
                    <div key={match.id} className="connection-card">
                      <div className="connection-header">
                        <span className="connection-role">{role}</span>
                        <span className="connection-date">
                          Connected {new Date(match.acceptedAt!).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="connection-profile">
                        <h4>{partner.name}</h4>
                        <p>{partner.communicationStyle} communication</p>
                      </div>

                      <div className="connection-stats">
                        <div className="stat">
                          <MessageCircle />
                          <span>{match.messages} messages</span>
                        </div>
                        <div className="stat">
                          <Calendar />
                          <span>{match.sessions} sessions</span>
                        </div>
                      </div>

                      <div className="connection-actions">
                        <button
                          className="btn-primary"
                          onClick={() => {
                            setSelectedMatch(match.id);
                            setActiveTab('messages');
                          }}
                        >
                          <MessageCircle />
                          Message
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            mentorshipMatchingService.incrementSessionCount(match.id);
                            loadActiveMatches();
                          }}
                        >
                          <Calendar />
                          Log Session
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => endMatch(match.id, 'User requested')}
                        >
                          <X />
                          End
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="requests-section">
            {pendingRequests.length === 0 ? (
              <div className="no-requests">
                <Send className="empty-icon" />
                <p>No pending connection requests.</p>
              </div>
            ) : (
              <div className="requests-list">
                {pendingRequests.map(request => {
                  const sender = mentorshipMatchingService.getProfile(request.fromUserId);
                  if (!sender) return null;

                  return (
                    <div key={request.id} className="request-card">
                      <div className="request-header">
                        <h4>{sender.name}</h4>
                        <span className="request-date">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="request-details">
                        <div className="detail">
                          <span className="label">Role:</span>
                          <span>{sender.role}</span>
                        </div>
                        <div className="detail">
                          <span className="label">Match Score:</span>
                          <span>{request.matchScore ? `${Math.round(request.matchScore * 100)}%` : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="request-message">
                        <p>{request.message}</p>
                      </div>

                      <div className="request-actions">
                        <button
                          className="btn-success"
                          onClick={() => acceptRequest(request.id)}
                        >
                          <Check />
                          Accept
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => setSelectedProfile(sender)}
                        >
                          View Profile
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => rejectRequest(request.id)}
                        >
                          <X />
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="messages-section">
            {activeMatches.length === 0 ? (
              <div className="no-messages">
                <MessageCircle className="empty-icon" />
                <p>No active conversations yet.</p>
              </div>
            ) : (
              <div className="messages-container">
                <div className="conversations-list">
                  {activeMatches.map(match => {
                    const partnerId = match.mentorId === userId ? match.menteeId : match.mentorId;
                    const partner = mentorshipMatchingService.getProfile(partnerId);
                    if (!partner) return null;

                    return (
                      <button
                        key={match.id}
                        className={`conversation ${selectedMatch === match.id ? 'active' : ''}`}
                        onClick={() => setSelectedMatch(match.id)}
                      >
                        <div className="conversation-info">
                          <h5>{partner.name}</h5>
                          <p>{match.messages} messages</p>
                        </div>
                        <ChevronRight />
                      </button>
                    );
                  })}
                </div>

                {selectedMatch && (
                  <div className="message-thread">
                    <div className="thread-header">
                      {(() => {
                        const match = activeMatches.find(m => m.id === selectedMatch);
                        if (!match) return null;
                        const partnerId = match.mentorId === userId ? match.menteeId : match.mentorId;
                        const partner = mentorshipMatchingService.getProfile(partnerId);
                        return partner ? <h4>{partner.name}</h4> : null;
                      })()}
                    </div>

                    <div className="messages-placeholder">
                      <MessageCircle className="placeholder-icon" />
                      <p>Messaging functionality will be integrated with your chat system</p>
                      <p className="hint">This is where your conversation history will appear</p>
                    </div>

                    <div className="message-input-container">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && messageInput.trim()) {
                            // Increment message count for demo
                            mentorshipMatchingService.incrementMessageCount(selectedMatch);
                            setMessageInput('');
                            loadActiveMatches();
                          }
                        }}
                      />
                      <button 
                        className="send-button"
                        onClick={() => {
                          if (messageInput.trim()) {
                            mentorshipMatchingService.incrementMessageCount(selectedMatch);
                            setMessageInput('');
                            loadActiveMatches();
                          }
                        }}
                      >
                        <Send />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="progress-section">
            <div className="progress-overview">
              <h3>Your Mentorship Journey</h3>
              
              <div className="progress-stats">
                <div className="progress-stat">
                  <div className="stat-icon">
                    <UserCheck />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{activeMatches.length}</span>
                    <span className="stat-label">Active Connections</span>
                  </div>
                </div>

                <div className="progress-stat">
                  <div className="stat-icon">
                    <Calendar />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">
                      {activeMatches.reduce((sum, m) => sum + m.sessions, 0)}
                    </span>
                    <span className="stat-label">Total Sessions</span>
                  </div>
                </div>

                <div className="progress-stat">
                  <div className="stat-icon">
                    <MessageCircle />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">
                      {activeMatches.reduce((sum, m) => sum + m.messages, 0)}
                    </span>
                    <span className="stat-label">Messages Exchanged</span>
                  </div>
                </div>

                <div className="progress-stat">
                  <div className="stat-icon">
                    <Star />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">
                      {userProfile.rating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="stat-label">Average Rating</span>
                  </div>
                </div>
              </div>

              <div className="progress-goals">
                <h4>Your Goals</h4>
                <div className="goals-list">
                  {userProfile.goals.map(goal => (
                    <div key={goal} className="goal-item">
                      <Target className="icon-sm" />
                      <span>{goal}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="progress-achievements">
                <h4>Achievements</h4>
                <div className="achievements-grid">
                  {activeMatches.length >= 1 && (
                    <div className="achievement">
                      <Award />
                      <span>First Connection</span>
                    </div>
                  )}
                  {activeMatches.reduce((sum, m) => sum + m.sessions, 0) >= 5 && (
                    <div className="achievement">
                      <Calendar />
                      <span>5 Sessions</span>
                    </div>
                  )}
                  {userProfile.verified && (
                    <div className="achievement">
                      <Check />
                      <span>Verified Member</span>
                    </div>
                  )}
                  {userProfile.trainingCompleted && (
                    <div className="achievement">
                      <Award />
                      <span>Training Complete</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedProfile && !connectionMessage && (
        <div className="modal-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedProfile(null)}
            >
              <X />
            </button>

            <div className="profile-header">
              <h3>{selectedProfile.name}</h3>
              {selectedProfile.pronouns && (
                <span className="pronouns">({selectedProfile.pronouns})</span>
              )}
            </div>

            <div className="profile-badges">
              {selectedProfile.verified && (
                <span className="badge verified">
                  <Check />
                  Verified
                </span>
              )}
              <span className="badge role">{selectedProfile.role}</span>
              {selectedProfile.trainingCompleted && (
                <span className="badge training">
                  <Award />
                  Trained
                </span>
              )}
            </div>

            <div className="profile-section">
              <h4>About</h4>
              <div className="profile-details">
                <div className="detail">
                  <Globe />
                  <span>Languages: {selectedProfile.languages.join(', ')}</span>
                </div>
                <div className="detail">
                  <Clock />
                  <span>Timezone: {selectedProfile.timezone}</span>
                </div>
                <div className="detail">
                  <MessageCircle />
                  <span>Prefers: {selectedProfile.communicationStyle} communication</span>
                </div>
                <div className="detail">
                  <Calendar />
                  <span>Frequency: {selectedProfile.preferredFrequency}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h4>Areas of {selectedProfile.role === 'mentor' ? 'Experience' : 'Interest'}</h4>
              <div className="topic-tags">
                {(selectedProfile.role === 'mentor' 
                  ? selectedProfile.areasOfExperience 
                  : selectedProfile.areasSeekingSupport
                ).map(area => (
                  <span key={area} className="tag">{area}</span>
                ))}
              </div>
            </div>

            <div className="profile-section">
              <h4>Goals</h4>
              <ul className="goals-list">
                {selectedProfile.goals.map(goal => (
                  <li key={goal}>{goal}</li>
                ))}
              </ul>
            </div>

            <div className="profile-section">
              <h4>Availability</h4>
              <div className="availability-grid">
                {selectedProfile.availability.map((slot, index) => (
                  <div key={index} className="availability-slot">
                    <span className="day">{slot.dayOfWeek}</span>
                    <span className="time">{slot.startTime} - {slot.endTime}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedProfile.rating && (
              <div className="profile-section">
                <h4>Reviews</h4>
                <div className="rating-display">
                  <Star className="star-icon" />
                  <span className="rating">{selectedProfile.rating.toFixed(1)}</span>
                  <span className="reviews">({selectedProfile.reviewCount} reviews)</span>
                </div>
              </div>
            )}

            <div className="profile-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setConnectionMessage(`Hi ${selectedProfile.name}, I'd love to connect with you for mentorship support.`);
                }}
              >
                Send Connection Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Request Modal */}
      {selectedProfile && connectionMessage && (
        <div className="modal-overlay" onClick={() => {
          setConnectionMessage('');
          setSelectedProfile(null);
        }}>
          <div className="modal-content request-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => {
                setConnectionMessage('');
                setSelectedProfile(null);
              }}
            >
              <X />
            </button>

            <h3>Send Connection Request</h3>
            <p>To: {selectedProfile.name}</p>

            <div className="request-form">
              <label>Your Message</label>
              <textarea
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you'd like to connect..."
                rows={6}
              />

              <div className="request-tips">
                <AlertCircle className="icon-sm" />
                <div>
                  <p>Tips for a great connection request:</p>
                  <ul>
                    <li>Be genuine and specific about your goals</li>
                    <li>Mention shared interests or experiences</li>
                    <li>Be respectful of their time and expertise</li>
                  </ul>
                </div>
              </div>

              <div className="request-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setConnectionMessage('');
                    setSelectedProfile(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => sendConnectionRequest(selectedProfile.userId)}
                  disabled={!connectionMessage.trim() || sendingRequest === selectedProfile.userId}
                >
                  {sendingRequest === selectedProfile.userId ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorshipHub;