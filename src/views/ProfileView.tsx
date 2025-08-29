import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const ProfileView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-view">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {user?.firstName?.[0] || user?.username?.[0] || '👤'}
          </div>
        </div>

        <div className="profile-info">
          {!isEditing ? (
            <div className="view-mode">
              <div className="info-group">
                <label>Name</label>
                <p>{user?.firstName} {user?.lastName}</p>
              </div>
              
              <div className="info-group">
                <label>Username</label>
                <p>{user?.username}</p>
              </div>
              
              <div className="info-group">
                <label>Email</label>
                <p>{user?.email}</p>
              </div>
              
              <div className="info-group">
                <label>Role</label>
                <p>{user?.role}</p>
              </div>
              
              <div className="info-group">
                <label>Member Since</label>
                <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
              </div>

              <button 
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
                      </div>
          ) : (
            <div className="edit-mode">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
                    </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button 
                  className="save-button"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
                <button 
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="profile-stats">
        <h2>Activity Summary</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <h3>7</h3>
            <p>Days Active</p>
          </div>
          <div className="stat-item">
            <h3>12</h3>
            <p>AI Conversations</p>
          </div>
          <div className="stat-item">
            <h3>5</h3>
            <p>Community Posts</p>
          </div>
          <div className="stat-item">
            <h3>3</h3>
            <p>Assessments Completed</p>
          </div>
                </div>
              </div>

      <div className="profile-preferences">
        <h2>Preferences</h2>
        <div className="preferences-grid">
          <div className="preference-item">
            <h4>Notifications</h4>
            <p>Manage your notification settings</p>
            <button className="preference-button">Configure</button>
          </div>
          <div className="preference-item">
            <h4>Privacy</h4>
            <p>Control your privacy settings</p>
            <button className="preference-button">Configure</button>
          </div>
          <div className="preference-item">
            <h4>Accessibility</h4>
            <p>Customize accessibility options</p>
            <button className="preference-button">Configure</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;