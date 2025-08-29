import React from 'react';
import { LucideIcon, ChevronRight, ExternalLink, MoreVertical } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'filled' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const cardVariants = {
  default: 'bg-card text-card-foreground border border-border',
  outline: 'border-2 border-border bg-transparent',
  filled: 'bg-muted text-muted-foreground border-0',
  ghost: 'border-0 bg-transparent hover:bg-accent/50',
  gradient: 'bg-gradient-to-br from-primary/5 to-secondary/5 border border-border'
};

const cardSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

const cardPadding = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8'
};

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  size = 'md',
  padding = 'md',
  hover = false,
  clickable = false,
  loading = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-lg shadow-sm transition-all duration-200',
        cardVariants[variant],
        cardSizes[size],
        cardPadding[padding],
        hover && 'hover:shadow-md',
        clickable && 'cursor-pointer hover:scale-[1.02]',
        loading && 'opacity-60 pointer-events-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardContent: React.FC<CardContentProps> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('pt-0', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardFooter: React.FC<CardFooterProps> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('flex items-center pt-0', className)}
    {...props}
  >
    {children}
  </div>
);

// Specialized card components for mental health platform

export interface ActionCardProps extends CardProps {
  title: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  badge?: React.ReactNode;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  action,
  badge,
  className,
  ...props
}) => {
  return (
    <Card
      {...props}
      clickable={!!action?.onClick}
      onClick={action?.onClick}
      className={cn('relative', className)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0">
                {React.isValidElement(icon) ? (
                  icon
                ) : (
                  React.createElement(icon as LucideIcon, {
                    className: 'w-5 h-5 text-primary'
                  })
                )}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          
          {badge && (
            <div className="flex-shrink-0">{badge}</div>
          )}
        </div>
      </CardHeader>

      {action && (
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <span className={cn(
              'text-sm font-medium',
              action.variant === 'primary' ? 'text-primary' : 'text-secondary-foreground'
            )}>
              {action.label}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export interface StatsCardProps extends CardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period?: string;
  };
  icon?: LucideIcon | React.ReactNode;
  description?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  trend,
  icon,
  description,
  className,
  ...props
}) => {
  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <Card {...props} className={cn('', className)}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <div className={cn('flex items-center text-sm', getTrendColor(trend.direction))}>
                <span className="mr-1">{getTrendIcon(trend.direction)}</span>
                <span>{Math.abs(trend.value)}%</span>
                {trend.period && (
                  <span className="text-muted-foreground ml-1">vs {trend.period}</span>
                )}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          
          {icon && (
            <div className="flex-shrink-0">
              {React.isValidElement(icon) ? (
                icon
              ) : (
                React.createElement(icon as LucideIcon, {
                  className: 'w-8 h-8 text-muted-foreground'
                })
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export interface ProgressCardProps extends CardProps {
  title: string;
  progress: number; // 0-100
  total?: number;
  current?: number;
  description?: string;
  showPercentage?: boolean;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  progress,
  total,
  current,
  description,
  showPercentage = true,
  className,
  ...props
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <Card {...props} className={cn('', className)}>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">{title}</h3>
            {showPercentage && (
              <span className="text-sm text-muted-foreground">
                {Math.round(clampedProgress)}%
              </span>
            )}
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            {current !== undefined && total !== undefined ? (
              <>
                <span className="text-foreground">{current} of {total} completed</span>
                <span className="text-muted-foreground">{total - current} remaining</span>
              </>
            ) : description ? (
              <span className="text-muted-foreground">{description}</span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export interface FeatureCardProps extends CardProps {
  title: string;
  description: string;
  icon?: LucideIcon | React.ReactNode;
  features?: string[];
  action?: {
    label: string;
    onClick: () => void;
    external?: boolean;
  };
  status?: 'available' | 'coming-soon' | 'beta';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  features,
  action,
  status,
  className,
  ...props
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'coming-soon':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            Coming Soon
          </span>
        );
      case 'beta':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Beta
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Card {...props} className={cn('h-full flex flex-col', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0">
                {React.isValidElement(icon) ? (
                  icon
                ) : (
                  React.createElement(icon as LucideIcon, {
                    className: 'w-6 h-6 text-primary'
                  })
                )}
              </div>
            )}
            <h3 className="font-semibold text-foreground">{title}</h3>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-muted-foreground mb-4">{description}</p>
        
        {features && features.length > 0 && (
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-1">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {action && status !== 'coming-soon' && (
        <CardFooter>
          <button
            onClick={action.onClick}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <span>{action.label}</span>
            {action.external ? (
              <ExternalLink className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </CardFooter>
      )}
    </Card>
  );
};

// Mental health specific cards

export interface MoodCardProps extends CardProps {
  mood: 'excellent' | 'good' | 'okay' | 'not-good' | 'terrible';
  date?: Date;
  note?: string;
  tags?: string[];
}

export const MoodCard: React.FC<MoodCardProps> = ({
  mood,
  date,
  note,
  tags,
  className,
  ...props
}) => {
  const moodConfig = {
    excellent: { color: 'text-green-600', bg: 'bg-green-50', emoji: '😄', label: 'Excellent' },
    good: { color: 'text-blue-600', bg: 'bg-blue-50', emoji: '😊', label: 'Good' },
    okay: { color: 'text-yellow-600', bg: 'bg-yellow-50', emoji: '😐', label: 'Okay' },
    'not-good': { color: 'text-orange-600', bg: 'bg-orange-50', emoji: '😟', label: 'Not Good' },
    terrible: { color: 'text-red-600', bg: 'bg-red-50', emoji: '😢', label: 'Terrible' }
  };

  const config = moodConfig[mood];

  return (
    <Card {...props} className={cn(config.bg, className)}>
      <CardContent>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{config.emoji}</span>
          <div>
            <h3 className={cn('font-semibold', config.color)}>{config.label}</h3>
            {date && (
              <p className="text-sm text-muted-foreground">
                {date.toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {note && (
          <p className="text-sm text-foreground mb-3 italic">"{note}"</p>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="bg-white/50 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export interface WellnessCardProps extends CardProps {
  type: 'sleep' | 'exercise' | 'meditation' | 'therapy' | 'medication';
  value?: string | number;
  target?: string | number;
  unit?: string;
  lastUpdated?: Date;
}

export const WellnessCard: React.FC<WellnessCardProps> = ({
  type,
  value,
  target,
  unit = '',
  lastUpdated,
  className,
  ...props
}) => {
  const typeConfig = {
    sleep: { icon: '😴', label: 'Sleep', color: 'text-blue-600' },
    exercise: { icon: '💪', label: 'Exercise', color: 'text-green-600' },
    meditation: { icon: '🧘', label: 'Meditation', color: 'text-purple-600' },
    therapy: { icon: '🗣️', label: 'Therapy', color: 'text-indigo-600' },
    medication: { icon: '💊', label: 'Medication', color: 'text-red-600' }
  };

  const config = typeConfig[type];

  return (
    <StatsCard
      {...props}
      title={config.label}
      value={value ? `${value}${unit}` : 'Not logged'}
      icon={<span className="text-2xl">{config.icon}</span>}
      description={target ? `Target: ${target}${unit}` : undefined}
      className={cn('', className)}
    />
  );
};

export interface AlertCardProps extends CardProps {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  type,
  title,
  message,
  action,
  dismissible = false,
  onDismiss,
  className,
  ...props
}) => {
  const typeConfig = {
    info: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: 'ℹ️' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: '⚠️' },
    error: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: '❌' },
    success: { color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: '✅' }
  };

  const config = typeConfig[type];

  return (
    <Card 
      {...props} 
      variant="outline" 
      className={cn(config.bg, 'border-2', className)}
    >
      <CardContent>
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
          <div className="flex-1">
            <h4 className={cn('font-semibold mb-1', config.color)}>{title}</h4>
            <p className="text-sm text-foreground mb-3">{message}</p>
            
            <div className="flex items-center justify-between">
              {action && (
                <button
                  onClick={action.onClick}
                  className={cn('text-sm font-medium hover:underline', config.color)}
                >
                  {action.label}
                </button>
              )}
              
              {dismissible && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Card;

