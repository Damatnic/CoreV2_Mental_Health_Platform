/**
 * Swipe Navigation Context
 *
 * Provides swipe gesture navigation functionality for mobile interfaces,
 * including sidebar management and back navigation.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface SwipeNavigationContextType {
  // Sidebar state
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  
  // Navigation state
  canSwipeBack: boolean;
  onSwipeBack: () => void;
  
  // Swipe area management
  registerSwipeArea: (element: HTMLElement) => void;
  unregisterSwipeArea: (element: HTMLElement) => void;
  
  // Gesture settings
  swipeThreshold: number;
  setSwipeThreshold: (threshold: number) => void;
  enableSwipeGestures: () => void;
  disableSwipeGestures: () => void;
  
  // Touch state
  isSwiping: boolean;
  swipeProgress: number;
}

const SwipeNavigationContext = createContext<SwipeNavigationContextType | null>(null);

export const useSwipeNavigation = (): SwipeNavigationContextType => {
  const context = useContext(SwipeNavigationContext);
  if (!context) {
    throw new Error('useSwipeNavigation must be used within SwipeNavigationProvider');
  }
  return context;
};

export interface SwipeNavigationProviderProps {
  children: React.ReactNode;
  onNavigateBack?: () => void;
  currentPath?: string;
  enableSidebar?: boolean;
  enableBackNavigation?: boolean;
  defaultSwipeThreshold?: number;
}

export const SwipeNavigationProvider: React.FC<SwipeNavigationProviderProps> = ({
  children,
  onNavigateBack,
  currentPath = '/',
  enableSidebar = true,
  enableBackNavigation = true,
  defaultSwipeThreshold = 50
}) => {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Swipe state
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeThreshold, setSwipeThreshold] = useState(defaultSwipeThreshold);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  
  // Refs
  const swipeAreasRef = useRef<Set<HTMLElement>>(new Set());
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const swipeDirectionRef = useRef<'left' | 'right' | 'up' | 'down' | null>(null);

  // Determine if we can swipe back based on navigation history
  const canSwipeBack = Boolean(
    enableBackNavigation && 
    onNavigateBack && 
    currentPath && 
    currentPath !== '/'
  );

  /**
   * Open sidebar
   */
  const openSidebar = useCallback(() => {
    if (!enableSidebar) return;
    
    setIsSidebarOpen(true);
    // Prevent background scroll when sidebar is open
    document.body.style.overflow = 'hidden';
  }, [enableSidebar]);

  /**
   * Close sidebar
   */
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    // Restore background scroll
    document.body.style.overflow = '';
  }, []);

  /**
   * Toggle sidebar
   */
  const toggleSidebar = useCallback(() => {
    if (isSidebarOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }, [isSidebarOpen, openSidebar, closeSidebar]);

  /**
   * Handle swipe back navigation
   */
  const onSwipeBack = useCallback(() => {
    if (canSwipeBack && onNavigateBack) {
      onNavigateBack();
    }
  }, [canSwipeBack, onNavigateBack]);

  /**
   * Register swipe area element
   */
  const registerSwipeArea = useCallback((element: HTMLElement) => {
    swipeAreasRef.current.add(element);
  }, []);

  /**
   * Unregister swipe area element
   */
  const unregisterSwipeArea = useCallback((element: HTMLElement) => {
    swipeAreasRef.current.delete(element);
  }, []);

  /**
   * Enable swipe gestures
   */
  const enableSwipeGestures = useCallback(() => {
    setGesturesEnabled(true);
  }, []);

  /**
   * Disable swipe gestures
   */
  const disableSwipeGestures = useCallback(() => {
    setGesturesEnabled(false);
  }, []);

  /**
   * Check if touch point is in edge area for sidebar swipe
   */
  const isInSidebarEdgeArea = useCallback((x: number): boolean => {
    const edgeWidth = 20; // 20px edge area
    return x <= edgeWidth;
  }, []);

  /**
   * Check if touch point is in back navigation edge area
   */
  const isInBackNavEdgeArea = useCallback((x: number): boolean => {
    const edgeWidth = 20; // 20px edge area from right
    const screenWidth = window.innerWidth;
    return x >= screenWidth - edgeWidth;
  }, []);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!gesturesEnabled) return;
    
    const touch = event.touches[0];
    if (!touch) return;

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    lastTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };

    swipeDirectionRef.current = null;
    setSwipeProgress(0);
  }, [gesturesEnabled]);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!gesturesEnabled) return;
    
    const touch = event.touches[0];
    const touchStart = touchStartRef.current;
    
    if (!touch || !touchStart) return;

    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine swipe direction if not already set
    if (!swipeDirectionRef.current && (absDeltaX > 10 || absDeltaY > 10)) {
      if (absDeltaX > absDeltaY) {
        swipeDirectionRef.current = deltaX > 0 ? 'right' : 'left';
      } else {
        swipeDirectionRef.current = deltaY > 0 ? 'down' : 'up';
      }
    }

    // Handle horizontal swipes
    if (swipeDirectionRef.current === 'right' || swipeDirectionRef.current === 'left') {
      // Sidebar swipe (left edge, swipe right)
      if (
        enableSidebar &&
        !isSidebarOpen &&
        swipeDirectionRef.current === 'right' &&
        isInSidebarEdgeArea(touchStart.x) &&
        deltaX > 0
      ) {
        setIsSwiping(true);
        const progress = Math.min(1, deltaX / (window.innerWidth * 0.3)); // 30% of screen width
        setSwipeProgress(progress);
        
        // Prevent default scrolling
        event.preventDefault();
      }
      
      // Back navigation swipe (right edge, swipe left)
      else if (
        canSwipeBack &&
        swipeDirectionRef.current === 'left' &&
        isInBackNavEdgeArea(touchStart.x) &&
        deltaX < 0
      ) {
        setIsSwiping(true);
        const progress = Math.min(1, Math.abs(deltaX) / (window.innerWidth * 0.3));
        setSwipeProgress(progress);
        
        // Prevent default scrolling
        event.preventDefault();
      }
      
      // Close sidebar swipe (swipe left when sidebar is open)
      else if (
        isSidebarOpen &&
        swipeDirectionRef.current === 'left' &&
        deltaX < -swipeThreshold
      ) {
        setIsSwiping(true);
        const progress = Math.min(1, Math.abs(deltaX) / 100);
        setSwipeProgress(progress);
        
        // Prevent default scrolling
        event.preventDefault();
      }
    }

    lastTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }, [
    gesturesEnabled,
    enableSidebar,
    isSidebarOpen,
    canSwipeBack,
    swipeThreshold,
    isInSidebarEdgeArea,
    isInBackNavEdgeArea
  ]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!gesturesEnabled) return;
    
    const touchStart = touchStartRef.current;
    const lastTouch = lastTouchRef.current;
    
    if (!touchStart || !lastTouch) return;

    const deltaX = lastTouch.x - touchStart.x;
    const deltaY = lastTouch.y - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;
    const velocity = Math.abs(deltaX) / deltaTime; // pixels per millisecond

    // Check for completed swipe gestures
    const isQuickSwipe = velocity > 0.5; // Quick swipe threshold
    const isLongSwipe = Math.abs(deltaX) > swipeThreshold;

    if (isSwiping) {
      // Sidebar open gesture
      if (
        enableSidebar &&
        !isSidebarOpen &&
        swipeDirectionRef.current === 'right' &&
        isInSidebarEdgeArea(touchStart.x) &&
        (isQuickSwipe || isLongSwipe) &&
        deltaX > 0
      ) {
        openSidebar();
      }
      
      // Back navigation gesture
      else if (
        canSwipeBack &&
        swipeDirectionRef.current === 'left' &&
        isInBackNavEdgeArea(touchStart.x) &&
        (isQuickSwipe || isLongSwipe) &&
        deltaX < 0
      ) {
        onSwipeBack();
      }
      
      // Close sidebar gesture
      else if (
        isSidebarOpen &&
        swipeDirectionRef.current === 'left' &&
        (isQuickSwipe || isLongSwipe) &&
        deltaX < 0
      ) {
        closeSidebar();
      }
    }

    // Reset swipe state
    setIsSwiping(false);
    setSwipeProgress(0);
    touchStartRef.current = null;
    lastTouchRef.current = null;
    swipeDirectionRef.current = null;
  }, [
    gesturesEnabled,
    isSwiping,
    enableSidebar,
    isSidebarOpen,
    canSwipeBack,
    swipeThreshold,
    isInSidebarEdgeArea,
    isInBackNavEdgeArea,
    openSidebar,
    onSwipeBack,
    closeSidebar
  ]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // ESC key closes sidebar
    if (event.key === 'Escape' && isSidebarOpen) {
      closeSidebar();
    }
    
    // Alt + Left arrow for back navigation
    if (event.altKey && event.key === 'ArrowLeft' && canSwipeBack) {
      event.preventDefault();
      onSwipeBack();
    }
    
    // Alt + Right arrow for sidebar toggle
    if (event.altKey && event.key === 'ArrowRight' && enableSidebar) {
      event.preventDefault();
      toggleSidebar();
    }
  }, [isSidebarOpen, canSwipeBack, enableSidebar, closeSidebar, onSwipeBack, toggleSidebar]);

  // Set up event listeners
  useEffect(() => {
    const options = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown]);

  // Close sidebar when navigating
  useEffect(() => {
    if (isSidebarOpen) {
      closeSidebar();
    }
  }, [currentPath, closeSidebar]);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const contextValue: SwipeNavigationContextType = {
    // Sidebar state
    isSidebarOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    
    // Navigation state
    canSwipeBack,
    onSwipeBack,
    
    // Swipe area management
    registerSwipeArea,
    unregisterSwipeArea,
    
    // Gesture settings
    swipeThreshold,
    setSwipeThreshold,
    enableSwipeGestures,
    disableSwipeGestures,
    
    // Touch state
    isSwiping,
    swipeProgress
  };

  return (
    <SwipeNavigationContext.Provider value={contextValue}>
      {children}
    </SwipeNavigationContext.Provider>
  );
};
