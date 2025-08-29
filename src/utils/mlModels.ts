/**
 * ML Models Configuration
 * Pre-trained model configurations and utilities for crisis prediction
 * Includes ethical safeguards and bias mitigation strategies
 */

// Model configuration types
export interface ModelWeights {
  behavioral: number;
  linguistic: number;
  temporal: number;
  social: number;
  physiological: number;
  environmental: number;
}

export interface ThresholdConfig {
  low: number;
  moderate: number;
  elevated: number;
  high: number;
  critical: number;
}

export interface FeatureConfig {
  name: string;
  type: 'continuous' | 'categorical' | 'binary' | 'temporal';
  weight: number;
  normalize: boolean;
  transformations?: Array<'log' | 'sqrt' | 'square' | 'standardize'>;
}

export interface ModelEnsembleConfig {
  models: Array<{
    id: string;
    type: 'gradient_boosting' | 'neural_network' | 'random_forest' | 'svm' | 'lstm';
    weight: number;
    features: string[];
    hyperparameters: Record<string, any>;
  }>;
  votingStrategy: 'weighted' | 'majority' | 'stacking';
  confidenceThreshold: number;
}

export interface BiasmitigationConfig {
  demographicParity: boolean;
  equalizedOdds: boolean;
  calibration: boolean;
  fairnessConstraints: Array<{
    attribute: string;
    maxDisparity: number;
  }>;
}

export interface EthicalConstraints {
  requireConsentForHighRisk: boolean;
  maxFalsePositiveRate: number;
  minTruePositiveRate: number;
  humanReviewThreshold: number;
  transparencyLevel: 'low' | 'medium' | 'high' | 'full';
  dataRetentionDays: number;
  allowOverride: boolean;
}

// Pre-trained model configurations
export const MODEL_CONFIGS = {
  // Primary crisis prediction model
  primary: {
    id: 'crisis-prediction-primary-v2',
    version: '2.0.0',
    description: 'Main ensemble model for crisis risk assessment',
    
    weights: {
      behavioral: 0.25,
      linguistic: 0.30,
      temporal: 0.20,
      social: 0.15,
      physiological: 0.05,
      environmental: 0.05
    } as ModelWeights,
    
    thresholds: {
      low: 20,
      moderate: 40,
      elevated: 60,
      high: 75,
      critical: 90
    } as ThresholdConfig,
    
    ensemble: {
      models: [
        {
          id: 'gb-model-1',
          type: 'gradient_boosting' as const,
          weight: 0.35,
          features: ['mood_trend', 'sleep_quality', 'activity_level', 'text_sentiment'],
          hyperparameters: {
            n_estimators: 100,
            learning_rate: 0.1,
            max_depth: 5,
            min_samples_split: 20,
            subsample: 0.8
          }
        },
        {
          id: 'nn-model-1',
          type: 'neural_network' as const,
          weight: 0.30,
          features: ['all'],
          hyperparameters: {
            layers: [128, 64, 32],
            activation: 'relu',
            dropout: 0.3,
            learning_rate: 0.001,
            batch_size: 32
          }
        },
        {
          id: 'rf-model-1',
          type: 'random_forest' as const,
          weight: 0.20,
          features: ['behavioral_patterns', 'social_interactions', 'environmental_factors'],
          hyperparameters: {
            n_estimators: 200,
            max_depth: 10,
            min_samples_split: 15,
            max_features: 'sqrt'
          }
        },
        {
          id: 'lstm-model-1',
          type: 'lstm' as const,
          weight: 0.15,
          features: ['time_series_data'],
          hyperparameters: {
            units: 50,
            return_sequences: false,
            dropout: 0.2,
            recurrent_dropout: 0.2
          }
        }
      ],
      votingStrategy: 'weighted' as const,
      confidenceThreshold: 0.7
    } as ModelEnsembleConfig,
    
    ethical: {
      requireConsentForHighRisk: true,
      maxFalsePositiveRate: 0.15,
      minTruePositiveRate: 0.85,
      humanReviewThreshold: 0.75,
      transparencyLevel: 'high' as const,
      dataRetentionDays: 90,
      allowOverride: true
    } as EthicalConstraints,
    
    biasMitigation: {
      demographicParity: true,
      equalizedOdds: true,
      calibration: true,
      fairnessConstraints: [
        { attribute: 'age_group', maxDisparity: 0.1 },
        { attribute: 'gender', maxDisparity: 0.1 },
        { attribute: 'ethnicity', maxDisparity: 0.15 }
      ]
    } as BiasmitigationConfig
  },
  
  // Lightweight model for real-time monitoring
  realtime: {
    id: 'crisis-prediction-realtime-v1',
    version: '1.0.0',
    description: 'Lightweight model for real-time risk monitoring',
    
    weights: {
      behavioral: 0.40,
      linguistic: 0.35,
      temporal: 0.25,
      social: 0,
      physiological: 0,
      environmental: 0
    } as ModelWeights,
    
    thresholds: {
      low: 25,
      moderate: 45,
      elevated: 65,
      high: 80,
      critical: 95
    } as ThresholdConfig,
    
    ensemble: {
      models: [
        {
          id: 'lightweight-gb',
          type: 'gradient_boosting' as const,
          weight: 0.6,
          features: ['recent_mood', 'current_text', 'recent_behavior'],
          hyperparameters: {
            n_estimators: 50,
            learning_rate: 0.15,
            max_depth: 3
          }
        },
        {
          id: 'simple-nn',
          type: 'neural_network' as const,
          weight: 0.4,
          features: ['recent_indicators'],
          hyperparameters: {
            layers: [32, 16],
            activation: 'relu'
          }
        }
      ],
      votingStrategy: 'weighted' as const,
      confidenceThreshold: 0.6
    } as ModelEnsembleConfig,
    
    ethical: {
      requireConsentForHighRisk: true,
      maxFalsePositiveRate: 0.20,
      minTruePositiveRate: 0.80,
      humanReviewThreshold: 0.70,
      transparencyLevel: 'medium' as const,
      dataRetentionDays: 30,
      allowOverride: true
    } as EthicalConstraints
  },
  
  // Specialized model for text analysis
  textAnalysis: {
    id: 'crisis-text-analysis-v1',
    version: '1.0.0',
    description: 'Specialized NLP model for text-based risk detection',
    
    features: [
      'sentiment_score',
      'emotional_intensity',
      'crisis_keywords',
      'linguistic_markers',
      'coherence_score',
      'temporal_references'
    ],
    
    riskIndicators: {
      immediate: [
        'ending it all',
        'can\'t go on',
        'no way out',
        'better off dead',
        'final goodbye'
      ],
      high: [
        'want to die',
        'no hope',
        'worthless',
        'burden to everyone',
        'can\'t take it'
      ],
      moderate: [
        'feeling trapped',
        'overwhelming pain',
        'nobody understands',
        'all alone',
        'giving up'
      ]
    },
    
    linguisticMarkers: {
      pronounUsage: {
        firstPerson: { weight: 0.2, threshold: 0.8 },
        secondPerson: { weight: 0.1, threshold: 0.3 },
        thirdPerson: { weight: 0.1, threshold: 0.5 }
      },
      temporalFocus: {
        past: { weight: 0.15, threshold: 0.6 },
        present: { weight: 0.25, threshold: 0.7 },
        future: { weight: -0.2, threshold: 0.2 }
      },
      emotionalTone: {
        negative: { weight: 0.35, threshold: 0.6 },
        positive: { weight: -0.15, threshold: 0.2 },
        neutral: { weight: 0, threshold: 0.5 }
      }
    }
  }
};

// Feature extraction configurations
export const FEATURE_CONFIGS: FeatureConfig[] = [
  {
    name: 'mood_trend_7d',
    type: 'continuous',
    weight: 0.15,
    normalize: true,
    transformations: ['standardize']
  },
  {
    name: 'mood_volatility',
    type: 'continuous',
    weight: 0.12,
    normalize: true,
    transformations: ['sqrt', 'standardize']
  },
  {
    name: 'sleep_quality_avg',
    type: 'continuous',
    weight: 0.10,
    normalize: true,
    transformations: ['standardize']
  },
  {
    name: 'social_interaction_freq',
    type: 'continuous',
    weight: 0.08,
    normalize: true,
    transformations: ['log', 'standardize']
  },
  {
    name: 'text_sentiment_avg',
    type: 'continuous',
    weight: 0.20,
    normalize: true,
    transformations: ['standardize']
  },
  {
    name: 'crisis_keyword_count',
    type: 'continuous',
    weight: 0.25,
    normalize: false,
    transformations: ['sqrt']
  },
  {
    name: 'activity_level_change',
    type: 'continuous',
    weight: 0.10,
    normalize: true,
    transformations: ['standardize']
  }
];

// Intervention mapping based on risk scores
export const INTERVENTION_MAPPINGS = {
  critical: {
    minScore: 90,
    interventions: [
      {
        type: 'immediate',
        action: 'Emergency crisis intervention',
        resources: ['Crisis Hotline', '911', 'Mobile Crisis Team'],
        automated: true,
        requiresConsent: false
      },
      {
        type: 'immediate',
        action: 'Notify emergency contacts',
        resources: ['Designated Emergency Contacts'],
        automated: true,
        requiresConsent: false
      }
    ]
  },
  high: {
    minScore: 75,
    interventions: [
      {
        type: 'urgent',
        action: 'Connect with crisis counselor',
        resources: ['Crisis Chat', 'Crisis Text Line', 'Warm Line'],
        automated: true,
        requiresConsent: true
      },
      {
        type: 'urgent',
        action: 'Schedule immediate therapy session',
        resources: ['Therapist', 'Counselor', 'Psychiatrist'],
        automated: false,
        requiresConsent: true
      }
    ]
  },
  elevated: {
    minScore: 60,
    interventions: [
      {
        type: 'preventive',
        action: 'Increase check-in frequency',
        resources: ['Automated Check-ins', 'Peer Support'],
        automated: true,
        requiresConsent: true
      },
      {
        type: 'supportive',
        action: 'Suggest coping strategies',
        resources: ['Coping Skills Library', 'Meditation', 'Exercise'],
        automated: true,
        requiresConsent: true
      }
    ]
  },
  moderate: {
    minScore: 40,
    interventions: [
      {
        type: 'monitoring',
        action: 'Regular mood tracking',
        resources: ['Mood Tracker', 'Journal'],
        automated: true,
        requiresConsent: true
      },
      {
        type: 'supportive',
        action: 'Encourage self-care activities',
        resources: ['Self-care Planner', 'Wellness Activities'],
        automated: true,
        requiresConsent: true
      }
    ]
  }
};

// Utility functions for model operations

/**
 * Normalize features based on configuration
 */
export function normalizeFeatures(
  features: Record<string, number>,
  configs: FeatureConfig[]
): Record<string, number> {
  const normalized: Record<string, number> = {};
  
  configs.forEach(config => {
    let value = features[config.name] || 0;
    
    // Apply transformations
    if (config.transformations) {
      config.transformations.forEach(transform => {
        switch (transform) {
          case 'log':
            value = Math.log(value + 1);
            break;
          case 'sqrt':
            value = Math.sqrt(Math.abs(value));
            break;
          case 'square':
            value = value * value;
            break;
          case 'standardize':
            // In production, use proper mean and std from training data
            value = (value - 0.5) / 0.2;
            break;
        }
      });
    }
    
    // Apply normalization
    if (config.normalize) {
      value = Math.max(0, Math.min(1, value));
    }
    
    normalized[config.name] = value;
  });
  
  return normalized;
}

/**
 * Calculate weighted ensemble prediction
 */
export function calculateEnsemblePrediction(
  predictions: Array<{ modelId: string; score: number; confidence: number }>,
  ensemble: ModelEnsembleConfig
): { score: number; confidence: number } {
  let totalScore = 0;
  let totalConfidence = 0;
  let totalWeight = 0;
  
  predictions.forEach(pred => {
    const model = ensemble.models.find(m => m.id === pred.modelId);
    if (model) {
      totalScore += pred.score * model.weight;
      totalConfidence += pred.confidence * model.weight;
      totalWeight += model.weight;
    }
  });
  
  if (totalWeight === 0) {
    return { score: 0, confidence: 0 };
  }
  
  return {
    score: totalScore / totalWeight,
    confidence: Math.min(totalConfidence / totalWeight, ensemble.confidenceThreshold)
  };
}

/**
 * Apply ethical constraints to prediction
 */
export function applyEthicalConstraints(
  prediction: { score: number; confidence: number },
  constraints: EthicalConstraints
): {
  adjustedScore: number;
  requiresReview: boolean;
  ethicalFlags: string[];
} {
  const flags: string[] = [];
  let requiresReview = false;
  let adjustedScore = prediction.score;
  
  // Check confidence threshold for human review
  if (prediction.confidence < constraints.humanReviewThreshold) {
    requiresReview = true;
    flags.push('Low confidence - human review required');
  }
  
  // Check false positive rate constraints
  if (prediction.score > 80 && prediction.confidence < 0.7) {
    adjustedScore = Math.min(prediction.score, 75);
    flags.push('Adjusted for potential false positive');
  }
  
  // Check transparency requirements
  if (constraints.transparencyLevel === 'full' && prediction.confidence < 0.8) {
    requiresReview = true;
    flags.push('Full transparency required - human review needed');
  }
  
  // Check consent requirements for high risk
  if (constraints.requireConsentForHighRisk && prediction.score >= 75) {
    flags.push('High risk - consent verification required');
  }
  
  return {
    adjustedScore,
    requiresReview,
    ethicalFlags: flags
  };
}

/**
 * Check for bias in predictions
 */
export function checkPredictionBias(
  predictions: Array<{ userId: string; score: number; demographics?: Record<string, any> }>,
  config: BiasmitigationConfig
): {
  biasDetected: boolean;
  disparities: Array<{ attribute: string; disparity: number }>;
} {
  const disparities: Array<{ attribute: string; disparity: number }> = [];
  let biasDetected = false;
  
  if (!config.demographicParity) {
    return { biasDetected: false, disparities: [] };
  }
  
  // Group predictions by demographic attributes
  config.fairnessConstraints.forEach(constraint => {
    const groups: Record<string, number[]> = {};
    
    predictions.forEach(pred => {
      if (pred.demographics && pred.demographics[constraint.attribute]) {
        const group = pred.demographics[constraint.attribute];
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(pred.score);
      }
    });
    
    // Calculate disparity between groups
    const groupMeans = Object.entries(groups).map(([group, scores]) => ({
      group,
      mean: scores.reduce((a, b) => a + b, 0) / scores.length
    }));
    
    if (groupMeans.length >= 2) {
      const maxMean = Math.max(...groupMeans.map(g => g.mean));
      const minMean = Math.min(...groupMeans.map(g => g.mean));
      const disparity = (maxMean - minMean) / maxMean;
      
      if (disparity > constraint.maxDisparity) {
        biasDetected = true;
        disparities.push({
          attribute: constraint.attribute,
          disparity
        });
      }
    }
  });
  
  return { biasDetected, disparities };
}

/**
 * Get appropriate interventions based on risk score
 */
export function getInterventions(
  riskScore: number,
  userConsent: boolean = true
): Array<{
  type: string;
  action: string;
  resources: string[];
  priority: 'immediate' | 'urgent' | 'preventive' | 'supportive' | 'monitoring';
}> {
  const interventions: any[] = [];
  
  Object.entries(INTERVENTION_MAPPINGS).forEach(([level, config]) => {
    if (riskScore >= config.minScore) {
      config.interventions.forEach(intervention => {
        if (!intervention.requiresConsent || userConsent) {
          interventions.push({
            ...intervention,
            priority: level === 'critical' ? 'immediate' :
                     level === 'high' ? 'urgent' :
                     level === 'elevated' ? 'preventive' :
                     level === 'moderate' ? 'supportive' : 'monitoring'
          });
        }
      });
    }
  });
  
  return interventions;
}

/**
 * Validate model configuration
 */
export function validateModelConfig(config: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check required fields
  if (!config.id) errors.push('Model ID is required');
  if (!config.version) errors.push('Model version is required');
  if (!config.weights) errors.push('Model weights are required');
  if (!config.thresholds) errors.push('Risk thresholds are required');
  
  // Validate weights sum to 1
  if (config.weights) {
    const sum = Object.values(config.weights as ModelWeights)
      .reduce((a: number, b: number) => a + b, 0);
    if (Math.abs(sum - 1) > 0.01) {
      errors.push('Model weights must sum to 1');
    }
  }
  
  // Validate thresholds are in order
  if (config.thresholds) {
    const t = config.thresholds as ThresholdConfig;
    if (t.low >= t.moderate || t.moderate >= t.elevated || 
        t.elevated >= t.high || t.high >= t.critical) {
      errors.push('Thresholds must be in ascending order');
    }
  }
  
  // Validate ethical constraints
  if (config.ethical) {
    const e = config.ethical as EthicalConstraints;
    if (e.maxFalsePositiveRate > 1 || e.maxFalsePositiveRate < 0) {
      errors.push('False positive rate must be between 0 and 1');
    }
    if (e.minTruePositiveRate > 1 || e.minTruePositiveRate < 0) {
      errors.push('True positive rate must be between 0 and 1');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Export default configuration
export default MODEL_CONFIGS.primary;