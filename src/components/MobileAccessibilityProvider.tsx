import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrast: 'normal' | 'high';
  reduceMotion: boolean;
  screenReader: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  focusIndicator: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  contrast: 'normal',
  reduceMotion: false,
  screenReader: false,
  colorBlindMode: 'none',
  focusIndicator: true
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface MobileAccessibilityProviderProps {
  children: React.ReactNode;
}

const MobileAccessibilityProvider: React.FC<MobileAccessibilityProviderProps> = ({ 
  children 
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    // Apply settings to document
    const root = document.documentElement;
    
    // Font size
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);
    
    // Contrast
    root.setAttribute('data-contrast', settings.contrast);
    
    // Reduce motion
    root.setAttribute('data-reduce-motion', String(settings.reduceMotion));
    
    // Screen reader mode
    root.setAttribute('data-screen-reader', String(settings.screenReader));
    
    // Color blind mode
    root.setAttribute('data-colorblind', settings.colorBlindMode);
    
    // Focus indicator
    root.setAttribute('data-focus-indicator', String(settings.focusIndicator));
    
    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    resetSettings
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default MobileAccessibilityProvider;
