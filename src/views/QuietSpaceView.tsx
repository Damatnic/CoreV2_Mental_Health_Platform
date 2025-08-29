import React, { useState, useEffect, useRef } from 'react';
import { HeartIcon, SparkleIcon, BookIcon, PlayIcon, PauseIcon } from '../components/icons.dynamic';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { useNotification } from '../contexts/NotificationContext';

interface BreathingPattern {
  name: string;
  description: string;
  phases: Array<{
    phase: 'inhale' | 'hold' | 'exhale' | 'pause';
    duration: number;
    text: string;
  }>;
}

interface MeditationSession {
  id: string;
  title: string;
  description: string;
  duration: number;
  audioUrl?: string;
  category: 'breathing' | 'mindfulness' | 'body-scan' | 'loving-kindness';
}

const QuietSpaceView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'breathing' | 'meditation' | 'sounds'>('breathing');
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern | null>(null);
  const [selectedMeditation, setSelectedMeditation] = useState<MeditationSession | null>(null);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [isMeditationPlaying, setIsMeditationPlaying] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breathingCycle, setBreathingCycle] = useState(0);
  const [meditationTime, setMeditationTime] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(5);
  
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const meditationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { showNotification } = useNotification();

  const breathingPatterns: BreathingPattern[] = [
    {
      name: '4-7-8 Breathing',
      description: 'Calming technique for anxiety and sleep',
      phases: [
        { phase: 'inhale', duration: 4000, text: 'Breathe in slowly through your nose' },
        { phase: 'hold', duration: 7000, text: 'Hold your breath gently' },
        { phase: 'exhale', duration: 8000, text: 'Exhale slowly through your mouth' },
        { phase: 'pause', duration: 2000, text: 'Rest and prepare for the next breath' }
      ]
    },
    {
      name: 'Box Breathing',
      description: 'Equal timing for focus and balance',
      phases: [
        { phase: 'inhale', duration: 4000, text: 'Breathe in for 4 counts' },
        { phase: 'hold', duration: 4000, text: 'Hold for 4 counts' },
        { phase: 'exhale', duration: 4000, text: 'Breathe out for 4 counts' },
        { phase: 'hold', duration: 4000, text: 'Hold empty for 4 counts' }
      ]
    },
    {
      name: 'Coherent Breathing',
      description: 'Simple 5-second rhythm for relaxation',
      phases: [
        { phase: 'inhale', duration: 5000, text: 'Breathe in slowly and deeply' },
        { phase: 'exhale', duration: 5000, text: 'Breathe out slowly and completely' }
      ]
    }
  ];

  const meditationSessions: MeditationSession[] = [
    {
      id: '1',
      title: 'Mindful Breathing',
      description: 'Focus on your breath to center your mind',
      duration: 300, // 5 minutes
      category: 'breathing'
    },
    {
      id: '2',
      title: 'Body Scan Relaxation',
      description: 'Progressive relaxation through body awareness',
      duration: 600, // 10 minutes
      category: 'body-scan'
    },
    {
      id: '3',
      title: 'Loving-Kindness Meditation',
      description: 'Cultivate compassion for yourself and others',
      duration: 900, // 15 minutes
      category: 'loving-kindness'
    },
    {
      id: '4',
      title: 'Present Moment Awareness',
      description: 'Simple mindfulness practice for beginners',
      duration: 180, // 3 minutes
      category: 'mindfulness'
    }
  ];

  useEffect(() => {
    return () => {
      if (breathingTimerRef.current) {
        clearTimeout(breathingTimerRef.current);
      }
      if (meditationTimerRef.current) {
        clearInterval(meditationTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startBreathingExercise = (pattern: BreathingPattern) => {
    setSelectedPattern(pattern);
    setIsBreathingActive(true);
    setBreathingPhase(0);
    setBreathingCycle(0);
    runBreathingCycle(pattern, 0);
  };

  const runBreathingCycle = (pattern: BreathingPattern, phaseIndex: number) => {
    if (!isBreathingActive) return;

    const currentPhase = pattern.phases[phaseIndex];
    setBreathingPhase(phaseIndex);

    breathingTimerRef.current = setTimeout(() => {
      const nextPhaseIndex = (phaseIndex + 1) % pattern.phases.length;
      
      if (nextPhaseIndex === 0) {
        setBreathingCycle(prev => prev + 1);
      }
      
      runBreathingCycle(pattern, nextPhaseIndex);
    }, currentPhase.duration);
  };

  const stopBreathingExercise = () => {
    setIsBreathingActive(false);
    setSelectedPattern(null);
    if (breathingTimerRef.current) {
      clearTimeout(breathingTimerRef.current);
    }
  };

  const startMeditation = (session: MeditationSession) => {
    setSelectedMeditation(session);
    setIsMeditationPlaying(true);
    setMeditationTime(0);
    
    meditationTimerRef.current = setInterval(() => {
      setMeditationTime(prev => {
        if (prev >= session.duration) {
          stopMeditation();
          showNotification('Meditation session completed!', 'success');
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    if (session.audioUrl && audioRef.current) {
      audioRef.current.src = session.audioUrl;
      audioRef.current.play().catch(console.error);
    }
  };

  const stopMeditation = () => {
    setIsMeditationPlaying(false);
    setSelectedMeditation(null);
    setMeditationTime(0);
    
    if (meditationTimerRef.current) {
      clearInterval(meditationTimerRef.current);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingInstructions = (): string => {
    if (!selectedPattern || !isBreathingActive) return 'Select a breathing pattern to begin';
    return selectedPattern.phases[breathingPhase]?.text || '';
  };

  const getBreathingPhaseColor = (): string => {
    if (!selectedPattern || !isBreathingActive) return '#e5e7eb';
    
    const phase = selectedPattern.phases[breathingPhase]?.phase;
    switch (phase) {
      case 'inhale': return '#10b981';
      case 'hold': return '#3b82f6';
      case 'exhale': return '#f59e0b';
      case 'pause': return '#8b5cf6';
      default: return '#e5e7eb';
    }
  };

  return (
    <div className="quiet-space-view">
      <div className="quiet-space-header">
        <h1>
          <SparkleIcon />
          Quiet Space
        </h1>
        <p>Find peace and calm through guided breathing, meditation, and soothing sounds</p>
      </div>

      <div className="space-navigation">
        <button
          className={`nav-button ${activeSection === 'breathing' ? 'active' : ''}`}
          onClick={() => setActiveSection('breathing')}
        >
          <HeartIcon />
          <span>Breathing</span>
        </button>
        <button
          className={`nav-button ${activeSection === 'meditation' ? 'active' : ''}`}
          onClick={() => setActiveSection('meditation')}
        >
          <BookIcon />
          <span>Meditation</span>
        </button>
        <button
          className={`nav-button ${activeSection === 'sounds' ? 'active' : ''}`}
          onClick={() => setActiveSection('sounds')}
        >
          <PlayIcon />
          <span>Calming Sounds</span>
        </button>
      </div>

      <div className="space-content">
        {activeSection === 'breathing' && (
          <div className="breathing-section">
            {!isBreathingActive ? (
              <div className="breathing-patterns">
                <h2>Choose a Breathing Pattern</h2>
                <div className="patterns-grid">
                  {breathingPatterns.map((pattern, index) => (
                    <Card key={index} className="pattern-card">
                      <div className="pattern-info">
                        <h3>{pattern.name}</h3>
                        <p>{pattern.description}</p>
                        <div className="pattern-phases">
                          {pattern.phases.map((phase, phaseIndex) => (
                            <span key={phaseIndex} className={`phase-indicator ${phase.phase}`}>
                              {phase.phase}
                            </span>
                          ))}
                        </div>
                      </div>
                      <AppButton
                        onClick={() => startBreathingExercise(pattern)}
                        className="start-pattern-btn"
                      >
                        Start
                      </AppButton>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="breathing-exercise">
                <div className="breathing-visual">
                  <div 
                    className="breathing-circle"
                    style={{ 
                      backgroundColor: getBreathingPhaseColor(),
                      transform: breathingPhase % 2 === 0 ? 'scale(1.2)' : 'scale(0.8)',
                      transition: `transform ${selectedPattern?.phases[breathingPhase]?.duration || 1000}ms ease-in-out`
                    }}
                  />
                </div>
                
                <div className="breathing-info">
                  <h2>{selectedPattern?.name}</h2>
                  <div className="breathing-instructions">
                    {getBreathingInstructions()}
                  </div>
                  <div className="breathing-stats">
                    <span>Cycle: {breathingCycle + 1}</span>
                    <span>Phase: {selectedPattern?.phases[breathingPhase]?.phase}</span>
                  </div>
                </div>
                
                <AppButton
                  variant="secondary"
                  onClick={stopBreathingExercise}
                  className="stop-breathing-btn"
                >
                  Stop Exercise
                </AppButton>
              </div>
            )}
          </div>
        )}

        {activeSection === 'meditation' && (
          <div className="meditation-section">
            {!isMeditationPlaying ? (
              <div className="meditation-library">
                <h2>Guided Meditations</h2>
                <div className="meditations-grid">
                  {meditationSessions.map(session => (
                    <Card key={session.id} className="meditation-card">
                      <div className="meditation-info">
                        <h3>{session.title}</h3>
                        <p>{session.description}</p>
                        <div className="meditation-meta">
                          <span className="duration">{formatTime(session.duration)}</span>
                          <span className={`category ${session.category}`}>
                            {session.category.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      <AppButton
                        onClick={() => startMeditation(session)}
                        className="start-meditation-btn"
                      >
                        <PlayIcon />
                        Start
                      </AppButton>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="meditation-player">
                <div className="meditation-visual">
                  <div className="meditation-circle">
                    <div className="progress-ring">
                      <svg width="200" height="200">
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 90}`}
                          strokeDashoffset={`${2 * Math.PI * 90 * (1 - meditationTime / (selectedMeditation?.duration || 1))}`}
                          transform="rotate(-90 100 100)"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="meditation-info">
                  <h2>{selectedMeditation?.title}</h2>
                  <div className="meditation-timer">
                    <div className="time-display">
                      {formatTime(meditationTime)} / {formatTime(selectedMeditation?.duration || 0)}
                    </div>
                    <div className="time-remaining">
                      {formatTime((selectedMeditation?.duration || 0) - meditationTime)} remaining
                    </div>
                  </div>
                </div>
                
                <div className="meditation-controls">
                  <AppButton
                    variant="secondary"
                    onClick={stopMeditation}
                  >
                    <PauseIcon />
                    Stop
                  </AppButton>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'sounds' && (
          <div className="sounds-section">
            <h2>Calming Sounds</h2>
            <div className="sounds-grid">
              <Card className="sound-card">
                <h3>Rain Sounds</h3>
                <p>Gentle rainfall for relaxation</p>
                <AppButton>
                  <PlayIcon />
                  Play
                </AppButton>
              </Card>
              
              <Card className="sound-card">
                <h3>Ocean Waves</h3>
                <p>Peaceful ocean sounds</p>
                <AppButton>
                  <PlayIcon />
                  Play
                </AppButton>
              </Card>
              
              <Card className="sound-card">
                <h3>Forest Ambience</h3>
                <p>Birds and nature sounds</p>
                <AppButton>
                  <PlayIcon />
                  Play
                </AppButton>
              </Card>
              
              <Card className="sound-card">
                <h3>White Noise</h3>
                <p>Consistent background sound</p>
                <AppButton>
                  <PlayIcon />
                  Play
                </AppButton>
              </Card>
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} />
    </div>
  );
};

export default QuietSpaceView;
