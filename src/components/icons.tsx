/**
 * Icon System for Mental Health Platform
 * Centralized icon management with mental health-specific components
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  Frown,
  Meh,
  Smile,
  Laugh,
  Brain,
  MessageSquare,
  Wind,
  Activity,
  Moon,
  BookOpen,
  Flower,
  AlertTriangle,
  Users,
  Stethoscope,
  Phone,
  Shield,
  TrendingUp,
  Award,
  Target,
  Zap,
  ArrowUp,
  Heart,
  MessageCircle,
  Network,
  type LucideIcon,
  type LucideProps
} from 'lucide-react';

// Icon component mapping
const ICON_MAP = {
  HelpCircle,
  Frown,
  Meh,
  Smile,
  Laugh,
  Brain,
  MessageSquare,
  Wind,
  Activity,
  Moon,
  BookOpen,
  Flower,
  AlertTriangle,
  Users,
  Stethoscope,
  Phone,
  Shield,
  TrendingUp,
  Award,
  Target,
  Zap,
  ArrowUp,
  Heart,
  MessageCircle,
  Network
} as const;

export type IconName = keyof typeof ICON_MAP;

export interface IconProps extends Omit<LucideProps, 'size'> {
  name?: IconName;
  mood?: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy';
  animate?: boolean;
  gradient?: boolean;
  customColor?: string;
  size?: number | string;
}

// Mental health specific icon mappings
export const MentalHealthIcons = {
  // Mood Icons
  mood_very_sad: 'Frown' as const,
  mood_sad: 'Meh' as const,
  mood_neutral: 'Meh' as const,
  mood_happy: 'Smile' as const,
  mood_very_happy: 'Laugh' as const,

  // Wellness Icons
  meditation: 'Brain' as const,
  therapy: 'MessageSquare' as const,
  breathing: 'Wind' as const,
  exercise: 'Activity' as const,
  sleep: 'Moon' as const,
  journal: 'BookOpen' as const,
  mindfulness: 'Flower' as const,

  // Support Icons
  crisis_support: 'AlertTriangle' as const,
  peer_support: 'Users' as const,
  professional_help: 'Stethoscope' as const,
  emergency: 'Phone' as const,
  safety_plan: 'Shield' as const,

  // Progress Icons
  growth: 'TrendingUp' as const,
  achievement: 'Award' as const,
  milestone: 'Target' as const,
  streak: 'Zap' as const,
  level_up: 'ArrowUp' as const,

  // Community Icons
  community: 'Users' as const,
  helper: 'Heart' as const,
  moderator: 'Shield' as const,
  group_chat: 'MessageCircle' as const,
  support_network: 'Network' as const
};

// Mood to icon mapping
const moodIconMap = {
  very_sad: 'Frown' as const,
  sad: 'Meh' as const,
  neutral: 'Meh' as const,
  happy: 'Smile' as const,
  very_happy: 'Laugh' as const
};

// Mood to color mapping
const moodColorMap = {
  very_sad: 'text-red-600',
  sad: 'text-orange-500',
  neutral: 'text-yellow-500',
  happy: 'text-green-500',
  very_happy: 'text-emerald-500'
};

// Enhanced Icon component
export const Icon: React.FC<IconProps> = ({
  name = 'HelpCircle',
  mood,
  animate = false,
  gradient = false,
  customColor,
  className = '',
  size = 24,
  ...props
}) => {
  // Get the appropriate icon based on mood or name
  let iconName: IconName = name;
  let colorClass = '';

  if (mood) {
    iconName = moodIconMap[mood];
    colorClass = moodColorMap[mood];
  }

  if (customColor) {
    colorClass = customColor;
  }

  // Get the icon component
  const IconComponent = ICON_MAP[iconName] || ICON_MAP.HelpCircle;

  // Build class names
  const iconClasses = [
    'icon',
    colorClass,
    animate ? 'animate-pulse' : '',
    gradient ? 'bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <IconComponent
      className={iconClasses}
      size={size}
      {...props}
    />
  );
};

// Specialized icon components for common use cases
export const MoodIcon: React.FC<{
  mood: NonNullable<IconProps['mood']>;
  size?: number;
  className?: string;
}> = ({ mood, size = 24, className = '' }) => {
  return (
    <Icon
      mood={mood}
      size={size}
      className={className}
      animate={true}
    />
  );
};

export const WellnessIcon: React.FC<{
  type: keyof typeof MentalHealthIcons;
  size?: number;
  className?: string;
}> = ({ type, size = 24, className = '' }) => {
  const iconName = MentalHealthIcons[type];
  return (
    <Icon
      name={iconName}
      size={size}
      className={className}
      gradient={true}
    />
  );
};

export const SupportIcon: React.FC<{
  type: 'crisis' | 'peer' | 'professional' | 'emergency' | 'safety';
  size?: number;
  className?: string;
}> = ({ type, size = 24, className = '' }) => {
  const iconMap = {
    crisis: 'AlertTriangle' as const,
    peer: 'Users' as const,
    professional: 'Stethoscope' as const,
    emergency: 'Phone' as const,
    safety: 'Shield' as const
  };

  const colorMap = {
    crisis: 'text-red-600',
    peer: 'text-blue-600',
    professional: 'text-green-600',
    emergency: 'text-orange-600',
    safety: 'text-purple-600'
  };

  return (
    <Icon
      name={iconMap[type]}
      size={size}
      className={`${colorMap[type]} ${className}`.trim()}
      animate={type === 'crisis' || type === 'emergency'}
    />
  );
};

export const ProgressIcon: React.FC<{
  type: 'growth' | 'achievement' | 'milestone' | 'streak' | 'level_up';
  size?: number;
  className?: string;
}> = ({ type, size = 24, className = '' }) => {
  const iconMap = {
    growth: 'TrendingUp' as const,
    achievement: 'Award' as const,
    milestone: 'Target' as const,
    streak: 'Zap' as const,
    level_up: 'ArrowUp' as const
  };

  const colorMap = {
    growth: 'text-green-600',
    achievement: 'text-yellow-600',
    milestone: 'text-blue-600',
    streak: 'text-orange-600',
    level_up: 'text-purple-600'
  };

  return (
    <Icon
      name={iconMap[type]}
      size={size}
      className={`${colorMap[type]} ${className}`.trim()}
      gradient={true}
    />
  );
};

// Icon grid component for displaying multiple icons
export const IconGrid: React.FC<{
  icons: Array<{
    name: IconName;
    label: string;
    color?: string;
  }>;
  columns?: number;
  className?: string;
}> = ({ icons, columns = 4, className = '' }) => {
  return (
    <div
      className={`icon-grid grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {icons.map((icon, index) => (
        <div
          key={`${icon.name}-${index}`}
          className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <Icon
            name={icon.name}
            size={32}
            className={icon.color || 'text-gray-600'}
          />
          <span className="mt-2 text-xs text-gray-600 text-center">
            {icon.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Icon button component
export const IconButton: React.FC<{
  icon: IconName;
  onClick: () => void;
  size?: number;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  children?: React.ReactNode;
}> = ({
  icon,
  onClick,
  size = 24,
  className = '',
  disabled = false,
  variant = 'default',
  children
}) => {
  const variantClasses = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <button
      type="button"
      className={`icon-button inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={size} />
      {children && <span>{children}</span>}
    </button>
  );
};

// Icon with tooltip
export const IconWithTooltip: React.FC<{
  icon: IconName;
  tooltip: string;
  size?: number;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({
  icon,
  tooltip,
  size = 24,
  className = '',
  position = 'top'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon name={icon} size={size} className={className} />
      {showTooltip && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap ${positionClasses[position]}`}
          role="tooltip"
        >
          {tooltip}
        </div>
      )}
    </div>
  );
};

// Mental health specific icon shortcuts
export const CrisisIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="AlertTriangle" className="text-red-600" {...props} />
);

export const TherapyIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="MessageSquare" className="text-blue-600" {...props} />
);

export const MeditationIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="Brain" className="text-purple-600" {...props} />
);

export const SupportNetworkIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon name="Users" className="text-green-600" {...props} />
);

export default Icon;