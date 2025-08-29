import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, Hand, Ear, Heart } from 'lucide-react';

interface GroundingTechnique {
  id: string;
  name: string;
  description: string;
  category: '5-4-3-2-1' | 'breathing' | 'movement' | 'mindfulness' | 'grounding';
  duration: number; // in seconds
  steps: GroundingStep[];
  audioGuide?: string;
  benefits: string[];
}

interface GroundingStep {
  id: string;
  instruction: string;
  duration: number;
  prompt?: string;
  sensory?: 'sight' | 'sound' | 'touch' | 'smell' | 'taste';
  icon?: string;
}

interface GroundingExerciseProps {
  technique?: GroundingTechnique;
  autoStart?: boolean;
  showProgress?: boolean;
  showTimer?: boolean;
  enableAudio?: boolean;
  onComplete?: (technique: GroundingTechnique) => void;
  onStepChange?: (step: GroundingStep, index: number) => void;
  className?: string;
}

// Default 5-4-3-2-1 grounding technique
const DEFAULT_TECHNIQUE: GroundingTechnique = {
  id: '5-4-3-2-1',
  name: '5-4-3-2-1 Grounding Technique',
  description: 'Use your senses to ground yourself in the present moment',
  category: '5-4-3-2-1',
  duration: 300, // 5 minutes
  steps: [
    {
      id: 'sight-5',
      instruction: 'Look around and name 5 things you can see',
      duration: 60,
      prompt: 'Take your time to really observe your surroundings',
      sensory: 'sight',
      icon: 'eye'
    },
    {
      id: 'touch-4',
      instruction: 'Notice 4 things you can touch',
      duration: 60,
      prompt: 'Feel different textures around you',
      sensory: 'touch',
      icon: 'hand'
    },
    {
      id: 'sound-3',
      instruction: 'Listen for 3 sounds you can hear',
      duration: 60,
      prompt: 'Focus on sounds both near and far',
      sensory: 'sound',
      icon: 'ear'
    },
    {
      id: 'smell-2',
      instruction: 'Identify 2 scents you can smell',
      duration: 60,
      prompt: 'Take slow, mindful breaths',
      sensory: 'smell',
      icon: 'nose'
    },
    {
      id: 'taste-1',
      instruction: 'Notice 1 thing you can taste',
      duration: 60,
      prompt: 'This could be lingering from something you drank or ate',
      sensory: 'taste',
      icon: 'mouth'
    }
  ],
  benefits: [
    'Reduces anxiety and panic',
    'Brings awareness to the present moment',
    'Interrupts overwhelming thoughts',
    'Activates the parasympathetic nervous system'
  ]
};

export const GroundingExercise: React.FC<GroundingExerciseProps> = ({
  technique = DEFAULT_TECHNIQUE,
  autoStart = false,
  showProgress = true,
  showTimer = true,
  enableAudio = true,
  onComplete,
  onStepChange,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimeRemaining, setStepTimeRemaining] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [userInputs, setUserInputs] = useState<Record<string, string[]>>({});
  
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStep = technique.steps[currentStepIndex];
  const progress = ((currentStepIndex + (1 - stepTimeRemaining / currentStep?.duration || 0)) / technique.steps.length) * 100;
  const isComplete = currentStepIndex >= technique.steps.length;

  // Auto-start effect
  useEffect(() => {
    if (autoStart && !isActive && !isComplete) {
      startExercise();
    }
  }, [autoStart]);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused && !isComplete) {
      intervalRef.current = setInterval(() => {
        setStepTimeRemaining(prev => {
          if (prev <= 1) {
            // Move to next step
            const nextIndex = currentStepIndex + 1;
            if (nextIndex < technique.steps.length) {
              setCurrentStepIndex(nextIndex);
              const nextStep = technique.steps[nextIndex];
              onStepChange?.(nextStep, nextIndex);
              playStepAudio(nextStep);
              return nextStep.duration;
            } else {
              // Exercise complete
              setIsActive(false);
              onComplete?.(technique);
              return 0;
            }
          }
          return prev - 1;
        });
        
        setTotalTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, currentStepIndex, technique.steps, onComplete, onStepChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startExercise = () => {
    setIsActive(true);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setStepTimeRemaining(technique.steps[0].duration);
    setTotalTimeElapsed(0);
    
    const firstStep = technique.steps[0];
    onStepChange?.(firstStep, 0);
    playStepAudio(firstStep);
  };

  const pauseExercise = () => {
    setIsPaused(true);
  };

  const resumeExercise = () => {
    setIsPaused(false);
  };

  const resetExercise = () => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setStepTimeRemaining(0);
    setTotalTimeElapsed(0);
    setUserInputs({});
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const skipToNextStep = () => {
    if (currentStepIndex < technique.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const nextStep = technique.steps[nextIndex];
      setStepTimeRemaining(nextStep.duration);
      onStepChange?.(nextStep, nextIndex);
      playStepAudio(nextStep);
    }
  };

  const playStepAudio = (step: GroundingStep) => {
    if (audioEnabled && technique.audioGuide) {
      try {
        audioRef.current = new Audio(`/audio/grounding/${step.id}.mp3`);
        audioRef.current.play().catch(console.warn);
      } catch (error) {
        console.warn('Audio playback failed:', error);
      }
    }
  };

  const addUserInput = (stepId: string, input: string) => {
    if (input.trim()) {
      setUserInputs(prev => ({
        ...prev,
        [stepId]: [...(prev[stepId] || []), input.trim()]
      }));
    }
  };

  const getSensoryIcon = (sensory?: string) => {
    switch (sensory) {
      case 'sight': return <Eye className="w-6 h-6" />;
      case 'touch': return <Hand className="w-6 h-6" />;
      case 'sound': return <Ear className="w-6 h-6" />;
      case 'smell': return <Heart className="w-6 h-6" />; // Using heart as placeholder
      case 'taste': return <Heart className="w-6 h-6" />; // Using heart as placeholder
      default: return <Heart className="w-6 h-6" />;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isComplete) {
    return (
      <div className={`grounding-exercise-complete bg-green-50 border border-green-200 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">Exercise Complete!</h3>
          <p className="text-green-700 mb-4">
            Great job completing the {technique.name}. Take a moment to notice how you feel.
          </p>
          <div className="text-sm text-green-600 mb-6">
            Total time: {formatTime(totalTimeElapsed)}
          </div>
          
          {Object.keys(userInputs).length > 0 && (
            <div className="text-left bg-white rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">What you noticed:</h4>
              {Object.entries(userInputs).map(([stepId, inputs]) => {
                const step = technique.steps.find(s => s.id === stepId);
                return (
                  <div key={stepId} className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">{step?.instruction}:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {inputs.map((input, index) => (
                        <li key={index}>{input}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
          
          <button
            onClick={resetExercise}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`grounding-exercise bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{technique.name}</h3>
        <p className="text-gray-600 text-sm">{technique.description}</p>
      </div>

      {/* Progress */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Step {currentStepIndex + 1} of {technique.steps.length}
            </span>
            {showTimer && (
              <span className="text-sm font-medium text-gray-900">
                {formatTime(stepTimeRemaining)} remaining
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Step */}
      {!isComplete && currentStep && (
        <div className="mb-6">
          <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {getSensoryIcon(currentStep.sensory)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">{currentStep.instruction}</h4>
              {currentStep.prompt && (
                <p className="text-blue-700 text-sm mb-3">{currentStep.prompt}</p>
              )}
              
              {/* User Input for current step */}
              {isActive && (
                <div>
                  <input
                    type="text"
                    placeholder="Type what you notice and press Enter..."
                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = (e.target as HTMLInputElement).value;
                        addUserInput(currentStep.id, input);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  
                  {/* Display current inputs */}
                  {userInputs[currentStep.id] && userInputs[currentStep.id].length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {userInputs[currentStep.id].map((input, index) => (
                        <li key={index} className="text-sm text-blue-800 bg-blue-100 rounded px-2 py-1">
                          {input}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isActive ? (
            <button
              onClick={startExercise}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Exercise
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={resumeExercise}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseExercise}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}
              
              <button
                onClick={skipToNextStep}
                disabled={currentStepIndex >= technique.steps.length - 1}
                className="px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next Step
              </button>
            </>
          )}
          
          <button
            onClick={resetExercise}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              audioEnabled 
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
            }`}
            title={audioEnabled ? 'Mute audio' : 'Enable audio'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Benefits */}
      {!isActive && technique.benefits && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Benefits of this technique:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {technique.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GroundingExercise;
