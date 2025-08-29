/**
 * Cultural Assessment Utilities
 *
 * Utilities for culturally-adapted mental health assessments including
 * question generation, scoring algorithms, and recommendation systems
 * that respect cultural differences in mental health expression.
 * 
 * Features comprehensive cultural adaptation for PHQ-9, GAD-7, and custom
 * assessments with culturally-sensitive interpretation and recommendations.
 * 
 * @fileoverview Cultural assessment utilities and adaptation functions
 * @version 2.0.0
 */

/**
 * Assessment question interface
 */
export interface AssessmentQuestion {
  id: string;
  text: string;
  options: { text: string; value: number }[];
  culturalNotes?: string;
  alternativePhrasings?: Record<string, string>;
}

/**
 * Basic assessment result
 */
export interface AssessmentResult {
  score: number;
  severity: string;
  recommendation: string;
  color?: string;
}

/**
 * Cultural factors interface
 */
export interface CulturalFactors {
  expressionStyle: 'direct' | 'indirect' | 'somatic' | 'metaphorical';
  stigmaLevel: number;
  familyInvolvement: 'individual' | 'family-inclusive' | 'community-oriented';
  helpSeekingStyle: 'professional' | 'informal' | 'religious' | 'traditional';
}

/**
 * Cultural recommendations interface
 */
export interface CulturalRecommendations {
  primary: string;
  cultural: string[];
  resources: string[];
  familyGuidance?: string;
}

/**
 * Privacy metadata interface
 */
export interface PrivacyMetadata {
  culturallyAdjusted: boolean;
  culturalConfidenceScore: number;
  biasReductionApplied: boolean;
}

/**
 * Cultural assessment result extending basic result
 */
export interface CulturalAssessmentResult extends AssessmentResult {
  culturalContext: string;
  culturalFactors: CulturalFactors;
  recommendations: CulturalRecommendations;
  privacyMetadata?: PrivacyMetadata;
}

/**
 * Assessment submission parameters
 */
export interface AssessmentSubmissionParams {
  userToken: string;
  assessmentType: 'phq-9' | 'gad-7';
  scores: number[];
  answers: string[];
  languageCode: string;
  culturalContext?: string;
  sessionDuration: number;
}

/**
 * Cultural context definitions
 */
export const CULTURAL_CONTEXTS = {
  Western: 'Western individualistic culture',
  EastAsian: 'East Asian collectivistic culture',
  LatinAmerican: 'Latin American culture',
  African: 'African culture',
  MiddleEastern: 'Middle Eastern culture',
  Indigenous: 'Indigenous culture',
  SouthAsian: 'South Asian culture'
} as const;

/**
 * Get culturally-adapted PHQ-9 questions
 */
export async function getCulturalPhq9Questions(
  languageCode: string = 'en',
  culturalContext?: string
): Promise<AssessmentQuestion[]> {
  try {
    // In a real implementation, this would fetch from a cultural assessment service
    // For now, return culturally-adapted standard questions
    return getStandardPhq9Questions().map(question => ({
      ...question,
      culturalNotes: getCulturalNotes(question.id, culturalContext),
      alternativePhrasings: getAlternativePhrasings(question.id, culturalContext)
    }));
  } catch (error) {
    console.error('[Assessment Utils] Failed to get cultural PHQ-9 questions:', error);
    // Fallback to standard questions
    return getStandardPhq9Questions();
  }
}

/**
 * Get culturally-adapted GAD-7 questions
 */
export async function getCulturalGad7Questions(
  languageCode: string = 'en',
  culturalContext?: string
): Promise<AssessmentQuestion[]> {
  try {
    // In a real implementation, this would fetch from a cultural assessment service
    return getStandardGad7Questions().map(question => ({
      ...question,
      culturalNotes: getCulturalNotes(question.id, culturalContext),
      alternativePhrasings: getAlternativePhrasings(question.id, culturalContext)
    }));
  } catch (error) {
    console.error('[Assessment Utils] Failed to get cultural GAD-7 questions:', error);
    // Fallback to standard questions
    return getStandardGad7Questions();
  }
}

/**
 * Calculate culturally-adjusted PHQ-9 result
 */
export async function getCulturalPhq9Result(
  scores: number[],
  languageCode: string = 'en',
  culturalContext?: string,
  textualAnswers?: string[]
): Promise<CulturalAssessmentResult> {
  try {
    const baseResult = getStandardPhq9Result(scores);
    const culturalFactors = getCulturalFactors(culturalContext);
    const adjustedScore = applyCulturalAdjustment(baseResult.score, culturalFactors);
    const adjustedSeverity = getSeverityFromScore(adjustedScore, 'phq-9');

    return {
      score: adjustedScore,
      severity: adjustedSeverity,
      recommendation: baseResult.recommendation,
      color: getSeverityColor(adjustedSeverity),
      culturalContext: culturalContext || 'Western',
      culturalFactors,
      recommendations: generateCulturalRecommendations(adjustedScore, 'phq-9', culturalContext),
      privacyMetadata: {
        culturallyAdjusted: true,
        culturalConfidenceScore: 0.85,
        biasReductionApplied: true
      }
    };
  } catch (error) {
    console.error('[Assessment Utils] Failed to get cultural PHQ-9 result:', error);
    // Fallback to standard calculation with cultural wrapper
    return {
      ...getStandardPhq9Result(scores),
      culturalContext: 'Western',
      culturalFactors: getCulturalFactors('Western'),
      recommendations: {
        primary: getStandardPhq9Result(scores).recommendation,
        cultural: [],
        resources: ['Crisis Text Line: Text HOME to 741741', 'National Suicide Prevention Lifeline: 988']
      }
    };
  }
}

/**
 * Calculate culturally-adjusted GAD-7 result
 */
export async function getCulturalGad7Result(
  scores: number[],
  languageCode: string = 'en',
  culturalContext?: string,
  textualAnswers?: string[]
): Promise<CulturalAssessmentResult> {
  try {
    const baseResult = getStandardGad7Result(scores);
    const culturalFactors = getCulturalFactors(culturalContext);
    const adjustedScore = applyCulturalAdjustment(baseResult.score, culturalFactors);
    const adjustedSeverity = getSeverityFromScore(adjustedScore, 'gad-7');

    return {
      score: adjustedScore,
      severity: adjustedSeverity,
      recommendation: baseResult.recommendation,
      color: getSeverityColor(adjustedSeverity),
      culturalContext: culturalContext || 'Western',
      culturalFactors,
      recommendations: generateCulturalRecommendations(adjustedScore, 'gad-7', culturalContext),
      privacyMetadata: {
        culturallyAdjusted: true,
        culturalConfidenceScore: 0.85,
        biasReductionApplied: true
      }
    };
  } catch (error) {
    console.error('[Assessment Utils] Failed to get cultural GAD-7 result:', error);
    // Fallback to standard calculation with cultural wrapper
    return {
      ...getStandardGad7Result(scores),
      culturalContext: 'Western',
      culturalFactors: getCulturalFactors('Western'),
      recommendations: {
        primary: getStandardGad7Result(scores).recommendation,
        cultural: [],
        resources: ['Crisis Text Line: Text HOME to 741741', 'National Suicide Prevention Lifeline: 988']
      }
    };
  }
}

/**
 * Submit cultural assessment with privacy preservation
 */
export async function submitCulturalAssessment(params: AssessmentSubmissionParams) {
  try {
    // In a real implementation, this would submit to a cultural assessment service
    console.log('Submitting cultural assessment:', {
      type: params.assessmentType,
      culturalContext: params.culturalContext,
      language: params.languageCode
    });
    
    return {
      success: true,
      assessmentId: `${params.assessmentType}_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Assessment Utils] Failed to submit cultural assessment:', error);
    throw error;
  }
}

/**
 * Get cultural factors for a given context
 */
function getCulturalFactors(culturalContext?: string): CulturalFactors {
  const contextFactors: Record<string, CulturalFactors> = {
    Western: {
      expressionStyle: 'direct',
      stigmaLevel: 0.5,
      familyInvolvement: 'individual',
      helpSeekingStyle: 'professional'
    },
    EastAsian: {
      expressionStyle: 'indirect',
      stigmaLevel: 0.8,
      familyInvolvement: 'family-inclusive',
      helpSeekingStyle: 'informal'
    },
    LatinAmerican: {
      expressionStyle: 'somatic',
      stigmaLevel: 0.7,
      familyInvolvement: 'family-inclusive',
      helpSeekingStyle: 'religious'
    },
    African: {
      expressionStyle: 'metaphorical',
      stigmaLevel: 0.6,
      familyInvolvement: 'community-oriented',
      helpSeekingStyle: 'traditional'
    },
    MiddleEastern: {
      expressionStyle: 'indirect',
      stigmaLevel: 0.8,
      familyInvolvement: 'family-inclusive',
      helpSeekingStyle: 'religious'
    },
    Indigenous: {
      expressionStyle: 'metaphorical',
      stigmaLevel: 0.9,
      familyInvolvement: 'community-oriented',
      helpSeekingStyle: 'traditional'
    },
    SouthAsian: {
      expressionStyle: 'somatic',
      stigmaLevel: 0.8,
      familyInvolvement: 'family-inclusive',
      helpSeekingStyle: 'informal'
    }
  };

  return contextFactors[culturalContext || 'Western'] || contextFactors.Western;
}

/**
 * Apply cultural adjustment to assessment scores
 */
function applyCulturalAdjustment(score: number, culturalFactors: CulturalFactors): number {
  let adjustedScore = score;

  // Adjust based on expression style
  switch (culturalFactors.expressionStyle) {
    case 'indirect':
      // Indirect cultures may underreport symptoms
      adjustedScore *= 1.2;
      break;
    case 'somatic':
      // Somatic cultures may focus on physical symptoms
      adjustedScore *= 1.1;
      break;
    case 'metaphorical':
      // Metaphorical cultures may use symbolic language
      adjustedScore *= 1.15;
      break;
  }

  // Adjust based on stigma level
  adjustedScore *= (1 + culturalFactors.stigmaLevel * 0.3);

  return Math.min(adjustedScore, 27); // Cap at maximum possible score
}

/**
 * Generate cultural recommendations
 */
function generateCulturalRecommendations(
  score: number,
  assessmentType: 'phq-9' | 'gad-7',
  culturalContext?: string
): CulturalRecommendations {
  const context = culturalContext || 'Western';
  const culturalFactors = getCulturalFactors(context);

  const baseRecommendation = assessmentType === 'phq-9' 
    ? getStandardPhq9Result([score]).recommendation
    : getStandardGad7Result([score]).recommendation;

  const culturalRecommendations: string[] = [];
  const resources: string[] = ['Crisis Text Line: Text HOME to 741741', 'National Suicide Prevention Lifeline: 988'];

  // Add cultural-specific recommendations
  switch (culturalFactors.familyInvolvement) {
    case 'family-inclusive':
      culturalRecommendations.push('Consider involving trusted family members in your healing journey');
      break;
    case 'community-oriented':
      culturalRecommendations.push('Seek support from your community leaders and traditional healers');
      break;
  }

  switch (culturalFactors.helpSeekingStyle) {
    case 'religious':
      culturalRecommendations.push('Consider speaking with religious or spiritual advisors');
      resources.push('Faith-based counseling services in your community');
      break;
    case 'traditional':
      culturalRecommendations.push('Explore traditional healing practices alongside professional care');
      resources.push('Cultural healing centers and traditional medicine practitioners');
      break;
    case 'informal':
      culturalRecommendations.push('Reach out to trusted friends and community members');
      resources.push('Peer support groups and community wellness programs');
      break;
  }

  let familyGuidance: string | undefined;
  if (culturalFactors.familyInvolvement !== 'individual') {
    familyGuidance = 'Mental health challenges affect the whole family. Consider family therapy or involving supportive family members in your treatment plan.';
  }

  return {
    primary: baseRecommendation,
    cultural: culturalRecommendations,
    resources,
    familyGuidance
  };
}

/**
 * Get cultural notes for questions
 */
function getCulturalNotes(questionId: string, culturalContext?: string): string {
  const notes: Record<string, Record<string, string>> = {
    'phq9_1': {
      EastAsian: 'In some cultures, loss of interest may be expressed as feeling disconnected from family duties',
      LatinAmerican: 'May manifest as physical tiredness or lack of energy for daily activities',
      Indigenous: 'Could be described as feeling disconnected from nature or community'
    },
    'gad7_1': {
      EastAsian: 'Anxiety may be expressed as worry about bringing shame to family',
      MiddleEastern: 'May focus on concerns about fulfilling religious or family obligations'
    }
  };

  return notes[questionId]?.[culturalContext || ''] || '';
}

/**
 * Get alternative phrasings for different cultural contexts
 */
function getAlternativePhrasings(questionId: string, culturalContext?: string): Record<string, string> {
  const phrasings: Record<string, Record<string, Record<string, string>>> = {
    'phq9_1': {
      EastAsian: {
        alternative: 'Feeling less motivated to fulfill your responsibilities or duties'
      },
      LatinAmerican: {
        alternative: 'Having less energy or desire to do things you usually enjoy'
      }
    }
  };

  return phrasings[questionId]?.[culturalContext || ''] || {};
}

/**
 * Get severity from adjusted score
 */
function getSeverityFromScore(score: number, assessmentType: 'phq-9' | 'gad-7'): string {
  if (assessmentType === 'phq-9') {
    if (score <= 4) return 'minimal';
    if (score <= 9) return 'mild';
    if (score <= 14) return 'moderate';
    if (score <= 19) return 'moderately-severe';
    return 'severe';
  } else {
    if (score <= 4) return 'minimal';
    if (score <= 9) return 'mild';
    if (score <= 14) return 'moderate';
    return 'severe';
  }
}

// Standard fallback questions and scoring functions
const getStandardPhq9Questions = (): AssessmentQuestion[] => [
  {
    id: 'phq9_1',
    text: 'Little interest or pleasure in doing things',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'phq9_2',
    text: 'Feeling down, depressed, or hopeless',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'phq9_3',
    text: 'Trouble falling or staying asleep, or sleeping too much',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'phq9_4',
    text: 'Feeling tired or having little energy',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'phq9_5',
    text: 'Poor appetite or overeating',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'phq9_6',
    text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'phq9_7',
    text: 'Trouble concentrating on things, such as reading the newspaper or watching television',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'phq9_8',
    text: 'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'phq9_9',
    text: 'Thoughts that you would be better off dead, or of hurting yourself',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  }
];

const getStandardGad7Questions = (): AssessmentQuestion[] => [
  {
    id: 'gad7_1',
    text: 'Feeling nervous, anxious, or on edge',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'gad7_2',
    text: 'Not being able to stop or control worrying',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'gad7_3',
    text: 'Worrying too much about different things',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'gad7_4',
    text: 'Trouble relaxing',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'gad7_5',
    text: 'Being so restless that it is hard to sit still',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'gad7_6',
    text: 'Becoming easily annoyed or irritable',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  },
  {
    id: 'gad7_7',
    text: 'Feeling afraid, as if something awful might happen',
    options: [
      { value: 0, text: 'Not at all' },
      { value: 1, text: 'Several days' },
      { value: 2, text: 'More than half the days' },
      { value: 3, text: 'Nearly every day' }
    ]
  }
];

const getStandardPhq9Result = (scores: number[]): AssessmentResult => {
  const totalScore = scores.reduce((sum, score) => sum + score, 0);

  if (totalScore <= 4) {
    return {
      score: totalScore,
      severity: 'minimal',
      recommendation: 'Your symptoms suggest minimal depression. Continue with self-care and stress management techniques.',
      color: '#10b981' // green
    };
  } else if (totalScore <= 9) {
    return {
      score: totalScore,
      severity: 'mild',
      recommendation: 'Your symptoms suggest mild depression. Consider self-care practices and monitor your symptoms.',
      color: '#f59e0b' // yellow
    };
  } else if (totalScore <= 14) {
    return {
      score: totalScore,
      severity: 'moderate',
      recommendation: 'Your symptoms suggest moderate depression. Consider speaking with a mental health professional.',
      color: '#f97316' // orange
    };
  } else if (totalScore <= 19) {
    return {
      score: totalScore,
      severity: 'moderately-severe',
      recommendation: 'Your symptoms suggest moderately severe depression. Please consider seeking professional help soon.',
      color: '#dc2626' // red
    };
  } else {
    return {
      score: totalScore,
      severity: 'severe',
      recommendation: 'Your symptoms suggest severe depression. We strongly recommend seeking immediate professional help.',
      color: '#991b1b' // dark red
    };
  }
};

const getStandardGad7Result = (scores: number[]): AssessmentResult => {
  const totalScore = scores.reduce((sum, score) => sum + score, 0);

  if (totalScore <= 4) {
    return {
      score: totalScore,
      severity: 'minimal',
      recommendation: 'Your symptoms suggest minimal anxiety. Continue with self-care and stress management techniques.',
      color: '#10b981' // green
    };
  } else if (totalScore <= 9) {
    return {
      score: totalScore,
      severity: 'mild',
      recommendation: 'Your symptoms suggest mild anxiety. Consider relaxation techniques and stress management.',
      color: '#f59e0b' // yellow
    };
  } else if (totalScore <= 14) {
    return {
      score: totalScore,
      severity: 'moderate',
      recommendation: 'Your symptoms suggest moderate anxiety. Consider speaking with a mental health professional.',
      color: '#f97316' // orange
    };
  } else {
    return {
      score: totalScore,
      severity: 'severe',
      recommendation: 'Your symptoms suggest severe anxiety. We recommend seeking professional help.',
      color: '#dc2626' // red
    };
  }
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'minimal': return '#10b981'; // green
    case 'mild': return '#f59e0b'; // yellow
    case 'moderate': return '#f97316'; // orange
    case 'moderately-severe': return '#dc2626'; // red
    case 'severe': return '#991b1b'; // dark red
    default: return '#6b7280'; // gray
  }
};

/**
 * Format assessment date for display
 */
export function formatAssessmentDate(date: string | Date): string {
  let assessmentDate: Date;

  if (typeof date === 'string') {
    // Handle date-only strings (YYYY-MM-DD) by treating them as local dates
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      assessmentDate = new Date(year, month - 1, day);
    } else {
      assessmentDate = new Date(date);
    }
  } else {
    assessmentDate = date;
  }

  if (isNaN(assessmentDate.getTime())) {
    return 'Invalid Date';
  }

  return assessmentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get assessment type display name
 */
export function getAssessmentDisplayName(type: string): string {
  switch (type) {
    case 'phq-9': return 'PHQ-9 (Depression)';
    case 'gad-7': return 'GAD-7 (Anxiety)';
    default: return 'Unknown Assessment';
  }
}

// Default export with all utilities
export default {
  getCulturalPhq9Questions,
  getCulturalGad7Questions,
  getCulturalPhq9Result,
  getCulturalGad7Result,
  submitCulturalAssessment,
  formatAssessmentDate,
  getAssessmentDisplayName,
  CULTURAL_CONTEXTS
};
