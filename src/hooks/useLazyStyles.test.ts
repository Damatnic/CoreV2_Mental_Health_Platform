import { describe, it, expect, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const useLazyStyles = (styles: string | (() => string), dependencies: any[] = []) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const styleRef = React.useRef<HTMLStyleElement | null>(null);

  React.useEffect(() => {
    loadStyles();
    
    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, dependencies);

  const loadStyles = React.useCallback(async () => {
    try {
      // Get styles
      const cssContent = typeof styles === 'function' ? styles() : styles;
      
      // Create style element
      const styleElement = document.createElement('style');
      styleElement.setAttribute('data-lazy-styles', 'true');
      styleElement.textContent = cssContent;
      
      // Add to document
      document.head.appendChild(styleElement);
      styleRef.current = styleElement;
      
      setIsLoaded(true);
      setError(null);
    } catch (err: any) {
      setError(err);
      setIsLoaded(false);
    }
  }, [styles]);

  const unloadStyles = React.useCallback(() => {
    if (styleRef.current) {
      document.head.removeChild(styleRef.current);
      styleRef.current = null;
      setIsLoaded(false);
    }
  }, []);

  const reloadStyles = React.useCallback(async () => {
    unloadStyles();
    await loadStyles();
  }, [unloadStyles, loadStyles]);

  return {
    isLoaded,
    error,
    unloadStyles,
    reloadStyles
  };
};

describe('useLazyStyles', () => {
  afterEach(() => {
    // Clean up any styles
    document.querySelectorAll('[data-lazy-styles]').forEach(el => el.remove());
  });

  it('should load styles on mount', () => {
    const css = '.test { color: red; }';
    const { result } = renderHook(() => useLazyStyles(css));
    
    expect(result.current.isLoaded).toBe(true);
    expect(document.querySelector('[data-lazy-styles]')).toBeTruthy();
  });

  it('should load styles from function', () => {
    const cssFunc = () => '.dynamic { color: blue; }';
    const { result } = renderHook(() => useLazyStyles(cssFunc));
    
    expect(result.current.isLoaded).toBe(true);
    const styleElement = document.querySelector('[data-lazy-styles]');
    expect(styleElement?.textContent).toContain('color: blue');
  });

  it('should unload styles', () => {
    const css = '.test { color: red; }';
    const { result } = renderHook(() => useLazyStyles(css));
    
    expect(document.querySelector('[data-lazy-styles]')).toBeTruthy();
    
    act(() => {
      result.current.unloadStyles();
    });
    
    expect(document.querySelector('[data-lazy-styles]')).toBeNull();
    expect(result.current.isLoaded).toBe(false);
  });

  it('should reload styles', async () => {
    const css = '.test { color: red; }';
    const { result } = renderHook(() => useLazyStyles(css));
    
    const firstElement = document.querySelector('[data-lazy-styles]');
    
    await act(async () => {
      await result.current.reloadStyles();
    });
    
    const newElement = document.querySelector('[data-lazy-styles]');
    expect(newElement).toBeTruthy();
    expect(newElement).not.toBe(firstElement);
  });

  it('should update styles when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ color }) => useLazyStyles(`.test { color: ${color}; }`, [color]),
      { initialProps: { color: 'red' } }
    );
    
    let styleElement = document.querySelector('[data-lazy-styles]');
    expect(styleElement?.textContent).toContain('color: red');
    
    rerender({ color: 'blue' });
    
    styleElement = document.querySelector('[data-lazy-styles]');
    expect(styleElement?.textContent).toContain('color: blue');
  });

  it('should handle errors', () => {
    const errorFunc = () => {
      throw new Error('Style error');
    };
    
    const { result } = renderHook(() => useLazyStyles(errorFunc));
    
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error?.message).toBe('Style error');
  });

  it('should clean up on unmount', () => {
    const css = '.test { color: red; }';
    const { unmount } = renderHook(() => useLazyStyles(css));
    
    expect(document.querySelector('[data-lazy-styles]')).toBeTruthy();
    
    unmount();
    
    expect(document.querySelector('[data-lazy-styles]')).toBeNull();
  });

  it('should handle multiple instances', () => {
    const { result: result1 } = renderHook(() => 
      useLazyStyles('.test1 { color: red; }')
    );
    const { result: result2 } = renderHook(() => 
      useLazyStyles('.test2 { color: blue; }')
    );
    
    expect(result1.current.isLoaded).toBe(true);
    expect(result2.current.isLoaded).toBe(true);
    
    const styles = document.querySelectorAll('[data-lazy-styles]');
    expect(styles.length).toBe(2);
  });
});
