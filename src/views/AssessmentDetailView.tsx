/**
 * Assessment Detail View
 * Detailed view for taking and reviewing mental health assessments
 */

import * as React from 'react';
import { useState, useCallback } from 'react';

// Core interfaces
export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'phq9' | 'gad7' | 'dass21' | 'custom';
  questions: AssessmentQuestion[];
  scoring: ScoringConfig;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'scale' | 'text';
  options?: QuestionOption[];
  scaleRange?: { min: number; max: number; labels?: string[] };
  required: boolean;
  order: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  value: number | string;
  order: number;
}

export interface ScoringConfig {
  method: 'sum' | 'average';
  ranges: ScoreRange[];
}

export interface ScoreRange {
  min: number;
  max: number;
  label: string;
  severity: 'minimal' | 'mild' | 'moderate' | 'severe';
  color: string;
}

export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  userId: string;
  responses: QuestionResponse[];
  score: number;
  completedAt: string;
}

export interface QuestionResponse {
  questionId: string;
  value: number | string | boolean;
}

export interface AssessmentDetailViewProps {
  assessmentId?: string;
  mode: 'take' | 'review' | 'results';
  onComplete?: (response: AssessmentResponse) => void;
  onBack?: () => void;
  className?: string;
}

// Default assessments
export const DEFAULT_ASSESSMENTS: Assessment[] = [
  {
    id: 'phq9',
    title: 'PHQ-9 Depression Assessment',
    description: 'Patient Health Questionnaire for depression screening',
    type: 'phq9',
    questions: [
  {
    id: 'phq9-1',
    text: 'Little interest or pleasure in doing things',
    type: 'scale',
        scaleRange: { min: 0, max: 3, labels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'] },
    required: true,
        order: 1
      }
    ],
    scoring: {
      method: 'sum',
      ranges: [
        { min: 0, max: 4, label: 'Minimal', severity: 'minimal', color: '#28a745' },
        { min: 5, max: 9, label: 'Mild', severity: 'mild', color: '#ffc107' },
        { min: 10, max: 14, label: 'Moderate', severity: 'moderate', color: '#fd7e14' },
        { min: 15, max: 27, label: 'Severe', severity: 'severe', color: '#dc3545' }
      ]
    }
  }
];

// Utility functions
export const getAssessmentById = (id: string): Assessment | undefined => {
  return DEFAULT_ASSESSMENTS.find(assessment => assessment.id === id);
};

export const calculateScore = (assessment: Assessment, responses: QuestionResponse[]): number => {
  if (assessment.scoring.method === 'sum') {
    return responses.reduce((total, response) => {
      const numValue = typeof response.value === 'number' ? response.value : 0;
      return total + numValue;
    }, 0);
  }
  return 0;
};

export const getScoreInterpretation = (assessment: Assessment, score: number): ScoreRange | undefined => {
  return assessment.scoring.ranges.find(range => score >= range.min && score <= range.max);
};

export const validateResponses = (assessment: Assessment, responses: QuestionResponse[]): string[] => {
  const errors: string[] = [];
  const requiredQuestions = assessment.questions.filter(q => q.required);
  const answeredQuestionIds = responses.map(r => r.questionId);
  const missingRequired = requiredQuestions.filter(q => !answeredQuestionIds.includes(q.id));
  
  if (missingRequired.length > 0) {
    errors.push(`${missingRequired.length} required questions not answered`);
  }
  
  return errors;
};

export const createAssessmentResponse = (
  assessment: Assessment,
  userId: string,
  responses: QuestionResponse[]
): AssessmentResponse => {
  const score = calculateScore(assessment, responses);

  return {
    id: `response-${Date.now()}`,
    assessmentId: assessment.id,
    userId,
    responses,
    score,
    completedAt: new Date().toISOString()
  };
};

// Mock component
export const AssessmentDetailView = {
  displayName: 'AssessmentDetailView',
  defaultProps: {
    mode: 'take' as const
  }
};

export default AssessmentDetailView;









