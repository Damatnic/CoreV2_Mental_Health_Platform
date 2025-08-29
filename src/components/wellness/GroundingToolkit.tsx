import React, { useState } from 'react';
import { Compass, Eye, Hand, Ear, Zap, Heart, Clock, RotateCcw } from 'lucide-react';
import '../../styles/GroundingToolkit.css';

interface GroundingExercise {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  category: 'sensory' | 'breathing' | 'cognitive' | 'physical';
  icon: React.ReactNode;
  instructions: string[];
}

interface GroundingToolkitProps {
  onExerciseComplete?: (exerciseId: string, duration: number) => void;
}

const GroundingToolkit: React.FC<GroundingToolkitProps> = ({
  onExerciseComplete
}) => {
  const [selectedExercise, setSelectedExercise] = useState<GroundingExercise | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const exercises: GroundingExercise[] = [
    {
      id: '54321',
      name: '5-4-3-2-1 Technique',
      description: 'Engage all five senses to ground yourself in the present moment',
      duration: '5-10 min',
      difficulty: 'easy',
      category: 'sensory',
      icon: <Eye size={20} />,
      instructions: [
        'Find 5 things you can see around you',
        'Identify 4 things you can touch',
        'Notice 3 things you can hear',
        'Find 2 things you can smell',
        'Identify 1 thing you can taste'
      ]
    },
    {
      id: 'box-breathing',
      name: 'Box Breathing',
      description: 'Regulate your nervous system with controlled breathing',
      duration: '3-5 min',
      difficulty: 'easy',
      category: 'breathing',
      icon: <Heart size={20} />,
      instructions: [
        'Inhale for 4 counts',
        'Hold your breath for 4 counts',
        'Exhale for 4 counts',
        'Hold empty for 4 counts',
        'Repeat the cycle 4-8 times'
      ]
    },
    {
      id: 'body-scan',
      name: 'Progressive Body Scan',
      description: 'Release tension by systematically relaxing each body part',
      duration: '10-15 min',
      difficulty: 'medium',
      category: 'physical',
      icon: <Hand size={20} />,
      instructions: [
        'Start with your toes and notice any tension',
        'Consciously relax your feet and ankles',
        'Move up to your legs, releasing tension',
        'Relax your torso, arms, and hands',
        'Finally, relax your neck, face, and head',
        'Notice the difference in how you feel'
      ]
    },
    {
      id: 'cognitive-anchoring',
      name: 'Cognitive Anchoring',
      description: 'Use facts and logic to anchor yourself in reality',
      duration: '2-5 min',
      difficulty: 'easy',
      category: 'cognitive',
      icon: <Compass size={20} />,
      instructions: [
        'State your name out loud',
        'Say the current date and time',
        'Describe where you are right now',
        'Name three people who care about you',
        'State one thing you\'re looking forward to'
      ]
    },
    {
      id: 'mindful-walking',
      name: 'Mindful Walking',
      description: 'Ground yourself through intentional movement',
      duration: '5-10 min',
      difficulty: 'medium',
      category: 'physical',
      icon: <Zap size={20} />,
      instructions: [
        'Stand and feel your feet on the ground',
        'Take slow, deliberate steps',
        'Notice how each foot lifts and places',
        'Feel the weight shift from foot to foot',
        'Coordinate your breathing with your steps',
        'Stay present with each movement'
      ]
    },
    {
      id: 'sound-focusing',
      name: 'Sound Focusing',
      description: 'Use auditory awareness to center yourself',
      duration: '3-7 min',
      difficulty: 'easy',
      category: 'sensory',
      icon: <Ear size={20} />,
      instructions: [
        'Close your eyes and listen carefully',
        'Identify the closest sound to you',
        'Notice a sound in the middle distance',
        'Find the farthest sound you can hear',
        'Focus on the silence between sounds',
        'Let all sounds exist without judgment'
      ]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Exercises', count: exercises.length },
    { id: 'sensory', name: 'Sensory', count: exercises.filter(e => e.category === 'sensory').length },
    { id: 'breathing', name: 'Breathing', count: exercises.filter(e => e.category === 'breathing').length },
    { id: 'cognitive', name: 'Cognitive', count: exercises.filter(e => e.category === 'cognitive').length },
    { id: 'physical', name: 'Physical', count: exercises.filter(e => e.category === 'physical').length }
  ];

  const filteredExercises = filter === 'all' 
    ? exercises 
    : exercises.filter(exercise => exercise.category === filter);

  const handleExerciseSelect = (exercise: GroundingExercise) => {
    setSelectedExercise(exercise);
    setCurrentStep(0);
    setIsActive(false);
  };

  const handleStartExercise = () => {
    setIsActive(true);
    setStartTime(new Date());
    setCurrentStep(0);
  };

  const handleNextStep = () => {
    if (!selectedExercise) return;
    
    if (currentStep < selectedExercise.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteExercise();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteExercise = () => {
    if (!selectedExercise || !startTime) return;
    
    const duration = Math.round((Date.now() - startTime.getTime()) / 1000);
    onExerciseComplete?.(selectedExercise.id, duration);
    
    setIsActive(false);
    setSelectedExercise(null);
    setCurrentStep(0);
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentStep(0);
    setStartTime(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sensory': return '#8b5cf6';
      case 'breathing': return '#06b6d4';
      case 'cognitive': return '#f59e0b';
      case 'physical': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (selectedExercise && isActive) {
    return (
      <div className="grounding-toolkit active-exercise">
        <div className="exercise-header">
          <div className="exercise-info">
            <h2>{selectedExercise.name}</h2>
            <div className="exercise-meta">
              <span 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(selectedExercise.difficulty) }}
              >
                {selectedExercise.difficulty}
              </span>
              <span className="duration">{selectedExercise.duration}</span>
            </div>
          </div>
          <button className="reset-btn" onClick={handleReset}>
            <RotateCcw size={18} />
            Reset
          </button>
        </div>

        <div className="exercise-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentStep + 1) / selectedExercise.instructions.length) * 100}%` }}
            />
          </div>
          <span>Step {currentStep + 1} of {selectedExercise.instructions.length}</span>
        </div>

        <div className="current-instruction">
          <div className="instruction-icon" style={{ color: getCategoryColor(selectedExercise.category) }}>
            {selectedExercise.icon}
          </div>
          <h3>Step {currentStep + 1}</h3>
          <p>{selectedExercise.instructions[currentStep]}</p>
        </div>

        <div className="exercise-controls">
          <button 
            className="control-btn secondary"
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
          >
            Previous
          </button>
          <button 
            className="control-btn primary"
            onClick={handleNextStep}
          >
            {currentStep === selectedExercise.instructions.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  if (selectedExercise && !isActive) {
    return (
      <div className="grounding-toolkit exercise-preview">
        <button 
          className="back-btn"
          onClick={() => setSelectedExercise(null)}
        >
          ← Back to Toolkit
        </button>

        <div className="exercise-detail">
          <div className="exercise-header">
            <div className="exercise-icon" style={{ color: getCategoryColor(selectedExercise.category) }}>
              {selectedExercise.icon}
            </div>
            <div>
              <h2>{selectedExercise.name}</h2>
              <p>{selectedExercise.description}</p>
            </div>
          </div>

          <div className="exercise-meta">
            <div className="meta-item">
              <Clock size={16} />
              <span>{selectedExercise.duration}</span>
            </div>
            <div className="meta-item">
              <span 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(selectedExercise.difficulty) }}
              >
                {selectedExercise.difficulty}
              </span>
            </div>
            <div className="meta-item">
              <span className="category-badge">
                {selectedExercise.category}
              </span>
            </div>
          </div>

          <div className="exercise-instructions">
            <h3>Instructions:</h3>
            <ol>
              {selectedExercise.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          <button className="start-exercise-btn" onClick={handleStartExercise}>
            <Compass size={18} />
            Start Exercise
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grounding-toolkit">
      <div className="toolkit-header">
        <Compass size={24} />
        <div>
          <h2>Grounding Toolkit</h2>
          <p>Techniques to help you feel centered and present</p>
        </div>
      </div>

      <div className="category-filters">
        {categories.map(category => (
          <button
            key={category.id}
            className={`filter-btn ${filter === category.id ? 'active' : ''}`}
            onClick={() => setFilter(category.id)}
          >
            {category.name}
            <span className="count">({category.count})</span>
          </button>
        ))}
      </div>

      <div className="exercises-grid">
        {filteredExercises.map(exercise => (
          <div 
            key={exercise.id}
            className="exercise-card"
            onClick={() => handleExerciseSelect(exercise)}
          >
            <div className="card-header">
              <div 
                className="exercise-icon"
                style={{ color: getCategoryColor(exercise.category) }}
              >
                {exercise.icon}
              </div>
              <span 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(exercise.difficulty) }}
              >
                {exercise.difficulty}
              </span>
            </div>

            <div className="card-content">
              <h3>{exercise.name}</h3>
              <p>{exercise.description}</p>
            </div>

            <div className="card-footer">
              <span className="duration">
                <Clock size={14} />
                {exercise.duration}
              </span>
              <span className="category">
                {exercise.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="toolkit-info">
        <h3>When to Use Grounding</h3>
        <ul>
          <li>During moments of anxiety or panic</li>
          <li>When feeling overwhelmed or disconnected</li>
          <li>After a difficult conversation or event</li>
          <li>As a daily mindfulness practice</li>
          <li>Before important meetings or challenges</li>
        </ul>
      </div>
    </div>
  );
};

export default GroundingToolkit;
