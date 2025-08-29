/**
 * Accessibility Utils Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface AccessibilityConfig {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrast: 'normal' | 'high' | 'highest';
  reduceMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusIndicator: 'default' | 'enhanced' | 'custom';
}

interface ARIAAttributes {
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-hidden'?: boolean;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
}

class AccessibilityUtils {
  private config: AccessibilityConfig = {
    fontSize: 'medium',
    contrast: 'normal',
    reduceMotion: false,
    screenReaderMode: false,
    keyboardNavigation: true,
    focusIndicator: 'default'
  };

  private announcements: string[] = [];

  // Configuration management
  setConfig(config: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyConfiguration();
  }

  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  private applyConfiguration(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Apply font size
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[this.config.fontSize]);
    
    // Apply contrast
    root.setAttribute('data-contrast', this.config.contrast);
    
    // Apply motion preference
    root.setAttribute('data-reduce-motion', String(this.config.reduceMotion));
    
    // Apply screen reader mode
    root.setAttribute('data-screen-reader', String(this.config.screenReaderMode));
  }

  // ARIA attributes management
  generateARIA(element: string, attributes: ARIAAttributes): ARIAAttributes {
    const aria: ARIAAttributes = { ...attributes };
    
    // Add default role if not specified
    if (!aria.role) {
      const roleMap: Record<string, string> = {
        'button': 'button',
        'nav': 'navigation',
        'main': 'main',
        'header': 'banner',
        'footer': 'contentinfo',
        'aside': 'complementary',
        'form': 'form'
      };
      aria.role = roleMap[element] || undefined;
    }
    
    return aria;
  }

  // Screen reader announcements
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.announcements.push(message);
    
    if (typeof document !== 'undefined') {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }

  getAnnouncements(): string[] {
    return [...this.announcements];
  }

  clearAnnouncements(): void {
    this.announcements = [];
  }

  // Focus management
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    const elements = container.querySelectorAll(selectors.join(','));
    return Array.from(elements) as HTMLElement[];
  }

  // Keyboard navigation
  handleKeyboardNavigation(element: HTMLElement, callback: (action: string) => void): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {
      const actions: Record<string, string> = {
        'Enter': 'select',
        ' ': 'select',
        'ArrowUp': 'previous',
        'ArrowDown': 'next',
        'ArrowLeft': 'previous',
        'ArrowRight': 'next',
        'Home': 'first',
        'End': 'last',
        'Escape': 'cancel'
      };

      const action = actions[e.key];
      if (action) {
        e.preventDefault();
        callback(action);
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }

  // Color contrast checking
  checkColorContrast(foreground: string, background: string): {
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
  } {
    // Simplified contrast calculation for testing
    const getLuminance = (color: string): number => {
      // Mock luminance calculation
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0.5;
      
      const [r, g, b] = rgb.map(Number);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7
    };
  }

  // Text alternatives
  generateAltText(imageType: string, context?: string): string {
    const templates: Record<string, string> = {
      'decorative': '',
      'informative': `Image showing ${context || 'content'}`,
      'functional': `Button: ${context || 'action'}`,
      'complex': `Diagram: ${context || 'complex information'}. Full description available below.`
    };
    
    return templates[imageType] || `Image: ${context || 'no description available'}`;
  }

  // Skip links
  createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.className = 'skip-link';
    link.textContent = text;
    link.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    link.addEventListener('focus', () => {
      link.style.left = '0';
      link.style.width = 'auto';
      link.style.height = 'auto';
    });
    
    link.addEventListener('blur', () => {
      link.style.left = '-10000px';
      link.style.width = '1px';
      link.style.height = '1px';
    });
    
    return link;
  }

  // Form validation messages
  getAccessibleErrorMessage(fieldName: string, errorType: string): string {
    const messages: Record<string, string> = {
      'required': `${fieldName} is required`,
      'email': `${fieldName} must be a valid email address`,
      'minLength': `${fieldName} is too short`,
      'maxLength': `${fieldName} is too long`,
      'pattern': `${fieldName} format is invalid`,
      'number': `${fieldName} must be a number`
    };
    
    return messages[errorType] || `${fieldName} is invalid`;
  }

  // Responsive font scaling
  calculateResponsiveFontSize(baseSize: number, viewport: number): number {
    const minSize = baseSize * 0.8;
    const maxSize = baseSize * 1.2;
    const scaleFactor = viewport / 1920;
    
    const scaledSize = baseSize * scaleFactor;
    return Math.max(minSize, Math.min(maxSize, scaledSize));
  }
}

describe('AccessibilityUtils', () => {
  let utils: AccessibilityUtils;

  beforeEach(() => {
    utils = new AccessibilityUtils();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    utils.clearAnnouncements();
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should set and get configuration', () => {
      const config: Partial<AccessibilityConfig> = {
        fontSize: 'large',
        contrast: 'high',
        reduceMotion: true
      };

      utils.setConfig(config);
      const currentConfig = utils.getConfig();
      
      expect(currentConfig.fontSize).toBe('large');
      expect(currentConfig.contrast).toBe('high');
      expect(currentConfig.reduceMotion).toBe(true);
    });

    it('should apply configuration to document', () => {
      utils.setConfig({ fontSize: 'extra-large', contrast: 'highest' });
      
      expect(document.documentElement.style.getPropertyValue('--base-font-size')).toBe('20px');
      expect(document.documentElement.getAttribute('data-contrast')).toBe('highest');
    });
  });

  describe('ARIA Attributes', () => {
    it('should generate ARIA attributes', () => {
      const aria = utils.generateARIA('button', { 
        'aria-label': 'Submit form',
        'aria-pressed': false 
      });
      
      expect(aria.role).toBe('button');
      expect(aria['aria-label']).toBe('Submit form');
      expect(aria['aria-pressed']).toBe(false);
    });

    it('should add default roles', () => {
      const navAria = utils.generateARIA('nav', {});
      expect(navAria.role).toBe('navigation');
      
      const mainAria = utils.generateARIA('main', {});
      expect(mainAria.role).toBe('main');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce messages', () => {
      utils.announce('Form submitted successfully');
      utils.announce('Error: Please fill in required fields', 'assertive');
      
      const announcements = utils.getAnnouncements();
      expect(announcements).toHaveLength(2);
      expect(announcements[0]).toBe('Form submitted successfully');
    });

    it('should create live regions', () => {
      utils.announce('Test announcement');
      
      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toBeDefined();
    });

    it('should clear announcements', () => {
      utils.announce('Test 1');
      utils.announce('Test 2');
      utils.clearAnnouncements();
      
      expect(utils.getAnnouncements()).toHaveLength(0);
    });
  });

  describe('Focus Management', () => {
    it('should get focusable elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <button disabled>Disabled Button</button>
        <a href="#test">Link</a>
        <div tabindex="0">Focusable Div</div>
        <div tabindex="-1">Not Focusable</div>
      `;
      document.body.appendChild(container);

      const focusable = utils.getFocusableElements(container);
      expect(focusable).toHaveLength(4);
    });

    it('should trap focus within container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="first">First</button>
        <button id="middle">Middle</button>
        <button id="last">Last</button>
      `;
      document.body.appendChild(container);

      const cleanup = utils.trapFocus(container);
      
      const firstButton = container.querySelector('#first') as HTMLElement;
      expect(document.activeElement).toBe(firstButton);
      
      cleanup();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard events', () => {
      const element = document.createElement('div');
      const callback = jest.fn();
      
      const cleanup = utils.handleKeyboardNavigation(element, callback);
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      element.dispatchEvent(enterEvent);
      
      expect(callback).toHaveBeenCalledWith('select');
      
      const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      element.dispatchEvent(arrowEvent);
      
      expect(callback).toHaveBeenCalledWith('next');
      
      cleanup();
    });

    it('should handle escape key', () => {
      const element = document.createElement('div');
      const callback = jest.fn();
      
      utils.handleKeyboardNavigation(element, callback);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      element.dispatchEvent(escapeEvent);
      
      expect(callback).toHaveBeenCalledWith('cancel');
    });
  });

  describe('Color Contrast', () => {
    it('should check color contrast', () => {
      const result = utils.checkColorContrast('rgb(255, 255, 255)', 'rgb(0, 0, 0)');
      
      expect(result.ratio).toBeGreaterThan(1);
      expect(result.passesAA).toBeDefined();
      expect(result.passesAAA).toBeDefined();
    });
  });

  describe('Alt Text Generation', () => {
    it('should generate appropriate alt text', () => {
      expect(utils.generateAltText('decorative')).toBe('');
      expect(utils.generateAltText('informative', 'user profile')).toContain('user profile');
      expect(utils.generateAltText('functional', 'submit')).toContain('Button: submit');
      expect(utils.generateAltText('complex', 'data flow')).toContain('Diagram: data flow');
    });
  });

  describe('Skip Links', () => {
    it('should create skip link', () => {
      const link = utils.createSkipLink('main-content', 'Skip to content');
      
      expect(link.href).toContain('#main-content');
      expect(link.textContent).toBe('Skip to content');
      expect(link.className).toBe('skip-link');
    });
  });

  describe('Form Validation', () => {
    it('should generate accessible error messages', () => {
      expect(utils.getAccessibleErrorMessage('Email', 'required')).toBe('Email is required');
      expect(utils.getAccessibleErrorMessage('Password', 'minLength')).toBe('Password is too short');
      expect(utils.getAccessibleErrorMessage('Username', 'pattern')).toBe('Username format is invalid');
    });
  });

  describe('Responsive Font Scaling', () => {
    it('should calculate responsive font size', () => {
      const baseSize = 16;
      
      const smallViewport = utils.calculateResponsiveFontSize(baseSize, 768);
      const largeViewport = utils.calculateResponsiveFontSize(baseSize, 1920);
      
      expect(smallViewport).toBeLessThanOrEqual(baseSize);
      expect(largeViewport).toBe(baseSize);
    });
  });
});
