/**
 * Cultural Crisis Detection Hook for Mental Health Platform
 * 
 * Advanced cultural awareness in crisis detection with sensitivity to
 * diverse expressions of distress, cultural norms, and intervention approaches.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// Types for cultural crisis detection
export interface CulturalContext {
  primaryCulture: string;
  secondaryCultures: string[];
  language: string;
  region: string;
  religiousAffiliation?: string;
  familyStructure: 'nuclear' | 'extended' | 'single_parent' | 'community' | 'other';
  communicationStyle: 'direct' | 'indirect' | 'high_context' | 'low_context';
  collectivismLevel: number; // 0-1 scale (0 = individualistic, 1 = collectivistic)
  hierarchyRespect: number; // 0-1 scale
  emotionalExpression: 'open' | 'reserved' | 'contextual' | 'ritualized';
  crisisConceptualization: string[]; // How crisis is understood culturally
}

export interface CulturalCrisisAnalysisResult {
  overallRisk: number; // 0-1 scale
  culturallyAdjustedRisk: number; // 0-1 scale, adjusted for cultural context
  biasAdjustments: string[];
  culturalFactors: {
    stigmaLevel: number;
    familyInvolvementExpectation: number;
    authorityTrust: number;
    spiritualBeliefs: number;
    communitySupport: number;
  };
  recommendedApproach: {
    communicationStyle: string;
    familyInvolvement: FamilyInvolvementLevel;
    communityApproach: boolean;
    religiousConsideration: boolean;
    culturalInterventions: string[];
    languagePreferences: string[];
  };
  culturalWarnings: string[];
  confidence: number; // 0-1 scale
  timestamp: number;
}

export type FamilyInvolvementLevel = 
  | 'none' 
  | 'minimal' 
  | 'moderate' 
  | 'high' 
  | 'essential' 
  | 'elder_mediated';

export interface CulturalCrisisDetectionState {
  isAnalyzing: boolean;
  lastAnalysis: CulturalCrisisAnalysisResult | null;
  culturallyAdjustedRisk: number;
  biasAdjustments: string[];
  culturalInterventions: {
    familyInvolvement: FamilyInvolvementLevel;
    communityApproach: boolean;
    religiousConsideration: boolean;
    languageSupport: string[];
    culturalMediators: string[];
  };
  analysisHistory: CulturalCrisisAnalysisResult[];
  culturalProfile: CulturalContext | null;
  supportedCultures: string[];
  isLoading: boolean;
  error: string | null;
}

export interface UseCulturalCrisisDetectionOptions {
  enableBiasCorrection?: boolean;
  enableCulturalProfiling?: boolean;
  defaultCulture?: string;
  supportedLanguages?: string[];
  familyInvolvementDefault?: FamilyInvolvementLevel;
  onCulturalRiskDetected?: (analysis: CulturalCrisisAnalysisResult) => void;
  onBiasDetected?: (biases: string[]) => void;
  onCulturalInterventionSuggested?: (interventions: string[]) => void;
}

const DEFAULT_OPTIONS: Required<Omit<UseCulturalCrisisDetectionOptions, 
  'onCulturalRiskDetected' | 'onBiasDetected' | 'onCulturalInterventionSuggested'>> = {
  enableBiasCorrection: true,
  enableCulturalProfiling: true,
  defaultCulture: 'western_general',
  supportedLanguages: ['en', 'es', 'zh', 'hi', 'ar', 'pt', 'ru', 'ja', 'fr', 'de'],
  familyInvolvementDefault: 'moderate'
};

const CULTURAL_PROFILES: Record<string, Partial<CulturalContext>> = {
  western_general: {
    communicationStyle: 'direct',
    collectivismLevel: 0.3,
    hierarchyRespect: 0.4,
    emotionalExpression: 'open',
    familyStructure: 'nuclear'
  },
  east_asian: {
    communicationStyle: 'high_context',
    collectivismLevel: 0.8,
    hierarchyRespect: 0.9,
    emotionalExpression: 'reserved',
    familyStructure: 'extended'
  },
  latin_american: {
    communicationStyle: 'indirect',
    collectivismLevel: 0.7,
    hierarchyRespect: 0.7,
    emotionalExpression: 'contextual',
    familyStructure: 'extended'
  },
  middle_eastern: {
    communicationStyle: 'high_context',
    collectivismLevel: 0.8,
    hierarchyRespect: 0.8,
    emotionalExpression: 'contextual',
    familyStructure: 'extended'
  },
  south_asian: {
    communicationStyle: 'indirect',
    collectivismLevel: 0.9,
    hierarchyRespect: 0.9,
    emotionalExpression: 'reserved',
    familyStructure: 'extended'
  },
  african: {
    communicationStyle: 'high_context',
    collectivismLevel: 0.8,
    hierarchyRespect: 0.7,
    emotionalExpression: 'ritualized',
    familyStructure: 'community'
  },
  indigenous: {
    communicationStyle: 'high_context',
    collectivismLevel: 0.9,
    hierarchyRespect: 0.8,
    emotionalExpression: 'ritualized',
    familyStructure: 'community'
  }
};

const CULTURAL_BIAS_PATTERNS = [
  'western_mental_health_model_bias',
  'individual_therapy_preference_bias',
  'direct_communication_expectation',
  'nuclear_family_assumption',
  'secular_intervention_bias',
  'time_urgency_bias',
  'emotional_expression_expectation',
  'authority_relationship_assumption',
  'privacy_expectation_bias',
  'medication_acceptance_assumption'
];

/**
 * Hook for cultural crisis detection with bias mitigation
 */
export const useCulturalCrisisDetection = (
  options: UseCulturalCrisisDetectionOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<CulturalCrisisDetectionState>({
    isAnalyzing: false,
    lastAnalysis: null,
    culturallyAdjustedRisk: 0,
    biasAdjustments: [],
    culturalInterventions: {
      familyInvolvement: opts.familyInvolvementDefault,
      communityApproach: false,
      religiousConsideration: false,
      languageSupport: [],
      culturalMediators: []
    },
    analysisHistory: [],
    culturalProfile: null,
    supportedCultures: Object.keys(CULTURAL_PROFILES),
    isLoading: false,
    error: null
  });

  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const culturalServiceRef = useRef<any>(null);

  /**
   * Initialize cultural crisis detection service
   */
  const initializeCulturalService = useCallback(async () => {
    try {
      // In a real implementation, this would load the cultural crisis detection service
      culturalServiceRef.current = {
        analyzeCulturalContext: async (text: string, context: CulturalContext) => {
          // Simulate cultural analysis
          const baseRisk = Math.random() * 0.8; // 0-0.8 base risk
          
          // Adjust risk based on cultural factors
          let culturalAdjustment = 0;
          if (context.collectivismLevel > 0.7 && context.familyStructure === 'extended') {
            culturalAdjustment -= 0.1; // Family support reduces risk
          }
          if (context.hierarchyRespect > 0.8) {
            culturalAdjustment += 0.05; // Hierarchy might delay help-seeking
          }
          if (context.emotionalExpression === 'reserved') {
            culturalAdjustment += 0.1; // Reserved expression might hide severity
          }

          const culturallyAdjustedRisk = Math.max(0, Math.min(1, baseRisk + culturalAdjustment));

          return {
            overallRisk: baseRisk,
            culturallyAdjustedRisk,
            confidence: 0.8 + Math.random() * 0.2
          };
        },
        detectBiases: (analysis: any, context: CulturalContext) => {
          const biases: string[] = [];
          
          if (context.collectivismLevel > 0.6 && analysis.individualTherapyRecommended) {
            biases.push('individual_therapy_preference_bias');
          }
          if (context.communicationStyle === 'indirect' && analysis.directCommunicationExpected) {
            biases.push('direct_communication_expectation');
          }
          if (context.familyStructure === 'extended' && analysis.nuclearFamilyAssumed) {
            biases.push('nuclear_family_assumption');
          }

          return biases;
        }
      };
    } catch (error) {
      console.warn('Cultural crisis detection service not available:', error);
    }
  }, []);

  /**
   * Build cultural profile from user data
   */
  const buildCulturalProfile = useCallback((
    culture: string,
    language: string,
    additionalContext?: Partial<CulturalContext>
  ): CulturalContext => {
    const baseProfile = CULTURAL_PROFILES[culture] || CULTURAL_PROFILES.western_general;
    
    return {
      primaryCulture: culture,
      secondaryCultures: [],
      language,
      region: 'unknown',
      familyStructure: 'nuclear',
      communicationStyle: 'direct',
      collectivismLevel: 0.5,
      hierarchyRespect: 0.5,
      emotionalExpression: 'open',
      crisisConceptualization: ['medical_model', 'psychological_distress'],
      ...baseProfile,
      ...additionalContext
    };
  }, []);

  /**
   * Analyze text with cultural context
   */
  const analyzeCulturalCrisis = useCallback(async (
    text: string,
    culturalContext?: CulturalContext
  ): Promise<CulturalCrisisAnalysisResult> => {
    if (!culturalServiceRef.current) {
      await initializeCulturalService();
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null
    }));

    try {
      const context = culturalContext || state.culturalProfile || 
        buildCulturalProfile(opts.defaultCulture, 'en');

      // Perform cultural analysis
      const analysis = await culturalServiceRef.current?.analyzeCulturalContext(text, context);
      
      // Detect potential biases
      const biases = opts.enableBiasCorrection ? 
        culturalServiceRef.current?.detectBiases(analysis, context) || [] : [];

      // Generate cultural recommendations
      const recommendedApproach = {
        communicationStyle: context.communicationStyle === 'direct' ? 'Be direct and clear' : 
                           context.communicationStyle === 'indirect' ? 'Use gentle, indirect language' :
                           'Adapt to context and non-verbal cues',
        familyInvolvement: context.collectivismLevel > 0.7 ? 'high' : 
                          context.collectivismLevel > 0.4 ? 'moderate' : 'minimal' as FamilyInvolvementLevel,
        communityApproach: context.familyStructure === 'community' || context.collectivismLevel > 0.8,
        religiousConsideration: context.religiousAffiliation !== undefined,
        culturalInterventions: generateCulturalInterventions(context),
        languagePreferences: [context.language]
      };

      // Calculate cultural factors
      const culturalFactors = {
        stigmaLevel: context.emotionalExpression === 'reserved' ? 0.8 : 0.4,
        familyInvolvementExpectation: context.collectivismLevel,
        authorityTrust: context.hierarchyRespect,
        spiritualBeliefs: context.religiousAffiliation ? 0.8 : 0.2,
        communitySupport: context.familyStructure === 'community' ? 0.9 : context.collectivismLevel
      };

      const result: CulturalCrisisAnalysisResult = {
        overallRisk: analysis?.overallRisk || 0,
        culturallyAdjustedRisk: analysis?.culturallyAdjustedRisk || 0,
        biasAdjustments: biases,
        culturalFactors,
        recommendedApproach,
        culturalWarnings: generateCulturalWarnings(context, biases),
        confidence: analysis?.confidence || 0.7,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        lastAnalysis: result,
        culturallyAdjustedRisk: result.culturallyAdjustedRisk,
        biasAdjustments: result.biasAdjustments,
        culturalInterventions: {
          familyInvolvement: result.recommendedApproach.familyInvolvement,
          communityApproach: result.recommendedApproach.communityApproach,
          religiousConsideration: result.recommendedApproach.religiousConsideration,
          languageSupport: result.recommendedApproach.languagePreferences,
          culturalMediators: result.recommendedApproach.culturalInterventions
        },
        analysisHistory: [...prev.analysisHistory.slice(-9), result] // Keep last 10
      }));

      // Trigger callbacks
      opts.onCulturalRiskDetected?.(result);
      if (biases.length > 0) {
        opts.onBiasDetected?.(biases);
      }
      if (result.recommendedApproach.culturalInterventions.length > 0) {
        opts.onCulturalInterventionSuggested?.(result.recommendedApproach.culturalInterventions);
      }

      return result;

    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Cultural analysis failed'
      }));
      throw error;
    }
  }, [state.culturalProfile, opts, initializeCulturalService, buildCulturalProfile]);

  /**
   * Set cultural profile
   */
  const setCulturalProfile = useCallback((profile: CulturalContext): void => {
    setState(prev => ({
      ...prev,
      culturalProfile: profile
    }));
  }, []);

  /**
   * Update cultural context
   */
  const updateCulturalContext = useCallback((
    updates: Partial<CulturalContext>
  ): void => {
    setState(prev => ({
      ...prev,
      culturalProfile: prev.culturalProfile ? 
        { ...prev.culturalProfile, ...updates } : 
        buildCulturalProfile(opts.defaultCulture, 'en', updates)
    }));
  }, [buildCulturalProfile, opts.defaultCulture]);

  /**
   * Generate cultural interventions based on context
   */
  const generateCulturalInterventions = useCallback((context: CulturalContext): string[] => {
    const interventions: string[] = [];

    if (context.collectivismLevel > 0.7) {
      interventions.push('family_therapy', 'community_support_groups');
    }
    
    if (context.hierarchyRespect > 0.7) {
      interventions.push('elder_mediated_intervention', 'authority_figure_involvement');
    }
    
    if (context.religiousAffiliation) {
      interventions.push('spiritual_counseling', 'faith_based_support');
    }
    
    if (context.communicationStyle === 'high_context') {
      interventions.push('non_verbal_therapy', 'art_music_therapy');
    }
    
    if (context.emotionalExpression === 'reserved') {
      interventions.push('gradual_disclosure_approach', 'indirect_expression_methods');
    }

    return interventions;
  }, []);

  /**
   * Generate cultural warnings
   */
  const generateCulturalWarnings = useCallback((
    context: CulturalContext, 
    biases: string[]
  ): string[] => {
    const warnings: string[] = [];

    if (biases.includes('individual_therapy_preference_bias')) {
      warnings.push('Consider family/community-based interventions');
    }
    
    if (context.emotionalExpression === 'reserved') {
      warnings.push('Crisis severity may be understated due to cultural expression patterns');
    }
    
    if (context.hierarchyRespect > 0.8) {
      warnings.push('May require authority figure approval for intervention');
    }
    
    if (context.communicationStyle === 'indirect') {
      warnings.push('Direct questioning may be culturally inappropriate');
    }

    return warnings;
  }, []);

  /**
   * Clear analysis history
   */
  const clearHistory = useCallback((): void => {
    setState(prev => ({
      ...prev,
      analysisHistory: [],
      lastAnalysis: null
    }));
  }, []);

  // Initialize service on mount
  useEffect(() => {
    initializeCulturalService();
  }, [initializeCulturalService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    actions: {
      analyzeCulturalCrisis,
      setCulturalProfile,
      updateCulturalContext,
      buildCulturalProfile,
      clearHistory
    },
    culturalProfiles: CULTURAL_PROFILES,
    supportedLanguages: opts.supportedLanguages
  };
};

export default useCulturalCrisisDetection;
