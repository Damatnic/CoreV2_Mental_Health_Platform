/**
 * Animation Utilities
 * 
 * Comprehensive animation system for micro-interactions and page transitions
 * with therapeutic and crisis-aware animations for mental health applications.
 * 
 * @fileoverview Animation utilities and therapeutic motion design
 * @version 2.0.0
 */

/**
 * Animation easing types
 */
export type AnimationEasing = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'therapeutic'
  | 'bounce'
  | 'back'
  | 'elastic';

/**
 * Animation direction types
 */
export type AnimationDirection = 
  | 'normal' 
  | 'reverse' 
  | 'alternate' 
  | 'alternate-reverse';

/**
 * Animation fill mode types
 */
export type AnimationFillMode = 
  | 'none' 
  | 'forwards' 
  | 'backwards' 
  | 'both';

/**
 * Animation options interface
 */
export interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: AnimationEasing;
  direction?: AnimationDirection;
  fillMode?: AnimationFillMode;
  iterationCount?: number | 'infinite';
}

/**
 * Transition options interface
 */
export interface TransitionOptions {
  duration?: number;
  delay?: number;
  easing?: AnimationEasing;
  property?: string | string[];
}

/**
 * Animation CSS Variables
 */
export const animationVars = {
  // Durations
  'duration-instant': '75ms',
  'duration-fast': '150ms',
  'duration-normal': '300ms',
  'duration-slow': '500ms',
  'duration-slower': '700ms',
  
  // Easing functions
  'ease-linear': 'cubic-bezier(0, 0, 1, 1)',
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'ease-therapeutic': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'ease-back': 'cubic-bezier(0.68, -0.3, 0.32, 1)',
  'ease-elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
} as const;

/**
 * Page Transition Animations
 */
export const pageTransitions = {
  fadeIn: {
    name: 'page-fade-in',
    keyframes: `
      @keyframes page-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
    defaultOptions: {
      duration: 300,
      easing: 'ease-out' as AnimationEasing
    }
  },
  
  slideInUp: {
    name: 'page-slide-in-up',
    keyframes: `
      @keyframes page-slide-in-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
    defaultOptions: {
      duration: 400,
      easing: 'therapeutic' as AnimationEasing
    }
  },
  
  slideInDown: {
    name: 'page-slide-in-down',
    keyframes: `
      @keyframes page-slide-in-down {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
    defaultOptions: {
      duration: 400,
      easing: 'therapeutic' as AnimationEasing
    }
  },
  
  slideInLeft: {
    name: 'page-slide-in-left',
    keyframes: `
      @keyframes page-slide-in-left {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `,
    defaultOptions: {
      duration: 400,
      easing: 'therapeutic' as AnimationEasing
    }
  },
  
  slideInRight: {
    name: 'page-slide-in-right',
    keyframes: `
      @keyframes page-slide-in-right {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `,
    defaultOptions: {
      duration: 400,
      easing: 'therapeutic' as AnimationEasing
    }
  },
  
  scaleIn: {
    name: 'page-scale-in',
    keyframes: `
      @keyframes page-scale-in {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
    defaultOptions: {
      duration: 300,
      easing: 'back' as AnimationEasing
    }
  }
} as const;

/**
 * Micro-interaction Animations
 */
export const microInteractions = {
  buttonPress: {
    name: 'button-press',
    keyframes: `
      @keyframes button-press {
        0% { transform: scale(1); }
        50% { transform: scale(0.98); }
        100% { transform: scale(1); }
      }
    `,
    defaultOptions: {
      duration: 150,
      easing: 'ease-out' as AnimationEasing
    }
  },
  
  buttonHover: {
    name: 'button-hover',
    keyframes: `
      @keyframes button-hover {
        0% { transform: translateY(0); }
        100% { transform: translateY(-2px); }
      }
    `,
    defaultOptions: {
      duration: 200,
      easing: 'ease-out' as AnimationEasing
    }
  },
  
  cardFloat: {
    name: 'card-float',
    keyframes: `
      @keyframes card-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
    `,
    defaultOptions: {
      duration: 3000,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  cardHover: {
    name: 'card-hover',
    keyframes: `
      @keyframes card-hover {
        0% {
          transform: translateY(0) scale(1);
          box-shadow: var(--shadow-sm);
        }
        100% {
          transform: translateY(-4px) scale(1.02);
          box-shadow: var(--shadow-lg);
        }
      }
    `,
    defaultOptions: {
      duration: 200,
      easing: 'therapeutic' as AnimationEasing
    }
  },
  
  pulse: {
    name: 'pulse',
    keyframes: `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.05);
        }
      }
    `,
    defaultOptions: {
      duration: 2000,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  heartbeat: {
    name: 'heartbeat',
    keyframes: `
      @keyframes heartbeat {
        0% { transform: scale(1); }
        14% { transform: scale(1.1); }
        28% { transform: scale(1); }
        42% { transform: scale(1.1); }
        70% { transform: scale(1); }
      }
    `,
    defaultOptions: {
      duration: 1500,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  breathe: {
    name: 'breathe',
    keyframes: `
      @keyframes breathe {
        0%, 100% {
          transform: scale(1);
          opacity: 0.8;
        }
        50% {
          transform: scale(1.1);
          opacity: 1;
        }
      }
    `,
    defaultOptions: {
      duration: 4000,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  glow: {
    name: 'glow',
    keyframes: `
      @keyframes glow {
        0%, 100% {
          box-shadow: var(--shadow-sm);
        }
        50% {
          box-shadow: var(--shadow-md), var(--shadow-glow-primary);
        }
      }
    `,
    defaultOptions: {
      duration: 2000,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  shake: {
    name: 'shake',
    keyframes: `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
      }
    `,
    defaultOptions: {
      duration: 600,
      easing: 'ease-in-out' as AnimationEasing
    }
  },
  
  bounce: {
    name: 'bounce',
    keyframes: `
      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
          animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
        }
        50% {
          transform: translateY(-8px);
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
        }
      }
    `,
    defaultOptions: {
      duration: 1000,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  swing: {
    name: 'swing',
    keyframes: `
      @keyframes swing {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(5deg); }
        75% { transform: rotate(-5deg); }
      }
    `,
    defaultOptions: {
      duration: 1000,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  }
} as const;

/**
 * Loading Animations
 */
export const loadingAnimations = {
  spin: {
    name: 'spin',
    keyframes: `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `,
    defaultOptions: {
      duration: 1000,
      easing: 'linear' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  dots: {
    name: 'loading-dots',
    keyframes: `
      @keyframes loading-dots {
        0%, 80%, 100% {
          opacity: 0.3;
          transform: scale(0.8);
        }
        40% {
          opacity: 1;
          transform: scale(1.2);
        }
      }
    `,
    defaultOptions: {
      duration: 1400,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  wave: {
    name: 'loading-wave',
    keyframes: `
      @keyframes loading-wave {
        0% { background-position: -200px 0; }
        100% { background-position: 200px 0; }
      }
    `,
    defaultOptions: {
      duration: 1600,
      easing: 'linear' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  progress: {
    name: 'progress-bar',
    keyframes: `
      @keyframes progress-bar {
        from { transform: scaleX(0); }
        to { transform: scaleX(1); }
      }
    `,
    defaultOptions: {
      duration: 1000,
      easing: 'ease-out' as AnimationEasing
    }
  }
} as const;

/**
 * Therapeutic Animations
 */
export const therapeuticAnimations = {
  calmingBreath: {
    name: 'calming-breath',
    keyframes: `
      @keyframes calming-breath {
        0%, 100% {
          transform: scale(1);
          opacity: 0.7;
        }
        25% {
          transform: scale(1.15);
          opacity: 1;
        }
        50% {
          transform: scale(1.15);
          opacity: 1;
        }
        75% {
          transform: scale(1);
          opacity: 0.7;
        }
      }
    `,
    defaultOptions: {
      duration: 8000,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  gentleFloat: {
    name: 'gentle-float',
    keyframes: `
      @keyframes gentle-float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        33% { transform: translateY(-8px) rotate(1deg); }
        66% { transform: translateY(4px) rotate(-1deg); }
      }
    `,
    defaultOptions: {
      duration: 6000,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  soothingGlow: {
    name: 'soothing-glow',
    keyframes: `
      @keyframes soothing-glow {
        0%, 100% {
          box-shadow: var(--shadow-sm);
          opacity: 0.8;
        }
        50% {
          box-shadow: var(--shadow-md), 0 0 20px rgba(14, 165, 233, 0.3);
          opacity: 1;
        }
      }
    `,
    defaultOptions: {
      duration: 3000,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  peaceRipple: {
    name: 'peace-ripple',
    keyframes: `
      @keyframes peace-ripple {
        0% {
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
        }
        70% {
          box-shadow: 0 0 0 20px rgba(34, 197, 94, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
        }
      }
    `,
    defaultOptions: {
      duration: 2000,
      easing: 'ease-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  }
} as const;

/**
 * Crisis Animations
 */
export const crisisAnimations = {
  urgentPulse: {
    name: 'urgent-pulse',
    keyframes: `
      @keyframes urgent-pulse {
        0%, 100% {
          box-shadow: var(--shadow-sm);
        }
        50% {
          box-shadow: var(--shadow-lg), var(--shadow-glow-crisis);
        }
      }
    `,
    defaultOptions: {
      duration: 1000,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  alertBlink: {
    name: 'alert-blink',
    keyframes: `
      @keyframes alert-blink {
        0%, 50% { opacity: 1; }
        25%, 75% { opacity: 0.3; }
      }
    `,
    defaultOptions: {
      duration: 1200,
      easing: 'ease-in-out' as AnimationEasing,
      iterationCount: 'infinite' as const
    }
  },
  
  safeTransition: {
    name: 'safe-transition',
    keyframes: `
      @keyframes safe-transition {
        0% {
          background: var(--color-error-50);
          border-color: var(--color-error-200);
        }
        100% {
          background: var(--color-success-50);
          border-color: var(--color-success-200);
        }
      }
    `,
    defaultOptions: {
      duration: 1000,
      easing: 'ease-in-out' as AnimationEasing
    }
  }
} as const;

/**
 * Animation Utility Functions
 */
export const getEasingFunction = (easing: AnimationEasing): string => {
  const easingMap = {
    linear: animationVars['ease-linear'],
    ease: 'ease',
    'ease-in': animationVars['ease-in'],
    'ease-out': animationVars['ease-out'],
    'ease-in-out': animationVars['ease-in-out'],
    therapeutic: animationVars['ease-therapeutic'],
    bounce: animationVars['ease-bounce'],
    back: animationVars['ease-back'],
    elastic: animationVars['ease-elastic']
  };
  
  return easingMap[easing] || animationVars['ease-out'];
};

/**
 * Create animation CSS string
 */
export const createAnimationCSS = (
  name: string,
  options: AnimationOptions = {}
): string => {
  const {
    duration = 300,
    delay = 0,
    easing = 'ease-out',
    direction = 'normal',
    fillMode = 'both',
    iterationCount = 1
  } = options;
  
  const easingFunction = getEasingFunction(easing);
  const iterationValue = typeof iterationCount === 'number' 
    ? iterationCount.toString() 
    : iterationCount;
  
  return `${name} ${duration}ms ${easingFunction} ${delay}ms ${iterationValue} ${direction} ${fillMode}`;
};

/**
 * Create transition CSS string
 */
export const createTransitionCSS = (
  options: TransitionOptions = {}
): string => {
  const {
    duration = 300,
    delay = 0,
    easing = 'ease-out',
    property = 'all'
  } = options;
  
  const easingFunction = getEasingFunction(easing);
  const properties = Array.isArray(property) ? property.join(', ') : property;
  
  return `${properties} ${duration}ms ${easingFunction} ${delay}ms`;
};

/**
 * Animation Hook for React Components
 */
export const useAnimation = (
  element: HTMLElement | null,
  animationName: string,
  options: AnimationOptions = {}
): {
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
} => {
  const play = (): void => {
    if (!element) return;
    const animation = createAnimationCSS(animationName, options);
    element.style.animation = animation;
  };
  
  const pause = (): void => {
    if (!element) return;
    element.style.animationPlayState = 'paused';
  };
  
  const resume = (): void => {
    if (!element) return;
    element.style.animationPlayState = 'running';
  };
  
  const stop = (): void => {
    if (!element) return;
    element.style.animation = 'none';
  };
  
  return { play, pause, resume, stop };
};

/**
 * Generate CSS for all animations
 */
export const generateAnimationCSS = (): string => {
  const allAnimations = {
    ...pageTransitions,
    ...microInteractions,
    ...loadingAnimations,
    ...therapeuticAnimations,
    ...crisisAnimations
  };
  
  return Object.values(allAnimations)
    .map(animation => animation.keyframes)
    .join('\n\n');
};

/**
 * Intersection Observer Animation Utility
 */
export const createScrollRevealObserver = (
  className: string = 'scroll-reveal',
  options: IntersectionObserverInit = {}
): {
  observe: (element: Element) => void;
  unobserve: (element: Element) => void;
  disconnect: () => void;
} => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    ...options
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        entry.target.classList.remove('animate-out');
      }
    });
  }, defaultOptions);
  
  const observe = (element: Element): void => {
    element.classList.add(className);
    observer.observe(element);
  };
  
  const unobserve = (element: Element): void => {
    observer.unobserve(element);
  };
  
  const disconnect = (): void => {
    observer.disconnect();
  };
  
  return { observe, unobserve, disconnect };
};

/**
 * Performance-aware animation utilities
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Respect motion preference
 */
export const respectMotionPreference = <T extends AnimationOptions>(
  options: T
): T => {
  if (prefersReducedMotion()) {
    return {
      ...options,
      duration: 0,
      iterationCount: 1
    };
  }
  return options;
};

// Default export with all utilities
export default {
  animationVars,
  pageTransitions,
  microInteractions,
  loadingAnimations,
  therapeuticAnimations,
  crisisAnimations,
  getEasingFunction,
  createAnimationCSS,
  createTransitionCSS,
  useAnimation,
  generateAnimationCSS,
  createScrollRevealObserver,
  prefersReducedMotion,
  respectMotionPreference
};
