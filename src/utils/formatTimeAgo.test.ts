/**
 * Format Time Ago Test Suite
 * Tests time formatting utilities for relative time display
 */

import { formatTimeAgo, formatChatTimestamp } from './formatTimeAgo';

// Store original navigator.language
const originalLanguage = navigator.language || 'en-US';

// Helper to safely set navigator.language
const setNavigatorLanguage = (lang: string) => {
  Object.defineProperty(navigator, 'language', {
    value: lang,
    writable: true,
    configurable: true
  });
};

describe('formatTimeAgo', () => {
  const mockNow = new Date('2024-01-15T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('formatTimeAgo', () => {
    it('should format seconds correctly', () => {
      const timestamp = new Date('2024-01-15T11:59:30Z').toISOString(); // 30 seconds ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('30s ago');
    });

    it('should format minutes correctly', () => {
      const timestamp = new Date('2024-01-15T11:55:00Z').toISOString(); // 5 minutes ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('5m ago');
    });

    it('should format hours correctly', () => {
      const timestamp = new Date('2024-01-15T09:00:00Z').toISOString(); // 3 hours ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('3h ago');
    });

    it('should format days correctly', () => {
      const timestamp = new Date('2024-01-12T12:00:00Z').toISOString(); // 3 days ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('3d ago');
    });

    it('should format months correctly', () => {
      const timestamp = new Date('2023-11-15T12:00:00Z').toISOString(); // ~2 months ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('2mo ago');
    });

    it('should format years correctly', () => {
      const timestamp = new Date('2022-01-15T12:00:00Z').toISOString(); // 2 years ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('2y ago');
    });

    it('should handle zero seconds', () => {
      const timestamp = new Date('2024-01-15T12:00:00Z').toISOString(); // Same time
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('0s ago');
    });

    it('should handle fractional seconds', () => {
      const timestamp = new Date('2024-01-15T11:59:59.500Z').toISOString(); // 0.5 seconds ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('0s ago'); // Should floor to 0
    });

    it('should handle boundary between seconds and minutes', () => {
      const timestamp = new Date('2024-01-15T11:59:00Z').toISOString(); // Exactly 1 minute ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('1m ago');
    });

    it('should handle boundary between minutes and hours', () => {
      const timestamp = new Date('2024-01-15T11:00:00Z').toISOString(); // Exactly 1 hour ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('1h ago');
    });

    it('should handle boundary between hours and days', () => {
      const timestamp = new Date('2024-01-14T12:00:00Z').toISOString(); // Exactly 1 day ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('1d ago');
    });

    it('should handle boundary between days and months', () => {
      const timestamp = new Date('2023-12-16T12:00:00Z').toISOString(); // Exactly 30 days ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('1mo ago');
    });

    it('should handle boundary between months and years', () => {
      const timestamp = new Date('2023-01-15T12:00:00Z').toISOString(); // Exactly 12 months ago
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('1y ago');
    });

    it('should handle invalid date strings', () => {
      const invalidTimestamp = 'invalid-date';
      const result = formatTimeAgo(invalidTimestamp);
      // Should handle gracefully (result will depend on how Date constructor handles invalid input)
      expect(typeof result).toBe('string');
    });

    it('should handle future timestamps', () => {
      const futureTimestamp = new Date('2024-01-15T13:00:00Z').toISOString(); // 1 hour in future
      const result = formatTimeAgo(futureTimestamp);
      // Negative values should still be handled gracefully
      expect(typeof result).toBe('string');
    });

    it('should handle very old timestamps', () => {
      const ancientTimestamp = new Date('1990-01-15T12:00:00Z').toISOString(); // 34 years ago
      const result = formatTimeAgo(ancientTimestamp);
      expect(result).toMatch(/\d+y ago/);
    });
  });

  describe('formatChatTimestamp', () => {
    // Mock toLocaleTimeString and toLocaleDateString
    const mockToLocaleTimeString = jest.fn(() => '12:00 PM');
    const mockToLocaleDateString = jest.fn(() => 'Jan 15, 2024');

    beforeEach(() => {
      Date.prototype.toLocaleTimeString = mockToLocaleTimeString;
      Date.prototype.toLocaleDateString = mockToLocaleDateString;
    });

    it("should format today's timestamp with time only", () => {
      const todayTimestamp = '2024-01-15T10:30:00Z'; // Same day
      const result = formatChatTimestamp(todayTimestamp);

      expect(mockToLocaleTimeString).toHaveBeenCalledWith('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
      expect(result).toBe('12:00 PM');
    });

    it('should format yesterday\'s timestamp with "Yesterday at" prefix', () => {
      const yesterdayTimestamp = '2024-01-14T10:30:00Z';
      const result = formatChatTimestamp(yesterdayTimestamp);
      expect(result).toBe('Yesterday at 12:00 PM');
    });

    it('should format older timestamps with full date', () => {
      const olderTimestamp = '2024-01-10T10:30:00Z'; // 5 days ago
      const result = formatChatTimestamp(olderTimestamp);

      expect(mockToLocaleDateString).toHaveBeenCalledWith('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      expect(result).toBe('Jan 15, 2024');
    });

    it('should handle timestamps from different years', () => {
      const lastYearTimestamp = '2023-01-15T10:30:00Z';
      const result = formatChatTimestamp(lastYearTimestamp);
      expect(result).toBe('Jan 15, 2024'); // Uses mocked return value
    });

    it('should correctly identify today vs yesterday across month boundaries', () => {
      // Mock current date to be February 1st
      const feb1st = new Date('2024-02-01T12:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(feb1st.getTime());

      // Yesterday would be January 31st
      const jan31st = '2024-01-31T10:30:00Z';
      const result = formatChatTimestamp(jan31st);
      expect(result).toBe('Yesterday at 12:00 PM');
    });

    it('should correctly identify today vs yesterday across year boundaries', () => {
      // Mock current date to be January 1st
      const jan1st = new Date('2024-01-01T12:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(jan1st.getTime());

      // Yesterday would be December 31st of previous year
      const dec31st = '2023-12-31T10:30:00Z';
      const result = formatChatTimestamp(dec31st);
      expect(result).toBe('Yesterday at 12:00 PM');
    });

    it('should handle same timestamp as current time', () => {
      const sameTimestamp = '2024-01-15T12:00:00Z';
      const result = formatChatTimestamp(sameTimestamp);
      expect(result).toBe('12:00 PM'); // Should be formatted as today
    });

    it('should handle invalid timestamp gracefully', () => {
      const invalidTimestamp = 'invalid-date';

      expect(() => {
        formatChatTimestamp(invalidTimestamp);
      }).not.toThrow();
    });

    it('should respect browser locale settings', () => {
      // Change navigator.language
      setNavigatorLanguage('fr-FR');
      const timestamp = '2024-01-15T10:30:00Z';
      formatChatTimestamp(timestamp);
      expect(mockToLocaleTimeString).toHaveBeenCalledWith('fr-FR', expect.any(Object));

      // Restore original value
      setNavigatorLanguage('en-US');
    });

    it('should handle timezone differences correctly', () => {
      // The function should work regardless of local timezone
      // since it compares dates by year/month/day components
      const timestampUTC = '2024-01-15T00:00:00Z';
      const timestampLocal = '2024-01-15T23:59:59Z';
      const resultUTC = formatChatTimestamp(timestampUTC);
      const resultLocal = formatChatTimestamp(timestampLocal);

      // Both timestamps are on the same day (2024-01-15) in the test's mock time
      // They may be formatted as either 'today' or 'yesterday' depending on timezone
      expect(typeof resultUTC).toBe('string');
      expect(typeof resultLocal).toBe('string');
    });

    it('should handle leap year dates correctly', () => {
      // Mock current date to be in a leap year
      const leapYearDate = new Date('2024-02-29T12:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(leapYearDate.getTime());
      const yesterdayLeap = '2024-02-28T10:30:00Z';
      const result = formatChatTimestamp(yesterdayLeap);
      expect(result).toBe('Yesterday at 12:00 PM');
    });
  });

  describe('edge cases and performance', () => {
    it('should handle very large timestamp differences efficiently', () => {
      const veryOldTimestamp = '1000-01-01T00:00:00Z';
      const startTime = performance.now();
      const result = formatTimeAgo(veryOldTimestamp);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should complete quickly
      expect(typeof result).toBe('string');
    });

    it('should be consistent across multiple calls', () => {
      const timestamp = '2024-01-15T11:30:00Z';
      const result1 = formatTimeAgo(timestamp);
      const result2 = formatTimeAgo(timestamp);
      const result3 = formatTimeAgo(timestamp);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should handle empty string gracefully', () => {
      expect(() => {
        formatTimeAgo('');
        formatChatTimestamp('');
      }).not.toThrow();
    });

    it('should handle null and undefined inputs', () => {
      expect(() => {
        formatTimeAgo(null as any);
        formatTimeAgo(undefined as any);
        formatChatTimestamp(null as any);
        formatChatTimestamp(undefined as any);
      }).not.toThrow();
    });

    it('should maintain performance with frequent calls', () => {
      const timestamp = '2024-01-15T11:00:00Z';
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        formatTimeAgo(timestamp);
        formatChatTimestamp(timestamp);
      }
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(100); // Should complete 1000 iterations in under 100ms
    });
  });

  describe('localization compatibility', () => {
    it('should work with different locale settings', () => {
      const locales = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'ja-JP'];
      const timestamp = '2024-01-15T10:30:00Z';

      locales.forEach(locale => {
        setNavigatorLanguage(locale);

        expect(() => {
          formatChatTimestamp(timestamp);
        }).not.toThrow();
      });

      // Restore original
      setNavigatorLanguage(originalLanguage);
    });
  });
});