import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings } from 'lucide-react';
import '../styles/MeditationTimer.css';

interface MeditationTimerProps {
  onSessionComplete?: (duration: number, type: string) => void;
  defaultDuration?: number;
  autoStart?: boolean;
}

interface MeditationSettings {
  duration: number;
  bellSound: boolean;
  intervalBells: boolean;
  intervalMinutes: number;
  backgroundSound: 'none' | 'rain' | 'ocean' | 'forest';
  volume: number;
}

const MeditationTimer: React.FC<MeditationTimerProps> = ({
  onSessionComplete,
  defaultDuration = 10,
  autoStart = false
}) => {
  const [settings, setSettings] = useState<MeditationSettings>({
    duration: defaultDuration,
    bellSound: true,
    intervalBells: false,
    intervalMinutes: 5,
    backgroundSound: 'none',
    volume: 0.7
  });

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.duration * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<'starting' | 'active' | 'ending'>('starting');

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  // Preset durations (in minutes)
  const presetDurations = [5, 10, 15, 20, 30, 45, 60];

  useEffect(() => {
    if (autoStart) {
      handleStart();
    }
  }, [autoStart]);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionEnd();
            return 0;
          }
          
          // Play interval bell
          if (settings.intervalBells && settings.intervalMinutes > 0) {
            const elapsed = (settings.duration * 60) - prev;
            if (elapsed > 0 && elapsed % (settings.intervalMinutes * 60) === 0) {
              playBell('interval');
            }
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
  }, [isActive, isPaused, settings]);

  const playBell = (type: 'start' | 'interval' | 'end') => {
    if (!settings.bellSound || !audioContextRef.current) return;

    // Simple bell sound using Web Audio API
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const frequency = type === 'end' ? 440 : type === 'start' ? 523 : 392;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(settings.volume * 0.5, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);
  };

  const initializeAudio = async () => {
    try {
      audioContextRef.current = new AudioContext();
      
      if (settings.backgroundSound !== 'none') {
        // In a real app, you'd load actual audio files
        // For now, we'll just create a placeholder
        backgroundAudioRef.current = new Audio();
        backgroundAudioRef.current.loop = true;
        backgroundAudioRef.current.volume = settings.volume * 0.3;
      }
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  };

  const handleStart = async () => {
    if (!audioContextRef.current) {
      await initializeAudio();
    }

    setIsActive(true);
    setIsPaused(false);
    setSessionPhase('starting');
    
    if (settings.bellSound) {
      playBell('start');
    }

    if (backgroundAudioRef.current && settings.backgroundSound !== 'none') {
      try {
        await backgroundAudioRef.current.play();
      } catch (error) {
        console.warn('Background audio failed to play:', error);
      }
    }

    setTimeout(() => setSessionPhase('active'), 3000);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    
    if (backgroundAudioRef.current) {
      if (isPaused) {
        backgroundAudioRef.current.play();
      } else {
        backgroundAudioRef.current.pause();
      }
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(settings.duration * 60);
    setSessionPhase('starting');
    
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
    }
  };

  const handleSessionEnd = () => {
    setIsActive(false);
    setSessionPhase('ending');
    
    if (settings.bellSound) {
      playBell('end');
    }
    
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
    }

    const actualDuration = settings.duration - (timeLeft / 60);
    onSessionComplete?.(actualDuration, 'meditation');
  };

  const handleDurationChange = (newDuration: number) => {
    setSettings(prev => ({ ...prev, duration: newDuration }));
    if (!isActive) {
      setTimeLeft(newDuration * 60);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    const totalSeconds = settings.duration * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  const getPhaseMessage = (): string => {
    switch (sessionPhase) {
      case 'starting':
        return 'Find a comfortable position and close your eyes...';
      case 'active':
        return 'Focus on your breath and be present...';
      case 'ending':
        return 'Gently bring your attention back to the room...';
      default:
        return 'Ready to begin your meditation practice';
    }
  };

  return React.createElement('div', { className: "meditation-timer" },
    React.createElement('div', { className: "timer-header" },
      React.createElement('h2', null, "Meditation Timer"),
      React.createElement('button', {
        className: "settings-btn",
        onClick: () => setShowSettings(!showSettings)
      },
        React.createElement(Settings, { size: 20 })
      )
    ),
    
    showSettings && React.createElement('div', { className: "timer-settings" },
      React.createElement('div', { className: "duration-presets" },
        React.createElement('label', null, "Duration:"),
        React.createElement('div', { className: "preset-buttons" },
          presetDurations.map(duration => 
            React.createElement('button', {
              key: duration,
              className: `preset-btn ${settings.duration === duration ? 'active' : ''}`,
              onClick: () => handleDurationChange(duration),
              disabled: isActive
            }, `${duration}m`)
          )
        )
      ),
      
      React.createElement('div', { className: "sound-settings" },
        React.createElement('label', null,
          React.createElement('input', {
            type: "checkbox",
            checked: settings.bellSound,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({ ...prev, bellSound: e.target.checked }))
          }),
          "Bell sounds"
        ),
        React.createElement('label', null,
          React.createElement('input', {
            type: "checkbox",
            checked: settings.intervalBells,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({ ...prev, intervalBells: e.target.checked }))
          }),
          "Interval bells every",
          React.createElement('select', {
            value: settings.intervalMinutes,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSettings(prev => ({ ...prev, intervalMinutes: parseInt(e.target.value) })),
            disabled: !settings.intervalBells
          },
            React.createElement('option', { value: 5 }, "5 min"),
            React.createElement('option', { value: 10 }, "10 min"),
            React.createElement('option', { value: 15 }, "15 min")
          )
        )
      ),
      
      React.createElement('div', { className: "volume-control" },
        React.createElement('label', null, "Volume:"),
        React.createElement('input', {
          type: "range",
          min: "0",
          max: "1",
          step: "0.1",
          value: settings.volume,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))
        })
      )
    ),
    
    React.createElement('div', { className: "timer-display" },
      React.createElement('div', { className: `timer-circle ${isActive ? 'active' : ''}` },
        React.createElement('svg', { viewBox: "0 0 200 200", className: "progress-ring" },
          React.createElement('circle', {
            cx: "100",
            cy: "100",
            r: "90",
            fill: "none",
            strokeWidth: "8",
            className: "progress-bg"
          }),
          React.createElement('circle', {
            cx: "100",
            cy: "100",
            r: "90",
            fill: "none",
            strokeWidth: "8",
            className: "progress-fill",
            strokeDasharray: `${2 * Math.PI * 90}`,
            strokeDashoffset: `${2 * Math.PI * 90 * (1 - getProgress() / 100)}`,
            transform: "rotate(-90 100 100)"
          })
        ),
        React.createElement('div', { className: "timer-content" },
          React.createElement('div', { className: "time-display" }, formatTime(timeLeft)),
          React.createElement('div', { className: "phase-message" }, getPhaseMessage())
        )
      )
    ),
    
    React.createElement('div', { className: "timer-controls" },
      !isActive 
        ? React.createElement('button', { 
            className: "control-btn start", 
            onClick: handleStart 
          },
            React.createElement(Play, { size: 24 }),
            "Begin"
          )
        : React.createElement('button', { 
            className: "control-btn pause", 
            onClick: handlePause 
          },
            isPaused ? React.createElement(Play, { size: 24 }) : React.createElement(Pause, { size: 24 }),
            isPaused ? 'Resume' : 'Pause'
          ),
      
      React.createElement('button', { 
        className: "control-btn reset", 
        onClick: handleReset 
      },
        React.createElement(RotateCcw, { size: 20 }),
        "Reset"
      ),
      
      React.createElement('button', {
        className: "volume-btn",
        onClick: () => setSettings(prev => ({ ...prev, bellSound: !prev.bellSound }))
      },
        settings.bellSound ? React.createElement(Volume2, { size: 20 }) : React.createElement(VolumeX, { size: 20 })
      )
    ),
    
    React.createElement('div', { className: "meditation-tips" },
      React.createElement('h4', null, "Meditation Tips"),
      React.createElement('ul', null,
        React.createElement('li', null, "Find a quiet, comfortable space"),
        React.createElement('li', null, "Sit with your back straight but relaxed"),
        React.createElement('li', null, "Focus on your natural breath"),
        React.createElement('li', null, "Gently return attention when mind wanders")
      )
    )
  );
};

export default MeditationTimer;