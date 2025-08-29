/**
 * Assessment Utilities
 *
 * Comprehensive assessment tools including PHQ-9, GAD-7, and custom assessments
 * with scoring, analysis, and recommendation generation.
 */

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'scale' | 'yes-no' | 'text' | 'slider';
  options: AssessmentOption[];
  required?: boolean;
  category?: string;
  weight?: number;
}

export interface AssessmentOption {
  value: number;
  text: string;
  description?: string;
}

export interface AssessmentResponse {
  questionId: string;
  value: number;
  text?: string;
  timestamp: Date;
}

export interface AssessmentResult {
  assessmentId: string;
  userId?: string;
  responses: AssessmentResponse[];
  score: number;
  maxScore: number;
  percentage: number;
  severity: AssessmentSeverity;
  category: AssessmentCategory;
  interpretation: string;
  recommendations: string[];
  riskLevel: RiskLevel;
  followUpRequired: boolean;
  completedAt: Date;
  metadata?: AssessmentMetadata;
}

export interface AssessmentMetadata {
  version: string;
  duration: number; // milliseconds
  userAgent?: string;
  sessionId?: string;
  previousScores?: number[];
  trends?: AssessmentTrend;
}

export interface AssessmentTrend {
  direction: 'improving' | 'stable' | 'worsening';
  changePercentage: number;
  timeframe: number; // days
}

export type AssessmentSeverity = 'minimal' | 'mild' | 'moderate' | 'moderately-severe' | 'severe';
export type AssessmentCategory = 'depression' | 'anxiety' | 'stress' | 'wellness' | 'custom';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Assessment {
  id: string;
  name: string;
  description: string;
  category: AssessmentCategory;
  questions: AssessmentQuestion[];
  scoring: ScoringConfig;
  version: string;
  validatedBy?: string[];
  references?: string[];
}

export interface ScoringConfig {
  method: 'sum' | 'average' | 'weighted' | 'custom';
  ranges: ScoreRange[];
  customScoringFunction?: (responses: AssessmentResponse[]) => number;
}

export interface ScoreRange {
  min: number;
  max: number;
  severity: AssessmentSeverity;
  interpretation: string;
  recommendations: string[];
  riskLevel: RiskLevel;
  followUpRequired: boolean;
}

class AssessmentService {
  private assessments = new Map<string, Assessment>();
  private results = new Map<string, AssessmentResult[]>();

  constructor() {
    this.initializeStandardAssessments();
  }

  /**
   * Initialize standard assessments (PHQ-9, GAD-7, etc.)
   */
  private initializeStandardAssessments(): void {
    this.assessments.set('phq9', this.createPHQ9Assessment());
    this.assessments.set('gad7', this.createGAD7Assessment());
    this.assessments.set('stress', this.createStressAssessment());
    this.assessments.set('wellness', this.createWellnessAssessment());
  }

  /**
   * Create PHQ-9 Depression Assessment
   */
  private createPHQ9Assessment(): Assessment {
    const questions: AssessmentQuestion[] = [
      {
        id: 'phq9-1',
        text: 'Little interest or pleasure in doing things',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true,
        category: 'anhedonia'
      },
      {
        id: 'phq9-2',
        text: 'Feeling down, depressed, or hopeless',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true,
        category: 'mood'
      },
      {
        id: 'phq9-3',
        text: 'Trouble falling or staying asleep, or sleeping too much',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true,
        category: 'sleep'
      },
      {
        id: 'phq9-4',
        text: 'Feeling tired or having little energy',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true,
        category: 'energy'
      },
      {
        id: 'phq9-5',
        text: 'Poor appetite or overeating',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true,
        category: 'appetite'
      },
      {
        id: 'phq9-6',
        text: 'Feeling bad about yourself or that you are a failure or have let yourself or your family down',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true,
        category: 'self-worth'
      },
      {
        id: 'phq9-7',
        text: 'Trouble concentrating on things, such as reading the newspaper or watching television',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true,
        category: 'concentration'
      },
      {
        id: 'phq9-8',
        text: 'Moving or speaking so slowly that other people could have noticed, or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true,
        category: 'psychomotor'
      },
      {
        id: 'phq9-9',
        text: 'Thoughts that you would be better off dead, or of hurting yourself',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true,
        category: 'suicidal-ideation'
      }
    ];

    const scoring: ScoringConfig = {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 4,
          severity: 'minimal',
          interpretation: 'Minimal or no depression symptoms',
          recommendations: [
            'Continue with current wellness practices',
            'Maintain regular exercise and social connections',
            'Consider preventive mental health strategies'
          ],
          riskLevel: 'low',
          followUpRequired: false
        },
        {
          min: 5,
          max: 9,
          severity: 'mild',
          interpretation: 'Mild depression symptoms',
          recommendations: [
            'Consider lifestyle modifications',
            'Increase physical activity and social support',
            'Monitor symptoms regularly',
            'Consider counseling if symptoms persist'
          ],
          riskLevel: 'low',
          followUpRequired: true
        },
        {
          min: 10,
          max: 14,
          severity: 'moderate',
          interpretation: 'Moderate depression symptoms',
          recommendations: [
            'Seek professional mental health support',
            'Consider therapy or counseling',
            'Discuss treatment options with healthcare provider',
            'Implement structured self-care routine'
          ],
          riskLevel: 'medium',
          followUpRequired: true
        },
        {
          min: 15,
          max: 19,
          severity: 'moderately-severe',
          interpretation: 'Moderately severe depression symptoms',
          recommendations: [
            'Seek immediate professional help',
            'Consider combination of therapy and medication',
            'Establish strong support system',
            'Regular monitoring by healthcare professional'
          ],
          riskLevel: 'high',
          followUpRequired: true
        },
        {
          min: 20,
          max: 27,
          severity: 'severe',
          interpretation: 'Severe depression symptoms',
          recommendations: [
            'Seek immediate professional intervention',
            'Consider intensive treatment options',
            'Ensure safety and crisis support available',
            'Regular psychiatric evaluation recommended'
          ],
          riskLevel: 'critical',
          followUpRequired: true
        }
      ]
    };

    return {
      id: 'phq9',
      name: 'Patient Health Questionnaire-9 (PHQ-9)',
      description: 'A validated tool for screening and measuring depression severity',
      category: 'depression',
      questions,
      scoring,
      version: '1.0',
      validatedBy: ['American Psychiatric Association'],
      references: [
        'Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9: validity of a brief depression severity measure. Journal of general internal medicine, 16(9), 606-613.'
      ]
    };
  }

  /**
   * Create GAD-7 Anxiety Assessment
   */
  private createGAD7Assessment(): Assessment {
    const questions: AssessmentQuestion[] = [
      {
        id: 'gad7-1',
        text: 'Feeling nervous, anxious, or on edge',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true
      },
      {
        id: 'gad7-2',
        text: 'Not being able to stop or control worrying',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true
      },
      {
        id: 'gad7-3',
        text: 'Worrying too much about different things',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true
      },
      {
        id: 'gad7-4',
        text: 'Trouble relaxing',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true
      },
      {
        id: 'gad7-5',
        text: 'Being so restless that it is hard to sit still',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true
      },
      {
        id: 'gad7-6',
        text: 'Becoming easily annoyed or irritable',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true
      },
      {
        id: 'gad7-7',
        text: 'Feeling afraid, as if something awful might happen',
        type: 'multiple-choice',
        options: [
          { value: 0, text: 'Not at all' },
          { value: 1, text: 'Several days' },
          { value: 2, text: 'More than half the days' },
          { value: 3, text: 'Nearly every day' }
        ],
        required: true
      }
    ];

    const scoring: ScoringConfig = {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 4,
          severity: 'minimal',
          interpretation: 'Minimal anxiety symptoms',
          recommendations: [
            'Continue current coping strategies',
            'Maintain stress management practices',
            'Regular exercise and relaxation'
          ],
          riskLevel: 'low',
          followUpRequired: false
        },
        {
          min: 5,
          max: 9,
          severity: 'mild',
          interpretation: 'Mild anxiety symptoms',
          recommendations: [
            'Practice relaxation techniques',
            'Consider stress reduction strategies',
            'Monitor symptoms and triggers'
          ],
          riskLevel: 'low',
          followUpRequired: true
        },
        {
          min: 10,
          max: 14,
          severity: 'moderate',
          interpretation: 'Moderate anxiety symptoms',
          recommendations: [
            'Seek professional support',
            'Consider therapy or counseling',
            'Learn anxiety management techniques'
          ],
          riskLevel: 'medium',
          followUpRequired: true
        },
        {
          min: 15,
          max: 21,
          severity: 'severe',
          interpretation: 'Severe anxiety symptoms',
          recommendations: [
            'Seek immediate professional help',
            'Consider comprehensive treatment plan',
            'Regular monitoring and support'
          ],
          riskLevel: 'high',
          followUpRequired: true
        }
      ]
    };

    return {
      id: 'gad7',
      name: 'Generalized Anxiety Disorder-7 (GAD-7)',
      description: 'A validated tool for screening and measuring anxiety severity',
      category: 'anxiety',
      questions,
      scoring,
      version: '1.0',
      validatedBy: ['American Psychiatric Association'],
      references: [
        'Spitzer, R. L., Kroenke, K., Williams, J. B., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: the GAD-7. Archives of internal medicine, 166(10), 1092-1097.'
      ]
    };
  }

  /**
   * Create Stress Assessment
   */
  private createStressAssessment(): Assessment {
    const questions: AssessmentQuestion[] = [
      {
        id: 'stress-1',
        text: 'How often have you been upset because of something that happened unexpectedly?',
        type: 'scale',
        options: [
          { value: 0, text: 'Never' },
          { value: 1, text: 'Almost never' },
          { value: 2, text: 'Sometimes' },
          { value: 3, text: 'Fairly often' },
          { value: 4, text: 'Very often' }
        ],
        required: true
      },
      {
        id: 'stress-2',
        text: 'How often have you felt that you were unable to control the important things in your life?',
        type: 'scale',
        options: [
          { value: 0, text: 'Never' },
          { value: 1, text: 'Almost never' },
          { value: 2, text: 'Sometimes' },
          { value: 3, text: 'Fairly often' },
          { value: 4, text: 'Very often' }
        ],
        required: true
      },
      {
        id: 'stress-3',
        text: 'How often have you felt nervous and stressed?',
        type: 'scale',
        options: [
          { value: 0, text: 'Never' },
          { value: 1, text: 'Almost never' },
          { value: 2, text: 'Sometimes' },
          { value: 3, text: 'Fairly often' },
          { value: 4, text: 'Very often' }
        ],
        required: true
      },
      {
        id: 'stress-4',
        text: 'How often have you felt confident about your ability to handle your personal problems?',
        type: 'scale',
        options: [
          { value: 4, text: 'Never' },
          { value: 3, text: 'Almost never' },
          { value: 2, text: 'Sometimes' },
          { value: 1, text: 'Fairly often' },
          { value: 0, text: 'Very often' }
        ],
        required: true
      },
      {
        id: 'stress-5',
        text: 'How often have you felt that things were going your way?',
        type: 'scale',
        options: [
          { value: 4, text: 'Never' },
          { value: 3, text: 'Almost never' },
          { value: 2, text: 'Sometimes' },
          { value: 1, text: 'Fairly often' },
          { value: 0, text: 'Very often' }
        ],
        required: true
      }
    ];

    const scoring: ScoringConfig = {
      method: 'sum',
      ranges: [
        {
          min: 0,
          max: 7,
          severity: 'minimal',
          interpretation: 'Low stress levels',
          recommendations: [
            'Maintain current stress management',
            'Continue healthy lifestyle practices'
          ],
          riskLevel: 'low',
          followUpRequired: false
        },
        {
          min: 8,
          max: 11,
          severity: 'mild',
          interpretation: 'Mild stress levels',
          recommendations: [
            'Implement stress reduction techniques',
            'Focus on work-life balance'
          ],
          riskLevel: 'low',
          followUpRequired: true
        },
        {
          min: 12,
          max: 15,
          severity: 'moderate',
          interpretation: 'Moderate stress levels',
          recommendations: [
            'Consider stress management counseling',
            'Evaluate life stressors and coping strategies'
          ],
          riskLevel: 'medium',
          followUpRequired: true
        },
        {
          min: 16,
          max: 20,
          severity: 'severe',
          interpretation: 'High stress levels',
          recommendations: [
            'Seek professional stress management support',
            'Consider comprehensive lifestyle changes'
          ],
          riskLevel: 'high',
          followUpRequired: true
        }
      ]
    };

    return {
      id: 'stress',
      name: 'Perceived Stress Scale (PSS-5)',
      description: 'A shortened version of the validated stress assessment tool',
      category: 'stress',
      questions,
      scoring,
      version: '1.0'
    };
  }

  /**
   * Create Wellness Assessment
   */
  private createWellnessAssessment(): Assessment {
    const questions: AssessmentQuestion[] = [
      {
        id: 'wellness-1',
        text: 'How would you rate your overall physical health?',
        type: 'scale',
        options: [
          { value: 1, text: 'Poor' },
          { value: 2, text: 'Fair' },
          { value: 3, text: 'Good' },
          { value: 4, text: 'Very good' },
          { value: 5, text: 'Excellent' }
        ],
        required: true,
        category: 'physical'
      },
      {
        id: 'wellness-2',
        text: 'How would you rate your overall mental/emotional health?',
        type: 'scale',
        options: [
          { value: 1, text: 'Poor' },
          { value: 2, text: 'Fair' },
          { value: 3, text: 'Good' },
          { value: 4, text: 'Very good' },
          { value: 5, text: 'Excellent' }
        ],
        required: true,
        category: 'mental'
      },
      {
        id: 'wellness-3',
        text: 'How satisfied are you with your social relationships?',
        type: 'scale',
        options: [
          { value: 1, text: 'Very dissatisfied' },
          { value: 2, text: 'Dissatisfied' },
          { value: 3, text: 'Neutral' },
          { value: 4, text: 'Satisfied' },
          { value: 5, text: 'Very satisfied' }
        ],
        required: true,
        category: 'social'
      },
      {
        id: 'wellness-4',
        text: 'How often do you engage in activities that give your life meaning and purpose?',
        type: 'scale',
        options: [
          { value: 1, text: 'Never' },
          { value: 2, text: 'Rarely' },
          { value: 3, text: 'Sometimes' },
          { value: 4, text: 'Often' },
          { value: 5, text: 'Very often' }
        ],
        required: true,
        category: 'spiritual'
      },
      {
        id: 'wellness-5',
        text: 'How well do you manage stress in your daily life?',
        type: 'scale',
        options: [
          { value: 1, text: 'Very poorly' },
          { value: 2, text: 'Poorly' },
          { value: 3, text: 'Adequately' },
          { value: 4, text: 'Well' },
          { value: 5, text: 'Very well' }
        ],
        required: true,
        category: 'coping'
      }
    ];

    const scoring: ScoringConfig = {
      method: 'average',
      ranges: [
        {
          min: 1,
          max: 2,
          severity: 'minimal',
          interpretation: 'Low wellness levels - multiple areas need attention',
          recommendations: [
            'Focus on basic self-care practices',
            'Consider comprehensive wellness plan',
            'Seek support for multiple wellness domains'
          ],
          riskLevel: 'high',
          followUpRequired: true
        },
        {
          min: 2.1,
          max: 3,
          severity: 'mild',
          interpretation: 'Below average wellness - some areas need improvement',
          recommendations: [
            'Identify specific areas for improvement',
            'Develop targeted wellness strategies',
            'Consider lifestyle modifications'
          ],
          riskLevel: 'medium',
          followUpRequired: true
        },
        {
          min: 3.1,
          max: 4,
          severity: 'moderate',
          interpretation: 'Good wellness levels - maintain and enhance',
          recommendations: [
            'Continue current wellness practices',
            'Look for opportunities to enhance well-being',
            'Share strategies with others'
          ],
          riskLevel: 'low',
          followUpRequired: false
        },
        {
          min: 4.1,
          max: 5,
          severity: 'minimal',
          interpretation: 'Excellent wellness levels - you are thriving',
          recommendations: [
            'Maintain current excellent practices',
            'Consider mentoring others',
            'Continue to challenge yourself for growth'
          ],
          riskLevel: 'low',
          followUpRequired: false
        }
      ]
    };

    return {
      id: 'wellness',
      name: 'Comprehensive Wellness Assessment',
      description: 'Evaluates overall wellness across multiple life domains',
      category: 'wellness',
      questions,
      scoring,
      version: '1.0'
    };
  }

  /**
   * Get assessment by ID
   */
  public getAssessment(id: string): Assessment | null {
    return this.assessments.get(id) || null;
  }

  /**
   * Get all available assessments
   */
  public getAllAssessments(): Assessment[] {
    return Array.from(this.assessments.values());
  }

  /**
   * Score assessment responses
   */
  public scoreAssessment(
    assessmentId: string,
    responses: AssessmentResponse[],
    userId?: string
  ): AssessmentResult {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    // Calculate score based on scoring method
    const score = this.calculateScore(assessment, responses);
    const maxScore = this.getMaxScore(assessment);
    const percentage = (score / maxScore) * 100;

    // Determine severity and interpretation
    const scoreRange = this.getScoreRange(assessment, score);
    
    // Check for crisis indicators (especially PHQ-9 question 9)
    const hasCrisisIndicators = this.checkCrisisIndicators(assessmentId, responses);

    const result: AssessmentResult = {
      assessmentId,
      userId,
      responses,
      score,
      maxScore,
      percentage,
      severity: scoreRange.severity,
      category: assessment.category,
      interpretation: scoreRange.interpretation,
      recommendations: [...scoreRange.recommendations],
      riskLevel: hasCrisisIndicators ? 'critical' : scoreRange.riskLevel,
      followUpRequired: scoreRange.followUpRequired || hasCrisisIndicators,
      completedAt: new Date(),
      metadata: {
        version: assessment.version,
        duration: 0 // Would be calculated from start time
      }
    };

    // Add crisis-specific recommendations if needed
    if (hasCrisisIndicators) {
      result.recommendations.unshift(
        'IMMEDIATE: Seek emergency mental health support',
        'Contact crisis hotline: 988 (Suicide & Crisis Lifeline)',
        'Consider emergency room visit if in immediate danger'
      );
    }

    // Store result
    this.storeResult(userId || 'anonymous', result);

    return result;
  }

  /**
   * Calculate score based on assessment configuration
   */
  private calculateScore(assessment: Assessment, responses: AssessmentResponse[]): number {
    const { method, customScoringFunction } = assessment.scoring;

    if (customScoringFunction) {
      return customScoringFunction(responses);
    }

    const values = responses.map(r => r.value);

    switch (method) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      
      case 'average':
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      
      case 'weighted':
        return assessment.questions.reduce((sum, question, index) => {
          const response = responses.find(r => r.questionId === question.id);
          const weight = question.weight || 1;
          return sum + (response ? response.value * weight : 0);
        }, 0);
      
      default:
        return values.reduce((sum, val) => sum + val, 0);
    }
  }

  /**
   * Get maximum possible score
   */
  private getMaxScore(assessment: Assessment): number {
    const { method } = assessment.scoring;

    switch (method) {
      case 'sum':
        return assessment.questions.reduce((sum, question) => {
          const maxValue = Math.max(...question.options.map(o => o.value));
          return sum + maxValue;
        }, 0);
      
      case 'average':
        return Math.max(...assessment.questions.flatMap(q => q.options.map(o => o.value)));
      
      case 'weighted':
        return assessment.questions.reduce((sum, question) => {
          const maxValue = Math.max(...question.options.map(o => o.value));
          const weight = question.weight || 1;
          return sum + (maxValue * weight);
        }, 0);
      
      default:
        return assessment.questions.length * 4; // Assume 0-4 scale
    }
  }

  /**
   * Get score range for interpretation
   */
  private getScoreRange(assessment: Assessment, score: number): ScoreRange {
    const ranges = assessment.scoring.ranges;
    
    for (const range of ranges) {
      if (score >= range.min && score <= range.max) {
        return range;
      }
    }
    
    // Default to last range if no match found
    return ranges[ranges.length - 1];
  }

  /**
   * Check for crisis indicators
   */
  private checkCrisisIndicators(assessmentId: string, responses: AssessmentResponse[]): boolean {
    // PHQ-9 Question 9 (suicidal ideation)
    if (assessmentId === 'phq9') {
      const q9Response = responses.find(r => r.questionId === 'phq9-9');
      return q9Response ? q9Response.value > 0 : false;
    }

    // Add other crisis indicators for different assessments
    return false;
  }

  /**
   * Store assessment result
   */
  private storeResult(userId: string, result: AssessmentResult): void {
    if (!this.results.has(userId)) {
      this.results.set(userId, []);
    }
    
    const userResults = this.results.get(userId)!;
    userResults.push(result);
    
    // Keep only last 10 results per user
    if (userResults.length > 10) {
      userResults.splice(0, userResults.length - 10);
    }
  }

  /**
   * Get user assessment history
   */
  public getUserResults(userId: string, assessmentId?: string): AssessmentResult[] {
    const userResults = this.results.get(userId) || [];
    
    if (assessmentId) {
      return userResults.filter(r => r.assessmentId === assessmentId);
    }
    
    return userResults;
  }

  /**
   * Calculate assessment trends
   */
  public calculateTrends(userId: string, assessmentId: string): AssessmentTrend | null {
    const results = this.getUserResults(userId, assessmentId);
    
    if (results.length < 2) {
      return null;
    }

    // Sort by completion date
    results.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
    
    const latest = results[results.length - 1];
    const previous = results[results.length - 2];
    
    const changePercentage = ((latest.score - previous.score) / previous.score) * 100;
    const timeframeDays = Math.floor(
      (latest.completedAt.getTime() - previous.completedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    let direction: AssessmentTrend['direction'];
    if (Math.abs(changePercentage) < 5) {
      direction = 'stable';
    } else if (changePercentage > 0) {
      // For depression/anxiety, higher scores are worse
      direction = assessmentId === 'wellness' ? 'improving' : 'worsening';
    } else {
      direction = assessmentId === 'wellness' ? 'worsening' : 'improving';
    }

    return {
      direction,
      changePercentage: Math.abs(changePercentage),
      timeframe: timeframeDays
    };
  }

  /**
   * Generate assessment report
   */
  public generateReport(result: AssessmentResult): string {
    const assessment = this.getAssessment(result.assessmentId);
    if (!assessment) return '';

    let report = `# ${assessment.name} Results\n\n`;
    report += `**Score:** ${result.score}/${result.maxScore} (${result.percentage.toFixed(1)}%)\n`;
    report += `**Severity:** ${result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}\n`;
    report += `**Risk Level:** ${result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)}\n\n`;
    
    report += `## Interpretation\n${result.interpretation}\n\n`;
    
    report += `## Recommendations\n`;
    result.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
    
    if (result.followUpRequired) {
      report += `\n**⚠️ Follow-up Required:** Please consider professional consultation.\n`;
    }

    return report;
  }

  /**
   * Validate assessment responses
   */
  public validateResponses(assessmentId: string, responses: AssessmentResponse[]): {
    isValid: boolean;
    errors: string[];
  } {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      return { isValid: false, errors: ['Assessment not found'] };
    }

    const errors: string[] = [];
    
    // Check all required questions are answered
    const requiredQuestions = assessment.questions.filter(q => q.required);
    const responseQuestionIds = responses.map(r => r.questionId);
    
    for (const question of requiredQuestions) {
      if (!responseQuestionIds.includes(question.id)) {
        errors.push(`Question "${question.text}" is required but not answered`);
      }
    }

    // Validate response values are within valid options
    for (const response of responses) {
      const question = assessment.questions.find(q => q.id === response.questionId);
      if (question) {
        const validValues = question.options.map(o => o.value);
        if (!validValues.includes(response.value)) {
          errors.push(`Invalid response value ${response.value} for question "${question.text}"`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance and factory
export const assessmentService = new AssessmentService();

export const createAssessmentService = () => new AssessmentService();

// Utility functions
export const scoreAssessment = (
  assessmentId: string,
  responses: AssessmentResponse[],
  userId?: string
) => {
  return assessmentService.scoreAssessment(assessmentId, responses, userId);
};

export const getAssessment = (id: string) => {
  return assessmentService.getAssessment(id);
};

export const validateAssessmentResponses = (assessmentId: string, responses: AssessmentResponse[]) => {
  return assessmentService.validateResponses(assessmentId, responses);
};
