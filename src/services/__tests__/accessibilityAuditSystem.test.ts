import { describe, it, expect, jest, beforeEach } from '@jest/globals';

class AccessibilityAuditSystem {
  private issues: any[] = [];
  
  audit(element: HTMLElement) {
    this.issues = [];
    this.checkImages(element);
    this.checkHeadings(element);
    this.checkForms(element);
    return this.issues;
  }

  private checkImages(element: HTMLElement) {
    const images = element.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        this.issues.push({ type: 'error', element: 'img', message: 'Missing alt text' });
      }
    });
  }

  private checkHeadings(element: HTMLElement) {
    const headings = element.querySelectorAll('h1,h2,h3,h4,h5,h6');
    let lastLevel = 0;
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      if (lastLevel && level > lastLevel + 1) {
        this.issues.push({ type: 'warning', element: h.tagName, message: 'Skipped heading level' });
      }
      lastLevel = level;
    });
  }

  private checkForms(element: HTMLElement) {
    const inputs = element.querySelectorAll('input,textarea,select');
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      if (id && !element.querySelector(`label[for="${id}"]`)) {
        this.issues.push({ type: 'error', element: 'form', message: 'Missing label' });
      }
    });
  }

  getIssueCount() {
    return this.issues.length;
  }

  getSeverityCount(severity: string) {
    return this.issues.filter(i => i.type === severity).length;
  }
}

describe('AccessibilityAuditSystem', () => {
  let system: AccessibilityAuditSystem;
  let container: HTMLElement;

  beforeEach(() => {
    system = new AccessibilityAuditSystem();
    container = document.createElement('div');
  });

  it('should detect missing alt text', () => {
    container.innerHTML = '<img src="test.jpg">';
    const issues = system.audit(container);
    expect(issues.some(i => i.message === 'Missing alt text')).toBe(true);
  });

  it('should detect skipped heading levels', () => {
    container.innerHTML = '<h1>Title</h1><h3>Subtitle</h3>';
    const issues = system.audit(container);
    expect(issues.some(i => i.message === 'Skipped heading level')).toBe(true);
  });

  it('should detect missing form labels', () => {
    container.innerHTML = '<input type="text" id="name">';
    const issues = system.audit(container);
    expect(issues.some(i => i.message === 'Missing label')).toBe(true);
  });

  it('should count issues by severity', () => {
    container.innerHTML = '<img src="test.jpg"><h1>Test</h1><h3>Test</h3>';
    system.audit(container);
    expect(system.getSeverityCount('error')).toBeGreaterThan(0);
  });
});
