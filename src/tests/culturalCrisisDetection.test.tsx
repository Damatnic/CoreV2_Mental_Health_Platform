import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';

interface CulturalContext {
  culture: string;
  language: string;
  expressions: string[];
}

const CulturalCrisisDetector: React.FC<{ context: CulturalContext }> = ({ context }) => {
  const detectCulturalCrisis = (text: string): boolean => {
    return context.expressions.some(expr => 
      text.toLowerCase().includes(expr.toLowerCase())
    );
  };

  return (
    <div>
      <h2>Cultural Crisis Detection for {context.culture}</h2>
      <p>Language: {context.language}</p>
      <p>Active monitoring for culturally-specific expressions</p>
    </div>
  );
};

describe('CulturalCrisisDetection', () => {
  const mockContext: CulturalContext = {
    culture: 'East Asian',
    language: 'zh-CN',
    expressions: ['压力很大', '想不开', '没面子']
  };

  it('should render cultural context', () => {
    render(<CulturalCrisisDetector context={mockContext} />);
    expect(screen.getByText(/East Asian/)).toBeDefined();
  });

  it('should display language info', () => {
    render(<CulturalCrisisDetector context={mockContext} />);
    expect(screen.getByText(/zh-CN/)).toBeDefined();
  });

  it('should handle multiple cultures', () => {
    const contexts: CulturalContext[] = [
      { culture: 'Latino', language: 'es', expressions: ['no puedo más'] },
      { culture: 'South Asian', language: 'hi', expressions: ['बहुत तनाव'] }
    ];

    contexts.forEach(ctx => {
      const { unmount } = render(<CulturalCrisisDetector context={ctx} />);
      expect(screen.getByText(new RegExp(ctx.culture))).toBeDefined();
      unmount();
    });
  });
});
