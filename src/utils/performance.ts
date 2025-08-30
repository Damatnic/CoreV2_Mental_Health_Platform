/**
 * Performance Utilities
 * Optimized functions for improving app performance
 */

/**
 * Throttle function execution
 * Ensures function is called at most once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Debounce function execution
 * Delays function execution until after specified time has elapsed since last call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;

  return function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * Request animation frame throttle
 * Ensures function is called at most once per animation frame
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, lastArgs!);
        rafId = null;
      });
    }
  };
}

/**
 * Memoize function results
 * Caches function results based on input arguments
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(
  selector: string = 'img[data-src]',
  options: IntersectionObserverInit = {}
): () => void {
  const images = document.querySelectorAll<HTMLImageElement>(selector);
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src) {
          // Create new image to preload
          const tempImg = new Image();
          tempImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            delete img.dataset.src;
          };
          tempImg.src = src;
        }
        
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01,
    ...options
  });

  images.forEach(img => imageObserver.observe(img));

  // Return cleanup function
  return () => {
    imageObserver.disconnect();
  };
}

/**
 * Preload critical resources
 */
export function preloadResources(resources: string[]): Promise<void[]> {
  return Promise.all(
    resources.map(resource => {
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        
        // Determine resource type
        if (resource.endsWith('.css')) {
          link.as = 'style';
        } else if (resource.endsWith('.js')) {
          link.as = 'script';
        } else if (resource.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
          link.as = 'image';
        } else if (resource.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
          link.as = 'font';
          link.crossOrigin = 'anonymous';
        }
        
        link.href = resource;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to preload ${resource}`));
        
        document.head.appendChild(link);
      });
    })
  );
}

/**
 * Measure performance of a function
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  func: T,
  label: string = 'Function'
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = func(...args);
    const end = performance.now();
    
    console.log(`${label} took ${(end - start).toFixed(2)}ms`);
    
    // Log to performance observer if available
    if ('PerformanceObserver' in window) {
      performance.mark(`${label}-start`);
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
    }
    
    return result;
  }) as T;
}

/**
 * Batch DOM updates
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Create an idle callback wrapper
 */
export function whenIdle(
  callback: () => void,
  options?: IdleRequestOptions
): number {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    return window.setTimeout(callback, 1);
  }
}

/**
 * Cancel idle callback
 */
export function cancelIdle(id: number): void {
  if ('cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Web Worker pool for CPU-intensive tasks
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private busyWorkers = new Set<Worker>();

  constructor(
    workerScript: string,
    poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push(worker);
    }
  }

  execute(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));

      if (availableWorker) {
        this.runWorker(availableWorker, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  private runWorker(
    worker: Worker,
    data: any,
    resolve: (value: any) => void,
    reject: (error: any) => void
  ): void {
    this.busyWorkers.add(worker);

    const handleMessage = (e: MessageEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      
      this.busyWorkers.delete(worker);
      resolve(e.data);

      // Process queue if there are pending tasks
      if (this.queue.length > 0) {
        const { data, resolve, reject } = this.queue.shift()!;
        this.runWorker(worker, data, resolve, reject);
      }
    };

    const handleError = (e: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      
      this.busyWorkers.delete(worker);
      reject(e);

      // Process queue if there are pending tasks
      if (this.queue.length > 0) {
        const { data, resolve, reject } = this.queue.shift()!;
        this.runWorker(worker, data, resolve, reject);
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage(data);
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
    this.busyWorkers.clear();
  }
}

/**
 * Memory-efficient string concatenation for large strings
 */
export class StringBuilder {
  private strings: string[] = [];

  append(str: string): StringBuilder {
    this.strings.push(str);
    return this;
  }

  toString(): string {
    return this.strings.join('');
  }

  clear(): void {
    this.strings = [];
  }

  get length(): number {
    return this.strings.reduce((sum, str) => sum + str.length, 0);
  }
}

/**
 * Efficient array chunking
 */
export function* chunkArray<T>(array: T[], chunkSize: number): Generator<T[]> {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = { current: 0 };

  // Log render count
  renderCount.current++;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${componentName} rendered ${renderCount.current} times`);
  }

  // Measure render time
  const renderStart = performance.now();
  
  return {
    logRenderTime: () => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      if (renderTime > 16) { // More than one frame (60fps)
        console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }
    },
    renderCount: renderCount.current
  };
}