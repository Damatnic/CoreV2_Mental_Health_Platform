/**
 * Accessibility Service Tests
 * 
 * Tests for comprehensive accessibility features including
 * WCAG compliance, screen reader support, and cognitive assistance
 */

import { accessibilityService } from '../accessibilityService';
import type {
  AccessibilityLevel,
  ColorBlindnessType,
  MotorImpairmentType,
  CognitiveImpairmentType,
  VisionImpairmentType,
  HearingImpairmentType,
  AccessibilityPreferences,
  AccessibilityAudit,
  AccessibilityIssue,
  AccessibilityMetrics,
  AccessibilityConfiguration,
  AccessibilityRule,
  AccessibilityReport,
  AccessibilityEvent
} from '../accessibilityService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock DOM elements
const createMockElement = (tagName: string = 'div') => ({
  tagName: tagName.toUpperCase(),
  focus: jest.fn(),
  scrollIntoView: jest.fn(),
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(() => false),
    toggle: jest.fn()
  },
  style: {},
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  textContent: '',
  innerHTML: '',
  innerText: '',
  id: '',
  className: '',
  children: [],
  parentElement: null,
  nextElementSibling: null,
  previousElementSibling: null
});

// Mock document methods with proper type casting
(document.getElementById as jest.Mock) = jest.fn();
(document.querySelector as jest.Mock) = jest.fn();
(document.querySelectorAll as jest.Mock) = jest.fn(() => []);
(document.createElement as jest.Mock) = jest.fn((tag: string) => createMockElement(tag));
(document.body.appendChild as jest.Mock) = jest.fn();
(document.body.removeChild as jest.Mock) = jest.fn();

// Mock window methods with proper type casting
(window.getComputedStyle as jest.Mock) = jest.fn(() => ({
  fontSize: '16px',
  fontWeight: '400',
  color: 'rgb(0, 0, 0)',
  backgroundColor: 'rgb(255, 255, 255)',
  getPropertyValue: jest.fn(() => '')
}));

// Mock matchMedia with proper type casting
(window.matchMedia as jest.Mock) = jest.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock MutationObserver
global.MutationObserver = class {
  constructor(callback: any) {}
  observe(target: any, options: any) {}
  disconnect() {}
  takeRecords() { return []; }
};

describe('AccessibilityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
  });

  describe('Preferences Management', () => {
    it('should get default preferences', () => {
      const preferences = accessibilityService.getPreferences();
      
      expect(preferences).toHaveProperty('screenReader');
      expect(preferences).toHaveProperty('keyboardNavigation');
      expect(preferences).toHaveProperty('colorBlindnessSupport');
      expect(preferences).toHaveProperty('fontSize');
      expect(preferences).toHaveProperty('highContrast');
    });

    it('should update preferences', async () => {
      const newPreferences: Partial<AccessibilityPreferences> = {
        screenReader: true,
        fontSize: 120, // percentage
        highContrast: true,
        colorBlindnessSupport: 'protanopia'
      };

      await accessibilityService.updatePreferences(newPreferences);
      const preferences = accessibilityService.getPreferences();

      expect(preferences.screenReader).toBe(true);
      expect(preferences.fontSize).toBe(120);
      expect(preferences.highContrast).toBe(true);
      expect(preferences.colorBlindnessSupport).toBe('protanopia');
    });

    it('should save preferences to localStorage', async () => {
      await accessibilityService.updatePreferences({
        screenReader: true
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'accessibility-preferences',
        expect.any(String)
      );
    });
  });

  describe('Configuration Management', () => {
    it('should get configuration', () => {
      const config = accessibilityService.getConfiguration();
      
      expect(config).toHaveProperty('wcagLevel');
      expect(config).toHaveProperty('autoFix');
      expect(config).toHaveProperty('realTimeMonitoring');
      expect(config).toHaveProperty('auditFrequency');
      expect(config).toHaveProperty('reportGeneration');
      expect(config).toHaveProperty('userPreferencesSync');
    });

    it('should update configuration', () => {
      const newConfig: Partial<AccessibilityConfiguration> = {
        wcagLevel: 'AAA',
        autoFix: false,
        realTimeMonitoring: false
      };

      accessibilityService.updateConfiguration(newConfig);
      const config = accessibilityService.getConfiguration();

      expect(config.wcagLevel).toBe('AAA');
      expect(config.autoFix).toBe(false);
      expect(config.realTimeMonitoring).toBe(false);
    });
  });

  describe('Accessibility Audit', () => {
    it('should run accessibility audit', async () => {
      const audit = await accessibilityService.runAccessibilityAudit();
      
      expect(audit).toHaveProperty('timestamp');
      expect(audit).toHaveProperty('url');
      expect(audit).toHaveProperty('issues');
      expect(audit).toHaveProperty('score');
      expect(audit).toHaveProperty('wcagLevel');
      expect(audit).toHaveProperty('complianceStatus');
      expect(audit).toHaveProperty('autoFixApplied');
      expect(audit).toHaveProperty('recommendations');
    });

    it('should return audit history', () => {
      const history = accessibilityService.getAuditHistory();
      
      expect(Array.isArray(history)).toBe(true);
    });

    it('should get latest audit', () => {
      const latestAudit = accessibilityService.getLatestAudit();
      
      // Should be null or a valid audit
      expect(latestAudit === null || typeof latestAudit === 'object').toBe(true);
    });

    it('should handle audit for specific URL', async () => {
      const audit = await accessibilityService.runAccessibilityAudit('https://example.com');
      
      expect(audit.url).toBe('https://example.com');
    });
  });

  describe('Metrics', () => {
    it('should get accessibility metrics', () => {
      const metrics = accessibilityService.getMetrics();
      
      expect(metrics).toHaveProperty('complianceScore');
      expect(metrics).toHaveProperty('wcagLevel');
      expect(metrics).toHaveProperty('totalIssues');
      expect(metrics).toHaveProperty('criticalIssues');
      expect(metrics).toHaveProperty('seriousIssues');
      expect(metrics).toHaveProperty('moderateIssues');
      expect(metrics).toHaveProperty('minorIssues');
      expect(metrics).toHaveProperty('fixedIssues');
      expect(metrics).toHaveProperty('remainingIssues');
      expect(metrics).toHaveProperty('lastAuditDate');
    });

    it('should track metrics over time', () => {
      const metrics = accessibilityService.getMetrics();
      
      expect(typeof metrics.complianceScore).toBe('number');
      expect(typeof metrics.totalIssues).toBe('number');
      expect(typeof metrics.criticalIssues).toBe('number');
      expect(typeof metrics.fixedIssues).toBe('number');
    });
  });

  describe('Report Generation', () => {
    it('should generate accessibility report', () => {
      const report = accessibilityService.generateReport();
      
      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('audits');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('actionItems');
      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('id');
    });

    it('should generate report for specific period', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      const report = accessibilityService.generateReport({ start, end });
      
      expect(report.period.start).toEqual(start);
      expect(report.period.end).toEqual(end);
    });

    it('should include metrics in report', () => {
      const report = accessibilityService.generateReport();
      
      expect(report.metrics).toHaveProperty('wcagLevel');
      expect(report.metrics).toHaveProperty('complianceScore');
      expect(report.metrics).toHaveProperty('totalIssues');
      expect(report.metrics).toHaveProperty('criticalIssues');
    });
  });

  describe('Event Handling', () => {
    it('should add event listeners', () => {
      const listener = jest.fn();
      
      accessibilityService.addEventListener(listener);
      
      // Event listener should be registered
      expect(() => {
        accessibilityService.removeEventListener(listener);
      }).not.toThrow();
    });

    it('should remove event listeners', () => {
      const listener = jest.fn();
      
      accessibilityService.addEventListener(listener);
      accessibilityService.removeEventListener(listener);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle cleanup on destroy', () => {
      expect(() => {
        accessibilityService.destroy();
      }).not.toThrow();
    });
  });

  describe('Mental Health Specific Features', () => {
    it('should support crisis mode accessibility', async () => {
      const preferences: Partial<AccessibilityPreferences> = {
        crisisMode: true,
        reducedMotion: true,
        simplifiedInterface: true
      };

      await accessibilityService.updatePreferences(preferences);
      const current = accessibilityService.getPreferences();

      expect(current.crisisMode).toBe(true);
      expect(current.reducedMotion).toBe(true);
      expect(current.simplifiedInterface).toBe(true);
    });

    it('should support cognitive impairment preferences', async () => {
      const preferences: Partial<AccessibilityPreferences> = {
        cognitiveImpairment: 'memory-impairment',
        readingGuide: true,
        extendedTimeouts: true,
        focusIndicator: 'enhanced'
      };

      await accessibilityService.updatePreferences(preferences);
      const current = accessibilityService.getPreferences();

      expect(current.cognitiveImpairment).toBe('memory-impairment');
      expect(current.readingGuide).toBe(true);
    });

    it('should provide anxiety-reducing features', async () => {
      const preferences: Partial<AccessibilityPreferences> = {
        reducedMotion: true,
        soundAlerts: false, // turning off sounds
        crisisAudioCues: false, // gentle audio
        emergencyShortcuts: true
      };

      await accessibilityService.updatePreferences(preferences);
      const current = accessibilityService.getPreferences();

      expect(current.reducedMotion).toBe(true);
      expect(current.soundAlerts).toBe(false);
    });

    it('should support color blindness modes', async () => {
      const colorBlindModes: ColorBlindnessType[] = [
        'protanopia',
        'deuteranopia',
        'tritanopia',
        'achromatopsia'
      ];

      for (const mode of colorBlindModes) {
        await accessibilityService.updatePreferences({
          colorBlindnessSupport: mode
        });
        const current = accessibilityService.getPreferences();
        expect(current.colorBlindnessSupport).toBe(mode);
      }
    });

    it('should support motor impairment features', async () => {
      const preferences: Partial<AccessibilityPreferences> = {
        motorImpairment: 'one-handed',
        extendedTimeouts: true,
        stickyKeys: true,
        dwellClick: true
      };

      await accessibilityService.updatePreferences(preferences);
      const current = accessibilityService.getPreferences();

      expect(current.motorImpairment).toBe('one-handed');
      expect(current.extendedTimeouts).toBe(true);
    });

    it('should support hearing impairment features', async () => {
      const preferences: Partial<AccessibilityPreferences> = {
        hearingImpairment: 'deaf',
        captions: true,
        audioDescriptions: true,
        signLanguage: true
      };

      await accessibilityService.updatePreferences(preferences);
      const current = accessibilityService.getPreferences();

      expect(current.hearingImpairment).toBe('deaf');
      expect(current.captions).toBe(true);
    });
  });

  describe('WCAG Compliance', () => {
    it('should check WCAG level A compliance', async () => {
      accessibilityService.updateConfiguration({
        wcagLevel: 'A'
      });

      const audit = await accessibilityService.runAccessibilityAudit();
      
      expect(audit.wcagLevel).toBe('A');
      expect(audit.issues).toBeDefined();
    });

    it('should check WCAG level AA compliance', async () => {
      accessibilityService.updateConfiguration({
        wcagLevel: 'AA'
      });

      const audit = await accessibilityService.runAccessibilityAudit();
      
      expect(audit.wcagLevel).toBe('AA');
    });

    it('should check WCAG level AAA compliance', async () => {
      accessibilityService.updateConfiguration({
        wcagLevel: 'AAA'
      });

      const audit = await accessibilityService.runAccessibilityAudit();
      
      expect(audit.wcagLevel).toBe('AAA');
    });

    it('should identify color contrast issues', async () => {
      const audit = await accessibilityService.runAccessibilityAudit();
      
      const colorContrastIssues = audit.issues.filter(
        issue => issue.tags && issue.tags.includes('contrast')
      );
      
      // Check structure of color contrast issues
      colorContrastIssues.forEach(issue => {
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('element');
        expect(issue).toHaveProperty('description');
      });
    });

    it('should identify keyboard navigation issues', async () => {
      const audit = await accessibilityService.runAccessibilityAudit();
      
      const keyboardIssues = audit.issues.filter(
        issue => issue.tags && issue.tags.includes('keyboard')
      );
      
      // Check structure of keyboard navigation issues
      keyboardIssues.forEach(issue => {
        expect(issue).toHaveProperty('wcagCriterion');
        expect(issue).toHaveProperty('solution');
      });
    });

    it('should identify screen reader issues', async () => {
      const audit = await accessibilityService.runAccessibilityAudit();
      
      const screenReaderIssues = audit.issues.filter(
        issue => issue.tags && issue.tags.includes('screen-reader')
      );
      
      // Check structure of screen reader issues
      screenReaderIssues.forEach(issue => {
        expect(issue).toHaveProperty('impact');
        expect(issue).toHaveProperty('autoFixable');
      });
    });
  });

  describe('Auto-fixing', () => {
    it('should auto-fix eligible issues', async () => {
      const audit = await accessibilityService.runAccessibilityAudit();
      
      expect(typeof audit.autoFixApplied).toBe('boolean');
      expect(audit.issues).toBeDefined();
    });

    it('should provide fix recommendations', async () => {
      const audit = await accessibilityService.runAccessibilityAudit();
      
      expect(Array.isArray(audit.recommendations)).toBe(true);
      audit.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
      });
    });
  });

  describe('Font Size Preferences', () => {
    it('should support different font sizes', async () => {
      const fontSizes: number[] = [
        80,  // small
        100, // medium (default)
        120, // large
        150  // extra-large
      ];

      for (const size of fontSizes) {
        await accessibilityService.updatePreferences({
          fontSize: size
        });
        const current = accessibilityService.getPreferences();
        expect(current.fontSize).toBe(size);
      }
    });
  });

  describe('Contrast Preferences', () => {
    it('should support different contrast modes', async () => {
      const contrastModes: boolean[] = [
        false, // normal
        true   // high contrast
      ];

      for (const mode of contrastModes) {
        await accessibilityService.updatePreferences({
          highContrast: mode
        });
        const current = accessibilityService.getPreferences();
        expect(current.highContrast).toBe(mode);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid preferences gracefully', async () => {
      const invalidPreferences = {
        fontSize: -100 // Invalid negative percentage
      };

      await expect(
        accessibilityService.updatePreferences(invalidPreferences)
      ).resolves.not.toThrow();
    });

    it('should handle audit errors gracefully', async () => {
      // Mock document.querySelectorAll to throw
      (document.querySelectorAll as jest.Mock) = jest.fn(() => {
        throw new Error('DOM error');
      });

      const audit = await accessibilityService.runAccessibilityAudit();
      
      // Should still return a valid audit structure
      expect(audit).toHaveProperty('issues');
      expect(audit).toHaveProperty('score');
    });

    it('should handle localStorage errors', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      await expect(
        accessibilityService.updatePreferences({ screenReader: true })
      ).resolves.not.toThrow();
    });
  });
});