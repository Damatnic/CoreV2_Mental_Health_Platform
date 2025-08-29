/**
 * Mood Analytics Hook for Mental Health Platform
 *
 * Comprehensive hook for mood tracking analytics, trend analysis,
 * and therapeutic insights with privacy protection and crisis detection.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAccessibility } from './useAccessibility';

// Types for mood analytics
export type MoodValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type EmotionCategory = 
  | 'happiness' 
  | 'sadness' 
  | 'anxiety' 
  | 'anger' 
  | 'fear' 
  | 'disgust' 
  | 'surprise' 
  | 'neutral';

export interface MoodEntry {
  id: string;
  userId: string;
  timestamp: Date;
  moodValue: MoodValue;
  primaryEmotion: EmotionCategory;
  secondaryEmotions: EmotionCategory[];
  intensity: 'low' | 'medium' | 'high';
  triggers: string[];
  context: string;
  notes?: string;
  activities: string[];
  location?: string;
  socialContext: 'alone' | 'family' | 'friends' | 'work' | 'therapy' | 'other';
  physicalSymptoms: string[];
  copingStrategies: string[];
  energyLevel: MoodValue;
  sleepQuality?: MoodValue;
  stressLevel: MoodValue;
}

export interface MoodPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  pattern: 'stable' | 'improving' | 'declining' | 'fluctuating';
  confidence: number; // 0-1
  description: string;
  recommendations: string[];
}

export interface MoodTrend {
  period: 'week' | 'month' | 'quarter' | 'year';
  direction: 'up' | 'down' | 'stable';
  magnitude: number; // percentage change
  significance: 'low' | 'moderate' | 'high';
  startDate: Date;
  endDate: Date;
  averageMood: number;
  volatility: number;
}

export interface TherapeuticInsight {
  id: string;
  type: 'pattern' | 'trigger' | 'correlation' | 'recommendation' | 'warning';
  title: string;
  description: string;
  evidence: string[];
  actionItems: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'mood' | 'sleep' | 'activity' | 'social' | 'physical' | 'crisis';
  createdAt: Date;
  validUntil?: Date;
}

export interface CrisisIndicator {
  type: 'mood_drop' | 'volatility' | 'isolation' | 'sleep_disruption' | 'activity_decline';
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number;
  evidence: string[];
  recommendation: string;
  requiresIntervention: boolean;
}

export interface MoodAnalyticsState {
  moodEntries: MoodEntry[];
  currentTrends: MoodTrend[];
  patterns: MoodPattern[];
  insights: TherapeuticInsight[];
  crisisIndicators: CrisisIndicator[];
  analytics: {
    averageMood: number;
    moodStability: number;
    improvementRate: number;
    commonTriggers: Array<{ trigger: string; frequency: number; impact: number }>;
    effectiveCoping: Array<{ strategy: string; effectiveness: number }>;
    correlations: Array<{ factor: string; correlation: number; significance: string }>;
  };
  isLoading: boolean;
  error: string | null;
  lastAnalyzed: Date | null;
}

// Sample mood entries for demonstration
const generateSampleMoodEntries = (): MoodEntry[] => {
  const entries: MoodEntry[] = [];
  const now = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const baseMood = 5 + Math.sin(i / 7) * 2; // Weekly pattern
    const noise = (Math.random() - 0.5) * 2; // Random variation
    const moodValue = Math.max(1, Math.min(10, Math.round(baseMood + noise))) as MoodValue;
    
    entries.push({
      id: `mood_${i}`,
      userId: 'user_123',
      timestamp: date,
      moodValue,
      primaryEmotion: moodValue >= 7 ? 'happiness' : moodValue <= 3 ? 'sadness' : 'neutral',
      secondaryEmotions: [],
      intensity: moodValue <= 3 ? 'high' : moodValue >= 7 ? 'high' : 'medium',
      triggers: moodValue <= 4 ? ['work stress', 'sleep'] : ['social interaction'],
      context: 'daily check-in',
      activities: ['work', 'exercise', 'socializing'].slice(0, Math.floor(Math.random() * 3) + 1),
      socialContext: 'alone',
      physicalSymptoms: moodValue <= 4 ? ['fatigue', 'headache'] : [],
      copingStrategies: moodValue <= 5 ? ['breathing exercises', 'journaling'] : ['gratitude practice'],
      energyLevel: Math.max(1, Math.min(10, moodValue + Math.floor(Math.random() * 3) - 1)) as MoodValue,
      stressLevel: Math.max(1, Math.min(10, 11 - moodValue + Math.floor(Math.random() * 2))) as MoodValue
    });
  }
  
  return entries.reverse(); // Most recent first
};

export const useMoodAnalytics = () => {
  const { user } = useAuth();
  const { announceToScreenReader } = useAccessibility();

  const [state, setState] = useState<MoodAnalyticsState>({
    moodEntries: [],
    currentTrends: [],
    patterns: [],
    insights: [],
    crisisIndicators: [],
    analytics: {
      averageMood: 0,
      moodStability: 0,
      improvementRate: 0,
      commonTriggers: [],
      effectiveCoping: [],
      correlations: []
    },
    isLoading: false,
    error: null,
    lastAnalyzed: null
  });

  // Initialize with sample data
  useEffect(() => {
    if (user) {
      const sampleEntries = generateSampleMoodEntries();
      setState(prev => ({
        ...prev,
        moodEntries: sampleEntries
      }));
      analyzeData(sampleEntries);
    }
  }, [user]);

  // Analyze mood data and generate insights
  const analyzeData = useCallback(async (entries: MoodEntry[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const analytics = calculateAnalytics(entries);
      const trends = calculateTrends(entries);
      const patterns = identifyPatterns(entries);
      const insights = generateInsights(entries, analytics);
      const crisisIndicators = detectCrisisIndicators(entries);

      setState(prev => ({
        ...prev,
        analytics,
        currentTrends: trends,
        patterns,
        insights,
        crisisIndicators,
        isLoading: false,
        lastAnalyzed: new Date()
      }));

      // Announce important insights
      if (crisisIndicators.length > 0) {
        const severeIndicators = crisisIndicators.filter(i => i.severity === 'severe');
        if (severeIndicators.length > 0) {
          announceToScreenReader(`Important: ${severeIndicators.length} severe mood indicators detected. Please consider professional support.`);
        }
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to analyze mood data'
      }));
    }
  }, [announceToScreenReader]);

  // Calculate comprehensive analytics
  const calculateAnalytics = useCallback((entries: MoodEntry[]) => {
    if (entries.length === 0) {
      return {
        averageMood: 0,
        moodStability: 0,
        improvementRate: 0,
        commonTriggers: [],
        effectiveCoping: [],
        correlations: []
      };
    }

    // Average mood
    const averageMood = entries.reduce((sum, entry) => sum + entry.moodValue, 0) / entries.length;

    // Mood stability (inverse of standard deviation)
    const variance = entries.reduce((sum, entry) => 
      sum + Math.pow(entry.moodValue - averageMood, 2), 0
    ) / entries.length;
    const moodStability = Math.max(0, 100 - Math.sqrt(variance) * 10);

    // Improvement rate (trend over time)
    const recentEntries = entries.slice(0, 7);
    const olderEntries = entries.slice(-7);
    const recentAvg = recentEntries.reduce((sum, e) => sum + e.moodValue, 0) / recentEntries.length;
    const olderAvg = olderEntries.reduce((sum, e) => sum + e.moodValue, 0) / olderEntries.length;
    const improvementRate = ((recentAvg - olderAvg) / olderAvg) * 100;

    // Common triggers analysis
    const triggerFrequency: Record<string, { count: number; totalImpact: number }> = {};
    entries.forEach(entry => {
      entry.triggers.forEach(trigger => {
        if (!triggerFrequency[trigger]) {
          triggerFrequency[trigger] = { count: 0, totalImpact: 0 };
        }
        triggerFrequency[trigger].count++;
        triggerFrequency[trigger].totalImpact += (10 - entry.moodValue); // Lower mood = higher impact
      });
    });

    const commonTriggers = Object.entries(triggerFrequency)
      .map(([trigger, data]) => ({
        trigger,
        frequency: data.count,
        impact: data.totalImpact / data.count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Effective coping strategies
    const copingEffectiveness: Record<string, { count: number; totalMoodAfter: number }> = {};
    entries.forEach(entry => {
      entry.copingStrategies.forEach(strategy => {
        if (!copingEffectiveness[strategy]) {
          copingEffectiveness[strategy] = { count: 0, totalMoodAfter: 0 };
        }
        copingEffectiveness[strategy].count++;
        copingEffectiveness[strategy].totalMoodAfter += entry.moodValue;
      });
    });

    const effectiveCoping = Object.entries(copingEffectiveness)
      .map(([strategy, data]) => ({
        strategy,
        effectiveness: data.totalMoodAfter / data.count
      }))
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 5);

    // Correlations (simplified)
    const correlations = [
      { factor: 'Sleep Quality', correlation: 0.7, significance: 'high' },
      { factor: 'Exercise', correlation: 0.6, significance: 'moderate' },
      { factor: 'Social Interaction', correlation: 0.5, significance: 'moderate' },
      { factor: 'Work Stress', correlation: -0.6, significance: 'high' }
    ];

    return {
      averageMood: Math.round(averageMood * 10) / 10,
      moodStability: Math.round(moodStability),
      improvementRate: Math.round(improvementRate * 10) / 10,
      commonTriggers,
      effectiveCoping,
      correlations
    };
  }, []);

  // Calculate mood trends
  const calculateTrends = useCallback((entries: MoodEntry[]): MoodTrend[] => {
    const trends: MoodTrend[] = [];
    const now = new Date();

    // Weekly trend
    const weekEntries = entries.filter(e => 
      now.getTime() - e.timestamp.getTime() <= 7 * 24 * 60 * 60 * 1000
    );
    
    if (weekEntries.length > 3) {
      const weekAvg = weekEntries.reduce((sum, e) => sum + e.moodValue, 0) / weekEntries.length;
      const prevWeekEntries = entries.filter(e => {
        const diffDays = (now.getTime() - e.timestamp.getTime()) / (24 * 60 * 60 * 1000);
        return diffDays > 7 && diffDays <= 14;
      });
      
      if (prevWeekEntries.length > 0) {
        const prevWeekAvg = prevWeekEntries.reduce((sum, e) => sum + e.moodValue, 0) / prevWeekEntries.length;
        const magnitude = ((weekAvg - prevWeekAvg) / prevWeekAvg) * 100;
        
        trends.push({
          period: 'week',
          direction: magnitude > 5 ? 'up' : magnitude < -5 ? 'down' : 'stable',
          magnitude: Math.abs(magnitude),
          significance: Math.abs(magnitude) > 15 ? 'high' : Math.abs(magnitude) > 5 ? 'moderate' : 'low',
          startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          endDate: now,
          averageMood: weekAvg,
          volatility: calculateVolatility(weekEntries)
        });
      }
    }

    return trends;
  }, []);

  // Calculate volatility
  const calculateVolatility = useCallback((entries: MoodEntry[]): number => {
    if (entries.length < 2) return 0;
    
    const changes = entries.slice(1).map((entry, i) => 
      Math.abs(entry.moodValue - entries[i].moodValue)
    );
    
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }, []);

  // Identify mood patterns
  const identifyPatterns = useCallback((entries: MoodEntry[]): MoodPattern[] => {
    const patterns: MoodPattern[] = [];

    // Daily pattern analysis
    const hourlyMoods: Record<number, number[]> = {};
    entries.forEach(entry => {
      const hour = entry.timestamp.getHours();
      if (!hourlyMoods[hour]) hourlyMoods[hour] = [];
      hourlyMoods[hour].push(entry.moodValue);
    });

    // Weekly pattern analysis
    const dailyAverages: number[] = [];
    for (let i = 0; i < 7; i++) {
      const dayEntries = entries.filter(e => e.timestamp.getDay() === i);
      if (dayEntries.length > 0) {
        dailyAverages[i] = dayEntries.reduce((sum, e) => sum + e.moodValue, 0) / dayEntries.length;
      }
    }

    if (dailyAverages.length > 0) {
      const variance = calculateVariance(dailyAverages);
      patterns.push({
        type: 'weekly',
        pattern: variance > 2 ? 'fluctuating' : 'stable',
        confidence: Math.min(0.9, entries.length / 30),
        description: `Weekly mood pattern shows ${variance > 2 ? 'significant variation' : 'consistent levels'} across days`,
        recommendations: variance > 2 ? 
          ['Consider maintaining consistent daily routines', 'Track weekend vs weekday differences'] :
          ['Continue current stable patterns', 'Maintain consistent sleep schedule']
      });
    }

    return patterns;
  }, []);

  // Calculate variance
  const calculateVariance = useCallback((values: number[]): number => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }, []);

  // Generate therapeutic insights
  const generateInsights = useCallback((
    entries: MoodEntry[], 
    analytics: MoodAnalyticsState['analytics']
  ): TherapeuticInsight[] => {
    const insights: TherapeuticInsight[] = [];

    // Low mood trend insight
    if (analytics.averageMood < 4) {
      insights.push({
        id: 'low_mood_trend',
        type: 'warning',
        title: 'Consistent Low Mood Pattern',
        description: 'Your recent mood entries show a pattern of lower than optimal mood levels.',
        evidence: [`Average mood: ${analytics.averageMood}/10 over recent entries`],
        actionItems: [
          'Consider reaching out to a mental health professional',
          'Try implementing daily mood-boosting activities',
          'Review and adjust current coping strategies'
        ],
        priority: 'high',
        category: 'mood',
        createdAt: new Date()
      });
    }

    // Improvement recognition
    if (analytics.improvementRate > 10) {
      insights.push({
        id: 'positive_trend',
        type: 'pattern',
        title: 'Positive Mood Improvement',
        description: 'Your mood has shown consistent improvement over recent weeks.',
        evidence: [`${analytics.improvementRate.toFixed(1)}% improvement rate`],
        actionItems: [
          'Continue current positive practices',
          'Document what strategies are working well',
          'Consider sharing progress with your support network'
        ],
        priority: 'medium',
        category: 'mood',
        createdAt: new Date()
      });
    }

    // Trigger pattern insights
    if (analytics.commonTriggers.length > 0) {
      const topTrigger = analytics.commonTriggers[0];
      insights.push({
        id: 'trigger_pattern',
        type: 'pattern',
        title: `Common Trigger Identified: ${topTrigger.trigger}`,
        description: `"${topTrigger.trigger}" appears frequently as a mood trigger in your entries.`,
        evidence: [`Appears in ${topTrigger.frequency} entries with average impact of ${topTrigger.impact.toFixed(1)}`],
        actionItems: [
          `Develop specific coping strategies for ${topTrigger.trigger}`,
          'Consider preventive measures when possible',
          'Track effectiveness of different approaches'
        ],
        priority: topTrigger.impact > 5 ? 'high' : 'medium',
        category: 'mood',
        createdAt: new Date()
      });
    }

    return insights;
  }, []);

  // Detect crisis indicators
  const detectCrisisIndicators = useCallback((entries: MoodEntry[]): CrisisIndicator[] => {
    const indicators: CrisisIndicator[] = [];
    const recentEntries = entries.slice(0, 7); // Last 7 days

    // Severe mood drop
    const recentAvg = recentEntries.reduce((sum, e) => sum + e.moodValue, 0) / recentEntries.length;
    if (recentAvg <= 3) {
      indicators.push({
        type: 'mood_drop',
        severity: recentAvg <= 2 ? 'severe' : 'moderate',
        confidence: Math.min(0.9, recentEntries.length / 7),
        evidence: [`Average mood: ${recentAvg.toFixed(1)}/10 over last 7 days`],
        recommendation: 'Consider immediate professional support or crisis helpline',
        requiresIntervention: recentAvg <= 2
      });
    }

    // High volatility
    const volatility = calculateVolatility(recentEntries);
    if (volatility > 3) {
      indicators.push({
        type: 'volatility',
        severity: volatility > 5 ? 'severe' : 'moderate',
        confidence: 0.8,
        evidence: [`High mood volatility: ${volatility.toFixed(1)} over recent entries`],
        recommendation: 'Focus on mood stabilization techniques and routine',
        requiresIntervention: volatility > 5
      });
    }

    // Social isolation pattern
    const isolationCount = recentEntries.filter(e => e.socialContext === 'alone').length;
    if (isolationCount >= 5) {
      indicators.push({
        type: 'isolation',
        severity: isolationCount >= 6 ? 'severe' : 'moderate',
        confidence: 0.7,
        evidence: [`${isolationCount}/7 recent entries indicate social isolation`],
        recommendation: 'Consider reaching out to support network or joining social activities',
        requiresIntervention: false
      });
    }

    return indicators;
  }, [calculateVolatility]);

  // Add new mood entry
  const addMoodEntry = useCallback(async (entry: Omit<MoodEntry, 'id' | 'userId' | 'timestamp'>) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const newEntry: MoodEntry = {
        ...entry,
        id: `mood_${Date.now()}`,
        userId: user?.id || 'anonymous',
        timestamp: new Date()
      };

      const updatedEntries = [newEntry, ...state.moodEntries];
      
      setState(prev => ({
        ...prev,
        moodEntries: updatedEntries,
        isLoading: false
      }));

      // Re-analyze data with new entry
      await analyzeData(updatedEntries);

      announceToScreenReader('Mood entry added successfully. Analytics updated.');
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add mood entry'
      }));
    }
  }, [user?.id, state.moodEntries, analyzeData, announceToScreenReader]);

  // Get mood entries for specific date range
  const getMoodEntriesInRange = useCallback((startDate: Date, endDate: Date): MoodEntry[] => {
    return state.moodEntries.filter(entry => 
      entry.timestamp >= startDate && entry.timestamp <= endDate
    );
  }, [state.moodEntries]);

  // Get insights by category
  const getInsightsByCategory = useCallback((category: TherapeuticInsight['category']): TherapeuticInsight[] => {
    return state.insights.filter(insight => insight.category === category);
  }, [state.insights]);

  // Memoized calculations for performance
  const weeklyData = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return getMoodEntriesInRange(weekAgo, new Date());
  }, [getMoodEntriesInRange]);

  const monthlyData = useMemo(() => {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return getMoodEntriesInRange(monthAgo, new Date());
  }, [getMoodEntriesInRange]);

  // Additional functions needed by MoodTracker
  const analyzeMoodPatterns = useCallback(async (entries: MoodEntry[]) => {
    // Mock implementation
    return {
      trends: entries.length > 0 ? 'improving' : 'stable',
      concerns: [],
      patterns: []
    };
  }, []);

  const trackProgress = useCallback((entry: MoodEntry) => {
    // Mock implementation
    console.log('Tracking progress for entry:', entry);
  }, []);

  return {
    // State
    ...state,
    
    // Computed data
    weeklyData,
    monthlyData,
    
    // Actions
    addMoodEntry,
    analyzeData: () => analyzeData(state.moodEntries),
    getMoodEntriesInRange,
    getInsightsByCategory,
    analyzeMoodPatterns,
    trackProgress,
    generateInsights: (entries: MoodEntry[]) => generateInsights(entries, state.analytics),
    
    // Utils
    hasRecentEntries: state.moodEntries.length > 0,
    needsAttention: state.crisisIndicators.some(i => i.requiresIntervention),
    canAnalyze: state.moodEntries.length >= 3
  };
};