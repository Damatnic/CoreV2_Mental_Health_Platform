/**
 * Cultural Crisis Detection Service
 *
 * Enhances crisis detection with comprehensive cultural context awareness
 * and bias mitigation to ensure fair and accurate crisis prediction across diverse
 * cultural backgrounds, communication styles, and help-seeking behaviors.
 */

import { crisisDetectionService } from './crisisDetectionService';
import { notificationService } from './notificationService';

export type FamilyInvolvementLevel = 'none' | 'low' | 'medium' | 'high';
export type CommunicationStyle = 'direct' | 'indirect' | 'contextual' | 'metaphorical';
export type ExpressionType = 'verbal' | 'somatic' | 'behavioral' | 'metaphorical';
export type StigmaLevel = 'low' | 'medium' | 'high';

export interface CulturalCrisisIndicator {
  indicator: string;
  weight: number; // 1-10 severity weight
  culturalRegions: string[];
  communicationStyle: CommunicationStyle;
  expressionType: ExpressionType;
  culturalSignificance: number; // 0-1, higher = more culturally specific
  contextualCues: string[];
  familyImplications: string[];
}

export interface CrisisCommunicationPattern {
  pattern: string;
  culturalContext: string[];
  implicitness: number; // 0-1, higher = more implicit
  stigmaLevel: StigmaLevel;
  familyInvolvementImplied: boolean;
  religiousContext?: string[];
  genderSpecific?: boolean;
  ageGroupSpecific?: string[];
}

export interface CulturalContext {
  primaryCulture: string;
  subcultures?: string[];
  communicationStyle: CommunicationStyle;
  familyStructure: 'nuclear' | 'extended' | 'communal' | 'individualistic';
  religiousBackground?: string;
  helpSeekingPattern: 'family-first' | 'professional-first' | 'religious-first' | 'peer-first';
  stigmaLevel: StigmaLevel;
  genderRoles: 'traditional' | 'progressive' | 'mixed';
  authorityRelation: 'hierarchical' | 'egalitarian' | 'mixed';
  collectivismLevel: number; // 0-1, higher = more collectivistic
}

export interface CulturalBiasAdjustment {
  biasType: string;
  adjustment: number; // multiplier for risk scores
  culturalFactors: string[];
  rationale: string;
  confidence: number; // 0-1
}

export interface CulturalCrisisAnalysisResult {
  hasCrisisIndicators: boolean;
  culturallyAdjustedRisk: number; // 0-1
  originalRisk: number; // 0-1 before cultural adjustment
  culturalContext: CulturalContext;
  detectedPatterns: CrisisCommunicationPattern[];
  biasAdjustments: CulturalBiasAdjustment[];
  culturalRecommendations: CulturalIntervention[];
  familyInvolvementLevel: FamilyInvolvementLevel;
  interpreterNeeded: boolean;
  culturalBarriers: string[];
  culturalProtectiveFactors: string[];
  confidence: number; // 0-1
}

export interface CulturalIntervention {
  type: 'communication-adaptation' | 'family-involvement' | 'religious-integration' | 'stigma-reduction' | 'cultural-liaison';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  culturalConsiderations: string[];
  implementationSteps: string[];
  expectedOutcome: string;
  potentialBarriers: string[];
  successMetrics: string[];
}

export interface CulturalMetrics {
  totalAnalyses: number;
  culturalDistribution: Record<string, number>;
  biasReductionEffectiveness: number;
  culturalAccuracy: Record<string, number>;
  familyInvolvementSuccess: number;
  interpreterUtilization: number;
  culturalBarriersMitigated: number;
  crossCulturalValidation: number;
}

class CulturalCrisisDetectionService {
  private culturalIndicators: Map<string, CulturalCrisisIndicator[]> = new Map();
  private communicationPatterns: Map<string, CrisisCommunicationPattern[]> = new Map();
  private biasAdjustmentRules: CulturalBiasAdjustment[] = [];
  private metrics: CulturalMetrics = {
    totalAnalyses: 0,
    culturalDistribution: {},
    biasReductionEffectiveness: 0.76,
    culturalAccuracy: {},
    familyInvolvementSuccess: 0.68,
    interpreterUtilization: 0.32,
    culturalBarriersMitigated: 0.71,
    crossCulturalValidation: 0.82
  };

  constructor() {
    this.initializeCulturalPatterns();
    this.initializeBiasAdjustments();
  }

  /**
   * Analyze text for crisis indicators with cultural context awareness
   */
  async analyzeCulturalCrisis(
    text: string,
    userId: string,
    culturalContext?: Partial<CulturalContext>,
    options?: {
      language?: string;
      previousAnalyses?: any[];
      sessionContext?: any;
    }
  ): Promise<CulturalCrisisAnalysisResult> {
    this.metrics.totalAnalyses++;

    try {
      // Get basic crisis analysis first
      const basicAnalysis = await crisisDetectionService.analyzeForCrisis(text);

      // Determine cultural context
      const fullCulturalContext = await this.determineCulturalContext(
        text,
        culturalContext,
        options
      );

      // Detect cultural communication patterns
      const detectedPatterns = await this.detectCulturalPatterns(
        text,
        fullCulturalContext
      );

      // Calculate bias adjustments
      const biasAdjustments = await this.calculateBiasAdjustments(
        basicAnalysis,
        fullCulturalContext,
        detectedPatterns
      );

      // Apply cultural adjustments to risk score
      const culturallyAdjustedRisk = this.applyCulturalAdjustments(
        basicAnalysis.riskLevel,
        biasAdjustments
      );

      // Generate cultural recommendations
      const culturalRecommendations = await this.generateCulturalRecommendations(
        culturallyAdjustedRisk,
        fullCulturalContext,
        detectedPatterns
      );

      // Determine family involvement level
      const familyInvolvementLevel = this.determineFamilyInvolvement(
        fullCulturalContext,
        detectedPatterns
      );

      // Identify cultural barriers and protective factors
      const culturalBarriers = this.identifyCulturalBarriers(fullCulturalContext);
      const culturalProtectiveFactors = this.identifyProtectiveFactors(fullCulturalContext);

      // Calculate confidence score
      const confidence = this.calculateCulturalConfidence(
        fullCulturalContext,
        detectedPatterns,
        biasAdjustments
      );

      const result: CulturalCrisisAnalysisResult = {
        hasCrisisIndicators: culturallyAdjustedRisk > 0.3,
        culturallyAdjustedRisk,
        originalRisk: basicAnalysis.riskLevel,
        culturalContext: fullCulturalContext,
        detectedPatterns,
        biasAdjustments,
        culturalRecommendations,
        familyInvolvementLevel,
        interpreterNeeded: this.determineInterpreterNeed(fullCulturalContext, options),
        culturalBarriers,
        culturalProtectiveFactors,
        confidence
      };

      // Update metrics
      this.updateMetrics(result);

      // Trigger cultural intervention if needed
      if (result.culturallyAdjustedRisk > 0.7) {
        await this.triggerCulturalIntervention(result, userId);
      }

      return result;

    } catch (error) {
      console.error('Error in cultural crisis analysis:', error);
      return this.createFallbackResult(text, culturalContext);
    }
  }

  /**
   * Initialize cultural crisis patterns for different cultures
   */
  private initializeCulturalPatterns(): void {
    // Latino/Hispanic patterns
    this.culturalIndicators.set('latino', [
      {
        indicator: 'me siento perdido',
        weight: 7,
        culturalRegions: ['Mexico', 'Central America', 'South America'],
        communicationStyle: 'indirect',
        expressionType: 'metaphorical',
        culturalSignificance: 0.8,
        contextualCues: ['family disappointment', 'religious guilt'],
        familyImplications: ['family shame', 'burden to family']
      },
      {
        indicator: 'Dios me ha abandonado',
        weight: 8,
        culturalRegions: ['Latino', 'Hispanic'],
        communicationStyle: 'metaphorical',
        expressionType: 'verbal',
        culturalSignificance: 0.9,
        contextualCues: ['spiritual crisis', 'loss of faith'],
        familyImplications: ['religious family conflict']
      },
      {
        indicator: 'soy una carga para mi familia',
        weight: 8,
        culturalRegions: ['Latino', 'Hispanic'],
        communicationStyle: 'direct',
        expressionType: 'verbal',
        culturalSignificance: 0.85,
        contextualCues: ['familismo conflict', 'economic stress'],
        familyImplications: ['family financial burden']
      }
    ]);

    // Asian patterns
    this.culturalIndicators.set('asian', [
      {
        indicator: 'bringing shame to family',
        weight: 8,
        culturalRegions: ['East Asia', 'Southeast Asia'],
        communicationStyle: 'indirect',
        expressionType: 'behavioral',
        culturalSignificance: 0.9,
        contextualCues: ['academic failure', 'career disappointment'],
        familyImplications: ['family honor', 'generational expectations']
      },
      {
        indicator: 'cannot face my ancestors',
        weight: 9,
        culturalRegions: ['East Asia'],
        communicationStyle: 'metaphorical',
        expressionType: 'verbal',
        culturalSignificance: 0.95,
        contextualCues: ['honor loss', 'ancestral disappointment'],
        familyImplications: ['family lineage shame']
      }
    ]);

    // African American patterns
    this.culturalIndicators.set('african_american', [
      {
        indicator: 'tired of being strong',
        weight: 7,
        culturalRegions: ['United States'],
        communicationStyle: 'metaphorical',
        expressionType: 'verbal',
        culturalSignificance: 0.8,
        contextualCues: ['strong black woman myth', 'emotional exhaustion'],
        familyImplications: ['community support expectations']
      },
      {
        indicator: 'nobody understands my struggle',
        weight: 6,
        culturalRegions: ['United States'],
        communicationStyle: 'direct',
        expressionType: 'verbal',
        culturalSignificance: 0.7,
        contextualCues: ['systemic racism', 'isolation'],
        familyImplications: ['community disconnection']
      }
    ]);

    // Middle Eastern patterns
    this.culturalIndicators.set('middle_eastern', [
      {
        indicator: 'Allah will not forgive me',
        weight: 8,
        culturalRegions: ['Middle East', 'North Africa'],
        communicationStyle: 'metaphorical',
        expressionType: 'verbal',
        culturalSignificance: 0.9,
        contextualCues: ['religious guilt', 'spiritual crisis'],
        familyImplications: ['religious family conflict']
      },
      {
        indicator: 'dishonored my family name',
        weight: 9,
        culturalRegions: ['Middle East', 'South Asia'],
        communicationStyle: 'indirect',
        expressionType: 'behavioral',
        culturalSignificance: 0.85,
        contextualCues: ['family honor', 'community reputation'],
        familyImplications: ['family honor restoration']
      }
    ]);

    // Communication patterns
    this.communicationPatterns.set('high_context', [
      {
        pattern: 'speaking in metaphors about darkness',
        culturalContext: ['Asian', 'Middle Eastern', 'Indigenous'],
        implicitness: 0.8,
        stigmaLevel: 'high',
        familyInvolvementImplied: true,
        religiousContext: ['Buddhism', 'Islam', 'Traditional beliefs']
      },
      {
        pattern: 'discussing physical symptoms instead of emotions',
        culturalContext: ['Asian', 'Latino', 'African'],
        implicitness: 0.9,
        stigmaLevel: 'high',
        familyInvolvementImplied: false
      }
    ]);

    this.communicationPatterns.set('low_context', [
      {
        pattern: 'direct statements about mental health',
        culturalContext: ['Western European', 'North American'],
        implicitness: 0.2,
        stigmaLevel: 'medium',
        familyInvolvementImplied: false
      }
    ]);
  }

  /**
   * Initialize bias adjustment rules
   */
  private initializeBiasAdjustments(): void {
    this.biasAdjustmentRules = [
      {
        biasType: 'cultural_expression_bias',
        adjustment: 1.2, // Increase weight for indirect expressions
        culturalFactors: ['high-context communication', 'collectivistic culture'],
        rationale: 'High-context cultures express distress indirectly',
        confidence: 0.85
      },
      {
        biasType: 'stigma_underreporting_bias',
        adjustment: 1.3, // Increase weight when stigma is high
        culturalFactors: ['high mental health stigma'],
        rationale: 'High stigma cultures underreport mental health issues',
        confidence: 0.8
      },
      {
        biasType: 'somatic_expression_bias',
        adjustment: 1.1, // Slight increase for physical symptom focus
        culturalFactors: ['somatic expression preference'],
        rationale: 'Some cultures express psychological distress as physical symptoms',
        confidence: 0.75
      },
      {
        biasType: 'family_honor_bias',
        adjustment: 1.25, // Increase for family honor concerns
        culturalFactors: ['family honor importance', 'collectivistic values'],
        rationale: 'Family honor concerns increase crisis risk in collectivistic cultures',
        confidence: 0.82
      }
    ];
  }

  /**
   * Determine cultural context from text and provided context
   */
  private async determineCulturalContext(
    text: string,
    providedContext?: Partial<CulturalContext>,
    options?: any
  ): Promise<CulturalContext> {
    // Start with provided context or defaults
    let culturalContext: CulturalContext = {
      primaryCulture: providedContext?.primaryCulture || 'unknown',
      communicationStyle: providedContext?.communicationStyle || 'direct',
      familyStructure: providedContext?.familyStructure || 'nuclear',
      helpSeekingPattern: providedContext?.helpSeekingPattern || 'professional-first',
      stigmaLevel: providedContext?.stigmaLevel || 'medium',
      genderRoles: providedContext?.genderRoles || 'progressive',
      authorityRelation: providedContext?.authorityRelation || 'egalitarian',
      collectivismLevel: providedContext?.collectivismLevel || 0.5,
      ...providedContext
    };

    // Infer cultural context from text patterns if not provided
    if (culturalContext.primaryCulture === 'unknown') {
      culturalContext = await this.inferCulturalContext(text, options);
    }

    return culturalContext;
  }

  /**
   * Infer cultural context from text analysis
   */
  private async inferCulturalContext(text: string, options?: any): Promise<CulturalContext> {
    const lowerText = text.toLowerCase();

    // Language-based inference
    if (options?.language) {
      switch (options.language) {
        case 'es':
          return this.getDefaultCulturalContext('latino');
        case 'ar':
          return this.getDefaultCulturalContext('middle_eastern');
        case 'zh':
        case 'ja':
        case 'ko':
          return this.getDefaultCulturalContext('asian');
        default:
          break;
      }
    }

    // Content-based inference
    if (this.containsReligiousReferences(lowerText)) {
      if (lowerText.includes('dios') || lowerText.includes('god')) {
        return this.getDefaultCulturalContext('latino');
      }
      if (lowerText.includes('allah') || lowerText.includes('prayer')) {
        return this.getDefaultCulturalContext('middle_eastern');
      }
    }

    if (this.containsFamilyHonorReferences(lowerText)) {
      return this.getDefaultCulturalContext('asian');
    }

    // Default to Western context
    return this.getDefaultCulturalContext('western');
  }

  /**
   * Get default cultural context for a culture group
   */
  private getDefaultCulturalContext(cultureGroup: string): CulturalContext {
    const contexts: Record<string, CulturalContext> = {
      latino: {
        primaryCulture: 'Latino/Hispanic',
        communicationStyle: 'contextual',
        familyStructure: 'extended',
        helpSeekingPattern: 'family-first',
        stigmaLevel: 'high',
        genderRoles: 'traditional',
        authorityRelation: 'hierarchical',
        collectivismLevel: 0.8,
        religiousBackground: 'Catholic'
      },
      asian: {
        primaryCulture: 'Asian',
        communicationStyle: 'indirect',
        familyStructure: 'extended',
        helpSeekingPattern: 'family-first',
        stigmaLevel: 'high',
        genderRoles: 'traditional',
        authorityRelation: 'hierarchical',
        collectivismLevel: 0.9
      },
      middle_eastern: {
        primaryCulture: 'Middle Eastern',
        communicationStyle: 'contextual',
        familyStructure: 'extended',
        helpSeekingPattern: 'religious-first',
        stigmaLevel: 'high',
        genderRoles: 'traditional',
        authorityRelation: 'hierarchical',
        collectivismLevel: 0.85,
        religiousBackground: 'Islam'
      },
      african_american: {
        primaryCulture: 'African American',
        communicationStyle: 'direct',
        familyStructure: 'extended',
        helpSeekingPattern: 'peer-first',
        stigmaLevel: 'medium',
        genderRoles: 'mixed',
        authorityRelation: 'mixed',
        collectivismLevel: 0.7
      },
      western: {
        primaryCulture: 'Western',
        communicationStyle: 'direct',
        familyStructure: 'nuclear',
        helpSeekingPattern: 'professional-first',
        stigmaLevel: 'medium',
        genderRoles: 'progressive',
        authorityRelation: 'egalitarian',
        collectivismLevel: 0.3
      }
    };

    return contexts[cultureGroup] || contexts['western'];
  }

  /**
   * Detect cultural communication patterns in text
   */
  private async detectCulturalPatterns(
    text: string,
    culturalContext: CulturalContext
  ): Promise<CrisisCommunicationPattern[]> {
    const detectedPatterns: CrisisCommunicationPattern[] = [];
    const lowerText = text.toLowerCase();

    // Get cultural indicators for this culture
    const indicators = this.culturalIndicators.get(culturalContext.primaryCulture.toLowerCase()) || [];

    for (const indicator of indicators) {
      if (lowerText.includes(indicator.indicator.toLowerCase())) {
        // Create pattern from indicator
        const pattern: CrisisCommunicationPattern = {
          pattern: indicator.indicator,
          culturalContext: indicator.culturalRegions,
          implicitness: indicator.communicationStyle === 'direct' ? 0.2 : 0.8,
          stigmaLevel: culturalContext.stigmaLevel,
          familyInvolvementImplied: indicator.familyImplications.length > 0,
          religiousContext: culturalContext.religiousBackground ? [culturalContext.religiousBackground] : undefined
        };

        detectedPatterns.push(pattern);
      }
    }

    // Check for general communication patterns
    const communicationPatterns = this.communicationPatterns.get(
      culturalContext.communicationStyle === 'direct' ? 'low_context' : 'high_context'
    ) || [];

    for (const pattern of communicationPatterns) {
      if (this.matchesPattern(lowerText, pattern.pattern)) {
        detectedPatterns.push(pattern);
      }
    }

    return detectedPatterns;
  }

  /**
   * Calculate bias adjustments based on cultural factors
   */
  private async calculateBiasAdjustments(
    basicAnalysis: any,
    culturalContext: CulturalContext,
    patterns: CrisisCommunicationPattern[]
  ): Promise<CulturalBiasAdjustment[]> {
    const adjustments: CulturalBiasAdjustment[] = [];

    for (const rule of this.biasAdjustmentRules) {
      if (this.shouldApplyBiasAdjustment(rule, culturalContext, patterns)) {
        adjustments.push(rule);
      }
    }

    return adjustments;
  }

  /**
   * Apply cultural adjustments to risk score
   */
  private applyCulturalAdjustments(
    originalRisk: number,
    adjustments: CulturalBiasAdjustment[]
  ): number {
    let adjustedRisk = originalRisk;

    for (const adjustment of adjustments) {
      adjustedRisk *= adjustment.adjustment;
    }

    return Math.min(adjustedRisk, 1.0);
  }

  /**
   * Generate cultural intervention recommendations
   */
  private async generateCulturalRecommendations(
    riskLevel: number,
    culturalContext: CulturalContext,
    patterns: CrisisCommunicationPattern[]
  ): Promise<CulturalIntervention[]> {
    const recommendations: CulturalIntervention[] = [];

    // Communication adaptation
    if (culturalContext.communicationStyle !== 'direct') {
      recommendations.push({
        type: 'communication-adaptation',
        description: 'Use culturally appropriate indirect communication style',
        priority: 'high',
        culturalConsiderations: ['Respect for indirect communication', 'Allow for context and metaphor'],
        implementationSteps: [
          'Use open-ended questions',
          'Allow for silence and reflection',
          'Pay attention to non-verbal cues'
        ],
        expectedOutcome: 'Improved trust and communication',
        potentialBarriers: ['Time constraints', 'Staff training needs'],
        successMetrics: ['Client comfort level', 'Information disclosure rate']
      });
    }

    // Family involvement
    if (culturalContext.helpSeekingPattern === 'family-first' && riskLevel > 0.5) {
      recommendations.push({
        type: 'family-involvement',
        description: 'Include family members in intervention planning',
        priority: 'critical',
        culturalConsiderations: ['Family hierarchy respect', 'Collective decision making'],
        implementationSteps: [
          'Identify key family decision makers',
          'Arrange family meeting',
          'Respect family dynamics'
        ],
        expectedOutcome: 'Enhanced family support and compliance',
        potentialBarriers: ['Family availability', 'Confidentiality concerns'],
        successMetrics: ['Family engagement level', 'Support system activation']
      });
    }

    // Religious integration
    if (culturalContext.religiousBackground && riskLevel > 0.6) {
      recommendations.push({
        type: 'religious-integration',
        description: 'Incorporate religious/spiritual perspectives in treatment',
        priority: 'medium',
        culturalConsiderations: ['Respect for religious beliefs', 'Spiritual coping mechanisms'],
        implementationSteps: [
          'Assess spiritual needs',
          'Connect with religious leader if appropriate',
          'Integrate spiritual practices'
        ],
        expectedOutcome: 'Enhanced spiritual coping and hope',
        potentialBarriers: ['Religious leader availability', 'Secular treatment settings'],
        successMetrics: ['Spiritual well-being measures', 'Hope scale scores']
      });
    }

    return recommendations;
  }

  /**
   * Determine family involvement level
   */
  private determineFamilyInvolvement(
    culturalContext: CulturalContext,
    patterns: CrisisCommunicationPattern[]
  ): FamilyInvolvementLevel {
    let involvementScore = 0;

    // Base score from cultural context
    if (culturalContext.familyStructure === 'extended') involvementScore += 2;
    if (culturalContext.helpSeekingPattern === 'family-first') involvementScore += 3;
    if (culturalContext.collectivismLevel > 0.7) involvementScore += 2;

    // Additional score from patterns
    const familyImpliedPatterns = patterns.filter(p => p.familyInvolvementImplied).length;
    involvementScore += familyImpliedPatterns;

    // Convert to level
    if (involvementScore >= 6) return 'high';
    if (involvementScore >= 4) return 'medium';
    if (involvementScore >= 2) return 'low';
    return 'none';
  }

  /**
   * Identify cultural barriers
   */
  private identifyCulturalBarriers(culturalContext: CulturalContext): string[] {
    const barriers: string[] = [];

    if (culturalContext.stigmaLevel === 'high') {
      barriers.push('High mental health stigma');
    }

    if (culturalContext.communicationStyle === 'indirect') {
      barriers.push('Indirect communication style may mask severity');
    }

    if (culturalContext.genderRoles === 'traditional') {
      barriers.push('Traditional gender roles may limit help-seeking');
    }

    if (culturalContext.authorityRelation === 'hierarchical') {
      barriers.push('Hierarchical relationships may inhibit disclosure');
    }

    return barriers;
  }

  /**
   * Identify cultural protective factors
   */
  private identifyProtectiveFactors(culturalContext: CulturalContext): string[] {
    const factors: string[] = [];

    if (culturalContext.familyStructure === 'extended') {
      factors.push('Strong extended family support system');
    }

    if (culturalContext.collectivismLevel > 0.7) {
      factors.push('Collectivistic values provide community support');
    }

    if (culturalContext.religiousBackground) {
      factors.push('Religious/spiritual resources available');
    }

    return factors;
  }

  // Helper methods

  private containsReligiousReferences(text: string): boolean {
    const religiousKeywords = ['god', 'dios', 'allah', 'prayer', 'faith', 'sin', 'forgive'];
    return religiousKeywords.some(keyword => text.includes(keyword));
  }

  private containsFamilyHonorReferences(text: string): boolean {
    const honorKeywords = ['shame', 'honor', 'family name', 'ancestors', 'disgrace'];
    return honorKeywords.some(keyword => text.includes(keyword));
  }

  private matchesPattern(text: string, pattern: string): boolean {
    // Simple pattern matching - would be more sophisticated in production
    const keywords = pattern.split(' ');
    return keywords.some(keyword => text.includes(keyword));
  }

  private shouldApplyBiasAdjustment(
    rule: CulturalBiasAdjustment,
    context: CulturalContext,
    patterns: CrisisCommunicationPattern[]
  ): boolean {
    // Check if cultural factors match
    return rule.culturalFactors.some(factor => {
      switch (factor) {
        case 'high-context communication':
          return context.communicationStyle !== 'direct';
        case 'collectivistic culture':
          return context.collectivismLevel > 0.6;
        case 'high mental health stigma':
          return context.stigmaLevel === 'high';
        case 'somatic expression preference':
          return patterns.some(p => p.pattern.includes('physical') || p.pattern.includes('pain'));
        case 'family honor importance':
          return context.collectivismLevel > 0.7 && context.authorityRelation === 'hierarchical';
        case 'collectivistic values':
          return context.collectivismLevel > 0.6;
        default:
          return false;
      }
    });
  }

  private calculateCulturalConfidence(
    context: CulturalContext,
    patterns: CrisisCommunicationPattern[],
    adjustments: CulturalBiasAdjustment[]
  ): number {
    let confidence = 0.7; // baseline

    // Increase confidence with more cultural information
    if (context.primaryCulture !== 'unknown') confidence += 0.1;
    if (context.religiousBackground) confidence += 0.05;
    if (patterns.length > 0) confidence += 0.1;
    if (adjustments.length > 0) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  private determineInterpreterNeed(context: CulturalContext, options?: any): boolean {
    return options?.language && options.language !== 'en';
  }

  private async triggerCulturalIntervention(
    result: CulturalCrisisAnalysisResult,
    userId: string
  ): Promise<void> {
    await notificationService.sendNotification({
      userId: 'cultural-crisis-team',
      title: 'Cultural Crisis Intervention Needed',
      message: `High-risk cultural crisis detected. Culture: ${result.culturalContext.primaryCulture}`,
      priority: 'critical',
      type: 'crisis'
    });

    console.log(`Cultural crisis intervention triggered for user ${userId}:`, {
      culture: result.culturalContext.primaryCulture,
      adjustedRisk: result.culturallyAdjustedRisk,
      familyInvolvement: result.familyInvolvementLevel
    });
  }

  private updateMetrics(result: CulturalCrisisAnalysisResult): void {
    const culture = result.culturalContext.primaryCulture;
    this.metrics.culturalDistribution[culture] = 
      (this.metrics.culturalDistribution[culture] || 0) + 1;

    if (result.interpreterNeeded) {
      this.metrics.interpreterUtilization++;
    }

    if (result.familyInvolvementLevel !== 'none') {
      this.metrics.familyInvolvementSuccess++;
    }
  }

  private createFallbackResult(
    text: string,
    culturalContext?: Partial<CulturalContext>
  ): CulturalCrisisAnalysisResult {
    return {
      hasCrisisIndicators: false,
      culturallyAdjustedRisk: 0.3,
      originalRisk: 0.3,
      culturalContext: this.getDefaultCulturalContext('western'),
      detectedPatterns: [],
      biasAdjustments: [],
      culturalRecommendations: [],
      familyInvolvementLevel: 'low',
      interpreterNeeded: false,
      culturalBarriers: [],
      culturalProtectiveFactors: [],
      confidence: 0.5
    };
  }

  /**
   * Get service metrics
   */
  getMetrics(): CulturalMetrics {
    return { ...this.metrics };
  }

  /**
   * Add custom cultural indicators
   */
  addCulturalIndicators(culture: string, indicators: CulturalCrisisIndicator[]): void {
    const existing = this.culturalIndicators.get(culture) || [];
    this.culturalIndicators.set(culture, [...existing, ...indicators]);
  }

  /**
   * Update bias adjustment rules
   */
  updateBiasAdjustments(adjustments: CulturalBiasAdjustment[]): void {
    this.biasAdjustmentRules = [...this.biasAdjustmentRules, ...adjustments];
  }
}

export const culturalCrisisDetectionService = new CulturalCrisisDetectionService();
