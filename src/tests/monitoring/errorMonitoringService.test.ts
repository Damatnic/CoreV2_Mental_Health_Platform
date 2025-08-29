import { errorMonitoringService, ErrorSeverity, ErrorContext } from '../../services/errorMonitoringService';

// Mock external dependencies
const mockSentry = {
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback) => callback({ setTag: jest.fn(), setContext: jest.fn() }))
};

jest.mock('@sentry/browser', () => mockSentry);

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => [{ duration: 100 }])
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('Error Monitoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
    (console.warn as jest.Mock).mockRestore();
  });

  describe('captureError', () => {
    it('should capture and report errors with context', async () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        component: 'TestComponent',
        user: { id: 'user123', email: 'test@example.com' },
        sessionId: 'session123'
      };

      await errorMonitoringService.captureError(error, context);

      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
      expect(mockSentry.setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com'
      });
    });

    it('should sanitize sensitive information before reporting', async () => {
      const sensitiveError = new Error('User SSN: 123-45-6789, Credit Card: 4111-1111-1111-1111');
      const context: ErrorContext = {
        component: 'PaymentComponent',
        additionalData: {
          ssn: '123-45-6789',
          creditCard: '4111-1111-1111-1111',
          medicalRecord: 'Patient has anxiety disorder'
        }
      };

      await errorMonitoringService.captureError(sensitiveError, context);

      // Check that sensitive data is sanitized
      expect(mockSentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.not.stringMatching(/\d{3}-\d{2}-\d{4}/) // No SSN
        })
      );
    });

    it('should handle crisis-related errors with high priority', async () => {
      const crisisError = new Error('Crisis detection service unavailable');
      const context: ErrorContext = {
        component: 'CrisisDetectionService',
        severity: ErrorSeverity.CRITICAL,
        tags: { service: 'crisis', critical: 'true' }
      };

      await errorMonitoringService.captureError(crisisError, context);

      expect(mockSentry.setTag).toHaveBeenCalledWith('severity', 'critical');
      expect(mockSentry.setTag).toHaveBeenCalledWith('service', 'crisis');
    });

    it('should rate limit error reporting to prevent spam', async () => {
      const error = new Error('Repeated error');
      const context: ErrorContext = { component: 'TestComponent' };

      // Send the same error multiple times rapidly
      for (let i = 0; i < 10; i++) {
        await errorMonitoringService.captureError(error, context);
      }

      // Should not report more than 5 times due to rate limiting
      expect(mockSentry.captureException).toHaveBeenCalledTimes(5);
    });

    it('should add breadcrumbs for error tracking', async () => {
      const error = new Error('Test error with breadcrumbs');
      const context: ErrorContext = {
        component: 'TestComponent',
        breadcrumbs: [
          { message: 'User clicked panic button', category: 'user-action' },
          { message: 'Crisis service called', category: 'api' }
        ]
      };

      await errorMonitoringService.captureError(error, context);

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User clicked panic button',
        category: 'user-action'
      });
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Crisis service called',
        category: 'api'
      });
    });
  });

  describe('trackPerformance', () => {
    it('should track performance metrics for critical operations', () => {
      errorMonitoringService.trackPerformance('crisis-detection', 150, {
        userId: 'user123',
        riskLevel: 'high'
      });

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'Performance: crisis-detection took 150ms',
        'info'
      );
    });

    it('should alert on slow crisis detection', () => {
      errorMonitoringService.trackPerformance('crisis-detection', 2000, {
        userId: 'user123'
      });

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'Performance Alert: crisis-detection exceeded threshold (2000ms)',
        'warning'
      );
    });

    it('should track authentication performance', () => {
      errorMonitoringService.trackPerformance('user-authentication', 800, {
        userId: 'user123',
        loginMethod: '2fa'
      });

      expect(mockSentry.setContext).toHaveBeenCalledWith('performance', {
        operation: 'user-authentication',
        duration: 800,
        metadata: {
          userId: 'user123',
          loginMethod: '2fa'
        }
      });
    });
  });

  describe('captureUserAction', () => {
    it('should track crisis-related user actions', () => {
      errorMonitoringService.captureUserAction('panic-button-clicked', {
        userId: 'user123',
        timestamp: new Date().toISOString(),
        context: 'mood-tracking-page'
      });

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User action: panic-button-clicked',
        category: 'user-action',
        data: expect.objectContaining({
          userId: 'user123',
          context: 'mood-tracking-page'
        })
      });
    });

    it('should sanitize user action data', () => {
      errorMonitoringService.captureUserAction('form-submission', {
        formData: {
          email: 'user@example.com',
          ssn: '123-45-6789',
          medicalInfo: 'Patient has depression'
        }
      });

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User action: form-submission',
        category: 'user-action',
        data: expect.not.objectContaining({
          formData: expect.objectContaining({
            ssn: expect.any(String),
            medicalInfo: expect.any(String)
          })
        })
      });
    });
  });

  describe('monitorAPICall', () => {
    it('should monitor crisis API call performance', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ success: true });

      const result = await errorMonitoringService.monitorAPICall(
        'crisis-assessment',
        mockApiCall,
        { userId: 'user123' }
      );

      expect(result).toEqual({ success: true });
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'API call: crisis-assessment completed',
          category: 'api'
        })
      );
    });

    it('should capture API call failures', async () => {
      const mockApiCall = jest.fn().mockRejectedValue(new Error('API failure'));

      await expect(
        errorMonitoringService.monitorAPICall('crisis-assessment', mockApiCall)
      ).rejects.toThrow('API failure');

      expect(mockSentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'API failure'
        })
      );
    });

    it('should track API call latency', async () => {
      const mockApiCall = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 100))
      );

      await errorMonitoringService.monitorAPICall(
        'mood-entry-creation',
        mockApiCall
      );

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        expect.stringMatching(/API Performance: mood-entry-creation took \d+ms/),
        'info'
      );
    });
  });

  describe('setupErrorBoundary', () => {
    it('should configure global error handlers', () => {
      const originalHandler = window.onerror;
      const originalPromiseHandler = window.onunhandledrejection;

      errorMonitoringService.setupErrorBoundary();

      expect(window.onerror).not.toBe(originalHandler);
      expect(window.onunhandledrejection).not.toBe(originalPromiseHandler);
    });

    it('should handle unhandled promise rejections', () => {
      errorMonitoringService.setupErrorBoundary();

      const event = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(new Error('Unhandled promise rejection')),
        reason: new Error('Unhandled promise rejection')
      });

      window.onunhandledrejection!(event);

      expect(mockSentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unhandled promise rejection'
        })
      );
    });
  });

  describe('HIPAA compliance', () => {
    it('should not log PHI in error messages', async () => {
      const phiError = new Error('Database error for patient John Doe, DOB 01/01/1990, SSN 123-45-6789');
      
      await errorMonitoringService.captureError(phiError, {
        component: 'DatabaseService'
      });

      const capturedError = mockSentry.captureException.mock.calls[0][0];
      expect(capturedError.message).not.toMatch(/John Doe/);
      expect(capturedError.message).not.toMatch(/01\/01\/1990/);
      expect(capturedError.message).not.toMatch(/123-45-6789/);
    });

    it('should redact sensitive context data', async () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        component: 'TestComponent',
        additionalData: {
          patientName: 'John Doe',
          diagnosis: 'Major Depression',
          medication: 'Sertraline 50mg',
          publicInfo: 'Browser version'
        }
      };

      await errorMonitoringService.captureError(error, context);

      expect(mockSentry.setContext).toHaveBeenCalledWith(
        'additional_data',
        expect.not.objectContaining({
          patientName: expect.any(String),
          diagnosis: expect.any(String),
          medication: expect.any(String)
        })
      );

      expect(mockSentry.setContext).toHaveBeenCalledWith(
        'additional_data',
        expect.objectContaining({
          publicInfo: 'Browser version'
        })
      );
    });
  });

  describe('crisis service monitoring', () => {
    it('should monitor 988 connection attempts', async () => {
      await errorMonitoringService.monitor988Connection('user123', 'success', 150);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        '988 Connection: success in 150ms for user user123',
        'info'
      );
    });

    it('should alert on 988 connection failures', async () => {
      await errorMonitoringService.monitor988Connection('user123', 'failed', 5000);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'CRITICAL: 988 Connection failed for user user123 after 5000ms',
        'error'
      );
    });

    it('should track emergency escalation events', async () => {
      await errorMonitoringService.trackEmergencyEscalation({
        userId: 'user123',
        riskLevel: 'critical',
        escalationType: '911-call',
        responseTime: 45
      });

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'Emergency Escalation: 911-call for user user123 (critical risk)',
        'warning'
      );

      expect(mockSentry.setTag).toHaveBeenCalledWith('emergency_escalation', 'true');
      expect(mockSentry.setTag).toHaveBeenCalledWith('risk_level', 'critical');
    });
  });

  describe('real-time monitoring', () => {
    it('should track user session health', () => {
      errorMonitoringService.trackSessionHealth('user123', {
        connectionQuality: 'good',
        batteryLevel: 80,
        networkType: 'wifi',
        isInCrisis: false
      });

      expect(mockSentry.setContext).toHaveBeenCalledWith('session_health', {
        userId: 'user123',
        connectionQuality: 'good',
        batteryLevel: 80,
        networkType: 'wifi',
        isInCrisis: false
      });
    });

    it('should alert on poor session health during crisis', () => {
      errorMonitoringService.trackSessionHealth('user123', {
        connectionQuality: 'poor',
        batteryLevel: 15,
        networkType: 'cellular',
        isInCrisis: true
      });

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'Session Health Alert: Poor conditions detected for user in crisis',
        'warning'
      );
    });
  });

  describe('error aggregation', () => {
    it('should aggregate similar errors', async () => {
      const baseError = new Error('Network timeout');
      
      // Send multiple similar errors
      for (let i = 0; i < 5; i++) {
        await errorMonitoringService.captureError(baseError, {
          component: 'NetworkService'
        });
      }

      // Should aggregate and send summary
      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        'Error aggregation: Network timeout occurred 5 times in the last minute',
        'warning'
      );
    });

    it('should track error trends', () => {
      const trends = errorMonitoringService.getErrorTrends();
      
      expect(trends).toEqual(
        expect.objectContaining({
          totalErrors: expect.any(Number),
          criticalErrors: expect.any(Number),
          errorsByComponent: expect.any(Object),
          emergencyEscalations: expect.any(Number)
        })
      );
    });
  });
});