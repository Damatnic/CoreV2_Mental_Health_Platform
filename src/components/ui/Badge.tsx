import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon | React.ReactNode;
  iconPosition?: 'left' | 'right';
  dot?: boolean;
  pulse?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  // Mental health specific variants
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'active' | 'inactive' | 'pending' | 'completed';
  children: React.ReactNode;
}

const badgeVariants = {
  default: 'bg-primary/10 text-primary hover:bg-primary/20',
  secondary: 'bg-secondary/10 text-secondary-foreground hover:bg-secondary/20',
  destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  outline: 'bg-transparent border border-input text-foreground hover:bg-accent hover:text-accent-foreground',
  success: 'bg-green-100 text-green-800 hover:bg-green-200',
  warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  info: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
};

const sizeVariants = {
  sm: 'px-1.5 py-0.5 text-xs font-medium',
  md: 'px-2 py-1 text-xs font-medium',
  lg: 'px-3 py-1.5 text-sm font-semibold'
};

const priorityVariants = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200 animate-pulse'
};

const statusVariants = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200'
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'left',
  dot = false,
  pulse = false,
  removable = false,
  onRemove,
  priority,
  status,
  children,
  ...props
}) => {
  // Determine final variant based on priority or status
  let finalVariant = variant;
  let finalClasses = '';

  if (priority) {
    finalClasses = priorityVariants[priority];
  } else if (status) {
    finalClasses = statusVariants[status];
  } else {
    finalClasses = badgeVariants[finalVariant];
  }

  const renderIcon = () => {
    if (!icon) return null;

    const iconClasses = cn(
      'flex-shrink-0',
      size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5',
      iconPosition === 'left' ? 'mr-1' : 'ml-1'
    );

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement, { 
        className: cn(iconClasses, (icon as React.ReactElement).props?.className) 
      });
    }

    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={iconClasses} />;
    }

    return icon;
  };

  const renderDot = () => {
    if (!dot) return null;

    return (
      <span 
        className={cn(
          'inline-block w-2 h-2 rounded-full mr-1.5',
          pulse && 'animate-pulse',
          priority === 'urgent' || status === 'active' ? 'bg-current' : 'bg-current opacity-60'
        )}
      />
    );
  };

  const renderRemoveButton = () => {
    if (!removable || !onRemove) return null;

    return (
      <button
        type="button"
        className={cn(
          'ml-1 inline-flex items-center justify-center rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current',
          size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Remove badge"
      >
        <svg
          className={cn('w-full h-full')}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 8 8"
        >
          <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
        </svg>
      </button>
    );
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        finalClasses,
        sizeVariants[size],
        pulse && !priority && 'animate-pulse',
        className
      )}
      {...props}
    >
      {renderDot()}
      {icon && iconPosition === 'left' && renderIcon()}
      <span className="truncate">{children}</span>
      {icon && iconPosition === 'right' && renderIcon()}
      {renderRemoveButton()}
    </div>
  );
};

// Specialized badge components for mental health contexts

export const PriorityBadge: React.FC<{
  priority: BadgeProps['priority'];
  children: React.ReactNode;
  className?: string;
}> = ({ priority = 'low', children, className, ...props }) => (
  <Badge
    priority={priority}
    size="sm"
    className={className}
    pulse={priority === 'urgent'}
    {...props}
  >
    {children}
  </Badge>
);

export const StatusBadge: React.FC<{
  status: BadgeProps['status'];
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}> = ({ status = 'inactive', children, className, dot = true, ...props }) => (
  <Badge
    status={status}
    size="sm"
    dot={dot}
    className={className}
    pulse={status === 'active'}
    {...props}
  >
    {children}
  </Badge>
);

export const CrisisBadge: React.FC<{
  level: 'low' | 'medium' | 'high' | 'critical';
  children: React.ReactNode;
  className?: string;
}> = ({ level, children, className, ...props }) => {
  const levelToPriority = {
    low: 'low' as const,
    medium: 'medium' as const,
    high: 'high' as const,
    critical: 'urgent' as const
  };

  return (
    <PriorityBadge
      priority={levelToPriority[level]}
      className={cn('font-semibold', className)}
      {...props}
    >
      {children}
    </PriorityBadge>
  );
};

export const WellnessBadge: React.FC<{
  type: 'mood' | 'anxiety' | 'sleep' | 'exercise' | 'meditation';
  value?: string | number;
  className?: string;
}> = ({ type, value, className, ...props }) => {
  const typeConfig = {
    mood: { variant: 'info' as const, icon: '😊' },
    anxiety: { variant: 'warning' as const, icon: '😰' },
    sleep: { variant: 'info' as const, icon: '😴' },
    exercise: { variant: 'success' as const, icon: '💪' },
    meditation: { variant: 'secondary' as const, icon: '🧘' }
  };

  const config = typeConfig[type] || typeConfig.mood;

  return (
    <Badge
      variant={config.variant}
      size="sm"
      className={className}
      {...props}
    >
      <span className="mr-1">{config.icon}</span>
      {type.charAt(0).toUpperCase() + type.slice(1)}
      {value && <span className="ml-1 font-semibold">{value}</span>}
    </Badge>
  );
};

export const TherapyBadge: React.FC<{
  sessionType: 'individual' | 'group' | 'family' | 'couples';
  status?: 'active' | 'inactive' | 'pending' | 'completed';
  className?: string;
}> = ({ sessionType, status, className, ...props }) => {
  const typeIcons = {
    individual: '👤',
    group: '👥',
    family: '👨‍👩‍👧‍👦',
    couples: '💑'
  };

  return (
    <Badge
      status={status}
      size="md"
      className={className}
      {...props}
    >
      <span className="mr-1">{typeIcons[sessionType]}</span>
      {sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} Therapy
    </Badge>
  );
};

export const MoodBadge: React.FC<{
  mood: 'excellent' | 'good' | 'okay' | 'not-good' | 'terrible';
  showIcon?: boolean;
  className?: string;
}> = ({ mood, showIcon = true, className, ...props }) => {
  const moodConfig = {
    excellent: { variant: 'success' as const, icon: '😄', label: 'Excellent' },
    good: { variant: 'info' as const, icon: '😊', label: 'Good' },
    okay: { variant: 'secondary' as const, icon: '😐', label: 'Okay' },
    'not-good': { variant: 'warning' as const, icon: '😟', label: 'Not Good' },
    terrible: { variant: 'destructive' as const, icon: '😢', label: 'Terrible' }
  };

  const config = moodConfig[mood] || moodConfig.okay;

  return (
    <Badge
      variant={config.variant}
      size="md"
      className={className}
      {...props}
    >
      {showIcon && <span className="mr-1.5">{config.icon}</span>}
      {config.label}
    </Badge>
  );
};

export const AnonymityBadge: React.FC<{
  level: 'basic' | 'enhanced' | 'maximum';
  className?: string;
}> = ({ level, className, ...props }) => {
  const levelConfig = {
    basic: { variant: 'secondary' as const, icon: '🔒' },
    enhanced: { variant: 'info' as const, icon: '🛡️' },
    maximum: { variant: 'success' as const, icon: '🔐' }
  };

  const config = levelConfig[level] || levelConfig.basic;

  return (
    <Badge
      variant={config.variant}
      size="sm"
      className={className}
      {...props}
    >
      <span className="mr-1">{config.icon}</span>
      {level.charAt(0).toUpperCase() + level.slice(1)} Privacy
    </Badge>
  );
};

export const ProgressBadge: React.FC<{
  percentage: number;
  showPercentage?: boolean;
  className?: string;
}> = ({ percentage, showPercentage = true, className, ...props }) => {
  const getVariant = (pct: number): BadgeProps['variant'] => {
    if (pct >= 90) return 'success';
    if (pct >= 70) return 'info';
    if (pct >= 40) return 'warning';
    return 'destructive';
  };

  return (
    <Badge
      variant={getVariant(percentage)}
      size="sm"
      className={className}
      {...props}
    >
      Progress{showPercentage && `: ${Math.round(percentage)}%`}
    </Badge>
  );
};

// Badge group component for organizing multiple badges
export const BadgeGroup: React.FC<{
  badges: Array<{
    key: string;
    badge: React.ReactNode;
  }>;
  max?: number;
  showMore?: boolean;
  orientation?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ 
  badges, 
  max = 5, 
  showMore = true, 
  orientation = 'horizontal',
  gap = 'sm',
  className 
}) => {
  const visibleBadges = badges.slice(0, max);
  const hiddenCount = badges.length - max;

  const gapClasses = {
    sm: orientation === 'horizontal' ? 'gap-1' : 'gap-1',
    md: orientation === 'horizontal' ? 'gap-2' : 'gap-1.5',
    lg: orientation === 'horizontal' ? 'gap-3' : 'gap-2'
  };

  const orientationClasses = orientation === 'horizontal' 
    ? 'flex flex-wrap items-center' 
    : 'flex flex-col items-start';

  return (
    <div className={cn(orientationClasses, gapClasses[gap], className)}>
      {visibleBadges.map(({ key, badge }) => (
        <React.Fragment key={key}>{badge}</React.Fragment>
      ))}
      
      {showMore && hiddenCount > 0 && (
        <Badge variant="outline" size="sm">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
};

export default Badge;
