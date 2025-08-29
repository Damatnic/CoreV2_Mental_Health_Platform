/**
 * Active Listening Skills Training Module
 * Interactive training for developing empathetic communication skills
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../Card';
import { AppButton } from '../AppButton';
import { Modal } from '../Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { certificationService } from '../../services/certificationService';

interface ListeningExercise {
  id: string;
  title: string;
  userStatement: string;
  responses: {
    text: string;
    type: 'reflective' | 'advice' | 'dismissive' | 'judgmental';
    feedback: string;
  }[];
  bestResponse: number;
  teachingPoint: string;
}

interface ConversationSimulation {
  id: string;
  title: string;
  context: string;
  messages: {
    speaker: 'user' | 'helper';
    text: string;
    emotion?: string;
  }[];
  responseOptions?: string[];
  correctResponse?: number;
}

const ActiveListeningModule: React.FC<{
  moduleId: string;
  helperId: string;
  onComplete?: (score: number) => void;
  onProgress?: (progress: number) => void;
}> = ({ moduleId, helperId, onComplete, onProgress }) => {
  const { showNotification } = useNotification();
  
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [exerciseScores, setExerciseScores] = useState<Record<string, number>>({});
  const [currentExercise, setCurrentExercise] = useState<ListeningExercise | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  // Listening exercises
  const exercises: ListeningExercise[] = [
    {
      id: 'exercise-1',
      title: 'Reflecting Feelings',
      userStatement: "I feel like nobody understands me. My family just tells me to get over it.",
      responses: [
        {
          text: "It sounds like you're feeling really isolated and invalidated by your family's response.",
          type: 'reflective',
          feedback: 'Excellent! This response reflects both the feeling (isolation) and the situation.'
        },
        {
          text: "You should try talking to them more clearly about your needs.",
          type: 'advice',
          feedback: 'This jumps to advice-giving before fully understanding their experience.'
        },
        {
          text: "Everyone feels that way sometimes.",
          type: 'dismissive',
          feedback: 'This minimizes their unique experience and feelings.'
        },
        {
          text: "Maybe they're right and you should try to move on.",
          type: 'judgmental',
          feedback: 'This takes sides and invalidates the person\'s feelings.'
        }
      ],
      bestResponse: 0,
      teachingPoint: 'Reflective listening involves mirroring back what you hear, including both content and emotions.'
    },
    {
      id: 'exercise-2',
      title: 'Paraphrasing',
      userStatement: "I've been working so hard but my boss never notices. I stay late, take on extra projects, but it's like I'm invisible.",
      responses: [
        {
          text: "Your boss sounds terrible. You should find a new job.",
          type: 'advice',
          feedback: 'This jumps to conclusions and offers unsolicited advice.'
        },
        {
          text: "So despite putting in extra effort and time, you feel unrecognized at work.",
          type: 'reflective',
          feedback: 'Perfect! This paraphrases the key points without adding interpretation.'
        },
        {
          text: "That happens in every workplace.",
          type: 'dismissive',
          feedback: 'This dismisses their specific situation as universal.'
        },
        {
          text: "Have you considered that maybe your work quality needs improvement?",
          type: 'judgmental',
          feedback: 'This is judgmental and makes assumptions.'
        }
      ],
      bestResponse: 1,
      teachingPoint: 'Paraphrasing shows you understand by restating their message in your own words.'
    },
    {
      id: 'exercise-3',
      title: 'Emotional Validation',
      userStatement: "I know I shouldn't be this upset about my pet dying, but I can't stop crying.",
      responses: [
        {
          text: "It's just a pet, you'll get over it soon.",
          type: 'dismissive',
          feedback: 'This invalidates their grief and minimizes the loss.'
        },
        {
          text: "You should get a new pet to help you move on.",
          type: 'advice',
          feedback: 'This rushes to problem-solving without acknowledging their grief.'
        },
        {
          text: "Losing a pet can be incredibly painful. Your grief is completely valid.",
          type: 'reflective',
          feedback: 'Excellent! This validates their emotions and normalizes their grief.'
        },
        {
          text: "At least it wasn't a family member.",
          type: 'dismissive',
          feedback: 'This compares losses inappropriately and minimizes their pain.'
        }
      ],
      bestResponse: 2,
      teachingPoint: 'Validation means accepting and acknowledging someone\'s emotions as legitimate.'
    }
  ];

  // Module sections
  const sections = [
    {
      id: 'intro',
      title: 'Introduction to Active Listening',
      content: (
        <div className="section-content">
          <h3 className="text-xl font-semibold mb-4">The Power of Being Heard</h3>
          <p className="mb-4">
            Active listening is more than just hearing words - it's about fully understanding 
            and connecting with another person's experience. For someone in emotional distress, 
            being truly heard can be transformative.
          </p>
          
          <Card className="bg-blue-50 mb-6">
            <h4 className="font-semibold text-blue-800 mb-2">What is Active Listening?</h4>
            <p className="text-blue-700">
              Active listening is a communication technique that requires the listener to fully 
              concentrate, understand, respond, and remember what is being said. It involves 
              using all your senses to pay attention to the speaker.
            </p>
          </Card>
          
          <div className="key-benefits mb-6">
            <h4 className="font-semibold mb-3">Benefits of Active Listening:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="bg-green-50">
                <h5 className="font-medium text-green-800">For the Speaker</h5>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• Feels heard and validated</li>
                  <li>• Gains clarity through expression</li>
                  <li>• Builds trust in the relationship</li>
                  <li>• Reduces emotional intensity</li>
                </ul>
              </Card>
              <Card className="bg-purple-50">
                <h5 className="font-medium text-purple-800">For the Listener</h5>
                <ul className="text-sm text-purple-700 mt-2 space-y-1">
                  <li>• Better understanding of issues</li>
                  <li>• Stronger connection with speaker</li>
                  <li>• More effective support</li>
                  <li>• Reduced misunderstandings</li>
                </ul>
              </Card>
            </div>
          </div>
          
          <div className="barriers-section">
            <h4 className="font-semibold mb-2">Common Barriers to Active Listening:</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Planning what to say next instead of listening</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Judging or evaluating what's being said</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Getting triggered by certain topics</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Rushing to provide solutions</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'techniques',
      title: 'Core Listening Techniques',
      content: (
        <div className="section-content">
          <h3 className="text-xl font-semibold mb-4">Essential Active Listening Skills</h3>
          
          <div className="techniques-grid space-y-4">
            <Card>
              <h4 className="font-semibold text-blue-700 mb-2">1. Reflective Listening</h4>
              <p className="text-sm mb-2">
                Mirror back what you hear, including both content and emotions.
              </p>
              <div className="example bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium">Example:</p>
                <p className="italic">"I hear that you're feeling overwhelmed by all these changes happening at once."</p>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold text-blue-700 mb-2">2. Paraphrasing</h4>
              <p className="text-sm mb-2">
                Restate the speaker's message in your own words to confirm understanding.
              </p>
              <div className="example bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium">Example:</p>
                <p className="italic">"So if I understand correctly, you're saying that..."</p>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold text-blue-700 mb-2">3. Summarizing</h4>
              <p className="text-sm mb-2">
                Bring together main points to show overall understanding.
              </p>
              <div className="example bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium">Example:</p>
                <p className="italic">"Let me make sure I've got this: you're dealing with X, Y, and Z..."</p>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold text-blue-700 mb-2">4. Emotional Labeling</h4>
              <p className="text-sm mb-2">
                Identify and name the emotions you're observing.
              </p>
              <div className="example bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium">Example:</p>
                <p className="italic">"It sounds like you're feeling frustrated and disappointed."</p>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold text-blue-700 mb-2">5. Open-Ended Questions</h4>
              <p className="text-sm mb-2">
                Ask questions that encourage elaboration and exploration.
              </p>
              <div className="example bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium">Example:</p>
                <p className="italic">"Can you tell me more about what that was like for you?"</p>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold text-blue-700 mb-2">6. Minimal Encouragers</h4>
              <p className="text-sm mb-2">
                Use brief verbal and non-verbal cues to show you're engaged.
              </p>
              <div className="example bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium">Examples:</p>
                <p className="italic">"Mm-hmm", "I see", "Go on", head nods</p>
              </div>
            </Card>
          </div>
          
          <Card className="mt-6 bg-yellow-50">
            <h4 className="font-semibold text-yellow-800 mb-2">Remember: The 70/30 Rule</h4>
            <p className="text-yellow-700 text-sm">
              In active listening, aim to listen 70% of the time and speak 30% of the time. 
              Your role is to understand, not to dominate the conversation.
            </p>
          </Card>
        </div>
      )
    },
    {
      id: 'nonverbal',
      title: 'Non-Verbal Communication',
      content: (
        <div className="section-content">
          <h3 className="text-xl font-semibold mb-4">The Silent Language of Listening</h3>
          <p className="mb-4">
            Research shows that 55% of communication is body language, 38% is tone of voice, 
            and only 7% is the actual words. Your non-verbal cues are crucial in active listening.
          </p>
          
          <div className="nonverbal-elements">
            <h4 className="font-semibold mb-3">Key Non-Verbal Elements:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-indigo-50">
                <h5 className="font-medium text-indigo-800 mb-2">👁️ Eye Contact</h5>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• Maintain appropriate eye contact (not staring)</li>
                  <li>• Shows attention and interest</li>
                  <li>• Cultural sensitivity is important</li>
                  <li>• Look away occasionally to avoid intensity</li>
                </ul>
              </Card>
              
              <Card className="bg-teal-50">
                <h5 className="font-medium text-teal-800 mb-2">🪑 Body Posture</h5>
                <ul className="text-sm text-teal-700 space-y-1">
                  <li>• Lean slightly forward to show interest</li>
                  <li>• Keep arms uncrossed and open</li>
                  <li>• Face the speaker directly</li>
                  <li>• Maintain relaxed, attentive posture</li>
                </ul>
              </Card>
              
              <Card className="bg-pink-50">
                <h5 className="font-medium text-pink-800 mb-2">😊 Facial Expressions</h5>
                <ul className="text-sm text-pink-700 space-y-1">
                  <li>• Match appropriate emotions</li>
                  <li>• Show concern when appropriate</li>
                  <li>• Avoid judgmental expressions</li>
                  <li>• Use encouraging smiles carefully</li>
                </ul>
              </Card>
              
              <Card className="bg-amber-50">
                <h5 className="font-medium text-amber-800 mb-2">🗣️ Vocal Qualities</h5>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Use calm, steady tone</li>
                  <li>• Match volume appropriately</li>
                  <li>• Pace your responses thoughtfully</li>
                  <li>• Allow for comfortable silences</li>
                </ul>
              </Card>
            </div>
          </div>
          
          <Card className="mt-6 bg-red-50">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Digital Communication Note</h4>
            <p className="text-red-700 text-sm">
              In text-based support, non-verbal cues are absent. Compensate by:
            </p>
            <ul className="text-sm text-red-700 mt-2 space-y-1">
              <li>• Using validating language more explicitly</li>
              <li>• Asking clarifying questions about emotions</li>
              <li>• Being extra careful with word choice</li>
              <li>• Using appropriate emojis sparingly for warmth</li>
            </ul>
          </Card>
        </div>
      )
    },
    {
      id: 'practice',
      title: 'Practice Exercises',
      content: (
        <div className="section-content">
          <h3 className="text-xl font-semibold mb-4">Apply Your Active Listening Skills</h3>
          <p className="mb-4">
            Practice identifying the best active listening responses in these scenarios. 
            Each exercise focuses on a different aspect of active listening.
          </p>
          
          <div className="exercises-list space-y-3">
            {exercises.map(exercise => (
              <Card 
                key={exercise.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  exerciseScores[exercise.id] !== undefined ? 'bg-green-50' : ''
                }`}
                onClick={() => startExercise(exercise)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{exercise.title}</h4>
                    <p className="text-sm text-gray-600">{exercise.teachingPoint}</p>
                  </div>
                  <div>
                    {exerciseScores[exercise.id] !== undefined ? (
                      <span className="text-green-600">
                        ✓ Score: {exerciseScores[exercise.id]}%
                      </span>
                    ) : (
                      <AppButton variant="primary" size="small">
                        Start Exercise
                      </AppButton>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <Card className="mt-6 bg-blue-50">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Practice Tip</h4>
            <p className="text-blue-700 text-sm">
              When choosing responses, ask yourself:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Does this show I understood their feelings?</li>
              <li>• Am I adding my own interpretation or advice?</li>
              <li>• Would I feel heard if someone said this to me?</li>
            </ul>
          </Card>
        </div>
      )
    },
    {
      id: 'assessment',
      title: 'Final Assessment',
      content: (
        <div className="section-content">
          <h3 className="text-xl font-semibold mb-4">Active Listening Skills Assessment</h3>
          <p className="mb-4">
            Test your understanding of active listening principles. You need 70% or higher to pass.
          </p>
          
          <div className="quiz-questions space-y-6">
            <Card>
              <h4 className="font-semibold mb-3">Question 1</h4>
              <p className="mb-3">
                Which of the following is the BEST example of reflective listening?
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
                  <span>"I understand exactly how you feel."</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q1" 
                    value="b"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q1: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>"It sounds like you're feeling frustrated about the lack of support."</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q1" 
                    value="c"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q1: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>"You should talk to someone about this."</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q1" 
                    value="d"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q1: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>"That must be difficult."</span>
                </label>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold mb-3">Question 2</h4>
              <p className="mb-3">
                What percentage of communication is typically non-verbal?
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
                  <span>30%</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q2" 
                    value="b"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q2: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>55%</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q2" 
                    value="c"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q2: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>70%</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q2" 
                    value="d"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q2: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>93%</span>
                </label>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold mb-3">Question 3</h4>
              <p className="mb-3">
                True or False: In active listening, you should spend most of your time 
                giving advice and solutions.
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
                Which is NOT a barrier to active listening?
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
                  <span>Planning your response while they speak</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q4" 
                    value="b"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q4: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Asking clarifying questions</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q4" 
                    value="c"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q4: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Judging what's being said</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q4" 
                    value="d"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q4: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>Getting emotionally triggered</span>
                </label>
              </div>
            </Card>
            
            <Card>
              <h4 className="font-semibold mb-3">Question 5</h4>
              <p className="mb-3">
                What is the purpose of "minimal encouragers" in active listening?
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
                  <span>To interrupt and redirect the conversation</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q5" 
                    value="b"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q5: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>To show you're engaged without interrupting</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q5" 
                    value="c"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q5: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>To minimize the speaker's emotions</span>
                </label>
                <label className="flex items-start">
                  <input 
                    type="radio" 
                    name="q5" 
                    value="d"
                    onChange={(e) => setQuizAnswers({...quizAnswers, q5: e.target.value})}
                    className="mr-2 mt-1" 
                  />
                  <span>To end the conversation quickly</span>
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
   * Start a practice exercise
   */
  const startExercise = useCallback((exercise: ListeningExercise) => {
    setCurrentExercise(exercise);
    setSelectedResponse(null);
    setShowFeedback(false);
  }, []);

  /**
   * Submit exercise response
   */
  const submitExerciseResponse = useCallback(() => {
    if (currentExercise === null || selectedResponse === null) return;
    
    const isCorrect = selectedResponse === currentExercise.bestResponse;
    const score = isCorrect ? 100 : 0;
    
    setExerciseScores(prev => ({
      ...prev,
      [currentExercise.id]: score
    }));
    
    setShowFeedback(true);
    
    if (isCorrect) {
      showNotification('success', 'Excellent choice! That\'s the best active listening response.');
    } else {
      showNotification('info', 'Review the feedback to understand why another response works better.');
    }
  }, [currentExercise, selectedResponse]);

  /**
   * Submit quiz
   */
  const submitQuiz = useCallback(() => {
    const correctAnswers = {
      q1: 'b',
      q2: 'd', // 93% (55% body language + 38% tone)
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
    
    setQuizScore(score);
    setShowQuizResults(true);
    
    if (score >= 70) {
      const timeSpent = Math.floor((Date.now() - startTime) / 60000);
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
    const newSection = direction === 'next' 
      ? Math.min(currentSection + 1, sections.length - 1)
      : Math.max(currentSection - 1, 0);
    
    setCurrentSection(newSection);
    
    if (direction === 'next' && !completedSections.includes(currentSection)) {
      setCompletedSections([...completedSections, currentSection]);
    }
  }, [currentSection, completedSections, sections.length]);

  /**
   * Update progress
   */
  useEffect(() => {
    if (onProgress) {
      const progressPercentage = ((completedSections.length + 1) / sections.length) * 100;
      onProgress(progressPercentage);
    }
  }, [completedSections, sections.length, onProgress]);

  const currentSectionData = sections[currentSection];

  return (
    <div className="active-listening-module">
      {/* Module Header */}
      <div className="module-header mb-6">
        <h2 className="text-2xl font-bold mb-2">Active Listening Skills Training</h2>
        <div className="progress-bar bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Section {currentSection + 1} of {sections.length}</span>
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
          disabled={currentSection === 0}
        >
          Previous
        </AppButton>
        
        {currentSection < sections.length - 1 ? (
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

      {/* Exercise Modal */}
      {currentExercise && (
        <Modal
          isOpen={!!currentExercise}
          onClose={() => setCurrentExercise(null)}
          title={currentExercise.title}
        >
          <div className="exercise-practice">
            <div className="user-statement mb-4">
              <p className="font-semibold mb-2">User says:</p>
              <Card className="bg-gray-50 p-4">
                <p className="italic">"{currentExercise.userStatement}"</p>
              </Card>
            </div>
            
            {!showFeedback ? (
              <>
                <div className="response-options mb-4">
                  <p className="font-semibold mb-2">Choose the best active listening response:</p>
                  <div className="space-y-2">
                    {currentExercise.responses.map((response, index) => (
                      <label key={index} className="flex items-start">
                        <input
                          type="radio"
                          name="response"
                          className="mr-2 mt-1"
                          checked={selectedResponse === index}
                          onChange={() => setSelectedResponse(index)}
                        />
                        <span>{response.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <AppButton
                  variant="primary"
                  onClick={submitExerciseResponse}
                  disabled={selectedResponse === null}
                  className="w-full"
                >
                  Submit Response
                </AppButton>
              </>
            ) : (
              <>
                <div className="feedback mb-4">
                  {currentExercise.responses.map((response, index) => (
                    <Card 
                      key={index}
                      className={`mb-2 ${
                        index === currentExercise.bestResponse 
                          ? 'bg-green-50 border-green-300' 
                          : index === selectedResponse
                          ? 'bg-yellow-50 border-yellow-300'
                          : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <span className="mr-2">
                          {index === currentExercise.bestResponse ? '✓' : 
                           index === selectedResponse ? '→' : ''}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{response.text}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Type: <span className="font-medium">{response.type}</span>
                          </p>
                          <p className="text-sm mt-1">{response.feedback}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  <Card className="mt-4 bg-blue-50">
                    <p className="font-semibold text-blue-800 mb-1">Teaching Point:</p>
                    <p className="text-blue-700 text-sm">{currentExercise.teachingPoint}</p>
                  </Card>
                </div>
                
                <AppButton
                  variant="primary"
                  onClick={() => setCurrentExercise(null)}
                  className="w-full"
                >
                  Continue
                </AppButton>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Quiz Results Modal */}
      {showQuizResults && quizScore !== null && (
        <Modal
          isOpen={showQuizResults}
          onClose={() => setShowQuizResults(false)}
          title="Assessment Results"
        >
          <div className="quiz-results text-center">
            <div className={`text-6xl mb-4 ${
              quizScore >= 70 ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {quizScore >= 70 ? '🎉' : '📚'}
            </div>
            <h3 className="text-2xl font-bold mb-2">
              Score: {quizScore}%
            </h3>
            <p className="text-gray-600 mb-6">
              {quizScore >= 70 
                ? 'Congratulations! You\'ve mastered Active Listening skills.'
                : 'You need 70% to pass. Review the material and try again.'}
            </p>
            <AppButton
              variant={quizScore >= 70 ? 'success' : 'primary'}
              onClick={() => setShowQuizResults(false)}
              className="w-full"
            >
              {quizScore >= 70 ? 'Complete' : 'Review Material'}
            </AppButton>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ActiveListeningModule;