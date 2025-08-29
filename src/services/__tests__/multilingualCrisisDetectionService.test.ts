import { describe, it, expect, jest } from '@jest/globals';

interface CrisisPattern {
  language: string;
  patterns: Array<{
    phrase: string;
    weight: number;
    cultural_context?: string;
  }>;
}

interface CrisisDetectionResult {
  risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  detected_language: string;
  cultural_factors: string[];
  recommended_resources: string[];
}

class MultilingualCrisisDetectionService {
  private crisisPatterns: CrisisPattern[] = [
    {
      language: 'en',
      patterns: [
        { phrase: 'want to die', weight: 10 },
        { phrase: 'kill myself', weight: 10 },
        { phrase: 'hopeless', weight: 7 },
        { phrase: 'worthless', weight: 6 }
      ]
    },
    {
      language: 'es',
      patterns: [
        { phrase: 'quiero morir', weight: 10 },
        { phrase: 'matarme', weight: 10 },
        { phrase: 'sin esperanza', weight: 7 },
        { phrase: 'no valgo nada', weight: 6 }
      ]
    },
    {
      language: 'fr',
      patterns: [
        { phrase: 'veux mourir', weight: 10 },
        { phrase: 'me tuer', weight: 10 },
        { phrase: 'sans espoir', weight: 7 },
        { phrase: 'ne vaux rien', weight: 6 }
      ]
    },
    {
      language: 'zh',
      patterns: [
        { phrase: '想死', weight: 10 },
        { phrase: '自杀', weight: 10 },
        { phrase: '绝望', weight: 7 },
        { phrase: '没有价值', weight: 6 }
      ]
    }
  ];

  private culturalResources = {
    'en': ['988 Crisis Lifeline', 'Crisis Text Line'],
    'es': ['National Hispanic Helpline', 'Línea de Crisis'],
    'fr': ['Ligne d\'écoute', 'SOS Amitié'],
    'zh': ['Beijing Crisis Hotline', '心理危机干预热线']
  };

  async detectCrisis(text: string, detectedLanguage?: string): Promise<CrisisDetectionResult> {
    const language = detectedLanguage || await this.detectLanguage(text);
    const patterns = this.crisisPatterns.find(p => p.language === language)?.patterns || [];
    
    let totalScore = 0;
    const detectedPatterns: string[] = [];
    
    const lowerText = text.toLowerCase();
    
    patterns.forEach(pattern => {
      if (lowerText.includes(pattern.phrase.toLowerCase())) {
        totalScore += pattern.weight;
        detectedPatterns.push(pattern.phrase);
      }
    });
    
    let riskLevel: CrisisDetectionResult['risk_level'] = 'none';
    if (totalScore >= 15) riskLevel = 'critical';
    else if (totalScore >= 10) riskLevel = 'high';
    else if (totalScore >= 5) riskLevel = 'medium';
    else if (totalScore > 0) riskLevel = 'low';
    
    const confidence = Math.min(1, totalScore / 20);
    
    return {
      risk_level: riskLevel,
      confidence,
      detected_language: language,
      cultural_factors: this.getCulturalFactors(language, detectedPatterns),
      recommended_resources: this.culturalResources[language] || this.culturalResources['en']
    };
  }

  private async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on character patterns
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[àáâäèéêëìíîïòóôöùúûü]/.test(text.toLowerCase())) return 'fr';
    if (/[ñáéíóúü]/.test(text.toLowerCase())) return 'es';
    return 'en';
  }

  private getCulturalFactors(language: string, patterns: string[]): string[] {
    const culturalFactors: string[] = [];
    
    switch (language) {
      case 'zh':
        culturalFactors.push('collectivist_culture', 'family_honor_concerns');
        break;
      case 'es':
        culturalFactors.push('familismo', 'religious_considerations');
        break;
      case 'fr':
        culturalFactors.push('individualism', 'philosophical_approach');
        break;
      default:
        culturalFactors.push('western_individualism');
    }
    
    return culturalFactors;
  }

  getSupportedLanguages(): string[] {
    return this.crisisPatterns.map(p => p.language);
  }

  addLanguagePatterns(language: string, patterns: Array<{ phrase: string; weight: number }>): void {
    const existingIndex = this.crisisPatterns.findIndex(p => p.language === language);
    
    if (existingIndex >= 0) {
      this.crisisPatterns[existingIndex].patterns = patterns;
    } else {
      this.crisisPatterns.push({ language, patterns });
    }
  }
}

describe('MultilingualCrisisDetectionService', () => {
  let service: MultilingualCrisisDetectionService;

  beforeEach(() => {
    service = new MultilingualCrisisDetectionService();
  });

  describe('English detection', () => {
    it('should detect high-risk English phrases', async () => {
      const result = await service.detectCrisis('I want to die and kill myself', 'en');
      
      expect(result.risk_level).toBe('critical');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.detected_language).toBe('en');
      expect(result.recommended_resources).toContain('988 Crisis Lifeline');
    });

    it('should detect medium-risk English phrases', async () => {
      const result = await service.detectCrisis('I feel hopeless and worthless', 'en');
      
      expect(result.risk_level).toBe('high');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Spanish detection', () => {
    it('should detect high-risk Spanish phrases', async () => {
      const result = await service.detectCrisis('Quiero morir, no puedo más', 'es');
      
      expect(result.risk_level).toBe('critical');
      expect(result.detected_language).toBe('es');
      expect(result.recommended_resources).toContain('National Hispanic Helpline');
      expect(result.cultural_factors).toContain('familismo');
    });

    it('should auto-detect Spanish language', async () => {
      const result = await service.detectCrisis('Me siento sin esperanza, no valgo nada');
      
      expect(result.detected_language).toBe('es');
      expect(result.risk_level).toBe('high');
    });
  });

  describe('French detection', () => {
    it('should detect high-risk French phrases', async () => {
      const result = await service.detectCrisis('Je veux mourir, je ne peux plus', 'fr');
      
      expect(result.risk_level).toBe('critical');
      expect(result.detected_language).toBe('fr');
      expect(result.recommended_resources).toContain('Ligne d\'écoute');
      expect(result.cultural_factors).toContain('philosophical_approach');
    });
  });

  describe('Chinese detection', () => {
    it('should detect high-risk Chinese phrases', async () => {
      const result = await service.detectCrisis('我想死，感到绝望', 'zh');
      
      expect(result.risk_level).toBe('critical');
      expect(result.detected_language).toBe('zh');
      expect(result.recommended_resources).toContain('Beijing Crisis Hotline');
      expect(result.cultural_factors).toContain('collectivist_culture');
    });

    it('should auto-detect Chinese language', async () => {
      const result = await service.detectCrisis('我觉得没有价值');
      
      expect(result.detected_language).toBe('zh');
      expect(result.risk_level).toBe('medium');
    });
  });

  describe('Language detection', () => {
    it('should detect French by accented characters', async () => {
      const result = await service.detectCrisis('Je suis très triste aujourd\'hui');
      expect(result.detected_language).toBe('fr');
    });

    it('should detect Spanish by specific characters', async () => {
      const result = await service.detectCrisis('Estoy muy triste, no sé qué hacer');
      expect(result.detected_language).toBe('es');
    });

    it('should default to English for unrecognized text', async () => {
      const result = await service.detectCrisis('I am feeling down today');
      expect(result.detected_language).toBe('en');
    });
  });

  describe('Service management', () => {
    it('should return supported languages', () => {
      const languages = service.getSupportedLanguages();
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('fr');
      expect(languages).toContain('zh');
    });

    it('should allow adding new language patterns', () => {
      service.addLanguagePatterns('de', [
        { phrase: 'sterben wollen', weight: 10 },
        { phrase: 'hoffnungslos', weight: 7 }
      ]);
      
      const languages = service.getSupportedLanguages();
      expect(languages).toContain('de');
    });

    it('should update existing language patterns', () => {
      const originalCount = service.getSupportedLanguages().length;
      
      service.addLanguagePatterns('en', [
        { phrase: 'new pattern', weight: 8 }
      ]);
      
      expect(service.getSupportedLanguages().length).toBe(originalCount);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty text', async () => {
      const result = await service.detectCrisis('');
      
      expect(result.risk_level).toBe('none');
      expect(result.confidence).toBe(0);
    });

    it('should handle mixed language text', async () => {
      const result = await service.detectCrisis('I feel hopeless, sin esperanza');
      
      expect(result.risk_level).toBeGreaterThan('none');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle text with no risk indicators', async () => {
      const result = await service.detectCrisis('Today is a beautiful day');
      
      expect(result.risk_level).toBe('none');
      expect(result.confidence).toBe(0);
    });
  });
});
