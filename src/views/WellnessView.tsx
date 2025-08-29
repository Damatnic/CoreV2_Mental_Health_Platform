import React, { useState } from 'react';

const WellnessView: React.FC = () => {
  const [currentMood, setCurrentMood] = useState(5);
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [currentAnxiety, setCurrentAnxiety] = useState(3);

  const getMoodEmoji = (mood: number) => {
    if (mood <= 2) return '😢';
    if (mood <= 4) return '😕';
    if (mood <= 6) return '😐';
    if (mood <= 8) return '😊';
    return '😄';
  };

  return (
    <div className="wellness-view">
      <div className="wellness-header">
        <h1>Wellness Tracker</h1>
        <p>Track your daily mood, energy, and anxiety levels</p>
      </div>

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

          <button className="submit-button">
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
