import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Music } from 'lucide-react';
import '../../styles/MeditationTimer.css';

interface MeditationSession {
  duration: number;
  type: string;
  completedAt: Date;
}

const MeditationTimer: React.FC = () => {
  const [duration, setDuration] = useState(5 * 60); // 5 minutes default
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [selectedSound, setSelectedSound] = useState('rain');
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const presets = [
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '15 min', value: 900 },
    { label: '20 min', value: 1200 },
    { label: '30 min', value: 1800 }
  ];

  const sounds = [
    { id: 'none', name: 'Silence' },
    { id: 'rain', name: 'Rain' },
    { id: 'ocean', name: 'Ocean Waves' },
    { id: 'forest', name: 'Forest' },
    { id: 'bells', name: 'Singing Bowls' }
  ];

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  const completeSession = () => {
    setIsActive(false);
    // Play completion sound
    playCompletionSound();
    
    // Save session
    const session: MeditationSession = {
      duration: duration - timeRemaining,
      type: 'guided',
      completedAt: new Date()
    };
    console.log('Session completed:', session);
  };

  const playCompletionSound = () => {
    // Mock sound play
    const audio = new Audio();
    audio.volume = 0.5;
    // audio.play();
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeRemaining(duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((duration - timeRemaining) / duration) * 100;
  };

  return (
    <div className="meditation-timer">
      <div className="timer-header">
        <h2>Meditation Timer</h2>
        <p>Find your calm, one breath at a time</p>
      </div>

      <div className="timer-display">
        <svg className="progress-ring" viewBox="0 0 200 200">
          <circle
            className="progress-ring-bg"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            strokeWidth="10"
          />
          <circle
            className="progress-ring-fill"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - getProgress() / 100)}`}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="time-text">{formatTime(timeRemaining)}</div>
      </div>

      <div className="preset-durations">
        {presets.map(preset => (
          <button
            key={preset.value}
            className={`preset-btn ${duration === preset.value ? 'active' : ''}`}
            onClick={() => {
              setDuration(preset.value);
              setTimeRemaining(preset.value);
              setIsActive(false);
            }}
            disabled={isActive}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="sound-selector">
        <Music size={20} />
        <select
          value={selectedSound}
          onChange={(e) => setSelectedSound(e.target.value)}
          disabled={isActive}
        >
          {sounds.map(sound => (
            <option key={sound.id} value={sound.id}>
              {sound.name}
            </option>
          ))}
        </select>
      </div>

      <div className="timer-controls">
        <button className="control-btn" onClick={resetTimer} disabled={!isActive && timeRemaining === duration}>
          <RotateCcw size={24} />
        </button>
        <button className={`play-btn ${isActive ? 'active' : ''}`} onClick={toggleTimer}>
          {isActive ? <Pause size={32} /> : <Play size={32} />}
        </button>
        <button className="control-btn" disabled>
          <Volume2 size={24} />
        </button>
      </div>

      <div className="meditation-tips">
        <h3>Quick Tips</h3>
        <ul>
          <li>Find a comfortable, quiet space</li>
          <li>Focus on your breath</li>
          <li>Let thoughts pass without judgment</li>
          <li>Be gentle with yourself</li>
        </ul>
      </div>
    </div>
  );
};

export default MeditationTimer;
