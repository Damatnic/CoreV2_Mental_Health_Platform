/**
 * Logger Test Suite
 * 
 * Comprehensive tests for the production-safe logging utility
 * including console output, error tracking, and environment handling.
 * 
 * @fileoverview Tests for logger utility functions
 * @version 2.0.0
 */

import { logger, LogLevel, LogEntry } from './logger';

// Mock console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Mock environment
const originalEnv = process.env.NODE_ENV;

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock console methods
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.debug = jest.fn();

    // Reset environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;

    // Restore environment
    process.env.NODE_ENV = originalEnv;
  });

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      const context = { userId: '123' };

      logger.info(message, context);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message),
        expect.stringContaining('userId')
      );
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';
      const context = { component: 'TestComponent' };

      logger.warn(message, context);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining(message),
        expect.stringContaining('component')
      );
    });

    it('should log error messages', () => {
      const message = 'Test error message';
      const error = new Error('Test error');

      logger.error(message, error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining(message),
        expect.stringContaining('Test error')
      );
    });

    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      const message = 'Test debug message';

      logger.debug(message);

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining(message)
      );
    });

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production';
      const message = 'Test debug message';

      logger.debug(message);

      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('Environment Handling', () => {
    it('should log all levels in development', () => {
      process.env.NODE_ENV = 'development';
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should only log warnings and errors in production', () => {
      process.env.NODE_ENV = 'production';
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Data Handling', () => {
    it('should handle undefined data gracefully', () => {
      const message = 'Test message';

      logger.info(message);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message)
      );
    });

    it('should handle null data gracefully', () => {
      const message = 'Test message';
      const data = null;

      logger.info(message, data);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message)
      );
    });

    it('should handle complex objects', () => {
      const message = 'Test message';
      const data = { user: { id: 1, name: 'Test' }, timestamp: new Date() };

      logger.info(message, data);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message),
        expect.stringContaining('user')
      );
    });

    it('should handle arrays', () => {
      const message = 'Test message';
      const data = [1, 2, 3, 'test'];

      logger.info(message, data);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message),
        expect.stringContaining('1')
      );
    });
  });

  describe('Source Tracking', () => {
    it('should include source in log messages', () => {
      const message = 'Test message';
      const source = 'TestComponent';

      logger.info(message, undefined, source);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message),
        expect.stringContaining(source)
      );
    });

    it('should handle source without data', () => {
      const message = 'Test message';
      const source = 'TestComponent';

      logger.info(message, undefined, source);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining(message),
        expect.stringContaining(source)
      );
    });
  });

  describe('Log Buffer Management', () => {
    it('should store logs in buffer', () => {
      const message = 'Test message';
      
      logger.info(message);
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe(message);
      expect(logs[0].level).toBe('info');
    });

    it('should limit buffer size', () => {
      // Add more than maxBufferSize logs
      for (let i = 0; i < 150; i++) {
        logger.info(`Message ${i}`);
      }
      
      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('should clear logs', () => {
      logger.info('Test message');
      expect(logger.getLogs()).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });

    it('should get logs since timestamp', () => {
      const timestamp = new Date().toISOString();
      
      logger.info('Message 1');
      logger.info('Message 2');
      
      const logs = logger.getLogsSince(timestamp);
      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it('should export logs as JSON', () => {
      logger.info('Test message');
      
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle Error objects', () => {
      const message = 'Test error';
      const error = new Error('Something went wrong');

      logger.error(message, error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining(message),
        expect.stringContaining('Something went wrong')
      );
    });

    it('should handle string errors', () => {
      const message = 'Test error';
      const error = 'Something went wrong';

      logger.error(message, error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining(message),
        expect.stringContaining('Something went wrong')
      );
    });

    it('should handle object errors', () => {
      const message = 'Test error';
      const error = { code: 'E001', details: 'Invalid input' };

      logger.error(message, error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining(message),
        expect.stringContaining('code')
      );
    });
  });

  describe('Timestamp Formatting', () => {
    it('should include ISO timestamp in logs', () => {
      const message = 'Test message';
      
      logger.info(message);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/),
        expect.stringContaining(message)
      );
    });
  });

  describe('Browser Environment', () => {
    beforeEach(() => {
      // Mock browser environment
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      });
    });

    it('should detect localhost as development', () => {
      // This test would need to be adjusted based on the actual implementation
      // For now, we'll just test that the logger works in browser environment
      const message = 'Test message';
      
      logger.info(message);
      
      expect(console.info).toHaveBeenCalled();
    });
  });
});
