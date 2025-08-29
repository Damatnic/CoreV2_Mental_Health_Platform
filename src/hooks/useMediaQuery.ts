import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for media query matching
 * Provides responsive design capabilities with SSR support
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    // Return false during SSR to prevent hydration mismatches
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // Early return for SSR
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    
    // Modern browsers
    if (mediaQueryList.addEventListener) {
      const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
      mediaQueryList.addEventListener('change', listener);
      
      return () => mediaQueryList.removeEventListener('change', listener);
    }
    // Legacy browsers (Safari < 14)
    else if (mediaQueryList.addListener) {
      const listener = (e: MediaQueryList) => setMatches(e.matches);
      mediaQueryList.addListener(listener);
      
      return () => mediaQueryList.removeListener(listener);
    }
  }, [query]);

  return matches;
};

/**
 * Predefined breakpoint hooks for common responsive patterns
 */

// Mobile-first breakpoints (min-width)
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsLargeDesktop = () => useMediaQuery('(min-width: 1280px)');

// Specific breakpoint ranges
export const useIsSmallMobile = () => useMediaQuery('(max-width: 479px)');
export const useIsLargeMobile = () => useMediaQuery('(min-width: 480px) and (max-width: 767px)');
export const useIsSmallTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsLargeTablet = () => useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');

// Device orientation
export const useIsPortrait = () => useMediaQuery('(orientation: portrait)');
export const useIsLandscape = () => useMediaQuery('(orientation: landscape)');

// Device capabilities
export const useCanHover = () => useMediaQuery('(hover: hover)');
export const useFinePointer = () => useMediaQuery('(pointer: fine)');
export const useCoarsePointer = () => useMediaQuery('(pointer: coarse)');

// High DPI displays
export const useIsHighDPI = () => useMediaQuery('(min-resolution: 2dppx)');
export const useIsRetinaDisplay = () => useMediaQuery('(-webkit-min-device-pixel-ratio: 2)');

// Dark mode preference
export const usePrefersDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');
export const usePrefersLightMode = () => useMediaQuery('(prefers-color-scheme: light)');

// Reduced motion preference
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

// High contrast preference
export const usePrefersHighContrast = () => useMediaQuery('(prefers-contrast: high)');

/**
 * Advanced hook that provides current breakpoint information
 */
interface BreakpointInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'large-desktop';
  width: number;
  height: number;
}

export const useBreakpoint = (): BreakpointInfo => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isLargeDesktop = useIsLargeDesktop();

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getCurrentBreakpoint = useCallback((): BreakpointInfo['currentBreakpoint'] => {
    if (isLargeDesktop) return 'large-desktop';
    if (isDesktop) return 'desktop';
    if (isTablet) return 'tablet';
    return 'mobile';
  }, [isMobile, isTablet, isDesktop, isLargeDesktop]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    currentBreakpoint: getCurrentBreakpoint(),
    width: dimensions.width,
    height: dimensions.height
  };
};

/**
 * Hook for responsive values based on breakpoints
 */
interface ResponsiveConfig<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  largeDesktop?: T;
  default: T;
}

export const useResponsiveValue = <T>(config: ResponsiveConfig<T>): T => {
  const { currentBreakpoint } = useBreakpoint();

  switch (currentBreakpoint) {
    case 'mobile':
      return config.mobile ?? config.default;
    case 'tablet':
      return config.tablet ?? config.default;
    case 'desktop':
      return config.desktop ?? config.default;
    case 'large-desktop':
      return config.largeDesktop ?? config.default;
    default:
      return config.default;
  }
};

/**
 * Hook for viewport dimensions with debouncing
 */
export const useViewport = (debounceMs = 100) => {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const updateViewport = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, debounceMs);
    };

    // Initial set
    updateViewport();

    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return viewport;
};

/**
 * Hook for detecting mobile device (touch-capable)
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    setIsTouchDevice(checkTouchDevice());
  }, []);

  return isTouchDevice;
};

/**
 * Hook for container queries (when supported)
 */
export const useContainerQuery = (containerRef: React.RefObject<HTMLElement>, query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    // Check if container queries are supported
    if ('containerQuery' in window) {
      // Future implementation when container queries are widely supported
      console.warn('Container queries not yet implemented');
    } else {
      // Fallback to ResizeObserver for basic size detection
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          
          // Simple width-based matching (extend as needed)
          if (query.includes('min-width')) {
            const minWidth = parseInt(query.match(/(\d+)px/)?.[1] || '0');
            setMatches(width >= minWidth);
          } else if (query.includes('max-width')) {
            const maxWidth = parseInt(query.match(/(\d+)px/)?.[1] || '999999');
            setMatches(width <= maxWidth);
          }
        }
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [containerRef, query]);

  return matches;
};

/**
 * Mental health app specific responsive hooks
 */

// Check if device is suitable for voice/video calls
export const useIsCallCapable = (): boolean => {
  const isMobile = useIsMobile();
  const canHover = useCanHover();
  
  // Mobile devices or devices without hover (touch) are typically call-capable
  return isMobile || !canHover;
};

// Check if device should show simplified UI (small screens or reduced motion)
export const useSimplifiedUI = (): boolean => {
  const isSmallMobile = useIsSmallMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return isSmallMobile || prefersReducedMotion;
};

// Check if device is suitable for complex interactions
export const useComplexInteractions = (): boolean => {
  const finePointer = useFinePointer();
  const canHover = useCanHover();
  const isDesktop = useIsDesktop();
  
  return finePointer && canHover && isDesktop;
};

// Get optimal font sizes for mental health content
export const useAccessibleFontSizes = () => {
  return useResponsiveValue({
    mobile: {
      small: '14px',
      body: '16px',
      heading: '20px',
      large: '24px'
    },
    tablet: {
      small: '15px',
      body: '17px',
      heading: '22px',
      large: '26px'
    },
    desktop: {
      small: '16px',
      body: '18px',
      heading: '24px',
      large: '28px'
    },
    default: {
      small: '14px',
      body: '16px',
      heading: '20px',
      large: '24px'
    }
  });
};

// Check if device supports advanced PWA features
export const usePWACapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    installable: false,
    notifications: false,
    backgroundSync: false,
    webShare: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setCapabilities({
      installable: 'serviceWorker' in navigator && 'beforeinstallprompt' in window,
      notifications: 'Notification' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      webShare: 'share' in navigator
    });
  }, []);

  return capabilities;
};

export default useMediaQuery;
