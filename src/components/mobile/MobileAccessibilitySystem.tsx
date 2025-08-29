import React, { useState, useEffect } from 'react';
import { Eye, Ear, Hand } from 'lucide-react';
import '../../styles/MobileAccessibilitySystem.css';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrast: 'normal' | 'high';
  reducedMotion: boolean;
  hapticFeedback: boolean;
  voiceOver: boolean;
  magnification: boolean;
}

const MobileAccessibilitySystem: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    contrast: 'normal',
    reducedMotion: false,
    hapticFeedback: true,
    voiceOver: false,
    magnification: false
  });

  useEffect(() => {
    // Apply accessibility settings
    const root = document.documentElement;
    root.style.fontSize = getFontSizeValue(settings.fontSize);
    root.className = root.className.replace(/contrast-\w+/g, '');
    root.classList.add(`contrast-${settings.contrast}`);
    
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  const getFontSizeValue = (size: string) => {
    const sizes = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '22px'
    };
    return sizes[size as keyof typeof sizes];
  };

  const handleHapticFeedback = () => {
    if (settings.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className="mobile-accessibility-system">
      <div className="system-header">
        <Eye size={24} />
        <h2>Mobile Accessibility</h2>
      </div>

      <div className="accessibility-options">
        <div className="option-group">
          <h3>Visual</h3>
          
          <div className="option-item">
            <Eye size={20} />
            <div className="option-content">
              <label>Font Size</label>
              <select 
                value={settings.fontSize}
                onChange={(e) => setSettings({...settings, fontSize: e.target.value as any})}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>
          </div>

          <div className="option-item">
            <label>
              <input
                type="checkbox"
                checked={settings.contrast === 'high'}
                onChange={(e) => setSettings({...settings, contrast: e.target.checked ? 'high' : 'normal'})}
              />
              High Contrast Mode
            </label>
          </div>
        </div>

        <div className="option-group">
          <h3>Motion</h3>
          
          <div className="option-item">
            <label>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => setSettings({...settings, reducedMotion: e.target.checked})}
              />
              Reduce Motion & Animations
            </label>
          </div>
        </div>

        <div className="option-group">
          <h3>Touch & Haptics</h3>
          
          <div className="option-item">
            <Hand size={20} />
            <label>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => {
                  setSettings({...settings, hapticFeedback: e.target.checked});
                  handleHapticFeedback();
                }}
              />
              Haptic Feedback
            </label>
          </div>
        </div>

        <div className="option-group">
          <h3>Screen Reader</h3>
          
          <div className="option-item">
            <Ear size={20} />
            <label>
              <input
                type="checkbox"
                checked={settings.voiceOver}
                onChange={(e) => setSettings({...settings, voiceOver: e.target.checked})}
              />
              Enhanced Screen Reader Support
            </label>
          </div>
        </div>
      </div>

      <div className="accessibility-tips">
        <h3>Mobile Tips</h3>
        <ul>
          <li>Use device settings for system-wide changes</li>
          <li>Enable VoiceOver or TalkBack for full screen reading</li>
          <li>Adjust display zoom in device accessibility settings</li>
        </ul>
      </div>
    </div>
  );
};

export default MobileAccessibilitySystem;
