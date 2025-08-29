import React, { useState, useEffect } from 'react';
import { Eye, Ear, Hand, Zap, RotateCcw } from 'lucide-react';
import '../../styles/GroundingTechnique.css';

interface GroundingTechniqueProps {
  onComplete?: (technique: string, duration: number) => void;
  autoStart?: boolean;
}

const GroundingTechnique: React.FC<GroundingTechniqueProps> = ({
  onComplete,
  autoStart = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');

  const steps = [
    {
      id: 'see',
      title: 'What can you SEE?',
      instruction: 'Look around and name 5 things you can see right now',
      icon: <Eye size={24} />,
      count: 5,
      placeholder: 'I can see...',
      color: '#4f46e5'
    },
    {
      id: 'touch',
      title: 'What can you TOUCH?',
      instruction: 'Name 4 things you can feel or touch around you',
      icon: <Hand size={24} />,
      count: 4,
      placeholder: 'I can touch...',
      color: '#059669'
    },
    {
      id: 'hear',
      title: 'What can you HEAR?',
      instruction: 'Listen carefully and name 3 sounds you can hear',
      icon: <Ear size={24} />,
      count: 3,
      placeholder: 'I can hear...',
      color: '#dc2626'
    },
    {
      id: 'smell',
      title: 'What can you SMELL?',
      instruction: 'Name 2 scents or smells around you',
      icon: <Zap size={24} />,
      count: 2,
      placeholder: 'I can smell...',
      color: '#7c3aed'
    },
    {
      id: 'taste',
      title: 'What can you TASTE?',
      instruction: 'Name 1 taste in your mouth right now',
      icon: <Zap size={24} />,
      count: 1,
      placeholder: 'I can taste...',
      color: '#ea580c'
    }
  ];

  useEffect(() => {
    if (autoStart) {
      handleStart();
    }
  }, [autoStart]);

  const handleStart = () => {
    setIsActive(true);
    setStartTime(new Date());
    setCurrentStep(0);
    setUserInputs([]);
    setCurrentInput('');
  };

  const handleSubmitInput = () => {
    if (currentInput.trim()) {
      const newInputs = [...userInputs, currentInput.trim()];
      setUserInputs(newInputs);
      setCurrentInput('');

      const currentStepData = steps[currentStep];
      
      if (newInputs.length >= currentStepData.count) {
        // Move to next step
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
          setUserInputs([]);
        } else {
          // Exercise complete
          handleComplete();
        }
      }
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    const endTime = new Date();
    const duration = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    onComplete?.('5-4-3-2-1-grounding', duration);
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentStep(0);
    setUserInputs([]);
    setCurrentInput('');
    setStartTime(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitInput();
    }
  };

  const getCurrentProgress = () => {
    const totalSteps = steps.reduce((sum, step) => sum + step.count, 0);
    const completedSteps = currentStep * (currentStep > 0 ? steps[currentStep - 1].count : 0) + userInputs.length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const getProgressForCurrentStep = () => {
    const currentStepData = steps[currentStep];
    return Math.round((userInputs.length / currentStepData.count) * 100);
  };

  if (!isActive) {
    return (
      <div className="grounding-technique">
        <div className="technique-intro">
          <div className="intro-header">
            <Zap size={32} />
            <h2>5-4-3-2-1 Grounding Technique</h2>
          </div>
          
          <p className="intro-description">
            This mindfulness technique helps you reconnect with the present moment 
            by engaging your five senses. It's especially helpful during times of 
            anxiety, panic, or overwhelming emotions.
          </p>

          <div className="technique-steps-preview">
            <h3>You'll identify:</h3>
            <div className="steps-grid">
              {steps.map((step) => (
                <div key={step.id} className="step-preview" style={{ borderColor: step.color }}>
                  {step.icon}
                  <span>{step.count} things you can {step.title.split(' ')[3].toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="start-technique-btn" onClick={handleStart}>
            <Zap size={18} />
            Start Grounding Exercise
          </button>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const remainingCount = currentStepData.count - userInputs.length;

  return (
    <div className="grounding-technique active">
      <div className="technique-header">
        <div className="overall-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${getCurrentProgress()}%` }}
            />
          </div>
          <span>Step {currentStep + 1} of {steps.length}</span>
        </div>
      </div>

      <div className="current-step" style={{ borderColor: currentStepData.color }}>
        <div className="step-icon" style={{ color: currentStepData.color }}>
          {currentStepData.icon}
        </div>
        
        <h3 style={{ color: currentStepData.color }}>
          {currentStepData.title}
        </h3>
        
        <p className="step-instruction">
          {currentStepData.instruction}
        </p>

        <div className="step-progress">
          <div className="step-progress-bar">
            <div 
              className="step-progress-fill"
              style={{ 
                width: `${getProgressForCurrentStep()}%`,
                backgroundColor: currentStepData.color 
              }}
            />
          </div>
          <span>{remainingCount} more {remainingCount === 1 ? 'item' : 'items'} to go</span>
        </div>

        <div className="input-section">
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentStepData.placeholder}
            className="grounding-input"
            autoFocus
          />
          <button 
            className="submit-btn"
            onClick={handleSubmitInput}
            disabled={!currentInput.trim()}
            style={{ backgroundColor: currentStepData.color }}
          >
            Add
          </button>
        </div>

        {userInputs.length > 0 && (
          <div className="user-inputs">
            <h4>Your responses:</h4>
            <ul>
              {userInputs.map((input, index) => (
                <li key={index}>{index + 1}. {input}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="technique-controls">
        <button className="control-btn reset" onClick={handleReset}>
          <RotateCcw size={16} />
          Restart
        </button>
      </div>

      <div className="grounding-tips">
        <p>💡 Take your time with each step. There's no rush.</p>
        <p>🌟 Focus on the details of what you observe.</p>
        <p>🤗 Remember, you are safe and grounded in this moment.</p>
      </div>
    </div>
  );
};

export default GroundingTechnique;
