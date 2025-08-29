/**
 * Accessibility Settings Component
 * Comprehensive accessibility configuration for the application
 */

import React, { useState, useEffect } from 'react';
import { Eye, Volume2, Type, Palette, Monitor, Keyboard, Moon, Sun } from 'lucide-react';
import '../styles/AccessibilitySettings.css';

interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrast: 'normal' | 'high' | 'highest';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reduceMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusIndicator: 'default' | 'enhanced' | 'custom';
  theme: 'light' | 'dark' | 'auto';
  textSpacing: 'normal' | 'increased' | 'maximum';
  cursorSize: 'normal' | 'large' | 'extra-large';
}

const AccessibilitySettings: React.FC = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    fontSize: 'medium',
    contrast: 'normal',
    colorBlindMode: 'none',
    reduceMotion: false,
    screenReaderMode: false,
    keyboardNavigation: true,
    focusIndicator: 'default',
    theme: 'auto',
    textSpacing: 'normal',
    cursorSize: 'normal'
  });

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    if (previewMode) {
      applyPreferences(preferences);
    }
  }, [preferences, previewMode]);

  const loadPreferences = () => {
    const saved = localStorage.getItem('accessibilityPreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  };

  const savePreferences = () => {
    localStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
    applyPreferences(preferences);
  };

  const applyPreferences = (prefs: AccessibilityPreferences) => {
    const root = document.documentElement;
    
    // Apply font size
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[prefs.fontSize]);
    
    // Apply contrast
    root.setAttribute('data-contrast', prefs.contrast);
    
    // Apply color blind mode
    root.setAttribute('data-color-blind-mode', prefs.colorBlindMode);
    
    // Apply motion preference
    root.setAttribute('data-reduce-motion', String(prefs.reduceMotion));
    
    // Apply theme
    root.setAttribute('data-theme', prefs.theme);
    
    // Apply text spacing
    root.setAttribute('data-text-spacing', prefs.textSpacing);
  };

  const resetToDefaults = () => {
    const defaults: AccessibilityPreferences = {
      fontSize: 'medium',
      contrast: 'normal',
      colorBlindMode: 'none',
      reduceMotion: false,
      screenReaderMode: false,
      keyboardNavigation: true,
      focusIndicator: 'default',
      theme: 'auto',
      textSpacing: 'normal',
      cursorSize: 'normal'
    };
    setPreferences(defaults);
  };

  const updatePreference = <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="accessibility-settings">
      <div className="settings-header">
        <h2>Accessibility Settings</h2>
        <p>Customize your experience for better accessibility</p>
      </div>

      <div className="settings-actions">
        <label className="preview-toggle">
          <input
            type="checkbox"
            checked={previewMode}
            onChange={(e) => setPreviewMode(e.target.checked)}
          />
          <span>Preview Changes</span>
        </label>
        <button onClick={resetToDefaults} className="reset-btn">
          Reset to Defaults
        </button>
      </div>

      <div className="settings-groups">
        {/* Visual Settings */}
        <div className="settings-group">
          <h3><Eye size={20} /> Visual</h3>
          
          <div className="setting-item">
            <label htmlFor="fontSize">Font Size</label>
            <select
              id="fontSize"
              value={preferences.fontSize}
              onChange={(e) => updatePreference('fontSize', e.target.value as any)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="contrast">Contrast</label>
            <select
              id="contrast"
              value={preferences.contrast}
              onChange={(e) => updatePreference('contrast', e.target.value as any)}
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="highest">Highest</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="colorBlindMode">Color Blind Mode</label>
            <select
              id="colorBlindMode"
              value={preferences.colorBlindMode}
              onChange={(e) => updatePreference('colorBlindMode', e.target.value as any)}
            >
              <option value="none">None</option>
              <option value="protanopia">Protanopia (Red-Green)</option>
              <option value="deuteranopia">Deuteranopia (Red-Green)</option>
              <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="theme">Theme</label>
            <div className="theme-selector">
              <button
                className={preferences.theme === 'light' ? 'active' : ''}
                onClick={() => updatePreference('theme', 'light')}
              >
                <Sun size={16} /> Light
              </button>
              <button
                className={preferences.theme === 'dark' ? 'active' : ''}
                onClick={() => updatePreference('theme', 'dark')}
              >
                <Moon size={16} /> Dark
              </button>
              <button
                className={preferences.theme === 'auto' ? 'active' : ''}
                onClick={() => updatePreference('theme', 'auto')}
              >
                Auto
              </button>
            </div>
          </div>
        </div>

        {/* Motion & Animation */}
        <div className="settings-group">
          <h3><Monitor size={20} /> Motion & Animation</h3>
          
          <div className="setting-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={preferences.reduceMotion}
                onChange={(e) => updatePreference('reduceMotion', e.target.checked)}
              />
              <span>Reduce Motion</span>
              <small>Minimize animations and transitions</small>
            </label>
          </div>
        </div>

        {/* Navigation */}
        <div className="settings-group">
          <h3><Keyboard size={20} /> Navigation</h3>
          
          <div className="setting-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={preferences.keyboardNavigation}
                onChange={(e) => updatePreference('keyboardNavigation', e.target.checked)}
              />
              <span>Enhanced Keyboard Navigation</span>
              <small>Navigate using keyboard shortcuts</small>
            </label>
          </div>

          <div className="setting-item">
            <label htmlFor="focusIndicator">Focus Indicator</label>
            <select
              id="focusIndicator"
              value={preferences.focusIndicator}
              onChange={(e) => updatePreference('focusIndicator', e.target.value as any)}
            >
              <option value="default">Default</option>
              <option value="enhanced">Enhanced</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Screen Reader */}
        <div className="settings-group">
          <h3><Volume2 size={20} /> Screen Reader</h3>
          
          <div className="setting-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={preferences.screenReaderMode}
                onChange={(e) => updatePreference('screenReaderMode', e.target.checked)}
              />
              <span>Screen Reader Mode</span>
              <small>Optimize for screen readers</small>
            </label>
          </div>
        </div>

        {/* Text & Spacing */}
        <div className="settings-group">
          <h3><Type size={20} /> Text & Spacing</h3>
          
          <div className="setting-item">
            <label htmlFor="textSpacing">Text Spacing</label>
            <select
              id="textSpacing"
              value={preferences.textSpacing}
              onChange={(e) => updatePreference('textSpacing', e.target.value as any)}
            >
              <option value="normal">Normal</option>
              <option value="increased">Increased</option>
              <option value="maximum">Maximum</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="cursorSize">Cursor Size</label>
            <select
              id="cursorSize"
              value={preferences.cursorSize}
              onChange={(e) => updatePreference('cursorSize', e.target.value as any)}
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="cancel-btn">Cancel</button>
        <button className="save-btn" onClick={savePreferences}>
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
