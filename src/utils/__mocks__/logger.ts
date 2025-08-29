/**
 * Mock Logger for Testing
 * 
 * Provides mock implementations of logging functions for tests
 */

import { vi } from 'vitest';

interface MockLogger {
  debug: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  getRecentLogs: ReturnType<typeof vi.fn>;
  clearLogs: ReturnType<typeof vi.fn>;
}

export const logger: MockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  getRecentLogs: vi.fn(() => []),
  clearLogs: vi.fn()
};

export const logError = logger.error.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logDebug = logger.debug.bind(logger);

export default logger;



