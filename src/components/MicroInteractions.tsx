/**
 * THERAPEUTIC MICRO-INTERACTIONS COMPONENT LIBRARY
 * 
 * A collection of carefully designed micro-interactions optimized for
 * mental health applications, providing subtle feedback that enhances
 * user experience without causing anxiety or distraction.
 */

import React, { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { 
  DURATIONS, 
  EASINGS, 
  MICRO_INTERACTIONS,
  createTransition,
  getPrefersReducedMotion,
  accessibleAnimation
} from '../utils/animations';

// ==================== RIPPLE EFFECT ====================
interface RippleProps {
  color?: string;
  duration?: number;
  disabled?: boolean;
}

export const RippleEffect: React.FC<RippleProps> = ({
  color = 'rgba(59, 130, 246, 0.3)',
  duration = DURATIONS.moderate,
  disabled = false
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = getPrefersReducedMotion();

  const addRipple = useCallback((e: React.MouseEvent) => {
    if (disabled || prefersReducedMotion) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, duration);
  }, [disabled, duration, prefersReducedMotion]);

  return (
    <div 
      ref={containerRef}
      className="ripple-container"
      onMouseDown={addRipple}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: color,
            animation: `ripple ${duration}ms ${EASINGS.easeOut}`,
          }}
        />
      ))}
    </div>
  );
};

// ==================== HOVER LIFT ====================
interface HoverLiftProps {
  children: ReactNode;
  liftAmount?: number;
  shadowIntensity?: number;
  disabled?: boolean;
}

export const HoverLift: React.FC<HoverLiftProps> = ({
  children,
  liftAmount = 2,
  shadowIntensity = 0.15,
  disabled = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = getPrefersReducedMotion();

  const style = !disabled && !prefersReducedMotion && isHovered
    ? {
        transform: `translateY(-${liftAmount}px)`,
        boxShadow: `0 ${liftAmount * 2}px ${liftAmount * 6}px rgba(0, 0, 0, ${shadowIntensity})`,
        transition: createTransition(['transform', 'box-shadow'], DURATIONS.base),
      }
    : {
        transform: 'translateY(0)',
        transition: createTransition(['transform', 'box-shadow'], DURATIONS.base),
      };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={style}
    >
      {children}
    </div>
  );
};

// ==================== FOCUS GLOW ====================
interface FocusGlowProps {
  children: ReactNode;
  glowColor?: string;
  glowSize?: number;
  disabled?: boolean;
}

export const FocusGlow: React.FC<FocusGlowProps> = ({
  children,
  glowColor = 'rgba(59, 130, 246, 0.5)',
  glowSize = 3,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = getPrefersReducedMotion();

  const style = !disabled && !prefersReducedMotion && isFocused
    ? {
        boxShadow: `0 0 0 ${glowSize}px ${glowColor}`,
        transition: createTransition('box-shadow', DURATIONS.fast),
      }
    : {
        transition: createTransition('box-shadow', DURATIONS.fast),
      };

  return (
    <div
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={style}
    >
      {children}
    </div>
  );
};

// ==================== PRESS SCALE ====================
interface PressScaleProps {
  children: ReactNode;
  scaleAmount?: number;
  disabled?: boolean;
}

export const PressScale: React.FC<PressScaleProps> = ({
  children,
  scaleAmount = 0.98,
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const prefersReducedMotion = getPrefersReducedMotion();

  const style = !disabled && !prefersReducedMotion && isPressed
    ? {
        transform: `scale(${scaleAmount})`,
        transition: createTransition('transform', DURATIONS.fast),
      }
    : {
        transform: 'scale(1)',
        transition: createTransition('transform', DURATIONS.fast, EASINGS.bounce),
      };

  return (
    <div
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={style}
    >
      {children}
    </div>
  );
};

// ==================== LOADING DOTS ====================
interface LoadingDotsProps {
  size?: number;
  color?: string;
  spacing?: number;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 8,
  color = '#059ae9',
  spacing = 4
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();

  return (
    <div style={{ display: 'flex', gap: `${spacing}px`, alignItems: 'center' }}>
      {[0, 1, 2].map(index => (
        <span
          key={index}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            backgroundColor: color,
            animation: prefersReducedMotion 
              ? 'none' 
              : `loadingDots 1.4s ease-in-out ${index * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

// ==================== SUCCESS CHECKMARK ====================
interface SuccessCheckmarkProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  onComplete?: () => void;
}

export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({
  size = 48,
  color = '#22c55e',
  strokeWidth = 3,
  onComplete
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();

  useEffect(() => {
    if (!prefersReducedMotion && onComplete) {
      const timer = setTimeout(onComplete, DURATIONS.moderate);
      return () => clearTimeout(timer);
    }
  }, [onComplete, prefersReducedMotion]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={0.3}
      />
      <path
        d="M7 12.5L10 15.5L17 8.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 100,
          strokeDashoffset: prefersReducedMotion ? 0 : 100,
          animation: prefersReducedMotion 
            ? 'none' 
            : `checkmark ${DURATIONS.moderate}ms ${EASINGS.easeOut} forwards`,
        }}
      />
    </svg>
  );
};

// ==================== ERROR SHAKE ====================
interface ErrorShakeProps {
  children: ReactNode;
  trigger: boolean;
  intensity?: number;
  onComplete?: () => void;
}

export const ErrorShake: React.FC<ErrorShakeProps> = ({
  children,
  trigger,
  intensity = 2,
  onComplete
}) => {
  const [isShaking, setIsShaking] = useState(false);
  const prefersReducedMotion = getPrefersReducedMotion();

  useEffect(() => {
    if (trigger && !prefersReducedMotion) {
      setIsShaking(true);
      const timer = setTimeout(() => {
        setIsShaking(false);
        onComplete?.();
      }, DURATIONS.moderate);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete, prefersReducedMotion]);

  return (
    <div
      style={{
        animation: isShaking 
          ? `errorShake ${DURATIONS.moderate}ms ${EASINGS.easeOut}`
          : 'none',
      }}
    >
      {children}
    </div>
  );
};

// ==================== GENTLE PULSE ====================
interface GentlePulseProps {
  children: ReactNode;
  active?: boolean;
  scale?: number;
  duration?: number;
}

export const GentlePulse: React.FC<GentlePulseProps> = ({
  children,
  active = true,
  scale = 1.05,
  duration = DURATIONS.therapeutic
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();

  return (
    <div
      style={{
        animation: active && !prefersReducedMotion
          ? `gentlePulse ${duration}ms ${EASINGS.therapeutic} infinite`
          : 'none',
      }}
    >
      {children}
    </div>
  );
};

// ==================== SKELETON LOADER ====================
interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  baseColor?: string;
  highlightColor?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  baseColor = '#f0f0f0',
  highlightColor = '#e0e0e0'
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();

  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: prefersReducedMotion
          ? baseColor
          : `linear-gradient(90deg, ${baseColor} 25%, ${highlightColor} 50%, ${baseColor} 75%)`,
        backgroundSize: '200% 100%',
        animation: prefersReducedMotion
          ? 'none'
          : `shimmer ${DURATIONS.slower * 1.5}ms ${EASINGS.linear} infinite`,
      }}
    />
  );
};

// ==================== TOOLTIP ====================
interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 500
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const prefersReducedMotion = getPrefersReducedMotion();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
      case 'left':
        return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' };
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            ...getPositionStyles(),
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            opacity: prefersReducedMotion ? 1 : 0,
            animation: prefersReducedMotion
              ? 'none'
              : `fadeIn ${DURATIONS.fast}ms ${EASINGS.easeOut} forwards`,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// ==================== PROGRESS BAR ====================
interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = '#059ae9',
  backgroundColor = '#e5e7eb',
  showLabel = false,
  animated = true
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div style={{ position: 'relative' }}>
      {showLabel && (
        <div style={{ marginBottom: '4px', fontSize: '14px', color: '#6b7280' }}>
          {Math.round(clampedProgress)}%
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor,
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clampedProgress}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: `${height / 2}px`,
            transition: animated && !prefersReducedMotion
              ? createTransition('width', DURATIONS.moderate, EASINGS.easeOut)
              : 'none',
          }}
        />
      </div>
    </div>
  );
};

// ==================== BREATHING INDICATOR ====================
interface BreathingIndicatorProps {
  phase: 'inhale' | 'hold' | 'exhale';
  duration: number;
  size?: number;
  color?: string;
}

export const BreathingIndicator: React.FC<BreathingIndicatorProps> = ({
  phase,
  duration,
  size = 120,
  color = '#059ae9'
}) => {
  const prefersReducedMotion = getPrefersReducedMotion();
  
  const getScale = () => {
    switch (phase) {
      case 'inhale': return 1.3;
      case 'hold': return 1.3;
      case 'exhale': return 1;
    }
  };

  const getOpacity = () => {
    switch (phase) {
      case 'inhale': return 1;
      case 'hold': return 0.8;
      case 'exhale': return 0.6;
    }
  };

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: color,
        transform: prefersReducedMotion ? 'scale(1)' : `scale(${getScale()})`,
        opacity: getOpacity(),
        transition: prefersReducedMotion
          ? 'none'
          : createTransition(['transform', 'opacity'], duration * 1000, EASINGS.therapeutic),
      }}
    />
  );
};

// Export all micro-interactions
export default {
  RippleEffect,
  HoverLift,
  FocusGlow,
  PressScale,
  LoadingDots,
  SuccessCheckmark,
  ErrorShake,
  GentlePulse,
  SkeletonLoader,
  Tooltip,
  ProgressBar,
  BreathingIndicator,
};