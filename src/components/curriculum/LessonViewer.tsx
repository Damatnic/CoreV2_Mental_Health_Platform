/**
 * Lesson Viewer Component
 * Displays lesson content including videos, text, interactive exercises, and assessments
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  CheckCircle,
  Clock,
  BookOpen,
  FileText,
  Download,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Award,
  Brain,
  Heart,
  Wind,
  Target,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Course, Lesson, Exercise, Question, InteractiveElement } from '../../services/curriculum/curriculumService';
import { curriculumService } from '../../services/curriculum/curriculumService';

interface LessonViewerProps {
  course: Course;
  lesson: Lesson;
  userId: string;
  onBack: () => void;
  onComplete: () => void;
}

const LessonViewer: React.FC<LessonViewerProps> = ({
  course,
  lesson,
  userId,
  onBack,
  onComplete
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [showResults, setShowResults] = useState(false);
  const [exerciseScore, setExerciseScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const startTimeRef = useRef<Date>(new Date());

  useEffect(() => {
    // Track time spent on lesson
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 60000); // Update every minute

    return () => {
      clearInterval(interval);
      // Save time spent when leaving
      const minutesSpent = Math.round((Date.now() - startTimeRef.current.getTime()) / 60000);
      curriculumService.updateTimeSpent(userId, course.id, minutesSpent);
    };
  }, [userId, course.id]);

  // Handle video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoProgress = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  // Handle interactive elements
  const renderInteractiveElement = (element: InteractiveElement) => {
    switch (element.type) {
      case 'breathing':
        return <BreathingExercise data={element.data} />;
      case 'meditation':
        return <MeditationGuide data={element.data} />;
      case 'reflection':
        return <ReflectionPrompt data={element.data} />;
      default:
        return null;
    }
  };

  // Handle exercises and quizzes
  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitExercise = () => {
    if (!currentExercise || !currentExercise.questions) return;

    let score = 0;
    let maxScore = 0;

    currentExercise.questions.forEach(question => {
      maxScore += question.points;
      if (answers[question.id] === question.correctAnswer) {
        score += question.points;
      }
    });

    setExerciseScore(score);
    setShowResults(true);

    // Record assessment score
    curriculumService.recordAssessmentScore(
      userId,
      course.id,
      currentExercise.id,
      score,
      maxScore
    );

    // Check if passed
    if (currentExercise.passingScore && (score / maxScore) * 100 >= currentExercise.passingScore) {
      // Passed the exercise
      setTimeout(() => {
        setCurrentExercise(null);
        setShowResults(false);
      }, 3000);
    }
  };

  // Handle lesson completion
  const markAsComplete = () => {
    curriculumService.completeLession(userId, course.id, lesson.id);
    setIsCompleted(true);
    
    // Generate certificate if course is complete
    const updatedProgress = curriculumService.getUserProgress(userId, course.id);
    if (updatedProgress && updatedProgress.progressPercentage === 100) {
      const certificate = curriculumService.generateCertificate(userId, course.id);
      if (certificate) {
        // Show certificate notification
        console.log('Certificate earned!', certificate);
      }
    }

    onComplete();
  };

  // Save notes
  const saveNotes = () => {
    if (notes.trim()) {
      curriculumService.addNote(userId, course.id, lesson.id, notes);
      setShowNotes(false);
    }
  };

  // Render video content
  const renderVideoContent = () => (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={lesson.content.videoUrl}
        className="w-full h-auto"
        onTimeUpdate={handleVideoProgress}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlay}
            className="text-white hover:text-indigo-400 transition-colors"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          
          <div className="flex-1 bg-white/20 rounded-full h-2">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <button
            onClick={toggleMute}
            className="text-white hover:text-indigo-400 transition-colors"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );

  // Render text content
  const renderTextContent = () => (
    <div className="prose prose-lg max-w-none">
      {lesson.content.markdown ? (
        <ReactMarkdown>{lesson.content.markdown}</ReactMarkdown>
      ) : (
        <p className="text-gray-700 leading-relaxed">{lesson.content.textContent}</p>
      )}
    </div>
  );

  // Render exercise
  const renderExercise = (exercise: Exercise) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h3 className="text-xl font-semibold mb-4">{exercise.title}</h3>
      <p className="text-gray-600 mb-6">{exercise.instructions}</p>

      {!showResults ? (
        <>
          {exercise.questions?.map((question, index) => (
            <div key={question.id} className="mb-6">
              <p className="font-medium mb-3">
                {index + 1}. {question.text}
              </p>
              
              {question.type === 'multiple-choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map(option => (
                    <label
                      key={option}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'true-false' && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleAnswerChange(question.id, 'true')}
                    className={`px-6 py-2 rounded-lg ${
                      answers[question.id] === 'true'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => handleAnswerChange(question.id, 'false')}
                    className={`px-6 py-2 rounded-lg ${
                      answers[question.id] === 'false'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    False
                  </button>
                </div>
              )}

              {question.type === 'open-ended' && (
                <textarea
                  placeholder="Type your answer here..."
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                />
              )}
            </div>
          ))}

          <button
            onClick={submitExercise}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Submit Answers
          </button>
        </>
      ) : (
        <div className="text-center">
          <div className="mb-6">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {exerciseScore} / {exercise.questions?.reduce((sum, q) => sum + q.points, 0) || 0}
            </div>
            <p className="text-gray-600">
              {exercise.passingScore && 
                (exerciseScore / (exercise.questions?.reduce((sum, q) => sum + q.points, 0) || 1)) * 100 >= exercise.passingScore
                ? 'Great job! You passed!' 
                : 'Keep practicing!'}
            </p>
          </div>

          {exercise.allowRetry && (
            <button
              onClick={() => {
                setShowResults(false);
                setAnswers({});
              }}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <p className="text-sm text-gray-500">{course.title}</p>
                <h1 className="text-xl font-semibold text-gray-900">{lesson.title}</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-2" />
                <span className="text-sm">{lesson.duration} min</span>
              </div>

              {isCompleted && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-2">
            {lesson.content.type === 'video' && renderVideoContent()}
            {lesson.content.type === 'text' && renderTextContent()}
            {lesson.content.type === 'mixed' && (
              <>
                {lesson.content.videoUrl && renderVideoContent()}
                <div className="mt-6">
                  {renderTextContent()}
                </div>
              </>
            )}

            {/* Interactive Elements */}
            {lesson.content.interactiveElements && (
              <div className="mt-8 space-y-6">
                {lesson.content.interactiveElements.map(element => (
                  <div key={element.id}>
                    {renderInteractiveElement(element)}
                  </div>
                ))}
              </div>
            )}

            {/* Exercises */}
            {lesson.exercises && lesson.exercises.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-6">Practice Exercises</h2>
                {currentExercise ? (
                  renderExercise(currentExercise)
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lesson.exercises.map(exercise => (
                      <button
                        key={exercise.id}
                        onClick={() => setCurrentExercise(exercise)}
                        className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
                      >
                        <h3 className="font-semibold mb-2">{exercise.title}</h3>
                        <p className="text-sm text-gray-600">{exercise.type}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Complete Lesson Button */}
            {!isCompleted && (
              <div className="mt-8">
                <button
                  onClick={markAsComplete}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mark as Complete
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resources */}
            {lesson.resources && lesson.resources.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                  Resources
                </h3>
                <div className="space-y-3">
                  {lesson.resources.map(resource => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 text-gray-700 hover:text-indigo-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">{resource.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
                My Notes
              </h3>
              {showNotes ? (
                <>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your notes here..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={6}
                  />
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={saveNotes}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowNotes(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowNotes(true)}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add Note
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Interactive Components

const BreathingExercise: React.FC<{ data: any }> = ({ data }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const pattern = data.pattern.split('-').map(Number);
    let currentPhase = 0;
    const phases = ['inhale', 'hold', 'exhale'];
    
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev >= pattern[currentPhase] - 1) {
          currentPhase = (currentPhase + 1) % 3;
          setPhase(phases[currentPhase] as any);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, data.pattern]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 text-center">
      <Wind className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
      <h3 className="text-xl font-semibold mb-2">Breathing Exercise</h3>
      <p className="text-gray-600 mb-6">{data.instructions}</p>
      
      {isActive && (
        <div className="mb-6">
          <div className="text-3xl font-bold text-indigo-600 capitalize mb-2">
            {phase}
          </div>
          <div className="text-5xl font-bold text-gray-800">
            {count + 1}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsActive(!isActive)}
        className={`px-8 py-3 rounded-lg font-medium transition-colors ${
          isActive
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isActive ? 'Stop' : 'Start'} Exercise
      </button>
    </div>
  );
};

const MeditationGuide: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-8 text-center">
      <Brain className="w-12 h-12 mx-auto mb-4 text-purple-600" />
      <h3 className="text-xl font-semibold mb-2">Guided Meditation</h3>
      <p className="text-gray-600 mb-6">{data.instructions}</p>
      <audio controls className="w-full">
        <source src={data.audioUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

const ReflectionPrompt: React.FC<{ data: any }> = ({ data }) => {
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);

  const saveReflection = () => {
    // Save reflection logic here
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-teal-100 rounded-xl p-8">
      <Heart className="w-12 h-12 mx-auto mb-4 text-green-600" />
      <h3 className="text-xl font-semibold mb-2">Reflection Exercise</h3>
      <p className="text-gray-600 mb-6">{data.prompt}</p>
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="Share your thoughts..."
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        rows={4}
      />
      <button
        onClick={saveReflection}
        className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
      >
        {saved ? 'Saved!' : 'Save Reflection'}
      </button>
    </div>
  );
};

export default LessonViewer;