/**
 * Curriculum Hook
 * Manages curriculum state, enrollment, progress tracking, and course interactions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  curriculumService,
  Course,
  UserProgress,
  LearningPath,
  Lesson,
  Module,
  Certificate,
  CourseCategory,
  AssessmentScore
} from '../services/curriculum/curriculumService';

interface CurriculumState {
  enrolledCourses: Course[];
  allCourses: Course[];
  userProgress: UserProgress[];
  learningPaths: LearningPath[];
  currentCourse: Course | null;
  currentModule: Module | null;
  currentLesson: Lesson | null;
  certificates: Certificate[];
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
}

interface CurriculumActions {
  enrollInCourse: (courseId: string) => Promise<void>;
  setCurrentCourse: (course: Course | null) => void;
  setCurrentModule: (module: Module | null) => void;
  setCurrentLesson: (lesson: Lesson | null) => void;
  completeLesson: (lessonId: string) => void;
  recordAssessment: (exerciseId: string, score: number, maxScore: number) => void;
  generateCertificate: (courseId: string) => Certificate | null;
  createLearningPath: (title: string, description: string, courseIds: string[]) => void;
  searchCourses: (query: string) => Course[];
  getCoursesByCategory: (category: CourseCategory) => Course[];
  addNote: (lessonId: string, content: string) => void;
  updateTimeSpent: (minutes: number) => void;
  refreshData: () => void;
}

export const useCurriculum = (userId: string): CurriculumState & CurriculumActions => {
  const [state, setState] = useState<CurriculumState>({
    enrolledCourses: [],
    allCourses: [],
    userProgress: [],
    learningPaths: [],
    currentCourse: null,
    currentModule: null,
    currentLesson: null,
    certificates: [],
    recommendations: [],
    isLoading: false,
    error: null
  });

  // Load initial data
  useEffect(() => {
    loadCurriculumData();
  }, [userId]);

  // Load curriculum data
  const loadCurriculumData = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load all courses
      const allCourses = curriculumService.getAllCourses();
      
      // Load user's enrolled courses
      const enrolledCourses = curriculumService.getUserCourses(userId);
      
      // Load user progress for all enrolled courses
      const userProgress = enrolledCourses
        .map(course => curriculumService.getUserProgress(userId, course.id))
        .filter((progress): progress is UserProgress => progress !== undefined);

      // Load certificates
      const certificates = userProgress
        .filter(p => p.certificateEarned)
        .map(p => p.certificateEarned!);

      // Get recommendations
      const recommendations = curriculumService.getRecommendations(userId);

      // Load learning paths
      const learningPaths: LearningPath[] = []; // Would be loaded from service

      setState({
        allCourses,
        enrolledCourses,
        userProgress,
        learningPaths,
        certificates,
        recommendations,
        currentCourse: null,
        currentModule: null,
        currentLesson: null,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load curriculum data'
      }));
    }
  }, [userId]);

  // Enroll in a course
  const enrollInCourse = useCallback(async (courseId: string) => {
    try {
      const progress = curriculumService.enrollInCourse(userId, courseId);
      const course = curriculumService.getCourse(courseId);
      
      if (course) {
        setState(prev => ({
          ...prev,
          enrolledCourses: [...prev.enrolledCourses, course],
          userProgress: [...prev.userProgress, progress]
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to enroll in course'
      }));
    }
  }, [userId]);

  // Set current course
  const setCurrentCourse = useCallback((course: Course | null) => {
    setState(prev => ({
      ...prev,
      currentCourse: course,
      currentModule: course?.modules[0] || null,
      currentLesson: course?.modules[0]?.lessons[0] || null
    }));
  }, []);

  // Set current module
  const setCurrentModule = useCallback((module: Module | null) => {
    setState(prev => ({
      ...prev,
      currentModule: module,
      currentLesson: module?.lessons[0] || null
    }));
  }, []);

  // Set current lesson
  const setCurrentLesson = useCallback((lesson: Lesson | null) => {
    setState(prev => ({ ...prev, currentLesson: lesson }));
  }, []);

  // Complete a lesson
  const completeLesson = useCallback((lessonId: string) => {
    if (!state.currentCourse) return;

    curriculumService.completeLession(userId, state.currentCourse.id, lessonId);
    
    // Update local state
    const updatedProgress = curriculumService.getUserProgress(userId, state.currentCourse.id);
    if (updatedProgress) {
      setState(prev => ({
        ...prev,
        userProgress: prev.userProgress.map(p =>
          p.courseId === state.currentCourse?.id ? updatedProgress : p
        )
      }));
    }

    // Check if course is complete and generate certificate
    if (updatedProgress?.progressPercentage === 100 && !updatedProgress.certificateEarned) {
      const certificate = curriculumService.generateCertificate(userId, state.currentCourse.id);
      if (certificate) {
        setState(prev => ({
          ...prev,
          certificates: [...prev.certificates, certificate]
        }));
      }
    }
  }, [userId, state.currentCourse]);

  // Record assessment score
  const recordAssessment = useCallback((exerciseId: string, score: number, maxScore: number) => {
    if (!state.currentCourse) return;

    curriculumService.recordAssessmentScore(
      userId,
      state.currentCourse.id,
      exerciseId,
      score,
      maxScore
    );

    // Update local state
    const updatedProgress = curriculumService.getUserProgress(userId, state.currentCourse.id);
    if (updatedProgress) {
      setState(prev => ({
        ...prev,
        userProgress: prev.userProgress.map(p =>
          p.courseId === state.currentCourse?.id ? updatedProgress : p
        )
      }));
    }
  }, [userId, state.currentCourse]);

  // Generate certificate
  const generateCertificate = useCallback((courseId: string): Certificate | null => {
    const certificate = curriculumService.generateCertificate(userId, courseId);
    
    if (certificate) {
      setState(prev => ({
        ...prev,
        certificates: [...prev.certificates, certificate]
      }));
    }

    return certificate;
  }, [userId]);

  // Create learning path
  const createLearningPath = useCallback((
    title: string,
    description: string,
    courseIds: string[]
  ) => {
    const learningPath = curriculumService.createLearningPath(
      userId,
      title,
      description,
      courseIds
    );

    setState(prev => ({
      ...prev,
      learningPaths: [...prev.learningPaths, learningPath]
    }));
  }, [userId]);

  // Search courses
  const searchCourses = useCallback((query: string): Course[] => {
    return curriculumService.searchCourses(query);
  }, []);

  // Get courses by category
  const getCoursesByCategory = useCallback((category: CourseCategory): Course[] => {
    return curriculumService.getCoursesByCategory(category);
  }, []);

  // Add note to current lesson
  const addNote = useCallback((lessonId: string, content: string) => {
    if (!state.currentCourse) return;

    curriculumService.addNote(userId, state.currentCourse.id, lessonId, content);
  }, [userId, state.currentCourse]);

  // Update time spent
  const updateTimeSpent = useCallback((minutes: number) => {
    if (!state.currentCourse) return;

    curriculumService.updateTimeSpent(userId, state.currentCourse.id, minutes);

    // Update local state
    const updatedProgress = curriculumService.getUserProgress(userId, state.currentCourse.id);
    if (updatedProgress) {
      setState(prev => ({
        ...prev,
        userProgress: prev.userProgress.map(p =>
          p.courseId === state.currentCourse?.id ? updatedProgress : p
        )
      }));
    }
  }, [userId, state.currentCourse]);

  // Refresh data
  const refreshData = useCallback(() => {
    loadCurriculumData();
  }, [loadCurriculumData]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalCourses = state.enrolledCourses.length;
    const completedCourses = state.userProgress.filter(p => p.progressPercentage === 100).length;
    const totalTimeSpent = state.userProgress.reduce((sum, p) => sum + p.totalTimeSpent, 0);
    const averageProgress = totalCourses > 0
      ? state.userProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / totalCourses
      : 0;
    const totalCertificates = state.certificates.length;
    const currentStreak = Math.max(...state.userProgress.map(p => p.streakDays), 0);

    return {
      totalCourses,
      completedCourses,
      totalTimeSpent,
      averageProgress,
      totalCertificates,
      currentStreak
    };
  }, [state.enrolledCourses, state.userProgress, state.certificates]);

  return {
    ...state,
    statistics,
    enrollInCourse,
    setCurrentCourse,
    setCurrentModule,
    setCurrentLesson,
    completeLesson,
    recordAssessment,
    generateCertificate,
    createLearningPath,
    searchCourses,
    getCoursesByCategory,
    addNote,
    updateTimeSpent,
    refreshData
  };
};

// Helper hook for managing quiz/exercise state
export const useExercise = (exercise: any) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const handleAnswer = useCallback((questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const submitExercise = useCallback(() => {
    if (!exercise.questions) return;

    let totalScore = 0;
    let maxScore = 0;
    const newFeedback: Record<string, string> = {};

    exercise.questions.forEach((question: any) => {
      maxScore += question.points;
      
      if (answers[question.id] === question.correctAnswer) {
        totalScore += question.points;
        newFeedback[question.id] = 'Correct!';
      } else {
        newFeedback[question.id] = question.explanation || 'Incorrect. Try again!';
      }
    });

    setScore(totalScore);
    setFeedback(newFeedback);
    setShowResults(true);
    setAttempts(prev => prev + 1);

    return { score: totalScore, maxScore, passed: (totalScore / maxScore) >= 0.7 };
  }, [exercise, answers]);

  const resetExercise = useCallback(() => {
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setFeedback({});
  }, []);

  return {
    answers,
    showResults,
    score,
    attempts,
    feedback,
    handleAnswer,
    submitExercise,
    resetExercise
  };
};

// Helper hook for tracking lesson progress
export const useLessonProgress = (lessonId: string, userId: string, courseId: string) => {
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    // Check if lesson is already complete
    const progress = curriculumService.getUserProgress(userId, courseId);
    if (progress?.completedLessons.includes(lessonId)) {
      setIsComplete(true);
    }
  }, [lessonId, userId, courseId]);

  const markComplete = useCallback(() => {
    curriculumService.completeLession(userId, courseId, lessonId);
    setIsComplete(true);
  }, [userId, courseId, lessonId]);

  const addNote = useCallback((content: string) => {
    curriculumService.addNote(userId, courseId, lessonId, content);
    setNotes(prev => [...prev, content]);
  }, [userId, courseId, lessonId]);

  useEffect(() => {
    // Track time spent when component unmounts
    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 60000);
      if (timeSpent > 0) {
        curriculumService.updateTimeSpent(userId, courseId, timeSpent);
      }
    };
  }, [startTime, userId, courseId]);

  return {
    isComplete,
    notes,
    markComplete,
    addNote
  };
};