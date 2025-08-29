import React, { useState } from 'react';
import { Eye, Volume2, Type } from 'lucide-react';
import '../styles/MobileAccessibilityDashboard.css';

const MobileAccessibilityDashboard: React.FC = () => {
  const [fontSize, setFontSize] = useState('medium');
  const [contrast, setContrast] = useState('normal');
  const [screenReader, setScreenReader] = useState(false);

  return (
    <div className="mobile-accessibility-dashboard">
      <h2>Accessibility Settings</h2>
      
      <div className="setting-card">
        <Type size={24} />
        <label>Font Size</label>
        <select value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div className="setting-card">
        <Eye size={24} />
        <label>Contrast</label>
        <select value={contrast} onChange={(e) => setContrast(e.target.value)}>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="setting-card">
        <Volume2 size={24} />
        <label>Screen Reader</label>
        <input
          type="checkbox"
          checked={screenReader}
          onChange={(e) => setScreenReader(e.target.checked)}
        />
      </div>
    </div>
  );
};

export default MobileAccessibilityDashboard;
