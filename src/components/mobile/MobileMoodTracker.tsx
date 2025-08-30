import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Smile, Frown, Meh, Heart, Sun, Cloud, CloudRain, Zap, 
  Moon, Coffee, Droplets, Wind, ThermometerSun, Mic, Save, TrendingUp 
} from 'lucide-react';
import '../../styles/MobileMoodTracker.css';

interface MoodEntry {
  mood: number;
  energy: number;
  anxiety: number;
  emotions: string[];
  triggers: string[];
  notes: string;
  timestamp: Date;
  weather?: string;
  sleep?: number;
  hydration?: number;
}

interface MobileMoodTrackerProps {
  onSave?: (entry: MoodEntry) => void;
  onCancel?: () => void;
  initialData?: Partial<MoodEntry>;
}

const MobileMoodTracker: React.FC<MobileMoodTrackerProps> = ({
  onSave,
  onCancel,
  initialData
}) => {
  // State management
  const [mood, setMood] = useState(initialData?.mood || 5);
  const [energy, setEnergy] = useState(initialData?.energy || 5);
  const [anxiety, setAnxiety] = useState(initialData?.anxiety || 3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(initialData?.emotions || []);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(initialData?.triggers || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [weather, setWeather] = useState(initialData?.weather || '');
  const [sleep, setSleep] = useState(initialData?.sleep || 7);
  const [hydration, setHydration] = useState(initialData?.hydration || 5);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Emotion options with emojis for better visual recognition
  const emotionOptions = [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'sad', label: 'Sad', emoji: '😢' },
    { id: 'anxious', label: 'Anxious', emoji: '😰' },
    { id: 'angry', label: 'Angry', emoji: '😠' },
    { id: 'calm', label: 'Calm', emoji: '😌' },
    { id: 'excited', label: 'Excited', emoji: '🤗' },
    { id: 'tired', label: 'Tired', emoji: '😴' },
    { id: 'grateful', label: 'Grateful', emoji: '🙏' },
    { id: 'frustrated', label: 'Frustrated', emoji: '😤' },
    { id: 'hopeful', label: 'Hopeful', emoji: '🌟' }
  ];

  // Common triggers
  const triggerOptions = [
    { id: 'work', label: 'Work', icon: '💼' },
    { id: 'relationship', label: 'Relationships', icon: '💑' },
    { id: 'health', label: 'Health', icon: '🏥' },
    { id: 'money', label: 'Money', icon: '💰' },
    { id: 'sleep', label: 'Sleep', icon: '😴' },
    { id: 'social', label: 'Social', icon: '👥' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { id: 'weather', label: 'Weather', icon: '🌦️' }
  ];

  // Weather options
  const weatherOptions = [
    { id: 'sunny', label: 'Sunny', icon: <Sun size={20} /> },
    { id: 'cloudy', label: 'Cloudy', icon: <Cloud size={20} /> },
    { id: 'rainy', label: 'Rainy', icon: <CloudRain size={20} /> },
    { id: 'stormy', label: 'Stormy', icon: <Zap size={20} /> }
  ];

  // Haptic feedback helper
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[intensity]);
    }
  }, []);

  // Get mood emoji based on value
  const getMoodEmoji = (value: number) => {
    if (value <= 2) return '😢';
    if (value <= 4) return '😔';
    if (value <= 6) return '😐';
    if (value <= 8) return '🙂';
    return '😊';
  };

  // Get mood color based on value
  const getMoodColor = (value: number) => {
    if (value <= 3) return '#ef4444'; // red
    if (value <= 5) return '#f97316'; // orange
    if (value <= 7) return '#eab308'; // yellow
    return '#10b981'; // green
  };

  // Handle emotion toggle
  const toggleEmotion = useCallback((emotionId: string) => {
    triggerHaptic('light');
    setSelectedEmotions(prev => 
      prev.includes(emotionId) 
        ? prev.filter(e => e !== emotionId)
        : [...prev, emotionId]
    );
  }, [triggerHaptic]);

  // Handle trigger toggle
  const toggleTrigger = useCallback((triggerId: string) => {
    triggerHaptic('light');
    setSelectedTriggers(prev =>
      prev.includes(triggerId)
        ? prev.filter(t => t !== triggerId)
        : [...prev, triggerId]
    );
  }, [triggerHaptic]);

  // Handle slider changes with haptic feedback
  const handleSliderChange = useCallback((
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number
  ) => {
    setter(value);
    // Haptic feedback at extremes and middle
    if (value === 1 || value === 5 || value === 10) {
      triggerHaptic('medium');
    }
  }, [triggerHaptic]);

  // Voice input handler
  const startVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported on this device');
      return;
    }

    setIsVoiceActive(true);
    triggerHaptic('medium');

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setNotes(prev => prev + ' ' + transcript);
    };

    recognition.onerror = () => {
      setIsVoiceActive(false);
      triggerHaptic('light');
    };

    recognition.onend = () => {
      setIsVoiceActive(false);
      triggerHaptic('light');
    };

    recognition.start();
  }, [triggerHaptic]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      // Save to localStorage for recovery
      const autoSaveData = {
        mood,
        energy,
        anxiety,
        emotions: selectedEmotions,
        triggers: selectedTriggers,
        notes,
        weather,
        sleep,
        hydration,
        timestamp: new Date()
      };
      localStorage.setItem('moodTrackerAutoSave', JSON.stringify(autoSaveData));
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [mood, energy, anxiety, selectedEmotions, selectedTriggers, notes, weather, sleep, hydration]);

  // Load auto-saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('moodTrackerAutoSave');
    if (savedData && !initialData) {
      const parsed = JSON.parse(savedData);
      const savedTime = new Date(parsed.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
      
      // Only restore if less than 24 hours old
      if (hoursDiff < 24) {
        if (confirm('Found unsaved mood entry. Would you like to restore it?')) {
          setMood(parsed.mood);
          setEnergy(parsed.energy);
          setAnxiety(parsed.anxiety);
          setSelectedEmotions(parsed.emotions);
          setSelectedTriggers(parsed.triggers);
          setNotes(parsed.notes);
          setWeather(parsed.weather || '');
          setSleep(parsed.sleep || 7);
          setHydration(parsed.hydration || 5);
        }
      }
    }
  }, [initialData]);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    triggerHaptic('heavy');

    const entry: MoodEntry = {
      mood,
      energy,
      anxiety,
      emotions: selectedEmotions,
      triggers: selectedTriggers,
      notes,
      weather,
      sleep,
      hydration,
      timestamp: new Date()
    };

    // Clear auto-save after successful save
    localStorage.removeItem('moodTrackerAutoSave');

    if (onSave) {
      await onSave(entry);
    }

    setIsSaving(false);
  }, [mood, energy, anxiety, selectedEmotions, selectedTriggers, notes, weather, sleep, hydration, onSave, triggerHaptic]);

  return (
    <form ref={formRef} className="mobile-mood-tracker" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      {/* Header */}
      <div className="mood-tracker-header">
        <h2>How are you feeling?</h2>
        <p className="header-subtitle">Track your mood and wellness</p>
      </div>

      {/* Main Mood Slider */}
      <div className="mood-section">
        <div className="mood-display">
          <span className="mood-emoji">{getMoodEmoji(mood)}</span>
          <span className="mood-value" style={{ color: getMoodColor(mood) }}>
            {mood}/10
          </span>
        </div>
        
        <label className="slider-label">Overall Mood</label>
        <div className="slider-container">
          <Frown size={20} className="slider-icon-left" />
          <input
            type="range"
            min="1"
            max="10"
            value={mood}
            onChange={(e) => handleSliderChange(setMood, parseInt(e.target.value))}
            className="mood-slider"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #f97316 30%, #eab308 60%, #10b981 100%)`
            }}
            aria-label="Mood level"
          />
          <Smile size={20} className="slider-icon-right" />
        </div>
        
        {/* Quick mood presets */}
        <div className="mood-presets">
          <button
            type="button"
            className="preset-btn"
            onClick={() => { setMood(2); triggerHaptic('medium'); }}
          >
            😢 Very Low
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => { setMood(5); triggerHaptic('medium'); }}
          >
            😐 Neutral
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => { setMood(8); triggerHaptic('medium'); }}
          >
            🙂 Good
          </button>
        </div>
      </div>

      {/* Energy Level */}
      <div className="slider-section">
        <label className="slider-label">
          <Zap size={16} /> Energy Level
        </label>
        <div className="slider-container">
          <span className="slider-value">{energy}/10</span>
          <input
            type="range"
            min="1"
            max="10"
            value={energy}
            onChange={(e) => handleSliderChange(setEnergy, parseInt(e.target.value))}
            className="energy-slider"
            aria-label="Energy level"
          />
        </div>
      </div>

      {/* Anxiety Level */}
      <div className="slider-section">
        <label className="slider-label">
          <Wind size={16} /> Anxiety Level
        </label>
        <div className="slider-container">
          <span className="slider-value">{anxiety}/10</span>
          <input
            type="range"
            min="1"
            max="10"
            value={anxiety}
            onChange={(e) => handleSliderChange(setAnxiety, parseInt(e.target.value))}
            className="anxiety-slider"
            aria-label="Anxiety level"
          />
        </div>
      </div>

      {/* Emotions Selection */}
      <div className="emotions-section">
        <label className="section-label">What emotions are you feeling?</label>
        <div className="emotion-chips">
          {emotionOptions.map(emotion => (
            <button
              key={emotion.id}
              type="button"
              className={`emotion-chip ${selectedEmotions.includes(emotion.id) ? 'selected' : ''}`}
              onClick={() => toggleEmotion(emotion.id)}
              aria-pressed={selectedEmotions.includes(emotion.id)}
            >
              <span className="emotion-emoji">{emotion.emoji}</span>
              <span className="emotion-label">{emotion.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Triggers Selection */}
      <div className="triggers-section">
        <label className="section-label">Any triggers today?</label>
        <div className="trigger-chips">
          {triggerOptions.map(trigger => (
            <button
              key={trigger.id}
              type="button"
              className={`trigger-chip ${selectedTriggers.includes(trigger.id) ? 'selected' : ''}`}
              onClick={() => toggleTrigger(trigger.id)}
              aria-pressed={selectedTriggers.includes(trigger.id)}
            >
              <span className="trigger-icon">{trigger.icon}</span>
              <span className="trigger-label">{trigger.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        type="button"
        className="advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
        aria-expanded={showAdvanced}
      >
        {showAdvanced ? '− Hide' : '+ Show'} Advanced Options
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="advanced-options">
          {/* Weather */}
          <div className="weather-section">
            <label className="section-label">Today's Weather</label>
            <div className="weather-options">
              {weatherOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`weather-btn ${weather === option.id ? 'selected' : ''}`}
                  onClick={() => { setWeather(option.id); triggerHaptic('light'); }}
                  aria-pressed={weather === option.id}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Hours */}
          <div className="slider-section">
            <label className="slider-label">
              <Moon size={16} /> Sleep (hours)
            </label>
            <div className="slider-container">
              <span className="slider-value">{sleep}h</span>
              <input
                type="range"
                min="0"
                max="12"
                value={sleep}
                onChange={(e) => setSleep(parseInt(e.target.value))}
                className="sleep-slider"
                aria-label="Hours of sleep"
              />
            </div>
          </div>

          {/* Hydration */}
          <div className="slider-section">
            <label className="slider-label">
              <Droplets size={16} /> Hydration (glasses)
            </label>
            <div className="slider-container">
              <span className="slider-value">{hydration}</span>
              <input
                type="range"
                min="0"
                max="10"
                value={hydration}
                onChange={(e) => setHydration(parseInt(e.target.value))}
                className="hydration-slider"
                aria-label="Glasses of water"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="notes-section">
        <label className="section-label" htmlFor="mood-notes">
          Additional thoughts
        </label>
        <div className="notes-container">
          <textarea
            id="mood-notes"
            className="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How was your day? What's on your mind?"
            rows={4}
            maxLength={500}
          />
          <button
            type="button"
            className={`voice-btn ${isVoiceActive ? 'active' : ''}`}
            onClick={startVoiceInput}
            aria-label="Voice input"
            disabled={isVoiceActive}
          >
            <Mic size={20} />
          </button>
        </div>
        <span className="character-count">{notes.length}/500</span>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-save"
          disabled={isSaving}
        >
          {isSaving ? (
            <span className="saving-indicator">Saving...</span>
          ) : (
            <>
              <Save size={20} />
              Save Entry
            </>
          )}
        </button>
      </div>

      {/* Quick Insights */}
      <div className="quick-insights">
        <TrendingUp size={16} />
        <span>Track daily to see patterns and insights</span>
      </div>
    </form>
  );
};

export default MobileMoodTracker;