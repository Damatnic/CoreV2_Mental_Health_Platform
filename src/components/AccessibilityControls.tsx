/**
 * Accessibility Controls Component
 * 
 * Comprehensive accessibility control panel with WCAG AAA compliance,
 * real-time adjustments, and therapeutic considerations.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { useGlobalStore } from '../stores/globalStore';
import { motion, AnimatePresence } from 'framer-motion';
import './AccessibilityControls.css';

interface AccessibilityControlsProps {
  position?: 'fixed' | 'relative';
  showLabel?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

export const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({
  position = 'fixed',
  showLabel = true,
  compact = false,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'motor' | 'cognitive' | 'audio'>('visual');
  
  const {
    preferences,
    updatePreferences,
    setFocusMode,
    currentFocusMode,
    isScreenReaderActive,
    toggleHighContrast,
    toggleReducedMotion,
    toggleReadingGuide,
    increaseFontSize,
    decreaseFontSize,
    colorBlindMode,
    announceToScreenReader,
    toggleVoiceControl,
    isVoiceActive,
    activateCrisisMode,
    getAccessibilityStatus
  } = useAccessibility();

  const { 
    accessibilityState,
    updateAccessibilitySettings,
    addNotification 
  } = useGlobalStore();

  // Initialize with saved preferences
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        updatePreferences(settings);
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }
  }, []);

  // Save preferences on change
  useEffect(() => {
    localStorage.setItem('accessibility_settings', JSON.stringify(preferences));
  }, [preferences]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            setIsOpen(!isOpen);
            break;
          case 'h':
            e.preventDefault();
            toggleHighContrast();
            break;
          case 'r':
            e.preventDefault();
            toggleReducedMotion();
            break;
          case '+':
          case '=':
            e.preventDefault();
            increaseFontSize();
            break;
          case '-':
            e.preventDefault();
            decreaseFontSize();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleColorBlindModeChange = useCallback((mode: typeof colorBlindMode) => {
    updatePreferences({ colorBlindMode: mode });
    updateAccessibilitySettings({ colorBlindMode: mode });
    announceToScreenReader(`Color blind mode changed to ${mode === 'none' ? 'normal' : mode}`);
  }, [updatePreferences, updateAccessibilitySettings, announceToScreenReader]);

  const handleFontSizeChange = useCallback((size: typeof preferences.fontSize) => {
    updatePreferences({ fontSize: size });
    updateAccessibilitySettings({ fontSize: size });
    announceToScreenReader(`Font size changed to ${size}`);
  }, [updatePreferences, updateAccessibilitySettings, announceToScreenReader]);

  const handleCustomizationChange = useCallback((key: string, value: any) => {
    updatePreferences({
      customizations: {
        ...preferences.customizations,
        [key]: value
      }
    });
  }, [preferences.customizations, updatePreferences]);

  const resetToDefaults = useCallback(() => {
    const defaults = {
      screenReader: false,
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      keyboardNavigation: true,
      voiceControl: false,
      cognitiveSupport: false,
      therapeuticMode: false,
      crisisAccessibility: false,
      colorBlindMode: 'none' as const,
      fontSize: 'medium' as const,
      customizations: {
        fontSize: 100,
        lineHeight: 1.5,
        letterSpacing: 0,
        focusIndicatorSize: 100,
        animationSpeed: 1,
        cursorSize: 'normal' as const,
        highlightLinks: false,
        readingGuide: false,
        focusHighlight: '#0066CC'
      }
    };
    
    updatePreferences(defaults);
    updateAccessibilitySettings({
      enabled: false,
      screenReaderActive: false,
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      colorBlindMode: 'none',
      keyboardNavigation: true,
      voiceControl: false
    });
    
    addNotification({
      type: 'info',
      title: 'Settings Reset',
      message: 'Accessibility settings have been reset to defaults'
    });
  }, [updatePreferences, updateAccessibilitySettings, addNotification]);

  const exportSettings = useCallback(() => {
    const settings = {
      preferences,
      exportedAt: new Date().toISOString(),
      version: '2.0.0'
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility_settings_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addNotification({
      type: 'success',
      title: 'Settings Exported',
      message: 'Your accessibility settings have been exported'
    });
  }, [preferences, addNotification]);

  const importSettings = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        if (settings.preferences) {
          updatePreferences(settings.preferences);
          addNotification({
            type: 'success',
            title: 'Settings Imported',
            message: 'Your accessibility settings have been imported successfully'
          });
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Import Failed',
          message: 'Failed to import settings. Please check the file format.'
        });
      }
    };
    reader.readAsText(file);
  }, [updatePreferences, addNotification]);

  if (compact) {
    return (
      <button
        className="accessibility-controls-compact"
        onClick={() => setIsOpen(true)}
        aria-label="Open accessibility settings"
        style={{ position }}
      >
        <span className="icon" aria-hidden="true">♿</span>
        {showLabel && <span>Accessibility</span>}
      </button>
    );
  }

  return (
    <>
      <button
        className={`accessibility-controls-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close accessibility settings' : 'Open accessibility settings'}
        aria-expanded={isOpen}
        style={{ position }}
      >
        <span className="icon" aria-hidden="true">♿</span>
        {showLabel && <span>Accessibility</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="accessibility-controls-panel"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: preferences.reducedMotion ? 0.01 : 0.2 }}
            role="dialog"
            aria-label="Accessibility Settings"
            aria-modal="true"
          >
            <div className="panel-header">
              <h2>Accessibility Settings</h2>
              <button
                className="close-button"
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                aria-label="Close accessibility settings"
              >
                ×
              </button>
            </div>

            <div className="panel-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'visual'}
                onClick={() => setActiveTab('visual')}
                className={activeTab === 'visual' ? 'active' : ''}
              >
                Visual
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'motor'}
                onClick={() => setActiveTab('motor')}
                className={activeTab === 'motor' ? 'active' : ''}
              >
                Motor
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'cognitive'}
                onClick={() => setActiveTab('cognitive')}
                className={activeTab === 'cognitive' ? 'active' : ''}
              >
                Cognitive
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'audio'}
                onClick={() => setActiveTab('audio')}
                className={activeTab === 'audio' ? 'active' : ''}
              >
                Audio
              </button>
            </div>

            <div className="panel-content" role="tabpanel">
              {activeTab === 'visual' && (
                <div className="settings-group">
                  <h3>Visual Settings</h3>
                  
                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.highContrast}
                        onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
                      />
                      High Contrast Mode
                    </label>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="font-size">Font Size</label>
                    <select
                      id="font-size"
                      value={preferences.fontSize}
                      onChange={(e) => handleFontSizeChange(e.target.value as any)}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="color-blind-mode">Color Blind Mode</label>
                    <select
                      id="color-blind-mode"
                      value={preferences.colorBlindMode}
                      onChange={(e) => handleColorBlindModeChange(e.target.value as any)}
                    >
                      <option value="none">None</option>
                      <option value="protanopia">Protanopia (Red-Green)</option>
                      <option value="deuteranopia">Deuteranopia (Red-Green)</option>
                      <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
                      <option value="achromatopsia">Achromatopsia (Complete)</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="line-height">Line Height</label>
                    <input
                      type="range"
                      id="line-height"
                      min="1"
                      max="2.5"
                      step="0.1"
                      value={preferences.customizations.lineHeight}
                      onChange={(e) => handleCustomizationChange('lineHeight', parseFloat(e.target.value))}
                    />
                    <span>{preferences.customizations.lineHeight}</span>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="letter-spacing">Letter Spacing</label>
                    <input
                      type="range"
                      id="letter-spacing"
                      min="0"
                      max="0.5"
                      step="0.05"
                      value={preferences.customizations.letterSpacing}
                      onChange={(e) => handleCustomizationChange('letterSpacing', parseFloat(e.target.value))}
                    />
                    <span>{preferences.customizations.letterSpacing}em</span>
                  </div>

                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.customizations.highlightLinks}
                        onChange={(e) => handleCustomizationChange('highlightLinks', e.target.checked)}
                      />
                      Highlight Links
                    </label>
                  </div>

                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.customizations.readingGuide}
                        onChange={(e) => {
                          handleCustomizationChange('readingGuide', e.target.checked);
                          toggleReadingGuide();
                        }}
                      />
                      Reading Guide (for Dyslexia)
                    </label>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="cursor-size">Cursor Size</label>
                    <select
                      id="cursor-size"
                      value={preferences.customizations.cursorSize}
                      onChange={(e) => handleCustomizationChange('cursorSize', e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'motor' && (
                <div className="settings-group">
                  <h3>Motor Settings</h3>
                  
                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.keyboardNavigation}
                        onChange={(e) => updatePreferences({ keyboardNavigation: e.target.checked })}
                      />
                      Enhanced Keyboard Navigation
                    </label>
                  </div>

                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.reducedMotion}
                        onChange={(e) => {
                          updatePreferences({ reducedMotion: e.target.checked });
                          toggleReducedMotion();
                        }}
                      />
                      Reduce Motion
                    </label>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="animation-speed">Animation Speed</label>
                    <input
                      type="range"
                      id="animation-speed"
                      min="0"
                      max="1"
                      step="0.1"
                      value={preferences.customizations.animationSpeed}
                      onChange={(e) => handleCustomizationChange('animationSpeed', parseFloat(e.target.value))}
                      disabled={preferences.reducedMotion}
                    />
                    <span>{preferences.reducedMotion ? 'Disabled' : `${preferences.customizations.animationSpeed}x`}</span>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="focus-indicator-size">Focus Indicator Size</label>
                    <input
                      type="range"
                      id="focus-indicator-size"
                      min="50"
                      max="200"
                      step="10"
                      value={preferences.customizations.focusIndicatorSize}
                      onChange={(e) => handleCustomizationChange('focusIndicatorSize', parseInt(e.target.value))}
                    />
                    <span>{preferences.customizations.focusIndicatorSize}%</span>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="focus-highlight-color">Focus Highlight Color</label>
                    <input
                      type="color"
                      id="focus-highlight-color"
                      value={preferences.customizations.focusHighlight}
                      onChange={(e) => handleCustomizationChange('focusHighlight', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'cognitive' && (
                <div className="settings-group">
                  <h3>Cognitive Settings</h3>
                  
                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.cognitiveSupport}
                        onChange={(e) => updatePreferences({ cognitiveSupport: e.target.checked })}
                      />
                      Cognitive Support Mode
                    </label>
                    <small>Simplifies interface and provides additional guidance</small>
                  </div>

                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.therapeuticMode}
                        onChange={(e) => updatePreferences({ therapeuticMode: e.target.checked })}
                      />
                      Therapeutic Mode
                    </label>
                    <small>Optimized for mental health activities</small>
                  </div>

                  <div className="setting-item">
                    <label htmlFor="focus-mode">Focus Mode</label>
                    <select
                      id="focus-mode"
                      value={currentFocusMode}
                      onChange={(e) => setFocusMode(e.target.value as any)}
                    >
                      <option value="normal">Normal</option>
                      <option value="therapeutic">Therapeutic</option>
                      <option value="crisis">Crisis</option>
                      <option value="simplified">Simplified</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <button
                      className="crisis-mode-button"
                      onClick={activateCrisisMode}
                      aria-label="Activate crisis accessibility mode"
                    >
                      Activate Crisis Mode
                    </button>
                    <small>Simplifies interface for crisis situations</small>
                  </div>
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="settings-group">
                  <h3>Audio Settings</h3>
                  
                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.screenReader}
                        onChange={(e) => updatePreferences({ screenReader: e.target.checked })}
                      />
                      Screen Reader Support
                    </label>
                    {isScreenReaderActive && (
                      <small className="status">Screen reader detected</small>
                    )}
                  </div>

                  <div className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={preferences.voiceControl}
                        onChange={(e) => {
                          updatePreferences({ voiceControl: e.target.checked });
                          toggleVoiceControl();
                        }}
                      />
                      Voice Control
                    </label>
                    {isVoiceActive && (
                      <small className="status">Voice control active</small>
                    )}
                  </div>

                  <div className="setting-item">
                    <button
                      onClick={() => {
                        const text = document.body.innerText;
                        const utterance = new SpeechSynthesisUtterance(text);
                        window.speechSynthesis.speak(utterance);
                      }}
                      disabled={!('speechSynthesis' in window)}
                    >
                      Read Page Aloud
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="panel-footer">
              <button onClick={resetToDefaults} className="reset-button">
                Reset to Defaults
              </button>
              <button onClick={exportSettings} className="export-button">
                Export Settings
              </button>
              <label className="import-button">
                Import Settings
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importSettings(file);
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div className="keyboard-shortcuts">
              <h4>Keyboard Shortcuts</h4>
              <ul>
                <li><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>A</kbd> - Toggle panel</li>
                <li><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>H</kbd> - High contrast</li>
                <li><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>R</kbd> - Reduced motion</li>
                <li><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>+</kbd> - Increase font</li>
                <li><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>-</kbd> - Decrease font</li>
                <li><kbd>Ctrl</kbd>+<kbd>H</kbd> - Crisis mode</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccessibilityControls;