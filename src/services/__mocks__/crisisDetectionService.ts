export interface CrisisIndicator {
  type: 'keyword' | 'pattern' | 'behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  details: string;
}

export interface CrisisAssessment {
  overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  indicators: CrisisIndicator[];
  recommendations: string[];
  requiresImmediate: boolean;
  timestamp: Date;
}

class MockCrisisDetectionService {
  private criticalKeywords = [
    'suicide', 'kill myself', 'end it all', 'can\'t go on',
    'no point', 'better off dead', 'want to die'
  ];

  private warningKeywords = [
    'hopeless', 'worthless', 'alone', 'trapped', 'burden',
    'pain', 'can\'t take it', 'give up', 'darkness'
  ];

  private concernKeywords = [
    'sad', 'anxious', 'scared', 'overwhelmed', 'stressed',
    'tired', 'exhausted', 'struggling', 'difficult'
  ];

  async analyzeText(text: string): Promise<CrisisAssessment> {
    const lowerText = text.toLowerCase();
    const indicators: CrisisIndicator[] = [];
    
    // Check for critical keywords
    for (const keyword of this.criticalKeywords) {
      if (lowerText.includes(keyword)) {
        indicators.push({
          type: 'keyword',
          severity: 'critical',
          confidence: 0.95,
          details: `Critical phrase detected: "${keyword}"`
        });
      }
    }

    // Check for warning keywords
    for (const keyword of this.warningKeywords) {
      if (lowerText.includes(keyword)) {
        indicators.push({
          type: 'keyword',
          severity: 'high',
          confidence: 0.8,
          details: `Warning phrase detected: "${keyword}"`
        });
      }
    }

    // Check for concern keywords
    for (const keyword of this.concernKeywords) {
      if (lowerText.includes(keyword)) {
        indicators.push({
          type: 'keyword',
          severity: 'medium',
          confidence: 0.6,
          details: `Concerning phrase detected: "${keyword}"`
        });
      }
    }

    const overallRisk = this.calculateOverallRisk(indicators);
    const recommendations = this.getRecommendations(overallRisk);
    const requiresImmediate = overallRisk === 'critical' || overallRisk === 'high';

    return {
      overallRisk,
      indicators,
      recommendations,
      requiresImmediate,
      timestamp: new Date()
    };
  }

  async analyzePattern(data: any[]): Promise<CrisisAssessment> {
    // Mock pattern analysis
    const indicators: CrisisIndicator[] = [];
    
    // Simulate pattern detection
    if (data.length > 5) {
      indicators.push({
        type: 'pattern',
        severity: 'medium',
        confidence: 0.7,
        details: 'Increasing negative sentiment detected over time'
      });
    }

    const overallRisk = this.calculateOverallRisk(indicators);
    
    return {
      overallRisk,
      indicators,
      recommendations: this.getRecommendations(overallRisk),
      requiresImmediate: false,
      timestamp: new Date()
    };
  }

  private calculateOverallRisk(indicators: CrisisIndicator[]): CrisisAssessment['overallRisk'] {
    if (indicators.some(i => i.severity === 'critical')) return 'critical';
    if (indicators.some(i => i.severity === 'high')) return 'high';
    if (indicators.some(i => i.severity === 'medium')) return 'medium';
    if (indicators.length > 0) return 'low';
    return 'none';
  }

  private getRecommendations(risk: CrisisAssessment['overallRisk']): string[] {
    switch (risk) {
      case 'critical':
        return [
          'Contact crisis hotline immediately: 988',
          'Reach out to emergency contact',
          'Go to nearest emergency room if in immediate danger'
        ];
      case 'high':
        return [
          'Consider calling crisis hotline: 988',
          'Contact your therapist or counselor',
          'Use safety plan coping strategies'
        ];
      case 'medium':
        return [
          'Practice grounding techniques',
          'Reach out to a trusted friend',
          'Use self-care activities from your toolkit'
        ];
      case 'low':
        return [
          'Continue monitoring your feelings',
          'Practice regular self-care',
          'Journal about your experiences'
        ];
      default:
        return ['Keep up the good work with your mental health practices'];
    }
  }

  // Mock method for testing
  reset(): void {
    // Reset any internal state if needed
  }
}

export default MockCrisisDetectionService;
