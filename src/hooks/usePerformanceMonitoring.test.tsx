import { describe, it, expect, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = React.useState({ fps: 60, memory: 0, loadTime: 0 });
  const [isMonitoring, setIsMonitoring] = React.useState(false);

  const startMonitoring = React.useCallback(() => {
    setIsMonitoring(true);
    const interval = setInterval(() => {
      setMetrics({
        fps: Math.floor(Math.random() * 30) + 30,
        memory: Math.random() * 100,
        loadTime: Math.random() * 3000
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const stopMonitoring = React.useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return { metrics, isMonitoring, startMonitoring, stopMonitoring };
};

describe('usePerformanceMonitoring', () => {
  it('should start with default metrics', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());
    expect(result.current.metrics.fps).toBe(60);
    expect(result.current.isMonitoring).toBe(false);
  });

  it('should start monitoring', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());
    act(() => {
      result.current.startMonitoring();
    });
    expect(result.current.isMonitoring).toBe(true);
  });

  it('should stop monitoring', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());
    act(() => {
      result.current.startMonitoring();
    });
    act(() => {
      result.current.stopMonitoring();
    });
    expect(result.current.isMonitoring).toBe(false);
  });
});
