/**
 * Timer Setup for Tests
 *
 * Configures fake timers and promise handling for tests in the mental health platform.
 * Provides utilities for testing time-dependent functionality like debouncing,
 * throttling, animations, and async operations.
 * 
 * @fileoverview Timer utilities and fake timer setup for testing
 * @version 2.0.0
 */

/**
 * Timer helper functions interface
 */
export interface TimerHelpers {
  advanceAndFlush: (ms: number) => Promise<void>;
  runAllAndFlush: () => Promise<void>;
  flushPromises: () => Promise<void>;
  tickAsync: (ms?: number) => Promise<void>;
}

/**
 * Debounce test helper interface
 */
export interface DebounceTestHelpers extends TimerHelpers {
  testDebounce: (fn: Function, delay: number, calls: number[]) => Promise<jest.Mock>;
  testThrottle: (fn: Function, delay: number, calls: number[]) => Promise<jest.Mock>;
}

/**
 * Timer tracking interface for advanced testing
 */
export interface TimerTracker {
  timeouts: Array<{ id: number; callback: Function; delay: number; timestamp: number }>;
  intervals: Array<{ id: number; callback: Function; delay: number; timestamp: number }>;
  mockSetTimeout: jest.MockedFunction<typeof setTimeout>;
  mockClearTimeout: jest.MockedFunction<typeof clearTimeout>;
  mockSetInterval: jest.MockedFunction<typeof setInterval>;
  mockClearInterval: jest.MockedFunction<typeof clearInterval>;
  executeTimeouts: (upToTime?: number) => void;
  executeIntervals: (count?: number) => void;
  reset: () => void;
}

/**
 * Setup fake timers with proper promise handling
 */
export const setupFakeTimers = (): TimerHelpers => {
  jest.useFakeTimers();

  // Flush all pending promises
  const flushPromises = async (): Promise<void> => {
    await new Promise(process.nextTick);
    await new Promise(resolve => setImmediate(resolve));
  };

  // Advance timers and flush promises
  const advanceAndFlush = async (ms: number): Promise<void> => {
    jest.advanceTimersByTime(ms);
    await flushPromises();
  };

  // Run all timers and flush promises
  const runAllAndFlush = async (): Promise<void> => {
    jest.runAllTimers();
    await flushPromises();
  };

  // Tick with optional time and flush
  const tickAsync = async (ms: number = 0): Promise<void> => {
    if (ms > 0) {
      jest.advanceTimersByTime(ms);
    }
    await flushPromises();
  };

  return {
    advanceAndFlush,
    runAllAndFlush,
    flushPromises,
    tickAsync
  };
};

/**
 * Setup debounce/throttle test helpers
 */
export const setupDebounceTest = (): DebounceTestHelpers => {
  const timers = setupFakeTimers();

  const testDebounce = async (fn: Function, delay: number, calls: number[]): Promise<jest.Mock> => {
    const spy = jest.fn(fn as (this: any, ...args: any[]) => unknown);

    // Make calls at specified times
    for (const callTime of calls) {
      await timers.advanceAndFlush(callTime);
      spy();
    }

    // Advance past the debounce delay
    await timers.advanceAndFlush(delay + 100);

    return spy;
  };

  const testThrottle = async (fn: Function, delay: number, calls: number[]): Promise<jest.Mock> => {
    const spy = jest.fn(fn as (this: any, ...args: any[]) => unknown);

    // Make calls at specified times
    for (const callTime of calls) {
      await timers.advanceAndFlush(callTime);
      spy();
    }

    // Advance to ensure all throttled calls complete
    await timers.advanceAndFlush(delay + 100);

    return spy;
  };

  return {
    ...timers,
    testDebounce,
    testThrottle
  };
};

/**
 * Clean up timers after test
 */
export const cleanupTimers = (): void => {
  jest.clearAllTimers();
  jest.useRealTimers();
};

/**
 * Mock setTimeout and setInterval with tracking
 */
export const mockTimersWithTracking = (): TimerTracker => {
  let timeouts: Array<{ id: number; callback: Function; delay: number; timestamp: number }> = [];
  let intervals: Array<{ id: number; callback: Function; delay: number; timestamp: number }> = [];
  let nextId = 1;

  const mockSetTimeout = jest.fn((callback: (...args: any[]) => void, delay: number = 0) => {
    const id = nextId++;
    timeouts.push({ id, callback, delay, timestamp: Date.now() });
    return id;
  }) as unknown as jest.MockedFunction<typeof setTimeout>;

  const mockClearTimeout = jest.fn((id: string | number | ReturnType<typeof setTimeout> | undefined) => {
    const numId = typeof id === 'number' ? id : parseInt(String(id));
    const index = timeouts.findIndex(t => t.id === numId);
    if (index !== -1) {
      timeouts.splice(index, 1);
    }
  }) as jest.MockedFunction<typeof clearTimeout>;

  const mockSetInterval = jest.fn((callback: (...args: any[]) => void, delay: number = 0) => {
    const id = nextId++;
    intervals.push({ id, callback, delay, timestamp: Date.now() });
    return id;
  }) as unknown as jest.MockedFunction<typeof setInterval>;

  const mockClearInterval = jest.fn((id: string | number | ReturnType<typeof setInterval> | undefined) => {
    const numId = typeof id === 'number' ? id : parseInt(String(id));
    const index = intervals.findIndex(i => i.id === numId);
    if (index !== -1) {
      intervals.splice(index, 1);
    }
  }) as jest.MockedFunction<typeof clearInterval>;

  // Store original functions for restoration
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;

  // Replace global timer functions
  global.setTimeout = mockSetTimeout as any;
  global.clearTimeout = mockClearTimeout as any;
  global.setInterval = mockSetInterval as any;
  global.clearInterval = mockClearInterval as any;

  const executeTimeouts = (upToTime?: number) => {
    const now = upToTime || Date.now();
    const toExecute = timeouts.filter(t => t.timestamp + t.delay <= now);
    
    toExecute.forEach(t => {
      t.callback();
      const index = timeouts.indexOf(t);
      if (index !== -1) {
        timeouts.splice(index, 1);
      }
    });
  };

  const executeIntervals = (count: number = 1) => {
    intervals.forEach(i => {
      for (let n = 0; n < count; n++) {
        i.callback();
      }
    });
  };

  const reset = () => {
    timeouts.length = 0;
    intervals.length = 0;
    nextId = 1;
    // Restore original functions
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  };

  return {
    mockSetTimeout,
    mockClearTimeout,
    mockSetInterval,
    mockClearInterval,
    timeouts,
    intervals,
    executeTimeouts,
    executeIntervals,
    reset
  };
};

/**
 * Animation frame testing helpers
 */
export const setupAnimationFrameTest = () => {
  let rafCallbacks: Array<{ id: number; callback: FrameRequestCallback }> = [];
  let rafId = 0;

  const mockRequestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
    const id = ++rafId;
    rafCallbacks.push({ id, callback });
    return id;
  });

  const mockCancelAnimationFrame = jest.fn((id: number) => {
    const index = rafCallbacks.findIndex(c => c.id === id);
    if (index !== -1) {
      rafCallbacks.splice(index, 1);
    }
  });

  const flushAnimationFrames = (timestamp: number = Date.now()) => {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(({ callback }) => {
      try {
        callback(timestamp);
      } catch (error) {
        // Ignore callback errors in tests
      }
    });
  };

  global.requestAnimationFrame = mockRequestAnimationFrame;
  global.cancelAnimationFrame = mockCancelAnimationFrame;

  return {
    mockRequestAnimationFrame,
    mockCancelAnimationFrame,
    flushAnimationFrames,
    rafCallbacks
  };
};

/**
 * Date and time mocking utilities
 */
export const setupDateMock = (fixedTime?: number) => {
  const mockTime = fixedTime || Date.now();
  const originalDate = Date;

  const MockDate = class extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(mockTime);
      } else {
        super(...(args as []));
      }
    }

    static now() {
      return mockTime;
    }
  } as any;

  // Copy static methods
  Object.setPrototypeOf(MockDate, originalDate);
  Object.defineProperty(MockDate, 'prototype', {
    value: originalDate.prototype,
    writable: false
  });

  global.Date = MockDate;

  return {
    mockTime,
    restore: () => {
      global.Date = originalDate;
    }
  };
};

/**
 * Performance timing mock for testing
 */
export const setupPerformanceTimingMock = () => {
  const mockPerformance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  };

  const originalPerformance = global.performance;
  global.performance = mockPerformance as any;

  return {
    mockPerformance,
    restore: () => {
      global.performance = originalPerformance;
    }
  };
};

/**
 * Complete timer test setup with all utilities
 */
export const setupCompleteTimerTest = () => {
  const fakeTimers = setupFakeTimers();
  const trackedTimers = mockTimersWithTracking();
  const animationFrames = setupAnimationFrameTest();
  const dateMock = setupDateMock();
  const performanceMock = setupPerformanceTimingMock();

  return {
    ...fakeTimers,
    ...trackedTimers,
    ...animationFrames,
    ...dateMock,
    ...performanceMock,
    cleanup: () => {
      cleanupTimers();
      dateMock.restore();
      performanceMock.restore();
    }
  };
};

export default {
  setupFakeTimers,
  setupDebounceTest,
  cleanupTimers,
  mockTimersWithTracking,
  setupAnimationFrameTest,
  setupDateMock,
  setupPerformanceTimingMock,
  setupCompleteTimerTest
};
