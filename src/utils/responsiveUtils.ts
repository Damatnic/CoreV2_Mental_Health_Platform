/**
 * Responsive Design Utilities
 * 
 * Comprehensive utilities for mobile-first responsive design with TypeScript support.
 * Provides breakpoint management, viewport detection, responsive values, and device utilities.
 * 
 * @fileoverview Responsive design utilities and helpers
 * @version 2.0.0
 */

/**
 * Breakpoint definitions for consistent responsive design
 */
export const breakpoints = {
  xs: 320,    // Extra small devices
  sm: 576,    // Small devices (landscape phones)
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (desktops)
  xl: 1280,   // Extra large devices
  xxl: 1536   // Ultra wide screens
} as const;

export type BreakpointKey = keyof typeof breakpoints;

/**
 * Get current breakpoint based on window width
 */
export const getCurrentBreakpoint = (): BreakpointKey => {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  
  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.lg) return 'md';
  if (width < breakpoints.xl) return 'lg';
  if (width < breakpoints.xxl) return 'xl';
  return 'xxl';
};

/**
 * Check if current viewport is mobile
 */
export const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.md;
};

/**
 * Check if current viewport is tablet
 */
export const isTabletViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= breakpoints.md && width < breakpoints.lg;
};

/**
 * Check if current viewport is desktop
 */
export const isDesktopViewport = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= breakpoints.lg;
};

/**
 * Responsive value configuration
 */
export interface ResponsiveValues<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
  default: T;
}

/**
 * Get responsive value based on current breakpoint
 */
export const getResponsiveValue = <T>(values: ResponsiveValues<T>): T => {
  const breakpoint = getCurrentBreakpoint();
  return values[breakpoint] ?? values.default;
};

/**
 * Calculate responsive font size
 */
export const getResponsiveFontSize = (baseSize: number): string => {
  const multipliers: Record<BreakpointKey, number> = {
    xs: 0.875,
    sm: 0.9375,
    md: 1,
    lg: 1,
    xl: 1.0625,
    xxl: 1.125
  };
  
  const breakpoint = getCurrentBreakpoint();
  const multiplier = multipliers[breakpoint];
  return `${baseSize * multiplier}rem`;
};

/**
 * Calculate responsive spacing
 */
export const getResponsiveSpacing = (baseSpacing: number): string => {
  const multipliers: Record<BreakpointKey, number> = {
    xs: 0.75,
    sm: 0.875,
    md: 1,
    lg: 1,
    xl: 1.125,
    xxl: 1.25
  };
  
  const breakpoint = getCurrentBreakpoint();
  const multiplier = multipliers[breakpoint];
  return `${baseSpacing * multiplier}rem`;
};

/**
 * Get number of columns for responsive grid
 */
export const getResponsiveColumns = (): number => {
  return getResponsiveValue({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    xxl: 6,
    default: 3
  });
};

/**
 * Touch-optimized sizing for interactive elements
 */
export const getTouchTargetSize = (): number => {
  // Minimum 44px for touch targets (WCAG guideline)
  return isMobileViewport() ? 44 : 36;
};

/**
 * Get container max width for current breakpoint
 */
export const getContainerMaxWidth = (): string => {
  return getResponsiveValue({
    xs: '100%',
    sm: '540px',
    md: '720px',
    lg: '960px',
    xl: '1140px',
    xxl: '1320px',
    default: '1140px'
  });
};

/**
 * Viewport utilities
 */
export const viewport = {
  width: (): number => {
    if (typeof window === 'undefined') return 0;
    return window.innerWidth || document.documentElement.clientWidth;
  },

  height: (): number => {
    if (typeof window === 'undefined') return 0;
    return window.innerHeight || document.documentElement.clientHeight;
  },

  aspectRatio: (): number => {
    const width = viewport.width();
    const height = viewport.height();
    return height > 0 ? width / height : 1;
  },

  isPortrait: (): boolean => {
    return viewport.aspectRatio() < 1;
  },

  isLandscape: (): boolean => {
    return viewport.aspectRatio() >= 1;
  }
};

/**
 * Device detection utilities
 */
export const device = {
  isTouchDevice: (): boolean => {
    if (typeof window === 'undefined') return false;
    const navigatorWithMsTouch = navigator as any & { msMaxTouchPoints?: number };
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigatorWithMsTouch.msMaxTouchPoints || 0) > 0
    );
  },

  isIOS: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const windowWithMSStream = window as any & { MSStream?: any };
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !windowWithMSStream.MSStream;
  },

  isAndroid: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
  },

  isMobile: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  isStandalone: (): boolean => {
    if (typeof window === 'undefined') return false;
    const navigatorWithStandalone = window.navigator as any & { standalone?: boolean };
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigatorWithStandalone.standalone || false) ||
      document.referrer.includes('android-app://')
    );
  }
};

/**
 * Safe area insets for devices with notches
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  
  const computedStyle = getComputedStyle(document.documentElement);
  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
  };
};

/**
 * Responsive CSS class configuration
 */
export interface ResponsiveClassModifiers {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  xxl?: string;
}

/**
 * Generate responsive CSS classes
 */
export const getResponsiveClasses = (
  baseClass: string,
  modifiers?: ResponsiveClassModifiers
): string => {
  const classes = [baseClass];
  
  if (modifiers) {
    const breakpoint = getCurrentBreakpoint();
    const modifier = modifiers[breakpoint];
    if (modifier) {
      classes.push(`${baseClass}--${modifier}`);
    }
  }
  
  classes.push(`${baseClass}--${getCurrentBreakpoint()}`);
  
  if (isMobileViewport()) {
    classes.push(`${baseClass}--mobile`);
  } else if (isTabletViewport()) {
    classes.push(`${baseClass}--tablet`);
  } else {
    classes.push(`${baseClass}--desktop`);
  }
  
  return classes.join(' ');
};

/**
 * Debounced resize handler for performance
 */
export const onResponsiveResize = (
  callback: (breakpoint: BreakpointKey) => void,
  delay: number = 250
): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  let timeoutId: NodeJS.Timeout;
  let lastBreakpoint = getCurrentBreakpoint();
  
  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const currentBreakpoint = getCurrentBreakpoint();
      if (currentBreakpoint !== lastBreakpoint) {
        lastBreakpoint = currentBreakpoint;
        callback(currentBreakpoint);
      }
    }, delay);
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  // Return cleanup function
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
};

/**
 * Media query string generator
 */
export const mediaQuery = {
  up: (breakpoint: BreakpointKey): string => {
    return `(min-width: ${breakpoints[breakpoint]}px)`;
  },

  down: (breakpoint: BreakpointKey): string => {
    return `(max-width: ${breakpoints[breakpoint] - 1}px)`;
  },

  between: (min: BreakpointKey, max: BreakpointKey): string => {
    return `(min-width: ${breakpoints[min]}px) and (max-width: ${breakpoints[max] - 1}px)`;
  },

  only: (breakpoint: BreakpointKey): string => {
    const keys = Object.keys(breakpoints) as Array<BreakpointKey>;
    const index = keys.indexOf(breakpoint);
    
    if (index === 0) {
      return mediaQuery.down(keys[1]);
    }
    
    if (index === keys.length - 1) {
      return mediaQuery.up(breakpoint);
    }
    
    return mediaQuery.between(breakpoint, keys[index + 1]);
  }
};

/**
 * Responsive utility hook for React components
 */
export interface ResponsiveState {
  breakpoint: BreakpointKey;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewport: {
    width: number;
    height: number;
    aspectRatio: number;
    isPortrait: boolean;
    isLandscape: boolean;
  };
  device: {
    isTouchDevice: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isMobile: boolean;
    isStandalone: boolean;
  };
}

/**
 * Get current responsive state
 */
export const getResponsiveState = (): ResponsiveState => {
  const breakpoint = getCurrentBreakpoint();
  
  return {
    breakpoint,
    isMobile: isMobileViewport(),
    isTablet: isTabletViewport(),
    isDesktop: isDesktopViewport(),
    viewport: {
      width: viewport.width(),
      height: viewport.height(),
      aspectRatio: viewport.aspectRatio(),
      isPortrait: viewport.isPortrait(),
      isLandscape: viewport.isLandscape()
    },
    device: {
      isTouchDevice: device.isTouchDevice(),
      isIOS: device.isIOS(),
      isAndroid: device.isAndroid(),
      isMobile: device.isMobile(),
      isStandalone: device.isStandalone()
    }
  };
};

// Default export with all utilities
export default {
  breakpoints,
  getCurrentBreakpoint,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,
  getResponsiveValue,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getResponsiveColumns,
  getTouchTargetSize,
  getContainerMaxWidth,
  viewport,
  device,
  getSafeAreaInsets,
  getResponsiveClasses,
  onResponsiveResize,
  mediaQuery,
  getResponsiveState
};
