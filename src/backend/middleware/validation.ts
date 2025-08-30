import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

/**
 * Middleware to validate request data based on express-validator rules
 * Returns 400 with validation errors if validation fails
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

/**
 * Custom validation helper for mental health content
 * Checks for crisis indicators and sensitive content
 */
export const validateMentalHealthContent = (content: string): {
  isValid: boolean;
  warnings: string[];
  requiresReview: boolean;
} => {
  const warnings: string[] = [];
  let requiresReview = false;

  // Crisis keywords that require immediate attention
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'not worth living',
    'self-harm', 'cutting', 'overdose', 'jump off',
    'no reason to live', 'better off dead', 'final goodbye'
  ];

  // Check for crisis content
  const lowerContent = content.toLowerCase();
  for (const keyword of crisisKeywords) {
    if (lowerContent.includes(keyword)) {
      warnings.push(`Crisis keyword detected: "${keyword}"`);
      requiresReview = true;
    }
  }

  // Check for potentially harmful advice patterns
  const harmfulPatterns = [
    /stop taking (your |the )?medicat/i,
    /don't need (a |your )?therap/i,
    /ignore (your |the )?doctor/i,
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(content)) {
      warnings.push('Potentially harmful advice detected');
      requiresReview = true;
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    requiresReview,
  };
};

/**
 * Validates HIPAA-compliant data handling
 */
export const validateHIPAACompliance = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check for required encryption headers
  const isSecure = req.secure || req.header('x-forwarded-proto') === 'https';
  
  if (!isSecure && process.env.NODE_ENV === 'production') {
    res.status(403).json({
      error: 'HIPAA Compliance Error',
      message: 'Secure connection required for protected health information',
    });
    return;
  }

  // Ensure audit logging is enabled
  if (!req.header('x-audit-user-id') && process.env.HIPAA_AUDIT_ENABLED === 'true') {
    res.status(403).json({
      error: 'HIPAA Compliance Error',
      message: 'User identification required for audit logging',
    });
    return;
  }

  next();
};

/**
 * Validates crisis intervention requests
 */
export const validateCrisisRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { urgency, contactMethod, location } = req.body;

  // Validate urgency level
  if (urgency && !['low', 'medium', 'high', 'critical'].includes(urgency)) {
    res.status(400).json({
      error: 'Invalid urgency level',
      validOptions: ['low', 'medium', 'high', 'critical'],
    });
    return;
  }

  // Validate contact method
  if (contactMethod && !['call', 'text', 'chat', 'emergency'].includes(contactMethod)) {
    res.status(400).json({
      error: 'Invalid contact method',
      validOptions: ['call', 'text', 'chat', 'emergency'],
    });
    return;
  }

  // For critical urgency, location should be provided
  if (urgency === 'critical' && !location) {
    res.status(400).json({
      error: 'Location required for critical urgency requests',
      message: 'Please provide location information for emergency response',
    });
    return;
  }

  next();
};

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove script tags and dangerous HTML
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
};

/**
 * Middleware to sanitize all request inputs
 */
export const sanitizeRequestInputs = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
};

export default {
  validateRequest,
  validateMentalHealthContent,
  validateHIPAACompliance,
  validateCrisisRequest,
  sanitizeInput,
  sanitizeRequestInputs,
};