/**
 * Enhanced Tether View
 * Advanced mindfulness and breathing exercises with real-time guidance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

// Mock tether store since it doesn't exist
const useTetherStore = () => {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  
  return {
    currentSession,
    sessions,
    startSession: (session: any) => {
      setCurrentSession(session);
      console.log('Starting session:', session);
    },
    endSession: (updatedSession?: any) => {
      if (updatedSession) {
        console.log('Ending session with data:', updatedSession);
      }
      setCurrentSession(null);
      console.log('Session ended');
    },
    updateSessionMood: (mood: number) => {
      console.log('Updating session mood:', mood);
    },
    state: { currentSession, sessions }
  };
};
import { Card } from '../components/Card';
import { ViewHeader } from '../components/ViewHeader';
import { AppButton } from '../components/AppButton';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  HeartIcon, 
  WindIcon,
  MoonIcon,
  SunIcon,
  SparkleIcon,
  RefreshIcon
} from '../components/icons.dynamic';
import './EnhancedTetherView.css';

export interface BreathingPattern {
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  pause: number;
  description: string;
  benefits: string[];
}

export interface BreathingGuideProps {
  pattern: BreathingPattern;
  isActive: boolean;
  onPhaseChange?: (phase: BreathingPhase) => void;
  onCycleComplete?: () => void;
}

export type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'pause';

export interface TetherSession {
  id: string;
  type: 'breathing' | 'meditation' | 'grounding' | 'visualization';
  duration: number;
  startTime: Date;
  endTime?: Date;
  pattern?: BreathingPattern;
  notes?: string;
  mood: {
    before: number;
    after?: number;
  };
  effectiveness: number;
}

export interface GroundingExercise {
  id: string;
  name: string;
  description: string;
  steps: string[];
  duration: number;
  type: '54321' | 'body-scan' | 'mindful-observation' | 'progressive-relaxation';
}

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    name: 'Box Breathing',
    inhale: 4,
    hold: 4,
    exhale: 4,
    pause: 4,
    description: 'Equal timing for all phases - great for focus and calm',
    benefits: ['Reduces stress', 'Improves focus', 'Regulates nervous system']
  },
  {
    name: '4-7-8 Technique',
    inhale: 4,
    hold: 7,
    exhale: 8,
    pause: 0,
    description: 'Natural tranquilizer for the nervous system',
    benefits: ['Promotes sleep', 'Reduces anxiety', 'Calms mind']
  },
  {
    name: 'Coherent Breathing',
    inhale: 5,
    hold: 0,
    exhale: 5,
    pause: 0,
    description: 'Simple 5-5 rhythm for heart rate variability',
    benefits: ['Balances autonomic nervous system', 'Improves HRV', 'Enhances emotional regulation']
  },
  {
    name: 'Energizing Breath',
    inhale: 3,
    hold: 2,
    exhale: 4,
    pause: 1,
    description: 'Quick rhythm to boost energy and alertness',
    benefits: ['Increases alertness', 'Boosts energy', 'Improves circulation']
  }
];

const GROUNDING_EXERCISES: GroundingExercise[] = [
  {
    id: '54321',
    name: '5-4-3-2-1 Technique',
    description: 'Use your senses to ground yourself in the present moment',
    type: '54321',
    duration: 300,
    steps: [
      'Notice 5 things you can see',
      'Notice 4 things you can touch',
      'Notice 3 things you can hear',
      'Notice 2 things you can smell',
      'Notice 1 thing you can taste'
    ]
  },
  {
    id: 'body-scan',
    name: 'Body Scan',
    description: 'Progressive awareness of physical sensations',
    type: 'body-scan',
    duration: 600,
    steps: [
      'Start with your toes and feet',
      'Move attention to your legs',
      'Notice your torso and back',
      'Feel your arms and hands',
      'Relax your neck and head',
      'Take in your whole body'
    ]
  }
];

const BreathingGuide: React.FC<BreathingGuideProps> = ({ 
  pattern, 
  isActive, 
  onPhaseChange,
  onCycleComplete 
}) => {
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [progress, setProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseStartRef = useRef<number>(Date.now());

  const getPhaseColor = (currentPhase: BreathingPhase): string => {
    switch (currentPhase) {
      case 'inhale': return '#4ade80'; // green
      case 'hold': return '#fbbf24';   // yellow
      case 'exhale': return '#60a5fa'; // blue
      case 'pause': return '#a78bfa';  // purple
      default: return '#6b7280';       // gray
    }
  };

  const getPhaseInstruction = (currentPhase: BreathingPhase): string => {
    switch (currentPhase) {
      case 'inhale': return 'Breathe in slowly...';
      case 'hold': return 'Hold your breath...';
      case 'exhale': return 'Breathe out slowly...';
      case 'pause': return 'Pause naturally...';
      default: return 'Focus on your breath...';
    }
  };

  const cyclePhases = useCallback(() => {
    const phases: BreathingPhase[] = (['inhale', 'hold', 'exhale', 'pause'] as const).filter(
      (p) => {
        const value = pattern[p as keyof BreathingPattern];
        return typeof value === 'number' && value > 0;
      }
    ) as BreathingPhase[];
    
    const currentIndex = phases.indexOf(phase);
    const nextIndex = (currentIndex + 1) % phases.length;
    const nextPhase = phases[nextIndex];
    
    // Check if we completed a full cycle
    if (nextPhase === 'inhale' && phase !== 'inhale') {
      setCycleCount(prev => prev + 1);
      onCycleComplete?.();
    }
    
    setPhase(nextPhase);
    onPhaseChange?.(nextPhase);
    setProgress(0);
    phaseStartRef.current = Date.now();
  }, [phase, pattern, onPhaseChange, onCycleComplete]);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const currentPhaseDuration = pattern[phase] * 1000;
    phaseStartRef.current = Date.now();

    // Update progress every 50ms
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - phaseStartRef.current;
      const newProgress = Math.min((elapsed / currentPhaseDuration) * 100, 100);
      
      setProgress(newProgress);
      
      if (elapsed >= currentPhaseDuration) {
        cyclePhases();
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, phase, pattern, cyclePhases]);

  const circumference = 2 * Math.PI * 90; // radius of 90
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="breathing-guide">
      <div className="breathing-circle-container">
        <svg className="breathing-circle" width="200" height="200">
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke={getPhaseColor(phase)}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.1s ease-out',
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>
        <div className="breathing-center">
          <div className="phase-icon">
            {phase === 'inhale' && <div className="w-8 h-8"><WindIcon /></div>}
            {phase === 'hold' && <div className="w-8 h-8"><PauseIcon /></div>}
            {phase === 'exhale' && <div className="w-8 h-8"><MoonIcon /></div>}
            {phase === 'pause' && <div className="w-8 h-8"><SparkleIcon /></div>}
          </div>
          <div className="phase-text">
            <div className="phase-name">{phase.toUpperCase()}</div>
            <div className="phase-duration">{pattern[phase]}s</div>
          </div>
        </div>
      </div>
      
      <div className="breathing-instructions">
        <p className="instruction-text">{getPhaseInstruction(phase)}</p>
        <div className="cycle-counter">
          <span>Cycles completed: {cycleCount}</span>
        </div>
      </div>
    </div>
  );
};

const EnhancedTetherView: React.FC = () => {
  const { 
    currentSession, 
    sessions, 
    startSession, 
    endSession, 
    updateSessionMood 
  } = useTetherStore();
  const { showNotification } = useNotifications();

  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(BREATHING_PATTERNS[0]);
  const [isBreathing, setIsBreathing] = useState(false);
  const [sessionType, setSessionType] = useState<'breathing' | 'grounding'>('breathing');
  const [selectedGrounding, setSelectedGrounding] = useState<GroundingExercise>(GROUNDING_EXERCISES[0]);
  const [moodBefore, setMoodBefore] = useState<number>(5);
  const [moodAfter, setMoodAfter] = useState<number>(5);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleStartSession = useCallback(() => {
    const session: TetherSession = {
      id: `session_${Date.now()}`,
      type: sessionType,
      duration: sessionType === 'breathing' ? 600 : selectedGrounding.duration,
      startTime: new Date(),
      pattern: sessionType === 'breathing' ? selectedPattern : undefined,
      mood: { before: moodBefore },
      effectiveness: 0
    };

    startSession(session);
    setIsBreathing(true);
    showNotification('Your mindfulness session has begun', 'info');
  }, [sessionType, selectedPattern, selectedGrounding, moodBefore, startSession, showNotification]);

  const handleEndSession = useCallback(() => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        endTime: new Date(),
        mood: { ...currentSession.mood, after: moodAfter },
        notes: sessionNotes,
        effectiveness: Math.max(0, moodAfter - moodBefore)
      };

      endSession(updatedSession);
      setIsBreathing(false);
      setShowResults(true);
      showNotification('Great work on your mindfulness practice!', 'success');
    }
  }, [currentSession, moodAfter, sessionNotes, moodBefore, endSession, showNotification]);

  const handlePhaseChange = useCallback((phase: BreathingPhase) => {
    // Could add haptic feedback or sound cues here
    console.log(`Phase changed to: ${phase}`);
  }, []);

  const handleCycleComplete = useCallback(() => {
    // Track completed breathing cycles
    console.log('Breathing cycle completed');
  }, []);

  const resetSession = () => {
    setShowResults(false);
    setSessionNotes('');
    setMoodAfter(5);
  };

  const getSessionStats = () => {
    const completedSessions = sessions.filter(s => s.endTime);
    const totalSessions = completedSessions.length;
    const avgEffectiveness = totalSessions > 0 
      ? completedSessions.reduce((sum, s) => sum + s.effectiveness, 0) / totalSessions 
      : 0;
    const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0) / 60;

    return { totalSessions, avgEffectiveness, totalMinutes };
  };

  const stats = getSessionStats();

  return (
    <div className="enhanced-tether-view">
      <ViewHeader 
        title="Enhanced Tether" 
        subtitle="Advanced mindfulness and breathing exercises"
      />

      {/* Session Stats */}
      <Card className="stats-card">
        <h3>Your Progress</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{stats.totalSessions}</span>
            <span className="stat-label">Sessions</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{Math.round(stats.totalMinutes)}</span>
            <span className="stat-label">Minutes</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.avgEffectiveness.toFixed(1)}</span>
            <span className="stat-label">Avg Improvement</span>
          </div>
        </div>
      </Card>

      {/* Session Type Selection */}
      <Card className="session-type-card">
        <h3>Choose Your Practice</h3>
        <div className="session-type-buttons">
          <AppButton
            variant={sessionType === 'breathing' ? 'primary' : 'secondary'}
            onClick={() => setSessionType('breathing')}
            icon={<WindIcon />}
          >
            Breathing Exercises
          </AppButton>
          <AppButton
            variant={sessionType === 'grounding' ? 'primary' : 'secondary'}
            onClick={() => setSessionType('grounding')}
            icon={<SparkleIcon />}
          >
            Grounding Techniques
          </AppButton>
        </div>
      </Card>

      {/* Breathing Pattern Selection */}
      {sessionType === 'breathing' && (
        <Card className="pattern-selection-card">
          <h3>Select Breathing Pattern</h3>
          <div className="patterns-grid">
            {BREATHING_PATTERNS.map((pattern) => (
              <div
                key={pattern.name}
                className={`pattern-card ${selectedPattern.name === pattern.name ? 'selected' : ''}`}
                onClick={() => setSelectedPattern(pattern)}
              >
                <h4>{pattern.name}</h4>
                <p className="pattern-timing">
                  {pattern.inhale}-{pattern.hold}-{pattern.exhale}-{pattern.pause}
                </p>
                <p className="pattern-description">{pattern.description}</p>
                <div className="pattern-benefits">
                  {pattern.benefits.map((benefit, index) => (
                    <span key={index} className="benefit-tag">{benefit}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grounding Exercise Selection */}
      {sessionType === 'grounding' && (
        <Card className="grounding-selection-card">
          <h3>Select Grounding Exercise</h3>
          <div className="grounding-grid">
            {GROUNDING_EXERCISES.map((exercise) => (
              <div
                key={exercise.id}
                className={`grounding-card ${selectedGrounding.id === exercise.id ? 'selected' : ''}`}
                onClick={() => setSelectedGrounding(exercise)}
              >
                <h4>{exercise.name}</h4>
                <p className="grounding-duration">{exercise.duration / 60} minutes</p>
                <p className="grounding-description">{exercise.description}</p>
                <div className="grounding-steps">
                  {exercise.steps.map((step, index) => (
                    <div key={index} className="step-item">
                      <span className="step-number">{index + 1}</span>
                      <span className="step-text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mood Check-in */}
      <Card className="mood-checkin-card">
        <h3>How are you feeling?</h3>
        <div className="mood-slider">
          <label>Before session: {moodBefore}/10</label>
          <input
            type="range"
            min="1"
            max="10"
            value={moodBefore}
            onChange={(e) => setMoodBefore(Number(e.target.value))}
            className="mood-range"
          />
        </div>
        {showResults && (
          <div className="mood-slider">
            <label>After session: {moodAfter}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={moodAfter}
              onChange={(e) => setMoodAfter(Number(e.target.value))}
              className="mood-range"
            />
          </div>
        )}
      </Card>

      {/* Breathing Guide */}
      {isBreathing && sessionType === 'breathing' && (
        <Card className="breathing-guide-card">
          <BreathingGuide
            pattern={selectedPattern}
            isActive={isBreathing}
            onPhaseChange={handlePhaseChange}
            onCycleComplete={handleCycleComplete}
          />
        </Card>
      )}

      {/* Session Controls */}
      <Card className="session-controls-card">
        {!isBreathing ? (
          <AppButton
            variant="primary"
            size="lg"
            onClick={handleStartSession}
            icon={<PlayIcon />}
            className="start-session-btn"
          >
            Start Session
          </AppButton>
        ) : (
          <div className="active-controls">
            <AppButton
              variant="danger"
              onClick={handleEndSession}
              icon={<StopIcon />}
            >
              End Session
            </AppButton>
          </div>
        )}
      </Card>

      {/* Session Results Modal */}
      {showResults && (
        <div className="session-results-modal">
          <Card className="results-card">
            <h3>Session Complete!</h3>
            <div className="results-content">
              <div className="mood-improvement">
                <span>Mood improvement: +{moodAfter - moodBefore}</span>
              </div>
              <div className="session-notes">
                <label>Session Notes (optional):</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="How did this session feel? Any insights?"
                  rows={3}
                />
              </div>
              <div className="results-actions">
                <AppButton variant="secondary" onClick={resetSession}>
                  Start Another
                </AppButton>
                <AppButton variant="primary" onClick={() => setShowResults(false)}>
                  Done
                </AppButton>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedTetherView;
