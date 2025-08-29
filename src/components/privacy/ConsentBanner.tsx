import * as React from 'react';
const { useState, useEffect } = React;
import { getAnalyticsService, ConsentStatus } from '../../services/analyticsService';
import { AppButton } from '../AppButton';
import { Modal } from '../Modal';

interface ConsentBannerProps {
  onConsentChange?: (consent: ConsentStatus) => void;
}

interface ConsentPreferences {
  analytics: boolean;
  performance: boolean;
  functionality: boolean;
  marketing: boolean;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({ onConsentChange }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: false,
    performance: true,
    functionality: true,
    marketing: false
  });
  const analyticsService = getAnalyticsService();

  useEffect(() => {
    // Check if user has already made consent choices
    const consentStatus = analyticsService.getConsentStatus();

    if (!consentStatus || !consentStatus.timestamp) {
      setShowBanner(true);
    } else {
      setPreferences({
        analytics: consentStatus.analytics,
        performance: consentStatus.performance,
        functionality: consentStatus.functionality,
        marketing: consentStatus.marketing
      });
    }
  }, [analyticsService]);

  const handleAcceptAll = () => {
    const consent: ConsentStatus = {
      analytics: true,
      performance: true,
      functionality: true,
      marketing: true,
      timestamp: Date.now(),
      version: "1.0.0"
    };

    analyticsService.updateConsent(consent);
    onConsentChange?.(consent);
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    const consent: ConsentStatus = {
      analytics: false,
      performance: true,
      functionality: true,
      marketing: false,
      timestamp: Date.now(),
      version: "1.0.0"
    };

    analyticsService.updateConsent(consent);
    onConsentChange?.(consent);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    const consent: ConsentStatus = {
      ...preferences,
      timestamp: Date.now(),
      version: "1.0.0"
    };

    analyticsService.updateConsent(consent);
    onConsentChange?.(consent);
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) return null;

  // Create preference items
  const createPreferenceItem = (
    id: string,
    checked: boolean,
    disabled: boolean,
    title: string,
    badge: string,
    badgeClass: string,
    description: string,
    onChange?: (checked: boolean) => void
  ) => {
    return React.createElement(
      'div',
      { className: `flex items-start space-x-3 p-3 ${disabled ? 'bg-gray-50 dark:bg-gray-700' : 'border border-gray-200 dark:border-gray-600'} rounded-lg` },
      React.createElement('input', {
        type: 'checkbox',
        id,
        checked,
        disabled,
        onChange: onChange ? (e: any) => onChange(e.target.checked) : undefined,
        className: `mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${disabled ? 'opacity-50' : ''}`
      }),
      React.createElement(
        'div',
        { className: 'flex-1' },
        React.createElement(
          'label',
          { htmlFor: id, className: 'text-sm font-medium text-gray-900 dark:text-white' },
          title,
          React.createElement(
            'span',
            { className: `ml-2 text-xs ${badgeClass} px-2 py-1 rounded` },
            badge
          )
        ),
        React.createElement(
          'p',
          { className: 'text-xs text-gray-600 dark:text-gray-300 mt-1' },
          description
        )
      )
    );
  };

  return React.createElement(
    React.Fragment,
    null,
    // Banner
    React.createElement(
      'div',
      { className: 'fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg' },
      React.createElement(
        'div',
        { className: 'max-w-6xl mx-auto p-4' },
        React.createElement(
          'div',
          { className: 'flex flex-col md:flex-row md:items-center md:justify-between gap-4' },
          React.createElement(
            'div',
            { className: 'flex-1' },
            React.createElement(
              'h3',
              { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-2' },
              'Privacy & Mental Health Data Protection'
            ),
            React.createElement(
              'p',
              { className: 'text-sm text-gray-600 dark:text-gray-300 mb-2' },
              'We use privacy-compliant analytics to improve our mental health platform while protecting your sensitive information. All data is anonymized after 7 days, and crisis intervention data is handled with the highest security standards.'
            ),
            React.createElement(
              'p',
              { className: 'text-xs text-gray-500 dark:text-gray-400' },
              'GDPR & HIPAA-adjacent compliant • Data retention: 30 days • Automatic anonymization: 7 days'
            )
          ),
          React.createElement(
            'div',
            { className: 'flex flex-col sm:flex-row gap-2 min-w-max' },
            React.createElement(AppButton, {
              variant: 'secondary',
              size: 'small',
              onClick: () => setShowPreferences(true),
              className: 'text-xs',
              children: 'Customize Preferences'
            }),
            React.createElement(AppButton, {
              variant: 'secondary',
              size: 'small',
              onClick: handleAcceptEssential,
              className: 'text-xs',
              children: 'Essential Only'
            }),
            React.createElement(AppButton, {
              variant: 'primary',
              size: 'small',
              onClick: handleAcceptAll,
              className: 'text-xs',
              children: 'Accept All'
            })
          )
        )
      )
    ),
    // Modal
    React.createElement(Modal, {
      isOpen: showPreferences,
      onClose: () => setShowPreferences(false),
      title: 'Privacy Preferences',
      size: 'large',
      children: React.createElement(
        'div',
        { className: 'space-y-6' },
        React.createElement(
          'div',
          { className: 'text-sm text-gray-600 dark:text-gray-300' },
          React.createElement(
            'p',
            { className: 'mb-4' },
            'Your privacy is our priority. Customize how we collect and use data to improve your mental health platform experience.'
          ),
          React.createElement(
            'div',
            { className: 'bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4' },
            React.createElement(
              'p',
              { className: 'text-xs font-medium text-blue-800 dark:text-blue-200' },
              '🔒 Mental Health Data Protection: Crisis intervention data is encrypted, anonymized after use, and retained only for safety analysis.'
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'space-y-4' },
          // Functionality - Required
          createPreferenceItem(
            'functionality',
            true,
            true,
            'Essential Functionality',
            'Required',
            'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
            'Core platform features, user sessions, and security. Cannot be disabled.'
          ),
          // Performance - Required
          createPreferenceItem(
            'performance',
            true,
            true,
            'Performance Monitoring',
            'Required',
            'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
            'Load times, error tracking, and platform optimization. Essential for mental health platform reliability.'
          ),
          // Analytics - Optional
          createPreferenceItem(
            'analytics',
            preferences.analytics,
            false,
            'Usage Analytics',
            'Optional',
            'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
            'Anonymous usage patterns to improve mental health features. Data anonymized after 7 days.',
            (checked) => setPreferences(prev => ({ ...prev, analytics: checked }))
          ),
          // Marketing - Optional
          createPreferenceItem(
            'marketing',
            preferences.marketing,
            false,
            'Marketing Communications',
            'Optional',
            'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
            'Personalized wellness tips and platform updates. No sensitive health data used.',
            (checked) => setPreferences(prev => ({ ...prev, marketing: checked }))
          )
        ),
        React.createElement(
          'div',
          { className: 'border-t border-gray-200 dark:border-gray-600 pt-4' },
          React.createElement(
            'div',
            { className: 'text-xs text-gray-500 dark:text-gray-400 space-y-1' },
            React.createElement('p', null, '• All data is processed according to GDPR and mental health privacy standards'),
            React.createElement('p', null, '• Crisis intervention data is encrypted and anonymized immediately after use'),
            React.createElement('p', null, '• You can change these preferences anytime in your privacy settings'),
            React.createElement('p', null, '• Data is automatically purged after 90 days maximum')
          )
        ),
        React.createElement(
          'div',
          { className: 'flex justify-end space-x-3' },
          React.createElement(AppButton, {
            variant: 'secondary',
            onClick: () => setShowPreferences(false),
            children: 'Cancel'
          }),
          React.createElement(AppButton, {
            variant: 'primary',
            onClick: handleSavePreferences,
            children: 'Save Preferences'
          })
        )
      )
    })
  );
};

export default ConsentBanner;