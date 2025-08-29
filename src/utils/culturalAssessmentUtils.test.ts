/**
 * Cultural Assessment Utils Tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

interface CulturalContext {
  language: string;
  region: string;
  culturalBackground: string;
  communicationStyle: 'direct' | 'indirect' | 'contextual';
  familyStructure: 'nuclear' | 'extended' | 'communal';
  stigmaLevel: 'high' | 'moderate' | 'low';
  preferredSupport: string[];
}

interface CulturalAssessment {
  userId: string;
  context: CulturalContext;
  sensitivities: string[];
  recommendations: string[];
  resources: CulturalResource[];
}

interface CulturalResource {
  id: string;
  type: 'article' | 'video' | 'support-group' | 'therapist';
  title: string;
  description: string;
  languages: string[];
  culturalRelevance: string[];
}

class CulturalAssessmentUtils {
  private assessments: Map<string, CulturalAssessment> = new Map();
  
  createAssessment(userId: string, context: CulturalContext): CulturalAssessment {
    const assessment: CulturalAssessment = {
      userId,
      context,
      sensitivities: this.identifySensitivities(context),
      recommendations: this.generateRecommendations(context),
      resources: this.findCulturalResources(context)
    };
    
    this.assessments.set(userId, assessment);
    return assessment;
  }

  private identifySensitivities(context: CulturalContext): string[] {
    const sensitivities: string[] = [];
    
    if (context.stigmaLevel === 'high') {
      sensitivities.push('High mental health stigma - use alternative terminology');
      sensitivities.push('Prefer indirect approaches to discussing mental health');
    }
    
    if (context.communicationStyle === 'indirect') {
      sensitivities.push('Avoid direct confrontation or criticism');
      sensitivities.push('Use metaphors and storytelling');
    }
    
    if (context.familyStructure === 'extended' || context.familyStructure === 'communal') {
      sensitivities.push('Consider family involvement in treatment');
      sensitivities.push('Respect collective decision-making');
    }
    
    return sensitivities;
  }

  private generateRecommendations(context: CulturalContext): string[] {
    const recommendations: string[] = [];
    
    switch (context.culturalBackground) {
      case 'east-asian':
        recommendations.push('Focus on somatic symptoms initially');
        recommendations.push('Emphasize practical solutions');
        recommendations.push('Consider family therapy options');
        break;
      case 'latin-american':
        recommendations.push('Incorporate spiritual elements if appropriate');
        recommendations.push('Build personal relationship first');
        recommendations.push('Consider group therapy formats');
        break;
      case 'middle-eastern':
        recommendations.push('Respect gender preferences for therapists');
        recommendations.push('Consider religious/spiritual frameworks');
        recommendations.push('Maintain family honor considerations');
        break;
      case 'african':
        recommendations.push('Include community support systems');
        recommendations.push('Address historical trauma sensitively');
        recommendations.push('Consider oral tradition approaches');
        break;
      default:
        recommendations.push('Use culturally neutral approaches');
        recommendations.push('Assess individual preferences');
        break;
    }
    
    return recommendations;
  }

  private findCulturalResources(context: CulturalContext): CulturalResource[] {
    // Mock resource database
    const allResources: CulturalResource[] = [
      {
        id: 'res-1',
        type: 'article',
        title: 'Understanding Mental Health in Asian Communities',
        description: 'Comprehensive guide to cultural considerations',
        languages: ['en', 'zh', 'ja', 'ko'],
        culturalRelevance: ['east-asian']
      },
      {
        id: 'res-2',
        type: 'support-group',
        title: 'Latino Mental Health Support Circle',
        description: 'Bilingual support group for Spanish speakers',
        languages: ['en', 'es'],
        culturalRelevance: ['latin-american']
      },
      {
        id: 'res-3',
        type: 'therapist',
        title: 'Culturally Competent Therapist Directory',
        description: 'Find therapists who understand your cultural background',
        languages: ['en'],
        culturalRelevance: ['all']
      }
    ];
    
    return allResources.filter(resource => 
      resource.culturalRelevance.includes(context.culturalBackground) ||
      resource.culturalRelevance.includes('all')
    );
  }

  updateAssessment(userId: string, updates: Partial<CulturalContext>): CulturalAssessment | null {
    const existing = this.assessments.get(userId);
    if (!existing) return null;
    
    const updatedContext = { ...existing.context, ...updates };
    return this.createAssessment(userId, updatedContext);
  }

  getAssessment(userId: string): CulturalAssessment | undefined {
    return this.assessments.get(userId);
  }

  analyzeLanguagePreference(languages: string[]): string {
    // Primary language selection logic
    if (languages.includes('en')) return 'en';
    return languages[0] || 'en';
  }

  determineCommunicationApproach(context: CulturalContext): string {
    if (context.communicationStyle === 'direct') {
      return 'Use clear, direct language and explicit instructions';
    } else if (context.communicationStyle === 'indirect') {
      return 'Use gentle suggestions and non-confrontational language';
    } else {
      return 'Adapt communication based on contextual cues and feedback';
    }
  }

  assessStigmaLevel(culturalBackground: string, region: string): 'high' | 'moderate' | 'low' {
    // Simplified stigma assessment
    const highStigmaRegions = ['east-asia', 'middle-east', 'south-asia'];
    const lowStigmaRegions = ['scandinavia', 'western-europe'];
    
    if (highStigmaRegions.includes(culturalBackground)) return 'high';
    if (lowStigmaRegions.includes(region)) return 'low';
    return 'moderate';
  }

  suggestInterventions(assessment: CulturalAssessment): string[] {
    const interventions: string[] = [];
    
    if (assessment.context.stigmaLevel === 'high') {
      interventions.push('Psychoeducation about mental health');
      interventions.push('Normalize treatment through success stories');
    }
    
    if (assessment.context.familyStructure !== 'nuclear') {
      interventions.push('Family therapy sessions');
      interventions.push('Family education programs');
    }
    
    if (assessment.context.preferredSupport.includes('spiritual')) {
      interventions.push('Integrate spiritual practices');
      interventions.push('Collaborate with religious leaders');
    }
    
    return interventions;
  }

  clearAssessments() {
    this.assessments.clear();
  }
}

describe('CulturalAssessmentUtils', () => {
  let utils: CulturalAssessmentUtils;

  beforeEach(() => {
    utils = new CulturalAssessmentUtils();
  });

  describe('Assessment Creation', () => {
    it('should create cultural assessment', () => {
      const context: CulturalContext = {
        language: 'zh',
        region: 'china',
        culturalBackground: 'east-asian',
        communicationStyle: 'indirect',
        familyStructure: 'extended',
        stigmaLevel: 'high',
        preferredSupport: ['family', 'traditional-medicine']
      };

      const assessment = utils.createAssessment('user-1', context);
      
      expect(assessment).toBeDefined();
      expect(assessment.userId).toBe('user-1');
      expect(assessment.context).toEqual(context);
      expect(assessment.sensitivities).toHaveLength(4);
      expect(assessment.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify appropriate sensitivities', () => {
      const context: CulturalContext = {
        language: 'es',
        region: 'mexico',
        culturalBackground: 'latin-american',
        communicationStyle: 'contextual',
        familyStructure: 'extended',
        stigmaLevel: 'moderate',
        preferredSupport: ['family', 'spiritual']
      };

      const assessment = utils.createAssessment('user-2', context);
      
      expect(assessment.sensitivities).toContain('Consider family involvement in treatment');
      expect(assessment.sensitivities).toContain('Respect collective decision-making');
    });
  });

  describe('Recommendations', () => {
    it('should generate culturally appropriate recommendations', () => {
      const eastAsianContext: CulturalContext = {
        language: 'ja',
        region: 'japan',
        culturalBackground: 'east-asian',
        communicationStyle: 'indirect',
        familyStructure: 'nuclear',
        stigmaLevel: 'high',
        preferredSupport: ['professional']
      };

      const assessment = utils.createAssessment('user-3', eastAsianContext);
      
      expect(assessment.recommendations).toContain('Focus on somatic symptoms initially');
      expect(assessment.recommendations).toContain('Emphasize practical solutions');
    });

    it('should provide different recommendations for different cultures', () => {
      const latinContext: CulturalContext = {
        language: 'es',
        region: 'mexico',
        culturalBackground: 'latin-american',
        communicationStyle: 'direct',
        familyStructure: 'extended',
        stigmaLevel: 'moderate',
        preferredSupport: ['spiritual', 'community']
      };

      const assessment = utils.createAssessment('user-4', latinContext);
      
      expect(assessment.recommendations).toContain('Build personal relationship first');
      expect(assessment.recommendations).toContain('Consider group therapy formats');
    });
  });

  describe('Resource Matching', () => {
    it('should find culturally relevant resources', () => {
      const context: CulturalContext = {
        language: 'zh',
        region: 'china',
        culturalBackground: 'east-asian',
        communicationStyle: 'indirect',
        familyStructure: 'extended',
        stigmaLevel: 'high',
        preferredSupport: ['professional']
      };

      const assessment = utils.createAssessment('user-5', context);
      
      expect(assessment.resources.length).toBeGreaterThan(0);
      const relevantResource = assessment.resources.find(r => 
        r.culturalRelevance.includes('east-asian')
      );
      expect(relevantResource).toBeDefined();
    });
  });

  describe('Assessment Updates', () => {
    it('should update existing assessment', () => {
      const initialContext: CulturalContext = {
        language: 'en',
        region: 'usa',
        culturalBackground: 'western',
        communicationStyle: 'direct',
        familyStructure: 'nuclear',
        stigmaLevel: 'low',
        preferredSupport: ['professional']
      };

      utils.createAssessment('user-6', initialContext);
      const updated = utils.updateAssessment('user-6', { 
        stigmaLevel: 'moderate',
        familyStructure: 'extended' 
      });
      
      expect(updated).toBeDefined();
      expect(updated?.context.stigmaLevel).toBe('moderate');
      expect(updated?.context.familyStructure).toBe('extended');
    });

    it('should return null for non-existent assessment', () => {
      const updated = utils.updateAssessment('non-existent', { stigmaLevel: 'low' });
      expect(updated).toBeNull();
    });
  });

  describe('Communication Approaches', () => {
    it('should determine appropriate communication approach', () => {
      const directContext: CulturalContext = {
        language: 'en',
        region: 'usa',
        culturalBackground: 'western',
        communicationStyle: 'direct',
        familyStructure: 'nuclear',
        stigmaLevel: 'low',
        preferredSupport: ['professional']
      };

      const approach = utils.determineCommunicationApproach(directContext);
      expect(approach).toContain('clear, direct language');
    });
  });

  describe('Stigma Assessment', () => {
    it('should assess stigma level based on cultural background', () => {
      expect(utils.assessStigmaLevel('east-asian', 'china')).toBe('high');
      expect(utils.assessStigmaLevel('western', 'usa')).toBe('moderate');
      expect(utils.assessStigmaLevel('western', 'scandinavia')).toBe('low');
    });
  });

  describe('Intervention Suggestions', () => {
    it('should suggest appropriate interventions', () => {
      const context: CulturalContext = {
        language: 'ar',
        region: 'saudi-arabia',
        culturalBackground: 'middle-eastern',
        communicationStyle: 'indirect',
        familyStructure: 'extended',
        stigmaLevel: 'high',
        preferredSupport: ['spiritual', 'family']
      };

      const assessment = utils.createAssessment('user-7', context);
      const interventions = utils.suggestInterventions(assessment);
      
      expect(interventions).toContain('Psychoeducation about mental health');
      expect(interventions).toContain('Family therapy sessions');
      expect(interventions).toContain('Integrate spiritual practices');
    });
  });
});
