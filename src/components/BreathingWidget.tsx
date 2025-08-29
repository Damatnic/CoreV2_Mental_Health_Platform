import React, { useState, useEffect } from 'react';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react';
import '../styles/BreathingWidget.css';

interface BreathingWidgetProps {
  autoStart?: boolean;
  pattern?: '478' | 'box' | 'simple';
  onSessionComplete?: (duration: number) => void;
}

const BreathingWidget: React.FC<BreathingWidgetProps> = ({
  autoStart = false,
  pattern = '478',
  onSessionComplete
}) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [countdown, setCountdown] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);

  const patterns = {
    '478': {
      name: '4-7-8 Breathing',
      phases: [
        { name: 'inhale', duration: 4 },
        { name: 'hold', duration: 7 },
        { name: 'exhale', duration: 8 }
      ]
    },
    box: {
      name: 'Box Breathing',
      phases: [
        { name: 'inhale', duration: 4 },
        { name: 'hold', duration: 4 },
        { name: 'exhale', duration: 4 },
        { name: 'hold', duration: 4 }
      ]
    },
    simple: {
      name: 'Simple Breathing',
      phases: [
        { name: 'inhale', duration: 3 },
        { name: 'exhale', duration: 4 }
      ]
    }
  };

  const currentPattern = patterns[pattern];
  const currentPhaseIndex = currentPattern.phases.findIndex(p => p.name === phase);

  useEffect(() => {
    if (autoStart) {
      handleStart();
    }
  }, [autoStart]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          const nextPhaseIndex = (currentPhaseIndex + 1) % currentPattern.phases.length;
          const nextPhase = currentPattern.phases[nextPhaseIndex];
          
          setPhase(nextPhase.name as any);
          
          // Count cycles when we complete a full cycle
          if (nextPhaseIndex === 0) {
            setCycleCount(c => c + 1);
          }
          
          return nextPhase.duration;
        }
        return prev - 1;
      });
    }, 1000);

    const sessionTimer = setInterval(() => {
      setSessionTime(t => t + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(sessionTimer);
    };
  }, [isActive, currentPhaseIndex, currentPattern]);

  const handleStart = () => {
    setIsActive(true);
    setCountdown(currentPattern.phases[0].duration);
    setPhase('inhale');
    setCycleCount(0);
    setSessionTime(0);
  };

  const handleStop = () => {
    setIsActive(false);
    onSessionComplete?.(sessionTime);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('inhale');
    setCountdown(4);
    setCycleCount(0);
    setSessionTime(0);
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe in slowly...';
      case 'hold':
        return 'Hold your breath...';
      case 'exhale':
        return 'Breathe out slowly...';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="breathing-widget">
      <div className="widget-header">
        <Wind size={20} />
        <h3>{currentPattern.name}</h3>
        {sessionTime > 0 && (
          <span className="session-time">{formatTime(sessionTime)}</span>
        )}
      </div>

      <div className={`breathing-circle ${isActive ? 'active' : ''} ${phase}`}>
        <div className="circle-inner">
          <div className="countdown-display">{countdown}</div>
          {isActive && (
            <p className="phase-instruction">{getPhaseInstruction()}</p>
          )}
        </div>
      </div>

      <div className="widget-controls">
        {!isActive ? (
          <button className="control-btn start" onClick={handleStart}>
            <Play size={16} />
            Start
          </button>
        ) : (
          <button className="control-btn stop" onClick={handleStop}>
            <Pause size={16} />
            Stop
          </button>
        )}
        
        <button className="control-btn reset" onClick={handleReset}>
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {cycleCount > 0 && (
        <div className="cycle-counter">
          <span>{cycleCount} cycles completed</span>
        </div>
      )}

      <div className="breathing-tips">
        <p>Find a comfortable position and breathe naturally with the rhythm.</p>
      </div>
    </div>
  );
};

export default BreathingWidget;
