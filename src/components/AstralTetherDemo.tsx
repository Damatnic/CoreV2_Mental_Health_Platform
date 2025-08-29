import React, { useState, useEffect } from 'react';
import { Star, Sparkles, Heart, Circle } from 'lucide-react';
import '../styles/AstralTetherDemo.css';

const AstralTetherDemo: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const phases = [
      { phase: 'inhale', duration: 4000 },
      { phase: 'hold', duration: 7000 },
      { phase: 'exhale', duration: 8000 }
    ];

    let currentPhaseIndex = 0;
    let phaseTimer: NodeJS.Timeout;

    const runPhase = () => {
      const current = phases[currentPhaseIndex];
      setBreathPhase(current.phase as any);
      
      phaseTimer = setTimeout(() => {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        runPhase();
      }, current.duration);
    };

    runPhase();

    return () => {
      if (phaseTimer) clearTimeout(phaseTimer);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 190);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleStart = () => {
    setIsActive(true);
  };

  const handleStop = () => {
    setIsActive(false);
    setBreathPhase('inhale');
    setProgress(0);
  };

  const getPhaseMessage = () => {
    switch (breathPhase) {
      case 'inhale':
        return 'Breathe In... 4 seconds';
      case 'hold':
        return 'Hold... 7 seconds';
      case 'exhale':
        return 'Breathe Out... 8 seconds';
    }
  };

  return (
    <div className="astral-tether-demo">
      <div className="tether-header">
        <Sparkles size={24} />
        <h2>Astral Tether Breathing</h2>
        <p>Ground yourself with the 4-7-8 technique</p>
      </div>

      <div className="visualization">
        <div className={`breathing-circle ${isActive ? 'active' : ''} ${breathPhase}`}>
          <div className="inner-circle">
            <Star size={48} className="center-icon" />
          </div>
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
        </div>

        {isActive && (
          <div className="phase-indicator">
            <p className="phase-text">{getPhaseMessage()}</p>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="controls">
        {!isActive ? (
          <button className="start-btn" onClick={handleStart}>
            <Star size={20} />
            Begin Journey
          </button>
        ) : (
          <button className="stop-btn" onClick={handleStop}>
            <Circle size={20} />
            End Session
          </button>
        )}
      </div>

      <div className="benefits">
        <h3>Benefits of 4-7-8 Breathing</h3>
        <div className="benefits-grid">
          <div className="benefit">
            <Heart size={20} />
            <span>Reduces anxiety</span>
          </div>
          <div className="benefit">
            <Star size={20} />
            <span>Improves focus</span>
          </div>
          <div className="benefit">
            <Sparkles size={20} />
            <span>Promotes relaxation</span>
          </div>
          <div className="benefit">
            <Circle size={20} />
            <span>Better sleep</span>
          </div>
        </div>
      </div>

      <div className="instructions">
        <h3>How to Practice</h3>
        <ol>
          <li>Find a comfortable seated position</li>
          <li>Place your tongue behind your upper front teeth</li>
          <li>Exhale completely through your mouth</li>
          <li>Follow the guided breathing pattern</li>
          <li>Repeat for 4-8 cycles</li>
        </ol>
      </div>
    </div>
  );
};

export default AstralTetherDemo;
