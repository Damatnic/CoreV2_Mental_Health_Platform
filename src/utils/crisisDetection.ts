/**
 * Crisis Detection Utilities
 * 
 * Comprehensive crisis detection system with keyword analysis,
 * severity assessment, and intervention recommendations.
 * 
 * @fileoverview Core crisis detection logic and utilities
 * @version 2.0.0
 */

// Define types locally to avoid circular dependencies
export type CrisisLevel = 'none' | 'low' | 'moderate' | 'high' | 'immediate';

export interface CrisisIndicator {
  type: 'keyword' | 'pattern' | 'sentiment';
  severity: number;
  confidence: number;
  description: string;
  details?: any;
}

export interface CrisisDetectionResult {
  crisisLevel: CrisisLevel;
  confidence: number;
  indicators: CrisisIndicator[];
  recommendations: string[];
  metadata: {
    analysisTime: number;
    textLength: number;
    config: CrisisDetectionConfig;
    severityScore?: number;
  };
}

/**
 * Crisis keyword categories with weighted severity
 */
export interface CrisisKeywordCategory {
  keywords: string[];
  weight: number;
  category: 'immediate' | 'severe' | 'moderate' | 'mild';
  description: string;
}

/**
 * Crisis detection configuration
 */
export interface CrisisDetectionConfig {
  enableKeywordDetection: boolean;
  enableSentimentAnalysis: boolean;
  enablePatternMatching: boolean;
  severityThreshold: number;
  confidenceThreshold: number;
  maxAnalysisLength: number;
}

/**
 * Comprehensive crisis keyword database
 */
export const CRISIS_KEYWORDS: Record<string, CrisisKeywordCategory> = {
  suicide: {
    keywords: [
      'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
      'suicide plan', 'suicidal thoughts', 'take my own life', 'not worth living',
      'end it all', 'permanent solution', 'goodbye cruel world'
    ],
    weight: 10,
    category: 'immediate',
    description: 'Direct suicidal ideation'
  },
  
  selfHarm: {
    keywords: [
      'cut myself', 'hurt myself', 'self harm', 'self-harm', 'cutting',
      'burning myself', 'punish myself', 'deserve pain', 'inflict pain'
    ],
    weight: 8,
    category: 'severe',
    description: 'Self-harm behaviors'
  },
  
  hopelessness: {
    keywords: [
      'no hope', 'hopeless', 'pointless', 'nothing matters', 'give up',
      'no future', 'trapped', 'no way out', 'stuck forever', 'helpless'
    ],
    weight: 6,
    category: 'severe',
    description: 'Expressions of hopelessness'
  },
  
  isolation: {
    keywords: [
      'alone', 'nobody cares', 'no friends', 'isolated', 'abandoned',
      'rejected', 'unwanted', 'burden', 'worthless', 'useless'
    ],
    weight: 4,
    category: 'moderate',
    description: 'Social isolation and worthlessness'
  },
  
  distress: {
    keywords: [
      'overwhelmed', 'can\'t cope', 'breaking down', 'falling apart',
      'can\'t handle', 'too much', 'stressed out', 'anxious', 'panic'
    ],
    weight: 3,
    category: 'moderate',
    description: 'General psychological distress'
  },
  
  depression: {
    keywords: [
      'depressed', 'sad', 'empty', 'numb', 'dark thoughts', 'low mood',
      'no energy', 'tired of living', 'everything hurts', 'broken'
    ],
    weight: 2,
    category: 'mild',
    description: 'Depressive symptoms'
  }
};

/**
 * Default crisis detection configuration
 */
export const DEFAULT_CRISIS_CONFIG: CrisisDetectionConfig = {
  enableKeywordDetection: true,
  enableSentimentAnalysis: true,
  enablePatternMatching: true,
  severityThreshold: 5,
  confidenceThreshold: 0.7,
  maxAnalysisLength: 10000
};

/**
 * Analyzes text for crisis indicators using keyword matching
 */
export function detectCrisisKeywords(
  text: string,
  config: CrisisDetectionConfig = DEFAULT_CRISIS_CONFIG
): CrisisIndicator[] {
  if (!text || !config.enableKeywordDetection) {
    return [];
  }

  const normalizedText = text.toLowerCase().trim();
  const indicators: CrisisIndicator[] = [];

  // Check each keyword category
  Object.entries(CRISIS_KEYWORDS).forEach(([categoryKey, category]) => {
    const matches = category.keywords.filter(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    );

    if (matches.length > 0) {
      indicators.push({
        type: 'keyword',
        severity: category.weight,
        confidence: Math.min(0.9, 0.5 + (matches.length * 0.1)),
        description: category.description,
        details: {
          category: categoryKey,
          matchedKeywords: matches,
          categoryWeight: category.weight
        }
      });
    }
  });

  return indicators;
}

/**
 * Analyzes text patterns for crisis indicators
 */
export function detectCrisisPatterns(
  text: string,
  config: CrisisDetectionConfig = DEFAULT_CRISIS_CONFIG
): CrisisIndicator[] {
  if (!text || !config.enablePatternMatching) {
    return [];
  }

  const indicators: CrisisIndicator[] = [];
  const normalizedText = text.toLowerCase();

  // Pattern: Questions about methods
  const methodPatterns = [
    /how to (kill|hurt|harm|end)/i,
    /ways to (die|suicide|end it)/i,
    /methods of (suicide|self.harm)/i
  ];

  methodPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      indicators.push({
        type: 'pattern',
        severity: 9,
        confidence: 0.85,
        description: 'Searching for harmful methods',
        details: {
          pattern: pattern.source,
          matchType: 'method_inquiry'
        }
      });
    }
  });

  // Pattern: Goodbye messages
  const goodbyePatterns = [
    /goodbye.{0,20}(everyone|world|cruel)/i,
    /this is.{0,10}goodbye/i,
    /final.{0,10}(message|words)/i
  ];

  goodbyePatterns.forEach(pattern => {
    if (pattern.test(text)) {
      indicators.push({
        type: 'pattern',
        severity: 10,
        confidence: 0.9,
        description: 'Potential goodbye message',
        details: {
          pattern: pattern.source,
          matchType: 'goodbye_message'
        }
      });
    }
  });

  // Pattern: Time references
  const timePatterns = [
    /tonight.{0,20}(end|over|done)/i,
    /by (tomorrow|morning).{0,20}(gone|dead)/i,
    /won't be here.{0,20}(long|tomorrow)/i
  ];

  timePatterns.forEach(pattern => {
    if (pattern.test(text)) {
      indicators.push({
        type: 'pattern',
        severity: 8,
        confidence: 0.8,
        description: 'Time-specific crisis reference',
        details: {
          pattern: pattern.source,
          matchType: 'time_reference'
        }
      });
    }
  });

  return indicators;
}

/**
 * Calculates overall crisis severity from indicators
 */
export function calculateCrisisSeverity(indicators: CrisisIndicator[]): {
  level: CrisisLevel;
  score: number;
  confidence: number;
} {
  if (!indicators.length) {
    return {
      level: 'none',
      score: 0,
      confidence: 0
    };
  }

  // Calculate weighted score
  const totalScore = indicators.reduce((sum, indicator) => {
    return sum + (Number(indicator.severity) * Number(indicator.confidence));
  }, 0);

  // Calculate average confidence
  const avgConfidence = indicators.reduce((sum, indicator) => {
    return sum + Number(indicator.confidence);
  }, 0) / indicators.length;

  // Determine crisis level based on score
  let level: CrisisLevel = 'none';
  if (totalScore >= 25) {
    level = 'immediate';
  } else if (totalScore >= 15) {
    level = 'high';
  } else if (totalScore >= 8) {
    level = 'moderate';
  } else if (totalScore >= 3) {
    level = 'low';
  }

  return {
    level,
    score: Math.round(totalScore * 100) / 100,
    confidence: Math.round(avgConfidence * 100) / 100
  };
}

/**
 * Comprehensive crisis detection analysis
 */
export function analyzeCrisisText(
  text: string,
  config: CrisisDetectionConfig = DEFAULT_CRISIS_CONFIG
): CrisisDetectionResult {
  const startTime = Date.now();

  // Validate input
  if (!text || typeof text !== 'string') {
    return {
      crisisLevel: 'none',
      confidence: 0,
      indicators: [],
      recommendations: [],
      metadata: {
        analysisTime: Date.now() - startTime,
        textLength: 0,
        config
      }
    };
  }

  // Truncate text if too long
  const analyzedText = text.length > config.maxAnalysisLength 
    ? text.substring(0, config.maxAnalysisLength)
    : text;

  // Collect all indicators
  const keywordIndicators = detectCrisisKeywords(analyzedText, config);
  const patternIndicators = detectCrisisPatterns(analyzedText, config);
  const allIndicators = [...keywordIndicators, ...patternIndicators];

  // Calculate severity
  const severity = calculateCrisisSeverity(allIndicators);

  // Generate recommendations based on crisis level
  const recommendations = generateCrisisRecommendations(severity.level, allIndicators);

  return {
    crisisLevel: severity.level,
    confidence: severity.confidence,
    indicators: allIndicators,
    recommendations,
    metadata: {
      analysisTime: Date.now() - startTime,
      textLength: analyzedText.length,
      config,
      severityScore: severity.score
    }
  };
}

/**
 * Generates crisis intervention recommendations
 */
export function generateCrisisRecommendations(
  level: CrisisLevel,
  indicators: CrisisIndicator[]
): string[] {
  const recommendations: string[] = [];

  switch (level) {
    case 'immediate':
      recommendations.push(
        'IMMEDIATE INTERVENTION REQUIRED',
        'Contact emergency services (911) if in immediate danger',
        'Reach out to crisis hotline: 988 Suicide & Crisis Lifeline',
        'Do not leave person alone',
        'Remove access to means of self-harm',
        'Seek immediate professional mental health evaluation'
      );
      break;

    case 'high':
      recommendations.push(
        'HIGH PRIORITY - Schedule urgent mental health appointment',
        'Contact crisis hotline: 988 Suicide & Crisis Lifeline',
        'Increase social support and check-ins',
        'Consider safety planning',
        'Monitor closely for escalation',
        'Provide crisis resources and coping strategies'
      );
      break;

    case 'moderate':
      recommendations.push(
        'Schedule mental health appointment within 1-2 days',
        'Increase supportive contact',
        'Provide coping strategies and resources',
        'Monitor for changes in mood or behavior',
        'Encourage professional support',
        'Share crisis hotline information: 988'
      );
      break;

    case 'low':
      recommendations.push(
        'Consider scheduling mental health check-in',
        'Provide emotional support and active listening',
        'Share mental health resources',
        'Encourage self-care activities',
        'Monitor for any escalation'
      );
      break;

    case 'none':
    default:
      recommendations.push(
        'Continue providing supportive communication',
        'Maintain awareness of mental health needs',
        'Provide resources if requested'
      );
      break;
  }

  // Add specific recommendations based on indicators
  const hasIsolationIndicators = indicators.some(i => 
    i.details?.category === 'isolation'
  );
  if (hasIsolationIndicators) {
    recommendations.push('Focus on reducing isolation and building connections');
  }

  const hasSelfHarmIndicators = indicators.some(i => 
    i.details?.category === 'selfHarm'
  );
  if (hasSelfHarmIndicators) {
    recommendations.push('Address self-harm behaviors with professional help');
  }

  return recommendations;
}

/**
 * Validates crisis detection configuration
 */
export function validateCrisisConfig(config: Partial<CrisisDetectionConfig>): CrisisDetectionConfig {
  return {
    enableKeywordDetection: config.enableKeywordDetection ?? DEFAULT_CRISIS_CONFIG.enableKeywordDetection,
    enableSentimentAnalysis: config.enableSentimentAnalysis ?? DEFAULT_CRISIS_CONFIG.enableSentimentAnalysis,
    enablePatternMatching: config.enablePatternMatching ?? DEFAULT_CRISIS_CONFIG.enablePatternMatching,
    severityThreshold: Math.max(0, Math.min(10, config.severityThreshold ?? DEFAULT_CRISIS_CONFIG.severityThreshold)),
    confidenceThreshold: Math.max(0, Math.min(1, config.confidenceThreshold ?? DEFAULT_CRISIS_CONFIG.confidenceThreshold)),
    maxAnalysisLength: Math.max(100, Math.min(50000, config.maxAnalysisLength ?? DEFAULT_CRISIS_CONFIG.maxAnalysisLength))
  };
}

/**
 * Emergency contact information
 */
export const EMERGENCY_CONTACTS = {
  suicide_lifeline: {
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    text: 'Text HOME to 741741',
    website: 'https://suicidepreventionlifeline.org',
    available: '24/7'
  },
  crisis_text_line: {
    name: 'Crisis Text Line',
    text: 'Text HOME to 741741',
    website: 'https://www.crisistextline.org',
    available: '24/7'
  },
  emergency: {
    name: 'Emergency Services',
    phone: '911',
    description: 'For immediate danger or medical emergencies',
    available: '24/7'
  }
};

export default {
  detectCrisisKeywords,
  detectCrisisPatterns,
  calculateCrisisSeverity,
  analyzeCrisisText,
  generateCrisisRecommendations,
  validateCrisisConfig,
  CRISIS_KEYWORDS,
  DEFAULT_CRISIS_CONFIG,
  EMERGENCY_CONTACTS
};
