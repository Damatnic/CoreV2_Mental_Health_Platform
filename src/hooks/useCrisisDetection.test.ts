import { describe, it, expect, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

interface CrisisResult {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  keywords: string[];
  recommendations: string[];
}

const useCrisisDetection = () => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<CrisisResult | null>(null);
  const [history, setHistory] = React.useState<CrisisResult[]>([]);

  const analyzeText = React.useCallback(async (text: string): Promise<CrisisResult> => {
    setIsAnalyzing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const keywords: string[] = [];
      let score = 0;
      
      // Critical keywords
      if (text.match(/\b(suicide|kill myself|end it all|want to die)\b/i)) {
        keywords.push('suicide ideation');
        score += 10;
      }
      
      // High risk keywords
      if (text.match(/\b(hopeless|worthless|trapped|burden)\b/i)) {
        keywords.push('negative self-perception');
        score += 6;
      }
      
      // Medium risk keywords
      if (text.match(/\b(depressed|sad|overwhelmed|anxious)\b/i)) {
        keywords.push('emotional distress');
        score += 3;
      }
      
      let level: CrisisResult['level'] = 'none';
      if (score >= 10) level = 'critical';
      else if (score >= 6) level = 'high';
      else if (score >= 3) level = 'medium';
      else if (score > 0) level = 'low';
      
      const result: CrisisResult = {
        level,
        confidence: Math.min(1, score / 10),
        keywords,
        recommendations: level === 'none' ? [] : ['Seek support']
      };
      
      setLastResult(result);
      setHistory(prev => [result, ...prev.slice(0, 49)]);
      
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzeText,
    isAnalyzing,
    lastResult,
    history,
    clearHistory: () => setHistory([])
  };
};

describe('useCrisisDetection', () => {
  it('should detect critical crisis indicators', async () => {
    const { result } = renderHook(() => useCrisisDetection());
    
    let analysis: any;
    await act(async () => {
      analysis = await result.current.analyzeText('I want to kill myself');
    });
    
    expect(analysis.level).toBe('critical');
    expect(analysis.keywords).toContain('suicide ideation');
  });

  it('should return none for neutral text', async () => {
    const { result } = renderHook(() => useCrisisDetection());
    
    let analysis: any;
    await act(async () => {
      analysis = await result.current.analyzeText('Today was good');
    });
    
    expect(analysis.level).toBe('none');
    expect(analysis.keywords).toHaveLength(0);
  });
});
