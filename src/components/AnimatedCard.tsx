import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Heart, TrendingUp } from 'lucide-react';

interface AnimatedCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  animation?: 'fade' | 'slide' | 'scale' | 'flip' | 'bounce' | 'none';
  delay?: number;
  duration?: number;
  trigger?: 'hover' | 'click' | 'scroll' | 'load';
  expandable?: boolean;
  collapsible?: boolean;
  elevated?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  gradient?: boolean;
  glowEffect?: boolean;
}

interface CardStats {
  likes?: number;
  views?: number;
  progress?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export const AnimatedCard: React.FC<AnimatedCardProps & { stats?: CardStats }> = ({
  children,
  title,
  subtitle,
  className = '',
  animation = 'fade',
  delay = 0,
  duration = 300,
  trigger = 'load',
  expandable = false,
  collapsible = false,
  elevated = false,
  interactive = false,
  onClick,
  onHover,
  gradient = false,
  glowEffect = false,
  stats
}) => {
  const [isVisible, setIsVisible] = useState(trigger === 'load');
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [isHovered, setIsHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer for scroll trigger
  useEffect(() => {
    if (trigger === 'scroll' && cardRef.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated) {
            setTimeout(() => {
              setIsVisible(true);
              setHasAnimated(true);
            }, delay);
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      );

      observerRef.current.observe(cardRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [trigger, delay, hasAnimated]);

  // Handle load trigger
  useEffect(() => {
    if (trigger === 'load' && !hasAnimated) {
      setTimeout(() => {
        setIsVisible(true);
        setHasAnimated(true);
      }, delay);
    }
  }, [trigger, delay, hasAnimated]);

  // Animation classes
  const getAnimationClasses = () => {
    const baseTransition = `transition-all duration-${duration} ease-out`;
    
    if (!isVisible) {
      switch (animation) {
        case 'fade':
          return `${baseTransition} opacity-0`;
        case 'slide':
          return `${baseTransition} opacity-0 transform translate-y-8`;
        case 'scale':
          return `${baseTransition} opacity-0 transform scale-95`;
        case 'flip':
          return `${baseTransition} opacity-0 transform rotateY-90`;
        case 'bounce':
          return `${baseTransition} opacity-0 transform translate-y-4 scale-95`;
        default:
          return '';
      }
    } else {
      switch (animation) {
        case 'fade':
          return `${baseTransition} opacity-100`;
        case 'slide':
          return `${baseTransition} opacity-100 transform translate-y-0`;
        case 'scale':
          return `${baseTransition} opacity-100 transform scale-100`;
        case 'flip':
          return `${baseTransition} opacity-100 transform rotateY-0`;
        case 'bounce':
          return `${baseTransition} opacity-100 transform translate-y-0 scale-100`;
        default:
          return '';
      }
    }
  };

  // Interactive effects
  const getInteractiveClasses = () => {
    let classes = '';
    
    if (interactive || onClick) {
      classes += ' cursor-pointer select-none ';
      
      if (isHovered) {
        classes += elevated ? 'shadow-2xl transform -translate-y-2 ' : 'shadow-lg transform -translate-y-1 ';
      } else {
        classes += elevated ? 'shadow-xl ' : 'shadow-md ';
      }
    } else {
      classes += elevated ? 'shadow-lg ' : 'shadow-sm ';
    }

    if (glowEffect && isHovered) {
      classes += 'ring-4 ring-blue-200 ring-opacity-50 ';
    }

    return classes;
  };

  // Handle interactions
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (trigger === 'hover' && !hasAnimated) {
      setIsVisible(true);
      setHasAnimated(true);
    }
    onHover?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = () => {
    if (trigger === 'click' && !hasAnimated) {
      setIsVisible(true);
      setHasAnimated(true);
    }
    
    if (expandable || collapsible) {
      setIsExpanded(!isExpanded);
    }
    
    onClick?.();
  };

  return (
    <div
      ref={cardRef}
      className={`
        relative overflow-hidden rounded-lg border border-gray-200 bg-white
        ${getAnimationClasses()}
        ${getInteractiveClasses()}
        ${gradient ? 'bg-gradient-to-br from-white to-gray-50' : ''}
        ${className}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Gradient overlay */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
      )}

      {/* Glow effect */}
      {glowEffect && isHovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 pointer-events-none animate-pulse" />
      )}

      {/* Header */}
      {(title || subtitle || stats) && (
        <div className="relative p-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Stats */}
            {stats && (
              <div className="flex items-center gap-3 ml-4">
                {stats.likes !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Heart className="w-4 h-4" />
                    <span>{stats.likes}</span>
                  </div>
                )}
                
                {stats.views !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <ExternalLink className="w-4 h-4" />
                    <span>{stats.views}</span>
                  </div>
                )}
                
                {stats.trend && (
                  <div className={`flex items-center gap-1 text-sm ${
                    stats.trend === 'up' ? 'text-green-600' : 
                    stats.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    <TrendingUp className={`w-4 h-4 ${stats.trend === 'down' ? 'transform rotate-180' : ''}`} />
                  </div>
                )}
              </div>
            )}

            {/* Expand/Collapse Button */}
            {(expandable || collapsible) && (
              <button
                className="ml-2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
          </div>

          {/* Progress bar */}
          {stats?.progress !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(stats.progress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${stats.progress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div 
        className={`
          relative transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? 'max-h-full opacity-100' : collapsible ? 'max-h-0 opacity-0' : 'max-h-full opacity-100'}
        `}
      >
        <div className={title || subtitle ? 'p-4' : 'p-6'}>
          {children}
        </div>
      </div>

      {/* Animated border effect */}
      {interactive && isHovered && (
        <div className="absolute inset-0 border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-border rounded-lg pointer-events-none">
          <div className="absolute inset-0.5 bg-white rounded-md" />
        </div>
      )}
    </div>
  );
};

// Specialized card variants
export const WellnessCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
  className?: string;
}> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  return (
    <AnimatedCard
      animation="scale"
      delay={100}
      elevated
      interactive
      gradient
      className={className}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend !== 'neutral' && (
                <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'transform rotate-180' : ''}`} />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </AnimatedCard>
  );
};

export const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon?: React.ComponentType<any>;
  badge?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}> = ({ title, description, icon: Icon, badge, action, className = '' }) => {
  return (
    <AnimatedCard
      animation="slide"
      delay={200}
      interactive
      glowEffect
      className={className}
    >
      <div className="text-center">
        {Icon && (
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
        )}
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {badge && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        
        <p className="text-gray-600 mb-4">{description}</p>
        
        {action && (
          <button
            onClick={action.onClick}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            {action.label}
          </button>
        )}
      </div>
    </AnimatedCard>
  );
};

export const MoodCard: React.FC<{
  mood: string;
  level: number;
  timestamp: Date;
  note?: string;
  className?: string;
}> = ({ mood, level, timestamp, note, className = '' }) => {
  const getMoodColor = (level: number) => {
    if (level <= 2) return 'from-red-500 to-red-600';
    if (level <= 4) return 'from-orange-500 to-orange-600';
    if (level <= 6) return 'from-yellow-500 to-yellow-600';
    if (level <= 8) return 'from-green-500 to-green-600';
    return 'from-emerald-500 to-emerald-600';
  };

  return (
    <AnimatedCard
      animation="bounce"
      delay={150}
      elevated
      className={className}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getMoodColor(level)} flex items-center justify-center`}>
          <span className="text-xl">{mood}</span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">Level {level}/10</span>
            <div className="flex gap-1">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < level ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          
          {note && (
            <p className="text-sm text-gray-700 mt-2 italic">"{note}"</p>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
};

export default AnimatedCard;
