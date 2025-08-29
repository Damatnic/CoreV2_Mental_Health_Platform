import React, { useState, useEffect, useRef } from 'react';
import { Wind, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import '../styles/MobileBreathing.css';

interface MobileBreathingProps {
  onComplete?: (duration: number) => void;
  hapticFeedback?: boolean;
  initialPattern?: 'box' | '478' | 'equal';
}

const MobileBreathing: React.FC<MobileBreathingProps> = ({
  onComplete,
  hapticFeedback = true,
  initialPattern = '478'
}) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [countdown, setCountdown] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [pattern, setPattern] = useState(initialPattern);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();

  const patterns = {
    box: {
      name: 'Box Breathing',
      phases: [
        { name: 'inhale' as const, duration: 4, instruction: 'Breathe in' },
        { name: 'hold' as const, duration: 4, instruction: 'Hold' },
        { name: 'exhale' as const, duration: 4, instruction: 'Breathe out' },
        { name: 'pause' as const, duration: 4, instruction: 'Rest' }
      ]
    },
    '478': {
      name: '4-7-8 Breathing',
      phases: [
        { name: 'inhale' as const, duration: 4, instruction: 'Breathe in' },
        { name: 'hold' as const, duration: 7, instruction: 'Hold' },
        { name: 'exhale' as const, duration: 8, instruction: 'Breathe out' }
      ]
    },
    equal: {
      name: 'Equal Breathing',
      phases: [
        { name: 'inhale' as const, duration: 4, instruction: 'Breathe in' },
        { name: 'exhale' as const, duration: 4, instruction: 'Breathe out' }
      ]
    }
  };

  const currentPattern = patterns[pattern];

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      runBreathingCycle();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, phase]);

  const runBreathingCycle = () => {
    const currentPhaseIndex = currentPattern.phases.findIndex(p => p.name === phase);
    const currentPhaseData = currentPattern.phases[currentPhaseIndex];
    
    let startTime = Date.now();
    const duration = currentPhaseData.duration * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const secondsRemaining = Math.ceil(remaining / 1000);

      setCountdown(secondsRemaining);

      if (remaining <= 0) {
        // Move to next phase
        const nextPhaseIndex = (currentPhaseIndex + 1) % currentPattern.phases.length;
        const nextPhase = currentPattern.phases[nextPhaseIndex];
        
        setPhase(nextPhase.name);
        
        // Increment cycle count when completing a full cycle
        if (nextPhaseIndex === 0) {
          setCycleCount(prev => prev + 1);
          triggerHaptic([200, 100, 200]); // Completion pattern
        } else {
          triggerHaptic(100); // Phase transition
        }
        
        playTone(nextPhase.name);
        
        // Update session duration
        if (startTimeRef.current) {
          setSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (hapticFeedback && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  };

  const playTone = (phaseType: string) => {
    if (!soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different tones for different phases
      const frequencies = {
        inhale: 440, // A4
        hold: 523,   // C5
        exhale: 349, // F4
        pause: 262   // C4
      };

      oscillator.frequency.setValueAtTime(frequencies[phaseType as keyof typeof frequencies] || 440, ctx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.warn('Audio tone failed:', error);
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setCycleCount(0);
    setSessionDuration(0);
    setPhase(currentPattern.phases[0].name);
    setCountdown(currentPattern.phases[0].duration);
    triggerHaptic(200); // Start vibration
  };

  const handleStop = () => {
    setIsActive(false);
    if (startTimeRef.current) {
      const totalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      onComplete?.(totalDuration);
    }
    triggerHaptic([100, 50, 100]); // Stop pattern
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase(currentPattern.phases[0].name);
    setCountdown(currentPattern.phases[0].duration);
    setCycleCount(0);
    setSessionDuration(0);
  };

  const getCurrentPhaseData = () => {
    return currentPattern.phases.find(p => p.name === phase) || currentPattern.phases[0];
  };

  const getPhaseProgress = () => {
    const phaseData = getCurrentPhaseData();
    const elapsed = phaseData.duration - countdown;
    return (elapsed / phaseData.duration) * 100;
  };

  const getCircleScale = () => {
    const progress = getPhaseProgress() / 100;
    switch (phase) {
      case 'inhale':
        return 0.5 + (progress * 0.5); // Scale from 0.5 to 1
      case 'exhale':
        return 1 - (progress * 0.5); // Scale from 1 to 0.5
      default:
        return phase === 'hold' ? 1 : 0.5; // Hold at current size, pause at small
    }
  };

  return (
    <div className="mobile-breathing">
      <div className="breathing-header">
        <Wind size={20} />
        <h2>Breathing Exercise</h2>
        <div className="header-controls">
          <button
            className="sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>

      <div className="pattern-selector">
        {Object.entries(patterns).map(([key, patternData]) => (
          <button
            key={key}
            className={`pattern-btn ${pattern === key ? 'active' : ''}`}
            onClick={() => setPattern(key as keyof typeof patterns)}
            disabled={isActive}
          >
            {patternData.name}
          </button>
        ))}
      </div>

      <div className="breathing-visualization">
        <div 
          className={`breathing-circle ${phase} ${isActive ? 'active' : ''}`}
          style={{
            transform: `scale(${getCircleScale()})`,
            transition: isActive ? `transform ${getCurrentPhaseData().duration}s ease-in-out` : 'none'
          }}
        >
          <div className="circle-inner">
            <div className="countdown">{countdown}</div>
            {isActive && (
              <div className="phase-info">
                <span className="phase-name">{getCurrentPhaseData().name}</span>
                <span className="instruction">{getCurrentPhaseData().instruction}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="breathing-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${getPhaseProgress()}%` }}
          />
        </div>
        <div className="progress-text">
          {isActive ? `${getCurrentPhaseData().instruction}...` : 'Ready to begin'}
        </div>
      </div>

      <div className="session-stats">
        <div className="stat">
          <span className="stat-value">{cycleCount}</span>
          <span className="stat-label">Cycles</span>
        </div>
        <div className="stat">
          <span className="stat-value">{Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}</span>
          <span className="stat-label">Time</span>
        </div>
      </div>

      <div className="breathing-controls">
        {!isActive ? (
          <button className="control-btn primary" onClick={handleStart}>
            <Play size={20} />
            Start
          </button>
        ) : (
          <button className="control-btn secondary" onClick={handleStop}>
            <Pause size={20} />
            Stop
          </button>
        )}
        
        <button className="control-btn tertiary" onClick={handleReset}>
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      <div className="breathing-tips">
        <h3>Mobile Tips</h3>
        <ul>
          <li>Hold your phone comfortably in both hands</li>
          <li>Enable sound for audio cues</li>
          <li>Use haptic feedback for timing</li>
          <li>Practice in a quiet environment</li>
        </ul>
      </div>
    </div>
  );
};

export default MobileBreathing;
