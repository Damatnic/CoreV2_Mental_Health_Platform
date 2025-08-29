import { describe, it, expect, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

interface CrisisDetectionResult {
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  indicators: string[];
  recommendations: string[];
  immediateAction: boolean;
}

const useEnhancedCrisisDetection = () => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [detectionHistory, setDetectionHistory] = React.useState<CrisisDetectionResult[]>([]);

  // Enhanced crisis keywords with weights
  const crisisKeywords = React.useMemo(() => ({
    critical: [
      { word: 'suicide', weight: 10 },
      { word: 'kill myself', weight: 10 },
      { word: 'end it all', weight: 9 },
      { word: 'better off dead', weight: 9 },
      { word: 'want to die', weight: 8 }
    ],
    high: [
      { word: 'hopeless', weight: 7 },
      { word: 'worthless', weight: 6 },
      { word: 'trapped', weight: 6 },
      { word: 'burden', weight: 5 },
      { word: 'can\'t go on', weight: 7 }
    ],
    medium: [
      { word: 'depressed', weight: 4 },
      { word: 'anxious', weight: 3 },
      { word: 'overwhelmed', weight: 4 },
      { word: 'struggling', weight: 3 },
      { word: 'alone', weight: 4 }
    ]
  }), []);

  const analyzeText = React.useCallback(async (text: string, context?: {
    previousEntries?: string[];
    userHistory?: any[];
    timeOfDay?: string;
  }): Promise<CrisisDetectionResult> => {
    setIsAnalyzing(true);

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const lowerText = text.toLowerCase();
      let totalScore = 0;
      const foundIndicators: string[] = [];
      
      // Analyze keywords
      Object.entries(crisisKeywords).forEach(([level, keywords]) => {
        keywords.forEach(({ word, weight }) => {
          if (lowerText.includes(word)) {
            totalScore += weight;
            foundIndicators.push(`${level}: "${word}"`);
          }
        });
      });

      // Context analysis
      if (context?.previousEntries) {
        const recentNegativePattern = context.previousEntries
          .slice(-3)
          .every(entry => entry.toLowerCase().includes('sad') || entry.toLowerCase().includes('tired'));
        
        if (recentNegativePattern) {
          totalScore += 3;
          foundIndicators.push('pattern: recurring negative mood');
        }
      }

      // Time-based risk factors
      if (context?.timeOfDay === 'night') {
        totalScore += 1;
        foundIndicators.push('contextual: late night entry');
      }

      // Determine risk level
      let riskLevel: CrisisDetectionResult['riskLevel'];
      if (totalScore >= 15) riskLevel = 'critical';
      else if (totalScore >= 10) riskLevel = 'high';
      else if (totalScore >= 5) riskLevel = 'medium';
      else if (totalScore >= 2) riskLevel = 'low';
      else riskLevel = 'none';

      // Calculate confidence
      const confidence = Math.min(1, totalScore / 20);

      // Generate recommendations
      const recommendations = generateRecommendations(riskLevel);

      const result: CrisisDetectionResult = {
        riskLevel,
        confidence: Math.round(confidence * 100) / 100,
        indicators: foundIndicators,
        recommendations,
        immediateAction: riskLevel === 'critical' || riskLevel === 'high'
      };

      // Add to history
      setDetectionHistory(prev => [result, ...prev.slice(0, 49)]); // Keep last 50

      return result;

    } finally {
      setIsAnalyzing(false);
    }
  }, [crisisKeywords]);

  const generateRecommendations = (riskLevel: CrisisDetectionResult['riskLevel']): string[] => {
    switch (riskLevel) {
      case 'critical':
        return [
          'Contact 988 Suicide & Crisis Lifeline immediately',
          'Reach out to your emergency contact',
          'Go to the nearest emergency room',
          'Do not be alone right now'
        ];
      case 'high':
        return [
          'Consider calling 988 for support',
          'Contact your therapist or counselor',
          'Use your safety plan coping strategies',
          'Reach out to a trusted friend or family member'
        ];
      case 'medium':
        return [
          'Practice grounding techniques (5-4-3-2-1 method)',
          'Try deep breathing exercises',
          'Journal about your feelings',
          'Consider speaking with someone you trust'
        ];
      case 'low':
        return [
          'Monitor your mood over the next few days',
          'Practice self-care activities',
          'Maintain healthy sleep and eating habits',
          'Stay connected with supportive people'
        ];
      default:
        return [
          'Continue with regular self-care practices',
          'Keep tracking your mental health'
        ];
    }
  };

  const getRecentTrend = React.useCallback(() => {
    if (detectionHistory.length < 3) return 'insufficient_data';
    
    const recent = detectionHistory.slice(0, 3);
    const riskScores = recent.map(r => {
      switch (r.riskLevel) {
        case 'critical': return 4;
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
      }
    });

    const trend = riskScores[0] - riskScores[2];
    if (trend > 0) return 'worsening';
    if (trend < 0) return 'improving';
    return 'stable';
  }, [detectionHistory]);

  const clearHistory = React.useCallback(() => {
    setDetectionHistory([]);
  }, []);

  const exportDetectionData = React.useCallback(() => {
    return {
      history: detectionHistory,
      exportedAt: new Date().toISOString(),
      totalAnalyses: detectionHistory.length
    };
  }, [detectionHistory]);

  return {
    analyzeText,
    isAnalyzing,
    detectionHistory,
    getRecentTrend,
    clearHistory,
    exportDetectionData
  };
};

describe('useEnhancedCrisisDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.detectionHistory).toEqual([]);
  });

  it('should detect critical crisis indicators', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    let analysisResult: any;
    await act(async () => {
      analysisResult = await result.current.analyzeText('I want to kill myself, I feel hopeless');
    });
    
    expect(analysisResult.riskLevel).toBe('critical');
    expect(analysisResult.immediateAction).toBe(true);
    expect(analysisResult.indicators.length).toBeGreaterThan(0);
  });

  it('should detect medium risk indicators', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    let analysisResult: any;
    await act(async () => {
      analysisResult = await result.current.analyzeText('I feel depressed and overwhelmed lately');
    });
    
    expect(analysisResult.riskLevel).toBe('medium');
    expect(analysisResult.immediateAction).toBe(false);
  });

  it('should return none for neutral text', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    let analysisResult: any;
    await act(async () => {
      analysisResult = await result.current.analyzeText('Today was a good day, feeling positive');
    });
    
    expect(analysisResult.riskLevel).toBe('none');
    expect(analysisResult.confidence).toBeLessThan(0.2);
  });

  it('should consider context from previous entries', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    let analysisResult: any;
    await act(async () => {
      analysisResult = await result.current.analyzeText('feeling tired again', {
        previousEntries: ['I feel so sad today', 'tired of everything', 'sad and tired']
      });
    });
    
    expect(analysisResult.indicators).toContain('pattern: recurring negative mood');
  });

  it('should factor in time of day', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    let analysisResult: any;
    await act(async () => {
      analysisResult = await result.current.analyzeText('feeling sad', {
        timeOfDay: 'night'
      });
    });
    
    expect(analysisResult.indicators).toContain('contextual: late night entry');
  });

  it('should set analyzing state during analysis', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    const analysisPromise = act(async () => {
      return result.current.analyzeText('test text');
    });
    
    // Should be analyzing
    expect(result.current.isAnalyzing).toBe(true);
    
    await analysisPromise;
    
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('should maintain detection history', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    await act(async () => {
      await result.current.analyzeText('first entry - feeling sad');
    });
    
    await act(async () => {
      await result.current.analyzeText('second entry - still sad');
    });
    
    expect(result.current.detectionHistory).toHaveLength(2);
  });

  it('should calculate recent trend', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    await act(async () => {
      await result.current.analyzeText('feeling okay');
      await result.current.analyzeText('feeling sad');
      await result.current.analyzeText('feeling hopeless and worthless');
    });
    
    const trend = result.current.getRecentTrend();
    expect(trend).toBe('worsening');
  });

  it('should clear detection history', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    await act(async () => {
      await result.current.analyzeText('test entry');
    });
    
    expect(result.current.detectionHistory).toHaveLength(1);
    
    act(() => {
      result.current.clearHistory();
    });
    
    expect(result.current.detectionHistory).toHaveLength(0);
  });

  it('should export detection data', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    await act(async () => {
      await result.current.analyzeText('test entry');
    });
    
    const exportedData = result.current.exportDetectionData();
    
    expect(exportedData).toHaveProperty('history');
    expect(exportedData).toHaveProperty('exportedAt');
    expect(exportedData).toHaveProperty('totalAnalyses');
    expect(exportedData.totalAnalyses).toBe(1);
  });

  it('should limit history to 50 entries', async () => {
    const { result } = renderHook(() => useEnhancedCrisisDetection());
    
    // Add 52 entries
    for (let i = 0; i < 52; i++) {
      await act(async () => {
        await result.current.analyzeText(`entry ${i}`);
      });
    }
    
    expect(result.current.detectionHistory).toHaveLength(50);
  });
});
