/**
 * Enhanced Feedback Hook for Mental Health Platform
 * 
 * Comprehensive feedback collection and management system with
 * crisis prioritization, satisfaction tracking, and store integration.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGlobalStore } from '../stores/globalStore';

// Types for feedback management
export type FeedbackType = 'bug' | 'feature' | 'general' | 'crisis' | 'satisfaction' | 'therapeutic' | 'accessibility';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed' | 'escalated';
export type SatisfactionLevel = 1 | 2 | 3 | 4 | 5;

export interface FeedbackOptions {
  type: FeedbackType;
  message: string;
  description?: string;
  category?: string;
  priority?: FeedbackPriority;
  anonymous?: boolean;
  attachments?: File[];
  metadata?: Record<string, any>;
  contactMe?: boolean;
  duration?: number;
}

export interface FeedbackSubmission {
  id: string;
  type: FeedbackType;
  message: string;
  description?: string;
  rating?: SatisfactionLevel;
  category?: string;
  priority: FeedbackPriority;
  anonymous: boolean;
  userId?: string;
  userEmail?: string;
  timestamp: number;
  status: FeedbackStatus;
  tags?: string[];
  attachments?: string[];
  metadata?: Record<string, any>;
  response?: {
    message: string;
    respondedBy: string;
    timestamp: number;
  };
  followUp?: {
    requested: boolean;
    completed: boolean;
    notes?: string;
  };
}

export interface SatisfactionSurvey {
  id: string;
  questions: Array<{
    id: string;
    question: string;
    type: 'rating' | 'text' | 'multiple-choice' | 'yes-no';
    required?: boolean;
    options?: string[];
    answer?: any;
  }>;
  completedAt?: number;
  triggeredBy?: string;
}

export interface FeedbackPrompt {
  id: string;
  type: 'inline' | 'modal' | 'toast' | 'widget';
  message: string;
  trigger: 'time' | 'action' | 'error' | 'success' | 'crisis';
  options?: string[];
  showAfter?: number; // milliseconds
  priority?: FeedbackPriority;
}

export interface FeedbackAnalytics {
  total: number;
  pending: number;
  resolved: number;
  avgRating: number;
  satisfactionTrend: 'improving' | 'stable' | 'declining';
  topCategories: Array<{ category: string; count: number }>;
  responseTime: number; // average in hours
  crisisCount: number;
}

export interface FeedbackState {
  submissions: FeedbackSubmission[];
  activeSurvey?: SatisfactionSurvey;
  activePrompt?: FeedbackPrompt;
  isVisible: boolean;
  isSubmitting: boolean;
  lastSubmitted?: number;
  analytics: FeedbackAnalytics;
  error: string | null;
  successMessage?: string;
}

// Default analytics
const defaultAnalytics: FeedbackAnalytics = {
  total: 0,
  pending: 0,
  resolved: 0,
  avgRating: 0,
  satisfactionTrend: 'stable',
  topCategories: [],
  responseTime: 0,
  crisisCount: 0
};

export const useFeedback = () => {
  // Global store integration
  const {
    user,
    feedbackState: globalFeedback,
    submitFeedback: submitToStore,
    updateFeedbackStatus,
    respondToFeedback,
    updateSatisfaction,
    setActivePrompt,
    dismissActivePrompt,
    getFeedbackAnalytics,
    addNotification,
    crisisState,
    addDebugLog
  } = useGlobalStore();

  const [state, setState] = useState<FeedbackState>({
    submissions: [],
    isVisible: false,
    isSubmitting: false,
    analytics: defaultAnalytics,
    error: null
  });

  // Refs for feedback management
  const feedbackFormRef = useRef<HTMLFormElement | null>(null);
  const feedbackWidgetRef = useRef<HTMLDivElement | null>(null);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const surveyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize feedback system
  useEffect(() => {
    initializeFeedback();
    return () => cleanupFeedback();
  }, []);

  // Sync with global store
  useEffect(() => {
    if (globalFeedback.submissions) {
      setState(prev => ({
        ...prev,
        submissions: globalFeedback.submissions,
        analytics: getFeedbackAnalytics()
      }));
    }
  }, [globalFeedback.submissions, getFeedbackAnalytics]);

  // Monitor crisis state for priority feedback
  useEffect(() => {
    if (crisisState.isActive && crisisState.level !== 'none') {
      // Show crisis feedback prompt after crisis resolves
      const timeout = setTimeout(() => {
        showCrisisFeedbackPrompt();
      }, 5 * 60 * 1000); // 5 minutes after crisis

      return () => clearTimeout(timeout);
    }
  }, [crisisState]);

  // Initialize feedback system
  const initializeFeedback = useCallback(async () => {
    try {
      // Load previous submissions from storage
      await loadFeedbackHistory();
      
      // Setup feedback widget
      setupFeedbackWidget();
      
      // Initialize prompt system
      initializePromptSystem();
      
      // Setup keyboard shortcuts
      setupKeyboardShortcuts();
      
      // Load satisfaction data
      loadSatisfactionData();
      
      // Update analytics
      updateAnalytics();
      
      addDebugLog('info', 'feedback', 'Feedback system initialized');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize feedback system'
      }));
      console.error('Feedback initialization error:', error);
    }
  }, [addDebugLog]);

  // Submit feedback with validation and processing
  const showFeedback = useCallback(async (options: FeedbackOptions) => {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Validate feedback
      if (!options.message || options.message.trim().length < 3) {
        throw new Error('Feedback message is too short');
      }

      // Determine priority based on type and content
      const priority = determinePriority(options);
      
      // Check for crisis keywords
      const isCrisis = detectCrisisContent(options.message);
      if (isCrisis) {
        options.type = 'crisis';
        options.priority = 'critical';
      }

      // Prepare submission
      const submission: Omit<FeedbackSubmission, 'id' | 'timestamp' | 'status'> = {
        type: options.type,
        message: options.message,
        description: options.description,
        category: options.category || categorizeAutomatically(options),
        priority: options.priority || priority,
        anonymous: options.anonymous ?? !user,
        userId: options.anonymous ? undefined : user?.id,
        userEmail: options.anonymous ? undefined : user?.email,
        tags: extractTags(options.message),
        metadata: {
          ...options.metadata,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          url: window.location.href,
          sessionId: getSessionId()
        },
        followUp: {
          requested: options.contactMe ?? false,
          completed: false
        }
      };

      // Submit to store
      const feedbackId = submitToStore(submission);
      
      // Handle crisis feedback immediately
      if (options.type === 'crisis' || priority === 'critical') {
        await handleCrisisFeedback(feedbackId, submission);
      }

      // Upload attachments if any
      if (options.attachments && options.attachments.length > 0) {
        await uploadAttachments(feedbackId, options.attachments);
      }

      // Update local state
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        lastSubmitted: Date.now(),
        successMessage: getCultureAppropriateSuccessMessage(options.type),
        error: null
      }));

      // Show success notification
      addNotification({
        type: 'success',
        title: 'Feedback Received',
        message: options.type === 'crisis' 
          ? 'Your urgent feedback has been prioritized. We will respond as soon as possible.'
          : 'Thank you for your feedback. We appreciate your input!'
      });

      // Auto-hide after duration (default 5 seconds)
      const duration = options.duration || 5000;
      setTimeout(() => {
        hideFeedback();
      }, duration);

      // Update analytics
      updateAnalytics();
      
      // Log feedback submission
      addDebugLog('info', 'feedback', `Feedback submitted: ${feedbackId}`, {
        type: options.type,
        priority,
        anonymous: options.anonymous
      });

      return feedbackId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage
      }));
      
      addNotification({
        type: 'error',
        title: 'Feedback Error',
        message: errorMessage
      });
      
      addDebugLog('error', 'feedback', 'Failed to submit feedback', { error: errorMessage });
      
      return null;
    }
  }, [user, submitToStore, addNotification, addDebugLog]);

  // Hide feedback UI
  const hideFeedback = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false,
      successMessage: undefined
    }));
  }, []);

  // Show satisfaction survey
  const showSatisfactionSurvey = useCallback((
    trigger?: string,
    customQuestions?: SatisfactionSurvey['questions']
  ) => {
    const defaultQuestions: SatisfactionSurvey['questions'] = [
      {
        id: 'overall',
        question: 'How satisfied are you with our mental health support platform?',
        type: 'rating',
        required: true
      },
      {
        id: 'helpful',
        question: 'How helpful have you found our resources?',
        type: 'rating',
        required: true
      },
      {
        id: 'recommend',
        question: 'Would you recommend our platform to others?',
        type: 'yes-no',
        required: true
      },
      {
        id: 'improvement',
        question: 'What could we improve?',
        type: 'text',
        required: false
      },
      {
        id: 'features',
        question: 'Which features do you use most?',
        type: 'multiple-choice',
        options: ['Crisis Support', 'Mood Tracking', 'Meditation', 'Community', 'Resources', 'Other'],
        required: false
      }
    ];

    const survey: SatisfactionSurvey = {
      id: `survey_${Date.now()}`,
      questions: customQuestions || defaultQuestions,
      triggeredBy: trigger
    };

    setState(prev => ({
      ...prev,
      activeSurvey: survey,
      isVisible: true
    }));

    addDebugLog('info', 'feedback', 'Satisfaction survey shown', { trigger });
  }, [addDebugLog]);

  // Submit satisfaction survey
  const submitSatisfactionSurvey = useCallback(async (answers: Record<string, any>) => {
    if (!state.activeSurvey) return;

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Process survey answers
      const overallRating = answers.overall as SatisfactionLevel;
      const helpfulRating = answers.helpful as SatisfactionLevel;
      
      // Update satisfaction in store
      if (overallRating) {
        updateSatisfaction(overallRating);
      }
      
      // Submit detailed feedback if provided
      if (answers.improvement) {
        await showFeedback({
          type: 'satisfaction',
          message: `Satisfaction Survey Response: ${answers.improvement}`,
          metadata: {
            surveyId: state.activeSurvey.id,
            answers,
            overallRating,
            helpfulRating,
            wouldRecommend: answers.recommend
          }
        });
      } else {
        // Just submit ratings
        submitToStore({
          type: 'satisfaction',
          message: 'Satisfaction survey completed',
          rating: overallRating,
          anonymous: !user,
          metadata: {
            surveyId: state.activeSurvey.id,
            answers
          }
        });
      }

      // Mark survey as completed
      const completedSurvey = {
        ...state.activeSurvey,
        completedAt: Date.now()
      };

      // Save to local storage
      saveSurveyResponse(completedSurvey);

      setState(prev => ({
        ...prev,
        activeSurvey: undefined,
        isSubmitting: false,
        successMessage: 'Thank you for your feedback!'
      }));

      addNotification({
        type: 'success',
        title: 'Survey Completed',
        message: 'Thank you for helping us improve our services!'
      });

      // Hide after delay
      setTimeout(hideFeedback, 3000);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: 'Failed to submit survey'
      }));
      
      console.error('Survey submission error:', error);
    }
  }, [state.activeSurvey, user, updateSatisfaction, submitToStore, showFeedback, hideFeedback, addNotification]);

  // Show feedback prompt based on triggers
  const showFeedbackPrompt = useCallback((prompt: FeedbackPrompt) => {
    // Don't show if recently submitted
    if (state.lastSubmitted && Date.now() - state.lastSubmitted < 30 * 60 * 1000) {
      return; // Don't show within 30 minutes of last submission
    }

    // Don't show during crisis
    if (crisisState.isActive) {
      return;
    }

    setActivePrompt(prompt);
    
    setState(prev => ({
      ...prev,
      activePrompt: prompt,
      isVisible: true
    }));

    addDebugLog('info', 'feedback', 'Feedback prompt shown', {
      type: prompt.type,
      trigger: prompt.trigger
    });
  }, [state.lastSubmitted, crisisState.isActive, setActivePrompt, addDebugLog]);

  // Quick feedback buttons
  const quickFeedback = useCallback((
    rating: SatisfactionLevel,
    feature?: string
  ) => {
    // Update satisfaction immediately
    if (feature) {
      updateSatisfaction(undefined, { name: feature, rating });
    } else {
      updateSatisfaction(rating);
    }

    // Show thank you message
    setState(prev => ({
      ...prev,
      successMessage: 'Thanks for your feedback!',
      isVisible: true
    }));

    // Hide after 2 seconds
    setTimeout(hideFeedback, 2000);

    addDebugLog('info', 'feedback', 'Quick feedback submitted', { rating, feature });
  }, [updateSatisfaction, hideFeedback, addDebugLog]);

  // Report a bug with enhanced details
  const reportBug = useCallback(async (
    description: string,
    steps?: string[],
    screenshot?: File
  ) => {
    const metadata = {
      steps,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      console: captureConsoleErrors(),
      performance: capturePerformanceMetrics()
    };

    return showFeedback({
      type: 'bug',
      message: description,
      description: steps ? `Steps to reproduce:\n${steps.join('\n')}` : undefined,
      attachments: screenshot ? [screenshot] : undefined,
      metadata,
      priority: 'medium'
    });
  }, [showFeedback]);

  // Request a feature
  const requestFeature = useCallback(async (
    title: string,
    description: string,
    useCase?: string
  ) => {
    return showFeedback({
      type: 'feature',
      message: title,
      description: `${description}\n\nUse case: ${useCase || 'Not specified'}`,
      priority: 'low',
      contactMe: true
    });
  }, [showFeedback]);

  // Crisis feedback with immediate escalation
  const submitCrisisFeedback = useCallback(async (
    message: string,
    needsImmediate: boolean = false
  ) => {
    const feedbackId = await showFeedback({
      type: 'crisis',
      message,
      priority: 'critical',
      anonymous: false, // Crisis feedback should not be anonymous for follow-up
      metadata: {
        needsImmediate,
        crisisLevel: crisisState.level,
        timestamp: Date.now()
      }
    });

    if (needsImmediate && feedbackId) {
      // Trigger immediate escalation
      escalateFeedback(feedbackId, 'Crisis feedback requiring immediate attention');
    }

    return feedbackId;
  }, [showFeedback, crisisState.level]);

  // Helper functions
  const determinePriority = (options: FeedbackOptions): FeedbackPriority => {
    if (options.priority) return options.priority;
    
    switch (options.type) {
      case 'crisis':
        return 'critical';
      case 'bug':
        return 'high';
      case 'accessibility':
        return 'high';
      case 'feature':
        return 'low';
      default:
        return 'medium';
    }
  };

  const detectCrisisContent = (message: string): boolean => {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'not worth living',
      'self harm', 'cutting', 'overdose', 'emergency',
      'crisis', 'desperate', 'can\'t go on', 'hopeless'
    ];
    
    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const categorizeAutomatically = (options: FeedbackOptions): string => {
    const categoryMap: Record<FeedbackType, string> = {
      bug: 'Technical Issues',
      feature: 'Feature Requests',
      general: 'General Feedback',
      crisis: 'Crisis Support',
      satisfaction: 'User Satisfaction',
      therapeutic: 'Therapeutic Features',
      accessibility: 'Accessibility'
    };
    
    return categoryMap[options.type] || 'Uncategorized';
  };

  const extractTags = (message: string): string[] => {
    // Extract hashtags
    const hashtags = message.match(/#\w+/g) || [];
    
    // Extract key topics
    const topics = [];
    if (message.toLowerCase().includes('mood')) topics.push('mood');
    if (message.toLowerCase().includes('anxiety')) topics.push('anxiety');
    if (message.toLowerCase().includes('depression')) topics.push('depression');
    if (message.toLowerCase().includes('meditation')) topics.push('meditation');
    if (message.toLowerCase().includes('therapy')) topics.push('therapy');
    
    return [...new Set([...hashtags.map(h => h.slice(1)), ...topics])];
  };

  const getCultureAppropriateSuccessMessage = (type: FeedbackType): string => {
    const messages = {
      crisis: 'Your message has been received and prioritized. Help is on the way.',
      bug: 'Thank you for reporting this issue. We will investigate it promptly.',
      feature: 'Great suggestion! We will consider it for future updates.',
      general: 'Thank you for your feedback. Your input helps us improve.',
      satisfaction: 'Thank you for sharing your experience with us.',
      therapeutic: 'Your therapeutic feedback is valuable. Thank you for sharing.',
      accessibility: 'Thank you for helping us make our platform more accessible.'
    };
    
    return messages[type] || 'Thank you for your feedback!';
  };

  const handleCrisisFeedback = async (
    feedbackId: string,
    submission: Partial<FeedbackSubmission>
  ) => {
    // Immediately escalate to crisis team
    updateFeedbackStatus(feedbackId, 'escalated');
    
    // Send alert to crisis response team
    await sendCrisisAlert(feedbackId, submission);
    
    // Log for immediate attention
    addDebugLog('warn', 'feedback', 'Crisis feedback received', {
      feedbackId,
      userId: submission.userId
    });
  };

  const sendCrisisAlert = async (
    feedbackId: string,
    submission: Partial<FeedbackSubmission>
  ) => {
    // In production, this would send real alerts
    console.warn('[CRISIS ALERT]', {
      feedbackId,
      message: submission.message,
      userId: submission.userId,
      timestamp: new Date().toISOString()
    });
  };

  const escalateFeedback = (feedbackId: string, reason: string) => {
    updateFeedbackStatus(feedbackId, 'escalated');
    
    addNotification({
      type: 'warning',
      title: 'Feedback Escalated',
      message: 'Your feedback has been escalated for immediate attention.'
    });
    
    addDebugLog('warn', 'feedback', 'Feedback escalated', { feedbackId, reason });
  };

  const uploadAttachments = async (feedbackId: string, files: File[]) => {
    // In production, this would upload to secure storage
    const attachmentUrls = files.map(file => URL.createObjectURL(file));
    
    // Store references (in production, would be actual URLs)
    const feedback = state.submissions.find(s => s.id === feedbackId);
    if (feedback) {
      feedback.attachments = attachmentUrls;
    }
  };

  const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('feedback_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('feedback_session_id', sessionId);
    }
    return sessionId;
  };

  const captureConsoleErrors = (): string[] => {
    // In production, would capture actual console errors
    return [];
  };

  const capturePerformanceMetrics = () => {
    if ('performance' in window) {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: perf.loadEventEnd - perf.fetchStart,
        domReady: perf.domContentLoadedEventEnd - perf.fetchStart,
        renderTime: perf.domComplete - perf.domContentLoadedEventEnd
      };
    }
    return null;
  };

  // Setup functions
  const setupFeedbackWidget = useCallback(() => {
    // Create floating feedback widget
    const widget = document.createElement('div');
    widget.id = 'feedback-widget';
    widget.className = 'feedback-widget';
    widget.innerHTML = `
      <button class="feedback-trigger" aria-label="Provide feedback">
        <span class="feedback-icon">💬</span>
      </button>
    `;
    
    widget.addEventListener('click', () => {
      setState(prev => ({ ...prev, isVisible: !prev.isVisible }));
    });
    
    document.body.appendChild(widget);
    feedbackWidgetRef.current = widget;
  }, []);

  const initializePromptSystem = useCallback(() => {
    // Set up time-based prompts
    const timePrompts = [
      {
        id: 'first-visit',
        showAfter: 5 * 60 * 1000, // 5 minutes
        prompt: {
          id: 'first-visit-feedback',
          type: 'toast' as const,
          message: 'How is your experience so far?',
          trigger: 'time' as const,
          options: ['Great!', 'Good', 'Could be better']
        }
      },
      {
        id: 'extended-use',
        showAfter: 30 * 60 * 1000, // 30 minutes
        prompt: {
          id: 'extended-use-survey',
          type: 'modal' as const,
          message: 'Would you like to share feedback about your session?',
          trigger: 'time' as const
        }
      }
    ];

    timePrompts.forEach(({ showAfter, prompt }) => {
      const timeout = setTimeout(() => {
        showFeedbackPrompt(prompt);
      }, showAfter);
      
      promptTimeoutRef.current = timeout;
    });
  }, [showFeedbackPrompt]);

  const setupKeyboardShortcuts = useCallback(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + F: Toggle feedback
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setState(prev => ({ ...prev, isVisible: !prev.isVisible }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showCrisisFeedbackPrompt = useCallback(() => {
    showFeedbackPrompt({
      id: 'crisis-feedback',
      type: 'modal',
      message: 'We noticed you were in crisis. How are you feeling now? Your feedback helps us improve crisis support.',
      trigger: 'crisis',
      priority: 'high'
    });
  }, [showFeedbackPrompt]);

  const loadFeedbackHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      const history = localStorage.getItem(`feedback_history_${user.id}`);
      if (history) {
        const submissions = JSON.parse(history);
        setState(prev => ({
          ...prev,
          submissions: submissions
        }));
      }
    } catch (error) {
      console.error('Failed to load feedback history:', error);
    }
  }, [user]);

  const loadSatisfactionData = useCallback(() => {
    // Load from global store
    const { satisfaction } = globalFeedback;
    if (satisfaction) {
      setState(prev => ({
        ...prev,
        analytics: {
          ...prev.analytics,
          avgRating: satisfaction.overall
        }
      }));
    }
  }, [globalFeedback]);

  const saveSurveyResponse = (survey: SatisfactionSurvey) => {
    const responses = JSON.parse(localStorage.getItem('survey_responses') || '[]');
    responses.push(survey);
    localStorage.setItem('survey_responses', JSON.stringify(responses));
  };

  const updateAnalytics = useCallback(() => {
    const analytics = getFeedbackAnalytics();
    
    // Calculate trend
    const recentRatings = state.submissions
      .filter(s => s.rating && s.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000)
      .map(s => s.rating!);
    
    const olderRatings = state.submissions
      .filter(s => s.rating && s.timestamp < Date.now() - 7 * 24 * 60 * 60 * 1000)
      .map(s => s.rating!);
    
    const recentAvg = recentRatings.length > 0 
      ? recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length
      : 0;
    
    const olderAvg = olderRatings.length > 0
      ? olderRatings.reduce((a, b) => a + b, 0) / olderRatings.length
      : 0;
    
    let trend: FeedbackAnalytics['satisfactionTrend'] = 'stable';
    if (recentAvg > olderAvg + 0.5) trend = 'improving';
    if (recentAvg < olderAvg - 0.5) trend = 'declining';
    
    // Calculate top categories
    const categories = state.submissions.reduce((acc, s) => {
      const cat = s.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate crisis count
    const crisisCount = state.submissions.filter(s => s.type === 'crisis').length;
    
    setState(prev => ({
      ...prev,
      analytics: {
        ...analytics,
        satisfactionTrend: trend,
        topCategories,
        crisisCount
      }
    }));
  }, [state.submissions, getFeedbackAnalytics]);

  const cleanupFeedback = useCallback(() => {
    // Clear timeouts
    if (promptTimeoutRef.current) {
      clearTimeout(promptTimeoutRef.current);
    }
    if (surveyTimeoutRef.current) {
      clearTimeout(surveyTimeoutRef.current);
    }
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }
    
    // Remove widget
    if (feedbackWidgetRef.current) {
      document.body.removeChild(feedbackWidgetRef.current);
    }
  }, []);

  // Get feedback by status
  const getFeedbackByStatus = useCallback((status: FeedbackStatus) => {
    return state.submissions.filter(s => s.status === status);
  }, [state.submissions]);

  // Get feedback by type
  const getFeedbackByType = useCallback((type: FeedbackType) => {
    return state.submissions.filter(s => s.type === type);
  }, [state.submissions]);

  // Mark feedback as resolved
  const resolveFeedback = useCallback((feedbackId: string, response: string) => {
    respondToFeedback(feedbackId, response, user?.id || 'System');
    
    addNotification({
      type: 'success',
      title: 'Feedback Resolved',
      message: 'The feedback has been marked as resolved.'
    });
  }, [respondToFeedback, user, addNotification]);

  // Export feedback data
  const exportFeedbackData = useCallback(() => {
    const data = {
      submissions: state.submissions,
      analytics: state.analytics,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  return {
    // State
    ...state,
    feedbackState: state,
    
    // Core functions
    showFeedback,
    hideFeedback,
    
    // Survey functions
    showSatisfactionSurvey,
    submitSatisfactionSurvey,
    
    // Prompt functions
    showFeedbackPrompt,
    dismissPrompt: dismissActivePrompt,
    
    // Quick feedback
    quickFeedback,
    
    // Specialized feedback
    reportBug,
    requestFeature,
    submitCrisisFeedback,
    
    // Management functions
    resolveFeedback,
    getFeedbackByStatus,
    getFeedbackByType,
    
    // Analytics
    updateAnalytics,
    exportFeedbackData,
    
    // Helpers
    isVisible: state.isVisible,
    hasActiveSurvey: !!state.activeSurvey,
    hasActivePrompt: !!state.activePrompt || !!globalFeedback.activePrompt,
    canSubmit: !state.isSubmitting,
    recentlySubmitted: state.lastSubmitted ? Date.now() - state.lastSubmitted < 60000 : false
  };
};

export default useFeedback;