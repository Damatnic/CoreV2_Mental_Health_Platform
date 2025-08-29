import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../utils/cn';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  formatValue?: (value: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
  separator?: string;
  trigger?: 'mount' | 'visible' | 'hover' | 'manual';
  onComplete?: () => void;
  style?: 'default' | 'counter' | 'progress' | 'score';
  direction?: 'up' | 'down';
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
}

const easingFunctions = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - Math.pow(1 - t, 2),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  bounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
};

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  delay = 0,
  decimals = 0,
  formatValue,
  className = '',
  prefix = '',
  suffix = '',
  separator = ',',
  trigger = 'mount',
  onComplete,
  style = 'default',
  direction = 'up',
  easing = 'ease-out'
}) => {
  const [displayValue, setDisplayValue] = useState(direction === 'up' ? 0 : value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const elementRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  // Intersection Observer for visibility trigger
  useEffect(() => {
    if (trigger !== 'visible') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [trigger]);

  const animate = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now() + delay;
    }

    const elapsed = Date.now() - startTimeRef.current;
    
    if (elapsed < 0) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFunctions[easing](progress);

    const startValue = direction === 'up' ? 0 : value;
    const endValue = direction === 'up' ? value : 0;
    const currentValue = startValue + (endValue - startValue) * easedProgress;

    setDisplayValue(currentValue);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
      startTimeRef.current = undefined;
      onComplete?.();
    }
  }, [value, duration, delay, direction, easing, onComplete]);

  const startAnimation = useCallback(() => {
    if (isAnimating || hasTriggered) return;
    
    setHasTriggered(true);
    setIsAnimating(true);
    setDisplayValue(direction === 'up' ? 0 : value);
    startTimeRef.current = undefined;
    animationRef.current = requestAnimationFrame(animate);
  }, [isAnimating, hasTriggered, animate, direction, value]);

  // Trigger animations based on trigger type
  useEffect(() => {
    if (trigger === 'mount') {
      startAnimation();
    }
  }, [trigger, startAnimation]);

  useEffect(() => {
    if (trigger === 'visible' && isVisible) {
      startAnimation();
    }
  }, [trigger, isVisible, startAnimation]);

  useEffect(() => {
    if (trigger === 'hover' && isHovered) {
      startAnimation();
    }
  }, [trigger, isHovered, startAnimation]);

  // Manual trigger method
  const triggerAnimation = useCallback(() => {
    if (trigger === 'manual') {
      setHasTriggered(false);
      startAnimation();
    }
  }, [trigger, startAnimation]);

  // Note: Imperative methods would require forwardRef wrapper to be properly exposed

  // Format the display value
  const formatDisplayValue = (num: number): string => {
    if (formatValue) {
      return formatValue(num);
    }

    // Handle decimals
    const fixedValue = num.toFixed(decimals);
    
    // Add thousand separators if needed
    if (separator && Math.abs(num) >= 1000) {
      const parts = fixedValue.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      return parts.join('.');
    }
    
    return fixedValue;
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Style variants
  const getStyleClasses = () => {
    switch (style) {
      case 'counter':
        return 'font-mono text-2xl font-bold';
      case 'progress':
        return 'text-lg font-semibold text-blue-600';
      case 'score':
        return 'text-3xl font-black';
      default:
        return '';
    }
  };

  // Animation state classes
  const getAnimationClasses = () => {
    let classes = '';
    
    if (isAnimating) {
      classes += ' transition-colors duration-200';
    }

    if (style === 'counter' && isAnimating) {
      classes += ' text-green-600';
    } else if (style === 'progress' && isAnimating) {
      classes += ' text-blue-700';
    } else if (style === 'score' && isAnimating) {
      classes += ' text-purple-600';
    }

    return classes;
  };

  return (
    <span
      ref={elementRef}
      className={cn(
        'inline-flex items-baseline',
        getStyleClasses(),
        getAnimationClasses(),
        isAnimating && 'animate-pulse',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label={`${prefix}${formatDisplayValue(value)}${suffix}`}
    >
      {prefix && (
        <span className="opacity-80 mr-0.5">{prefix}</span>
      )}
      
      <span 
        className="tabular-nums"
        style={{
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {formatDisplayValue(displayValue)}
      </span>
      
      {suffix && (
        <span className="opacity-80 ml-0.5">{suffix}</span>
      )}
      
      {isAnimating && style === 'counter' && (
        <span className="ml-1 text-xs text-gray-400 animate-spin">⟳</span>
      )}
    </span>
  );
};

// Specialized components for common use cases

export const ScoreCounter: React.FC<Omit<AnimatedNumberProps, 'style' | 'easing'> & {
  maxValue?: number;
  color?: 'green' | 'blue' | 'purple' | 'orange';
}> = ({ maxValue, color = 'blue', className, ...props }) => {
  const colorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="text-center">
      <AnimatedNumber
        {...props}
        style="score"
        easing="bounce"
        className={cn(colorClasses[color], className)}
      />
      {maxValue && (
        <div className="text-sm text-gray-500 mt-1">
          out of {maxValue.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export const ProgressCounter: React.FC<Omit<AnimatedNumberProps, 'style' | 'suffix'> & {
  showBar?: boolean;
  maxValue?: number;
}> = ({ showBar = false, maxValue = 100, value, className, ...props }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="space-y-2">
      <AnimatedNumber
        {...props}
        value={value}
        style="progress"
        suffix="%"
        className={cn('text-xl font-bold', className)}
      />
      
      {showBar && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const StatisticDisplay: React.FC<{
  label: string;
  value: number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period?: string;
  };
  icon?: React.ReactNode;
  animationProps?: Partial<AnimatedNumberProps>;
}> = ({ label, value, trend, icon, animationProps = {} }) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{label}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <AnimatedNumber
          value={value}
          className="text-2xl font-bold text-gray-900"
          duration={1500}
          formatValue={(num) => num.toLocaleString()}
          {...animationProps}
        />
        
        {trend && (
          <div className={cn(
            'flex items-center text-sm font-medium',
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            <span className="mr-1">
              {trend.direction === 'up' ? '↗' : '↘'}
            </span>
            <AnimatedNumber
              value={trend.value}
              suffix="%"
              duration={1000}
              delay={500}
            />
            {trend.period && (
              <span className="text-gray-500 ml-1">vs {trend.period}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Mental health specific components

export const MoodScoreDisplay: React.FC<{
  score: number;
  previousScore?: number;
  label?: string;
}> = ({ score, previousScore, label = "Mood Score" }) => {
  const trend = previousScore ? {
    value: Math.abs(((score - previousScore) / previousScore) * 100),
    direction: score >= previousScore ? 'up' as const : 'down' as const,
    period: 'last entry'
  } : undefined;

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    if (value >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <StatisticDisplay
      label={label}
      value={score}
      trend={trend}
      icon={<span className="text-2xl">😊</span>}
      animationProps={{
        className: getScoreColor(score),
        suffix: '/100',
        easing: 'ease-out'
      }}
    />
  );
};

export const StreakCounter: React.FC<{
  days: number;
  activity: string;
}> = ({ days, activity }) => {
  return (
    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
      <div className="text-2xl mb-2">🔥</div>
      <AnimatedNumber
        value={days}
        className="text-3xl font-bold text-orange-600"
        duration={2000}
        easing="bounce"
      />
      <div className="text-sm text-gray-600 mt-1">
        day streak
      </div>
      <div className="text-xs text-gray-500 mt-0.5">
        {activity}
      </div>
    </div>
  );
};

export default AnimatedNumber;

