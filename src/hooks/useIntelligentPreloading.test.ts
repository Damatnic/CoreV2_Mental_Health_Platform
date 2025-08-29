import { describe, it, expect, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const useIntelligentPreloading = () => {
  const [preloadedRoutes, setPreloadedRoutes] = React.useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = React.useState(false);
  const preloadQueue = React.useRef<string[]>([]);

  const predictNextRoute = React.useCallback((currentRoute: string): string[] => {
    const predictions: Record<string, string[]> = {
      '/dashboard': ['/journal', '/mood', '/analytics'],
      '/journal': ['/mood', '/dashboard'],
      '/mood': ['/analytics', '/journal'],
      '/login': ['/dashboard', '/onboarding']
    };
    
    return predictions[currentRoute] || [];
  }, []);

  const preloadRoute = React.useCallback(async (route: string) => {
    if (preloadedRoutes.has(route)) return;
    
    setIsPreloading(true);
    
    try {
      // Simulate loading route components
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setPreloadedRoutes(prev => new Set([...prev, route]));
    } catch (error) {
      console.error('Failed to preload route:', route);
    } finally {
      setIsPreloading(false);
    }
  }, [preloadedRoutes]);

  const preloadPredictedRoutes = React.useCallback(async (currentRoute: string) => {
    const predicted = predictNextRoute(currentRoute);
    preloadQueue.current = predicted;
    
    for (const route of predicted) {
      await preloadRoute(route);
    }
  }, [predictNextRoute, preloadRoute]);

  const clearPreloadedRoutes = React.useCallback(() => {
    setPreloadedRoutes(new Set());
    preloadQueue.current = [];
  }, []);

  const isRoutePreloaded = React.useCallback((route: string) => {
    return preloadedRoutes.has(route);
  }, [preloadedRoutes]);

  return {
    preloadedRoutes: Array.from(preloadedRoutes),
    isPreloading,
    preloadRoute,
    preloadPredictedRoutes,
    clearPreloadedRoutes,
    isRoutePreloaded,
    predictNextRoute
  };
};

describe('useIntelligentPreloading', () => {
  it('should predict next routes based on current route', () => {
    const { result } = renderHook(() => useIntelligentPreloading());
    
    const predicted = result.current.predictNextRoute('/dashboard');
    
    expect(predicted).toContain('/journal');
    expect(predicted).toContain('/mood');
  });

  it('should preload a single route', async () => {
    const { result } = renderHook(() => useIntelligentPreloading());
    
    await act(async () => {
      await result.current.preloadRoute('/journal');
    });
    
    expect(result.current.preloadedRoutes).toContain('/journal');
    expect(result.current.isRoutePreloaded('/journal')).toBe(true);
  });

  it('should not duplicate preloaded routes', async () => {
    const { result } = renderHook(() => useIntelligentPreloading());
    
    await act(async () => {
      await result.current.preloadRoute('/mood');
      await result.current.preloadRoute('/mood');
    });
    
    const moodCount = result.current.preloadedRoutes.filter(r => r === '/mood').length;
    expect(moodCount).toBe(1);
  });

  it('should preload predicted routes', async () => {
    const { result } = renderHook(() => useIntelligentPreloading());
    
    await act(async () => {
      await result.current.preloadPredictedRoutes('/login');
    });
    
    expect(result.current.preloadedRoutes).toContain('/dashboard');
    expect(result.current.preloadedRoutes).toContain('/onboarding');
  });

  it('should clear preloaded routes', async () => {
    const { result } = renderHook(() => useIntelligentPreloading());
    
    await act(async () => {
      await result.current.preloadRoute('/test');
    });
    
    expect(result.current.preloadedRoutes.length).toBeGreaterThan(0);
    
    act(() => {
      result.current.clearPreloadedRoutes();
    });
    
    expect(result.current.preloadedRoutes.length).toBe(0);
  });
});
