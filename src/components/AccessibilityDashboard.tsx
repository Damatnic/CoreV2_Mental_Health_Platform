import React, { useState } from 'react';
import { Eye, Volume2, Type, Palette, Keyboard, Monitor } from 'lucide-react';
import '../styles/AccessibilityDashboard.css';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large';
  contrast: 'normal' | 'high';
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNav: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

const AccessibilityDashboard: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    contrast: 'normal',
    reduceMotion: false,
    screenReader: false,
    keyboardNav: true,
    colorBlindMode: 'none'
  });

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Apply settings to document
    applySettings({ ...settings, [key]: value });
  };

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Font size
    const fontSizes = { small: '14px', medium: '16px', large: '20px' };
    root.style.setProperty('--base-font-size', fontSizes[newSettings.fontSize]);
    
    // Contrast
    root.setAttribute('data-contrast', newSettings.contrast);
    
    // Other attributes
    root.setAttribute('data-reduce-motion', String(newSettings.reduceMotion));
    root.setAttribute('data-screen-reader', String(newSettings.screenReader));
    root.setAttribute('data-colorblind', newSettings.colorBlindMode);
  };

  return (
    <div className="accessibility-dashboard">
      <div className="dashboard-header">
        <Eye size={24} />
        <h2>Accessibility Settings</h2>
      </div>

      <div className="settings-grid">
        <div className="setting-card">
          <div className="setting-header">
            <Type size={20} />
            <h3>Text Size</h3>
          </div>
          <div className="setting-options">
            {(['small', 'medium', 'large'] as const).map(size => (
              <button
                key={size}
                className={`option-btn ${settings.fontSize === size ? 'active' : ''}`}
                onClick={() => updateSetting('fontSize', size)}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-header">
            <Monitor size={20} />
            <h3>Contrast</h3>
          </div>
          <div className="setting-options">
            <button
              className={`option-btn ${settings.contrast === 'normal' ? 'active' : ''}`}
              onClick={() => updateSetting('contrast', 'normal')}
            >
              Normal
            </button>
            <button
              className={`option-btn ${settings.contrast === 'high' ? 'active' : ''}`}
              onClick={() => updateSetting('contrast', 'high')}
            >
              High Contrast
            </button>
          </div>
        </div>

        <div className="setting-card">
          <div className="setting-header">
            <Palette size={20} />
            <h3>Color Blind Mode</h3>
          </div>
          <select
            value={settings.colorBlindMode}
            onChange={(e) => updateSetting('colorBlindMode', e.target.value as any)}
            className="setting-select"
          >
            <option value="none">None</option>
            <option value="protanopia">Protanopia (Red-Green)</option>
            <option value="deuteranopia">Deuteranopia (Green-Red)</option>
            <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
          </select>
        </div>

        <div className="setting-card toggle-card">
          <div className="setting-header">
            <Volume2 size={20} />
            <h3>Screen Reader</h3>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.screenReader}
              onChange={(e) => updateSetting('screenReader', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-card toggle-card">
          <div className="setting-header">
            <Eye size={20} />
            <h3>Reduce Motion</h3>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-card toggle-card">
          <div className="setting-header">
            <Keyboard size={20} />
            <h3>Keyboard Navigation</h3>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.keyboardNav}
              onChange={(e) => updateSetting('keyboardNav', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="dashboard-footer">
        <button className="reset-btn" onClick={() => window.location.reload()}>
          Reset to Defaults
        </button>
        <p className="help-text">
          These settings are saved automatically and will persist across sessions.
        </p>
      </div>
    </div>
  );
};

export default AccessibilityDashboard;
