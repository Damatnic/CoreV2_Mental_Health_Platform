import { describe, it, expect, jest, beforeEach } from '@jest/globals';

interface KeywordMatch {
  keyword: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

class EnhancedCrisisKeywordDetectionService {
  private keywords: Map<string, { severity: string; patterns: string[] }> = new Map();

  constructor() {
    this.initializeKeywords();
  }

  private initializeKeywords() {
    this.keywords.set('suicide', {
      severity: 'critical',
      patterns: ['suicide', 'kill myself', 'end my life', 'want to die']
    });
    
    this.keywords.set('self-harm', {
      severity: 'high',
      patterns: ['cutting', 'hurt myself', 'self harm', 'pain helps']
    });

    this.keywords.set('anxiety', {
      severity: 'medium',
      patterns: ['panic', 'cant breathe', 'anxiety attack', 'freaking out']
    });

    this.keywords.set('depression', {
      severity: 'medium',
      patterns: ['depressed', 'hopeless', 'worthless', 'no point']
    });
  }

  detectKeywords(text: string): KeywordMatch[] {
    const matches: KeywordMatch[] = [];
    const lowerText = text.toLowerCase();

    for (const [category, data] of this.keywords) {
      for (const pattern of data.patterns) {
        if (lowerText.includes(pattern)) {
          matches.push({
            keyword: category,
            severity: data.severity as any,
            confidence: this.calculateConfidence(pattern, lowerText)
          });
          break;
        }
      }
    }

    return matches;
  }

  private calculateConfidence(pattern: string, text: string): number {
    const exactMatch = text.includes(` ${pattern} `);
    return exactMatch ? 0.95 : 0.75;
  }

  getSeverity(text: string): string | null {
    const matches = this.detectKeywords(text);
    if (matches.length === 0) return null;
    
    const severities = ['critical', 'high', 'medium', 'low'];
    for (const severity of severities) {
      if (matches.some(m => m.severity === severity)) {
        return severity;
      }
    }
    return null;
  }

  needsImmediateIntervention(text: string): boolean {
    const severity = this.getSeverity(text);
    return severity === 'critical' || severity === 'high';
  }
}

describe('EnhancedCrisisKeywordDetectionService', () => {
  let service: EnhancedCrisisKeywordDetectionService;

  beforeEach(() => {
    service = new EnhancedCrisisKeywordDetectionService();
  });

  it('should detect suicide keywords as critical', () => {
    const matches = service.detectKeywords('I want to die');
    expect(matches.some(m => m.severity === 'critical')).toBe(true);
  });

  it('should detect self-harm keywords as high severity', () => {
    const matches = service.detectKeywords('thinking about cutting myself');
    expect(matches.some(m => m.severity === 'high')).toBe(true);
  });

  it('should detect anxiety keywords', () => {
    const matches = service.detectKeywords('having a panic attack');
    expect(matches.some(m => m.keyword === 'anxiety')).toBe(true);
  });

  it('should calculate confidence scores', () => {
    const matches = service.detectKeywords('I am feeling depressed today');
    expect(matches[0].confidence).toBeGreaterThan(0);
  });

  it('should determine overall severity', () => {
    const severity = service.getSeverity('I want to hurt myself');
    expect(severity).toBe('high');
  });

  it('should identify need for immediate intervention', () => {
    expect(service.needsImmediateIntervention('suicidal thoughts')).toBe(true);
    expect(service.needsImmediateIntervention('feeling sad')).toBe(false);
  });

  it('should return empty array for safe text', () => {
    const matches = service.detectKeywords('Having a great day!');
    expect(matches).toHaveLength(0);
  });
});
