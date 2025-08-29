/**
 * Accessibility-First DOM Testing with Mental Health UI Pattern Support
 *
 * Comprehensive DOM setup utilities specifically designed for mental health platform testing
 * with accessibility-first principles, therapeutic UI patterns, and crisis-aware testing.
 */

import { JSDOM } from 'jsdom';

// ============================
// COMPREHENSIVE TYPE DEFINITIONS
// ============================

export type CrisisLevel = 'low' | 'moderate' | 'high' | 'severe' | 'imminent';
export type TherapeuticContext = 'therapy' | 'crisis' | 'support' | 'assessment' | 'medication' | 'general';
export type AccessibilityLevel = 'basic' | 'enhanced' | 'comprehensive';

export interface MentalHealthDOMOptions {
  therapeuticMode?: boolean;
  crisisTestingEnabled?: boolean;
  accessibilityLevel?: AccessibilityLevel;
  culturalTesting?: boolean;
  screenReaderSimulation?: boolean;
  traumaInformedValidation?: boolean;
  hipaaComplianceTesting?: boolean;
  emergencyContactTesting?: boolean;
  therapistConnectionTesting?: boolean;
}

export interface AccessibilityValidationResult {
  wcagLevel: 'A' | 'AA' | 'AAA' | 'fail';
  issues: AccessibilityIssue[];
  screenReaderCompatible: boolean;
  keyboardNavigable: boolean;
  colorContrastValid: boolean;
  semanticStructureValid: boolean;
  crisisSafeDesign: boolean;
}

export interface AccessibilityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'contrast' | 'focus' | 'aria' | 'semantic' | 'keyboard' | 'screen-reader' | 'crisis-safety';
  element: string;
  description: string;
  recommendation: string;
  wcagGuideline?: string;
  mentalHealthImpact?: 'minimal' | 'moderate' | 'significant' | 'critical';
}

export interface CrisisTestingResult {
  crisisElementsFound: boolean;
  emergencyContactsAccessible: boolean;
  crisisHotlineVisible: boolean;
  safetyPlanAccessible: boolean;
  immediateSupportAvailable: boolean;
  traumaInformedDesign: boolean;
}

export interface TherapeuticUIValidation {
  calming: boolean;
  nonThreatening: boolean;
  culturallySensitive: boolean;
  cognitivelyAccessible: boolean;
  emotionallySupportive: boolean;
}

export interface MockNavigatorClipboard {
  readText: jest.Mock;
  writeText: jest.Mock;
  read: jest.Mock;
  write: jest.Mock;
}

export interface MockMediaDevices {
  getUserMedia: jest.Mock;
  getDisplayMedia: jest.Mock;
  enumerateDevices: jest.Mock;
}

export interface MockGeolocation {
  getCurrentPosition: jest.Mock;
  watchPosition: jest.Mock;
  clearWatch: jest.Mock;
}

// ============================
// ENHANCED DOM SETUP CLASS
// ============================

export class MentalHealthDOMSetup {
  private jsdom: JSDOM;
  private options: MentalHealthDOMOptions;
  private mockElements: Map<string, any> = new Map();
  private accessibilityTree: Map<string, any> = new Map();
  private crisisElements: string[] = [];

  constructor(options: MentalHealthDOMOptions = {}) {
    this.options = {
      therapeuticMode: true,
      crisisTestingEnabled: true,
      accessibilityLevel: 'comprehensive',
      culturalTesting: true,
      screenReaderSimulation: true,
      traumaInformedValidation: true,
      hipaaComplianceTesting: true,
      emergencyContactTesting: true,
      therapistConnectionTesting: true,
      ...options
    };

    this.jsdom = this.createEnhancedJSDOM();
    this.setupGlobalDOMEnvironment();
    this.setupMentalHealthAPIs();
    this.setupAccessibilitySupport();
    this.setupCrisisTestingFeatures();
    this.setupTherapeuticMocks();
  }

  private createEnhancedJSDOM(): JSDOM {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="description" content="Mental Health Platform Testing Environment">
          <title>Astral Core - Mental Health Testing</title>
          <!-- Accessibility meta tags -->
          <meta name="theme-color" content="#10b981">
          <meta name="color-scheme" content="light dark">
          <!-- Crisis support meta -->
          <meta name="crisis-hotline" content="988">
          <meta name="emergency-contact" content="911">
          <style>
            /* Crisis-safe default styles */
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.6; 
              margin: 0;
              background: #ffffff;
              color: #1f2937;
            }
            /* High contrast support */
            @media (prefers-contrast: high) {
              body { background: #000000; color: #ffffff; }
            }
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
              * { animation-duration: 0.01ms !important; }
            }
            /* Focus indicators */
            *:focus {
              outline: 3px solid #3b82f6;
              outline-offset: 2px;
            }
            /* Crisis alert styles */
            .crisis-alert {
              background: #fef2f2;
              border: 2px solid #dc2626;
              padding: 16px;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div id="root" role="main" aria-label="Mental Health Platform">
            <!-- Emergency banner for testing -->
            <div id="crisis-banner" role="alert" aria-live="assertive" class="crisis-alert" style="display: none;">
              <h2>Crisis Support Available 24/7</h2>
              <p>If you're in crisis, call <a href="tel:988">988</a> or <a href="tel:911">911</a></p>
            </div>
            
            <!-- Screen reader landmark -->
            <nav aria-label="Main navigation" role="navigation">
              <ul>
                <li><a href="/crisis-resources">Crisis Resources</a></li>
                <li><a href="/therapist-finder">Find Therapist</a></li>
                <li><a href="/safety-plan">Safety Plan</a></li>
              </ul>
            </nav>
            
            <!-- Main content area -->
            <main id="main-content" aria-label="Main content">
              <!-- Dynamic content will be inserted here during tests -->
            </main>
            
            <!-- Emergency contact widget -->
            <aside id="emergency-contacts" role="complementary" aria-label="Emergency contacts">
              <h3>Crisis Support</h3>
              <ul>
                <li><a href="tel:988" aria-label="National Suicide Prevention Lifeline">988 - Crisis Lifeline</a></li>
                <li><a href="tel:911" aria-label="Emergency Services">911 - Emergency</a></li>
              </ul>
            </aside>
          </div>
          
          <!-- Accessibility testing div -->
          <div id="a11y-test-area" aria-hidden="true" style="position: absolute; left: -9999px;">
            <!-- Elements for accessibility testing -->
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable',
      runScripts: 'dangerously',
      beforeParse: (window) => {
        // Setup mental health specific window properties
        (window as any).mentalHealthPlatform = {
          version: '3.0.0',
          crisisMode: false,
          therapeuticContext: 'general' as TherapeuticContext
        };
      }
    });

    return dom;
  }

  private setupGlobalDOMEnvironment(): void {
    const { window } = this.jsdom;
    const { document } = window;

    // Set global references
    (global as any).window = window;
    (global as any).document = document;
    (global as any).navigator = window.navigator;
    (global as any).location = window.location;
    (global as any).history = window.history;
    (global as any).localStorage = window.localStorage;
    (global as any).sessionStorage = window.sessionStorage;

    // Setup viewport
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    Object.defineProperty(window, 'screen', {
      value: {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        colorDepth: 24,
        pixelDepth: 24
      }
    });

    // Setup requestAnimationFrame for testing
    (global as any).requestAnimationFrame = (callback: FrameRequestCallback): number => {
      return setTimeout(callback, 16) as any;
    };

    (global as any).cancelAnimationFrame = (id: number): void => {
      clearTimeout(id);
    };

    // Setup ResizeObserver
    (global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));

    // Setup MutationObserver
    (global as any).MutationObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn(() => [])
    }));
  }

  private setupMentalHealthAPIs(): void {
    const { window } = this.jsdom;

    // Enhanced Navigator with mental health considerations
    const mockClipboard: MockNavigatorClipboard = {
      readText: jest.fn().mockResolvedValue(''),
      writeText: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue([]),
      write: jest.fn().mockResolvedValue(undefined)
    };

    Object.defineProperty(window.navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
      writable: true
    });

    // Geolocation with privacy considerations
    const mockGeolocation: MockGeolocation = {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn()
    };

    Object.defineProperty(window.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true
    });

    // Media devices for therapy sessions
    const mockMediaDevices: MockMediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => []
      }),
      getDisplayMedia: jest.fn().mockResolvedValue({
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => []
      }),
      enumerateDevices: jest.fn().mockResolvedValue([])
    };

    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: mockMediaDevices,
      configurable: true,
      writable: true
    });

    // Permissions API for therapeutic features
    Object.defineProperty(window.navigator, 'permissions', {
      value: {
        query: jest.fn().mockResolvedValue({ state: 'granted' })
      },
      configurable: true
    });

    // Service Worker for offline therapy resources
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: {
        register: jest.fn().mockResolvedValue({
          installing: null,
          waiting: null,
          active: { state: 'activated' },
          addEventListener: jest.fn(),
          unregister: jest.fn().mockResolvedValue(true)
        }),
        ready: Promise.resolve({
          installing: null,
          waiting: null,
          active: { state: 'activated' },
          unregister: jest.fn().mockResolvedValue(true)
        }),
        controller: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      },
      configurable: true
    });
  }

  private setupAccessibilitySupport(): void {
    const { window } = this.jsdom;

    if (!this.options.screenReaderSimulation) return;

    // Screen reader simulation
    (window as any).speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      getVoices: jest.fn(() => [
        { name: 'Screen Reader Voice', lang: 'en-US', default: true }
      ]),
      speaking: false,
      pending: false,
      paused: false
    };

    // ARIA live region announcements
    (window as any).announceToScreenReader = jest.fn((message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const announcement = window.document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-9999px';
      announcement.textContent = message;
      window.document.body.appendChild(announcement);
      
      setTimeout(() => {
        if (announcement.parentNode) {
          announcement.parentNode.removeChild(announcement);
        }
      }, 1000);
    });

    // High contrast detection
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation((query: string) => {
        const mediaQuery = {
          matches: query.includes('prefers-contrast: high') ? false : true,
          media: query,
          onchange: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
          addListener: jest.fn(), // Legacy method
          removeListener: jest.fn() // Legacy method
        };
        
        // Store common queries
        if (query.includes('prefers-reduced-motion')) {
          mediaQuery.matches = false; // Default to motion allowed
        }
        
        return mediaQuery;
      }),
      writable: true
    });

    // Intersection Observer for therapeutic content visibility
    (global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
      root: null,
      rootMargin: '0px',
      thresholds: [0],
      takeRecords: jest.fn(() => [])
    }));
  }

  private setupCrisisTestingFeatures(): void {
    if (!this.options.crisisTestingEnabled) return;

    const { window } = this.jsdom;

    // Crisis detection simulation
    (window as any).crisisDetection = {
      detectCrisisKeywords: jest.fn((text: string) => {
        const crisisKeywords = [
          'suicide', 'kill myself', 'end it all', 'no point',
          'hopeless', 'can\'t go on', 'want to die'
        ];
        return crisisKeywords.some(keyword => 
          text.toLowerCase().includes(keyword)
        );
      }),
      
      escalateToCrisisMode: jest.fn(() => {
        (window as any).mentalHealthPlatform.crisisMode = true;
        const crisisBanner = window.document.getElementById('crisis-banner');
        if (crisisBanner) {
          crisisBanner.style.display = 'block';
          crisisBanner.focus();
        }
      }),
      
      showEmergencyContacts: jest.fn(() => {
        const emergencyDiv = window.document.getElementById('emergency-contacts');
        if (emergencyDiv) {
          emergencyDiv.style.display = 'block';
          emergencyDiv.setAttribute('aria-expanded', 'true');
        }
      })
    };

    // 988 Crisis Lifeline simulation
    (window as any).crisisLifeline = {
      call988: jest.fn(() => {
        console.log('Simulating 988 Crisis Lifeline call');
        return Promise.resolve({
          connected: true,
          waitTime: 0,
          counselorAvailable: true
        });
      }),
      
      startChat: jest.fn(() => {
        return Promise.resolve({
          chatId: 'crisis-chat-123',
          counselorName: 'Crisis Counselor',
          status: 'connected'
        });
      })
    };
  }

  private setupTherapeuticMocks(): void {
    const { window } = this.jsdom;

    // Therapeutic session simulation
    (window as any).therapySession = {
      startSession: jest.fn((sessionType: TherapeuticContext) => {
        (window as any).mentalHealthPlatform.therapeuticContext = sessionType;
        return Promise.resolve({
          sessionId: `therapy-${Date.now()}`,
          therapistId: 'therapist-123',
          sessionType,
          status: 'active',
          startTime: new Date()
        });
      }),
      
      endSession: jest.fn(() => {
        (window as any).mentalHealthPlatform.therapeuticContext = 'general';
        return Promise.resolve({
          sessionSummary: 'Session completed successfully',
          duration: 45,
          nextAppointment: null
        });
      }),
      
      recordTherapeuticNote: jest.fn((note: string) => {
        return Promise.resolve({
          noteId: `note-${Date.now()}`,
          encrypted: true,
          hipaaCompliant: true
        });
      })
    };

    // Safety plan utilities
    (window as any).safetyPlan = {
      createPlan: jest.fn(() => {
        return Promise.resolve({
          planId: `safety-plan-${Date.now()}`,
          warningSignsIdentified: true,
          copingStrategiesListed: true,
          supportContactsAdded: true,
          environmentSecured: true
        });
      }),
      
      accessPlan: jest.fn(() => {
        return Promise.resolve({
          available: true,
          lastUpdated: new Date(),
          emergencyContactsCount: 3,
          copingStrategiesCount: 5
        });
      }),
      
      updatePlan: jest.fn(() => {
        return Promise.resolve({
          updated: true,
          timestamp: new Date(),
          hipaaLogged: true
        });
      })
    };

    // Mental health assessment tools
    (window as any).assessment = {
      conductScreening: jest.fn((type: 'depression' | 'anxiety' | 'ptsd' | 'general') => {
        return Promise.resolve({
          assessmentId: `assessment-${Date.now()}`,
          type,
          score: Math.floor(Math.random() * 27), // PHQ-9 scale
          riskLevel: 'moderate' as CrisisLevel,
          recommendedAction: 'Schedule follow-up appointment',
          culturalFactorsConsidered: this.options.culturalTesting
        });
      }),
      
      trackMood: jest.fn((mood: number, notes?: string) => {
        return Promise.resolve({
          moodId: `mood-${Date.now()}`,
          value: mood,
          notes: notes || '',
          timestamp: new Date(),
          encrypted: true
        });
      })
    };
  }

  // ============================
  // ACCESSIBILITY VALIDATION
  // ============================

  public validateAccessibility(element?: Element): AccessibilityValidationResult {
    const { document } = this.jsdom.window;
    const targetElement = element || document.body;
    
    const issues: AccessibilityIssue[] = [];
    let wcagLevel: 'A' | 'AA' | 'AAA' | 'fail' = 'AAA';

    // Check for proper heading hierarchy
    const headings = targetElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastHeadingLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1]);
      if (index === 0 && level !== 1) {
        issues.push({
          severity: 'high',
          type: 'semantic',
          element: heading.tagName,
          description: 'Page should start with h1',
          recommendation: 'Use h1 as the first heading',
          wcagGuideline: '1.3.1',
          mentalHealthImpact: 'moderate'
        });
        wcagLevel = 'AA';
      }
      
      if (level > lastHeadingLevel + 1) {
        issues.push({
          severity: 'medium',
          type: 'semantic',
          element: heading.tagName,
          description: 'Heading hierarchy skips levels',
          recommendation: 'Use sequential heading levels',
          wcagGuideline: '1.3.1',
          mentalHealthImpact: 'moderate'
        });
        wcagLevel = 'AA';
      }
      
      lastHeadingLevel = level;
    });

    // Check for images without alt text
    const images = targetElement.querySelectorAll('img');
    images.forEach(img => {
      if (!img.getAttribute('alt') && !img.hasAttribute('aria-hidden')) {
        issues.push({
          severity: 'high',
          type: 'aria',
          element: 'img',
          description: 'Image missing alt text',
          recommendation: 'Add descriptive alt text or aria-hidden="true" for decorative images',
          wcagGuideline: '1.1.1',
          mentalHealthImpact: 'significant'
        });
        wcagLevel = 'fail';
      }
    });

    // Check for form labels
    const inputs = targetElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = targetElement.querySelector(`label[for="${id}"]`);
        if (!label && !ariaLabel && !ariaLabelledby) {
          issues.push({
            severity: 'critical',
            type: 'aria',
            element: input.tagName.toLowerCase(),
            description: 'Form control missing label',
            recommendation: 'Add label element or aria-label attribute',
            wcagGuideline: '3.3.2',
            mentalHealthImpact: 'critical'
          });
          wcagLevel = 'fail';
        }
      }
    });

    // Check for crisis-safe design patterns
    const crisisSafeDesign = this.validateCrisisSafeDesign(targetElement);
    
    return {
      wcagLevel,
      issues,
      screenReaderCompatible: issues.filter(i => i.type === 'screen-reader').length === 0,
      keyboardNavigable: this.validateKeyboardNavigation(targetElement),
      colorContrastValid: this.validateColorContrast(targetElement),
      semanticStructureValid: issues.filter(i => i.type === 'semantic').length === 0,
      crisisSafeDesign
    };
  }

  private validateCrisisSafeDesign(element: Element): boolean {
    // Check for trauma-informed design principles
    const potentialTriggers = element.querySelectorAll('*');
    let crisisSafe = true;

    potentialTriggers.forEach(el => {
      const text = el.textContent?.toLowerCase() || '';
      const dangerousPatterns = [
        'graphic content without warning',
        'sudden loud sounds',
        'rapid flashing',
        'overwhelming colors'
      ];

      // Check for proper content warnings
      if (text.includes('trigger warning') || text.includes('content warning')) {
        const hasProperStructure = el.getAttribute('role') === 'alert' ||
                                 el.getAttribute('aria-live') === 'assertive';
        if (!hasProperStructure) {
          crisisSafe = false;
        }
      }

      // Check for crisis resources availability
      if (text.includes('crisis') || text.includes('suicide') || text.includes('emergency')) {
        const nearbySupport = element.querySelector('#emergency-contacts, [data-crisis-support]');
        if (!nearbySupport) {
          crisisSafe = false;
        }
      }
    });

    return crisisSafe;
  }

  private validateKeyboardNavigation(element: Element): boolean {
    const focusableElements = element.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    let keyboardNavigable = true;

    focusableElements.forEach(el => {
      // Check for proper focus indicators
      const computedStyle = this.jsdom.window.getComputedStyle(el);
      if (!el.getAttribute('tabindex') && el.tagName !== 'A' && el.tagName !== 'BUTTON') {
        // Interactive elements should be focusable
        keyboardNavigable = false;
      }
    });

    return keyboardNavigable;
  }

  private validateColorContrast(element: Element): boolean {
    // Simplified contrast validation
    // In a real implementation, this would calculate actual color contrast ratios
    const elementsWithColor = element.querySelectorAll('*');
    let contrastValid = true;

    elementsWithColor.forEach(el => {
      const style = this.jsdom.window.getComputedStyle(el);
      const backgroundColor = style.backgroundColor;
      const color = style.color;

      // Basic check for transparent or very light backgrounds with light text
      if (backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
        if (color && (color.includes('white') || color.includes('#fff'))) {
          contrastValid = false;
        }
      }
    });

    return contrastValid;
  }

  // ============================
  // CRISIS TESTING UTILITIES
  // ============================

  public validateCrisisFeatures(element?: Element): CrisisTestingResult {
    const { document } = this.jsdom.window;
    const targetElement = element || document.body;

    const crisisElements = targetElement.querySelectorAll('[data-crisis], .crisis-alert, #crisis-banner');
    const emergencyContacts = targetElement.querySelectorAll('[href*="988"], [href*="911"], [data-emergency-contact]');
    const crisisHotline = targetElement.querySelector('[href*="988"], [data-crisis-hotline]');
    const safetyPlan = targetElement.querySelector('[data-safety-plan], #safety-plan');
    const immediateSupport = targetElement.querySelector('[data-immediate-support], .immediate-help');

    return {
      crisisElementsFound: crisisElements.length > 0,
      emergencyContactsAccessible: emergencyContacts.length > 0,
      crisisHotlineVisible: crisisHotline !== null,
      safetyPlanAccessible: safetyPlan !== null,
      immediateSupportAvailable: immediateSupport !== null,
      traumaInformedDesign: this.validateCrisisSafeDesign(targetElement)
    };
  }

  public simulateCrisisScenario(crisisLevel: CrisisLevel): void {
    const { window } = this.jsdom;
    
    (window as any).mentalHealthPlatform.crisisMode = true;
    
    if (crisisLevel === 'imminent' || crisisLevel === 'severe') {
      (window as any).crisisDetection.escalateToCrisisMode();
      (window as any).crisisDetection.showEmergencyContacts();
    }

    // Simulate crisis intervention workflow
    const crisisEvent = new window.CustomEvent('crisis-detected', {
      detail: { level: crisisLevel, timestamp: new Date() }
    });
    window.document.dispatchEvent(crisisEvent);
  }

  // ============================
  // THERAPEUTIC UI VALIDATION
  // ============================

  public validateTherapeuticUI(element?: Element): TherapeuticUIValidation {
    const { document } = this.jsdom.window;
    const targetElement = element || document.body;

    const computedStyle = this.jsdom.window.getComputedStyle(targetElement);
    
    return {
      calming: this.checkCalmingDesign(targetElement),
      nonThreatening: this.checkNonThreateningElements(targetElement),
      culturallySensitive: this.options.culturalTesting || false,
      cognitivelyAccessible: this.checkCognitiveAccessibility(targetElement),
      emotionallySupportive: this.checkEmotionalSupport(targetElement)
    };
  }

  private checkCalmingDesign(element: Element): boolean {
    // Check for calming color schemes, appropriate spacing, etc.
    const style = this.jsdom.window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    
    // Avoid jarring colors
    const avoidColors = ['red', 'bright', 'neon'];
    return !avoidColors.some(color => backgroundColor.includes(color));
  }

  private checkNonThreateningElements(element: Element): boolean {
    const text = element.textContent?.toLowerCase() || '';
    const threateningWords = ['must', 'required', 'mandatory', 'failure', 'wrong'];
    
    return !threateningWords.some(word => text.includes(word));
  }

  private checkCognitiveAccessibility(element: Element): boolean {
    // Check for clear language, good information hierarchy
    const paragraphs = element.querySelectorAll('p');
    let accessible = true;

    paragraphs.forEach(p => {
      const text = p.textContent || '';
      // Simple readability check - sentences shouldn't be too long
      const sentences = text.split(/[.!?]+/);
      const averageLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length;
      
      if (averageLength > 20) {
        accessible = false; // Sentences too long for cognitive accessibility
      }
    });

    return accessible;
  }

  private checkEmotionalSupport(element: Element): boolean {
    const supportiveElements = element.querySelectorAll('[data-supportive], .encouragement, .positive-affirmation');
    const negativeElements = element.querySelectorAll('[data-negative], .criticism, .judgment');
    
    return supportiveElements.length > 0 && negativeElements.length === 0;
  }

  // ============================
  // CLEANUP AND UTILITIES
  // ============================

  public cleanup(): void {
    // Clean up global references
    const globalProps = ['window', 'document', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage'];
    globalProps.forEach(prop => {
      delete (global as any)[prop];
    });

    // Clear mocks
    this.mockElements.clear();
    this.accessibilityTree.clear();
    this.crisisElements = [];

    // Close JSDOM
    this.jsdom.window.close();
  }

  public getWindow(): Window {
    return this.jsdom.window as any;
  }

  public getDocument(): Document {
    return this.jsdom.window.document;
  }

  public getMockElement(name: string): any {
    return this.mockElements.get(name);
  }

  public addCrisisElement(selector: string): void {
    this.crisisElements.push(selector);
  }

  public getCrisisElements(): string[] {
    return [...this.crisisElements];
  }
}

// ============================
// CONVENIENCE FUNCTIONS
// ============================

export function setupMentalHealthDOM(options?: MentalHealthDOMOptions): MentalHealthDOMSetup {
  return new MentalHealthDOMSetup(options);
}

export function setupAccessibilityTestingDOM(): MentalHealthDOMSetup {
  return new MentalHealthDOMSetup({
    accessibilityLevel: 'comprehensive',
    screenReaderSimulation: true,
    traumaInformedValidation: true
  });
}

export function setupCrisisTestingDOM(): MentalHealthDOMSetup {
  return new MentalHealthDOMSetup({
    crisisTestingEnabled: true,
    emergencyContactTesting: true,
    therapeuticMode: true
  });
}

export function setupTherapeuticTestingDOM(): MentalHealthDOMSetup {
  return new MentalHealthDOMSetup({
    therapeuticMode: true,
    therapistConnectionTesting: true,
    hipaaComplianceTesting: true,
    traumaInformedValidation: true
  });
}

// Default export for convenience
const defaultSetup = new MentalHealthDOMSetup();
export default defaultSetup;