/**
 * Comprehensive Wellness Curriculum Service
 * Manages courses, modules, progress tracking, and certificate generation
 */

import { v4 as uuidv4 } from 'uuid';

// Types and Interfaces
export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  modules: Module[];
  thumbnail?: string;
  instructor?: string;
  rating?: number;
  enrollmentCount?: number;
  tags: string[];
  prerequisites?: string[];
  learningObjectives: string[];
  certificateAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
  estimatedTime: number; // in minutes
  requiredForCompletion: boolean;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: LessonType;
  content: LessonContent;
  duration: number; // in minutes
  orderIndex: number;
  resources?: Resource[];
  exercises?: Exercise[];
  requiredForCompletion: boolean;
}

export type LessonType = 'video' | 'text' | 'interactive' | 'audio' | 'mixed';

export interface LessonContent {
  type: LessonType;
  videoUrl?: string;
  textContent?: string;
  audioUrl?: string;
  interactiveElements?: InteractiveElement[];
  markdown?: string;
}

export interface InteractiveElement {
  id: string;
  type: 'quiz' | 'exercise' | 'reflection' | 'breathing' | 'meditation';
  data: any;
}

export interface Exercise {
  id: string;
  type: 'quiz' | 'practice' | 'reflection' | 'journal';
  title: string;
  instructions: string;
  questions?: Question[];
  passingScore?: number;
  allowRetry: boolean;
  maxAttempts?: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'open-ended' | 'scale';
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  points: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'download' | 'worksheet';
  url: string;
  description?: string;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  enrollmentDate: Date;
  lastAccessDate: Date;
  completedModules: string[];
  completedLessons: string[];
  currentModule?: string;
  currentLesson?: string;
  progressPercentage: number;
  assessmentScores: AssessmentScore[];
  certificateEarned?: Certificate;
  totalTimeSpent: number; // in minutes
  streakDays: number;
  notes: Note[];
}

export interface AssessmentScore {
  exerciseId: string;
  score: number;
  maxScore: number;
  attempts: number;
  completedAt: Date;
  passed: boolean;
}

export interface Certificate {
  id: string;
  courseId: string;
  userId: string;
  courseName: string;
  userName: string;
  issueDate: Date;
  certificateUrl?: string;
  verificationCode: string;
  completionTime: number; // total hours
}

export interface Note {
  id: string;
  lessonId: string;
  content: string;
  timestamp: Date;
}

export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description: string;
  courses: string[]; // course IDs in order
  targetCompletion?: Date;
  personalizedRecommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum CourseCategory {
  CBT_BASICS = 'CBT Basics',
  MINDFULNESS = 'Mindfulness',
  STRESS_MANAGEMENT = 'Stress Management',
  SLEEP_HYGIENE = 'Sleep Hygiene',
  EMOTIONAL_REGULATION = 'Emotional Regulation',
  ANXIETY_MANAGEMENT = 'Anxiety Management',
  DEPRESSION_SUPPORT = 'Depression Support',
  SELF_COMPASSION = 'Self Compassion',
  RELATIONSHIPS = 'Healthy Relationships',
  TRAUMA_INFORMED = 'Trauma-Informed Care'
}

class CurriculumService {
  private courses: Map<string, Course> = new Map();
  private userProgress: Map<string, UserProgress[]> = new Map();
  private learningPaths: Map<string, LearningPath[]> = new Map();

  constructor() {
    this.initializeDefaultCourses();
    this.loadFromLocalStorage();
  }

  /**
   * Initialize evidence-based mental health courses
   */
  private initializeDefaultCourses(): void {
    const defaultCourses: Course[] = [
      {
        id: 'cbt-101',
        title: 'CBT Basics: Understanding Your Thoughts',
        description: 'Learn the fundamentals of Cognitive Behavioral Therapy and how thoughts, feelings, and behaviors are connected.',
        category: CourseCategory.CBT_BASICS,
        difficulty: 'beginner',
        duration: 180,
        tags: ['cbt', 'thoughts', 'cognitive', 'beginner-friendly'],
        learningObjectives: [
          'Understand the CBT triangle',
          'Identify thought patterns',
          'Challenge negative thoughts',
          'Develop coping strategies'
        ],
        certificateAvailable: true,
        modules: [
          {
            id: 'cbt-m1',
            courseId: 'cbt-101',
            title: 'Introduction to CBT',
            description: 'Understanding the basics of Cognitive Behavioral Therapy',
            orderIndex: 0,
            estimatedTime: 45,
            requiredForCompletion: true,
            lessons: [
              {
                id: 'cbt-l1',
                moduleId: 'cbt-m1',
                title: 'What is CBT?',
                type: 'video',
                duration: 15,
                orderIndex: 0,
                requiredForCompletion: true,
                content: {
                  type: 'video',
                  videoUrl: '/videos/cbt-intro.mp4',
                  textContent: 'Cognitive Behavioral Therapy (CBT) is a structured, goal-oriented psychotherapy...'
                },
                exercises: [
                  {
                    id: 'cbt-e1',
                    type: 'quiz',
                    title: 'CBT Basics Quiz',
                    instructions: 'Test your understanding of CBT fundamentals',
                    allowRetry: true,
                    maxAttempts: 3,
                    passingScore: 70,
                    questions: [
                      {
                        id: 'q1',
                        text: 'What does CBT stand for?',
                        type: 'multiple-choice',
                        options: [
                          'Cognitive Behavioral Therapy',
                          'Complete Brain Training',
                          'Conscious Breathing Technique',
                          'Clinical Behavior Treatment'
                        ],
                        correctAnswer: 'Cognitive Behavioral Therapy',
                        points: 10
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mindfulness-101',
        title: 'Mindfulness for Daily Life',
        description: 'Develop mindfulness skills to reduce stress and increase present-moment awareness.',
        category: CourseCategory.MINDFULNESS,
        difficulty: 'beginner',
        duration: 240,
        tags: ['mindfulness', 'meditation', 'stress-reduction', 'awareness'],
        learningObjectives: [
          'Practice basic mindfulness meditation',
          'Develop body awareness',
          'Apply mindfulness to daily activities',
          'Manage stress through mindful breathing'
        ],
        certificateAvailable: true,
        modules: [
          {
            id: 'mind-m1',
            courseId: 'mindfulness-101',
            title: 'Foundation of Mindfulness',
            description: 'Learn the core principles of mindfulness practice',
            orderIndex: 0,
            estimatedTime: 60,
            requiredForCompletion: true,
            lessons: [
              {
                id: 'mind-l1',
                moduleId: 'mind-m1',
                title: 'Introduction to Mindfulness',
                type: 'mixed',
                duration: 20,
                orderIndex: 0,
                requiredForCompletion: true,
                content: {
                  type: 'mixed',
                  textContent: 'Mindfulness is the practice of purposeful awareness...',
                  interactiveElements: [
                    {
                      id: 'breath-ex-1',
                      type: 'breathing',
                      data: {
                        duration: 5,
                        pattern: '4-7-8',
                        instructions: 'Follow the breathing pattern: Inhale for 4, hold for 7, exhale for 8'
                      }
                    }
                  ]
                }
              }
            ]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'stress-mgmt-101',
        title: 'Stress Management Essentials',
        description: 'Learn evidence-based techniques to identify, understand, and manage stress effectively.',
        category: CourseCategory.STRESS_MANAGEMENT,
        difficulty: 'beginner',
        duration: 150,
        tags: ['stress', 'coping', 'relaxation', 'resilience'],
        learningObjectives: [
          'Identify personal stress triggers',
          'Learn progressive muscle relaxation',
          'Develop a stress management toolkit',
          'Create a personal stress reduction plan'
        ],
        certificateAvailable: true,
        modules: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'sleep-hygiene-101',
        title: 'Better Sleep, Better Mind',
        description: 'Improve your sleep quality with evidence-based sleep hygiene practices.',
        category: CourseCategory.SLEEP_HYGIENE,
        difficulty: 'beginner',
        duration: 120,
        tags: ['sleep', 'rest', 'recovery', 'habits'],
        learningObjectives: [
          'Understand sleep cycles and stages',
          'Identify sleep disruptors',
          'Create a bedtime routine',
          'Optimize your sleep environment'
        ],
        certificateAvailable: true,
        modules: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'emotion-reg-101',
        title: 'Mastering Emotional Regulation',
        description: 'Develop skills to understand, accept, and regulate your emotions effectively.',
        category: CourseCategory.EMOTIONAL_REGULATION,
        difficulty: 'intermediate',
        duration: 200,
        tags: ['emotions', 'regulation', 'DBT', 'coping'],
        learningObjectives: [
          'Identify and name emotions',
          'Understand emotion triggers',
          'Learn TIPP technique for crisis',
          'Practice opposite action skill'
        ],
        certificateAvailable: true,
        modules: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultCourses.forEach(course => {
      this.courses.set(course.id, course);
    });
  }

  /**
   * Get all available courses
   */
  getAllCourses(): Course[] {
    return Array.from(this.courses.values());
  }

  /**
   * Get courses by category
   */
  getCoursesByCategory(category: CourseCategory): Course[] {
    return this.getAllCourses().filter(course => course.category === category);
  }

  /**
   * Get a specific course by ID
   */
  getCourse(courseId: string): Course | undefined {
    return this.courses.get(courseId);
  }

  /**
   * Enroll user in a course
   */
  enrollInCourse(userId: string, courseId: string): UserProgress {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    const progress: UserProgress = {
      userId,
      courseId,
      enrollmentDate: new Date(),
      lastAccessDate: new Date(),
      completedModules: [],
      completedLessons: [],
      progressPercentage: 0,
      assessmentScores: [],
      totalTimeSpent: 0,
      streakDays: 1,
      notes: []
    };

    const userProgressList = this.userProgress.get(userId) || [];
    userProgressList.push(progress);
    this.userProgress.set(userId, userProgressList);
    this.saveToLocalStorage();

    return progress;
  }

  /**
   * Get user's enrolled courses
   */
  getUserCourses(userId: string): Course[] {
    const progressList = this.userProgress.get(userId) || [];
    return progressList
      .map(progress => this.courses.get(progress.courseId))
      .filter((course): course is Course => course !== undefined);
  }

  /**
   * Get user progress for a course
   */
  getUserProgress(userId: string, courseId: string): UserProgress | undefined {
    const progressList = this.userProgress.get(userId) || [];
    return progressList.find(p => p.courseId === courseId);
  }

  /**
   * Update lesson completion
   */
  completeLession(userId: string, courseId: string, lessonId: string): void {
    const progress = this.getUserProgress(userId, courseId);
    if (!progress) return;

    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      progress.lastAccessDate = new Date();
      this.updateProgressPercentage(progress);
      this.saveToLocalStorage();
    }
  }

  /**
   * Record assessment score
   */
  recordAssessmentScore(
    userId: string,
    courseId: string,
    exerciseId: string,
    score: number,
    maxScore: number
  ): void {
    const progress = this.getUserProgress(userId, courseId);
    if (!progress) return;

    const assessmentScore: AssessmentScore = {
      exerciseId,
      score,
      maxScore,
      attempts: 1,
      completedAt: new Date(),
      passed: (score / maxScore) >= 0.7
    };

    const existingScore = progress.assessmentScores.find(s => s.exerciseId === exerciseId);
    if (existingScore) {
      existingScore.attempts++;
      if (score > existingScore.score) {
        existingScore.score = score;
        existingScore.passed = assessmentScore.passed;
        existingScore.completedAt = new Date();
      }
    } else {
      progress.assessmentScores.push(assessmentScore);
    }

    this.saveToLocalStorage();
  }

  /**
   * Generate certificate for course completion
   */
  generateCertificate(userId: string, courseId: string): Certificate | null {
    const progress = this.getUserProgress(userId, courseId);
    const course = this.getCourse(courseId);
    
    if (!progress || !course || progress.progressPercentage < 100) {
      return null;
    }

    const certificate: Certificate = {
      id: uuidv4(),
      courseId,
      userId,
      courseName: course.title,
      userName: `User_${userId}`, // In production, get from user service
      issueDate: new Date(),
      verificationCode: this.generateVerificationCode(),
      completionTime: progress.totalTimeSpent / 60 // Convert to hours
    };

    progress.certificateEarned = certificate;
    this.saveToLocalStorage();

    // Generate certificate PDF URL (mock implementation)
    certificate.certificateUrl = this.generateCertificateUrl(certificate);

    return certificate;
  }

  /**
   * Create personalized learning path
   */
  createLearningPath(
    userId: string,
    title: string,
    description: string,
    courseIds: string[]
  ): LearningPath {
    const learningPath: LearningPath = {
      id: uuidv4(),
      userId,
      title,
      description,
      courses: courseIds,
      personalizedRecommendations: this.getRecommendations(userId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const userPaths = this.learningPaths.get(userId) || [];
    userPaths.push(learningPath);
    this.learningPaths.set(userId, userPaths);
    this.saveToLocalStorage();

    return learningPath;
  }

  /**
   * Get personalized course recommendations
   */
  getRecommendations(userId: string): string[] {
    const completedCourses = this.getUserCourses(userId)
      .filter(course => {
        const progress = this.getUserProgress(userId, course.id);
        return progress && progress.progressPercentage === 100;
      })
      .map(course => course.id);

    // Simple recommendation logic - suggest related courses
    const recommendations: string[] = [];
    
    if (completedCourses.includes('cbt-101')) {
      recommendations.push('emotion-reg-101');
    }
    if (completedCourses.includes('mindfulness-101')) {
      recommendations.push('stress-mgmt-101');
    }
    if (!completedCourses.includes('sleep-hygiene-101')) {
      recommendations.push('sleep-hygiene-101');
    }

    return recommendations;
  }

  /**
   * Search courses
   */
  searchCourses(query: string): Course[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllCourses().filter(course =>
      course.title.toLowerCase().includes(lowercaseQuery) ||
      course.description.toLowerCase().includes(lowercaseQuery) ||
      course.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Add note to lesson
   */
  addNote(userId: string, courseId: string, lessonId: string, content: string): void {
    const progress = this.getUserProgress(userId, courseId);
    if (!progress) return;

    const note: Note = {
      id: uuidv4(),
      lessonId,
      content,
      timestamp: new Date()
    };

    progress.notes.push(note);
    this.saveToLocalStorage();
  }

  /**
   * Update time spent
   */
  updateTimeSpent(userId: string, courseId: string, minutes: number): void {
    const progress = this.getUserProgress(userId, courseId);
    if (!progress) return;

    progress.totalTimeSpent += minutes;
    progress.lastAccessDate = new Date();
    this.saveToLocalStorage();
  }

  /**
   * Private helper methods
   */
  private updateProgressPercentage(progress: UserProgress): void {
    const course = this.courses.get(progress.courseId);
    if (!course) return;

    const totalLessons = course.modules.reduce(
      (sum, module) => sum + module.lessons.filter(l => l.requiredForCompletion).length,
      0
    );

    if (totalLessons > 0) {
      progress.progressPercentage = Math.round(
        (progress.completedLessons.length / totalLessons) * 100
      );
    }
  }

  private generateVerificationCode(): string {
    return `AC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }

  private generateCertificateUrl(certificate: Certificate): string {
    // In production, this would generate an actual PDF
    return `/certificates/${certificate.id}.pdf`;
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('curriculum_courses', JSON.stringify(Array.from(this.courses.entries())));
      localStorage.setItem('curriculum_progress', JSON.stringify(Array.from(this.userProgress.entries())));
      localStorage.setItem('curriculum_paths', JSON.stringify(Array.from(this.learningPaths.entries())));
    } catch (error) {
      console.error('Failed to save curriculum data:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const coursesData = localStorage.getItem('curriculum_courses');
      if (coursesData) {
        const entries = JSON.parse(coursesData);
        this.courses = new Map(entries);
      }

      const progressData = localStorage.getItem('curriculum_progress');
      if (progressData) {
        const entries = JSON.parse(progressData);
        this.userProgress = new Map(entries);
      }

      const pathsData = localStorage.getItem('curriculum_paths');
      if (pathsData) {
        const entries = JSON.parse(pathsData);
        this.learningPaths = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load curriculum data:', error);
    }
  }
}

// Export singleton instance
export const curriculumService = new CurriculumService();