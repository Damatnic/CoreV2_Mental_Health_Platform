/**
 * Lazy Styles Hook
 * 
 * Provides lazy loading and dynamic management of CSS styles
 * for performance optimization
 */

import * as React from 'react';
const { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } = React;

interface StyleConfig {
  id: string;
  href?: string;
  content?: string;
  media?: string;
  priority?: 'low' | 'medium' | 'high';
  condition?: () => boolean;
  dependencies?: string[];
}

interface LazyStylesContextValue {
  loadedStyles: Set<string>;
  loadingStyles: Set<string>;
  loadStyle: (config: StyleConfig) => Promise<void>;
  unloadStyle: (id: string) => void;
  isStyleLoaded: (id: string) => boolean;
  isStyleLoading: (id: string) => boolean;
}

// Create context for sharing lazy styles state
const LazyStylesContext = createContext<LazyStylesContextValue | null>(null);

// Hook to use lazy styles context
export function useLazyStylesContext(): LazyStylesContextValue {
  const context = useContext(LazyStylesContext);
  if (!context) {
    throw new Error('useLazyStylesContext must be used within a LazyStylesProvider');
  }
  return context;
}

// Provider component for lazy styles context
export function LazyStylesProvider({ children }: { children: React.ReactNode }) {
  const [loadedStyles, setLoadedStyles] = useState<Set<string>>(new Set());
  const [loadingStyles, setLoadingStyles] = useState<Set<string>>(new Set());
  const styleElementsRef = useRef<Map<string, HTMLStyleElement | HTMLLinkElement>>(new Map());

  // Load a style configuration
  const loadStyle = useCallback(async (config: StyleConfig): Promise<void> => {
    const { id, href, content, media, condition, dependencies } = config;

    // Check if already loaded or loading
    if (loadedStyles.has(id) || loadingStyles.has(id)) {
      return;
    }

    // Check condition if provided
    if (condition && !condition()) {
      return;
    }

    // Load dependencies first
    if (dependencies && dependencies.length > 0) {
      const dependencyPromises = dependencies.map(depId => {
        const depStyle = Array.from(loadedStyles).find(styleId => styleId === depId);
        if (!depStyle) {
          console.warn(`Dependency ${depId} not found for style ${id}`);
        }
        return Promise.resolve();
      });
      await Promise.all(dependencyPromises);
    }

    // Mark as loading
    setLoadingStyles(prev => new Set(Array.from(prev).concat(id)));

    try {
      let element: HTMLStyleElement | HTMLLinkElement;

      if (href) {
        // Create link element for external stylesheet
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = href;
        element = linkElement;
        if (media) element.media = media;

        // Wait for load
        await new Promise<void>((resolve, reject) => {
          element.onload = () => resolve();
          element.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
          document.head.appendChild(element);
        });
      } else if (content) {
        // Create style element for inline CSS
        element = document.createElement('style');
        element.textContent = content;
        if (media) element.media = media;
        document.head.appendChild(element);
      } else {
        throw new Error('Either href or content must be provided');
      }

      // Store reference and mark as loaded
      styleElementsRef.current.set(id, element);
      setLoadedStyles(prev => new Set(Array.from(prev).concat(id)));
      
    } catch (error) {
      console.error(`Failed to load style ${id}:`, error);
    } finally {
      // Remove from loading
      setLoadingStyles(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [loadedStyles, loadingStyles]);

  // Unload a style
  const unloadStyle = useCallback((id: string) => {
    const element = styleElementsRef.current.get(id);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      styleElementsRef.current.delete(id);
      setLoadedStyles(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, []);

  // Check if style is loaded
  const isStyleLoaded = useCallback((id: string) => loadedStyles.has(id), [loadedStyles]);

  // Check if style is loading
  const isStyleLoading = useCallback((id: string) => loadingStyles.has(id), [loadingStyles]);

  // Context value
  const contextValue = useMemo<LazyStylesContextValue>(() => ({
    loadedStyles,
    loadingStyles,
    loadStyle,
    unloadStyle,
    isStyleLoaded,
    isStyleLoading,
  }), [loadedStyles, loadingStyles, loadStyle, unloadStyle, isStyleLoaded, isStyleLoading]);

  return React.createElement(
    LazyStylesContext.Provider,
    { value: contextValue },
    children
  );
}

// Main hook for using lazy styles
export function useLazyStyles() {
  const [localLoadedStyles, setLocalLoadedStyles] = useState<Set<string>>(new Set());
  const [localLoadingStyles, setLocalLoadingStyles] = useState<Set<string>>(new Set());
  const styleElementsRef = useRef<Map<string, HTMLStyleElement | HTMLLinkElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Try to use context, fallback to local state
  const contextValue = useContext(LazyStylesContext);
  
  const loadedStyles = contextValue?.loadedStyles || localLoadedStyles;
  const loadingStyles = contextValue?.loadingStyles || localLoadingStyles;

  // Load style function
  const loadStyle = useCallback(async (config: StyleConfig): Promise<void> => {
    if (contextValue) {
      return contextValue.loadStyle(config);
    }

    // Local implementation
    const { id, href, content, media, condition } = config;

    if (loadedStyles.has(id) || loadingStyles.has(id)) {
      return;
    }

    if (condition && !condition()) {
      return;
    }

    setLocalLoadingStyles(prev => new Set(Array.from(prev).concat(id)));

    try {
      let element: HTMLStyleElement | HTMLLinkElement;

      if (href) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = href;
        element = linkElement;
        if (media) element.media = media;

        await new Promise<void>((resolve, reject) => {
          element.onload = () => resolve();
          element.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
          document.head.appendChild(element);
        });
      } else if (content) {
        element = document.createElement('style');
        element.textContent = content;
        if (media) element.media = media;
        document.head.appendChild(element);
      } else {
        throw new Error('Either href or content must be provided');
      }

      styleElementsRef.current.set(id, element);
      setLocalLoadedStyles(prev => new Set(Array.from(prev).concat(id)));
      
    } catch (error) {
      console.error(`Failed to load style ${id}:`, error);
    } finally {
      setLocalLoadingStyles(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [contextValue, loadedStyles, loadingStyles]);

  // Unload style function
  const unloadStyle = useCallback((id: string) => {
    if (contextValue) {
      return contextValue.unloadStyle(id);
    }

    const element = styleElementsRef.current.get(id);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      styleElementsRef.current.delete(id);
      setLocalLoadedStyles(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [contextValue]);

  // Load styles based on media query
  const loadStylesOnMediaQuery = useCallback((configs: StyleConfig[], mediaQuery: string) => {
    const matchMedia = window.matchMedia(mediaQuery);
    
    const handleChange = () => {
      if (matchMedia.matches) {
        configs.forEach(config => loadStyle(config));
      } else {
        configs.forEach(config => unloadStyle(config.id));
      }
    };

    handleChange(); // Initial check
    matchMedia.addListener(handleChange);

    return () => matchMedia.removeListener(handleChange);
  }, [loadStyle, unloadStyle]);

  // Load styles on intersection
  const loadStylesOnIntersection = useCallback((
    configs: StyleConfig[],
    targetSelector: string,
    options?: IntersectionObserverInit
  ) => {
    const targets = document.querySelectorAll(targetSelector);
    
    if (targets.length === 0) {
      return () => {}; // No cleanup needed
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          configs.forEach(config => loadStyle(config));
        }
      });
    }, options);

    targets.forEach(target => observer.observe(target));
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [loadStyle]);

  // Load styles with delay
  const loadStylesWithDelay = useCallback((configs: StyleConfig[], delay: number = 0) => {
    const timeoutId = setTimeout(() => {
      configs.forEach(config => loadStyle(config));
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [loadStyle]);

  // Preload critical styles
  const preloadCriticalStyles = useCallback((configs: StyleConfig[]) => {
    const criticalConfigs = configs.filter(config => config.priority === 'high');
    const promises = criticalConfigs.map(config => loadStyle(config));
    return Promise.allSettled(promises);
  }, [loadStyle]);

  // Check functions
  const isStyleLoaded = useCallback((id: string) => {
    return contextValue ? contextValue.isStyleLoaded(id) : loadedStyles.has(id);
  }, [contextValue, loadedStyles]);

  const isStyleLoading = useCallback((id: string) => {
    return contextValue ? contextValue.isStyleLoading(id) : loadingStyles.has(id);
  }, [contextValue, loadingStyles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Clean up locally managed styles
      if (!contextValue) {
        styleElementsRef.current.forEach((element) => {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
        styleElementsRef.current.clear();
      }
    };
  }, [contextValue]);

  return {
    loadStyle,
    unloadStyle,
    loadStylesOnMediaQuery,
    loadStylesOnIntersection,
    loadStylesWithDelay,
    preloadCriticalStyles,
    isStyleLoaded,
    isStyleLoading,
    loadedStyles: Array.from(loadedStyles),
    loadingStyles: Array.from(loadingStyles)
  };
}

export default useLazyStyles;
