import React, { useState } from 'react';
import { Shield, Eye, Lock, Settings } from 'lucide-react';
import '../../styles/PrivacyDashboard.css';

const PrivacyDashboard: React.FC = () => {
  const [privacySettings, setPrivacySettings] = useState({
    dataCollection: false,
    analytics: false,
    crashReporting: true,
    personalizedAds: false
  });

  return (
    <div className="privacy-dashboard">
      <div className="dashboard-header">
        <Shield size={32} />
        <div>
          <h2>Privacy Dashboard</h2>
          <p>Control how your data is collected and used</p>
        </div>
      </div>

      <div className="privacy-sections">
        <div className="privacy-section">
          <div className="section-header">
            <Eye size={24} />
            <h3>Data Collection</h3>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={privacySettings.dataCollection}
                onChange={(e) => setPrivacySettings({
                  ...privacySettings,
                  dataCollection: e.target.checked
                })}
              />
              Allow data collection for service improvement
            </label>
          </div>
        </div>

        <div className="privacy-section">
          <div className="section-header">
            <Lock size={24} />
            <h3>Security Settings</h3>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={privacySettings.crashReporting}
                onChange={(e) => setPrivacySettings({
                  ...privacySettings,
                  crashReporting: e.target.checked
                })}
              />
              Send crash reports to help fix issues
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyDashboard;
