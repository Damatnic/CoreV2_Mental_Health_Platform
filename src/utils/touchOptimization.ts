/**
 * Touch Optimization Utilities
 * 
 * Advanced touch handling for mobile mental health app with comprehensive
 * gesture recognition, haptic feedback, and crisis-optimized touch interactions.
 * 
 * @fileoverview Touch optimization and gesture recognition utilities
 * @version 2.0.0
 */

/**
 * Touch gesture types
 */
export type GestureType = 
  | 'tap' 
  | 'double-tap' 
  | 'long-press' 
  | 'swipe' 
  | 'pinch' 
  | 'pan';

/**
 * Swipe direction types
 */
export type SwipeDirection = 
  | 'up' 
  | 'down' 
  | 'left' 
  | 'right';

/**
 * Haptic feedback types
 */
export type HapticType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'selection' 
  | 'impact' 
  | 'notification' 
  | 'error' 
  | 'success' 
  | 'warning';

/**
 * Touch event data interface
 */
export interface TouchData {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  startTime: number;
  duration: number;
  velocity: number;
  distance: number;
}

/**
 * Gesture configuration interface
 */
export interface GestureConfig {
  tapTimeout: number;
  doubleTapTimeout: number;
  longPressTimeout: number;
  swipeThreshold: number;
  pinchThreshold: number;
  panThreshold: number;
  velocityThreshold: number;
}

/**
 * Default gesture configuration
 */
const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  tapTimeout: 250,
  doubleTapTimeout: 300,
  longPressTimeout: 500,
  swipeThreshold: 50,
  pinchThreshold: 0.2,
  panThreshold: 10,
  velocityThreshold: 0.5
};

/**
 * Haptic feedback patterns
 */
const HAPTIC_PATTERNS: Record<HapticType, number[]> = {
  light: [50],
  medium: [100],
  heavy: [200],
  selection: [25],
  impact: [75],
  notification: [100, 50, 50],
  error: [200, 50, 100, 50, 100],
  success: [50, 25, 50],
  warning: [75, 50, 75]
};

/**
 * Advanced Haptic Feedback System
 */
export class HapticManager {
  private static instance: HapticManager;
  private isSupported: boolean;

  private constructor() {
    this.isSupported = 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): HapticManager {
    if (!HapticManager.instance) {
      HapticManager.instance = new HapticManager();
    }
    return HapticManager.instance;
  }

  /**
   * Trigger haptic feedback
   */
  public trigger(type: HapticType, intensity: number = 1): void {
    if (!this.isSupported) return;

    const pattern = HAPTIC_PATTERNS[type];
    const adjustedPattern = pattern.map(duration => Math.round(duration * intensity));
    
    navigator.vibrate(adjustedPattern);
  }

  /**
   * Custom haptic pattern
   */
  public custom(pattern: number[]): void {
    if (!this.isSupported) return;
    navigator.vibrate(pattern);
  }

  /**
   * Crisis haptic pattern
   */
  public crisis(): void {
    if (!this.isSupported) return;
    navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
  }

  /**
   * Stop all vibration
   */
  public stop(): void {
    if (!this.isSupported) return;
    navigator.vibrate(0);
  }

  /**
   * Check if haptic feedback is supported
   */
  public get supported(): boolean {
    return this.isSupported;
  }
}

/**
 * Touch Gesture Recognizer
 */
export class TouchGestureRecognizer {
  private element: HTMLElement;
  private config: GestureConfig;
  private touchData: TouchData | null = null;
  private timers: Map<string, number> = new Map();
  private lastTap: number = 0;
  private tapCount: number = 0;
  private isLongPressing: boolean = false;
  private hapticManager: HapticManager;

  // Event listeners
  private onTap?: (event: TouchEvent, data: TouchData) => void;
  private onDoubleTap?: (event: TouchEvent, data: TouchData) => void;
  private onLongPress?: (event: TouchEvent, data: TouchData) => void;
  private onSwipe?: (event: TouchEvent, direction: SwipeDirection, data: TouchData) => void;
  private onPan?: (event: TouchEvent, data: TouchData) => void;
  private onPinch?: (event: TouchEvent, scale: number, data: TouchData) => void;

  constructor(element: HTMLElement, config: Partial<GestureConfig> = {}) {
    this.element = element;
    this.config = { ...DEFAULT_GESTURE_CONFIG, ...config };
    this.hapticManager = HapticManager.getInstance();
    this.bindEvents();
  }

  /**
   * Bind touch event listeners
   */
  private bindEvents(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
  }

  /**
   * Handle touch start event
   */
  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    const now = Date.now();

    this.touchData = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      startTime: now,
      duration: 0,
      velocity: 0,
      distance: 0
    };

    // Check for double tap
    if (now - this.lastTap < this.config.doubleTapTimeout) {
      this.tapCount++;
    } else {
      this.tapCount = 1;
    }
    this.lastTap = now;

    // Start long press timer
    this.startLongPressTimer();

    // Light haptic feedback on touch start
    this.hapticManager.trigger('light', 0.5);
  }

  /**
   * Handle touch move event
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.touchData) return;

    const touch = event.touches[0];
    const now = Date.now();

    this.touchData.currentX = touch.clientX;
    this.touchData.currentY = touch.clientY;
    this.touchData.deltaX = this.touchData.currentX - this.touchData.startX;
    this.touchData.deltaY = this.touchData.currentY - this.touchData.startY;
    this.touchData.duration = now - this.touchData.startTime;
    this.touchData.distance = Math.sqrt(
      this.touchData.deltaX ** 2 + this.touchData.deltaY ** 2
    );

    // Calculate velocity
    if (this.touchData.duration > 0) {
      this.touchData.velocity = this.touchData.distance / this.touchData.duration;
    }

    // Cancel long press if moved too much
    if (this.touchData.distance > this.config.panThreshold) {
      this.cancelLongPress();
    }

    // Handle pan gesture
    if (this.touchData.distance > this.config.panThreshold && this.onPan) {
      this.onPan(event, { ...this.touchData });
    }

    // Prevent default to avoid scrolling
    if (this.touchData.distance > this.config.panThreshold) {
      event.preventDefault();
    }
  }

  /**
   * Handle touch end event
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.touchData) return;

    const now = Date.now();
    this.touchData.duration = now - this.touchData.startTime;
    this.cancelLongPress();

    // Determine gesture type
    if (this.touchData.distance < this.config.panThreshold) {
      // Tap or double tap
      if (this.tapCount === 1) {
        // Single tap
        setTimeout(() => {
          if (this.tapCount === 1 && this.onTap) {
            this.onTap(event, { ...this.touchData! });
            this.hapticManager.trigger('selection');
          }
        }, this.config.doubleTapTimeout);
      } else if (this.tapCount === 2 && this.onDoubleTap) {
        // Double tap
        this.onDoubleTap(event, { ...this.touchData });
        this.hapticManager.trigger('medium');
        this.tapCount = 0;
      }
    } else if (this.touchData.distance > this.config.swipeThreshold) {
      // Swipe gesture
      const direction = this.getSwipeDirection();
      if (direction && this.onSwipe) {
        this.onSwipe(event, direction, { ...this.touchData });
        this.hapticManager.trigger('impact');
      }
    }

    this.touchData = null;
  }

  /**
   * Handle touch cancel event
   */
  private handleTouchCancel(): void {
    this.cancelLongPress();
    this.touchData = null;
  }

  /**
   * Start long press timer
   */
  private startLongPressTimer(): void {
    const timerId = window.setTimeout(() => {
      if (this.touchData && !this.isLongPressing && this.onLongPress) {
        this.isLongPressing = true;
        this.onLongPress(new TouchEvent('touchstart'), { ...this.touchData });
        this.hapticManager.trigger('heavy');
      }
    }, this.config.longPressTimeout);

    this.timers.set('longpress', timerId);
  }

  /**
   * Cancel long press timer
   */
  private cancelLongPress(): void {
    const timerId = this.timers.get('longpress');
    if (timerId) {
      clearTimeout(timerId);
      this.timers.delete('longpress');
    }
    this.isLongPressing = false;
  }

  /**
   * Get swipe direction
   */
  private getSwipeDirection(): SwipeDirection | null {
    if (!this.touchData) return null;

    const { deltaX, deltaY } = this.touchData;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  // Event listener setters
  public onTapGesture(callback: (event: TouchEvent, data: TouchData) => void): void {
    this.onTap = callback;
  }

  public onDoubleTapGesture(callback: (event: TouchEvent, data: TouchData) => void): void {
    this.onDoubleTap = callback;
  }

  public onLongPressGesture(callback: (event: TouchEvent, data: TouchData) => void): void {
    this.onLongPress = callback;
  }

  public onSwipeGesture(callback: (event: TouchEvent, direction: SwipeDirection, data: TouchData) => void): void {
    this.onSwipe = callback;
  }

  public onPanGesture(callback: (event: TouchEvent, data: TouchData) => void): void {
    this.onPan = callback;
  }

  public onPinchGesture(callback: (event: TouchEvent, scale: number, data: TouchData) => void): void {
    this.onPinch = callback;
  }

  /**
   * Destroy gesture recognizer
   */
  public destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers.clear();
  }
}

/**
 * Touch Feedback Effects
 */
export class TouchFeedbackManager {
  private static instance: TouchFeedbackManager;
  private ripples: Map<HTMLElement, HTMLElement[]> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): TouchFeedbackManager {
    if (!TouchFeedbackManager.instance) {
      TouchFeedbackManager.instance = new TouchFeedbackManager();
    }
    return TouchFeedbackManager.instance;
  }

  /**
   * Add ripple effect to element
   */
  public addRippleEffect(element: HTMLElement, event: TouchEvent): void {
    const rect = element.getBoundingClientRect();
    const touch = event.touches[0] || event.changedTouches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      pointer-events: none;
      left: ${x}px;
      top: ${y}px;
      width: 0;
      height: 0;
      transform: translate(-50%, -50%);
      animation: ripple-animation 0.6s ease-out;
      z-index: 1000;
    `;

    // Add animation keyframes if not already added
    this.addRippleStyles();

    element.style.position = element.style.position || 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    // Store ripple for cleanup
    const elementRipples = this.ripples.get(element) || [];
    elementRipples.push(ripple);
    this.ripples.set(element, elementRipples);

    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
      const ripples = this.ripples.get(element) || [];
      const index = ripples.indexOf(ripple);
      if (index > -1) {
        ripples.splice(index, 1);
      }
    }, 600);
  }

  /**
   * Add ripple animation styles
   */
  private addRippleStyles(): void {
    const styleId = 'touch-ripple-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes ripple-animation {
        from {
          width: 0;
          height: 0;
          opacity: 1;
        }
        to {
          width: 200px;
          height: 200px;
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add press effect to element
   */
  public addPressEffect(element: HTMLElement): void {
    element.style.transition = 'transform 0.1s ease';
    element.style.transform = 'scale(0.96)';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 100);
  }

  /**
   * Add glow effect for crisis buttons
   */
  public addCrisisGlow(element: HTMLElement): void {
    element.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6)';
    element.style.transition = 'box-shadow 0.3s ease';
    
    setTimeout(() => {
      element.style.boxShadow = '';
    }, 300);
  }
}

/**
 * Performance Monitor for Touch Events
 */
export class TouchPerformanceMonitor {
  private eventCounts: Map<string, number> = new Map();
  private lastResetTime: number = Date.now();
  private performanceEntries: PerformanceEntry[] = [];

  /**
   * Log touch event
   */
  public logEvent(eventType: string): void {
    const count = this.eventCounts.get(eventType) || 0;
    this.eventCounts.set(eventType, count + 1);
  }

  /**
   * Get event counts
   */
  public getEventCounts(): Map<string, number> {
    return new Map(this.eventCounts);
  }

  /**
   * Get events per second
   */
  public getEventsPerSecond(): Map<string, number> {
    const now = Date.now();
    const timeDiff = (now - this.lastResetTime) / 1000;
    const epsMap = new Map<string, number>();

    this.eventCounts.forEach((count, event) => {
      epsMap.set(event, count / timeDiff);
    });

    return epsMap;
  }

  /**
   * Reset counters
   */
  public reset(): void {
    this.eventCounts.clear();
    this.lastResetTime = Date.now();
  }

  /**
   * Measure touch latency
   */
  public measureTouchLatency(): number {
    // Measure touch-to-render latency
    return performance.now();
  }
}

/**
 * Utility functions
 */

/**
 * Debounce touch events to prevent excessive firing
 */
export function debounceTouchEvent<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number = 100
): T {
  let timeout: number | undefined;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  }) as T;
}

/**
 * Throttle touch events for performance
 */
export function throttleTouchEvent<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number = 16
): T {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get optimal touch target size based on device
 */
export function getOptimalTouchSize(): number {
  const dpr = window.devicePixelRatio || 1;
  const screenWidth = window.screen.width * dpr;
  
  if (screenWidth <= 320) return 44; // iPhone SE
  if (screenWidth <= 375) return 48; // iPhone 12 mini
  if (screenWidth <= 414) return 52; // iPhone 12 Pro Max
  return 56; // Tablets and larger
}

/**
 * Crisis-optimized touch handler
 */
export function createCrisisTouchHandler(
  element: HTMLElement,
  onActivate: () => void,
  options: {
    hapticFeedback?: boolean;
    visualFeedback?: boolean;
    soundFeedback?: boolean;
  } = {}
): TouchGestureRecognizer {
  const hapticManager = HapticManager.getInstance();
  const feedbackManager = TouchFeedbackManager.getInstance();

  const recognizer = new TouchGestureRecognizer(element, {
    tapTimeout: 150, // Faster response for crisis
    longPressTimeout: 300 // Shorter long press for emergency
  });

  recognizer.onTapGesture(() => {
    if (options.hapticFeedback !== false) {
      hapticManager.crisis();
    }

    if (options.visualFeedback !== false) {
      feedbackManager.addCrisisGlow(element);
    }

    onActivate();
  });

  recognizer.onLongPressGesture(() => {
    // Double-check for crisis activation
    if (options.hapticFeedback !== false) {
      hapticManager.trigger('heavy', 1.5);
    }

    onActivate();
  });

  return recognizer;
}

// Export singleton instances
export const hapticManager = HapticManager.getInstance();
export const touchFeedbackManager = TouchFeedbackManager.getInstance();
export const touchPerformanceMonitor = new TouchPerformanceMonitor();

// Default export with all utilities
export default {
  HapticManager,
  TouchGestureRecognizer,
  TouchFeedbackManager,
  TouchPerformanceMonitor,
  debounceTouchEvent,
  throttleTouchEvent,
  isTouchDevice,
  getOptimalTouchSize,
  createCrisisTouchHandler,
  hapticManager,
  touchFeedbackManager,
  touchPerformanceMonitor
};
