/**
 * Mobile Keyboard Handler Component
 *
 * Handles mobile virtual keyboard behavior to prevent layout breaking
 * and ensure proper chat input positioning on iOS Safari and Android Chrome.
 *
 * Key features:
 * - Dynamic viewport height adjustment using CSS viewport units
 * - Safe area inset support for iPhone notch/home indicator
 * - Keyboard state detection and layout adjustment
 * - Touch event optimization for mobile inputs
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';

// Hook for detecting mobile viewport changes
export const useMobileViewport = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(isMobileDevice);
    };

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      setViewportHeight(currentHeight);

      if (isMobile) {
        // Detect keyboard based on viewport height change
        const heightDifference = window.screen.height - currentHeight;
        const threshold = window.screen.height * 0.25; // 25% of screen height

        if (heightDifference > threshold) {
          setIsKeyboardOpen(true);
          setKeyboardHeight(heightDifference);
        } else {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }
      }
    };

    checkMobile();
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile]);

  return {
    isMobile,
    isKeyboardOpen,
    viewportHeight,
    keyboardHeight
  };
};

interface MobileKeyboardHandlerProps {
  children: React.ReactNode;
  className?: string;
  adjustForKeyboard?: boolean;
  maintainScrollPosition?: boolean;
}

export const MobileKeyboardHandler: React.FC<MobileKeyboardHandlerProps> = ({
  children,
  className = '',
  adjustForKeyboard = true,
  maintainScrollPosition = true
}) => {
  const { isMobile, isKeyboardOpen, viewportHeight, keyboardHeight } = useMobileViewport();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  // Handle input focus events
  const handleInputFocus = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      setFocusedElement(target);
      
      if (maintainScrollPosition) {
        setScrollPosition(window.scrollY);
      }

      // Add focused class for styling
      target.classList.add('mobile-keyboard-focused');
      
      // Scroll element into view after keyboard animation
      if (isMobile) {
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
    }
  }, [isMobile, maintainScrollPosition]);

  const handleInputBlur = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      setFocusedElement(null);
      target.classList.remove('mobile-keyboard-focused');
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!isMobile) return;

    document.addEventListener('focusin', handleInputFocus);
    document.addEventListener('focusout', handleInputBlur);

    return () => {
      document.removeEventListener('focusin', handleInputFocus);
      document.removeEventListener('focusout', handleInputBlur);
    };
  }, [isMobile, handleInputFocus, handleInputBlur]);

  // Update CSS custom properties for responsive design
  useEffect(() => {
    if (!isMobile) return;

    const root = document.documentElement;
    
    // Set viewport height variables
    root.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
    root.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    root.style.setProperty('--viewport-height', `${viewportHeight}px`);

    // Add keyboard state class to body
    document.body.classList.toggle('keyboard-open', isKeyboardOpen);
    document.body.classList.toggle('mobile-device', isMobile);

  }, [isMobile, isKeyboardOpen, viewportHeight, keyboardHeight]);

  const containerStyle: React.CSSProperties = {
    height: adjustForKeyboard && isMobile ? `${viewportHeight}px` : '100vh',
    minHeight: adjustForKeyboard && isMobile ? `${viewportHeight}px` : '100vh',
    overflow: 'hidden',
    position: 'relative',
    transition: isKeyboardOpen ? 'none' : 'height 0.3s ease-out'
  };

  const contentStyle: React.CSSProperties = {
    height: '100%',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: isKeyboardOpen && adjustForKeyboard ? `${keyboardHeight}px` : '0'
  };

  return (
    <div
      ref={containerRef}
      className={`mobile-keyboard-handler ${className} ${
        isMobile ? 'mobile' : 'desktop'
      } ${isKeyboardOpen ? 'keyboard-open' : 'keyboard-closed'}`}
      style={containerStyle}
      data-keyboard-height={keyboardHeight}
      data-viewport-height={viewportHeight}
    >
      <div 
        className="mobile-keyboard-content"
        style={contentStyle}
      >
        {children}
      </div>

      {/* Keyboard spacer */}
      {isMobile && isKeyboardOpen && adjustForKeyboard && (
        <div 
          className="mobile-keyboard-spacer"
          style={{ 
            height: `${keyboardHeight}px`,
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />
      )}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && isMobile && (
        <div 
          className="mobile-keyboard-debug"
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
            fontFamily: 'monospace'
          }}
        >
          <div>VH: {viewportHeight}px</div>
          <div>KB: {keyboardHeight}px</div>
          <div>Open: {isKeyboardOpen ? 'Yes' : 'No'}</div>
          {focusedElement && (
            <div>Focus: {focusedElement.tagName}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileKeyboardHandler;