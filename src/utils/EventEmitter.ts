/**
 * Browser-compatible EventEmitter implementation
 * Provides Node.js-like EventEmitter functionality for browser environments
 */

export type EventListener = (...args: any[]) => void;

export interface EventEmitterOptions {
  maxListeners?: number;
  captureRejections?: boolean;
}

/**
 * Browser-compatible EventEmitter class
 * Implements the core functionality of Node.js EventEmitter
 */
export class EventEmitter {
  private events: Map<string | symbol, Set<EventListener>> = new Map();
  private maxListeners: number = 10;
  private captureRejections: boolean = false;

  constructor(options?: EventEmitterOptions) {
    if (options?.maxListeners !== undefined) {
      this.maxListeners = options.maxListeners;
    }
    if (options?.captureRejections !== undefined) {
      this.captureRejections = options.captureRejections;
    }
  }

  /**
   * Add a listener for the specified event
   */
  on(event: string | symbol, listener: EventListener): this {
    return this.addListener(event, listener);
  }

  /**
   * Add a listener for the specified event
   */
  addListener(event: string | symbol, listener: EventListener): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    const listeners = this.events.get(event)!;
    
    // Check max listeners
    if (listeners.size >= this.maxListeners && this.maxListeners > 0) {
      console.warn(
        `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ` +
        `${listeners.size + 1} ${String(event)} listeners added. Use emitter.setMaxListeners() to increase limit`
      );
    }
    
    listeners.add(listener);
    this.emit('newListener', event, listener);
    
    return this;
  }

  /**
   * Remove a listener for the specified event
   */
  off(event: string | symbol, listener?: EventListener): this {
    return this.removeListener(event, listener);
  }

  /**
   * Remove a listener for the specified event
   */
  removeListener(event: string | symbol, listener?: EventListener): this {
    const listeners = this.events.get(event);
    
    if (!listeners) {
      return this;
    }
    
    if (listener) {
      listeners.delete(listener);
      this.emit('removeListener', event, listener);
      
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    } else {
      // Remove all listeners for this event
      this.events.delete(event);
    }
    
    return this;
  }

  /**
   * Emit an event with the given arguments
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    
    if (!listeners || listeners.size === 0) {
      // Special handling for 'error' event
      if (event === 'error') {
        const error = args[0];
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Unhandled error event: ' + String(error));
        }
      }
      return false;
    }
    
    // Execute all listeners
    let hasListeners = false;
    listeners.forEach(listener => {
      try {
        if (this.captureRejections) {
          const result = listener(...args);
          if (result && typeof result.catch === 'function') {
            result.catch((err: any) => {
              this.emit('error', err);
            });
          }
        } else {
          listener(...args);
        }
        hasListeners = true;
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error);
        this.emit('error', error);
      }
    });
    
    return hasListeners;
  }

  /**
   * Add a one-time listener for the specified event
   */
  once(event: string | symbol, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(event, onceWrapper);
      listener(...args);
    };
    
    // Preserve original listener for removeListener
    (onceWrapper as any).listener = listener;
    
    return this.on(event, onceWrapper);
  }

  /**
   * Remove all listeners for the specified event, or all events
   */
  removeAllListeners(event?: string | symbol): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  /**
   * Set the maximum number of listeners for events
   */
  setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }

  /**
   * Get the maximum number of listeners for events
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }

  /**
   * Get all listeners for the specified event
   */
  listeners(event: string | symbol): EventListener[] {
    const listeners = this.events.get(event);
    return listeners ? Array.from(listeners) : [];
  }

  /**
   * Get the raw listeners for the specified event
   */
  rawListeners(event: string | symbol): EventListener[] {
    return this.listeners(event);
  }

  /**
   * Get the number of listeners for the specified event
   */
  listenerCount(event: string | symbol): number {
    const listeners = this.events.get(event);
    return listeners ? listeners.size : 0;
  }

  /**
   * Prepend a listener to the beginning of the listeners array
   */
  prependListener(event: string | symbol, listener: EventListener): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    const listeners = this.events.get(event)!;
    const existingListeners = Array.from(listeners);
    listeners.clear();
    listeners.add(listener);
    existingListeners.forEach(l => listeners.add(l));
    
    this.emit('newListener', event, listener);
    
    return this;
  }

  /**
   * Prepend a one-time listener to the beginning of the listeners array
   */
  prependOnceListener(event: string | symbol, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(event, onceWrapper);
      listener(...args);
    };
    
    (onceWrapper as any).listener = listener;
    
    return this.prependListener(event, onceWrapper);
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): (string | symbol)[] {
    return Array.from(this.events.keys());
  }

  /**
   * Static method to get the default max listeners
   */
  static get defaultMaxListeners(): number {
    return 10;
  }

  /**
   * Static method to set the default max listeners
   */
  static set defaultMaxListeners(n: number) {
    if (typeof n !== 'number' || n < 0) {
      throw new RangeError('The value of "defaultMaxListeners" must be a non-negative number');
    }
  }
}

// Export as default and named export for compatibility
export default EventEmitter;

// Also export as 'events' module compatibility
export const events = { EventEmitter };