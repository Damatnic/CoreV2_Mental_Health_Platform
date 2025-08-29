import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, SaveIcon, CancelIcon, VerifiedIcon, StarIcon, MessageIcon } from '../components/icons.dynamic';

interface HelperProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  specializations: string[];
  experience: string;
  certifications: string[];
  languages: string[];
  availability: {
    timezone: string;
    schedule: Record<string, { start: string; end: string; available: boolean }>;
    responseTime: string;
  };
  stats: {
    totalSessions: number;
    totalHours: number;
    averageRating: number;
    totalReviews: number;
    helpfulVotes: number;
    completedTraining: number;
  };
  isVerified: boolean;
  isActive: boolean;
  joinedDate: Date;
  lastActive: Date;
  profileImage?: string;
  contactPreferences: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    emergencyOnly: boolean;
  };
}

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  date: Date;
  sessionType: string;
  isAnonymous: boolean;
}

const HelperProfileView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [profile, setProfile] = useState<HelperProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<HelperProfile>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'schedule' | 'settings'>('overview');

  useEffect(() => {
    loadHelperProfile();
    loadReviews();
  }, [user]);

  const loadHelperProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Mock profile data
      const mockProfile: HelperProfile = {
        id: 'helper-1',
        userId: user.id,
        displayName: user.username || 'Helper Name',
        bio: 'Experienced peer supporter with a background in anxiety and depression recovery. I believe in the power of shared experiences and hope.',
        specializations: ['Anxiety', 'Depression', 'PTSD', 'Grief & Loss'],
        experience: '3 years of peer support experience',
        certifications: ['Certified Peer Support Specialist', 'Mental Health First Aid', 'Crisis Intervention'],
        languages: ['English', 'Spanish'],
        availability: {
          timezone: 'EST',
          schedule: {
            monday: { start: '09:00', end: '17:00', available: true },
            tuesday: { start: '09:00', end: '17:00', available: true },
            wednesday: { start: '09:00', end: '17:00', available: true },
            thursday: { start: '09:00', end: '17:00', available: true },
            friday: { start: '09:00', end: '17:00', available: true },
            saturday: { start: '10:00', end: '14:00', available: true },
            sunday: { start: '10:00', end: '14:00', available: false }
          },
          responseTime: 'Within 2 hours'
        },
        stats: {
          totalSessions: 156,
          totalHours: 234,
          averageRating: 4.8,
          totalReviews: 89,
          helpfulVotes: 234,
          completedTraining: 12
        },
        isVerified: true,
        isActive: true,
        joinedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - 30 * 60 * 1000),
        contactPreferences: {
          email: true,
          sms: false,
          inApp: true,
          emergencyOnly: false
        }
      };

      setProfile(mockProfile);
      setEditForm(mockProfile);
      
    } catch (error) {
      console.error('Error loading profile:', error);
      showNotification('Failed to load helper profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      // Mock reviews data
      const mockReviews: Review[] = [
        {
          id: '1',
          reviewerId: 'user-1',
          reviewerName: 'Anonymous',
          rating: 5,
          comment: 'Incredibly supportive and understanding. Really helped me through a difficult time.',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          sessionType: 'One-on-one chat',
          isAnonymous: true
        },
        {
          id: '2',
          reviewerId: 'user-2',
          reviewerName: 'Sarah M.',
          rating: 5,
          comment: 'Great listener with practical advice. Highly recommend!',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          sessionType: 'Video call',
          isAnonymous: false
        },
        {
          id: '3',
          reviewerId: 'user-3',
          reviewerName: 'Anonymous',
          rating: 4,
          comment: 'Very helpful and patient. Appreciated the non-judgmental approach.',
          date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
          sessionType: 'Group session',
          isAnonymous: true
        }
      ];

      setReviews(mockReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(prev => ({ ...prev!, ...editForm }));
      setIsEditing(false);
      showNotification('Profile updated successfully', 'success');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Failed to update profile', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditForm(profile || {});
    setIsEditing(false);
  };

  const handleScheduleChange = (day: string, field: 'start' | 'end' | 'available', value: string | boolean) => {
    setEditForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability!,
        schedule: {
          ...prev.availability!.schedule,
          [day]: {
            ...prev.availability!.schedule[day],
            [field]: value
          }
        }
      }
    }));
  };

  const toggleActiveStatus = async () => {
    try {
      const newStatus = !profile?.isActive;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProfile(prev => ({ ...prev!, isActive: newStatus }));
      showNotification(
        'success', 
        newStatus ? 'Profile activated - you are now visible to seekers' : 'Profile deactivated - you are hidden from seekers'
      );
      
    } catch (error) {
      console.error('Error toggling status:', error);
      showNotification('Failed to update status', 'error');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading helper profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="error-container">
        <p>Helper profile not found</p>
        <AppButton onClick={loadHelperProfile}>Retry</AppButton>
      </div>
    );
  }

  return (
    <div className="helper-profile-view">
      <ViewHeader
        title="Helper Profile"
        subtitle="Manage your helper profile and availability"
      />

      {/* Profile Status */}
      <Card className="status-card">
        <div className="status-info">
          <div className="status-indicator">
            <div className={`status-dot ${profile.isActive ? 'active' : 'inactive'}`} />
            <span>{profile.isActive ? 'Active' : 'Inactive'}</span>
            {profile.isVerified && (
              <VerifiedIcon className="verified-icon text-blue-500" />
            )}
          </div>
          <p>
            {profile.isActive 
              ? 'Your profile is visible to help seekers' 
              : 'Your profile is hidden from help seekers'}
          </p>
        </div>
        <AppButton
          variant={profile.isActive ? 'danger' : 'success'}
          onClick={toggleActiveStatus}
        >
          {profile.isActive ? 'Deactivate' : 'Activate'}
        </AppButton>
      </Card>

      {/* Navigation Tabs */}
      <div className="tab-navigation">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({reviews.length})
        </button>
        <button
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Schedule
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <Card className="stat-card">
              <div className="stat-value">{profile.stats.totalSessions}</div>
              <div className="stat-label">Total Sessions</div>
            </Card>
            <Card className="stat-card">
              <div className="stat-value">{profile.stats.totalHours}</div>
              <div className="stat-label">Hours Helped</div>
            </Card>
            <Card className="stat-card">
              <div className="stat-value">{profile.stats.averageRating.toFixed(1)}</div>
              <div className="stat-label">Average Rating</div>
            </Card>
            <Card className="stat-card">
              <div className="stat-value">{profile.stats.helpfulVotes}</div>
              <div className="stat-label">Helpful Votes</div>
            </Card>
          </div>

          {/* Profile Information */}
          <Card className="profile-info-card">
            <div className="card-header">
              <h3>Profile Information</h3>
              <AppButton
                variant="secondary"
                size="small"
                onClick={() => setIsEditing(!isEditing)}
              >
                <EditIcon /> {isEditing ? 'Cancel' : 'Edit'}
              </AppButton>
            </div>

            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Display Name</label>
                  <AppInput
                    value={editForm.displayName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your display name"
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={editForm.bio || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell others about your experience and approach"
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label>Experience</label>
                  <AppInput
                    value={editForm.experience || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Years of experience or relevant background"
                  />
                </div>

                <div className="form-actions">
                  <AppButton variant="secondary" onClick={handleCancelEdit}>
                    <CancelIcon /> Cancel
                  </AppButton>
                  <AppButton variant="primary" onClick={handleSaveProfile}>
                    <SaveIcon /> Save Changes
                  </AppButton>
                </div>
              </div>
            ) : (
              <div className="profile-display">
                <h4>{profile.displayName}</h4>
                <p className="bio">{profile.bio}</p>
                
                <div className="profile-details">
                  <div className="detail-item">
                    <strong>Experience:</strong> {profile.experience}
                  </div>
                  <div className="detail-item">
                    <strong>Specializations:</strong> {profile.specializations.join(', ')}
                  </div>
                  <div className="detail-item">
                    <strong>Languages:</strong> {profile.languages.join(', ')}
                  </div>
                  <div className="detail-item">
                    <strong>Certifications:</strong> {profile.certifications.join(', ')}
                  </div>
                  <div className="detail-item">
                    <strong>Joined:</strong> {formatDate(profile.joinedDate)}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="reviews-content">
          <Card className="reviews-summary">
            <div className="rating-overview">
              <div className="average-rating">
                <span className="rating-number">{profile.stats.averageRating.toFixed(1)}</span>
                <div className="stars">
                  {renderStars(Math.round(profile.stats.averageRating))}
                </div>
                <span className="review-count">Based on {profile.stats.totalReviews} reviews</span>
              </div>
            </div>
          </Card>

          <div className="reviews-list">
            {reviews.map(review => (
              <Card key={review.id} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <span className="reviewer-name">{review.reviewerName}</span>
                    <span className="review-date">{formatDate(review.date)}</span>
                  </div>
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
                <div className="review-meta">
                  <span className="session-type">{review.sessionType}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="schedule-content">
          <Card className="schedule-card">
            <h3>Availability Schedule</h3>
            <p>Set your weekly availability for helping others</p>
            
            <div className="schedule-grid">
              {Object.entries(profile.availability.schedule).map(([day, schedule]) => (
                <div key={day} className="schedule-day">
                  <div className="day-header">
                    <label className="day-name">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </label>
                    <input
                      type="checkbox"
                      checked={schedule.available}
                      onChange={(e) => handleScheduleChange(day, 'available', e.target.checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  {schedule.available && (
                    <div className="time-inputs">
                      <input
                        type="time"
                        value={schedule.start}
                        onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                        disabled={!isEditing}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={schedule.end}
                        onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="schedule-settings">
              <div className="setting-item">
                <label>Timezone:</label>
                <select
                  value={editForm.availability?.timezone || profile.availability.timezone}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    availability: {
                      ...prev.availability!,
                      timezone: e.target.value
                    }
                  }))}
                  disabled={!isEditing}
                >
                  <option value="EST">Eastern Time (EST)</option>
                  <option value="CST">Central Time (CST)</option>
                  <option value="MST">Mountain Time (MST)</option>
                  <option value="PST">Pacific Time (PST)</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Response Time:</label>
                <select
                  value={editForm.availability?.responseTime || profile.availability.responseTime}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    availability: {
                      ...prev.availability!,
                      responseTime: e.target.value
                    }
                  }))}
                  disabled={!isEditing}
                >
                  <option value="Within 1 hour">Within 1 hour</option>
                  <option value="Within 2 hours">Within 2 hours</option>
                  <option value="Within 4 hours">Within 4 hours</option>
                  <option value="Same day">Same day</option>
                  <option value="Within 24 hours">Within 24 hours</option>
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="schedule-actions">
                <AppButton variant="secondary" onClick={handleCancelEdit}>
                  Cancel
                </AppButton>
                <AppButton variant="primary" onClick={handleSaveProfile}>
                  Save Schedule
                </AppButton>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="settings-content">
          <Card className="settings-card">
            <h3>Contact Preferences</h3>
            <p>Choose how you'd like to be notified about new help requests</p>
            
            <div className="preferences-list">
              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={editForm.contactPreferences?.email || profile.contactPreferences.email}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    contactPreferences: {
                      ...prev.contactPreferences!,
                      email: e.target.checked
                    }
                  }))}
                />
                <span>Email notifications</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={editForm.contactPreferences?.sms || profile.contactPreferences.sms}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    contactPreferences: {
                      ...prev.contactPreferences!,
                      sms: e.target.checked
                    }
                  }))}
                />
                <span>SMS notifications</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={editForm.contactPreferences?.inApp || profile.contactPreferences.inApp}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    contactPreferences: {
                      ...prev.contactPreferences!,
                      inApp: e.target.checked
                    }
                  }))}
                />
                <span>In-app notifications</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={editForm.contactPreferences?.emergencyOnly || profile.contactPreferences.emergencyOnly}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    contactPreferences: {
                      ...prev.contactPreferences!,
                      emergencyOnly: e.target.checked
                    }
                  }))}
                />
                <span>Emergency situations only</span>
              </label>
            </div>

            <AppButton variant="primary" onClick={handleSaveProfile}>
              Save Preferences
            </AppButton>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HelperProfileView;
