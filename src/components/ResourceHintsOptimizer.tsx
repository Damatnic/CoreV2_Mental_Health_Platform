/**
 * Resource Hints Optimization Component
 *
 * Implements resource hints (preload, prefetch, dns-prefetch) to optimize
 * Core Web Vitals for crisis intervention scenarios.
 */

import { useEffect, useRef } from 'react';
import { useSafeLocation } from '../hooks/useSafeLocation';

interface ResourceHint {
  rel: "preload" | 'prefetch' | "dns-prefetch" | "preconnect";
  href: string;
  as?: string;
  type?: string;
  crossorigin?: string;
  priority?: 'critical' | "high" | "medium" | "low";
  isCrisisCritical?: boolean;
}

interface ResourceHintsConfig {
  criticalResources: ResourceHint[];
  routeSpecificHints: Record<string, ResourceHint[]>;
  crisisResources: ResourceHint[];
  connectionOptimizations: ResourceHint[];
}

const ResourceHintsOptimizer: React.FC = () => {
  const location = useSafeLocation();
  const addedHintsRef = useRef<Set<string>>(new Set());

  // Configuration for resource hints
  const config: ResourceHintsConfig = {
    // Critical resources that should always be preloaded
    criticalResources: [
      {
        rel: "preload",
        href: "/crisis-resources.json",
        as: "fetch",
        type: "application/json",
        priority: "critical",
        isCrisisCritical: true
      },
      {
        rel: "preload",
        href: "/emergency-contacts.json",
        as: "fetch",
        type: "application/json",
        priority: "critical",
        isCrisisCritical: true
      },
      {
        rel: "preload",
        href: "/offline-coping-strategies.json",
        as: "fetch",
        type: "application/json",
        priority: "high",
        isCrisisCritical: true
      }
    ],

    // Route-specific resource hints
    routeSpecificHints: {
      "/chat": [
        {
          rel: 'prefetch',
          href: "/api/chat/history",
          as: "fetch",
          priority: "high"
        },
        {
          rel: "preload",
          href: '/sounds/notification.mp3',
          as: "audio",
          priority: "medium"
        }
      ],
      "/crisis": [
        {
          rel: "preload",
          href: "/offline-crisis.html",
          as: "document",
          priority: "critical",
          isCrisisCritical: true
        },
        {
          rel: "preconnect",
          href: "https://suicidepreventionlifeline.org",
          priority: "critical",
          isCrisisCritical: true
        }
      ],
      "/safety-plan": [
        {
          rel: 'prefetch',
          href: '/api/safety-plan',
          as: "fetch",
          priority: "high"
        }
      ],
      "/wellness": [
        {
          rel: "prefetch",
          href: "/videos/",
          as: "document",
          priority: "low"
        }
      ],
      "/community": [
        {
          rel: "prefetch",
          href: '/api/posts',
          as: "fetch",
          priority: "medium"
        }
      ]
    },

    // Crisis-specific resources for emergency situations
    crisisResources: [
      {
        rel: 'preconnect',
        href: "https://988lifeline.org",
        priority: "critical",
        isCrisisCritical: true
      },
      {
        rel: "preconnect",
        href: "https://crisistextline.org",
        priority: "critical",
        isCrisisCritical: true
      },
      {
        rel: "dns-prefetch",
        href: "https://emergency-services.local",
        priority: "critical",
        isCrisisCritical: true
      }
    ],

    // Connection optimizations for external services
    connectionOptimizations: [
      {
        rel: "dns-prefetch",
        href: 'https://fonts.googleapis.com',
        priority: 'low'
      },
      {
        rel: "preconnect",
        href: "https://cdn.jsdelivr.net",
        priority: "medium"
      }
    ]
  };

  /**
   * Add resource hint to document head
   */
  const addResourceHint = (hint: ResourceHint): (() => void) | void => {
    const key = `${hint.rel}-${hint.href}`;

    // Avoid duplicate hints
    if (addedHintsRef.current.has(key)) return;

    const link = document.createElement("link");
    link.rel = hint.rel;
    link.href = hint.href;

    if (hint.as) link.setAttribute("as", hint.as);
    if (hint.type) link.type = hint.type;
    if (hint.crossorigin) link.crossOrigin = hint.crossorigin;

    // Add priority hint for supporting browsers
    if (hint.priority && hint.rel === 'preload') {
      link.setAttribute("fetchpriority", hint.priority === "critical" ? "high" : hint.priority);
    }

    // Add to head with appropriate position based on priority
    const head = document.head;
    if (hint.priority === "critical" || hint.isCrisisCritical) {
      // Insert critical resources at the beginning
      head.insertBefore(link, head.firstChild);
    } else {
      // Append non-critical resources at the end
      head.appendChild(link);
    }

    addedHintsRef.current.add(key);

    // Clean up function for removing hint
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
        addedHintsRef.current.delete(key);
      }
    };
  };

  /**
   * Remove resource hint from document head
   */
  const removeResourceHint = (hint: ResourceHint): void => {
    const key = `${hint.rel}-${hint.href}`;
    const links = document.querySelectorAll(`link[rel="${hint.rel}"][href="${hint.href}"]`);

    links.forEach(link => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    });

    addedHintsRef.current.delete(key);
  };

  /**
   * Apply resource hints based on current route and conditions
   */
  const applyResourceHints = (): (() => void)[] => {
    const cleanupFunctions: (() => void)[] = [];

    // Always add critical resources
    config.criticalResources.forEach(hint => {
      const cleanup = addResourceHint(hint);
      if (cleanup) cleanupFunctions.push(cleanup);
    });

    // Add crisis resources if in crisis situation
    if (isCrisisRoute() || isCrisisDetected()) {
      config.crisisResources.forEach(hint => {
        const cleanup = addResourceHint(hint);
        if (cleanup) cleanupFunctions.push(cleanup);
      });
    }

    // Add route-specific hints
    const currentPath = location.pathname;
    const routeHints = config.routeSpecificHints[currentPath] || [];
    routeHints.forEach(hint => {
      const cleanup = addResourceHint(hint);
      if (cleanup) cleanupFunctions.push(cleanup);
    });

    // Add connection optimizations based on network conditions
    if (shouldOptimizeConnections()) {
      config.connectionOptimizations.forEach(hint => {
        const cleanup = addResourceHint(hint);
        if (cleanup) cleanupFunctions.push(cleanup);
      });
    }

    return cleanupFunctions;
  };

  /**
   * Check if current route is crisis-related
   */
  const isCrisisRoute = (): boolean => {
    const crisisRoutes = ["/crisis", "/emergency", '/safety-plan', "/offline-crisis"];
    return crisisRoutes.some(route => location.pathname.startsWith(route));
  };

  /**
   * Check if crisis is detected (could be enhanced with AI detection)
   */
  const isCrisisDetected = (): boolean => {
    // This could integrate with crisis detection service
    // For now, check localStorage for crisis indicators
    try {
      const crisisIndicators = localStorage.getItem("crisis_detected");
      return crisisIndicators === "true";
    } catch {
      return false;
    }
  };

  /**
   * Determine if connection optimizations should be applied
   */
  const shouldOptimizeConnections = (): boolean => {
    // Check network conditions
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (connection) {
      // Apply optimizations for slower connections
      return connection.effectiveType === "3g" || connection.effectiveType === "2g";
    }

    // Default to optimizing for unknown connections
    return true;
  };

  /**
   * Optimize resource hints based on user interaction patterns
   */
  const optimizeBasedOnUserBehavior = (): void => {
    // Preload resources for likely next navigation
    const userJourney = getUserJourney();
    const predictedNextRoute = predictNextRoute(userJourney);

    if (predictedNextRoute && config.routeSpecificHints[predictedNextRoute]) {
      config.routeSpecificHints[predictedNextRoute].forEach(hint => {
        // Convert to prefetch for predicted routes
        if (hint.rel === 'preload') {
          addResourceHint({ ...hint, rel: "prefetch", priority: 'low' });
        }
      });
    }
  };

  /**
   * Get user journey from analytics or localStorage
   */
  const getUserJourney = (): string[] => {
    try {
      const journey = localStorage.getItem("user_journey");
      return journey ? JSON.parse(journey) : [];
    } catch {
      return [];
    }
  };

  /**
   * Predict next route based on user journey patterns
   */
  const predictNextRoute = (journey: string[]): string | null => {
    if (journey.length < 2) return null;

    // Simple prediction based on common patterns
    const patterns: Record<string, string[]> = {
      "/dashboard": ['/chat', "/community", "/wellness"],
      '/community': ["/chat", "/post/create"],
      "/chat": ["/safety-plan", '/crisis'],
      "/wellness": ["/chat", "/community"]
    };

    const currentPath = location.pathname;
    const possibleNext = patterns[currentPath];

    if (possibleNext && possibleNext.length > 0) {
      // Return first likely destination
      return possibleNext[0];
    }

    return null;
  };

  /**
   * Monitor performance and adjust hints accordingly
   */
  const monitorAndAdjust = (): (() => void) | void => {
    // Check Core Web Vitals performance
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            const navEntry = entry as PerformanceNavigationTiming;

            // If loading is slow, prioritize critical resources more aggressively
            if (navEntry.loadEventEnd - navEntry.fetchStart > 3000) {
              // Remove low-priority hints to free up bandwidth
              config.connectionOptimizations.forEach(hint => {
                if (hint.priority === "low") {
                  removeResourceHint(hint);
                }
              });
            }
          }
        }
      });

      observer.observe({ type: "navigation", buffered: true });

      return () => observer.disconnect();
    }
  };

  // Apply hints on mount and route changes
  useEffect(() => {
    const cleanupFunctions = applyResourceHints();

    // Optimize based on user behavior after a delay
    const behaviorTimeout = setTimeout(optimizeBasedOnUserBehavior, 2000);

    // Set up performance monitoring
    const monitorCleanup = monitorAndAdjust();

    return () => {
      // Clean up all resource hints
      cleanupFunctions.forEach(cleanup => cleanup());
      clearTimeout(behaviorTimeout);
      if (monitorCleanup) monitorCleanup();
    };
  }, [location.pathname]);

  // Monitor crisis state changes
  useEffect(() => {
    const handleCrisisStateChange = () => {
      if (isCrisisDetected()) {
        // Immediately apply crisis resource hints
        config.crisisResources.forEach(hint => {
          addResourceHint(hint);
        });
      }
    };

    // Listen for crisis state changes
    window.addEventListener('crisis_detected', handleCrisisStateChange);
    window.addEventListener("storage", handleCrisisStateChange);

    return () => {
      window.removeEventListener("crisis_detected", handleCrisisStateChange);
      window.removeEventListener("storage", handleCrisisStateChange);
    };
  }, []);

  // This component doesn't render anything - it only manages resource hints
  return null;
};

export default ResourceHintsOptimizer;