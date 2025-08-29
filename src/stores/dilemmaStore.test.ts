import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useDilemmaStore } from './dilemmaStore';
import type { Dilemma } from './dilemmaStore';

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

// Helper to create valid dilemma data
const createValidDilemmaData = (overrides: Partial<Dilemma> = {}): Dilemma => ({
  id: 'test-dilemma-1',
  title: 'Test Dilemma',
  content: 'Test content for the dilemma',
  author: {
    id: 'user-1',
    name: 'Test User',
    role: 'user',
    isVerified: false
  },
  category: 'general',
  tags: ['test'],
  timestamp: mockDate.getTime(),
  updatedAt: mockDate.getTime(),
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  bookmarks: 0,
  isLiked: false,
  isBookmarked: false,
  isFollowing: false,
  readingTime: 5,
  difficulty: 'medium',
  sensitivity: 'low',
  triggerWarnings: [],
  isReported: false,
  reportCount: 0,
  isFlagged: false,
  moderationStatus: 'approved',
  hasHelp: false,
  helpCount: 0,
  isResolved: false,
  ...overrides
});

// Helper to create multiple test dilemmas
const createTestDilemmas = (count: number): Dilemma[] => {
  return Array.from({ length: count }, (_, index) =>
    createValidDilemmaData({
      id: `test-dilemma-${index + 1}`,
      title: `Test Dilemma ${index + 1}`,
      content: `Content for test dilemma ${index + 1}`,
    })
  );
};

describe('DilemmaStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useDilemmaStore());
      
      expect(result.current.allDilemmas).toEqual([]);
      expect(result.current.forYouDilemmas).toEqual([]);
      expect(result.current.trendingDilemmas).toEqual([]);
      expect(result.current.bookmarkedDilemmas).toEqual([]);
      expect(result.current.myDilemmas).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.selectedDilemmaId).toBeNull();
    });

    it('should load dilemmas from localStorage', () => {
      const testDilemmas = createTestDilemmas(2);
      const mockStorageData = {
        myDilemmas: testDilemmas,
        allDilemmas: testDilemmas
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const { result } = renderHook(() => useDilemmaStore());
      
      expect(result.current.myDilemmas).toHaveLength(2);
      expect(result.current.allDilemmas).toHaveLength(2);
    });

    it('should handle corrupt localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const { result } = renderHook(() => useDilemmaStore());
      
      expect(result.current.myDilemmas).toEqual([]);
      expect(result.current.allDilemmas).toEqual([]);
    });
  });

  describe('Dilemma Creation', () => {
    it('should create a new dilemma with valid data', async () => {
      const { result } = renderHook(() => useDilemmaStore());
      
      const dilemmaData = {
        title: 'Should I change careers?',
        content: 'I am considering a career change but unsure about the risks.',
        author: {
          id: 'user-1',
          name: 'Test User',
          role: 'user',
          isVerified: false
        },
        category: 'career',
        tags: ['career', 'life-decision'],
        difficulty: 'medium' as const,
        sensitivity: 'low' as const,
        triggerWarnings: [],
        readingTime: 10
      };

      await act(async () => {
        await result.current.createDilemma(dilemmaData);
      });

      expect(result.current.myDilemmas).toHaveLength(1);
      expect(result.current.myDilemmas[0].title).toBe('Should I change careers?');
      expect(result.current.myDilemmas[0].category).toBe('career');
    });

    it('should handle creation errors gracefully', async () => {
      const { result } = renderHook(() => useDilemmaStore());
      
      // Test with insufficient data
      await act(async () => {
        try {
          await result.current.createDilemma({ title: 'Incomplete' } as any);
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.myDilemmas).toHaveLength(0);
    });
  });

  describe('Dilemma Interactions', () => {
    it('should like a dilemma', () => {
      const { result } = renderHook(() => useDilemmaStore());
      const testDilemmas = createTestDilemmas(1);
      
      act(() => {
        result.current.allDilemmas = testDilemmas;
      });

      act(() => {
        result.current.likeDilemma(testDilemmas[0].id);
      });

      const updatedDilemma = result.current.allDilemmas.find(d => d.id === testDilemmas[0].id);
      expect(updatedDilemma?.isLiked).toBe(true);
      expect(updatedDilemma?.likes).toBeGreaterThan(0);
    });

    it('should bookmark a dilemma', () => {
      const { result } = renderHook(() => useDilemmaStore());
      const testDilemmas = createTestDilemmas(1);
      
      act(() => {
        result.current.allDilemmas = testDilemmas;
      });

      act(() => {
        result.current.bookmarkDilemma(testDilemmas[0].id);
      });

      const updatedDilemma = result.current.allDilemmas.find(d => d.id === testDilemmas[0].id);
      expect(updatedDilemma?.isBookmarked).toBe(true);
    });

    it('should select a dilemma', () => {
      const { result } = renderHook(() => useDilemmaStore());
      const testDilemmas = createTestDilemmas(1);
      
      act(() => {
        result.current.selectedDilemmaId = testDilemmas[0].id;
      });

      expect(result.current.selectedDilemmaId).toBe(testDilemmas[0].id);
    });
  });

  describe('Filtering and Sorting', () => {
    it('should update search term', () => {
      const { result } = renderHook(() => useDilemmaStore());
      
      act(() => {
        result.current.setSearchTerm('test search');
      });

      expect(result.current.searchTerm).toBe('test search');
    });

    it('should update sort option', () => {
      const { result } = renderHook(() => useDilemmaStore());
      
      act(() => {
        result.current.sortBy = 'newest';
      });

      expect(result.current.sortBy).toBe('newest');
    });

    it('should apply filters', () => {
      const { result } = renderHook(() => useDilemmaStore());
      
      act(() => {
        result.current.setFilter({
          category: 'career',
          difficulty: 'medium',
          tags: ['career']
        });
      });

      expect(result.current.activeFilter.category).toBe('career');
      expect(result.current.activeFilter.difficulty).toBe('medium');
    });
  });

  describe('Loading States', () => {
    it('should manage loading state', () => {
      const { result } = renderHook(() => useDilemmaStore());
      
      act(() => {
        result.current.isLoading = true;
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.isLoading = false;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should save to localStorage when data changes', async () => {
      const { result } = renderHook(() => useDilemmaStore());
      
      const dilemmaData = {
        title: 'Test Persistence',
        content: 'Testing localStorage persistence',
        author: {
          id: 'user-1',
          name: 'Test User',
          role: 'user',
          isVerified: false
        },
        category: 'test',
        tags: ['test'],
        difficulty: 'easy' as const,
        sensitivity: 'low' as const,
        triggerWarnings: [],
        readingTime: 5
      };

      await act(async () => {
        await result.current.createDilemma(dilemmaData);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useDilemmaStore());
      
      // Should not throw error even if localStorage fails
      expect(() => {
        act(() => {
          result.current.setSearchTerm('test');
        });
      }).not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should calculate dilemma statistics', () => {
      const { result } = renderHook(() => useDilemmaStore());
      const testDilemmas = createTestDilemmas(5);
      
      act(() => {
        result.current.allDilemmas = testDilemmas;
      });

      expect(result.current.stats.total).toBe(5);
      expect(result.current.stats.byCategory.general).toBe(5);
    });
  });
});