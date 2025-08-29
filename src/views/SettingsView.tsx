import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const SettingsView: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSaveSettings = () => {
    console.log('Saving settings:', {
      notifications,
      darkMode,
      dataSharing
    });
  };

  const handleDeleteAccount = () => {
    console.log('Account deletion requested');
    setShowDeleteModal(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and privacy settings</p>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <h2>Notifications</h2>
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              <span>Enable push notifications</span>
            </label>
            <p className="setting-description">
              Receive notifications for important updates and reminders
            </p>
          </div>
        </section>

        <section className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
              <span>Dark mode</span>
            </label>
            <p className="setting-description">
              Use dark theme for better viewing in low light
            </p>
          </div>
        </section>

        <section className="settings-section">
          <h2>Privacy</h2>
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={dataSharing}
                onChange={(e) => setDataSharing(e.target.checked)}
              />
              <span>Share anonymous usage data</span>
            </label>
            <p className="setting-description">
              Help improve the app by sharing anonymous usage statistics
            </p>
          </div>
        </section>

        <section className="settings-section">
          <h2>Account</h2>
          <div className="setting-item">
            <div className="account-info">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>Member since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2>Actions</h2>
          <div className="setting-actions">
            <button 
              className="action-button save-button"
              onClick={handleSaveSettings}
            >
              Save Settings
            </button>
            
            <button 
              className="action-button logout-button"
              onClick={handleLogout}
            >
              Sign Out
            </button>
            
            <button 
              className="action-button delete-button"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Account</h3>
            <p>
              Are you sure you want to delete your account? This action cannot be undone 
              and will permanently remove all your data.
            </p>
            <div className="modal-actions">
              <button 
                className="modal-button confirm-button"
                onClick={handleDeleteAccount}
              >
                Yes, Delete Account
              </button>
              <button 
                className="modal-button cancel-button"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="settings-footer">
        <div className="support-links">
          <h3>Need Help?</h3>
          <ul>
            <li><a href="/help">Help Center</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Service</a></li>
            <li><a href="mailto:support@corev2.com">Contact Support</a></li>
          </ul>
        </div>
        
        <div className="crisis-notice">
          <p>
            <strong>Crisis Support:</strong> If you need immediate help, 
            contact <a href="tel:988">988</a> or <a href="tel:911">911</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;