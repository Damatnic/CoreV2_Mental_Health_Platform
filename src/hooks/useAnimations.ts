import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useReducedMotion } from './useReducedMotion';

// Types
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface TransitionConfig extends AnimationConfig {
  property?: string;
  timingFunction?: string;
}

export interface SpringConfig {
  tension?: number;
  friction?: number;
  mass?: number;
  clamp?: boolean;
  precision?: number;
  velocity?: number;
}

export interface AnimationState {
  isAnimating: boolean;
  progress: number;
  iteration: number;
  direction: 'forward' | 'reverse';
}

export interface UseAnimationReturn {
  isAnimating: boolean;
  progress: number;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  state: AnimationState;
}

// Default configurations
const DEFAULT_ANIMATION_CONFIG: Required<AnimationConfig> = {
  duration: 300,
  delay: 0,
  easing: 'ease-out',
  iterations: 1,
  direction: 'normal',
  fillMode: 'forwards'
};

const DEFAULT_SPRING_CONFIG: Required<SpringConfig> = {
  tension: 170,
  friction: 26,
  mass: 1,
  clamp: false,
  precision: 0.01,
  velocity: 0
};

// Animation presets
export const ANIMATION_PRESETS = {
  fadeIn: { duration: 300, easing: 'ease-out' },
  fadeOut: { duration: 200, easing: 'ease-in' },
  slideIn: { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  slideOut: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
  bounce: { duration: 600, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  elastic: { duration: 800, easing: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)' },
  gentle: { duration: 500, easing: 'ease-in-out' },
  snappy: { duration: 150, easing: 'ease-out' },
  slow: { duration: 800, easing: 'ease-out' },
  fast: { duration: 100, easing: 'linear' }
} as const;

// Spring animation presets
export const SPRING_PRESETS = {
  gentle: { tension: 120, friction: 14 },
  wobbly: { tension: 180, friction: 12 },
  stiff: { tension: 210, friction: 20 },
  slow: { tension: 280, friction: 60 },
  molasses: { tension: 280, friction: 120 }
} as const;

// Easing functions
export const EASING_FUNCTIONS = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  easeOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
  easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
  easeInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
  easeOutCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
  easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
} as const;

// Main animation hook
export const useAnimation = (
  config: AnimationConfig = {}
): UseAnimationReturn => {
  const prefersReducedMotion = useReducedMotion();
  const animationRef = useRef<Animation | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<AnimationState>({
    isAnimating: false,
    progress: 0,
    iteration: 0,
    direction: 'forward'
  });

  const finalConfig = useMemo(
    () => ({ ...DEFAULT_ANIMATION_CONFIG, ...config }),
    [config]
  );

  const start = useCallback(() => {
    if (prefersReducedMotion || !elementRef.current) return;

    setState(prev => ({ ...prev, isAnimating: true }));
    
    // Create animation if not exists
    if (!animationRef.current) {
      const keyframes = [
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ];

      animationRef.current = elementRef.current.animate(keyframes, {
        duration: finalConfig.duration,
        delay: finalConfig.delay,
        easing: finalConfig.easing,
        iterations: finalConfig.iterations,
        direction: finalConfig.direction,
        fill: finalConfig.fillMode
      });

      // Listen for animation events
      animationRef.current.addEventListener('finish', () => {
        setState(prev => ({ ...prev, isAnimating: false, progress: 1 }));
      });

      animationRef.current.addEventListener('cancel', () => {
        setState(prev => ({ ...prev, isAnimating: false }));
      });
    }

    animationRef.current.play();
  }, [prefersReducedMotion, finalConfig]);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
      setState(prev => ({ ...prev, isAnimating: false, progress: 0 }));
    }
  }, []);

  const pause = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  const reset = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.currentTime = 0;
      setState(prev => ({ ...prev, progress: 0, iteration: 0 }));
    }
  }, []);

  // Update progress based on animation current time
  useEffect(() => {
    if (!animationRef.current) return;

    const updateProgress = () => {
      if (animationRef.current) {
        const currentTime = animationRef.current.currentTime || 0;
        const totalDuration = finalConfig.duration * finalConfig.iterations;
        const progress = Math.min(currentTime / totalDuration, 1);
        
        setState(prev => ({ ...prev, progress }));
      }
    };

    const intervalId = setInterval(updateProgress, 16); // ~60fps

    return () => clearInterval(intervalId);
  }, [finalConfig.duration, finalConfig.iterations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, []);

  return {
    isAnimating: state.isAnimating,
    progress: state.progress,
    start,
    stop,
    pause,
    resume,
    reset,
    state
  };
};

// Fade animation hook
export const useFadeAnimation = (config: AnimationConfig = {}) => {
  const animation = useAnimation({
    ...ANIMATION_PRESETS.fadeIn,
    ...config
  });

  const fadeIn = useCallback(() => animation.start(), [animation]);
  const fadeOut = useCallback(() => animation.start(), [animation]);

  return {
    ...animation,
    fadeIn,
    fadeOut
  };
};

// Slide animation hook
export const useSlideAnimation = (
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  config: AnimationConfig = {}
) => {
  const animation = useAnimation({
    ...ANIMATION_PRESETS.slideIn,
    ...config
  });

  const slideIn = useCallback(() => animation.start(), [animation]);
  const slideOut = useCallback(() => animation.start(), [animation]);

  return {
    ...animation,
    slideIn,
    slideOut,
    direction
  };
};

// Scale animation hook
export const useScaleAnimation = (config: AnimationConfig = {}) => {
  const animation = useAnimation({
    ...ANIMATION_PRESETS.bounce,
    ...config
  });

  const scaleIn = useCallback(() => animation.start(), [animation]);
  const scaleOut = useCallback(() => animation.start(), [animation]);

  return {
    ...animation,
    scaleIn,
    scaleOut
  };
};

// Spring animation hook
export const useSpringAnimation = (
  springConfig: SpringConfig = {},
  animationConfig: AnimationConfig = {}
) => {
  const finalSpringConfig = useMemo(
    () => ({ ...DEFAULT_SPRING_CONFIG, ...springConfig }),
    [springConfig]
  );

  // Convert spring config to CSS animation duration and easing
  const { tension, friction } = finalSpringConfig;
  const duration = Math.round(1000 / Math.sqrt(tension / 10));
  const damping = friction / (2 * Math.sqrt(tension * 10));
  
  const easing = `cubic-bezier(0.25, ${damping}, 0.5, 1)`;

  return useAnimation({
    duration,
    easing,
    ...animationConfig
  });
};

// Stagger animation hook
export const useStaggerAnimation = (
  count: number,
  delay: number = 100,
  config: AnimationConfig = {}
) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const startStagger = useCallback(() => {
    // Clear existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setActiveIndex(-1);

    for (let i = 0; i < count; i++) {
      const timeout = setTimeout(() => {
        setActiveIndex(i);
      }, i * delay);
      
      timeoutsRef.current.push(timeout);
    }
  }, [count, delay]);

  const stopStagger = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setActiveIndex(-1);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  return {
    activeIndex,
    startStagger,
    stopStagger,
    isActive: (index: number) => index <= activeIndex
  };
};

// Sequence animation hook
export const useSequenceAnimation = (
  animations: Array<{ duration: number; delay?: number }>
) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const start = useCallback(() => {
    setIsPlaying(true);
    setCurrentIndex(0);

    let totalDelay = 0;
    animations.forEach((anim, index) => {
      setTimeout(() => {
        setCurrentIndex(index);
        
        setTimeout(() => {
          if (index === animations.length - 1) {
            setIsPlaying(false);
            setCurrentIndex(-1);
          }
        }, anim.duration);
      }, totalDelay);
      
      totalDelay += (anim.delay || 0) + anim.duration;
    });
  }, [animations]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(-1);
  }, []);

  return {
    currentIndex,
    isPlaying,
    start,
    stop,
    isActive: (index: number) => index === currentIndex
  };
};

// Animation utilities
export const createTransition = (config: TransitionConfig): string => {
  const {
    property = 'all',
    duration = 300,
    timingFunction = 'ease-out',
    delay = 0
  } = config;

  return `${property} ${duration}ms ${timingFunction} ${delay}ms`;
};

export const createKeyframes = (name: string, keyframes: Record<string, any>): string => {
  const keyframeEntries = Object.entries(keyframes)
    .map(([key, styles]) => {
      const styleString = Object.entries(styles)
        .map(([prop, value]) => `${prop}: ${value}`)
        .join('; ');
      return `${key} { ${styleString} }`;
    })
    .join('\n  ');

  return `@keyframes ${name} {\n  ${keyframeEntries}\n}`;
};

// Export everything
export default useAnimation;
