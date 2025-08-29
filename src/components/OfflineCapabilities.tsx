/**
 * Offline Capabilities Component
 * 
 * Enhanced offline capabilities component for mental health platform
 * Provides crisis-first resource access, safety plans, and therapeutic interventions
 * with full accessibility compliance and robust TypeScript implementation.
 */

import * as React from 'react';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useOffline } from '../contexts/OfflineProvider';
import { OfflineCapability } from '../hooks/useConnectionStatus';
import {
  CheckIcon,
  AlertIcon,
  PhoneIcon,
  MessageCircleIcon,
  SparkleIcon,
  HeartIcon,
  ShieldIcon,
  BookIcon,
  BrainIcon,
  SunIcon,
  MoonIcon,
  ActivityIcon,
  ClockIcon,
  SaveIcon,
  RefreshIcon,
  WarningIcon,
  LockIcon,
  CloseIcon
} from './icons.dynamic';

// ==================== INTERFACES ====================

interface OfflineCapabilitiesProps {
  variant?: 'compact' | 'detailed' | 'list' | 'crisis';
  showActions?: boolean;
  onFeatureClick?: (feature: string) => void;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  prioritizeCrisis?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

interface OfflineFeature {
  id: string;
  name: string;
  description: string;
  available: boolean;
  icon: React.ReactNode;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'crisis' | 'therapeutic' | 'tracking' | 'support' | 'general';
  offlineData?: {
    lastUpdated?: Date;
    dataSize?: number;
    syncPending?: boolean;
  };
  quickActions?: Array<{
    label: string;
    action: () => void;
    icon?: React.ReactNode;
  }>;
  accessibilityLabel?: string;
  accessibilityDescription?: string;
  keyboardShortcut?: string;
}

interface CrisisResource {
  id: string;
  name: string;
  type: 'hotline' | 'text' | 'chat' | 'location';
  contact: string;
  available24_7: boolean;
  description: string;
  priority: number;
}

interface SafetyPlanData {
  warningSignals: string[];
  copingStrategies: string[];
  supportContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
  safeEnvironment: string[];
  professionalContacts: Array<{
    name: string;
    role: string;
    phone: string;
    emergencyAvailable: boolean;
  }>;
  lastUpdated: Date;
}

// ==================== HELPER FUNCTIONS ====================

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'low':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getCategoryIcon = (category: string): React.ReactNode => {
  switch (category) {
    case 'crisis':
      return React.createElement(AlertIcon, { className: "w-5 h-5", 'aria-hidden': "true" });
    case 'therapeutic':
      return React.createElement(HeartIcon, { className: "w-5 h-5", 'aria-hidden': "true" });
    case 'tracking':
      return React.createElement(ActivityIcon, { className: "w-5 h-5", 'aria-hidden': "true" });
    case 'support':
      return React.createElement(MessageCircleIcon, { className: "w-5 h-5", 'aria-hidden': "true" });
    default:
      return React.createElement(SparkleIcon, { className: "w-5 h-5", 'aria-hidden': "true" });
  }
};

const formatDataSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatLastUpdated = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// ==================== MAIN COMPONENT ====================

export const OfflineCapabilities: React.FC<OfflineCapabilitiesProps> = ({
  variant = 'detailed',
  showActions = true,
  onFeatureClick,
  className = '',
  autoRefresh = false,
  refreshInterval = 30000,
  prioritizeCrisis = true,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) => {
  // Context and State
  const {
    connectionStatus,
    updateCrisisResources,
    forceCacheUpdate,
    isFeatureAvailable,
    getOfflineCapability
  } = useOffline();

  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Announcement for screen readers
  const [announcement, setAnnouncement] = useState<string>('');
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== FEATURES CONFIGURATION ====================

  const features: OfflineFeature[] = useMemo(() => {
    const featureList: OfflineFeature[] = [
      {
        id: 'crisis-resources',
        name: 'Crisis Resources',
        description: 'Emergency contacts, hotlines, and immediate coping strategies',
        available: connectionStatus.crisisResourcesAvailable || connectionStatus.isOnline,
        icon: React.createElement(PhoneIcon, { className: "w-5 h-5", 'aria-hidden': "true" }),
        priority: 'critical',
        category: 'crisis',
        offlineData: {
          lastUpdated: lastRefresh,
          dataSize: 524288, // 512KB
          syncPending: false
        },
        quickActions: [
          {
            label: 'Call Crisis Hotline',
            action: () => window.location.href = 'tel:988',
            icon: React.createElement(PhoneIcon, { className: "w-4 h-4", 'aria-hidden': "true" })
          }
        ],
        accessibilityLabel: 'Crisis Resources - Critical Priority',
        accessibilityDescription: 'Access emergency contacts and immediate help',
        keyboardShortcut: 'Alt+C'
      },
      {
        id: 'safety-plan',
        name: 'Safety Plan',
        description: 'Your personal safety plan with warning signs and coping strategies',
        available: isFeatureAvailable('safety-plan'),
        icon: React.createElement(ShieldIcon, { className: "w-5 h-5", 'aria-hidden': "true" }),
        priority: 'critical',
        category: 'crisis',
        offlineData: {
          lastUpdated: lastRefresh,
          dataSize: 102400, // 100KB
          syncPending: false
        },
        accessibilityLabel: 'Safety Plan - Critical Priority',
        accessibilityDescription: 'Access your personalized safety plan',
        keyboardShortcut: 'Alt+S'
      },
      {
        id: 'breathing-exercises',
        name: 'Breathing Exercises',
        description: 'Guided breathing techniques for anxiety and panic management',
        available: isFeatureAvailable('breathing-exercises'),
        icon: React.createElement(ActivityIcon, { className: "w-5 h-5", 'aria-hidden': "true" }),
        priority: 'high',
        category: 'therapeutic',
        offlineData: {
          lastUpdated: lastRefresh,
          dataSize: 204800, // 200KB
          syncPending: false
        },
        quickActions: [
          {
            label: 'Start 4-7-8 Breathing',
            action: () => onFeatureClick?.('breathing-478'),
            icon: React.createElement(ActivityIcon, { className: "w-4 h-4", 'aria-hidden': "true" })
          }
        ],
        accessibilityLabel: 'Breathing Exercises - High Priority',
        accessibilityDescription: 'Access guided breathing exercises for anxiety relief',
        keyboardShortcut: 'Alt+B'
      },
      {
        id: 'grounding-techniques',
        name: 'Grounding Techniques',
        description: '5-4-3-2-1 and other grounding exercises for dissociation and panic',
        available: isFeatureAvailable('grounding-techniques'),
        icon: React.createElement(BrainIcon, { className: "w-5 h-5", 'aria-hidden': "true" }),
        priority: 'high',
        category: 'therapeutic',
        offlineData: {
          lastUpdated: lastRefresh,
          dataSize: 153600, // 150KB
          syncPending: false
        },
        accessibilityLabel: 'Grounding Techniques - High Priority',
        accessibilityDescription: 'Access grounding exercises for panic and dissociation',
        keyboardShortcut: 'Alt+G'
      },
      {
        id: 'coping-strategies',
        name: 'Coping Strategies',
        description: 'Personalized coping techniques and therapeutic interventions',
        available: isFeatureAvailable('coping-strategies'),
        icon: React.createElement(HeartIcon, { className: "w-5 h-5", 'aria-hidden': "true" }),
        priority: 'high',
        category: 'therapeutic',
        offlineData: {
          lastUpdated: lastRefresh,
          dataSize: 307200, // 300KB
          syncPending: false
        },
        accessibilityLabel: 'Coping Strategies - High Priority',
        accessibilityDescription: 'Access personalized coping techniques',
        keyboardShortcut: 'Alt+P'
      },
      {
        id: 'mood-tracking',
        name: 'Mood Tracking',
        description: 'Log your mood and emotional state (syncs when online)',
        available: isFeatureAvailable('mood-tracking'),
        icon: React.createElement(SunIcon, { className: "w-5 h-5", 'aria-hidden': "true" }),
        priority: 'medium',
        category: 'tracking',
        offlineData: {
          lastUpdated: lastRefresh,
          dataSize: 51200, // 50KB
          syncPending: !connectionStatus.isOnline
        },
        accessibilityLabel: 'Mood Tracking - Medium Priority',
        accessibilityDescription: 'Track your mood and emotions offline',
        keyboardShortcut: 'Alt+M'
      },
      {
        id: 'journal-entries',
        name: 'Journal Entries',
        description: 'Write and access your journal entries offline',
        available: isFeatureAvailable('journal-entries'),
        icon: React.createElement(BookIcon, { className: "w-5 h-5", 'aria-hidden': "true" }),
        priority: 'medium',
        category: 'therapeutic',
        offlineData: {
          lastUpdated: lastRefresh,
          dataSize: 409600, // 400KB
          syncPending: !connectionStatus.isOnline
        },
        accessibilityLabel: 'Journal Entries - Medium Priority',
        accessibilityDescription: 'Access and write journal entries offline',
        keyboardShortcut: 'Alt+J'
      },
      {
        id: 'support-contacts',
        name: 'Support Contacts',
        description: 'Access your trusted support network contacts',
        available: isFeatureAvailable('support-contacts'),
        icon: React.createElement(MessageCircleIcon, { className: "w-5 h-5", 'aria-hidden': "true" }),
        priority: 'high',
        category: 'support',
        offlineData: {
          lastUpdated: lastRefresh,
          dataSize: 25600, // 25KB
          syncPending: false
        },
        accessibilityLabel: 'Support Contacts - High Priority',
        accessibilityDescription: 'Access your support network contacts',
        keyboardShortcut: 'Alt+N'
      }
    ];

    // Sort by priority if crisis prioritization is enabled
    if (prioritizeCrisis) {
      const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return featureList.sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    }

    return featureList;
  }, [
    connectionStatus.crisisResourcesAvailable,
    connectionStatus.isOnline,
    isFeatureAvailable,
    lastRefresh,
    onFeatureClick,
    prioritizeCrisis
  ]);

  // ==================== EVENT HANDLERS ====================

  const handleFeatureClick = useCallback((feature: OfflineFeature) => {
    if (!feature.available) {
      setAnnouncement(`${feature.name} is not available offline. Please connect to the internet to access this feature.`);
      return;
    }

    if (expandedFeature === feature.id) {
      setExpandedFeature(null);
      setAnnouncement(`${feature.name} details collapsed`);
    } else {
      setExpandedFeature(feature.id);
      setAnnouncement(`${feature.name} details expanded. ${feature.accessibilityDescription || feature.description}`);
    }

    if (onFeatureClick) {
      onFeatureClick(feature.id);
    }

    // Clear announcement after 3 seconds
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    announcementTimeoutRef.current = setTimeout(() => {
      setAnnouncement('');
    }, 3000);
  }, [expandedFeature, onFeatureClick]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setAnnouncement('Refreshing offline capabilities...');
    
    try {
      // Update crisis resources first (highest priority)
      await updateCrisisResources();
      
      // Force cache update for all resources
      await forceCacheUpdate();
      
      setLastRefresh(new Date());
      setAnnouncement('Offline capabilities refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh offline capabilities:', error);
      setAnnouncement('Failed to refresh offline capabilities. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [updateCrisisResources, forceCacheUpdate]);

  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) return;

    const feature = features.find(f => 
      f.keyboardShortcut === `Alt+${e.key.toUpperCase()}`
    );

    if (feature && feature.available) {
      e.preventDefault();
      handleFeatureClick(feature);
    }
  }, [features, handleFeatureClick]);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        handleRefresh();
      }, refreshInterval);

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, handleRefresh]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [handleKeyboardShortcut]);

  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, []);

  // ==================== RENDER VARIANTS ====================

  // Crisis variant - Emergency focused view
  if (variant === 'crisis') {
    const crisisFeatures = features.filter(f => f.priority === 'critical');
    
    return React.createElement('div', {
      className: `p-4 bg-red-50 border-2 border-red-300 rounded-lg ${className}`,
      role: "region",
      'aria-label': ariaLabel || "Crisis resources and emergency features",
      'aria-describedby': ariaDescribedBy
    }, 
      React.createElement('div', { className: "flex items-center justify-between mb-3" },
        React.createElement('div', { className: "flex items-center space-x-2" },
          React.createElement(AlertIcon, { className: "w-6 h-6 text-red-600", 'aria-hidden': "true" }),
          React.createElement('h2', { className: "text-lg font-bold text-red-900" }, "Emergency Resources")
        ),
        React.createElement('button', {
          onClick: () => window.location.href = 'tel:988',
          className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
          'aria-label': "Call 988 Crisis Hotline"
        },
          React.createElement(PhoneIcon, { className: "inline-block w-4 h-4 mr-2", 'aria-hidden': "true" }),
          "Call 988"
        )
      ),
      React.createElement('div', { className: "space-y-2" },
        crisisFeatures.map((feature) =>
          React.createElement('button', {
            key: feature.id,
            onClick: () => handleFeatureClick(feature),
            disabled: !feature.available,
            className: `w-full p-3 text-left rounded-lg transition-colors ${
              feature.available
                ? 'bg-white hover:bg-red-100 cursor-pointer'
                : 'bg-gray-100 cursor-not-allowed opacity-50'
            }`,
            'aria-label': feature.accessibilityLabel,
            'aria-describedby': `${feature.id}-desc`
          },
            React.createElement('div', { className: "flex items-center justify-between" },
              React.createElement('div', { className: "flex items-center space-x-3" },
                React.createElement('div', { className: "text-red-600" }, feature.icon),
                React.createElement('div', {},
                  React.createElement('h3', { className: "font-semibold text-gray-900" }, feature.name),
                  React.createElement('p', { id: `${feature.id}-desc`, className: "text-sm text-gray-600" },
                    feature.description
                  )
                )
              ),
              feature.available && React.createElement(CheckIcon, { className: "w-5 h-5 text-green-600", 'aria-hidden': "true" })
            )
          )
        )
      )
    );
  }

  // Compact variant - Minimal status indicator
  if (variant === 'compact') {
    const availableCount = features.filter(f => f.available).length;
    const criticalAvailable = features.filter(f => f.priority === 'critical' && f.available).length;
    
    return React.createElement('div', {
      className: `inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 ${className}`,
      role: "status",
      'aria-label': ariaLabel || "Offline capabilities status",
      'aria-live': "polite"
    },
      React.createElement('div', { className: "flex items-center space-x-1" },
        criticalAvailable === features.filter(f => f.priority === 'critical').length ?
          React.createElement(CheckIcon, { className: "w-4 h-4 text-green-600", 'aria-hidden': "true" }) :
          React.createElement(WarningIcon, { className: "w-4 h-4 text-amber-600", 'aria-hidden': "true" }),
        React.createElement('span', { className: "text-sm font-medium" },
          `${availableCount}/${features.length} features available`
        )
      ),
      criticalAvailable > 0 && React.createElement('div', { 
        className: "px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full" 
      }, "Crisis Support Ready"),
      !connectionStatus.isOnline && React.createElement('div', { 
        className: "px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full" 
      }, "Offline Mode")
    );
  }

  // List variant - Simple list view
  if (variant === 'list') {
    return React.createElement('div', {
      className: `space-y-2 ${className}`,
      role: "region",
      'aria-label': ariaLabel || "Offline capabilities list"
    },
      React.createElement('div', { className: "flex items-center justify-between" },
        React.createElement('h3', { className: "text-lg font-semibold text-gray-900" }, "Offline Capabilities"),
        showActions && React.createElement('button', {
          onClick: handleRefresh,
          disabled: isRefreshing,
          className: "p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50",
          'aria-label': "Refresh offline capabilities"
        },
          React.createElement(RefreshIcon, {
            className: `w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`,
            'aria-hidden': "true"
          })
        )
      ),
      React.createElement('div', { className: "space-y-1", role: "list" },
        features.map((feature) =>
          React.createElement('div', {
            key: feature.id,
            className: `flex items-center justify-between p-2 rounded-lg border ${
              feature.available
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`,
            onClick: () => feature.available && handleFeatureClick(feature),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                feature.available && handleFeatureClick(feature);
              }
            },
            role: "listitem",
            tabIndex: feature.available ? 0 : -1,
            'aria-label': feature.accessibilityLabel,
            'aria-describedby': `${feature.id}-list-desc`
          },
            React.createElement('div', { className: "flex items-center space-x-3" },
              React.createElement('div', { 
                className: feature.available ? 'text-green-600' : 'text-gray-400' 
              }, feature.icon),
              React.createElement('div', {},
                React.createElement('span', {
                  className: `text-sm font-medium ${
                    feature.available ? 'text-gray-900' : 'text-gray-500'
                  }`
                }, feature.name),
                React.createElement('span', { 
                  id: `${feature.id}-list-desc`, 
                  className: "sr-only" 
                }, feature.description)
              )
            ),
            React.createElement('div', { className: "flex items-center space-x-2" },
              feature.offlineData?.syncPending && React.createElement('span', { 
                className: "text-xs text-amber-600" 
              }, "Sync pending"),
              feature.available ?
                React.createElement(CheckIcon, { className: "w-4 h-4 text-green-600", 'aria-hidden': "true" }) :
                React.createElement(LockIcon, { className: "w-4 h-4 text-gray-400", 'aria-hidden': "true" })
            )
          )
        )
      )
    );
  }

  // Detailed variant - Full feature cards (default)
  return React.createElement('div', {
    className: `space-y-4 ${className}`,
    role: "region",
    'aria-label': ariaLabel || "Detailed offline capabilities view"
  },
    // Screen reader announcements
    React.createElement('div', { 
      className: "sr-only", 
      role: "status", 
      'aria-live': "polite", 
      'aria-atomic': "true" 
    }, announcement),

    // Header
    React.createElement('div', { className: "flex items-center justify-between" },
      React.createElement('h3', { className: "text-lg font-semibold text-gray-900" }, 
        "Available Offline Features"
      ),
      React.createElement('div', { className: "flex items-center space-x-3" },
        showActions && React.createElement('button', {
          onClick: handleRefresh,
          disabled: isRefreshing,
          className: "p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
          'aria-label': "Refresh offline capabilities"
        },
          React.createElement(RefreshIcon, {
            className: `w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`,
            'aria-hidden': "true"
          })
        ),
        React.createElement('div', { className: "flex items-center space-x-2 text-sm text-gray-600" },
          React.createElement('div', {
            className: `w-2 h-2 rounded-full ${
              connectionStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
            }`,
            'aria-hidden': "true"
          }),
          React.createElement('span', {}, connectionStatus.isOnline ? 'Online' : 'Offline')
        )
      )
    ),

    // Feature Cards
    React.createElement('div', { className: "grid gap-3", role: "list" },
      features.map((feature) =>
        React.createElement('div', {
          key: feature.id,
          className: `border rounded-lg transition-all duration-200 ${
            feature.available
              ? 'bg-white border-gray-200 hover:border-gray-300'
              : 'bg-gray-50 border-gray-200 opacity-75'
          }`,
          role: "listitem"
        },
          React.createElement('div', {
            className: `p-4 ${
              feature.available && (onFeatureClick || variant === 'detailed')
                ? 'cursor-pointer'
                : 'cursor-default'
            }`,
            onClick: () => feature.available && handleFeatureClick(feature),
            onKeyDown: (e: React.KeyboardEvent) => {
              if ((e.key === 'Enter' || e.key === ' ') && feature.available) {
                e.preventDefault();
                handleFeatureClick(feature);
              }
            },
            tabIndex: feature.available ? 0 : -1,
            role: "button",
            'aria-expanded': expandedFeature === feature.id,
            'aria-label': feature.accessibilityLabel,
            'aria-describedby': `${feature.id}-detailed-desc`
          },
            React.createElement('div', { className: "flex items-start justify-between" },
              React.createElement('div', { className: "flex items-start space-x-3 flex-1" },
                React.createElement('div', {
                  className: `mt-0.5 ${
                    feature.available 
                      ? getPriorityColor(feature.priority).split(' ')[0] 
                      : 'text-gray-400'
                  }`
                }, feature.icon),
                React.createElement('div', { className: "flex-1" },
                  React.createElement('div', { className: "flex items-center space-x-2 flex-wrap" },
                    React.createElement('h4', {
                      className: `font-medium ${
                        feature.available ? 'text-gray-900' : 'text-gray-500'
                      }`
                    }, feature.name),
                    React.createElement('span', {
                      className: `px-2 py-1 text-xs rounded-full border ${
                        getPriorityColor(feature.priority)
                      }`
                    }, feature.priority),
                    feature.keyboardShortcut && React.createElement('kbd', {
                      className: "px-2 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded"
                    }, feature.keyboardShortcut)
                  ),
                  React.createElement('p', {
                    id: `${feature.id}-detailed-desc`,
                    className: `mt-1 text-sm ${
                      feature.available ? 'text-gray-600' : 'text-gray-400'
                    }`
                  }, feature.description),
                  feature.offlineData && React.createElement('div', {
                    className: "mt-2 flex items-center space-x-3 text-xs text-gray-500"
                  },
                    feature.offlineData.lastUpdated && React.createElement('span', {},
                      `Updated ${formatLastUpdated(feature.offlineData.lastUpdated)}`
                    ),
                    feature.offlineData.dataSize && React.createElement('span', {},
                      formatDataSize(feature.offlineData.dataSize)
                    ),
                    feature.offlineData.syncPending && React.createElement('span', {
                      className: "text-amber-600"
                    },
                      React.createElement(SaveIcon, { className: "inline w-3 h-3 mr-1", 'aria-hidden': "true" }),
                      "Sync pending"
                    )
                  )
                )
              ),
              React.createElement('div', { className: "flex items-center space-x-2 ml-4" },
                feature.available ?
                  React.createElement(CheckIcon, {
                    className: "w-5 h-5 text-green-600",
                    'aria-label': "Feature available"
                  }) :
                  React.createElement(LockIcon, {
                    className: "w-5 h-5 text-gray-400",
                    'aria-label': "Feature unavailable offline"
                  })
              )
            ),

            // Expanded content
            expandedFeature === feature.id && feature.available && React.createElement('div', {
              className: "mt-3 pt-3 border-t border-gray-100",
              role: "region",
              'aria-label': `${feature.name} details`
            },
              React.createElement('div', { className: "space-y-3 text-sm text-gray-600" },
                React.createElement('div', {},
                  React.createElement('p', { className: "font-medium text-gray-700" }, "Status"),
                  React.createElement('p', { className: "mt-1" }, "Available offline with full functionality")
                ),
                
                feature.id === 'crisis-resources' && React.createElement('div', {},
                  React.createElement('p', { className: "font-medium text-gray-700" }, "Emergency Resources Include:"),
                  React.createElement('ul', { className: "mt-1 ml-4 space-y-1 list-disc", role: "list" },
                    React.createElement('li', {}, "988 Suicide & Crisis Lifeline (24/7)"),
                    React.createElement('li', {}, "Crisis Text Line: Text HOME to 741741"),
                    React.createElement('li', {}, "Emergency Contact Information"),
                    React.createElement('li', {}, "Immediate Grounding Techniques"),
                    React.createElement('li', {}, "Local Crisis Centers & Walk-in Clinics")
                  )
                ),
                
                feature.id === 'safety-plan' && React.createElement('div', {},
                  React.createElement('p', { className: "font-medium text-gray-700" }, "Safety Plan Components:"),
                  React.createElement('ul', { className: "mt-1 ml-4 space-y-1 list-disc", role: "list" },
                    React.createElement('li', {}, "Warning Signs Recognition"),
                    React.createElement('li', {}, "Personal Coping Strategies"),
                    React.createElement('li', {}, "Support Network Contacts"),
                    React.createElement('li', {}, "Professional Resources"),
                    React.createElement('li', {}, "Environmental Safety Steps")
                  )
                ),
                
                (feature.category === 'tracking') && React.createElement('p', { className: "text-amber-600" },
                  React.createElement(SaveIcon, { className: "inline w-4 h-4 mr-1", 'aria-hidden': "true" }),
                  "Data will automatically sync when connection is restored"
                ),
                
                // Quick Actions
                feature.quickActions && feature.quickActions.length > 0 && React.createElement('div', {},
                  React.createElement('p', { className: "font-medium text-gray-700 mb-2" }, "Quick Actions:"),
                  React.createElement('div', { className: "flex flex-wrap gap-2" },
                    feature.quickActions.map((action, index) =>
                      React.createElement('button', {
                        key: index,
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          action.action();
                        },
                        className: "inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                        'aria-label': action.label
                      },
                        action.icon,
                        React.createElement('span', { className: "ml-1" }, action.label)
                      )
                    )
                  )
                ),
                
                showActions && onFeatureClick && React.createElement('div', { className: "mt-3 pt-2 border-t border-gray-100" },
                  React.createElement('button', {
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      onFeatureClick(feature.id);
                    },
                    className: "text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:underline",
                    'aria-label': `Open ${feature.name}`
                  }, `Access ${feature.name} →`)
                )
              )
            )
          )
        )
      )
    ),

    // Status Messages
    !connectionStatus.isOnline && React.createElement('div', {
      className: "mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg",
      role: "alert"
    },
      React.createElement('div', { className: "flex items-start space-x-2" },
        React.createElement(WarningIcon, { className: "w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0", 'aria-hidden': "true" }),
        React.createElement('div', { className: "text-sm text-amber-800" },
          React.createElement('p', { className: "font-medium" }, "Offline Mode Active"),
          React.createElement('p', { className: "mt-1" },
            "You're currently offline. Critical mental health resources and your safety plan " +
            "remain fully accessible. Other features may have limited functionality. " +
            "Your data will sync automatically when connection is restored."
          )
        )
      )
    ),
    
    connectionStatus.isOnline && !connectionStatus.crisisResourcesAvailable && React.createElement('div', {
      className: "mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg",
      role: "alert"
    },
      React.createElement('div', { className: "flex items-start space-x-2" },
        React.createElement(WarningIcon, { className: "w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0", 'aria-hidden': "true" }),
        React.createElement('div', { className: "text-sm text-yellow-800" },
          React.createElement('p', { className: "font-medium" }, "Crisis Resources Unavailable"),
          React.createElement('p', { className: "mt-1" },
            "Crisis resources are temporarily unavailable offline. Please refresh to download " +
            "the latest emergency resources for offline access."
          ),
          React.createElement('button', {
            onClick: handleRefresh,
            className: "mt-2 text-yellow-700 hover:text-yellow-800 font-medium underline focus:outline-none",
            'aria-label': "Refresh crisis resources"
          }, "Refresh Crisis Resources")
        )
      )
    )
  );
};

// ==================== DEFAULT EXPORT ====================

export default OfflineCapabilities;