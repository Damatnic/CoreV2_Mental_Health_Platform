import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WellnessStore } from '../wellnessStore';
import { WellnessMetric, WellnessGoal, WellnessInsight } from '../../types/wellness';

// Mock dependencies
jest.mock('../authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      },
      isAuthenticated: true
    }))
  }
}));

jest.mock('../../services/api/wellnessService', () => ({
  wellnessService: {
    getMetrics: jest.fn(),
    saveMetric: jest.fn(),
    getGoals: jest.fn(),
    saveGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
    getInsights: jest.fn(),
    generateInsight: jest.fn()
  }
}));

jest.mock('../../utils/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

// Test data
const mockMoodMetric: WellnessMetric = {
  id: 'metric-1',
  userId: 'test-user-id',
  type: 'mood',
  value: 7,
  timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
  notes: 'Feeling good today',
  tags: ['morning', 'positive']
};

const mockSleepMetric: WellnessMetric = {
  id: 'metric-2',
  userId: 'test-user-id',
  type: 'sleep',
  value: 8.5,
  timestamp: new Date('2024-01-15T08:00:00Z').toISOString(),
  notes: '8.5 hours of quality sleep',
  metadata: {
    bedtime: '23:00',
    wakeTime: '07:30',
    quality: 'good'
  }
};

const mockGoal: WellnessGoal = {
  id: 'goal-1',
  userId: 'test-user-id',
  title: 'Daily Meditation',
  description: 'Meditate for 10 minutes every day',
  category: 'mindfulness',
  targetValue: 10,
  targetFrequency: 'daily',
  currentProgress: 5,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-15T00:00:00Z').toISOString(),
  deadline: new Date('2024-12-31T23:59:59Z').toISOString()
};

const mockInsight: WellnessInsight = {
  id: 'insight-1',
  userId: 'test-user-id',
  type: 'trend',
  title: 'Mood Improvement',
  description: 'Your mood has been consistently improving over the past week.',
  data: { trend: 'upward', confidence: 0.85 },
  generatedAt: new Date('2024-01-15T12:00:00Z').toISOString(),
  priority: 'medium'
};

describe('WellnessStore', () => {
  let store: WellnessStore;

  beforeEach(() => {
    // Reset store state
    store = new WellnessStore();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      expect(store.metrics).toEqual([]);
      expect(store.goals).toEqual([]);
      expect(store.insights).toEqual([]);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBe(null);
    });
  });

  describe('Metrics Management', () => {
    it('should add a metric successfully', () => {
      store.addMetric(mockMoodMetric);

      expect(store.metrics).toHaveLength(1);
      expect(store.metrics[0]).toEqual(mockMoodMetric);
    });

    it('should handle multiple metrics', () => {
      store.addMetric(mockMoodMetric);
      store.addMetric(mockSleepMetric);

      expect(store.metrics).toHaveLength(2);
      expect(store.metrics).toContain(mockMoodMetric);
      expect(store.metrics).toContain(mockSleepMetric);
    });

    it('should update existing metric', () => {
      store.addMetric(mockMoodMetric);

      const updatedMetric = {
        ...mockMoodMetric,
        value: 9,
        notes: 'Feeling great!'
      };

      store.updateMetric(updatedMetric);

      expect(store.metrics).toHaveLength(1);
      expect(store.metrics[0].value).toBe(9);
      expect(store.metrics[0].notes).toBe('Feeling great!');
    });

    it('should remove metric', () => {
      store.addMetric(mockMoodMetric);
      store.addMetric(mockSleepMetric);

      store.removeMetric('metric-1');

      expect(store.metrics).toHaveLength(1);
      expect(store.metrics[0]).toEqual(mockSleepMetric);
    });

    it('should get metrics by type', () => {
      store.addMetric(mockMoodMetric);
      store.addMetric(mockSleepMetric);

      const moodMetrics = store.getMetricsByType('mood');
      const sleepMetrics = store.getMetricsByType('sleep');

      expect(moodMetrics).toHaveLength(1);
      expect(moodMetrics[0]).toEqual(mockMoodMetric);
      expect(sleepMetrics).toHaveLength(1);
      expect(sleepMetrics[0]).toEqual(mockSleepMetric);
    });

    it('should get metrics by date range', () => {
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');

      store.addMetric(mockMoodMetric);
      store.addMetric(mockSleepMetric);

      const metricsInRange = store.getMetricsByDateRange(startDate, endDate);

      expect(metricsInRange).toHaveLength(2);
    });

    it('should calculate average metric value', () => {
      const metric1 = { ...mockMoodMetric, value: 6 };
      const metric2 = { ...mockMoodMetric, id: 'metric-2', value: 8 };
      const metric3 = { ...mockMoodMetric, id: 'metric-3', value: 7 };

      store.addMetric(metric1);
      store.addMetric(metric2);
      store.addMetric(metric3);

      const average = store.getAverageMetricValue('mood');

      expect(average).toBe(7);
    });
  });

  describe('Goals Management', () => {
    it('should add a goal successfully', () => {
      store.addGoal(mockGoal);

      expect(store.goals).toHaveLength(1);
      expect(store.goals[0]).toEqual(mockGoal);
    });

    it('should update goal progress', () => {
      store.addGoal(mockGoal);

      store.updateGoalProgress('goal-1', 8);

      expect(store.goals[0].currentProgress).toBe(8);
      expect(store.goals[0].updatedAt).toBeDefined();
    });

    it('should mark goal as completed', () => {
      store.addGoal(mockGoal);

      store.updateGoalProgress('goal-1', 10);

      const goal = store.goals.find(g => g.id === 'goal-1');
      expect(goal?.currentProgress).toBe(10);
    });

    it('should get active goals only', () => {
      const inactiveGoal = { ...mockGoal, id: 'goal-2', isActive: false };

      store.addGoal(mockGoal);
      store.addGoal(inactiveGoal);

      const activeGoals = store.getActiveGoals();

      expect(activeGoals).toHaveLength(1);
      expect(activeGoals[0]).toEqual(mockGoal);
    });

    it('should get goals by category', () => {
      const exerciseGoal = {
        ...mockGoal,
        id: 'goal-2',
        category: 'exercise' as const,
        title: 'Daily Walk'
      };

      store.addGoal(mockGoal);
      store.addGoal(exerciseGoal);

      const mindfulnessGoals = store.getGoalsByCategory('mindfulness');
      const exerciseGoals = store.getGoalsByCategory('exercise');

      expect(mindfulnessGoals).toHaveLength(1);
      expect(exerciseGoals).toHaveLength(1);
    });

    it('should calculate goal completion percentage', () => {
      store.addGoal(mockGoal);

      const completionPercentage = store.getGoalCompletionPercentage('goal-1');

      expect(completionPercentage).toBe(50); // 5/10 * 100
    });

    it('should remove goal', () => {
      store.addGoal(mockGoal);

      store.removeGoal('goal-1');

      expect(store.goals).toHaveLength(0);
    });
  });

  describe('Insights Management', () => {
    it('should add insight successfully', () => {
      store.addInsight(mockInsight);

      expect(store.insights).toHaveLength(1);
      expect(store.insights[0]).toEqual(mockInsight);
    });

    it('should get insights by priority', () => {
      const highPriorityInsight = {
        ...mockInsight,
        id: 'insight-2',
        priority: 'high' as const
      };

      store.addInsight(mockInsight);
      store.addInsight(highPriorityInsight);

      const highPriorityInsights = store.getInsightsByPriority('high');

      expect(highPriorityInsights).toHaveLength(1);
      expect(highPriorityInsights[0]).toEqual(highPriorityInsight);
    });

    it('should get recent insights', () => {
      const oldInsight = {
        ...mockInsight,
        id: 'insight-2',
        generatedAt: new Date('2024-01-01T00:00:00Z').toISOString()
      };

      store.addInsight(mockInsight);
      store.addInsight(oldInsight);

      const recentInsights = store.getRecentInsights(7); // Last 7 days

      expect(recentInsights).toHaveLength(1);
      expect(recentInsights[0]).toEqual(mockInsight);
    });

    it('should remove insight', () => {
      store.addInsight(mockInsight);

      store.removeInsight('insight-1');

      expect(store.insights).toHaveLength(0);
    });
  });

  describe('Data Analysis', () => {
    beforeEach(() => {
      // Add test data
      const dates = [
        '2024-01-10T10:00:00Z',
        '2024-01-11T10:00:00Z',
        '2024-01-12T10:00:00Z',
        '2024-01-13T10:00:00Z',
        '2024-01-14T10:00:00Z'
      ];

      dates.forEach((date, index) => {
        store.addMetric({
          id: `metric-${index}`,
          userId: 'test-user-id',
          type: 'mood',
          value: index + 5, // Values: 5, 6, 7, 8, 9
          timestamp: date,
          notes: `Day ${index + 1}`
        });
      });
    });

    it('should calculate wellness trend', () => {
      const trend = store.getWellnessTrend('mood', 5);

      expect(trend.direction).toBe('improving');
      expect(trend.slope).toBeGreaterThan(0);
      expect(trend.confidence).toBeGreaterThan(0.5);
    });

    it('should generate wellness summary', () => {
      const summary = store.getWellnessSummary();

      expect(summary.totalMetrics).toBe(5);
      expect(summary.averageValues).toBeDefined();
      expect(summary.averageValues['mood']).toBe(7); // (5+6+7+8+9)/5
      expect(summary.trends).toBeDefined();
    });

    it('should get wellness streaks', () => {
      // Add goal completion data
      store.addGoal({
        ...mockGoal,
        currentProgress: 10,
        targetValue: 10
      });

      const streaks = store.getWellnessStreaks();

      expect(streaks).toBeDefined();
      expect(Array.isArray(streaks)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid metric data', () => {
      const invalidMetric = {
        ...mockMoodMetric,
        value: null as any
      };

      expect(() => store.addMetric(invalidMetric)).not.toThrow();
    });

    it('should handle non-existent metric removal', () => {
      expect(() => store.removeMetric('non-existent')).not.toThrow();
    });

    it('should handle invalid goal progress update', () => {
      expect(() => store.updateGoalProgress('non-existent', 5)).not.toThrow();
    });

    it('should set error state on operation failure', () => {
      store.setError('Test error message');

      expect(store.error).toBe('Test error message');
    });

    it('should clear error state', () => {
      store.setError('Test error');
      store.clearError();

      expect(store.error).toBe(null);
    });
  });

  describe('Loading States', () => {
    it('should set loading state', () => {
      store.setLoading(true);

      expect(store.isLoading).toBe(true);
    });

    it('should clear loading state', () => {
      store.setLoading(true);
      store.setLoading(false);

      expect(store.isLoading).toBe(false);
    });
  });

  describe('Data Persistence', () => {
    it('should serialize state for persistence', () => {
      store.addMetric(mockMoodMetric);
      store.addGoal(mockGoal);
      store.addInsight(mockInsight);

      const serialized = store.serialize();

      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('string');

      const parsed = JSON.parse(serialized);
      expect(parsed.metrics).toHaveLength(1);
      expect(parsed.goals).toHaveLength(1);
      expect(parsed.insights).toHaveLength(1);
    });

    it('should deserialize state from persistence', () => {
      const state = {
        metrics: [mockMoodMetric],
        goals: [mockGoal],
        insights: [mockInsight],
        isLoading: false,
        error: null
      };

      store.deserialize(JSON.stringify(state));

      expect(store.metrics).toHaveLength(1);
      expect(store.goals).toHaveLength(1);
      expect(store.insights).toHaveLength(1);
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time metric updates', () => {
      const callback = jest.fn();
      
      store.subscribe(callback);
      store.addMetric(mockMoodMetric);

      expect(callback).toHaveBeenCalledWith(store.getState());
    });

    it('should unsubscribe from updates', () => {
      const callback = jest.fn();
      
      const unsubscribe = store.subscribe(callback);
      unsubscribe();
      
      store.addMetric(mockMoodMetric);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now();

      // Add 1000 metrics
      for (let i = 0; i < 1000; i++) {
        store.addMetric({
          id: `metric-${i}`,
          userId: 'test-user-id',
          type: 'mood',
          value: Math.random() * 10,
          timestamp: new Date().toISOString(),
          notes: `Test metric ${i}`
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(store.metrics).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

// Export for external testing utilities
export { mockMoodMetric, mockSleepMetric, mockGoal, mockInsight };
