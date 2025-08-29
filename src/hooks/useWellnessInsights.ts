import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  insightsEngine,
  type MoodEntry,
  type Pattern,
  type Trigger,
  type CopingStrategy,
  type Goal,
  type Recommendation,
  type RiskAssessment,
  type ProgressMetric
} from '../services/insightsEngine';

interface WellnessInsightsState {
  insights: InsightItem[];
  patterns: Pattern | null;
  triggers: Trigger[];
  copingStrategies: CopingStrategy[];
  progressMetrics: ProgressMetric | null;
  goals: Goal[];
  recommendations: Recommendation[];
  riskLevel: RiskAssessment['level'];
  loading: boolean;
  error: Error | null;
}

interface InsightItem {
  id: string;
  category: 'mood_pattern' | 'trigger_identification' | 'coping_strategy' | 'goal_progress';
  type: 'positive' | 'warning' | 'neutral' | 'achievement';
  title: string;
  description: string;
  metric?: {
    value: number;
    change: number;
    label: string;
  };
  timestamp: Date;
}

interface UseWellnessInsightsReturn extends WellnessInsightsState {
  refreshInsights: () => Promise<void>;
  updateTimeRange: (range: 'week' | 'month' | 'quarter') => void;
  markRecommendationActioned: (recommendationId: string) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;
}

/**
 * Custom hook for accessing wellness insights and AI-powered recommendations
 */
export function useWellnessInsights(): UseWellnessInsightsReturn {
  const [state, setState] = useState<WellnessInsightsState>({
    insights: [],
    patterns: null,
    triggers: [],
    copingStrategies: [],
    progressMetrics: null,
    goals: [],
    recommendations: [],
    riskLevel: 'low',
    loading: true,
    error: null
  });

  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Mock data generation for mood entries
  const generateMockMoodEntries = useCallback((): MoodEntry[] => {
    const entries: MoodEntry[] = [];
    const now = new Date();
    const daysToGenerate = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    
    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic mood patterns
      const baselineMood = 5 + Math.sin(i * 0.2) * 2;
      const randomVariation = (Math.random() - 0.5) * 2;
      const mood = Math.max(1, Math.min(10, Math.round(baselineMood + randomVariation)));
      
      // Add triggers and coping strategies randomly
      const triggers: string[] = [];
      const copingStrategies: string[] = [];
      
      if (Math.random() < 0.3) {
        triggers.push(
          ['Work stress', 'Social anxiety', 'Poor sleep', 'Conflict', 'Weather'][
            Math.floor(Math.random() * 5)
          ]
        );
      }
      
      if (Math.random() < 0.4) {
        copingStrategies.push(
          ['Deep breathing', 'Exercise', 'Meditation', 'Journaling', 'Talking to friend'][
            Math.floor(Math.random() * 5)
          ]
        );
      }
      
      entries.push({
        id: `entry-${i}`,
        mood,
        timestamp: date,
        notes: mood < 4 ? 'Feeling down today' : mood > 7 ? 'Great day!' : 'Normal day',
        triggers,
        activities: ['Work', 'Exercise', 'Social', 'Hobby'][Math.floor(Math.random() * 4)] as any,
        copingStrategies
      });
    }
    
    return entries;
  }, [timeRange]);

  // Generate mock goals
  const generateMockGoals = useCallback((): Goal[] => {
    return [
      {
        id: 'goal-1',
        title: 'Daily Meditation',
        category: 'mindfulness',
        progress: 75,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        milestones: [
          { id: 'm1', title: 'Week 1', completed: true, completedAt: new Date() },
          { id: 'm2', title: 'Week 2', completed: true, completedAt: new Date() },
          { id: 'm3', title: 'Week 3', completed: true, completedAt: new Date() },
          { id: 'm4', title: 'Week 4', completed: false }
        ],
        trend: 'on-track'
      },
      {
        id: 'goal-2',
        title: 'Exercise 3x per week',
        category: 'exercise',
        progress: 60,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        milestones: [
          { id: 'm5', title: 'Week 1', completed: true, completedAt: new Date() },
          { id: 'm6', title: 'Week 2', completed: false }
        ],
        trend: 'behind'
      },
      {
        id: 'goal-3',
        title: 'Improve Sleep Quality',
        category: 'sleep',
        progress: 85,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        milestones: [
          { id: 'm7', title: 'Establish routine', completed: true, completedAt: new Date() },
          { id: 'm8', title: 'No screens before bed', completed: true, completedAt: new Date() },
          { id: 'm9', title: '8 hours consistently', completed: false }
        ],
        trend: 'ahead'
      },
      {
        id: 'goal-4',
        title: 'Journal Daily',
        category: 'mood',
        progress: 45,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        milestones: [],
        trend: 'behind'
      }
    ];
  }, []);

  // Load and analyze wellness data
  const loadInsights = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock data
      const moodEntries = generateMockMoodEntries();
      const goals = generateMockGoals();
      
      // Analyze patterns
      const patterns = insightsEngine.analyzeMoodPatterns(moodEntries, timeRange);
      
      // Identify triggers
      const triggers = insightsEngine.identifyTriggers(moodEntries);
      
      // Analyze coping strategies
      const copingStrategies = insightsEngine.analyzeCopingStrategies(moodEntries);
      
      // Calculate goal progress
      const goalsWithProgress = insightsEngine.calculateGoalProgress(goals, moodEntries, []);
      
      // Assess risk
      const riskAssessment = insightsEngine.assessRisk(patterns, triggers, moodEntries);
      
      // Generate recommendations
      const recommendations = insightsEngine.generateRecommendations(
        patterns,
        triggers,
        copingStrategies,
        goalsWithProgress,
        riskAssessment.level
      );
      
      // Calculate progress metrics
      const progressMetrics = insightsEngine.calculateProgressMetrics(
        patterns,
        triggers,
        copingStrategies,
        goalsWithProgress
      );
      
      // Convert patterns to insight items
      const insights = convertToInsightItems(patterns, triggers, copingStrategies, goalsWithProgress);
      
      setState({
        insights,
        patterns: patterns[0] || null,
        triggers,
        copingStrategies,
        progressMetrics,
        goals: goalsWithProgress,
        recommendations,
        riskLevel: riskAssessment.level,
        loading: false,
        error: null
      });
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading wellness insights:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to load insights')
      }));
    }
  }, [timeRange, generateMockMoodEntries, generateMockGoals]);

  // Convert various data types to unified insight items
  const convertToInsightItems = (
    patterns: Pattern[],
    triggers: Trigger[],
    strategies: CopingStrategy[],
    goals: Goal[]
  ): InsightItem[] => {
    const insights: InsightItem[] = [];
    
    // Add pattern insights
    patterns.forEach(pattern => {
      insights.push({
        id: pattern.id,
        category: 'mood_pattern',
        type: pattern.trend === 'improving' ? 'positive' : 
              pattern.trend === 'declining' ? 'warning' : 'neutral',
        title: `${pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Mood Pattern`,
        description: pattern.insight,
        metric: {
          value: pattern.stability,
          change: 0, // Would calculate from historical data
          label: 'Stability'
        },
        timestamp: new Date()
      });
    });
    
    // Add trigger insights
    if (triggers.length > 0) {
      const topTrigger = triggers[0];
      insights.push({
        id: `insight-trigger-${Date.now()}`,
        category: 'trigger_identification',
        type: topTrigger.impact >= 4 ? 'warning' : 'neutral',
        title: 'Primary Trigger Identified',
        description: `"${topTrigger.name}" has been affecting your mood ${topTrigger.frequency} times recently`,
        metric: {
          value: topTrigger.impact,
          change: 0,
          label: 'Impact Level'
        },
        timestamp: new Date()
      });
    }
    
    // Add coping strategy insights
    if (strategies.length > 0) {
      const bestStrategy = strategies[0];
      insights.push({
        id: `insight-strategy-${Date.now()}`,
        category: 'coping_strategy',
        type: 'positive',
        title: 'Most Effective Strategy',
        description: `"${bestStrategy.name}" has been ${bestStrategy.effectiveness}% effective`,
        metric: {
          value: bestStrategy.effectiveness,
          change: 0,
          label: 'Effectiveness'
        },
        timestamp: new Date()
      });
    }
    
    // Add goal achievement insights
    const completedGoals = goals.filter(g => g.progress >= 100);
    if (completedGoals.length > 0) {
      insights.push({
        id: `insight-goals-${Date.now()}`,
        category: 'goal_progress',
        type: 'achievement',
        title: 'Goal Achievement',
        description: `You've completed ${completedGoals.length} goal${completedGoals.length > 1 ? 's' : ''}!`,
        metric: {
          value: completedGoals.length,
          change: 0,
          label: 'Completed'
        },
        timestamp: new Date()
      });
    }
    
    return insights;
  };

  // Refresh insights
  const refreshInsights = useCallback(async () => {
    await loadInsights();
  }, [loadInsights]);

  // Update time range
  const updateTimeRange = useCallback((range: 'week' | 'month' | 'quarter') => {
    setTimeRange(range);
  }, []);

  // Mark recommendation as actioned
  const markRecommendationActioned = useCallback((recommendationId: string) => {
    setState(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter(r => r.id !== recommendationId)
    }));
  }, []);

  // Update goal progress
  const updateGoalProgress = useCallback((goalId: string, progress: number) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(goal => 
        goal.id === goalId 
          ? { ...goal, progress: Math.min(100, Math.max(0, progress)) }
          : goal
      )
    }));
  }, []);

  // Initial load
  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceRefresh = Date.now() - lastRefresh.getTime();
      if (timeSinceRefresh > 5 * 60 * 1000) {
        refreshInsights();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [lastRefresh, refreshInsights]);

  return {
    ...state,
    refreshInsights,
    updateTimeRange,
    markRecommendationActioned,
    updateGoalProgress
  };
}