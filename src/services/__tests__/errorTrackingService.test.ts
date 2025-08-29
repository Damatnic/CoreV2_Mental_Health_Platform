import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface ErrorContext {
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: number;
}

interface ErrorReport {
  error: Error;
  context: ErrorContext;
  level: 'info' | 'warning' | 'error' | 'critical';
  tags: string[];
}

class ErrorTrackingService {
  private errors: ErrorReport[] = [];
  private maxErrors: number = 100;
  private reportingEnabled: boolean = true;

  track(error: Error, level: 'info' | 'warning' | 'error' | 'critical' = 'error', tags: string[] = []): void {
    if (!this.reportingEnabled) return;

    const report: ErrorReport = {
      error,
      level,
      tags,
      context: this.getContext()
    };

    this.errors.push(report);
    
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Send to external service
    if (level === 'critical' || level === 'error') {
      this.sendToService(report);
    }
  }

  private getContext(): ErrorContext {
    return {
      sessionId: this.generateSessionId(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now()
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToService(report: ErrorReport): void {
    // Mock sending to external service
    console.error('Error tracked:', report);
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getErrorsByLevel(level: string): ErrorReport[] {
    return this.errors.filter(e => e.level === level);
  }

  clearErrors(): void {
    this.errors = [];
  }

  enableReporting(): void {
    this.reportingEnabled = true;
  }

  disableReporting(): void {
    this.reportingEnabled = false;
  }

  getErrorCount(): number {
    return this.errors.length;
  }
}

describe('ErrorTrackingService', () => {
  let service: ErrorTrackingService;
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    service = new ErrorTrackingService();
    consoleSpy.mockClear();
  });

  afterEach(() => {
    service.clearErrors();
  });

  it('should track errors', () => {
    const error = new Error('Test error');
    service.track(error);
    
    expect(service.getErrorCount()).toBe(1);
    expect(service.getErrors()[0].error.message).toBe('Test error');
  });

  it('should assign error levels', () => {
    service.track(new Error('Info'), 'info');
    service.track(new Error('Warning'), 'warning');
    service.track(new Error('Error'), 'error');
    service.track(new Error('Critical'), 'critical');
    
    expect(service.getErrorsByLevel('info')).toHaveLength(1);
    expect(service.getErrorsByLevel('warning')).toHaveLength(1);
    expect(service.getErrorsByLevel('error')).toHaveLength(1);
    expect(service.getErrorsByLevel('critical')).toHaveLength(1);
  });

  it('should add tags to errors', () => {
    const error = new Error('Tagged error');
    service.track(error, 'error', ['auth', 'login']);
    
    const tracked = service.getErrors()[0];
    expect(tracked.tags).toContain('auth');
    expect(tracked.tags).toContain('login');
  });

  it('should include context information', () => {
    service.track(new Error('Context test'));
    
    const context = service.getErrors()[0].context;
    expect(context.sessionId).toBeDefined();
    expect(context.timestamp).toBeDefined();
    expect(typeof context.timestamp).toBe('number');
  });

  it('should limit stored errors', () => {
    const oldMaxErrors = service['maxErrors'];
    service['maxErrors'] = 5;
    
    for (let i = 0; i < 10; i++) {
      service.track(new Error(`Error ${i}`));
    }
    
    expect(service.getErrorCount()).toBe(5);
    expect(service.getErrors()[0].error.message).toBe('Error 5');
    
    service['maxErrors'] = oldMaxErrors;
  });

  it('should respect reporting enabled flag', () => {
    service.disableReporting();
    service.track(new Error('Should not track'));
    
    expect(service.getErrorCount()).toBe(0);
    
    service.enableReporting();
    service.track(new Error('Should track'));
    
    expect(service.getErrorCount()).toBe(1);
  });

  it('should clear all errors', () => {
    service.track(new Error('Error 1'));
    service.track(new Error('Error 2'));
    
    expect(service.getErrorCount()).toBe(2);
    
    service.clearErrors();
    
    expect(service.getErrorCount()).toBe(0);
  });
});
