/**
 * Mobile Responsive System
 * Handles mobile-specific behaviors, touch gestures, and responsive layouts
 */

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { X, Menu } from 'lucide-react';

interface MobileResponsiveSystemProps {
  children: ReactNode;
  enableSwipeNavigation?: boolean;
  mobileBreakpoint?: number;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: (isOpen: boolean) => void;
}

interface TouchState {
  startX: number;
  startY: number;
  isDragging: boolean;
  timestamp: number;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
  isValid: boolean;
}

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isKeyboardOpen: boolean;
}

// Custom hook for media queries
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

// Custom hook for viewport information
const useViewport = (mobileBreakpoint: number): ViewportInfo => {
  const [viewport, setViewport] = useState<ViewportInfo>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= mobileBreakpoint,
    isTablet: window.innerWidth > mobileBreakpoint && window.innerWidth <= 1024,
    isDesktop: window.innerWidth > 1024,
    isLandscape: window.innerWidth > window.innerHeight,
    isKeyboardOpen: false
  }));

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const keyboardThreshold = 100;
      
      // Detect virtual keyboard
      let isKeyboardOpen = false;
      if (window.visualViewport) {
        const keyboardHeight = height - window.visualViewport.height;
        isKeyboardOpen = keyboardHeight > keyboardThreshold;
      }

      setViewport({
        width,
        height,
        isMobile: width <= mobileBreakpoint,
        isTablet: width > mobileBreakpoint && width <= 1024,
        isDesktop: width > 1024,
        isLandscape: width > height,
        isKeyboardOpen
      });
    };

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [mobileBreakpoint]);

  return viewport;
};

const MobileResponsiveSystem: React.FC<MobileResponsiveSystemProps> = ({
  children,
  enableSwipeNavigation = true,
  mobileBreakpoint = 768,
  showMobileMenu = false,
  onMobileMenuToggle
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    isDragging: false,
    timestamp: 0
  });

  const viewport = useViewport(mobileBreakpoint);
  const { isMobile, isTablet, isLandscape, isKeyboardOpen, height: viewportHeight } = viewport;

  // Set CSS custom properties for mobile viewport
  useEffect(() => {
    const root = document.documentElement;
    
    root.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
    root.style.setProperty('--mobile-viewport-height', `${viewportHeight}px`);
    
    // Device type classes
    root.classList.remove('mobile-device', 'tablet-device', 'desktop-device');
    if (isMobile) {
      root.classList.add('mobile-device');
    } else if (isTablet) {
      root.classList.add('tablet-device');
    } else {
      root.classList.add('desktop-device');
    }
    
    // Orientation classes
    root.classList.remove('landscape', 'portrait');
    if (isLandscape) {
      root.classList.add('landscape');
    } else {
      root.classList.add('portrait');
    }
  }, [viewportHeight, isMobile, isTablet, isLandscape]);

  // Handle keyboard visibility
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (isKeyboardOpen) {
      body.classList.add('keyboard-open');
      if (isMobile && window.visualViewport) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        root.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
      }
    } else {
      body.classList.remove('keyboard-open');
      root.style.removeProperty('--keyboard-height');
    }
  }, [isKeyboardOpen, isMobile]);

  // Handle safe area insets for notched devices
  useEffect(() => {
    if (isMobile) {
      const updateSafeAreaInsets = () => {
        const style = getComputedStyle(document.documentElement);
        const safeAreaTop = style.getPropertyValue('env(safe-area-inset-top)') || '0px';
        const safeAreaBottom = style.getPropertyValue('env(safe-area-inset-bottom)') || '0px';
        const safeAreaLeft = style.getPropertyValue('env(safe-area-inset-left)') || '0px';
        const safeAreaRight = style.getPropertyValue('env(safe-area-inset-right)') || '0px';
        
        document.documentElement.style.setProperty('--safe-area-top', safeAreaTop);
        document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom);
        document.documentElement.style.setProperty('--safe-area-left', safeAreaLeft);
        document.documentElement.style.setProperty('--safe-area-right', safeAreaRight);
      };
      
      updateSafeAreaInsets();
      window.addEventListener('orientationchange', updateSafeAreaInsets);
      
      return () => {
        window.removeEventListener('orientationchange', updateSafeAreaInsets);
      };
    }
  }, [isMobile]);

  // Swipe gesture detection
  const detectSwipeGesture = useCallback((touch: Touch, startTouch: TouchState): SwipeGesture => {
    const deltaX = touch.clientX - startTouch.startX;
    const deltaY = touch.clientY - startTouch.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - startTouch.timestamp;
    const velocity = distance / duration;
    
    const minDistance = 50;
    const maxDuration = 500;
    const minVelocity = 0.1;
    
    const isValid = distance >= minDistance && duration <= maxDuration && velocity >= minVelocity;
    
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    
    if (isValid) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      if (absDeltaX > absDeltaY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }
    
    return {
      direction,
      distance,
      velocity,
      isValid
    };
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      isDragging: false,
      timestamp: Date.now()
    });
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);
    
    // Start dragging if movement exceeds threshold
    if ((deltaX > 10 || deltaY > 10) && !touchState.isDragging) {
      setTouchState(prev => ({ ...prev, isDragging: true }));
    }
  }, [touchState]);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (event.changedTouches.length !== 1 || !touchState.timestamp) return;
    
    const touch = event.changedTouches[0];
    const swipe = detectSwipeGesture(touch, touchState);
    
    if (enableSwipeNavigation && isMobile && swipe.isValid) {
      switch (swipe.direction) {
        case 'right':
          if (!isMobileMenuOpen) {
            setIsMobileMenuOpen(true);
            onMobileMenuToggle?.(true);
          }
          break;
        case 'left':
          if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
            onMobileMenuToggle?.(false);
          }
          break;
      }
    }
    
    setTouchState({
      startX: 0,
      startY: 0,
      isDragging: false,
      timestamp: 0
    });
  }, [touchState, detectSwipeGesture, enableSwipeNavigation, isMobile, isMobileMenuOpen, onMobileMenuToggle]);

  const toggleMobileMenu = useCallback(() => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    onMobileMenuToggle?.(newState);
  }, [isMobileMenuOpen, onMobileMenuToggle]);

  // Mobile menu component
  const MobileMenu: React.FC = () => {
    if (!isMobileMenuOpen) return null;

    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setIsMobileMenuOpen(false);
            onMobileMenuToggle?.(false);
          }}
        />

        {/* Menu panel */}
        <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out lg:hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onMobileMenuToggle?.(false);
              }}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Menu content would go here */}
            <p className="text-gray-600">Mobile menu content</p>
          </div>
        </div>
      </>
    );
  };

  // Development status indicator
  const DevStatusIndicator: React.FC = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <div className="fixed top-0 left-0 z-50 p-2 bg-black/80 text-white text-xs font-mono pointer-events-none">
        <div>Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</div>
        <div>Orientation: {isLandscape ? 'Landscape' : 'Portrait'}</div>
        <div>Keyboard: {isKeyboardOpen ? 'Open' : 'Closed'}</div>
        <div>Viewport: {viewportHeight}px</div>
        <div>Menu: {isMobileMenuOpen ? 'Open' : 'Closed'}</div>
      </div>
    );
  };

  return (
    <div 
      className={`mobile-responsive-system ${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'} ${isLandscape ? 'landscape' : 'portrait'}`}
      style={{
        '--mobile-viewport-height': `${viewportHeight}px`,
        '--keyboard-height': isKeyboardOpen ? 'var(--keyboard-height, 0px)' : '0px',
        '--safe-area-top': 'var(--safe-area-top, 0px)',
        '--safe-area-bottom': 'var(--safe-area-bottom, 0px)',
        '--safe-area-left': 'var(--safe-area-left, 0px)',
        '--safe-area-right': 'var(--safe-area-right, 0px)'
      } as React.CSSProperties}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <MobileMenu />
      
      {/* Main content */}
      <div className="mobile-responsive-content">
        {children}
      </div>

      <DevStatusIndicator />

      {/* Floating menu toggle button for mobile */}
      {isMobile && showMobileMenu && (
        <button
          type="button"
          className="fixed top-4 left-4 z-30 p-3 bg-white shadow-lg rounded-full border border-gray-200 lg:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default MobileResponsiveSystem;

// Export viewport hook for use in other components
export { useViewport };

// Export types for external use
export type { ViewportInfo, TouchState, SwipeGesture };