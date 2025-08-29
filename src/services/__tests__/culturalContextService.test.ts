import { describe, it, expect, jest, beforeEach } from '@jest/globals';

interface CulturalContext {
  region: string;
  language: string;
  culturalValues: string[];
  communicationStyle: 'direct' | 'indirect' | 'contextual';
  taboos: string[];
}

class CulturalContextService {
  private contexts: Map<string, CulturalContext> = new Map();
  
  constructor() {
    this.initializeContexts();
  }

  private initializeContexts() {
    this.contexts.set('east-asian', {
      region: 'East Asia',
      language: 'varies',
      culturalValues: ['harmony', 'respect', 'family', 'education'],
      communicationStyle: 'indirect',
      taboos: ['direct-conflict', 'public-emotion', 'individual-over-group']
    });

    this.contexts.set('western', {
      region: 'Western',
      language: 'varies',
      culturalValues: ['individualism', 'directness', 'equality', 'innovation'],
      communicationStyle: 'direct',
      taboos: ['discrimination', 'privacy-invasion']
    });

    this.contexts.set('latin-american', {
      region: 'Latin America',
      language: 'Spanish/Portuguese',
      culturalValues: ['family', 'religion', 'community', 'respect'],
      communicationStyle: 'contextual',
      taboos: ['disrespect-elders', 'ignoring-family']
    });
  }

  getContext(culture: string): CulturalContext | null {
    return this.contexts.get(culture) || null;
  }

  getAllContexts(): string[] {
    return Array.from(this.contexts.keys());
  }

  isTaboo(culture: string, action: string): boolean {
    const context = this.contexts.get(culture);
    if (!context) return false;
    
    return context.taboos.some(taboo => 
      action.toLowerCase().includes(taboo.replace('-', ' '))
    );
  }

  getRecommendedApproach(culture: string): string {
    const context = this.contexts.get(culture);
    if (!context) return 'Use standard approach';

    switch (context.communicationStyle) {
      case 'direct':
        return 'Use clear, direct communication';
      case 'indirect':
        return 'Use gentle suggestions and implications';
      case 'contextual':
        return 'Consider context and relationships';
      default:
        return 'Use adaptive approach';
    }
  }

  adaptContent(content: string, targetCulture: string): string {
    const context = this.contexts.get(targetCulture);
    if (!context) return content;

    // Simple adaptation logic
    if (context.communicationStyle === 'indirect') {
      content = content.replace(/you must/gi, 'you might consider');
      content = content.replace(/wrong/gi, 'different');
    }

    return content;
  }

  getCulturalSensitivity(culture: string, topic: string): number {
    const sensitivities: Record<string, Record<string, number>> = {
      'east-asian': {
        'mental-health': 80,
        'family': 90,
        'suicide': 95,
        'therapy': 70
      },
      'western': {
        'mental-health': 40,
        'family': 50,
        'suicide': 70,
        'therapy': 30
      }
    };

    return sensitivities[culture]?.[topic] || 50;
  }
}

describe('CulturalContextService', () => {
  let service: CulturalContextService;

  beforeEach(() => {
    service = new CulturalContextService();
  });

  describe('Context Retrieval', () => {
    it('should retrieve cultural context', () => {
      const context = service.getContext('east-asian');
      
      expect(context).toBeDefined();
      expect(context?.region).toBe('East Asia');
      expect(context?.communicationStyle).toBe('indirect');
    });

    it('should return null for unknown culture', () => {
      const context = service.getContext('unknown');
      expect(context).toBeNull();
    });

    it('should list all available contexts', () => {
      const contexts = service.getAllContexts();
      
      expect(contexts).toContain('east-asian');
      expect(contexts).toContain('western');
      expect(contexts).toContain('latin-american');
    });
  });

  describe('Taboo Detection', () => {
    it('should detect cultural taboos', () => {
      expect(service.isTaboo('east-asian', 'direct conflict')).toBe(true);
      expect(service.isTaboo('east-asian', 'respectful discussion')).toBe(false);
    });

    it('should handle unknown cultures', () => {
      expect(service.isTaboo('unknown', 'anything')).toBe(false);
    });
  });

  describe('Communication Recommendations', () => {
    it('should recommend communication approach', () => {
      const eastAsian = service.getRecommendedApproach('east-asian');
      expect(eastAsian).toContain('gentle suggestions');

      const western = service.getRecommendedApproach('western');
      expect(western).toContain('direct communication');
    });
  });

  describe('Content Adaptation', () => {
    it('should adapt content for indirect cultures', () => {
      const original = 'You must complete this form';
      const adapted = service.adaptContent(original, 'east-asian');
      
      expect(adapted).toContain('you might consider');
      expect(adapted).not.toContain('you must');
    });

    it('should not modify content for direct cultures', () => {
      const original = 'You must complete this form';
      const adapted = service.adaptContent(original, 'western');
      
      expect(adapted).toBe(original);
    });
  });

  describe('Cultural Sensitivity', () => {
    it('should return sensitivity scores', () => {
      const eastAsianMentalHealth = service.getCulturalSensitivity('east-asian', 'mental-health');
      const westernMentalHealth = service.getCulturalSensitivity('western', 'mental-health');
      
      expect(eastAsianMentalHealth).toBeGreaterThan(westernMentalHealth);
    });

    it('should return default sensitivity for unknown topics', () => {
      const sensitivity = service.getCulturalSensitivity('east-asian', 'unknown-topic');
      expect(sensitivity).toBe(50);
    });
  });
});
