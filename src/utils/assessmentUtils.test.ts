/**
 * Assessment Utilities Tests
 * 
 * Tests for mental health assessment scoring, validation, and analysis functions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock types for assessment utilities
interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'scale' | 'multiple-choice' | 'boolean' | 'text';
  scale?: { min: number; max: number; labels?: Record<number, string> };
  options?: string[];
  required: boolean;
  weight?: number;
}

interface AssessmentAnswer {
  questionId: string;
  value: string | number | boolean;
  timestamp: Date;
}

interface AssessmentResult {
  totalScore: number;
  normalizedScore: number;
  categoryScores: Record<string, number>;
  riskLevel: 'low' | 'mild' | 'moderate' | 'severe' | 'critical';
  recommendations: string[];
  completionPercentage: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Assessment utility functions (would be imported in real implementation)
class AssessmentUtils {
  static validateAnswer(question: AssessmentQuestion, answer: AssessmentAnswer): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (question.required && (answer.value === null || answer.value === undefined || answer.value === '')) {
      errors.push(`Question "${question.id}" is required`);
    }

    switch (question.type) {
      case 'scale':
        if (question.scale && typeof answer.value === 'number') {
          if (answer.value < question.scale.min || answer.value > question.scale.max) {
            errors.push(`Scale value must be between ${question.scale.min} and ${question.scale.max}`);
          }
        } else if (typeof answer.value !== 'number') {
          errors.push('Scale questions require numeric answers');
        }
        break;

      case 'multiple-choice':
        if (question.options && !question.options.includes(String(answer.value))) {
          errors.push('Answer must be one of the provided options');
        }
        break;

      case 'boolean':
        if (typeof answer.value !== 'boolean' && answer.value !== 'true' && answer.value !== 'false') {
          errors.push('Boolean questions require true/false answers');
        }
        break;

      case 'text':
        if (typeof answer.value !== 'string') {
          errors.push('Text questions require string answers');
        } else if (answer.value.length > 1000) {
          warnings.push('Text answer is very long');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static calculateScore(questions: AssessmentQuestion[], answers: AssessmentAnswer[]): AssessmentResult {
    const answerMap = new Map(answers.map(a => [a.questionId, a]));
    let totalScore = 0;
    let maxPossibleScore = 0;
    let answeredQuestions = 0;
    const categoryScores: Record<string, number> = {};

    for (const question of questions) {
      const answer = answerMap.get(question.id);
      const weight = question.weight || 1;

      if (question.type === 'scale' && question.scale) {
        maxPossibleScore += question.scale.max * weight;

        if (answer && typeof answer.value === 'number') {
          totalScore += answer.value * weight;
          answeredQuestions++;
        }
      } else if (question.type === 'boolean') {
        maxPossibleScore += 1 * weight;

        if (answer) {
          const boolValue = answer.value === true || answer.value === 'true';
          totalScore += (boolValue ? 1 : 0) * weight;
          answeredQuestions++;
        }
      }
    }

    const completionPercentage = (answeredQuestions / questions.length) * 100;
    const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    return {
      totalScore,
      normalizedScore,
      categoryScores,
      riskLevel: this.determineRiskLevel(normalizedScore),
      recommendations: this.generateRecommendations(normalizedScore),
      completionPercentage
    };
  }

  private static determineRiskLevel(score: number): AssessmentResult['riskLevel'] {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'severe';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'mild';
    return 'low';
  }

  private static generateRecommendations(score: number): string[] {
    const recommendations: string[] = [];

    if (score >= 80) {
      recommendations.push('Immediate professional help recommended');
      recommendations.push('Consider emergency mental health services');
      recommendations.push('Contact crisis hotline: 988');
    } else if (score >= 60) {
      recommendations.push('Professional mental health support strongly recommended');
      recommendations.push('Schedule appointment with therapist or counselor');
      recommendations.push('Monitor symptoms closely');
    } else if (score >= 40) {
      recommendations.push('Consider speaking with a mental health professional');
      recommendations.push('Practice self-care techniques');
      recommendations.push('Reach out to trusted friends or family');
    } else if (score >= 20) {
      recommendations.push('Monitor your mental health');
      recommendations.push('Practice stress management techniques');
      recommendations.push('Maintain social connections');
    } else {
      recommendations.push('Continue current mental health practices');
      recommendations.push('Stay aware of changes in mood');
    }

    return recommendations;
  }

  static analyzeAssessmentTrends(
    assessments: Array<{ date: Date; result: AssessmentResult }>
  ): {
    trend: 'improving' | 'stable' | 'declining';
    changeRate: number;
    significantChange: boolean;
  } {
    if (assessments.length < 2) {
      return {
        trend: 'stable',
        changeRate: 0,
        significantChange: false
      };
    }

    const sortedAssessments = assessments.sort((a, b) => a.date.getTime() - b.date.getTime());
    const latest = sortedAssessments[sortedAssessments.length - 1];
    const previous = sortedAssessments[sortedAssessments.length - 2];

    const changeRate = latest.result.normalizedScore - previous.result.normalizedScore;
    const significantChange = Math.abs(changeRate) >= 10; // 10% change considered significant

    let trend: 'improving' | 'stable' | 'declining';
    if (changeRate > 5) {
      trend = 'declining'; // Higher score = worse in mental health assessments
    } else if (changeRate < -5) {
      trend = 'improving';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      changeRate,
      significantChange
    };
  }

  static generateAssessmentReport(result: AssessmentResult): string {
    const { riskLevel, normalizedScore, recommendations, completionPercentage } = result;
    
    let report = `Assessment Report\n\n`;
    report += `Completion: ${completionPercentage.toFixed(1)}%\n`;
    report += `Risk Level: ${riskLevel.toUpperCase()}\n`;
    report += `Score: ${normalizedScore.toFixed(1)}/100\n\n`;
    
    if (recommendations.length > 0) {
      report += `Recommendations:\n`;
      recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
    }

    return report;
  }
}

describe('AssessmentUtils', () => {
  const sampleQuestions: AssessmentQuestion[] = [
    {
      id: 'mood_1',
      text: 'How would you rate your overall mood?',
      type: 'scale',
      scale: { min: 1, max: 10 },
      required: true,
      weight: 2
    },
    {
      id: 'sleep_1',
      text: 'Have you had trouble sleeping?',
      type: 'boolean',
      required: true,
      weight: 1
    },
    {
      id: 'anxiety_1',
      text: 'How anxious do you feel on average?',
      type: 'scale',
      scale: { min: 0, max: 5 },
      required: true,
      weight: 1.5
    },
    {
      id: 'support_1',
      text: 'What type of support would be most helpful?',
      type: 'multiple-choice',
      options: ['Therapy', 'Medication', 'Support groups', 'Self-help'],
      required: false,
      weight: 0.5
    }
  ];

  describe('validateAnswer', () => {
    it('should validate required scale answers', () => {
      const question = sampleQuestions[0]; // mood scale
      const validAnswer: AssessmentAnswer = {
        questionId: 'mood_1',
        value: 7,
        timestamp: new Date()
      };

      const result = AssessmentUtils.validateAnswer(question, validAnswer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject scale answers outside range', () => {
      const question = sampleQuestions[0];
      const invalidAnswer: AssessmentAnswer = {
        questionId: 'mood_1',
        value: 15,
        timestamp: new Date()
      };

      const result = AssessmentUtils.validateAnswer(question, invalidAnswer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scale value must be between 1 and 10');
    });

    it('should require answers for required questions', () => {
      const question = sampleQuestions[0];
      const emptyAnswer: AssessmentAnswer = {
        questionId: 'mood_1',
        value: '',
        timestamp: new Date()
      };

      const result = AssessmentUtils.validateAnswer(question, emptyAnswer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question "mood_1" is required');
    });

    it('should validate boolean answers', () => {
      const question = sampleQuestions[1]; // sleep boolean
      const validAnswer: AssessmentAnswer = {
        questionId: 'sleep_1',
        value: true,
        timestamp: new Date()
      };

      const result = AssessmentUtils.validateAnswer(question, validAnswer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate multiple choice answers', () => {
      const question = sampleQuestions[3]; // support options
      const validAnswer: AssessmentAnswer = {
        questionId: 'support_1',
        value: 'Therapy',
        timestamp: new Date()
      };

      const result = AssessmentUtils.validateAnswer(question, validAnswer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid multiple choice answers', () => {
      const question = sampleQuestions[3];
      const invalidAnswer: AssessmentAnswer = {
        questionId: 'support_1',
        value: 'Invalid option',
        timestamp: new Date()
      };

      const result = AssessmentUtils.validateAnswer(question, invalidAnswer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer must be one of the provided options');
    });
  });

  describe('calculateScore', () => {
    it('should calculate basic assessment score', () => {
      const answers: AssessmentAnswer[] = [
        { questionId: 'mood_1', value: 3, timestamp: new Date() }, // 3 * 2 = 6
        { questionId: 'sleep_1', value: true, timestamp: new Date() }, // 1 * 1 = 1
        { questionId: 'anxiety_1', value: 4, timestamp: new Date() } // 4 * 1.5 = 6
      ];

      const result = AssessmentUtils.calculateScore(sampleQuestions, answers);

      // Total: 6 + 1 + 6 = 13
      // Max possible: (10 * 2) + (1 * 1) + (5 * 1.5) = 20 + 1 + 7.5 = 28.5
      // Normalized: (13 / 28.5) * 100 = ~45.6%

      expect(result.totalScore).toBe(13);
      expect(result.normalizedScore).toBeCloseTo(45.6, 1);
      expect(result.riskLevel).toBe('moderate');
    });

    it('should handle missing answers', () => {
      const answers: AssessmentAnswer[] = [
        { questionId: 'mood_1', value: 8, timestamp: new Date() }
      ];

      const result = AssessmentUtils.calculateScore(sampleQuestions, answers);

      expect(result.completionPercentage).toBe(25); // 1/4 questions answered
      expect(result.totalScore).toBe(16); // 8 * 2
    });

    it('should determine correct risk levels', () => {
      // High score (worse condition)
      const highAnswers: AssessmentAnswer[] = [
        { questionId: 'mood_1', value: 10, timestamp: new Date() },
        { questionId: 'sleep_1', value: true, timestamp: new Date() },
        { questionId: 'anxiety_1', value: 5, timestamp: new Date() }
      ];

      const highResult = AssessmentUtils.calculateScore(sampleQuestions, highAnswers);
      expect(highResult.riskLevel).toBe('critical');

      // Low score (better condition)
      const lowAnswers: AssessmentAnswer[] = [
        { questionId: 'mood_1', value: 1, timestamp: new Date() },
        { questionId: 'sleep_1', value: false, timestamp: new Date() },
        { questionId: 'anxiety_1', value: 0, timestamp: new Date() }
      ];

      const lowResult = AssessmentUtils.calculateScore(sampleQuestions, lowAnswers);
      expect(lowResult.riskLevel).toBe('low');
    });
  });

  describe('analyzeAssessmentTrends', () => {
    it('should detect improving trend', () => {
      const assessments = [
        {
          date: new Date('2023-01-01'),
          result: {
            normalizedScore: 70,
            riskLevel: 'severe' as const,
            totalScore: 0,
            categoryScores: {},
            recommendations: [],
            completionPercentage: 100
          }
        },
        {
          date: new Date('2023-01-15'),
          result: {
            normalizedScore: 45,
            riskLevel: 'moderate' as const,
            totalScore: 0,
            categoryScores: {},
            recommendations: [],
            completionPercentage: 100
          }
        }
      ];

      const trend = AssessmentUtils.analyzeAssessmentTrends(assessments);

      expect(trend.trend).toBe('improving');
      expect(trend.changeRate).toBe(-25); // 45 - 70
      expect(trend.significantChange).toBe(true);
    });

    it('should detect declining trend', () => {
      const assessments = [
        {
          date: new Date('2023-01-01'),
          result: {
            normalizedScore: 30,
            riskLevel: 'mild' as const,
            totalScore: 0,
            categoryScores: {},
            recommendations: [],
            completionPercentage: 100
          }
        },
        {
          date: new Date('2023-01-15'),
          result: {
            normalizedScore: 65,
            riskLevel: 'severe' as const,
            totalScore: 0,
            categoryScores: {},
            recommendations: [],
            completionPercentage: 100
          }
        }
      ];

      const trend = AssessmentUtils.analyzeAssessmentTrends(assessments);

      expect(trend.trend).toBe('declining');
      expect(trend.changeRate).toBe(35); // 65 - 30
      expect(trend.significantChange).toBe(true);
    });

    it('should detect stable trend', () => {
      const assessments = [
        {
          date: new Date('2023-01-01'),
          result: {
            normalizedScore: 45,
            riskLevel: 'moderate' as const,
            totalScore: 0,
            categoryScores: {},
            recommendations: [],
            completionPercentage: 100
          }
        },
        {
          date: new Date('2023-01-15'),
          result: {
            normalizedScore: 47,
            riskLevel: 'moderate' as const,
            totalScore: 0,
            categoryScores: {},
            recommendations: [],
            completionPercentage: 100
          }
        }
      ];

      const trend = AssessmentUtils.analyzeAssessmentTrends(assessments);

      expect(trend.trend).toBe('stable');
      expect(trend.changeRate).toBe(2);
      expect(trend.significantChange).toBe(false);
    });

    it('should handle single assessment', () => {
      const assessments = [
        {
          date: new Date('2023-01-01'),
          result: {
            normalizedScore: 45,
            riskLevel: 'moderate' as const,
            totalScore: 0,
            categoryScores: {},
            recommendations: [],
            completionPercentage: 100
          }
        }
      ];

      const trend = AssessmentUtils.analyzeAssessmentTrends(assessments);

      expect(trend.trend).toBe('stable');
      expect(trend.changeRate).toBe(0);
      expect(trend.significantChange).toBe(false);
    });
  });

  describe('generateAssessmentReport', () => {
    it('should generate comprehensive report', () => {
      const result: AssessmentResult = {
        totalScore: 15,
        normalizedScore: 62.5,
        categoryScores: {},
        riskLevel: 'severe',
        recommendations: [
          'Professional mental health support strongly recommended',
          'Schedule appointment with therapist or counselor'
        ],
        completionPercentage: 100
      };

      const report = AssessmentUtils.generateAssessmentReport(result);

      expect(report).toContain('Assessment Report');
      expect(report).toContain('Completion: 100.0%');
      expect(report).toContain('Risk Level: SEVERE');
      expect(report).toContain('Score: 62.5/100');
      expect(report).toContain('Recommendations:');
      expect(report).toContain('1. Professional mental health support strongly recommended');
      expect(report).toContain('2. Schedule appointment with therapist or counselor');
    });

    it('should handle empty recommendations', () => {
      const result: AssessmentResult = {
        totalScore: 5,
        normalizedScore: 15,
        categoryScores: {},
        riskLevel: 'low',
        recommendations: [],
        completionPercentage: 75
      };

      const report = AssessmentUtils.generateAssessmentReport(result);

      expect(report).toContain('Risk Level: LOW');
      expect(report).toContain('Score: 15.0/100');
      expect(report).not.toContain('Recommendations:');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty questions array', () => {
      const result = AssessmentUtils.calculateScore([], []);

      expect(result.totalScore).toBe(0);
      expect(result.normalizedScore).toBe(0);
      expect(result.completionPercentage).toBe(0);
      expect(result.riskLevel).toBe('low');
    });

    it('should handle questions without scale definitions', () => {
      const invalidQuestion: AssessmentQuestion = {
        id: 'invalid',
        text: 'Invalid question',
        type: 'scale',
        required: true
      };

      const answer: AssessmentAnswer = {
        questionId: 'invalid',
        value: 5,
        timestamp: new Date()
      };

      const result = AssessmentUtils.validateAnswer(invalidQuestion, answer);
      expect(result.isValid).toBe(true); // Should handle gracefully
    });

    it('should handle mixed data types gracefully', () => {
      const mixedAnswer: AssessmentAnswer = {
        questionId: 'mood_1',
        value: 'not_a_number',
        timestamp: new Date()
      };

      const result = AssessmentUtils.validateAnswer(sampleQuestions[0], mixedAnswer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scale questions require numeric answers');
    });
  });
});

