import React, { useState } from 'react';
import { Smile, Meh, TrendingUp, Calendar, BarChart } from 'lucide-react';
import '../styles/EnhancedMoodTracker.css';

interface MoodEntry {
  id: string;
  date: Date;
  mood: number;
  energy: number;
  anxiety: number;
  notes?: string;
  triggers?: string[];
}

const EnhancedMoodTracker: React.FC = () => {
  const [currentMood, setCurrentMood] = useState(5);
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [currentAnxiety, setCurrentAnxiety] = useState(5);
  const [notes, setNotes] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<Set<string>>(new Set());

  const triggers = [
    'Work', 'Family', 'Health', 'Sleep', 'Social', 'Weather', 'Exercise', 'Diet'
  ];

  const moodEmojis = [
    { value: 1, icon: '😔' },
    { value: 3, icon: '😟' },
    { value: 5, icon: '😐' },
    { value: 7, icon: '🙂' },
    { value: 9, icon: '😊' },
    { value: 10, icon: '😄' }
  ];

  const handleSaveMood = () => {
    const entry: MoodEntry = {
      id: Date.now().toString(),
      date: new Date(),
      mood: currentMood,
      energy: currentEnergy,
      anxiety: currentAnxiety,
      notes: notes.trim(),
      triggers: Array.from(selectedTriggers)
    };
    
    console.log('Saving mood entry:', entry);
    // Reset form
    setNotes('');
    setSelectedTriggers(new Set());
  };

  const toggleTrigger = (trigger: string) => {
    const newTriggers = new Set(selectedTriggers);
    if (newTriggers.has(trigger)) {
      newTriggers.delete(trigger);
    } else {
      newTriggers.add(trigger);
    }
    setSelectedTriggers(newTriggers);
  };

  const getMoodEmoji = (value: number) => {
    const closest = moodEmojis.reduce((prev, curr) =>
      Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
    );
    return closest.icon;
  };

  return (
    <div className="enhanced-mood-tracker">
      <div className="tracker-header">
        <h2>How are you feeling?</h2>
        <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="mood-section">
        <div className="mood-scale">
          <label>
            <Smile size={20} />
            Mood
          </label>
          <div className="scale-container">
            <input
              type="range"
              min="1"
              max="10"
              value={currentMood}
              onChange={(e) => setCurrentMood(Number(e.target.value))}
              className="mood-slider"
            />
            <div className="mood-display">
              <span className="mood-emoji">{getMoodEmoji(currentMood)}</span>
              <span className="mood-value">{currentMood}/10</span>
            </div>
          </div>
        </div>

        <div className="mood-scale">
          <label>
            <TrendingUp size={20} />
            Energy
          </label>
          <div className="scale-container">
            <input
              type="range"
              min="1"
              max="10"
              value={currentEnergy}
              onChange={(e) => setCurrentEnergy(Number(e.target.value))}
              className="energy-slider"
            />
            <span className="scale-value">{currentEnergy}/10</span>
          </div>
        </div>

        <div className="mood-scale">
          <label>
            <Meh size={20} />
            Anxiety
          </label>
          <div className="scale-container">
            <input
              type="range"
              min="1"
              max="10"
              value={currentAnxiety}
              onChange={(e) => setCurrentAnxiety(Number(e.target.value))}
              className="anxiety-slider"
            />
            <span className="scale-value">{currentAnxiety}/10</span>
          </div>
        </div>
      </div>

      <div className="triggers-section">
        <h3>What influenced your mood?</h3>
        <div className="triggers-grid">
          {triggers.map(trigger => (
            <button
              key={trigger}
              className={`trigger-btn ${selectedTriggers.has(trigger) ? 'selected' : ''}`}
              onClick={() => toggleTrigger(trigger)}
            >
              {trigger}
            </button>
          ))}
        </div>
      </div>

      <div className="notes-section">
        <label htmlFor="mood-notes">Additional notes (optional)</label>
        <textarea
          id="mood-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any thoughts you'd like to record..."
          rows={3}
        />
      </div>

      <button className="save-mood-btn" onClick={handleSaveMood}>
        Save Mood Entry
      </button>

      <div className="tracker-footer">
        <button className="view-history-btn">
          <Calendar size={18} />
          View History
        </button>
        <button className="view-insights-btn">
          <BarChart size={18} />
          View Insights
        </button>
      </div>
    </div>
  );
};

export default EnhancedMoodTracker;
