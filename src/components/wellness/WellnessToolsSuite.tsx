import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Brain, 
  Heart, 
  Moon, 
  Wind, 
  Zap,
  Clock,
  Calendar,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  Sun,
  CloudRain,
  Coffee,
  Battery
} from 'lucide-react';

// Types for wellness tools
interface MeditationSession {
  id: string;
  duration: number;
  type: 'guided' | 'unguided' | 'breathing' | 'body-scan' | 'loving-kindness';
  completedAt: Date;
  notes?: string;
  moodBefore?: number;
  moodAfter?: number;
}

interface SleepEntry {
  id: string;
  date: Date;
  bedTime: Date;
  wakeTime: Date;
  quality: 1 | 2 | 3 | 4 | 5;
  duration: number;
  dreams?: string;
  factors?: string[];
}

interface BreathingExercise {
  id: string;
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  cycles: number;
  description: string;
}

interface AnxietyEntry {
  id: string;
  timestamp: Date;
  level: number;
  triggers?: string[];
  copingStrategies?: string[];
  thoughts?: string;
  physicalSymptoms?: string[];
}

interface StressReliefActivity {
  id: string;
  name: string;
  category: 'physical' | 'mental' | 'creative' | 'social' | 'mindfulness';
  duration: number;
  description: string;
  icon: React.ReactNode;
}

// Meditation Timer Component
const MeditationTimer: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(600); // 10 minutes default
  const [timeLeft, setTimeLeft] = useState(duration);
  const [sessionType, setSessionType] = useState<MeditationSession['type']>('unguided');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    if (soundEnabled && audioRef.current) {
      audioRef.current.play();
    }
    // Save session
    const newSession: MeditationSession = {
      id: Date.now().toString(),
      duration: duration - timeLeft,
      type: sessionType,
      completedAt: new Date()
    };
    setSessions(prev => [...prev, newSession]);
    // Show completion notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Meditation Complete!', {
        body: `You've completed a ${Math.floor((duration - timeLeft) / 60)} minute ${sessionType} session.`,
        icon: '/icon-192x192.png'
      });
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const guidedSessions = [
    { id: 'body-scan', name: 'Body Scan', duration: 900, description: 'Progressive relaxation through body awareness' },
    { id: 'breathing', name: 'Breathing Focus', duration: 600, description: 'Concentrate on breath patterns' },
    { id: 'loving-kindness', name: 'Loving Kindness', duration: 720, description: 'Cultivate compassion and kindness' },
    { id: 'mindfulness', name: 'Mindfulness', duration: 600, description: 'Present moment awareness' },
    { id: 'sleep', name: 'Sleep Meditation', duration: 1200, description: 'Prepare for restful sleep' }
  ];

  return (
    <div className="meditation-timer p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl">
      <audio ref={audioRef} src="/sounds/meditation-bell.mp3" />
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Meditation Timer</h3>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <motion.div
          animate={{ scale: isActive ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          className="inline-block"
        >
          <div className="text-6xl font-mono font-bold text-indigo-600 mb-4">
            {formatTime(timeLeft)}
          </div>
        </motion.div>
        
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={toggleTimer}
            className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>
      </div>

      {/* Duration Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
        <div className="flex gap-2">
          {[5, 10, 15, 20, 30].map(mins => (
            <button
              key={mins}
              onClick={() => {
                setDuration(mins * 60);
                setTimeLeft(mins * 60);
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                duration === mins * 60 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Guided Sessions */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Guided Sessions</h4>
        <div className="space-y-2">
          {guidedSessions.map(session => (
            <button
              key={session.id}
              onClick={() => {
                setDuration(session.duration);
                setTimeLeft(session.duration);
                setSessionType(session.id as MeditationSession['type']);
              }}
              className="w-full p-3 bg-white rounded-lg hover:bg-indigo-50 transition-colors text-left"
            >
              <div className="font-medium text-gray-800">{session.name}</div>
              <div className="text-sm text-gray-600">{session.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Recent Sessions</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {sessions.slice(-3).reverse().map(session => (
            <div key={session.id} className="p-3 bg-white rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{session.type}</span>
                <span className="text-sm text-gray-600">
                  {Math.floor(session.duration / 60)}m {session.duration % 60}s
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(session.completedAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sleep Tracker Component
const SleepTracker: React.FC = () => {
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [bedTime, setBedTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<SleepEntry['quality']>(3);
  const [dreams, setDreams] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  const calculateDuration = (bed: string, wake: string) => {
    const bedDate = new Date(`2000-01-01T${bed}`);
    let wakeDate = new Date(`2000-01-01T${wake}`);
    if (wakeDate < bedDate) {
      wakeDate = new Date(`2000-01-02T${wake}`);
    }
    return (wakeDate.getTime() - bedDate.getTime()) / (1000 * 60 * 60);
  };

  const addSleepEntry = () => {
    const newEntry: SleepEntry = {
      id: Date.now().toString(),
      date: new Date(),
      bedTime: new Date(`2000-01-01T${bedTime}`),
      wakeTime: new Date(`2000-01-01T${wakeTime}`),
      quality,
      duration: calculateDuration(bedTime, wakeTime),
      dreams: dreams || undefined
    };
    setSleepEntries(prev => [...prev, newEntry]);
    setDreams('');
  };

  const getAverageSleep = () => {
    if (sleepEntries.length === 0) return 0;
    const total = sleepEntries.reduce((sum, entry) => sum + entry.duration, 0);
    return total / sleepEntries.length;
  };

  const getAverageQuality = () => {
    if (sleepEntries.length === 0) return 0;
    const total = sleepEntries.reduce((sum, entry) => sum + entry.quality, 0);
    return total / sleepEntries.length;
  };

  const getSleepPattern = () => {
    const avg = getAverageSleep();
    if (avg < 6) return { status: 'Poor', color: 'text-red-600', message: 'You need more sleep!' };
    if (avg < 7) return { status: 'Fair', color: 'text-yellow-600', message: 'Almost at recommended levels' };
    if (avg <= 9) return { status: 'Good', color: 'text-green-600', message: 'Great sleep duration!' };
    return { status: 'Excessive', color: 'text-orange-600', message: 'Consider adjusting sleep schedule' };
  };

  return (
    <div className="sleep-tracker p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Sleep Tracker</h3>
        <Moon className="w-6 h-6 text-indigo-600" />
      </div>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bedtime</label>
            <input
              type="time"
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wake Time</label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => setQuality(rating as SleepEntry['quality'])}
                className={`p-2 rounded-lg transition-all ${
                  quality >= rating 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                <Moon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dreams/Notes</label>
          <textarea
            value={dreams}
            onChange={(e) => setDreams(e.target.value)}
            placeholder="Remember any dreams? How did you feel?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            rows={2}
          />
        </div>

        <button
          onClick={addSleepEntry}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Log Sleep
        </button>
      </div>

      {/* Sleep Analysis */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full flex justify-between items-center mb-3"
        >
          <h4 className="font-semibold text-gray-700">Sleep Analysis</h4>
          <ChevronRight className={`w-5 h-5 transition-transform ${showAnalysis ? 'rotate-90' : ''}`} />
        </button>
        
        {showAnalysis && sleepEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Sleep</span>
              <span className="font-semibold">{getAverageSleep().toFixed(1)} hours</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Quality</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Moon
                    key={star}
                    className={`w-4 h-4 ${
                      star <= getAverageQuality() ? 'text-indigo-600' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className={`font-semibold ${getSleepPattern().color}`}>
                {getSleepPattern().status} Sleep Pattern
              </div>
              <div className="text-sm text-gray-600">{getSleepPattern().message}</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recent Entries */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Recent Entries</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {sleepEntries.slice(-3).reverse().map(entry => (
            <div key={entry.id} className="p-3 bg-white rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">
                  {entry.duration.toFixed(1)} hours
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Moon
                      key={star}
                      className={`w-3 h-3 ${
                        star <= entry.quality ? 'text-indigo-600' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(entry.date).toLocaleDateString()}
              </div>
              {entry.dreams && (
                <div className="text-xs text-gray-600 mt-1">{entry.dreams}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Breathing Exercises Component
const BreathingExercises: React.FC = () => {
  const [activeExercise, setActiveExercise] = useState<BreathingExercise | null>(null);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const exercises: BreathingExercise[] = [
    {
      id: '4-7-8',
      name: '4-7-8 Breathing',
      inhale: 4,
      hold: 7,
      exhale: 8,
      cycles: 4,
      description: 'Calming technique for anxiety and sleep'
    },
    {
      id: 'box',
      name: 'Box Breathing',
      inhale: 4,
      hold: 4,
      exhale: 4,
      cycles: 5,
      description: 'Balance and focus technique'
    },
    {
      id: 'belly',
      name: 'Belly Breathing',
      inhale: 5,
      hold: 2,
      exhale: 5,
      cycles: 6,
      description: 'Deep diaphragmatic breathing'
    },
    {
      id: 'coherent',
      name: 'Coherent Breathing',
      inhale: 5,
      hold: 0,
      exhale: 5,
      cycles: 10,
      description: 'Heart rate variability optimization'
    }
  ];

  useEffect(() => {
    if (!isActive || !activeExercise) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Transition to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return activeExercise.hold;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return activeExercise.exhale;
          } else {
            // Complete cycle
            if (currentCycle >= activeExercise.cycles - 1) {
              // Exercise complete
              setIsActive(false);
              setCurrentCycle(0);
              setPhase('inhale');
              return 0;
            } else {
              setCurrentCycle(prev => prev + 1);
              setPhase('inhale');
              return activeExercise.inhale;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, phase, currentCycle, activeExercise]);

  const startExercise = (exercise: BreathingExercise) => {
    setActiveExercise(exercise);
    setPhase('inhale');
    setTimeLeft(exercise.inhale);
    setCurrentCycle(0);
    setIsActive(true);
  };

  const stopExercise = () => {
    setIsActive(false);
    setActiveExercise(null);
    setPhase('inhale');
    setTimeLeft(0);
    setCurrentCycle(0);
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return 'from-blue-400 to-blue-600';
      case 'hold': return 'from-purple-400 to-purple-600';
      case 'exhale': return 'from-green-400 to-green-600';
    }
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case 'inhale': return <Wind className="w-8 h-8" />;
      case 'hold': return <Pause className="w-8 h-8" />;
      case 'exhale': return <Wind className="w-8 h-8 rotate-180" />;
    }
  };

  return (
    <div className="breathing-exercises p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Breathing Exercises</h3>
        <Wind className="w-6 h-6 text-blue-600" />
      </div>

      {!isActive ? (
        <div className="space-y-3">
          {exercises.map(exercise => (
            <button
              key={exercise.id}
              onClick={() => startExercise(exercise)}
              className="w-full p-4 bg-white rounded-lg hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-800">{exercise.name}</h4>
                <span className="text-sm text-gray-500">
                  {exercise.inhale}-{exercise.hold}-{exercise.exhale}
                </span>
              </div>
              <p className="text-sm text-gray-600">{exercise.description}</p>
              <div className="text-xs text-gray-500 mt-1">
                {exercise.cycles} cycles
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center">
          {/* Visual Breathing Guide */}
          <motion.div
            animate={{
              scale: phase === 'inhale' ? 1.3 : phase === 'hold' ? 1.3 : 1,
            }}
            transition={{ duration: 0.5 }}
            className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${getPhaseColor()} flex items-center justify-center text-white`}
          >
            {getPhaseIcon()}
          </motion.div>

          {/* Phase Indicator */}
          <div className="mb-4">
            <h4 className="text-2xl font-bold text-gray-800 capitalize mb-2">{phase}</h4>
            <div className="text-4xl font-mono font-bold text-blue-600">{timeLeft}</div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">
              Cycle {currentCycle + 1} of {activeExercise?.cycles}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentCycle + 1) / (activeExercise?.cycles || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Stop Button */}
          <button
            onClick={stopExercise}
            className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            Stop Exercise
          </button>
        </div>
      )}
    </div>
  );
};

// Anxiety Management Component
const AnxietyManagement: React.FC = () => {
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<AnxietyEntry[]>([]);

  const commonTriggers = [
    'Work/School', 'Relationships', 'Health', 'Financial', 'Social Situations',
    'Future Uncertainty', 'Past Events', 'Performance', 'Conflict', 'Change'
  ];

  const copingStrategies = [
    { id: 'breathing', name: 'Deep Breathing', icon: <Wind className="w-4 h-4" /> },
    { id: 'grounding', name: '5-4-3-2-1 Grounding', icon: <Target className="w-4 h-4" /> },
    { id: 'movement', name: 'Physical Movement', icon: <Activity className="w-4 h-4" /> },
    { id: 'journal', name: 'Journaling', icon: <Brain className="w-4 h-4" /> },
    { id: 'music', name: 'Calming Music', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'nature', name: 'Nature/Outside', icon: <Sun className="w-4 h-4" /> },
    { id: 'talk', name: 'Talk to Someone', icon: <Heart className="w-4 h-4" /> },
    { id: 'meditation', name: 'Meditation', icon: <Sparkles className="w-4 h-4" /> }
  ];

  const physicalSymptoms = [
    'Racing Heart', 'Sweating', 'Trembling', 'Shortness of Breath',
    'Chest Tightness', 'Nausea', 'Dizziness', 'Muscle Tension'
  ];

  const addEntry = () => {
    const newEntry: AnxietyEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level: anxietyLevel,
      triggers: triggers.length > 0 ? triggers : undefined,
      copingStrategies: selectedStrategies.length > 0 ? selectedStrategies : undefined,
      thoughts: notes || undefined
    };
    setEntries(prev => [...prev, newEntry]);
    // Reset form
    setTriggers([]);
    setSelectedStrategies([]);
    setNotes('');
  };

  const getAnxietyColor = (level: number) => {
    if (level <= 3) return 'text-green-600';
    if (level <= 6) return 'text-yellow-600';
    if (level <= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAnxietyLabel = (level: number) => {
    if (level <= 3) return 'Low';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Severe';
  };

  return (
    <div className="anxiety-management p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Anxiety Management</h3>
        <Brain className="w-6 h-6 text-teal-600" />
      </div>

      {/* Current Level */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Anxiety Level
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="10"
            value={anxietyLevel}
            onChange={(e) => setAnxietyLevel(Number(e.target.value))}
            className="flex-1"
          />
          <span className={`text-2xl font-bold ${getAnxietyColor(anxietyLevel)}`}>
            {anxietyLevel}/10
          </span>
        </div>
        <div className={`text-sm mt-1 ${getAnxietyColor(anxietyLevel)}`}>
          {getAnxietyLabel(anxietyLevel)}
        </div>
      </div>

      {/* Triggers */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's triggering your anxiety?
        </label>
        <div className="flex flex-wrap gap-2">
          {commonTriggers.map(trigger => (
            <button
              key={trigger}
              onClick={() => {
                setTriggers(prev =>
                  prev.includes(trigger)
                    ? prev.filter(t => t !== trigger)
                    : [...prev, trigger]
                );
              }}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                triggers.includes(trigger)
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {trigger}
            </button>
          ))}
        </div>
      </div>

      {/* Coping Strategies */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Try these coping strategies
        </label>
        <div className="grid grid-cols-2 gap-2">
          {copingStrategies.map(strategy => (
            <button
              key={strategy.id}
              onClick={() => {
                setSelectedStrategies(prev =>
                  prev.includes(strategy.id)
                    ? prev.filter(s => s !== strategy.id)
                    : [...prev, strategy.id]
                );
              }}
              className={`p-3 rounded-lg flex items-center gap-2 transition-colors ${
                selectedStrategies.includes(strategy.id)
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {strategy.icon}
              <span className="text-sm">{strategy.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What thoughts are you having? How does your body feel?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          rows={3}
        />
      </div>

      <button
        onClick={addEntry}
        className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
      >
        Log Entry
      </button>

      {/* Recent Entries */}
      {entries.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-700 mb-3">Recent Entries</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {entries.slice(-3).reverse().map(entry => (
              <div key={entry.id} className="p-3 bg-white rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-semibold ${getAnxietyColor(entry.level)}`}>
                    Level {entry.level}/10
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                {entry.triggers && (
                  <div className="text-sm text-gray-600 mb-1">
                    Triggers: {entry.triggers.join(', ')}
                  </div>
                )}
                {entry.copingStrategies && (
                  <div className="text-sm text-gray-600">
                    Strategies used: {entry.copingStrategies.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Stress Relief Activities Component
const StressReliefActivities: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);

  const activities: StressReliefActivity[] = [
    {
      id: 'walk',
      name: 'Take a Walk',
      category: 'physical',
      duration: 15,
      description: 'Get fresh air and move your body',
      icon: <Activity className="w-5 h-5" />
    },
    {
      id: 'stretch',
      name: 'Stretching',
      category: 'physical',
      duration: 10,
      description: 'Release muscle tension',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'puzzle',
      name: 'Solve a Puzzle',
      category: 'mental',
      duration: 20,
      description: 'Focus your mind on something engaging',
      icon: <Brain className="w-5 h-5" />
    },
    {
      id: 'draw',
      name: 'Draw or Doodle',
      category: 'creative',
      duration: 15,
      description: 'Express yourself creatively',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: 'call',
      name: 'Call a Friend',
      category: 'social',
      duration: 20,
      description: 'Connect with someone you care about',
      icon: <Heart className="w-5 h-5" />
    },
    {
      id: 'tea',
      name: 'Make Tea',
      category: 'mindfulness',
      duration: 5,
      description: 'Mindful tea preparation and enjoyment',
      icon: <Coffee className="w-5 h-5" />
    },
    {
      id: 'music',
      name: 'Listen to Music',
      category: 'creative',
      duration: 15,
      description: 'Play your favorite calming songs',
      icon: <Volume2 className="w-5 h-5" />
    },
    {
      id: 'garden',
      name: 'Water Plants',
      category: 'mindfulness',
      duration: 10,
      description: 'Care for living things',
      icon: <Sun className="w-5 h-5" />
    }
  ];

  const categories = [
    { id: 'all', name: 'All Activities', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'physical', name: 'Physical', icon: <Activity className="w-4 h-4" /> },
    { id: 'mental', name: 'Mental', icon: <Brain className="w-4 h-4" /> },
    { id: 'creative', name: 'Creative', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'social', name: 'Social', icon: <Heart className="w-4 h-4" /> },
    { id: 'mindfulness', name: 'Mindfulness', icon: <Target className="w-4 h-4" /> }
  ];

  const filteredActivities = selectedCategory === 'all'
    ? activities
    : activities.filter(a => a.category === selectedCategory);

  const completeActivity = (activityId: string) => {
    setCompletedActivities(prev => [...prev, activityId]);
    // Show encouragement
    setTimeout(() => {
      setCompletedActivities(prev => prev.filter(id => id !== activityId));
    }, 3000);
  };

  return (
    <div className="stress-relief p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Stress Relief Activities</h3>
        <Battery className="w-6 h-6 text-orange-600" />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-orange-100'
            }`}
          >
            {category.icon}
            <span className="text-sm">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredActivities.map(activity => (
          <motion.button
            key={activity.id}
            onClick={() => completeActivity(activity.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-lg text-left transition-all ${
              completedActivities.includes(activity.id)
                ? 'bg-green-100 border-2 border-green-500'
                : 'bg-white hover:bg-orange-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                completedActivities.includes(activity.id)
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-100 text-orange-600'
              }`}>
                {activity.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{activity.name}</h4>
                <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{activity.duration} minutes</span>
                </div>
              </div>
            </div>
            {completedActivities.includes(activity.id) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-green-600 font-medium"
              >
                Great job! Keep it up!
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-yellow-100 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Quick Stress Relief Tips</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Take 3 deep breaths right now</li>
          <li>• Step away from your screen for 2 minutes</li>
          <li>• Drink a glass of water</li>
          <li>• Text someone you're grateful for</li>
        </ul>
      </div>
    </div>
  );
};

// Main Wellness Tools Suite Component
const WellnessToolsSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'meditation' | 'sleep' | 'breathing' | 'anxiety' | 'stress'>('meditation');

  const tabs = [
    { id: 'meditation', name: 'Meditation', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'sleep', name: 'Sleep', icon: <Moon className="w-5 h-5" /> },
    { id: 'breathing', name: 'Breathing', icon: <Wind className="w-5 h-5" /> },
    { id: 'anxiety', name: 'Anxiety', icon: <Brain className="w-5 h-5" /> },
    { id: 'stress', name: 'Stress Relief', icon: <Battery className="w-5 h-5" /> }
  ];

  return (
    <div className="wellness-tools-suite max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wellness Tools Suite</h1>
        <p className="text-gray-600">Complete tools for mental health and wellbeing</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.icon}
            <span className="font-medium">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'meditation' && <MeditationTimer />}
          {activeTab === 'sleep' && <SleepTracker />}
          {activeTab === 'breathing' && <BreathingExercises />}
          {activeTab === 'anxiety' && <AnxietyManagement />}
          {activeTab === 'stress' && <StressReliefActivities />}
        </motion.div>
      </AnimatePresence>

      {/* Daily Wellness Summary */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Wellness Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl mb-1">🧘</div>
            <div className="text-sm text-gray-600">Meditation</div>
            <div className="font-semibold">15 min</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl mb-1">😴</div>
            <div className="text-sm text-gray-600">Sleep</div>
            <div className="font-semibold">7.5 hrs</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl mb-1">🌬️</div>
            <div className="text-sm text-gray-600">Breathing</div>
            <div className="font-semibold">3 sessions</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl mb-1">💚</div>
            <div className="text-sm text-gray-600">Mood</div>
            <div className="font-semibold">Good</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessToolsSuite;