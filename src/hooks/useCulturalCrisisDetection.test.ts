import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const useCulturalCrisisDetection = (culture: string) => {
  const [detectedRisk, setDetectedRisk] = React.useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [culturalFactors, setCulturalFactors] = React.useState<string[]>([]);
  
  const culturalExpressions: Record<string, string[]> = {
    'east-asian': ['压力很大', '想不开', '没面子', 'losing face'],
    'latino': ['no puedo más', 'estoy mal', 'me siento solo'],
    'south-asian': ['बहुत तनाव', 'परेशान', 'tension'],
    'middle-eastern': ['مكتئب', 'حزين', 'قلق']
  };

  const analyzeText = React.useCallback((text: string) => {
    const expressions = culturalExpressions[culture] || [];
    const factors: string[] = [];
    let riskLevel: 'none' | 'low' | 'medium' | 'high' = 'none';

    for (const expr of expressions) {
      if (text.toLowerCase().includes(expr.toLowerCase())) {
        factors.push(expr);
      }
    }

    if (factors.length > 3) riskLevel = 'high';
    else if (factors.length > 1) riskLevel = 'medium';
    else if (factors.length > 0) riskLevel = 'low';

    setCulturalFactors(factors);
    setDetectedRisk(riskLevel);
    
    return { riskLevel, factors };
  }, [culture]);

  const getCulturalResources = React.useCallback(() => {
    const resources: Record<string, string[]> = {
      'east-asian': ['Asian Mental Health Collective', 'NAAPIMHA'],
      'latino': ['Latino Mental Health Association', 'NLBHA'],
      'south-asian': ['South Asian Mental Health Initiative'],
      'middle-eastern': ['AMEMSA resources', 'Cultural healing centers']
    };
    
    return resources[culture] || ['General mental health resources'];
  }, [culture]);

  return {
    detectedRisk,
    culturalFactors,
    analyzeText,
    getCulturalResources
  };
};

describe('useCulturalCrisisDetection', () => {
  it('should detect cultural crisis expressions', () => {
    const { result } = renderHook(() => useCulturalCrisisDetection('east-asian'));
    
    act(() => {
      result.current.analyzeText('I am feeling 压力很大 today');
    });
    
    expect(result.current.detectedRisk).not.toBe('none');
    expect(result.current.culturalFactors).toContain('压力很大');
  });

  it('should return appropriate risk levels', () => {
    const { result } = renderHook(() => useCulturalCrisisDetection('latino'));
    
    act(() => {
      result.current.analyzeText('no puedo más, estoy mal');
    });
    
    expect(result.current.detectedRisk).toBe('medium');
    expect(result.current.culturalFactors).toHaveLength(2);
  });

  it('should provide cultural resources', () => {
    const { result } = renderHook(() => useCulturalCrisisDetection('south-asian'));
    
    const resources = result.current.getCulturalResources();
    expect(resources).toContain('South Asian Mental Health Initiative');
  });

  it('should handle unknown cultures', () => {
    const { result } = renderHook(() => useCulturalCrisisDetection('unknown'));
    
    act(() => {
      result.current.analyzeText('some text');
    });
    
    expect(result.current.detectedRisk).toBe('none');
    expect(result.current.culturalFactors).toHaveLength(0);
  });
});
