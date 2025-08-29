/**
 * Crisis Intervention Training Module
 * Interactive training for recognizing and responding to mental health crises
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../Card';
import { AppButton } from '../AppButton';
import { Modal } from '../Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { certificationService } from '../../services/certificationService';

interface CrisisScenario {
  id: string;
  title: string;
  description: string;
  warningSignsSpotted: string[];
  correctResponse: string[];
  incorrectResponses: string[];
  feedback: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ModuleProgress {
  currentSection: number;
  completedSections: number[];
  quizScore?: number;
  practiceScenarios: Record<string, boolean>;
  timeSpent: number;
}

const CrisisInterventionModule: React.FC<{
  moduleId: string;
  helperId: string;
  onComplete?: (score: number) => void;
  onProgress?: (progress: number) => void;
}> = ({ moduleId, helperId, onComplete, onProgress }) => {
  const { showNotification } = useNotification();
  
  // State management
  const [progress, setProgress] = useState<ModuleProgress>({
    currentSection: 0,
    completedSections: [],
    practiceScenarios: {},
    timeSpent: 0
  });
  
  const [currentScenario, setCurrentScenario] = useState<CrisisScenario | null>(null);
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<'correct' | 'incorrect' | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [startTime] = useState(Date.now());

  // Crisis scenarios for practice
  const scenarios: CrisisScenario[] = [
    {
      id: 'scenario-1',
      title: 'Immediate Suicide Risk',
      description: 'A user messages: "I can\'t do this anymore. I have pills ready and I\'m going to take them tonight. No one will miss me."',
      warningSignsSpotted: [
        'Specific suicide plan mentioned',
        'Means available (pills)',
        'Timeframe specified (tonight)',
        'Feelings of worthlessness'
      ],
      correctResponse: [
        'Express immediate concern for their safety',
        'Ask if they are in immediate danger',
        'Provide crisis hotline numbers',
        'Encourage contacting emergency services',
        'Stay with them (online) until help arrives'
      ],
      incorrectResponses: [
        'Tell them everything will be fine',
        'Share your own problems',
        'Ignore the threat',
        'Give medical advice'
      ],
      feedback: 'This scenario requires immediate intervention. The person has expressed a specific plan, means, and timeline - all high-risk indicators.',
      difficulty: 'advanced'
    },
    {
      id: 'scenario-2',
      title: 'Anxiety Attack',
      description: 'A user says: "I can\'t breathe, my heart is racing, I think I\'m having a heart attack. I\'m so scared."',
      warningSignsSpotted: [
        'Physical symptoms of panic',
        'Catastrophic thinking',
        'Intense fear',
        'Possible panic attack'
      ],
      correctResponse: [
        'Acknowledge their distress',
        'Guide them through grounding techniques',
        'Encourage slow, deep breathing',
        'Suggest seeking medical evaluation if symptoms persist',
        'Provide reassurance without dismissing concerns'
      ],
      incorrectResponses: [
        'Tell them it\'s just in their head',
        'Diagnose them with panic disorder',
        'Minimize their experience',
        'Tell them to just calm down'
      ],
      feedback: 'Panic attacks can feel life-threatening. Validation and grounding techniques are essential while encouraging medical evaluation for safety.',
      difficulty: 'intermediate'
    },
    {
      id: 'scenario-3',
      title: 'Depression with Isolation',
      description: 'A user shares: "I haven\'t left my room in days. I can\'t even shower. Everything feels pointless."',
      warningSignsSpotted: [
        'Social isolation',
        'Neglecting self-care',
        'Hopelessness',
        'Possible severe depression'
      ],
      correctResponse: [
        'Validate their struggle',
        'Encourage small, manageable steps',
        'Suggest professional support',
        'Check for immediate safety concerns',
        'Offer to help create a simple daily routine'
      ],
      incorrectResponses: [
        'Tell them to just get up and exercise',
        'Say others have it worse',
        'Ignore the severity',
        'Push them to socialize immediately'
      ],
      feedback: 'Severe depression requires gentle support and professional intervention. Small steps and validation are key.',
      difficulty: 'intermediate'
    }
  ];

  // Module sections
  const sections = [
    {
      id: 'intro',
      title: 'Introduction to Crisis Intervention',
      content: (
        <div className="section-content">
          <h3 className="text-xl font-semibold mb-4">Understanding Mental Health Crises</h3>
          <p className="mb-4">
            A mental health crisis is any situation where someone's behavior puts them at risk 
            of hurting themselves or others, or prevents them from caring for themselves.
          </p>
          
          <div className="key-concepts mb-6">
            <h4 className="font-semibold mb-2">Key Concepts:</h4>
            <ul className="list-disc list-inside space-y-2">
              <li>Crises are temporary but require immediate attention</li>
              <li>Your role is to provide support, not therapy</li>
              <li>Safety is always the top priority</li>
              <li>Professional help may be necessary</li>
              <li>Cultural sensitivity is crucial</li>
            </ul>
          </div>
          
          <Card className="warning-card bg-red-50 border-red-200">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Important Warning</h4>
            <p className="text-red-700">
              If someone is in immediate danger, always encourage them to contact emergency services 
              (911 in the US) or their local crisis hotline immediately.
            </p>
          </Card>
        </div>
      )
    },
    {
      id: 'recognition',
      title: 'Recognizing Crisis Warning Signs',
      content: (
        <div className="section-content">
          <h3 className="text-xl font-semibold mb-4">Warning Signs to Watch For</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-yellow-50">
              <h4 className="font-semibold text-yellow-800 mb-2">Verbal Cues</h4>
              <ul className="text-sm space-y-1">
                <li>• "I want to die"</li>
                <li>• "I can't go on"</li>
                <li>• "No one would miss me"</li>
                <li>• "I'm a burden"</li>
                <li>• "There's no point"</li>
              </ul>
            </Card>
            
            <Card className="bg-orange-50">
              <h4 className="font-semibold text-orange-800 mb-2">Behavioral Changes</h4>
              <ul className="text-sm space-y-1">
                <li>• Withdrawing from others</li>
                <li>• Giving away possessions</li>
                <li>• Increased substance use</li>
                <li>• Dramatic mood swings</li>
                <li>• Saying goodbye</li>
              </ul>
            </Card>
            
            <Card className="bg-red-50">
              <h4 className="font-semibold text-red-800 mb-2">High-Risk Indicators</h4>
              <ul className="text-sm space-y-1">
                <li>• Specific suicide plan</li>
                <li>• Access to means</li>
                <li>• Previous attempts</li>
                <li>• Recent loss or trauma</li>
                <li>• Feeling trapped</li>
              </ul>
            </Card>
            
            <Card className="bg-purple-50">
              <h4 className="font-semibold text-purple-800 mb-2">Emotional Signs</h4>
              <ul className="text-sm space-y-1">
                <li>• Hopelessness</li>
                <li>• Overwhelming guilt/shame</li>
                <li>• Extreme anxiety</li>
                <li>• Rage or revenge seeking</li>
                <li>• Sudden calmness after depression</li>
              </ul>
            </Card>
          </div>
          
          <div className="interactive-exercise">
            <h4 className="font-semibold mb-2">Quick Check: Test Your Recognition</h4>
            <p className="text-sm text-gray-600 mb-3">
              Which of these statements indicates the highest immediate risk?
            </p>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="radio" name="risk-check" className="mr-2" />
                <span>"I've been feeling really down lately"</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="risk-check" className="mr-2" />
                <span>"I have a gun and I'm going to use it tonight"</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="risk-check" className="mr-2" />
                <span>"Sometimes I wonder if things would be better without me"</span>
              </label>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'response',
      title: 'Crisis Response Techniques',
      content: (
        <div className="section-content">
          <h3 className="text-xl font-semibold mb-4">How to Respond in a Crisis</h3>
          
          <div className="response-framework mb-6">
            <h4 className="font-semibold mb-3">The SAFER Model</h4>
            <div className="space-y-3">
              <Card>
                <h5 className="font-semibold text-blue-700">S - Stabilize</h5>
                <p className="text-sm">Ensure immediate safety and reduce intense emotions</p>
              </Card>
              <Card>
                <h5 className="font-semibold text-blue-700">A - Acknowledge</h5>
                <p className="text-sm">Validate their feelings and show you're listening</p>
              </Card>
              <Card>
                <h5 className="font-semibold text-blue-700">F - Facilitate Understanding</h5>
                <p className="text-sm">Help them understand what they're experiencing</p>
              </Card>
              <Card>
                <h5 className="font-semibold text-blue-700">E - Encourage Coping</h5>
                <p className="text-sm">Support existing coping strategies and suggest new ones</p>
              </Card>
              <Card>
                <h5 className="font-semibold text-blue-700">R - Refer/Resources</h5>
                <p className="text-sm">Connect them with professional help and resources</p>
              </Card>
            </div>
          </div>
          
          <div className="do-dont-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-50">
              <h4 className="font-semibold text-green-800 mb-2">✓ DO</h4>
              <ul className="text-sm space-y-1">
                <li>• Stay calm and patient</li>
                <li>• Listen without judgment</li>
                <li>• Ask direct questions about safety</li>
                <li>• Take all threats seriously</li>
                <li>• Know your limits</li>
                <li>• Document interactions</li>
              </ul>
            </Card>
            
            <Card className="bg-red-50">
              <h4 className="font-semibold text-red-800 mb-2">✗ DON'T</h4>
              <ul className="text-sm space-y-1">
                <li>• Promise confidentiality you can't keep</li>
                <li>• Try to be their therapist</li>
                <li>• Minimize their feelings</li>
                <li>• Argue or debate</li>
                <li>• Leave them alone if unsafe</li>
                <li>• Give medical advice</li>
              </ul>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'practice',
      title: 'Practice Scenarios',
      content: (
        <div className="section-content">
          <h3 className="text-xl font-semibold mb-4">Practice with Real-World Scenarios</h3>
          <p className="mb-4">
            Apply what you've learned by working through these crisis scenarios. 
            Choose the best responses and receive immediate feedback.
          </p>
          
          <div className="scenarios-list space-y-3">
            {scenarios.map(scenario => (
              <Card 
                key={scenario.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  progress.practiceScenarios[scenario.id] ? 'bg-green-50' : ''
                }`}
                onClick={() => startScenario(scenario)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{scenario.title}</h4>
                    <p className="text-sm text-gray-600">Difficulty: {scenario.difficulty}</p>
                  </div>
                  <div>
                    {progress.practiceScenarios[scenario.id] ? (
                      <span className="text-green-600">✓ Completed</span>
                    ) : (
                      <AppButton variant="primary" size="small">
                        Start Practice
                      </AppButton>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'quiz',
      title: 'Knowledge Assessment',
      content: (
        <div className="section-content">
          <h3 className="text-xl font-semibold mb-4">Final Assessment</h3>
          <p className="mb-4">
            Test your understanding of crisis intervention principles. 
            You need 70% or higher to pass this module.
          </p>
          
          <div className="quiz-questions space-y-6">
            <Card>
              <h4 className="font-semibold mb-3">Question 1</h4>
              <p className="mb-3">
                What is the FIRST priority when someone expresses suicidal thoughts?
              </p>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q1" 
                    value="a"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q1: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Assess their immediate safety and risk level</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q1" 
                    value="b"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q1: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Tell them about your own experiences</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q1" 
                    value="c"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q1: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Provide them with coping strategies</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q1" 
                    value="d"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q1: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Change the subject to something positive</span>
                </label>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold mb-3">Question 2</h4>
              <p className="mb-3">
                Which of these is a HIGH-RISK warning sign requiring immediate intervention?
              </p>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q2" 
                    value="a"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q2: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Feeling sad or depressed</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q2" 
                    value="b"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q2: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Having a specific suicide plan with means and timeline</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q2" 
                    value="c"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q2: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Experiencing anxiety</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q2" 
                    value="d"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q2: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Having trouble sleeping</span>
                </label>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold mb-3">Question 3</h4>
              <p className="mb-3">
                True or False: You should promise complete confidentiality to build trust 
                with someone in crisis.
              </p>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q3" 
                    value="true"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q3: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>True</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q3" 
                    value="false"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q3: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>False</span>
                </label>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold mb-3">Question 4</h4>
              <p className="mb-3">
                What does the 'R' in the SAFER model stand for?
              </p>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q4" 
                    value="a"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q4: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Respond quickly</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q4" 
                    value="b"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q4: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Refer/Resources</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q4" 
                    value="c"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q4: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Reassure constantly</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q4" 
                    value="d"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q4: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Remove dangers</span>
                </label>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold mb-3">Question 5</h4>
              <p className="mb-3">
                When someone is having a panic attack, you should:
              </p>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q5" 
                    value="a"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q5: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Tell them to calm down and stop overreacting</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q5" 
                    value="b"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q5: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Guide them through grounding techniques and breathing exercises</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q5" 
                    value="c"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q5: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Leave them alone to work through it</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q5" 
                    value="d"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q5: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Diagnose them with panic disorder</span>
                </label>
              </div>
            </Card>
          </div>
          
          <div className="mt-6">
            <AppButton
              variant="primary"
              onClick={submitQuiz}
              disabled={Object.keys(quizAnswers).length < 5}
              className="w-full"
            >
              Submit Assessment
            </AppButton>
          </div>
        </div>
      )
    }
  ];

  /**
   * Start a practice scenario
   */
  const startScenario = useCallback((scenario: CrisisScenario) => {
    setCurrentScenario(scenario);
    setSelectedResponses([]);
    setShowFeedback(false);
    setScenarioResult(null);
  }, []);

  /**
   * Submit scenario response
   */
  const submitScenarioResponse = useCallback(() => {
    if (!currentScenario) return;
    
    // Check if all correct responses were selected
    const correctSelected = currentScenario.correctResponse.every(
      response => selectedResponses.includes(response)
    );
    
    // Check if any incorrect responses were selected
    const incorrectSelected = currentScenario.incorrectResponses.some(
      response => selectedResponses.includes(response)
    );
    
    const isCorrect = correctSelected && !incorrectSelected;
    setScenarioResult(isCorrect ? 'correct' : 'incorrect');
    setShowFeedback(true);
    
    // Update progress
    if (isCorrect) {
      setProgress(prev => ({
        ...prev,
        practiceScenarios: {
          ...prev.practiceScenarios,
          [currentScenario.id]: true
        }
      }));
      showNotification('success', 'Great job! You handled the scenario correctly.');
    } else {
      showNotification('warning', 'Review the feedback and try again.');
    }
  }, [currentScenario, selectedResponses]);

  /**
   * Submit quiz
   */
  const submitQuiz = useCallback(() => {
    const correctAnswers = {
      q1: 'a',
      q2: 'b',
      q3: 'false',
      q4: 'b',
      q5: 'b'
    };
    
    let score = 0;
    Object.keys(correctAnswers).forEach(key => {
      if (quizAnswers[key] === correctAnswers[key as keyof typeof correctAnswers]) {
        score += 20;
      }
    });
    
    setProgress(prev => ({
      ...prev,
      quizScore: score,
      completedSections: [...prev.completedSections, sections.length - 1]
    }));
    
    setShowQuizResults(true);
    
    if (score >= 70) {
      // Module completed successfully
      const timeSpent = Math.floor((Date.now() - startTime) / 60000); // in minutes
      certificationService.completeModule(helperId, moduleId, score, timeSpent);
      
      if (onComplete) {
        onComplete(score);
      }
      
      showNotification('success', `Module completed with ${score}% score!`);
    } else {
      showNotification('warning', `Score: ${score}%. You need 70% to pass. Please review and try again.`);
    }
  }, [quizAnswers, helperId, moduleId, startTime, onComplete]);

  /**
   * Navigate sections
   */
  const navigateSection = useCallback((direction: 'next' | 'prev') => {
    setProgress(prev => {
      const newSection = direction === 'next' 
        ? Math.min(prev.currentSection + 1, sections.length - 1)
        : Math.max(prev.currentSection - 1, 0);
      
      // Mark section as completed when moving forward
      if (direction === 'next' && !prev.completedSections.includes(prev.currentSection)) {
        return {
          ...prev,
          currentSection: newSection,
          completedSections: [...prev.completedSections, prev.currentSection]
        };
      }
      
      return {
        ...prev,
        currentSection: newSection
      };
    });
  }, [sections.length]);

  /**
   * Update progress callback
   */
  useEffect(() => {
    if (onProgress) {
      const progressPercentage = ((progress.completedSections.length + 1) / sections.length) * 100;
      onProgress(progressPercentage);
    }
  }, [progress.completedSections, sections.length, onProgress]);

  const currentSectionData = sections[progress.currentSection];

  return (
    <div className="crisis-intervention-module">
      {/* Module Header */}
      <div className="module-header mb-6">
        <h2 className="text-2xl font-bold mb-2">Crisis Intervention Training</h2>
        <div className="progress-bar bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((progress.currentSection + 1) / sections.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Section {progress.currentSection + 1} of {sections.length}</span>
          <span>{currentSectionData.title}</span>
        </div>
      </div>

      {/* Section Content */}
      <Card className="section-container mb-6">
        {currentSectionData.content}
      </Card>

      {/* Navigation */}
      <div className="navigation-buttons flex justify-between">
        <AppButton
          variant="secondary"
          onClick={() => navigateSection('prev')}
          disabled={progress.currentSection === 0}
        >
          Previous
        </AppButton>
        
        {progress.currentSection < sections.length - 1 ? (
          <AppButton
            variant="primary"
            onClick={() => navigateSection('next')}
          >
            Next Section
          </AppButton>
        ) : (
          <AppButton
            variant="success"
            onClick={submitQuiz}
            disabled={Object.keys(quizAnswers).length < 5}
          >
            Complete Module
          </AppButton>
        )}
      </div>

      {/* Scenario Modal */}
      {currentScenario && (
        <Modal
          isOpen={!!currentScenario}
          onClose={() => setCurrentScenario(null)}
          title={currentScenario.title}
        >
          <div className="scenario-practice">
            <div className="scenario-description mb-4">
              <p className="font-semibold mb-2">Scenario:</p>
              <Card className="bg-gray-50 p-4">
                <p>{currentScenario.description}</p>
              </Card>
            </div>
            
            {!showFeedback ? (
              <>
                <div className="response-options mb-4">
                  <p className="font-semibold mb-2">Select all appropriate responses:</p>
                  <div className="space-y-2">
                    {[...currentScenario.correctResponse, ...currentScenario.incorrectResponses]
                      .sort(() => Math.random() - 0.5)
                      .map((response, index) => (
                        <label key={index} className="flex items-start">
                          <input
                            type="checkbox"
                            className="mr-2 mt-1"
                            checked={selectedResponses.includes(response)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedResponses([...selectedResponses, response]);
                              } else {
                                setSelectedResponses(selectedResponses.filter(r => r !== response));
                              }
                            }}
                          />
                          <span>{response}</span>
                        </label>
                      ))}
                  </div>
                </div>
                
                <AppButton
                  variant="primary"
                  onClick={submitScenarioResponse}
                  disabled={selectedResponses.length === 0}
                  className="w-full"
                >
                  Submit Response
                </AppButton>
              </>
            ) : (
              <>
                <div className={`result-feedback mb-4 p-4 rounded ${
                  scenarioResult === 'correct' ? 'bg-green-50' : 'bg-yellow-50'
                }`}>
                  <p className={`font-semibold mb-2 ${
                    scenarioResult === 'correct' ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {scenarioResult === 'correct' ? '✓ Correct!' : '⚠ Review Needed'}
                  </p>
                  <p className="text-sm mb-3">{currentScenario.feedback}</p>
                  
                  <div className="correct-responses">
                    <p className="font-semibold text-sm mb-1">Correct responses:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {currentScenario.correctResponse.map((response, index) => (
                        <li key={index} className={
                          selectedResponses.includes(response) ? 'text-green-600' : 'text-gray-600'
                        }>
                          {response}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="warning-signs mt-3">
                    <p className="font-semibold text-sm mb-1">Warning signs in this scenario:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {currentScenario.warningSignsSpotted.map((sign, index) => (
                        <li key={index}>{sign}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <AppButton
                    variant="secondary"
                    onClick={() => {
                      setShowFeedback(false);
                      setSelectedResponses([]);
                      setScenarioResult(null);
                    }}
                    className="flex-1"
                  >
                    Try Again
                  </AppButton>
                  <AppButton
                    variant="primary"
                    onClick={() => setCurrentScenario(null)}
                    className="flex-1"
                  >
                    Continue
                  </AppButton>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Quiz Results Modal */}
      {showQuizResults && progress.quizScore !== undefined && (
        <Modal
          isOpen={showQuizResults}
          onClose={() => setShowQuizResults(false)}
          title="Assessment Results"
        >
          <div className="quiz-results text-center">
            <div className={`text-6xl mb-4 ${
              progress.quizScore >= 70 ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {progress.quizScore >= 70 ? '🎉' : '📚'}
            </div>
            <h3 className="text-2xl font-bold mb-2">
              Score: {progress.quizScore}%
            </h3>
            <p className="text-gray-600 mb-6">
              {progress.quizScore >= 70 
                ? 'Congratulations! You\'ve passed the Crisis Intervention module.'
                : 'You need 70% to pass. Review the material and try again.'}
            </p>
            <AppButton
              variant={progress.quizScore >= 70 ? 'success' : 'primary'}
              onClick={() => setShowQuizResults(false)}
              className="w-full"
            >
              {progress.quizScore >= 70 ? 'Complete' : 'Review Material'}
            </AppButton>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CrisisInterventionModule;