import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useAssessmentStore } from './assessmentStore';
import type { AssessmentResult, AssessmentProgress, AssessmentType } from './assessmentStore';

// Mock cultural assessment service
jest.mock('../services/culturalAssessmentService');
jest.mock('../contexts/AuthContext');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Date for consistent testing
const mockDate = new Date('2024-01-15T10:30:00Z');
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(mockDate);
});

afterAll(() => {
  jest.useRealTimers();
});

// Helper to create test assessment result
const createTestAssessmentResult = (overrides: Partial<AssessmentResult> = {}): AssessmentResult => ({
  id: 'assessment-result-1',
  type: 'phq-9',
  score: 8,
  answers: [1, 2, 1, 3, 2, 1, 0, 2, 1],
  completedAt: mockDate.toISOString(),
  interpretation: 'Mild depression symptoms detected',
  severity: 'mild',
  recommendations: [
    'Consider speaking with a mental health professional',
    'Maintain regular exercise and sleep schedule',
    'Practice stress management techniques'
  ],
  metadata: {
    sessionDuration: 180000, // 3 minutes
    timeOfDay: '10:30'
  },
  ...overrides
});

// Helper to create test assessment progress
const createTestAssessmentProgress = (overrides: Partial<AssessmentProgress> = {}): AssessmentProgress => ({
  assessmentId: 'progress-1',
  type: 'phq-9',
  currentQuestion: 3,
  totalQuestions: 9,
  answers: [1, 2, 1],
  startedAt: mockDate.toISOString(),
  estimatedTimeRemaining: 120000, // 2 minutes
  ...overrides
});

describe('AssessmentStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      expect(result.current.history).toEqual([]);
      expect(result.current.results).toEqual([]);
      expect(result.current.currentProgress).toBeNull();
      expect(result.current.selectedAssessment).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isFetchingHistory).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.submissionError).toBeNull();
      expect(result.current.showResults).toBe(false);
    });

    it('should load assessment data from localStorage', () => {
      const testResult = createTestAssessmentResult();
      const mockStorageData = {
        results: [testResult],
        history: [testResult]
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const { result } = renderHook(() => useAssessmentStore());
      
      expect(result.current.results).toHaveLength(1);
      expect(result.current.history).toHaveLength(1);
      expect(result.current.results[0]).toEqual(testResult);
    });

    it('should handle corrupt localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const { result } = renderHook(() => useAssessmentStore());
      
      expect(result.current.results).toEqual([]);
      expect(result.current.history).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Assessment Management', () => {
    it('should start a new PHQ-9 assessment', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('phq-9');
      });

      expect(result.current.currentProgress).not.toBeNull();
      expect(result.current.currentProgress?.type).toBe('phq-9');
      expect(result.current.currentProgress?.currentQuestion).toBe(0);
      expect(result.current.currentProgress?.totalQuestions).toBe(9);
      expect(result.current.currentProgress?.answers).toEqual([]);
    });

    it('should start a new GAD-7 assessment', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('gad-7');
      });

      expect(result.current.currentProgress).not.toBeNull();
      expect(result.current.currentProgress?.type).toBe('gad-7');
      expect(result.current.currentProgress?.totalQuestions).toBe(7);
    });

    it('should start cultural assessment with language options', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('cultural', { 
          culturalContext: 'asian',
          languageCode: 'zh-CN' 
        });
      });

      expect(result.current.currentProgress).not.toBeNull();
      expect(result.current.currentProgress?.type).toBe('cultural');
      expect(result.current.currentProgress?.culturalContext).toBe('asian');
      expect(result.current.currentProgress?.languageCode).toBe('zh-CN');
    });

    it('should cancel current assessment', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('phq-9');
      });

      expect(result.current.currentProgress).not.toBeNull();

      act(() => {
        result.current.cancelAssessment();
      });

      expect(result.current.currentProgress).toBeNull();
    });
  });

  describe('Question Management', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('phq-9');
      });
    });

    it('should answer questions and advance progress', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('phq-9');
        result.current.answerQuestion(0, 2);
      });

      expect(result.current.currentProgress?.answers).toEqual([2]);
      expect(result.current.currentProgress?.currentQuestion).toBe(1);
    });

    it('should allow going to previous question', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('phq-9');
        result.current.answerQuestion(0, 2);
        result.current.answerQuestion(1, 1);
      });

      expect(result.current.currentProgress?.currentQuestion).toBe(2);

      act(() => {
        result.current.previousQuestion();
      });

      expect(result.current.currentProgress?.currentQuestion).toBe(1);
    });

    it('should update existing answer when answering same question', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('phq-9');
        result.current.answerQuestion(0, 2);
        result.current.answerQuestion(0, 3); // Change answer
      });

      expect(result.current.currentProgress?.answers).toEqual([3]);
      expect(result.current.currentProgress?.currentQuestion).toBe(1);
    });
  });

  describe('Assessment Submission', () => {
    it('should submit completed assessment', async () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('phq-9');
      });

      // Answer all questions
      const answers = [1, 2, 1, 3, 2, 1, 0, 2, 1];
      act(() => {
        answers.forEach((answer, index) => {
          result.current.answerQuestion(index, answer);
        });
      });

      await act(async () => {
        await result.current.submitAssessment();
      });

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.results).toHaveLength(1);
      expect(result.current.currentProgress).toBeNull();
      expect(result.current.showResults).toBe(true);
    });

    it('should handle submission errors', async () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      // Mock submission error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      act(() => {
        result.current.startAssessment('phq-9');
      });

      // Try to submit incomplete assessment
      await act(async () => {
        try {
          await result.current.submitAssessment();
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.submissionError).not.toBeNull();
    });
  });

  describe('Results Management', () => {
    it('should select assessment result for viewing', () => {
      const { result } = renderHook(() => useAssessmentStore());
      const testResult = createTestAssessmentResult();
      
      act(() => {
        result.current.results = [testResult];
        result.current.selectResult(testResult.id);
      });

      expect(result.current.selectedAssessment).toEqual(testResult);
      expect(result.current.showResults).toBe(true);
    });

    it('should clear selected result', () => {
      const { result } = renderHook(() => useAssessmentStore());
      const testResult = createTestAssessmentResult();
      
      act(() => {
        result.current.selectedAssessment = testResult;
        result.current.showResults = true;
        result.current.clearSelection();
      });

      expect(result.current.selectedAssessment).toBeNull();
      expect(result.current.showResults).toBe(false);
    });

    it('should delete assessment result', () => {
      const { result } = renderHook(() => useAssessmentStore());
      const testResult = createTestAssessmentResult();
      
      act(() => {
        result.current.results = [testResult];
        result.current.deleteResult(testResult.id);
      });

      expect(result.current.results).toHaveLength(0);
    });
  });

  describe('Statistics and Trends', () => {
    it('should calculate completion statistics', () => {
      const { result } = renderHook(() => useAssessmentStore());
      const results = [
        createTestAssessmentResult({ type: 'phq-9', score: 8 }),
        createTestAssessmentResult({ type: 'phq-9', score: 6 }),
        createTestAssessmentResult({ type: 'gad-7', score: 10 })
      ];
      
      act(() => {
        result.current.results = results;
      });

      expect(result.current.completionStats.totalCompleted).toBe(3);
      expect(result.current.completionStats.averageScore['phq-9']).toBe(7);
      expect(result.current.completionStats.averageScore['gad-7']).toBe(10);
    });

    it('should determine improvement trend', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      // Mock trend calculation with improving scores
      const results = [
        createTestAssessmentResult({ 
          type: 'phq-9', 
          score: 12, 
          completedAt: '2024-01-01T00:00:00Z' 
        }),
        createTestAssessmentResult({ 
          type: 'phq-9', 
          score: 8, 
          completedAt: '2024-01-15T00:00:00Z' 
        })
      ];
      
      act(() => {
        result.current.results = results;
      });

      expect(result.current.completionStats.improvementTrend).toBe('improving');
    });
  });

  describe('Cultural Assessment Support', () => {
    it('should handle cultural assessment with adaptation', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.supportedLanguages = ['en', 'zh-CN', 'es'];
        result.current.culturalContexts = {
          'asian': ['chinese', 'japanese', 'korean'],
          'hispanic': ['mexican', 'puerto-rican', 'colombian']
        };
      });

      expect(result.current.supportedLanguages).toContain('zh-CN');
      expect(result.current.culturalContexts.asian).toContain('chinese');
    });

    it('should create culturally adapted assessment result', async () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('cultural', {
          culturalContext: 'asian',
          languageCode: 'zh-CN'
        });
      });

      // Answer questions
      const answers = [1, 2, 3, 2, 1];
      act(() => {
        answers.forEach((answer, index) => {
          result.current.answerQuestion(index, answer);
        });
      });

      await act(async () => {
        await result.current.submitAssessment();
      });

      const culturalResult = result.current.results[0];
      expect(culturalResult.cultural?.languageCode).toBe('zh-CN');
      expect(culturalResult.cultural?.culturalContext).toBe('asian');
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.error = 'Test error';
        result.current.submissionError = 'Submission error';
        result.current.clearErrors();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.submissionError).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      // Mock network error
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      
      act(() => {
        result.current.startAssessment('phq-9');
      });

      await act(async () => {
        try {
          await result.current.submitAssessment();
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.error).not.toBeNull();
    });
  });

  describe('Persistence', () => {
    it('should save to localStorage when results change', async () => {
      const { result } = renderHook(() => useAssessmentStore());
      
      act(() => {
        result.current.startAssessment('phq-9');
      });

      // Answer all questions and submit
      const answers = [1, 2, 1, 3, 2, 1, 0, 2, 1];
      act(() => {
        answers.forEach((answer, index) => {
          result.current.answerQuestion(index, answer);
        });
      });

      await act(async () => {
        await result.current.submitAssessment();
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
});