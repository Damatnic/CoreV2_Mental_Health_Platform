/**
 * Onboarding Flow Component
 * Interactive guided tour for new users with mental health considerations
 */

import * as React from 'react';
const { useState, useEffect, useCallback } = React;
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../hooks/useAccessibility';
import { useFeedback } from '../hooks/useFeedback';
import { LoadingButton, ProgressBar } from './LoadingStates';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  skipable?: boolean;
  validation?: () => boolean;
  helpText?: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userPreferences, setUserPreferences] = useState({
    role: "seeker",
    primaryConcerns: [] as string[],
    preferredSupport: [] as string[],
    comfortLevel: "moderate",
    notifications: true,
    emergencyContact: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { announceToScreenReader } = useAccessibility();
  const announce = announceToScreenReader;
  const { showFeedback } = useFeedback();

  // Helper function to create concern option
  const createConcernOption = (concern: { id: string; label: string; icon: string }) => {
    const isSelected = userPreferences.primaryConcerns.includes(concern.id);
    return React.createElement(
      'button',
      {
        key: concern.id,
        className: `concern-option ${isSelected ? "selected" : ""}`,
        onClick: () => {
          setUserPreferences(prev => ({
            ...prev,
            primaryConcerns: isSelected
              ? prev.primaryConcerns.filter(c => c !== concern.id)
              : [...prev.primaryConcerns, concern.id]
          }));
        },
        'aria-pressed': isSelected
      },
      React.createElement('span', { className: 'concern-option__icon' }, concern.icon),
      React.createElement('span', { className: 'concern-option__label' }, concern.label)
    );
  };

  // Define onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: 'Welcome to Astral Core',
      description: "Your safe space for mental health support",
      content: React.createElement(
        'div',
        { className: 'onboarding-welcome' },
        React.createElement(
          'div',
          { className: 'onboarding-welcome__icon' },
          React.createElement(HeartIcon, { size: 80 })
        ),
        React.createElement('h2', null, "We're here to support you"),
        React.createElement(
          'p',
          null,
          'Astral Core is a peer support platform where you can connect with others, share your experiences, and find the help you need in a safe, judgment-free environment.'
        ),
        React.createElement(
          'div',
          { className: 'onboarding-features' },
          React.createElement(
            'div',
            { className: 'onboarding-feature' },
            React.createElement('span', { className: 'onboarding-feature__icon' }, '🤝'),
            React.createElement('span', null, 'Peer Support')
          ),
          React.createElement(
            'div',
            { className: 'onboarding-feature' },
            React.createElement('span', { className: 'onboarding-feature__icon' }, '🔒'),
            React.createElement('span', null, 'Private & Secure')
          ),
          React.createElement(
            'div',
            { className: 'onboarding-feature' },
            React.createElement('span', { className: 'onboarding-feature__icon' }, '🆘'),
            React.createElement('span', null, 'Crisis Resources')
          ),
          React.createElement(
            'div',
            { className: 'onboarding-feature' },
            React.createElement('span', { className: 'onboarding-feature__icon' }, '💚'),
            React.createElement('span', null, 'Wellness Tools')
          )
        )
      ),
      skipable: false
    },
    {
      id: "role-selection",
      title: "How would you like to participate?",
      description: 'You can change this anytime',
      content: React.createElement(
        'div',
        { className: 'onboarding-role' },
        React.createElement(
          'div',
          { className: 'role-options' },
          React.createElement(
            'button',
            {
              className: userPreferences.role === "seeker" ? "role-option selected" : 'role-option',
              onClick: () => setUserPreferences(prev => ({ ...prev, role: 'seeker' })),
              'aria-pressed': userPreferences.role === "seeker"
            },
            React.createElement('div', { className: 'role-option__icon' }, '🌟'),
            React.createElement('h3', null, 'Seeker'),
            React.createElement('p', null, 'Connect with peers and find support for your mental health journey')
          ),
          React.createElement(
            'button',
            {
              className: userPreferences.role === "helper" ? 'role-option selected' : "role-option",
              onClick: () => setUserPreferences(prev => ({ ...prev, role: "helper" })),
              'aria-pressed': userPreferences.role === 'helper'
            },
            React.createElement('div', { className: 'role-option__icon' }, '💝'),
            React.createElement('h3', null, 'Helper'),
            React.createElement('p', null, 'Provide support and share your experience to help others')
          ),
          React.createElement(
            'button',
            {
              className: userPreferences.role === 'both' ? "role-option selected" : "role-option",
              onClick: () => setUserPreferences(prev => ({ ...prev, role: "both" })),
              'aria-pressed': userPreferences.role === "both"
            },
            React.createElement('div', { className: 'role-option__icon' }, '🤲'),
            React.createElement('h3', null, 'Both'),
            React.createElement('p', null, 'Switch between seeking support and helping others as needed')
          )
        )
      ),
      validation: () => userPreferences.role !== "",
      skipable: false
    },
    {
      id: 'concerns',
      title: "What brings you here?",
      description: "This helps us personalize your experience (optional)",
      content: React.createElement(
        'div',
        { className: 'onboarding-concerns' },
        React.createElement(
          'p',
          { className: 'privacy-note' },
          React.createElement('span', { className: 'privacy-icon' }, '🔒'),
          'Your selections are private and only used to improve your experience'
        ),
        React.createElement(
          'div',
          { className: 'concern-options' },
          [
            { id: 'anxiety', label: "Anxiety", icon: "😰" },
            { id: 'depression', label: "Depression", icon: "😔" },
            { id: "stress", label: "Stress", icon: '😣' },
            { id: 'relationships', label: "Relationships", icon: "💔" },
            { id: 'self-esteem', label: "Self-esteem", icon: "🪞" },
            { id: "trauma", label: "Trauma", icon: '🌧️' },
            { id: 'addiction', label: "Addiction", icon: "🔄" },
            { id: "other", label: 'Other', icon: "💭" }
          ].map(createConcernOption)
        )
      ),
      skipable: true
    },
    {
      id: 'complete',
      title: "You're All Set!",
      description: 'Welcome to our community',
      content: React.createElement(
        'div',
        { className: 'onboarding-complete' },
        React.createElement('div', { className: 'complete-icon' }, '🎉'),
        React.createElement('h2', null, 'Welcome to Astral Core!'),
        React.createElement(
          'p',
          null,
          "You've completed the setup. Remember, you're not alone in this journey. Our community is here to support you every step of the way."
        ),
        React.createElement(
          'div',
          { className: 'complete-tips' },
          React.createElement('h3', null, 'Getting Started Tips:'),
          React.createElement(
            'ul',
            null,
            React.createElement('li', null, '🌟 Complete your first mood check-in'),
            React.createElement('li', null, '💬 Introduce yourself in the community'),
            React.createElement('li', null, '📖 Explore self-help resources'),
            React.createElement('li', null, '🤝 Connect with a peer supporter')
          )
        ),
        React.createElement(
          'p',
          { className: 'remember-message' },
          "Remember: It's okay to not be okay. Take things at your own pace."
        )
      ),
      skipable: false
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Handle step navigation
  const goToNextStep = useCallback(async () => {
    if (currentStepData.validation && !currentStepData.validation()) {
      showFeedback({
        type: "warning",
        message: "Please complete this step before continuing"
      });
      return;
    }

    if (currentStepData.action) {
      setIsLoading(true);
      try {
        await currentStepData.action.onClick();
      } catch (error) {
        showFeedback({
          type: 'error',
          message: "An error occurred. Please try again."
        });
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      announce(`Step ${currentStep + 2} of ${steps.length}: ${steps[currentStep + 1].title}`);
    } else {
      await completeOnboarding();
    }
  }, [currentStep, currentStepData, steps, announce, showFeedback]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      announce(`Step ${currentStep} of ${steps.length}: ${steps[currentStep - 1].title}`);
    }
  }, [currentStep, steps, announce]);

  const skipCurrentStep = useCallback(() => {
    if (currentStepData.skipable) {
      goToNextStep();
    }
  }, [currentStepData, goToNextStep]);

  const completeOnboarding = async () => {
    setIsLoading(true);

    // Save user preferences
    try {
      localStorage.setItem("user-preferences", JSON.stringify(userPreferences));
      localStorage.setItem("onboarding-completed", "true");

      // Track completion
      showFeedback({
        type: "success",
        message: "Welcome to Astral Core!",
        description: "Your preferences have been saved"
      });

      // Navigate to dashboard
      setTimeout(() => {
        onComplete();
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      showFeedback({
        type: "error",
        message: "Failed to save preferences",
        description: "But you can continue to the app"
      });
      onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        goToNextStep();
      } else if (e.key === "ArrowLeft") {
        goToPreviousStep();
      } else if (e.key === 'Escape' && onSkip) {
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextStep, goToPreviousStep, onSkip]);

  return React.createElement(
    'div',
    { className: 'onboarding-flow', role: 'main', 'aria-label': 'Onboarding flow' },
    React.createElement(
      'div',
      { className: 'onboarding-header' },
      React.createElement(ProgressBar, {
        value: progress,
        max: 100,
        label: `Step ${currentStep + 1} of ${steps.length}`,
        showPercentage: false
      }),
      onSkip && currentStep < steps.length - 1 && React.createElement(
        'button',
        {
          className: 'onboarding-skip',
          onClick: onSkip,
          'aria-label': 'Skip onboarding'
        },
        'Skip for now'
      )
    ),
    React.createElement(
      'div',
      { className: 'onboarding-content' },
      React.createElement(
        'div',
        { className: 'onboarding-step', key: currentStepData.id },
        React.createElement('h1', { className: 'onboarding-step__title' }, currentStepData.title),
        React.createElement('p', { className: 'onboarding-step__description' }, currentStepData.description),
        React.createElement(
          'div',
          { className: 'onboarding-step__content' },
          currentStepData.content
        ),
        currentStepData.helpText && React.createElement(
          'p',
          { className: 'onboarding-step__help' },
          currentStepData.helpText
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'onboarding-actions' },
      currentStep > 0 && React.createElement(
        'button',
        {
          className: 'onboarding-action onboarding-action--back',
          onClick: goToPreviousStep,
          disabled: isLoading,
          'aria-label': 'Previous step'
        },
        '← Back'
      ),
      React.createElement(
        'div',
        { className: 'onboarding-actions__right' },
        currentStepData.skipable && React.createElement(
          'button',
          {
            className: 'onboarding-action onboarding-action--skip',
            onClick: skipCurrentStep,
            disabled: isLoading
          },
          'Skip'
        ),
        currentStep < steps.length - 1 ? React.createElement(LoadingButton, {
          loading: isLoading,
          onClick: goToNextStep,
          className: 'onboarding-action onboarding-action--next',
          variant: 'primary',
          children: 'Continue →'
        }) : React.createElement(LoadingButton, {
          loading: isLoading,
          onClick: completeOnboarding,
          className: 'onboarding-action onboarding-action--complete',
          variant: 'primary',
          children: 'Get Started'
        })
      )
    )
  );
};

// Heart Icon Component
const HeartIcon: React.FC<{ size?: number }> = ({ size = 48 }) => 
  React.createElement(
    'svg',
    { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
    React.createElement('path', {
      d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'
    })
  );

export default OnboardingFlow;