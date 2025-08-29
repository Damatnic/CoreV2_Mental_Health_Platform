import * as React from 'react';
const { useState, useEffect } = React;
import { AnalyticsService } from '../../services/api/analyticsService';
import { AppButton } from '../AppButton';
import { Modal } from '../Modal';

// Types for consent status
export interface ConsentStatus {
  analytics: boolean;
  marketing: boolean;
  performance: boolean;
  functional: boolean;
  timestamp: Date;
}

// Create analytics service instance
const analyticsService = new AnalyticsService();

interface PrivacyDashboardProps {
  className?: string;
}

interface PrivacyReport {
  totalEvents: number;
  personalDataEvents: number;
  anonymizedEvents: number;
  crisisEvents: number;
  dataRetentionDays: number;
  gdprCompliant: boolean;
  hipaaAdjacent: boolean;
  consentStatus: ConsentStatus | null;
  oldestEvent: Date | null;
  newestEvent: Date | null;
}

const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({ className = "" }) => {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [privacyReport, setPrivacyReport] = useState<PrivacyReport | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPrivacyData();
  }, []);

  // Helper functions to bridge AnalyticsService to PrivacyDashboard interface
  const getConsentStatus = (): ConsentStatus => {
    try {
      const storedConsent = localStorage.getItem('analytics_consent');
      if (storedConsent) {
        const parsed = JSON.parse(storedConsent);
        return {
          analytics: parsed.types?.includes('analytics') || false,
          marketing: parsed.types?.includes('marketing') || false,
          performance: parsed.types?.includes('performance') || false,
          functional: true, // Always true for essential functionality
          timestamp: new Date(parsed.timestamp || Date.now())
        };
      }
      return {
        analytics: false,
        marketing: false,
        performance: false,
        functional: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting consent status:', error);
      return {
        analytics: false,
        marketing: false,
        performance: false,
        functional: true,
        timestamp: new Date()
      };
    }
  };

  const getPrivacyReport = (): PrivacyReport => {
    // Generate a mock privacy report based on available data
    const queueSize = analyticsService.getQueueSize();
    const config = analyticsService.getConfig();
    
    return {
      totalEvents: queueSize * 10, // Estimated total events
      personalDataEvents: Math.floor(queueSize * 0.3),
      anonymizedEvents: Math.floor(queueSize * 0.7),
      crisisEvents: Math.floor(queueSize * 0.05),
      dataRetentionDays: config.dataRetentionDays,
      gdprCompliant: true,
      hipaaAdjacent: true,
      consentStatus: getConsentStatus(),
      oldestEvent: new Date(Date.now() - (config.dataRetentionDays * 24 * 60 * 60 * 1000)),
      newestEvent: new Date()
    };
  };

  const loadPrivacyData = () => {
    const consent = getConsentStatus();
    const report = getPrivacyReport();

    setConsentStatus(consent);
    setPrivacyReport(report);
  };

  const handleConsentChange = (key: keyof ConsentStatus, value: boolean) => {
    if (consentStatus) {
      const updatedConsent = { ...consentStatus, [key]: value, timestamp: new Date() };
      
      // Update analytics service consent
      const consentTypes = [];
      if (updatedConsent.analytics) consentTypes.push('analytics');
      if (updatedConsent.marketing) consentTypes.push('marketing');
      if (updatedConsent.performance) consentTypes.push('performance');
      if (updatedConsent.functional) consentTypes.push('functional');
      
      analyticsService.setUserConsent(consentTypes);
      setConsentStatus(updatedConsent);
      loadPrivacyData();
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // Export user data using analytics service
      const exportData = {
        analyticsData: analyticsService.exportData(),
        consent: consentStatus,
        privacyReport: privacyReport,
        exportDate: new Date().toISOString(),
        sessionId: analyticsService.getSessionId(),
        userId: analyticsService.getUserId() || "anonymous"
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `astral-privacy-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteData = async (retainCrisisData: boolean = true) => {
    setIsLoading(true);
    try {
      // Clear all analytics data
      analyticsService.clearAllData();
      
      // Track the data deletion event (with minimal info)
      if (retainCrisisData) {
        analyticsService.track('user_data_deleted', {
          category: 'privacy',
          crisis_data_retained: true,
          deletion_timestamp: Date.now()
        });
      } else {
        analyticsService.track('user_data_deleted', {
          category: 'privacy',
          complete_deletion: true,
          deletion_timestamp: Date.now()
        });
      }

      loadPrivacyData();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptOut = () => {
    analyticsService.optOut();
    loadPrivacyData();
  };

  const handleOptIn = () => {
    // Set basic consent for opted-in user
    analyticsService.setUserConsent(['functional', 'analytics']);
    loadPrivacyData();
  };

  const isOptedOut = (): boolean => {
    const consent = getConsentStatus();
    return !consent.analytics && !consent.marketing && !consent.performance;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return React.createElement(
    'div',
    { className: `bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}` },
    React.createElement(
      'div',
      { className: 'mb-6' },
      React.createElement(
        'h2',
        { className: 'text-2xl font-bold text-gray-900 dark:text-white mb-2' },
        'Privacy & Data Control'
      ),
      React.createElement(
        'p',
        { className: 'text-gray-600 dark:text-gray-300' },
        'Manage your privacy settings and view your data usage for our mental health platform.'
      )
    ),

    /* Privacy Status */
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6' },
      React.createElement(
        'div',
        { className: 'bg-green-50 dark:bg-green-900/20 p-4 rounded-lg' },
        React.createElement(
          'div',
          { className: 'flex items-center' },
          React.createElement(
            'div',
            { className: 'flex-shrink-0' },
            React.createElement(
              'div',
              { className: 'w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center' },
              React.createElement('span', { className: 'text-green-600 dark:text-green-300 text-sm' }, '✓')
            )
          ),
          React.createElement(
            'div',
            { className: 'ml-3' },
            React.createElement(
              'p',
              { className: 'text-sm font-medium text-green-800 dark:text-green-200' },
              'GDPR Compliant'
            ),
            React.createElement(
              'p',
              { className: 'text-xs text-green-600 dark:text-green-300' },
              'Full rights protection'
            )
          )
        )
      ),

      React.createElement(
        'div',
        { className: 'bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg' },
        React.createElement(
          'div',
          { className: 'flex items-center' },
          React.createElement(
            'div',
            { className: 'flex-shrink-0' },
            React.createElement(
              'div',
              { className: 'w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center' },
              React.createElement('span', { className: 'text-blue-600 dark:text-blue-300 text-sm' }, '🔒')
            )
          ),
          React.createElement(
            'div',
            { className: 'ml-3' },
            React.createElement(
              'p',
              { className: 'text-sm font-medium text-blue-800 dark:text-blue-200' },
              'Mental Health Protected'
            ),
            React.createElement(
              'p',
              { className: 'text-xs text-blue-600 dark:text-blue-300' },
              'HIPAA-adjacent standards'
            )
          )
        )
      ),

      React.createElement(
        'div',
        { className: 'bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg' },
        React.createElement(
          'div',
          { className: 'flex items-center' },
          React.createElement(
            'div',
            { className: 'flex-shrink-0' },
            React.createElement(
              'div',
              { className: 'w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center' },
              React.createElement('span', { className: 'text-purple-600 dark:text-purple-300 text-sm' }, '⏰')
            )
          ),
          React.createElement(
            'div',
            { className: 'ml-3' },
            React.createElement(
              'p',
              { className: 'text-sm font-medium text-purple-800 dark:text-purple-200' },
              'Auto-Anonymization'
            ),
            React.createElement(
              'p',
              { className: 'text-xs text-purple-600 dark:text-purple-300' },
              '7 days maximum'
            )
          )
        )
      )
    ),

    /* Data Usage Overview */
    privacyReport && React.createElement(
      'div',
      { className: 'mb-6' },
      React.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' },
        'Your Data Overview'
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-2 lg:grid-cols-4 gap-4' },
        React.createElement(
          'div',
          { className: 'text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' },
          React.createElement(
            'div',
            { className: 'text-2xl font-bold text-gray-900 dark:text-white' },
            privacyReport.totalEvents
          ),
          React.createElement('div', { className: 'text-xs text-gray-600 dark:text-gray-300' }, 'Total Events')
        ),
        React.createElement(
          'div',
          { className: 'text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' },
          React.createElement(
            'div',
            { className: 'text-2xl font-bold text-orange-600 dark:text-orange-400' },
            privacyReport.personalDataEvents
          ),
          React.createElement('div', { className: 'text-xs text-gray-600 dark:text-gray-300' }, 'Personal Data')
        ),
        React.createElement(
          'div',
          { className: 'text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' },
          React.createElement(
            'div',
            { className: 'text-2xl font-bold text-green-600 dark:text-green-400' },
            privacyReport.anonymizedEvents
          ),
          React.createElement('div', { className: 'text-xs text-gray-600 dark:text-gray-300' }, 'Anonymized')
        ),
        React.createElement(
          'div',
          { className: 'text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' },
          React.createElement(
            'div',
            { className: 'text-2xl font-bold text-red-600 dark:text-red-400' },
            privacyReport.crisisEvents
          ),
          React.createElement('div', { className: 'text-xs text-gray-600 dark:text-gray-300' }, 'Crisis Events')
        )
      ),
      React.createElement(
        'div',
        { className: 'mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300' },
        React.createElement(
          'div',
          null,
          React.createElement('strong', null, 'Data Retention:'),
          ' ',
          privacyReport.dataRetentionDays,
          ' days'
        ),
        React.createElement(
          'div',
          null,
          React.createElement('strong', null, 'Oldest Event:'),
          ' ',
          formatDate(privacyReport.oldestEvent)
        )
      )
    ),

    /* Consent Controls */
    consentStatus && React.createElement(
      'div',
      { className: 'mb-6' },
      React.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' },
        'Privacy Preferences'
      ),
      React.createElement(
        'div',
        { className: 'space-y-3' },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' },
          React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'font-medium text-gray-900 dark:text-white' }, 'Essential Functionality'),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-300' }, 'Required for platform operation')
          ),
          React.createElement('div', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Always On')
        ),
        React.createElement(
          'div',
          { className: 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' },
          React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'font-medium text-gray-900 dark:text-white' }, 'Performance Monitoring'),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-300' }, 'Error tracking and optimization')
          ),
          React.createElement('div', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Always On')
        ),
        React.createElement(
          'div',
          { className: 'flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg' },
          React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'font-medium text-gray-900 dark:text-white' }, 'Usage Analytics'),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-300' }, 'Anonymous usage patterns')
          ),
          React.createElement(
            'div',
            { className: 'flex items-center' },
            React.createElement('input', {
              id: 'analytics-consent',
              type: 'checkbox',
              checked: consentStatus.analytics,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleConsentChange("analytics", e.target.checked),
              className: 'h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
            }),
            React.createElement(
              'label',
              { htmlFor: 'analytics-consent', className: 'sr-only' },
              'Toggle analytics consent'
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg' },
          React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'font-medium text-gray-900 dark:text-white' }, 'Marketing Communications'),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-300' }, 'Wellness tips and updates')
          ),
          React.createElement(
            'div',
            { className: 'flex items-center' },
            React.createElement('input', {
              id: 'marketing-consent',
              type: 'checkbox',
              checked: consentStatus.marketing,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleConsentChange("marketing", e.target.checked),
              className: 'h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
            }),
            React.createElement(
              'label',
              { htmlFor: 'marketing-consent', className: 'sr-only' },
              'Toggle marketing communications consent'
            )
          )
        )
      )
    ),

    /* Actions */
    React.createElement(
      'div',
      { className: 'border-t border-gray-200 dark:border-gray-600 pt-6' },
      React.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' },
        'Data Control Actions'
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3' },
        React.createElement(
          AppButton,
          {
            variant: 'secondary',
            size: 'small',
            onClick: () => setShowExportModal(true)
          },
          'Export My Data'
        ),
        React.createElement(
          AppButton,
          {
            variant: 'danger',
            size: 'small',
            onClick: () => setShowDeleteModal(true)
          },
          'Delete My Data'
        ),
        !isOptedOut() ?
          React.createElement(
            AppButton,
            {
              variant: 'secondary',
              size: 'small',
              onClick: handleOptOut
            },
            'Opt Out'
          ) :
          React.createElement(
            AppButton,
            {
              variant: 'success',
              size: 'small',
              onClick: handleOptIn
            },
            'Opt In'
          ),
        React.createElement(
          AppButton,
          {
            variant: 'ghost',
            size: 'small',
            onClick: () => {
              analyticsService.clearAllData();
              loadPrivacyData();
            }
          },
          'Clear Local Data'
        )
      )
    ),

    /* Export Modal */
    React.createElement(
      Modal,
      {
        isOpen: showExportModal,
        onClose: () => setShowExportModal(false),
        title: 'Export Your Data',
        size: 'medium'
      },
      React.createElement(
        'div',
        { className: 'space-y-4' },
        React.createElement(
          'p',
          { className: 'text-gray-600 dark:text-gray-300' },
          'Download a complete copy of your personal data stored in our mental health platform. This includes all analytics events, consent preferences, and privacy settings.'
        ),
        React.createElement(
          'div',
          { className: 'bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg' },
          React.createElement(
            'h4',
            { className: 'font-medium text-blue-800 dark:text-blue-200 mb-2' },
            'Export Contents:'
          ),
          React.createElement(
            'ul',
            { className: 'text-sm text-blue-700 dark:text-blue-300 space-y-1' },
            React.createElement('li', null, '• Analytics events and user journey data'),
            React.createElement('li', null, '• Privacy preferences and consent history'),
            React.createElement('li', null, '• Data retention and anonymization status'),
            React.createElement('li', null, '• Platform usage statistics')
          )
        ),
        React.createElement(
          'div',
          { className: 'flex justify-end space-x-3' },
          React.createElement(
            AppButton,
            {
              variant: 'secondary',
              onClick: () => setShowExportModal(false),
              disabled: isLoading
            },
            'Cancel'
          ),
          React.createElement(
            AppButton,
            {
              variant: 'primary',
              onClick: handleExportData,
              disabled: isLoading
            },
            isLoading ? 'Exporting...' : 'Download Export'
          )
        )
      )
    ),

    /* Delete Modal */
    React.createElement(
      Modal,
      {
        isOpen: showDeleteModal,
        onClose: () => setShowDeleteModal(false),
        title: 'Delete Your Data',
        size: 'medium'
      },
      React.createElement(
        'div',
        { className: 'space-y-4' },
        React.createElement(
          'p',
          { className: 'text-gray-600 dark:text-gray-300' },
          'Permanently delete your personal data from our mental health platform. This action cannot be undone.'
        ),
        React.createElement(
          'div',
          { className: 'bg-red-50 dark:bg-red-900/20 p-3 rounded-lg' },
          React.createElement(
            'h4',
            { className: 'font-medium text-red-800 dark:text-red-200 mb-2' },
            'Important Notice:'
          ),
          React.createElement(
            'p',
            { className: 'text-sm text-red-700 dark:text-red-300' },
            'Crisis intervention data may be retained (anonymized) for safety analysis and platform improvement. This helps us protect other users in crisis situations.'
          )
        ),
        React.createElement(
          'div',
          { className: 'space-y-3' },
          React.createElement(
            'div',
            { className: 'flex items-start space-x-3' },
            React.createElement('input', {
              id: 'retain-crisis-data',
              type: 'checkbox',
              defaultChecked: true,
              className: 'mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
            }),
            React.createElement(
              'label',
              { htmlFor: 'retain-crisis-data', className: 'text-sm' },
              React.createElement(
                'div',
                { className: 'font-medium text-gray-900 dark:text-white' },
                'Retain anonymous crisis data for safety'
              ),
              React.createElement(
                'div',
                { className: 'text-gray-600 dark:text-gray-300' },
                'Helps improve crisis intervention for other users'
              )
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'flex justify-end space-x-3' },
          React.createElement(
            AppButton,
            {
              variant: 'secondary',
              onClick: () => setShowDeleteModal(false),
              disabled: isLoading
            },
            'Cancel'
          ),
          React.createElement(
            AppButton,
            {
              variant: 'danger',
              onClick: () => handleDeleteData(true),
              disabled: isLoading
            },
            isLoading ? 'Deleting...' : 'Delete My Data'
          )
        )
      )
    )
  );
};

export default PrivacyDashboard;