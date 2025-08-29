/**
 * Cultural Mental Health Service
 *
 * Provides culturally-sensitive mental health content and approaches
 * tailored to each supported locale with comprehensive cultural context.
 */

import { getCulturalContext } from '../i18n';
import { notificationService } from './notificationService';

export interface CulturalMentalHealthContent {
  locale: string;
  culturalContext: CulturalContext;
  supportResources: SupportResource[];
  communicationGuidelines: CommunicationGuideline[];
  copingStrategies: CopingStrategy[];
  crisisApproaches: CrisisApproach[];
  accessibilityConsiderations: AccessibilityConsiderations;
}

export interface CulturalContext {
  stigmaLevel: 'low' | 'medium' | 'high';
  familyInvolvement: 'low' | 'medium' | 'high';
  communitySupport: 'low' | 'medium' | 'high';
  religiousContext: string;
  preferredApproach: string;
  culturalValues: string[];
  communicationStyle: 'direct' | 'indirect' | 'contextual';
  authorityRespect: 'low' | 'medium' | 'high';
  collectivismLevel: 'individual' | 'mixed' | 'collective';
  mentalHealthPerception: string;
}

export interface CopingStrategy {
  id: string;
  name: string;
  description: string;
  culturallyAppropriate: boolean;
  category: 'spiritual' | 'family' | 'community' | 'individual' | 'professional';
  effectiveness: number; // 1-5 scale
  steps?: string[];
  culturalConsiderations: string[];
  contraindications?: string[];
}

export interface CrisisApproach {
  id: string;
  name: string;
  description: string;
  urgencyLevel: 'immediate' | 'urgent' | 'moderate';
  culturalFactors: string[];
  recommendedActions: string[];
  avoidActions: string[];
  familyInvolvement: boolean;
  communityInvolvement: boolean;
  professionalReferral: boolean;
}

export interface SupportResource {
  id: string;
  name: string;
  type: 'hotline' | 'text' | 'chat' | 'in-person' | 'online' | 'community';
  description: string;
  contactInfo: ContactInfo;
  languages: string[];
  culturalSpecialization: string[];
  availability: ResourceAvailability;
  cost: 'free' | 'low-cost' | 'sliding-scale' | 'insurance';
  accessibility: AccessibilityFeatures;
}

export interface ContactInfo {
  phone?: string;
  text?: string;
  email?: string;
  website?: string;
  address?: string;
}

export interface ResourceAvailability {
  available24x7: boolean;
  hours?: string;
  days?: string[];
  timezone?: string;
}

export interface AccessibilityFeatures {
  wheelchairAccessible?: boolean;
  signLanguage?: boolean;
  audioDescription?: boolean;
  braille?: boolean;
  multiLanguage: boolean;
}

export interface CommunicationGuideline {
  id: string;
  context: 'crisis' | 'support' | 'therapy' | 'family' | 'community';
  doRecommendations: string[];
  avoidRecommendations: string[];
  culturalNuances: string[];
  nonVerbalConsiderations: string[];
  languagePreferences: LanguagePreference[];
}

export interface LanguagePreference {
  language: string;
  dialect?: string;
  formalityLevel: 'formal' | 'informal' | 'mixed';
  preferredTerms: Record<string, string>;
  avoidedTerms: string[];
}

export interface AccessibilityConsiderations {
  visualImpairment: AccessibilitySupport;
  hearingImpairment: AccessibilitySupport;
  cognitiveConsiderations: AccessibilitySupport;
  motorImpairment: AccessibilitySupport;
  languageBarriers: LanguageSupport;
}

export interface AccessibilitySupport {
  available: boolean;
  methods: string[];
  resources: string[];
  specialConsiderations: string[];
}

export interface LanguageSupport {
  translationServices: boolean;
  interpreterServices: boolean;
  multilingualStaff: boolean;
  culturalLiaisons: boolean;
  supportedLanguages: string[];
}

export interface CulturalAssessment {
  userId: string;
  locale: string;
  culturalBackground: string[];
  religiousAffiliation?: string;
  languagePreferences: string[];
  familyStructure: 'nuclear' | 'extended' | 'single-parent' | 'other';
  communityConnections: string[];
  previousMentalHealthExperience: boolean;
  stigmaLevel: number; // 1-10 scale
  preferredSupportType: string[];
  accessibilityNeeds: string[];
  createdAt: Date;
  updatedAt: Date;
}

class CulturalMentalHealthService {
  private culturalContent = new Map<string, CulturalMentalHealthContent>();
  private userAssessments = new Map<string, CulturalAssessment>();

  constructor() {
    this.initializeDefaultContent();
  }

  /**
   * Initialize default cultural content
   */
  private initializeDefaultContent(): void {
    // English/US content
    this.culturalContent.set('en-US', {
      locale: 'en-US',
      culturalContext: {
        stigmaLevel: 'medium',
        familyInvolvement: 'medium',
        communitySupport: 'medium',
        religiousContext: 'varied',
        preferredApproach: 'individual-focused',
        culturalValues: ['independence', 'self-reliance', 'privacy'],
        communicationStyle: 'direct',
        authorityRespect: 'medium',
        collectivismLevel: 'individual',
        mentalHealthPerception: 'medical-model'
      },
      supportResources: this.getDefaultSupportResources('en-US'),
      communicationGuidelines: this.getDefaultCommunicationGuidelines('en-US'),
      copingStrategies: this.getDefaultCopingStrategies('en-US'),
      crisisApproaches: this.getDefaultCrisisApproaches('en-US'),
      accessibilityConsiderations: this.getDefaultAccessibilityConsiderations()
    });

    // Spanish/Latin American content
    this.culturalContent.set('es-US', {
      locale: 'es-US',
      culturalContext: {
        stigmaLevel: 'high',
        familyInvolvement: 'high',
        communitySupport: 'high',
        religiousContext: 'predominantly-catholic',
        preferredApproach: 'family-centered',
        culturalValues: ['familia', 'respeto', 'personalismo', 'simpatía'],
        communicationStyle: 'indirect',
        authorityRespect: 'high',
        collectivismLevel: 'collective',
        mentalHealthPerception: 'spiritual-medical-mixed'
      },
      supportResources: this.getDefaultSupportResources('es-US'),
      communicationGuidelines: this.getDefaultCommunicationGuidelines('es-US'),
      copingStrategies: this.getDefaultCopingStrategies('es-US'),
      crisisApproaches: this.getDefaultCrisisApproaches('es-US'),
      accessibilityConsiderations: this.getDefaultAccessibilityConsiderations()
    });
  }

  /**
   * Get cultural content for locale
   */
  public async getCulturalContent(locale: string): Promise<CulturalMentalHealthContent | null> {
    const content = this.culturalContent.get(locale);
    if (content) {
      return content;
    }

    // Try base language if specific locale not found
    const baseLanguage = locale.split('-')[0];
    for (const [key, value] of this.culturalContent.entries()) {
      if (key.startsWith(baseLanguage)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Get culturally appropriate coping strategies
   */
  public async getCopingStrategies(
    locale: string,
    category?: string,
    effectivenessThreshold?: number
  ): Promise<CopingStrategy[]> {
    const content = await this.getCulturalContent(locale);
    if (!content) {
      return [];
    }

    let strategies = content.copingStrategies;

    if (category) {
      strategies = strategies.filter(s => s.category === category);
    }

    if (effectivenessThreshold) {
      strategies = strategies.filter(s => s.effectiveness >= effectivenessThreshold);
    }

    return strategies.sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Get crisis approaches for cultural context
   */
  public async getCrisisApproaches(
    locale: string,
    urgencyLevel?: string
  ): Promise<CrisisApproach[]> {
    const content = await this.getCulturalContent(locale);
    if (!content) {
      return [];
    }

    let approaches = content.crisisApproaches;

    if (urgencyLevel) {
      approaches = approaches.filter(a => a.urgencyLevel === urgencyLevel);
    }

    return approaches;
  }

  /**
   * Get communication guidelines
   */
  public async getCommunicationGuidelines(
    locale: string,
    context?: string
  ): Promise<CommunicationGuideline[]> {
    const content = await this.getCulturalContent(locale);
    if (!content) {
      return [];
    }

    let guidelines = content.communicationGuidelines;

    if (context) {
      guidelines = guidelines.filter(g => g.context === context);
    }

    return guidelines;
  }

  /**
   * Get support resources
   */
  public async getSupportResources(
    locale: string,
    type?: string
  ): Promise<SupportResource[]> {
    const content = await this.getCulturalContent(locale);
    if (!content) {
      return [];
    }

    let resources = content.supportResources;

    if (type) {
      resources = resources.filter(r => r.type === type);
    }

    return resources;
  }

  /**
   * Create cultural assessment for user
   */
  public async createCulturalAssessment(
    userId: string,
    assessmentData: Partial<CulturalAssessment>
  ): Promise<CulturalAssessment> {
    const assessment: CulturalAssessment = {
      userId,
      locale: assessmentData.locale || 'en-US',
      culturalBackground: assessmentData.culturalBackground || [],
      religiousAffiliation: assessmentData.religiousAffiliation,
      languagePreferences: assessmentData.languagePreferences || ['en'],
      familyStructure: assessmentData.familyStructure || 'nuclear',
      communityConnections: assessmentData.communityConnections || [],
      previousMentalHealthExperience: assessmentData.previousMentalHealthExperience || false,
      stigmaLevel: assessmentData.stigmaLevel || 5,
      preferredSupportType: assessmentData.preferredSupportType || [],
      accessibilityNeeds: assessmentData.accessibilityNeeds || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.userAssessments.set(userId, assessment);
    return assessment;
  }

  /**
   * Get user's cultural assessment
   */
  public async getUserAssessment(userId: string): Promise<CulturalAssessment | null> {
    return this.userAssessments.get(userId) || null;
  }

  /**
   * Get personalized recommendations
   */
  public async getPersonalizedRecommendations(
    userId: string
  ): Promise<{
    copingStrategies: CopingStrategy[];
    supportResources: SupportResource[];
    communicationGuidelines: CommunicationGuideline[];
  }> {
    const assessment = await this.getUserAssessment(userId);
    if (!assessment) {
      throw new Error('No cultural assessment found for user');
    }

    const content = await this.getCulturalContent(assessment.locale);
    if (!content) {
      throw new Error('No cultural content available for user locale');
    }

    // Filter strategies based on cultural appropriateness
    const copingStrategies = content.copingStrategies
      .filter(s => s.culturallyAppropriate)
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 10);

    // Filter resources based on language preferences
    const supportResources = content.supportResources
      .filter(r => r.languages.some(lang => 
        assessment.languagePreferences.includes(lang)
      ))
      .slice(0, 5);

    // Get relevant communication guidelines
    const communicationGuidelines = content.communicationGuidelines
      .filter(g => g.context === 'crisis' || g.context === 'support');

    return {
      copingStrategies,
      supportResources,
      communicationGuidelines
    };
  }

  /**
   * Default support resources by locale
   */
  private getDefaultSupportResources(locale: string): SupportResource[] {
    const baseResources: SupportResource[] = [
      {
        id: 'national-suicide-prevention',
        name: 'National Suicide Prevention Lifeline',
        type: 'hotline',
        description: 'Free and confidential emotional support 24/7',
        contactInfo: { phone: '988' },
        languages: locale === 'es-US' ? ['es', 'en'] : ['en'],
        culturalSpecialization: locale === 'es-US' ? ['latino', 'hispanic'] : ['general'],
        availability: { available24x7: true },
        cost: 'free',
        accessibility: { multiLanguage: true }
      }
    ];

    return baseResources;
  }

  /**
   * Default communication guidelines by locale
   */
  private getDefaultCommunicationGuidelines(locale: string): CommunicationGuideline[] {
    return [
      {
        id: 'crisis-communication',
        context: 'crisis',
        doRecommendations: locale === 'es-US' 
          ? ['Show respect for family', 'Use formal address', 'Acknowledge cultural values']
          : ['Be direct and clear', 'Validate feelings', 'Provide options'],
        avoidRecommendations: locale === 'es-US'
          ? ['Dismiss family concerns', 'Rush decisions', 'Ignore religious beliefs']
          : ['Be dismissive', 'Make assumptions', 'Use medical jargon'],
        culturalNuances: [],
        nonVerbalConsiderations: [],
        languagePreferences: [
          {
            language: locale.split('-')[0],
            formalityLevel: locale === 'es-US' ? 'formal' : 'mixed',
            preferredTerms: {},
            avoidedTerms: []
          }
        ]
      }
    ];
  }

  /**
   * Default coping strategies by locale
   */
  private getDefaultCopingStrategies(locale: string): CopingStrategy[] {
    return [
      {
        id: 'deep-breathing',
        name: locale === 'es-US' ? 'Respiración Profunda' : 'Deep Breathing',
        description: locale === 'es-US' 
          ? 'Técnica de respiración para calmar la ansiedad'
          : 'Breathing technique to calm anxiety',
        culturallyAppropriate: true,
        category: 'individual',
        effectiveness: 4,
        culturalConsiderations: []
      }
    ];
  }

  /**
   * Default crisis approaches by locale
   */
  private getDefaultCrisisApproaches(locale: string): CrisisApproach[] {
    return [
      {
        id: 'immediate-safety',
        name: locale === 'es-US' ? 'Seguridad Inmediata' : 'Immediate Safety',
        description: locale === 'es-US'
          ? 'Evaluación inmediata de seguridad con apoyo familiar'
          : 'Immediate safety assessment and intervention',
        urgencyLevel: 'immediate',
        culturalFactors: locale === 'es-US' 
          ? ['family-involvement', 'religious-support']
          : ['individual-autonomy', 'professional-support'],
        recommendedActions: [],
        avoidActions: [],
        familyInvolvement: locale === 'es-US',
        communityInvolvement: locale === 'es-US',
        professionalReferral: true
      }
    ];
  }

  /**
   * Default accessibility considerations
   */
  private getDefaultAccessibilityConsiderations(): AccessibilityConsiderations {
    return {
      visualImpairment: {
        available: true,
        methods: ['screen-reader', 'high-contrast', 'large-text'],
        resources: ['NVDA', 'JAWS', 'VoiceOver'],
        specialConsiderations: ['Describe visual elements', 'Use clear headings']
      },
      hearingImpairment: {
        available: true,
        methods: ['sign-language', 'captions', 'text-chat'],
        resources: ['ASL interpreters', 'Video relay'],
        specialConsiderations: ['Visual alerts', 'Written communication']
      },
      cognitiveConsiderations: {
        available: true,
        methods: ['simple-language', 'visual-aids', 'step-by-step'],
        resources: ['Easy-read materials', 'Cognitive aids'],
        specialConsiderations: ['Allow extra time', 'Repeat information']
      },
      motorImpairment: {
        available: true,
        methods: ['voice-control', 'switch-access', 'eye-tracking'],
        resources: ['Adaptive hardware', 'Voice recognition'],
        specialConsiderations: ['Alternative input methods', 'Accessible interfaces']
      },
      languageBarriers: {
        translationServices: true,
        interpreterServices: true,
        multilingualStaff: true,
        culturalLiaisons: true,
        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'zh', 'ja']
      }
    };
  }
}

// Export singleton instance
export const culturalMentalHealthService = new CulturalMentalHealthService();
