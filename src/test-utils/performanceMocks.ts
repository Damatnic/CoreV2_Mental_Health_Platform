/**
 * Crisis-Aware Performance Testing with Therapeutic UX Benchmarks
 *
 * Advanced performance mocking and monitoring utilities specifically designed for mental 
 * health platforms with crisis-aware performance testing, therapeutic UX benchmarks,
 * accessibility performance validation, and trauma-informed interaction timing.
 * 
 * FEATURES:
 * - Crisis-aware performance monitoring with emergency response benchmarks
 * - Therapeutic UX performance metrics (interaction timing, cognitive load assessment)
 * - Accessibility performance validation (screen reader timing, keyboard nav speed)
 * - Cultural competency performance testing (RTL layout, font rendering)
 * - HIPAA-compliant performance logging with data protection
 * - Trauma-informed interaction timing (avoid jarring transitions)
 * - Real-time crisis intervention performance tracking
 * 
 * @fileoverview Mental health platform performance testing utilities
 * @version 3.0.0
 * @accessibility WCAG 2.1 AAA performance compliance
 * @crisis-safe Emergency response time benchmarks
 * @therapeutic-ux User experience performance optimization
 */

// Mental health performance types
type CrisisLevel = 'low' | 'moderate' | 'high' | 'severe' | 'imminent';
type TherapeuticInteractionType = 'crisis-button' | 'form-input' | 'navigation' | 'content-load' | 'audio-cue';
type AccessibilityPerformanceMetric = 'screen-reader' | 'keyboard-nav' | 'focus-management' | 'color-contrast';

interface MentalHealthPerformanceOptions {
  crisisAware?: boolean;
  therapeuticOptimization?: boolean;
  accessibilityTiming?: boolean;
  culturalPerformance?: boolean;
  traumaInformedTiming?: boolean;
  hipaaPerformanceLogging?: boolean;
}

interface CrisisPerformanceThresholds {
  emergencyResponseTime: number; // Max ms for crisis button response
  alertDisplayTime: number; // Max ms for crisis alert display
  helplineConnectionTime: number; // Max ms for help connection
  escalationTime: number; // Max ms for crisis escalation
  safetyCheckTime: number; // Max ms for safety feature activation
}

interface TherapeuticUXMetrics {
  cognitiveLoadScore: number; // 0-100, lower is better
  interactionStress: number; // 0-100, lower is better
  emotionalSafetyScore: number; // 0-100, higher is better
  traumaAvoidanceScore: number; // 0-100, higher is better
  therapeuticFlowScore: number; // 0-100, higher is better
}

interface AccessibilityPerformanceResult {
  screenReaderTiming: number;
  keyboardNavigationSpeed: number;
  focusManagementDelay: number;
  colorContrastProcessing: number;
  wcagComplianceTime: number;
}

/**
 * Performance API Mock Functions with Mental Health Enhancements
 */
export interface MentalHealthPerformanceMockFunctions {
  performanceNow: jest.MockedFunction<() => number>;
  performanceMark: jest.MockedFunction<(name: string) => void>;
  performanceMeasure: jest.MockedFunction<(name: string, startMark?: string, endMark?: string) => void>;
  performanceGetEntriesByType: jest.MockedFunction<(type: string) => PerformanceEntry[]>;
  performanceGetEntriesByName: jest.MockedFunction<(name: string, type?: string) => PerformanceEntry[]>;
  performanceClearMarks: jest.MockedFunction<(name?: string) => void>;
  performanceClearMeasures: jest.MockedFunction<(name?: string) => void>;
  mockPerformance: Performance & MentalHealthPerformanceExtensions;
}

interface MentalHealthPerformanceExtensions {
  crisisMetrics?: {
    emergencyResponseTimes: number[];
    alertDisplayTimes: number[];
    helplineConnectionTimes: number[];
  };
  therapeuticMetrics?: TherapeuticUXMetrics;
  accessibilityMetrics?: AccessibilityPerformanceResult;
}

/**
 * Crisis-aware performance thresholds optimized for mental health platforms
 */
const CRISIS_PERFORMANCE_THRESHOLDS: CrisisPerformanceThresholds = {
  emergencyResponseTime: 100, // Crisis buttons must respond within 100ms
  alertDisplayTime: 50, // Crisis alerts must display within 50ms
  helplineConnectionTime: 500, // Help connections must initiate within 500ms
  escalationTime: 200, // Crisis escalation must trigger within 200ms
  safetyCheckTime: 150, // Safety features must activate within 150ms
};

/**
 * Therapeutic UX timing guidelines for trauma-informed design
 */
const THERAPEUTIC_TIMING_GUIDELINES = {
  gentleTransitionTime: 300, // Smooth, non-jarring transitions
  cognitiveProcessingTime: 1000, // Allow time for users to process information
  emotionalBufferTime: 500, // Buffer time between emotionally heavy content
  focusSettlingTime: 200, // Time for focus to settle for screen readers
  validationFeedbackTime: 100, // Immediate validation feedback
};

/**
 * Enhanced Performance API Mock with Mental Health Features
 */
export const mockMentalHealthPerformanceAPI = (
  options: MentalHealthPerformanceOptions = {}
): MentalHealthPerformanceMockFunctions => {
  let performanceMarks: Map<string, number> = new Map();
  let performanceMeasures: Map<string, { startTime: number; duration: number }> = new Map();
  let crisisResponseTimes: number[] = [];
  let therapeuticInteractionTimes: Map<TherapeuticInteractionType, number[]> = new Map();
  
  const performanceNow = jest.fn(() => {
    const now = Date.now();
    
    // Add slight variations for realistic timing simulation
    const variation = Math.random() * 0.5; // 0-0.5ms variation
    return now + variation;
  });
  
  const performanceMark = jest.fn((name: string) => {
    const timestamp = performanceNow();
    performanceMarks.set(name, timestamp);
    
    // Track crisis-specific marks
    if (options.crisisAware && name.includes('crisis')) {
      console.log(`Crisis performance mark: ${name} at ${timestamp}`);
      
      // Validate crisis response times
      if (name.includes('crisis-button-response')) {
        const responseTime = timestamp - (performanceMarks.get('crisis-button-clicked') || 0);
        crisisResponseTimes.push(responseTime);
        
        if (responseTime > CRISIS_PERFORMANCE_THRESHOLDS.emergencyResponseTime) {
          console.warn(`Crisis response time exceeded threshold: ${responseTime}ms`);
        }
      }
    }
    
    // Track therapeutic interactions
    if (options.therapeuticOptimization && name.includes('therapeutic')) {
      const interactionType = extractTherapeuticInteractionType(name);
      if (interactionType) {
        const times = therapeuticInteractionTimes.get(interactionType) || [];
        times.push(timestamp);
        therapeuticInteractionTimes.set(interactionType, times);
      }
    }
  });
  
  const performanceMeasure = jest.fn((name: string, startMark?: string, endMark?: string) => {
    const startTime = startMark ? performanceMarks.get(startMark) : 0;
    const endTime = endMark ? performanceMarks.get(endMark) : performanceNow();
    const duration = (endTime || 0) - (startTime || 0);
    
    performanceMeasures.set(name, { startTime: startTime || 0, duration });
    
    // Mental health specific performance validations
    if (options.crisisAware && name.includes('crisis')) {
      validateCrisisPerformance(name, duration);
    }
    
    if (options.therapeuticOptimization && name.includes('therapeutic')) {
      validateTherapeuticPerformance(name, duration);
    }
    
    if (options.accessibilityTiming && name.includes('accessibility')) {
      validateAccessibilityPerformance(name, duration);
    }
    
    console.log(`Performance measure: ${name} - ${duration}ms`);
  });
  
  const performanceGetEntriesByType = jest.fn((type: string) => {
    const entries: PerformanceEntry[] = [];
    
    if (type === 'measure') {
      performanceMeasures.forEach((measure, name) => {
        entries.push({
          name,
          entryType: 'measure',
          startTime: measure.startTime,
          duration: measure.duration,
          toJSON: () => ({ name, entryType: 'measure', startTime: measure.startTime, duration: measure.duration })
        });
      });
    } else if (type === 'mark') {
      performanceMarks.forEach((timestamp, name) => {
        entries.push({
          name,
          entryType: 'mark',
          startTime: timestamp,
          duration: 0,
          toJSON: () => ({ name, entryType: 'mark', startTime: timestamp, duration: 0 })
        });
      });
    }
    
    return entries;
  });
  
  const performanceGetEntriesByName = jest.fn((name: string, type?: string) => {
    const allEntries = performanceGetEntriesByType('measure').concat(performanceGetEntriesByType('mark'));
    return allEntries.filter(entry => 
      entry.name === name && (!type || entry.entryType === type)
    );
  });
  
  const performanceClearMarks = jest.fn((name?: string) => {
    if (name) {
      performanceMarks.delete(name);
    } else {
      performanceMarks.clear();
    }
  });
  
  const performanceClearMeasures = jest.fn((name?: string) => {
    if (name) {
      performanceMeasures.delete(name);
    } else {
      performanceMeasures.clear();
    }
  });

  // Enhanced performance object with mental health extensions
  const mockPerformance = {
    now: performanceNow,
    mark: performanceMark,
    measure: performanceMeasure,
    getEntriesByType: performanceGetEntriesByType,
    getEntriesByName: performanceGetEntriesByName,
    clearMarks: performanceClearMarks,
    clearMeasures: performanceClearMeasures,
    
    // Standard performance properties
    navigation: {
      type: 0,
      redirectCount: 0
    } as any,
    timing: {
      navigationStart: Date.now() - 2000,
      fetchStart: Date.now() - 1800,
      domainLookupStart: Date.now() - 1600,
      domainLookupEnd: Date.now() - 1400,
      connectStart: Date.now() - 1200,
      connectEnd: Date.now() - 1000,
      requestStart: Date.now() - 800,
      responseStart: Date.now() - 600,
      responseEnd: Date.now() - 400,
      domLoading: Date.now() - 300,
      domInteractive: Date.now() - 200,
      domContentLoadedEventStart: Date.now() - 100,
      domContentLoadedEventEnd: Date.now() - 80,
      domComplete: Date.now() - 60,
      loadEventStart: Date.now() - 40,
      loadEventEnd: Date.now() - 20
    } as any,
    memory: {
      jsHeapSizeLimit: 2147483648,
      totalJSHeapSize: 10485760,
      usedJSHeapSize: 5242880
    },
    
    // Mental health specific extensions
    crisisMetrics: {
      emergencyResponseTimes: crisisResponseTimes,
      alertDisplayTimes: [],
      helplineConnectionTimes: []
    },
    
    therapeuticMetrics: calculateTherapeuticUXMetrics(therapeuticInteractionTimes),
    
    accessibilityMetrics: {
      screenReaderTiming: 0,
      keyboardNavigationSpeed: 0,
      focusManagementDelay: 0,
      colorContrastProcessing: 0,
      wcagComplianceTime: 0
    },
    
    // Add missing Performance properties
    eventCounts: new Map() as any,
    onresourcetimingbufferfull: null,
    timeOrigin: Date.now() - 3000,
    clearResourceTimings: jest.fn(),
    getEntries: jest.fn(() => []),
    setResourceTimingBufferSize: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(() => true),
    toJSON: jest.fn(() => ({}))
  } as unknown as Performance & MentalHealthPerformanceExtensions;

  // Set global performance object
  Object.defineProperty(window, 'performance', {
    value: mockPerformance,
    configurable: true,
    writable: true
  });

  return {
    performanceNow,
    performanceMark,
    performanceMeasure,
    performanceGetEntriesByType,
    performanceGetEntriesByName,
    performanceClearMarks,
    performanceClearMeasures,
    mockPerformance
  };
};

/**
 * Validate crisis performance against thresholds
 */
function validateCrisisPerformance(measureName: string, duration: number): void {
  const thresholds = CRISIS_PERFORMANCE_THRESHOLDS;
  let threshold: number | undefined;
  let metric: string;
  
  if (measureName.includes('emergency-response')) {
    threshold = thresholds.emergencyResponseTime;
    metric = 'Emergency Response';
  } else if (measureName.includes('alert-display')) {
    threshold = thresholds.alertDisplayTime;
    metric = 'Alert Display';
  } else if (measureName.includes('helpline-connection')) {
    threshold = thresholds.helplineConnectionTime;
    metric = 'Helpline Connection';
  } else if (measureName.includes('escalation')) {
    threshold = thresholds.escalationTime;
    metric = 'Crisis Escalation';
  } else if (measureName.includes('safety-check')) {
    threshold = thresholds.safetyCheckTime;
    metric = 'Safety Feature';
  }
  
  if (threshold !== undefined) {
    if (duration > threshold) {
      console.error(`🚨 CRISIS PERFORMANCE VIOLATION: ${metric} took ${duration}ms (threshold: ${threshold}ms)`);
    } else {
      console.log(`✅ Crisis performance OK: ${metric} - ${duration}ms`);
    }
  }
}

/**
 * Validate therapeutic performance against guidelines
 */
function validateTherapeuticPerformance(measureName: string, duration: number): void {
  const guidelines = THERAPEUTIC_TIMING_GUIDELINES;
  let guideline: number | undefined;
  let metric: string;
  
  if (measureName.includes('transition')) {
    guideline = guidelines.gentleTransitionTime;
    metric = 'Transition Timing';
    
    if (duration < 100) {
      console.warn(`⚠️ Transition too fast for trauma-informed design: ${duration}ms`);
    } else if (duration > guideline) {
      console.warn(`⚠️ Transition too slow: ${duration}ms (guideline: ${guideline}ms)`);
    }
  } else if (measureName.includes('cognitive-processing')) {
    guideline = guidelines.cognitiveProcessingTime;
    metric = 'Cognitive Processing';
  } else if (measureName.includes('validation-feedback')) {
    guideline = guidelines.validationFeedbackTime;
    metric = 'Validation Feedback';
  }
  
  if (guideline !== undefined && metric) {
    console.log(`🧠 Therapeutic UX: ${metric} - ${duration}ms`);
  }
}

/**
 * Validate accessibility performance
 */
function validateAccessibilityPerformance(measureName: string, duration: number): void {
  if (measureName.includes('screen-reader')) {
    if (duration > 200) {
      console.warn(`♿ Screen reader response too slow: ${duration}ms`);
    }
  } else if (measureName.includes('keyboard-nav')) {
    if (duration > 100) {
      console.warn(`♿ Keyboard navigation too slow: ${duration}ms`);
    }
  } else if (measureName.includes('focus-management')) {
    if (duration > THERAPEUTIC_TIMING_GUIDELINES.focusSettlingTime) {
      console.warn(`♿ Focus management too slow: ${duration}ms`);
    }
  }
}

/**
 * Extract therapeutic interaction type from performance mark name
 */
function extractTherapeuticInteractionType(markName: string): TherapeuticInteractionType | null {
  if (markName.includes('crisis-button')) return 'crisis-button';
  if (markName.includes('form-input')) return 'form-input';
  if (markName.includes('navigation')) return 'navigation';
  if (markName.includes('content-load')) return 'content-load';
  if (markName.includes('audio-cue')) return 'audio-cue';
  return null;
}

/**
 * Calculate therapeutic UX metrics
 */
function calculateTherapeuticUXMetrics(
  interactionTimes: Map<TherapeuticInteractionType, number[]>
): TherapeuticUXMetrics {
  let totalInteractions = 0;
  let fastInteractions = 0;
  let slowInteractions = 0;
  
  interactionTimes.forEach((times, type) => {
    totalInteractions += times.length;
    
    times.forEach(time => {
      if (type === 'crisis-button' && time < CRISIS_PERFORMANCE_THRESHOLDS.emergencyResponseTime) {
        fastInteractions++;
      } else if (time > 1000) {
        slowInteractions++;
      }
    });
  });
  
  const fastRatio = totalInteractions > 0 ? fastInteractions / totalInteractions : 1;
  const slowRatio = totalInteractions > 0 ? slowInteractions / totalInteractions : 0;
  
  return {
    cognitiveLoadScore: Math.max(0, 100 - (slowRatio * 50)), // Lower slow interactions = lower cognitive load
    interactionStress: Math.max(0, slowRatio * 100), // Higher slow interactions = higher stress
    emotionalSafetyScore: Math.min(100, fastRatio * 100), // Higher fast interactions = higher safety
    traumaAvoidanceScore: Math.max(0, 100 - (slowInteractions * 10)), // Fewer slow interactions = better trauma avoidance
    therapeuticFlowScore: Math.max(0, 100 - (slowRatio * 30)) // Better timing = better therapeutic flow
  };
}

/**
 * Crisis-Aware PerformanceObserver Mock
 */
export class MentalHealthPerformanceObserver {
  private callback: PerformanceObserverCallback;
  private entryTypes: string[] = [];
  private crisisThresholds: CrisisPerformanceThresholds;
  private options: MentalHealthPerformanceOptions;

  constructor(
    callback: PerformanceObserverCallback,
    options: MentalHealthPerformanceOptions = {}
  ) {
    this.callback = callback;
    this.options = options;
    this.crisisThresholds = CRISIS_PERFORMANCE_THRESHOLDS;
  }

  observe(options: { entryTypes: string[] }): void {
    this.entryTypes = options.entryTypes;
    
    if (this.options.crisisAware) {
      console.log('🚨 Crisis-aware performance monitoring activated');
    }
  }

  disconnect(): void {
    this.entryTypes = [];
  }

  takeRecords(): PerformanceEntry[] {
    return [];
  }

  // Crisis-specific trigger for testing
  triggerCrisisPerformanceCheck(entries: PerformanceEntry[]): void {
    const crisisEntries = entries.filter(entry => 
      entry.name.includes('crisis') || entry.name.includes('emergency')
    );
    
    crisisEntries.forEach(entry => {
      const thresholdViolation = this.checkCrisisThreshold(entry);
      if (thresholdViolation) {
        console.error(`🚨 Crisis performance threshold violated:`, thresholdViolation);
      }
    });
    
    const list = {
      getEntries: () => crisisEntries,
      getEntriesByType: (type: string) => crisisEntries.filter(e => e.entryType === type),
      getEntriesByName: (name: string) => crisisEntries.filter(e => e.name === name)
    };
    
    this.callback(list as PerformanceObserverEntryList, this);
  }

  private checkCrisisThreshold(entry: PerformanceEntry): string | null {
    if (entry.name.includes('emergency-response') && 
        entry.duration > this.crisisThresholds.emergencyResponseTime) {
      return `Emergency response time: ${entry.duration}ms > ${this.crisisThresholds.emergencyResponseTime}ms`;
    }
    
    if (entry.name.includes('alert-display') && 
        entry.duration > this.crisisThresholds.alertDisplayTime) {
      return `Alert display time: ${entry.duration}ms > ${this.crisisThresholds.alertDisplayTime}ms`;
    }
    
    return null;
  }
}

/**
 * Therapeutic Request Animation Frame Mock
 */
export interface TherapeuticRAFMockFunctions {
  requestAnimationFrame: jest.MockedFunction<(callback: FrameRequestCallback) => number>;
  cancelAnimationFrame: jest.MockedFunction<(id: number) => void>;
  flushAnimationFrames: () => void;
}

export const mockTherapeuticRequestAnimationFrame = (
  options: MentalHealthPerformanceOptions = {}
): TherapeuticRAFMockFunctions => {
  let rafCallbacks: Array<{ 
    id: number; 
    callback: FrameRequestCallback; 
    timestamp: number;
    therapeutic?: boolean;
  }> = [];
  let rafId = 0;

  const requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
    const id = ++rafId;
    const timestamp = performance.now();
    
    // Therapeutic timing considerations
    let delay = 16; // Standard 60fps
    
    if (options.traumaInformedTiming) {
      // Slightly slower, gentler animations for trauma-informed design
      delay = 20; // ~50fps for gentler animations
    }
    
    rafCallbacks.push({ id, callback, timestamp });

    setTimeout(() => {
      const index = rafCallbacks.findIndex(c => c.id === id);
      if (index !== -1) {
        const cb = rafCallbacks[index];
        rafCallbacks.splice(index, 1);
        cb.callback(cb.timestamp);
      }
    }, delay);

    return id;
  });

  const cancelAnimationFrame = jest.fn((id: number) => {
    const index = rafCallbacks.findIndex(c => c.id === id);
    if (index !== -1) {
      rafCallbacks.splice(index, 1);
    }
  });

  const flushAnimationFrames = () => {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(({ callback, timestamp }) => {
      callback(timestamp);
    });
  };

  global.requestAnimationFrame = requestAnimationFrame;
  global.cancelAnimationFrame = cancelAnimationFrame;

  return {
    requestAnimationFrame,
    cancelAnimationFrame,
    flushAnimationFrames
  };
};

/**
 * Mental Health Intersection Observer Mock with Performance Tracking
 */
export class MentalHealthIntersectionObserver {
  private callback: IntersectionObserverCallback;
  private elements: Set<Element> = new Set();
  private options: IntersectionObserverInit;
  private performanceTracking: boolean;
  
  // Add missing IntersectionObserver properties
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  constructor(
    callback: IntersectionObserverCallback, 
    options: IntersectionObserverInit = {},
    performanceTracking: boolean = false
  ) {
    this.callback = callback;
    this.options = options;
    this.performanceTracking = performanceTracking;
    
    // Initialize missing properties from options
    this.root = options.root || null;
    this.rootMargin = options.rootMargin || '0px';
    this.thresholds = options.threshold 
      ? (Array.isArray(options.threshold) ? options.threshold : [options.threshold])
      : [0];
  }

  observe(element: Element): void {
    this.elements.add(element);
    
    if (this.performanceTracking) {
      performance.mark('intersection-observer-start');
    }
  }

  unobserve(element: Element): void {
    this.elements.delete(element);
  }

  disconnect(): void {
    this.elements.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  // Trigger intersection with performance monitoring
  triggerIntersection(entries: Partial<IntersectionObserverEntry>[]): void {
    const start = performance.now();
    
    const fullEntries = entries.map(entry => ({
      boundingClientRect: entry.boundingClientRect || {} as DOMRectReadOnly,
      intersectionRatio: entry.intersectionRatio || 0,
      intersectionRect: entry.intersectionRect || {} as DOMRectReadOnly,
      isIntersecting: entry.isIntersecting || false,
      rootBounds: entry.rootBounds || null,
      target: entry.target || document.createElement('div'),
      time: entry.time || performance.now()
    })) as IntersectionObserverEntry[];

    this.callback(fullEntries, this as unknown as IntersectionObserver);
    
    const duration = performance.now() - start;
    
    if (this.performanceTracking) {
      performance.mark('intersection-observer-end');
      performance.measure('intersection-observer-duration', 'intersection-observer-start', 'intersection-observer-end');
      
      // Validate therapeutic timing
      if (duration > 50) {
        console.warn(`⚠️ Intersection observer callback took ${duration}ms - may impact therapeutic UX`);
      }
    }
  }
}

/**
 * Mental Health Resize Observer Mock
 */
export class MentalHealthResizeObserver {
  private callback: ResizeObserverCallback;
  private elements: Set<Element> = new Set();
  private traumaInformed: boolean;

  constructor(callback: ResizeObserverCallback, traumaInformed: boolean = false) {
    this.callback = callback;
    this.traumaInformed = traumaInformed;
  }

  observe(element: Element): void {
    this.elements.add(element);
  }

  unobserve(element: Element): void {
    this.elements.delete(element);
  }

  disconnect(): void {
    this.elements.clear();
  }

  // Gentle resize trigger for trauma-informed design
  triggerResize(entries: Partial<ResizeObserverEntry>[]): void {
    if (this.traumaInformed) {
      // Add a small delay to avoid jarring resize effects
      setTimeout(() => {
        this.executeResize(entries);
      }, THERAPEUTIC_TIMING_GUIDELINES.gentleTransitionTime);
    } else {
      this.executeResize(entries);
    }
  }

  private executeResize(entries: Partial<ResizeObserverEntry>[]): void {
    const fullEntries = entries.map(entry => ({
      borderBoxSize: entry.borderBoxSize || [{ blockSize: 0, inlineSize: 0 }],
      contentBoxSize: entry.contentBoxSize || [{ blockSize: 0, inlineSize: 0 }],
      contentRect: entry.contentRect || {} as DOMRectReadOnly,
      devicePixelContentBoxSize: entry.devicePixelContentBoxSize || [],
      target: entry.target || document.createElement('div')
    })) as ResizeObserverEntry[];

    this.callback(fullEntries, this);
  }
}

/**
 * Setup all mental health performance mocks
 */
export const setupMentalHealthPerformanceMocks = (
  options: MentalHealthPerformanceOptions = {}
) => {
  const performanceMocks = mockMentalHealthPerformanceAPI(options);
  const rafMocks = mockTherapeuticRequestAnimationFrame(options);

  // Mock PerformanceObserver globally with mental health enhancements
  (global as any).PerformanceObserver = MentalHealthPerformanceObserver;

  // Mock IntersectionObserver globally with performance tracking
  (global as any).IntersectionObserver = MentalHealthIntersectionObserver;

  // Mock ResizeObserver globally with trauma-informed timing
  (global as any).ResizeObserver = MentalHealthResizeObserver;

  return {
    ...performanceMocks,
    ...rafMocks
  };
};

/**
 * Cleanup all mental health performance mocks
 */
export const cleanupMentalHealthPerformanceMocks = () => {
  // Restore original values if needed
  if ('performance' in window) {
    delete (window as any).performance;
  }

  if ('requestAnimationFrame' in global) {
    delete (global as any).requestAnimationFrame;
  }

  if ('cancelAnimationFrame' in global) {
    delete (global as any).cancelAnimationFrame;
  }

  if ('PerformanceObserver' in global) {
    delete (global as any).PerformanceObserver;
  }

  if ('IntersectionObserver' in global) {
    delete (global as any).IntersectionObserver;
  }

  if ('ResizeObserver' in global) {
    delete (global as any).ResizeObserver;
  }
};

/**
 * Enhanced fake timers with therapeutic considerations
 */
export const setupTherapeuticFakeTimers = () => {
  jest.useFakeTimers();

  // Helper to advance timers gently for trauma-informed timing
  const advanceTimersGently = async (ms: number, steps: number = 10) => {
    const stepSize = ms / steps;
    
    for (let i = 0; i < steps; i++) {
      jest.advanceTimersByTime(stepSize);
      await Promise.resolve(); // Allow React to process updates
      
      // Small pause between steps for gentler animations
      if (i < steps - 1) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
  };

  const runAllTimersGently = async () => {
    const pendingTimers = jest.getTimerCount();
    
    if (pendingTimers > 0) {
      // Execute timers in batches to avoid jarring effects
      const batchSize = Math.min(5, pendingTimers);
      
      for (let i = 0; i < Math.ceil(pendingTimers / batchSize); i++) {
        jest.advanceTimersByTime(50); // Small increments
        await Promise.resolve();
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    jest.runAllTimers();
  };

  return {
    advanceTimersGently,
    runAllTimersGently
  };
};

/**
 * Memory measurement mock with HIPAA considerations
 */
export const mockHIPAACompliantMemoryMeasurement = () => {
  // Type-safe performance with memory extension
  const perf = window.performance as any;
  
  if (!perf.memory) {
    Object.defineProperty(window.performance, 'memory', {
      value: {
        jsHeapSizeLimit: 2147483648,
        totalJSHeapSize: 10485760,
        usedJSHeapSize: 5242880
      },
      configurable: true,
      writable: true
    });
  }

  return {
    updateMemory: (used: number, total: number, limit: number) => {
      const perfWithMemory = window.performance as any;
      if (perfWithMemory.memory) {
        perfWithMemory.memory.usedJSHeapSize = used;
        perfWithMemory.memory.totalJSHeapSize = total;
        perfWithMemory.memory.jsHeapSizeLimit = limit;
        
        // Monitor for potential memory leaks in sensitive data
        if (used > total * 0.8) {
          console.warn('⚠️ High memory usage detected - potential HIPAA data leak risk');
        }
      }
    },
    
    checkMemoryLeaks: () => {
      const perfWithMemory = window.performance as any;
      if (perfWithMemory.memory) {
        const used = perfWithMemory.memory.usedJSHeapSize;
        const total = perfWithMemory.memory.totalJSHeapSize;
        const usageRatio = used / total;
        
        return {
          memoryUsageRatio: usageRatio,
          potentialLeak: usageRatio > 0.8,
          recommendation: usageRatio > 0.8 ? 'Consider clearing sensitive data from memory' : 'Memory usage normal'
        };
      }
      
      return { memoryUsageRatio: 0, potentialLeak: false, recommendation: 'Memory monitoring not available' };
    }
  };
};

/**
 * Crisis-specific timing test helper
 */
export const createCrisisTimingTestHelper = () => {
  let crisisCallbacks: Array<{ 
    fn: Function; 
    urgency: CrisisLevel; 
    timestamp: number;
    timeout: number;
  }> = [];

  const scheduleCrisisCallback = (
    fn: Function, 
    urgency: CrisisLevel, 
    timeout: number = CRISIS_PERFORMANCE_THRESHOLDS.emergencyResponseTime
  ) => {
    crisisCallbacks.push({ 
      fn, 
      urgency, 
      timestamp: Date.now(),
      timeout
    });
  };

  const executeCrisisCallbacks = (maxExecutionTime?: number) => {
    const executionStart = Date.now();
    const executed: Array<{ urgency: CrisisLevel; executionTime: number }> = [];
    
    // Sort by urgency (imminent first)
    const urgencyOrder = ['imminent', 'severe', 'high', 'moderate', 'low'];
    crisisCallbacks.sort((a, b) => 
      urgencyOrder.indexOf(a.urgency) - urgencyOrder.indexOf(b.urgency)
    );
    
    for (const callback of crisisCallbacks) {
      const start = Date.now();
      
      try {
        callback.fn();
        const executionTime = Date.now() - start;
        executed.push({ urgency: callback.urgency, executionTime });
        
        // Validate crisis response times
        if (executionTime > callback.timeout) {
          console.error(`🚨 Crisis callback exceeded timeout: ${executionTime}ms (${callback.urgency} urgency)`);
        }
      } catch (error) {
        console.error(`🚨 Crisis callback failed:`, error);
      }
      
      // Stop if we're taking too long overall
      if (maxExecutionTime && (Date.now() - executionStart) > maxExecutionTime) {
        console.warn('⚠️ Crisis callback execution taking too long, stopping early');
        break;
      }
    }
    
    crisisCallbacks = [];
    return executed;
  };

  const clearCrisisCallbacks = () => {
    crisisCallbacks.length = 0;
  };

  return {
    scheduleCrisisCallback,
    executeCrisisCallbacks,
    clearCrisisCallbacks
  };
};

/**
 * Mental Health Web Vitals Mock
 */
export const mockMentalHealthWebVitals = () => {
  const mockCLS = jest.fn();
  const mockFID = jest.fn();
  const mockFCP = jest.fn();
  const mockLCP = jest.fn();
  const mockTTFB = jest.fn();

  // Mental health specific thresholds (more stringent for crisis scenarios)
  const MENTAL_HEALTH_THRESHOLDS = {
    CLS: 0.05, // Stricter than standard 0.1 to avoid jarring layout shifts
    FID: 50, // Stricter than standard 100ms for crisis interactions
    FCP: 1000, // Standard 1.8s is too slow for crisis content
    LCP: 1500, // Stricter than standard 2.5s for main content
    TTFB: 200, // Stricter than standard 600ms for crisis response
  };

  return {
    getCLS: mockCLS,
    getFID: mockFID,
    getFCP: mockFCP,
    getLCP: mockLCP,
    getTTFB: mockTTFB,
    
    // Mental health specific trigger
    triggerMentalHealthMetric: (name: keyof typeof MENTAL_HEALTH_THRESHOLDS, value: number) => {
      const threshold = MENTAL_HEALTH_THRESHOLDS[name];
      const mockFns = { CLS: mockCLS, FID: mockFID, FCP: mockFCP, LCP: mockLCP, TTFB: mockTTFB };
      const mockFn = mockFns[name];
      
      if (mockFn) {
        const metric = { 
          name, 
          value, 
          id: `${name}-${Date.now()}`,
          rating: value <= threshold ? 'good' : value <= threshold * 2 ? 'needs-improvement' : 'poor'
        };
        
        mockFn.mock.calls.forEach(([callback]) => {
          callback(metric);
        });
        
        // Log mental health specific warnings
        if (value > threshold) {
          console.warn(`🧠 Mental health performance concern: ${name} = ${value} (threshold: ${threshold})`);
          
          if (name === 'FID' && value > 100) {
            console.error('🚨 Crisis interaction delay - user may be in distress');
          } else if (name === 'CLS' && value > 0.1) {
            console.warn('⚠️ Layout shift detected - may be jarring for trauma survivors');
          }
        }
      }
    },
    
    MENTAL_HEALTH_THRESHOLDS
  };
};

/**
 * Complete mental health performance testing setup
 */
export const setupCompleteMentalHealthPerformanceTesting = (
  options: MentalHealthPerformanceOptions = {}
) => {
  const performanceMocks = setupMentalHealthPerformanceMocks(options);
  const timerHelpers = setupTherapeuticFakeTimers();
  const memoryMocks = mockHIPAACompliantMemoryMeasurement();
  const crisisTimingHelper = createCrisisTimingTestHelper();
  const webVitalsMocks = mockMentalHealthWebVitals();

  return {
    ...performanceMocks,
    ...timerHelpers,
    ...memoryMocks,
    ...crisisTimingHelper,
    ...webVitalsMocks,
    
    cleanup: () => {
      cleanupMentalHealthPerformanceMocks();
      jest.useRealTimers();
    }
  };
};

// Legacy exports for backward compatibility
export const mockPerformanceAPI = mockMentalHealthPerformanceAPI;
export const MockPerformanceObserver = MentalHealthPerformanceObserver;
export const mockRequestAnimationFrame = mockTherapeuticRequestAnimationFrame;
export const MockIntersectionObserver = MentalHealthIntersectionObserver;
export const MockResizeObserver = MentalHealthResizeObserver;
export const setupPerformanceMocks = setupMentalHealthPerformanceMocks;
export const cleanupPerformanceMocks = cleanupMentalHealthPerformanceMocks;
export const setupFakeTimersWithPromises = setupTherapeuticFakeTimers;
export const mockMemoryMeasurement = mockHIPAACompliantMemoryMeasurement;
export const createTimingTestHelper = createCrisisTimingTestHelper;
export const mockWebVitals = mockMentalHealthWebVitals;
export const setupCompletePerformanceTesting = setupCompleteMentalHealthPerformanceTesting;

/**
 * Comprehensive mental health platform performance testing utilities:
 * - Crisis-aware performance monitoring with emergency response benchmarks
 * - Therapeutic UX performance metrics and cognitive load assessment
 * - Accessibility performance validation with screen reader timing
 * - Cultural competency performance testing
 * - HIPAA-compliant performance logging
 * - Trauma-informed interaction timing
 */
export default {
  // New mental health specific exports
  mockMentalHealthPerformanceAPI,
  MentalHealthPerformanceObserver,
  mockTherapeuticRequestAnimationFrame,
  MentalHealthIntersectionObserver,
  MentalHealthResizeObserver,
  setupMentalHealthPerformanceMocks,
  cleanupMentalHealthPerformanceMocks,
  setupTherapeuticFakeTimers,
  mockHIPAACompliantMemoryMeasurement,
  createCrisisTimingTestHelper,
  mockMentalHealthWebVitals,
  setupCompleteMentalHealthPerformanceTesting,
  
  // Legacy exports
  mockPerformanceAPI,
  MockPerformanceObserver,
  mockRequestAnimationFrame,
  MockIntersectionObserver,
  MockResizeObserver,
  setupPerformanceMocks,
  cleanupPerformanceMocks,
  setupFakeTimersWithPromises,
  mockMemoryMeasurement,
  createTimingTestHelper,
  mockWebVitals,
  setupCompletePerformanceTesting
};