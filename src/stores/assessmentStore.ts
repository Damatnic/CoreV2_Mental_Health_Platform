/**
 * Assessment Store
 *
 * Zustand store for managing mental health assessments including PHQ-9, GAD-7,
 * cultural assessments, and assessment history for the mental health platform.
 * 
 * @fileoverview Assessment state management with cultural adaptation support
 * @version 2.0.0
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { Assessment } from '../types';
// import { authState } from '../contexts/AuthContext';
import { culturalAssessmentService } from '../services/culturalAssessmentService';

/**
 * Assessment types supported by the platform
 */
export type AssessmentType = 'phq-9' | 'gad-7' | 'cultural' | 'custom';

/**
 * Assessment result interface
 */
export interface AssessmentResult {
  id: string;
  type: AssessmentType;
  score: number;
  answers: (number | string)[];
  completedAt: string;
  interpretation: string;
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately-severe' | 'severe';
  recommendations: string[];
  cultural?: {
    languageCode: string;
    culturalContext: string;
    adaptedQuestions?: string[];
    culturalFactors?: string[];
  };
  metadata?: {
    sessionDuration?: number;
    deviceInfo?: string;
    location?: string;
    timeOfDay?: string;
  };
}

/**
 * Assessment progress tracking
 */
export interface AssessmentProgress {
  assessmentId: string;
  type: AssessmentType;
  currentQuestion: number;
  totalQuestions: number;
  answers: (number | string)[];
  startedAt: string;
  estimatedTimeRemaining: number;
  culturalContext?: string;
  languageCode?: string;
}

/**
 * Assessment state interface
 */
export interface AssessmentState {
  // Core state
  history: Assessment[];
  results: AssessmentResult[];
  currentProgress: AssessmentProgress | null;
  
  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  isFetchingHistory: boolean;
  
  // Error states
  error: string | null;
  submissionError: string | null;
  
  // UI state
  showResults: boolean;
  selectedAssessment: AssessmentResult | null;
  
  // Cultural assessment state
  supportedLanguages: string[];
  culturalContexts: Record<string, string[]>;
  
  // Statistics
  completionStats: {
    totalCompleted: number;
    averageScore: Record<AssessmentType, number>;
    improvementTrend: 'improving' | 'stable' | 'declining' | 'insufficient-data';
    lastCompletedDate: string | null;
  };
}

/**
 * Assessment actions interface
 */
export interface AssessmentActions {
  // Assessment management
  startAssessment: (type: AssessmentType, options?: { culturalContext?: string; languageCode?: string }) => void;
  answerQuestion: (questionIndex: number, answer: number | string) => void;
  previousQuestion: () => void;
  submitAssessment: () => Promise<void>;
  cancelAssessment: () => void;
  
  // History and results
  fetchHistory: () => Promise<void>;
  getAssessmentById: (id: string) => AssessmentResult | null;
  deleteAssessment: (id: string) => Promise<void>;
  exportResults: (format: 'json' | 'csv' | 'pdf') => Promise<string>;
  
  // Specialized assessment submissions
  submitPhq9Result: (score: number, answers: number[], cultural?: boolean, culturalContext?: string) => Promise<void>;
  submitGad7Result: (score: number, answers: number[], cultural?: boolean, culturalContext?: string) => Promise<void>;
  submitCulturalAssessment: (
    type: 'phq-9' | 'gad-7',
    scores: number[],
    answers: string[],
    languageCode: string,
    culturalContext?: string,
    sessionDuration?: number
  ) => Promise<void>;
  
  submitAssessmentResult: (params: {
    id: string;
    type: string;
    userId: string;
    answers: (number | string)[];
    result: any;
    completedAt: Date;
    timeToComplete: number;
  }) => Promise<void>;
  
  // Cultural support
  loadSupportedLanguages: () => Promise<void>;
  loadCulturalContexts: (languageCode: string) => Promise<void>;
  adaptQuestionsForCulture: (type: AssessmentType, languageCode: string, culturalContext: string) => Promise<string[]>;
  
  // Analytics and insights
  calculateTrends: () => void;
  getRecommendations: (assessmentResult: AssessmentResult) => string[];
  scheduleFollowUp: (assessmentId: string, followUpDate: string) => Promise<void>;
  
  // UI actions
  showAssessmentResults: (assessment: AssessmentResult) => void;
  hideAssessmentResults: () => void;
  clearErrors: () => void;
  setError: (error: string) => void;
  
  // Utility actions
  getAssessmentQuestions: (type: AssessmentType, languageCode?: string) => Promise<any[]>;
  validateAnswers: (type: AssessmentType, answers: (number | string)[]) => boolean;
  calculateScore: (type: AssessmentType, answers: (number | string)[]) => number;
  interpretScore: (type: AssessmentType, score: number) => { severity: string; interpretation: string; recommendations: string[] };
}

/**
 * Combined assessment store interface
 */
export type AssessmentStore = AssessmentState & AssessmentActions;

/**
 * Default assessment questions for PHQ-9 and GAD-7
 */
const DEFAULT_QUESTIONS = {
  'phq-9': [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself or that you are a failure',
    'Trouble concentrating on things',
    'Moving or speaking slowly or being fidgety/restless',
    'Thoughts that you would be better off dead'
  ],
  'gad-7': [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid, as if something awful might happen'
  ]
};

/**
 * Assessment store implementation
 */
export const useAssessmentStore = create<AssessmentStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        history: [],
        results: [],
        currentProgress: null,
        
        // Loading states
        isLoading: false,
        isSubmitting: false,
        isFetchingHistory: false,
        
        // Error states
        error: null,
        submissionError: null,
        
        // UI state
        showResults: false,
        selectedAssessment: null,
        
        // Cultural assessment state
        supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ar', 'hi'],
        culturalContexts: {},
        
        // Statistics
        completionStats: {
          totalCompleted: 0,
          averageScore: {} as Record<AssessmentType, number>,
          improvementTrend: 'insufficient-data',
          lastCompletedDate: null
        },

        // Assessment management
        startAssessment: (type: AssessmentType, options = {}) => {
          const questions = DEFAULT_QUESTIONS[type as keyof typeof DEFAULT_QUESTIONS] || [];
          
          const progress: AssessmentProgress = {
            assessmentId: `assessment-${Date.now()}`,
            type,
            currentQuestion: 0,
            totalQuestions: questions.length,
            answers: [],
            startedAt: new Date().toISOString(),
            estimatedTimeRemaining: questions.length * 30, // 30 seconds per question
            culturalContext: options.culturalContext,
            languageCode: options.languageCode || 'en'
          };
          
          set({ 
            currentProgress: progress,
            error: null,
            showResults: false 
          });
        },

        answerQuestion: (questionIndex: number, answer: number | string) => {
          set(state => {
            if (!state.currentProgress) return state;
            
            const newAnswers = [...state.currentProgress.answers];
            newAnswers[questionIndex] = answer;
            
            const nextQuestion = Math.min(
              questionIndex + 1, 
              state.currentProgress.totalQuestions
            );
            
            const remainingQuestions = state.currentProgress.totalQuestions - nextQuestion;
            
            return {
              currentProgress: {
                ...state.currentProgress,
                currentQuestion: nextQuestion,
                answers: newAnswers,
                estimatedTimeRemaining: remainingQuestions * 30
              }
            };
          });
        },

        previousQuestion: () => {
          set(state => {
            if (!state.currentProgress || state.currentProgress.currentQuestion <= 0) {
              return state;
            }
            
            return {
              currentProgress: {
                ...state.currentProgress,
                currentQuestion: state.currentProgress.currentQuestion - 1
              }
            };
          });
        },

        submitAssessment: async () => {
          const state = get();
          if (!state.currentProgress) return;
          
          try {
            set({ isSubmitting: true, submissionError: null });
            
            const { type, answers, culturalContext, languageCode } = state.currentProgress;
            const score = get().calculateScore(type, answers);
            const interpretation = get().interpretScore(type, score);
            
            if (culturalContext && languageCode !== 'en') {
              await get().submitCulturalAssessment(
                type as 'phq-9' | 'gad-7',
                answers as number[],
                answers as string[],
                languageCode,
                culturalContext,
                Math.floor((Date.now() - new Date(state.currentProgress.startedAt).getTime()) / 1000)
              );
            } else {
              if (type === 'phq-9') {
                await get().submitPhq9Result(score, answers as number[], false);
              } else if (type === 'gad-7') {
                await get().submitGad7Result(score, answers as number[], false);
              }
            }
            
            // Create assessment result
            const result: AssessmentResult = {
              id: state.currentProgress.assessmentId,
              type,
              score,
              answers,
              completedAt: new Date().toISOString(),
              interpretation: interpretation.interpretation,
              severity: interpretation.severity as any,
              recommendations: interpretation.recommendations,
              cultural: culturalContext ? {
                languageCode: languageCode || 'en',
                culturalContext,
                culturalFactors: []
              } : undefined,
              metadata: {
                sessionDuration: Math.floor((Date.now() - new Date(state.currentProgress.startedAt).getTime()) / 1000)
              }
            };
            
            set(state => ({
              results: [...state.results, result],
              selectedAssessment: result,
              showResults: true,
              currentProgress: null,
              isSubmitting: false
            }));
            
            // Update statistics
            get().calculateTrends();
            
          } catch (error) {
            console.error('Failed to submit assessment:', error);
            set({ 
              submissionError: error instanceof Error ? error.message : 'Failed to submit assessment',
              isSubmitting: false 
            });
          }
        },

        cancelAssessment: () => {
          set({ 
            currentProgress: null,
            error: null,
            showResults: false 
          });
        },

        // History and results
        fetchHistory: async () => {
          const userToken = undefined // TODO: Get from auth context;
          if (!userToken) {
            set({ history: [], isFetchingHistory: false });
            return;
          }
          
          try {
            set({ isFetchingHistory: true, error: null });
            
            const response = await fetch('/api/assessments/history', {
              headers: {
                'Authorization': 'Bearer token', // TODO: Get from auth context
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              set({ 
                history: data.assessments || [],
                isFetchingHistory: false 
              });
            } else {
              throw new Error('Failed to fetch assessment history');
            }
          } catch (error) {
            console.error('Failed to fetch history:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch history',
              isFetchingHistory: false 
            });
          }
        },

        getAssessmentById: (id: string) => {
          const state = get();
          return state.results.find(result => result.id === id) || null;
        },

        deleteAssessment: async (id: string) => {
          try {
            const response = await fetch(`/api/assessments/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': 'Bearer token', // TODO: Get from auth context
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              set(state => ({
                results: state.results.filter(result => result.id !== id),
                history: state.history.filter(assessment => assessment.id !== id)
              }));
            }
          } catch (error) {
            console.error('Failed to delete assessment:', error);
            set({ error: 'Failed to delete assessment' });
          }
        },

        exportResults: async (format: 'json' | 'csv' | 'pdf') => {
          const state = get();
          
          if (format === 'json') {
            return JSON.stringify(state.results, null, 2);
          } else if (format === 'csv') {
            const headers = ['ID', 'Type', 'Score', 'Severity', 'Completed At'];
            const rows = state.results.map(result => [
              result.id,
              result.type,
              result.score.toString(),
              result.severity,
              result.completedAt
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
          }
          
          return 'PDF export not implemented yet';
        },

        // Specialized submissions
        submitPhq9Result: async (score: number, answers: number[], cultural = false, culturalContext?: string) => {
          try {
            const response = await fetch('/api/assessments/phq9', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer token', // TODO: Get from auth context
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                score,
                answers,
                cultural,
                culturalContext,
                completedAt: new Date().toISOString()
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to submit PHQ-9 result');
            }
          } catch (error) {
            console.error('Failed to submit PHQ-9:', error);
            throw error;
          }
        },

        submitGad7Result: async (score: number, answers: number[], cultural = false, culturalContext?: string) => {
          try {
            const response = await fetch('/api/assessments/gad7', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer token', // TODO: Get from auth context
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                score,
                answers,
                cultural,
                culturalContext,
                completedAt: new Date().toISOString()
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to submit GAD-7 result');
            }
          } catch (error) {
            console.error('Failed to submit GAD-7:', error);
            throw error;
          }
        },

        submitCulturalAssessment: async (
          type: 'phq-9' | 'gad-7',
          scores: number[],
          answers: string[],
          languageCode: string,
          culturalContext?: string,
          sessionDuration?: number
        ) => {
          try {
            if (culturalAssessmentService?.submitCulturalAssessment) {
              // Convert answers to response format for cultural assessment service
              const responses: Record<string, number> = {};
              scores.forEach((score, index) => {
                responses[`q${index + 1}`] = score;
              });
              
              await culturalAssessmentService.submitCulturalAssessment(
                `${type}_${Date.now()}`, // assessmentId
                responses,
                culturalContext || languageCode,
                'user' // TODO: Get userId from auth context
              );
            } else {
              // Fallback to regular API
              const response = await fetch('/api/assessments/cultural', {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer token', // TODO: Get from auth context
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  type,
                  scores,
                  answers,
                  languageCode,
                  culturalContext,
                  sessionDuration,
                  completedAt: new Date().toISOString()
                })
              });
              
              if (!response.ok) {
                throw new Error('Failed to submit cultural assessment');
              }
            }
          } catch (error) {
            console.error('Failed to submit cultural assessment:', error);
            throw error;
          }
        },

        submitAssessmentResult: async (params: {
          id: string;
          type: string;
          userId: string;
          answers: (number | string)[];
          result: any;
          completedAt: Date;
          timeToComplete: number;
        }) => {
          try {
            const response = await fetch('/api/assessments/submit', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer token', // TODO: Get from auth context
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ...params,
                completedAt: params.completedAt.toISOString()
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to submit assessment result');
            }

            // Add to local results
            set((state: AssessmentStore) => ({
              results: [...state.results, {
                id: params.id,
                type: params.type as AssessmentType,
                score: params.result.score,
                answers: params.answers,
                completedAt: params.completedAt.toISOString(),
                interpretation: params.result.interpretation || '',
                severity: params.result.level || 'minimal',
                recommendations: params.result.recommendations || []
              } as AssessmentResult],
              completionStats: {
                ...state.completionStats,
                totalCompleted: state.completionStats.totalCompleted + 1,
                lastCompletedDate: params.completedAt.toISOString()
              }
            }));
          } catch (error) {
            console.error('Failed to submit assessment result:', error);
            throw error;
          }
        },

        // Cultural support
        loadSupportedLanguages: async () => {
          try {
            const response = await fetch('/api/assessments/languages');
            if (response.ok) {
              const data = await response.json();
              set({ supportedLanguages: data.languages || [] });
            }
          } catch (error) {
            console.error('Failed to load supported languages:', error);
          }
        },

        loadCulturalContexts: async (languageCode: string) => {
          try {
            const response = await fetch(`/api/assessments/cultural-contexts/${languageCode}`);
            if (response.ok) {
              const data = await response.json();
              set(state => ({
                culturalContexts: {
                  ...state.culturalContexts,
                  [languageCode]: data.contexts || []
                }
              }));
            }
          } catch (error) {
            console.error('Failed to load cultural contexts:', error);
          }
        },

        adaptQuestionsForCulture: async (type: AssessmentType, languageCode: string, culturalContext: string) => {
          try {
            const response = await fetch('/api/assessments/adapt-questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, languageCode, culturalContext })
            });
            
            if (response.ok) {
              const data = await response.json();
              return data.questions || DEFAULT_QUESTIONS[type as keyof typeof DEFAULT_QUESTIONS] || [];
            }
          } catch (error) {
            console.error('Failed to adapt questions:', error);
          }
          
          return DEFAULT_QUESTIONS[type as keyof typeof DEFAULT_QUESTIONS] || [];
        },

        // Analytics and insights
        calculateTrends: () => {
          const state = get();
          const results = state.results.sort((a, b) => 
            new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
          );
          
          if (results.length < 2) {
            set(state => ({
              completionStats: {
                ...state.completionStats,
                totalCompleted: results.length,
                improvementTrend: 'insufficient-data',
                lastCompletedDate: results[0]?.completedAt || null
              }
            }));
            return;
          }
          
          // Calculate average scores by type
          const averageScore: Record<AssessmentType, number> = {} as any;
          const scoresByType: Record<AssessmentType, number[]> = {} as any;
          
          results.forEach(result => {
            if (!scoresByType[result.type]) {
              scoresByType[result.type] = [];
            }
            scoresByType[result.type].push(result.score);
          });
          
          Object.keys(scoresByType).forEach(type => {
            const scores = scoresByType[type as AssessmentType];
            averageScore[type as AssessmentType] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          });
          
          // Determine trend (simple: compare first half to second half)
          const midpoint = Math.floor(results.length / 2);
          const firstHalfAvg = results.slice(0, midpoint).reduce((sum, r) => sum + r.score, 0) / midpoint;
          const secondHalfAvg = results.slice(midpoint).reduce((sum, r) => sum + r.score, 0) / (results.length - midpoint);
          
          let improvementTrend: 'improving' | 'stable' | 'declining' | 'insufficient-data' = 'stable';
          const difference = firstHalfAvg - secondHalfAvg;
          
          if (difference > 2) {
            improvementTrend = 'improving'; // Scores decreased (better)
          } else if (difference < -2) {
            improvementTrend = 'declining'; // Scores increased (worse)
          }
          
          set(state => ({
            completionStats: {
              totalCompleted: results.length,
              averageScore,
              improvementTrend,
              lastCompletedDate: results[results.length - 1]?.completedAt || null
            }
          }));
        },

        getRecommendations: (assessmentResult: AssessmentResult) => {
          const baseRecommendations = assessmentResult.recommendations;
          
          // Add personalized recommendations based on score and history
          const additionalRecommendations: string[] = [];
          
          if (assessmentResult.severity === 'moderate' || assessmentResult.severity === 'moderately-severe') {
            additionalRecommendations.push('Consider speaking with a mental health professional');
            additionalRecommendations.push('Practice daily mindfulness or meditation');
          }
          
          if (assessmentResult.severity === 'severe') {
            additionalRecommendations.push('Seek immediate professional help');
            additionalRecommendations.push('Contact crisis support if needed');
          }
          
          return [...baseRecommendations, ...additionalRecommendations];
        },

        scheduleFollowUp: async (assessmentId: string, followUpDate: string) => {
          try {
            const response = await fetch('/api/assessments/schedule-followup', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer token', // TODO: Get from auth context
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ assessmentId, followUpDate })
            });
            
            if (!response.ok) {
              throw new Error('Failed to schedule follow-up');
            }
          } catch (error) {
            console.error('Failed to schedule follow-up:', error);
            set({ error: 'Failed to schedule follow-up' });
          }
        },

        // UI actions
        showAssessmentResults: (assessment: AssessmentResult) => {
          set({ 
            selectedAssessment: assessment, 
            showResults: true 
          });
        },

        hideAssessmentResults: () => {
          set({ 
            showResults: false, 
            selectedAssessment: null 
          });
        },

        clearErrors: () => {
          set({ 
            error: null, 
            submissionError: null 
          });
        },

        setError: (error: string) => {
          set({ error });
        },

        // Utility actions
        getAssessmentQuestions: async (type: AssessmentType, languageCode = 'en') => {
          if (languageCode === 'en') {
            return DEFAULT_QUESTIONS[type as keyof typeof DEFAULT_QUESTIONS] || [];
          }
          
          try {
            const response = await fetch(`/api/assessments/questions/${type}/${languageCode}`);
            if (response.ok) {
              const data = await response.json();
              return data.questions || DEFAULT_QUESTIONS[type as keyof typeof DEFAULT_QUESTIONS] || [];
            }
          } catch (error) {
            console.error('Failed to get localized questions:', error);
          }
          
          return DEFAULT_QUESTIONS[type as keyof typeof DEFAULT_QUESTIONS] || [];
        },

        validateAnswers: (type: AssessmentType, answers: (number | string)[]) => {
          const expectedLength = DEFAULT_QUESTIONS[type as keyof typeof DEFAULT_QUESTIONS]?.length || 0;
          
          if (answers.length !== expectedLength) return false;
          
          return answers.every(answer => {
            if (type === 'phq-9' || type === 'gad-7') {
              return typeof answer === 'number' && answer >= 0 && answer <= 3;
            }
            return answer !== null && answer !== undefined;
          });
        },

        calculateScore: (type: AssessmentType, answers: (number | string)[]) => {
          if (type === 'phq-9' || type === 'gad-7') {
            return (answers as number[]).reduce((sum, answer) => sum + answer, 0);
          }
          
          return 0; // Default for custom assessments
        },

        interpretScore: (type: AssessmentType, score: number) => {
          if (type === 'phq-9') {
            if (score <= 4) {
              return {
                severity: 'minimal',
                interpretation: 'Minimal depression symptoms',
                recommendations: ['Continue healthy lifestyle habits', 'Monitor mood regularly']
              };
            } else if (score <= 9) {
              return {
                severity: 'mild',
                interpretation: 'Mild depression symptoms',
                recommendations: ['Consider lifestyle changes', 'Engage in regular exercise', 'Practice stress management']
              };
            } else if (score <= 14) {
              return {
                severity: 'moderate',
                interpretation: 'Moderate depression symptoms',
                recommendations: ['Consider professional counseling', 'Implement coping strategies', 'Monitor symptoms closely']
              };
            } else if (score <= 19) {
              return {
                severity: 'moderately-severe',
                interpretation: 'Moderately severe depression symptoms',
                recommendations: ['Seek professional help', 'Consider therapy or medication', 'Build support network']
              };
            } else {
              return {
                severity: 'severe',
                interpretation: 'Severe depression symptoms',
                recommendations: ['Seek immediate professional help', 'Contact mental health services', 'Consider crisis support if needed']
              };
            }
          } else if (type === 'gad-7') {
            if (score <= 4) {
              return {
                severity: 'minimal',
                interpretation: 'Minimal anxiety symptoms',
                recommendations: ['Continue healthy lifestyle habits', 'Practice relaxation techniques']
              };
            } else if (score <= 9) {
              return {
                severity: 'mild',
                interpretation: 'Mild anxiety symptoms',
                recommendations: ['Practice stress management', 'Consider mindfulness exercises', 'Monitor triggers']
              };
            } else if (score <= 14) {
              return {
                severity: 'moderate',
                interpretation: 'Moderate anxiety symptoms',
                recommendations: ['Consider professional counseling', 'Learn anxiety management techniques', 'Regular exercise']
              };
            } else {
              return {
                severity: 'severe',
                interpretation: 'Severe anxiety symptoms',
                recommendations: ['Seek professional help', 'Consider therapy or medication', 'Practice grounding techniques']
              };
            }
          }
          
          return {
            severity: 'unknown',
            interpretation: 'Assessment completed',
            recommendations: ['Review results with a healthcare provider']
          };
        }
      }),
      {
        name: 'assessment-store',
        partialize: (state) => ({
          history: state.history,
          results: state.results,
          completionStats: state.completionStats,
          supportedLanguages: state.supportedLanguages,
          culturalContexts: state.culturalContexts
        })
      }
    ),
    { name: 'AssessmentStore' }
  )
);

/**
 * Default export for convenience
 */
export default useAssessmentStore;
