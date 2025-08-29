import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Wind } from 'lucide-react';
import '../../styles/BreathingExercise.css';

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  phases: { name: string; duration: number; instruction: string }[];
}

const BreathingExercise: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>({
    id: '478',
    name: '4-7-8 Breathing',
    description: 'Calming technique for anxiety relief',
    phases: [
      { name: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose' },
      { name: 'Hold', duration: 7, instruction: 'Hold your breath gently' },
      { name: 'Exhale', duration: 8, instruction: 'Exhale slowly through your mouth' }
    ]
  });

  const patterns: BreathingPattern[] = [
    {
      id: '478',
      name: '4-7-8 Breathing',
      description: 'Calming technique for anxiety relief',
      phases: [
        { name: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose' },
        { name: 'Hold', duration: 7, instruction: 'Hold your breath gently' },
        { name: 'Exhale', duration: 8, instruction: 'Exhale slowly through your mouth' }
      ]
    },
    {
      id: 'box',
      name: 'Box Breathing',
      description: 'Equal-timed breathing for focus',
      phases: [
        { name: 'Inhale', duration: 4, instruction: 'Breathe in slowly' },
        { name: 'Hold', duration: 4, instruction: 'Hold your breath' },
        { name: 'Exhale', duration: 4, instruction: 'Breathe out slowly' },
        { name: 'Hold', duration: 4, instruction: 'Hold empty' }
      ]
    },
    {
      id: 'simple',
      name: 'Simple Breathing',
      description: 'Basic relaxation breathing',
      phases: [
        { name: 'Inhale', duration: 3, instruction: 'Breathe in' },
        { name: 'Exhale', duration: 4, instruction: 'Breathe out' }
      ]
    }
  ];

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          const nextPhase = (currentPhase + 1) % selectedPattern.phases.length;
          setCurrentPhase(nextPhase);
          return selectedPattern.phases[nextPhase].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, currentPhase, selectedPattern]);

  const handleStart = () => {
    setIsActive(true);
    setCountdown(selectedPattern.phases[0].duration);
  };

  const handleStop = () => {
    setIsActive(false);
    setCurrentPhase(0);
    setCountdown(0);
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentPhase(0);
    setCountdown(0);
  };

  const getCurrentPhase = () => selectedPattern.phases[currentPhase];
  const getProgress = () => {
    const phase = getCurrentPhase();
    return ((phase.duration - countdown) / phase.duration) * 100;
  };

  return (
    <div className="breathing-exercise">
      <div className="exercise-header">
        <Wind size={24} />
        <h2>Breathing Exercise</h2>
        <p>Find calm through mindful breathing</p>
      </div>

      <div className="pattern-selector">
        {patterns.map(pattern => (
          <button
            key={pattern.id}
            className={`pattern-btn ${selectedPattern.id === pattern.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedPattern(pattern);
              handleReset();
            }}
            disabled={isActive}
          >
            <h4>{pattern.name}</h4>
            <p>{pattern.description}</p>
          </button>
        ))}
      </div>

      <div className="breathing-visualization">
        <div className={`breathing-circle ${isActive ? 'active' : ''} ${getCurrentPhase()?.name.toLowerCase()}`}>
          <div className="circle-progress">
            <svg viewBox="0 0 200 200" className="progress-ring">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                strokeWidth="4"
                className="progress-bg"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                strokeWidth="4"
                className="progress-fill"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - getProgress() / 100)}`}
                transform="rotate(-90 100 100)"
              />
            </svg>
          </div>
          <div className="circle-content">
            <Wind size={48} />
            {isActive && (
              <>
                <h3>{getCurrentPhase()?.name}</h3>
                <div className="countdown">{countdown}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {isActive && (
        <div className="instruction">
          <p>{getCurrentPhase()?.instruction}</p>
        </div>
      )}

      <div className="exercise-controls">
        {!isActive ? (
          <button className="control-btn primary" onClick={handleStart}>
            <Play size={20} />
            Start
          </button>
        ) : (
          <button className="control-btn" onClick={handleStop}>
            <Pause size={20} />
            Stop
          </button>
        )}
        <button className="control-btn" onClick={handleReset}>
          <RotateCcw size={20} />
          Reset
        </button>
      </div>

      <div className="breathing-tips">
        <h3>Tips for Success</h3>
        <ul>
          <li>Find a quiet, comfortable space</li>
          <li>Keep your posture upright but relaxed</li>
          <li>Focus on the rhythm, not perfection</li>
          <li>Practice regularly for best results</li>
        </ul>
      </div>
    </div>
  );
};

export default BreathingExercise;
