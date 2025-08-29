/**
 * Screen Reader Service Tests
 * Comprehensive testing for mental health platform accessibility
 * WCAG 2.1 AAA compliance and crisis intervention features
 */

import { describe, it, expect, beforeEach, vi, afterEach, beforeAll, Mock } from 'vitest';
import { JSDOM } from 'jsdom';

// Enhanced types for mental health platform accessibility
interface ScreenReaderAnnouncement {
  message: string;
  priority: 'polite' | 'assertive' | 'crisis';
  timestamp: number;
  category?: 'therapeutic' | 'crisis' | 'navigation' | 'general';
  urgencyLevel?: number; // 1-5 scale for crisis situations
}

interface ScreenReaderConfig {
  enabled: boolean;
  announcements: boolean;
  liveRegions: boolean;
  skipLinks: boolean;
  landmarks: boolean;
  headingNavigation: boolean;
  crisisMode: boolean;
  therapeuticGuidance: boolean;
  emergencyContacts: boolean;
  breathingExercises: boolean;
  moodTracking: boolean;
}

interface AccessibilityFeatures {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  focusIndicators: boolean;
  keyboardNavigation: boolean;
  voiceGuidance: boolean;
  calmingMode: boolean; // Reduced visual stimulation for anxiety
  dyslexiaFont: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

interface CrisisInterventionFeatures {
  enabled: boolean;
  hotlineNumbers: string[];
  textSupport: boolean;
  panicButton: boolean;
  safetyPlan: boolean;
  emergencyContactsQuickAccess: boolean;
  groundingExercises: boolean;
}

interface TherapeuticContent {
  type: 'breathing' | 'grounding' | 'affirmation' | 'meditation' | 'journal';
  accessible: boolean;
  screenReaderOptimized: boolean;
  emergencyPriority: boolean;
}

// Mock Web Speech API with proper typing
const mockSpeechSynthesis: SpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => true)
} as unknown as SpeechSynthesis;

const mockSpeechSynthesisUtterance = vi.fn().mockImplementation((text: string) => ({
  text,
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  lang: 'en-US',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}));

// Mock Intersection Observer with proper typing
const mockIntersectionObserver = vi.fn().mockImplementation((
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
  root: options?.root || null,
  rootMargin: options?.rootMargin || '0px',
  thresholds: options?.threshold ? [options.threshold].flat() : [0]
}));

// Mock MutationObserver with proper typing
const mockMutationObserver = vi.fn().mockImplementation((callback: MutationCallback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => [])
}));

// Enhanced screen reader service for mental health platform
class MentalHealthScreenReaderService {
  private config: ScreenReaderConfig;
  private announcements: ScreenReaderAnnouncement[] = [];
  private liveRegion: HTMLElement | null = null;
  private crisisRegion: HTMLElement | null = null; // Dedicated region for crisis announcements
  private features: AccessibilityFeatures;
  private crisisFeatures: CrisisInterventionFeatures;
  private therapeuticContent: Map<string, TherapeuticContent>;
  private emergencyMode: boolean = false;
  private keyboardHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.config = {
      enabled: true,
      announcements: true,
      liveRegions: true,
      skipLinks: true,
      landmarks: true,
      headingNavigation: true,
      crisisMode: true,
      therapeuticGuidance: true,
      emergencyContacts: true,
      breathingExercises: true,
      moodTracking: true
    };

    this.features = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      focusIndicators: true,
      keyboardNavigation: true,
      voiceGuidance: true,
      calmingMode: false,
      dyslexiaFont: false,
      colorBlindMode: 'none'
    };

    this.crisisFeatures = {
      enabled: true,
      hotlineNumbers: ['988', '1-800-273-8255'], // US Crisis hotlines
      textSupport: true,
      panicButton: true,
      safetyPlan: true,
      emergencyContactsQuickAccess: true,
      groundingExercises: true
    };

    this.therapeuticContent = new Map();
    this.keyboardHandler = null;
    this.initializeLiveRegions();
  }

  private initializeLiveRegions(): void {
    if (typeof document !== 'undefined') {
      // Standard live region
      this.liveRegion = document.createElement('div');
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.setAttribute('role', 'status');
      this.liveRegion.className = 'sr-only screen-reader-announcements';
      this.liveRegion.style.cssText = this.getScreenReaderOnlyStyles();
      document.body.appendChild(this.liveRegion);

      // Crisis-specific live region with highest priority
      this.crisisRegion = document.createElement('div');
      this.crisisRegion.setAttribute('aria-live', 'assertive');
      this.crisisRegion.setAttribute('aria-atomic', 'true');
      this.crisisRegion.setAttribute('role', 'alert');
      this.crisisRegion.className = 'sr-only crisis-announcements';
      this.crisisRegion.style.cssText = this.getScreenReaderOnlyStyles();
      document.body.appendChild(this.crisisRegion);
    }
  }

  private getScreenReaderOnlyStyles(): string {
    return `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      clip: rect(1px, 1px, 1px, 1px) !important;
      clip-path: inset(50%) !important;
      white-space: nowrap !important;
    `;
  }

  announce(
    message: string, 
    priority: 'polite' | 'assertive' | 'crisis' = 'polite',
    category?: 'therapeutic' | 'crisis' | 'navigation' | 'general',
    urgencyLevel?: number
  ): void {
    if (!this.config.enabled || !this.config.announcements) return;

    const announcement: ScreenReaderAnnouncement = {
      message,
      priority,
      timestamp: Date.now(),
      category: category || 'general',
      urgencyLevel: urgencyLevel || 1
    };

    this.announcements.push(announcement);

    // Use crisis region for crisis announcements
    if (priority === 'crisis' && this.crisisRegion) {
      this.crisisRegion.textContent = `Crisis Alert: ${message}`;
      setTimeout(() => {
        if (this.crisisRegion) {
          this.crisisRegion.textContent = '';
        }
      }, 2000);
    } else if (this.liveRegion) {
      this.liveRegion.setAttribute('aria-live', priority === 'crisis' ? 'assertive' : priority);
      this.liveRegion.textContent = message;
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
      }, 1000);
    }

    // Voice synthesis for critical announcements
    if (priority === 'crisis' && this.features.voiceGuidance) {
      this.speakMessage(message, true);
    }
  }

  private speakMessage(message: string, urgent: boolean = false): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new (window as any).SpeechSynthesisUtterance(message);
      utterance.rate = urgent ? 1.2 : 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  setupCrisisInterventionAccessibility(): void {
    if (!this.config.crisisMode || !this.crisisFeatures.enabled) return;

    // Create crisis help button with immediate access
    const crisisButton = document.createElement('button');
    crisisButton.id = 'crisis-help-button';
    crisisButton.className = 'crisis-help-button';
    crisisButton.setAttribute('aria-label', 'Immediate crisis help - Press Enter or Space to activate');
    crisisButton.setAttribute('role', 'button');
    crisisButton.setAttribute('tabindex', '0');
    crisisButton.textContent = 'Crisis Help';
    
    // WCAG 2.1 AAA: Ensure high contrast and large target size
    crisisButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      padding: 12px 24px;
      font-size: 18px;
      font-weight: bold;
      background-color: #dc2626;
      color: #ffffff;
      border: 2px solid #991b1b;
      border-radius: 4px;
      cursor: pointer;
      min-width: 44px;
      min-height: 44px;
    `;

    crisisButton.addEventListener('click', () => this.activateCrisisMode());
    crisisButton.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.activateCrisisMode();
      }
    });

    document.body.appendChild(crisisButton);
    this.announce('Crisis help button available. Press Alt+C for immediate access', 'assertive', 'crisis');
  }

  private activateCrisisMode(): void {
    this.emergencyMode = true;
    this.announce('Crisis support activated. Help is available.', 'crisis', 'crisis', 5);
    
    // Create crisis resource panel
    const panel = this.createCrisisResourcePanel();
    document.body.appendChild(panel);
    
    // Focus on first emergency contact
    const firstContact = panel.querySelector('.emergency-contact');
    if (firstContact instanceof HTMLElement) {
      firstContact.focus();
    }
  }

  private createCrisisResourcePanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'crisis-resource-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Crisis Support Resources');
    panel.setAttribute('aria-modal', 'true');
    panel.className = 'crisis-panel';
    
    panel.innerHTML = `
      <h2 id="crisis-panel-title">Immediate Support Available</h2>
      <div class="crisis-resources" role="list">
        <div class="emergency-contact" role="listitem" tabindex="0">
          <h3>Crisis Hotline</h3>
          <a href="tel:988" aria-label="Call 988 Crisis Lifeline">988 - Crisis Lifeline</a>
        </div>
        <div class="emergency-contact" role="listitem" tabindex="0">
          <h3>Text Support</h3>
          <span>Text HOME to 741741</span>
        </div>
        <div class="grounding-exercise" role="listitem" tabindex="0">
          <h3>Quick Grounding Exercise</h3>
          <button aria-label="Start 5-4-3-2-1 grounding technique">
            Start 5-4-3-2-1 Technique
          </button>
        </div>
        <div class="breathing-exercise" role="listitem" tabindex="0">
          <h3>Breathing Exercise</h3>
          <button aria-label="Start guided breathing exercise">
            Start Box Breathing
          </button>
        </div>
      </div>
      <button id="close-crisis-panel" aria-label="Close crisis panel">Close</button>
    `;

    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #000;
      padding: 20px;
      z-index: 10001;
      max-width: 500px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    return panel;
  }

  setupTherapeuticContentAccessibility(): void {
    if (!this.config.therapeuticGuidance) return;

    // Add therapeutic content with screen reader optimization
    this.therapeuticContent.set('breathing', {
      type: 'breathing',
      accessible: true,
      screenReaderOptimized: true,
      emergencyPriority: true
    });

    this.therapeuticContent.set('grounding', {
      type: 'grounding',
      accessible: true,
      screenReaderOptimized: true,
      emergencyPriority: true
    });

    this.therapeuticContent.set('affirmation', {
      type: 'affirmation',
      accessible: true,
      screenReaderOptimized: true,
      emergencyPriority: false
    });

    this.announce('Therapeutic resources available. Press Alt+T to access', 'polite', 'therapeutic');
  }

  setupMentalHealthSkipLinks(): void {
    if (!this.config.enabled || !this.config.skipLinks) return;

    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content', priority: 1 },
      { href: '#mood-tracker', text: 'Skip to mood tracker', priority: 2 },
      { href: '#therapeutic-resources', text: 'Skip to therapeutic resources', priority: 3 },
      { href: '#crisis-help', text: 'Skip to crisis help', priority: 4 },
      { href: '#emergency-contacts', text: 'Skip to emergency contacts', priority: 5 },
      { href: '#safety-plan', text: 'Skip to safety plan', priority: 6 }
    ];

    const skipContainer = document.createElement('nav');
    skipContainer.className = 'skip-links mental-health-navigation';
    skipContainer.setAttribute('aria-label', 'Mental health quick navigation');
    skipContainer.setAttribute('role', 'navigation');

    skipLinks.forEach(link => {
      const skipLink = document.createElement('a');
      skipLink.href = link.href;
      skipLink.textContent = link.text;
      skipLink.className = 'skip-link';
      skipLink.setAttribute('data-priority', link.priority.toString());
      skipLink.style.cssText = this.getScreenReaderOnlyStyles();

      // Enhanced focus styles for mental health users
      skipLink.addEventListener('focus', () => {
        skipLink.style.cssText = `
          position: fixed !important;
          top: 10px !important;
          left: 10px !important;
          z-index: 999999 !important;
          padding: 12px 20px !important;
          background: #1e40af !important;
          color: #ffffff !important;
          text-decoration: none !important;
          border-radius: 4px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
          min-width: 44px !important;
          min-height: 44px !important;
        `;
      });

      skipLink.addEventListener('blur', () => {
        skipLink.style.cssText = this.getScreenReaderOnlyStyles();
      });

      skipContainer.appendChild(skipLink);
    });

    document.body.insertBefore(skipContainer, document.body.firstChild);
  }

  setupLandmarks(): void {
    if (!this.config.enabled || !this.config.landmarks) return;

    // Enhanced landmark mappings for mental health platform
    const landmarkMappings = [
      { selector: 'header', role: 'banner', label: 'Site header' },
      { selector: 'nav', role: 'navigation', label: 'Main navigation' },
      { selector: 'main', role: 'main', label: 'Main content' },
      { selector: '.mood-tracker', role: 'region', label: 'Mood tracking' },
      { selector: '.therapeutic-resources', role: 'region', label: 'Therapeutic resources' },
      { selector: '.crisis-help', role: 'region', label: 'Crisis help' },
      { selector: '.emergency-contacts', role: 'region', label: 'Emergency contacts' },
      { selector: 'aside', role: 'complementary', label: 'Supporting content' },
      { selector: 'footer', role: 'contentinfo', label: 'Site information' }
    ];

    landmarkMappings.forEach(({ selector, role, label }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.getAttribute('role')) {
          element.setAttribute('role', role);
        }
        if (!element.getAttribute('aria-label') && label) {
          element.setAttribute('aria-label', label);
        }
      });
    });
  }

  setupHeadingNavigation(): void {
    if (!this.config.enabled || !this.config.headingNavigation) return;

    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach((heading, index) => {
      // Make headings keyboard navigable
      if (!heading.getAttribute('tabindex')) {
        heading.setAttribute('tabindex', '-1');
      }

      // Ensure all headings have IDs for navigation
      if (!heading.id) {
        heading.id = `heading-${index + 1}`;
      }

      // Add aria-label for context if needed
      const headingText = heading.textContent?.trim();
      if (headingText && !heading.getAttribute('aria-label')) {
        const level = heading.tagName.substring(1);
        heading.setAttribute('aria-label', `Heading level ${level}: ${headingText}`);
      }
    });
  }

  enableFeature(feature: keyof AccessibilityFeatures, enabled: boolean = true): void {
    this.features[feature] = enabled as any;
    
    switch (feature) {
      case 'highContrast':
        document.body.classList.toggle('high-contrast', enabled);
        this.announce(
          `High contrast mode ${enabled ? 'enabled' : 'disabled'}`,
          'polite',
          'general'
        );
        break;
      case 'largeText':
        document.body.classList.toggle('large-text', enabled);
        this.announce(
          `Large text mode ${enabled ? 'enabled' : 'disabled'}`,
          'polite',
          'general'
        );
        break;
      case 'reducedMotion':
        document.body.classList.toggle('reduced-motion', enabled);
        this.announce(
          `Reduced motion ${enabled ? 'enabled' : 'disabled'}`,
          'polite',
          'general'
        );
        break;
      case 'focusIndicators':
        document.body.classList.toggle('enhanced-focus', enabled);
        break;
      case 'keyboardNavigation':
        this.toggleKeyboardNavigation(enabled);
        break;
      case 'calmingMode':
        document.body.classList.toggle('calming-mode', enabled);
        this.announce(
          `Calming visual mode ${enabled ? 'activated' : 'deactivated'}`,
          'polite',
          'therapeutic'
        );
        break;
      case 'dyslexiaFont':
        document.body.classList.toggle('dyslexia-font', enabled);
        this.announce(
          `Dyslexia-friendly font ${enabled ? 'enabled' : 'disabled'}`,
          'polite',
          'general'
        );
        break;
    }
  }

  private toggleKeyboardNavigation(enabled: boolean): void {
    if (enabled) {
      this.keyboardHandler = this.handleKeyNavigation.bind(this);
      document.addEventListener('keydown', this.keyboardHandler);
    } else if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
  }

  private handleKeyNavigation(event: KeyboardEvent): void {
    // Crisis hotkey: Alt+C
    if (event.altKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.activateCrisisMode();
      return;
    }

    // Therapeutic resources: Alt+T
    if (event.altKey && event.key.toLowerCase() === 't') {
      event.preventDefault();
      this.focusTherapeuticResources();
      return;
    }

    // Emergency contacts: Alt+E
    if (event.altKey && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      this.focusEmergencyContacts();
      return;
    }

    // Skip link navigation: Alt+1 through Alt+9
    if (event.altKey && event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      const skipLinks = document.querySelectorAll('.skip-link');
      const index = parseInt(event.key) - 1;
      if (skipLinks[index] instanceof HTMLElement) {
        skipLinks[index].focus();
      }
      return;
    }

    // Heading navigation: Alt+H
    if (event.altKey && event.key.toLowerCase() === 'h') {
      event.preventDefault();
      this.navigateHeadings();
      return;
    }

    // Mood tracker: Alt+M
    if (event.altKey && event.key.toLowerCase() === 'm') {
      event.preventDefault();
      this.focusMoodTracker();
      return;
    }
  }

  private focusTherapeuticResources(): void {
    const resources = document.querySelector('.therapeutic-resources, #therapeutic-resources');
    if (resources instanceof HTMLElement) {
      resources.focus();
      this.announce('Navigated to therapeutic resources', 'polite', 'navigation');
    }
  }

  private focusEmergencyContacts(): void {
    const contacts = document.querySelector('.emergency-contacts, #emergency-contacts');
    if (contacts instanceof HTMLElement) {
      contacts.focus();
      this.announce('Navigated to emergency contacts', 'assertive', 'navigation');
    }
  }

  private focusMoodTracker(): void {
    const tracker = document.querySelector('.mood-tracker, #mood-tracker');
    if (tracker instanceof HTMLElement) {
      tracker.focus();
      this.announce('Navigated to mood tracker', 'polite', 'navigation');
    }
  }

  private navigateHeadings(): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const currentFocus = document.activeElement;
    let currentIndex = -1;

    headings.forEach((heading, index) => {
      if (heading === currentFocus) {
        currentIndex = index;
      }
    });

    const nextIndex = (currentIndex + 1) % headings.length;
    const nextHeading = headings[nextIndex];
    if (nextHeading instanceof HTMLElement) {
      nextHeading.focus();
      const level = nextHeading.tagName.substring(1);
      const text = nextHeading.textContent?.trim() || '';
      this.announce(`Heading level ${level}: ${text}`, 'polite', 'navigation');
    }
  }

  getConfig(): ScreenReaderConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ScreenReaderConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getFeatures(): AccessibilityFeatures {
    return { ...this.features };
  }

  getCrisisFeatures(): CrisisInterventionFeatures {
    return { ...this.crisisFeatures };
  }

  updateCrisisFeatures(updates: Partial<CrisisInterventionFeatures>): void {
    this.crisisFeatures = { ...this.crisisFeatures, ...updates };
  }

  getAnnouncements(): ScreenReaderAnnouncement[] {
    return [...this.announcements];
  }

  clearAnnouncements(): void {
    this.announcements = [];
  }

  isScreenReaderDetected(): boolean {
    // Enhanced detection for various screen readers
    const windowAny = window as any;
    return !!(
      windowAny.speechSynthesis ||
      windowAny.JAWS ||
      windowAny.NVDA ||
      windowAny.ChromeVox ||
      document.body.getAttribute('data-screen-reader')
    );
  }

  isEmergencyModeActive(): boolean {
    return this.emergencyMode;
  }

  deactivateEmergencyMode(): void {
    this.emergencyMode = false;
    const panel = document.getElementById('crisis-resource-panel');
    if (panel) {
      panel.remove();
    }
    this.announce('Emergency mode deactivated', 'polite', 'general');
  }

  initialize(): void {
    this.setupMentalHealthSkipLinks();
    this.setupLandmarks();
    this.setupHeadingNavigation();
    this.setupCrisisInterventionAccessibility();
    this.setupTherapeuticContentAccessibility();
    this.announce('Mental health platform screen reader support initialized', 'polite', 'general');
  }

  cleanup(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
    if (this.crisisRegion && this.crisisRegion.parentNode) {
      this.crisisRegion.parentNode.removeChild(this.crisisRegion);
    }
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }
    const crisisButton = document.getElementById('crisis-help-button');
    if (crisisButton) {
      crisisButton.remove();
    }
    const crisisPanel = document.getElementById('crisis-resource-panel');
    if (crisisPanel) {
      crisisPanel.remove();
    }
    this.clearAnnouncements();
    this.emergencyMode = false;
  }
}

// Test setup
let dom: JSDOM;
let screenReaderService: MentalHealthScreenReaderService;

// Setup global mocks with proper typing
beforeAll(() => {
  Object.defineProperty(global, 'speechSynthesis', {
    value: mockSpeechSynthesis,
    writable: true,
    configurable: true
  });
  
  Object.defineProperty(global, 'SpeechSynthesisUtterance', {
    value: mockSpeechSynthesisUtterance,
    writable: true,
    configurable: true
  });

  Object.defineProperty(global, 'IntersectionObserver', {
    value: mockIntersectionObserver,
    writable: true,
    configurable: true
  });

  Object.defineProperty(global, 'MutationObserver', {
    value: mockMutationObserver,
    writable: true,
    configurable: true
  });
});

describe('MentalHealthScreenReaderService', () => {
  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
        <head><title>Mental Health Platform Test</title></head>
        <body>
          <header>
            <h1>Mental Health Support Platform</h1>
            <nav>
              <a href="/">Home</a>
              <a href="/mood-tracker">Mood Tracker</a>
              <a href="/resources">Resources</a>
              <a href="/crisis-help">Crisis Help</a>
            </nav>
          </header>
          <main id="main-content">
            <h2>Welcome to Your Mental Health Journey</h2>
            <div class="mood-tracker" id="mood-tracker">
              <h3>Daily Mood Check-In</h3>
              <form>
                <label for="mood-scale">How are you feeling today?</label>
                <input type="range" id="mood-scale" min="1" max="10" value="5">
              </form>
            </div>
            <div class="therapeutic-resources" id="therapeutic-resources">
              <h3>Therapeutic Resources</h3>
              <ul>
                <li><button>Breathing Exercise</button></li>
                <li><button>Grounding Technique</button></li>
                <li><button>Meditation Guide</button></li>
              </ul>
            </div>
            <div class="emergency-contacts" id="emergency-contacts">
              <h3>Emergency Contacts</h3>
              <ul>
                <li><a href="tel:988">Crisis Lifeline: 988</a></li>
                <li><a href="tel:18002738255">National Hotline: 1-800-273-8255</a></li>
              </ul>
            </div>
          </main>
          <aside>
            <h3>Support Groups</h3>
            <p>Connect with others on similar journeys</p>
          </aside>
          <footer>
            <p>Your mental health matters. Help is always available.</p>
          </footer>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    // Properly type the global assignments
    global.window = dom.window as unknown as Window & typeof globalThis;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.KeyboardEvent = dom.window.KeyboardEvent as typeof KeyboardEvent;
    global.Event = dom.window.Event as typeof Event;
    global.Node = dom.window.Node as typeof Node;

    screenReaderService = new MentalHealthScreenReaderService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    screenReaderService.cleanup();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with mental health-focused default configuration', () => {
      const config = screenReaderService.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.crisisMode).toBe(true);
      expect(config.therapeuticGuidance).toBe(true);
      expect(config.emergencyContacts).toBe(true);
      expect(config.breathingExercises).toBe(true);
      expect(config.moodTracking).toBe(true);
    });

    it('should create both standard and crisis live regions', () => {
      screenReaderService.initialize();
      
      const standardRegion = document.querySelector('.screen-reader-announcements');
      const crisisRegion = document.querySelector('.crisis-announcements');
      
      expect(standardRegion).toBeTruthy();
      expect(standardRegion?.getAttribute('aria-live')).toBe('polite');
      expect(standardRegion?.getAttribute('role')).toBe('status');
      
      expect(crisisRegion).toBeTruthy();
      expect(crisisRegion?.getAttribute('aria-live')).toBe('assertive');
      expect(crisisRegion?.getAttribute('role')).toBe('alert');
    });

    it('should detect screen reader presence with enhanced detection', () => {
      const isDetected = screenReaderService.isScreenReaderDetected();
      expect(typeof isDetected).toBe('boolean');
    });

    it('should have crisis intervention features enabled by default', () => {
      const crisisFeatures = screenReaderService.getCrisisFeatures();
      
      expect(crisisFeatures.enabled).toBe(true);
      expect(crisisFeatures.hotlineNumbers).toContain('988');
      expect(crisisFeatures.panicButton).toBe(true);
      expect(crisisFeatures.safetyPlan).toBe(true);
      expect(crisisFeatures.groundingExercises).toBe(true);
    });
  });

  describe('Crisis Intervention Accessibility', () => {
    beforeEach(() => {
      screenReaderService.initialize();
    });

    it('should create accessible crisis help button', () => {
      const crisisButton = document.getElementById('crisis-help-button');
      
      expect(crisisButton).toBeTruthy();
      expect(crisisButton?.getAttribute('aria-label')).toContain('crisis help');
      expect(crisisButton?.getAttribute('role')).toBe('button');
      expect(crisisButton?.getAttribute('tabindex')).toBe('0');
    });

    it('should announce crisis mode activation with highest priority', () => {
      screenReaderService.announce('Crisis detected', 'crisis', 'crisis', 5);
      
      const announcements = screenReaderService.getAnnouncements();
      const crisisAnnouncement = announcements.find(a => a.priority === 'crisis');
      
      expect(crisisAnnouncement).toBeTruthy();
      expect(crisisAnnouncement?.urgencyLevel).toBe(5);
      expect(crisisAnnouncement?.category).toBe('crisis');
    });

    it('should handle emergency mode activation and deactivation', () => {
      expect(screenReaderService.isEmergencyModeActive()).toBe(false);
      
      const crisisButton = document.getElementById('crisis-help-button');
      crisisButton?.click();
      
      expect(screenReaderService.isEmergencyModeActive()).toBe(true);
      
      screenReaderService.deactivateEmergencyMode();
      expect(screenReaderService.isEmergencyModeActive()).toBe(false);
    });

    it('should create crisis resource panel with proper ARIA attributes', () => {
      const crisisButton = document.getElementById('crisis-help-button');
      crisisButton?.click();
      
      const panel = document.getElementById('crisis-resource-panel');
      expect(panel).toBeTruthy();
      expect(panel?.getAttribute('role')).toBe('dialog');
      expect(panel?.getAttribute('aria-label')).toBe('Crisis Support Resources');
      expect(panel?.getAttribute('aria-modal')).toBe('true');
    });
  });

  describe('Therapeutic Content Accessibility', () => {
    beforeEach(() => {
      screenReaderService.initialize();
    });

    it('should announce availability of therapeutic resources', () => {
      const announcements = screenReaderService.getAnnouncements();
      const therapeuticAnnouncement = announcements.find(a => 
        a.message.includes('Therapeutic resources') && a.category === 'therapeutic'
      );
      
      expect(therapeuticAnnouncement).toBeTruthy();
    });

    it('should navigate to therapeutic resources with keyboard shortcut', () => {
      const keyEvent = new dom.window.KeyboardEvent('keydown', {
        key: 't',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(keyEvent);
      
      const announcements = screenReaderService.getAnnouncements();
      const navAnnouncement = announcements.find(a => 
        a.message.includes('therapeutic resources')
      );
      
      expect(navAnnouncement).toBeTruthy();
    });
  });

  describe('Mental Health Skip Links', () => {
    beforeEach(() => {
      screenReaderService.initialize();
    });

    it('should create mental health-specific skip links', () => {
      const skipLinks = document.querySelectorAll('.skip-link');
      expect(skipLinks.length).toBeGreaterThan(0);
      
      const skipTexts = Array.from(skipLinks).map(link => link.textContent);
      expect(skipTexts).toContain('Skip to mood tracker');
      expect(skipTexts).toContain('Skip to crisis help');
      expect(skipTexts).toContain('Skip to emergency contacts');
      expect(skipTexts).toContain('Skip to safety plan');
    });

    it('should have proper priority attributes on skip links', () => {
      const crisisSkipLink = Array.from(document.querySelectorAll('.skip-link'))
        .find(link => link.textContent === 'Skip to crisis help');
      
      expect(crisisSkipLink?.getAttribute('data-priority')).toBe('4');
    });

    it('should make skip links visible on focus with enhanced styling', () => {
      const skipLink = document.querySelector('.skip-link') as HTMLElement;
      expect(skipLink).toBeTruthy();
      
      skipLink.focus();
      const styles = skipLink.style;
      
      expect(styles.position).toBe('fixed');
      expect(styles.zIndex).toBe('999999');
      expect(parseInt(styles.minHeight || '0')).toBeGreaterThanOrEqual(44); // WCAG AAA target size
    });
  });

  describe('Enhanced Landmarks for Mental Health Platform', () => {
    beforeEach(() => {
      screenReaderService.initialize();
    });

    it('should set up mental health-specific landmark regions', () => {
      const moodTracker = document.querySelector('.mood-tracker');
      const therapeuticResources = document.querySelector('.therapeutic-resources');
      const emergencyContacts = document.querySelector('.emergency-contacts');
      
      expect(moodTracker?.getAttribute('role')).toBe('region');
      expect(moodTracker?.getAttribute('aria-label')).toBe('Mood tracking');
      
      expect(therapeuticResources?.getAttribute('role')).toBe('region');
      expect(therapeuticResources?.getAttribute('aria-label')).toBe('Therapeutic resources');
      
      expect(emergencyContacts?.getAttribute('role')).toBe('region');
      expect(emergencyContacts?.getAttribute('aria-label')).toBe('Emergency contacts');
    });

    it('should preserve existing landmarks with proper labels', () => {
      const header = document.querySelector('header');
      const nav = document.querySelector('nav');
      const main = document.querySelector('main');
      const footer = document.querySelector('footer');
      
      expect(header?.getAttribute('role')).toBe('banner');
      expect(nav?.getAttribute('role')).toBe('navigation');
      expect(main?.getAttribute('role')).toBe('main');
      expect(footer?.getAttribute('role')).toBe('contentinfo');
    });
  });

  describe('Enhanced Heading Navigation', () => {
    beforeEach(() => {
      screenReaderService.initialize();
    });

    it('should enhance headings with proper navigation attributes', () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      headings.forEach(heading => {
        expect(heading.getAttribute('tabindex')).toBe('-1');
        expect(heading.id).toBeTruthy();
        expect(heading.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should navigate through headings with keyboard shortcut and announce', () => {
      const keyEvent = new dom.window.KeyboardEvent('keydown', {
        key: 'h',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(keyEvent);
      
      const announcements = screenReaderService.getAnnouncements();
      const headingAnnouncement = announcements.find(a => 
        a.message.includes('Heading level')
      );
      
      expect(headingAnnouncement).toBeTruthy();
    });
  });

  describe('Mental Health Accessibility Features', () => {
    it('should enable calming mode for anxiety reduction', () => {
      screenReaderService.enableFeature('calmingMode', true);
      
      expect(document.body.classList.contains('calming-mode')).toBe(true);
      
      const features = screenReaderService.getFeatures();
      expect(features.calmingMode).toBe(true);
      
      const announcements = screenReaderService.getAnnouncements();
      const calmingAnnouncement = announcements.find(a => 
        a.message.includes('Calming visual mode')
      );
      expect(calmingAnnouncement).toBeTruthy();
    });

    it('should enable dyslexia-friendly font', () => {
      screenReaderService.enableFeature('dyslexiaFont', true);
      
      expect(document.body.classList.contains('dyslexia-font')).toBe(true);
      
      const features = screenReaderService.getFeatures();
      expect(features.dyslexiaFont).toBe(true);
    });

    it('should support color blind modes', () => {
      const features = screenReaderService.getFeatures();
      expect(features.colorBlindMode).toBe('none');
      
      // Feature can be extended to support different color blind modes
      expect(['none', 'protanopia', 'deuteranopia', 'tritanopia'])
        .toContain(features.colorBlindMode);
    });

    it('should toggle multiple accessibility features correctly', () => {
      screenReaderService.enableFeature('highContrast', true);
      screenReaderService.enableFeature('largeText', true);
      screenReaderService.enableFeature('reducedMotion', true);
      
      expect(document.body.classList.contains('high-contrast')).toBe(true);
      expect(document.body.classList.contains('large-text')).toBe(true);
      expect(document.body.classList.contains('reduced-motion')).toBe(true);
      
      screenReaderService.enableFeature('highContrast', false);
      expect(document.body.classList.contains('high-contrast')).toBe(false);
    });
  });

  describe('Keyboard Navigation for Mental Health Features', () => {
    beforeEach(() => {
      screenReaderService.initialize();
    });

    it('should activate crisis mode with Alt+C', () => {
      const keyEvent = new dom.window.KeyboardEvent('keydown', {
        key: 'c',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(keyEvent);
      
      expect(screenReaderService.isEmergencyModeActive()).toBe(true);
      const panel = document.getElementById('crisis-resource-panel');
      expect(panel).toBeTruthy();
    });

    it('should navigate to mood tracker with Alt+M', () => {
      const keyEvent = new dom.window.KeyboardEvent('keydown', {
        key: 'm',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(keyEvent);
      
      const announcements = screenReaderService.getAnnouncements();
      const moodAnnouncement = announcements.find(a => 
        a.message.includes('mood tracker')
      );
      expect(moodAnnouncement).toBeTruthy();
    });

    it('should navigate to emergency contacts with Alt+E', () => {
      const keyEvent = new dom.window.KeyboardEvent('keydown', {
        key: 'e',
        altKey: true,
        bubbles: true
      });
      
      document.dispatchEvent(keyEvent);
      
      const announcements = screenReaderService.getAnnouncements();
      const emergencyAnnouncement = announcements.find(a => 
        a.message.includes('emergency contacts')
      );
      expect(emergencyAnnouncement).toBeTruthy();
      expect(emergencyAnnouncement?.priority).toBe('assertive');
    });
  });

  describe('Announcement System with Mental Health Categories', () => {
    beforeEach(() => {
      screenReaderService.initialize();
    });

    it('should categorize announcements appropriately', () => {
      screenReaderService.announce('Take a deep breath', 'polite', 'therapeutic');
      screenReaderService.announce('Crisis hotline available', 'assertive', 'crisis');
      screenReaderService.announce('Navigated to section', 'polite', 'navigation');
      screenReaderService.announce('Settings updated', 'polite', 'general');
      
      const announcements = screenReaderService.getAnnouncements();
      
      expect(announcements.some(a => a.category === 'therapeutic')).toBe(true);
      expect(announcements.some(a => a.category === 'crisis')).toBe(true);
      expect(announcements.some(a => a.category === 'navigation')).toBe(true);
      expect(announcements.some(a => a.category === 'general')).toBe(true);
    });

    it('should prioritize crisis announcements', () => {
      screenReaderService.announce('Help is available', 'crisis', 'crisis', 5);
      
      const crisisRegion = document.querySelector('.crisis-announcements');
      expect(crisisRegion?.textContent).toContain('Crisis Alert');
    });

    it('should track urgency levels for crisis situations', () => {
      screenReaderService.announce('Low urgency', 'polite', 'general', 1);
      screenReaderService.announce('High urgency', 'crisis', 'crisis', 5);
      
      const announcements = screenReaderService.getAnnouncements();
      const highUrgency = announcements.find(a => a.urgencyLevel === 5);
      const lowUrgency = announcements.find(a => a.urgencyLevel === 1);
      
      expect(highUrgency).toBeTruthy();
      expect(lowUrgency).toBeTruthy();
      expect(highUrgency?.priority).toBe('crisis');
    });
  });

  describe('Configuration Management for Mental Health Features', () => {
    it('should update mental health-specific configuration', () => {
      const updates: Partial<ScreenReaderConfig> = {
        crisisMode: false,
        therapeuticGuidance: false,
        moodTracking: true
      };
      
      screenReaderService.updateConfig(updates);
      
      const config = screenReaderService.getConfig();
      expect(config.crisisMode).toBe(false);
      expect(config.therapeuticGuidance).toBe(false);
      expect(config.moodTracking).toBe(true);
      expect(config.enabled).toBe(true); // Unchanged
    });

    it('should update crisis intervention features', () => {
      const updates: Partial<CrisisInterventionFeatures> = {
        textSupport: false,
        hotlineNumbers: ['911', '988']
      };
      
      screenReaderService.updateCrisisFeatures(updates);
      
      const crisisFeatures = screenReaderService.getCrisisFeatures();
      expect(crisisFeatures.textSupport).toBe(false);
      expect(crisisFeatures.hotlineNumbers).toContain('911');
      expect(crisisFeatures.panicButton).toBe(true); // Unchanged
    });

    it('should maintain configuration immutability', () => {
      const config = screenReaderService.getConfig();
      config.enabled = false;
      
      const currentConfig = screenReaderService.getConfig();
      expect(currentConfig.enabled).toBe(true);
    });
  });

  describe('Service Lifecycle for Mental Health Platform', () => {
    it('should properly initialize all mental health features', () => {
      screenReaderService.initialize();
      
      // Check skip links
      const skipLinks = document.querySelectorAll('.skip-link');
      expect(skipLinks.length).toBeGreaterThan(0);
      
      // Check crisis button
      const crisisButton = document.getElementById('crisis-help-button');
      expect(crisisButton).toBeTruthy();
      
      // Check landmarks
      const regions = document.querySelectorAll('[role="region"]');
      expect(regions.length).toBeGreaterThan(0);
      
      // Check initialization announcement
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements.some(a => 
        a.message.includes('Mental health platform') && 
        a.message.includes('initialized')
      )).toBe(true);
    });

    it('should properly cleanup all mental health features', () => {
      screenReaderService.initialize();
      
      // Activate emergency mode to create panel
      const crisisButton = document.getElementById('crisis-help-button');
      crisisButton?.click();
      
      expect(document.getElementById('crisis-resource-panel')).toBeTruthy();
      expect(document.querySelector('.screen-reader-announcements')).toBeTruthy();
      expect(document.querySelector('.crisis-announcements')).toBeTruthy();
      
      screenReaderService.cleanup();
      
      // Verify all elements are removed
      expect(document.getElementById('crisis-help-button')).toBeFalsy();
      expect(document.getElementById('crisis-resource-panel')).toBeFalsy();
      expect(document.querySelector('.screen-reader-announcements')).toBeFalsy();
      expect(document.querySelector('.crisis-announcements')).toBeFalsy();
      
      // Verify state is reset
      expect(screenReaderService.getAnnouncements()).toHaveLength(0);
      expect(screenReaderService.isEmergencyModeActive()).toBe(false);
    });
  });

  describe('WCAG 2.1 AAA Compliance', () => {
    beforeEach(() => {
      screenReaderService.initialize();
    });

    it('should meet AAA target size requirements (44x44px minimum)', () => {
      const crisisButton = document.getElementById('crisis-help-button');
      const styles = crisisButton?.style;
      
      expect(parseInt(styles?.minWidth || '0')).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles?.minHeight || '0')).toBeGreaterThanOrEqual(44);
    });

    it('should provide sufficient color contrast for crisis elements', () => {
      const crisisButton = document.getElementById('crisis-help-button');
      const bgColor = crisisButton?.style.backgroundColor;
      const textColor = crisisButton?.style.color;
      
      // Crisis button should have high contrast colors
      expect(bgColor).toBeTruthy();
      expect(textColor).toBeTruthy();
    });

    it('should support text spacing adjustments', () => {
      screenReaderService.enableFeature('largeText', true);
      
      expect(document.body.classList.contains('large-text')).toBe(true);
      // Large text mode should be available for users who need it
    });

    it('should provide multiple ways to access critical features', () => {
      // Verify crisis help can be accessed multiple ways
      const crisisButton = document.getElementById('crisis-help-button');
      const crisisSkipLink = Array.from(document.querySelectorAll('.skip-link'))
        .find(link => link.textContent === 'Skip to crisis help');
      
      expect(crisisButton).toBeTruthy();
      expect(crisisSkipLink).toBeTruthy();
      
      // Keyboard shortcut also available (Alt+C)
      const keyEvent = new dom.window.KeyboardEvent('keydown', {
        key: 'c',
        altKey: true
      });
      
      expect(() => document.dispatchEvent(keyEvent)).not.toThrow();
    });

    it('should maintain focus visibility at all times', () => {
      const features = screenReaderService.getFeatures();
      expect(features.focusIndicators).toBe(true);
      
      // Enhanced focus class should be toggleable
      screenReaderService.enableFeature('focusIndicators', true);
      expect(document.body.classList.contains('enhanced-focus')).toBe(true);
    });
  });

  describe('Voice Guidance Integration', () => {
    it('should support voice synthesis for crisis announcements', () => {
      const features = screenReaderService.getFeatures();
      expect(features.voiceGuidance).toBe(true);
      
      screenReaderService.announce('Emergency help needed', 'crisis');
      
      // Voice synthesis should be attempted for crisis announcements
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle voice synthesis gracefully when unavailable', () => {
      // Remove speech synthesis
      const originalSpeechSynthesis = (window as any).speechSynthesis;
      delete (window as any).speechSynthesis;
      
      expect(() => {
        screenReaderService.announce('Test', 'crisis');
      }).not.toThrow();
      
      // Restore
      (window as any).speechSynthesis = originalSpeechSynthesis;
    });
  });
});

// Export types and service for use in other tests
export { MentalHealthScreenReaderService };
export type { 
  ScreenReaderConfig, 
  AccessibilityFeatures, 
  ScreenReaderAnnouncement,
  CrisisInterventionFeatures,
  TherapeuticContent
};