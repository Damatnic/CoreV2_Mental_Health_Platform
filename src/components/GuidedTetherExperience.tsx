import React, { useState } from 'react';
import { Compass, Star, ChevronRight, CheckCircle } from 'lucide-react';
import '../styles/GuidedTetherExperience.css';

interface TetherStep {
  id: string;
  title: string;
  description: string;
  prompt: string;
  completed: boolean;
}

const GuidedTetherExperience: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [response, setResponse] = useState('');
  
  const steps: TetherStep[] = [
    {
      id: '1',
      title: 'Ground Yourself',
      description: 'Take a moment to connect with the present',
      prompt: 'Name 5 things you can see around you',
      completed: false
    },
    {
      id: '2',
      title: 'Breathe Deeply',
      description: 'Follow the breathing pattern',
      prompt: 'Breathe in for 4, hold for 7, out for 8',
      completed: false
    },
    {
      id: '3',
      title: 'Affirm Your Strength',
      description: 'Remind yourself of your resilience',
      prompt: 'Complete: "I am capable of..."',
      completed: false
    },
    {
      id: '4',
      title: 'Set an Intention',
      description: 'Choose your focus for today',
      prompt: 'What positive action will you take?',
      completed: false
    }
  ];

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (response.trim()) {
      setCompletedSteps(prev => new Set([...prev, steps[currentStep].id]));
      setResponse('');
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    console.log('Tether experience completed');
  };

  const progress = (completedSteps.size / steps.length) * 100;

  if (!isActive) {
    return (
      <div className="tether-experience">
        <div className="tether-intro">
          <Compass size={48} />
          <h2>Guided Grounding Experience</h2>
          <p>A mindful journey to help you reconnect and refocus</p>
          <button className="start-btn" onClick={handleStart}>
            Begin Journey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tether-experience active">
      <div className="tether-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-text">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>

      <div className="tether-content">
        <div className="step-header">
          <Star className="step-icon" size={32} />
          <h2>{steps[currentStep].title}</h2>
        </div>
        
        <p className="step-description">
          {steps[currentStep].description}
        </p>
        
        <div className="step-prompt">
          <p>{steps[currentStep].prompt}</p>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Take your time..."
            className="response-input"
            rows={4}
          />
        </div>

        <div className="step-actions">
          {currentStep > 0 && (
            <button 
              onClick={() => setCurrentStep(currentStep - 1)}
              className="back-btn"
            >
              Back
            </button>
          )}
          <button 
            onClick={handleNext}
            className="next-btn"
            disabled={!response.trim()}
          >
            {currentStep === steps.length - 1 ? 'Complete' : 'Continue'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="step-indicators">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`indicator ${
              completedSteps.has(step.id) ? 'completed' : 
              index === currentStep ? 'active' : ''
            }`}
          >
            {completedSteps.has(step.id) && <CheckCircle size={16} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuidedTetherExperience;
