import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, Hand, Ear, Heart, Smartphone } from 'lucide-react';

interface GroundingTechnique {
  id: string;
  name: string;
  description: string;
  type: '5-4-3-2-1' | 'breathing' | 'progressive_muscle' | 'mindfulness' | 'visualization';
  duration: number; // seconds
  steps: GroundingStep[];
  mobileOptimized: boolean;
  hapticFeedback?: boolean;
}

interface GroundingStep {
  id: string;
  instruction: string;
  duration: number;
  prompt?: string;
  sensory?: 'sight' | 'sound' | 'touch' | 'smell' | 'taste' | 'movement';
  mobileAction?: 'vibrate' | 'breathe_with_animation' | 'tap_screen' | 'voice_guidance';
}

interface MobileGroundingProps {
  technique?: GroundingTechnique;
  autoStart?: boolean;
  enableHaptics?: boolean;
  enableVoiceGuidance?: boolean;
  onComplete?: (technique: GroundingTechnique) => void;
  onStepChange?: (step: GroundingStep, index: number) => void;
  className?: string;
}

// Mobile-optimized 5-4-3-2-1 technique
const DEFAULT_MOBILE_TECHNIQUE: GroundingTechnique = {
  id: 'mobile-5-4-3-2-1',
  name: 'Mobile 5-4-3-2-1 Grounding',
  description: 'A touch-friendly grounding exercise using your senses',
  type: '5-4-3-2-1',
  duration: 300, // 5 minutes
  mobileOptimized: true,
  hapticFeedback: true,
  steps: [
    {
      id: 'sight-5',
      instruction: 'Tap 5 things you can see around you',
      duration: 60,
      prompt: 'Look around and gently tap your screen for each thing you notice',
      sensory: 'sight',
      mobileAction: 'tap_screen'
    },
    {
      id: 'touch-4',
      instruction: 'Notice 4 different textures you can feel',
      duration: 60,
      prompt: 'Touch different surfaces - your phone, clothes, chair, or table',
      sensory: 'touch',
      mobileAction: 'vibrate'
    },
    {
      id: 'sound-3',
      instruction: 'Listen for 3 sounds around you',
      duration: 60,
      prompt: 'Close your eyes and focus on sounds near and far',
      sensory: 'sound',
      mobileAction: 'voice_guidance'
    },
    {
      id: 'smell-2',
      instruction: 'Notice 2 scents you can smell',
      duration: 60,
      prompt: 'Take slow, deep breaths and identify different smells',
      sensory: 'smell',
      mobileAction: 'breathe_with_animation'
    },
    {
      id: 'taste-1',
      instruction: 'Notice 1 thing you can taste',
      duration: 60,
      prompt: 'This could be from something you recently ate or drank',
      sensory: 'taste',
      mobileAction: 'voice_guidance'
    }
  ]
};

export const MobileGrounding: React.FC<MobileGroundingProps> = ({
  technique = DEFAULT_MOBILE_TECHNIQUE,
  autoStart = false,
  enableHaptics = true,
  enableVoiceGuidance = false,
  onComplete,
  onStepChange,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimeRemaining, setStepTimeRemaining] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(enableVoiceGuidance);
  const [tapCount, setTapCount] = useState(0);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale' | 'hold'>('inhale');

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breathingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStep = technique.steps[currentStepIndex];
  const progress = ((currentStepIndex + (1 - stepTimeRemaining / (currentStep?.duration || 1))) / technique.steps.length) * 100;
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
              triggerMobileAction(nextStep);
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

  // Breathing animation effect
  useEffect(() => {
    if (currentStep?.mobileAction === 'breathe_with_animation' && isActive && !isPaused) {
      const breathingCycle = () => {
        setBreathingPhase('inhale');
        setTimeout(() => setBreathingPhase('hold'), 4000);
        setTimeout(() => setBreathingPhase('exhale'), 7000);
        setTimeout(() => setBreathingPhase('inhale'), 11000);
      };

      breathingCycle();
      breathingRef.current = setInterval(breathingCycle, 12000);
    } else {
      if (breathingRef.current) {
        clearInterval(breathingRef.current);
        breathingRef.current = null;
      }
    }

    return () => {
      if (breathingRef.current) {
        clearInterval(breathingRef.current);
      }
    };
  }, [currentStep, isActive, isPaused]);

  const startExercise = () => {
    setIsActive(true);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setStepTimeRemaining(technique.steps[0].duration);
    setTotalTimeElapsed(0);
    setTapCount(0);
    setUserInputs([]);
    
    const firstStep = technique.steps[0];
    onStepChange?.(firstStep, 0);
    triggerMobileAction(firstStep);
  };

  const pauseExercise = () => {
    setIsPaused(true);
    if (breathingRef.current) {
      clearInterval(breathingRef.current);
    }
  };

  const resumeExercise = () => {
    setIsPaused(false);
    if (currentStep?.mobileAction === 'breathe_with_animation') {
      // Restart breathing animation
    }
  };

  const resetExercise = () => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setStepTimeRemaining(0);
    setTotalTimeElapsed(0);
    setTapCount(0);
    setUserInputs([]);
    
    if (breathingRef.current) {
      clearInterval(breathingRef.current);
    }
  };

  const triggerMobileAction = (step: GroundingStep) => {
    switch (step.mobileAction) {
      case 'vibrate':
        if (enableHaptics && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
        break;
      case 'voice_guidance':
        if (audioEnabled && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(step.instruction);
          utterance.rate = 0.8;
          utterance.pitch = 1.0;
          speechSynthesis.speak(utterance);
        }
        break;
      case 'tap_screen':
        setTapCount(0);
        break;
    }
  };

  const handleScreenTap = () => {
    if (currentStep?.mobileAction === 'tap_screen' && isActive) {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      
      // Haptic feedback
      if (enableHaptics && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Visual feedback
      if (containerRef.current) {
        containerRef.current.style.backgroundColor = '#3b82f6';
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.backgroundColor = '';
          }
        }, 100);
      }
    }
  };

  const addUserInput = (input: string) => {
    if (input.trim()) {
      setUserInputs(prev => [...prev, input.trim()]);
    }
  };

  const getSensoryIcon = (sensory?: string) => {
    switch (sensory) {
      case 'sight': return <Eye className="w-8 h-8" />;
      case 'touch': return <Hand className="w-8 h-8" />;
      case 'sound': return <Ear className="w-8 h-8" />;
      case 'smell': return <Heart className="w-8 h-8" />;
      case 'taste': return <Heart className="w-8 h-8" />;
      case 'movement': return <Smartphone className="w-8 h-8" />;
      default: return <Heart className="w-8 h-8" />;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingCircleSize = () => {
    switch (breathingPhase) {
      case 'inhale': return 'w-32 h-32';
      case 'hold': return 'w-40 h-40';
      case 'exhale': return 'w-24 h-24';
      default: return 'w-32 h-32';
    }
  };

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe In...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      default: return 'Breathe...';
    }
  };

  if (isComplete) {
    return (
      <div className={`mobile-grounding-complete min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 ${className}`}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-green-600 fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            Well Done!
          </h2>
          <p className="text-green-700 mb-6">
            You completed the grounding exercise. Take a moment to notice how you feel.
          </p>
          <div className="text-sm text-green-600 mb-8">
            Total time: {formatTime(totalTimeElapsed)}
          </div>
          
          <button
            onClick={resetExercise}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Start Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`mobile-grounding min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 transition-colors duration-100 ${className}`}
      onClick={handleScreenTap}
    >
      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {technique.name}
          </h1>
          <p className="text-gray-600 text-center text-sm">
            {technique.description}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStepIndex + 1} of {technique.steps.length}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatTime(stepTimeRemaining)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        {!isComplete && currentStep && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              {/* Step Icon */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  {getSensoryIcon(currentStep.sensory)}
                </div>
                
                {/* Breathing Animation */}
                {currentStep.mobileAction === 'breathe_with_animation' && (
                  <div className="mb-6">
                    <div className={`
                      ${getBreathingCircleSize()} 
                      bg-gradient-to-r from-blue-400 to-purple-400 
                      rounded-full mx-auto mb-3
                      transition-all duration-1000 ease-in-out
                      flex items-center justify-center
                    `}>
                      <Heart className="w-8 h-8 text-white fill-current" />
                    </div>
                    <p className="text-center text-lg font-medium text-blue-700">
                      {getBreathingInstruction()}
                    </p>
                  </div>
                )}

                {/* Tap Counter */}
                {currentStep.mobileAction === 'tap_screen' && (
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-blue-600 text-center mb-2">
                      {tapCount}/5
                    </div>
                    <p className="text-sm text-blue-700 text-center">
                      Tap anywhere on the screen
                    </p>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                {currentStep.instruction}
              </h3>
              
              {currentStep.prompt && (
                <p className="text-gray-600 text-center mb-6">
                  {currentStep.prompt}
                </p>
              )}

              {/* User Input */}
              {isActive && currentStep.sensory && (
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder={`What do you ${currentStep.sensory === 'sight' ? 'see' : currentStep.sensory === 'sound' ? 'hear' : 'notice'}?`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = (e.target as HTMLInputElement).value;
                        addUserInput(input);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  
                  {userInputs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {userInputs.map((input, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {input}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="fixed bottom-6 left-4 right-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
            <div className="flex justify-center gap-4">
              {!isActive ? (
                <button
                  onClick={startExercise}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Start
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={resumeExercise}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={pauseExercise}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-yellow-600 text-white rounded-xl font-medium hover:bg-yellow-700 transition-colors"
                    >
                      <Pause className="w-5 h-5" />
                      Pause
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={resetExercise}
                className="flex items-center justify-center gap-2 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                  audioEnabled 
                    ? 'text-blue-600 bg-blue-50 border border-blue-200' 
                    : 'text-gray-400 border border-gray-300'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileGrounding;
