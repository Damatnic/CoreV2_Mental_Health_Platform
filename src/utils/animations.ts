/**
 * THERAPEUTIC ANIMATION SYSTEM
 * 
 * Comprehensive animation library optimized for mental health applications
 * with a focus on calming, non-jarring transitions that reduce anxiety
 * and support users during vulnerable moments.
 */

import { CSSProperties } from 'react';

// Animation configuration interface
interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  playState?: 'running' | 'paused';
}

// Preset animation durations (in milliseconds)
export const DURATIONS = {
  instant: 0,
  fast: 150,
  base: 300,
  moderate: 500,
  slow: 750,
  slower: 1000,
  therapeutic: 2000,
  breathing: 4000,
  meditation: 8000,
} as const;

// Therapeutic easing functions
export const EASINGS = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  therapeutic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  gentle: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  overshoot: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  anticipate: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  decelerate: 'cubic-bezier(0, 0, 0.58, 1)',
  accelerate: 'cubic-bezier(0.42, 0, 1, 1)',
} as const;

// Predefined keyframe animations
export const KEYFRAMES = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  fadeOut: `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,
  slideInUp: `
    @keyframes slideInUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  slideInDown: `
    @keyframes slideInDown {
      from {
        transform: translateY(-30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  slideInLeft: `
    @keyframes slideInLeft {
      from {
        transform: translateX(-30px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,
  slideInRight: `
    @keyframes slideInRight {
      from {
        transform: translateX(30px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,
  gentlePulse: `
    @keyframes gentlePulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.9;
      }
    }
  `,
  breathingCircle: `
    @keyframes breathingCircle {
      0%, 100% {
        transform: scale(1);
        opacity: 0.8;
      }
      25% {
        transform: scale(1.2);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
      }
      75% {
        transform: scale(1);
        opacity: 0.8;
      }
    }
  `,
  gentleFloat: `
    @keyframes gentleFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `,
  ripple: `
    @keyframes ripple {
      from {
        transform: scale(0);
        opacity: 1;
      }
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `,
  checkmark: `
    @keyframes checkmark {
      0% {
        stroke-dashoffset: 100;
      }
      100% {
        stroke-dashoffset: 0;
      }
    }
  `,
  errorShake: `
    @keyframes errorShake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
      20%, 40%, 60%, 80% { transform: translateX(2px); }
    }
  `,
  successBounce: `
    @keyframes successBounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-20px); }
      60% { transform: translateY(-10px); }
    }
  `,
  loadingDots: `
    @keyframes loadingDots {
      0%, 80%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      40% {
        transform: scale(1.3);
        opacity: 0.5;
      }
    }
  `,
};

/**
 * Create CSS animation property string
 */
export function createAnimation(
  name: string,
  config: AnimationConfig = {}
): string {
  const {
    duration = DURATIONS.base,
    delay = 0,
    easing = EASINGS.therapeutic,
    iterationCount = 1,
    direction = 'normal',
    fillMode = 'both',
    playState = 'running',
  } = config;

  return `${name} ${duration}ms ${easing} ${delay}ms ${iterationCount} ${direction} ${fillMode} ${playState}`;
}

/**
 * Create CSS transition property string
 */
export function createTransition(
  properties: string | string[],
  duration: number = DURATIONS.base,
  easing: string = EASINGS.therapeutic,
  delay: number = 0
): string {
  const props = Array.isArray(properties) ? properties : [properties];
  return props
    .map(prop => `${prop} ${duration}ms ${easing} ${delay}ms`)
    .join(', ');
}

/**
 * Stagger animation delays for list items
 */
export function staggerDelay(
  index: number,
  baseDelay: number = 0,
  increment: number = 50
): number {
  return baseDelay + index * increment;
}

/**
 * Generate spring physics animation
 */
export function springAnimation(
  stiffness: number = 200,
  damping: number = 20,
  mass: number = 1
): string {
  // Simplified spring animation using CSS cubic-bezier approximation
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
  
  if (dampingRatio < 1) {
    // Underdamped - will oscillate
    return EASINGS.bounce;
  } else if (dampingRatio === 1) {
    // Critically damped
    return EASINGS.therapeutic;
  } else {
    // Overdamped
    return EASINGS.easeOut;
  }
}

/**
 * Micro-interaction animation presets
 */
export const MICRO_INTERACTIONS = {
  buttonPress: {
    transform: 'scale(0.98)',
    transition: createTransition('transform', DURATIONS.fast),
  },
  buttonRelease: {
    transform: 'scale(1)',
    transition: createTransition('transform', DURATIONS.fast, EASINGS.bounce),
  },
  hoverLift: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: createTransition(['transform', 'box-shadow'], DURATIONS.base),
  },
  focusGlow: {
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)',
    transition: createTransition('box-shadow', DURATIONS.fast),
  },
  successPulse: {
    animation: createAnimation('gentlePulse', {
      duration: DURATIONS.therapeutic,
      iterationCount: 2,
    }),
  },
  errorShake: {
    animation: createAnimation('errorShake', {
      duration: DURATIONS.moderate,
    }),
  },
  loadingPulse: {
    animation: createAnimation('gentlePulse', {
      duration: DURATIONS.slower,
      iterationCount: 'infinite',
    }),
  },
} as const;

/**
 * Page transition presets
 */
export const PAGE_TRANSITIONS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: DURATIONS.base / 1000, ease: EASINGS.therapeutic },
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: { duration: DURATIONS.base / 1000, ease: EASINGS.therapeutic },
  },
  slideRight: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: DURATIONS.base / 1000, ease: EASINGS.therapeutic },
  },
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.05, opacity: 0 },
    transition: { duration: DURATIONS.base / 1000, ease: EASINGS.therapeutic },
  },
} as const;

/**
 * Crisis mode animation overrides
 */
export const CRISIS_ANIMATIONS = {
  immediate: {
    duration: DURATIONS.instant,
    easing: EASINGS.linear,
  },
  urgent: {
    duration: DURATIONS.fast,
    easing: EASINGS.easeOut,
  },
  clear: {
    duration: DURATIONS.base,
    easing: EASINGS.easeInOut,
  },
} as const;

/**
 * Accessibility-aware animation wrapper
 */
export function accessibleAnimation(
  animation: string | CSSProperties,
  prefersReducedMotion: boolean
): string | CSSProperties {
  if (prefersReducedMotion) {
    if (typeof animation === 'string') {
      // Remove or reduce animation
      return animation.replace(/(\d+)ms/g, '0ms');
    } else {
      // Remove animation properties
      const { animation: _, transition: __, ...rest } = animation;
      return rest;
    }
  }
  return animation;
}

/**
 * Generate skeleton loading animation
 */
export function skeletonAnimation(): CSSProperties {
  return {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: createAnimation('shimmer', {
      duration: DURATIONS.slower * 1.5,
      iterationCount: 'infinite',
      easing: EASINGS.linear,
    }),
  };
}

/**
 * Generate progress animation
 */
export function progressAnimation(progress: number): CSSProperties {
  return {
    width: `${progress}%`,
    transition: createTransition('width', DURATIONS.moderate, EASINGS.easeOut),
  };
}

/**
 * Generate notification entrance animation
 */
export function notificationAnimation(position: 'top' | 'bottom' = 'top'): CSSProperties {
  const translateY = position === 'top' ? '-100%' : '100%';
  return {
    animation: createAnimation(position === 'top' ? 'slideInDown' : 'slideInUp', {
      duration: DURATIONS.base,
      easing: EASINGS.overshoot,
      fillMode: 'forwards',
    }),
    transform: `translateY(${translateY})`,
  };
}

/**
 * Export all keyframes as a single CSS string for injection
 */
export const ALL_KEYFRAMES = Object.values(KEYFRAMES).join('\n');

// Helper to check if user prefers reduced motion
export function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Helper to apply animation with reduced motion check
export function applyAnimation(
  element: HTMLElement,
  animation: string | CSSProperties
): void {
  const prefersReducedMotion = getPrefersReducedMotion();
  const finalAnimation = accessibleAnimation(animation, prefersReducedMotion);
  
  if (typeof finalAnimation === 'string') {
    element.style.animation = finalAnimation;
  } else {
    Object.assign(element.style, finalAnimation);
  }
}