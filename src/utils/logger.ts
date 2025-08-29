/**
 * Production-safe logging utility
 * Provides environment-aware logging with buffer management
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  source?: string;
}

class Logger {
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  private get isDevelopment(): boolean {
    // Check current NODE_ENV dynamically for testing
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      return true;
    }

    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return false;
    }

    // For browser/Vite environment, check if window exists and location is localhost
    if (typeof window !== 'undefined' && window.location) {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }

    return false;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === "warn" || level === "error";
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string, data?: any, source?: string): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const sourcePrefix = source ? ` [${source}]` : '';
    const dataString = data ? ` ${JSON.stringify(data, null, 2)}` : '';
    
    return `${prefix}${sourcePrefix}: ${message}${dataString}`;
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  debug(message: string, data?: any, source?: string): void {
    if (!this.shouldLog("debug")) return;

    const entry: LogEntry = {
      level: "debug",
      message,
      data,
      timestamp: new Date().toISOString(),
      source
    };

    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, data, source));
    }
  }

  info(message: string, data?: any, source?: string): void {
    if (!this.shouldLog("info")) return;

    const entry: LogEntry = {
      level: "info",
      message,
      data,
      timestamp: new Date().toISOString(),
      source
    };

    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.info(this.formatMessage("info", message, data, source));
    }
  }

  warn(message: string, data?: any, source?: string): void {
    if (!this.shouldLog("warn")) return;

    const entry: LogEntry = {
      level: "warn",
      message,
      data,
      timestamp: new Date().toISOString(),
      source
    };

    this.addToBuffer(entry);
    console.warn(this.formatMessage("warn", message, data, source));
  }

  error(message: string, error?: any, source?: string): void {
    if (!this.shouldLog("error")) return;

    const entry: LogEntry = {
      level: "error",
      message,
      data: error,
      timestamp: new Date().toISOString(),
      source
    };

    this.addToBuffer(entry);
    console.error(this.formatMessage("error", message, error, source));
    
    // In production, you might want to send errors to a service
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // Could integrate with error tracking service here
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearLogs(): void {
    this.logBuffer = [];
  }

  getLogsSince(timestamp: string): LogEntry[] {
    return this.logBuffer.filter(entry => entry.timestamp >= timestamp);
  }

  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Create and export singleton instance
export const logger = new Logger();

// Export the Logger class for testing
export { Logger, LogLevel, LogEntry };