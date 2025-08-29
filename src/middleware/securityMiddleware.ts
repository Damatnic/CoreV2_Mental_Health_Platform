// Security utilities for crisis management platform

/**
 * Basic authentication interface
 */
export interface User {
  id: string;
  email: string;
  role: 'user' | 'helper' | 'admin';
  isAnonymous: boolean;
}

/**
 * Security context for requests
 */
export interface SecurityContext {
  userId?: string;
  userRole?: string;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  sessionToken?: string;
}

/**
 * Rate limiting store (simple in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Basic rate limiting utility
 */
export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000
): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

/**
 * Input sanitization utility
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate crisis data
 */
export const validateCrisisData = (data: {
  severity?: string;
  message?: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.severity) {
    errors.push('Severity is required');
  } else if (!['low', 'medium', 'high', 'critical'].includes(data.severity)) {
    errors.push('Invalid severity level');
  }
  
  if (!data.message) {
    errors.push('Message is required');
  } else if (data.message.length > 5000) {
    errors.push('Message too long (max 5000 characters)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Basic token validation
 */
export const validateToken = (token: string): boolean => {
  // Basic token validation - in real implementation would verify JWT
  return Boolean(token && token.length > 10);
};

/**
 * Security headers for responses
 */
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};

/**
 * Crisis security policies
 */
export const CrisisSecurityPolicies = {
  /**
   * Determine if emergency services should be automatically contacted
   */
  shouldAutoContactEmergency(
    severity: string,
    keywords: string[],
    userHistory?: Array<{ severity: string; timestamp: Date }>
  ): { shouldContact: boolean; reason: string } {
    // Immediate danger keywords
    const immediateDangerKeywords = [
      'suicide', 'kill myself', 'end it all', 'overdose',
      'jump', 'gun', 'rope', 'pills', 'bridge'
    ];
    
    const hasImmediateDanger = keywords.some(keyword =>
      immediateDangerKeywords.some(danger =>
        keyword.toLowerCase().includes(danger)
      )
    );
    
    if (severity === 'critical' && hasImmediateDanger) {
      return {
        shouldContact: true,
        reason: 'Critical severity with immediate danger keywords detected'
      };
    }
    
    // Check user history for escalating pattern
    if (userHistory && userHistory.length >= 3) {
      const recentCritical = userHistory
        .slice(0, 3)
        .filter(event => event.severity === 'critical');
      
      if (recentCritical.length >= 2) {
        return {
          shouldContact: true,
          reason: 'Pattern of escalating critical events detected'
        };
      }
    }
    
    return {
      shouldContact: false,
      reason: 'Conditions for auto-contact not met'
    };
  }
};

// Export all utilities
export default {
  checkRateLimit,
  sanitizeInput,
  validateCrisisData,
  validateToken,
  getSecurityHeaders,
  CrisisSecurityPolicies
};
