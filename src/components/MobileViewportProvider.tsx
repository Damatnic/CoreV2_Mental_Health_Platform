/**
 * Mobile Viewport Provider
 * Comprehensive mobile viewport management and UX enhancements
 */

import React, { useEffect, useRef, useState, useContext, createContext } from 'react';

interface MobileViewportProviderProps {
  children: React.ReactNode;
  enableHapticFeedback?: boolean;
  preventZoom?: boolean;
  optimizeInputs?: boolean;
}

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface MobileViewportState {
  viewportWidth: number;
  viewportHeight: number;
  keyboardHeight: number;
  isKeyboardOpen: boolean;
  safeAreaInsets: SafeAreaInsets;
  orientation: 'portrait' | 'landscape';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  devicePixelRatio: number;
}

// Context for mobile viewport state
const MobileViewportContext = createContext<MobileViewportState | null>(null);

// Mobile utilities
const MobileUtils = {
  isMobile: (): boolean => {
    return window.innerWidth <= 768;
  },

  isTablet: (): boolean => {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  },

  isDesktop: (): boolean => {
    return window.innerWidth > 1024;
  },

  isIOS: (): boolean => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  isAndroid: (): boolean => {
    return /Android/.test(navigator.userAgent);
  },

  setViewportMeta: (content: string): void => {
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = content;
  },

  preventInputZoom: (): void => {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const element = input as HTMLElement;
      element.style.fontSize = '16px';
    });
  },

  enableHapticFeedback: (): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  getSafeAreaInsets: (): SafeAreaInsets => {
    const style = getComputedStyle(document.documentElement);
    
    // Try to get CSS environment variables for safe areas
    const getEnvValue = (prop: string): number => {
      const value = style.getPropertyValue(prop).trim();
      if (value && value !== 'unset') {
        const numValue = parseFloat(value);
        return isNaN(numValue) ? 0 : numValue;
      }
      return 0;
    };

    return {
      top: getEnvValue('env(safe-area-inset-top)') || 0,
      right: getEnvValue('env(safe-area-inset-right)') || 0,
      bottom: getEnvValue('env(safe-area-inset-bottom)') || 0,
      left: getEnvValue('env(safe-area-inset-left)') || 0,
    };
  },

  detectKeyboard: (currentHeight: number, previousHeight: number): boolean => {
    const threshold = 150;
    const heightDifference = previousHeight - currentHeight;
    return heightDifference > threshold;
  }
};

// Custom hook for mobile viewport
export const useMobileViewport = (): MobileViewportState => {
  const context = useContext(MobileViewportContext);
  if (!context) {
    throw new Error('useMobileViewport must be used within a MobileViewportProvider');
  }
  return context;
};

export const MobileViewportProvider: React.FC<MobileViewportProviderProps> = ({
  children,
  enableHapticFeedback = true,
  preventZoom = true,
  optimizeInputs = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number>(window.innerHeight);

  const [viewportState, setViewportState] = useState<MobileViewportState>(() => ({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    keyboardHeight: 0,
    isKeyboardOpen: false,
    safeAreaInsets: MobileUtils.getSafeAreaInsets(),
    orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    isMobile: MobileUtils.isMobile(),
    isTablet: MobileUtils.isTablet(),
    isDesktop: MobileUtils.isDesktop(),
    devicePixelRatio: window.devicePixelRatio || 1
  }));

  // Handle viewport changes
  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        const previousHeight = previousHeightRef.current;
        
        const isKeyboardOpen = MobileUtils.detectKeyboard(newHeight, previousHeight);
        const keyboardHeight = isKeyboardOpen ? previousHeight - newHeight : 0;

        setViewportState(prev => ({
          ...prev,
          viewportWidth: newWidth,
          viewportHeight: newHeight,
          keyboardHeight,
          isKeyboardOpen,
          orientation: newHeight > newWidth ? 'portrait' : 'landscape',
          isMobile: MobileUtils.isMobile(),
          isTablet: MobileUtils.isTablet(),
          isDesktop: MobileUtils.isDesktop(),
          devicePixelRatio: window.devicePixelRatio || 1
        }));

        previousHeightRef.current = newHeight;
      }, 100);
    };

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(() => {
        handleResize();
        
        // Update safe area insets on orientation change
        setViewportState(prev => ({
          ...prev,
          safeAreaInsets: MobileUtils.getSafeAreaInsets()
        }));
      }, 200);
    };

    // Handle visual viewport changes for better keyboard detection
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        const isKeyboardOpen = keyboardHeight > 150;

        setViewportState(prev => ({
          ...prev,
          keyboardHeight: Math.max(0, keyboardHeight),
          isKeyboardOpen
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  // Set up viewport meta tag and mobile optimizations
  useEffect(() => {
    if (!viewportState.isMobile) return;

    // Configure viewport meta tag
    let viewportContent = 'width=device-width, initial-scale=1.0';
    
    if (preventZoom) {
      viewportContent += ', maximum-scale=1.0, user-scalable=no';
    }
    
    MobileUtils.setViewportMeta(viewportContent);

    // Prevent zoom on input focus if enabled
    if (preventZoom && optimizeInputs) {
      MobileUtils.preventInputZoom();
    }

    // Set up haptic feedback if enabled
    if (enableHapticFeedback) {
      MobileUtils.enableHapticFeedback();
    }

    return () => {
      // Reset viewport meta on cleanup if needed
      if (!preventZoom) {
        MobileUtils.setViewportMeta('width=device-width, initial-scale=1.0');
      }
    };
  }, [viewportState.isMobile, preventZoom, optimizeInputs, enableHapticFeedback]);

  // Update CSS custom properties for responsive design
  useEffect(() => {
    const root = document.documentElement;
    
    // Set viewport height properties
    root.style.setProperty('--vh', `${viewportState.viewportHeight * 0.01}px`);
    root.style.setProperty('--viewport-width', `${viewportState.viewportWidth}px`);
    root.style.setProperty('--viewport-height', `${viewportState.viewportHeight}px`);
    
    // Set keyboard properties
    root.style.setProperty('--keyboard-height', `${viewportState.keyboardHeight}px`);
    
    // Set safe area insets
    root.style.setProperty('--safe-area-top', `${viewportState.safeAreaInsets.top}px`);
    root.style.setProperty('--safe-area-right', `${viewportState.safeAreaInsets.right}px`);
    root.style.setProperty('--safe-area-bottom', `${viewportState.safeAreaInsets.bottom}px`);
    root.style.setProperty('--safe-area-left', `${viewportState.safeAreaInsets.left}px`);
    
    // Set device pixel ratio
    root.style.setProperty('--device-pixel-ratio', `${viewportState.devicePixelRatio}`);
    
    // Add body classes for device state
    const body = document.body;
    body.classList.toggle('keyboard-open', viewportState.isKeyboardOpen);
    body.classList.toggle('mobile-viewport', viewportState.isMobile);
    body.classList.toggle('tablet-viewport', viewportState.isTablet);
    body.classList.toggle('desktop-viewport', viewportState.isDesktop);
    body.classList.toggle(`orientation-${viewportState.orientation}`, true);
    
    // Remove opposite orientation class
    body.classList.remove(`orientation-${viewportState.orientation === 'portrait' ? 'landscape' : 'portrait'}`);
    
  }, [viewportState]);

  // Handle touch optimizations for mobile
  useEffect(() => {
    if (!viewportState.isMobile || !containerRef.current) return;

    const container = containerRef.current;

    // Enable smooth scrolling on iOS
    if (MobileUtils.isIOS()) {
      container.style.webkitOverflowScrolling = 'touch';
    }

    // Add touch action optimizations
    container.style.touchAction = 'manipulation';

    // Handle iOS viewport height issues
    if (MobileUtils.isIOS()) {
      const handleIOSResize = () => {
        root.style.setProperty('--ios-viewport-height', `${window.innerHeight}px`);
      };

      const root = document.documentElement;
      window.addEventListener('resize', handleIOSResize);
      handleIOSResize();

      return () => {
        window.removeEventListener('resize', handleIOSResize);
      };
    }
  }, [viewportState.isMobile]);

  // Development debug info component
  const DebugInfo: React.FC = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <div className="fixed top-0 right-0 z-50 p-2 bg-black/80 text-white text-xs font-mono pointer-events-none max-w-xs">
        <div>Width: {viewportState.viewportWidth}px</div>
        <div>Height: {viewportState.viewportHeight}px</div>
        <div>Keyboard: {viewportState.keyboardHeight}px</div>
        <div>Orientation: {viewportState.orientation}</div>
        <div>Device: {viewportState.isMobile ? 'Mobile' : viewportState.isTablet ? 'Tablet' : 'Desktop'}</div>
        <div>DPR: {viewportState.devicePixelRatio}</div>
        <div>Safe Top: {viewportState.safeAreaInsets.top}px</div>
        <div>Safe Bottom: {viewportState.safeAreaInsets.bottom}px</div>
      </div>
    );
  };

  return (
    <MobileViewportContext.Provider value={viewportState}>
      <div 
        ref={containerRef}
        className="mobile-viewport-provider"
        style={{
          minHeight: viewportState.isMobile ? '100dvh' : '100vh',
          paddingTop: `${viewportState.safeAreaInsets.top}px`,
          paddingRight: `${viewportState.safeAreaInsets.right}px`,
          paddingBottom: `${viewportState.safeAreaInsets.bottom}px`,
          paddingLeft: `${viewportState.safeAreaInsets.left}px`,
        }}
      >
        <DebugInfo />
        <div className="mobile-viewport-content">
          {children}
        </div>
      </div>
    </MobileViewportContext.Provider>
  );
};

export default MobileViewportProvider;

// Export utilities for external use
export { MobileUtils };