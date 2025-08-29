import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';

interface AccessibilityIssue {
  id: string;
  type: 'color-contrast' | 'alt-text' | 'keyboard-nav' | 'aria-labels' | 'focus-indicators';
  severity: 'low' | 'medium' | 'high' | 'critical';
  element: string;
  description: string;
  suggestion: string;
}

interface AccessibilityReport {
  score: number;
  issues: AccessibilityIssue[];
  passedTests: string[];
  timestamp: Date;
}

const useAccessibilityMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  const [currentReport, setCurrentReport] = React.useState<AccessibilityReport | null>(null);
  const [history, setHistory] = React.useState<AccessibilityReport[]>([]);

  const runAccessibilityAudit = React.useCallback(async (): Promise<AccessibilityReport> => {
    setIsMonitoring(true);
    
    // Simulate audit delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock accessibility issues
    const mockIssues: AccessibilityIssue[] = [
      {
        id: '1',
        type: 'color-contrast',
        severity: 'high',
        element: 'button.primary',
        description: 'Insufficient color contrast ratio (2.8:1)',
        suggestion: 'Increase contrast to at least 4.5:1 for AA compliance'
      },
      {
        id: '2',
        type: 'alt-text',
        severity: 'medium',
        element: 'img.mood-icon',
        description: 'Missing alt text for decorative image',
        suggestion: 'Add descriptive alt text or mark as decorative'
      },
      {
        id: '3',
        type: 'keyboard-nav',
        severity: 'high',
        element: 'div.modal',
        description: 'Modal not keyboard accessible',
        suggestion: 'Implement focus trapping and escape key handling'
      }
    ];

    const passedTests = [
      'Heading structure hierarchy',
      'Form labels present',
      'Skip navigation links',
      'Page has title'
    ];

    // Calculate score based on issues
    const totalTests = mockIssues.length + passedTests.length;
    const criticalIssues = mockIssues.filter(i => i.severity === 'critical').length;
    const highIssues = mockIssues.filter(i => i.severity === 'high').length;
    const mediumIssues = mockIssues.filter(i => i.severity === 'medium').length;
    
    const score = Math.max(0, 100 - (criticalIssues * 25) - (highIssues * 15) - (mediumIssues * 10));

    const report: AccessibilityReport = {
      score: Math.round(score),
      issues: mockIssues,
      passedTests,
      timestamp: new Date()
    };

    setCurrentReport(report);
    setHistory(prev => [report, ...prev.slice(0, 9)]); // Keep last 10 reports
    setIsMonitoring(false);
    
    return report;
  }, []);

  const getIssuesByType = React.useCallback((type: AccessibilityIssue['type']) => {
    return currentReport?.issues.filter(issue => issue.type === type) || [];
  }, [currentReport]);

  const getIssuesBySeverity = React.useCallback((severity: AccessibilityIssue['severity']) => {
    return currentReport?.issues.filter(issue => issue.severity === severity) || [];
  }, [currentReport]);

  const getScoreImprovement = React.useCallback(() => {
    if (history.length < 2) return null;
    
    const current = history[0].score;
    const previous = history[1].score;
    
    return current - previous;
  }, [history]);

  const exportReport = React.useCallback(() => {
    if (!currentReport) return null;
    
    return {
      ...currentReport,
      exportedAt: new Date(),
      summary: {
        totalIssues: currentReport.issues.length,
        criticalIssues: getIssuesBySeverity('critical').length,
        highIssues: getIssuesBySeverity('high').length,
        mediumIssues: getIssuesBySeverity('medium').length,
        lowIssues: getIssuesBySeverity('low').length
      }
    };
  }, [currentReport, getIssuesBySeverity]);

  const scheduleMonitoring = React.useCallback((intervalMs: number) => {
    const interval = setInterval(() => {
      runAccessibilityAudit();
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [runAccessibilityAudit]);

  return {
    isMonitoring,
    currentReport,
    history,
    runAccessibilityAudit,
    getIssuesByType,
    getIssuesBySeverity,
    getScoreImprovement,
    exportReport,
    scheduleMonitoring
  };
};

describe('useAccessibilityMonitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    expect(result.current.isMonitoring).toBe(false);
    expect(result.current.currentReport).toBeNull();
    expect(result.current.history).toEqual([]);
  });

  it('should run accessibility audit', async () => {
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    let report: any;
    await act(async () => {
      report = await result.current.runAccessibilityAudit();
    });
    
    expect(report).toHaveProperty('score');
    expect(report).toHaveProperty('issues');
    expect(report).toHaveProperty('passedTests');
    expect(report).toHaveProperty('timestamp');
    expect(result.current.isMonitoring).toBe(false);
  });

  it('should set monitoring state during audit', async () => {
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    const auditPromise = act(async () => {
      return result.current.runAccessibilityAudit();
    });
    
    // Should be monitoring
    expect(result.current.isMonitoring).toBe(true);
    
    await auditPromise;
    
    expect(result.current.isMonitoring).toBe(false);
  });

  it('should store report in history', async () => {
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    await act(async () => {
      await result.current.runAccessibilityAudit();
    });
    
    expect(result.current.history).toHaveLength(1);
    expect(result.current.currentReport).not.toBeNull();
  });

  it('should filter issues by type', async () => {
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    await act(async () => {
      await result.current.runAccessibilityAudit();
    });
    
    const colorIssues = result.current.getIssuesByType('color-contrast');
    const altTextIssues = result.current.getIssuesByType('alt-text');
    
    expect(Array.isArray(colorIssues)).toBe(true);
    expect(Array.isArray(altTextIssues)).toBe(true);
  });

  it('should filter issues by severity', async () => {
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    await act(async () => {
      await result.current.runAccessibilityAudit();
    });
    
    const highIssues = result.current.getIssuesBySeverity('high');
    const mediumIssues = result.current.getIssuesBySeverity('medium');
    
    expect(Array.isArray(highIssues)).toBe(true);
    expect(Array.isArray(mediumIssues)).toBe(true);
  });

  it('should calculate score improvement', async () => {
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    // Run first audit
    await act(async () => {
      await result.current.runAccessibilityAudit();
    });
    
    expect(result.current.getScoreImprovement()).toBeNull();
    
    // Run second audit
    await act(async () => {
      await result.current.runAccessibilityAudit();
    });
    
    const improvement = result.current.getScoreImprovement();
    expect(typeof improvement).toBe('number');
  });

  it('should export report', async () => {
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    await act(async () => {
      await result.current.runAccessibilityAudit();
    });
    
    const exported = result.current.exportReport();
    
    expect(exported).toHaveProperty('exportedAt');
    expect(exported).toHaveProperty('summary');
    expect(exported?.summary).toHaveProperty('totalIssues');
    expect(exported?.summary).toHaveProperty('criticalIssues');
  });

  it('should handle empty report for export', () => {
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    const exported = result.current.exportReport();
    expect(exported).toBeNull();
  });

  it('should schedule monitoring', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    let cleanup: (() => void) | undefined;
    
    act(() => {
      cleanup = result.current.scheduleMonitoring(1000);
    });
    
    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // Should have run audit
    expect(result.current.currentReport).not.toBeNull();
    
    cleanup?.();
    jest.useRealTimers();
  });

  it('should limit history to 10 reports', async () => {
    const { result } = renderHook(() => useAccessibilityMonitoring());
    
    // Run 12 audits
    for (let i = 0; i < 12; i++) {
      await act(async () => {
        await result.current.runAccessibilityAudit();
      });
    }
    
    expect(result.current.history).toHaveLength(10);
  });
});
