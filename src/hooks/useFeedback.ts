/**
 * Feedback Hook
 * Provides user feedback functionality for mental health platform
 */

import { useCallback, useState } from 'react';

export interface FeedbackOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
}

interface FeedbackState {
  isVisible: boolean;
  type: FeedbackOptions['type'];
  message: string;
  description?: string;
}

export function useFeedback() {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    isVisible: false,
    type: 'info',
    message: ''
  });

  const showFeedback = useCallback((options: FeedbackOptions) => {
    setFeedbackState({
      isVisible: true,
      type: options.type,
      message: options.message,
      description: options.description
    });

    // Auto-hide after duration (default 3 seconds)
    const duration = options.duration || 3000;
    setTimeout(() => {
      setFeedbackState(prev => ({ ...prev, isVisible: false }));
    }, duration);

    // Log to console for debugging
    console.log(`[Feedback] ${options.type}: ${options.message}`, options.description);
  }, []);

  const hideFeedback = useCallback(() => {
    setFeedbackState(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    showFeedback,
    hideFeedback,
    feedbackState,
    isVisible: feedbackState.isVisible
  };
}