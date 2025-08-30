/**
 * ENHANCED MOOD TRACKER WITH OPTIMIZED INTERACTIONS
 * 
 * Improved mood tracking experience with smooth animations,
 * intuitive gestures, and therapeutic feedback mechanisms.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Smile, 
  Meh, 
  Frown, 
  Heart,
  TrendingUp,
  Calendar,
  Edit3,
  Save,
  ChevronLeft,
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
  Zap,
  Moon
} from 'lucide-react';
import {
  DURATIONS,
  EASINGS,
  createAnimation,
  createTransition,
  staggerDelay,
  getPrefersReducedMotion
} from '../utils/animations';
import {
  PressScale,
  HoverLift,
  SuccessCheckmark,
  GentlePulse,
  ProgressBar,
  RippleEffect
} from './MicroInteractions';

interface MoodEntry {
  id: string;
  timestamp: Date;
  mood: number; // 1-10 scale
  emoji: string;
  label: string;
  energy: number; // 1-10 scale
  notes?: string;
  factors?: string[];
  weather?: string;
  sleep?: number;
  activities?: string[];
}

interface MoodTrackerEnhancedProps {
  userId?: string;
  onSave?: (entry: MoodEntry) => void;
  onViewHistory?: () => void;
}

const MoodTrackerEnhanced: React.FC<MoodTrackerEnhancedProps> = ({
  userId,
  onSave,
  onViewHistory
}) => {
  const [currentMood, setCurrentMood] = useState<number>(5);
  const [currentEnergy, setCurrentEnergy] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [weather, setWeather] = useState<string>('sunny');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const prefersReducedMotion = getPrefersReducedMotion();
  const moodSliderRef = useRef<HTMLDivElement>(null);
  const energySliderRef = useRef<HTMLDivElement>(null);

  // Mood configurations
  const moodConfigs = [
    { value: 1, emoji: '😔', label: 'Very Low', color: '#dc2626' },
    { value: 2, emoji: '😟', label: 'Low', color: '#ea580c' },
    { value: 3, emoji: '😕', label: 'Down', color: '#f59e0b' },
    { value: 4, emoji: '😐', label: 'Below Average', color: '#eab308' },
    { value: 5, emoji: '😊', label: 'Neutral', color: '#84cc16' },
    { value: 6, emoji: '🙂', label: 'Okay', color: '#22c55e' },
    { value: 7, emoji: '😄', label: 'Good', color: '#10b981' },
    { value: 8, emoji: '😃', label: 'Very Good', color: '#059669' },
    { value: 9, emoji: '😁', label: 'Great', color: '#0891b2' },
    { value: 10, emoji: '🤩', label: 'Excellent', color: '#0284c7' }
  ];

  // Common mood factors
  const moodFactors = [
    { id: 'work', label: 'Work', icon: '💼' },
    { id: 'relationships', label: 'Relationships', icon: '❤️' },
    { id: 'health', label: 'Health', icon: '🏥' },
    { id: 'sleep', label: 'Sleep', icon: '😴' },
    { id: 'exercise', label: 'Exercise', icon: '🏃' },
    { id: 'diet', label: 'Diet', icon: '🥗' },
    { id: 'stress', label: 'Stress', icon: '😰' },
    { id: 'weather', label: 'Weather', icon: '☀️' },
    { id: 'social', label: 'Social', icon: '👥' },
    { id: 'hobby', label: 'Hobbies', icon: '🎨' }
  ];

  // Activities
  const activities = [
    { id: 'meditation', label: 'Meditation', icon: '🧘' },
    { id: 'exercise', label: 'Exercise', icon: '💪' },
    { id: 'reading', label: 'Reading', icon: '📚' },
    { id: 'music', label: 'Music', icon: '🎵' },
    { id: 'nature', label: 'Nature', icon: '🌳' },
    { id: 'socializing', label: 'Socializing', icon: '👫' },
    { id: 'creative', label: 'Creative', icon: '🎨' },
    { id: 'gaming', label: 'Gaming', icon: '🎮' },
    { id: 'cooking', label: 'Cooking', icon: '👨‍🍳' },
    { id: 'learning', label: 'Learning', icon: '📖' }
  ];

  // Weather options
  const weatherOptions = [
    { id: 'sunny', icon: Sun, label: 'Sunny' },
    { id: 'cloudy', icon: Cloud, label: 'Cloudy' },
    { id: 'rainy', icon: CloudRain, label: 'Rainy' },
    { id: 'stormy', icon: Zap, label: 'Stormy' },
    { id: 'night', icon: Moon, label: 'Night' }
  ];

  // Get current mood config
  const getCurrentMoodConfig = () => {
    return moodConfigs[currentMood - 1];
  };

  // Handle mood change with smooth transition
  const handleMoodChange = (value: number) => {
    setCurrentMood(value);
    
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Handle energy change
  const handleEnergyChange = (value: number) => {
    setCurrentEnergy(value);
  };

  // Toggle factor selection
  const toggleFactor = (factorId: string) => {
    setSelectedFactors(prev =>
      prev.includes(factorId)
        ? prev.filter(f => f !== factorId)
        : [...prev, factorId]
    );
  };

  // Toggle activity selection
  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(a => a !== activityId)
        : [...prev, activityId]
    );
  };

  // Save mood entry
  const handleSave = async () => {
    setIsSaving(true);
    
    const moodConfig = getCurrentMoodConfig();
    const entry: MoodEntry = {
      id: `mood-${Date.now()}`,
      timestamp: new Date(),
      mood: currentMood,
      emoji: moodConfig.emoji,
      label: moodConfig.label,
      energy: currentEnergy,
      notes,
      factors: selectedFactors,
      weather,
      sleep: sleepHours,
      activities: selectedActivities
    };

    // Simulate save delay
    setTimeout(() => {
      onSave?.(entry);
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Reset after success
      setTimeout(() => {
        setSaveSuccess(false);
        resetForm();
      }, 2000);
    }, 800);
  };

  // Reset form
  const resetForm = () => {
    setCurrentMood(5);
    setCurrentEnergy(5);
    setNotes('');
    setSelectedFactors([]);
    setSelectedActivities([]);
    setSleepHours(7);
    setWeather('sunny');
    setShowDetails(false);
  };

  // Render mood slider
  const renderMoodSlider = () => {
    const moodConfig = getCurrentMoodConfig();
    
    return (
      <div className="mood-slider-container">
        <div className="slider-header">
          <h3>How are you feeling?</h3>
          <div className="current-mood-display">
            <span className="mood-emoji">{moodConfig.emoji}</span>
            <span className="mood-label">{moodConfig.label}</span>
          </div>
        </div>

        <div className="mood-slider" ref={moodSliderRef}>
          <div className="slider-track">
            <div 
              className="slider-fill"
              style={{
                width: `${(currentMood / 10) * 100}%`,
                backgroundColor: moodConfig.color,
                transition: createTransition('width', DURATIONS.base)
              }}
            />
          </div>
          
          <div className="mood-options">
            {moodConfigs.map((config, index) => (
              <PressScale key={config.value} disabled={prefersReducedMotion}>
                <button
                  className={`mood-option ${currentMood === config.value ? 'active' : ''}`}
                  onClick={() => handleMoodChange(config.value)}
                  style={{
                    animationDelay: `${staggerDelay(index, 0, 30)}ms`,
                    animation: prefersReducedMotion
                      ? 'none'
                      : createAnimation('scaleIn', {
                          duration: DURATIONS.base,
                          delay: staggerDelay(index, 0, 30)
                        })
                  }}
                  aria-label={`Set mood to ${config.label}`}
                >
                  <span className="mood-option-emoji">{config.emoji}</span>
                  {currentMood === config.value && (
                    <GentlePulse active={!prefersReducedMotion}>
                      <div 
                        className="mood-option-indicator"
                        style={{ backgroundColor: config.color }}
                      />
                    </GentlePulse>
                  )}
                </button>
              </PressScale>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render energy slider
  const renderEnergySlider = () => {
    return (
      <div className="energy-slider-container">
        <div className="slider-header">
          <h3>Energy Level</h3>
          <div className="energy-display">
            <span className="energy-value">{currentEnergy}/10</span>
          </div>
        </div>

        <div className="energy-slider" ref={energySliderRef}>
          <input
            type="range"
            min="1"
            max="10"
            value={currentEnergy}
            onChange={(e) => handleEnergyChange(Number(e.target.value))}
            className="slider-input"
            style={{
              background: `linear-gradient(to right, #059ae9 0%, #059ae9 ${(currentEnergy / 10) * 100}%, #e5e7eb ${(currentEnergy / 10) * 100}%, #e5e7eb 100%)`
            }}
          />
          
          <div className="energy-labels">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
      </div>
    );
  };

  // Render factors selection
  const renderFactors = () => {
    return (
      <div className="factors-container">
        <h3>What's influencing your mood?</h3>
        <div className="factors-grid">
          {moodFactors.map((factor, index) => (
            <HoverLift key={factor.id} disabled={prefersReducedMotion}>
              <button
                className={`factor-chip ${selectedFactors.includes(factor.id) ? 'selected' : ''}`}
                onClick={() => toggleFactor(factor.id)}
                style={{
                  animationDelay: `${staggerDelay(index, 0, 20)}ms`,
                  animation: prefersReducedMotion
                    ? 'none'
                    : createAnimation('fadeIn', {
                        duration: DURATIONS.base,
                        delay: staggerDelay(index, 0, 20)
                      })
                }}
              >
                <span className="factor-icon">{factor.icon}</span>
                <span className="factor-label">{factor.label}</span>
                <RippleEffect disabled={prefersReducedMotion} />
              </button>
            </HoverLift>
          ))}
        </div>
      </div>
    );
  };

  // Render detailed tracking
  const renderDetailedTracking = () => {
    if (!showDetails) {
      return (
        <button
          className="show-details-btn"
          onClick={() => setShowDetails(true)}
        >
          <Edit3 size={16} />
          Add more details
        </button>
      );
    }

    return (
      <div 
        className="detailed-tracking"
        style={{
          animation: prefersReducedMotion
            ? 'none'
            : createAnimation('slideInUp', { duration: DURATIONS.base })
        }}
      >
        {/* Sleep tracking */}
        <div className="detail-section">
          <h4>Sleep (hours)</h4>
          <div className="sleep-selector">
            <button 
              onClick={() => setSleepHours(Math.max(0, sleepHours - 1))}
              className="sleep-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="sleep-value">{sleepHours}</span>
            <button 
              onClick={() => setSleepHours(Math.min(12, sleepHours + 1))}
              className="sleep-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Weather */}
        <div className="detail-section">
          <h4>Weather</h4>
          <div className="weather-options">
            {weatherOptions.map((option) => (
              <button
                key={option.id}
                className={`weather-btn ${weather === option.id ? 'selected' : ''}`}
                onClick={() => setWeather(option.id)}
                aria-label={option.label}
              >
                <option.icon size={20} />
              </button>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="detail-section">
          <h4>Activities</h4>
          <div className="activities-grid">
            {activities.map((activity) => (
              <button
                key={activity.id}
                className={`activity-chip ${selectedActivities.includes(activity.id) ? 'selected' : ''}`}
                onClick={() => toggleActivity(activity.id)}
              >
                <span>{activity.icon}</span>
                <span>{activity.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="detail-section">
          <h4>Notes (optional)</h4>
          <textarea
            className="notes-input"
            placeholder="Any thoughts you'd like to add..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="mood-tracker-enhanced">
      {/* Header */}
      <div className="tracker-header">
        <h2>Daily Mood Check-in</h2>
        <button 
          className="history-btn"
          onClick={onViewHistory}
        >
          <Calendar size={20} />
          <span>History</span>
        </button>
      </div>

      {/* Progress indicator */}
      <ProgressBar 
        progress={showDetails ? 75 : 40}
        height={4}
        animated={!prefersReducedMotion}
      />

      {/* Main content */}
      <div className="tracker-content">
        {renderMoodSlider()}
        {renderEnergySlider()}
        {renderFactors()}
        {renderDetailedTracking()}
      </div>

      {/* Action buttons */}
      <div className="tracker-actions">
        <button 
          className="save-btn"
          onClick={handleSave}
          disabled={isSaving || saveSuccess}
        >
          {saveSuccess ? (
            <>
              <SuccessCheckmark size={20} color="white" />
              <span>Saved!</span>
            </>
          ) : isSaving ? (
            <>
              <GentlePulse active={!prefersReducedMotion}>
                <Save size={20} />
              </GentlePulse>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Save Entry</span>
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .mood-tracker-enhanced {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .tracker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .tracker-header h2 {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .history-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
          transition: all ${DURATIONS.fast}ms ${EASINGS.easeOut};
        }

        .history-btn:hover {
          background: #e5e7eb;
        }

        .tracker-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
          margin: 24px 0;
        }

        /* Mood Slider Styles */
        .mood-slider-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .slider-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .current-mood-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mood-emoji {
          font-size: 32px;
        }

        .mood-label {
          font-size: 16px;
          font-weight: 500;
          color: #6b7280;
        }

        .mood-slider {
          position: relative;
        }

        .slider-track {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .slider-fill {
          height: 100%;
          border-radius: 4px;
        }

        .mood-options {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .mood-option {
          position: relative;
          padding: 8px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all ${DURATIONS.fast}ms ${EASINGS.easeOut};
        }

        .mood-option:hover {
          background: #f9fafb;
        }

        .mood-option.active {
          background: #eff9ff;
        }

        .mood-option-emoji {
          font-size: 24px;
        }

        .mood-option-indicator {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
        }

        /* Energy Slider Styles */
        .energy-slider-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .energy-display {
          font-size: 16px;
          font-weight: 500;
          color: #059ae9;
        }

        .slider-input {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          outline: none;
          -webkit-appearance: none;
          cursor: pointer;
        }

        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #059ae9;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .energy-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #9ca3af;
          margin-top: 8px;
        }

        /* Factors Styles */
        .factors-container h3 {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 16px 0;
        }

        .factors-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .factor-chip {
          position: relative;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          overflow: hidden;
          transition: all ${DURATIONS.fast}ms ${EASINGS.easeOut};
        }

        .factor-chip:hover {
          border-color: #059ae9;
          background: #f9fafb;
        }

        .factor-chip.selected {
          background: #eff9ff;
          border-color: #059ae9;
        }

        .factor-icon {
          font-size: 16px;
        }

        /* Details Button */
        .show-details-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
          cursor: pointer;
          transition: all ${DURATIONS.fast}ms ${EASINGS.easeOut};
        }

        .show-details-btn:hover {
          border-color: #059ae9;
          background: #eff9ff;
          color: #059ae9;
        }

        /* Detailed Tracking */
        .detailed-tracking {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .detail-section h4 {
          font-size: 16px;
          font-weight: 500;
          color: #374151;
          margin: 0 0 12px 0;
        }

        .sleep-selector {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sleep-btn {
          padding: 4px;
          background: #f3f4f6;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .sleep-value {
          font-size: 20px;
          font-weight: 600;
          color: #059ae9;
          min-width: 30px;
          text-align: center;
        }

        .weather-options {
          display: flex;
          gap: 8px;
        }

        .weather-btn {
          padding: 8px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          color: #6b7280;
          cursor: pointer;
          transition: all ${DURATIONS.fast}ms ${EASINGS.easeOut};
        }

        .weather-btn:hover {
          border-color: #059ae9;
        }

        .weather-btn.selected {
          background: #eff9ff;
          border-color: #059ae9;
          color: #059ae9;
        }

        .activities-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .activity-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          font-size: 13px;
          cursor: pointer;
          transition: all ${DURATIONS.fast}ms ${EASINGS.easeOut};
        }

        .activity-chip:hover {
          border-color: #059ae9;
        }

        .activity-chip.selected {
          background: #eff9ff;
          border-color: #059ae9;
        }

        .notes-input {
          width: 100%;
          padding: 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          transition: all ${DURATIONS.fast}ms ${EASINGS.easeOut};
        }

        .notes-input:focus {
          outline: none;
          border-color: #059ae9;
          background: white;
        }

        /* Actions */
        .tracker-actions {
          display: flex;
          justify-content: center;
          margin-top: 32px;
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 32px;
          background: #059ae9;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all ${DURATIONS.base}ms ${EASINGS.therapeutic};
        }

        .save-btn:hover:not(:disabled) {
          background: #0077c7;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(5, 154, 233, 0.3);
        }

        .save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .mood-tracker-enhanced {
            padding: 16px;
            border-radius: 0;
          }

          .mood-options {
            overflow-x: auto;
            padding-bottom: 8px;
          }

          .factors-grid,
          .activities-grid {
            justify-content: center;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MoodTrackerEnhanced;