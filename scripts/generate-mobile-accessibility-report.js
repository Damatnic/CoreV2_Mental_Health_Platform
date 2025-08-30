/**
 * Mobile Accessibility Audit Report Generator
 * Generates comprehensive, actionable reports for mobile accessibility compliance
 * Focuses on crisis-critical features and WCAG 2.1 AA standards
 */

const MobileAccessibilityReportGenerator = {
  /**
   * Generate HTML report from audit results
   */
  generateHTMLReport(auditResults, testResults) {
    const timestamp = new Date().toISOString();
    const score = auditResults?.summary?.score || 0;
    const criticalCount = auditResults?.summary?.criticalErrors || 0;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mobile Accessibility Audit Report - Astral Core Mental Health Platform</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      font-size: 18px;
      opacity: 0.9;
    }
    
    .score-card {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 30px;
    }
    
    .score-item {
      text-align: center;
    }
    
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: bold;
      margin: 0 auto 10px;
      position: relative;
      background: white;
    }
    
    .score-circle.excellent {
      color: #28a745;
      box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.2);
    }
    
    .score-circle.good {
      color: #17a2b8;
      box-shadow: 0 0 0 4px rgba(23, 162, 184, 0.2);
    }
    
    .score-circle.needs-work {
      color: #ffc107;
      box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.2);
    }
    
    .score-circle.poor {
      color: #dc3545;
      box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.2);
    }
    
    .score-label {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .content {
      padding: 40px;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      font-size: 24px;
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .critical-alert {
      background: #dc3545;
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .critical-alert h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .issue-card {
      background: #f8f9fa;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    
    .issue-card.warning {
      border-left-color: #ffc107;
    }
    
    .issue-card.info {
      border-left-color: #17a2b8;
    }
    
    .issue-card.success {
      border-left-color: #28a745;
    }
    
    .issue-title {
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .issue-description {
      color: #666;
      margin-bottom: 10px;
    }
    
    .issue-fix {
      background: white;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #dee2e6;
      font-size: 14px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .metric-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }
    
    .metric-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    
    .recommendation-list {
      list-style: none;
    }
    
    .recommendation-item {
      background: #e7f3ff;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    
    .recommendation-priority {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .priority-critical {
      background: #dc3545;
      color: white;
    }
    
    .priority-high {
      background: #ffc107;
      color: #333;
    }
    
    .priority-medium {
      background: #17a2b8;
      color: white;
    }
    
    .wcag-compliance {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .compliance-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .compliance-status {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    
    .compliance-status.pass {
      background: #d4edda;
      color: #28a745;
    }
    
    .compliance-status.fail {
      background: #f8d7da;
      color: #dc3545;
    }
    
    .compliance-details {
      flex: 1;
    }
    
    .compliance-title {
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .compliance-description {
      font-size: 14px;
      color: #666;
    }
    
    .test-results {
      margin-top: 20px;
    }
    
    .test-category {
      margin-bottom: 30px;
    }
    
    .test-category h3 {
      font-size: 18px;
      margin-bottom: 15px;
      color: #495057;
    }
    
    .test-list {
      list-style: none;
    }
    
    .test-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    
    .test-status {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .test-status.pass {
      background: #28a745;
      color: white;
    }
    
    .test-status.fail {
      background: #dc3545;
      color: white;
    }
    
    .test-status.warning {
      background: #ffc107;
      color: white;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 30px 40px;
      text-align: center;
      color: #666;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
      
      .header {
        background: #667eea;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
    
    @media (max-width: 768px) {
      .score-card {
        flex-direction: column;
        gap: 20px;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
      }
      
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Mobile Accessibility Audit Report</h1>
      <p class="subtitle">Astral Core Mental Health Platform</p>
      <p class="subtitle">${new Date(timestamp).toLocaleString()}</p>
      
      <div class="score-card">
        <div class="score-item">
          <div class="score-circle ${this.getScoreClass(score)}">
            ${score}/100
          </div>
          <div class="score-label">Overall Score</div>
        </div>
        
        <div class="score-item">
          <div class="score-circle ${criticalCount > 0 ? 'poor' : 'excellent'}">
            ${criticalCount}
          </div>
          <div class="score-label">Critical Issues</div>
        </div>
        
        <div class="score-item">
          <div class="score-circle ${this.getComplianceClass(auditResults)}">
            ${this.getComplianceLevel(auditResults)}
          </div>
          <div class="score-label">WCAG 2.1 AA</div>
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="content">
      ${this.generateCriticalSection(auditResults)}
      ${this.generateSummarySection(auditResults, testResults)}
      ${this.generateIssuesSection(auditResults)}
      ${this.generateRecommendationsSection(auditResults)}
      ${this.generateWCAGSection(auditResults)}
      ${this.generateTestResultsSection(testResults)}
      ${this.generateMetricsSection(auditResults, testResults)}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>Generated by Mobile Accessibility Audit System</p>
      <p>For support, contact <a href="mailto:accessibility@astralcore.com">accessibility@astralcore.com</a></p>
      <p style="margin-top: 10px;">
        <small>This report focuses on mobile accessibility for users with disabilities during mental health crises.</small>
      </p>
    </div>
  </div>
</body>
</html>`;
    
    return html;
  },

  /**
   * Helper functions for HTML generation
   */
  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'needs-work';
    return 'poor';
  },

  getComplianceClass(auditResults) {
    const compliance = auditResults?.wcagCompliance?.['WCAG 2.1 Level AA'];
    return compliance?.passed ? 'excellent' : 'poor';
  },

  getComplianceLevel(auditResults) {
    const compliance = auditResults?.wcagCompliance?.['WCAG 2.1 Level AA'];
    return compliance?.passed ? 'PASS' : 'FAIL';
  },

  generateCriticalSection(auditResults) {
    const criticalIssues = auditResults?.criticalIssues || [];
    
    if (criticalIssues.length === 0) return '';
    
    return `
      <div class="critical-alert">
        <h3>⚠️ Critical Accessibility Issues Detected</h3>
        <p>These issues severely impact users with disabilities and must be fixed immediately:</p>
        <ul style="margin-top: 10px; padding-left: 20px;">
          ${criticalIssues.map(issue => `
            <li>${issue.message || issue.error || 'Unknown issue'}</li>
          `).join('')}
        </ul>
      </div>
    `;
  },

  generateSummarySection(auditResults, testResults) {
    const summary = auditResults?.summary || {};
    const testSummary = testResults || {};
    
    return `
      <div class="section">
        <h2>Executive Summary</h2>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${summary.totalErrors || 0}</div>
            <div class="metric-label">Total Errors</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">${summary.totalWarnings || 0}</div>
            <div class="metric-label">Warnings</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">${testSummary.passed?.length || 0}</div>
            <div class="metric-label">Tests Passed</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">${testSummary.failed?.length || 0}</div>
            <div class="metric-label">Tests Failed</div>
          </div>
        </div>
        
        <p style="margin-top: 20px;">
          This mobile accessibility audit evaluated the Astral Core Mental Health Platform against 
          WCAG 2.1 AA standards, with special focus on crisis accessibility features. The assessment 
          covered screen reader compatibility, touch accessibility, cognitive load, visual accessibility, 
          and motor accessibility requirements.
        </p>
      </div>
    `;
  },

  generateIssuesSection(auditResults) {
    const criticalIssues = auditResults?.criticalIssues || [];
    const highIssues = auditResults?.highPriorityIssues || [];
    const mediumIssues = auditResults?.mediumPriorityIssues || [];
    
    return `
      <div class="section">
        <h2>Accessibility Issues</h2>
        
        ${criticalIssues.length > 0 ? `
          <h3 style="color: #dc3545; margin-bottom: 15px;">Critical Issues</h3>
          ${criticalIssues.map(issue => `
            <div class="issue-card">
              <div class="issue-title">${issue.type || 'General'}: ${issue.message || 'Issue detected'}</div>
              ${issue.element ? `<div class="issue-description">Element: ${this.describeElement(issue.element)}</div>` : ''}
              ${issue.fix ? `<div class="issue-fix">Fix: ${issue.fix}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}
        
        ${highIssues.length > 0 ? `
          <h3 style="color: #ffc107; margin: 30px 0 15px;">High Priority Issues</h3>
          ${highIssues.map(issue => `
            <div class="issue-card warning">
              <div class="issue-title">${issue.type || 'General'}: ${issue.message || 'Issue detected'}</div>
              ${issue.fix ? `<div class="issue-fix">Fix: ${issue.fix}</div>` : ''}
            </div>
          `).join('')}
        ` : ''}
        
        ${mediumIssues.length > 0 ? `
          <h3 style="color: #17a2b8; margin: 30px 0 15px;">Medium Priority Issues</h3>
          ${mediumIssues.slice(0, 5).map(issue => `
            <div class="issue-card info">
              <div class="issue-title">${issue.type || 'General'}: ${issue.message || 'Issue detected'}</div>
              ${issue.fix ? `<div class="issue-fix">Fix: ${issue.fix}</div>` : ''}
            </div>
          `).join('')}
          ${mediumIssues.length > 5 ? `<p style="margin-top: 10px; color: #666;">And ${mediumIssues.length - 5} more medium priority issues...</p>` : ''}
        ` : ''}
      </div>
    `;
  },

  generateRecommendationsSection(auditResults) {
    const recommendations = auditResults?.recommendations || [];
    
    if (recommendations.length === 0) return '';
    
    return `
      <div class="section">
        <h2>Key Recommendations</h2>
        
        <ul class="recommendation-list">
          ${recommendations.map(rec => `
            <li class="recommendation-item">
              <span class="recommendation-priority priority-${rec.priority.toLowerCase()}">${rec.priority}</span>
              <h4 style="margin-bottom: 8px;">${rec.category}: ${rec.recommendation}</h4>
              <p style="color: #666; font-size: 14px;">${rec.impact}</p>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  },

  generateWCAGSection(auditResults) {
    const compliance = auditResults?.wcagCompliance || {};
    
    return `
      <div class="section">
        <h2>WCAG 2.1 Compliance</h2>
        
        <div class="wcag-compliance">
          ${Object.entries(compliance).map(([standard, result]) => {
            if (typeof result === 'object' && 'passed' in result) {
              return `
                <div class="compliance-item">
                  <div class="compliance-status ${result.passed ? 'pass' : 'fail'}">
                    ${result.passed ? '✓' : '✗'}
                  </div>
                  <div class="compliance-details">
                    <div class="compliance-title">${standard}</div>
                    <div class="compliance-description">
                      ${result.passed ? 'Compliant' : `${result.issues} issues need to be resolved`}
                    </div>
                  </div>
                </div>
              `;
            } else if (typeof result === 'object') {
              return Object.entries(result).map(([criterion, passed]) => `
                <div class="compliance-item">
                  <div class="compliance-status ${passed ? 'pass' : 'fail'}">
                    ${passed ? '✓' : '✗'}
                  </div>
                  <div class="compliance-details">
                    <div class="compliance-title">${criterion}</div>
                    <div class="compliance-description">
                      ${passed ? 'Compliant' : 'Non-compliant'}
                    </div>
                  </div>
                </div>
              `).join('');
            }
            return '';
          }).join('')}
        </div>
      </div>
    `;
  },

  generateTestResultsSection(testResults) {
    if (!testResults || !testResults.passed) return '';
    
    const categories = {
      'Screen Reader': [],
      'Touch': [],
      'Crisis': [],
      'Cognitive': [],
      'Visual': [],
      'Motor': []
    };
    
    // Categorize test results
    [...(testResults.passed || []), ...(testResults.failed || [])].forEach(test => {
      const testName = test.test || '';
      if (testName.includes('Screen Reader') || testName.includes('Announcement')) {
        categories['Screen Reader'].push({ ...test, status: 'pass' });
      } else if (testName.includes('Touch') || testName.includes('Target')) {
        categories['Touch'].push({ ...test, status: testResults.failed.includes(test) ? 'fail' : 'pass' });
      } else if (testName.includes('Crisis') || testName.includes('Emergency')) {
        categories['Crisis'].push({ ...test, status: testResults.failed.includes(test) ? 'fail' : 'pass' });
      } else if (testName.includes('Cognitive') || testName.includes('Language')) {
        categories['Cognitive'].push({ ...test, status: testResults.failed.includes(test) ? 'fail' : 'pass' });
      } else if (testName.includes('Visual') || testName.includes('Color') || testName.includes('Focus')) {
        categories['Visual'].push({ ...test, status: testResults.failed.includes(test) ? 'fail' : 'pass' });
      } else if (testName.includes('Motor') || testName.includes('Switch')) {
        categories['Motor'].push({ ...test, status: testResults.failed.includes(test) ? 'fail' : 'pass' });
      }
    });
    
    return `
      <div class="section">
        <h2>Detailed Test Results</h2>
        
        <div class="test-results">
          ${Object.entries(categories).map(([category, tests]) => {
            if (tests.length === 0) return '';
            
            return `
              <div class="test-category">
                <h3>${category} Tests</h3>
                <ul class="test-list">
                  ${tests.map(test => `
                    <li class="test-item">
                      <span class="test-status ${test.status}">
                        ${test.status === 'pass' ? '✓' : '✗'}
                      </span>
                      <span>${test.test || 'Test'}: ${test.details || test.error || test.reason || 'No details'}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  generateMetricsSection(auditResults, testResults) {
    const deviceInfo = testResults?.deviceInfo || {};
    
    return `
      <div class="section">
        <h2>Testing Environment</h2>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Viewport</div>
            <div style="font-size: 18px; margin-top: 5px;">
              ${deviceInfo.viewport?.width || 'N/A'} × ${deviceInfo.viewport?.height || 'N/A'}
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label">Pixel Ratio</div>
            <div style="font-size: 18px; margin-top: 5px;">
              ${deviceInfo.pixelRatio || 'N/A'}x
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label">Touch Points</div>
            <div style="font-size: 18px; margin-top: 5px;">
              ${deviceInfo.touchPoints || 'N/A'}
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label">Test Date</div>
            <div style="font-size: 18px; margin-top: 5px;">
              ${new Date(testResults?.timestamp || Date.now()).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          User Agent: ${deviceInfo.userAgent || 'Not available'}
        </p>
      </div>
    `;
  },

  describeElement(element) {
    if (typeof element === 'string') return element;
    if (!element) return 'Unknown element';
    
    let description = element.tagName || 'Element';
    if (element.className) description += `.${element.className}`;
    if (element.id) description += `#${element.id}`;
    
    return description;
  },

  /**
   * Generate and save the report
   */
  async generateAndSaveReport() {
    console.log('📝 Generating Mobile Accessibility Report...');
    
    // Load audit results from localStorage
    const auditResultsStr = localStorage.getItem('mobile-accessibility-audit');
    const testResultsStr = localStorage.getItem('mobile-accessibility-test-results');
    
    if (!auditResultsStr && !testResultsStr) {
      console.error('No audit or test results found. Run audits first.');
      return null;
    }
    
    const auditResults = auditResultsStr ? JSON.parse(auditResultsStr) : {};
    const testResults = testResultsStr ? JSON.parse(testResultsStr) : {};
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(auditResults, testResults);
    
    // Save HTML report
    const htmlBlob = new Blob([htmlReport], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    
    // Generate JSON summary
    const jsonSummary = {
      generated: new Date().toISOString(),
      platform: 'Astral Core Mental Health Platform',
      overallScore: auditResults?.summary?.score || 0,
      criticalIssues: auditResults?.summary?.criticalErrors || 0,
      wcagCompliance: auditResults?.wcagCompliance || {},
      topRecommendations: (auditResults?.recommendations || []).slice(0, 3),
      testsPassed: testResults?.passed?.length || 0,
      testsFailed: testResults?.failed?.length || 0,
      deviceInfo: testResults?.deviceInfo || {}
    };
    
    const jsonBlob = new Blob([JSON.stringify(jsonSummary, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    
    // Create download links
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    console.log('✅ Report Generated Successfully!');
    console.log(`📄 HTML Report: ${htmlUrl}`);
    console.log(`   Filename: mobile-accessibility-report-${timestamp}.html`);
    console.log(`📊 JSON Summary: ${jsonUrl}`);
    console.log(`   Filename: mobile-accessibility-summary-${timestamp}.json`);
    
    // Auto-open HTML report in new tab
    window.open(htmlUrl, '_blank');
    
    // Return URLs for programmatic use
    return {
      htmlUrl,
      jsonUrl,
      timestamp,
      summary: jsonSummary
    };
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileAccessibilityReportGenerator;
}

// Add to global scope for browser use
if (typeof window !== 'undefined') {
  window.MobileAccessibilityReportGenerator = MobileAccessibilityReportGenerator;
}