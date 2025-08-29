import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Helper, ViewProps } from '../types';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { CertifiedIcon, HeartIcon, SparkleIcon } from '../components/icons.dynamic';
import { Modal } from '../components/ui/Modal';
import { AppTextArea } from '../components/AppTextArea';
import { CATEGORIES } from '../constants';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

interface PublicHelperProfileViewProps extends ViewProps {
  helperId?: string;
}

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  timestamp: string;
  isAnonymous: boolean;
}

interface Session {
  id: string;
  date: string;
  duration: number;
  topic: string;
  rating?: number;
  status: 'completed' | 'scheduled' | 'cancelled';
}

const PublicHelperProfileView: React.FC<PublicHelperProfileViewProps> = ({ 
  helperId = 'helper-1' 
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [helper, setHelper] = useState<Helper | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isAnonymousReview, setIsAnonymousReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'sessions'>('about');

  useEffect(() => {
    loadHelperProfile();
  }, [helperId]);

  const loadHelperProfile = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      const mockHelper: Helper = {
        id: helperId,
        name: 'Sarah Chen',
        displayName: 'Sarah Chen',
        email: 'sarah.chen@example.com',
        bio: 'Licensed therapist with 8 years of experience specializing in anxiety, depression, and trauma recovery. I believe in creating a safe, non-judgmental space where healing can happen.',
        specializations: ['anxiety', 'depression', 'trauma', 'relationships'],
        certifications: [
          'Licensed Clinical Social Worker (LCSW)',
          'Trauma-Informed Care Certificate',
          'Cognitive Behavioral Therapy (CBT)'
        ],
        languages: ['English', 'Mandarin'],
        availability: {
          timezone: 'PST',
          schedule: {
            monday: [{ start: '09:00', end: '17:00' }],
            tuesday: [{ start: '09:00', end: '17:00' }],
            wednesday: [{ start: '09:00', end: '17:00' }],
            thursday: [{ start: '09:00', end: '17:00' }],
            friday: [{ start: '09:00', end: '15:00' }],
            saturday: [],
            sunday: []
          }
        },
        rating: 4.8,
        totalSessions: 342,
        responseTime: 'Usually responds within 2 hours',
        isVerified: true,
        joinedDate: '2022-03-15',
        lastActive: new Date().toISOString(),
        profileImage: undefined,
        hourlyRate: 85,
        acceptsInsurance: true,
        insuranceProviders: ['Blue Cross', 'Aetna', 'Cigna', 'United Healthcare'],
        approach: 'I use a combination of cognitive-behavioral therapy (CBT) and mindfulness-based approaches, tailored to each individual\'s unique needs and goals.',
        education: [
          'MSW - Clinical Social Work, University of California, Berkeley',
          'BA - Psychology, Stanford University'
        ],
        yearsOfExperience: 8,
        isAvailable: true,
        verificationStatus: 'verified',
        createdAt: '2022-03-15',
        updatedAt: new Date().toISOString()
      };
      
      const mockReviews: Review[] = [
        {
          id: '1',
          reviewerId: 'user-1',
          reviewerName: 'Anonymous',
          rating: 5,
          comment: 'Sarah has been incredibly helpful in my journey with anxiety. Her approach is gentle yet effective, and I always feel heard and understood.',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          isAnonymous: true
        },
        {
          id: '2',
          reviewerId: 'user-2',
          reviewerName: 'Alex M.',
          rating: 5,
          comment: 'Professional, compassionate, and knowledgeable. Sarah helped me develop coping strategies that have made a real difference in my daily life.',
          timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          isAnonymous: false
        },
        {
          id: '3',
          reviewerId: 'user-3',
          reviewerName: 'Anonymous',
          rating: 4,
          comment: 'Great therapist with excellent communication skills. The sessions are always productive and I feel supported.',
          timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          isAnonymous: true
        }
      ];
      
      const mockSessions: Session[] = [
        {
          id: '1',
          date: '2024-01-15',
          duration: 60,
          topic: 'Anxiety Management',
          rating: 5,
          status: 'completed'
        },
        {
          id: '2',
          date: '2024-01-22',
          duration: 60,
          topic: 'Coping Strategies',
          rating: 5,
          status: 'completed'
        },
        {
          id: '3',
          date: '2024-01-29',
          duration: 60,
          topic: 'Follow-up Session',
          status: 'scheduled'
        }
      ];
      
      setHelper(mockHelper);
      setReviews(mockReviews);
      setSessions(mockSessions);
      
    } catch (error) {
      console.error('Error loading helper profile:', error);
      showNotification('Failed to load helper profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactHelper = async () => {
    if (!contactMessage.trim()) {
      showNotification('Please enter a message', 'error');
      return;
    }

    try {
      // Simulate sending message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification('Message sent successfully!', 'success');
      setContactMessage('');
      setShowContactModal(false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message', 'error');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      showNotification('Please enter a review', 'error');
      return;
    }

    try {
      const newReview: Review = {
        id: Date.now().toString(),
        reviewerId: user?.id || 'anonymous',
        reviewerName: isAnonymousReview ? 'Anonymous' : (user?.username || 'Anonymous'),
        rating: reviewRating,
        comment: reviewText,
        timestamp: new Date().toISOString(),
        isAnonymous: isAnonymousReview
      };
      
      setReviews(prev => [newReview, ...prev]);
      showNotification('Review submitted successfully!', 'success');
      setReviewText('');
      setReviewRating(5);
      setIsAnonymousReview(false);
      setShowReviewModal(false);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      showNotification('Failed to submit review', 'error');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
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
      <div className="public-helper-profile">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading helper profile...</p>
        </div>
      </div>
    );
  }

  if (!helper) {
    return (
      <div className="public-helper-profile">
        <div className="error-state">
          <h2>Helper Not Found</h2>
          <p>The helper profile you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-helper-profile">
      <div className="profile-header">
        <div className="profile-main">
          <div className="profile-avatar">
            {helper.profileImage ? (
              <img src={helper.profileImage} alt={helper.displayName} />
            ) : (
              <div className="avatar-placeholder">
                {helper.displayName?.charAt(0) || 'H'}
              </div>
            )}
          </div>
          
          <div className="profile-info">
            <div className="profile-name">
              <h1>{helper.displayName}</h1>
              {helper.isVerified && (
                <div className="verified-badge">
                  <CertifiedIcon />
                  <span>Verified</span>
                </div>
              )}
            </div>
            
            <div className="profile-stats">
              <div className="stat">
                <div className="stat-value">{helper.rating}</div>
                <div className="stat-label">Rating</div>
                {renderStars(helper.rating || 0)}
              </div>
              <div className="stat">
                <div className="stat-value">{helper.totalSessions}</div>
                <div className="stat-label">Sessions</div>
              </div>
              <div className="stat">
                <div className="stat-value">{helper.yearsOfExperience}</div>
                <div className="stat-label">Years Experience</div>
              </div>
            </div>
            
            <div className="profile-meta">
              <span className="response-time">{helper.responseTime}</span>
              <span className="hourly-rate">${helper.hourlyRate}/hour</span>
              {helper.acceptsInsurance && (
                <span className="insurance">Accepts Insurance</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="profile-actions">
          <AppButton
            onClick={() => setShowContactModal(true)}
            className="contact-button"
          >
            Contact Helper
          </AppButton>
          <AppButton
            variant="secondary"
            onClick={() => setShowReviewModal(true)}
          >
            Leave Review
          </AppButton>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({reviews.length})
        </button>
        <button
          className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'about' && (
          <div className="about-section">
            <Card className="about-card">
              <h2>About</h2>
              <p className="bio">{helper.bio}</p>
              
              <div className="about-details">
                <div className="detail-group">
                  <h3>Approach</h3>
                  <p>{helper.approach}</p>
                </div>
                
                <div className="detail-group">
                  <h3>Specializations</h3>
                  <div className="specializations">
                    {helper.specializations?.map(spec => (
                      <span key={spec} className="specialization-tag">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="detail-group">
                  <h3>Certifications</h3>
                  <ul className="certifications">
                    {helper.certifications?.map((cert, index) => (
                      <li key={index}>{cert}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="detail-group">
                  <h3>Education</h3>
                  <ul className="education">
                    {helper.education?.map((edu, index) => (
                      <li key={index}>{edu}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="detail-group">
                  <h3>Languages</h3>
                  <div className="languages">
                    {helper.languages?.map(lang => (
                      <span key={lang} className="language-tag">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
                
                {helper.insuranceProviders && (
                  <div className="detail-group">
                    <h3>Insurance Accepted</h3>
                    <div className="insurance-providers">
                      {helper.insuranceProviders.map(provider => (
                        <span key={provider} className="insurance-tag">
                          {provider}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-section">
            {reviews.length === 0 ? (
              <Card className="empty-reviews">
                <h3>No reviews yet</h3>
                <p>Be the first to leave a review for this helper!</p>
              </Card>
            ) : (
              <div className="reviews-list">
                {reviews.map(review => (
                  <Card key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-name">{review.reviewerName}</div>
                        <div className="review-date">{formatTimeAgo(review.timestamp)}</div>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    <div className="review-content">
                      <p>{review.comment}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="sessions-section">
            {sessions.length === 0 ? (
              <Card className="empty-sessions">
                <h3>No sessions yet</h3>
                <p>Book your first session with this helper!</p>
              </Card>
            ) : (
              <div className="sessions-list">
                {sessions.map(session => (
                  <Card key={session.id} className="session-card">
                    <div className="session-header">
                      <div className="session-date">{formatDate(session.date)}</div>
                      <div className={`session-status ${session.status}`}>
                        {session.status}
                      </div>
                    </div>
                    <div className="session-details">
                      <div className="session-topic">{session.topic}</div>
                      <div className="session-duration">{session.duration} minutes</div>
                      {session.rating && (
                        <div className="session-rating">
                          {renderStars(session.rating)}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Contact Helper"
      >
        <div className="contact-modal">
          <p>Send a message to {helper.displayName}</p>
          <AppTextArea
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Hi, I'd like to schedule a session..."
            rows={4}
          />
          <div className="modal-actions">
            <AppButton
              variant="secondary"
              onClick={() => setShowContactModal(false)}
            >
              Cancel
            </AppButton>
            <AppButton onClick={handleContactHelper}>
              Send Message
            </AppButton>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Leave a Review"
      >
        <div className="review-modal">
          <div className="rating-input">
            <label>Rating</label>
            <div className="stars-input">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`star-button ${star <= reviewRating ? 'selected' : ''}`}
                  onClick={() => setReviewRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <AppTextArea
            label="Review"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this helper..."
            rows={4}
          />
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isAnonymousReview}
              onChange={(e) => setIsAnonymousReview(e.target.checked)}
            />
            Post anonymously
          </label>
          
          <div className="modal-actions">
            <AppButton
              variant="secondary"
              onClick={() => setShowReviewModal(false)}
            >
              Cancel
            </AppButton>
            <AppButton onClick={handleSubmitReview}>
              Submit Review
            </AppButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PublicHelperProfileView;
