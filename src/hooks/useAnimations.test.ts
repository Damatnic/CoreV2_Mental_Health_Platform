import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

const useAnimations = (reduceMotion: boolean = false) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [animationClass, setAnimationClass] = React.useState('');

  const animate = React.useCallback((className: string, duration: number = 300) => {
    if (reduceMotion) {
      return Promise.resolve();
    }

    setIsAnimating(true);
    setAnimationClass(className);

    return new Promise(resolve => {
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationClass('');
        resolve(undefined);
      }, duration);
    });
  }, [reduceMotion]);

  const fadeIn = React.useCallback(() => animate('fade-in', 300), [animate]);
  const fadeOut = React.useCallback(() => animate('fade-out', 300), [animate]);
  const slideIn = React.useCallback(() => animate('slide-in', 400), [animate]);
  const slideOut = React.useCallback(() => animate('slide-out', 400), [animate]);

  return {
    isAnimating,
    animationClass,
    animate,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut
  };
};

describe('useAnimations', () => {
  it('should start with no animation', () => {
    const { result } = renderHook(() => useAnimations());
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.animationClass).toBe('');
  });

  it('should set animation state during animation', async () => {
    const { result } = renderHook(() => useAnimations());
    
    act(() => {
      result.current.animate('test-animation', 100);
    });
    
    expect(result.current.isAnimating).toBe(true);
    expect(result.current.animationClass).toBe('test-animation');
  });

  it('should respect reduce motion preference', async () => {
    const { result } = renderHook(() => useAnimations(true));
    
    await act(async () => {
      await result.current.fadeIn();
    });
    
    expect(result.current.isAnimating).toBe(false);
  });

  it('should provide fade animations', () => {
    const { result } = renderHook(() => useAnimations());
    
    act(() => {
      result.current.fadeIn();
    });
    expect(result.current.animationClass).toBe('fade-in');
    
    act(() => {
      result.current.fadeOut();
    });
    expect(result.current.animationClass).toBe('fade-out');
  });

  it('should provide slide animations', () => {
    const { result } = renderHook(() => useAnimations());
    
    act(() => {
      result.current.slideIn();
    });
    expect(result.current.animationClass).toBe('slide-in');
    
    act(() => {
      result.current.slideOut();
    });
    expect(result.current.animationClass).toBe('slide-out');
  });
});
