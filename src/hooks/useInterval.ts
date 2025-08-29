/**
 * useInterval Hook
 * 
 * Custom hook for setting up intervals in React components
 */

import { useEffect, useRef } from 'react';

type Callback = () => void;

/**
 * Custom hook that provides a declarative way to use setInterval
 * @param callback - Function to call at each interval
 * @param delay - Delay between intervals in milliseconds. Pass null to pause.
 */
export function useInterval(callback: Callback, delay: number | null) {
  const savedCallback = useRef<Callback>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    if (delay !== null && delay >= 0) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**
 * Hook for dynamic interval with start/stop controls
 */
export function useDynamicInterval() {
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = (callback: Callback, delay: number) => {
    stop(); // Clear any existing interval
    intervalRef.current = setInterval(callback, delay);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const restart = (callback: Callback, delay: number) => {
    stop();
    start(callback, delay);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, []);

  return { start, stop, restart };
}

/**
 * Hook for countdown timer
 */
export function useCountdown(initialTime: number, onComplete?: () => void) {
  const [timeLeft, setTimeLeft] = React.useState(initialTime);
  const [isActive, setIsActive] = React.useState(false);

  useInterval(
    () => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    },
    isActive ? 1000 : null
  );

  const start = () => setIsActive(true);
  const pause = () => setIsActive(false);
  const reset = () => {
    setTimeLeft(initialTime);
    setIsActive(false);
  };
  const restart = () => {
    setTimeLeft(initialTime);
    setIsActive(true);
  };

  return { timeLeft, isActive, start, pause, reset, restart };
}

// Import React for useCountdown
import React from 'react';

export default useInterval;



