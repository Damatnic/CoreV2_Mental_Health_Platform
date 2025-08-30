import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

// Lazy load wellness components
const WellnessToolsSuite = lazy(() => import('../components/wellness/WellnessToolsSuite'));
const GroundingToolkit = lazy(() => import('../components/wellness/GroundingToolkit'));
const LoadingSpinner = lazy(() => import('../components/LoadingSpinner'));

const WellnessView: React.FC = () => {
  const { user } = useAuth();
  const [currentMood, setCurrentMood] = useState(5);
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [currentAnxiety, setCurrentAnxiety] = useState(3);
  const [showGroundingTools, setShowGroundingTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const getMoodEmoji = (mood: number) => {
    if (mood <= 2) return '😢';
    if (mood <= 4) return '😕';
    if (mood <= 6) return '😐';
    if (mood <= 8) return '😊';
    return '😄';
  };

  const handleSaveEntry = () => {
    const entry = {
      mood: currentMood,
      energy: currentEnergy,
      anxiety: currentAnxiety,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'anonymous'
    };
    
    // Save to localStorage or API
    const savedEntries = JSON.parse(localStorage.getItem('wellnessEntries') || '[]');
    savedEntries.push(entry);
    localStorage.setItem('wellnessEntries', JSON.stringify(savedEntries));
    
    logger.info('Wellness entry saved', entry, 'WellnessView');
    
    // Check if grounding tools might help
    if (currentAnxiety > 7) {
      setShowGroundingTools(true);
    }
  };

  return (
    <div className="wellness-view">
      <div className="wellness-header">
        <h1>Wellness Center</h1>
        <p>Your comprehensive mental health and wellness toolkit</p>
      </div>

      {/* Integrated Wellness Tools Suite */}
      <div className="wellness-suite-container">
        <Suspense fallback={<LoadingSpinner message="Loading wellness tools..." />}>
          <WellnessToolsSuite 
            userId={user?.id || 'anonymous'}
            onToolSelect={setSelectedTool}
            currentMood={currentMood}
            currentEnergy={currentEnergy}
            currentAnxiety={currentAnxiety}
          />
        </Suspense>
      </div>

      {/* Grounding Toolkit for High Anxiety */}
      {showGroundingTools && (
        <div className="grounding-toolkit-overlay">
          <Suspense fallback={<LoadingSpinner message="Loading grounding exercises..." />}>
            <GroundingToolkit 
              onClose={() => setShowGroundingTools(false)}
              anxietyLevel={currentAnxiety}
            />
          </Suspense>
        </div>
      )}

      <div className="mood-tracker-section">
        <h2>Today's Check-in</h2>
        
        <div className="tracker-form">
          <div className="tracker-item">
            <label>
              <span>Mood: {getMoodEmoji(currentMood)} ({currentMood}/10)</span>
              <input
                type="range"
                min="1"
                max="10"
                value={currentMood}
                onChange={(e) => setCurrentMood(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="tracker-item">
            <label>
              <span>Energy: ({currentEnergy}/10)</span>
              <input
                type="range"
                min="1"
                max="10"
                value={currentEnergy}
                onChange={(e) => setCurrentEnergy(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="tracker-item">
            <label>
              <span>Anxiety: ({currentAnxiety}/10)</span>
              <input
                type="range"
                min="1"
                max="10"
                value={currentAnxiety}
                onChange={(e) => setCurrentAnxiety(Number(e.target.value))}
              />
            </label>
          </div>

          <button 
            className="submit-button"
            onClick={handleSaveEntry}
            aria-label="Save wellness entry"
          >
            Save Entry
          </button>
        </div>
      </div>

      <div className="wellness-tips">
        <h2>Wellness Tips</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>🧘 Mindfulness</h4>
            <p>Take 5 minutes to focus on your breathing</p>
          </div>
          <div className="tip-card">
            <h4>🚶 Movement</h4>
            <p>A short walk can boost your mood</p>
          </div>
        </div>
      </div>

      <div className="crisis-notice">
        <p>Crisis Support: <a href="tel:988">988</a> or <a href="tel:911">911</a></p>
      </div>
    </div>
  );
};

export default WellnessView;
