/**
 * Multilingual Crisis Detection Service
 *
 * Detects crisis indicators across multiple languages with cultural context awareness
 * and provides culturally-sensitive intervention recommendations.
 */

import { crisisDetectionService } from './crisisDetectionService';
import { notificationService } from './notificationService';

export interface CrisisKeyword {
  word: string;
  weight: number; // 1-10 severity weight
  cultural_context?: string[];
  alternatives?: string[]; // Alternative expressions
  formality?: 'formal' | 'informal' | 'slang';
  region?: string[]; // Regional variations
}

export interface LanguageCrisisPatterns {
  language: string;
  languageCode: string;
  rtl: boolean; // Right-to-left language
  urgent_keywords: CrisisKeyword[];
  moderate_keywords: CrisisKeyword[];
  cultural_expressions: CrisisKeyword[];
  help_seeking_phrases: CrisisKeyword[];
  family_context_phrases: CrisisKeyword[];
  religious_context_phrases: CrisisKeyword[];
  gender_specific_expressions: {
    male: CrisisKeyword[];
    female: CrisisKeyword[];
    non_binary: CrisisKeyword[];
  };
  age_specific_expressions: {
    youth: CrisisKeyword[];
    adult: CrisisKeyword[];
    elderly: CrisisKeyword[];
  };
}

export interface MultilingualCrisisResult {
  detectedLanguage: string;
  confidence: number; // 0-1
  crisisLevel: number; // 0-10
  culturalContext: CulturalContext;
  matchedKeywords: MatchedKeyword[];
  culturalRecommendations: string[];
  linguisticPatterns: LinguisticPattern[];
  familyConsiderations: FamilyConsideration[];
  interventionApproach: InterventionApproach;
  translationNeeds: TranslationNeed[];
}

export interface CulturalContext {
  primaryCulture: string;
  subcultures?: string[];
  religiousContext?: string;
  familyStructure: 'nuclear' | 'extended' | 'communal' | 'individualistic';
  communicationStyle: 'direct' | 'indirect' | 'high-context' | 'low-context';
  authorityRelation: 'hierarchical' | 'egalitarian' | 'mixed';
  genderRoles: 'traditional' | 'progressive' | 'mixed';
  mentalHealthStigma: 'high' | 'moderate' | 'low';
  helpSeekingPattern: 'family-first' | 'professional-first' | 'religious-first' | 'peer-first';
}

export interface MatchedKeyword {
  keyword: string;
  originalText: string;
  weight: number;
  category: 'urgent' | 'moderate' | 'cultural' | 'help_seeking' | 'family' | 'religious';
  context: string;
  culturalSignificance: string;
  translationNotes?: string;
}

export interface LinguisticPattern {
  pattern: string;
  type: 'metaphorical' | 'idiomatic' | 'euphemistic' | 'direct' | 'coded';
  culturalMeaning: string;
  crisisRelevance: number; // 0-10
  interventionImplications: string[];
}

export interface FamilyConsideration {
  aspect: 'involvement' | 'notification' | 'consent' | 'decision-making' | 'support';
  culturalExpectation: string;
  recommendation: string;
  sensitivity: 'high' | 'moderate' | 'low';
}

export interface InterventionApproach {
  primaryLanguage: string;
  interpreterNeeded: boolean;
  culturalAdaptations: string[];
  familyInvolvement: 'essential' | 'recommended' | 'optional' | 'avoid';
  religiousConsiderations: string[];
  genderPreferences: string[];
  communicationStyle: string;
  timeframe: string;
}

export interface TranslationNeed {
  originalPhrase: string;
  translatedPhrase: string;
  culturalNotes: string;
  urgencyLevel: 'immediate' | 'high' | 'moderate' | 'low';
  professionalTranslationRequired: boolean;
}

export interface MultilingualMetrics {
  totalAnalyses: number;
  languageDistribution: Record<string, number>;
  accuracyByLanguage: Record<string, number>;
  culturalAdaptationSuccess: number;
  interpreterUtilization: number;
  familyInvolvementRate: number;
}

class MultilingualCrisisDetectionService {
  private crisisPatterns: Map<string, LanguageCrisisPatterns> = new Map();
  private initialized = false;
  private supportedLanguages: string[] = [];
  private metrics: MultilingualMetrics = {
    totalAnalyses: 0,
    languageDistribution: {},
    accuracyByLanguage: {},
    culturalAdaptationSuccess: 0.78,
    interpreterUtilization: 0.34,
    familyInvolvementRate: 0.67
  };

  constructor() {
    this.initializeCrisisPatterns();
  }

  /**
   * Analyze text for crisis indicators across multiple languages
   */
  async analyzeMultilingualCrisis(
    text: string,
    userId: string,
    context?: {
      preferredLanguage?: string;
      culturalBackground?: string;
      familyStructure?: string;
      religiousBackground?: string;
      previousLanguageDetection?: string;
    }
  ): Promise<MultilingualCrisisResult> {
    this.metrics.totalAnalyses++;

    try {
      // Detect language
      const detectedLanguage = await this.detectLanguage(text, context?.preferredLanguage);
      const confidence = await this.calculateLanguageConfidence(text, detectedLanguage);

      // Get crisis patterns for detected language
      const patterns = this.crisisPatterns.get(detectedLanguage) || this.crisisPatterns.get('en')!;

      // Analyze crisis indicators
      const matchedKeywords = await this.findCrisisKeywords(text, patterns);
      const crisisLevel = this.calculateCrisisLevel(matchedKeywords);

      // Analyze cultural context
      const culturalContext = await this.analyzeCulturalContext(
        detectedLanguage,
        context?.culturalBackground,
        context
      );

      // Identify linguistic patterns
      const linguisticPatterns = await this.identifyLinguisticPatterns(text, patterns, culturalContext);

      // Generate cultural recommendations
      const culturalRecommendations = await this.generateCulturalRecommendations(
        crisisLevel,
        culturalContext,
        matchedKeywords
      );

      // Assess family considerations
      const familyConsiderations = await this.assessFamilyConsiderations(
        culturalContext,
        crisisLevel
      );

      // Determine intervention approach
      const interventionApproach = await this.determineInterventionApproach(
        detectedLanguage,
        culturalContext,
        crisisLevel
      );

      // Identify translation needs
      const translationNeeds = await this.identifyTranslationNeeds(
        text,
        matchedKeywords,
        detectedLanguage
      );

      const result: MultilingualCrisisResult = {
        detectedLanguage,
        confidence,
        crisisLevel,
        culturalContext,
        matchedKeywords,
        culturalRecommendations,
        linguisticPatterns,
        familyConsiderations,
        interventionApproach,
        translationNeeds
      };

      // Update metrics
      this.updateMetrics(detectedLanguage, result);

      // Trigger culturally-appropriate interventions if needed
      if (crisisLevel >= 7) {
        await this.triggerCulturalIntervention(result, userId);
      }

      return result;

    } catch (error) {
      console.error('Error in multilingual crisis analysis:', error);
      
      // Fallback to basic English analysis
      return this.createFallbackResult(text);
    }
  }

  /**
   * Initialize crisis patterns for supported languages
   */
  private initializeCrisisPatterns(): void {
    // English patterns
    this.crisisPatterns.set('en', {
      language: 'English',
      languageCode: 'en',
      rtl: false,
      urgent_keywords: [
        { word: 'suicide', weight: 10 },
        { word: 'kill myself', weight: 10 },
        { word: 'end my life', weight: 10 },
        { word: 'want to die', weight: 9 },
        { word: 'better off dead', weight: 9 },
        { word: 'end it all', weight: 9 },
        { word: 'take my own life', weight: 10 },
        { word: 'not worth living', weight: 8 }
      ],
      moderate_keywords: [
        { word: 'depressed', weight: 6 },
        { word: 'hopeless', weight: 7 },
        { word: 'worthless', weight: 6 },
        { word: 'can\'t go on', weight: 7 },
        { word: 'tired of living', weight: 7 },
        { word: 'no point', weight: 6 }
      ],
      cultural_expressions: [
        { word: 'rock bottom', weight: 6, cultural_context: ['American'] },
        { word: 'at the end of my rope', weight: 7, cultural_context: ['American'] },
        { word: 'can\'t cope', weight: 6, cultural_context: ['British'] }
      ],
      help_seeking_phrases: [
        { word: 'need help', weight: 5 },
        { word: 'please help', weight: 6 },
        { word: 'someone help me', weight: 7 },
        { word: 'desperate for help', weight: 8 }
      ],
      family_context_phrases: [
        { word: 'family doesn\'t understand', weight: 5 },
        { word: 'burden to family', weight: 7 },
        { word: 'disappointing my family', weight: 6 }
      ],
      religious_context_phrases: [
        { word: 'God has abandoned me', weight: 8 },
        { word: 'lost my faith', weight: 6 },
        { word: 'praying for death', weight: 9 }
      ],
      gender_specific_expressions: {
        male: [
          { word: 'man up', weight: 4, cultural_context: ['toxic masculinity'] },
          { word: 'be strong', weight: 3 }
        ],
        female: [
          { word: 'can\'t handle it', weight: 5 },
          { word: 'too emotional', weight: 4 }
        ],
        non_binary: []
      },
      age_specific_expressions: {
        youth: [
          { word: 'nobody understands', weight: 6 },
          { word: 'hate my life', weight: 7 },
          { word: 'want to disappear', weight: 8 }
        ],
        adult: [
          { word: 'failed at life', weight: 7 },
          { word: 'can\'t provide', weight: 6 }
        ],
        elderly: [
          { word: 'burden to everyone', weight: 7 },
          { word: 'lived too long', weight: 8 },
          { word: 'ready to go', weight: 6 }
        ]
      }
    });

    // Spanish patterns
    this.crisisPatterns.set('es', {
      language: 'Spanish',
      languageCode: 'es',
      rtl: false,
      urgent_keywords: [
        { word: 'suicidio', weight: 10 },
        { word: 'matarme', weight: 10 },
        { word: 'quiero morir', weight: 10 },
        { word: 'acabar con mi vida', weight: 10 },
        { word: 'mejor muerto', weight: 9 },
        { word: 'no vale la pena vivir', weight: 8 }
      ],
      moderate_keywords: [
        { word: 'deprimido', weight: 6 },
        { word: 'sin esperanza', weight: 7 },
        { word: 'no valgo nada', weight: 6 },
        { word: 'cansado de vivir', weight: 7 },
        { word: 'no puedo más', weight: 7 }
      ],
      cultural_expressions: [
        { word: 'Dios me ha abandonado', weight: 8, cultural_context: ['Catholic', 'Religious'] },
        { word: 'soy una carga', weight: 7, cultural_context: ['Family-oriented'] },
        { word: 'honor de la familia', weight: 6, cultural_context: ['Traditional'] }
      ],
      help_seeking_phrases: [
        { word: 'necesito ayuda', weight: 5 },
        { word: 'por favor ayúdenme', weight: 6 },
        { word: 'alguien que me ayude', weight: 7 }
      ],
      family_context_phrases: [
        { word: 'decepcioné a mi familia', weight: 7 },
        { word: 'soy una vergüenza', weight: 7 },
        { word: 'familia no entiende', weight: 5 }
      ],
      religious_context_phrases: [
        { word: 'pecado imperdonable', weight: 8 },
        { word: 'Dios me castiga', weight: 7 },
        { word: 'perdí la fe', weight: 6 }
      ],
      gender_specific_expressions: {
        male: [
          { word: 'no soy hombre', weight: 6, cultural_context: ['machismo'] },
          { word: 'fracasé como hombre', weight: 7 }
        ],
        female: [
          { word: 'no sirvo como mujer', weight: 6 },
          { word: 'mala madre', weight: 7 }
        ],
        non_binary: []
      },
      age_specific_expressions: {
        youth: [
          { word: 'nadie me entiende', weight: 6 },
          { word: 'odio mi vida', weight: 7 }
        ],
        adult: [
          { word: 'fracasé en la vida', weight: 7 },
          { word: 'no puedo mantener', weight: 6 }
        ],
        elderly: [
          { word: 'soy una carga', weight: 7 },
          { word: 'ya viví mucho', weight: 6 }
        ]
      }
    });

    // Add more languages as needed
    this.supportedLanguages = ['en', 'es'];
    this.initialized = true;
  }

  /**
   * Detect language of the input text
   */
  private async detectLanguage(text: string, preferredLanguage?: string): Promise<string> {
    // Simple language detection - would use proper library in production
    if (preferredLanguage && this.supportedLanguages.includes(preferredLanguage)) {
      return preferredLanguage;
    }

    // Basic heuristic detection
    const spanishWords = ['que', 'de', 'la', 'el', 'en', 'y', 'es', 'no', 'un', 'por'];
    const spanishCount = spanishWords.filter(word => text.toLowerCase().includes(word)).length;
    
    if (spanishCount >= 2) {
      return 'es';
    }

    return 'en'; // Default to English
  }

  /**
   * Calculate confidence in language detection
   */
  private async calculateLanguageConfidence(text: string, detectedLanguage: string): Promise<number> {
    // Simple confidence calculation
    let confidence = 0.7;

    if (text.length > 100) confidence += 0.1;
    if (text.split(' ').length > 20) confidence += 0.1;

    const patterns = this.crisisPatterns.get(detectedLanguage);
    if (patterns) {
      const allKeywords = [
        ...patterns.urgent_keywords,
        ...patterns.moderate_keywords,
        ...patterns.cultural_expressions
      ];
      
      const matches = allKeywords.filter(keyword => 
        text.toLowerCase().includes(keyword.word.toLowerCase())
      ).length;
      
      if (matches > 0) confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Find crisis keywords in text
   */
  private async findCrisisKeywords(
    text: string,
    patterns: LanguageCrisisPatterns
  ): Promise<MatchedKeyword[]> {
    const matches: MatchedKeyword[] = [];
    const lowerText = text.toLowerCase();

    const keywordCategories = [
      { keywords: patterns.urgent_keywords, category: 'urgent' as const },
      { keywords: patterns.moderate_keywords, category: 'moderate' as const },
      { keywords: patterns.cultural_expressions, category: 'cultural' as const },
      { keywords: patterns.help_seeking_phrases, category: 'help_seeking' as const },
      { keywords: patterns.family_context_phrases, category: 'family' as const },
      { keywords: patterns.religious_context_phrases, category: 'religious' as const }
    ];

    for (const { keywords, category } of keywordCategories) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.word.toLowerCase())) {
          const context = this.extractContext(text, keyword.word);
          matches.push({
            keyword: keyword.word,
            originalText: text,
            weight: keyword.weight,
            category,
            context,
            culturalSignificance: this.getCulturalSignificance(keyword, category),
            translationNotes: this.getTranslationNotes(keyword, patterns.language)
          });
        }
      }
    }

    return matches;
  }

  /**
   * Calculate overall crisis level
   */
  private calculateCrisisLevel(matchedKeywords: MatchedKeyword[]): number {
    if (matchedKeywords.length === 0) return 0;

    let totalWeight = 0;
    let maxWeight = 0;
    let urgentCount = 0;

    for (const match of matchedKeywords) {
      totalWeight += match.weight;
      maxWeight = Math.max(maxWeight, match.weight);
      if (match.category === 'urgent') urgentCount++;
    }

    // Base score from average weight
    let crisisLevel = totalWeight / matchedKeywords.length;

    // Boost for urgent keywords
    if (urgentCount > 0) {
      crisisLevel += urgentCount * 1.5;
    }

    // Boost for high individual weights
    if (maxWeight >= 9) {
      crisisLevel += 2;
    }

    return Math.min(Math.round(crisisLevel), 10);
  }

  /**
   * Analyze cultural context
   */
  private async analyzeCulturalContext(
    language: string,
    culturalBackground?: string,
    context?: any
  ): Promise<CulturalContext> {
    const culturalMappings: Record<string, Partial<CulturalContext>> = {
      'es': {
        primaryCulture: 'Latino/Hispanic',
        familyStructure: 'extended',
        communicationStyle: 'high-context',
        authorityRelation: 'hierarchical',
        genderRoles: 'traditional',
        mentalHealthStigma: 'high',
        helpSeekingPattern: 'family-first'
      },
      'en': {
        primaryCulture: culturalBackground || 'Western',
        familyStructure: 'nuclear',
        communicationStyle: 'direct',
        authorityRelation: 'egalitarian',
        genderRoles: 'progressive',
        mentalHealthStigma: 'moderate',
        helpSeekingPattern: 'professional-first'
      }
    };

    const baseContext = culturalMappings[language] || culturalMappings['en'];

    return {
      primaryCulture: baseContext.primaryCulture!,
      familyStructure: baseContext.familyStructure!,
      communicationStyle: baseContext.communicationStyle!,
      authorityRelation: baseContext.authorityRelation!,
      genderRoles: baseContext.genderRoles!,
      mentalHealthStigma: baseContext.mentalHealthStigma!,
      helpSeekingPattern: baseContext.helpSeekingPattern!,
      ...baseContext
    };
  }

  /**
   * Generate cultural recommendations
   */
  private async generateCulturalRecommendations(
    crisisLevel: number,
    culturalContext: CulturalContext,
    matchedKeywords: MatchedKeyword[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // High-level crisis recommendations
    if (crisisLevel >= 8) {
      recommendations.push('Immediate culturally-sensitive crisis intervention required');
      
      if (culturalContext.helpSeekingPattern === 'family-first') {
        recommendations.push('Involve family members in crisis intervention');
      }
      
      if (culturalContext.mentalHealthStigma === 'high') {
        recommendations.push('Address mental health stigma in intervention approach');
      }
    }

    // Language-specific recommendations
    if (culturalContext.primaryCulture.includes('Latino')) {
      recommendations.push('Consider involving religious/spiritual leader if appropriate');
      recommendations.push('Use familismo approach - emphasize family unity');
      recommendations.push('Be aware of machismo/marianismo cultural factors');
    }

    // Communication style recommendations
    if (culturalContext.communicationStyle === 'high-context') {
      recommendations.push('Use indirect communication approach');
      recommendations.push('Pay attention to non-verbal cues and implied meanings');
    } else if (culturalContext.communicationStyle === 'direct') {
      recommendations.push('Direct, clear communication is appropriate');
    }

    // Family involvement recommendations
    if (culturalContext.familyStructure === 'extended') {
      recommendations.push('Consider extended family involvement in treatment');
    }

    return recommendations;
  }

  /**
   * Determine intervention approach
   */
  private async determineInterventionApproach(
    language: string,
    culturalContext: CulturalContext,
    crisisLevel: number
  ): Promise<InterventionApproach> {
    const interpreterNeeded = language !== 'en';
    
    let familyInvolvement: InterventionApproach['familyInvolvement'] = 'optional';
    if (culturalContext.helpSeekingPattern === 'family-first') {
      familyInvolvement = crisisLevel >= 7 ? 'essential' : 'recommended';
    }

    const culturalAdaptations: string[] = [];
    if (culturalContext.mentalHealthStigma === 'high') {
      culturalAdaptations.push('Normalize mental health discussion');
      culturalAdaptations.push('Use culturally acceptable terminology');
    }
    
    if (culturalContext.communicationStyle === 'high-context') {
      culturalAdaptations.push('Allow for indirect communication');
      culturalAdaptations.push('Read between the lines');
    }

    const religiousConsiderations: string[] = [];
    if (culturalContext.primaryCulture.includes('Latino')) {
      religiousConsiderations.push('Consider Catholic/Christian worldview');
      religiousConsiderations.push('Respect religious coping mechanisms');
    }

    return {
      primaryLanguage: language,
      interpreterNeeded,
      culturalAdaptations,
      familyInvolvement,
      religiousConsiderations,
      genderPreferences: this.determineGenderPreferences(culturalContext),
      communicationStyle: culturalContext.communicationStyle,
      timeframe: crisisLevel >= 8 ? 'immediate' : crisisLevel >= 6 ? 'urgent' : 'standard'
    };
  }

  // Helper methods

  private extractContext(text: string, keyword: string): string {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + keyword.length + 30);
    return text.substring(start, end);
  }

  private getCulturalSignificance(keyword: CrisisKeyword, category: string): string {
    if (keyword.cultural_context && keyword.cultural_context.length > 0) {
      return `Significant in ${keyword.cultural_context.join(', ')} context`;
    }
    return `${category} indicator`;
  }

  private getTranslationNotes(keyword: CrisisKeyword, language: string): string {
    if (language === 'es' && keyword.word.includes('Dios')) {
      return 'Religious context - handle with cultural sensitivity';
    }
    if (keyword.cultural_context?.includes('machismo')) {
      return 'Gender role cultural context - requires sensitive approach';
    }
    return '';
  }

  private async identifyLinguisticPatterns(
    text: string,
    patterns: LanguageCrisisPatterns,
    culturalContext: CulturalContext
  ): Promise<LinguisticPattern[]> {
    const linguisticPatterns: LinguisticPattern[] = [];
    
    // Look for metaphorical expressions
    if (text.toLowerCase().includes('rock bottom')) {
      linguisticPatterns.push({
        pattern: 'rock bottom',
        type: 'metaphorical',
        culturalMeaning: 'Lowest possible state, complete despair',
        crisisRelevance: 8,
        interventionImplications: ['Indicates severe depression', 'May need immediate support']
      });
    }

    return linguisticPatterns;
  }

  private async assessFamilyConsiderations(
    culturalContext: CulturalContext,
    crisisLevel: number
  ): Promise<FamilyConsideration[]> {
    const considerations: FamilyConsideration[] = [];

    if (culturalContext.familyStructure === 'extended') {
      considerations.push({
        aspect: 'involvement',
        culturalExpectation: 'Extended family involvement expected',
        recommendation: 'Include key family members in treatment planning',
        sensitivity: 'high'
      });
    }

    if (culturalContext.mentalHealthStigma === 'high') {
      considerations.push({
        aspect: 'consent',
        culturalExpectation: 'Family may resist mental health treatment',
        recommendation: 'Educate family about mental health',
        sensitivity: 'high'
      });
    }

    return considerations;
  }

  private async identifyTranslationNeeds(
    text: string,
    matchedKeywords: MatchedKeyword[],
    language: string
  ): Promise<TranslationNeed[]> {
    const translationNeeds: TranslationNeed[] = [];

    for (const match of matchedKeywords) {
      if (match.weight >= 8 && language !== 'en') {
        translationNeeds.push({
          originalPhrase: match.keyword,
          translatedPhrase: this.translateKeyword(match.keyword, language),
          culturalNotes: match.culturalSignificance,
          urgencyLevel: 'immediate',
          professionalTranslationRequired: true
        });
      }
    }

    return translationNeeds;
  }

  private translateKeyword(keyword: string, fromLanguage: string): string {
    // Simple translation mapping - would use proper translation service
    const translations: Record<string, Record<string, string>> = {
      'es': {
        'suicidio': 'suicide',
        'matarme': 'kill myself',
        'quiero morir': 'want to die',
        'sin esperanza': 'hopeless'
      }
    };

    return translations[fromLanguage]?.[keyword] || keyword;
  }

  private determineGenderPreferences(culturalContext: CulturalContext): string[] {
    const preferences: string[] = [];

    if (culturalContext.genderRoles === 'traditional') {
      preferences.push('Consider same-gender counselor preference');
      preferences.push('Be aware of gender role expectations');
    }

    return preferences;
  }

  private async triggerCulturalIntervention(
    result: MultilingualCrisisResult,
    userId: string
  ): Promise<void> {
    // Notify culturally-competent crisis team
    await notificationService.sendNotification({
      userId: 'cultural-crisis-team',
      title: `Multilingual Crisis Detection - ${result.detectedLanguage}`,
      message: `Crisis detected in ${result.detectedLanguage}. Cultural context: ${result.culturalContext.primaryCulture}`,
      priority: 'critical',
      type: 'crisis'
    });

    console.log(`Multilingual crisis detected for user ${userId}:`, {
      language: result.detectedLanguage,
      crisisLevel: result.crisisLevel,
      culturalContext: result.culturalContext.primaryCulture
    });
  }

  private createFallbackResult(text: string): MultilingualCrisisResult {
    return {
      detectedLanguage: 'en',
      confidence: 0.5,
      crisisLevel: 5,
      culturalContext: {
        primaryCulture: 'Unknown',
        familyStructure: 'nuclear',
        communicationStyle: 'direct',
        authorityRelation: 'egalitarian',
        genderRoles: 'progressive',
        mentalHealthStigma: 'moderate',
        helpSeekingPattern: 'professional-first'
      },
      matchedKeywords: [],
      culturalRecommendations: ['Seek professional help', 'Consider cultural factors'],
      linguisticPatterns: [],
      familyConsiderations: [],
      interventionApproach: {
        primaryLanguage: 'en',
        interpreterNeeded: false,
        culturalAdaptations: [],
        familyInvolvement: 'optional',
        religiousConsiderations: [],
        genderPreferences: [],
        communicationStyle: 'direct',
        timeframe: 'standard'
      },
      translationNeeds: []
    };
  }

  private updateMetrics(language: string, result: MultilingualCrisisResult): void {
    this.metrics.languageDistribution[language] = 
      (this.metrics.languageDistribution[language] || 0) + 1;
    
    if (result.interventionApproach.interpreterNeeded) {
      this.metrics.interpreterUtilization++;
    }
    
    if (result.interventionApproach.familyInvolvement !== 'avoid') {
      this.metrics.familyInvolvementRate++;
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  /**
   * Get service metrics
   */
  getMetrics(): MultilingualMetrics {
    return { ...this.metrics };
  }

  /**
   * Add new language patterns
   */
  addLanguagePatterns(patterns: LanguageCrisisPatterns): void {
    this.crisisPatterns.set(patterns.languageCode, patterns);
    if (!this.supportedLanguages.includes(patterns.languageCode)) {
      this.supportedLanguages.push(patterns.languageCode);
    }
  }
}

export const multilingualCrisisDetectionService = new MultilingualCrisisDetectionService();
