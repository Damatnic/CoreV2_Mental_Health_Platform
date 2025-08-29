/**
 * Swipe Gesture Hook
 *
 * Comprehensive React hook for handling swipe gestures across mobile and desktop devices
 * with advanced touch detection, gesture recognition, and accessibility support
 *
 * Features:
 * - Multi-directional swipe detection (up, down, left, right)
 * - Configurable sensitivity and thresholds
 * - Velocity-based gesture recognition
 * - Touch, mouse, and pointer event support
 * - Accessibility compliance with keyboard navigation
 * - Gesture prevention and custom event handling
 * - Multi-touch support and gesture conflicts resolution
 * - Performance optimized with RAF and debouncing
 *
 * @license Apache-2.0
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { logger } from '../utils/logger';

// Swipe Direction Enum
export enum SwipeDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

// Touch Point Interface
interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  identifier?: number;
}

// Swipe Event Data Interface
interface SwipeEventData {
  direction: SwipeDirection;
  distance: number;
  velocity: number;
  duration: number;
  startPoint: TouchPoint;
  endPoint: TouchPoint;
  element: HTMLElement;
  originalEvent: TouchEvent | MouseEvent | PointerEvent;
}

// Swipe Configuration Interface
interface SwipeConfig {
  // Sensitivity Settings
  minDistance: number; // Minimum distance in pixels
  maxDistance: number; // Maximum distance in pixels
  minVelocity: number; // Minimum velocity in px/ms
  maxDuration: number; // Maximum duration in milliseconds
  
  // Direction Settings
  enabledDirections: SwipeDirection[];
  preventDefaultEvents: boolean;
  stopPropagation: boolean;
  
  // Touch Settings
  touchThreshold: number; // Minimum touch movement to register
  multiTouchSupport: boolean;
  ignoreMultiTouch: boolean;
  
  // Mouse/Pointer Settings
  enableMouseEvents: boolean;
  enablePointerEvents: boolean;
  mouseButtonMask: number; // Which mouse buttons to listen for
  
  // Accessibility Settings
  enableKeyboardSupport: boolean;
  keyboardMapping: Record<string, SwipeDirection>;
  announceGestures: boolean;
  
  // Performance Settings
  useRAF: boolean; // Use requestAnimationFrame for updates
  debounceMs: number; // Debounce gesture events
  throttleMs: number; // Throttle move events
}

// Gesture State Interface
interface GestureState {
  isActive: boolean;
  startPoint: TouchPoint | null;
  currentPoint: TouchPoint | null;
  lastMoveTime: number;
  gestureId: string | null;
  touchCount: number;
  isPrevented: boolean;
}

// Hook Configuration Type
interface UseSwipeGestureConfig extends Partial<SwipeConfig> {
  onSwipe?: (data: SwipeEventData) => void;
  onSwipeStart?: (startPoint: TouchPoint, element: HTMLElement) => void;
  onSwipeMove?: (currentPoint: TouchPoint, startPoint: TouchPoint, element: HTMLElement) => void;
  onSwipeEnd?: (endPoint: TouchPoint, startPoint: TouchPoint, element: HTMLElement) => void;
  onSwipeCancel?: (reason: string, element: HTMLElement) => void;
}

// Hook Return Type
interface UseSwipeGestureReturn {
  // Event Handlers
  onTouchStart: (event: TouchEvent) => void;
  onTouchMove: (event: TouchEvent) => void;
  onTouchEnd: (event: TouchEvent) => void;
  onTouchCancel: (event: TouchEvent) => void;
  onMouseDown: (event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
  onMouseUp: (event: MouseEvent) => void;
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  
  // State
  isGestureActive: boolean;
  currentDirection: SwipeDirection | null;
  gestureProgress: number; // 0-1
  
  // Controls
  cancelGesture: () => void;
  preventNextGesture: () => void;
  resetGesture: () => void;
  
  // Utilities
  isDirectionEnabled: (direction: SwipeDirection) => boolean;
  getGestureData: () => SwipeEventData | null;
}

// Default Configuration
const DEFAULT_CONFIG: SwipeConfig = {
  minDistance: 30,
  maxDistance: 1000,
  minVelocity: 0.1,
  maxDuration: 1000,
  enabledDirections: [SwipeDirection.UP, SwipeDirection.DOWN, SwipeDirection.LEFT, SwipeDirection.RIGHT],
  preventDefaultEvents: true,
  stopPropagation: false,
  touchThreshold: 10,
  multiTouchSupport: false,
  ignoreMultiTouch: true,
  enableMouseEvents: true,
  enablePointerEvents: true,
  mouseButtonMask: 1, // Left mouse button only
  enableKeyboardSupport: true,
  keyboardMapping: {
    'ArrowUp': SwipeDirection.UP,
    'ArrowDown': SwipeDirection.DOWN,
    'ArrowLeft': SwipeDirection.LEFT,
    'ArrowRight': SwipeDirection.RIGHT
  },
  announceGestures: false,
  useRAF: true,
  debounceMs: 50,
  throttleMs: 16 // ~60fps
};

/**
 * Swipe Gesture Hook
 * 
 * @param config - Configuration for swipe gesture detection
 * @returns Gesture event handlers and state
 */
export function useSwipeGesture(config: UseSwipeGestureConfig = {}): UseSwipeGestureReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State
  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    startPoint: null,
    currentPoint: null,
    lastMoveTime: 0,
    gestureId: null,
    touchCount: 0,
    isPrevented: false
  });
  
  const [currentDirection, setCurrentDirection] = useState<SwipeDirection | null>(null);
  const [gestureProgress, setGestureProgress] = useState(0);
  
  // Refs
  const rafRef = useRef<number | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMoveTimeRef = useRef(0);
  const gestureDataRef = useRef<SwipeEventData | null>(null);
  
  // Calculate gesture direction and distance
  const calculateGestureData = useCallback((
    startPoint: TouchPoint, 
    endPoint: TouchPoint, 
    element: HTMLElement,
    originalEvent: TouchEvent | MouseEvent | PointerEvent
  ): SwipeEventData | null => {
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = endPoint.timestamp - startPoint.timestamp;
    
    // Check minimum distance
    if (distance < finalConfig.minDistance) {
      return null;
    }
    
    // Check maximum distance
    if (distance > finalConfig.maxDistance) {
      return null;
    }
    
    // Check maximum duration
    if (duration > finalConfig.maxDuration) {
      return null;
    }
    
    // Calculate velocity
    const velocity = distance / Math.max(duration, 1);
    
    // Check minimum velocity
    if (velocity < finalConfig.minVelocity) {
      return null;
    }
    
    // Determine direction
    let direction: SwipeDirection;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      direction = deltaX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
    }
    
    // Check if direction is enabled
    if (!finalConfig.enabledDirections.includes(direction)) {
      return null;
    }
    
    return {
      direction,
      distance,
      velocity,
      duration,
      startPoint,
      endPoint,
      element,
      originalEvent
    };
  }, [finalConfig]);
  
  // Handle gesture start
  const handleGestureStart = useCallback((
    point: TouchPoint, 
    element: HTMLElement,
    gestureId?: string
  ) => {
    // Cancel any existing gesture
    if (gestureState.isActive) {
      cancelGesture();
    }
    
    setGestureState(prev => ({
      ...prev,
      isActive: true,
      startPoint: point,
      currentPoint: point,
      lastMoveTime: point.timestamp,
      gestureId: gestureId || `gesture_${Date.now()}`,
      touchCount: 1,
      isPrevented: false
    }));
    
    setCurrentDirection(null);
    setGestureProgress(0);
    
    // Call onSwipeStart callback
    config.onSwipeStart?.(point, element);
    
    logger.debug('Gesture started', { point, gestureId });
  }, [gestureState.isActive, config]);
  
  // Handle gesture move
  const handleGestureMove = useCallback((
    point: TouchPoint,
    element: HTMLElement
  ) => {
    if (!gestureState.isActive || !gestureState.startPoint) {
      return;
    }
    
    // Throttle move events
    const now = Date.now();
    if (now - lastMoveTimeRef.current < finalConfig.throttleMs) {
      return;
    }
    lastMoveTimeRef.current = now;
    
    // Update gesture state
    setGestureState(prev => ({
      ...prev,
      currentPoint: point,
      lastMoveTime: point.timestamp
    }));
    
    // Calculate current direction and progress
    const deltaX = point.x - gestureState.startPoint.x;
    const deltaY = point.y - gestureState.startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Update progress (0-1 based on min/max distance)
    const progress = Math.min(
      Math.max((distance - finalConfig.minDistance) / (finalConfig.maxDistance - finalConfig.minDistance), 0),
      1
    );
    setGestureProgress(progress);
    
    // Update current direction
    if (distance > finalConfig.touchThreshold) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      let direction: SwipeDirection;
      if (absDeltaX > absDeltaY) {
        direction = deltaX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
      } else {
        direction = deltaY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
      }
      
      setCurrentDirection(direction);
    }
    
    // Call onSwipeMove callback
    config.onSwipeMove?.(point, gestureState.startPoint, element);
  }, [gestureState.isActive, gestureState.startPoint, finalConfig, config]);
  
  // Handle gesture end
  const handleGestureEnd = useCallback((
    point: TouchPoint,
    element: HTMLElement,
    originalEvent: TouchEvent | MouseEvent | PointerEvent
  ) => {
    if (!gestureState.isActive || !gestureState.startPoint) {
      return;
    }
    
    // Calculate gesture data
    const gestureData = calculateGestureData(
      gestureState.startPoint,
      point,
      element,
      originalEvent
    );
    
    // Store gesture data for reference
    gestureDataRef.current = gestureData;
    
    // Reset gesture state
    setGestureState(prev => ({
      ...prev,
      isActive: false,
      startPoint: null,
      currentPoint: null,
      gestureId: null,
      touchCount: 0
    }));
    
    setCurrentDirection(null);
    setGestureProgress(0);
    
    // Call callbacks
    config.onSwipeEnd?.(point, gestureState.startPoint, element);
    
    if (gestureData && !gestureState.isPrevented) {
      // Debounce gesture events
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        config.onSwipe?.(gestureData);
        
        // Announce gesture for accessibility
        if (finalConfig.announceGestures) {
          announceGesture(gestureData.direction);
        }
      }, finalConfig.debounceMs);
    }
    
    logger.debug('Gesture ended', { 
      gestureData, 
      prevented: gestureState.isPrevented 
    });
  }, [gestureState, calculateGestureData, finalConfig, config]);
  
  // Cancel gesture
  const cancelGesture = useCallback(() => {
    if (!gestureState.isActive) return;
    
    const element = document.activeElement as HTMLElement;
    
    setGestureState(prev => ({
      ...prev,
      isActive: false,
      startPoint: null,
      currentPoint: null,
      gestureId: null,
      touchCount: 0
    }));
    
    setCurrentDirection(null);
    setGestureProgress(0);
    
    // Clear timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    config.onSwipeCancel?.('cancelled', element);
    
    logger.debug('Gesture cancelled');
  }, [gestureState.isActive, config]);
  
  // Prevent next gesture
  const preventNextGesture = useCallback(() => {
    setGestureState(prev => ({ ...prev, isPrevented: true }));
  }, []);
  
  // Reset gesture
  const resetGesture = useCallback(() => {
    cancelGesture();
    gestureDataRef.current = null;
  }, [cancelGesture]);
  
  // Touch Event Handlers
  const onTouchStart = useCallback((event: TouchEvent) => {
    if (!event.target) return;
    
    const element = event.target as HTMLElement;
    const touch = event.touches[0];
    
    // Handle multi-touch
    if (event.touches.length > 1) {
      if (finalConfig.ignoreMultiTouch) {
        cancelGesture();
        return;
      } else if (!finalConfig.multiTouchSupport) {
        return;
      }
    }
    
    const point: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
      identifier: touch.identifier
    };
    
    handleGestureStart(point, element, `touch_${touch.identifier}`);
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
    
    if (finalConfig.stopPropagation) {
      event.stopPropagation();
    }
  }, [finalConfig, handleGestureStart, cancelGesture]);
  
  const onTouchMove = useCallback((event: TouchEvent) => {
    if (!gestureState.isActive || !event.target) return;
    
    const element = event.target as HTMLElement;
    const touch = Array.from(event.touches).find(
      t => t.identifier === gestureState.startPoint?.identifier
    ) || event.touches[0];
    
    const point: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
      identifier: touch.identifier
    };
    
    if (finalConfig.useRAF) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        handleGestureMove(point, element);
      });
    } else {
      handleGestureMove(point, element);
    }
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
  }, [gestureState, finalConfig, handleGestureMove]);
  
  const onTouchEnd = useCallback((event: TouchEvent) => {
    if (!gestureState.isActive || !event.target) return;
    
    const element = event.target as HTMLElement;
    const touch = Array.from(event.changedTouches).find(
      t => t.identifier === gestureState.startPoint?.identifier
    ) || event.changedTouches[0];
    
    const point: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
      identifier: touch.identifier
    };
    
    handleGestureEnd(point, element, event);
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
  }, [gestureState, finalConfig, handleGestureEnd]);
  
  const onTouchCancel = useCallback((event: TouchEvent) => {
    cancelGesture();
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
  }, [cancelGesture, finalConfig]);
  
  // Mouse Event Handlers
  const onMouseDown = useCallback((event: MouseEvent) => {
    if (!finalConfig.enableMouseEvents || !event.target) return;
    
    // Check mouse button
    if (!(event.buttons & finalConfig.mouseButtonMask)) return;
    
    const element = event.target as HTMLElement;
    const point: TouchPoint = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    };
    
    handleGestureStart(point, element, 'mouse');
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
  }, [finalConfig, handleGestureStart]);
  
  const onMouseMove = useCallback((event: MouseEvent) => {
    if (!finalConfig.enableMouseEvents || !gestureState.isActive || !event.target) return;
    
    const element = event.target as HTMLElement;
    const point: TouchPoint = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    };
    
    handleGestureMove(point, element);
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
  }, [finalConfig, gestureState.isActive, handleGestureMove]);
  
  const onMouseUp = useCallback((event: MouseEvent) => {
    if (!finalConfig.enableMouseEvents || !gestureState.isActive || !event.target) return;
    
    const element = event.target as HTMLElement;
    const point: TouchPoint = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    };
    
    handleGestureEnd(point, element, event);
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
  }, [finalConfig, gestureState.isActive, handleGestureEnd]);
  
  // Pointer Event Handlers
  const onPointerDown = useCallback((event: PointerEvent) => {
    if (!finalConfig.enablePointerEvents || !event.target) return;
    
    const element = event.target as HTMLElement;
    const point: TouchPoint = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      identifier: event.pointerId
    };
    
    handleGestureStart(point, element, `pointer_${event.pointerId}`);
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
  }, [finalConfig, handleGestureStart]);
  
  const onPointerMove = useCallback((event: PointerEvent) => {
    if (!finalConfig.enablePointerEvents || !gestureState.isActive || !event.target) return;
    
    const element = event.target as HTMLElement;
    const point: TouchPoint = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      identifier: event.pointerId
    };
    
    handleGestureMove(point, element);
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
  }, [finalConfig, gestureState.isActive, handleGestureMove]);
  
  const onPointerUp = useCallback((event: PointerEvent) => {
    if (!finalConfig.enablePointerEvents || !gestureState.isActive || !event.target) return;
    
    const element = event.target as HTMLElement;
    const point: TouchPoint = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      identifier: event.pointerId
    };
    
    handleGestureEnd(point, element, event);
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
  }, [finalConfig, gestureState.isActive, handleGestureEnd]);
  
  // Keyboard Event Handler
  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (!finalConfig.enableKeyboardSupport || !event.target) return;
    
    const direction = finalConfig.keyboardMapping[event.key];
    if (!direction || !finalConfig.enabledDirections.includes(direction)) return;
    
    const element = event.target as HTMLElement;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Simulate swipe gesture
    const startPoint: TouchPoint = {
      x: centerX,
      y: centerY,
      timestamp: Date.now()
    };
    
    const distance = finalConfig.minDistance + 10;
    let endX = centerX;
    let endY = centerY;
    
    switch (direction) {
      case SwipeDirection.UP:
        endY -= distance;
        break;
      case SwipeDirection.DOWN:
        endY += distance;
        break;
      case SwipeDirection.LEFT:
        endX -= distance;
        break;
      case SwipeDirection.RIGHT:
        endX += distance;
        break;
    }
    
    const endPoint: TouchPoint = {
      x: endX,
      y: endY,
      timestamp: Date.now() + 100 // 100ms duration
    };
    
    const gestureData = calculateGestureData(startPoint, endPoint, element, event as any);
    
    if (gestureData) {
      config.onSwipe?.(gestureData);
      
      if (finalConfig.announceGestures) {
        announceGesture(direction);
      }
    }
    
    if (finalConfig.preventDefaultEvents) {
      event.preventDefault();
    }
  }, [finalConfig, calculateGestureData, config]);
  
  // Utility Functions
  const isDirectionEnabled = useCallback((direction: SwipeDirection): boolean => {
    return finalConfig.enabledDirections.includes(direction);
  }, [finalConfig.enabledDirections]);
  
  const getGestureData = useCallback((): SwipeEventData | null => {
    return gestureDataRef.current;
  }, []);
  
  // Announce gesture for accessibility
  const announceGesture = useCallback((direction: SwipeDirection) => {
    try {
      const message = `Swiped ${direction}`;
      
      // Use ARIA live region if available
      const liveRegion = document.querySelector('[aria-live]') as HTMLElement;
      if (liveRegion) {
        liveRegion.textContent = message;
        setTimeout(() => {
          liveRegion.textContent = '';
        }, 1000);
      }
      
      logger.debug('Gesture announced', { direction, message });
    } catch (error) {
      logger.error('Failed to announce gesture', { direction, error });
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  return {
    // Event Handlers
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onKeyDown,
    
    // State
    isGestureActive: gestureState.isActive,
    currentDirection,
    gestureProgress,
    
    // Controls
    cancelGesture,
    preventNextGesture,
    resetGesture,
    
    // Utilities
    isDirectionEnabled,
    getGestureData
  };
}

export type { 
  UseSwipeGestureReturn, 
  SwipeEventData, 
  SwipeConfig, 
  UseSwipeGestureConfig,
  TouchPoint 
};
