/**
 * Crisis Alert Fixed Component
 * Emergency alert system for mental health crisis situations
 */

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

// Core interfaces
export interface CrisisAlertFixedProps {
  isVisible: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  onClose?: () => void;
  onContactSupport?: () => void;
  onCallEmergency?: () => void;
  userLocation?: {
    country: string;
    region?: string;
  };
  autoHide?: boolean;
  hideDelay?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed' | 'minimal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  position?: 'top' | 'bottom' | 'center' | 'fullscreen';
  showEmergencyContacts?: boolean;
  showCrisisResources?: boolean;
  showSafetyTips?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  animation?: 'slide' | 'fade' | 'scale' | 'none';
  persistent?: boolean;
  dismissible?: boolean;
  onEscalate?: () => void;
  escalationLevel?: 'none' | 'moderate' | 'high' | 'immediate';
}

export interface EmergencyContact {
  type: 'crisis' | 'suicide' | 'emergency' | 'text';
  label: string;
  number: string;
  description: string;
  available: string;
  priority: number;
}

export interface CrisisResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'hotline' | 'website' | 'app' | 'support-group';
  available: string;
  cost: 'free' | 'low-cost' | 'insurance-covered';
}

export interface SafetyTip {
  id: string;
  title: string;
  description: string;
  category: 'immediate' | 'short-term' | 'long-term';
  priority: number;
}

// Default emergency contacts
export const DEFAULT_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    type: 'suicide',
    label: 'National Suicide Prevention Lifeline',
    number: '988',
    description: 'Free, confidential support 24/7',
    available: '24/7',
    priority: 1
  },
  {
    type: 'crisis',
    label: 'Crisis Text Line',
    number: '741741',
    description: 'Text HOME to 741741',
    available: '24/7',
    priority: 2
  },
  {
    type: 'emergency',
    label: 'Emergency Services',
    number: '911',
    description: 'For immediate life-threatening emergencies',
    available: '24/7',
    priority: 3
  }
];

// Default crisis resources
export const DEFAULT_CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'samhsa',
    title: 'SAMHSA National Helpline',
    description: 'Treatment referral and information service',
    url: 'https://www.samhsa.gov/find-help/national-helpline',
    type: 'hotline',
    available: '24/7',
    cost: 'free'
  },
  {
    id: 'nami',
    title: 'NAMI Support Groups',
    description: 'Peer support groups for mental health',
    url: 'https://www.nami.org/Support-Education/Support-Groups',
    type: 'support-group',
    available: 'Varies',
    cost: 'free'
  }
];

// Default safety tips
export const DEFAULT_SAFETY_TIPS: SafetyTip[] = [
  {
    id: 'breathe',
    title: 'Focus on Your Breathing',
    description: 'Take slow, deep breaths. Inhale for 4, hold for 4, exhale for 6.',
    category: 'immediate',
    priority: 1
  },
  {
    id: 'grounding',
    title: '5-4-3-2-1 Grounding',
    description: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
    category: 'immediate',
    priority: 2
  },
  {
    id: 'safe-space',
    title: 'Find a Safe Space',
    description: 'Move to a comfortable, safe environment where you feel secure.',
    category: 'immediate',
    priority: 3
  }
];

// Utility functions
export const getSeverityClasses = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'bg-red-600 text-white border-red-700';
    case 'high': return 'bg-orange-500 text-white border-orange-600';
    case 'medium': return 'bg-yellow-500 text-white border-yellow-600';
    case 'low': return 'bg-blue-500 text-white border-blue-600';
    default: return 'bg-gray-500 text-white border-gray-600';
  }
};

export const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '⚡';
    case 'low': return '🛡️';
    default: return '🛡️';
  }
};

export const getSizeClasses = (size: string): string => {
  switch (size) {
    case 'xs': return 'text-xs px-3 py-2';
    case 'sm': return 'text-sm px-4 py-3';
    case 'md': return 'text-base px-5 py-4';
    case 'lg': return 'text-lg px-6 py-5';
    case 'xl': return 'text-xl px-8 py-6';
    default: return 'text-base px-5 py-4';
  }
};

export const getVariantClasses = (variant: string): string => {
  switch (variant) {
    case 'compact': return 'rounded-md shadow-sm';
    case 'detailed': return 'rounded-lg shadow-lg';
    case 'minimal': return 'rounded-full shadow-sm';
    default: return 'rounded-lg shadow-md';
  }
};

export const getPositionClasses = (position: string): string => {
  switch (position) {
    case 'top': return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50';
    case 'bottom': return 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50';
    case 'center': return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50';
    case 'fullscreen': return 'fixed inset-0 z-50';
    default: return 'fixed top-4 right-4 z-50';
  }
};

export const getAnimationClasses = (animation: string): string => {
  switch (animation) {
    case 'slide': return 'animate-slide-in';
    case 'fade': return 'animate-fade-in';
    case 'scale': return 'animate-scale-in';
    case 'none': return '';
    default: return 'animate-fade-in';
  }
};

export const formatPhoneNumber = (number: string): string => {
  // Format phone numbers for display
  if (number === '988' || number === '911') return number;
  if (number === '741741') return 'Text HOME to 741741';
  
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return number;
};

export const getContactTypeIcon = (type: string): string => {
  switch (type) {
    case 'crisis': return '🆘';
    case 'suicide': return '☎️';
    case 'emergency': return '🚨';
    case 'text': return '💬';
    default: return '📞';
  }
};

export const getPriorityColor = (priority: number): string => {
  if (priority <= 1) return 'text-red-600 font-bold';
  if (priority <= 2) return 'text-orange-600 font-semibold';
  if (priority <= 3) return 'text-yellow-600';
  return 'text-gray-600';
};

export const shouldAutoHide = (severity: string): boolean => {
  return severity === 'low' || severity === 'medium';
};

export const getDefaultMessage = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'This is a mental health crisis alert. Please reach out for immediate help.';
    case 'high':
      return 'You may be experiencing significant distress. Support is available.';
    case 'medium':
      return 'It looks like you might need some support right now.';
    case 'low':
      return 'Remember that help is always available when you need it.';
    default:
      return 'Mental health support is available 24/7.';
  }
};

export const trackCrisisEvent = (severity: string, action: string): void => {
  // Track crisis events for analytics (privacy-compliant)
  console.log(`Crisis Alert: ${severity} - ${action}`);
};

export const validateCrisisAlert = (props: CrisisAlertFixedProps): string[] => {
  const errors: string[] = [];
  
  if (!props.severity) {
    errors.push('Severity level is required');
  }
  
  if (props.hideDelay && props.hideDelay < 1000) {
    errors.push('Hide delay should be at least 1000ms for accessibility');
  }
  
  if (props.severity === 'critical' && props.autoHide) {
    errors.push('Critical alerts should not auto-hide');
  }
  
  return errors;
};

export const getCrisisGuidance = (severity: string): {
  title: string;
  steps: string[];
  urgency: 'immediate' | 'soon' | 'when-ready';
} => {
  switch (severity) {
    case 'critical':
      return {
        title: 'Immediate Action Required',
        steps: [
          'Call 988 (Suicide Prevention Lifeline) now',
          'If in immediate danger, call 911',
          'Stay with someone you trust',
          'Remove access to means of harm'
        ],
        urgency: 'immediate'
      };
    case 'high':
      return {
        title: 'Seek Support Soon',
        steps: [
          'Contact your therapist or counselor',
          'Call a crisis helpline for support',
          'Reach out to a trusted friend or family member',
          'Use coping strategies you\'ve learned'
        ],
        urgency: 'soon'
      };
    case 'medium':
      return {
        title: 'Self-Care and Support',
        steps: [
          'Try grounding techniques',
          'Practice deep breathing',
          'Consider reaching out to someone',
          'Engage in a comforting activity'
        ],
        urgency: 'when-ready'
      };
    default:
      return {
        title: 'Wellness Check',
        steps: [
          'Take a moment to check in with yourself',
          'Practice mindfulness or meditation',
          'Connect with supportive people',
          'Maintain healthy routines'
        ],
        urgency: 'when-ready'
      };
  }
};

// Mock component for compatibility (since we can't use JSX)
export const CrisisAlertFixed = {
  displayName: 'CrisisAlertFixed',
  defaultProps: {
    severity: 'medium' as const,
    variant: 'default' as const,
    size: 'md' as const,
    position: 'top' as const,
    animation: 'fade' as const,
    theme: 'light' as const,
    showEmergencyContacts: true,
    showCrisisResources: true,
    showSafetyTips: true,
    persistent: false,
    dismissible: true,
    autoHide: false,
    hideDelay: 5000
  },
  
  // Mock render function
  render: (props: CrisisAlertFixedProps) => {
    if (!props.isVisible) return null;
    
    const severityClasses = getSeverityClasses(props.severity);
    const sizeClasses = getSizeClasses(props.size || 'md');
    const variantClasses = getVariantClasses(props.variant || 'default');
    const positionClasses = getPositionClasses(props.position || 'top');
    const animationClasses = getAnimationClasses(props.animation || 'fade');
    
    return {
      type: 'div',
      props: {
        className: `crisis-alert-fixed ${severityClasses} ${sizeClasses} ${variantClasses} ${positionClasses} ${animationClasses} ${props.className || ''}`,
        role: 'alert',
        'aria-live': 'assertive',
        children: [
          {
            type: 'div',
            props: {
              className: 'crisis-alert-header flex items-center justify-between',
              children: [
                {
                  type: 'div',
                  props: {
                    className: 'flex items-center space-x-2',
                    children: [
                      {
                        type: 'span',
                        props: {
                          className: 'crisis-icon text-2xl',
                          children: getSeverityIcon(props.severity)
                        }
                      },
                      {
                        type: 'span',
                        props: {
                          className: 'crisis-title font-bold',
                          children: 'Crisis Alert'
                        }
                      }
                    ]
                  }
                },
                props.dismissible && {
                  type: 'button',
                  props: {
                    onClick: props.onClose,
                    className: 'close-button text-xl opacity-70 hover:opacity-100',
                    'aria-label': 'Close alert',
                    children: '×'
                  }
                }
              ].filter(Boolean)
            }
          },
          {
            type: 'div',
            props: {
              className: 'crisis-alert-content mt-4',
              children: [
                {
                  type: 'p',
                  props: {
                    className: 'crisis-message',
                    children: props.message || getDefaultMessage(props.severity)
                  }
                },
                props.showEmergencyContacts && {
                  type: 'div',
                  props: {
                    className: 'emergency-contacts mt-4',
                    children: [
                      {
                        type: 'h4',
                        props: {
                          className: 'font-semibold mb-2',
                          children: 'Emergency Contacts'
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          className: 'contacts-list space-y-2',
                          children: DEFAULT_EMERGENCY_CONTACTS.slice(0, 2).map((contact, index) => ({
                            type: 'div',
                            key: index,
                            props: {
                              className: 'contact-item flex items-center justify-between p-2 bg-black bg-opacity-20 rounded',
                              children: [
                                {
                                  type: 'div',
                                  props: {
                                    children: [
                                      {
                                        type: 'span',
                                        props: {
                                          className: 'contact-icon mr-2',
                                          children: getContactTypeIcon(contact.type)
                                        }
                                      },
                                      {
                                        type: 'span',
                                        props: {
                                          className: 'contact-label font-medium',
                                          children: contact.label
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  type: 'button',
                                  props: {
                                    onClick: () => window.open(`tel:${contact.number}`),
                                    className: 'call-button bg-white text-black px-3 py-1 rounded font-medium hover:bg-gray-100',
                                    children: formatPhoneNumber(contact.number)
                                  }
                                }
                              ]
                            }
                          }))
                        }
                      }
                    ]
                  }
                }
              ].filter(Boolean)
            }
          }
        ]
      }
    };
  }
};

export default CrisisAlertFixed;












