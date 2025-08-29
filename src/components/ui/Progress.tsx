/**
 * Mental Health Platform - Advanced Progress Components
 *
 * Comprehensive progress visualization components with mental health specializations,
 * therapeutic milestone tracking, mood progress visualization, goal achievement
 * monitoring, and accessibility-optimized progress indicators designed
 * specifically for mental health applications.
 *
 * Features:
 * - Therapeutic progress tracking with milestone visualization
 * - Mental health goal achievement monitoring
 * - Mood pattern progress with trend analysis
 * - Crisis intervention progress indicators
 * - Treatment plan advancement tracking
 * - Wellness journey visualization
 * - ARIA-compliant accessibility features
 * - Cultural sensitivity in progress representation
 * - Motivational progress feedback
 * - Recovery milestone celebration
 *
 * @version 2.0.0 - Mental Health Specialized
 * @accessibility Full ARIA support with screen reader optimizations
 * @therapeutic Designed for mental health progress visualization
 * @motivational Progress tracking with positive reinforcement
 */

import * as React from 'react';

// Mental Health Progress Types
export type MentalHealthProgressStatus = 
  | 'not-started' | 'in-progress' | 'completed' | 'paused' 
  | 'cancelled' | 'needs-support' | 'breakthrough' | 'setback';

export type MentalHealthProgressCategory = 
  | 'therapy-session' | 'mood-tracking' | 'goal-achievement' | 'skill-building'
  | 'medication-adherence' | 'crisis-recovery' | 'wellness-routine' 
  | 'social-connection' | 'self-care' | 'mindfulness-practice';

export type MentalHealthProgressLevel = 
  | 'beginner' | 'developing' | 'practicing' | 'proficient' | 'mastery';

export interface MentalHealthProgressStep {
  id: string;
  title: string;
  description?: string;
  status: MentalHealthProgressStatus;
  category: MentalHealthProgressCategory;
  progress?: number;
  startTime?: Date;
  endTime?: Date;
  supportNeeded?: boolean;
  celebrationMoment?: boolean;
  therapeuticNotes?: string;
  milestones?: MentalHealthProgressMilestone[];
  culturalContext?: string[];
  accessibilityNotes?: string;
}

export interface MentalHealthProgressMilestone {
  id: string;
  title: string;
  description?: string;
  threshold: number;
  achieved: boolean;
  achievedDate?: Date;
  celebrationMessage?: string;
  therapeuticSignificance?: string;
}

export interface MentalHealthProgressTheme {
  primaryColor: string;
  successColor: string;
  warningColor: string;
  supportColor: string;
  breakthroughColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontFamily: string;
}

export interface MentalHealthProgressOptions {
  theme?: Partial<MentalHealthProgressTheme>;
  showEncouragement?: boolean;
  enableCelebrations?: boolean;
  culturalAdaptation?: boolean;
  accessibilityLevel?: 'basic' | 'enhanced' | 'comprehensive';
  motivationalMessages?: boolean;
  progressSound?: boolean;
  hapticsEnabled?: boolean;
}

// Basic Progress Bar for Mental Health Applications
export interface MentalHealthProgressBarProps {
  value: number;
  max?: number;
  category: MentalHealthProgressCategory;
  level?: MentalHealthProgressLevel;
  className?: string;
  showPercentage?: boolean;
  showEncouragement?: boolean;
  animated?: boolean;
  therapeuticContext?: string;
  onMilestoneReached?: (milestone: number) => void;
  onComplete?: () => void;
  options?: MentalHealthProgressOptions;
}

export const MentalHealthProgressBar: React.FC<MentalHealthProgressBarProps> = ({
  value,
  max = 100,
  category,
  level = 'practicing',
  className = '',
  showPercentage = true,
  showEncouragement = true,
  animated = true,
  therapeuticContext,
  onMilestoneReached,
  onComplete,
  options = {}
}) => {
  const {
    theme = {},
    showEncouragement: showEncouragementOption = true,
    enableCelebrations = true,
    motivationalMessages = true
  } = options;

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const [prevPercentage, setPrevPercentage] = React.useState(0);
  const [showCelebration, setShowCelebration] = React.useState(false);

  // Default mental health theme
  const defaultTheme: MentalHealthProgressTheme = {
    primaryColor: '#3B82F6',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    supportColor: '#8B5CF6',
    breakthroughColor: '#EC4899',
    backgroundColor: '#F3F4F6',
    textColor: '#1F2937',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui, sans-serif'
  };

  const appliedTheme = { ...defaultTheme, ...theme };

  // Get category-specific color and messaging
  const getCategoryColor = (): string => {
    switch (category) {
      case 'therapy-session':
        return appliedTheme.primaryColor;
      case 'mood-tracking':
        return appliedTheme.successColor;
      case 'crisis-recovery':
        return appliedTheme.supportColor;
      case 'goal-achievement':
        return appliedTheme.breakthroughColor;
      case 'wellness-routine':
        return appliedTheme.successColor;
      default:
        return appliedTheme.primaryColor;
    }
  };

  const getEncouragementMessage = (): string => {
    if (!showEncouragement && !showEncouragementOption || !motivationalMessages) return '';

    const messages = {
      'therapy-session': [
        'Every session is progress! 🌱',
        'You\'re building valuable skills',
        'Proud of your commitment to healing',
        'Each step forward matters'
      ],
      'mood-tracking': [
        'Great job tracking your feelings! 📊',
        'Self-awareness is healing',
        'Your patterns are becoming clearer',
        'Mindful progress every day'
      ],
      'goal-achievement': [
        'You\'re making it happen! 🎯',
        'Steady progress toward your goals',
        'Celebrating your achievements',
        'Every step counts toward success'
      ],
      'crisis-recovery': [
        'You\'re incredibly strong 💪',
        'Recovery is a journey, not a race',
        'Proud of your resilience',
        'You\'re not alone in this'
      ],
      'wellness-routine': [
        'Building healthy habits! 🌟',
        'Consistency creates transformation',
        'Your well-being matters',
        'Small steps, big changes'
      ]
    };

    const categoryMessages = messages[category] || messages['goal-achievement'];
    const messageIndex = Math.floor(percentage / 25); // Different messages per quarter
    return categoryMessages[Math.min(messageIndex, categoryMessages.length - 1)];
  };

  const getLevelIndicator = (): string => {
    const levelEmojis = {
      'beginner': '🌱',
      'developing': '🌿',
      'practicing': '🌳',
      'proficient': '🏆',
      'mastery': '✨'
    };
    return levelEmojis[level] || '🌱';
  };

  // Handle milestone reached
  React.useEffect(() => {
    const milestones = [25, 50, 75, 100];
    const reachedMilestone = milestones.find(
      milestone => prevPercentage < milestone && percentage >= milestone
    );

    if (reachedMilestone && onMilestoneReached) {
      onMilestoneReached(reachedMilestone);
      
      if (enableCelebrations) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }

    if (percentage === 100 && prevPercentage < 100 && onComplete) {
      onComplete();
    }

    setPrevPercentage(percentage);
  }, [percentage, prevPercentage, onMilestoneReached, onComplete, enableCelebrations]);

  const progressBarStyles: React.CSSProperties = {
    width: '100%',
    height: '20px',
    backgroundColor: appliedTheme.backgroundColor,
    borderRadius: `${appliedTheme.borderRadius}px`,
    overflow: 'hidden',
    position: 'relative',
    fontFamily: appliedTheme.fontFamily
  };

  const progressFillStyles: React.CSSProperties = {
    height: '100%',
    width: `${percentage}%`,
    backgroundColor: getCategoryColor(),
    transition: animated ? 'width 0.5s ease-in-out' : 'none',
    borderRadius: `${appliedTheme.borderRadius}px`,
    position: 'relative',
    overflow: 'hidden'
  };

  const progressTextStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: appliedTheme.textColor,
    fontSize: '12px',
    fontWeight: 'bold',
    zIndex: 10
  };

  const celebrationStyles: React.CSSProperties = {
    position: 'absolute',
    top: '-10px',
    right: '10px',
    background: appliedTheme.breakthroughColor,
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    transform: showCelebration ? 'scale(1)' : 'scale(0)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 20
  };

  return React.createElement('div', {
    className: `mental-health-progress-bar ${className}`,
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-label': `${category} progress: ${percentage.toFixed(1)}%`,
    style: { position: 'relative', marginBottom: '16px' }
  }, [
    // Category and level header
    React.createElement('div', {
      key: 'header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        fontSize: '14px',
        color: appliedTheme.textColor
      }
    }, [
      React.createElement('span', {
        key: 'category',
        style: { fontWeight: 'bold' }
      }, `${getLevelIndicator()} ${category.replace('-', ' ').toUpperCase()}`),
      showPercentage && React.createElement('span', {
        key: 'percentage',
        style: { fontSize: '12px' }
      }, `${percentage.toFixed(1)}%`)
    ]),

    // Progress bar
    React.createElement('div', {
      key: 'progress-bar',
      style: progressBarStyles
    }, [
      React.createElement('div', {
        key: 'progress-fill',
        style: progressFillStyles
      }),
      showPercentage && React.createElement('div', {
        key: 'progress-text',
        style: progressTextStyles
      }, `${percentage.toFixed(0)}%`)
    ]),

    // Celebration indicator
    showCelebration && React.createElement('div', {
      key: 'celebration',
      style: celebrationStyles
    }, '🎉 Milestone!'),

    // Encouragement message
    (showEncouragement && showEncouragementOption && motivationalMessages) && 
    React.createElement('div', {
      key: 'encouragement',
      style: {
        marginTop: '8px',
        fontSize: '12px',
        color: getCategoryColor(),
        fontStyle: 'italic',
        textAlign: 'center'
      }
    }, getEncouragementMessage()),

    // Therapeutic context
    therapeuticContext && React.createElement('div', {
      key: 'therapeutic-context',
      style: {
        marginTop: '4px',
        fontSize: '11px',
        color: appliedTheme.textColor,
        opacity: 0.7
      }
    }, therapeuticContext)
  ]);
};

// Mental Health Stepper Component
export interface MentalHealthStepperProps {
  steps: MentalHealthProgressStep[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  showProgress?: boolean;
  therapeuticGuidance?: boolean;
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
  className?: string;
  options?: MentalHealthProgressOptions;
}

export const MentalHealthStepper: React.FC<MentalHealthStepperProps> = ({
  steps,
  currentStep,
  orientation = 'vertical',
  showProgress = true,
  therapeuticGuidance = true,
  onStepChange,
  onComplete,
  className = '',
  options = {}
}) => {
  const { theme = {} } = options;
  const defaultTheme: MentalHealthProgressTheme = {
    primaryColor: '#3B82F6',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    supportColor: '#8B5CF6',
    breakthroughColor: '#EC4899',
    backgroundColor: '#F3F4F6',
    textColor: '#1F2937',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui, sans-serif'
  };

  const appliedTheme = { ...defaultTheme, ...theme };

  const getStatusIcon = (status: MentalHealthProgressStatus): string => {
    const icons = {
      'not-started': '⚪',
      'in-progress': '🔵',
      'completed': '✅',
      'paused': '⏸️',
      'cancelled': '❌',
      'needs-support': '🤝',
      'breakthrough': '🌟',
      'setback': '🔄'
    };
    return icons[status] || '⚪';
  };

  const getStatusColor = (status: MentalHealthProgressStatus): string => {
    const colors = {
      'not-started': '#9CA3AF',
      'in-progress': appliedTheme.primaryColor,
      'completed': appliedTheme.successColor,
      'paused': appliedTheme.warningColor,
      'cancelled': '#EF4444',
      'needs-support': appliedTheme.supportColor,
      'breakthrough': appliedTheme.breakthroughColor,
      'setback': appliedTheme.warningColor
    };
    return colors[status] || '#9CA3AF';
  };

  const renderStep = (step: MentalHealthProgressStep, index: number): React.ReactElement => {
    const isActive = index === currentStep;
    const isCompleted = step.status === 'completed';
    const needsSupport = step.status === 'needs-support';

    const stepStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: orientation === 'horizontal' ? 'center' : 'flex-start',
      marginBottom: orientation === 'vertical' ? '24px' : '0',
      marginRight: orientation === 'horizontal' ? '24px' : '0',
      position: 'relative',
      cursor: onStepChange ? 'pointer' : 'default'
    };

    const iconStyles: React.CSSProperties = {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: getStatusColor(step.status),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      marginRight: orientation === 'horizontal' ? '12px' : '16px',
      flexShrink: 0,
      border: isActive ? `3px solid ${appliedTheme.primaryColor}` : 'none'
    };

    const contentStyles: React.CSSProperties = {
      flex: 1,
      minWidth: 0
    };

    const titleStyles: React.CSSProperties = {
      fontWeight: 'bold',
      fontSize: '16px',
      color: appliedTheme.textColor,
      marginBottom: '4px'
    };

    const descriptionStyles: React.CSSProperties = {
      fontSize: '14px',
      color: appliedTheme.textColor,
      opacity: 0.7,
      marginBottom: '8px'
    };

    const metaStyles: React.CSSProperties = {
      fontSize: '12px',
      color: appliedTheme.textColor,
      opacity: 0.6
    };

    return React.createElement('div', {
      key: step.id,
      style: stepStyles,
      onClick: onStepChange ? () => onStepChange(index) : undefined,
      role: 'button',
      tabIndex: onStepChange ? 0 : -1,
      'aria-label': `Step ${index + 1}: ${step.title}. Status: ${step.status}`
    }, [
      // Step icon
      React.createElement('div', {
        key: 'icon',
        style: iconStyles
      }, getStatusIcon(step.status)),

      // Step content
      React.createElement('div', {
        key: 'content',
        style: contentStyles
      }, [
        React.createElement('div', {
          key: 'title',
          style: titleStyles
        }, step.title),

        step.description && React.createElement('div', {
          key: 'description',
          style: descriptionStyles
        }, step.description),

        showProgress && step.progress !== undefined && React.createElement('div', {
          key: 'progress',
          style: { marginBottom: '8px' }
        }, [
          React.createElement(MentalHealthProgressBar, {
            key: 'progress-bar',
            value: step.progress,
            category: step.category,
            showPercentage: false,
            showEncouragement: false,
            animated: true,
            options: { theme: appliedTheme }
          })
        ]),

        // Support needed indicator
        needsSupport && therapeuticGuidance && React.createElement('div', {
          key: 'support',
          style: {
            backgroundColor: appliedTheme.supportColor,
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            marginBottom: '8px',
            display: 'inline-block'
          }
        }, '🤝 Support Available'),

        // Celebration for breakthroughs
        step.celebrationMoment && React.createElement('div', {
          key: 'celebration',
          style: {
            backgroundColor: appliedTheme.breakthroughColor,
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            marginBottom: '8px',
            display: 'inline-block'
          }
        }, '🎉 Breakthrough Moment!'),

        // Step metadata
        React.createElement('div', {
          key: 'meta',
          style: metaStyles
        }, [
          step.startTime && React.createElement('span', {
            key: 'start-time'
          }, `Started: ${step.startTime.toLocaleDateString()}`),
          
          step.endTime && React.createElement('span', {
            key: 'end-time',
            style: { marginLeft: '12px' }
          }, `Completed: ${step.endTime.toLocaleDateString()}`)
        ])
      ]),

      // Connection line for vertical orientation
      orientation === 'vertical' && index < steps.length - 1 && React.createElement('div', {
        key: 'connector',
        style: {
          position: 'absolute',
          left: '19px',
          top: '40px',
          width: '2px',
          height: '24px',
          backgroundColor: appliedTheme.backgroundColor,
          zIndex: 1
        }
      })
    ]);
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    padding: '16px',
    fontFamily: appliedTheme.fontFamily
  };

  // Handle completion
  React.useEffect(() => {
    const allCompleted = steps.every(step => step.status === 'completed');
    if (allCompleted && onComplete) {
      onComplete();
    }
  }, [steps, onComplete]);

  return React.createElement('div', {
    className: `mental-health-stepper ${className}`,
    style: containerStyles,
    role: 'progressbar',
    'aria-label': `Mental health progress: ${currentStep + 1} of ${steps.length} steps`
  }, steps.map(renderStep));
};

// Mood Progress Visualization
export interface MentalHealthMoodProgressProps {
  currentMood: number;
  averageMood: number;
  streak: number;
  goalMood?: number;
  moodHistory?: Array<{ date: Date; mood: number }>;
  showTrend?: boolean;
  className?: string;
  options?: MentalHealthProgressOptions;
}

export const MentalHealthMoodProgress: React.FC<MentalHealthMoodProgressProps> = ({
  currentMood,
  averageMood,
  streak,
  goalMood,
  moodHistory = [],
  showTrend = true,
  className = '',
  options = {}
}) => {
  const { theme = {}, motivationalMessages = true } = options;
  const defaultTheme: MentalHealthProgressTheme = {
    primaryColor: '#3B82F6',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    supportColor: '#8B5CF6',
    breakthroughColor: '#EC4899',
    backgroundColor: '#F3F4F6',
    textColor: '#1F2937',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui, sans-serif'
  };

  const appliedTheme = { ...defaultTheme, ...theme };

  const getMoodEmoji = (mood: number): string => {
    if (mood >= 8) return '😊';
    if (mood >= 6) return '🙂';
    if (mood >= 4) return '😐';
    if (mood >= 2) return '😔';
    return '😞';
  };

  const getMoodColor = (mood: number): string => {
    if (mood >= 7) return appliedTheme.successColor;
    if (mood >= 5) return appliedTheme.primaryColor;
    if (mood >= 3) return appliedTheme.warningColor;
    return appliedTheme.supportColor;
  };

  const getTrendMessage = (): string => {
    if (!motivationalMessages) return '';
    
    if (currentMood > averageMood) {
      return '📈 Your mood is above average today!';
    } else if (currentMood === averageMood) {
      return '📊 You\'re maintaining your baseline mood';
    } else {
      return '💙 Remember, every day is different - be kind to yourself';
    }
  };

  const containerStyles: React.CSSProperties = {
    padding: '20px',
    borderRadius: `${appliedTheme.borderRadius}px`,
    backgroundColor: 'white',
    border: `1px solid ${appliedTheme.backgroundColor}`,
    fontFamily: appliedTheme.fontFamily
  };

  const moodDisplayStyles: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '20px'
  };

  const statsStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
    marginTop: '16px'
  };

  const statItemStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: '12px',
    borderRadius: `${appliedTheme.borderRadius}px`,
    backgroundColor: appliedTheme.backgroundColor
  };

  return React.createElement('div', {
    className: `mental-health-mood-progress ${className}`,
    style: containerStyles
  }, [
    React.createElement('h3', {
      key: 'title',
      style: {
        textAlign: 'center',
        marginBottom: '20px',
        color: appliedTheme.textColor
      }
    }, '🎭 Mood Progress'),

    // Current mood display
    React.createElement('div', {
      key: 'current-mood',
      style: moodDisplayStyles
    }, [
      React.createElement('div', {
        key: 'mood-emoji',
        style: { fontSize: '48px', marginBottom: '8px' }
      }, getMoodEmoji(currentMood)),
      
      React.createElement('div', {
        key: 'mood-value',
        style: {
          fontSize: '24px',
          fontWeight: 'bold',
          color: getMoodColor(currentMood)
        }
      }, `${currentMood}/10`),
      
      React.createElement('div', {
        key: 'mood-label',
        style: {
          fontSize: '14px',
          color: appliedTheme.textColor,
          opacity: 0.7
        }
      }, 'Current Mood')
    ]),

    // Mood progress bar
    React.createElement(MentalHealthProgressBar, {
      key: 'mood-progress-bar',
      value: currentMood,
      max: 10,
      category: 'mood-tracking',
      showPercentage: false,
      showEncouragement: true,
      animated: true,
      therapeuticContext: `Tracking for ${moodHistory.length} days`,
      options: { theme: appliedTheme }
    }),

    // Stats grid
    React.createElement('div', {
      key: 'stats',
      style: statsStyles
    }, [
      // Average mood
      React.createElement('div', {
        key: 'average',
        style: statItemStyles
      }, [
        React.createElement('div', {
          key: 'avg-value',
          style: {
            fontSize: '20px',
            fontWeight: 'bold',
            color: getMoodColor(averageMood)
          }
        }, `${averageMood.toFixed(1)}/10`),
        React.createElement('div', {
          key: 'avg-label',
          style: {
            fontSize: '12px',
            color: appliedTheme.textColor,
            opacity: 0.7
          }
        }, 'Average Mood')
      ]),

      // Streak
      React.createElement('div', {
        key: 'streak',
        style: statItemStyles
      }, [
        React.createElement('div', {
          key: 'streak-value',
          style: {
            fontSize: '20px',
            fontWeight: 'bold',
            color: appliedTheme.breakthroughColor
          }
        }, `${streak} days`),
        React.createElement('div', {
          key: 'streak-label',
          style: {
            fontSize: '12px',
            color: appliedTheme.textColor,
            opacity: 0.7
          }
        }, 'Tracking Streak')
      ]),

      // Goal progress (if goal is set)
      goalMood && React.createElement('div', {
        key: 'goal',
        style: statItemStyles
      }, [
        React.createElement('div', {
          key: 'goal-value',
          style: {
            fontSize: '20px',
            fontWeight: 'bold',
            color: currentMood >= goalMood ? appliedTheme.successColor : appliedTheme.primaryColor
          }
        }, currentMood >= goalMood ? '🎯 Achieved!' : `${goalMood}/10`),
        React.createElement('div', {
          key: 'goal-label',
          style: {
            fontSize: '12px',
            color: appliedTheme.textColor,
            opacity: 0.7
          }
        }, 'Mood Goal')
      ])
    ]),

    // Trend message
    showTrend && motivationalMessages && React.createElement('div', {
      key: 'trend',
      style: {
        textAlign: 'center',
        marginTop: '16px',
        padding: '12px',
        borderRadius: `${appliedTheme.borderRadius}px`,
        backgroundColor: appliedTheme.backgroundColor,
        fontSize: '14px',
        color: appliedTheme.textColor
      }
    }, getTrendMessage())
  ]);
};

// Mental Health Goal Progress Component
export interface MentalHealthGoalProgressProps {
  title: string;
  description?: string;
  progress: number;
  target: number;
  unit?: string;
  category: MentalHealthProgressCategory;
  milestones?: MentalHealthProgressMilestone[];
  startDate?: Date;
  targetDate?: Date;
  className?: string;
  onMilestoneAchieved?: (milestone: MentalHealthProgressMilestone) => void;
  options?: MentalHealthProgressOptions;
}

export const MentalHealthGoalProgress: React.FC<MentalHealthGoalProgressProps> = ({
  title,
  description,
  progress,
  target,
  unit = 'points',
  category,
  milestones = [],
  startDate,
  targetDate,
  className = '',
  onMilestoneAchieved,
  options = {}
}) => {
  const { theme = {}, enableCelebrations = true } = options;
  const defaultTheme: MentalHealthProgressTheme = {
    primaryColor: '#3B82F6',
    successColor: '#10B981',
    warningColor: '#F59E0B',
    supportColor: '#8B5CF6',
    breakthroughColor: '#EC4899',
    backgroundColor: '#F3F4F6',
    textColor: '#1F2937',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui, sans-serif'
  };

  const appliedTheme = { ...defaultTheme, ...theme };
  const percentage = Math.min((progress / target) * 100, 100);
  const isCompleted = progress >= target;

  // Check for newly achieved milestones
  React.useEffect(() => {
    milestones.forEach(milestone => {
      if (!milestone.achieved && progress >= milestone.threshold) {
        milestone.achieved = true;
        milestone.achievedDate = new Date();
        
        if (onMilestoneAchieved && enableCelebrations) {
          onMilestoneAchieved(milestone);
        }
      }
    });
  }, [progress, milestones, onMilestoneAchieved, enableCelebrations]);

  const containerStyles: React.CSSProperties = {
    padding: '20px',
    borderRadius: `${appliedTheme.borderRadius}px`,
    backgroundColor: 'white',
    border: `1px solid ${appliedTheme.backgroundColor}`,
    fontFamily: appliedTheme.fontFamily
  };

  const headerStyles: React.CSSProperties = {
    marginBottom: '16px'
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: appliedTheme.textColor,
    marginBottom: '4px'
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: '14px',
    color: appliedTheme.textColor,
    opacity: 0.7,
    marginBottom: '8px'
  };

  const progressStatsStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    color: appliedTheme.textColor,
    marginBottom: '16px'
  };

  return React.createElement('div', {
    className: `mental-health-goal-progress ${className}`,
    style: containerStyles
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      style: headerStyles
    }, [
      React.createElement('h3', {
        key: 'title',
        style: titleStyles
      }, `${isCompleted ? '🎉' : '🎯'} ${title}`),
      
      description && React.createElement('p', {
        key: 'description',
        style: descriptionStyles
      }, description)
    ]),

    // Progress stats
    React.createElement('div', {
      key: 'stats',
      style: progressStatsStyles
    }, [
      React.createElement('span', {
        key: 'progress'
      }, `${progress} / ${target} ${unit}`),
      
      React.createElement('span', {
        key: 'percentage',
        style: { fontWeight: 'bold' }
      }, `${percentage.toFixed(1)}%`)
    ]),

    // Progress bar
    React.createElement(MentalHealthProgressBar, {
      key: 'progress-bar',
      value: progress,
      max: target,
      category,
      showPercentage: false,
      showEncouragement: true,
      animated: true,
      therapeuticContext: `Goal: ${category.replace('-', ' ')}`,
      options: { theme: appliedTheme }
    }),

    // Milestones
    milestones.length > 0 && React.createElement('div', {
      key: 'milestones',
      style: { marginTop: '16px' }
    }, [
      React.createElement('h4', {
        key: 'milestones-title',
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: appliedTheme.textColor,
          marginBottom: '8px'
        }
      }, '🏃‍♀️ Milestones'),
      
      ...milestones.map(milestone => 
        React.createElement('div', {
          key: milestone.id,
          style: {
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: `${appliedTheme.borderRadius}px`,
            backgroundColor: milestone.achieved ? appliedTheme.successColor + '20' : appliedTheme.backgroundColor,
            marginBottom: '4px'
          }
        }, [
          React.createElement('span', {
            key: 'milestone-icon',
            style: { marginRight: '8px' }
          }, milestone.achieved ? '✅' : '⭕'),
          
          React.createElement('span', {
            key: 'milestone-title',
            style: {
              flex: 1,
              fontSize: '12px',
              color: appliedTheme.textColor,
              textDecoration: milestone.achieved ? 'line-through' : 'none'
            }
          }, `${milestone.title} (${milestone.threshold} ${unit})`),
          
          milestone.achieved && milestone.achievedDate && React.createElement('span', {
            key: 'achieved-date',
            style: {
              fontSize: '10px',
              color: appliedTheme.successColor,
              fontWeight: 'bold'
            }
          }, milestone.achievedDate.toLocaleDateString())
        ])
      )
    ]),

    // Timeline info
    (startDate || targetDate) && React.createElement('div', {
      key: 'timeline',
      style: {
        marginTop: '16px',
        padding: '12px',
        borderRadius: `${appliedTheme.borderRadius}px`,
        backgroundColor: appliedTheme.backgroundColor,
        fontSize: '12px',
        color: appliedTheme.textColor
      }
    }, [
      startDate && React.createElement('div', {
        key: 'start-date'
      }, `📅 Started: ${startDate.toLocaleDateString()}`),
      
      targetDate && React.createElement('div', {
        key: 'target-date'
      }, `🎯 Target: ${targetDate.toLocaleDateString()}`)
    ])
  ]);
};

// Export all components
export default {
  MentalHealthProgressBar,
  MentalHealthStepper,
  MentalHealthMoodProgress,
  MentalHealthGoalProgress
};