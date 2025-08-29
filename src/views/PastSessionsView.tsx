import React, { useState, useEffect } from 'react';
import { LazyMarkdown } from '../components/LazyMarkdown';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { AppButton } from '../components/AppButton';
import { KudosIcon, HeartIcon } from '../components/icons.dynamic';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { EmptyState } from '../components/EmptyState';
import { MyPostsIcon } from '../components/icons.dynamic';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface PastSession {
  id: string;
  sessionType: 'helper' | 'ai' | 'peer';
  partnerId?: string;
  partnerName: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  topic?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  wasHelpful: boolean;
  kudosGiven?: number;
  tags?: string[];
  summary?: string;
}

interface SessionStats {
  totalSessions: number;
  totalDuration: number; // in minutes
  averageRating: number;
  helpfulPercentage: number;
  favoritePartner?: string;
  mostCommonTopic?: string;
}

const PastSessionsView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [sessions, setSessions] = useState<PastSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<PastSession[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [selectedSession, setSelectedSession] = useState<PastSession | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'helper' | 'ai' | 'peer'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'duration'>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    filterAndSortSessions();
  }, [sessions, filterType, sortBy]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      const mockSessions: PastSession[] = [
        {
          id: '1',
          sessionType: 'helper',
          partnerId: 'helper-1',
          partnerName: 'Dr. Sarah Johnson',
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          duration: 60,
          topic: 'Anxiety Management',
          notes: 'Discussed coping strategies for work-related stress',
          rating: 5,
          feedback: 'Very helpful session. Dr. Johnson provided excellent strategies.',
          wasHelpful: true,
          kudosGiven: 10,
          tags: ['anxiety', 'stress', 'work'],
          summary: 'Explored various techniques for managing workplace anxiety including breathing exercises and cognitive reframing.'
        },
        {
          id: '2',
          sessionType: 'ai',
          partnerName: 'AI Assistant',
          startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
          duration: 30,
          topic: 'Sleep Issues',
          notes: 'Received tips for better sleep hygiene',
          rating: 4,
          wasHelpful: true,
          tags: ['sleep', 'insomnia', 'wellness'],
          summary: 'AI provided personalized sleep improvement recommendations based on my schedule.'
        },
        {
          id: '3',
          sessionType: 'peer',
          partnerId: 'peer-1',
          partnerName: 'Alex M.',
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
          duration: 45,
          topic: 'Shared Experiences',
          notes: 'Connected with someone going through similar challenges',
          rating: 4,
          wasHelpful: true,
          kudosGiven: 5,
          tags: ['peer-support', 'community'],
          summary: 'Had a meaningful conversation about shared experiences with depression.'
        }
      ];

      const mockStats: SessionStats = {
        totalSessions: mockSessions.length,
        totalDuration: mockSessions.reduce((sum, s) => sum + s.duration, 0),
        averageRating: mockSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / mockSessions.filter(s => s.rating).length,
        helpfulPercentage: (mockSessions.filter(s => s.wasHelpful).length / mockSessions.length) * 100,
        favoritePartner: 'Dr. Sarah Johnson',
        mostCommonTopic: 'Anxiety Management'
      };

      setSessions(mockSessions);
      setSessionStats(mockStats);
      
    } catch (error) {
      console.error('Error loading sessions:', error);
      showNotification('Failed to load past sessions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortSessions = () => {
    let filtered = [...sessions];

    // Apply filter
    if (filterType !== 'all') {
      filtered = filtered.filter(session => session.sessionType === filterType);
    }

    // Apply sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'duration':
        filtered.sort((a, b) => b.duration - a.duration);
        break;
    }

    setFilteredSessions(filtered);
  };

  const handleViewDetails = (session: PastSession) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const handleAddFeedback = (session: PastSession) => {
    setSelectedSession(session);
    setFeedbackText(session.feedback || '');
    setFeedbackRating(session.rating || 5);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedSession) return;

    try {
      // Update session with feedback
      const updatedSessions = sessions.map(session => 
        session.id === selectedSession.id
          ? { ...session, feedback: feedbackText, rating: feedbackRating }
          : session
      );
      
      setSessions(updatedSessions);
      showNotification('Feedback submitted successfully', 'success');
      setShowFeedbackModal(false);
      setSelectedSession(null);
      setFeedbackText('');
      setFeedbackRating(5);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showNotification('Failed to submit feedback', 'error');
    }
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'helper': return '👨‍⚕️';
      case 'ai': return '🤖';
      case 'peer': return '👥';
      default: return '💬';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'helper': return '#10b981';
      case 'ai': return '#3b82f6';
      case 'peer': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderStars = (rating: number): JSX.Element => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="past-sessions-view">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your past sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="past-sessions-view">
      <div className="view-header">
        <h1>Past Sessions</h1>
        <p>Review your mental health support journey</p>
      </div>

      {sessionStats && (
        <div className="stats-overview">
          <Card className="stats-card">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{sessionStats.totalSessions}</div>
                <div className="stat-label">Total Sessions</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{formatDuration(sessionStats.totalDuration)}</div>
                <div className="stat-label">Total Time</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{sessionStats.averageRating.toFixed(1)}</div>
                <div className="stat-label">Average Rating</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{sessionStats.helpfulPercentage.toFixed(0)}%</div>
                <div className="stat-label">Helpful Sessions</div>
              </div>
            </div>
            {sessionStats.favoritePartner && (
              <div className="favorite-partner">
                <span className="label">Most sessions with:</span>
                <span className="partner-name">{sessionStats.favoritePartner}</span>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="sessions-controls">
        <div className="filter-section">
          <label>Filter by:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filterType === 'helper' ? 'active' : ''}`}
              onClick={() => setFilterType('helper')}
            >
              Helpers
            </button>
            <button
              className={`filter-btn ${filterType === 'ai' ? 'active' : ''}`}
              onClick={() => setFilterType('ai')}
            >
              AI Chat
            </button>
            <button
              className={`filter-btn ${filterType === 'peer' ? 'active' : ''}`}
              onClick={() => setFilterType('peer')}
            >
              Peers
            </button>
          </div>
        </div>

        <div className="sort-section">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="rating">Highest Rated</option>
            <option value="duration">Longest Duration</option>
          </select>
        </div>
      </div>

      <div className="sessions-list">
        {filteredSessions.length === 0 ? (
          <EmptyState
            icon={<MyPostsIcon />}
            title="No sessions found"
            description="You haven't had any sessions yet. Start a conversation with a helper, AI, or peer to begin your journey."
          />
        ) : (
          filteredSessions.map(session => (
            <Card key={session.id} className="session-card">
              <div className="session-header">
                <div className="session-type">
                  <span 
                    className="type-icon"
                    style={{ backgroundColor: getSessionTypeColor(session.sessionType) }}
                  >
                    {getSessionTypeIcon(session.sessionType)}
                  </span>
                  <div className="session-info">
                    <div className="partner-name">{session.partnerName}</div>
                    <div className="session-date">{formatTimeAgo(session.startTime)}</div>
                  </div>
                </div>
                <div className="session-duration">
                  {formatDuration(session.duration)}
                </div>
              </div>

              {session.topic && (
                <div className="session-topic">
                  <strong>Topic:</strong> {session.topic}
                </div>
              )}

              {session.summary && (
                <div className="session-summary">
                  <LazyMarkdown content={session.summary} />
                </div>
              )}

              {session.tags && session.tags.length > 0 && (
                <div className="session-tags">
                  {session.tags.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="session-footer">
                <div className="session-metrics">
                  {session.rating && (
                    <div className="rating">
                      {renderStars(session.rating)}
                    </div>
                  )}
                  {session.wasHelpful && (
                    <div className="helpful-badge">
                      <HeartIcon />
                      Helpful
                    </div>
                  )}
                  {session.kudosGiven && (
                    <div className="kudos">
                      <KudosIcon />
                      {session.kudosGiven} kudos
                    </div>
                  )}
                </div>

                <div className="session-actions">
                  <AppButton
                    size="small"
                    variant="secondary"
                    onClick={() => handleViewDetails(session)}
                  >
                    View Details
                  </AppButton>
                  {!session.feedback && (
                    <AppButton
                      size="small"
                      onClick={() => handleAddFeedback(session)}
                    >
                      Add Feedback
                    </AppButton>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Session Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSession(null);
        }}
        title="Session Details"
      >
        {selectedSession && (
          <div className="session-detail-modal">
            <div className="detail-header">
              <div className="partner-info">
                <span 
                  className="type-icon"
                  style={{ backgroundColor: getSessionTypeColor(selectedSession.sessionType) }}
                >
                  {getSessionTypeIcon(selectedSession.sessionType)}
                </span>
                <div>
                  <div className="partner-name">{selectedSession.partnerName}</div>
                  <div className="session-type">{selectedSession.sessionType} session</div>
                </div>
              </div>
            </div>

            <div className="detail-content">
              <div className="detail-row">
                <span className="label">Date:</span>
                <span>{new Date(selectedSession.startTime).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Time:</span>
                <span>
                  {new Date(selectedSession.startTime).toLocaleTimeString()} - 
                  {new Date(selectedSession.endTime).toLocaleTimeString()}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Duration:</span>
                <span>{formatDuration(selectedSession.duration)}</span>
              </div>
              {selectedSession.topic && (
                <div className="detail-row">
                  <span className="label">Topic:</span>
                  <span>{selectedSession.topic}</span>
                </div>
              )}
              {selectedSession.notes && (
                <div className="detail-section">
                  <div className="label">Notes:</div>
                  <div className="notes-content">{selectedSession.notes}</div>
                </div>
              )}
              {selectedSession.summary && (
                <div className="detail-section">
                  <div className="label">Summary:</div>
                  <div className="summary-content">
                    <LazyMarkdown content={selectedSession.summary} />
                  </div>
                </div>
              )}
              {selectedSession.feedback && (
                <div className="detail-section">
                  <div className="label">Your Feedback:</div>
                  <div className="feedback-content">{selectedSession.feedback}</div>
                  {selectedSession.rating && (
                    <div className="feedback-rating">
                      {renderStars(selectedSession.rating)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedSession(null);
          setFeedbackText('');
          setFeedbackRating(5);
        }}
        title="Add Feedback"
      >
        <div className="feedback-modal">
          <p>How was your session with {selectedSession?.partnerName}?</p>
          
          <div className="rating-input">
            <label>Rating:</label>
            <div className="stars-input">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`star-button ${star <= feedbackRating ? 'selected' : ''}`}
                  onClick={() => setFeedbackRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="feedback-input">
            <label>Feedback (optional):</label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
            />
          </div>

          <div className="modal-actions">
            <AppButton
              variant="secondary"
              onClick={() => {
                setShowFeedbackModal(false);
                setSelectedSession(null);
                setFeedbackText('');
                setFeedbackRating(5);
              }}
            >
              Cancel
            </AppButton>
            <AppButton onClick={handleSubmitFeedback}>
              Submit Feedback
            </AppButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PastSessionsView;
