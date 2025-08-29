import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

interface ErrorRecord {
  message: string;
  stack?: string;
  timestamp: number;
  context?: any;
}

const useErrorTracking = () => {
  const [errors, setErrors] = React.useState<ErrorRecord[]>([]);
  const [errorCount, setErrorCount] = React.useState(0);

  const trackError = React.useCallback((error: Error, context?: any) => {
    const errorRecord: ErrorRecord = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      context
    };
    
    setErrors(prev => [...prev, errorRecord]);
    setErrorCount(prev => prev + 1);
    
    // Send to monitoring service
    console.error('Error tracked:', errorRecord);
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
    setErrorCount(0);
  }, []);

  const getRecentErrors = React.useCallback((count: number = 10) => {
    return errors.slice(-count);
  }, [errors]);

  return {
    errors,
    errorCount,
    trackError,
    clearErrors,
    getRecentErrors
  };
};

describe('useErrorTracking', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should track errors', () => {
    const { result } = renderHook(() => useErrorTracking());
    
    act(() => {
      result.current.trackError(new Error('Test error'));
    });
    
    expect(result.current.errorCount).toBe(1);
    expect(result.current.errors[0].message).toBe('Test error');
  });

  it('should track multiple errors', () => {
    const { result } = renderHook(() => useErrorTracking());
    
    act(() => {
      result.current.trackError(new Error('Error 1'));
      result.current.trackError(new Error('Error 2'));
      result.current.trackError(new Error('Error 3'));
    });
    
    expect(result.current.errorCount).toBe(3);
    expect(result.current.errors).toHaveLength(3);
  });

  it('should include error context', () => {
    const { result } = renderHook(() => useErrorTracking());
    const context = { userId: '123', action: 'submit' };
    
    act(() => {
      result.current.trackError(new Error('Context error'), context);
    });
    
    expect(result.current.errors[0].context).toEqual(context);
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useErrorTracking());
    
    act(() => {
      result.current.trackError(new Error('Error to clear'));
    });
    
    expect(result.current.errorCount).toBe(1);
    
    act(() => {
      result.current.clearErrors();
    });
    
    expect(result.current.errorCount).toBe(0);
    expect(result.current.errors).toHaveLength(0);
  });

  it('should get recent errors', () => {
    const { result } = renderHook(() => useErrorTracking());
    
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.trackError(new Error(`Error ${i}`));
      }
    });
    
    const recent = result.current.getRecentErrors(5);
    
    expect(recent).toHaveLength(5);
    expect(recent[0].message).toBe('Error 10');
    expect(recent[4].message).toBe('Error 14');
  });

  it('should log errors to console', () => {
    const { result } = renderHook(() => useErrorTracking());
    
    act(() => {
      result.current.trackError(new Error('Console test'));
    });
    
    expect(consoleSpy).toHaveBeenCalled();
  });
});
