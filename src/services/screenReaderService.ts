/**
 * Screen Reader Service
 * 
 * Provides comprehensive screen reader support and accessibility features
 * for visually impaired users
 */

interface ScreenReaderConfig {
  enabled: boolean;
  verbosity: 'minimal' | 'standard' | 'verbose';
  announceNavigation: boolean;
  announceNotifications: boolean;
  announceFormChanges: boolean;
  announceModalChanges: boolean;
  readingSpeed: 'slow' | 'normal' | 'fast';
  skipToContentEnabled: boolean;
}

interface AnnouncementOptions {
  priority: 'polite' | 'assertive';
  interrupt: boolean;
  delay?: number;
}

interface LiveRegion {
  id: string;
  element: HTMLElement;
  priority: 'polite' | 'assertive';
}

class ScreenReaderService {
  private config: ScreenReaderConfig;
  private liveRegions: Map<string, LiveRegion> = new Map();
  private announcementQueue: Array<{ text: string; options: AnnouncementOptions }> = [];
  private isProcessingQueue = false;
  private observers: Map<string, MutationObserver> = new Map();

  constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  private getDefaultConfig(): ScreenReaderConfig {
    return {
      enabled: true,
      verbosity: 'standard',
      announceNavigation: true,
      announceNotifications: true,
      announceFormChanges: true,
      announceModalChanges: true,
      readingSpeed: 'normal',
      skipToContentEnabled: true
    };
  }

  private initialize(): void {
    this.createLiveRegions();
    this.setupNavigationAnnouncements();
    this.setupFormAnnouncements();
    this.setupModalAnnouncements();
    this.setupSkipToContent();
    this.detectScreenReader();
  }

  // Create live regions for announcements
  private createLiveRegions(): void {
    const regions = [
      { id: 'sr-polite', priority: 'polite' as const },
      { id: 'sr-assertive', priority: 'assertive' as const },
      { id: 'sr-status', priority: 'polite' as const }
    ];

    regions.forEach(({ id, priority }) => {
      let element = document.getElementById(id) as HTMLElement;
      
      if (!element) {
        element = document.createElement('div');
        element.id = id;
        element.setAttribute('aria-live', priority);
        element.setAttribute('aria-atomic', 'true');
        element.setAttribute('aria-relevant', 'additions text');
        element.setAttribute('role', 'status');
        element.style.cssText = `
          position: absolute;
          left: -10000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip-path: inset(50%);
        `;
        document.body.appendChild(element);
      }

      this.liveRegions.set(id, { id, element, priority });
    });
  }

  // Announce text to screen readers
  public announce(text: string, options: Partial<AnnouncementOptions> = {}): void {
    if (!this.config.enabled || !text.trim()) return;

    const fullOptions: AnnouncementOptions = {
      priority: 'polite',
      interrupt: false,
      delay: 0,
      ...options
    };

    if (fullOptions.interrupt) {
      this.announcementQueue.length = 0; // Clear queue
    }

    this.announcementQueue.push({ text: text.trim(), options: fullOptions });
    this.processAnnouncementQueue();
  }

  // Process announcement queue
  private async processAnnouncementQueue(): Promise<void> {
    if (this.isProcessingQueue || this.announcementQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.announcementQueue.length > 0) {
      const { text, options } = this.announcementQueue.shift()!;
      
      if (options.delay && options.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      const regionId = options.priority === 'assertive' ? 'sr-assertive' : 'sr-polite';
      const region = this.liveRegions.get(regionId);
      
      if (region) {
        // Clear and set new content
        region.element.textContent = '';
        setTimeout(() => {
          region.element.textContent = this.formatAnnouncementText(text);
        }, 50);
      }

      // Small delay between announcements
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.isProcessingQueue = false;
  }

  // Format text for screen reader consumption
  private formatAnnouncementText(text: string): string {
    // Remove excessive punctuation
    let formatted = text.replace(/[.,!?]+/g, '.');
    
    // Add pauses for readability
    formatted = formatted.replace(/\./g, '. ');
    
    // Handle abbreviations
    formatted = formatted.replace(/\bURL\b/g, 'U R L');
    formatted = formatted.replace(/\bAPI\b/g, 'A P I');
    formatted = formatted.replace(/\bUI\b/g, 'User Interface');
    
    // Add verbosity based on config
    if (this.config.verbosity === 'verbose') {
      formatted = `Announcement: ${formatted}`;
    }

    return formatted.trim();
  }

  // Navigation announcements
  private setupNavigationAnnouncements(): void {
    if (!this.config.announceNavigation) return;

    // Listen for route changes
    const announceNavigation = () => {
      const pageTitle = document.title;
      const mainHeading = document.querySelector('h1')?.textContent;
      
      if (pageTitle) {
        this.announce(`Navigated to ${pageTitle}${mainHeading ? `, ${mainHeading}` : ''}`, {
          priority: 'polite',
          delay: 500
        });
      }
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', announceNavigation);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(announceNavigation, 100);
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(announceNavigation, 100);
    };
  }

  // Form change announcements
  private setupFormAnnouncements(): void {
    if (!this.config.announceFormChanges) return;

    const announceFormChange = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        const label = this.getElementLabel(target);
        const value = (target as HTMLInputElement).value;
        const type = (target as HTMLInputElement).type;

        let announcement = '';
        
        if (type === 'checkbox' || type === 'radio') {
          const checked = (target as HTMLInputElement).checked;
          announcement = `${label} ${checked ? 'checked' : 'unchecked'}`;
        } else {
          announcement = `${label} changed${value ? ` to ${value}` : ''}`;
        }

        this.announce(announcement, { priority: 'polite' });
      }
    };

    // Use event delegation for dynamic forms
    document.addEventListener('change', announceFormChange);
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'range') {
        const label = this.getElementLabel(target);
        this.announce(`${label} ${target.value}`, { priority: 'polite' });
      }
    });
  }

  // Modal and dialog announcements
  private setupModalAnnouncements(): void {
    if (!this.config.announceModalChanges) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check for modals, dialogs, alerts
            if (element.matches('[role="dialog"], [role="alertdialog"], .modal, .dialog') ||
                element.querySelector('[role="dialog"], [role="alertdialog"], .modal, .dialog')) {
              
              const title = element.querySelector('h1, h2, h3, [data-title]')?.textContent ||
                           element.getAttribute('aria-label') ||
                           'Dialog opened';
              
              this.announce(`${title} dialog opened`, {
                priority: 'assertive',
                delay: 300
              });
            }
            
            // Check for alerts
            if (element.matches('[role="alert"], .alert') ||
                element.querySelector('[role="alert"], .alert')) {
              
              const alertText = element.textContent?.trim() || 'Alert';
              this.announce(`Alert: ${alertText}`, { priority: 'assertive' });
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.set('modal', observer);
  }

  // Skip to content functionality
  private setupSkipToContent(): void {
    if (!this.config.skipToContentEnabled) return;

    let skipLink = document.getElementById('skip-to-content') as HTMLAnchorElement;
    
    if (!skipLink) {
      skipLink = document.createElement('a');
      skipLink.id = 'skip-to-content';
      skipLink.href = '#main';
      skipLink.textContent = 'Skip to main content';
      skipLink.className = 'skip-to-content';
      skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 10000;
        transition: top 0.3s;
      `;
      
      skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
      });
      
      skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
      });
      
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
  }

  // Get label for form element
  private getElementLabel(element: HTMLElement): string {
    // Check for aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check for aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || 'Unlabeled';
    }

    // Check for associated label
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || 'Unlabeled';
    }

    // Check for parent label
    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.textContent?.replace(element.textContent || '', '').trim() || 'Unlabeled';

    // Check for placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;

    return 'Unlabeled field';
  }

  // Detect screen reader presence
  private detectScreenReader(): void {
    // Simple heuristic to detect screen readers
    const hasScreenReader = () => {
      return !!(
        navigator.userAgent.includes('NVDA') ||
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver') ||
        window.speechSynthesis ||
        'speechSynthesis' in window
      );
    };

    if (hasScreenReader()) {
      this.announce('Screen reader support enabled', { priority: 'polite', delay: 1000 });
    }
  }

  // Public methods
  public updateConfig(newConfig: Partial<ScreenReaderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled) {
        this.announce('Screen reader support enabled');
      }
    }
  }

  public announceNotification(title: string, message?: string): void {
    if (!this.config.announceNotifications) return;
    
    const announcement = message ? `${title}. ${message}` : title;
    this.announce(`Notification: ${announcement}`, { priority: 'assertive' });
  }

  public announceStatus(status: string): void {
    const statusRegion = this.liveRegions.get('sr-status');
    if (statusRegion) {
      statusRegion.element.textContent = this.formatAnnouncementText(status);
    }
  }

  public announceError(error: string): void {
    this.announce(`Error: ${error}`, { priority: 'assertive', interrupt: true });
  }

  public announceSuccess(message: string): void {
    this.announce(`Success: ${message}`, { priority: 'polite' });
  }

  public getConfig(): ScreenReaderConfig {
    return { ...this.config };
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  // Cleanup
  public destroy(): void {
    // Stop all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear announcement queue
    this.announcementQueue.length = 0;

    // Remove live regions
    this.liveRegions.forEach(region => {
      if (region.element.parentNode) {
        region.element.parentNode.removeChild(region.element);
      }
    });
    this.liveRegions.clear();
  }
}

// Create singleton instance
const screenReaderService = new ScreenReaderService();

export default screenReaderService;
export type { ScreenReaderConfig, AnnouncementOptions };
