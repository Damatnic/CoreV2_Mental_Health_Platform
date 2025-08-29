/**
 * Mobile Viewport Manager
 * 
 * Comprehensive mobile viewport management system for responsive design,
 * orientation handling, and mobile-specific UI adaptations.
 * 
 * @fileoverview Mobile viewport utilities and responsive design helpers
 * @version 2.0.0
 */

/**
 * Viewport dimensions interface
 */
export interface ViewportDimensions {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
  devicePixelRatio: number;
}

/**
 * Screen orientation information
 */
export interface OrientationInfo {
  type: 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Mobile device information
 */
export interface MobileDeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

/**
 * Viewport change event data
 */
export interface ViewportChangeEvent {
  dimensions: ViewportDimensions;
  orientation: OrientationInfo;
  deviceInfo: MobileDeviceInfo;
  timestamp: number;
}

/**
 * Mobile viewport configuration
 */
export interface MobileViewportConfig {
  enableOrientationLock: boolean;
  enableViewportMetaTag: boolean;
  enableTouchHandling: boolean;
  enableKeyboardHandling: boolean;
  debounceDelay: number;
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

/**
 * Default mobile viewport configuration
 */
export const DEFAULT_MOBILE_CONFIG: MobileViewportConfig = {
  enableOrientationLock: false,
  enableViewportMetaTag: true,
  enableTouchHandling: true,
  enableKeyboardHandling: true,
  debounceDelay: 150,
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  }
};

/**
 * Mobile Viewport Manager Class
 */
export class MobileViewportManager {
  private config: MobileViewportConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private resizeTimeout: NodeJS.Timeout | null = null;
  private keyboardVisible = false;
  private initialViewportHeight = 0;

  constructor(config: Partial<MobileViewportConfig> = {}) {
    this.config = { ...DEFAULT_MOBILE_CONFIG, ...config };
    this.initialize();
  }

  /**
   * Initialize the viewport manager
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    this.initialViewportHeight = window.innerHeight;
    
    if (this.config.enableViewportMetaTag) {
      this.setupViewportMetaTag();
    }

    if (this.config.enableTouchHandling) {
      this.setupTouchHandling();
    }

    if (this.config.enableKeyboardHandling) {
      this.setupKeyboardHandling();
    }

    this.setupEventListeners();
  }

  /**
   * Setup viewport meta tag for mobile optimization
   */
  private setupViewportMetaTag(): void {
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  }

  /**
   * Setup touch handling optimizations
   */
  private setupTouchHandling(): void {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    // Prevent pull-to-refresh on iOS
    document.addEventListener('touchstart', (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchmove', (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    }, { passive: false });
  }

  /**
   * Setup mobile keyboard handling
   */
  private setupKeyboardHandling(): void {
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = this.initialViewportHeight - currentHeight;
      
      // Keyboard is likely visible if height decreased significantly
      const keyboardThreshold = 150;
      const wasKeyboardVisible = this.keyboardVisible;
      this.keyboardVisible = heightDifference > keyboardThreshold;

      if (wasKeyboardVisible !== this.keyboardVisible) {
        this.emit('keyboardToggle', {
          visible: this.keyboardVisible,
          height: this.keyboardVisible ? heightDifference : 0
        });
      }

      // Adjust viewport for keyboard
      if (this.keyboardVisible) {
        document.documentElement.style.setProperty('--keyboard-height', `${heightDifference}px`);
        document.body.classList.add('keyboard-visible');
      } else {
        document.documentElement.style.removeProperty('--keyboard-height');
        document.body.classList.remove('keyboard-visible');
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Handle input focus/blur
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('input, textarea, select')) {
        setTimeout(handleResize, 300); // Allow time for keyboard animation
      }
    });

    document.addEventListener('focusout', () => {
      setTimeout(handleResize, 300); // Allow time for keyboard animation
    });
  }

  /**
   * Setup event listeners for viewport changes
   */
  private setupEventListeners(): void {
    const handleResize = () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      this.resizeTimeout = setTimeout(() => {
        this.handleViewportChange();
      }, this.config.debounceDelay);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Initial viewport change event
    setTimeout(() => this.handleViewportChange(), 100);
  }

  /**
   * Handle viewport change events
   */
  private handleViewportChange(): void {
    const event: ViewportChangeEvent = {
      dimensions: this.getViewportDimensions(),
      orientation: this.getOrientationInfo(),
      deviceInfo: this.getDeviceInfo(),
      timestamp: Date.now()
    };

    this.emit('viewportChange', event);
    this.emit('resize', event.dimensions);
    this.emit('orientationChange', event.orientation);
  }

  /**
   * Get current viewport dimensions
   */
  public getViewportDimensions(): ViewportDimensions {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      availableWidth: screen.availWidth,
      availableHeight: screen.availHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }

  /**
   * Get current orientation information
   */
  public getOrientationInfo(): OrientationInfo {
    const orientation = screen.orientation || ({} as ScreenOrientation);
    const type = orientation.type || 'portrait-primary';
    const angle = orientation.angle || 0;

    return {
      type: type as OrientationInfo['type'],
      angle,
      isPortrait: type.includes('portrait'),
      isLandscape: type.includes('landscape')
    };
  }

  /**
   * Get mobile device information
   */
  public getDeviceInfo(): MobileDeviceInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /(iPad|Android(?!.*Mobile))/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;
    const isTouchDevice = maxTouchPoints > 0 || 'ontouchstart' in window;

    return {
      isMobile: isMobile && !isTablet,
      isTablet,
      isDesktop,
      isTouchDevice,
      userAgent,
      platform,
      maxTouchPoints
    };
  }

  /**
   * Check if current viewport matches breakpoint
   */
  public matchesBreakpoint(breakpoint: keyof MobileViewportConfig['breakpoints']): boolean {
    const width = window.innerWidth;
    const breakpointValue = this.config.breakpoints[breakpoint];

    switch (breakpoint) {
      case 'mobile':
        return width < breakpointValue;
      case 'tablet':
        return width >= this.config.breakpoints.mobile && width < breakpointValue;
      case 'desktop':
        return width >= breakpointValue;
      default:
        return false;
    }
  }

  /**
   * Get current breakpoint
   */
  public getCurrentBreakpoint(): keyof MobileViewportConfig['breakpoints'] {
    if (this.matchesBreakpoint('mobile')) return 'mobile';
    if (this.matchesBreakpoint('tablet')) return 'tablet';
    return 'desktop';
  }

  /**
   * Check if keyboard is currently visible
   */
  public isKeyboardVisible(): boolean {
    return this.keyboardVisible;
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in viewport event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MobileViewportConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): MobileViewportConfig {
    return { ...this.config };
  }

  /**
   * Destroy the viewport manager
   */
  public destroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.listeners.clear();
    document.body.classList.remove('keyboard-visible');
    document.documentElement.style.removeProperty('--keyboard-height');
  }
}

/**
 * Global viewport manager instance
 */
let globalViewportManager: MobileViewportManager | null = null;

/**
 * Get or create global viewport manager instance
 */
export function getViewportManager(config?: Partial<MobileViewportConfig>): MobileViewportManager {
  if (!globalViewportManager) {
    globalViewportManager = new MobileViewportManager(config);
  } else if (config) {
    globalViewportManager.updateConfig(config);
  }
  
  return globalViewportManager;
}

/**
 * Utility functions for common viewport operations
 */
export const ViewportUtils = {
  /**
   * Check if device is mobile
   */
  isMobile: (): boolean => {
    return getViewportManager().getDeviceInfo().isMobile;
  },

  /**
   * Check if device is tablet
   */
  isTablet: (): boolean => {
    return getViewportManager().getDeviceInfo().isTablet;
  },

  /**
   * Check if device supports touch
   */
  isTouchDevice: (): boolean => {
    return getViewportManager().getDeviceInfo().isTouchDevice;
  },

  /**
   * Get current viewport width
   */
  getViewportWidth: (): number => {
    return getViewportManager().getViewportDimensions().width;
  },

  /**
   * Get current viewport height
   */
  getViewportHeight: (): number => {
    return getViewportManager().getViewportDimensions().height;
  },

  /**
   * Check if in portrait orientation
   */
  isPortrait: (): boolean => {
    return getViewportManager().getOrientationInfo().isPortrait;
  },

  /**
   * Check if in landscape orientation
   */
  isLandscape: (): boolean => {
    return getViewportManager().getOrientationInfo().isLandscape;
  },

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint: (): string => {
    return getViewportManager().getCurrentBreakpoint();
  }
};

export default MobileViewportManager;
