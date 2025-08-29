import { renderHook, act, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import useMoodTracking from '../../../hooks/useMoodTracking';

// Mock services
jest.mock('../../../services/moodAnalysisService');
jest.mock('../../../services/crisisDetectionService');
jest.mock('../../../services/encryptionService');

const mockMoodAnalysisService = require('../../../services/moodAnalysisService');
const mockCrisisDetectionService = require('../../../services/crisisDetectionService');
const mockEncryptionService = require('../../../services/encryptionService');

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

// Mock IndexedDB for offline storage
const mockIndexedDB = {
  open: jest.fn(),
  transaction: jest.fn(),
  objectStore: jest.fn(),
  add: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

describe('useMoodTracking Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Default service mocks
    mockEncryptionService.encrypt.mockImplementation((data: string) => `encrypted_${data}`);
    mockEncryptionService.decrypt.mockImplementation((data: string) => data.replace('encrypted_', ''));
    
    mockMoodAnalysisService.analyzeMoodPattern.mockResolvedValue({
      trend: 'stable',
      averageScore: 6.5,
      insights: ['Good overall mood stability']
    });
    
    mockCrisisDetectionService.analyzeMoodForCrisis.mockResolvedValue({
      riskLevel: 'low',
      confidence: 0.2,
      triggers: []
    });
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useMoodTracking());

      expect(result.current.moods).toEqual([]);
      expect(result.current.currentMood).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.analytics).toBeNull();
    });

    it('should load existing mood entries on mount', async () => {
      const mockMoods = [
        {
          id: '1',
          mood: 'happy',
          score: 8,
          timestamp: Date.now() - 3600000,
          notes: 'Great day!'
        },
        {
          id: '2',
          mood: 'neutral',
          score: 5,
          timestamp: Date.now() - 7200000,
          notes: 'Average day'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockMoods));

      const { result } = renderHook(() => useMoodTracking());

      await waitFor(() => {
        expect(result.current.moods).toHaveLength(2);
        expect(result.current.moods[0].mood).toBe('happy');
        expect(result.current.moods[1].mood).toBe('neutral');
      });
    });

    it('should handle corrupted mood data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('corrupted json data');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useMoodTracking());

      await waitFor(() => {
        expect(result.current.moods).toEqual([]);
        expect(result.current.error).toContain('Failed to load mood data');
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Mood Entry Management', () => {
    it('should add a new mood entry', async () => {
      const { result } = renderHook(() => useMoodTracking());

      const newMood = {
        mood: 'happy',
        score: 8,
        notes: 'Feeling great today!',
        factors: ['exercise', 'good sleep'],
        location: 'home'
      };

      await act(async () => {
        await result.current.addMoodEntry(newMood);
      });

      expect(result.current.moods).toHaveLength(1);
      expect(result.current.moods[0]).toMatchObject(newMood);
      expect(result.current.moods[0]).toHaveProperty('id');
      expect(result.current.moods[0]).toHaveProperty('timestamp');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'moodEntries',
        expect.any(String)
      );
    });

    it('should validate mood entry data', async () => {
      const { result } = renderHook(() => useMoodTracking());

      const invalidMood = {
        mood: '', // Empty mood
        score: 12, // Invalid score (should be 1-10)
        notes: 'x'.repeat(2000) // Too long
      };

      await act(async () => {
        await result.current.addMoodEntry(invalidMood);
      });

      expect(result.current.error).toContain('Invalid mood entry');
      expect(result.current.moods).toHaveLength(0);
    });

    it('should update existing mood entry', async () => {
      const { result } = renderHook(() => useMoodTracking());

      // First add a mood
      const originalMood = {
        mood: 'neutral',
        score: 5,
        notes: 'Original notes'
      };

      await act(async () => {
        await result.current.addMoodEntry(originalMood);
      });

      const moodId = result.current.moods[0].id;

      // Then update it
      const updatedMood = {
        id: moodId,
        mood: 'happy',
        score: 8,
        notes: 'Updated notes'
      };

      await act(async () => {
        await result.current.updateMoodEntry(moodId, updatedMood);
      });

      expect(result.current.moods).toHaveLength(1);
      expect(result.current.moods[0].mood).toBe('happy');
      expect(result.current.moods[0].score).toBe(8);
      expect(result.current.moods[0].notes).toBe('Updated notes');
    });

    it('should delete mood entry', async () => {
      const { result } = renderHook(() => useMoodTracking());

      // Add mood first
      await act(async () => {
        await result.current.addMoodEntry({
          mood: 'happy',
          score: 8,
          notes: 'To be deleted'
        });
      });

      const moodId = result.current.moods[0].id;

      // Delete it
      await act(async () => {
        await result.current.deleteMoodEntry(moodId);
      });

      expect(result.current.moods).toHaveLength(0);
    });

    it('should encrypt sensitive mood data', async () => {
      const { result } = renderHook(() => useMoodTracking());

      const sensitiveMood = {
        mood: 'anxious',
        score: 3,
        notes: 'Having panic attacks, feeling very worried about family situation'
      };

      await act(async () => {
        await result.current.addMoodEntry(sensitiveMood);
      });

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        expect.stringContaining('panic attacks')
      );
    });
  });

  describe('Mood Analytics', () => {
    beforeEach(() => {
      const mockMoods = [
        { mood: 'happy', score: 8, timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000) },
        { mood: 'neutral', score: 5, timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) },
        { mood: 'sad', score: 3, timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) },
        { mood: 'happy', score: 7, timestamp: Date.now() - (4 * 24 * 60 * 60 * 1000) },
        { mood: 'anxious', score: 4, timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000) }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockMoods));
    });

    it('should calculate mood statistics', async () => {
      const { result } = renderHook(() => useMoodTracking());

      await waitFor(() => {
        expect(result.current.moods).toHaveLength(5);
      });

      const stats = result.current.getMoodStatistics();

      expect(stats.averageScore).toBeCloseTo(5.4);
      expect(stats.totalEntries).toBe(5);
      expect(stats.moodDistribution).toHaveProperty('happy', 2);
      expect(stats.moodDistribution).toHaveProperty('sad', 1);
      expect(stats.scoreRange).toEqual({ min: 3, max: 8 });
    });

    it('should generate mood trends', async () => {
      mockMoodAnalysisService.analyzeMoodPattern.mockResolvedValueOnce({
        trend: 'improving',
        trendStrength: 0.75,
        periodAverage: 6.2,
        previousPeriodAverage: 4.8,
        insights: ['Mood has been steadily improving over the past week']
      });

      const { result } = renderHook(() => useMoodTracking());

      await waitFor(() => {
        expect(result.current.moods).toHaveLength(5);
      });

      await act(async () => {
        await result.current.analyzeMoodTrends('week');
      });

      expect(result.current.analytics.trend).toBe('improving');
      expect(result.current.analytics.trendStrength).toBe(0.75);
      expect(result.current.analytics.insights).toContain('steadily improving');
    });

    it('should identify mood patterns', async () => {
      const { result } = renderHook(() => useMoodTracking());

      await waitFor(() => {
        expect(result.current.moods).toHaveLength(5);
      });

      const patterns = result.current.identifyPatterns();

      expect(patterns).toHaveProperty('timeOfDay');
      expect(patterns).toHaveProperty('dayOfWeek');
      expect(patterns).toHaveProperty('correlations');
      expect(patterns).toHaveProperty('triggers');
    });

    it('should provide mood insights', async () => {
      mockMoodAnalysisService.generateInsights.mockResolvedValueOnce({
        recommendations: [
          'Consider maintaining your current exercise routine',
          'Try to get consistent sleep to support mood stability'
        ],
        triggers: ['work stress', 'poor sleep'],
        strengths: ['good social support', 'regular exercise']
      });

      const { result } = renderHook(() => useMoodTracking());

      await waitFor(() => {
        expect(result.current.moods).toHaveLength(5);
      });

      await act(async () => {
        await result.current.generateInsights();
      });

      expect(result.current.insights.recommendations).toContain('exercise routine');
      expect(result.current.insights.triggers).toContain('work stress');
      expect(result.current.insights.strengths).toContain('social support');
    });
  });

  describe('Crisis Detection Integration', () => {
    it('should detect crisis indicators in mood entries', async () => {
      mockCrisisDetectionService.analyzeMoodForCrisis.mockResolvedValueOnce({
        riskLevel: 'high',
        confidence: 0.85,
        triggers: ['persistent_low_mood', 'hopelessness_indicators'],
        recommendations: ['immediate_support', 'crisis_resources']
      });

      const { result } = renderHook(() => useMoodTracking());

      const crisisMood = {
        mood: 'depressed',
        score: 1,
        notes: 'Feel hopeless, nothing matters anymore, wish I could disappear'
      };

      await act(async () => {
        await result.current.addMoodEntry(crisisMood);
      });

      expect(mockCrisisDetectionService.analyzeMoodForCrisis).toHaveBeenCalled();
      expect(result.current.crisisAlert).toEqual({
        riskLevel: 'high',
        confidence: 0.85,
        triggers: ['persistent_low_mood', 'hopelessness_indicators'],
        recommendations: ['immediate_support', 'crisis_resources']
      });
    });

    it('should not trigger false alarms for normal low moods', async () => {
      const { result } = renderHook(() => useMoodTracking());

      const normalLowMood = {
        mood: 'sad',
        score: 4,
        notes: 'Had a rough day at work but will be better tomorrow'
      };

      await act(async () => {
        await result.current.addMoodEntry(normalLowMood);
      });

      expect(result.current.crisisAlert).toBeNull();
    });

    it('should escalate persistent crisis indicators', async () => {
      mockCrisisDetectionService.analyzeMoodForCrisis
        .mockResolvedValueOnce({ riskLevel: 'moderate', confidence: 0.6 })
        .mockResolvedValueOnce({ riskLevel: 'high', confidence: 0.8 })
        .mockResolvedValueOnce({ riskLevel: 'critical', confidence: 0.95 });

      const { result } = renderHook(() => useMoodTracking());

      // Add multiple concerning entries
      const concerningMoods = [
        { mood: 'depressed', score: 2, notes: 'Feel very low' },
        { mood: 'hopeless', score: 1, notes: 'Nothing will get better' },
        { mood: 'suicidal', score: 1, notes: 'Want everything to end' }
      ];

      for (const mood of concerningMoods) {
        await act(async () => {
          await result.current.addMoodEntry(mood);
        });
      }

      expect(result.current.crisisAlert.riskLevel).toBe('critical');
      expect(result.current.crisisEscalated).toBe(true);
    });
  });

  describe('Data Export and Import', () => {
    it('should export mood data', async () => {
      const { result } = renderHook(() => useMoodTracking());

      // Add some moods first
      await act(async () => {
        await result.current.addMoodEntry({ mood: 'happy', score: 8, notes: 'Great day!' });
        await result.current.addMoodEntry({ mood: 'neutral', score: 5, notes: 'OK day' });
      });

      const exportedData = result.current.exportMoodData();

      expect(exportedData).toHaveProperty('version');
      expect(exportedData).toHaveProperty('exportDate');
      expect(exportedData).toHaveProperty('moodEntries');
      expect(exportedData.moodEntries).toHaveLength(2);
      expect(exportedData.moodEntries[0]).toHaveProperty('mood', 'happy');
    });

    it('should import mood data', async () => {
      const { result } = renderHook(() => useMoodTracking());

      const importData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        moodEntries: [
          { id: '1', mood: 'happy', score: 8, timestamp: Date.now(), notes: 'Imported mood' }
        ]
      };

      await act(async () => {
        await result.current.importMoodData(importData);
      });

      expect(result.current.moods).toHaveLength(1);
      expect(result.current.moods[0].notes).toBe('Imported mood');
    });

    it('should validate imported data', async () => {
      const { result } = renderHook(() => useMoodTracking());

      const invalidImportData = {
        version: '0.5', // Unsupported version
        moodEntries: [
          { mood: 'invalid', score: 15 } // Invalid data
        ]
      };

      await act(async () => {
        await result.current.importMoodData(invalidImportData);
      });

      expect(result.current.error).toContain('Invalid import data');
      expect(result.current.moods).toHaveLength(0);
    });
  });

  describe('Offline Support', () => {
    it('should work offline', async () => {
      // Mock offline condition
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const { result } = renderHook(() => useMoodTracking());

      await act(async () => {
        await result.current.addMoodEntry({
          mood: 'happy',
          score: 7,
          notes: 'Offline mood entry'
        });
      });

      expect(result.current.moods).toHaveLength(1);
      expect(result.current.offlineMode).toBe(true);
    });

    it('should sync when coming back online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const { result } = renderHook(() => useMoodTracking());

      // Add mood while offline
      await act(async () => {
        await result.current.addMoodEntry({
          mood: 'neutral',
          score: 5,
          notes: 'Added while offline'
        });
      });

      expect(result.current.pendingSyncCount).toBe(1);

      // Come back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      // Trigger online event
      await act(async () => {
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(result.current.pendingSyncCount).toBe(0);
        expect(result.current.lastSyncTime).toBeDefined();
      });
    });

    it('should handle sync conflicts', async () => {
      const { result } = renderHook(() => useMoodTracking());

      // Simulate sync conflict
      const conflictData = {
        localChanges: [{ id: '1', mood: 'happy', score: 8 }],
        serverChanges: [{ id: '1', mood: 'neutral', score: 6 }]
      };

      await act(async () => {
        await result.current.resolveSyncConflicts(conflictData, 'local-wins');
      });

      expect(result.current.moods[0].mood).toBe('happy');
    });
  });

  describe('Privacy and Security', () => {
    it('should anonymize mood data for analytics', () => {
      const { result } = renderHook(() => useMoodTracking());

      const personalMood = {
        mood: 'anxious',
        score: 3,
        notes: 'Worried about my job interview tomorrow at Google',
        location: { lat: 37.4419, lng: -122.1430 } // Specific coordinates
      };

      const anonymized = result.current.anonymizeMoodData(personalMood);

      expect(anonymized.notes).not.toContain('Google');
      expect(anonymized.location).toBeUndefined();
      expect(anonymized).toHaveProperty('mood');
      expect(anonymized).toHaveProperty('score');
    });

    it('should implement data retention policies', async () => {
      const { result } = renderHook(() => useMoodTracking());

      // Mock old mood data (2 years old)
      const oldMoods = [
        {
          id: '1',
          mood: 'happy',
          score: 8,
          timestamp: Date.now() - (2 * 365 * 24 * 60 * 60 * 1000),
          notes: 'Very old mood entry'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldMoods));

      await act(async () => {
        await result.current.applyRetentionPolicy();
      });

      expect(result.current.moods).toHaveLength(0); // Old data should be purged
    });

    it('should allow user to delete all mood data', async () => {
      const { result } = renderHook(() => useMoodTracking());

      // Add some moods
      await act(async () => {
        await result.current.addMoodEntry({ mood: 'happy', score: 8 });
        await result.current.addMoodEntry({ mood: 'sad', score: 3 });
      });

      expect(result.current.moods).toHaveLength(2);

      // Delete all data
      await act(async () => {
        await result.current.deleteAllMoodData();
      });

      expect(result.current.moods).toHaveLength(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('moodEntries');
    });
  });

  describe('Performance Optimization', () => {
    it('should debounce rapid mood entries', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useMoodTracking());

      // Rapidly add multiple moods
      act(() => {
        result.current.addMoodEntry({ mood: 'happy', score: 8 });
        result.current.addMoodEntry({ mood: 'excited', score: 9 });
        result.current.addMoodEntry({ mood: 'content', score: 7 });
      });

      // Should debounce saves
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    it('should paginate large mood datasets', async () => {
      // Create large dataset
      const largeMoodSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `mood-${i}`,
        mood: 'neutral',
        score: 5,
        timestamp: Date.now() - (i * 3600000)
      }));

      localStorageMock.getItem.mockReturnValue(JSON.stringify(largeMoodSet));

      const { result } = renderHook(() => useMoodTracking());

      await waitFor(() => {
        expect(result.current.moods).toHaveLength(1000);
      });

      // Get paginated results
      const page1 = result.current.getPaginatedMoods(0, 50);
      const page2 = result.current.getPaginatedMoods(50, 50);

      expect(page1).toHaveLength(50);
      expect(page2).toHaveLength(50);
      expect(page1[0].id).toBe('mood-0');
      expect(page2[0].id).toBe('mood-50');
    });

    it('should lazy load mood analytics', async () => {
      const { result } = renderHook(() => useMoodTracking());

      // Analytics should not be loaded initially
      expect(result.current.analytics).toBeNull();

      // Load analytics on demand
      await act(async () => {
        await result.current.loadAnalytics();
      });

      expect(result.current.analytics).toBeDefined();
      expect(mockMoodAnalysisService.analyzeMoodPattern).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle storage quota exceeded', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const { result } = renderHook(() => useMoodTracking());

      await act(async () => {
        await result.current.addMoodEntry({ mood: 'happy', score: 8 });
      });

      expect(result.current.error).toContain('storage quota exceeded');
      expect(result.current.storageWarning).toBe(true);
    });

    it('should recover from corrupted data', async () => {
      // Mock corrupted data in localStorage
      localStorageMock.getItem.mockReturnValue('{"corrupted": json}');

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useMoodTracking());

      await waitFor(() => {
        expect(result.current.moods).toEqual([]);
        expect(result.current.dataRecovered).toBe(true);
      });

      consoleWarnSpy.mockRestore();
    });

    it('should handle service failures gracefully', async () => {
      mockMoodAnalysisService.analyzeMoodPattern.mockRejectedValue(
        new Error('Service unavailable')
      );

      const { result } = renderHook(() => useMoodTracking());

      await act(async () => {
        await result.current.analyzeMoodTrends('week');
      });

      expect(result.current.error).toContain('Service unavailable');
      expect(result.current.analytics).toBeNull();
    });
  });
});