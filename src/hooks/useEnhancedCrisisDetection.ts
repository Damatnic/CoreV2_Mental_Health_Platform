/**
 * Enhanced Crisis Detection Hook
 *
 * React hook for integrating enhanced AI crisis detection with machine learning capabilities,
 * real-time risk assessment, and cultural context awareness.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface EmotionalState {
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0 to 1 (calm to excited)
  dominance: number; // 0 to 1 (submissive to dominant)
  timestamp: number;
  confidence?: number;
}

export interface MLCrisisAnalysisResult {
  riskLevel: number; // 0-10 scale
  confidence: number; // 0-1 scale
  riskFactors: string[];
  emotionalState: EmotionalState;
  interventionRecommendations: string[];
  culturalContext?: string;
  immediateAction: boolean;
  escalationRequired: boolean;
  mlModelVersion: string;
  analysisId: string;
  timestamp: number;
}

export interface EnhancedCrisisDetectionState {
  isAnalyzing: boolean;
  lastAnalysis: MLCrisisAnalysisResult | null;
  emotionalHistory: EmotionalState[];
  riskTrend: number[];
  interventionSuggestions: string[];
  analysisHistory: MLCrisisAnalysisResult[];
  modelMetrics: {
    accuracy: number;
    confidence: number;
    totalAnalyses: number;
  };
}

export interface EnhancedCrisisDetectionOptions {
  enableMLAnalysis?: boolean;
  enableEmotionalTracking?: boolean;
  enableCulturalContext?: boolean;
  autoAnalyze?: boolean;
  minAnalysisLength?: number;
  maxHistorySize?: number;
  debounceMs?: number;
  emotionalHistoryLimit?: number;
  riskTrendWindow?: number;
  confidenceThreshold?: number;
  onCrisisDetected?: (result: MLCrisisAnalysisResult) => void;
  onEmotionalStateChange?: (state: EmotionalState) => void;
  onRiskTrendChange?: (trend: number[]) => void;
  onInterventionSuggested?: (suggestions: string[]) => void;
}

export interface CrisisAlert {
  show: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actions: string[];
  resources: string[];
  emergencyMode: boolean;
  culturallyAppropriate: boolean;
}

export interface InterventionRecommendation {
  type: 'immediate' | 'short-term' | 'long-term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  description: string;
  resources: string[];
  culturalConsiderations?: string[];
  estimatedEffectiveness: number; // 0-1 scale
}

const DEFAULT_OPTIONS: Required<Omit<EnhancedCrisisDetectionOptions, 
  'onCrisisDetected' | 'onEmotionalStateChange' | 'onRiskTrendChange' | 'onInterventionSuggested'>> = {
  enableMLAnalysis: true,
  enableEmotionalTracking: true,
  enableCulturalContext: true,
  autoAnalyze: true,
  minAnalysisLength: 10,
  maxHistorySize: 100,
  debounceMs: 1000,
  emotionalHistoryLimit: 50,
  riskTrendWindow: 10,
  confidenceThreshold: 0.7
};

/**
 * Hook for enhanced crisis detection with ML capabilities
 */
export const useEnhancedCrisisDetection = (
  options: EnhancedCrisisDetectionOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<EnhancedCrisisDetectionState>({
    isAnalyzing: false,
    lastAnalysis: null,
    emotionalHistory: [],
    riskTrend: [],
    interventionSuggestions: [],
    analysisHistory: [],
    modelMetrics: {
      accuracy: 0,
      confidence: 0,
      totalAnalyses: 0
    }
  });

  const [alert, setAlert] = useState<CrisisAlert>({
    show: false,
    severity: 'none',
    message: '',
    actions: [],
    resources: [],
    emergencyMode: false,
    culturallyAppropriate: true
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const analysisCountRef = useRef(0);
  const mlServiceRef = useRef<any>(null);

  /**
   * Initialize ML service
   */
  const initializeMLService = useCallback(async () => {
    if (!opts.enableMLAnalysis) return;

    try {
      // Dynamically import ML service to avoid bundle bloat
      const { enhancedAICrisisDetectionService } = await import('../services/enhancedAiCrisisDetectionService');
      mlServiceRef.current = enhancedAICrisisDetectionService;
    } catch (error) {
      console.warn('Enhanced AI Crisis Detection service not available:', error);
    }
  }, [opts.enableMLAnalysis]);

  /**
   * Calculate emotional state from text analysis
   */
  const calculateEmotionalState = useCallback((text: string): EmotionalState => {
    // Simplified emotional analysis - in production this would use NLP models
    const words = text.toLowerCase().split(/\s+/);
    
    // Sentiment analysis (valence)
    const positiveWords = ['happy', 'joy', 'love', 'great', 'wonderful', 'amazing', 'good', 'better', 'hope'];
    const negativeWords = ['sad', 'hate', 'terrible', 'awful', 'bad', 'worse', 'hopeless', 'depressed', 'anxious'];
    
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    const totalSentimentWords = positiveCount + negativeCount;
    
    const valence = totalSentimentWords > 0 
      ? (positiveCount - negativeCount) / totalSentimentWords 
      : 0;

    // Arousal analysis (energy level)
    const highArousalWords = ['excited', 'panic', 'rage', 'ecstatic', 'furious', 'thrilled'];
    const lowArousalWords = ['calm', 'peaceful', 'tired', 'sleepy', 'relaxed', 'quiet'];
    
    const highArousalCount = words.filter(word => highArousalWords.includes(word)).length;
    const lowArousalCount = words.filter(word => lowArousalWords.includes(word)).length;
    const totalArousalWords = highArousalCount + lowArousalCount;
    
    const arousal = totalArousalWords > 0 
      ? highArousalCount / totalArousalWords 
      : 0.5;

    // Dominance analysis (control/power)
    const dominantWords = ['control', 'power', 'strong', 'confident', 'leader'];
    const submissiveWords = ['helpless', 'weak', 'powerless', 'controlled', 'victim'];
    
    const dominantCount = words.filter(word => dominantWords.includes(word)).length;
    const submissiveCount = words.filter(word => submissiveWords.includes(word)).length;
    const totalDominanceWords = dominantCount + submissiveCount;
    
    const dominance = totalDominanceWords > 0 
      ? dominantCount / totalDominanceWords 
      : 0.5;

    return {
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      dominance: Math.max(0, Math.min(1, dominance)),
      timestamp: Date.now(),
      confidence: Math.min(1, totalSentimentWords / 10) // Higher confidence with more sentiment words
    };
  }, []);

  /**
   * Update emotional history
   */
  const updateEmotionalHistory = useCallback((emotionalState: EmotionalState) => {
    setState(prev => {
      const newHistory = [...prev.emotionalHistory, emotionalState]
        .slice(-opts.emotionalHistoryLimit);
      
      return {
        ...prev,
        emotionalHistory: newHistory
      };
    });

    // Notify listeners
    if (options.onEmotionalStateChange) {
      options.onEmotionalStateChange(emotionalState);
    }
  }, [opts.emotionalHistoryLimit, options.onEmotionalStateChange]);

  /**
   * Update risk trend
   */
  const updateRiskTrend = useCallback((riskLevel: number) => {
    setState(prev => {
      const newTrend = [...prev.riskTrend, riskLevel]
        .slice(-opts.riskTrendWindow);
      
      // Notify listeners
      if (options.onRiskTrendChange) {
        options.onRiskTrendChange(newTrend);
      }
      
      return {
        ...prev,
        riskTrend: newTrend
      };
    });
  }, [opts.riskTrendWindow, options.onRiskTrendChange]);

  /**
   * Generate intervention recommendations based on analysis
   */
  const generateInterventionRecommendations = useCallback((
    analysis: MLCrisisAnalysisResult
  ): InterventionRecommendation[] => {
    const recommendations: InterventionRecommendation[] = [];

    // Immediate interventions for high risk
    if (analysis.riskLevel >= 7) {
      recommendations.push({
        type: 'immediate',
        priority: 'critical',
        action: 'Contact Crisis Hotline',
        description: 'Immediate professional support is recommended',
        resources: ['988 Suicide & Crisis Lifeline', 'Emergency Services: 911'],
        estimatedEffectiveness: 0.9
      });
    }

    // Emotional state-based recommendations
    if (analysis.emotionalState.valence < -0.5) {
      recommendations.push({
        type: 'short-term',
        priority: 'high',
        action: 'Mood Improvement Activities',
        description: 'Engage in activities that can help improve mood',
        resources: ['Guided meditation', 'Physical exercise', 'Social connection'],
        estimatedEffectiveness: 0.7
      });
    }

    if (analysis.emotionalState.arousal > 0.8) {
      recommendations.push({
        type: 'immediate',
        priority: 'medium',
        action: 'Calming Techniques',
        description: 'Use techniques to reduce high emotional arousal',
        resources: ['Deep breathing exercises', 'Progressive muscle relaxation'],
        estimatedEffectiveness: 0.8
      });
    }

    // Long-term recommendations
    if (analysis.riskLevel >= 4) {
      recommendations.push({
        type: 'long-term',
        priority: 'medium',
        action: 'Professional Support',
        description: 'Consider ongoing professional mental health support',
        resources: ['Therapy', 'Counseling', 'Support groups'],
        estimatedEffectiveness: 0.85
      });
    }

    return recommendations;
  }, []);

  /**
   * Update crisis alert based on analysis
   */
  const updateCrisisAlert = useCallback((analysis: MLCrisisAnalysisResult) => {
    let severity: CrisisAlert['severity'] = 'none';
    let message = '';
    let actions: string[] = [];
    let resources: string[] = [];
    let emergencyMode = false;

    if (analysis.riskLevel >= 8) {
      severity = 'critical';
      message = 'Critical mental health crisis detected. Immediate action required.';
      actions = ['Contact Emergency Services', 'Call Crisis Hotline', 'Reach Out to Support Person'];
      resources = ['911', '988 Suicide & Crisis Lifeline', 'Crisis Text Line: Text HOME to 741741'];
      emergencyMode = true;
    } else if (analysis.riskLevel >= 6) {
      severity = 'high';
      message = 'High risk situation detected. Professional support recommended.';
      actions = ['Contact Mental Health Professional', 'Call Crisis Hotline', 'Use Coping Strategies'];
      resources = ['988 Suicide & Crisis Lifeline', 'Crisis Text Line: Text HOME to 741741'];
    } else if (analysis.riskLevel >= 4) {
      severity = 'medium';
      message = 'Elevated mental health concerns detected. Consider additional support.';
      actions = ['Practice Self-Care', 'Reach Out to Support Person', 'Use Coping Tools'];
      resources = ['Self-care activities', 'Support network', 'Coping strategies'];
    } else if (analysis.riskLevel >= 2) {
      severity = 'low';
      message = 'Some mental health concerns noted. Monitor and practice self-care.';
      actions = ['Practice Self-Care', 'Monitor Mood', 'Stay Connected'];
      resources = ['Self-care activities', 'Mood tracking', 'Social connections'];
    }

    setAlert({
      show: severity !== 'none',
      severity,
      message,
      actions,
      resources,
      emergencyMode,
      culturallyAppropriate: true // Would be determined by cultural context analysis
    });
  }, []);

  /**
   * Perform enhanced crisis analysis
   */
  const analyzeForCrisis = useCallback(async (
    text: string,
    userContext?: any
  ): Promise<MLCrisisAnalysisResult | null> => {
    if (!text || text.length < opts.minAnalysisLength) {
      return null;
    }

    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      let analysis: MLCrisisAnalysisResult;

      if (opts.enableMLAnalysis && mlServiceRef.current) {
        // Use ML service for analysis
        analysis = await mlServiceRef.current.analyzeText(text, {
          enableCulturalContext: opts.enableCulturalContext,
          userContext
        });
      } else {
        // Fallback to basic analysis
        const emotionalState = opts.enableEmotionalTracking 
          ? calculateEmotionalState(text)
          : {
              valence: 0,
              arousal: 0.5,
              dominance: 0.5,
              timestamp: Date.now(),
              confidence: 0.5
            };

        // Basic risk calculation
        const riskLevel = Math.max(0, Math.min(10, 
          (Math.abs(emotionalState.valence) * 5) + 
          (emotionalState.arousal > 0.8 ? 3 : 0) +
          (emotionalState.dominance < 0.2 ? 2 : 0)
        ));

        analysis = {
          riskLevel,
          confidence: emotionalState.confidence || 0.5,
          riskFactors: [],
          emotionalState,
          interventionRecommendations: [],
          immediateAction: riskLevel >= 7,
          escalationRequired: riskLevel >= 8,
          mlModelVersion: 'basic-v1.0',
          analysisId: `analysis-${Date.now()}`,
          timestamp: Date.now()
        };
      }

      // Update state
      setState(prev => {
        const newHistory = [...prev.analysisHistory, analysis]
          .slice(-opts.maxHistorySize);

        const newMetrics = {
          accuracy: prev.modelMetrics.accuracy, // Would be updated based on feedback
          confidence: (prev.modelMetrics.confidence * prev.modelMetrics.totalAnalyses + analysis.confidence) / 
                     (prev.modelMetrics.totalAnalyses + 1),
          totalAnalyses: prev.modelMetrics.totalAnalyses + 1
        };

        return {
          ...prev,
          isAnalyzing: false,
          lastAnalysis: analysis,
          analysisHistory: newHistory,
          modelMetrics: newMetrics
        };
      });

      // Update emotional history if tracking is enabled
      if (opts.enableEmotionalTracking) {
        updateEmotionalHistory(analysis.emotionalState);
      }

      // Update risk trend
      updateRiskTrend(analysis.riskLevel);

      // Generate and update intervention suggestions
      const interventions = generateInterventionRecommendations(analysis);
      const suggestions = interventions.map(i => i.action);
      
      setState(prev => ({ ...prev, interventionSuggestions: suggestions }));
      
      if (options.onInterventionSuggested) {
        options.onInterventionSuggested(suggestions);
      }

      // Update crisis alert
      updateCrisisAlert(analysis);

      // Notify listeners
      if (options.onCrisisDetected && analysis.riskLevel >= 3) {
        options.onCrisisDetected(analysis);
      }

      analysisCountRef.current += 1;
      return analysis;

    } catch (error) {
      console.error('Crisis analysis failed:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
      return null;
    }
  }, [
    opts.minAnalysisLength,
    opts.enableMLAnalysis,
    opts.enableEmotionalTracking,
    opts.enableCulturalContext,
    opts.maxHistorySize,
    calculateEmotionalState,
    updateEmotionalHistory,
    updateRiskTrend,
    generateInterventionRecommendations,
    updateCrisisAlert,
    options.onCrisisDetected,
    options.onInterventionSuggested
  ]);

  /**
   * Debounced analysis for auto-analysis
   */
  const debouncedAnalyze = useCallback((text: string, userContext?: any) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      analyzeForCrisis(text, userContext);
    }, opts.debounceMs);
  }, [analyzeForCrisis, opts.debounceMs]);

  /**
   * Analyze text immediately or with debouncing
   */
  const analyze = useCallback((text: string, userContext?: any, immediate = false) => {
    if (immediate || !opts.autoAnalyze) {
      return analyzeForCrisis(text, userContext);
    } else {
      debouncedAnalyze(text, userContext);
      return Promise.resolve(null);
    }
  }, [analyzeForCrisis, debouncedAnalyze, opts.autoAnalyze]);

  /**
   * Clear analysis history
   */
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      analysisHistory: [],
      emotionalHistory: [],
      riskTrend: [],
      interventionSuggestions: []
    }));
  }, []);

  /**
   * Dismiss crisis alert
   */
  const dismissAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, show: false }));
  }, []);

  /**
   * Get risk trend analysis
   */
  const getRiskTrendAnalysis = useCallback(() => {
    const { riskTrend } = state;
    if (riskTrend.length < 2) return null;

    const recent = riskTrend.slice(-5);
    const average = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const trend = recent.length >= 3 
      ? recent[recent.length - 1] - recent[0]
      : 0;

    return {
      current: riskTrend[riskTrend.length - 1],
      average,
      trend: trend > 0.5 ? 'increasing' : trend < -0.5 ? 'decreasing' : 'stable',
      trendValue: trend
    };
  }, [state.riskTrend]);

  /**
   * Get emotional pattern analysis
   */
  const getEmotionalPatterns = useCallback(() => {
    const { emotionalHistory } = state;
    if (emotionalHistory.length < 5) return null;

    const recent = emotionalHistory.slice(-10);
    
    const avgValence = recent.reduce((sum, e) => sum + e.valence, 0) / recent.length;
    const avgArousal = recent.reduce((sum, e) => sum + e.arousal, 0) / recent.length;
    const avgDominance = recent.reduce((sum, e) => sum + e.dominance, 0) / recent.length;

    return {
      averageValence: avgValence,
      averageArousal: avgArousal,
      averageDominance: avgDominance,
      volatility: {
        valence: Math.sqrt(recent.reduce((sum, e) => sum + Math.pow(e.valence - avgValence, 2), 0) / recent.length),
        arousal: Math.sqrt(recent.reduce((sum, e) => sum + Math.pow(e.arousal - avgArousal, 2), 0) / recent.length),
        dominance: Math.sqrt(recent.reduce((sum, e) => sum + Math.pow(e.dominance - avgDominance, 2), 0) / recent.length)
      }
    };
  }, [state.emotionalHistory]);

  // Initialize ML service on mount
  useEffect(() => {
    initializeMLService();
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [initializeMLService]);

  return {
    // State
    ...state,
    alert,
    
    // Actions
    analyze,
    clearHistory,
    dismissAlert,
    
    // Analysis
    getRiskTrendAnalysis,
    getEmotionalPatterns,
    
    // Computed values
    isHighRisk: state.lastAnalysis?.riskLevel >= 6,
    needsIntervention: state.lastAnalysis?.immediateAction || false,
    analysisCount: analysisCountRef.current
  };
};
