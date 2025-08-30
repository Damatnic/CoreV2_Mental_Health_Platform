import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Eye, Ear, Hand, Zap, Brain, Shield, 
  Volume2, Mic, Smartphone, Settings,
  AlertCircle, CheckCircle, Info
} from 'lucide-react';
import '../../styles/EnhancedMobileAccessibilitySystem.css';

interface AccessibilitySettings {
  // Visual
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrast: 'normal' | 'high' | 'maximum';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reducedTransparency: boolean;
  magnification: boolean;
  darkMode: boolean;
  
  // Audio & Speech
  screenReaderSpeed: number; // 0.5 to 2.0
  screenReaderVerbosity: 'low' | 'medium' | 'high';
  voiceOver: boolean;
  soundEffects: boolean;
  voiceCommands: boolean;
  
  // Motor & Touch
  touchTargetSize: 'default' | 'large' | 'extra-large';
  hapticFeedback: boolean;
  assistiveTouch: boolean;
  dwellClick: boolean;
  dwellDuration: number; // milliseconds
  switchControl: boolean;
  
  // Cognitive
  reducedMotion: boolean;
  simpleLanguage: boolean;
  focusHighlight: boolean;
  readingGuide: boolean;
  autoTimeout: boolean;
  timeoutDuration: number; // seconds
  
  // Crisis-Specific
  crisisButtonSize: 'normal' | 'large' | 'persistent';
  emergencyVibration: boolean;
  panicGesture: boolean;
  voiceTriggerWords: string[];
}

interface AccessibilityAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

const EnhancedMobileAccessibilitySystem: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    // Visual
    fontSize: 'medium',
    contrast: 'normal',
    colorBlindMode: 'none',
    reducedTransparency: false,
    magnification: false,
    darkMode: false,
    
    // Audio & Speech
    screenReaderSpeed: 1.0,
    screenReaderVerbosity: 'medium',
    voiceOver: false,
    soundEffects: true,
    voiceCommands: false,
    
    // Motor & Touch
    touchTargetSize: 'default',
    hapticFeedback: true,
    assistiveTouch: false,
    dwellClick: false,
    dwellDuration: 1000,
    switchControl: false,
    
    // Cognitive
    reducedMotion: false,
    simpleLanguage: false,
    focusHighlight: true,
    readingGuide: false,
    autoTimeout: true,
    timeoutDuration: 300,
    
    // Crisis-Specific
    crisisButtonSize: 'normal',
    emergencyVibration: true,
    panicGesture: false,
    voiceTriggerWords: ['help', 'crisis', 'emergency', 'panic']
  });

  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'motor' | 'cognitive' | 'crisis'>('visual');
  const [announcements, setAnnouncements] = useState<AccessibilityAnnouncement[]>([]);
  const [testMode, setTestMode] = useState(false);
  const announcementRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('mobile-accessibility-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load accessibility settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('mobile-accessibility-settings', JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  // Apply accessibility settings to the DOM
  const applySettings = useCallback((newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Visual settings
    root.style.fontSize = getFontSizeValue(newSettings.fontSize);
    root.className = root.className.replace(/contrast-\w+/g, '');
    root.classList.add(`contrast-${newSettings.contrast}`);
    
    if (newSettings.colorBlindMode !== 'none') {
      root.classList.add(`colorblind-${newSettings.colorBlindMode}`);
    } else {
      root.className = root.className.replace(/colorblind-\w+/g, '');
    }
    
    if (newSettings.reducedTransparency) {
      root.classList.add('reduced-transparency');
    } else {
      root.classList.remove('reduced-transparency');
    }
    
    if (newSettings.darkMode) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    
    // Motion settings
    if (newSettings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Touch target sizes
    root.setAttribute('data-touch-size', newSettings.touchTargetSize);
    
    // Focus highlight
    if (newSettings.focusHighlight) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
    
    // Reading guide
    if (newSettings.readingGuide) {
      root.classList.add('reading-guide');
    } else {
      root.classList.remove('reading-guide');
    }
    
    // Apply ARIA attributes for screen readers
    if (newSettings.voiceOver) {
      root.setAttribute('aria-live', 'polite');
      root.setAttribute('aria-relevant', 'additions text');
    }
    
    // Crisis button sizing
    const crisisButton = document.querySelector('.crisis-fab');
    if (crisisButton) {
      crisisButton.className = crisisButton.className.replace(/size-\w+/g, '');
      crisisButton.classList.add(`size-${newSettings.crisisButtonSize}`);
    }
  }, []);

  const getFontSizeValue = (size: string) => {
    const sizes = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '22px'
    };
    return sizes[size as keyof typeof sizes];
  };

  // Haptic feedback utility
  const triggerHapticFeedback = useCallback((pattern: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
    if (settings.hapticFeedback && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [30],
        heavy: [50, 30, 50],
        success: [10, 20, 10],
        warning: [40, 20, 40],
        error: [100, 50, 100]
      };
      navigator.vibrate(patterns[pattern]);
    }
  }, [settings.hapticFeedback]);

  // Screen reader announcement
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement: AccessibilityAnnouncement = {
      message,
      priority,
      timestamp: Date.now()
    };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Use Web Speech API if available and enabled
    if (settings.voiceOver && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = settings.screenReaderSpeed;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      if (priority === 'assertive') {
        window.speechSynthesis.cancel();
      }
      
      window.speechSynthesis.speak(utterance);
      speechSynthesisRef.current = utterance;
    }
    
    // Update ARIA live region
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', priority);
      announcementRef.current.textContent = message;
      
      // Clear after 5 seconds
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 5000);
    }
  }, [settings.voiceOver, settings.screenReaderSpeed]);

  // Voice command initialization
  const initializeVoiceCommands = useCallback(() => {
    if (!settings.voiceCommands || !('webkitSpeechRecognition' in window)) {
      return;
    }
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      
      // Check for crisis trigger words
      settings.voiceTriggerWords.forEach(word => {
        if (transcript.includes(word)) {
          triggerHapticFeedback('error');
          announce('Crisis support activated', 'assertive');
          
          // Trigger crisis button
          const crisisButton = document.querySelector('.crisis-fab') as HTMLElement;
          if (crisisButton) {
            crisisButton.click();
          }
        }
      });
      
      // Other voice commands
      if (transcript.includes('increase font')) {
        const sizes = ['small', 'medium', 'large', 'extra-large'] as const;
        const currentIndex = sizes.indexOf(settings.fontSize);
        if (currentIndex < sizes.length - 1) {
          setSettings(prev => ({ ...prev, fontSize: sizes[currentIndex + 1] }));
          announce('Font size increased', 'polite');
        }
      }
      
      if (transcript.includes('high contrast')) {
        setSettings(prev => ({ ...prev, contrast: 'high' }));
        announce('High contrast enabled', 'polite');
      }
      
      if (transcript.includes('dark mode')) {
        setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
        announce(`Dark mode ${settings.darkMode ? 'disabled' : 'enabled'}`, 'polite');
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      announce('Voice commands unavailable', 'polite');
    };
    
    try {
      recognition.start();
      announce('Voice commands activated. Say "help" for assistance.', 'polite');
    } catch (e) {
      console.error('Failed to start voice recognition:', e);
    }
    
    return () => {
      recognition.stop();
    };
  }, [settings, announce, triggerHapticFeedback]);

  // Initialize voice commands when enabled
  useEffect(() => {
    if (settings.voiceCommands) {
      const cleanup = initializeVoiceCommands();
      return cleanup;
    }
  }, [settings.voiceCommands, initializeVoiceCommands]);

  // Test accessibility features
  const runAccessibilityTest = useCallback(() => {
    setTestMode(true);
    announce('Starting accessibility test', 'assertive');
    
    // Test haptic feedback
    setTimeout(() => {
      triggerHapticFeedback('success');
      announce('Testing haptic feedback', 'polite');
    }, 1000);
    
    // Test screen reader
    setTimeout(() => {
      announce('Screen reader test: Can you hear this message?', 'assertive');
    }, 2000);
    
    // Test focus navigation
    setTimeout(() => {
      const firstButton = document.querySelector('button');
      if (firstButton instanceof HTMLElement) {
        firstButton.focus();
        announce('Focus moved to first button', 'polite');
      }
    }, 3000);
    
    setTimeout(() => {
      setTestMode(false);
      announce('Accessibility test complete', 'assertive');
    }, 4000);
  }, [announce, triggerHapticFeedback]);

  const renderVisualSettings = () => (
    <div className="settings-section">
      <h3><Eye size={20} /> Visual Settings</h3>
      
      <div className="setting-item">
        <label htmlFor="fontSize">Font Size</label>
        <select 
          id="fontSize"
          value={settings.fontSize}
          onChange={(e) => {
            setSettings({...settings, fontSize: e.target.value as any});
            triggerHapticFeedback('light');
            announce(`Font size changed to ${e.target.value}`, 'polite');
          }}
          aria-describedby="fontSize-desc"
        >
          <option value="small">Small (14px)</option>
          <option value="medium">Medium (16px)</option>
          <option value="large">Large (18px)</option>
          <option value="extra-large">Extra Large (22px)</option>
        </select>
        <small id="fontSize-desc">Adjust text size for better readability</small>
      </div>

      <div className="setting-item">
        <label htmlFor="contrast">Contrast Level</label>
        <select 
          id="contrast"
          value={settings.contrast}
          onChange={(e) => {
            setSettings({...settings, contrast: e.target.value as any});
            triggerHapticFeedback('light');
            announce(`Contrast changed to ${e.target.value}`, 'polite');
          }}
        >
          <option value="normal">Normal</option>
          <option value="high">High Contrast</option>
          <option value="maximum">Maximum Contrast</option>
        </select>
      </div>

      <div className="setting-item">
        <label htmlFor="colorBlindMode">Color Blind Mode</label>
        <select 
          id="colorBlindMode"
          value={settings.colorBlindMode}
          onChange={(e) => {
            setSettings({...settings, colorBlindMode: e.target.value as any});
            triggerHapticFeedback('light');
            announce(`Color blind mode: ${e.target.value}`, 'polite');
          }}
        >
          <option value="none">None</option>
          <option value="protanopia">Protanopia (Red-Green)</option>
          <option value="deuteranopia">Deuteranopia (Red-Green)</option>
          <option value="tritanopia">Tritanopia (Blue-Yellow)</option>
        </select>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={(e) => {
              setSettings({...settings, darkMode: e.target.checked});
              triggerHapticFeedback('light');
              announce(`Dark mode ${e.target.checked ? 'enabled' : 'disabled'}`, 'polite');
            }}
          />
          <span>Dark Mode</span>
        </label>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.reducedTransparency}
            onChange={(e) => {
              setSettings({...settings, reducedTransparency: e.target.checked});
              triggerHapticFeedback('light');
            }}
          />
          <span>Reduce Transparency</span>
        </label>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.magnification}
            onChange={(e) => {
              setSettings({...settings, magnification: e.target.checked});
              triggerHapticFeedback('light');
              announce(`Magnification ${e.target.checked ? 'enabled' : 'disabled'}`, 'polite');
            }}
          />
          <span>Enable Magnification Gestures</span>
        </label>
      </div>
    </div>
  );

  const renderAudioSettings = () => (
    <div className="settings-section">
      <h3><Ear size={20} /> Audio & Speech Settings</h3>
      
      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.voiceOver}
            onChange={(e) => {
              setSettings({...settings, voiceOver: e.target.checked});
              triggerHapticFeedback('medium');
              announce(`Screen reader ${e.target.checked ? 'enabled' : 'disabled'}`, 'assertive');
            }}
          />
          <span>Enable Screen Reader</span>
        </label>
      </div>

      {settings.voiceOver && (
        <>
          <div className="setting-item">
            <label htmlFor="readerSpeed">Reading Speed</label>
            <input
              type="range"
              id="readerSpeed"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.screenReaderSpeed}
              onChange={(e) => {
                setSettings({...settings, screenReaderSpeed: parseFloat(e.target.value)});
                announce(`Reading speed: ${e.target.value}x`, 'polite');
              }}
            />
            <span>{settings.screenReaderSpeed}x</span>
          </div>

          <div className="setting-item">
            <label htmlFor="verbosity">Verbosity</label>
            <select
              id="verbosity"
              value={settings.screenReaderVerbosity}
              onChange={(e) => {
                setSettings({...settings, screenReaderVerbosity: e.target.value as any});
                announce(`Verbosity: ${e.target.value}`, 'polite');
              }}
            >
              <option value="low">Low (Essential only)</option>
              <option value="medium">Medium (Standard)</option>
              <option value="high">High (Detailed)</option>
            </select>
          </div>
        </>
      )}

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.voiceCommands}
            onChange={(e) => {
              setSettings({...settings, voiceCommands: e.target.checked});
              triggerHapticFeedback('medium');
              if (e.target.checked) {
                announce('Voice commands enabled. Say "help" for assistance.', 'assertive');
              }
            }}
          />
          <span>Enable Voice Commands</span>
        </label>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.soundEffects}
            onChange={(e) => {
              setSettings({...settings, soundEffects: e.target.checked});
              triggerHapticFeedback('light');
            }}
          />
          <span>Sound Effects</span>
        </label>
      </div>
    </div>
  );

  const renderMotorSettings = () => (
    <div className="settings-section">
      <h3><Hand size={20} /> Motor & Touch Settings</h3>
      
      <div className="setting-item">
        <label htmlFor="touchSize">Touch Target Size</label>
        <select
          id="touchSize"
          value={settings.touchTargetSize}
          onChange={(e) => {
            setSettings({...settings, touchTargetSize: e.target.value as any});
            triggerHapticFeedback('light');
            announce(`Touch targets: ${e.target.value}`, 'polite');
          }}
        >
          <option value="default">Default (44px)</option>
          <option value="large">Large (48px)</option>
          <option value="extra-large">Extra Large (56px)</option>
        </select>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.hapticFeedback}
            onChange={(e) => {
              setSettings({...settings, hapticFeedback: e.target.checked});
              if (e.target.checked) {
                triggerHapticFeedback('success');
              }
              announce(`Haptic feedback ${e.target.checked ? 'enabled' : 'disabled'}`, 'polite');
            }}
          />
          <span>Haptic Feedback</span>
        </label>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.assistiveTouch}
            onChange={(e) => {
              setSettings({...settings, assistiveTouch: e.target.checked});
              triggerHapticFeedback('light');
              announce(`Assistive touch ${e.target.checked ? 'enabled' : 'disabled'}`, 'polite');
            }}
          />
          <span>Assistive Touch</span>
        </label>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.dwellClick}
            onChange={(e) => {
              setSettings({...settings, dwellClick: e.target.checked});
              triggerHapticFeedback('light');
              announce(`Dwell clicking ${e.target.checked ? 'enabled' : 'disabled'}`, 'polite');
            }}
          />
          <span>Dwell Clicking</span>
        </label>
      </div>

      {settings.dwellClick && (
        <div className="setting-item">
          <label htmlFor="dwellDuration">Dwell Duration</label>
          <input
            type="range"
            id="dwellDuration"
            min="500"
            max="3000"
            step="100"
            value={settings.dwellDuration}
            onChange={(e) => {
              setSettings({...settings, dwellDuration: parseInt(e.target.value)});
            }}
          />
          <span>{settings.dwellDuration}ms</span>
        </div>
      )}

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.switchControl}
            onChange={(e) => {
              setSettings({...settings, switchControl: e.target.checked});
              triggerHapticFeedback('medium');
              announce(`Switch control ${e.target.checked ? 'enabled' : 'disabled'}`, 'assertive');
            }}
          />
          <span>Switch Control</span>
        </label>
      </div>
    </div>
  );

  const renderCognitiveSettings = () => (
    <div className="settings-section">
      <h3><Brain size={20} /> Cognitive Settings</h3>
      
      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => {
              setSettings({...settings, reducedMotion: e.target.checked});
              triggerHapticFeedback('light');
              announce(`Reduced motion ${e.target.checked ? 'enabled' : 'disabled'}`, 'polite');
            }}
          />
          <span>Reduce Motion & Animations</span>
        </label>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.simpleLanguage}
            onChange={(e) => {
              setSettings({...settings, simpleLanguage: e.target.checked});
              triggerHapticFeedback('light');
              announce(`Simple language mode ${e.target.checked ? 'enabled' : 'disabled'}`, 'polite');
            }}
          />
          <span>Use Simple Language</span>
        </label>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.focusHighlight}
            onChange={(e) => {
              setSettings({...settings, focusHighlight: e.target.checked});
              triggerHapticFeedback('light');
            }}
          />
          <span>Enhanced Focus Indicators</span>
        </label>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.readingGuide}
            onChange={(e) => {
              setSettings({...settings, readingGuide: e.target.checked});
              triggerHapticFeedback('light');
              announce(`Reading guide ${e.target.checked ? 'enabled' : 'disabled'}`, 'polite');
            }}
          />
          <span>Reading Guide Line</span>
        </label>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.autoTimeout}
            onChange={(e) => {
              setSettings({...settings, autoTimeout: e.target.checked});
              triggerHapticFeedback('light');
            }}
          />
          <span>Auto-Extend Timeouts</span>
        </label>
      </div>

      {settings.autoTimeout && (
        <div className="setting-item">
          <label htmlFor="timeoutDuration">Timeout Extension</label>
          <input
            type="range"
            id="timeoutDuration"
            min="60"
            max="600"
            step="30"
            value={settings.timeoutDuration}
            onChange={(e) => {
              setSettings({...settings, timeoutDuration: parseInt(e.target.value)});
            }}
          />
          <span>{settings.timeoutDuration}s</span>
        </div>
      )}
    </div>
  );

  const renderCrisisSettings = () => (
    <div className="settings-section">
      <h3><Shield size={20} /> Crisis Accessibility</h3>
      
      <div className="setting-item">
        <label htmlFor="crisisSize">Crisis Button Size</label>
        <select
          id="crisisSize"
          value={settings.crisisButtonSize}
          onChange={(e) => {
            setSettings({...settings, crisisButtonSize: e.target.value as any});
            triggerHapticFeedback('medium');
            announce(`Crisis button size: ${e.target.value}`, 'assertive');
          }}
        >
          <option value="normal">Normal</option>
          <option value="large">Large</option>
          <option value="persistent">Persistent (Always Visible)</option>
        </select>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.emergencyVibration}
            onChange={(e) => {
              setSettings({...settings, emergencyVibration: e.target.checked});
              if (e.target.checked) {
                triggerHapticFeedback('error');
              }
            }}
          />
          <span>Emergency Vibration Pattern</span>
        </label>
      </div>

      <div className="setting-item checkbox">
        <label>
          <input
            type="checkbox"
            checked={settings.panicGesture}
            onChange={(e) => {
              setSettings({...settings, panicGesture: e.target.checked});
              triggerHapticFeedback('medium');
              announce(`Panic gesture ${e.target.checked ? 'enabled' : 'disabled'}`, 'assertive');
            }}
          />
          <span>Enable Panic Gesture (Triple Tap)</span>
        </label>
      </div>

      <div className="setting-item">
        <label>Voice Trigger Words</label>
        <div className="trigger-words">
          {settings.voiceTriggerWords.map((word, index) => (
            <span key={index} className="trigger-word">
              {word}
              <button
                onClick={() => {
                  const newWords = settings.voiceTriggerWords.filter((_, i) => i !== index);
                  setSettings({...settings, voiceTriggerWords: newWords});
                  triggerHapticFeedback('light');
                }}
                aria-label={`Remove ${word}`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            className="add-trigger"
            onClick={() => {
              const word = prompt('Enter trigger word:');
              if (word) {
                setSettings({
                  ...settings, 
                  voiceTriggerWords: [...settings.voiceTriggerWords, word.toLowerCase()]
                });
                triggerHapticFeedback('success');
              }
            }}
          >
            + Add Word
          </button>
        </div>
      </div>

      <div className="crisis-test-section">
        <p><Info size={16} /> Test your crisis accessibility features:</p>
        <button
          className="btn-test-crisis"
          onClick={() => {
            triggerHapticFeedback('error');
            announce('Crisis test activated. This is only a test.', 'assertive');
            const crisisButton = document.querySelector('.crisis-fab') as HTMLElement;
            if (crisisButton) {
              crisisButton.classList.add('pulse');
              setTimeout(() => crisisButton.classList.remove('pulse'), 2000);
            }
          }}
        >
          Test Crisis Features
        </button>
      </div>
    </div>
  );

  return (
    <div className="enhanced-mobile-accessibility-system">
      {/* Screen Reader Announcements (Hidden) */}
      <div 
        ref={announcementRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Header */}
      <div className="accessibility-header">
        <Smartphone size={24} />
        <h2>Mobile Accessibility Settings</h2>
        <button
          className="btn-test"
          onClick={runAccessibilityTest}
          aria-label="Run accessibility test"
        >
          {testMode ? <Zap className="spinning" size={20} /> : 'Test'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="accessibility-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'visual'}
          aria-controls="visual-panel"
          className={`tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('visual');
            triggerHapticFeedback('light');
            announce('Visual settings', 'polite');
          }}
        >
          <Eye size={18} />
          <span>Visual</span>
        </button>
        
        <button
          role="tab"
          aria-selected={activeTab === 'audio'}
          aria-controls="audio-panel"
          className={`tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('audio');
            triggerHapticFeedback('light');
            announce('Audio and speech settings', 'polite');
          }}
        >
          <Ear size={18} />
          <span>Audio</span>
        </button>
        
        <button
          role="tab"
          aria-selected={activeTab === 'motor'}
          aria-controls="motor-panel"
          className={`tab-btn ${activeTab === 'motor' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('motor');
            triggerHapticFeedback('light');
            announce('Motor and touch settings', 'polite');
          }}
        >
          <Hand size={18} />
          <span>Motor</span>
        </button>
        
        <button
          role="tab"
          aria-selected={activeTab === 'cognitive'}
          aria-controls="cognitive-panel"
          className={`tab-btn ${activeTab === 'cognitive' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('cognitive');
            triggerHapticFeedback('light');
            announce('Cognitive settings', 'polite');
          }}
        >
          <Brain size={18} />
          <span>Cognitive</span>
        </button>
        
        <button
          role="tab"
          aria-selected={activeTab === 'crisis'}
          aria-controls="crisis-panel"
          className={`tab-btn ${activeTab === 'crisis' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('crisis');
            triggerHapticFeedback('medium');
            announce('Crisis accessibility settings', 'assertive');
          }}
        >
          <Shield size={18} />
          <span>Crisis</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="accessibility-panels">
        <div 
          role="tabpanel"
          id="visual-panel"
          hidden={activeTab !== 'visual'}
          aria-labelledby="visual-tab"
        >
          {renderVisualSettings()}
        </div>
        
        <div 
          role="tabpanel"
          id="audio-panel"
          hidden={activeTab !== 'audio'}
          aria-labelledby="audio-tab"
        >
          {renderAudioSettings()}
        </div>
        
        <div 
          role="tabpanel"
          id="motor-panel"
          hidden={activeTab !== 'motor'}
          aria-labelledby="motor-tab"
        >
          {renderMotorSettings()}
        </div>
        
        <div 
          role="tabpanel"
          id="cognitive-panel"
          hidden={activeTab !== 'cognitive'}
          aria-labelledby="cognitive-tab"
        >
          {renderCognitiveSettings()}
        </div>
        
        <div 
          role="tabpanel"
          id="crisis-panel"
          hidden={activeTab !== 'crisis'}
          aria-labelledby="crisis-tab"
        >
          {renderCrisisSettings()}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="accessibility-quick-actions">
        <button
          className="btn-reset"
          onClick={() => {
            if (window.confirm('Reset all accessibility settings to defaults?')) {
              localStorage.removeItem('mobile-accessibility-settings');
              window.location.reload();
            }
          }}
        >
          Reset to Defaults
        </button>
        
        <button
          className="btn-export"
          onClick={() => {
            const data = JSON.stringify(settings, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'accessibility-settings.json';
            a.click();
            triggerHapticFeedback('success');
            announce('Settings exported', 'polite');
          }}
        >
          Export Settings
        </button>
      </div>

      {/* Status Messages */}
      {testMode && (
        <div className="test-mode-indicator" role="alert">
          <AlertCircle size={16} />
          Accessibility test in progress...
        </div>
      )}

      {/* Recent Announcements (for debugging) */}
      {process.env.NODE_ENV === 'development' && announcements.length > 0 && (
        <div className="announcement-log">
          <h4>Recent Announcements:</h4>
          <ul>
            {announcements.slice(-5).map((ann, index) => (
              <li key={ann.timestamp + index}>
                [{ann.priority}] {ann.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EnhancedMobileAccessibilitySystem;