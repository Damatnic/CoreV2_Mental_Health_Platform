/**
 * useAriaLive Hook - WCAG AAA Compliant Screen Reader Announcements
 * 
 * Provides a comprehensive system for managing ARIA live regions and screen reader
 * announcements in the mental health platform. Ensures all dynamic content changes
 * are properly announced to assistive technologies.
 * 
 * @version 3.0.0
 * @wcag 2.1 Level AAA
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

export type AriaLivePriority = 'polite' | 'assertive' | 'off';
export type AriaRelevant = 'additions' | 'removals' | 'text' | 'all';
export type AnnouncementCategory = 
  | 'status' 
  | 'alert' 
  | 'error' 
  | 'success' 
  | 'warning' 
  | 'info' 
  | 'navigation' 
  | 'crisis'
  | 'form'
  | 'chat'
  | 'mood'
  | 'timer';

interface AnnouncementOptions {
  /** Priority level for the announcement */
  priority?: AriaLivePriority;
  /** Category of announcement for filtering/styling */
  category?: AnnouncementCategory;
  /** Clear announcement after specified milliseconds */
  clearAfter?: number;
  /** Prevent duplicate announcements within timeframe */
  debounce?: number;
  /** Additional ARIA attributes */
  ariaAtomic?: boolean;
  ariaRelevant?: AriaRelevant;
  /** Play sound with announcement (for critical alerts) */
  playSound?: boolean;
  /** Vibrate pattern for mobile (milliseconds) */
  vibrate?: number[];
  /** Persist announcement in history */
  persist?: boolean;
  /** Custom CSS class for visual styling */
  className?: string;
}

interface Announcement {
  id: string;
  message: string;
  timestamp: Date;
  priority: AriaLivePriority;
  category: AnnouncementCategory;
  options: AnnouncementOptions;
  cleared: boolean;
}

interface UseAriaLiveConfig {
  /** Maximum announcements to keep in history */
  maxHistory?: number;
  /** Default clear timeout in milliseconds */
  defaultClearAfter?: number;
  /** Enable sound for critical announcements */
  enableSounds?: boolean;
  /** Enable vibration for mobile */
  enableVibration?: boolean;
  /** Log all announcements for debugging */
  debug?: boolean;
  /** Filter announcements by category */
  allowedCategories?: AnnouncementCategory[];
  /** Custom sound URLs by category */
  soundUrls?: Partial<Record<AnnouncementCategory, string>>;
}

interface UseAriaLiveReturn {
  /** Make an announcement to screen readers */
  announce: (message: string, options?: AnnouncementOptions) => void;
  /** Clear a specific announcement */
  clear: (id?: string) => void;
  /** Clear all announcements */
  clearAll: () => void;
  /** Get announcement history */
  history: Announcement[];
  /** Get current active announcements */
  activeAnnouncements: Announcement[];
  /** Check if currently announcing */
  isAnnouncing: boolean;
  /** Pause announcements */
  pause: () => void;
  /** Resume announcements */
  resume: () => void;
  /** Update configuration */
  updateConfig: (config: Partial<UseAriaLiveConfig>) => void;
}

// Default sound URLs for different categories
const DEFAULT_SOUNDS: Partial<Record<AnnouncementCategory, string>> = {
  alert: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
  error: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
  success: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
  crisis: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
};

/**
 * Custom hook for managing ARIA live region announcements
 * Ensures WCAG AAA compliance for dynamic content updates
 */
export function useAriaLive(initialConfig?: UseAriaLiveConfig): UseAriaLiveReturn {
  const [config, setConfig] = useState<UseAriaLiveConfig>({
    maxHistory: 50,
    defaultClearAfter: 5000,
    enableSounds: true,
    enableVibration: true,
    debug: false,
    allowedCategories: undefined,
    soundUrls: DEFAULT_SOUNDS,
    ...initialConfig
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const announcementQueue = useRef<Announcement[]>([]);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const clearTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const lastAnnouncementRef = useRef<string>('');
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  // Initialize audio cache
  useEffect(() => {
    if (!config.enableSounds || !config.soundUrls) return;

    Object.entries(config.soundUrls).forEach(([category, url]) => {
      if (url && !audioCache.current.has(category)) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audioCache.current.set(category, audio);
      }
    });
  }, [config.enableSounds, config.soundUrls]);

  // Create hidden live regions for announcements
  useEffect(() => {
    // Create container for live regions
    const container = document.createElement('div');
    container.id = 'aria-live-regions';
    container.style.position = 'absolute';
    container.style.left = '-10000px';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.overflow = 'hidden';

    // Create polite region
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.setAttribute('role', 'status');
    politeRegion.id = 'aria-live-polite';
    container.appendChild(politeRegion);

    // Create assertive region
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.setAttribute('role', 'alert');
    assertiveRegion.id = 'aria-live-assertive';
    container.appendChild(assertiveRegion);

    document.body.appendChild(container);
    liveRegionRef.current = container;

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  // Process announcement queue
  useEffect(() => {
    if (isPaused || announcementQueue.current.length === 0) return;

    const processQueue = async () => {
      while (announcementQueue.current.length > 0 && !isPaused) {
        const announcement = announcementQueue.current.shift();
        if (!announcement) continue;

        setIsAnnouncing(true);

        // Get the appropriate live region
        const regionId = announcement.priority === 'assertive' 
          ? 'aria-live-assertive' 
          : 'aria-live-polite';
        const region = document.getElementById(regionId);

        if (region) {
          // Clear previous content
          region.textContent = '';
          
          // Wait for screen reader to register the clear
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Set new announcement
          region.textContent = announcement.message;

          // Play sound if configured
          if (config.enableSounds && announcement.options.playSound) {
            const audio = audioCache.current.get(announcement.category);
            if (audio) {
              try {
                await audio.play();
              } catch (error) {
                logger.warn('Failed to play announcement sound', error);
              }
            }
          }

          // Vibrate if configured and supported
          if (config.enableVibration && announcement.options.vibrate && 'vibrate' in navigator) {
            try {
              navigator.vibrate(announcement.options.vibrate);
            } catch (error) {
              logger.warn('Failed to vibrate', error);
            }
          }

          // Wait for announcement to be read
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        setIsAnnouncing(false);
      }
    };

    processQueue();
  }, [announcements, isPaused, config.enableSounds, config.enableVibration]);

  /**
   * Make an announcement to screen readers
   */
  const announce = useCallback((message: string, options: AnnouncementOptions = {}) => {
    if (!message || message.trim().length === 0) return;

    const announcementOptions: AnnouncementOptions = {
      priority: 'polite',
      category: 'info',
      clearAfter: config.defaultClearAfter,
      debounce: 0,
      ariaAtomic: true,
      ariaRelevant: 'additions',
      playSound: false,
      persist: false,
      ...options
    };

    // Check if category is allowed
    if (config.allowedCategories && 
        !config.allowedCategories.includes(announcementOptions.category!)) {
      return;
    }

    // Handle debouncing
    if (announcementOptions.debounce && announcementOptions.debounce > 0) {
      const debounceKey = `${announcementOptions.category}-${message}`;
      
      if (debounceTimers.current.has(debounceKey)) {
        clearTimeout(debounceTimers.current.get(debounceKey)!);
      }

      const timer = setTimeout(() => {
        debounceTimers.current.delete(debounceKey);
        announce(message, { ...options, debounce: 0 });
      }, announcementOptions.debounce);

      debounceTimers.current.set(debounceKey, timer);
      return;
    }

    // Prevent duplicate consecutive announcements
    if (message === lastAnnouncementRef.current) {
      return;
    }
    lastAnnouncementRef.current = message;

    // Create announcement object
    const announcement: Announcement = {
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      timestamp: new Date(),
      priority: announcementOptions.priority!,
      category: announcementOptions.category!,
      options: announcementOptions,
      cleared: false
    };

    // Add to queue
    announcementQueue.current.push(announcement);

    // Update state
    setAnnouncements(prev => {
      const updated = [...prev, announcement];
      
      // Limit history size
      if (updated.length > config.maxHistory!) {
        return updated.slice(-config.maxHistory!);
      }
      
      return updated;
    });

    // Set up auto-clear
    if (announcementOptions.clearAfter && announcementOptions.clearAfter > 0) {
      const timer = setTimeout(() => {
        clear(announcement.id);
      }, announcementOptions.clearAfter);
      
      clearTimers.current.set(announcement.id, timer);
    }

    // Log if debugging
    if (config.debug) {
      logger.debug('ARIA Live announcement', {
        message,
        priority: announcementOptions.priority,
        category: announcementOptions.category
      });
    }

    // Special handling for crisis announcements
    if (announcementOptions.category === 'crisis') {
      // Always use assertive priority for crisis
      announcement.priority = 'assertive';
      
      // Always play sound and vibrate for crisis
      if (config.enableSounds) {
        announcement.options.playSound = true;
      }
      if (config.enableVibration) {
        announcement.options.vibrate = [200, 100, 200, 100, 200];
      }
      
      logger.warn('Crisis announcement made', { message });
    }
  }, [config]);

  /**
   * Clear a specific announcement or the last one
   */
  const clear = useCallback((id?: string) => {
    setAnnouncements(prev => {
      if (id) {
        // Clear specific announcement
        return prev.map(a => 
          a.id === id ? { ...a, cleared: true } : a
        );
      } else {
        // Clear the last announcement
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].cleared = true;
        }
        return updated;
      }
    });

    // Clear any associated timers
    if (id && clearTimers.current.has(id)) {
      clearTimeout(clearTimers.current.get(id)!);
      clearTimers.current.delete(id);
    }

    // Clear from DOM
    const politeRegion = document.getElementById('aria-live-polite');
    const assertiveRegion = document.getElementById('aria-live-assertive');
    if (politeRegion) politeRegion.textContent = '';
    if (assertiveRegion) assertiveRegion.textContent = '';
  }, []);

  /**
   * Clear all announcements
   */
  const clearAll = useCallback(() => {
    setAnnouncements([]);
    announcementQueue.current = [];
    lastAnnouncementRef.current = '';
    
    // Clear all timers
    clearTimers.current.forEach(timer => clearTimeout(timer));
    clearTimers.current.clear();
    debounceTimers.current.forEach(timer => clearTimeout(timer));
    debounceTimers.current.clear();

    // Clear DOM regions
    const politeRegion = document.getElementById('aria-live-polite');
    const assertiveRegion = document.getElementById('aria-live-assertive');
    if (politeRegion) politeRegion.textContent = '';
    if (assertiveRegion) assertiveRegion.textContent = '';
  }, []);

  /**
   * Pause announcements
   */
  const pause = useCallback(() => {
    setIsPaused(true);
    announce('Announcements paused', { 
      priority: 'polite', 
      category: 'status' 
    });
  }, [announce]);

  /**
   * Resume announcements
   */
  const resume = useCallback(() => {
    setIsPaused(false);
    announce('Announcements resumed', { 
      priority: 'polite', 
      category: 'status' 
    });
  }, [announce]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<UseAriaLiveConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Get active (non-cleared) announcements
  const activeAnnouncements = announcements.filter(a => !a.cleared);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  return {
    announce,
    clear,
    clearAll,
    history: announcements,
    activeAnnouncements,
    isAnnouncing,
    pause,
    resume,
    updateConfig
  };
}

/**
 * Pre-configured hooks for specific use cases
 */

// Crisis-specific announcements
export function useCrisisAnnouncements() {
  return useAriaLive({
    allowedCategories: ['crisis', 'alert', 'error'],
    enableSounds: true,
    enableVibration: true,
    defaultClearAfter: 10000 // Crisis announcements stay longer
  });
}

// Form validation announcements
export function useFormAnnouncements() {
  return useAriaLive({
    allowedCategories: ['form', 'error', 'success', 'warning'],
    defaultClearAfter: 7000
  });
}

// Chat message announcements
export function useChatAnnouncements() {
  return useAriaLive({
    allowedCategories: ['chat', 'info', 'status'],
    defaultClearAfter: 3000,
    maxHistory: 100
  });
}

// Navigation announcements
export function useNavigationAnnouncements() {
  return useAriaLive({
    allowedCategories: ['navigation', 'status'],
    defaultClearAfter: 2000
  });
}

// Mood tracking announcements
export function useMoodAnnouncements() {
  return useAriaLive({
    allowedCategories: ['mood', 'success', 'info'],
    defaultClearAfter: 5000,
    enableSounds: false // Quieter for mood tracking
  });
}

export default useAriaLive;