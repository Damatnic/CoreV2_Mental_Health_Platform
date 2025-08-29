import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { CheckIcon, PlayIcon, LockIcon, BookIcon, CertificateIcon, ClockIcon } from '../components/icons.dynamic';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'communication' | 'crisis' | 'ethics' | 'techniques' | 'assessment';
  isCompleted: boolean;
  isLocked: boolean;
  prerequisites: string[];
  completionDate?: Date;
  score?: number;
  certificateUrl?: string;
  content: {
    type: 'video' | 'reading' | 'interactive' | 'quiz';
    url?: string;
    text?: string;
    questions?: any[];
  }[];
}

interface TrainingProgress {
  totalModules: number;
  completedModules: number;
  totalHours: number;
  completedHours: number;
  certificatesEarned: number;
  currentStreak: number;
  averageScore: number;
  level: string;
  nextLevelProgress: number;
}

interface Quiz {
  id: string;
  moduleId: string;
  questions: {
    id: string;
    question: string;
    type: 'multiple-choice' | 'true-false' | 'scenario';
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
  }[];
}

const HelperTrainingView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'completed' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentQuizAnswers, setCurrentQuizAnswers] = useState<Record<string, any>>({});
  const [showModuleDetails, setShowModuleDetails] = useState(false);

  useEffect(() => {
    loadTrainingData();
    loadProgress();
  }, [user]);

  const loadTrainingData = async () => {
    try {
      setIsLoading(true);
      
      // Mock training modules
      const mockModules: TrainingModule[] = [
        {
          id: '1',
          title: 'Introduction to Peer Support',
          description: 'Learn the fundamentals of providing effective peer support in mental health contexts',
          duration: 45,
          difficulty: 'beginner',
          category: 'communication',
          isCompleted: true,
          isLocked: false,
          prerequisites: [],
          completionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          score: 92,
          certificateUrl: '/certificates/intro-peer-support.pdf',
          content: [
            {
              type: 'video',
              url: '/training/intro-video.mp4'
            },
            {
              type: 'reading',
              text: 'Peer support is a key component of recovery...'
            },
            {
              type: 'quiz'
            }
          ]
        },
        {
          id: '2',
          title: 'Active Listening Techniques',
          description: 'Master the art of active listening and empathetic communication',
          duration: 60,
          difficulty: 'beginner',
          category: 'communication',
          isCompleted: true,
          isLocked: false,
          prerequisites: ['1'],
          completionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          score: 88,
          content: [
            {
              type: 'interactive',
              url: '/training/listening-simulator'
            },
            {
              type: 'quiz'
            }
          ]
        },
        {
          id: '3',
          title: 'Crisis Intervention Basics',
          description: 'Learn to recognize and respond to mental health crises safely and effectively',
          duration: 90,
          difficulty: 'intermediate',
          category: 'crisis',
          isCompleted: false,
          isLocked: false,
          prerequisites: ['1', '2'],
          content: [
            {
              type: 'video',
              url: '/training/crisis-intervention.mp4'
            },
            {
              type: 'reading',
              text: 'Crisis intervention requires immediate assessment...'
            },
            {
              type: 'quiz'
            }
          ]
        },
        {
          id: '4',
          title: 'Ethical Boundaries in Peer Support',
          description: 'Understand professional boundaries and ethical considerations',
          duration: 75,
          difficulty: 'intermediate',
          category: 'ethics',
          isCompleted: false,
          isLocked: false,
          prerequisites: ['1'],
          content: [
            {
              type: 'reading',
              text: 'Maintaining appropriate boundaries is crucial...'
            },
            {
              type: 'quiz'
            }
          ]
        },
        {
          id: '5',
          title: 'Advanced De-escalation Techniques',
          description: 'Advanced strategies for managing difficult situations and emotions',
          duration: 120,
          difficulty: 'advanced',
          category: 'techniques',
          isCompleted: false,
          isLocked: true,
          prerequisites: ['3', '4'],
          content: [
            {
              type: 'video',
              url: '/training/de-escalation-advanced.mp4'
            },
            {
              type: 'interactive',
              url: '/training/de-escalation-simulator'
            },
            {
              type: 'quiz'
            }
          ]
        }
      ];

      setModules(mockModules);
      
    } catch (error) {
      console.error('Error loading training data:', error);
      showNotification('error', 'Failed to load training modules');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      // Mock progress data
      const mockProgress: TrainingProgress = {
        totalModules: 5,
        completedModules: 2,
        totalHours: 6.5,
        completedHours: 1.75,
        certificatesEarned: 2,
        currentStreak: 3,
        averageScore: 90,
        level: 'Novice Helper',
        nextLevelProgress: 0.4
      };
      
      setProgress(mockProgress);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const startModule = async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    if (module.isLocked) {
      showNotification('warning', 'Complete prerequisites to unlock this module');
      return;
    }

    setSelectedModule(module);
    setShowModuleDetails(true);
  };

  const startQuiz = async (moduleId: string) => {
    try {
      // Mock quiz data
      const mockQuiz: Quiz = {
        id: `quiz-${moduleId}`,
        moduleId,
        questions: [
          {
            id: '1',
            question: 'What is the primary goal of peer support?',
            type: 'multiple-choice',
            options: [
              'To provide professional therapy',
              'To share lived experience and offer hope',
              'To diagnose mental health conditions',
              'To replace professional treatment'
            ],
            correctAnswer: 1,
            explanation: 'Peer support focuses on sharing lived experience and offering hope for recovery.'
          },
          {
            id: '2',
            question: 'Active listening requires giving advice immediately.',
            type: 'true-false',
            correctAnswer: 0, // false
            explanation: 'Active listening focuses on understanding and reflecting, not immediately giving advice.'
          },
          {
            id: '3',
            question: 'A peer approaches you saying they feel suicidal. What should you do first?',
            type: 'scenario',
            options: [
              'Tell them everything will be fine',
              'Ask if they have a specific plan',
              'Change the subject to something positive',
              'Immediately end the conversation'
            ],
            correctAnswer: 1,
            explanation: 'Assessing the immediacy of risk by asking about specific plans is crucial in crisis situations.'
          }
        ]
      };

      setActiveQuiz(mockQuiz);
      setCurrentQuizAnswers({});
    } catch (error) {
      console.error('Error starting quiz:', error);
      showNotification('error', 'Failed to load quiz');
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;

    try {
      const totalQuestions = activeQuiz.questions.length;
      let correctAnswers = 0;

      activeQuiz.questions.forEach(question => {
        const userAnswer = currentQuizAnswers[question.id];
        if (userAnswer === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = score >= 70;

      if (passed) {
        // Mark module as completed
        setModules(prev => prev.map(module => {
          if (module.id === activeQuiz.moduleId) {
            return {
              ...module,
              isCompleted: true,
              completionDate: new Date(),
              score
            };
          }
          return module;
        }));

        // Unlock dependent modules
        const completedModule = modules.find(m => m.id === activeQuiz.moduleId);
        if (completedModule) {
          setModules(prev => prev.map(module => {
            const shouldUnlock = module.prerequisites.every(prereq => 
              prev.find(m => m.id === prereq)?.isCompleted || prereq === activeQuiz.moduleId
            );
            return {
              ...module,
              isLocked: !shouldUnlock
            };
          }));
        }

        showNotification('success', `Quiz completed! Score: ${score}%`);
      } else {
        showNotification('warning', `Score: ${score}%. You need 70% to pass. Try again!`);
      }

      setActiveQuiz(null);
      setCurrentQuizAnswers({});
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      showNotification('error', 'Failed to submit quiz');
    }
  };

  const downloadCertificate = async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module?.certificateUrl) {
      showNotification('success', 'Certificate downloaded!');
      // In real app, would trigger download
    }
  };

  const filteredModules = modules.filter(module => {
    if (filter === 'available' && (module.isLocked || module.isCompleted)) return false;
    if (filter === 'completed' && !module.isCompleted) return false;
    if (filter === 'locked' && !module.isLocked) return false;
    if (categoryFilter !== 'all' && module.category !== categoryFilter) return false;
    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-500';
      case 'intermediate':
        return 'text-yellow-500';
      case 'advanced':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication':
        return '💬';
      case 'crisis':
        return '🚨';
      case 'ethics':
        return '⚖️';
      case 'techniques':
        return '🛠️';
      case 'assessment':
        return '📋';
      default:
        return '📚';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading training modules...</p>
      </div>
    );
  }

  return (
    <div className="helper-training-view">
      <ViewHeader
        title="Helper Training"
        subtitle="Build your skills to provide effective peer support"
      />

      {progress && (
        <Card className="progress-overview">
          <div className="progress-stats">
            <div className="stat-item">
              <div className="stat-value">{progress.completedModules}/{progress.totalModules}</div>
              <div className="stat-label">Modules Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{progress.completedHours.toFixed(1)}h</div>
              <div className="stat-label">Hours Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{progress.certificatesEarned}</div>
              <div className="stat-label">Certificates</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{progress.averageScore}%</div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>
          
          <div className="level-progress">
            <div className="level-info">
              <span className="current-level">{progress.level}</span>
              <span className="progress-text">
                {Math.round(progress.nextLevelProgress * 100)}% to next level
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress.nextLevelProgress * 100}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      <Card className="filters-card">
        <div className="filters">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Modules</option>
            <option value="available">Available</option>
            <option value="completed">Completed</option>
            <option value="locked">Locked</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="communication">Communication</option>
            <option value="crisis">Crisis Intervention</option>
            <option value="ethics">Ethics</option>
            <option value="techniques">Techniques</option>
            <option value="assessment">Assessment</option>
          </select>
        </div>
      </Card>

      <div className="modules-grid">
        {filteredModules.map(module => (
          <Card key={module.id} className={`module-card ${module.isLocked ? 'locked' : ''} ${module.isCompleted ? 'completed' : ''}`}>
            <div className="module-header">
              <div className="module-category">
                {getCategoryIcon(module.category)} {module.category}
              </div>
              <div className="module-status">
                {module.isCompleted && <CheckIcon className="text-green-500" />}
                {module.isLocked && <LockIcon className="text-gray-400" />}
              </div>
            </div>

            <h3>{module.title}</h3>
            <p>{module.description}</p>

            <div className="module-meta">
              <span className="duration">
                <ClockIcon /> {module.duration} min
              </span>
              <span className={`difficulty ${getDifficultyColor(module.difficulty)}`}>
                {module.difficulty}
              </span>
            </div>

            {module.isCompleted && module.score && (
              <div className="completion-info">
                <span>Completed {module.completionDate?.toLocaleDateString()}</span>
                <span>Score: {module.score}%</span>
              </div>
            )}

            <div className="module-actions">
              {!module.isCompleted && !module.isLocked && (
                <AppButton
                  variant="primary"
                  onClick={() => startModule(module.id)}
                >
                  <PlayIcon /> Start Module
                </AppButton>
              )}

              {module.isCompleted && (
                <>
                  <AppButton
                    variant="secondary"
                    onClick={() => startModule(module.id)}
                  >
                    <BookIcon /> Review
                  </AppButton>
                  
                  {module.certificateUrl && (
                    <AppButton
                      variant="success"
                      size="small"
                      onClick={() => downloadCertificate(module.id)}
                    >
                      <CertificateIcon /> Certificate
                    </AppButton>
                  )}
                </>
              )}

              {module.isLocked && (
                <div className="prerequisites">
                  <small>Prerequisites: {module.prerequisites.join(', ')}</small>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Module Details Modal */}
      {showModuleDetails && selectedModule && (
        <div className="modal-overlay" onClick={() => setShowModuleDetails(false)}>
          <Card className="module-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedModule.title}</h2>
            <p>{selectedModule.description}</p>
            
            <div className="module-content">
              {selectedModule.content.map((item, index) => (
                <div key={index} className="content-item">
                  {item.type === 'video' && (
                    <div>
                      <h4>📹 Video Content</h4>
                      <p>Watch the training video to learn key concepts</p>
                    </div>
                  )}
                  {item.type === 'reading' && (
                    <div>
                      <h4>📚 Reading Material</h4>
                      <p>{item.text?.substring(0, 100)}...</p>
                    </div>
                  )}
                  {item.type === 'interactive' && (
                    <div>
                      <h4>🎮 Interactive Exercise</h4>
                      <p>Practice your skills with our interactive simulator</p>
                    </div>
                  )}
                  {item.type === 'quiz' && (
                    <div>
                      <h4>📝 Knowledge Check</h4>
                      <AppButton
                        variant="primary"
                        onClick={() => {
                          setShowModuleDetails(false);
                          startQuiz(selectedModule.id);
                        }}
                      >
                        Take Quiz
                      </AppButton>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <AppButton
              variant="secondary"
              onClick={() => setShowModuleDetails(false)}
            >
              Close
            </AppButton>
          </Card>
        </div>
      )}

      {/* Quiz Modal */}
      {activeQuiz && (
        <div className="modal-overlay">
          <Card className="quiz-modal">
            <h2>Quiz: Module {activeQuiz.moduleId}</h2>
            
            {activeQuiz.questions.map((question, index) => (
              <div key={question.id} className="quiz-question">
                <h4>Question {index + 1}: {question.question}</h4>
                
                {question.type === 'multiple-choice' && question.options && (
                  <div className="quiz-options">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex}>
                        <input
                          type="radio"
                          name={question.id}
                          value={optionIndex}
                          onChange={(e) => setCurrentQuizAnswers(prev => ({
                            ...prev,
                            [question.id]: parseInt(e.target.value)
                          }))}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'true-false' && (
                  <div className="quiz-options">
                    <label>
                      <input
                        type="radio"
                        name={question.id}
                        value="1"
                        onChange={() => setCurrentQuizAnswers(prev => ({
                          ...prev,
                          [question.id]: 1
                        }))}
                      />
                      True
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={question.id}
                        value="0"
                        onChange={() => setCurrentQuizAnswers(prev => ({
                          ...prev,
                          [question.id]: 0
                        }))}
                      />
                      False
                    </label>
                  </div>
                )}

                {question.type === 'scenario' && question.options && (
                  <div className="quiz-options">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex}>
                        <input
                          type="radio"
                          name={question.id}
                          value={optionIndex}
                          onChange={(e) => setCurrentQuizAnswers(prev => ({
                            ...prev,
                            [question.id]: parseInt(e.target.value)
                          }))}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="quiz-actions">
              <AppButton
                variant="secondary"
                onClick={() => {
                  setActiveQuiz(null);
                  setCurrentQuizAnswers({});
                }}
              >
                Cancel
              </AppButton>
              <AppButton
                variant="primary"
                onClick={submitQuiz}
                disabled={Object.keys(currentQuizAnswers).length !== activeQuiz.questions.length}
              >
                Submit Quiz
              </AppButton>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HelperTrainingView;
