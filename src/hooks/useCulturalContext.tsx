/**
 * Cultural Context Hook
 * 
 * Provides cultural adaptations and context management for the mental health platform.
 * Integrates with cultural assessment service and crisis detection for culturally-sensitive support.
 * 
 * @module useCulturalContext
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useMemo, useContext, createContext, ReactNode } from 'react';
import { culturalAssessmentService } from '../services/culturalAssessmentService';
import { CulturalProfile } from '../components/CulturalAssessmentWizard';

// Cultural adaptation interfaces
export interface CulturalAdaptation {
  id: string;
  type: 'language' | 'expression' | 'intervention' | 'communication' | 'visual';
  originalContent: string;
  adaptedContent: string;
  culturalContext: string;
  confidence: number;
}

export interface CulturalContextState {
  profile: CulturalProfile | null;
  adaptations: CulturalAdaptation[];
  isLoading: boolean;
  error: string | null;
  languageCode: string;
  textDirection: 'ltr' | 'rtl';
  culturalSensitivity: {
    stigmaLevel: number;
    familyInvolvement: boolean;
    communityOriented: boolean;
    spiritualConsiderations: boolean;
  };
}

export interface CulturalContextActions {
  updateCulturalContext: (profile: CulturalProfile) => Promise<void>;
  getCulturalAdaptations: (content: string, type: string) => CulturalAdaptation[];
  adaptContent: (content: string) => string;
  getRecommendedInterventions: () => string[];
  assessCulturalRisk: (text: string) => number;
  clearCulturalContext: () => void;
}

// Cultural adaptation mappings
const CULTURAL_ADAPTATIONS: Record<string, Record<string, string>> = {
  depression_terms: {
    western: 'depression',
    east_asian: 'heavy heart / 心情沉重',
    south_asian: 'mann udaas / मन उदास',
    middle_eastern: 'حزن / huzn',
    african: 'ukudakumba',
    latin_american: 'tristeza profunda',
    indigenous: 'spirit sickness',
    nordic: 'tungsinn'
  },
  anxiety_terms: {
    western: 'anxiety',
    east_asian: 'worry mind / 焦虑',
    south_asian: 'chinta / चिंता',
    middle_eastern: 'قلق / qalaq',
    african: 'ukukhathazeka',
    latin_american: 'nervios',
    indigenous: 'restless spirit',
    nordic: 'angst'
  },
  help_seeking: {
    western: 'Talk to a therapist',
    east_asian: 'Seek guidance from a counselor who understands your culture',
    south_asian: 'Consult with family and consider professional support',
    middle_eastern: 'Seek wisdom from trusted elders or professionals',
    african: 'Connect with community healers and modern practitioners',
    latin_american: 'Talk with family and seek professional help together',
    indigenous: 'Balance traditional healing with modern support',
    nordic: 'Seek professional help while maintaining privacy'
  }
};

const INTERVENTION_RECOMMENDATIONS: Record<string, string[]> = {
  western: [
    'Individual therapy',
    'Cognitive Behavioral Therapy',
    'Medication management',
    'Support groups'
  ],
  east_asian: [
    'Mind-body practices (Tai Chi, Qigong)',
    'Family-inclusive therapy',
    'Meditation and mindfulness',
    'Herbal remedies with professional guidance'
  ],
  south_asian: [
    'Family counseling',
    'Yoga and meditation',
    'Ayurvedic approaches with modern medicine',
    'Community support groups'
  ],
  middle_eastern: [
    'Family-centered interventions',
    'Faith-integrated counseling',
    'Gender-specific support groups',
    'Culturally-adapted CBT'
  ],
  african: [
    'Community healing circles',
    'Narrative therapy',
    'Integration of traditional and modern practices',
    'Extended family involvement'
  ],
  latin_american: [
    'Family therapy',
    'Culturally-adapted group therapy',
    'Faith-based support',
    'Community mental health programs'
  ],
  indigenous: [
    'Traditional healing ceremonies',
    'Land-based healing',
    'Elder consultation',
    'Culturally-specific mental health services'
  ],
  nordic: [
    'Nature-based therapy',
    'Light therapy for seasonal issues',
    'Individual counseling',
    'Structured treatment programs'
  ]
};

// Context creation
const CulturalContext = createContext<(CulturalContextState & CulturalContextActions) | null>(null);

/**
 * Cultural Context Provider Component
 */
export const CulturalContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CulturalContextState>({
    profile: null,
    adaptations: [],
    isLoading: false,
    error: null,
    languageCode: 'en',
    textDirection: 'ltr',
    culturalSensitivity: {
      stigmaLevel: 0.5,
      familyInvolvement: false,
      communityOriented: false,
      spiritualConsiderations: false
    }
  });

  // Load saved cultural profile on mount
  useEffect(() => {
    const loadSavedProfile = async () => {
      try {
        const savedProfile = localStorage.getItem('culturalProfile');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile) as CulturalProfile;
          await updateCulturalContext(profile);
        }
      } catch (error) {
        console.error('Failed to load cultural profile:', error);
      }
    };
    loadSavedProfile();
  }, []);

  // Update cultural context
  const updateCulturalContext = useCallback(async (profile: CulturalProfile) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Save profile to localStorage
      localStorage.setItem('culturalProfile', JSON.stringify(profile));

      // Determine text direction based on language
      const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
      const textDirection = rtlLanguages.includes(profile.languagePreferences[0]) ? 'rtl' : 'ltr';

      // Calculate cultural sensitivity factors
      const culturalSensitivity = {
        stigmaLevel: profile.culturalStigmaAwareness / 5,
        familyInvolvement: profile.familyInvolvementLevel >= 3,
        communityOriented: ['african', 'latin_american', 'indigenous'].includes(profile.primaryCulture),
        spiritualConsiderations: !!profile.religiousAffiliation || 
          profile.supportSystemMapping?.spiritual > 0.5
      };

      // Generate initial adaptations
      const adaptations = generateInitialAdaptations(profile);

      setState({
        profile,
        adaptations,
        isLoading: false,
        error: null,
        languageCode: profile.languagePreferences[0] || 'en',
        textDirection,
        culturalSensitivity
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to update cultural context'
      }));
      console.error('Cultural context update failed:', error);
    }
  }, []);

  // Get cultural adaptations for content
  const getCulturalAdaptations = useCallback((content: string, type: string): CulturalAdaptation[] => {
    if (!state.profile) return [];

    const adaptations: CulturalAdaptation[] = [];
    const culture = state.profile.primaryCulture;

    // Check for terms that need cultural adaptation
    Object.entries(CULTURAL_ADAPTATIONS).forEach(([category, terms]) => {
      if (terms.western && content.toLowerCase().includes(terms.western.toLowerCase())) {
        const adaptedTerm = terms[culture] || terms.western;
        if (adaptedTerm !== terms.western) {
          adaptations.push({
            id: `${category}_${Date.now()}`,
            type: 'expression',
            originalContent: terms.western,
            adaptedContent: adaptedTerm,
            culturalContext: culture,
            confidence: 0.85
          });
        }
      }
    });

    return adaptations;
  }, [state.profile]);

  // Adapt content based on cultural context
  const adaptContent = useCallback((content: string): string => {
    if (!state.profile) return content;

    let adaptedContent = content;
    const culture = state.profile.primaryCulture;

    // Apply cultural term replacements
    Object.entries(CULTURAL_ADAPTATIONS).forEach(([_, terms]) => {
      if (terms.western && terms[culture]) {
        const regex = new RegExp(terms.western, 'gi');
        adaptedContent = adaptedContent.replace(regex, terms[culture]);
      }
    });

    // Add cultural context notes
    if (state.culturalSensitivity.stigmaLevel > 0.6) {
      adaptedContent += '\n\n[Note: Information presented with sensitivity to cultural stigma concerns]';
    }

    if (state.culturalSensitivity.familyInvolvement) {
      adaptedContent += '\n[Consider involving trusted family members in your healing journey]';
    }

    return adaptedContent;
  }, [state.profile, state.culturalSensitivity]);

  // Get recommended interventions based on culture
  const getRecommendedInterventions = useCallback((): string[] => {
    if (!state.profile) return INTERVENTION_RECOMMENDATIONS.western;
    
    const primaryInterventions = INTERVENTION_RECOMMENDATIONS[state.profile.primaryCulture] || [];
    const additionalInterventions: string[] = [];

    // Add family-based interventions if appropriate
    if (state.culturalSensitivity.familyInvolvement) {
      additionalInterventions.push('Family education and support');
    }

    // Add spiritual interventions if relevant
    if (state.culturalSensitivity.spiritualConsiderations) {
      additionalInterventions.push('Faith-integrated counseling');
      additionalInterventions.push('Spiritual practices and meditation');
    }

    // Add community interventions if culturally appropriate
    if (state.culturalSensitivity.communityOriented) {
      additionalInterventions.push('Community support programs');
      additionalInterventions.push('Group healing activities');
    }

    return [...new Set([...primaryInterventions, ...additionalInterventions])];
  }, [state.profile, state.culturalSensitivity]);

  // Assess cultural risk factors in text
  const assessCulturalRisk = useCallback((text: string): number => {
    if (!state.profile) return 0;

    let riskScore = 0;
    const lowerText = text.toLowerCase();

    // Check for cultural shame indicators
    const shameIndicators = [
      'family shame', 'dishonor', 'burden to family',
      'letting everyone down', 'cultural expectations',
      'family reputation', 'community judgment'
    ];
    
    shameIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        riskScore += 0.15 * state.culturalSensitivity.stigmaLevel;
      }
    });

    // Check for isolation from cultural support
    const isolationIndicators = [
      'alone', 'no one understands', 'different from others',
      'cut off from family', 'lost connection', 'cultural isolation'
    ];
    
    isolationIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        riskScore += 0.1;
      }
    });

    // Adjust based on cultural expression patterns
    if (state.profile.communicationStyle === 'indirect' && 
        (lowerText.includes('fine') || lowerText.includes('okay'))) {
      // In indirect communication cultures, "fine" might mask distress
      riskScore += 0.1;
    }

    return Math.min(riskScore, 1);
  }, [state.profile, state.culturalSensitivity]);

  // Clear cultural context
  const clearCulturalContext = useCallback(() => {
    localStorage.removeItem('culturalProfile');
    setState({
      profile: null,
      adaptations: [],
      isLoading: false,
      error: null,
      languageCode: 'en',
      textDirection: 'ltr',
      culturalSensitivity: {
        stigmaLevel: 0.5,
        familyInvolvement: false,
        communityOriented: false,
        spiritualConsiderations: false
      }
    });
  }, []);

  const contextValue = useMemo(() => ({
    ...state,
    updateCulturalContext,
    getCulturalAdaptations,
    adaptContent,
    getRecommendedInterventions,
    assessCulturalRisk,
    clearCulturalContext
  }), [
    state,
    updateCulturalContext,
    getCulturalAdaptations,
    adaptContent,
    getRecommendedInterventions,
    assessCulturalRisk,
    clearCulturalContext
  ]);

  return (
    <CulturalContext.Provider value={contextValue}>
      {children}
    </CulturalContext.Provider>
  );
};

/**
 * Hook to use cultural context
 */
export const useCulturalContext = () => {
  const context = useContext(CulturalContext);
  if (!context) {
    // Return default values when not in provider
    return {
      profile: null,
      adaptations: [],
      isLoading: false,
      error: null,
      languageCode: 'en',
      textDirection: 'ltr' as const,
      culturalSensitivity: {
        stigmaLevel: 0.5,
        familyInvolvement: false,
        communityOriented: false,
        spiritualConsiderations: false
      },
      updateCulturalContext: async () => {},
      getCulturalAdaptations: () => [],
      adaptContent: (content: string) => content,
      getRecommendedInterventions: () => [],
      assessCulturalRisk: () => 0,
      clearCulturalContext: () => {}
    };
  }
  return context;
};

// Helper function to generate initial adaptations
function generateInitialAdaptations(profile: CulturalProfile): CulturalAdaptation[] {
  const adaptations: CulturalAdaptation[] = [];
  const culture = profile.primaryCulture;

  // Generate language adaptations
  if (profile.languagePreferences[0] !== 'en') {
    adaptations.push({
      id: 'lang_pref',
      type: 'language',
      originalContent: 'English',
      adaptedContent: profile.languagePreferences[0],
      culturalContext: culture,
      confidence: 1.0
    });
  }

  // Generate communication style adaptations
  if (profile.communicationStyle !== 'direct') {
    adaptations.push({
      id: 'comm_style',
      type: 'communication',
      originalContent: 'direct communication',
      adaptedContent: `${profile.communicationStyle} communication style`,
      culturalContext: culture,
      confidence: 0.9
    });
  }

  return adaptations;
}

export default useCulturalContext;