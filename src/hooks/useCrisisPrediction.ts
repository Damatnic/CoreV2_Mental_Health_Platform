/**
 * Crisis Prediction Hook
 * Manages state and interactions with the Crisis Prediction ML service
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import crisisPredictionML, { 
  CrisisRiskAssessment, 
  TimeSeriesData, 
  BehavioralPattern,
  TextAnalysisResult 
} from '../services/ml/crisisPredictionML';

interface UseCrisisPredictionOptions {
  autoUpdate?: boolean;
  updateInterval?: number; // milliseconds
  includeHistorical?: boolean;
  timeWindow?: number; // hours
}

interface EthicalStatus {
  allPassed: boolean;
  checks: Array<{
    type: string;
    status: 'passed' | 'failed' | 'review_required';
    message: string;
  }>;
}

interface ModelPerformance {
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastUpdated: string;
  totalPredictions: number;
}

export const useCrisisPrediction = (
  userId: string,
  options: UseCrisisPredictionOptions = {}
) => {
  const {
    autoUpdate = true,
    updateInterval = 300000, // 5 minutes default
    includeHistorical = true,
    timeWindow = 168 // 7 days default
  } = options;

  // State management
  const [currentAssessment, setCurrentAssessment] = useState<CrisisRiskAssessment | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<CrisisRiskAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ethicalStatus, setEthicalStatus] = useState<EthicalStatus | null>(null);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance | null>(null);
  
  // Refs for managing subscriptions and intervals
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mlServiceInitialized = useRef(false);
  const activeDataFetches = useRef(new Set<string>());

  /**
   * Initialize ML service and set up event listeners
   */
  useEffect(() => {
    const initializeService = async () => {
      if (!mlServiceInitialized.current) {
        try {
          await crisisPredictionML.initialize();
          mlServiceInitialized.current = true;
          
          // Set up event listeners
          crisisPredictionML.on('risk-assessed', handleRiskAssessed);
          crisisPredictionML.on('high-risk-detected', handleHighRiskDetected);
          crisisPredictionML.on('human-review-required', handleHumanReviewRequired);
          crisisPredictionML.on('health-check', handleHealthCheck);
          
          // Initial prediction
          await updatePrediction();
        } catch (err) {
          console.error('Failed to initialize crisis prediction service:', err);
          setError('Failed to initialize prediction service');
        }
      }
    };

    initializeService();

    // Cleanup
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      
      // Remove event listeners
      crisisPredictionML.off('risk-assessed', handleRiskAssessed);
      crisisPredictionML.off('high-risk-detected', handleHighRiskDetected);
      crisisPredictionML.off('human-review-required', handleHumanReviewRequired);
      crisisPredictionML.off('health-check', handleHealthCheck);
    };
  }, [userId]);

  /**
   * Set up auto-update interval
   */
  useEffect(() => {
    if (autoUpdate && updateInterval > 0) {
      updateIntervalRef.current = setInterval(() => {
        updatePrediction();
      }, updateInterval);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [autoUpdate, updateInterval]);

  /**
   * Fetch user data for prediction
   */
  const fetchUserData = useCallback(async () => {
    // Prevent duplicate fetches
    const fetchId = `${userId}-${Date.now()}`;
    if (activeDataFetches.current.has(userId)) {
      return null;
    }
    
    activeDataFetches.current.add(fetchId);

    try {
      // In production, these would be actual API calls
      // For now, return mock data
      const moodHistory: TimeSeriesData[] = await fetchMoodHistory(userId, timeWindow);
      const textEntries: string[] = await fetchTextEntries(userId, timeWindow);
      const behavioralData: BehavioralPattern[] = await fetchBehavioralData(userId);
      const sleepData: TimeSeriesData[] = await fetchSleepData(userId, timeWindow);
      const activityData: TimeSeriesData[] = await fetchActivityData(userId, timeWindow);
      const socialInteractions = await fetchSocialInteractions(userId, timeWindow);

      return {
        moodHistory,
        textEntries,
        behavioralData,
        sleepData,
        activityData,
        socialInteractions
      };
    } finally {
      activeDataFetches.current.delete(fetchId);
    }
  }, [userId, timeWindow]);

  /**
   * Update crisis prediction
   */
  const updatePrediction = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch latest user data
      const userData = await fetchUserData();
      
      if (!userData) {
        throw new Error('Unable to fetch user data');
      }

      // Generate prediction
      const assessment = await crisisPredictionML.predictCrisisRisk(
        userId,
        userData,
        {
          includeHistorical,
          timeWindow
        }
      );

      setCurrentAssessment(assessment);
      
      // Update history
      setAssessmentHistory(prev => {
        const updated = [...prev, assessment];
        // Keep only last 100 assessments
        if (updated.length > 100) {
          return updated.slice(-100);
        }
        return updated;
      });

      // Update ethical status
      setEthicalStatus({
        allPassed: !assessment.requiresHumanReview,
        checks: [] // Would be populated from the service
      });

    } catch (err) {
      console.error('Failed to update prediction:', err);
      setError(err instanceof Error ? err.message : 'Failed to update prediction');
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchUserData, includeHistorical, timeWindow, isLoading]);

  /**
   * Analyze text input for crisis indicators
   */
  const analyzeText = useCallback(async (text: string): Promise<TextAnalysisResult | null> => {
    try {
      return await crisisPredictionML.analyzeText(text);
    } catch (err) {
      console.error('Failed to analyze text:', err);
      return null;
    }
  }, []);

  /**
   * Report false positive
   */
  const reportFalsePositive = useCallback(async (
    actualRiskLevel: 'low' | 'moderate' | 'high',
    notes?: string
  ) => {
    if (!currentAssessment) return;

    try {
      await crisisPredictionML.handleFalsePositive(
        `${currentAssessment.userId}-${currentAssessment.timestamp}`,
        currentAssessment.userId,
        {
          actualRisk: actualRiskLevel,
          notes,
          correctiveAction: 'User feedback'
        }
      );
      
      // Refresh prediction with adjusted model
      await updatePrediction();
    } catch (err) {
      console.error('Failed to report false positive:', err);
      setError('Failed to report false positive');
    }
  }, [currentAssessment, updatePrediction]);

  /**
   * Request human review
   */
  const requestHumanReview = useCallback(async (reviewer?: string) => {
    if (!currentAssessment) return null;

    try {
      const review = await crisisPredictionML.requestHumanReview(
        currentAssessment,
        reviewer
      );
      return review;
    } catch (err) {
      console.error('Failed to request human review:', err);
      return null;
    }
  }, [currentAssessment]);

  /**
   * Get model performance metrics
   */
  const getModelPerformance = useCallback((): ModelPerformance => {
    // In production, this would fetch from the service
    return {
      version: '1.0.0',
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.88,
      f1Score: 0.85,
      lastUpdated: new Date().toISOString(),
      totalPredictions: assessmentHistory.length
    };
  }, [assessmentHistory.length]);

  /**
   * Get risk trend over time
   */
  const getRiskTrend = useCallback((
    period: '24h' | '7d' | '30d'
  ): 'improving' | 'stable' | 'worsening' => {
    if (assessmentHistory.length < 2) return 'stable';

    const now = Date.now();
    const periodMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const cutoff = now - periodMs[period];
    const recentAssessments = assessmentHistory.filter(a => 
      new Date(a.timestamp).getTime() > cutoff
    );

    if (recentAssessments.length < 2) return 'stable';

    // Calculate trend
    const firstHalf = recentAssessments.slice(0, Math.floor(recentAssessments.length / 2));
    const secondHalf = recentAssessments.slice(Math.floor(recentAssessments.length / 2));

    const firstAvg = firstHalf.reduce((sum, a) => sum + a.riskScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, a) => sum + a.riskScore, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 5) return 'worsening';
    if (secondAvg < firstAvg - 5) return 'improving';
    return 'stable';
  }, [assessmentHistory]);

  // Event handlers
  const handleRiskAssessed = useCallback((assessment: CrisisRiskAssessment) => {
    if (assessment.userId === userId) {
      console.log('Risk assessed:', assessment);
    }
  }, [userId]);

  const handleHighRiskDetected = useCallback((assessment: CrisisRiskAssessment) => {
    if (assessment.userId === userId) {
      console.warn('High risk detected:', assessment);
      // In production, trigger appropriate alerts
    }
  }, [userId]);

  const handleHumanReviewRequired = useCallback((assessment: CrisisRiskAssessment) => {
    if (assessment.userId === userId) {
      console.log('Human review required:', assessment);
      // In production, notify appropriate personnel
    }
  }, [userId]);

  const handleHealthCheck = useCallback((health: any) => {
    // Update model performance metrics
    if (health.accuracy) {
      setModelPerformance(prev => ({
        ...prev!,
        accuracy: health.accuracy
      }));
    }
  }, []);

  return {
    // State
    currentAssessment,
    assessmentHistory,
    isLoading,
    error,
    ethicalStatus,
    
    // Actions
    updatePrediction,
    analyzeText,
    reportFalsePositive,
    requestHumanReview,
    
    // Utilities
    getModelPerformance,
    getRiskTrend
  };
};

// Mock data fetching functions (in production, these would be actual API calls)

async function fetchMoodHistory(userId: string, hours: number): Promise<TimeSeriesData[]> {
  // Mock implementation
  const data: TimeSeriesData[] = [];
  const now = Date.now();
  const interval = 4 * 60 * 60 * 1000; // 4 hours
  
  for (let i = 0; i < hours / 4; i++) {
    data.push({
      timestamp: new Date(now - i * interval),
      value: Math.random() * 10,
      type: 'mood'
    });
  }
  
  return data;
}

async function fetchTextEntries(userId: string, hours: number): Promise<string[]> {
  // Mock implementation
  return [
    "Feeling a bit down today",
    "Had a good therapy session",
    "Struggling with anxiety",
    "Feeling more hopeful"
  ];
}

async function fetchBehavioralData(userId: string): Promise<BehavioralPattern[]> {
  // Mock implementation
  return [
    {
      patternId: 'pattern-1',
      type: 'sleep_disruption',
      frequency: 3,
      severity: 0.6,
      duration: 7,
      lastOccurrence: new Date(),
      trend: 'stable'
    },
    {
      patternId: 'pattern-2',
      type: 'social_withdrawal',
      frequency: 2,
      severity: 0.4,
      duration: 3,
      lastOccurrence: new Date(Date.now() - 24 * 60 * 60 * 1000),
      trend: 'improving'
    }
  ];
}

async function fetchSleepData(userId: string, hours: number): Promise<TimeSeriesData[]> {
  // Mock implementation
  const data: TimeSeriesData[] = [];
  const now = Date.now();
  const interval = 24 * 60 * 60 * 1000; // Daily
  
  for (let i = 0; i < hours / 24; i++) {
    data.push({
      timestamp: new Date(now - i * interval),
      value: 5 + Math.random() * 4, // 5-9 hours
      type: 'sleep_hours'
    });
  }
  
  return data;
}

async function fetchActivityData(userId: string, hours: number): Promise<TimeSeriesData[]> {
  // Mock implementation
  const data: TimeSeriesData[] = [];
  const now = Date.now();
  const interval = 24 * 60 * 60 * 1000; // Daily
  
  for (let i = 0; i < hours / 24; i++) {
    data.push({
      timestamp: new Date(now - i * interval),
      value: Math.random() * 10000, // Steps
      type: 'steps'
    });
  }
  
  return data;
}

async function fetchSocialInteractions(userId: string, hours: number): Promise<any[]> {
  // Mock implementation
  return [
    { type: 'message', count: 5, timestamp: new Date() },
    { type: 'call', count: 2, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  ];
}

export default useCrisisPrediction;