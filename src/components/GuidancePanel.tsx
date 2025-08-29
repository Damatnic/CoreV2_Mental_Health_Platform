/**
 * Guidance Panel Component
 * Interactive guidance system for mental health support
 */

import * as React from 'react';
import { useState, useCallback } from 'react';

// Core interfaces
export interface GuidanceStep {
  id: string;
  title: string;
  description: string;
  content: string;
  order: number;
  isCompleted: boolean;
  isRequired: boolean;
  estimatedTime?: number; // in minutes
  category?: 'assessment' | 'exercise' | 'education' | 'reflection';
  difficulty?: 'easy' | 'medium' | 'hard';
  prerequisites?: string[];
  resources?: GuidanceResource[];
}

export interface GuidanceSection {
  id: string;
  title: string;
  description: string;
  steps: GuidanceStep[];
  isExpanded: boolean;
  completionRate: number;
  category: 'getting-started' | 'daily-practices' | 'crisis-support' | 'long-term-wellness';
  icon?: string;
  estimatedTime?: number;
}

export interface GuidanceResource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'audio' | 'exercise' | 'worksheet';
  url?: string;
  duration?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GuidancePanelProps {
  sections?: GuidanceSection[];
  onStepComplete?: (stepId: string, sectionId: string) => void;
  onSectionComplete?: (sectionId: string) => void;
  currentStep?: string;
  showProgress?: boolean;
  allowSkipping?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

// Default guidance sections
export const DEFAULT_GUIDANCE_SECTIONS: GuidanceSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Essential first steps for your mental health journey',
    category: 'getting-started',
    icon: '🚀',
    isExpanded: true,
    completionRate: 0,
    estimatedTime: 15,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome & Overview',
        description: 'Learn about the platform and what to expect',
        content: 'Welcome to your mental health support platform. This guidance will help you navigate your journey.',
        order: 1,
        isCompleted: false,
        isRequired: true,
        estimatedTime: 3,
        category: 'education',
        difficulty: 'easy'
      },
      {
        id: 'safety-plan',
        title: 'Create Your Safety Plan',
        description: 'Develop a personalized crisis response plan',
        content: 'A safety plan is crucial for managing crisis situations. Let\'s create yours together.',
        order: 2,
        isCompleted: false,
        isRequired: true,
        estimatedTime: 10,
        category: 'assessment',
        difficulty: 'medium',
        prerequisites: ['welcome']
      },
      {
        id: 'emergency-contacts',
        title: 'Set Up Emergency Contacts',
        description: 'Add trusted contacts for crisis situations',
        content: 'Having reliable emergency contacts is essential for your safety and well-being.',
        order: 3,
        isCompleted: false,
        isRequired: true,
        estimatedTime: 5,
        category: 'assessment',
        difficulty: 'easy',
        prerequisites: ['safety-plan']
      }
    ]
  },
  {
    id: 'daily-practices',
    title: 'Daily Wellness Practices',
    description: 'Build healthy daily habits for mental wellness',
    category: 'daily-practices',
    icon: '🌱',
    isExpanded: false,
    completionRate: 0,
    estimatedTime: 25,
    steps: [
      {
        id: 'morning-routine',
        title: 'Morning Mindfulness',
        description: 'Start your day with intention and awareness',
        content: 'A mindful morning routine sets a positive tone for your entire day.',
        order: 1,
        isCompleted: false,
        isRequired: false,
        estimatedTime: 10,
        category: 'exercise',
        difficulty: 'easy'
      },
      {
        id: 'mood-tracking',
        title: 'Daily Mood Check-in',
        description: 'Track your emotional state throughout the day',
        content: 'Regular mood tracking helps you identify patterns and triggers.',
        order: 2,
        isCompleted: false,
        isRequired: false,
        estimatedTime: 5,
        category: 'reflection',
        difficulty: 'easy'
      },
      {
        id: 'evening-reflection',
        title: 'Evening Reflection',
        description: 'End your day with gratitude and reflection',
        content: 'Evening reflection helps process the day and prepare for restful sleep.',
        order: 3,
        isCompleted: false,
        isRequired: false,
        estimatedTime: 10,
        category: 'reflection',
        difficulty: 'easy'
      }
    ]
  }
];

// Utility functions
export const calculateSectionProgress = (section: GuidanceSection): number => {
  if (section.steps.length === 0) return 0;
  const completedSteps = section.steps.filter(step => step.isCompleted).length;
  return Math.round((completedSteps / section.steps.length) * 100);
};

export const calculateOverallProgress = (sections: GuidanceSection[]): number => {
  if (sections.length === 0) return 0;
  const totalSteps = sections.reduce((sum, section) => sum + section.steps.length, 0);
  const completedSteps = sections.reduce((sum, section) => 
    sum + section.steps.filter(step => step.isCompleted).length, 0
  );
  return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
};

export const getNextStep = (sections: GuidanceSection[]): GuidanceStep | null => {
  for (const section of sections) {
    const incompleteStep = section.steps
      .sort((a, b) => a.order - b.order)
      .find(step => !step.isCompleted && arePrerequisitesMet(step, sections));
    
    if (incompleteStep) return incompleteStep;
  }
  return null;
};

export const arePrerequisitesMet = (step: GuidanceStep, sections: GuidanceSection[]): boolean => {
  if (!step.prerequisites || step.prerequisites.length === 0) return true;
  
  const allSteps = sections.flatMap(section => section.steps);
  return step.prerequisites.every(prereqId => {
    const prereqStep = allSteps.find(s => s.id === prereqId);
    return prereqStep?.isCompleted || false;
  });
};

export const getStepById = (stepId: string, sections: GuidanceSection[]): GuidanceStep | null => {
  for (const section of sections) {
    const step = section.steps.find(s => s.id === stepId);
    if (step) return step;
  }
  return null;
};

export const getSectionById = (sectionId: string, sections: GuidanceSection[]): GuidanceSection | null => {
  return sections.find(section => section.id === sectionId) || null;
};

export const completeStep = (
  stepId: string,
  sections: GuidanceSection[]
): GuidanceSection[] => {
  return sections.map(section => ({
    ...section,
    steps: section.steps.map(step =>
      step.id === stepId ? { ...step, isCompleted: true } : step
    ),
    completionRate: calculateSectionProgress({
      ...section,
      steps: section.steps.map(step =>
        step.id === stepId ? { ...step, isCompleted: true } : step
      )
    })
  }));
};

export const toggleSection = (
  sectionId: string,
  sections: GuidanceSection[]
): GuidanceSection[] => {
  return sections.map(section =>
    section.id === sectionId
      ? { ...section, isExpanded: !section.isExpanded }
      : section
  );
};

export const getCategoryIcon = (category: string): string => {
  const icons = {
    'getting-started': '🚀',
    'daily-practices': '🌱',
    'crisis-support': '🆘',
    'long-term-wellness': '🌟'
  };
  return icons[category as keyof typeof icons] || '📋';
};

export const getDifficultyColor = (difficulty: string): string => {
  const colors = {
    easy: 'text-green-600',
    medium: 'text-yellow-600',
    hard: 'text-red-600'
  };
  return colors[difficulty as keyof typeof colors] || 'text-gray-600';
};

export const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const getCompletionMessage = (progress: number): string => {
  if (progress === 100) return 'Congratulations! You\'ve completed all guidance steps.';
  if (progress >= 75) return 'You\'re doing great! Almost there.';
  if (progress >= 50) return 'Great progress! Keep going.';
  if (progress >= 25) return 'Good start! Continue with the next steps.';
  return 'Welcome! Let\'s begin your mental health journey.';
};

export const exportGuidanceProgress = (sections: GuidanceSection[]): string => {
  const exportData = {
    timestamp: new Date().toISOString(),
    overallProgress: calculateOverallProgress(sections),
    sections: sections.map(section => ({
      id: section.id,
      title: section.title,
      completionRate: section.completionRate,
      completedSteps: section.steps.filter(step => step.isCompleted).length,
      totalSteps: section.steps.length,
      steps: section.steps.map(step => ({
        id: step.id,
        title: step.title,
        isCompleted: step.isCompleted,
        category: step.category,
        difficulty: step.difficulty
      }))
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const validateGuidanceData = (sections: GuidanceSection[]): string[] => {
  const errors: string[] = [];
  
  // Check for duplicate section IDs
  const sectionIds = sections.map(s => s.id);
  const duplicateSectionIds = sectionIds.filter((id, index) => sectionIds.indexOf(id) !== index);
  if (duplicateSectionIds.length > 0) {
    errors.push(`Duplicate section IDs: ${duplicateSectionIds.join(', ')}`);
  }
  
  // Check for duplicate step IDs across all sections
  const allStepIds = sections.flatMap(s => s.steps.map(step => step.id));
  const duplicateStepIds = allStepIds.filter((id, index) => allStepIds.indexOf(id) !== index);
  if (duplicateStepIds.length > 0) {
    errors.push(`Duplicate step IDs: ${duplicateStepIds.join(', ')}`);
  }
  
  // Validate prerequisites
  const allSteps = sections.flatMap(s => s.steps);
  allSteps.forEach(step => {
    if (step.prerequisites) {
      step.prerequisites.forEach(prereqId => {
        if (!allSteps.find(s => s.id === prereqId)) {
          errors.push(`Step ${step.id} has invalid prerequisite: ${prereqId}`);
        }
      });
    }
  });
  
  return errors;
};

// Mock component for compatibility (since we can't use JSX)
export const GuidancePanel = {
  displayName: 'GuidancePanel',
  defaultProps: {
    sections: DEFAULT_GUIDANCE_SECTIONS,
    showProgress: true,
    allowSkipping: false,
    variant: 'default' as const
  },
  
  // Mock render function
  render: (props: GuidancePanelProps) => {
    const sections = props.sections || DEFAULT_GUIDANCE_SECTIONS;
    const overallProgress = calculateOverallProgress(sections);
    
    return {
      type: 'div',
      props: {
        className: `guidance-panel ${props.className || ''}`,
        children: [
          // Header
          {
            type: 'div',
            props: {
              className: 'guidance-header p-6 border-b',
              children: [
                {
                  type: 'h2',
                  props: {
                    className: 'text-2xl font-bold text-gray-900 mb-2',
                    children: 'Your Mental Health Guidance'
                  }
                },
                props.showProgress && {
                  type: 'div',
                  props: {
                    className: 'progress-section',
                    children: [
                      {
                        type: 'div',
                        props: {
                          className: 'flex justify-between items-center mb-2',
                          children: [
                            {
                              type: 'span',
                              props: {
                                className: 'text-sm text-gray-600',
                                children: 'Overall Progress'
                              }
                            },
                            {
                              type: 'span',
                              props: {
                                className: 'text-sm font-medium text-gray-900',
                                children: `${overallProgress}%`
                              }
                            }
                          ]
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          className: 'w-full bg-gray-200 rounded-full h-2',
                          children: {
                            type: 'div',
                            props: {
                              className: 'bg-blue-600 h-2 rounded-full transition-all duration-300',
                              style: { width: `${overallProgress}%` }
                            }
                          }
                        }
                      },
                      {
                        type: 'p',
                        props: {
                          className: 'text-sm text-gray-600 mt-2',
                          children: getCompletionMessage(overallProgress)
                        }
                      }
                    ]
                  }
                }
              ].filter(Boolean)
            }
          },
          // Sections
          {
            type: 'div',
            props: {
              className: 'guidance-sections',
              children: sections.map((section, index) => ({
                type: 'div',
                key: section.id,
                props: {
                  className: 'guidance-section border-b last:border-b-0',
                  children: [
                    // Section header
                    {
                      type: 'div',
                      props: {
                        className: 'section-header p-4 cursor-pointer hover:bg-gray-50',
                        onClick: () => console.log(`Toggle section: ${section.id}`),
                        children: [
                          {
                            type: 'div',
                            props: {
                              className: 'flex items-center justify-between',
                              children: [
                                {
                                  type: 'div',
                                  props: {
                                    className: 'flex items-center space-x-3',
                                    children: [
                                      {
                                        type: 'span',
                                        props: {
                                          className: 'text-2xl',
                                          children: section.icon || getCategoryIcon(section.category)
                                        }
                                      },
                                      {
                                        type: 'div',
                                        props: {
                                          children: [
                                            {
                                              type: 'h3',
                                              props: {
                                                className: 'font-semibold text-gray-900',
                                                children: section.title
                                              }
                                            },
                                            {
                                              type: 'p',
                                              props: {
                                                className: 'text-sm text-gray-600',
                                                children: section.description
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  type: 'div',
                                  props: {
                                    className: 'flex items-center space-x-2',
                                    children: [
                                      {
                                        type: 'span',
                                        props: {
                                          className: 'text-sm text-gray-500',
                                          children: `${section.completionRate}%`
                                        }
                                      },
                                      {
                                        type: 'span',
                                        props: {
                                          className: 'text-gray-400',
                                          children: section.isExpanded ? '▼' : '▶'
                                        }
                                      }
                                    ]
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    },
                    // Section steps (if expanded)
                    section.isExpanded && {
                      type: 'div',
                      props: {
                        className: 'section-steps bg-gray-50',
                        children: section.steps.map((step, stepIndex) => ({
                          type: 'div',
                          key: step.id,
                          props: {
                            className: `step-item p-4 border-l-4 ${
                              step.isCompleted ? 'border-green-500 bg-green-50' :
                              step.isRequired ? 'border-blue-500' : 'border-gray-300'
                            }`,
                            children: [
                              {
                                type: 'div',
                                props: {
                                  className: 'flex items-start justify-between',
                                  children: [
                                    {
                                      type: 'div',
                                      props: {
                                        className: 'flex-1',
                                        children: [
                                          {
                                            type: 'h4',
                                            props: {
                                              className: `font-medium ${step.isCompleted ? 'text-green-800' : 'text-gray-900'}`,
                                              children: step.title
                                            }
                                          },
                                          {
                                            type: 'p',
                                            props: {
                                              className: 'text-sm text-gray-600 mt-1',
                                              children: step.description
                                            }
                                          },
                                          {
                                            type: 'div',
                                            props: {
                                              className: 'flex items-center space-x-4 mt-2 text-xs text-gray-500',
                                              children: [
                                                step.estimatedTime && {
                                                  type: 'span',
                                                  props: {
                                                    children: `⏱️ ${formatEstimatedTime(step.estimatedTime)}`
                                                  }
                                                },
                                                step.difficulty && {
                                                  type: 'span',
                                                  props: {
                                                    className: getDifficultyColor(step.difficulty),
                                                    children: `📊 ${step.difficulty}`
                                                  }
                                                },
                                                step.isRequired && {
                                                  type: 'span',
                                                  props: {
                                                    className: 'text-red-600',
                                                    children: '* Required'
                                                  }
                                                }
                                              ].filter(Boolean)
                                            }
                                          }
                                        ]
                                      }
                                    },
                                    {
                                      type: 'div',
                                      props: {
                                        className: 'ml-4',
                                        children: {
                                          type: 'button',
                                          props: {
                                            onClick: () => console.log(`${step.isCompleted ? 'View' : 'Start'} step: ${step.id}`),
                                            className: `px-4 py-2 text-sm font-medium rounded-md ${
                                              step.isCompleted
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`,
                                            disabled: !arePrerequisitesMet(step, sections),
                                            children: step.isCompleted ? '✓ Completed' : 'Start'
                                          }
                                        }
                                      }
                                    }
                                  ]
                                }
                              }
                            ]
                          }
                        }))
                      }
                    }
                  ].filter(Boolean)
                }
              }))
            }
          }
        ]
      }
    };
  }
};

export default GuidancePanel;










