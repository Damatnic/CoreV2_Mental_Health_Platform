/**
 * Card Component
 * Flexible card component for displaying various types of content
 */

import * as React from 'react';
import { ReactNode } from 'react';

// Core interfaces
export interface CardProps {
  children?: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  hover?: boolean;
  interactive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'data-testid'?: string;
}

export interface ActionCardProps extends CardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
  }>;
  badge?: {
    text: string;
    variant?: 'info' | 'success' | 'warning' | 'error';
  };
}

export interface StatCardProps extends CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

export interface InfoCardProps extends CardProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

// Utility functions
export const getVariantClasses = (variant: string): string => {
  const variants = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-md',
    outlined: 'bg-transparent border-2 border-gray-300',
    filled: 'bg-gray-50 border border-gray-200'
  };
  return variants[variant as keyof typeof variants] || variants.default;
};

export const getSizeClasses = (size: string): string => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  return sizes[size as keyof typeof sizes] || sizes.md;
};

export const getPaddingClasses = (padding: string): string => {
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  return paddings[padding as keyof typeof paddings] || paddings.md;
};

export const getRoundedClasses = (rounded: string): string => {
  const roundeds = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };
  return roundeds[rounded as keyof typeof roundeds] || roundeds.md;
};

export const getShadowClasses = (shadow: string): string => {
  const shadows = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };
  return shadows[shadow as keyof typeof shadows] || shadows.none;
};

export const getColorClasses = (color: string): string => {
  const colors = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    green: 'border-green-200 bg-green-50 text-green-900',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    purple: 'border-purple-200 bg-purple-50 text-purple-900',
    gray: 'border-gray-200 bg-gray-50 text-gray-900'
  };
  return colors[color as keyof typeof colors] || colors.gray;
};

export const getTypeClasses = (type: string): string => {
  const types = {
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    success: 'border-green-200 bg-green-50 text-green-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    error: 'border-red-200 bg-red-50 text-red-900'
  };
  return types[type as keyof typeof types] || types.info;
};

// Main Card component
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  padding = 'md',
  rounded = 'md',
  shadow = 'none',
  border = false,
  hover = false,
  interactive = false,
  disabled = false,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  ...props
}) => {
  const baseClasses = [
    'transition-all duration-200',
    getVariantClasses(variant),
    getSizeClasses(size),
    getPaddingClasses(padding),
    getRoundedClasses(rounded),
    getShadowClasses(shadow)
  ];

  if (border) {
    baseClasses.push('border');
  }

  if (hover) {
    baseClasses.push('hover:shadow-lg hover:scale-105');
  }

  if (interactive) {
    baseClasses.push('cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500');
  }

  if (disabled) {
    baseClasses.push('opacity-50 cursor-not-allowed');
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
    if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return React.createElement('div', {
    className: `${baseClasses.join(' ')} ${className}`,
    onClick: disabled ? undefined : onClick,
    onKeyDown: handleKeyDown,
    role: interactive ? (role || 'button') : role,
    tabIndex: interactive ? (tabIndex || 0) : tabIndex,
    'aria-label': ariaLabel,
    'aria-disabled': disabled,
    'data-testid': dataTestId,
    ...props
  }, children);
};

// Action Card component
export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  actions = [],
  badge,
  ...cardProps
}) => {
  return React.createElement(Card, {
    ...cardProps,
    className: `action-card ${cardProps.className || ''}`
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      className: 'flex items-start justify-between mb-4'
    }, [
      React.createElement('div', {
        key: 'title-section',
        className: 'flex items-center space-x-3'
      }, [
        icon && React.createElement('div', {
          key: 'icon',
          className: 'flex-shrink-0'
        }, icon),
        React.createElement('div', { key: 'text' }, [
          React.createElement('h3', {
            key: 'title',
            className: 'text-lg font-semibold text-gray-900'
          }, title),
          description && React.createElement('p', {
            key: 'description',
            className: 'text-sm text-gray-600 mt-1'
          }, description)
        ])
      ]),
      badge && React.createElement('span', {
        key: 'badge',
        className: `px-2 py-1 text-xs font-medium rounded-full ${getTypeClasses(badge.variant || 'info')}`
      }, badge.text)
    ]),
    // Actions
    actions.length > 0 && React.createElement('div', {
      key: 'actions',
      className: 'flex flex-wrap gap-2'
    }, actions.map((action, index) =>
      React.createElement('button', {
        key: index,
        onClick: action.onClick,
        disabled: action.disabled,
        className: `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          action.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
          action.variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
          'bg-gray-200 text-gray-900 hover:bg-gray-300'
        } disabled:opacity-50 disabled:cursor-not-allowed`
      }, action.label)
    ))
  ]);
};

// Stat Card component
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'gray',
  ...cardProps
}) => {
  return React.createElement(Card, {
    ...cardProps,
    className: `stat-card ${getColorClasses(color)} ${cardProps.className || ''}`
  }, [
    React.createElement('div', {
      key: 'content',
      className: 'flex items-center justify-between'
    }, [
      React.createElement('div', { key: 'text' }, [
        React.createElement('p', {
          key: 'title',
          className: 'text-sm font-medium opacity-75'
        }, title),
        React.createElement('p', {
          key: 'value',
          className: 'text-2xl font-bold mt-2'
        }, value),
        subtitle && React.createElement('p', {
          key: 'subtitle',
          className: 'text-sm opacity-60 mt-1'
        }, subtitle),
        trend && React.createElement('div', {
          key: 'trend',
          className: `flex items-center mt-2 text-sm ${
            trend.direction === 'up' ? 'text-green-600' :
            trend.direction === 'down' ? 'text-red-600' :
            'text-gray-600'
          }`
        }, [
          React.createElement('span', { key: 'trend-value' }, 
            `${trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}${Math.abs(trend.value)}%`
          ),
          trend.label && React.createElement('span', {
            key: 'trend-label',
            className: 'ml-1'
          }, trend.label)
        ])
      ]),
      icon && React.createElement('div', {
        key: 'icon',
        className: 'flex-shrink-0 opacity-75'
      }, icon)
    ])
  ]);
};

// Info Card component
export const InfoCard: React.FC<InfoCardProps> = ({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  actions = [],
  ...cardProps
}) => {
  return React.createElement(Card, {
    ...cardProps,
    className: `info-card ${getTypeClasses(type)} ${cardProps.className || ''}`
  }, [
    React.createElement('div', {
      key: 'content',
      className: 'flex items-start justify-between'
    }, [
      React.createElement('div', {
        key: 'text',
        className: 'flex-1'
      }, [
        React.createElement('h4', {
          key: 'title',
          className: 'font-semibold'
        }, title),
        React.createElement('p', {
          key: 'message',
          className: 'mt-1 text-sm opacity-90'
        }, message)
      ]),
      dismissible && onDismiss && React.createElement('button', {
        key: 'dismiss',
        onClick: onDismiss,
        className: 'ml-4 text-lg opacity-60 hover:opacity-100 transition-opacity',
        'aria-label': 'Dismiss'
      }, '×')
    ]),
    actions.length > 0 && React.createElement('div', {
      key: 'actions',
      className: 'mt-4 flex gap-2'
    }, actions.map((action, index) =>
      React.createElement('button', {
        key: index,
        onClick: action.onClick,
        className: 'text-sm font-medium underline hover:no-underline transition-all'
      }, action.label)
    ))
  ]);
};

// Default export
export default Card;










