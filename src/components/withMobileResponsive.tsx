/**
 * Higher-Order Component for Mobile Responsiveness
 * Ensures wrapped components are properly responsive across all devices
 */

import React, { ComponentType, useEffect, useState } from 'react';
import { 
  getCurrentBreakpoint,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,
  onResponsiveResize,
  viewport,
  device,
  getSafeAreaInsets,
  getTouchTargetSize,
  breakpoints 
} from '../utils/responsiveUtils';

interface ResponsiveProps {
  // Breakpoint information
  breakpoint: keyof typeof breakpoints;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  // Viewport information
  viewportWidth: number;
  viewportHeight: number;
  isPortrait: boolean;
  isLandscape: boolean;
  // Device information
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  // Safe areas for notched devices
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  // Touch target size
  touchTargetSize: number;
  // Responsive class helper
  getResponsiveClass: (baseClass: string) => string;
}

/**
 * HOC that provides responsive props to wrapped component
 */
export function withMobileResponsive<P extends object>(
  Component: ComponentType<P & ResponsiveProps>
): ComponentType<P> {
  const ResponsiveComponent: React.FC<P> = (props) => {
    const [responsiveState, setResponsiveState] = useState<ResponsiveProps>(() => ({
      breakpoint: getCurrentBreakpoint(),
      isMobile: isMobileViewport(),
      isTablet: isTabletViewport(),
      isDesktop: isDesktopViewport(),
      viewportWidth: viewport.width(),
      viewportHeight: viewport.height(),
      isPortrait: viewport.isPortrait(),
      isLandscape: viewport.isLandscape(),
      isTouchDevice: device.isTouchDevice(),
      isIOS: device.isIOS(),
      isAndroid: device.isAndroid(),
      isStandalone: device.isStandalone(),
      safeAreaInsets: getSafeAreaInsets(),
      touchTargetSize: getTouchTargetSize(),
      getResponsiveClass: (baseClass: string) => {
        const classes = [baseClass];
        classes.push(`${baseClass}--${getCurrentBreakpoint()}`);
        if (isMobileViewport()) classes.push(`${baseClass}--mobile`);
        else if (isTabletViewport()) classes.push(`${baseClass}--tablet`);
        else classes.push(`${baseClass}--desktop`);
        return classes.join(' ');
      }
    }));

    useEffect(() => {
      const updateResponsiveState = () => {
        setResponsiveState({
          breakpoint: getCurrentBreakpoint(),
          isMobile: isMobileViewport(),
          isTablet: isTabletViewport(),
          isDesktop: isDesktopViewport(),
          viewportWidth: viewport.width(),
          viewportHeight: viewport.height(),
          isPortrait: viewport.isPortrait(),
          isLandscape: viewport.isLandscape(),
          isTouchDevice: device.isTouchDevice(),
          isIOS: device.isIOS(),
          isAndroid: device.isAndroid(),
          isStandalone: device.isStandalone(),
          safeAreaInsets: getSafeAreaInsets(),
          touchTargetSize: getTouchTargetSize(),
          getResponsiveClass: (baseClass: string) => {
            const classes = [baseClass];
            classes.push(`${baseClass}--${getCurrentBreakpoint()}`);
            if (isMobileViewport()) classes.push(`${baseClass}--mobile`);
            else if (isTabletViewport()) classes.push(`${baseClass}--tablet`);
            else classes.push(`${baseClass}--desktop`);
            return classes.join(' ');
          }
        });
      };

      // Set up resize listener
      const cleanup = onResponsiveResize(updateResponsiveState);

      // Also listen to orientation changes
      window.addEventListener('orientationchange', updateResponsiveState);

      return () => {
        cleanup();
        window.removeEventListener('orientationchange', updateResponsiveState);
      };
    }, []);

    return <Component {...props} {...responsiveState} />;
  };

  ResponsiveComponent.displayName = `withMobileResponsive(${Component.displayName || Component.name})`;

  return ResponsiveComponent;
}

/**
 * Hook version for functional components
 */
export const useResponsive = (): ResponsiveProps => {
  const [responsiveState, setResponsiveState] = useState<ResponsiveProps>(() => ({
    breakpoint: getCurrentBreakpoint(),
    isMobile: isMobileViewport(),
    isTablet: isTabletViewport(),
    isDesktop: isDesktopViewport(),
    viewportWidth: viewport.width(),
    viewportHeight: viewport.height(),
    isPortrait: viewport.isPortrait(),
    isLandscape: viewport.isLandscape(),
    isTouchDevice: device.isTouchDevice(),
    isIOS: device.isIOS(),
    isAndroid: device.isAndroid(),
    isStandalone: device.isStandalone(),
    safeAreaInsets: getSafeAreaInsets(),
    touchTargetSize: getTouchTargetSize(),
    getResponsiveClass: (baseClass: string) => {
      const classes = [baseClass];
      classes.push(`${baseClass}--${getCurrentBreakpoint()}`);
      if (isMobileViewport()) classes.push(`${baseClass}--mobile`);
      else if (isTabletViewport()) classes.push(`${baseClass}--tablet`);
      else classes.push(`${baseClass}--desktop`);
      return classes.join(' ');
    }
  }));

  useEffect(() => {
    const updateResponsiveState = () => {
      setResponsiveState({
        breakpoint: getCurrentBreakpoint(),
        isMobile: isMobileViewport(),
        isTablet: isTabletViewport(),
        isDesktop: isDesktopViewport(),
        viewportWidth: viewport.width(),
        viewportHeight: viewport.height(),
        isPortrait: viewport.isPortrait(),
        isLandscape: viewport.isLandscape(),
        isTouchDevice: device.isTouchDevice(),
        isIOS: device.isIOS(),
        isAndroid: device.isAndroid(),
        isStandalone: device.isStandalone(),
        safeAreaInsets: getSafeAreaInsets(),
        touchTargetSize: getTouchTargetSize(),
        getResponsiveClass: (baseClass: string) => {
          const classes = [baseClass];
          classes.push(`${baseClass}--${getCurrentBreakpoint()}`);
          if (isMobileViewport()) classes.push(`${baseClass}--mobile`);
          else if (isTabletViewport()) classes.push(`${baseClass}--tablet`);
          else classes.push(`${baseClass}--desktop`);
          return classes.join(' ');
        }
      });
    };

    const cleanup = onResponsiveResize(updateResponsiveState);
    window.addEventListener('orientationchange', updateResponsiveState);

    return () => {
      cleanup();
      window.removeEventListener('orientationchange', updateResponsiveState);
    };
  }, []);

  return responsiveState;
};

/**
 * Responsive container component
 */
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
}> = ({ children, className = '', maxWidth = 'lg', padding = true }) => {
  const { getResponsiveClass, safeAreaInsets } = useResponsive();

  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div 
      className={`
        ${getResponsiveClass('container')}
        ${maxWidthClasses[maxWidth]}
        ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
        ${className}
      `.trim()}
      style={{
        paddingTop: padding ? `${safeAreaInsets.top}px` : undefined,
        paddingBottom: padding ? `${safeAreaInsets.bottom}px` : undefined
      }}
    >
      {children}
    </div>
  );
};

/**
 * Responsive grid component
 */
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  gap?: number;
}> = ({ children, className = '', cols = {}, gap = 4 }) => {
  const { breakpoint } = useResponsive();

  const defaultCols = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    xxl: 6
  };

  const colCount = cols[breakpoint] ?? defaultCols[breakpoint] ?? 1;

  return (
    <div 
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${colCount}, 1fr)`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {children}
    </div>
  );
};

/**
 * Mobile-only wrapper component
 */
export const MobileOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMobile } = useResponsive();
  return isMobile ? <>{children}</> : null;
};

/**
 * Tablet-only wrapper component
 */
export const TabletOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isTablet } = useResponsive();
  return isTablet ? <>{children}</> : null;
};

/**
 * Desktop-only wrapper component
 */
export const DesktopOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDesktop } = useResponsive();
  return isDesktop ? <>{children}</> : null;
};

/**
 * Touch-device-only wrapper component
 */
export const TouchOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isTouchDevice } = useResponsive();
  return isTouchDevice ? <>{children}</> : null;
};

export default withMobileResponsive;