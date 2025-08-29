import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState({
    fps: 60,
    memory: 0,
    loadTime: 0,
    renderCount: 0
  });
  
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setTimeout>>();

  const startMonitoring = React.useCallback(() => {
    setIsMonitoring(true);
    intervalRef.current = setInterval(() => {
      setMetrics(prev => ({
        fps: Math.floor(Math.random() * 30) + 30,
        memory: Math.random() * 100,
        loadTime: Math.random() * 3000,
        renderCount: prev.renderCount + 1
      }));
    }, 1000);
  }, []);

  const stopMonitoring = React.useCallback(() => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resetMetrics = React.useCallback(() => {
    setMetrics({ fps: 60, memory: 0, loadTime: 0, renderCount: 0 });
  }, []);

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { metrics, isMonitoring, startMonitoring, stopMonitoring, resetMetrics };
};

describe('usePerformanceMonitor', () => {
  it('should initialize with default metrics', () => {
    const { result } = renderHook(() => usePerformanceMonitor());
    expect(result.current.metrics.fps).toBe(60);
    expect(result.current.metrics.renderCount).toBe(0);
  });

  it('should start and stop monitoring', () => {
    const { result } = renderHook(() => usePerformanceMonitor());
    
    act(() => {
      result.current.startMonitoring();
    });
    expect(result.current.isMonitoring).toBe(true);
    
    act(() => {
      result.current.stopMonitoring();
    });
    expect(result.current.isMonitoring).toBe(false);
  });

  it('should reset metrics', () => {
    const { result } = renderHook(() => usePerformanceMonitor());
    
    act(() => {
      result.current.startMonitoring();
    });
    
    act(() => {
      result.current.resetMetrics();
    });
    
    expect(result.current.metrics.renderCount).toBe(0);
  });
});
